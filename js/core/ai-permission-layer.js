// =============================================
// AI PERMISSION LAYER
// Prevents AI data leakage by enforcing permissions
// BEFORE any data is fetched or returned
// =============================================
window.AIPermissionLayer = {

  // Maps AI tool/intent names to required screen permissions
  _toolPermissionMap: {
    // HR Data
    'employees': ['employees'],
    'employee_list': ['employees'],
    'employee_count': ['employees'],
    'employee_details': ['employees'],
    'attendance': ['attendance'],
    'attendance_report': ['attendance', 'reports'],
    'delays': ['all-delays', 'attendance'],
    'leaves': ['leaves'],
    'leave_balance': ['leaves'],
    'overtime': ['overtime'],
    'payroll': ['payroll'],
    'salary': ['payroll'],
    'salary_report': ['payroll', 'reports'],
    'loans': ['loans'],
    'expenses': ['expenses'],
    'performance': ['performance'],
    'recruitment': ['recruitment'],
    'medical': ['medical-requests'],
    'complaints': ['complaints'],
    'disciplinary': ['complaints'],
    'uniforms': ['uniforms'],
    'documents': ['documents'],
    // Operations
    'inventory': ['inventory'],
    'warehouse': ['inventory'],
    'purchases': ['purchase-requests'],
    'sales': ['erp-sales'],
    'production': ['erp-production'],
    'quality': ['erp-quality'],
    'maintenance': ['erp-maintenance'],
    'equipment': ['erp-equipment'],
    'engineering': ['engineering'],
    'logistics': ['logistics'],
    'fleet': ['erp-fleet'],
    'suppliers': ['erp-suppliers'],
    // Finance
    'financial': ['petty-cash', 'financial-reports'],
    'accounts': ['chart-of-accounts'],
    'budget': ['budgets-inventory'],
    'assets': ['fixed-assets'],
    'banks': ['bank-management'],
    'checks': ['check-management'],
    // Admin
    'audit': ['audit-log'],
    'login_history': ['login-history'],
    'activity': ['activity-log-page'],
    'settings': ['system-settings'],
    'permissions': ['screen-permissions'],
    // Enterprise
    'full_analysis': ['owner-dashboard'],
    'company_report': ['owner-dashboard'],
    'kpi': ['kpi-dashboard'],
    'cost_centers': ['cost-centers']
  },

  /**
   * Check if user can access a specific AI tool/data domain
   * @param {string} toolName - AI tool or data domain name
   * @returns {boolean}
   */
  canAccessTool: function(toolName) {
    if (!App.user) return false;
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    var requiredScreens = AIPermissionLayer._toolPermissionMap[toolName];
    if (!requiredScreens) return false; // Unknown tool → deny

    // User needs access to at least one of the required screens
    return requiredScreens.some(function(screenId) {
      return PermissionGuard.canView(screenId);
    });
  },

  /**
   * Get all tools/domains the current user can access
   * @returns {string[]}
   */
  getAuthorizedTools: function() {
    if (!App.user) return [];
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return Object.keys(AIPermissionLayer._toolPermissionMap);
    }

    var authorized = [];
    var map = AIPermissionLayer._toolPermissionMap;
    for (var tool in map) {
      if (AIPermissionLayer.canAccessTool(tool)) {
        authorized.push(tool);
      }
    }
    return authorized;
  },

  /**
   * Filter data object to remove unauthorized modules
   * Used before AI processes aggregated data from AIBrain
   * @param {object} data - Data from AIBrain.fetchAllData
   * @returns {object} Filtered data
   */
  filterData: function(data) {
    if (!data) return {};
    if (App.user && App.user.role && App.user.role.toLowerCase() === 'owner') return data;

    var filtered = {};

    // Map data keys to tool names
    var dataKeyToTool = {
      'employees': 'employees',
      'attendance': 'attendance',
      'leaves': 'leaves',
      'payroll': 'payroll',
      'overtime': 'overtime',
      'inventory': 'inventory',
      'sales': 'sales',
      'purchases': 'purchases',
      'suppliers': 'suppliers',
      'maintenance': 'maintenance',
      'production': 'production',
      'quality': 'quality',
      'expenses': 'expenses',
      'loans': 'loans'
    };

    for (var key in data) {
      var tool = dataKeyToTool[key];
      if (!tool || AIPermissionLayer.canAccessTool(tool)) {
        filtered[key] = data[key];
      } else {
        filtered[key] = []; // Return empty array for unauthorized data
      }
    }

    return filtered;
  },

  /**
   * Build context string for AI prompt that describes user's permissions
   * This helps the AI understand what it can and cannot discuss
   * @returns {string}
   */
  buildPermissionContext: function() {
    if (!App.user) return '';

    var lang = (App.user.preferred_language === 'en') ? 'en' : 'ar';
    var authorized = AIPermissionLayer.getAuthorizedTools();

    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return lang === 'ar'
        ? 'هذا المستخدم هو مالك النظام وله صلاحية كاملة للوصول إلى جميع البيانات والتحليلات.'
        : 'This user is the system owner and has full access to all data and analytics.';
    }

    var sections = [];
    var toolGroups = {
      'HR': ['employees', 'attendance', 'delays', 'leaves', 'overtime', 'payroll', 'salary', 'loans', 'expenses', 'performance', 'recruitment', 'medical', 'complaints', 'uniforms', 'documents'],
      'Operations': ['inventory', 'purchases', 'sales', 'production', 'quality', 'maintenance', 'equipment', 'engineering', 'logistics', 'fleet', 'suppliers'],
      'Finance': ['financial', 'accounts', 'budget', 'assets', 'banks', 'checks'],
      'Admin': ['audit', 'login_history', 'activity', 'settings', 'permissions']
    };

    for (var group in toolGroups) {
      var groupTools = toolGroups[group].filter(function(t) {
        return authorized.indexOf(t) !== -1;
      });
      if (groupTools.length > 0) {
        sections.push(group + ': ' + groupTools.join(', '));
      }
    }

    if (lang === 'ar') {
      return 'المستخدم الحالي (' + App.user.full_name + ') لديه صلاحيات الوصول للأقسام التالية فقط:\n' +
        sections.join('\n') +
        '\nلا تقدم أي معلومات عن أقسام غير مصرح بها. إذا سأل عن قسم غير مصرح به، اعتذر بلطف.';
    } else {
      return 'Current user (' + App.user.full_name + ') has access to the following departments only:\n' +
        sections.join('\n') +
        '\nDo not provide any information about unauthorized departments. Politely decline if asked.';
    }
  },

  /**
   * Check AI query for potential permission violations
   * Simple keyword-based check before AI processes the query
   * @param {string} query - User's question/command
   * @returns {object} { allowed: boolean, deniedModules: string[], message: string }
   */
  validateQuery: function(query) {
    if (!query || !App.user) return { allowed: false, deniedModules: [], message: 'Not authenticated' };
    if (App.user.role && App.user.role.toLowerCase() === 'owner') {
      return { allowed: true, deniedModules: [], message: '' };
    }

    var q = query.toLowerCase();
    var denied = [];

    // Keyword to tool mapping for query analysis
    var keywordMap = {
      'salary': 'payroll', 'رواتب': 'payroll', 'مرتبات': 'payroll', 'راتب': 'payroll',
      'payroll': 'payroll', 'مرتب': 'payroll',
      'employee': 'employees', 'موظف': 'employees', 'موظفين': 'employees', 'عمال': 'employees',
      'attendance': 'attendance', 'حضور': 'attendance', 'انصراف': 'attendance',
      'delay': 'delays', 'تأخير': 'delays', 'تأخر': 'delays',
      'leave': 'leaves', 'إجازة': 'leaves', 'اجازة': 'leaves', 'إجازات': 'leaves',
      'overtime': 'overtime', 'إضافي': 'overtime', 'اضافي': 'overtime',
      'inventory': 'inventory', 'مخزون': 'inventory', 'مخازن': 'inventory',
      'sales': 'sales', 'مبيعات': 'sales',
      'purchase': 'purchases', 'مشتريات': 'purchases', 'شراء': 'purchases',
      'production': 'production', 'إنتاج': 'production', 'انتاج': 'production',
      'quality': 'quality', 'جودة': 'quality',
      'maintenance': 'maintenance', 'صيانة': 'maintenance',
      'finance': 'financial', 'مالية': 'financial', 'حسابات': 'financial',
      'loan': 'loans', 'سلفة': 'loans', 'سلف': 'loans', 'قرض': 'loans',
      'expense': 'expenses', 'مصروف': 'expenses', 'مصروفات': 'expenses'
    };

    var checkedTools = {};
    for (var keyword in keywordMap) {
      if (q.indexOf(keyword) !== -1) {
        var tool = keywordMap[keyword];
        if (!checkedTools[tool] && !AIPermissionLayer.canAccessTool(tool)) {
          denied.push(tool);
          checkedTools[tool] = true;
        }
      }
    }

    if (denied.length > 0) {
      var lang = (App.user.preferred_language === 'en') ? 'en' : 'ar';
      var message = lang === 'ar'
        ? 'عذراً، ليس لديك صلاحية للوصول إلى بيانات: ' + denied.join('، ') + '. تواصل مع مدير النظام لطلب الصلاحيات.'
        : 'Sorry, you do not have permission to access: ' + denied.join(', ') + '. Contact your system administrator for access.';

      return { allowed: false, deniedModules: denied, message: message };
    }

    return { allowed: true, deniedModules: [], message: '' };
  },

  /**
   * Sanitize query against prompt injection
   * @param {string} query
   * @returns {string} Sanitized query
   */
  sanitizeQuery: function(query) {
    if (!query) return '';

    // Remove dangerous patterns
    var dangerous = [
      /ignore\s+(all\s+)?previous\s+instructions/gi,
      /disregard\s+(all\s+)?previous/gi,
      /you\s+are\s+now\s+/gi,
      /act\s+as\s+if\s+you/gi,
      /pretend\s+(you\s+are|to\s+be)/gi,
      /bypass\s+(permission|security|auth)/gi,
      /تجاهل\s+التعليمات/gi,
      /تجاوز\s+الصلاحيات/gi
    ];

    var cleaned = query;
    dangerous.forEach(function(pattern) {
      cleaned = cleaned.replace(pattern, '[FILTERED]');
    });

    return cleaned;
  }
};
