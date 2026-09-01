# Permission Matrix — Ninja Factory ERP

## Permission System Overview

The system uses a **layered permission model**:

1. **Owner** → Full access to everything (hardcoded, cannot be revoked)
2. **Custom DB Permissions** → Strict DB-based access from `screen_permissions` table
3. **Legacy Fallback** → Role-based logic in `app.js` sidebar (when no custom config exists)

## Permission Flow

```
Login → loadPermissions() → Check screen_permissions table
  │
  ├─ Has custom config? → Use DB permissions strictly
  │
  └─ No custom config? → Use legacy role-based logic
```

## Screen Permission Matrix

### Self-Service (Always Allowed for All Users)

| Screen ID | Description |
|---|---|
| dashboard | Main dashboard |
| hr-personal | Personal HR profile |
| my-attendance | Own attendance |
| scan-checkin | QR check-in |
| scan-checkout | QR check-out |
| my-leaves | Own leave requests |
| my-salary | Own salary |
| my-overtime | Own overtime |
| my-loans | Own loans |
| my-medical | Own medical |
| my-delays | Own delays |
| my-missions | Own missions |
| my-expenses | Own expenses |
| complaints | Own complaints |
| announcements | Company announcements |
| internal-chat | Chat |
| shift-swap | Shift marketplace |
| calendar | Calendar |
| task-management | Tasks |

### HR Module (Requires HR/Owner permission)

| Screen ID | Actions | Default Roles |
|---|---|---|
| employees | view, create, edit, delete | HR Manager, Owner |
| attendance | view, export | HR Manager, Owner |
| leaves | view, approve, reject | HR Manager, Owner |
| shifts | view, create, edit | HR Manager, Owner |
| overtime | view, approve, reject | HR Manager, Owner |
| payroll | view, create, export, print | HR Manager, Owner |
| recruitment | view, create, edit | HR Manager, Owner |
| documents | view, create, edit, delete | HR Manager, Owner |
| performance | view, create, edit | HR Manager, Owner |
| loans | view, approve, reject | HR Manager, Owner |
| expenses | view, approve, reject | HR Manager, Owner |
| medical-requests | view, approve, reject | HR Manager, Owner |

### Operations Module

| Screen ID | Actions | Default Roles |
|---|---|---|
| inventory | view, create, edit | Warehouse Mgr, Owner |
| purchase-requests | view, create, approve | Procurement Mgr, Owner |
| erp-sales | view, create, edit | Sales Mgr, Owner |
| erp-production | view, create, edit | Hall Mgr, Owner |
| erp-quality | view, create | QC Inspector, Owner |
| erp-maintenance | view, create | Maintenance Mgr, Owner |
| logistics | view, create | Logistics Mgr, Owner |

### Enterprise Control (Owner Only)

| Screen ID | Description |
|---|---|
| owner-dashboard | Owner Command Center |
| ceo-dashboard | CEO Analytics |
| ai-ceo-dashboard | AI CEO Dashboard |
| cost-centers | Department Costs |
| activity-timeline | Operations Audit |
| ai-reports | AI Intelligence Reports |

## Action Types

| Action | Description |
|---|---|
| `view` | Can see the screen and read data |
| `create` | Can add new records |
| `edit` | Can modify existing records |
| `delete` | Can remove records |
| `approve` | Can approve pending items |
| `reject` | Can reject pending items |
| `export` | Can export data to Excel/CSV |
| `print` | Can print reports |

## AI Permission Matrix

| AI Tool | Required Screen Permission |
|---|---|
| employees, employee_list | employees |
| attendance | attendance |
| payroll, salary | payroll |
| inventory, warehouse | inventory |
| sales | erp-sales |
| production | erp-production |
| quality | erp-quality |
| financial | petty-cash, financial-reports |
| full_analysis | owner-dashboard (Owner only) |
