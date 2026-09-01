# Complete Screen Audit — Ninja Factory ERP

> All 83+ screens mapped with Module, Route, Permissions, Actions, APIs, and DB Tables.

---

## Self-Service Screens (Always Accessible by All Users)

| # | Screen ID | Screen Name | Module | Actions | DB Tables |
|---|---|---|---|---|---|
| 1 | `dashboard` | My Dashboard | Overview | view | users, attendance, leave_requests |
| 2 | `hr-personal` | My Profile | My Info | view, edit | users |
| 3 | `my-attendance` | My Attendance | My Info | view | attendance |
| 4 | `scan-checkin` | QR Check-In | My Info | view, create | attendance |
| 5 | `scan-checkout` | QR Check-Out | My Info | view, create | attendance |
| 6 | `my-leaves` | My Leaves | My Info | view, create | leave_requests |
| 7 | `my-salary` | My Salary | My Info | view | payroll |
| 8 | `my-overtime` | My Overtime | My Info | view | overtime |
| 9 | `my-loans` | My Loans | My Info | view | loans |
| 10 | `my-medical` | Medical Needs | My Info | view, create | medical_requests |
| 11 | `my-delays` | My Delays | My Info | view | delays |
| 12 | `my-missions` | My Missions | My Info | view, create | missions |
| 13 | `my-expenses` | My Expenses | My Info | view, create | expenses |
| 14 | `complaints` | My Complaints | My Info | view, create | complaints |
| 15 | `announcements` | Announcements | Communication | view | announcements |
| 16 | `internal-chat` | Internal Chat | Communication | view, create | chat_messages |
| 17 | `shift-swap` | Shift Marketplace | Workplace | view, create | shift_swaps |
| 18 | `calendar` | Calendar | Workplace | view | attendance, leave_requests, events |
| 19 | `task-management` | My Tasks | Workplace | view, create, edit | tasks |

## HR Module Screens

| # | Screen ID | Screen Name | Actions | DB Tables | Roles |
|---|---|---|---|---|---|
| 20 | `employees` | Employee Management | view, create, edit, delete | users | HR, Owner |
| 21 | `attendance` | Attendance Management | view, export | attendance | HR, Owner |
| 22 | `leaves` | Leave Management | view, approve, reject, export | leave_requests | HR, Mgr, Owner |
| 23 | `absence-leave` | Permission Requests | view, approve, reject | absence_permissions | HR, Mgr, Owner |
| 24 | `shifts` | Shift Management | view, create, edit | shifts | HR, Owner |
| 25 | `overtime` | Overtime Management | view, approve, reject | overtime | HR, Mgr, Owner |
| 26 | `all-delays` | All Delays | view, export | delays | HR, Owner |
| 27 | `all-missions` | All Missions | view, approve, reject | missions | HR, Mgr, Owner |
| 28 | `employee-warnings` | Employee Warnings | view, create, edit | employee_warnings | HR, Owner |
| 29 | `asset-assignment` | Asset Assignment | view, create, edit | assets | HR, Owner |
| 30 | `payroll` | Payroll | view, create, export, print | payroll | HR, Owner |
| 31 | `payroll-funding` | Payroll Funding | view, approve | payroll_funding | Finance, Owner |
| 32 | `hr-adjustments` | Salary Adjustments | view, create, edit | salary_adjustments | HR, Owner |
| 33 | `recruitment` | Recruitment | view, create, edit | recruitment | HR, Owner |
| 34 | `hr-ats` | AI ATS | view, create | recruitment, cv_analysis | HR, Owner |
| 35 | `documents` | Documents | view, create, edit, delete | documents | HR, Owner |
| 36 | `performance` | Performance | view, create, edit | performance_reviews | HR, Owner |
| 37 | `uniforms` | Uniforms | view, create, edit | uniforms | HR, Owner |
| 38 | `loans` | Loans & Advances | view, create, approve, reject | loans | HR, Finance, Owner |
| 39 | `expenses` | Expenses | view, approve, reject | expenses | HR, Finance, Owner |
| 40 | `medical-requests` | Medical Requests | view, approve, reject | medical_requests | HR, Owner |
| 41 | `nursing-medical-approvals` | Nursing Approvals | view, approve | medical_requests | HR, Nurse, Owner |
| 42 | `offboarding` | Offboarding | view, create, edit | offboarding | HR, Owner |
| 43 | `training` | Training | view, create, edit | training | HR, Owner |
| 44 | `performance-reviews` | Performance Reviews | view, create | performance_reviews | HR, Owner |
| 45 | `hr-qr-generator` | QR Generator | view, create, print | N/A (generate only) | HR, Owner |
| 46 | `org-directory` | Org Directory | view | users | HR, All |

## Operations Module Screens

| # | Screen ID | Screen Name | Actions | DB Tables | Roles |
|---|---|---|---|---|---|
| 47 | `inventory` | Warehouse / Inventory | view, create, edit, delete | stock_items, warehouses | Warehouse Mgr, Owner |
| 48 | `purchase-requests` | Purchase Requests | view, create, approve | purchase_requests | Procurement, Owner |
| 49 | `erp-sales` | Sales | view, create, edit, export | sales_orders | Sales, Owner |
| 50 | `erp-products` | Products Catalog | view, create, edit | products | Sales, Warehouse, Owner |
| 51 | `customer-requests` | Customer Requests | view, create, edit | customer_requests | Sales, Owner |
| 52 | `supplier-portal` | Supplier Portal | view | suppliers | Procurement, Owner |
| 53 | `erp-planning` | Production Planning | view, create | planning_orders | Hall Mgr, Owner |
| 54 | `erp-production` | Production | view, create, edit | production_orders | Hall Mgr, Owner |
| 55 | `erp-bom` | Bill of Materials | view, create, edit | bom, bom_items | Engineering, Owner |
| 56 | `production-trace` | Traceability | view | production_batches | QC, Owner |
| 57 | `erp-quality` | Quality Control | view, create | qc_inspections | QC, Owner |
| 58 | `engineering` | Engineering | view, create, edit | engineering_projects | Engineering, Owner |
| 59 | `erp-maintenance` | Maintenance | view, create | maintenance_requests | Maintenance, Owner |
| 60 | `erp-equipment` | Equipment | view, create, edit | equipment | Maintenance, Owner |
| 61 | `maint-companies` | Maintenance Companies | view, create | maintenance_companies | Maintenance, Owner |
| 62 | `spare-parts` | Spare Parts | view, create, edit | spare_parts | Maintenance, Warehouse, Owner |
| 63 | `logistics` | Logistics | view, create | logistics_trips | Logistics, Owner |
| 64 | `erp-fleet` | Fleet Management | view, create, edit | fleet_vehicles | Logistics, Owner |
| 65 | `erp-suppliers` | Suppliers | view, create, edit | suppliers | Procurement, Owner |
| 66 | `supplier-performance` | Supplier Performance | view | suppliers | Procurement, Owner |

## Finance Module Screens

| # | Screen ID | Screen Name | Actions | DB Tables | Roles |
|---|---|---|---|---|---|
| 67 | `petty-cash` | Financial Suite | view, create, edit, approve | transactions, accounts | Finance, Owner |
| 68 | `financial-reports` | Financial Reports | view, export, print | transactions, accounts | Finance, Owner |
| 69 | `chart-of-accounts` | Chart of Accounts | view, create, edit | accounts | Finance, Owner |
| 70 | `driver-payments` | Driver Payments | view, create | driver_payments | Finance, Owner |
| 71 | `finance-kpi` | Financial KPIs | view | transactions | Finance, Owner |
| 72 | `bank-management` | Bank Management | view, create, edit | bank_accounts | Finance, Owner |
| 73 | `journal-engine` | Journal Engine | view, create | journal_entries | Finance, Owner |
| 74 | `check-management` | Checks Lifecycle | view, create, edit | checks | Finance, Owner |
| 75 | `fixed-assets` | Fixed Assets | view, create | fixed_assets | Finance, Owner |
| 76 | `ai-cfo` | AI CFO | view | All finance tables | Finance, Owner |
| 77 | `closing-wizard` | Closing & Audit | view, create | closing_periods | Finance, Owner |

## Admin Module Screens

| # | Screen ID | Screen Name | Actions | DB Tables | Roles |
|---|---|---|---|---|---|
| 78 | `reports` | Reports | view, export | Various | HR, Admin, Owner |
| 79 | `kpi-dashboard` | KPI Dashboard | view | Various | HR, Admin, Owner |
| 80 | `audit-log` | Audit Log | view | audit_log | Admin, Owner |
| 81 | `login-history` | Login History | view | login_history | Admin, Owner |
| 82 | `activity-log-page` | Activity Log | view | activity_log | Admin, Owner |
| 83 | `system-settings` | System Settings | view, edit | system_settings | Admin, Owner |
| 84 | `screen-permissions` | Screen Permissions | view, edit | screen_permissions | HR, Owner |
| 85 | `notification-settings` | Notifications | view, edit | notification_settings | Admin, Owner |
| 86 | `it-tickets` | IT Support | view, create | it_tickets | IT, All |
| 87 | `legal-affairs` | Legal Affairs | view, create | legal_cases | Legal, Owner |
| 88 | `global-search` | Global Search | view | Various | Admin, Owner |

## Enterprise Control (Owner Only)

| # | Screen ID | Screen Name | Actions | DB Tables |
|---|---|---|---|---|
| 89 | `owner-dashboard` | Owner Dashboard | view | All tables |
| 90 | `ceo-dashboard` | CEO Dashboard | view | All tables |
| 91 | `ai-ceo-dashboard` | AI CEO Dashboard | view | All tables |
| 92 | `cost-centers` | Cost Centers | view | departments, payroll |
| 93 | `activity-timeline` | Activity Timeline | view | activity_log, audit_log |
| 94 | `ai-reports` | AI Reports | view, create, export | ai_reports |

---

## Permission Check Points per Screen

Every screen passes through these authorization layers:

1. **Sidebar Rendering** → `PermissionGuard.canView(screenId)` → Show/Hide menu item
2. **Page Navigation** → `App.renderPage()` → `PermissionGuard.canView()` → Render or Access Denied
3. **Button Rendering** → `PermissionGuard.enforceActionPermissions()` → Enable/Disable buttons
4. **API Call** → `SecurityHelpers.hasPermission()` → Allow/Block data fetch
5. **Database** → Supabase RLS policies → Allow/Block at DB level
