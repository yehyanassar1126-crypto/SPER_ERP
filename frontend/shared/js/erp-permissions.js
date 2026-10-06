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

  render: function() {
    var _permLang = (typeof I18nEngine !== 'undefined' && I18nEngine.currentLang) || localStorage.getItem('lang') || 'ar';
    var _permTitle = _permLang === 'ar' ? '🔐 نظام الصلاحيات المركزي' : '🔐 Screen Permissions';
    var _permSub = _permLang === 'ar' ? 'التحكم الدقيق في صلاحيات العرض، الإضافة، التعديل، الحذف، الاعتماد، الرفض، التصدير، والطباعة على مستوى كل شاشة ودور ومستخدم.' : 'Granular control over View, Create, Edit, Delete, Approve, Reject, Export, and Print permissions per screen, role, and user.';
    var html = '<div class="page-header"><div style="display:flex;align-items:center;gap:12px"><h2>' + _permTitle + '</h2>' +
      '<span class="badge badge-info" style="font-size:0.75rem;padding:4px 10px">Single Source of Truth</span></div>' +
      '<p class="text-muted" style="margin-top:4px">' + _permSub + '</p></div>';

    // Filter controls row
    html += '<div class="form-row" style="margin-bottom:16px;gap:12px;background:var(--bg-card);padding:16px;border-radius:12px;border:1px solid var(--border-color)">';
    html += '<div class="form-group" style="flex:1.2"><label style="font-weight:700">1. اختر المستخدم (User Override)</label><select class="form-input" id="perm-user" onchange="ERPPermissions.onUserChange()"><option value="">— اختر مستخدم —</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label style="font-weight:700">أو 2. اختر الدور (Role Default)</label><select class="form-input" id="perm-role" onchange="ERPPermissions.onRoleChange()"><option value="">— اختر دور —</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label style="font-weight:700">3. تصفية حسب الإدارة</label><select class="form-input" id="perm-module-filter" onchange="ERPPermissions.filterByModule()"><option value="all">— كل الإدارات والموديولات —</option>';
    
    Object.keys(ERPPermissions.moduleGroups).forEach(function(mg) {
      var dmg = typeof formatModuleLabel === 'function' ? formatModuleLabel(mg) : mg;
      html += '<option value="' + mg + '">' + dmg + '</option>';
    });
    html += '</select></div>';
    html += '<button class="btn btn-primary" style="align-self:flex-end;height:42px" onclick="ERPPermissions.loadPerms()">🔄 تحميل الصلاحيات</button></div>';

    // Bulk Actions Bar
    html += '<div id="bulk-actions-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:12px 16px;background:var(--bg-tertiary);border-radius:10px;border:1px solid var(--border-color);align-items:center">';
    html += '<span style="font-weight:700;margin-right:8px">⚡ إجراءات سريعة:</span>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'HR (الموارد البشرية)\')">👥 منح كل الـ HR</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Warehouse & Supply Chain (المخازن والمستودعات)\')">📦 منح المخازن</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Production & Manufacturing (الإنتاج والتصنيع)\')">🏭 منح الإنتاج</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Finance & Accounting (المالية والحسابات)\')">💰 منح المالية</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Sales & Customers (المبيعات والعملاء)\')">📈 منح المبيعات</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="background:#2563eb;color:#fff;border-color:#2563eb" onclick="ERPPermissions.selectAll(true)">☑️ تحديد كل الظاهر</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="color:var(--accent-danger);border-color:var(--accent-danger)" onclick="ERPPermissions.selectAll(false)">❌ إلغاء كل الظاهر</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="color:var(--accent-info);border-color:var(--accent-info)" onclick="ERPPermissions.copyFromTemplate()">📋 نسخ من قالب الدور</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="color:#8b5cf6;border-color:#8b5cf6" onclick="ERPPermissions.saveAsTemplate()">💾 حفظ كقالب معتمد</button>';
    html += '</div>';

    html += '<div id="perm-grid"><div class="empty-state" style="padding:40px;text-align:center;color:var(--text-muted)">👆 يرجى اختيار مستخدم أو دور أعلاه لتحميل شبكة الصلاحيات وإدارتها.</div></div>';
    document.getElementById('page-content').innerHTML = html;

    // Load users & distinct roles
    sbClient.from('users').select('id,full_name,username,role,department,status').order('full_name').range(0, 4999).then(function(r) {
      if (r && r.error) console.error('[Permissions] users load failed:', r.error);
      var userSel = document.getElementById('perm-user');
      var roleSel = document.getElementById('perm-role');
      ERPPermissions.allUsers = r.data || [];
      
      // Populate users
      if (userSel) {
        ERPPermissions.allUsers.forEach(function(u) {
          var opt = document.createElement('option');
          opt.value = u.id;
          opt.setAttribute('data-role', u.role || '');
          opt.textContent = (u.full_name || u.username || ('#' + u.id)) + (u.status && u.status !== 'active' ? ' [' + u.status + ']' : '') + ' — (' + (u.role || 'no-role') + ' / ' + (u.department || 'General') + ')';
          userSel.appendChild(opt);
        });
      }

      // Collect all distinct roles
      var standardRoles = [
        'owner', 'hr manager', 'hr', 'manager', 'department head', 'hall manager',
        'procurement manager', 'procurement specialist', 'warehouse manager',
        'planning manager', 'quality manager', 'qc inspector', 'maintenance manager',
        'technician', 'spare parts inspector', 'engineer', 'engineering manager',
        'sales coordinator', 'sales manager', 'logistics manager', 'driver',
        'nursing management', 'nurse', 'doctor', 'lawyer', 'employee'
      ];
      
      var dynamicRoles = [];
      ERPPermissions.allUsers.forEach(function(u) {
        if (u.role) {
          var rClean = u.role.trim().toLowerCase();
          if (rClean && standardRoles.indexOf(rClean) === -1 && dynamicRoles.indexOf(rClean) === -1) {
            dynamicRoles.push(rClean);
          }
        }
      });

      var combinedRoles = standardRoles.concat(dynamicRoles);
      ERPPermissions.allRoles = combinedRoles;

      if (roleSel) {
        roleSel.innerHTML = '<option value="">— اختر دور —</option>';
        combinedRoles.forEach(function(roleName) {
          var rOpt = document.createElement('option');
          rOpt.value = roleName;
          rOpt.textContent = roleName;
          roleSel.appendChild(rOpt);
        });
      }
    });
  },

  onUserChange: function() {
    var u = document.getElementById('perm-user'), r = document.getElementById('perm-role');
    if (u && u.value && r) r.value = '';
    ERPPermissions.loadPerms();
  },

  onRoleChange: function() {
    var u = document.getElementById('perm-user'), r = document.getElementById('perm-role');
    if (r && r.value && u) u.value = '';
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

      if (isRestricted) {
        html += '<div style="margin-bottom:16px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:12px 16px;border-radius:10px;font-weight:bold;direction:rtl;text-align:right;display:flex;align-items:center;gap:10px;">';
        html += '<span style="font-size:20px;">🔒</span> <span>تنبيه أمني: لا يمكن تعديل أو سحب صلاحيات المالك (Owner) إلا من قبل المالك نفسه.</span>';
        html += '</div>';
      }

      // Add Screen Toolbar
      html += '<div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--bg-card);padding:14px;border-radius:10px;border:1px solid var(--border-color);">';
      html += '<div style="flex:1;min-width:280px"><select id="add-screen-select" class="form-input" style="width:100%"><option value="">➕ اختر شاشة لإضافتها لهذا الحساب...</option>';
      availableScreens.forEach(function(s) {
        var dl = typeof formatScreenLabel === 'function' ? formatScreenLabel(s.label) : s.label;
        html += '<option value="'+s.id+'">'+dl+' ('+s.id+')</option>';
      });
      html += '</select></div>';
      html += '<button type="button" class="btn btn-primary" onclick="ERPPermissions.addScreenRow()" style="background:#2563eb;color:#ffffff;font-weight:bold;cursor:pointer;padding:9px 20px;border-radius:8px;border:none;box-shadow:0 2px 8px rgba(37,99,235,0.4);" '+(isRestricted ? 'disabled' : '')+'>➕ إضافة الشاشة</button>';
      html += '<div style="margin-right:auto;font-size:0.85rem;color:var(--text-muted);display:flex;align-items:center;gap:6px">' +
        '<span>الشاشات المخصصة حالياً:</span> <strong id="screen-count" style="color:var(--accent-primary)">' + userScreens.length + '</strong>' +
        '</div>';
      html += '</div>';

      // Permissions Grid Table
      html += '<div style="overflow-x:auto;background:var(--bg-card);border-radius:12px;border:1px solid var(--border-color);box-shadow:0 2px 10px rgba(0,0,0,0.02)">';
      html += '<table class="data-table" style="margin:0"><thead><tr style="background:var(--bg-tertiary)">';
      html += '<th style="min-width:220px">الشاشة (Screen)</th>';
      html += '<th style="min-width:120px">الإدارة</th>';
      
      var _permLang = (typeof I18nEngine !== 'undefined' && I18nEngine.currentLang) || localStorage.getItem('lang') || 'ar';
      var actionLabels = _permLang === 'ar' ? {
        'view': '👁️ عرض',
        'create': '➕ إضافة',
        'edit': '✏️ تعديل',
        'delete': '🗑️ حذف',
        'approve': '✅ اعتماد',
        'reject': '❌ رفض',
        'export': '📤 تصدير',
        'print': '🖨️ طباعة'
      } : {
        'view': '👁️ View',
        'create': '➕ Create',
        'edit': '✏️ Edit',
        'delete': '🗑️ Delete',
        'approve': '✅ Approve',
        'reject': '❌ Reject',
        'export': '📤 Export',
        'print': '🖨️ Print'
      };

      ERPPermissions.actions.forEach(function(a) {
        html += '<th style="text-align:center;font-size:0.8rem">' + (actionLabels[a] || a) + '</th>';
      });
      html += '<th style="text-align:center">تحديد الكل</th>';
      html += '<th style="text-align:center">حذف</th>';
      html += '</tr></thead><tbody id="perms-tbody">';

      userScreens.forEach(function(s) {
        html += ERPPermissions._renderRow(s, existing, isRestricted);
      });
      html += '</tbody></table></div>';

      // Save Actions Footer
      html += '<div style="margin-top:20px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;background:var(--bg-card);padding:16px;border-radius:12px;border:1px solid var(--border-color);">';
      html += '<button type="button" class="btn btn-primary" onclick="ERPPermissions.saveAll()" style="background:#10b981 !important;color:#ffffff !important;font-weight:bold !important;cursor:pointer !important;padding:12px 28px !important;border-radius:8px !important;border:none !important;box-shadow:0 4px 12px rgba(16,185,129,0.3) !important;" '+(isRestricted ? 'disabled' : '')+'>💾 حفظ الصلاحيات (Save Permissions)</button>';
      html += '<button type="button" class="btn btn-outline" onclick="ERPPermissions.selectAll(true)" style="padding:10px 18px !important;border-radius:8px !important;" '+(isRestricted ? 'disabled' : '')+'>تحديد كل الصلاحيات</button>';
      html += '<button type="button" class="btn btn-outline" onclick="ERPPermissions.selectAll(false)" style="color:var(--accent-danger);border-color:var(--accent-danger);padding:10px 18px !important;border-radius:8px !important;" '+(isRestricted ? 'disabled' : '')+'>إلغاء كل الصلاحيات</button>';
      html += '<div id="save-status" style="margin-right:auto;font-weight:600;font-size:0.9rem"></div>';
      html += '</div>';

      el.innerHTML = html;
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

  _renderRow: function(s, existing, isRestricted) {
    var mod = ERPPermissions._getModuleForScreen(s.id);
    var displayLabel = typeof formatScreenLabel === 'function' ? formatScreenLabel(s.label) : s.label;
    var displayMod = typeof formatModuleLabel === 'function' ? formatModuleLabel(mod) : mod.split('(')[0].trim();
    var html = '<tr id="row-'+s.id+'" data-module="'+mod+'" class="perm-row"><td><strong>'+displayLabel+'</strong><br><code class="text-muted" style="font-size:0.75rem">'+s.id+'</code></td>';
    html += '<td><span class="badge badge-neutral" style="font-size:0.7rem">'+displayMod+'</span></td>';

    ERPPermissions.actions.forEach(function(a) {
      var item = existing && existing[s.id + '_' + a];
      var isChecked = item && item.granted;
      var checkedAttr = isChecked ? 'checked' : '';
      var disabledAttr = isRestricted ? 'disabled' : '';
      html += '<td style="text-align:center"><input type="checkbox" class="perm-cb" data-screen="'+s.id+'" data-action="'+a+'" '+checkedAttr+' '+disabledAttr+' style="width:18px;height:18px;accent-color:#2563eb;cursor:pointer"></td>';
    });

    html += '<td style="text-align:center"><input type="checkbox" class="perm-all" data-screen="'+s.id+'" onchange="ERPPermissions.toggleRow(this)" style="width:18px;height:18px;accent-color:#10b981;cursor:pointer" '+(isRestricted ? 'disabled' : '')+'></td>';
    html += '<td style="text-align:center"><button class="btn btn-xs btn-outline" style="color:var(--accent-danger);border-color:var(--accent-danger);cursor:pointer;padding:4px 8px" onclick="ERPPermissions.removeScreenRow(\''+s.id+'\', \''+s.label.replace(/'/g, "\\'")+'\')" '+(isRestricted ? 'disabled' : '')+' title="حذف صلاحية هذه الشاشة">🗑️</button></td></tr>';
    return html;
  },

  filterByModule: function() {
    var sel = document.getElementById('perm-module-filter');
    var filter = sel ? sel.value : 'all';
    var rows = document.querySelectorAll('.perm-row');
    rows.forEach(function(r) {
      if (filter === 'all' || r.getAttribute('data-module') === filter) {
        r.style.display = '';
      } else {
        r.style.display = 'none';
      }
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

    // Remove from select dropdown
    var option = select.querySelector('option[value="'+screenId+'"]');
    if (option) option.remove();
    select.value = "";

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

      // Return option to add-screen dropdown
      var select = document.getElementById('add-screen-select');
      if (select) {
        var opt = document.createElement('option');
        opt.value = id;
        opt.textContent = label + ' (' + id + ')';
        select.appendChild(opt);
      }

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
