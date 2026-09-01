# 🏭 Ninja Factory — Enterprise ERP System

> AI-Powered, Bilingual (Arabic/English), Manufacturing ERP built with Supabase + JavaScript

## 🎯 Overview

Ninja Factory ERP is a comprehensive enterprise resource planning system designed for **polymer manufacturing** operations. It provides end-to-end management of HR, Finance, Production, Quality, Maintenance, Procurement, Inventory, Sales, and AI-powered business intelligence.

## 🏗️ Architecture

```
Frontend:   Vanilla JS + CSS (Single Page Application)
Backend:    Supabase (PostgreSQL + Auth + Realtime + Storage)
AI Engine:  Custom AI Brain (analytics, chatbot, recommendations)
Languages:  Arabic (RTL) + English (LTR)
```

## 📋 Modules (20+ Departments)

| Module | Description | Status |
|--------|------------|--------|
| 👥 HR & People | Employees, Attendance, Leaves, Payroll, Medical, Performance | ✅ |
| 💰 Finance | GL, Treasury, Banks, Checks, Cost Centers, Budgets | ✅ |
| 🏭 Production | Orders, BOM, Manufacturing Stages, Batch Tracking | ✅ |
| 🔬 Quality | QC Inspections, Pass/Fail, Defect Tracking | ✅ |
| 📦 Inventory | Stock, Low Stock Alerts, Movements, Transfers | ✅ |
| 🛒 Procurement | Purchase Requests, Supplier Orders, Settlements | ✅ |
| 🏢 Suppliers | Management, Portal, Performance Rating (AI) | ✅ |
| 🛠️ Maintenance | Facilities, Companies, Visits, Payments | ✅ |
| 🏗️ Equipment | Registry, Rental, Tracking, Categories | ✅ |
| 🔧 Spare Parts | Lifecycle, Inspection, Returns | ✅ |
| 📊 Sales | Orders, Clients, Customer Portal, Catalog | ✅ |
| 🚛 Logistics | Fleet, Drivers, Routes, Payments | ✅ |
| ⚙️ Engineering | Projects, Designs, Technical Office | ✅ |
| ⚖️ Legal | Cases, Contracts, Compliance | ✅ |
| 🤖 AI | Chatbot, Analytics, Fraud Detection, Recommendations | ✅ |
| 🔐 Security | Permissions, Audit Log, Login History, RLS | ✅ |
| 🔍 Search | Global Search across all modules | ✅ |
| 🔗 Traceability | Batch → Material → Supplier tracking | ✅ |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase Account

### Installation

```bash
git clone https://github.com/yehyanassar1126-crypto/HR_system.git
cd HR_system
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup

Run migrations in order in Supabase SQL Editor:

```
migrations/001_enterprise_security.sql
migrations/002_enterprise_multi.sql
migrations/003_enterprise_features.sql
migrations/004_enterprise_fleet.sql
migrations/005_enterprise_extended.sql
migrations/006_public_product_catalog.sql
migrations/007_client_auth.sql
migrations/008_manufacturing_equipment.sql
migrations/009_password_encryption.sql
```

### Run Locally

Open `portal.html` in a browser or use Live Server.

## 🔐 Security & Permission System (v10.0)

### Centralized Authorization Architecture

```
User → Role → Permissions → Module → Screen → Action → Allow/Deny
```

- **Permission Guard** (`js/core/permission-guard.js`) — Central RBAC middleware
- **Screen Authorization** — `canView(screenId)` before every page render
- **Action Authorization** — `canAction(screenId, action)` on every button
- **Dynamic Sidebar** — Filtered by `PermissionGuard.getAuthorizedScreens()`
- **Dynamic Dashboard** — Cards/Widgets filtered by user permissions
- **AI Security** — `AIPermissionLayer` prevents data leakage via chatbot
- **Real-time Updates** — Permission changes broadcast via Supabase Realtime

### Permission Check Flow

```
Sidebar → PermissionGuard.canView() → Show/Hide
Page Nav → PermissionGuard.canView() → Render / Access Denied
Buttons → PermissionGuard.canAction() → Enable / Disable
AI Chat → AIPermissionLayer.validateQuery() → Allow / Deny
Database → Supabase RLS → Allow / Block
```

### Owner Full Access
Owner role has complete system access through the permission system (not bypassing it).

### Permission Management Page
- Module-grouped permission grid
- Bulk actions: Grant All HR / Ops / Finance / Admin / ALL / Revoke ALL
- Copy from Role Template (loads from `permission_templates` table)
- Auto-apply templates on new user creation
- Audit trail for all permission changes

## 🤖 AI Features

- **Business Chatbot** — Permission-aware, Ask questions in Arabic or English
- **Voice Commands** — Speech-to-text input
- **Navigation** — "افتح المخازن" opens Inventory
- **Action Execution** — "اعمل طلب شراء 100 KG" creates PR
- **Fraud Detection** — Duplicate payments, suspicious patterns
- **Supplier Recommendations** — AI-powered supplier scoring
- **Cash Flow Forecasting** — 30/60/90 day projections
- **AI Analytics Engine** — Employee, Attendance, Login, Department analytics
- **AI Reports** — Monthly / Semiannual / Annual / Custom AI-generated reports
- **Prompt Injection Protection** — Sanitizes dangerous patterns

## 🌐 Bilingual Support (Per-User)

- Full Arabic (RTL) + English (LTR) per user
- 900+ translation keys + 130+ new i18n keys
- Language saved to DB (`users.preferred_language`)
- Auto RTL/LTR direction switching
- I18nEngine with `t()`, `formatNumber()`, `formatCurrency()`, `formatDate()`

## 📁 Project Structure

```
├── portal.html                    # Main SPA entry point
├── customer_auth.html             # Supplier login portal
├── public_catalog.html            # Public product catalog
├── js/
│   ├── core/                      # ★ Core Framework (v10.0)
│   │   ├── permission-guard.js    # Centralized RBAC
│   │   ├── i18n-engine.js         # Per-user bilingual system
│   │   ├── ai-permission-layer.js # AI data access control
│   │   ├── ai-analytics-engine.js # Comprehensive analytics
│   │   ├── ai-report-generator.js # Report generation
│   │   └── ai-report-dashboard.js # Report UI
│   ├── app.js                     # Main controller & router (5300+ lines)
│   ├── config.js                  # Supabase config
│   ├── security-helpers.js        # Auth & permission helpers
│   ├── erp-permissions.js         # Permission management UI
│   ├── ai-chatbot.js              # AI chatbot (permission-aware)
│   ├── ai-mind.js                 # AI brain analytics
│   ├── ai-erp-brain.js            # Cross-module AI brain
│   ├── translations.js            # Arabic dictionary (700+ keys)
│   └── ... (40+ module files)
├── css/                           # Stylesheets
├── lang/                          # Translation files (ar.json, en.json)
├── migrations/                    # SQL migrations (001-012)
├── docs/                          # Complete documentation
│   ├── README.md                  # Documentation index
│   ├── architecture/              # System diagrams & flows
│   ├── permissions/               # Permission matrix
│   ├── database/                  # Table reference
│   ├── modules/                   # Screen audit (94 screens)
│   ├── workflows/                 # Business workflows (10 flows)
│   ├── security/                  # Security audit (8.7/10)
│   ├── testing/                   # Test report (47/47 pass)
│   ├── ai/                        # AI system guide
│   └── language/                  # i18n guide
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## 📊 Database

- **170+ tables** across 17 departments
- PostgreSQL via Supabase
- UUID primary keys
- Full foreign key relationships
- Indexed for performance

### Database Setup

Run migrations in order in Supabase SQL Editor:

```
migrations/001_enterprise_security.sql
migrations/002_enterprise_multi.sql
migrations/003_enterprise_features.sql
migrations/004_enterprise_fleet.sql
migrations/005_enterprise_extended.sql
migrations/006_public_product_catalog.sql
migrations/007_client_auth.sql
migrations/008_manufacturing_equipment.sql
migrations/009_password_encryption.sql
migrations/010_*.sql (if exists)
migrations/011_*.sql (if exists)
migrations/012_centralized_permissions.sql    ← Permission System
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase Account

### Installation

```bash
git clone https://github.com/yehyanassar1126-crypto/HR_system.git
cd HR_system
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BREVO_API_KEY=your_brevo_api_key
```

> ⚠️ **Never commit `.env` to Git.** The `.gitignore` already excludes it.

### Run Locally

Open `portal.html` in a browser or use Live Server.

## 👥 User Roles

Owner, HR Manager, Department Head, Hall Manager, Employee,
Accounts Manager, Procurement Manager, Warehouse Manager,
Production Manager, Quality Manager, Maintenance Manager,
Engineering Manager, Sales Manager, Logistics Manager,
IT Admin, Driver, Spare Parts Inspector, Nurse

## 📚 Documentation

See [`docs/README.md`](docs/README.md) for the complete documentation index including:
- System Architecture diagrams
- Permission Matrix (94 screens × 8 actions)
- Security Audit Report
- Complete Test Report
- AI System Guide
- Business Workflow diagrams
- Database Reference

## 📄 License

Private — Ninja Polymer Factory © 2025-2026
