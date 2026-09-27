// =============================================
// CENTRALIZED PERMISSION GUARD
// Single source of truth for all authorization
// Ninja Smart Factory ERP - Enterprise Grade
// =============================================
window.PermissionGuard = {

  // ===== MODULE MAPPING (All 108 Enterprise Screens) =====
  _moduleMap: {
    // Overview & Self Service
    'dashboard': 'my-info', 'hr-personal': 'my-info', 'my-attendance': 'my-info',
    'scan-checkin': 'my-info', 'scan-checkout': 'my-info', 'my-leaves': 'my-info',
    'my-salary': 'my-info', 'my-overtime': 'my-info', 'my-loans': 'my-info',
    'my-medical': 'my-info', 'my-delays': 'my-info', 'my-missions': 'my-info',
    'my-expenses': 'my-info', 'complaints': 'my-info',

    // Communication & Workplace
    'announcements': 'workplace', 'internal-chat': 'workplace', 'shift-swap': 'workplace',
    'calendar': 'workplace', 'task-management': 'workplace', 'org-directory': 'workplace',
    'ai-mind': 'workplace',

    // Management & Approvals
    'leaves': 'management', 'dept-purchase-approvals': 'management',
    'friday-work': 'management', 'team-adjustments': 'management',

    // Human Resources
    'hr-admin': 'hr', 'employees': 'hr', 'attendance': 'hr', 'shifts': 'hr', 'overtime': 'hr',
    'absence-leave': 'hr', 'all-delays': 'hr', 'all-missions': 'hr',
    'employee-warnings': 'hr', 'asset-assignment': 'hr', 'payroll': 'hr',
    'payroll-funding': 'hr', 'hr-employee-payment': 'hr', 'hr-adjustments': 'hr',
    'recruitment': 'hr', 'hr-ats': 'hr', 'documents': 'hr', 'performance': 'hr',
    'uniforms': 'hr', 'medical-requests': 'hr', 'loans': 'hr', 'expenses': 'hr',
    'offboarding': 'hr', 'performance-reviews': 'hr', 'training': 'hr',
    'hr-qr-generator': 'hr', 'advanced-hr': 'hr',

    // Factory Clinic & Nursing
    'nursing-page': 'medical', 'nursing-medical-approvals': 'medical',

    // Warehouse & Operations
    'inventory': 'warehouse', 'purchase-requests': 'warehouse', 'spare-parts': 'warehouse',
    'wms-management': 'warehouse',

    // Procurement
    'erp-suppliers': 'procurement', 'supplier-portal': 'procurement',
    'supplier-performance': 'procurement',

    // Sales & Customers
    'erp-sales': 'sales', 'erp-products': 'sales', 'customer-requests': 'sales',
    'pricing-management': 'sales', 'credit-management': 'sales', 'rma-management': 'sales',
    'contract-management': 'sales', 'demand-forecasting': 'sales',

    // Production & Manufacturing
    'erp-planning': 'production', 'erp-production': 'production', 'erp-bom': 'production',
    'production-trace': 'production', 'production-analysis': 'production',
    'oee-dashboard': 'production', 'mrp-planning': 'production', 'aps-scheduling': 'production',
    'production-kanban': 'production', 'shop-floor': 'production',

    // Quality Control
    'erp-quality': 'quality', 'advanced-quality': 'quality',

    // Maintenance & Engineering
    'engineering': 'maintenance', 'erp-maintenance': 'maintenance',
    'erp-equipment': 'maintenance', 'maint-companies': 'maintenance',
    'advanced-maintenance': 'maintenance',

    // Fleet & Logistics
    'logistics': 'logistics', 'erp-fleet': 'logistics', 'driver-payments': 'logistics',

    // Finance & Accounting
    'petty-cash': 'finance', 'financial-reports': 'finance', 'chart-of-accounts': 'finance',
    'cost-centers': 'finance', 'finance-kpi': 'finance', 'bank-management': 'finance',
    'check-management': 'finance', 'loans-taxes': 'finance', 'budgets-inventory': 'finance',
    'fixed-assets': 'finance', 'journal-engine': 'finance', 'closing-wizard': 'finance',
    'finance-reports-ent': 'finance', 'ai-cfo': 'finance', 'advanced-finance': 'finance',
    'einvoice-system': 'finance',

    // Legal
    'legal-affairs': 'legal',

    // Administration, AI & Enterprise
    'reports': 'admin', 'kpi-dashboard': 'admin', 'dashboard-builder': 'admin',
    'report-builder': 'admin', 'balanced-scorecard': 'admin', 'print-templates': 'admin',
    'audit-log': 'admin', 'login-history': 'admin', 'activity-log-page': 'admin',
    'activity-timeline': 'admin', 'it-tickets': 'admin', 'document-management': 'admin',
    'approval-workflows': 'admin', 'workflow-engine': 'admin', 'global-search': 'admin',
    'system-settings': 'admin', 'screen-permissions': 'admin', 'notification-settings': 'admin',
    'facebook-leads': 'admin', 'sustainability': 'admin', 'integration-hub': 'admin',
    'owner-dashboard': 'enterprise', 'ceo-dashboard': 'enterprise',
    'ai-ceo-dashboard': 'enterprise', 'ai-copilot': 'enterprise', 'ai-agents': 'enterprise',
    'executive-intelligence': 'enterprise', 'ai-reports': 'enterprise'
  },

  // Self-service screens that every user can access for their own data
  _selfServiceScreens: [
    'dashboard', 'hr-personal', 'my-attendance', 'scan-checkin', 'scan-checkout',
    'my-leaves', 'my-salary', 'my-overtime', 'my-loans', 'my-medical',
    'my-delays', 'my-missions', 'my-expenses', 'complaints',
    'announcements', 'internal-chat', 'shift-swap', 'calendar', 'task-management'
  ],

  // ===== CORE PERMISSION CHECK =====

  /**
   * Check if user can view/access a screen
   * @param {string} screenId
   * @returns {boolean}
   */
  canView: function(screenId) {
    if (!App.user) return false;

    // Owner has FULL access
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    // Self-service screens are always accessible to authenticated users
    if (PermissionGuard._selfServiceScreens.indexOf(screenId) !== -1) return true;

    // Strict centralized check via SecurityHelpers
    if (typeof SecurityHelpers !== 'undefined') {
      return SecurityHelpers.hasPermission(screenId, 'view');
    }

    return true;
  },

  /**
   * Check if user has a specific action permission on a screen
   * @param {string} screenId - e.g. 'erp-sales'
   * @param {string} action - 'view'|'create'|'edit'|'delete'|'approve'|'reject'|'export'|'print'
   * @returns {boolean}
   */
  canAction: function(screenId, action) {
    if (!App.user) return false;
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    action = (action || 'view').toLowerCase();

    // Self-service screens: allow view + create for own requests
    if (PermissionGuard._selfServiceScreens.indexOf(screenId) !== -1) {
      if (action === 'view' || action === 'create') return true;
    }

    // Strict centralized check via SecurityHelpers
    if (typeof SecurityHelpers !== 'undefined') {
      return SecurityHelpers.hasPermission(screenId, action);
    }

    return false;
  },

  /**
   * Shorthand: hasPermission(screenId, action)
   */
  hasPermission: function(screenId, action) {
    return PermissionGuard.canAction(screenId, action || 'view');
  },

  /**
   * Check if user can access a module group
   * @param {string} moduleGroup - e.g. 'hr', 'finance', 'production'
   */
  canAccessModule: function(moduleGroup) {
    if (!App.user) return false;
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    var map = PermissionGuard._moduleMap;
    for (var screenId in map) {
      if (map[screenId] === moduleGroup && PermissionGuard.canView(screenId)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Get all screens the user is authorized to view
   * @returns {string[]} Array of screen IDs
   */
  getAuthorizedScreens: function() {
    if (!App.user) return [];
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return Object.keys(PermissionGuard._moduleMap);
    }

    var screens = PermissionGuard._selfServiceScreens.slice();
    for (var screenId in PermissionGuard._moduleMap) {
      if (screens.indexOf(screenId) === -1 && PermissionGuard.canView(screenId)) {
        screens.push(screenId);
      }
    }
    return screens;
  },

  /**
   * Get all authorized actions for a specific screen
   * @param {string} screenId
   * @returns {string[]}
   */
  getAuthorizedActions: function(screenId) {
    if (!App.user) return [];
    var allActions = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'print'];
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return allActions;
    }

    return allActions.filter(function(a) {
      return PermissionGuard.canAction(screenId, a);
    });
  },

  /**
   * Get the module group for a screen
   */
  getModuleGroup: function(screenId) {
    return PermissionGuard._moduleMap[screenId] || 'other';
  },

  /**
   * Render Access Denied page with security log
   */
  renderAccessDenied: function(el) {
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar' ? '🚫 غير مصرح بالدخول' : '🚫 Access Denied';
    var msg = lang === 'ar'
      ? 'ليس لديك صلاحية عرض (VIEW) للوصول إلى هذه الشاشة. تواصل مع مدير النظام إذا كنت بحاجة إلى ترقية صلاحياتك.'
      : 'You do not have VIEW permission to access this page. Please contact your system administrator if you require access.';
    var btnText = lang === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard';

    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center">' +
      '<div style="max-width:460px;background:var(--bg-card);padding:36px;border-radius:16px;border:1px solid var(--border-color);box-shadow:0 10px 30px rgba(0,0,0,0.05)">' +
      '<div style="font-size:72px;margin-bottom:16px;opacity:0.6">🔒</div>' +
      '<h2 style="margin-bottom:12px;color:var(--text-primary);font-size:1.4rem">' + title + '</h2>' +
      '<p style="color:var(--text-muted);margin-bottom:24px;line-height:1.6;font-size:0.95rem">' + msg + '</p>' +
      '<div style="margin-bottom:20px;padding:8px 12px;background:var(--bg-tertiary);border-radius:8px;font-size:0.8rem;color:var(--text-muted)">' +
      'Screen: <code>' + (App.activePage || 'unknown') + '</code> | Role: <code>' + (App.user ? App.user.role : 'none') + '</code>' +
      '</div>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">' + btnText + '</button>' +
      '</div></div>';

    // Log unauthorized access attempt to audit log
    if (typeof sbClient !== 'undefined' && App.user) {
      sbClient.from('audit_log').insert({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user_name: App.user.full_name || App.user.username,
        user_id: App.user.id,
        details: 'Blocked attempt to access screen: ' + App.activePage + ' (No VIEW permission)'
      }).then(function(){});
    }
  },

  /**
   * Enforce action-level permissions on DOM buttons for the active screen
   */
  enforceActionPermissions: function(screenId) {
    if (PermissionGuard._domObserver) {
      PermissionGuard._domObserver.disconnect();
      PermissionGuard._domObserver = null;
    }

    if (!App.user || (App.user.role && App.user.role.toLowerCase() === 'owner')) return;
    if (screenId === 'screen-permissions') return;

    var _enforce = function() {
      document.querySelectorAll('button:not(.nav-link):not(.sidebar-btn):not(.sidebar-item):not([data-pg-checked])').forEach(function(btn) {
        btn.setAttribute('data-pg-checked', 'true');
        var action = 'view';
        var text = (btn.innerText || '').toLowerCase();

        if (text.match(/إضافة|create|add|جديد|new|post/)) action = 'create';
        else if (text.match(/تعديل|edit|update|حفظ|save/)) action = 'edit';
        else if (text.match(/حذف|delete|remove|مسح|🗑/)) action = 'delete';
        else if (text.match(/اعتماد|approve|موافقة/)) action = 'approve';
        else if (text.match(/رفض|reject/)) action = 'reject';
        else if (text.match(/تصدير|export|download/)) action = 'export';
        else if (text.match(/طباعة|print/)) action = 'print';
        else return;

        if (!PermissionGuard.canAction(screenId, action)) {
          btn.disabled = true;
          btn.style.opacity = '0.35';
          btn.style.cursor = 'not-allowed';
          btn.title = App.user.preferred_language === 'en'
            ? 'Action denied: Missing "' + action.toUpperCase() + '" permission for this screen'
            : 'غير مصرح: ليس لديك صلاحية ' + action.toUpperCase() + ' لهذه الشاشة';
          btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
          btn.addEventListener('click', function(e) { e.stopImmediatePropagation(); e.preventDefault(); return false; }, true);
        }
      });
    };

    _enforce();
    setTimeout(_enforce, 500);

    var contentEl = document.getElementById('page-content') || document.body;
    PermissionGuard._domObserver = new MutationObserver(function(mutations) {
      var hasNew = false;
      mutations.forEach(function(m) { if (m.addedNodes.length > 0) hasNew = true; });
      if (hasNew) _enforce();
    });
    PermissionGuard._domObserver.observe(contentEl, { childList: true, subtree: true });
  },

  _domObserver: null
};
