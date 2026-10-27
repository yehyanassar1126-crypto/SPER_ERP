# Pull Request: Feature - Attendance & Leave Management Module

## 📌 Summary of Work Done
Migrated the Attendance, Shift Logs, Absence Tracking, and Leave Management functionality to Angular standalone components within `frontend-angular/` based on `angular-migration`.

### Key Features Implemented:
1. **QR Code Scanning & Live Camera Viewport:**
   - Real-time video scanner integration using `Html5Qrcode` (environment camera for mobile / webcam for desktop).
   - Validates dynamic rotating kiosk QR code payload (`hr_id`, `timestamp`, `type: "hr_qr"`).
   - Validates expiration window (`diffSec < 40s`) to prevent forwarded screenshot attacks.
   - Anti-replay protection logged in `qr_tokens` table.

2. **GPS Location & Geo-Fencing Verification (مطابق لـ GitHub):**
   - Retrieves live device GPS coordinates via `navigator.geolocation.getCurrentPosition()`.
   - Computes distance to factory headquarters (`30.0444, 31.2357`) using the Haversine formula (`getDistanceInMeters`).
   - Enforces the 500-meter radius boundary:
     - Inside radius: `✅ موقعك معتمد داخل نطاق الشركة`.
     - Outside radius: `❌ أنت خارج نطاق الشركة! (المسافة: X متر بعيد)`.
   - Records the exact GPS coordinates and location name in `attendance.check_in_location` and `check_out_location`.
   - Mode switcher allowing testing with Live Device GPS, Simulated In-Factory, or Simulated Out-of-Range.

3. **Attendance Logs (`/attendance`):**
   - Real-time daily shift tracking (Check-in, Check-out, Shift, Delay, Working Hours, Status, Verified GPS Location).
   - Interactive filtering by Department and Status (`Present`, `Clocked In`, `Absent`) + Name search.
   - Live KPI metric cards (Present count, Active Clocked-in, Delays, Pending Leaves).
   - Manual Check-In override modal for HR administrators.

4. **Delays & Absence Tracking:**
   - Late deductions display matching `late_deductions` table with automatic delay deduction calculation.
   - Unauthorized absence sanction log matching `hr_absence_records` table with HR penalty decisions.
   - Policy alert adhering to Egyptian labor law Article 69 sanction tiers.

5. **Leave Requests & Approval Workflow:**
   - Full submission form with validation (Type: Annual, Sick, Emergency, Unpaid, Casual, Maternity; date calculation, emergency flag).
   - Interactive reviewer actions: Instant **Approve** and **Reject** (with prompt/reason recording).
   - Status filtering (`All`, `Pending Manager`, `Pending HR`, `Approved`, `Rejected`).

---

## 🗂 Files Changed / Created
- `frontend-angular/src/app/features/attendance/models/attendance.models.ts`: Domain models with GeoFence and Location result types.
- `frontend-angular/src/app/features/attendance/services/attendance.service.ts`: Haversine calculation, location verification, QR anti-replay tracking, and Supabase client.
- `frontend-angular/src/app/features/attendance/attendance.component.ts`: Master orchestrator standalone component with camera and GPS logic.
- `frontend-angular/src/app/features/attendance/attendance.component.html`: 5-tab responsive UI with camera viewport, GPS simulator, and modals.
- `frontend-angular/src/app/features/attendance/attendance.component.scss`: Host styling.
- `frontend-angular/src/app/features/attendance/attendance-theme.scss`: Enterprise theme variables and utility classes.
- `frontend-angular/src/app/features/attendance/attendance.routes.ts`: Standalone child route registration.
- `frontend-angular/src/app/features/attendance/ATTENDANCE_DOCS.md`: Technical documentation.
- `frontend-angular/src/app/app.routes.ts`: Registered lazy route `/attendance`.
- `frontend-angular/src/styles.scss`: Global styling import.

---

## 🧪 Testing Instructions
From `frontend-angular` directory:
```powershell
# 1. Start local dev server
npm start

# 2. Open browser at
http://localhost:4200/attendance

# 3. Test QR & Location in Tab 4
# - Test "Live Device GPS" or "Inside Factory" -> Attendance accepted with GPS tag
# - Test "Outside Factory" -> Attendance rejected with out-of-range alert
# - Click "Open Live Camera Scanner" to test live camera feed

# 4. Verify Build Integrity
npm run build
```
