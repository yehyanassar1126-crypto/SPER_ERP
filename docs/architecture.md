# Enterprise ERP System Architecture

## Overview
The Smart Factory HR & Enterprise Resource Planning (ERP) System is built as a highly modular, real-time, bilingual (Arabic/English) enterprise application.

```mermaid
graph TD
  Client[Web Frontend / Single Page App] --> AppCore[Core App Controller - js/app.js]
  AppCore --> Security[Security & RBAC - js/security-helpers.js]
  AppCore --> Modules[Enterprise ERP Modules]
  AppCore --> Supabase[Supabase Realtime Client - js/supabaseClient.js]
  
  subgraph Modules [ERP Departmental Modules]
    HR[HR & ATS Module]
    FIN[Finance & Treasury]
    SCM[Procurement & Inventory]
    PRD[Production & Planning]
    MAINT[Maintenance & Quality]
    AI[AI Mind & Chatbot]
  end

  Supabase --> Postgres[(Supabase PostgreSQL Database)]
```

## Architectural Layers
1. **Presentation & UI Layer**: Standard HTML5, CSS3, Vanilla JS, and Chart.js components.
2. **Controller & Router**: SPA Navigation driven by `App.navigate(page)` and dynamic view rendering.
3. **Domain Modules Layer**: Self-contained module files handling business rules for HR, Finance, Procurement, Production, Quality, Logistics, Fleet, and Maintenance.
4. **Security & Permission Layer**: Dynamic database-backed RBAC with per-screen view, add, edit, and delete permissions (`SecurityHelpers.hasPermission`).
5. **Data & Persistence Layer**: Supabase Client managing PostgreSQL database queries, authentication, storage, and realtime subscriptions.
