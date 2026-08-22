# Enterprise Security & Dynamic RBAC System

## Overview
The system implements a multi-layered Role-Based Access Control (RBAC) engine configured in `js/security-helpers.js` and backed by the `screen_permissions` table in Supabase PostgreSQL.

## Core Security Helper (`SecurityHelpers`)
- `SecurityHelpers.loadPermissions()`: Fetches active permissions for `App.user.id` or `App.user.role`.
- `SecurityHelpers.hasPermission(screenId, action)`: Verifies authorization for `view`, `create`, `edit`, `delete`, `approve`, `export`.

## Action Button UI Policy
When an authorized user views a module screen:
- **Authorized Actions**: Buttons (Add, Edit, Delete, Export) render with full interactivity.
- **Unauthorized Actions**: Buttons render in a dimmed, disabled state with a tooltip (`title="Requires Permission"`).
- **Owner Role**: Users with `role === 'owner'` bypass permission checks and receive full administrative privileges across all modules.

## Permission Fallbacks & Defaults
If `screen_permissions` table is unreachable, `SecurityHelpers` falls back to default role matrices:
- `admin / hr`: Full access to HR, ATS, Attendance, Payroll, and Admin screens.
- `accountant / finance`: Access to Finance, Treasury, Cost Centers, and Payroll disbursement.
- `warehouse`: Access to Inventory, Stock movements, Goods receiving, and Deliveries.
- `sales`: Access to Sales Orders, Quotes, Customer Catalog, and Product specs.
- `production / engineer`: Access to Planning, Work Orders, Engineering, Quality, and Maintenance.
