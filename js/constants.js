// ===== APP CONSTANTS =====
var DEPARTMENTS = ['Production', 'Warehouse', 'Administration', 'Packaging', 'Maintenance', 'Procurement', 'Finance', 'IT', 'Quality', 'Engineering', 'Planning', 'Health & Safety', 'Secretariat', 'Sales', 'Logistics', 'Medical', 'Driver'];

// Shift systems: 2-shift (12h each) or 3-shift (8h each)
var SHIFT_SYSTEMS = {
  '2-shift': { label: '2-Shift (12h)', shifts: ['day', 'night'] },
  '3-shift': { label: '3-Shift (8h)', shifts: ['morning', 'evening', 'night'] }
};

var SHIFTS = {
  // 2-shift system (12 hours each)
  day:     { label: 'Day Shift',     start: '08:00', end: '20:00', hours: 12, system: '2-shift' },
  // 3-shift system (8 hours each)
  morning: { label: 'Morning Shift', start: '08:00', end: '16:00', hours: 8,  system: '3-shift' },
  evening: { label: 'Evening Shift', start: '16:00', end: '00:00', hours: 8,  system: '3-shift' },
  // Night shift shared: 8h in 3-shift, 12h in 2-shift
  night:   { label: 'Night Shift',   start: '00:00', end: '08:00', hours: 8,  system: '3-shift' },
  // Administrative shift
  admin:   { label: 'Admin Shift',   start: '09:00', end: '17:00', hours: 8,  system: '3-shift' }
};

// Helper to get the correct night shift config based on system
function getShiftConfig(shiftKey, shiftSystem) {
  if (shiftKey === 'night' && shiftSystem === '2-shift') {
    return { label: 'Night Shift', start: '20:00', end: '08:00', hours: 12, system: '2-shift' };
  }
  if (shiftKey === 'day') {
    return SHIFTS.day;
  }
  return SHIFTS[shiftKey] || SHIFTS.morning;
}

// Get available shifts for a given system
function getShiftsForSystem(system) {
  if (system === '2-shift') {
    return [
      { key: 'day',   label: 'Day Shift (08:00 - 20:00)' },
      { key: 'night', label: 'Night Shift (20:00 - 08:00)' }
    ];
  }
  return [
    { key: 'morning', label: 'Morning Shift (08:00 - 16:00)' },
    { key: 'evening', label: 'Evening Shift (16:00 - 00:00)' },
    { key: 'night',   label: 'Night Shift (00:00 - 08:00)' },
    { key: 'admin',   label: 'Admin Shift (09:00 - 17:00)' }
  ];
}

var LEAVE_TYPES = ['Annual', 'Sick', 'Emergency', 'Unpaid', 'Maternity/Paternity'];