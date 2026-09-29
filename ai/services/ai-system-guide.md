# AI System Guide — Ninja Factory ERP

## AI Components

The ERP system has **4 AI modules** working together:

### 1. Employee Chatbot (`chatbot.js`)
- **Purpose:** FAQ assistant for employees
- **Access:** All users
- **Features:** Predefined Q&A about HR policies, leave balance, salary questions

### 2. AI ERP Chatbot (`ai-chatbot.js`) ★ Permission-Aware
- **Purpose:** Enterprise intelligence assistant
- **Access:** Based on user permissions
- **Features:**
  - Financial analysis (revenue, expenses, profit)
  - Employee performance analysis
  - Inventory status
  - Supplier evaluation
  - Cash flow forecasting
  - Fraud detection
- **Security:** All queries pass through `AIPermissionLayer` before data access

### 3. AI Mind (`ai-mind.js`)
- **Purpose:** HR-focused analytics with risk scoring
- **Access:** HR Manager + Owner
- **Features:**
  - Employee risk assessment
  - Attendance pattern analysis
  - Resignation prediction
  - Performance scoring

### 4. AI ERP Brain (`ai-erp-brain.js`)
- **Purpose:** Cross-module data aggregation
- **Access:** Used internally by other AI components
- **Features:**
  - Fetches data from all 14 tables simultaneously
  - Financial analysis, supplier ranking, warehouse analysis
  - Production efficiency, quality pass rates
  - Fraud detection, cash flow forecasting

## NEW: AI Analytics Engine (`js/core/ai-analytics-engine.js`)

Comprehensive analytics with date-range support:

- **Employee Movement:** New hires, departures, turnover rate, department distribution
- **Attendance Analysis:** Present/late/absent counts, worst late employees, daily patterns
- **Login & Activity:** Login counts, active users, most used screens, hourly distribution
- **Department Analysis:** Per-department KPIs with scoring (0-100)
- **Financial Summary:** Payroll costs, active loans
- **AI Recommendations:** Auto-generated based on data thresholds
- **Anomaly Detection:** Pattern detection for unusual behavior

## NEW: AI Report Generator (`js/core/ai-report-generator.js`)

Generates and stores reports:

| Report Type | Period | Auto-Generate |
|---|---|---|
| Monthly | Single month | Yes (on owner login) |
| Semiannual | H1 (Jan-Jun) or H2 (Jul-Dec) | No |
| Annual | Full year | No |
| Custom | Any date range | No |

Reports are stored in `ai_reports` table with full JSONB content.

## NEW: AI Permission Layer (`js/core/ai-permission-layer.js`)

Security layer that enforces RBAC on all AI operations:

```
User Query → sanitizeQuery() → validateQuery() → filterData() → AI Process → Response
     │              │                │                │
     │         Remove prompt     Check if user     Strip data from
     │         injection         has permission     unauthorized
     │         patterns          for requested      modules
     │                           modules
```

### Prompt Injection Protection

The following patterns are automatically filtered:
- "ignore previous instructions"
- "disregard all previous"
- "pretend you are"
- "bypass permission/security"
- Arabic equivalents ("تجاهل التعليمات", "تجاوز الصلاحيات")

### Permission Mapping

Each AI tool/intent is mapped to required screen permissions:

| AI Intent | Required Screen |
|---|---|
| Employee data | `employees` |
| Salary/Payroll | `payroll` |
| Attendance | `attendance` |
| Inventory | `inventory` |
| Sales | `erp-sales` |
| Full analysis | `owner-dashboard` |

## Bilingual AI Responses

- AI detects user's `preferred_language` from their profile
- Arabic users receive Arabic responses
- English users receive English responses
- Both Arabic and English queries are understood regardless of language setting
