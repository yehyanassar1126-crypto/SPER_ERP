// =============================================
// ERP Screen Permission Management (Centralized ACL)
// Ninja Smart Factory ERP - Enterprise Grade
// =============================================
var ERPPermissions = {

  // Module-grouped screens for enterprise organization
  moduleGroups: {
    'Self Service (بياناتي)': [
      'dashboard','hr-personal','my-attendance','scan-checkin','scan-checkout',
      'my-leaves','my-salary','my-overtime','my-loans','my-medical','my-delays',
      'my-missions','my-expenses','complaints'
    ],
    'Workplace (مكان العمل والتواصل)': [
      'announcements','internal-chat','shift-swap','calendar','task-management',
      'org-directory','ai-mind'
    ],
    'Management (الإدارة والموافقات)': [
      'leaves','dept-purchase-approvals','friday-work','team-adjustments'
    ],
    'HR (الموارد البشرية)': [
      'hr-admin','employees','attendance','shifts','overtime','absence-leave','all-delays',
      'all-missions','employee-warnings','asset-assignment','payroll','payroll-funding',
      'hr-employee-payment','hr-adjustments','recruitment','hr-ats','documents',
      'performance','uniforms','medical-requests','loans','expenses','offboarding',
      'performance-reviews','training','hr-qr-generator','advanced-hr'
    ],
    'Factory Clinic (عيادة المصنع والتمريض)': [
      'nursing-page','nursing-medical-approvals'
    ],
    'Warehouse & Supply Chain (المخازن والمستودعات)': [
      'inventory','purchase-requests','spare-parts','wms-management'
    ],
    'Procurement (المشتريات والموردين)': [
      'erp-suppliers','supplier-portal','supplier-performance'
    ],
    'Sales & Customers (المبيعات والعملاء)': [
      'erp-sales','erp-products','customer-requests','pricing-management',
      'credit-management','rma-management','contract-management','demand-forecasting'
    ],
    'Production & Manufacturing (الإنتاج والتصنيع)': [
      'erp-planning','erp-production','erp-bom','production-trace',
      'production-analysis','oee-dashboard','mrp-planning','aps-scheduling',
      'production-kanban','shop-floor'
    ],
    'Quality Control (رقابة وتأكيد الجودة)': [
      'erp-quality','advanced-quality'
    ],
    'Maintenance & Engineering (الصيانة والإدارة الهندسية)': [
      'engineering','erp-maintenance','erp-equipment','maint-companies',
      'advanced-maintenance'
    ],
    'Fleet & Logistics (النقل واللوجستيات والأسطول)': [
      'logistics','erp-fleet','driver-payments'
    ],
    'Finance & Accounting (المالية والحسابات)': [
      'petty-cash','financial-reports','chart-of-accounts','cost-centers',
      'finance-kpi','bank-management','check-management','loans-taxes',
      'budgets-inventory','fixed-assets','journal-engine','closing-wizard',
      'finance-reports-ent','ai-cfo','advanced-finance','einvoice-system'
    ],
    'Legal Affairs (الشؤون القانونية)': [
      'legal-affairs'
    ],
    'Admin & Executive AI (إدارة النظام والأمان والذكاء الاصطناعي)': [
      'reports','kpi-dashboard','dashboard-builder','report-builder','balanced-scorecard',
      'print-templates','audit-log','login-history','activity-log-page','activity-timeline',
      'it-tickets','document-management','approval-workflows','workflow-engine',
      'global-search','system-settings','screen-permissions','notification-settings',
      'facebook-leads','sustainability','integration-hub','owner-dashboard',
      'ceo-dashboard','ai-ceo-dashboard','ai-copilot','ai-agents','executive-intelligence',
      'ai-reports'
    ]
  },

  allScreens: [
    // --- Self Service ---
    { id: 'dashboard', label: 'My Dashboard (لوحة التحكم)' },
    { id: 'hr-personal', label: 'My Profile (ملفي الشخصي)' },
    { id: 'my-attendance', label: 'My Attendance (سجل حضوري)' },
    { id: 'scan-checkin', label: 'Check-In QR (تسجيل حضور)' },
    { id: 'scan-checkout', label: 'Check-Out QR (تسجيل انصراف)' },
    { id: 'my-leaves', label: 'My Leaves (إجازاتي)' },
    { id: 'my-salary', label: 'My Salary (مفردات الراتب)' },
    { id: 'my-overtime', label: 'My Overtime (ساعاتي الإضافية)' },
    { id: 'my-loans', label: 'My Loans (سلفياتي وقروضي)' },
    { id: 'my-medical', label: 'Medical Needs (طلباتي الطبية)' },
    { id: 'my-delays', label: 'My Delays (تأخيراتي)' },
    { id: 'my-missions', label: 'My Missions (مأمورياتي)' },
    { id: 'my-expenses', label: 'My Expenses (مصروفاتي)' },
    { id: 'complaints', label: 'Complaints & Grievances (الشكاوى والمقترحات)' },

    // --- Workplace & Collaboration ---
    { id: 'announcements', label: 'Announcements (الإعلانات والتعميمات)' },
    { id: 'internal-chat', label: 'Internal Chat (المحادثات الداخلية)' },
    { id: 'shift-swap', label: 'Shift Marketplace (سوق تبديل الورديات)' },
    { id: 'calendar', label: 'Calendar (التقويم وجدول المواعيد)' },
    { id: 'task-management', label: 'Task Management (إدارة المهام)' },
    { id: 'org-directory', label: 'Company Directory (دليل الشركة والهيكل)' },
    { id: 'ai-mind', label: 'AI Mind (العقل الاصطناعي للمؤسسة)' },

    // --- Management ---
    { id: 'leaves', label: 'Leave Approvals (اعتمادات الإجازات)' },
    { id: 'dept-purchase-approvals', label: 'Purchase Approvals (موافقات طلبات الشراء)' },
    { id: 'friday-work', label: 'Friday Work (طلبات عمل الجمعة والإضافي)' },
    { id: 'team-adjustments', label: 'Team Adjustments (تسويات ومكافآت الفريق)' },

    // --- HR ---
    { id: 'hr-admin', label: 'HR Dashboard (لوحة الموارد البشرية)' },
    { id: 'employees', label: 'Employees (الموظفين وسجلات العمل)' },
    { id: 'attendance', label: 'Attendance (الحضور والانصراف العام)' },
    { id: 'shifts', label: 'Shift Management (إدارة الورديات)' },
    { id: 'overtime', label: 'Overtime (إدارة العمل الإضافي)' },
    { id: 'absence-leave', label: 'Permission Requests (أذونات الغياب والتأخير)' },
    { id: 'all-delays', label: 'All Delays (سجل كل التأخيرات)' },
    { id: 'all-missions', label: 'All Missions (سجل كل المأموريات)' },
    { id: 'employee-warnings', label: 'Employee Warnings (الإنذارات والجزاءات)' },
    { id: 'asset-assignment', label: 'Asset Assignment (العهد والأصول المسلمة)' },
    { id: 'payroll', label: 'Payroll (الرواتب والأجور)' },
    { id: 'payroll-funding', label: 'Payroll Funding (تمويل الرواتب والخزينة)' },
    { id: 'hr-employee-payment', label: 'Employee Payment (صرف مستحقات الموظف)' },
    { id: 'hr-adjustments', label: 'Salary Adjustments (تسويات وتعديلات الرواتب)' },
    { id: 'recruitment', label: 'Recruitment (التوظيف والوظائف الشاغرة)' },
    { id: 'hr-ats', label: 'AI ATS (فرز السير الذاتية الذكي)' },
    { id: 'documents', label: 'Documents (أرشيف ومستندات الموظفين)' },
    { id: 'performance', label: 'Performance (متابعة الأداء والأهداف)' },
    { id: 'uniforms', label: 'Uniforms (الزي الرسمي ومقاسات العمال)' },
    { id: 'medical-requests', label: 'Medical Requests (المطالبات الطبية)' },
    { id: 'loans', label: 'Loans & Advances (السلف والقروض)' },
    { id: 'expenses', label: 'Expenses (المصروفات النثرية)' },
    { id: 'offboarding', label: 'Offboarding (إنهاء الخدمة وإخلاء الطرف)' },
    { id: 'performance-reviews', label: 'Performance Reviews (تقييمات الأداء الدورية)' },
    { id: 'training', label: 'Training (التدريب والتطوير)' },
    { id: 'hr-qr-generator', label: 'QR Generator (مولد QR الحضور المتغير)' },
    { id: 'advanced-hr', label: 'Skills & Workforce Analytics (تحليلات العمالة المتقدمة)' },

    // --- Clinic & Nursing ---
    { id: 'nursing-page', label: 'Factory Clinic & Nursing (عيادة المصنع والتمريض)' },
    { id: 'nursing-medical-approvals', label: 'Nursing Approvals (اعتمادات التمريض والعيادة)' },

    // --- Warehouse & Operations ---
    { id: 'inventory', label: 'Inventory (المخازن وإدارة المواد)' },
    { id: 'purchase-requests', label: 'Purchase Requests (طلبات الصرف والشراء)' },
    { id: 'spare-parts', label: 'Spare Parts (دورة قطع الغيار والكهرباء)' },
    { id: 'wms-management', label: 'WMS Warehouse (إدارة المستودعات المتقدمة)' },

    // --- Procurement ---
    { id: 'erp-suppliers', label: 'Suppliers (إدارة الموردين)' },
    { id: 'supplier-portal', label: 'Supplier Portal (بوابة الموردين الخارجية)' },
    { id: 'supplier-performance', label: 'Supplier Performance (تقييم أداء الموردين)' },

    // --- Sales & Customers ---
    { id: 'erp-sales', label: 'Sales (أوامر وعروض المبيعات)' },
    { id: 'erp-products', label: 'Products Catalog (دليل المنتجات والكتالوج)' },
    { id: 'customer-requests', label: 'Customer Requests (طلبات تسجيل العملاء)' },
    { id: 'pricing-management', label: 'Pricing Management (إدارة قوائم الأسعار)' },
    { id: 'credit-management', label: 'Credit Management (إدارة حدود الائتمان)' },
    { id: 'rma-management', label: 'RMA Returns (مرتجعات المبيعات والبدائل)' },
    { id: 'contract-management', label: 'Contracts (إدارة العقود)' },
    { id: 'demand-forecasting', label: 'Demand Forecasting (التنبؤ بالطلب والمبيعات)' },

    // --- Manufacturing & Production ---
    { id: 'erp-planning', label: 'Production Planning (إدارة التخطيط الصناعي)' },
    { id: 'erp-production', label: 'Production Orders (أوامر الإنتاج والتشغيل)' },
    { id: 'erp-bom', label: 'BOM Recipes (قوائم المواد ومكونات المنتج)' },
    { id: 'production-trace', label: 'Traceability (تتبع الدُفعات والتشغيلات)' },
    { id: 'production-analysis', label: 'Production Analysis (تحليل الإنتاجية والهدر)' },
    { id: 'oee-dashboard', label: 'OEE Dashboard (كفاءة المعدات الشاملة)' },
    { id: 'mrp-planning', label: 'MRP Planning (تخطيط الاحتياجات من المواد)' },
    { id: 'aps-scheduling', label: 'APS Scheduling (جدولة الإنتاج المتقدمة)' },
    { id: 'production-kanban', label: 'Production Kanban (كانبان خطوط الإنتاج)' },
    { id: 'shop-floor', label: 'Shop Floor Display (شاشة عرض صالة المصنع)' },

    // --- Quality ---
    { id: 'erp-quality', label: 'Quality Control (رقابة الجودة والاستلام)' },
    { id: 'advanced-quality', label: 'Advanced Quality NCR/CAPA (الجودة المتقدمة)' },

    // --- Maintenance & Engineering ---
    { id: 'engineering', label: 'Engineering (الإدارة الهندسية والمواصفات)' },
    { id: 'erp-maintenance', label: 'Maintenance (الصيانة الوقائية والطارئة)' },
    { id: 'erp-equipment', label: 'Equipment Registry (سجل المعدات والآلات)' },
    { id: 'maint-companies', label: 'Maintenance Companies (شركات ومقاولو الصيانة)' },
    { id: 'advanced-maintenance', label: 'Predictive Maintenance (الصيانة التنبؤية بالـ AI)' },

    // --- Fleet & Logistics ---
    { id: 'logistics', label: 'Logistics & Movement (حركة السيارات وبوابات الدخول)' },
    { id: 'erp-fleet', label: 'Fleet & Drivers (إدارة الأسطول والسائقين)' },
    { id: 'driver-payments', label: 'Driver Settlements (مستحقات ومحاسبة السائقين)' },

    // --- Finance ---
    { id: 'petty-cash', label: 'Financial Suite (الجناح المالي والخزائن)' },
    { id: 'financial-reports', label: 'Financial Reports (التقارير المالية وميزان المراجعة)' },
    { id: 'chart-of-accounts', label: 'Chart of Accounts (شجرة الحسابات والأستاذ)' },
    { id: 'cost-centers', label: 'Cost Centers (مراكز التكلفة وربحية الإدارات)' },
    { id: 'finance-kpi', label: 'Financial KPIs (مؤشرات الأداء المالي)' },
    { id: 'bank-management', label: 'Bank Accounts (الحسابات البنكية والمطابقة)' },
    { id: 'check-management', label: 'Check Portfolio (إدارة دورة الشيكات)' },
    { id: 'loans-taxes', label: 'Taxes & Loans (الضرائب والقروض التمويلية)' },
    { id: 'budgets-inventory', label: 'Budgeting (الموازنات التقديرية والانحرافات)' },
    { id: 'fixed-assets', label: 'Fixed Assets (الأصول الثابتة والإهلاكات)' },
    { id: 'journal-engine', label: 'Journal Engine (محرك القيود اليومية المزدوجة)' },
    { id: 'closing-wizard', label: 'Closing Wizard (معالج الإقفال المالي والشهري)' },
    { id: 'finance-reports-ent', label: 'Enterprise Financials (القوائم المالية المؤسسية)' },
    { id: 'ai-cfo', label: 'AI CFO (المدير المالي التنفيذي الذكي)' },
    { id: 'advanced-finance', label: 'Advanced Finance (التحليل والذكاء المالي)' },
    { id: 'einvoice-system', label: 'E-Invoice (منظومة الفاتورة الإلكترونية المعتمدة)' },

    // --- Legal ---
    { id: 'legal-affairs', label: 'Legal Affairs (الشؤون القانونية والتحقيقات)' },

    // --- Admin, AI & Enterprise ---
    { id: 'reports', label: 'Reports Center (مركز التقارير الموحد)' },
    { id: 'kpi-dashboard', label: 'KPI Dashboard (لوحة المؤشرات الاستراتيجية)' },
    { id: 'dashboard-builder', label: 'Dashboard Builder (منشئ لوحات التحكم المخصصة)' },
    { id: 'report-builder', label: 'Report Builder (مصمم التقارير المخصص)' },
    { id: 'balanced-scorecard', label: 'Balanced Scorecard (بطاقة الأداء المتوازن BSC)' },
    { id: 'print-templates', label: 'Print Templates (قوالب الطباعة والفواتير)' },
    { id: 'audit-log', label: 'Audit Log (سجل التدقيق والمراقبة الشامل)' },
    { id: 'login-history', label: 'Login History (سجل تسجيلات الدخول والأنشطة)' },
    { id: 'activity-log-page', label: 'Activity Log (سجل الحركات والعمليات المفصل)' },
    { id: 'activity-timeline', label: 'Activity Timeline (الخط الزمني المباشر للعمليات)' },
    { id: 'it-tickets', label: 'IT Support (الدعم الفني وتذاكر تقنية المعلومات)' },
    { id: 'document-management', label: 'DMS Document Archive (الأرشفة الإلكترونية)' },
    { id: 'approval-workflows', label: 'Approval Workflows (سلاسل ومسارات الاعتمادات)' },
    { id: 'workflow-engine', label: 'Workflow Engine (محرك أتمتة العمليات)' },
    { id: 'global-search', label: 'Global Search (محرك البحث الشامل في المؤسسة)' },
    { id: 'system-settings', label: 'System Settings (إعدادات النظام ومعاملات التشغيل)' },
    { id: 'screen-permissions', label: 'Screen Permissions (إدارة الصلاحيات المركزية)' },
    { id: 'notification-settings', label: 'Notification Settings (إعدادات وتنبيهات النظام)' },
    { id: 'facebook-leads', label: 'Meta / Facebook Leads (تكامل الحملات الإعلانية)' },
    { id: 'sustainability', label: 'Sustainability & ESG (الاستدامة والطاقة والأثر البيئي)' },
    { id: 'integration-hub', label: 'Integration Hub (مركز الربط والتكاملات والـ APIs)' },
    { id: 'owner-dashboard', label: 'Owner Command Center (لوحة المالك والقيادة العليا)' },
    { id: 'ceo-dashboard', label: 'CEO Dashboard (لوحة الإدارة العامة التنفيذية)' },
    { id: 'ai-ceo-dashboard', label: 'AI CEO Dashboard (مساعد الإدارة بالذكاء الاصطناعي)' },
    { id: 'ai-copilot', label: 'AI Industrial Copilot (المساعد الصناعي التوليدي)' },
    { id: 'ai-agents', label: 'Autonomous AI Agents (وكلاء الذكاء الاصطناعي المستقلين)' },
    { id: 'executive-intelligence', label: 'Executive Intelligence BI (ذكاء الأعمال والقرارات)' },
    { id: 'ai-reports', label: 'AI Automated Reports (التقارير التحليلية الذكية)' }
  ],

  actions: ['view','create','edit','delete','approve','reject','export','print'],

  allUsers: [],
  allRoles: [],

  isCurrentUserOwner: function() {
    if (typeof App !== 'undefined' && typeof App.isOwner === 'function') {
      return App.isOwner();
    }
    if (typeof App === 'undefined' || !App.user) return false;
    var r = (App.user.role || '').toLowerCase();
    return r === 'owner';
  },

  isTargetOwner: function(userId, role) {
    if (userId) {
      if (ERPPermissions.allUsers && ERPPermissions.allUsers.length > 0) {
        var u = ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); });
        if (u) {
          var ur = (u.role || '').trim().toLowerCase();
          return ur === 'owner';
        }
      }
      var sel = document.getElementById('perm-user');
      if (sel && sel.selectedIndex > 0) {
        var opt = sel.options[sel.selectedIndex];
        if (opt) {
          var optRole = (opt.getAttribute('data-role') || '').trim().toLowerCase();
          return optRole === 'owner';
        }
      }
      return false;
    }
    if (role && role.trim().toLowerCase() === 'owner') {
      return true;
    }
    return false;
  },

  // ---------- UI helpers (searchable combo, styles) ----------
  _combos: {},

  _esc: function(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  },

  _norm: function(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  },

  _hue: function(str) {
    var h = 0; str = String(str || '');
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  },

  _injectStyles: function() {
    if (document.getElementById('pm-styles')) return;
    var st = document.createElement('style');
    st.id = 'pm-styles';
    st.textContent = '.pm-wrap{--pm-card:var(--bg-card,#101827);--pm-card2:rgba(148,163,184,.07);--pm-bd:var(--border-color,rgba(148,163,184,.2));--pm-tx:var(--text-primary,#e8edf5);--pm-mu:var(--text-muted,#8b97ab);--pm-ac:#4f8cff;--pm-ac2:#8b5cf6;--pm-pop:#0c1322;display:flex;flex-direction:column;gap:18px;color:var(--pm-tx);padding-bottom:90px}[data-theme="light"] .pm-wrap{--pm-card:#fff;--pm-card2:#f1f5f9;--pm-bd:#e2e8f0;--pm-tx:#0f172a;--pm-mu:#64748b;--pm-pop:#fff}.pm-hero{position:relative;overflow:hidden;border-radius:22px;padding:26px 28px;border:1px solid var(--pm-bd);background:radial-gradient(900px 260px at 100% 0%,rgba(79,140,255,.28),transparent 60%),radial-gradient(700px 240px at 0% 100%,rgba(139,92,246,.24),transparent 60%),var(--pm-card)}.pm-hero h2{margin:0;font-size:1.65rem;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:12px;flex-wrap:wrap}.pm-hero p{margin:8px 0 0;color:var(--pm-mu);max-width:880px;line-height:1.7}.pm-pill{font-size:.72rem;font-weight:700;padding:5px 12px;border-radius:999px;color:#9cc2ff;background:rgba(79,140,255,.14);border:1px solid rgba(79,140,255,.35)}.pm-stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.pm-stat{min-width:130px;padding:12px 16px;border-radius:14px;background:var(--pm-card2);border:1px solid var(--pm-bd)}.pm-stat b{display:block;font-size:1.5rem;font-weight:800;line-height:1.1}.pm-stat span{font-size:.78rem;color:var(--pm-mu)}.pm-card{background:var(--pm-card);border:1px solid var(--pm-bd);border-radius:18px;padding:18px 20px;box-shadow:0 10px 30px -18px rgba(0,0,0,.55)}.pm-targets{display:grid;grid-template-columns:1.25fr auto 1fr .8fr;gap:16px;align-items:end}@media(max-width:1000px){.pm-targets{grid-template-columns:1fr}.pm-or{display:none}}.pm-lab{display:block;font-size:.78rem;font-weight:700;color:var(--pm-mu);margin-bottom:8px;letter-spacing:.02em}.pm-or{align-self:end;padding-bottom:14px;color:var(--pm-mu);font-weight:700;font-size:.8rem}.pm-combo{position:relative}.pm-field{display:flex;align-items:center;gap:8px;height:48px;padding:0 14px;border-radius:13px;border:1.5px solid var(--pm-bd);background:var(--pm-card2);transition:.15s}.pm-field:focus-within{border-color:var(--pm-ac);box-shadow:0 0 0 4px rgba(79,140,255,.18)}.pm-input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:var(--pm-tx);font:inherit;font-size:.95rem}.pm-input::placeholder{color:var(--pm-mu)}.pm-field-ic{opacity:.75}.pm-caret{color:var(--pm-mu);font-size:.8rem}.pm-clear{border:0;background:rgba(148,163,184,.2);color:var(--pm-tx);width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:.7rem;line-height:1}.pm-clear[hidden]{display:none}.pm-list{position:absolute;z-index:80;inset-inline:0;top:calc(100% + 8px);max-height:360px;overflow:auto;background:var(--pm-pop);border:1px solid var(--pm-bd);border-radius:14px;box-shadow:0 24px 60px -12px rgba(0,0,0,.65);padding:6px}.pm-list[hidden]{display:none}.pm-item{display:flex;align-items:center;gap:12px;padding:9px 11px;border-radius:10px;cursor:pointer}.pm-item.is-active{background:rgba(79,140,255,.16)}.pm-item.is-sel{outline:1.5px solid rgba(79,140,255,.55)}.pm-item.is-off{opacity:.45;cursor:not-allowed}.pm-av{flex:none;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-weight:800;font-size:.9rem;color:#fff;background:linear-gradient(135deg,var(--c1,#4f8cff),var(--c2,#8b5cf6))}.pm-it-t{font-weight:700;font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pm-it-s{font-size:.76rem;color:var(--pm-mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pm-it-b{margin-inline-start:auto;font-size:.68rem;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(148,163,184,.18);color:var(--pm-mu);white-space:nowrap}.pm-it-b.warn{background:rgba(245,158,11,.18);color:#f5b53b}.pm-list mark{background:rgba(250,204,21,.35);color:inherit;border-radius:3px;padding:0 1px}.pm-empty{padding:22px;text-align:center;color:var(--pm-mu)}.pm-foot{position:sticky;bottom:-6px;text-align:center;font-size:.72rem;color:var(--pm-mu);padding:6px;background:var(--pm-pop)}.pm-select{width:100%;height:48px;border-radius:13px;border:1.5px solid var(--pm-bd);background:var(--pm-card2);color:var(--pm-tx);padding:0 12px;font:inherit}.pm-chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.pm-chips .pm-lab{margin:0 6px 0 0}.pm-btn{border:1.5px solid var(--pm-bd);background:var(--pm-card2);color:var(--pm-tx);padding:9px 15px;border-radius:11px;font:inherit;font-weight:700;font-size:.82rem;cursor:pointer;transition:.15s}.pm-btn:hover{transform:translateY(-1px);border-color:var(--pm-ac)}.pm-btn[disabled]{opacity:.4;cursor:not-allowed;transform:none}.pm-btn-primary{background:linear-gradient(135deg,#3b82f6,#6366f1);border-color:transparent;color:#fff;box-shadow:0 8px 22px -8px rgba(59,130,246,.7)}.pm-btn-success{background:linear-gradient(135deg,#10b981,#059669);border-color:transparent;color:#fff;box-shadow:0 8px 22px -8px rgba(16,185,129,.7);padding:11px 24px;font-size:.9rem}.pm-btn-danger{color:#f87171;border-color:rgba(248,113,113,.5)}.pm-btn-ghost{background:transparent}.pm-target{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.pm-target .pm-av{width:52px;height:52px;border-radius:16px;font-size:1.3rem}.pm-target h3{margin:0;font-size:1.15rem;font-weight:800}.pm-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:5px}.pm-tag{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(79,140,255,.14);color:#9cc2ff}.pm-count{margin-inline-start:auto;text-align:center;padding:8px 18px;border-radius:14px;background:var(--pm-card2);border:1px solid var(--pm-bd)}.pm-count b{display:block;font-size:1.5rem;line-height:1.1;color:#4f8cff}.pm-count span{font-size:.75rem;color:var(--pm-mu)}.pm-addbar{display:grid;grid-template-columns:1fr auto minmax(220px,.5fr);gap:12px;align-items:center}@media(max-width:900px){.pm-addbar{grid-template-columns:1fr}}.pm-rowsearch{height:48px;border-radius:13px;border:1.5px solid var(--pm-bd);background:var(--pm-card2);color:var(--pm-tx);padding:0 14px;font:inherit;width:100%}.pm-rowsearch:focus,.pm-select:focus{outline:0;border-color:var(--pm-ac);box-shadow:0 0 0 4px rgba(79,140,255,.18)}.pm-alert{padding:12px 16px;border-radius:12px;font-weight:700;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.5);color:#f87171}.pm-tablewrap{overflow:auto;max-height:64vh;border-radius:16px;border:1px solid var(--pm-bd);background:var(--pm-card)}.pm-table{width:100%;border-collapse:separate;border-spacing:0;min-width:980px}.pm-table th{position:sticky;top:0;z-index:5;background:var(--pm-card2);backdrop-filter:blur(8px);padding:13px 10px;font-size:.78rem;font-weight:800;color:var(--pm-mu);text-align:center;white-space:nowrap;border-bottom:1px solid var(--pm-bd)}.pm-table th:first-child{text-align:start;padding-inline-start:18px;background:var(--pm-pop)}.pm-table td{padding:11px 10px;border-bottom:1px solid var(--pm-bd);text-align:center}.pm-table tr.perm-row:hover td{background:rgba(79,140,255,.06)}.pm-td-screen{text-align:start!important;padding-inline-start:18px!important}.pm-screen{display:flex;align-items:center;gap:12px}.pm-screen-ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--pm-card2);border:1px solid var(--pm-bd)}.pm-screen-name{font-weight:700;font-size:.9rem}.pm-screen code{font-size:.72rem;color:var(--pm-mu)}.pm-mod{display:inline-block;font-size:.7rem;font-weight:700;padding:4px 11px;border-radius:999px;color:hsl(var(--h,215) 85% 72%);background:hsl(var(--h,215) 70% 50% / .14);border:1px solid hsl(var(--h,215) 70% 55% / .35);white-space:nowrap}.pm-table input.perm-cb,.pm-table input.perm-all{appearance:none;-webkit-appearance:none;width:24px;height:24px;border-radius:8px;border:2px solid rgba(148,163,184,.4);background:transparent;cursor:pointer;position:relative;transition:.15s;margin:0;--k:#4f8cff}.pm-table input[data-action=view]{--k:#3b82f6}.pm-table input[data-action=create]{--k:#10b981}.pm-table input[data-action=edit]{--k:#f59e0b}.pm-table input[data-action=delete]{--k:#ef4444}.pm-table input[data-action=approve]{--k:#14b8a6}.pm-table input[data-action=reject]{--k:#f43f5e}.pm-table input[data-action=export]{--k:#8b5cf6}.pm-table input[data-action=print]{--k:#64748b}.pm-table input.perm-all{--k:#22c55e;border-radius:50%}.pm-table input.perm-cb:checked,.pm-table input.perm-all:checked{background:var(--k);border-color:var(--k);box-shadow:0 4px 12px -3px var(--k)}.pm-table input:checked::after{content:"";position:absolute;left:7px;top:2px;width:6px;height:12px;border:solid #fff;border-width:0 2.5px 2.5px 0;transform:rotate(45deg)}.pm-table input:disabled{opacity:.4;cursor:not-allowed}.pm-table input:not(:disabled):hover{transform:scale(1.12)}.pm-del{border:1px solid rgba(248,113,113,.45);background:transparent;color:#f87171;border-radius:10px;padding:5px 9px;cursor:pointer}.pm-del:hover{background:rgba(248,113,113,.14)}.pm-savebar{position:sticky;bottom:12px;z-index:30;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 16px;border-radius:16px;border:1px solid var(--pm-bd);background:color-mix(in srgb,var(--pm-card) 88%,transparent);backdrop-filter:blur(14px);box-shadow:0 18px 40px -16px rgba(0,0,0,.7)}.pm-save-status{margin-inline-end:auto;font-weight:700;font-size:.88rem}.pm-hint{padding:56px 20px;text-align:center;color:var(--pm-mu)}.pm-hint .pm-big{font-size:2.6rem;margin-bottom:8px}';
    document.head.appendChild(st);
  },

  /**
   * Searchable dropdown. Keeps a hidden <input id=cfg.id> so existing code can keep reading .value
   * cfg: { host, id, icon, placeholder, items:[{value,label,sub,badge,badgeWarn,avatar,icon,search,disabled}], onSelect }
   */
  _combo: function(cfg) {
    var P = ERPPermissions;
    var host = cfg.host;
    if (!host) return null;
    var st = { items: cfg.items || [], value: '', active: -1, shown: [], open: false };
    host.innerHTML =
      '<div class="pm-combo"><input type="hidden" id="' + cfg.id + '" value="">' +
      '<div class="pm-field"><span class="pm-field-ic">' + (cfg.icon || '🔎') + '</span>' +
      '<input type="text" class="pm-input" autocomplete="off" spellcheck="false" placeholder="' + P._esc(cfg.placeholder || '') + '">' +
      '<button type="button" class="pm-clear" hidden title="مسح">✕</button><span class="pm-caret">▾</span></div>' +
      '<div class="pm-list" hidden></div></div>';
    var root = host.firstChild;
    var hidden = root.querySelector('input[type=hidden]');
    var input = root.querySelector('.pm-input');
    var clearBtn = root.querySelector('.pm-clear');
    var list = root.querySelector('.pm-list');

    function byValue(v) { for (var i = 0; i < st.items.length; i++) if (String(st.items[i].value) === String(v)) return st.items[i]; return null; }
    function hl(text, toks) {
      var out = P._esc(text);
      toks.forEach(function(t) {
        if (!t) return;
        var re = new RegExp('(' + P._esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        out = out.replace(re, '<mark>$1</mark>');
      });
      return out;
    }
    function filter(q) {
      var toks = P._norm(q).split(/\s+/).filter(Boolean);
      st.shown = st.items.filter(function(it) {
        if (!toks.length) return true;
        var hay = P._norm([it.label, it.sub, it.search, it.value].join(' '));
        return toks.every(function(t) { return hay.indexOf(t) !== -1; });
      });
      return q ? q.trim().split(/\s+/) : [];
    }
    function paint(q) {
      var toks = filter(q || '');
      if (!st.shown.length) {
        list.innerHTML = '<div class="pm-empty">لا توجد نتائج مطابقة' + (q ? ' لـ "' + P._esc(q) + '"' : '') + '</div>';
        return;
      }
      var h = '';
      st.shown.forEach(function(it, i) {
        var cls = 'pm-item' + (i === st.active ? ' is-active' : '') + (String(it.value) === String(st.value) ? ' is-sel' : '') + (it.disabled ? ' is-off' : '');
        var hue = P._hue(it.label);
        var av = it.avatar
          ? '<span class="pm-av" style="--c1:hsl(' + hue + ' 75% 55%);--c2:hsl(' + ((hue + 50) % 360) + ' 75% 50%)">' + P._esc(String(it.label || '?').trim().charAt(0).toUpperCase()) + '</span>'
          : '<span class="pm-av" style="--c1:hsl(' + hue + ' 70% 52%);--c2:hsl(' + ((hue + 40) % 360) + ' 70% 46%)">' + (it.icon || '🖥️') + '</span>';
        h += '<div class="' + cls + '" data-i="' + i + '">' + av +
          '<div style="min-width:0"><div class="pm-it-t">' + hl(it.label, toks) + '</div>' +
          (it.sub ? '<div class="pm-it-s">' + hl(it.sub, toks) + '</div>' : '') + '</div>' +
          (it.disabled ? '<span class="pm-it-b">مضافة ✓</span>' : (it.badge ? '<span class="pm-it-b' + (it.badgeWarn ? ' warn' : '') + '">' + P._esc(it.badge) + '</span>' : '')) + '</div>';
      });
      h += '<div class="pm-foot">' + st.shown.length + ' من ' + st.items.length + '</div>';
      list.innerHTML = h;
    }
    function openList() {
      if (st.open) return;
      st.open = true; list.hidden = false;
      var cur = byValue(st.value);
      paint(cur && input.value === cur.label ? '' : input.value);
      var sel = list.querySelector('.is-sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
      setTimeout(function() { document.addEventListener('mousedown', outside, true); }, 0);
    }
    function closeList() {
      st.open = false; list.hidden = true; st.active = -1;
      document.removeEventListener('mousedown', outside, true);
      var cur = byValue(st.value);
      input.value = cur ? cur.label : '';
    }
    function outside(e) { if (!root.contains(e.target)) closeList(); }
    function choose(i) {
      var it = st.shown[i];
      if (!it || it.disabled) return;
      api.setValue(it.value);
      closeList();
      input.blur();
    }
    function move(d) {
      if (!st.shown.length) return;
      var n = st.active + d;
      if (n < 0) n = st.shown.length - 1;
      if (n >= st.shown.length) n = 0;
      st.active = n;
      paint(input.value === (byValue(st.value) || {}).label ? '' : input.value);
      var a = list.querySelector('.is-active'); if (a) a.scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('focus', function() { openList(); input.select(); });
    input.addEventListener('click', openList);
    input.addEventListener('input', function() { st.open = true; list.hidden = false; st.active = 0; paint(input.value); });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); openList(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); openList(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (st.active >= 0) choose(st.active); else if (st.shown.length === 1) choose(0); }
      else if (e.key === 'Escape') { closeList(); input.blur(); }
    });
    list.addEventListener('mousedown', function(e) {
      var el = e.target.closest ? e.target.closest('.pm-item') : null;
      if (!el) return;
      e.preventDefault();
      choose(parseInt(el.getAttribute('data-i'), 10));
    });
    list.addEventListener('mousemove', function(e) {
      var el = e.target.closest ? e.target.closest('.pm-item') : null;
      if (!el) return;
      var i = parseInt(el.getAttribute('data-i'), 10);
      if (i !== st.active) { var old = list.querySelector('.is-active'); if (old) old.classList.remove('is-active'); el.classList.add('is-active'); st.active = i; }
    });
    clearBtn.addEventListener('click', function(e) { e.preventDefault(); api.clear(); });

    var api = {
      setItems: function(items) { st.items = items || []; if (st.open) paint(input.value); },
      setValue: function(v, silent) {
        var it = byValue(v);
        if (!it) return;
        st.value = String(it.value); hidden.value = st.value; input.value = it.label; clearBtn.hidden = false;
        if (!silent && cfg.onSelect) cfg.onSelect(st.value);
      },
      clear: function(silent) {
        st.value = ''; hidden.value = ''; input.value = ''; clearBtn.hidden = true;
        if (st.open) paint('');
        if (!silent && cfg.onSelect) cfg.onSelect('');
      },
      setDisabled: function(v, flag) { var it = byValue(v); if (it) { it.disabled = !!flag; if (st.open) paint(input.value); } },
      getValue: function() { return st.value; }
    };
    ERPPermissions._combos[cfg.id] = api;
    return api;
  },

  render: function() {
    var P = ERPPermissions;
    P._injectStyles();
    var modOpts = '';
    Object.keys(P.moduleGroups).forEach(function(mg) {
      var dmg = typeof formatModuleLabel === 'function' ? formatModuleLabel(mg) : mg;
      modOpts += '<option value="' + P._esc(mg) + '">' + P._esc(dmg) + '</option>';
    });
    var html = '<div class="pm-wrap">' +
      '<div class="pm-hero"><h2>🔐 نظام الصلاحيات المركزي <span class="pm-pill">Single Source of Truth</span></h2>' +
      '<p>تحكّم دقيق في صلاحيات العرض والإضافة والتعديل والحذف والاعتماد والرفض والتصدير والطباعة على مستوى كل شاشة ودور ومستخدم.</p>' +
      '<div class="pm-stats"><div class="pm-stat"><b id="pm-stat-users">…</b><span>مستخدم</span></div>' +
      '<div class="pm-stat"><b id="pm-stat-roles">…</b><span>دور وظيفي</span></div>' +
      '<div class="pm-stat"><b>' + P.allScreens.length + '</b><span>شاشة</span></div>' +
      '<div class="pm-stat"><b>' + Object.keys(P.moduleGroups).length + '</b><span>إدارة / موديول</span></div></div></div>' +

      '<div class="pm-card"><div class="pm-targets">' +
      '<div><label class="pm-lab">1 · اختر المستخدم (User Override)</label><div id="pm-user-host"></div></div>' +
      '<div class="pm-or">أو</div>' +
      '<div><label class="pm-lab">2 · اختر الدور (Role Default)</label><div id="pm-role-host"></div></div>' +
      '<div><label class="pm-lab">3 · تصفية حسب الإدارة</label><select class="pm-select" id="perm-module-filter" onchange="ERPPermissions.filterByModule()"><option value="all">كل الإدارات والموديولات</option>' + modOpts + '</select></div>' +
      '</div></div>' +

      '<div class="pm-card" id="bulk-actions-bar"><div class="pm-chips"><span class="pm-lab">⚡ إجراءات سريعة</span>' +
      '<button class="pm-btn" onclick="ERPPermissions.grantModule(\'HR (الموارد البشرية)\')">👥 منح كل الـ HR</button>' +
      '<button class="pm-btn" onclick="ERPPermissions.grantModule(\'Warehouse & Supply Chain (المخازن والمستودعات)\')">📦 منح المخازن</button>' +
      '<button class="pm-btn" onclick="ERPPermissions.grantModule(\'Production & Manufacturing (الإنتاج والتصنيع)\')">🏭 منح الإنتاج</button>' +
      '<button class="pm-btn" onclick="ERPPermissions.grantModule(\'Finance & Accounting (المالية والحسابات)\')">💰 منح المالية</button>' +
      '<button class="pm-btn" onclick="ERPPermissions.grantModule(\'Sales & Customers (المبيعات والعملاء)\')">📈 منح المبيعات</button>' +
      '<span style="flex:1"></span>' +
      '<button class="pm-btn" onclick="ERPPermissions.copyFromTemplate()">📋 نسخ من قالب الدور</button>' +
      '<button class="pm-btn" onclick="ERPPermissions.saveAsTemplate()">💾 حفظ كقالب معتمد</button>' +
      '</div></div>' +

      '<div id="perm-grid"><div class="pm-card pm-hint"><div class="pm-big">👆</div>اختر مستخدماً أو دوراً من الأعلى وستظهر شبكة الصلاحيات هنا تلقائياً.</div></div></div>';
    document.getElementById('page-content').innerHTML = html;

    P._combos = {};
    P._combo({ host: document.getElementById('pm-user-host'), id: 'perm-user', icon: '👤', placeholder: 'ابحث بالاسم أو اسم المستخدم أو الدور…', items: [], onSelect: function() { P.onUserChange(); } });
    P._combo({ host: document.getElementById('pm-role-host'), id: 'perm-role', icon: '🛡️', placeholder: 'ابحث عن دور…', items: [], onSelect: function() { P.onRoleChange(); } });

    // Load users & distinct roles
    sbClient.from('users').select('id,full_name,username,role,department,status').order('full_name').range(0, 4999).then(function(r) {
      if (r && r.error) console.error('[Permissions] users load failed:', r.error);
      ERPPermissions.allUsers = (r && r.data) || [];

      var standardRoles = [
        'owner', 'hr manager', 'hr', 'manager', 'department head', 'hall manager',
        'planning manager', 'quality manager', 'qc inspector', 'maintenance manager',
        'technician', 'spare parts inspector', 'engineer', 'engineering manager',
        'sales coordinator', 'sales manager', 'logistics manager', 'driver',
        'nursing management', 'nurse', 'doctor', 'lawyer', 'employee'
      ];
      var dynamicRoles = [], roleCount = {};
      ERPPermissions.allUsers.forEach(function(u) {
        if (u.role) {
          var rClean = u.role.trim().toLowerCase();
          roleCount[rClean] = (roleCount[rClean] || 0) + 1;
          if (rClean && standardRoles.indexOf(rClean) === -1 && dynamicRoles.indexOf(rClean) === -1) dynamicRoles.push(rClean);
        }
      });
      var combinedRoles = standardRoles.concat(dynamicRoles);
      ERPPermissions.allRoles = combinedRoles;

      var uc = ERPPermissions._combos['perm-user'], rc = ERPPermissions._combos['perm-role'];
      if (uc) uc.setItems(ERPPermissions.allUsers.map(function(u) {
        var inactive = u.status && u.status !== 'active';
        return {
          value: u.id, avatar: true,
          label: u.full_name || u.username || ('#' + u.id),
          sub: [u.username, u.role, u.department].filter(Boolean).join(' · '),
          badge: inactive ? u.status : (u.role || ''), badgeWarn: !!inactive,
          search: [u.username, u.role, u.department, u.status].join(' ')
        };
      }));
      if (rc) rc.setItems(combinedRoles.map(function(rn) {
        return { value: rn, icon: '🛡️', label: rn, sub: (roleCount[rn] || 0) + ' مستخدم', search: rn };
      }));
      var su = document.getElementById('pm-stat-users'); if (su) su.textContent = ERPPermissions.allUsers.length;
      var sr = document.getElementById('pm-stat-roles'); if (sr) sr.textContent = combinedRoles.length;
    }).catch(function(err) { console.error('[Permissions] init failed:', err); });
  },

  onUserChange: function() {
    var u = document.getElementById('perm-user');
    if (u && u.value && ERPPermissions._combos['perm-role']) ERPPermissions._combos['perm-role'].clear(true);
    ERPPermissions.loadPerms();
  },

  onRoleChange: function() {
    var r = document.getElementById('perm-role');
    if (r && r.value && ERPPermissions._combos['perm-user']) ERPPermissions._combos['perm-user'].clear(true);
    ERPPermissions.loadPerms();
  },

  loadPerms: function() {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';
    var el = document.getElementById('perm-grid');
    if (!el) return;

    if (!userId && !role) {
      el.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted)">👆 يرجى اختيار مستخدم أو دور أولاً</div>';
      return;
    }

    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p style="margin-top:10px">جاري تحميل مصفوفة الصلاحيات...</p></div>';

    var isRestricted = !ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role);

    var query = sbClient.from('screen_permissions').select('*');
    if (userId) query = query.eq('user_id', userId);
    else if (role) query = query.eq('role', role).is('user_id', null);

    // For a user: also load the role-level rows so the grid shows the EFFECTIVE permissions
    var selUser = userId && ERPPermissions.allUsers ? ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); }) : null;
    var baseRole = selUser && selUser.role ? String(selUser.role).trim().toLowerCase() : '';
    var roleQuery = (userId && baseRole)
      ? sbClient.from('screen_permissions').select('*').eq('role', baseRole).is('user_id', null)
      : Promise.resolve({ data: [] });

    Promise.all([query, roleQuery]).then(function(both) {
      var r = both[0];
      var existing = {};
      ((both[1] && both[1].data) || []).forEach(function(p) {
        if (p.screen_id !== 'SYSTEM_CONFIG') existing[p.screen_id + '_' + p.action] = p;
      });
      (r.data || []).forEach(function(p) {
        existing[p.screen_id + '_' + p.action] = p;
      });

      // Role templates for fallback
      var roleStr = (role || '').toLowerCase();
      var dep = '';
      if (userId && ERPPermissions.allUsers) {
        var u = ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); });
        if (u) {
          dep = u.department || '';
          roleStr = (u.role || '').toLowerCase();
        }
      }

      // Which screens are active/assigned for this user/role
      var userScreens = [];
      var availableScreens = [];

      ERPPermissions.allScreens.forEach(function(s) {
        var hasExplicitRecord = ERPPermissions.actions.some(function(a) {
          return existing[s.id + '_' + a] !== undefined;
        });

        if (hasExplicitRecord) {
          userScreens.push(s);
        } else {
          availableScreens.push(s);
        }
      });

      // If user/role is brand new and has 0 explicit screens, load role template or default self-service
      if (userScreens.length === 0) {
        var defaultIds = [
          'dashboard', 'hr-personal', 'my-attendance', 'scan-checkin', 'scan-checkout',
          'my-leaves', 'my-salary', 'my-overtime', 'my-loans', 'my-medical',
          'my-delays', 'my-missions', 'my-expenses', 'complaints',
          'announcements', 'internal-chat', 'shift-swap', 'calendar', 'task-management'
        ];

        if (roleStr === 'owner') {
          defaultIds = ERPPermissions.allScreens.map(function(s){ return s.id; });
        } else if (['hr manager', 'hr'].indexOf(roleStr) !== -1 || dep === 'HR') {
          defaultIds = defaultIds.concat([
            'employees', 'attendance', 'leaves', 'shifts', 'overtime', 'absence-leave', 'all-delays',
            'all-missions', 'employee-warnings', 'asset-assignment', 'payroll', 'payroll-funding',
            'hr-adjustments', 'team-adjustments', 'dept-purchase-approvals', 'friday-work',
            'recruitment', 'hr-ats', 'documents', 'performance', 'uniforms', 'loans',
            'expenses', 'medical-requests', 'nursing-page', 'nursing-medical-approvals', 'org-directory',
            'offboarding', 'training', 'performance-reviews', 'advanced-hr', 'hr-qr-generator',
            'reports', 'kpi-dashboard', 'print-templates', 'document-management', 'approval-workflows',
            'global-search', 'audit-log', 'login-history', 'activity-log-page', 'ai-mind', 'it-tickets'
          ]);
        }

        userScreens = ERPPermissions.allScreens.filter(function(s) {
          return defaultIds.indexOf(s.id) !== -1;
        });
        availableScreens = ERPPermissions.allScreens.filter(function(s) {
          return defaultIds.indexOf(s.id) === -1;
        });

        // Set default granted in memory
        userScreens.forEach(function(s) {
          ERPPermissions.actions.forEach(function(act) {
            var isGranted = (act === 'view' || act === 'create');
            if (roleStr === 'owner' || ['hr manager', 'hr'].indexOf(roleStr) !== -1 || dep === 'HR') {
              isGranted = true;
            }
            existing[s.id + '_' + act] = { granted: isGranted };
          });
        });
      }

      var html = '';
      var _permLang = (typeof I18nEngine !== 'undefined' && I18nEngine.currentLang) || localStorage.getItem('lang') || 'ar';

      if (isRestricted) {
        html += '<div class="pm-alert" style="margin-bottom:14px">🔒 تنبيه أمني: لا يمكن تعديل أو سحب صلاحيات المالك (Owner) إلا من قبل المالك نفسه.</div>';
      }

      // Target banner
      var _tu = userId && ERPPermissions.allUsers ? ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); }) : null;
      var _tName = _tu ? (_tu.full_name || _tu.username || ('#' + _tu.id)) : ('دور: ' + role);
      var _tHue = ERPPermissions._hue(_tName);
      html += '<div class="pm-card pm-target" style="margin-bottom:14px">' +
        '<span class="pm-av" style="--c1:hsl(' + _tHue + ' 75% 55%);--c2:hsl(' + ((_tHue + 50) % 360) + ' 75% 50%)">' + (_tu ? ERPPermissions._esc(String(_tName).trim().charAt(0).toUpperCase()) : '🛡️') + '</span>' +
        '<div><h3>' + ERPPermissions._esc(_tName) + '</h3><div class="pm-tags">' +
        (_tu ? ['role','department','username'].map(function(k){ return _tu[k] ? '<span class="pm-tag">' + ERPPermissions._esc(_tu[k]) + '</span>' : ''; }).join('') : '<span class="pm-tag">صلاحيات افتراضية للدور</span>') +
        '</div></div>' +
        '<div class="pm-count"><b id="screen-count">' + userScreens.length + '</b><span>شاشة مخصصة</span></div></div>';

      // Add-screen toolbar
      html += '<div class="pm-card" style="margin-bottom:14px"><div class="pm-addbar">' +
        '<div id="pm-add-host"></div>' +
        '<button type="button" class="pm-btn pm-btn-primary" onclick="ERPPermissions.addScreenRow()" ' + (isRestricted ? 'disabled' : '') + '>＋ إضافة الشاشة</button>' +
        '<input type="search" id="pm-row-search" class="pm-rowsearch" placeholder="🔎 بحث داخل الشاشات المضافة…" oninput="ERPPermissions.filterByModule()">' +
        '</div></div>';

      // Permissions grid
      var actionLabels = _permLang === 'ar' ? {
        'view': '👁️ عرض', 'create': '➕ إضافة', 'edit': '✏️ تعديل', 'delete': '🗑️ حذف',
        'approve': '✅ اعتماد', 'reject': '❌ رفض', 'export': '📤 تصدير', 'print': '🖨️ طباعة'
      } : {
        'view': '👁️ View', 'create': '➕ Create', 'edit': '✏️ Edit', 'delete': '🗑️ Delete',
        'approve': '✅ Approve', 'reject': '❌ Reject', 'export': '📤 Export', 'print': '🖨️ Print'
      };
      html += '<div class="pm-tablewrap"><table class="pm-table"><thead><tr>';
      html += '<th>الشاشة</th><th>الإدارة</th>';
      ERPPermissions.actions.forEach(function(a) {
        html += '<th>' + (actionLabels[a] || a) + '</th>';
      });
      html += '<th>الكل</th><th>حذف</th></tr></thead><tbody id="perms-tbody">';
      userScreens.forEach(function(s) {
        html += ERPPermissions._renderRow(s, existing, isRestricted);
      });
      html += '</tbody></table></div>';

      // Sticky save bar
      html += '<div class="pm-savebar">' +
        '<div id="save-status" class="pm-save-status"></div>' +
        '<button type="button" class="pm-btn" onclick="ERPPermissions.selectAll(true)" ' + (isRestricted ? 'disabled' : '') + '>☑️ تحديد الكل</button>' +
        '<button type="button" class="pm-btn pm-btn-danger" onclick="ERPPermissions.selectAll(false)" ' + (isRestricted ? 'disabled' : '') + '>✖ إلغاء الكل</button>' +
        '<button type="button" class="pm-btn pm-btn-success" onclick="ERPPermissions.saveAll()" ' + (isRestricted ? 'disabled' : '') + '>💾 حفظ الصلاحيات</button>' +
        '</div>';

      el.innerHTML = html;
      ERPPermissions._initAddCombo(userScreens);
      ERPPermissions.filterByModule();
    }).catch(function(err) {
      console.error('[Permissions] loadPerms failed:', err);
      el.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:#ef4444">تعذر تحميل الصلاحيات: ' + (err && err.message ? err.message : err) + '</div>';
    });
  },

  _getModuleForScreen: function(screenId) {
    for (var mod in ERPPermissions.moduleGroups) {
      if (ERPPermissions.moduleGroups[mod].indexOf(screenId) !== -1) {
        return mod;
      }
    }
    return 'Other (أخرى)';
  },

  _screenIcon: function(id) {
    var mod = ERPPermissions._getModuleForScreen(id);
    var m = String(mod).toLowerCase();
    if (m.indexOf('hr') !== -1 || m.indexOf('self') !== -1) return '👥';
    if (m.indexOf('financ') !== -1) return '💰';
    if (m.indexOf('sales') !== -1) return '📈';
    if (m.indexOf('warehouse') !== -1 || m.indexOf('supply') !== -1) return '📦';
    if (m.indexOf('production') !== -1 || m.indexOf('manufact') !== -1) return '🏭';
    if (m.indexOf('maint') !== -1 || m.indexOf('equip') !== -1) return '🛠️';
    if (m.indexOf('ai') !== -1) return '🤖';
    if (m.indexOf('clinic') !== -1 || m.indexOf('medical') !== -1) return '🩺';
    return '🖥️';
  },

  _renderRow: function(s, existing, isRestricted) {
    var P = ERPPermissions;
    var mod = P._getModuleForScreen(s.id);
    var displayLabel = typeof formatScreenLabel === 'function' ? formatScreenLabel(s.label) : s.label;
    var displayMod = typeof formatModuleLabel === 'function' ? formatModuleLabel(mod) : mod.split('(')[0].trim();
    var dis = isRestricted ? 'disabled' : '';
    var html = '<tr id="row-' + s.id + '" data-module="' + P._esc(mod) + '" data-search="' + P._esc(P._norm(displayLabel + ' ' + s.label + ' ' + s.id + ' ' + displayMod)) + '" class="perm-row">' +
      '<td class="pm-td-screen"><div class="pm-screen"><span class="pm-screen-ic">' + P._screenIcon(s.id) + '</span><div><div class="pm-screen-name">' + P._esc(displayLabel) + '</div><code>' + P._esc(s.id) + '</code></div></div></td>' +
      '<td><span class="pm-mod" style="--h:' + P._hue(mod) + '">' + P._esc(displayMod) + '</span></td>';
    var allOn = true;
    P.actions.forEach(function(a) {
      var item = existing && existing[s.id + '_' + a];
      var on = !!(item && item.granted);
      if (!on) allOn = false;
      html += '<td><input type="checkbox" class="perm-cb" data-screen="' + s.id + '" data-action="' + a + '" ' + (on ? 'checked' : '') + ' ' + dis + ' onchange="ERPPermissions.syncRow(this)"></td>';
    });
    html += '<td><input type="checkbox" class="perm-all" data-screen="' + s.id + '" ' + (allOn ? 'checked' : '') + ' onchange="ERPPermissions.toggleRow(this)" ' + dis + '></td>';
    html += '<td><button type="button" class="pm-del" onclick="ERPPermissions.removeScreenRow(\'' + s.id + '\', \'' + String(s.label).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;') + '\')" ' + dis + ' title="حذف صلاحية هذه الشاشة">🗑️</button></td></tr>';
    return html;
  },

  syncRow: function(cb) {
    var screen = cb.getAttribute('data-screen');
    var all = document.querySelector('.perm-all[data-screen="' + screen + '"]');
    if (!all) return;
    var cbs = document.querySelectorAll('.perm-cb[data-screen="' + screen + '"]');
    var on = 0; cbs.forEach(function(c) { if (c.checked) on++; });
    all.checked = on === cbs.length;
  },

  _initAddCombo: function(userScreens) {
    var host = document.getElementById('pm-add-host');
    if (!host) return;
    var P = ERPPermissions;
    var assigned = {};
    (userScreens || []).forEach(function(s) { assigned[s.id] = true; });
    P._combo({
      host: host, id: 'add-screen-select', icon: '🖥️',
      placeholder: 'ابحث في كل الشاشات (' + P.allScreens.length + ') بالاسم عربي أو إنجليزي أو الـ ID…',
      items: P.allScreens.map(function(s) {
        var lab = typeof formatScreenLabel === 'function' ? formatScreenLabel(s.label) : s.label;
        var mod = P._getModuleForScreen(s.id);
        var dm = typeof formatModuleLabel === 'function' ? formatModuleLabel(mod) : mod;
        return { value: s.id, icon: P._screenIcon(s.id), label: lab, sub: s.id + ' · ' + dm, search: s.label + ' ' + mod, disabled: !!assigned[s.id] };
      })
    });
  },

  filterByModule: function() {
    var sel = document.getElementById('perm-module-filter');
    var filter = sel ? sel.value : 'all';
    var qEl = document.getElementById('pm-row-search');
    var toks = qEl ? ERPPermissions._norm(qEl.value).split(/\s+/).filter(Boolean) : [];
    document.querySelectorAll('.perm-row').forEach(function(r) {
      var okMod = filter === 'all' || r.getAttribute('data-module') === filter;
      var hay = r.getAttribute('data-search') || '';
      var okTxt = toks.every(function(t) { return hay.indexOf(t) !== -1; });
      r.style.display = (okMod && okTxt) ? '' : 'none';
    });
  },

  addScreenRow: function() {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';

    if (!userId && !role) {
      var msg = '⚠️ يرجى اختيار مستخدم أو دور أولاً قبل إضافة الشاشة';
      if (typeof showToast === 'function') showToast(msg, 'warning');
      else alert(msg);
      return;
    }

    var select = document.getElementById('add-screen-select');
    if (!select) return;
    var screenId = select.value;
    if (!screenId) {
      var msg2 = '⚠️ اختر شاشة من القائمة المنسدلة أولاً';
      if (typeof showToast === 'function') showToast(msg2, 'warning');
      else alert(msg2);
      return;
    }

    // Check duplicate
    var existingRow = document.getElementById('row-' + screenId);
    if (existingRow) {
      existingRow.style.display = '';
      existingRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      existingRow.style.background = 'rgba(234, 179, 8, 0.2)';
      setTimeout(function(){ existingRow.style.background = ''; }, 2000);
      var msgDup = '⚠️ هذه الشاشة مضافة بالفعل في الجدول';
      if (typeof showToast === 'function') showToast(msgDup, 'warning');
      else alert(msgDup);
      return;
    }

    var screenObj = ERPPermissions.allScreens.find(function(s){ return s.id === screenId; });
    if (!screenObj) {
      screenObj = { id: screenId, label: screenId };
    }

    var tbody = document.getElementById('perms-tbody');
    if (tbody) {
      var temp = document.createElement('tbody');
      var defaultPerms = {};
      ERPPermissions.actions.forEach(function(act) {
        defaultPerms[screenId + '_' + act] = { granted: (act === 'view' || act === 'create') };
      });
      temp.innerHTML = ERPPermissions._renderRow(screenObj, defaultPerms, false);
      var newTr = temp.firstChild;
      newTr.style.background = 'rgba(37, 99, 235, 0.1)';
      tbody.insertBefore(newTr, tbody.firstChild);
      setTimeout(function(){ newTr.style.background = ''; }, 2500);
    }

    // Mark as added in the searchable picker and clear the field
    var _c = ERPPermissions._combos['add-screen-select'];
    if (_c) { _c.setDisabled(screenId, true); _c.clear(true); }
    var _filterEl = document.getElementById('pm-row-search'); if (_filterEl) _filterEl.value = '';
    ERPPermissions.filterByModule();

    // Update counter
    var countEl = document.getElementById('screen-count');
    if (countEl) {
      countEl.textContent = document.querySelectorAll('#perms-tbody tr').length;
    }

    if (typeof showToast === 'function') {
      showToast('✅ تمت إضافة الشاشة. حدد الصلاحيات ثم اضغط "حفظ الصلاحيات"', 'info');
    }
  },

  removeScreenRow: function(id, label) {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';

    if (!userId && !role) return;

    var targetUserObj = ERPPermissions.allUsers ? ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); }) : null;
    var targetName = targetUserObj ? targetUserObj.full_name : ('دور ' + role);

    var confirmMsg = 'هل أنت متأكد من حذف وإلغاء جميع صلاحيات شاشة "' + label + '" لـ ' + targetName + ' من قاعدة البيانات؟';
    if (!confirm(confirmMsg)) return;

    // Delete from DB directly
    var q = sbClient.from('screen_permissions').delete().eq('screen_id', id);
    if (userId) q = q.eq('user_id', userId);
    else q = q.eq('role', role).is('user_id', null);

    q.then(function(res) {
      if (res && res.error) {
        if (typeof showToast === 'function') showToast('خطأ أثناء الحذف: ' + res.error.message, 'error');
        else alert('خطأ: ' + res.error.message);
        return;
      }

      // Log to audit log
      sbClient.from('audit_log').insert({
        action: 'PERMISSION_DELETE',
        user_name: (typeof App !== 'undefined' && App.user) ? App.user.full_name : 'System',
        user_id: (typeof App !== 'undefined' && App.user) ? App.user.id : null,
        details: 'Deleted all permissions for screen "' + id + '" on ' + targetName
      }).then(function(){});

      // Remove row from DOM
      var row = document.getElementById('row-' + id);
      if (row) row.remove();

      // Make the screen selectable again in the picker
      var _c2 = ERPPermissions._combos['add-screen-select'];
      if (_c2) _c2.setDisabled(id, false);

      // Update counter
      var countEl = document.getElementById('screen-count');
      if (countEl) {
        countEl.textContent = document.querySelectorAll('#perms-tbody tr').length;
      }

      // Reload local permissions cache
      if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers.loadPermissions) {
        SecurityHelpers.loadPermissions();
      }

      if (typeof showToast === 'function') {
        showToast('✅ تم حذف صلاحيات شاشة ' + label + ' بنجاح', 'success');
      }
    });
  },

  toggleRow: function(cb) {
    var screen = cb.getAttribute('data-screen');
    document.querySelectorAll('.perm-cb[data-screen="'+screen+'"]').forEach(function(c) {
      c.checked = cb.checked;
    });
  },

  selectAll: function(val) {
    document.querySelectorAll('.perm-cb').forEach(function(c) {
      var row = c.closest('tr');
      if (row && row.style.display !== 'none') {
        c.checked = val;
      }
    });
    document.querySelectorAll('.perm-all').forEach(function(c) {
      var row = c.closest('tr');
      if (row && row.style.display !== 'none') {
        c.checked = val;
      }
    });
  },

  saveAll: function() {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';

    if (!userId && !role) {
      if (typeof showToast === 'function') showToast('⚠️ اختر مستخدم أو دور أولاً', 'warning');
      else alert('⚠️ اختر مستخدم أو دور أولاً');
      return;
    }

    var targetUserObj = ERPPermissions.allUsers ? ERPPermissions.allUsers.find(function(x){ return String(x.id) === String(userId); }) : null;
    var targetName = targetUserObj ? targetUserObj.full_name : ('دور ' + role);

    var statusEl = document.getElementById('save-status');
    if (statusEl) statusEl.innerHTML = '<span class="spinner"></span> جاري الحفظ والتطبيق...';

    // 1. Gather all state from the visible and configured rows in the UI
    var recordsToUpsert = [];
    var visibleScreens = {};

    document.querySelectorAll('#perms-tbody tr').forEach(function(tr) {
      var screenId = tr.id ? tr.id.replace('row-', '') : '';
      if (!screenId) return;
      visibleScreens[screenId] = true;

      ERPPermissions.actions.forEach(function(act) {
        var cb = tr.querySelector('.perm-cb[data-action="' + act + '"]');
        var isGranted = cb ? cb.checked : false;

        var rec = {
          user_id: userId || null,
          role: userId ? null : (role || null),
          screen_id: screenId,
          action: act,
          granted: isGranted,
          module: ERPPermissions._getModuleForScreen(screenId)
        };
        recordsToUpsert.push(rec);
      });
    });

    // Marker for custom config
    recordsToUpsert.push({
      user_id: userId || null,
      role: userId ? null : (role || null),
      screen_id: 'SYSTEM_CONFIG',
      action: 'custom',
      granted: true,
      module: 'system'
    });

    // Fetch existing records for this user/role to perform accurate cleanups and audit
    var query = sbClient.from('screen_permissions').select('id,screen_id,action,granted');
    if (userId) query = query.eq('user_id', userId);
    else query = query.eq('role', role).is('user_id', null);

    query.then(function(res) {
      var existingMap = {};
      (res.data || []).forEach(function(p) {
        existingMap[p.screen_id + '|' + p.action] = p;
      });

      // Deduplicate recordsToUpsert
      var dedupe = {};
      var finalUpsert = [];
      recordsToUpsert.forEach(function(r) {
        var k = r.screen_id + '|' + r.action;
        if (!dedupe[k]) {
          dedupe[k] = true;
          finalUpsert.push(r);
        }
      });

      // Execute upsert into screen_permissions
      // Note: we use onConflict: (user_id, screen_id, action) or (role, screen_id, action)
      var conflictCols = userId ? 'user_id, screen_id, action' : 'role, screen_id, action';

      sbClient.from('screen_permissions')
        .upsert(finalUpsert, { onConflict: conflictCols })
        .then(function(upsertRes) {
          if (upsertRes && upsertRes.error) {
            console.error('[ERPPermissions] Upsert error:', upsertRes.error);
            // Fallback: delete existing and insert fresh
            var scopeIds = Object.keys(visibleScreens).concat(['SYSTEM_CONFIG']);
            var deleteQuery = sbClient.from('screen_permissions').delete().in('screen_id', scopeIds);
            if (userId) deleteQuery = deleteQuery.eq('user_id', userId);
            else deleteQuery = deleteQuery.eq('role', role).is('user_id', null);

            deleteQuery.then(function() {
              sbClient.from('screen_permissions').insert(finalUpsert).then(function(insRes) {
                if (insRes && insRes.error) {
                  if (statusEl) statusEl.innerHTML = '<span style="color:var(--accent-danger)">❌ حدث خطأ: ' + insRes.error.message + '</span>';
                  if (typeof showToast === 'function') showToast('خطأ: ' + insRes.error.message, 'error');
                  return;
                }
                ERPPermissions._finishSave(targetName, finalUpsert.length, statusEl);
              });
            });
            return;
          }

          ERPPermissions._finishSave(targetName, finalUpsert.length, statusEl);
        });
    });
  },

  _finishSave: function(targetName, count, statusEl) {
    var successMsg = '✅ تم حفظ وتطبيق ' + count + ' صلاحية بنجاح لـ ' + targetName;
    if (statusEl) statusEl.innerHTML = '<span style="color:#10b981">' + successMsg + '</span>';
    if (typeof showToast === 'function') showToast(successMsg, 'success');
    else alert(successMsg);

    // Audit Log
    sbClient.from('audit_log').insert({
      action: 'PERMISSION_CHANGE',
      user_name: (typeof App !== 'undefined' && App.user) ? App.user.full_name : 'System',
      user_id: (typeof App !== 'undefined' && App.user) ? App.user.id : null,
      details: 'Updated ' + count + ' screen permissions for ' + targetName
    }).then(function(){});

    // Real-time cache refresh
    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers.loadPermissions) {
      SecurityHelpers.loadPermissions();
    }

    // Refresh UI after brief pause
    setTimeout(function() {
      ERPPermissions.loadPerms();
    }, 400);
  },

  grantModule: function(moduleName) {
    var screens = ERPPermissions.moduleGroups[moduleName];
    if (!screens || screens.length === 0) {
      if (typeof showToast === 'function') showToast('الموديول غير موجود', 'warning');
      return;
    }

    var grantedCount = 0;
    screens.forEach(function(screenId) {
      document.querySelectorAll('.perm-cb[data-screen="'+screenId+'"]').forEach(function(cb) {
        cb.checked = true;
        grantedCount++;
      });
      var rowAll = document.querySelector('.perm-all[data-screen="'+screenId+'"]');
      if (rowAll) rowAll.checked = true;
    });

    if (typeof showToast === 'function') {
      showToast('✅ تم منح صلاحيات موديول: ' + moduleName.split('(')[0].trim(), 'success');
    }
  },

  copyFromTemplate: function() {
    var roles = ERPPermissions.allRoles.length > 0 ? ERPPermissions.allRoles : ['employee', 'hr manager', 'hr', 'hall manager', 'department head', 'warehouse manager', 'procurement manager', 'driver'];
    var roleHtml = roles.map(function(r) { return '<option value="'+r+'">'+r+'</option>'; }).join('');

    var modalContent = '<div class="form-group"><label style="font-weight:700">اختر قالب الدور المراد النسخ منه:</label>' +
      '<select class="form-input" id="template-role-select">' + roleHtml + '</select></div>' +
      '<p style="color:var(--text-muted);font-size:0.85rem">سيتم تحميل الصلاحيات المعتمدة لهذا الدور في جدول الصلاحيات الحالي للمعاينة والتعديل قبل الحفظ.</p>';

    if (typeof App !== 'undefined' && App.showModal) {
      App.showModal('📋 نسخ الصلاحيات من قالب دور', modalContent, 
        '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>' +
        '<button class="btn btn-primary" onclick="ERPPermissions._applySelectedTemplate()">تطبيق القالب</button>');
    } else {
      var r = prompt('أدخل اسم الدور:');
      if (r) ERPPermissions._loadTemplate(r);
    }
  },

  _applySelectedTemplate: function() {
    var sel = document.getElementById('template-role-select');
    var selectedRole = sel ? sel.value : '';
    if (typeof App !== 'undefined' && App.closeModal) App.closeModal();
    if (selectedRole) ERPPermissions._loadTemplate(selectedRole);
  },

  _loadTemplate: function(role) {
    sbClient.from('permission_templates').select('screen_id,action,granted').eq('role', role).eq('granted', true).then(function(res) {
      if (!res.data || res.data.length === 0) {
        if (typeof showToast === 'function') showToast('لم يتم العثور على قالب معتمد للدور: ' + role, 'warning');
        return;
      }

      // First uncheck all
      document.querySelectorAll('.perm-cb').forEach(function(cb) { cb.checked = false; });

      var count = 0;
      res.data.forEach(function(t) {
        var cb = document.querySelector('.perm-cb[data-screen="'+t.screen_id+'"][data-action="'+t.action+'"]');
        if (cb) { cb.checked = true; count++; }
      });

      if (typeof showToast === 'function') {
        showToast('📋 تم استيراد ' + count + ' صلاحية من قالب: ' + role + '. اضغط حفظ الصلاحيات لتطبيقها.', 'success');
      }
    });
  },

  saveAsTemplate: function() {
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';
    if (!role) {
      role = prompt('أدخل اسم الدور لحفظ هذا القالب له (e.g. procurement specialist, warehouse manager):');
      if (!role) return;
    }

    var templates = [];
    document.querySelectorAll('.perm-cb:checked').forEach(function(cb) {
      var sId = cb.getAttribute('data-screen');
      var act = cb.getAttribute('data-action');
      if (sId && act) {
        templates.push({
          role: role.toLowerCase().trim(),
          screen_id: sId,
          action: act,
          granted: true,
          module: ERPPermissions._getModuleForScreen(sId)
        });
      }
    });

    if (templates.length === 0) {
      if (typeof showToast === 'function') showToast('⚠️ لا يوجد صلاحيات محددة لحفظها كقالب', 'warning');
      return;
    }

    sbClient.from('permission_templates')
      .upsert(templates, { onConflict: 'role, screen_id, action' })
      .then(function(res) {
        if (res && res.error) {
          if (typeof showToast === 'function') showToast('خطأ: ' + res.error.message, 'error');
          return;
        }
        if (typeof showToast === 'function') {
          showToast('✅ تم حفظ ' + templates.length + ' صلاحية كقالب معتمد للدور ' + role, 'success');
        }
      });
  },

  applyTemplateForUser: function(userId, role, cb) {
    if (!userId || !role) { if (cb) cb(false); return; }

    sbClient.from('permission_templates').select('screen_id,action,granted,module').eq('role', role.toLowerCase()).eq('granted', true).then(function(res) {
      if (!res.data || res.data.length === 0) {
        if (cb) cb(false);
        return;
      }

      var perms = res.data.map(function(t) {
        return {
          user_id: userId,
          role: null,
          screen_id: t.screen_id,
          action: t.action,
          granted: true,
          module: t.module || 'other'
        };
      });

      perms.push({
        user_id: userId,
        role: null,
        screen_id: 'SYSTEM_CONFIG',
        action: 'custom',
        granted: true,
        module: 'system'
      });

      sbClient.from('screen_permissions').insert(perms).then(function(r) {
        if (r.error) {
          console.error('[Permissions] Template apply error:', r.error);
          if (cb) cb(false);
          return;
        }
        if (cb) cb(true);
      });
    });
  }
};

// =============================================
// Production Traceability
// =============================================
var ERPTraceability = {

  renderTrace: function(batchId) {
    var html = '<div class="page-header"><h2>🔗 Production Traceability (تتبع الإنتاج)</h2></div>';
    html += '<div class="form-group"><label>رقم الدُفعة (Batch Number)</label>';
    html += '<div style="display:flex;gap:8px"><input class="form-input" id="trace-batch" placeholder="أدخل رقم الدُفعة...">';
    html += '<button class="btn btn-primary" onclick="ERPTraceability.trace()">🔍 تتبع</button></div></div>';
    html += '<div id="trace-result"></div>';
    document.getElementById('page-content').innerHTML = html;
    if (batchId) { document.getElementById('trace-batch').value = batchId; ERPTraceability.trace(); }
  },

  trace: async function() {
    var batchNum = document.getElementById('trace-batch').value.trim();
    var el = document.getElementById('trace-result');
    if (!batchNum) { showToast('أدخل رقم الدُفعة','error'); return; }
    el.innerHTML = '<div class="loading">جاري التتبع...</div>';

    // 1. Get batch
    var r1 = await sbClient.from('production_batches').select('*').eq('batch_number', batchNum).single();
    if (r1.error || !r1.data) { el.innerHTML = '<div class="empty-state">لم يتم العثور على الدُفعة "'+batchNum+'"</div>'; return; }
    var batch = r1.data;

    // 2. Get production order
    var order = null;
    if (batch.production_order_id) {
      var r2 = await sbClient.from('production_orders').select('*').eq('id', batch.production_order_id).single();
      order = r2.data;
    }

    // 3. Get stages
    var stages = [];
    if (batch.production_order_id) {
      var r3 = await sbClient.from('production_stage_logs').select('*').eq('production_order_id', batch.production_order_id).order('created_at');
      stages = r3.data || [];
    }

    // 4. Get consumption
    var consumption = [];
    if (batch.production_order_id) {
      var r4 = await sbClient.from('production_consumption').select('*').eq('production_order_id', batch.production_order_id);
      consumption = r4.data || [];
    }

    // 5. Get QC
    var qc = null;
    if (batch.qc_inspection_id) {
      var r5 = await sbClient.from('qc_inspections').select('*').eq('id', batch.qc_inspection_id).single();
      qc = r5.data;
    }

    // Build timeline
    var html = '<div style="margin-top:24px">';
    html += '<h3 style="margin-bottom:16px">🔗 Traceability Timeline — Batch: '+batchNum+'</h3>';

    var timeline = [
      { icon: '📦', title: 'خامات مستهلكة', content: consumption.length ? consumption.map(function(c){return c.actual_qty+' '+c.unit;}).join(', ') : 'لا يوجد بيانات استهلاك', color: '#8b5cf6' },
      { icon: '🏭', title: 'أمر الإنتاج', content: order ? order.order_number+' — '+order.status : 'غير مرتبط', color: '#3b82f6' },
    ];
    stages.forEach(function(s) {
      timeline.push({ icon: s.status==='completed'?'✅':'⏳', title: s.stage_name, content: 'الحالة: '+s.status+(s.waste_quantity?' | هالك: '+s.waste_quantity:''), color: s.status==='completed'?'#10b981':'#f59e0b' });
    });
    timeline.push({ icon: '🔬', title: 'فحص الجودة', content: qc ? 'النتيجة: '+qc.result : 'لم يتم الفحص بعد', color: qc&&qc.result==='pass'?'#10b981':'#ef4444' });
    timeline.push({ icon: '📦', title: 'المنتج النهائي', content: 'الكمية: '+batch.quantity+' '+batch.unit+' | الحالة: '+batch.status, color: '#6366f1' });

    timeline.forEach(function(t) {
      html += '<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">';
      html += '<div style="width:48px;height:48px;background:'+t.color+'22;border:2px solid '+t.color+';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+t.icon+'</div>';
      html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;flex:1">';
      html += '<strong>'+t.title+'</strong><p class="text-muted" style="margin-top:4px">'+t.content+'</p></div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }
};

if (typeof window !== 'undefined') { 
  window.ERPPermissions = ERPPermissions; 
  window.ERPTraceability = ERPTraceability; 
}
