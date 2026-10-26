export interface AttendanceRecord {
  id: string;
  employee_id?: string;
  employee_name: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  shift: string;
  delay_minutes: number;
  working_hours: number;
  status: 'present' | 'checked_in' | 'absent';
  check_in_location?: string | null;
  check_out_location?: string | null;
  qr_token_checkin?: string | null;
  qr_token_checkout?: string | null;
  created_at?: string;
}

export type LeaveType = 'Annual' | 'Sick' | 'Emergency' | 'Unpaid' | 'Casual' | 'Maternity/Paternity';

export type LeaveStatus = 'pending' | 'pending_manager' | 'pending_hr' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employee_id?: string;
  employee_name: string;
  department: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  rejection_reason?: string | null;
  approved_by?: string | null;
  emergency_flag?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AbsenceRecord {
  id: string;
  employee_id?: string;
  employee_name: string;
  date: string;
  type: 'unauthorized' | 'authorized_paid' | 'authorized_unpaid';
  penalty_days: number;
  hr_decision: string;
  status: string;
  created_at?: string;
}

export interface LateDeduction {
  id: string;
  employee_name: string;
  date: string;
  delay_minutes: number;
  deduction_type: string;
  amount: number;
  created_at?: string;
}

export interface AttendanceStats {
  totalRecordsToday: number;
  presentCount: number;
  checkedInCount: number;
  absentCount: number;
  delayedCount: number;
  totalDelayMinutes: number;
  pendingLeavesCount: number;
}

export interface QrStationToken {
  hr_id: string;
  timestamp: number;
  type: 'hr_qr';
}

export interface GeoFenceConfig {
  enabled: boolean;
  companyLat: number;
  companyLng: number;
  maxRadiusMeters: number;
}

export interface LocationVerificationResult {
  verified: boolean;
  lat: number | null;
  lng: number | null;
  distanceMeters: number | null;
  locationString: string;
  message: string;
}
