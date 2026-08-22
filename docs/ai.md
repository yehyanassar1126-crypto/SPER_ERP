# AI Intelligence & Chatbot Engine

## Components
1. **AI Mind (`js/ai-mind.js`)**: Realtime anomaly detection, operational metrics prediction, and automated alerts for inventory shortages or attendance delays.
2. **AI Resume Screening (ATS) (`js/hr-ats-premium.js`)**: PDF parsing using PDF.js, skill matching algorithms, candidate scoring (0-100%), and recruitment workflow management.
3. **CEO AI Dashboard (`js/ai-ceo-dashboard.js`)**: Executive intelligence hub providing automated business recommendations for company leadership.
4. **Employee AI Assistant (`js/chatbot.js`)**: Realtime interactive chatbot providing instant answers for leave balances, salary breakdown, attendance rules, IT support, and workflows.

## Permission-Aware Chatbot Security
The chatbot enforces RBAC boundary checks:
- **Finance Queries**: Verified against `SecurityHelpers.hasPermission('finance', 'view')`.
- **Inventory Queries**: Verified against `SecurityHelpers.hasPermission('inventory', 'view')`.
- **Production Queries**: Verified against `SecurityHelpers.hasPermission('erp-production', 'view')`.
- **Sales Queries**: Verified against `SecurityHelpers.hasPermission('erp-sales', 'view')`.
- **HR/ATS Queries**: Verified against `SecurityHelpers.hasPermission('hr-admin', 'view')`.

If a user lacks permission for a queried domain, the AI Chatbot responds with a clear permission boundary notice:
`🔒 عفواً، الإجابة عن استفسارات هذا الموديول تتطلب الصلاحيات الخاصة بك.`
