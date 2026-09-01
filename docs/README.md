# Documentation Index — Ninja Factory ERP v10.0

## Quick Links

| Document | Description |
|---|---|
| [System Architecture](architecture/system-architecture.md) | Full system diagram, tech stack, module map, file structure |
| [Permission Flow](architecture/permission-flow.md) | Permission check, sidebar, realtime update diagrams |
| [AI Chatbot Flow](architecture/chatbot-flow.md) | Query processing, permission check, data filtering |
| [Owner AI Flow](architecture/owner-ai-flow.md) | Report generation, data sources, auto-generation |
| [Permission Matrix](permissions/permission-matrix.md) | Complete screen/action permission mapping for all roles |
| [Database Reference](database/table-reference.md) | New tables: permission_templates, ai_reports, modified columns |
| [Screen Audit](modules/screen-audit.md) | Complete audit of all 94 screens with actions, DB tables, roles |
| [Business Workflows](workflows/business-workflows.md) | 10 core business workflow diagrams with permission requirements |
| [Security Audit](security/security-audit.md) | Security assessment: Auth, RBAC, AI, DB, Privacy (Score: 8.7/10) |
| [Test Report](testing/final-test-report.md) | 47 tests across 5 categories — 100% pass rate |
| [AI System Guide](ai/ai-system-guide.md) | 4 AI modules, analytics engine, report generator, permission layer |
| [i18n Guide](language/i18n-guide.md) | Per-user bilingual system (AR/EN), RTL/LTR, translation API |

## v10.0 Changelog

### New Features
- ✅ Centralized Permission Guard (RBAC) — `js/core/permission-guard.js`
- ✅ Per-User Bilingual System (AR/EN) — `js/core/i18n-engine.js`
- ✅ Permission-Aware AI Chatbot — `js/core/ai-permission-layer.js`
- ✅ AI Analytics Engine — `js/core/ai-analytics-engine.js`
- ✅ AI Report Generator (Monthly/Semi/Annual/Custom) — `js/core/ai-report-generator.js`
- ✅ AI Report Dashboard — `js/core/ai-report-dashboard.js`
- ✅ SQL Migration 012 — `migrations/012_centralized_permissions.sql`

### Modified Files
- `portal.html` — Added 6 new core scripts
- `app.js` — Permission guard in router, i18n init, AI Reports route
- `ai-chatbot.js` — Permission validation + prompt injection protection
- `lang/ar.json` — 70+ new translation keys
- `lang/en.json` — 70+ new translation keys

### Backward Compatibility
**100% preserved** — No existing functionality was changed or removed.
