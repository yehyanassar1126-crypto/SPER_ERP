# Enterprise ERP Module Directory & Domain Map

## 1. Human Resources (HR Suite)
- **Employee Directory (`js/enterprise-modules.js`)**: Full employee lifecycle management, department tagging, and profile management.
- **Attendance & Shifts (`js/hr-absence.js`)**: Time tracking, QR code check-in/out, automated late penalty deductions, and shift scheduling.
- **Enterprise Payroll (`js/erp-payroll-enterprise.js`)**: Salary disbursement, allowances, deductions, bank account releases, and automated pay slips.
- **Loans & Advances (`js/loans.js`)**: Staff loan requests, installment scheduling, and payroll deduction integration.
- **Medical Needs (`js/medical.js`)**: Medical receipt approvals (Nursing -> Manager -> HR -> Payroll).
- **AI ATS Engine (`js/hr-ats-premium.js`)**: PDF resume text extraction, AI skill matching, scoring, and candidate pipeline tracking.

## 2. Financial Management
- **Enterprise Treasury & Accounting (`js/enterprise-finance.js`)**: Safe balances, bank accounts, fund transfers, petty cash, check issuance, and automated journal entries.
- **Cost Centers (`js/erp-cost-centers.js`)**: Departmental cost allocation and budget monitoring.
- **Driver Payments (`js/fin-driver-payments.js`)**: Fleet delivery settlements, expense verification, and driver allowances.

## 3. Supply Chain & Logistics
- **Procurement & Suppliers (`js/erp-suppliers.js`)**: Purchase requests, RFQs, vendor management, purchase orders, and goods receiving.
- **Inventory & Warehouse (`js/enterprise-modules.js`)**: Stock monitoring, finished goods warehouse, raw material movements, and stock reconciliations.
- **Logistics & Fleet (`js/erp-logistics.js`, `js/erp-fleet.js`)**: Vehicle tracking, odometer records, fuel consumption, driver assignment, and delivery orders.
- **Spare Parts Management (`js/erp-spare-parts.js`)**: Spare parts tracking, worn-out part inspection, engineering consumption reports.

## 4. Production & Manufacturing
- **Planning & Execution (`js/erp-planning.js`, `js/erp-production.js`, `js/erp-manufacturing.js`)**: Bill of Materials (BOM), work orders, material availability checks, and machine allocation.
- **Quality Control (`js/erp-quality.js`)**: Incoming raw material inspection and finished goods compliance verification.
- **Maintenance & Equipment (`js/erp-maintenance.js`, `js/erp-equipment.js`)**: Machinery breakdown tickets, preventive maintenance schedules, and equipment rentals.

## 5. Sales & Customer Portal
- **Sales Orders (`js/erp-sales.js`)**: Customer quote generation, sales order tracking, stock allocation, and invoice creation.
- **Public Catalog (`js/public-catalog.js`)**: B2B product showcase, price inquiries, and online purchase requests.

## 6. Intelligence & AI Suite
- **AI Mind (`js/ai-mind.js`)**: Predictive system metrics, dynamic anomaly detection, and operational insights.
- **CEO Dashboard (`js/ai-ceo-dashboard.js`)**: High-level cross-departmental executive overview for the Owner role.
- **AI Chatbot (`js/chatbot.js`, `js/ai-chatbot.js`)**: Permission-aware virtual assistant for employee query resolution.
