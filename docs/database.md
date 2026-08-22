# Database Schema & Migrations Reference

## Core Database Tables
The system operates on over 145 relational PostgreSQL tables hosted on Supabase:

- **Users & Auth**: `users`, `screen_permissions`, `audit_log`, `login_history`
- **HR & Workforce**: `employees`, `attendance`, `leave_requests`, `payroll_records`, `loans`, `medical_requests`, `warnings`, `performance_reviews`
- **Finance**: `safes`, `bank_accounts`, `petty_cash`, `journal_entries`, `taxes`, `fixed_assets`, `checks`
- **Supply Chain**: `suppliers`, `purchase_requests`, `inventory_items`, `stock_movements`, `gate_logs`, `logistics_orders`, `fleet_vehicles`
- **Manufacturing**: `bom_templates`, `production_orders`, `quality_inspections`, `maintenance_tickets`, `spare_parts`, `engineering_drawings`
- **Sales & Catalog**: `sales_orders`, `customers`, `products`, `quotations`

## Migration Execution Order
1. `001_enterprise_security.sql` — RLS policies, audit logging, session guards
2. `002_enterprise_multi.sql` — Multi-branch, multi-warehouse tables
3. `003_enterprise_features.sql` — Medical, loans, attendance extensions
4. `004_enterprise_kpis_views.sql` — Financial reporting and performance aggregation views
5. `005_enterprise_extra.sql` — Supplier portals and driver cost workflows
6. `006_public_product_catalog.sql` — B2B public catalog and order sync triggers
7. `007_client_auth.sql` — Customer portal authentication
8. `007_premium_ats.sql` — Resume parsing and ATS tables
9. `008_manufacturing_equipment.sql` — Production lines, equipment rentals, machinery maintenance
10. `009_password_encryption.sql` — Password hashing functions
11. `010_bilingual_chat.sql` — Bilingual internal messaging tables
12. `011_screen_permissions.sql` — Dynamic database RBAC screen permission tables
