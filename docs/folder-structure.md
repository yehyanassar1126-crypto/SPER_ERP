# Enterprise ERP Folder Structure & Module Catalog

```
HR portal/
├── docs/                        # Architectural & System Documentation
│   ├── architecture.md          # System Architecture & Flowchart
│   ├── folder-structure.md      # Directory Structure Catalog
│   ├── modules.md               # ERP Modules Detailed Reference
│   ├── permissions.md           # Security & RBAC System Documentation
│   ├── ai.md                    # AI Assistant & Chatbot Documentation
│   └── database.md              # Database Schema & Migration Catalog
│
├── js/                          # Core JavaScript Application Modules
│   ├── core/                    # System Framework & Engine
│   │   ├── app.js               # Main SPA Controller & Lifecycle
│   │   ├── config.js            # Environment Configuration
│   │   ├── constants.js         # System Constants & Enumerations
│   │   ├── helpers.js           # Reusable Utility Functions
│   │   ├── icons.js             # SVG Icon Renderer
│   │   ├── security-helpers.js  # Permission & RBAC Logic
│   │   ├── supabaseClient.js    # Supabase Data Access Layer
│   │   └── translations.js      # Bilingual Dictionary
│   │
│   ├── modules/                 # Self-Contained Domain Modules
│   │   ├── hr/                  # HR, Attendance, Payroll, ATS, Medical
│   │   ├── finance/             # Finance, Treasury, Cost Centers
│   │   ├── supply-chain/        # Procurement, Inventory, Fleet, Logistics
│   │   ├── manufacturing/       # Production, Quality, Maintenance, Engineering
│   │   ├── sales/               # Sales CRM & Customer Catalog
│   │   ├── ai/                  # AI Mind, Chatbot, AI CEO Dashboard
│   │   └── admin/               # System Admin, UX, Workplaces & Reports
│
├── css/                         # Enterprise Styling System
│   ├── styles.css               # Main Dashboard Theme
│   ├── enterprise-ux.css        # Enterprise Grid & Modal Styling
│   ├── ai-mind.css              # AI Interface Styling
│   └── ai-erp.css               # Responsive Layout Adaptations
│
├── migrations/                  # PostgreSQL Migration Scripts
│   ├── 001_enterprise_security.sql
│   ├── 002_enterprise_multi.sql
│   ├── 003_enterprise_features.sql
│   ├── 004_enterprise_kpis_views.sql
│   ├── 005_enterprise_extra.sql
│   ├── 006_public_product_catalog.sql
│   ├── 007_client_auth.sql
│   ├── 007_premium_ats.sql
│   ├── 008_manufacturing_equipment.sql
│   ├── 009_password_encryption.sql
│   ├── 010_bilingual_chat.sql
│   └── 011_screen_permissions.sql
│
├── public/                      # Static Assets & Public Logos
├── scratch/                     # Administrative & One-off Utility Scripts
└── portal.html                  # Main Enterprise Portal Entrypoint
```
