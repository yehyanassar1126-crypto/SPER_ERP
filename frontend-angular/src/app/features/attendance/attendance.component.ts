import { Component, inject, signal, computed, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from './services/attendance.service';
import { AttendanceRecord, LeaveRequest, LeaveType, LocationVerificationResult } from './models/attendance.models';

type TabType = 'records' | 'delays_absence' | 'leaves' | 'qr_station' | 'iot_docs';
type ScanActionType = 'checkin' | 'checkout';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit, OnDestroy, AfterViewInit {
  readonly service = inject(AttendanceService);

  // Active navigation tab
  readonly activeTab = signal<TabType>('records');

  // Search & Filters
  readonly searchQuery = signal<string>('');
  readonly selectedDepartment = signal<string>('All');
  readonly selectedStatus = signal<string>('All');
  readonly leaveStatusFilter = signal<string>('All');

  // Feedback Toast
  readonly toast = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  readonly showLeaveModal = signal<boolean>(false);
  readonly showCheckinModal = signal<boolean>(false);
  readonly rejectingLeaveId = signal<string | null>(null);
  readonly rejectReasonInput = signal<string>('');

  // Form Models
  leaveForm = {
    employee_name: '',
    department: 'Production',
    type: 'Annual' as LeaveType,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date().toISOString().slice(0, 10),
    days: 1,
    reason: '',
    emergency_flag: false
  };

  checkinForm = {
    employee_name: '',
    department: 'Production',
    station: 'Factory Gate A'
  };

  // Live QR Station State
  readonly qrCountdown = signal<number>(5);
  readonly qrCurrentTime = signal<string>('');
  readonly qrCurrentDate = signal<string>('');
  readonly currentQrPayload = signal<string>('');
  readonly qrMatrix = signal<boolean[][]>([]);

  // Mobile QR Scanner & Geo-Location Verification State
  readonly scannerEmployeeName = signal<string>('بدر صلاح');
  readonly scanAction = signal<ScanActionType>('checkin');
  readonly isCameraActive = signal<boolean>(false);
  readonly cameraError = signal<string | null>(null);
  readonly locationStatus = signal<LocationVerificationResult | null>(null);
  readonly scannerResult = signal<{ success: boolean; message: string } | null>(null);
  readonly isVerifyingLocation = signal<boolean>(false);
  readonly geoSimulationMode = signal<'real_gps' | 'simulate_in_factory' | 'simulate_outside'>('simulate_in_factory');

  private timerInterval: any;
  private qrInterval: any;
  private html5Scanner: any = null;

  // Real-time status for the employee selected in scanner
  readonly selectedEmployeeStatus = computed(() => {
    const name = this.scannerEmployeeName();
    const list = this.service.attendanceList();
    const active = list.find(r => r.employee_name === name && r.check_in && !r.check_out);
    if (active) {
      return {
        status: 'checked_in',
        checkInTime: active.check_in,
        label: `مسجل حضور الساعة ${this.formatTime(active.check_in)} — جاهز لتسجيل الانصراف (Check-Out)`
      };
    }
    const completed = list.find(r => r.employee_name === name && r.check_in && r.check_out);
    if (completed) {
      return {
        status: 'present',
        checkInTime: completed.check_in,
        checkOutTime: completed.check_out,
        label: `أكمل اليوم (انصراف: ${this.formatTime(completed.check_out)})`
      };
    }
    return {
      status: 'not_checked_in',
      label: 'لم يسجل حضور اليوم بعد — جاهز لتسجيل الحضور (Check-In)'
    };
  });

  setEmployeeAndAutoAction(empName: string): void {
    this.scannerEmployeeName.set(empName);
    const list = this.service.attendanceList();
    const active = list.find(r => r.employee_name === empName && r.check_in && !r.check_out);
    if (active) {
      this.scanAction.set('checkout');
    } else {
      this.scanAction.set('checkin');
    }
  }

  // Filtered attendance records
  readonly filteredRecords = computed(() => {
    const list = this.service.attendanceList();
    const q = this.searchQuery().toLowerCase().trim();
    const dept = this.selectedDepartment();
    const status = this.selectedStatus();

    return list.filter(r => {
      const matchQuery = !q || r.employee_name.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
      const matchDept = dept === 'All' || r.department === dept;
      const matchStatus = status === 'All' || r.status === status;
      return matchQuery && matchDept && matchStatus;
    });
  });

  // Filtered leave requests
  readonly filteredLeaves = computed(() => {
    const leaves = this.service.leaveRequests();
    const st = this.leaveStatusFilter();
    if (st === 'All') return leaves;
    return leaves.filter(l => l.status === st);
  });

  // Unique departments for filter
  readonly departments = computed(() => {
    const list = this.service.attendanceList();
    const depts = new Set(list.map(r => r.department));
    return ['All', ...Array.from(depts)];
  });

  ngOnInit(): void {
    this.updateClock();
    this.timerInterval = setInterval(() => this.updateClock(), 1000);
    this.refreshQrCode();
    this.qrInterval = setInterval(() => {
      const c = this.qrCountdown();
      if (c <= 1) {
        this.refreshQrCode();
        this.qrCountdown.set(5);
      } else {
        this.qrCountdown.set(c - 1);
      }
    }, 1000);
  }

  ngAfterViewInit(): void {
    this.loadHtml5QrcodeScript();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.qrInterval) clearInterval(this.qrInterval);
    this.stopCameraScanner();
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    if (tab !== 'qr_station') {
      this.stopCameraScanner();
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.toast.set({ message, type });
    setTimeout(() => {
      this.toast.set(null);
    }, 5000);
  }

  // --- Clock & QR Station Generator ---
  private updateClock(): void {
    const now = new Date();
    this.qrCurrentTime.set(now.toLocaleTimeString('en-GB', { hour12: false }));
    this.qrCurrentDate.set(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }));
  }

  refreshQrCode(): void {
    const payload = this.service.generateQrPayload();
    const raw = JSON.stringify(payload);
    this.currentQrPayload.set(raw);
    this.qrMatrix.set(this.generatePseudoQrMatrix(raw));
  }

  private generatePseudoQrMatrix(seed: string): boolean[][] {
    const size = 21;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    const drawFinder = (startX: number, startY: number) => {
      for (let x = 0; x < 7; x++) {
        for (let y = 0; y < 7; y++) {
          if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
            matrix[startY + y][startX + x] = true;
          }
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);

    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if ((x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7)) continue;
        const bit = Math.sin(hash + x * 13 + y * 29) > 0;
        matrix[y][x] = bit;
      }
    }

    return matrix;
  }

  // --- Camera QR Scanner Integration ---
  private async loadHtml5QrcodeScript(): Promise<void> {
    if (typeof window === 'undefined' || (window as any).Html5Qrcode) return;
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => resolve();
      document.head.appendChild(script);
    });
  }

  async startCameraScanner(): Promise<void> {
    await this.loadHtml5QrcodeScript();
    this.cameraError.set(null);

    const Html5QrcodeClass = (window as any).Html5Qrcode;
    if (!Html5QrcodeClass) {
      this.cameraError.set('Scanner library not loaded or offline. Use the instant scan simulation below.');
      return;
    }

    try {
      this.isCameraActive.set(true);
      this.html5Scanner = new Html5QrcodeClass('camera-reader-box');
      await this.html5Scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => this.processDecodedQr(decodedText),
        () => {}
      );
    } catch (err: any) {
      this.isCameraActive.set(false);
      this.cameraError.set('Camera access denied or no camera device found. You can test using the instant scan simulation buttons.');
    }
  }

  stopCameraScanner(): void {
    if (this.html5Scanner) {
      this.html5Scanner.stop().catch(() => {}).finally(() => {
        this.html5Scanner = null;
        this.isCameraActive.set(false);
      });
    }
  }

  // --- QR & Location Check Workflow ---
  async processDecodedQr(qrText: string): Promise<void> {
    // 1. Validate QR payload & expiration
    const qrVal = this.service.validateQrPayload(qrText);
    if (!qrVal.valid || !qrVal.token) {
      this.scannerResult.set({ success: false, message: qrVal.error || 'Invalid QR code' });
      this.showToast(qrVal.error || 'Invalid QR code', 'error');
      return;
    }

    // Stop camera after successful read
    this.stopCameraScanner();

    // 2. Perform Geofencing / Location Verification
    await this.executeAttendanceWithLocationCheck(qrVal.token);
  }

  // Execute Check-in / Check-out with Location Verification
  async executeAttendanceWithLocationCheck(qrToken?: any): Promise<void> {
    this.isVerifyingLocation.set(true);
    this.scannerResult.set(null);

    const mode = this.geoSimulationMode();
    const token = qrToken || this.service.generateQrPayload();

    let locResult: LocationVerificationResult;
    if (mode === 'simulate_outside') {
      const conf = this.service.geoConfig();
      locResult = {
        verified: false,
        lat: conf.companyLat + 0.05,
        lng: conf.companyLng + 0.05,
        distanceMeters: 5540,
        locationString: `${(conf.companyLat + 0.05).toFixed(6)}, ${(conf.companyLng + 0.05).toFixed(6)} (Outside Factory)`,
        message: '❌ أنت خارج نطاق الشركة! (المسافة: 5540 متر، المسموح: 500 متر).'
      };
    } else if (mode === 'simulate_in_factory') {
      locResult = await this.service.verifyLocation(true);
    } else {
      locResult = await this.service.verifyLocation(false);
    }

    this.isVerifyingLocation.set(false);
    this.locationStatus.set(locResult);

    // If Location check fails
    if (!locResult.verified) {
      this.scannerResult.set({
        success: false,
        message: locResult.message + ' تم رفض تسجيل الحضور والانصراف بسبب عدم التطابق مع موقع المصنع.'
      });
      this.showToast(locResult.message, 'error');
      return;
    }

    // Location check passed! Record punch in database
    const emp = this.scannerEmployeeName();
    let res: { success: boolean; message: string };

    if (this.scanAction() === 'checkin') {
      res = await this.service.checkInEmployee(emp, 'Operations', locResult.locationString, token);
    } else {
      res = await this.service.checkOutEmployee(emp, locResult.locationString, token);
    }

    this.scannerResult.set(res);
    this.showToast(res.message, res.success ? 'success' : 'error');
  }

  // --- Manual Actions ---
  openCheckinModal(): void {
    this.checkinForm = {
      employee_name: '',
      department: 'Production',
      station: 'Manual HR Override'
    };
    this.showCheckinModal.set(true);
  }

  async submitManualCheckin(): Promise<void> {
    if (!this.checkinForm.employee_name.trim()) {
      this.showToast('Please enter employee name', 'error');
      return;
    }

    const res = await this.service.checkInEmployee(
      this.checkinForm.employee_name.trim(),
      this.checkinForm.department,
      this.checkinForm.station
    );

    this.showCheckinModal.set(false);
    this.showToast(res.message, res.success ? 'success' : 'error');
  }

  // --- Leave Actions ---
  openLeaveModal(): void {
    this.leaveForm = {
      employee_name: '',
      department: 'Production',
      type: 'Annual',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      days: 1,
      reason: '',
      emergency_flag: false
    };
    this.showLeaveModal.set(true);
  }

  updateLeaveDays(): void {
    if (this.leaveForm.start_date && this.leaveForm.end_date) {
      const d1 = new Date(this.leaveForm.start_date);
      const d2 = new Date(this.leaveForm.end_date);
      const diff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
      this.leaveForm.days = isNaN(diff) ? 1 : diff;
    }
  }

  async submitLeaveForm(): Promise<void> {
    if (!this.leaveForm.employee_name.trim()) {
      this.showToast('Employee name is required', 'error');
      return;
    }
    if (!this.leaveForm.reason.trim()) {
      this.showToast('Please state a reason for the leave request', 'error');
      return;
    }

    if (new Date(this.leaveForm.end_date) < new Date(this.leaveForm.start_date)) {
      this.showToast('End date cannot be earlier than start date', 'error');
      return;
    }

    const res = await this.service.submitLeaveRequest(this.leaveForm);
    this.showLeaveModal.set(false);
    this.showToast(res.message, 'success');
  }

  async approveLeave(leave: LeaveRequest): Promise<void> {
    await this.service.updateLeaveStatus(leave.id, 'approved', 'HR Operations Manager');
    this.showToast(`Leave request for ${leave.employee_name} approved successfully`, 'success');
  }

  openRejectModal(leave: LeaveRequest): void {
    this.rejectingLeaveId.set(leave.id);
    this.rejectReasonInput.set('');
  }

  closeRejectModal(): void {
    this.rejectingLeaveId.set(null);
    this.rejectReasonInput.set('');
  }

  async confirmRejectLeave(): Promise<void> {
    const id = this.rejectingLeaveId();
    if (!id) return;
    const reason = this.rejectReasonInput().trim() || 'Request declined by HR administration';
    await this.service.updateLeaveStatus(id, 'rejected', 'HR Operations Manager', reason);
    this.closeRejectModal();
    this.showToast('Leave request marked as rejected', 'info');
  }

  // --- Formatter Helpers ---
  formatTime(isoStr: string | null): string {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  }
}
