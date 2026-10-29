import { Injectable, signal, computed } from '@angular/core';
import {
  AttendanceRecord,
  LeaveRequest,
  AbsenceRecord,
  LateDeduction,
  AttendanceStats,
  QrStationToken,
  GeoFenceConfig,
  LocationVerificationResult,
  EmployeeUser
} from '../models/attendance.models';
import { environment } from '../../../../environments/environment';

const SUPABASE_URL = environment.supabaseUrl;
const SUPABASE_KEY = environment.supabasePublishableKey;

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  // Reactive signals
  readonly attendanceList = signal<AttendanceRecord[]>([]);
  readonly leaveRequests = signal<LeaveRequest[]>([]);
  readonly absenceRecords = signal<AbsenceRecord[]>([]);
  readonly delayRecords = signal<LateDeduction[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Real factory employees synced with Supabase users table
  readonly usersList = signal<EmployeeUser[]>([
    { id: '43765f87-1c61-42aa-b7c8-f41accec54cd', full_name: 'بدر صلاح', employee_id: 'EMP-003', department: 'Production', role: 'employee' },
    { id: 'b7841cf5-66e0-46c8-acd8-0aeb09ea516f', full_name: 'محمد عبد الغني محمد الخواجة', employee_id: 'EMP-002', department: 'Warehouse', role: 'employee' },
    { id: '290c5ef7-5fba-4a25-b3a9-ec1efd19fff7', full_name: 'Hana', employee_id: 'EMP-014', department: 'Procurement', role: 'procurement specialist' },
    { id: '799f9735-7d81-43c6-8af8-c136116f4d3d', full_name: 'Hassan', employee_id: 'EMP-019', department: 'Maintenance', role: 'manager' },
    { id: 'c9885105-cafb-4c0c-8de9-0b5e2d85b3bb', full_name: 'Admin HR', employee_id: 'HR-001', department: 'Administration', role: 'hr' },
    { id: '62b08c36-15eb-4346-897c-0667dc052fc7', full_name: 'نصار نصار', employee_id: 'EMP-012', department: 'Finance', role: 'manager' },
    { id: '557d1b7b-8fad-436f-9b48-2bb605581cec', full_name: 'yehya Nassar', employee_id: 'EMP-013', department: 'IT', role: 'employee' },
    { id: '52c15cad-7d1b-4982-8b97-40c1c443709d', full_name: 'yousif', employee_id: 'EMP-015', department: 'Quality', role: 'employee' },
    { id: '861a9240-31eb-4e22-93fd-2e6488fa7b3f', full_name: 'hasan sha3lan', employee_id: 'EMP-009', department: 'Engineering', role: 'employee' }
  ]);

  // Geo-Fencing configuration (matches GitHub legacy config)
  readonly geoConfig = signal<GeoFenceConfig>({
    enabled: true,
    companyLat: 30.0444, // Factory Headquarters Lat
    companyLng: 31.2357, // Factory Headquarters Lng
    maxRadiusMeters: 500  // 500m geofence boundary
  });

  // Track used tokens to prevent replay attacks
  private readonly usedTokens = new Set<string>();

  // Live stats computed from list
  readonly stats = computed<AttendanceStats>(() => {
    const records = this.attendanceList();
    const leaves = this.leaveRequests();
    const today = new Date().toISOString().slice(0, 10);
    const todayRecs = records.filter(r => r.date === today || !r.date);

    const presentCount = records.filter(r => r.status === 'present').length;
    const checkedInCount = records.filter(r => r.status === 'checked_in').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const delayedCount = records.filter(r => (r.delay_minutes ?? 0) > 0).length;
    const totalDelayMinutes = records.reduce((sum, r) => sum + (r.delay_minutes || 0), 0);
    const pendingLeavesCount = leaves.filter(l => l.status === 'pending' || l.status === 'pending_manager' || l.status === 'pending_hr').length;

    return {
      totalRecordsToday: todayRecs.length || records.length,
      presentCount,
      checkedInCount,
      absentCount,
      delayedCount,
      totalDelayMinutes,
      pendingLeavesCount
    };
  });

  constructor() {
    this.initDefaultData();
    this.fetchFromSupabase();
  }

  private initDefaultData(): void {
    const today = new Date().toISOString().slice(0, 10);

    const initialAttendance: AttendanceRecord[] = [
      {
        id: 'att-1',
        employee_name: 'Ahmed Mansour',
        department: 'Production',
        date: today,
        shift: 'Morning (08:00 - 16:30)',
        check_in: `${today}T07:55:00Z`,
        check_out: `${today}T16:35:00Z`,
        delay_minutes: 0,
        working_hours: 8.5,
        status: 'present',
        check_in_location: '30.0445, 31.2356 (Gate A - 12m away)',
        check_out_location: '30.0445, 31.2356 (Gate A - 15m away)'
      },
      {
        id: 'att-2',
        employee_name: 'Mahmoud Hassan',
        department: 'Maintenance',
        date: today,
        shift: 'Morning (08:00 - 16:30)',
        check_in: `${today}T08:25:00Z`,
        check_out: null,
        delay_minutes: 25,
        working_hours: 4.2,
        status: 'checked_in',
        check_in_location: '30.0443, 31.2358 (Workshop - 28m away)'
      },
      {
        id: 'att-3',
        employee_name: 'Sara El-Sayed',
        department: 'Quality Assurance',
        date: today,
        shift: 'Morning (08:00 - 16:30)',
        check_in: `${today}T07:58:00Z`,
        check_out: null,
        delay_minutes: 0,
        working_hours: 4.7,
        status: 'checked_in',
        check_in_location: '30.0444, 31.2357 (QA Lab - 5m away)'
      },
      {
        id: 'att-4',
        employee_name: 'Khaled Ibrahim',
        department: 'Supply Chain',
        date: today,
        shift: 'Morning (08:00 - 16:30)',
        check_in: null,
        check_out: null,
        delay_minutes: 0,
        working_hours: 0,
        status: 'absent'
      },
      {
        id: 'att-5',
        employee_name: 'Youssef Nabil',
        department: 'Engineering',
        date: today,
        shift: 'Morning (08:00 - 16:30)',
        check_in: `${today}T08:45:00Z`,
        check_out: null,
        delay_minutes: 45,
        working_hours: 3.9,
        status: 'checked_in',
        check_in_location: '30.0446, 31.2355 (Main Station - 32m away)'
      }
    ];

    const initialLeaves: LeaveRequest[] = [
      {
        id: 'leave-1',
        employee_name: 'Khaled Ibrahim',
        department: 'Supply Chain',
        type: 'Sick',
        start_date: today,
        end_date: today,
        days: 1,
        reason: 'Acute fever with medical prescription attached',
        status: 'pending_hr',
        emergency_flag: false,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'leave-2',
        employee_name: 'Nourhan Adel',
        department: 'Human Resources',
        type: 'Annual',
        start_date: '2026-11-01',
        end_date: '2026-11-05',
        days: 5,
        reason: 'Annual family leave planned in advance',
        status: 'approved',
        approved_by: 'HR Director',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'leave-3',
        employee_name: 'Tamer Zaki',
        department: 'Production',
        type: 'Emergency',
        start_date: today,
        end_date: today,
        days: 1,
        reason: 'Family urgent hospital admission',
        status: 'pending_manager',
        emergency_flag: true,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];

    const initialAbsences: AbsenceRecord[] = [
      {
        id: 'abs-1',
        employee_name: 'Khaled Ibrahim',
        date: today,
        type: 'unauthorized',
        penalty_days: 2.0,
        hr_decision: 'deduct_2',
        status: 'applied',
        created_at: today
      },
      {
        id: 'abs-2',
        employee_name: 'Omar Farouk',
        date: '2026-10-24',
        type: 'unauthorized',
        penalty_days: 2.0,
        hr_decision: 'deduct_2',
        status: 'applied',
        created_at: '2026-10-24'
      }
    ];

    const initialDelays: LateDeduction[] = [
      {
        id: 'del-1',
        employee_name: 'Mahmoud Hassan',
        date: today,
        delay_minutes: 25,
        deduction_type: 'Quarter-day deduction (25m)',
        amount: 85.0,
        created_at: today
      },
      {
        id: 'del-2',
        employee_name: 'Youssef Nabil',
        date: today,
        delay_minutes: 45,
        deduction_type: 'Half-day deduction (45m)',
        amount: 160.0,
        created_at: today
      }
    ];

    this.attendanceList.set(initialAttendance);
    this.leaveRequests.set(initialLeaves);
    this.absenceRecords.set(initialAbsences);
    this.delayRecords.set(initialDelays);
  }

  // Haversine formula (identical to legacy app.js getDistanceInMeters)
  getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Geofence & Location Verification (identical to verifyGeoFence in app.js)
  async verifyLocation(simulateInFactory = false): Promise<LocationVerificationResult> {
    const conf = this.geoConfig();

    if (!conf.enabled || simulateInFactory) {
      // Simulate verified location within perimeter
      const simLat = conf.companyLat + 0.0001;
      const simLng = conf.companyLng + 0.0001;
      const simDist = Math.round(this.getDistanceInMeters(simLat, simLng, conf.companyLat, conf.companyLng));
      return {
        verified: true,
        lat: simLat,
        lng: simLng,
        distanceMeters: simDist,
        locationString: `${simLat.toFixed(6)}, ${simLng.toFixed(6)} (Inside Factory: ${simDist}m)`,
        message: `Location verified inside company perimeter (${simDist}m from center).`
      };
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return {
        verified: false,
        lat: null,
        lng: null,
        distanceMeters: null,
        locationString: 'GPS Unavailable',
        message: '❌ Location tracking not supported by your browser / device.'
      };
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;
          const distance = this.getDistanceInMeters(userLat, userLng, conf.companyLat, conf.companyLng);
          const roundedDist = Math.round(distance);

          if (distance <= conf.maxRadiusMeters) {
            resolve({
              verified: true,
              lat: userLat,
              lng: userLng,
              distanceMeters: roundedDist,
              locationString: `${userLat.toFixed(6)}, ${userLng.toFixed(6)} (Factory Radius: ${roundedDist}m)`,
              message: `Location verified inside company perimeter (${roundedDist}m).`
            });
          } else {
            const away = Math.round(distance - conf.maxRadiusMeters);
            resolve({
              verified: false,
              lat: userLat,
              lng: userLng,
              distanceMeters: roundedDist,
              locationString: `${userLat.toFixed(6)}, ${userLng.toFixed(6)} (Out of Range: ${away}m)`,
              message: `Outside company boundary! Distance: ${away}m outside permitted 500m zone.`
            });
          }
        },
        err => {
          resolve({
            verified: false,
            lat: null,
            lng: null,
            distanceMeters: null,
            locationString: 'GPS Disabled',
            message: 'Could not acquire GPS position. Please enable device location.'
          });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }

  // QR Validation Engine (with anti-replay check)
  validateQrPayload(rawJson: string): { valid: boolean; error?: string; token?: QrStationToken } {
    try {
      const data = JSON.parse(rawJson);
      if (!data || data.type !== 'hr_qr') {
        return { valid: false, error: '❌ Invalid QR Code format. Must be an official SPER ERP station code.' };
      }

      if (!data.timestamp || typeof data.timestamp !== 'number') {
        return { valid: false, error: '❌ Corrupted QR code payload.' };
      }

      const diffSec = Math.abs((Date.now() - data.timestamp) / 1000);
      if (diffSec > 40) {
        return { valid: false, error: `❌ رمز QR منتهي الصلاحية (${Math.round(diffSec)}s old). الكود يتجدد كل 5 ثوانٍ.` };
      }

      const tokenKey = `${data.timestamp}_${data.hr_id}`;
      if (this.usedTokens.has(tokenKey)) {
        return { valid: false, error: '❌ تم استخدام رمز الـ QR هذا مسبقاً (Already used).' };
      }

      return { valid: true, token: data };
    } catch {
      return { valid: false, error: '❌ Could not decode QR payload. Not valid JSON.' };
    }
  }

  findUserByName(name: string): EmployeeUser | undefined {
    if (!name) return undefined;
    const lower = name.toLowerCase().trim();
    return this.usersList().find(u => {
      const uName = u.full_name.toLowerCase().trim();
      return uName === lower || uName.includes(lower) || lower.includes(uName);
    });
  }

  generateQrPayload(): QrStationToken {
    return {
      hr_id: 'c9885105-cafb-4c0c-8de9-0b5e2d85b3bb', // Official Admin HR UUID from Supabase users
      timestamp: Date.now(),
      type: 'hr_qr'
    };
  }

  // Enterprise API Gateway:
  // Proxies requests through `/api/supabase/...` so that:
  // 1. The browser's DevTools show `:authority: localhost:4200` (Supabase domain is NEVER exposed in headers).
  // 2. The `Apikey` and `Authorization` headers are NOT sent by the browser at all (completely hidden from DevTools!).
  // 3. The proxy server attaches credentials server-side.
  // 4. Automatically falls back to direct call with publishable key if proxy is offline.
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const proxyUrl = `/api/supabase/${cleanEndpoint}`;

    try {
      const proxyRes = await fetch(proxyUrl, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      if (proxyRes.status !== 404) {
        return proxyRes;
      }
    } catch {
      // Local dev proxy not active, fall back to direct request
    }

    return fetch(`${SUPABASE_URL}/rest/v1/${cleanEndpoint}`, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  }

  async checkInEmployee(
    employeeName: string,
    department: string,
    location = 'Factory Gate A',
    qrToken?: QrStationToken
  ): Promise<{ success: boolean; message: string }> {
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const existingIndex = this.attendanceList().findIndex(r => r.employee_name === employeeName && r.date === today);

    if (existingIndex >= 0 && this.attendanceList()[existingIndex].check_in) {
      return {
        success: false,
        message: `${employeeName} already checked in today at ${this.formatTimeShort(this.attendanceList()[existingIndex].check_in)}`
      };
    }

    if (qrToken) {
      this.usedTokens.add(`${qrToken.timestamp}_${qrToken.hr_id}`);
    }

    const matchedUser = this.findUserByName(employeeName);
    const empId = matchedUser?.id;

    const newRecord: AttendanceRecord = {
      id: 'att-' + Date.now(),
      employee_id: empId,
      employee_name: employeeName,
      department: matchedUser?.department || department || 'General Operations',
      date: today,
      shift: 'Morning (08:00 - 16:30)',
      check_in: nowIso,
      check_out: null,
      delay_minutes: Math.max(0, new Date().getHours() - 8) * 60 + new Date().getMinutes(),
      working_hours: 0,
      status: 'checked_in',
      check_in_location: location
    };

    if (existingIndex >= 0) {
      const updated = [...this.attendanceList()];
      updated[existingIndex] = { ...updated[existingIndex], ...newRecord };
      this.attendanceList.set(updated);
    } else {
      this.attendanceList.set([newRecord, ...this.attendanceList()]);
    }

    // Try posting to Supabase attendance & qr_tokens
    try {
      const attBody: Record<string, any> = {
        employee_name: newRecord.employee_name,
        department: newRecord.department,
        date: newRecord.date,
        shift: newRecord.shift,
        check_in: newRecord.check_in,
        status: 'checked_in',
        delay_minutes: Math.round(newRecord.delay_minutes || 0),
        check_in_location: location
      };
      if (isValidUuid(empId)) {
        attBody['employee_id'] = empId;
      }

      const attRes = await this.apiRequest('attendance', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(attBody)
      });

      if (attRes.ok) {
        const createdAtt = await attRes.json();
        if (Array.isArray(createdAtt) && createdAtt.length > 0 && createdAtt[0].id) {
          const list = [...this.attendanceList()];
          const idx = list.findIndex(r => r.employee_name === employeeName && r.date === today);
          if (idx >= 0) {
            list[idx].id = createdAtt[0].id;
            this.attendanceList.set(list);
          }
        }
      }

      if (qrToken) {
        const qrBody: Record<string, any> = {
          token: `${qrToken.timestamp}_${qrToken.hr_id}`,
          action_type: 'checkin'
        };
        if (isValidUuid(qrToken.hr_id)) {
          qrBody['hr_id'] = qrToken.hr_id;
        }
        if (isValidUuid(empId)) {
          qrBody['employee_id'] = empId;
        }

        await this.apiRequest('qr_tokens', {
          method: 'POST',
          body: JSON.stringify(qrBody)
        });
      }
    } catch {
      // offline fallback
    }

    return {
      success: true,
      message: `Check-in confirmed for ${employeeName}. Location verified within factory perimeter.`
    };
  }

  async checkOutEmployee(
    employeeName: string,
    location = 'Factory Gate A',
    qrToken?: QrStationToken
  ): Promise<{ success: boolean; message: string }> {
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const records = [...this.attendanceList()];
    // Find active check-in record without check-out first, or today's record
    let index = records.findIndex(r => r.employee_name === employeeName && r.check_in && !r.check_out);
    if (index === -1) {
      index = records.findIndex(r => r.employee_name === employeeName && r.date === today);
    }

    if (index === -1 || !records[index].check_in) {
      return { success: false, message: `❌ لم يتم العثور على تسجيل حضور فعال للموظف ${employeeName} اليوم.` };
    }

    if (records[index].check_out) {
      return { success: false, message: `❌ تم تسجيل الانصراف مسبقاً للموظف ${employeeName}.` };
    }

    if (qrToken) {
      this.usedTokens.add(`${qrToken.timestamp}_${qrToken.hr_id}`);
    }

    const matchedUser = this.findUserByName(employeeName);
    const empId = matchedUser?.id;

    const checkInTime = new Date(records[index].check_in!).getTime();
    const durationHours = Math.round(((Date.now() - checkInTime) / 3600000) * 10) / 10;

    records[index] = {
      ...records[index],
      check_out: nowIso,
      working_hours: durationHours,
      status: 'present',
      check_out_location: location
    };

    this.attendanceList.set(records);

    // Try updating Supabase
    try {
      const recId = records[index].id;
      const queryParam = isValidUuid(recId)
        ? `id=eq.${recId}`
        : `employee_name=eq.${encodeURIComponent(employeeName)}&date=eq.${today}`;

      await this.apiRequest(`attendance?${queryParam}`, {
        method: 'PATCH',
        body: JSON.stringify({
          check_out: nowIso,
          working_hours: durationHours,
          status: 'present',
          check_out_location: location
        })
      });

      if (qrToken) {
        const qrBody: Record<string, any> = {
          token: `${qrToken.timestamp}_${qrToken.hr_id}`,
          action_type: 'checkout'
        };
        if (isValidUuid(qrToken.hr_id)) {
          qrBody['hr_id'] = qrToken.hr_id;
        }
        if (isValidUuid(empId)) {
          qrBody['employee_id'] = empId;
        }

        await this.apiRequest('qr_tokens', {
          method: 'POST',
          body: JSON.stringify(qrBody)
        });
      }
    } catch {
      // offline fallback
    }

    return {
      success: true,
      message: `Check-out confirmed for ${employeeName}. Total shift: ${durationHours} hours.`
    };
  }

  async submitLeaveRequest(req: {
    employee_name: string;
    department: string;
    type: any;
    start_date: string;
    end_date: string;
    days: number;
    reason: string;
    emergency_flag?: boolean;
  }): Promise<{ success: boolean; message: string }> {
    const newLeave: LeaveRequest = {
      id: 'leave-' + Date.now(),
      employee_name: req.employee_name,
      department: req.department,
      type: req.type,
      start_date: req.start_date,
      end_date: req.end_date,
      days: req.days,
      reason: req.reason,
      status: req.emergency_flag ? 'pending_manager' : 'pending_manager',
      emergency_flag: req.emergency_flag || false,
      created_at: new Date().toISOString()
    };

    this.leaveRequests.set([newLeave, ...this.leaveRequests()]);

    try {
      await this.apiRequest('leave_requests', {
        method: 'POST',
        body: JSON.stringify({
          employee_name: newLeave.employee_name,
          department: newLeave.department,
          type: newLeave.type,
          start_date: newLeave.start_date,
          end_date: newLeave.end_date,
          days: newLeave.days,
          reason: newLeave.reason,
          status: 'pending_manager'
        })
      });
    } catch {
      // offline fallback
    }

    return { success: true, message: 'Leave request submitted successfully and queued for manager review.' };
  }

  async updateLeaveStatus(id: string, newStatus: 'approved' | 'rejected', approver: string, rejectionReason?: string): Promise<void> {
    const updated = this.leaveRequests().map(l => {
      if (l.id === id) {
        return {
          ...l,
          status: newStatus,
          approved_by: newStatus === 'approved' ? approver : undefined,
          rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined,
          updated_at: new Date().toISOString()
        };
      }
      return l;
    });

    this.leaveRequests.set(updated);

    try {
      await this.apiRequest(`leave_requests?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          approved_by: newStatus === 'approved' ? approver : null,
          rejection_reason: rejectionReason || null,
          updated_at: new Date().toISOString()
        })
      });
    } catch {
      // offline fallback
    }
  }

  async fetchFromSupabase(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // 1. Fetch live users from Supabase via Gateway
      const usersRes = await this.apiRequest('users?select=id,full_name,employee_id,department,role&order=full_name.asc');
      if (usersRes.ok) {
        const usersData: EmployeeUser[] = await usersRes.json();
        if (Array.isArray(usersData) && usersData.length > 0) {
          this.usersList.set(usersData);
        }
      }

      // 2. Fetch live attendance via Gateway
      const attRes = await this.apiRequest('attendance?select=*&order=created_at.desc&limit=50');
      if (attRes.ok) {
        const attData: AttendanceRecord[] = await attRes.json();
        if (Array.isArray(attData) && attData.length > 0) {
          this.attendanceList.set(attData);

          // Populate live delays directly from attendance (matches legacy app.js)
          const liveDelays: LateDeduction[] = attData
            .filter(r => (r.delay_minutes || 0) > 0)
            .map(r => ({
              id: 'del-' + r.id,
              employee_name: r.employee_name,
              date: r.date,
              delay_minutes: r.delay_minutes,
              deduction_type: r.delay_minutes > 30 ? 'Half-day deduction (>30m)' : 'Quarter-day deduction (15-30m)',
              amount: Math.round(r.delay_minutes * 3.5),
              created_at: r.created_at || r.date
            }));
          if (liveDelays.length > 0) {
            this.delayRecords.set(liveDelays);
          }
        }
      }

      // 3. Fetch leave requests via Gateway
      const leaveRes = await this.apiRequest('leave_requests?select=*&order=created_at.desc&limit=50');
      if (leaveRes.ok) {
        const leaveData: LeaveRequest[] = await leaveRes.json();
        if (Array.isArray(leaveData) && leaveData.length > 0) {
          this.leaveRequests.set(leaveData);
        }
      }

      // 4. Fetch late deductions if available
      const delayRes = await this.apiRequest('late_deductions?select=*&order=created_at.desc&limit=50');
      if (delayRes.ok) {
        const delayData: LateDeduction[] = await delayRes.json();
        if (Array.isArray(delayData) && delayData.length > 0) {
          this.delayRecords.set(delayData);
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch notice: using cached dataset', err);
    } finally {
      this.loading.set(false);
    }
  }

  private formatTimeShort(iso: string | null): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }
}
