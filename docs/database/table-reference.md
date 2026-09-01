# Database Reference — New Tables (Migration 012)

## Table: `permission_templates`

Role-based default permissions for quick user setup.

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| role | TEXT | Role name (e.g. 'employee', 'hr manager') |
| screen_id | TEXT | Screen identifier |
| action | TEXT | Action type (view, create, edit, delete, approve, reject, export, print) |
| granted | BOOLEAN | Whether permission is granted |
| module | TEXT | Module group (overview, my-info, hr, operations, finance, admin) |
| created_at | TIMESTAMPTZ | Creation timestamp |

**Constraints:** UNIQUE(role, screen_id, action)

## Table: `ai_reports`

Stores AI-generated analytics reports.

| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| report_type | TEXT | 'monthly', 'semiannual', 'annual', 'custom' |
| period | TEXT | Period key (e.g. 'august-2026', 'h1-2026') |
| title | TEXT | Report title |
| content | JSONB | Full analysis data (KPIs, charts, recommendations) |
| summary | TEXT | Executive summary text |
| generated_by | UUID (FK→users) | User who generated |
| generated_by_name | TEXT | User name |
| report_year | INTEGER | Year |
| report_month | INTEGER | Month (1-12) |
| report_half | INTEGER | Half (1 or 2) |
| from_date | DATE | Period start |
| to_date | DATE | Period end |
| status | TEXT | 'generated', 'reviewed', 'archived' |
| language | TEXT | 'ar' or 'en' |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update (auto-trigger) |

**Indexes:** report_type, report_year, created_at DESC
**Unique:** (report_type, period, report_year) WHERE report_type != 'custom'

## Modified Table: `users`

| New Column | Type | Description |
|---|---|---|
| preferred_language | TEXT DEFAULT 'ar' | User's preferred UI language |

## Modified Table: `screen_permissions`

| New Column | Type | Description |
|---|---|---|
| module | TEXT | Module group for categorization |
| description | TEXT | Human-readable description |

## AI Report Content Schema (JSONB)

```json
{
  "period": { "from": "2026-08-01", "to": "2026-08-31" },
  "employee": {
    "total": 120, "active": 105, "inactive": 15,
    "newHires": 3, "departed": 2, "turnoverRate": 2,
    "byDepartment": { "Production": 40, "HR": 8 },
    "totalSalaryCost": 850000, "avgSalary": 8095
  },
  "attendance": {
    "totalRecords": 2100, "presentCount": 1890,
    "lateCount": 315, "absentCount": 210,
    "attendanceRate": 90, "lateRate": 15, "absenceRate": 10,
    "worstLateEmployees": [{"name":"...", "count": 12}]
  },
  "login": {
    "totalLogins": 450, "successLogins": 440,
    "failedLogins": 10, "uniqueUsers": 85,
    "topActiveUsers": [{"name":"...", "count": 60}],
    "topScreens": [{"screen":"dashboard", "count": 200}]
  },
  "department": [
    {"name":"Production", "employees": 40, "attendanceRate": 88, "score": 78}
  ],
  "financial": {
    "totalPayroll": 850000, "activeLoansCount": 12, "totalLoanBalance": 45000
  },
  "recommendations": [
    {"priority":"high", "ar":"...", "en":"..."}
  ],
  "anomalies": [
    {"type":"pattern", "ar":"...", "en":"..."}
  ],
  "executive_summary": { "ar": "...", "en": "..." }
}
```
