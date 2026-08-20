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

## 🔐 Security

- **Row Level Security (RLS)** on all sensitive tables
- **bcrypt password hashing** via pgcrypto
- **Permission-based access** (User > Role > Department)
- **Audit Trail** for all critical operations
- **No secrets in frontend** — all keys server-side

## 🤖 AI Features

- **Business Chatbot** — Ask questions in Arabic or English
- **Voice Commands** — Speech-to-text input
- **Navigation** — "افتح المخازن" opens Inventory
- **Action Execution** — "اعمل طلب شراء 100 KG" creates PR
- **Fraud Detection** — Duplicate payments, suspicious patterns
- **Supplier Recommendations** — AI-powered supplier scoring
- **Cash Flow Forecasting** — 30/60/90 day projections

## 🌐 Bilingual Support

- Full Arabic (RTL) + English (LTR)
- 900+ translation keys
- Auto-direction switching
- Language persists across sessions

## 📁 Project Structure

```
├── portal.html              # Main entry point
├── customer_auth.html       # Supplier login portal
├── public_catalog.html      # Public product catalog
├── js/
│   ├── app.js               # Main controller & router
│   ├── supabaseClient.js    # Supabase initialization
│   ├── translations.js      # i18n dictionary
│   ├── ai-chatbot.js        # AI chatbot engine
│   ├── ai-mind.js           # AI brain analytics
│   ├── erp-manufacturing.js # BOM + stages
│   ├── erp-equipment.js     # Equipment + rental
│   ├── erp-global-search.js # Cross-module search
│   ├── erp-permissions.js   # Permission management
│   ├── enterprise-modules.js # Core ERP modules
│   └── ... (30+ module files)
├── css/
│   ├── styles.css           # Main stylesheet
│   ├── ai-mind.css          # AI interface styles
│   └── enterprise-ux.css    # Enterprise UX
├── migrations/              # SQL migrations (001-009)
└── scratch/                 # Development scripts
```

## 📊 Database

- **161 tables** across 17 departments
- PostgreSQL via Supabase
- UUID primary keys
- Full foreign key relationships
- Indexed for performance

## 👥 User Roles

Owner, HR Manager, Department Head, Hall Manager, Employee,
Accounts Manager, Procurement Manager, Warehouse Manager,
Production Manager, Quality Manager, Maintenance Manager,
Engineering Manager, Sales Manager, Logistics Manager,
IT Admin, Driver, Spare Parts Inspector, Nurse

## 📄 License

Private — Ninja Polymer Factory © 2025-2026
