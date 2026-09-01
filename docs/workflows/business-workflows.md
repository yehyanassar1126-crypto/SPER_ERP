# Business Workflows — Ninja Factory ERP

## 1. Employee Onboarding Workflow

```mermaid
flowchart TD
    A[HR creates new employee] --> B[Insert into users table]
    B --> C[Auto-assign permissions from template]
    C --> D[Employee gets login credentials]
    D --> E[First login → Dashboard built from permissions]
    E --> F[Employee can access self-service screens]
```

## 2. Leave Request Workflow

```mermaid
flowchart TD
    A[Employee opens My Leaves] --> B[Creates leave request]
    B --> C{Manager/HR notified}
    C --> D{Approve or Reject?}
    D -->|Approve| E[Status → Approved, Balance updated]
    D -->|Reject| F[Status → Rejected, Reason logged]
    E --> G[Employee notified]
    F --> G
```

**Permissions Required:**
- Employee: `my-leaves.view`, `my-leaves.create`
- Manager/HR: `leaves.view`, `leaves.approve`, `leaves.reject`

## 3. Payroll Workflow

```mermaid
flowchart TD
    A[HR opens Payroll] --> B[Calculate salaries for month]
    B --> C[Review payroll sheet]
    C --> D[Submit for funding approval]
    D --> E{Owner/Finance approves?}
    E -->|Yes| F[Individual Pay buttons enabled]
    F --> G[HR clicks Pay per employee]
    G --> H[Transaction created in Finance]
    H --> I[Status → Paid]
    E -->|No| J[Return for corrections]
```

**Permissions Required:**
- HR: `payroll.view`, `payroll.create`, `payroll.export`
- Finance: `payroll-funding.view`, `payroll-funding.approve`
- Owner: Full access

## 4. Purchase Request Workflow

```mermaid
flowchart TD
    A[Department creates purchase request] --> B[Status: Pending]
    B --> C{Department Head approves?}
    C -->|Yes| D[Status: Dept Approved]
    C -->|No| E[Status: Rejected]
    D --> F{Procurement reviews}
    F --> G[Create Purchase Order]
    G --> H[Supplier delivers]
    H --> I[Warehouse receives stock]
    I --> J[Finance processes payment]
```

**Permissions Required:**
- Employee: `purchase-requests.create`
- Dept Head: `dept-purchase-approvals.approve`
- Procurement: `purchase-requests.view`, `purchase-requests.approve`
- Warehouse: `inventory.create`
- Finance: `petty-cash.create`

## 5. Attendance Workflow

```mermaid
flowchart TD
    A[Employee arrives] --> B[Scan QR Check-In]
    B --> C[attendance record created]
    C --> D{Late?}
    D -->|Yes| E[Delay recorded in delays table]
    D -->|No| F[Normal attendance]
    E --> F
    F --> G[Employee leaves → Scan QR Check-Out]
    G --> H[attendance.check_out updated]
    H --> I[Work hours calculated]
```

**Permissions Required:**
- Employee: `scan-checkin.view`, `scan-checkout.view`
- HR: `attendance.view`, `attendance.export`

## 6. Employee Offboarding Workflow

```mermaid
flowchart TD
    A[HR initiates offboarding] --> B[Offboarding record created]
    B --> C[Collect assets]
    C --> D[Calculate final settlement]
    D --> E[Process final payment]
    E --> F[User status → inactive]
    F --> G[Permissions cleaned up automatically]
    G --> H[Login disabled]
```

**Permissions Required:**
- HR: `offboarding.view`, `offboarding.create`, `offboarding.edit`
- Finance: `payroll.create` (final settlement)

## 7. Permission Change Workflow

```mermaid
flowchart TD
    A[Owner/HR opens Screen Permissions] --> B[Select user or role]
    B --> C[View current permissions grid]
    C --> D[Modify permissions checkboxes]
    D --> E[Click Save Permissions]
    E --> F[Validate → Delete old → Insert new]
    F --> G[Audit log entry created]
    G --> H[Supabase Realtime broadcasts change]
    H --> I[Target user's session updated]
    I --> J[Sidebar + Dashboard rebuild]
```

## 8. Sales Order Workflow

```mermaid
flowchart TD
    A[Sales creates order] --> B[Order Status: New]
    B --> C{Customer confirms?}
    C -->|Yes| D[Status: Confirmed]
    C -->|No| E[Status: Cancelled]
    D --> F[Production order created]
    F --> G[Inventory reserved]
    G --> H[Production complete]
    H --> I[QC inspection]
    I --> J{Pass?}
    J -->|Yes| K[Delivery arranged]
    J -->|No| L[Rework]
    K --> M[Invoice generated]
    M --> N[Payment received]
    N --> O[Status: Complete]
```

**Permissions Required:**
- Sales: `erp-sales.view`, `erp-sales.create`, `erp-sales.edit`
- Production: `erp-production.create`
- QC: `erp-quality.create`
- Finance: `petty-cash.create`

## 9. Production Workflow

```mermaid
flowchart TD
    A[Planning creates production order] --> B[BOM calculated]
    B --> C[Raw materials reserved from warehouse]
    C --> D[Production starts]
    D --> E[Stage 1: Mixing/Preparation]
    E --> F[Stage 2: Processing]
    F --> G[Stage 3: Finishing]
    G --> H[QC Inspection]
    H --> I{Pass?}
    I -->|Yes| J[Batch created → Finished goods warehouse]
    I -->|No| K[Rework or Waste]
```

## 10. Login → Dashboard Flow

```mermaid
flowchart TD
    A[User enters credentials] --> B{Auth check}
    B -->|Fail| C[Error message + login_history logged]
    B -->|Success| D[Load user data]
    D --> E[Load preferred_language]
    E --> F[Apply RTL/LTR direction]
    F --> G[SecurityHelpers.loadPermissions]
    G --> H[PermissionGuard initialized]
    H --> I[Build sidebar from permissions]
    I --> J[Build dashboard cards from permissions]
    J --> K[AI modules initialized]
    K --> L[Realtime subscriptions started]
    L --> M[User sees authorized content only]
```
