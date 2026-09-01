# Ninja Factory ERP System — Architecture Documentation

## System Overview

Enterprise Resource Planning (ERP) system built with **Vanilla JavaScript** frontend and **Supabase** (PostgreSQL) backend. The system manages 15+ departments across HR, Finance, Operations, and Administration.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES5 compatible), HTML5, CSS3 |
| Backend | Supabase (PostgreSQL + REST API + Realtime) |
| Charts | Chart.js v4 |
| QR | QRCode.js + HTML5-QRCode (scanner) |
| Excel | SheetJS (xlsx) |
| PDF | PDF.js for CV parsing |
| Auth | Custom auth via `users` table |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (SPA)                             │
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │ portal   │  │  app.js      │  │  Module Scripts (51 files) │  │
│  │ .html    │──│  (Router +   │──│  HR, Finance, Sales,       │  │
│  │          │  │   Controller)│  │  Production, Quality, etc. │  │
│  └──────────┘  └──────────────┘  └────────────────────────────┘  │
│       │              │                        │                    │
│  ┌────┴──────────────┴────────────────────────┴──────────────┐   │
│  │                    CORE FRAMEWORK (v10.0)                  │   │
│  │                                                            │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ PermissionGuard  │  │ I18nEngine   │  │ AIPermission │  │   │
│  │  │ (RBAC Layer)     │  │ (AR/EN i18n) │  │ Layer        │  │   │
│  │  └─────────────────┘  └──────────────┘  └──────────────┘  │   │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ AIAnalytics      │  │ AIReport     │  │ AIReport     │  │   │
│  │  │ Engine           │  │ Generator    │  │ Dashboard    │  │   │
│  │  └─────────────────┘  └──────────────┘  └──────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│       │              │                        │                    │
│  ┌────┴──────────────┴────────────────────────┴──────────────┐   │
│  │                  SECURITY LAYER                            │   │
│  │  SecurityHelpers  │  screen_permissions  │  audit_log      │   │
│  └────────────────────────────────────────────────────────────┘   │
│       │                                                           │
│  ┌────┴──────────────────────────────────────────────────────┐   │
│  │                  AI LAYER                                  │   │
│  │  AIChatbot │ AIMind │ AIBrain │ EmployeeChatbot           │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────────┘
                                │ HTTPS (REST + Realtime WebSocket)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ PostgreSQL   │  │ REST API     │  │ Realtime               │  │
│  │ (170+ tables)│  │ (Auto CRUD)  │  │ (notifications,        │  │
│  │              │  │              │  │  permissions)           │  │
│  └──────────────┘  └──────────────┘  └────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │ RLS Policies │  │ Triggers &   │                              │
│  │ (per-table)  │  │ Functions    │                              │
│  └──────────────┘  └──────────────┘                              │
└───────────────────────────────────────────────────────────────────┘
```

## Module Map

### HR Department (20 screens)
- Employee Management, Attendance, Leaves, Shifts, Overtime
- Payroll, Recruitment, Documents, Performance, Uniforms
- Medical, Loans, Expenses, Complaints, Offboarding
- QR Check-in/out, Training, Warnings, Asset Assignment

### Finance Department (12 screens)
- Financial Suite (Treasury, AP/AR), Payroll Funding
- Chart of Accounts, Journal Engine, Bank Management
- Checks Lifecycle, Loans & Taxes, Budgets, Fixed Assets
- AI CFO, Closing & Audit, Professional Reports

### Operations (15 screens)
- Sales, Products Catalog, Customer Requests
- Purchase Requests, Inventory/Warehouse
- Production, Planning, BOM, Quality Control
- Engineering, Maintenance, Equipment, Fleet, Logistics

### Administration (10 screens)
- System Settings, KPI Dashboard, Audit Log
- Login History, Activity Log, IT Tickets
- Legal Affairs, Global Search, Notifications, Permissions

### Enterprise Control — Owner Only (6 screens)
- Owner Dashboard, CEO Dashboard, AI CEO Dashboard
- Cost Centers, Activity Timeline, **AI Reports**

## Security Architecture

```
User Login → SecurityHelpers.loadPermissions() → PermissionGuard.init()
    │
    ▼
Sidebar Rendering → PermissionGuard.canView(screenId) → Show/Hide
    │
    ▼
Page Navigation → PermissionGuard.canView(screenId) → Render / Access Denied
    │
    ▼
Action Buttons → PermissionGuard.canAction(screenId, action) → Enable/Disable
    │
    ▼
AI Chatbot → AIPermissionLayer.validateQuery() → Allow / Deny
    │
    ▼
Data Fetch → AIPermissionLayer.filterData() → Strip unauthorized modules
```

## File Structure

```
HR Portal/
├── portal.html                    # Main SPA entry point
├── css/                           # Stylesheets
├── lang/                          # Translation files (ar.json, en.json)
├── migrations/                    # SQL migration files (001-012)
├── public/                        # Static assets
├── docs/                          # Documentation
└── js/
    ├── core/                      # ★ NEW Core Framework
    │   ├── permission-guard.js    # Centralized RBAC
    │   ├── i18n-engine.js         # Per-user bilingual system
    │   ├── ai-permission-layer.js # AI data access control
    │   ├── ai-analytics-engine.js # Comprehensive analytics
    │   ├── ai-report-generator.js # Report generation
    │   └── ai-report-dashboard.js # Report UI
    ├── config.js                  # Supabase config
    ├── app.js                     # Main controller (5200+ lines)
    ├── security-helpers.js        # Auth & permission helpers
    ├── ai-chatbot.js              # Premium AI chatbot
    ├── ai-mind.js                 # HR AI analytics
    ├── ai-erp-brain.js            # Cross-module AI brain
    ├── i18n.js                    # Legacy i18n
    ├── translations.js            # Arabic dictionary
    └── [40+ module files]         # Individual module scripts
```
