// =============================================
// CENTRALIZED PERMISSION GUARD
// Single source of truth for all authorization
// =============================================
window.PermissionGuard = {

  // ===== MODULE MAPPING =====
  // Maps screen IDs to their parent module for grouped permission checking
  _moduleMap: {
    // Overview
    'dashboard': 'overview',
    // My Info (always allowed for the user themselves)
    'hr-personal': 'my-info', 'my-attendance': 'my-info', 'scan-checkin': 'my-info',
    'scan-checkout': 'my-info', 'my-leaves': 'my-info', 'my-salary': 'my-info',
    'my-overtime': 'my-info', 'my-loans': 'my-info', 'my-medical': 'my-info',
    'my-delays': 'my-info', 'my-missions': 'my-info', 'my-expenses': 'my-info',
    // Communication
    'announcements': 'communication', 'internal-chat': 'communication',
    // Workplace
    'shift-swap': 'workplace', 'calendar': 'workplace', 'task-management': 'workplace',
    'org-directory': 'workplace', 'ai-mind': 'workplace',
    // Management
    'leaves': 'management', 'dept-purchase-approvals': 'management',
    'friday-work': 'management', 'team-adjustments': 'management',
    // HR
    'employees': 'hr', 'attendance': 'hr', 'shifts': 'hr', 'overtime': 'hr',
    'absence-leave': 'hr', 'all-delays': 'hr', 'all-missions': 'hr',
    'employee-warnings': 'hr', 'asset-assignment': 'hr', 'payroll': 'hr',
    'payroll-funding': 'hr', 'hr-adjustments': 'hr', 'recruitment': 'hr',
    'hr-ats': 'hr', 'documents': 'hr', 'performance': 'hr', 'uniforms': 'hr',
    'medical-requests': 'hr', 'nursing-medical-approvals': 'hr', 'loans': 'hr',
    'expenses': 'hr', 'complaints': 'hr', 'offboarding': 'hr',
    'performance-reviews': 'hr', 'training': 'hr', 'hr-qr-generator': 'hr',
    // Operations
    'inventory': 'operations', 'purchase-requests': 'operations',
    'erp-sales': 'operations', 'erp-products': 'operations',
    'customer-requests': 'operations', 'erp-planning': 'operations',
    'erp-production': 'operations', 'erp-bom': 'operations',
    'production-trace': 'operations', 'erp-quality': 'operations',
    'engineering': 'operations', 'erp-maintenance': 'operations',
    'erp-equipment': 'operations', 'maint-companies': 'operations',
    'spare-parts': 'operations', 'logistics': 'operations',
    'erp-fleet': 'operations', 'erp-suppliers': 'operations',
    'supplier-performance': 'operations', 'supplier-portal': 'operations',
    // Finance
    'petty-cash': 'finance', 'financial-reports': 'finance',
    'chart-of-accounts': 'finance', 'driver-payments': 'finance',
    'finance-kpi': 'finance', 'bank-management': 'finance',
    'journal-engine': 'finance', 'check-management': 'finance',
    'loans-taxes': 'finance', 'budgets-inventory': 'finance',
    'fixed-assets': 'finance', 'ai-cfo': 'finance',
    'closing-wizard': 'finance', 'finance-reports-ent': 'finance',
    // Admin
    'reports': 'admin', 'kpi-dashboard': 'admin', 'audit-log': 'admin',
    'login-history': 'admin', 'activity-log-page': 'admin',
    'it-tickets': 'admin', 'legal-affairs': 'admin',
    'document-management': 'admin', 'approval-workflows': 'admin',
    'global-search': 'admin', 'system-settings': 'admin',
    'screen-permissions': 'admin', 'notification-settings': 'admin',
    'facebook-leads': 'admin',
    // Enterprise Control
    'owner-dashboard': 'enterprise', 'ceo-dashboard': 'enterprise',
    'ai-ceo-dashboard': 'enterprise', 'cost-centers': 'enterprise',
    'activity-timeline': 'enterprise',
    // AI Reports (new)
    'ai-reports': 'ai-reports'
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
   * Check if user can access a screen
   * @param {string} screenId - e.g. 'erp-sales', 'employees'
   * @returns {boolean}
   */
  canView: function(screenId) {
    if (!App.user) return false;

    // Owner has FULL access — but through the system, not bypassing it
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    // Self-service screens are always accessible
    if (PermissionGuard._selfServiceScreens.indexOf(screenId) !== -1) return true;

    // If user has custom permissions configured, strictly use them
    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers._hasCustomConfig) {
      return SecurityHelpers._cachedPermissions.some(function(p) {
        return p.module === screenId && p.granted;
      });
    }

    // Fallback: no custom config = allow (legacy behavior preserved)
    return true;
  },

  /**
   * Check if user has a specific action permission on a screen
   * @param {string} screenId - e.g. 'erp-sales'
   * @param {string} action - e.g. 'view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'print'
   * @returns {boolean}
   */
  canAction: function(screenId, action) {
    if (!App.user) return false;
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    // Self-service screens: allow view + create for own data
    if (PermissionGuard._selfServiceScreens.indexOf(screenId) !== -1) {
      if (action === 'view' || action === 'create') return true;
    }

    // Use SecurityHelpers if custom config exists
    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers._hasCustomConfig) {
      return SecurityHelpers._cachedPermissions.some(function(p) {
        return p.module === screenId && p.action === action && p.granted;
      });
    }

    // HR Manager fallback: most actions allowed
    if (App.user.role && ['hr manager', 'hr'].indexOf(App.user.role.toLowerCase()) !== -1) {
      if (screenId === 'system-settings' && action === 'manage') return false;
      return true;
    }

    // Legacy fallback for managers
    if (App.user.role && ['hall manager', 'department head', 'manager', 'supervisor'].indexOf(App.user.role.toLowerCase()) !== -1) {
      if (action === 'view' || action === 'create' || action === 'approve' || action === 'reject') return true;
    }

    // Default: view allowed if screen is in sidebar, deny write actions
    if (action === 'view') return true;
    return false;
  },

  /**
   * Shorthand: hasPermission(screenId, action) — compatible with existing SecurityHelpers.hasPermission
   */
  hasPermission: function(screenId, action) {
    return PermissionGuard.canAction(screenId, action || 'view');
  },

  /**
   * Check if user can access a module group
   * @param {string} moduleGroup - e.g. 'hr', 'finance', 'operations'
   */
  canAccessModule: function(moduleGroup) {
    if (!App.user) return false;
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    // Check if user has any screen in this module group
    var map = PermissionGuard._moduleMap;
    for (var screenId in map) {
      if (map[screenId] === moduleGroup && PermissionGuard.canView(screenId)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Get all screens the user can access
   * @returns {string[]} Array of screen IDs
   */
  getAuthorizedScreens: function() {
    if (!App.user) return [];
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return Object.keys(PermissionGuard._moduleMap);
    }

    var screens = PermissionGuard._selfServiceScreens.slice(); // copy

    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers._hasCustomConfig) {
      SecurityHelpers._cachedPermissions.forEach(function(p) {
        if (p.granted && screens.indexOf(p.module) === -1 && p.module !== 'SYSTEM_CONFIG') {
          screens.push(p.module);
        }
      });
    }

    return screens;
  },

  /**
   * Get all authorized actions for a specific screen
   * @param {string} screenId
   * @returns {string[]} Array of action names
   */
  getAuthorizedActions: function(screenId) {
    if (!App.user) return [];
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'print'];
    }

    var actions = [];
    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers._hasCustomConfig) {
      SecurityHelpers._cachedPermissions.forEach(function(p) {
        if (p.module === screenId && p.granted && actions.indexOf(p.action) === -1) {
          actions.push(p.action);
        }
      });
    } else {
      // Legacy fallback
      actions = ['view'];
      if (App.isHR()) actions = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'export', 'print'];
      else if (App.isManager()) actions = ['view', 'create', 'approve', 'reject'];
    }
    return actions;
  },

  /**
   * Get the module group for a screen
   */
  getModuleGroup: function(screenId) {
    return PermissionGuard._moduleMap[screenId] || 'other';
  },

  /**
   * Render Access Denied page
   */
  renderAccessDenied: function(el) {
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar' ? '🚫 غير مصرح بالدخول' : '🚫 Access Denied';
    var msg = lang === 'ar'
      ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة. تواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.'
      : 'You do not have permission to access this page. Contact your system administrator if you believe this is an error.';
    var btnText = lang === 'ar' ? 'العودة للرئيسية' : 'Back to Dashboard';

    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:60vh;text-align:center">' +
      '<div style="max-width:420px">' +
      '<div style="font-size:80px;margin-bottom:16px;opacity:0.3">🔒</div>' +
      '<h2 style="margin-bottom:12px;color:var(--text-primary)">' + title + '</h2>' +
      '<p style="color:var(--text-muted);margin-bottom:24px;line-height:1.6">' + msg + '</p>' +
      '<button class="btn btn-primary" onclick="App.navigate(\'dashboard\')">' + btnText + '</button>' +
      '</div></div>';

    // Log unauthorized access attempt
    if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers.logActivity) {
      SecurityHelpers.logActivity('security', 'UNAUTHORIZED_ACCESS', 'screen', App.activePage);
    }
  },

  /**
   * Apply action-level permissions to buttons on current page
   * Enhanced version of SecurityHelpers.applyPermissionsUI
   */
  enforceActionPermissions: function(screenId) {
    if (PermissionGuard._domObserver) {
      PermissionGuard._domObserver.disconnect();
      PermissionGuard._domObserver = null;
    }

    if (!App.user || (App.user.role && App.user.role.toLowerCase() === 'owner')) return;
    // Don't enforce action permissions on the permissions management page itself
    if (screenId === 'screen-permissions') return;

    var _enforce = function() {
      document.querySelectorAll('button:not(.nav-link):not(.sidebar-btn):not(.sidebar-item):not([data-pg-checked])').forEach(function(btn) {
        btn.setAttribute('data-pg-checked', 'true');
        var action = 'view';
        var text = (btn.innerText || '').toLowerCase();

        if (text.match(/إضافة|create|add|جديد|new/)) action = 'create';
        else if (text.match(/تعديل|edit|update|حفظ|save/)) action = 'edit';
        else if (text.match(/حذف|delete|remove|مسح|🗑/)) action = 'delete';
        else if (text.match(/اعتماد|approve|موافقة/)) action = 'approve';
        else if (text.match(/رفض|reject/)) action = 'reject';
        else if (text.match(/تصدير|export/)) action = 'export';
        else if (text.match(/طباعة|print/)) action = 'print';
        else return; // skip view-only buttons

        if (!PermissionGuard.canAction(screenId, action)) {
          btn.disabled = true;
          btn.style.opacity = '0.35';
          btn.style.cursor = 'not-allowed';
          btn.title = App.user.preferred_language === 'en'
            ? 'You do not have permission for this action'
            : 'ليس لديك صلاحية لهذا الإجراء';
          btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
          btn.addEventListener('click', function(e) { e.stopImmediatePropagation(); e.preventDefault(); }, true);
        }
      });
    };

    _enforce();
    setTimeout(_enforce, 500);

    // Watch for dynamic DOM changes
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
