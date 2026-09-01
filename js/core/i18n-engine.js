// =============================================
// ENHANCED i18n ENGINE — Per-User Bilingual System
// Extends existing I18n object without replacing it
// =============================================
window.I18nEngine = {

  // Current language (loaded from user profile)
  currentLang: 'ar',

  // Extended translation keys for new features
  _extraTranslations: {
    ar: {
      // Permission Guard
      'access_denied_title': 'غير مصرح بالدخول',
      'access_denied_msg': 'ليس لديك صلاحية للوصول إلى هذه الصفحة.',
      'back_to_dashboard': 'العودة للرئيسية',
      'no_permission_action': 'ليس لديك صلاحية لهذا الإجراء',

      // Permission Management
      'permissions_title': 'إدارة الصلاحيات',
      'permissions_screen': 'صلاحيات الشاشات',
      'select_user': 'اختر المستخدم',
      'select_role': 'اختر الدور',
      'all_roles': 'كل الأدوار',
      'grant_all': 'منح الكل',
      'revoke_all': 'إلغاء الكل',
      'copy_from_role': 'نسخ من دور',
      'save_permissions': 'حفظ الصلاحيات',
      'permissions_saved': 'تم حفظ الصلاحيات بنجاح',
      'bulk_actions': 'إجراءات جماعية',

      // Permission Actions
      'action_view': 'عرض',
      'action_create': 'إنشاء',
      'action_edit': 'تعديل',
      'action_delete': 'حذف',
      'action_approve': 'اعتماد',
      'action_reject': 'رفض',
      'action_export': 'تصدير',
      'action_print': 'طباعة',

      // Module Groups
      'module_overview': 'نظرة عامة',
      'module_my_info': 'معلوماتي',
      'module_communication': 'التواصل',
      'module_workplace': 'مكان العمل',
      'module_management': 'الإدارة',
      'module_hr': 'الموارد البشرية',
      'module_operations': 'العمليات',
      'module_finance': 'المالية',
      'module_admin': 'إدارة النظام',
      'module_enterprise': 'التحكم المؤسسي',
      'module_ai_reports': 'تقارير الذكاء الاصطناعي',

      // AI Chatbot Permission Messages
      'ai_no_permission': 'عذراً، ليس لديك صلاحية للوصول إلى بيانات هذا القسم.',
      'ai_restricted': 'هذه المعلومات متاحة فقط للمستخدمين المصرح لهم.',
      'ai_ask_admin': 'تواصل مع مدير النظام لطلب صلاحيات إضافية.',

      // AI Reports
      'ai_reports_title': 'تقارير الذكاء الاصطناعي',
      'monthly_report': 'تقرير شهري',
      'semiannual_report': 'تقرير نصف سنوي',
      'annual_report': 'تقرير سنوي',
      'custom_report': 'تقرير مخصص',
      'generate_report': 'إنشاء تقرير',
      'report_generated': 'تم إنشاء التقرير بنجاح',
      'generating_report': 'جاري إنشاء التقرير...',
      'report_history': 'سجل التقارير',
      'view_report': 'عرض التقرير',
      'export_report': 'تصدير التقرير',
      'print_report': 'طباعة التقرير',
      'no_reports': 'لا توجد تقارير بعد',
      'select_period': 'اختر الفترة',
      'from_date': 'من تاريخ',
      'to_date': 'إلى تاريخ',

      // Analytics Labels
      'total_employees': 'إجمالي الموظفين',
      'active_employees': 'الموظفين النشطين',
      'new_employees': 'الموظفين الجدد',
      'employees_left': 'الموظفين المغادرين',
      'turnover_rate': 'معدل الدوران',
      'attendance_rate': 'معدل الحضور',
      'late_rate': 'معدل التأخير',
      'absence_rate': 'معدل الغياب',
      'overtime_hours': 'ساعات العمل الإضافي',
      'total_salary_cost': 'إجمالي تكلفة الرواتب',
      'avg_salary': 'متوسط الراتب',
      'active_loans': 'السلف النشطة',
      'dept_analysis': 'تحليل الأقسام',
      'user_activity': 'نشاط المستخدمين',
      'login_count': 'عدد تسجيلات الدخول',
      'most_active_users': 'أكثر المستخدمين نشاطاً',
      'most_used_screens': 'أكثر الشاشات استخداماً',
      'recommendations': 'التوصيات',
      'anomalies': 'الملاحظات غير العادية',
      'executive_summary': 'الملخص التنفيذي',
      'period_comparison': 'مقارنة بالفترة السابقة',
      'vs_previous': 'مقارنة بالسابق',
      'improvement': 'تحسن',
      'decline': 'تراجع',

      // Language System
      'language_changed': 'تم تغيير اللغة',
      'language_ar': 'العربية',
      'language_en': 'English',
      'switch_language': 'تغيير اللغة'
    },
    en: {
      // Permission Guard
      'access_denied_title': 'Access Denied',
      'access_denied_msg': 'You do not have permission to access this page.',
      'back_to_dashboard': 'Back to Dashboard',
      'no_permission_action': 'You do not have permission for this action',

      // Permission Management
      'permissions_title': 'Permission Management',
      'permissions_screen': 'Screen Permissions',
      'select_user': 'Select User',
      'select_role': 'Select Role',
      'all_roles': 'All Roles',
      'grant_all': 'Grant All',
      'revoke_all': 'Revoke All',
      'copy_from_role': 'Copy from Role',
      'save_permissions': 'Save Permissions',
      'permissions_saved': 'Permissions saved successfully',
      'bulk_actions': 'Bulk Actions',

      // Permission Actions
      'action_view': 'View',
      'action_create': 'Create',
      'action_edit': 'Edit',
      'action_delete': 'Delete',
      'action_approve': 'Approve',
      'action_reject': 'Reject',
      'action_export': 'Export',
      'action_print': 'Print',

      // Module Groups
      'module_overview': 'Overview',
      'module_my_info': 'My Info',
      'module_communication': 'Communication',
      'module_workplace': 'Workplace',
      'module_management': 'Management',
      'module_hr': 'Human Resources',
      'module_operations': 'Operations',
      'module_finance': 'Finance',
      'module_admin': 'System Admin',
      'module_enterprise': 'Enterprise Control',
      'module_ai_reports': 'AI Reports',

      // AI Chatbot Permission Messages
      'ai_no_permission': 'Sorry, you do not have permission to access this department\'s data.',
      'ai_restricted': 'This information is available only to authorized users.',
      'ai_ask_admin': 'Contact your system administrator to request additional permissions.',

      // AI Reports
      'ai_reports_title': 'AI Reports',
      'monthly_report': 'Monthly Report',
      'semiannual_report': 'Semiannual Report',
      'annual_report': 'Annual Report',
      'custom_report': 'Custom Report',
      'generate_report': 'Generate Report',
      'report_generated': 'Report generated successfully',
      'generating_report': 'Generating report...',
      'report_history': 'Report History',
      'view_report': 'View Report',
      'export_report': 'Export Report',
      'print_report': 'Print Report',
      'no_reports': 'No reports yet',
      'select_period': 'Select Period',
      'from_date': 'From Date',
      'to_date': 'To Date',

      // Analytics Labels
      'total_employees': 'Total Employees',
      'active_employees': 'Active Employees',
      'new_employees': 'New Employees',
      'employees_left': 'Employees Left',
      'turnover_rate': 'Turnover Rate',
      'attendance_rate': 'Attendance Rate',
      'late_rate': 'Late Rate',
      'absence_rate': 'Absence Rate',
      'overtime_hours': 'Overtime Hours',
      'total_salary_cost': 'Total Salary Cost',
      'avg_salary': 'Average Salary',
      'active_loans': 'Active Loans',
      'dept_analysis': 'Department Analysis',
      'user_activity': 'User Activity',
      'login_count': 'Login Count',
      'most_active_users': 'Most Active Users',
      'most_used_screens': 'Most Used Screens',
      'recommendations': 'Recommendations',
      'anomalies': 'Anomalies',
      'executive_summary': 'Executive Summary',
      'period_comparison': 'Period Comparison',
      'vs_previous': 'vs Previous',
      'improvement': 'Improvement',
      'decline': 'Decline',

      // Language System
      'language_changed': 'Language Changed',
      'language_ar': 'العربية',
      'language_en': 'English',
      'switch_language': 'Switch Language'
    }
  },

  /**
   * Initialize the language engine from user profile
   */
  init: function() {
    // Priority: user DB setting > localStorage > default 'ar'
    if (App.user && App.user.preferred_language) {
      I18nEngine.currentLang = App.user.preferred_language;
    } else {
      I18nEngine.currentLang = localStorage.getItem('lang') || 'ar';
    }

    // Apply to existing I18n if it exists
    if (typeof I18n !== 'undefined') {
      I18n.currentLang = I18nEngine.currentLang;
    }

    // Set direction and body class
    I18nEngine.applyDirection();

    // Sync localStorage
    localStorage.setItem('lang', I18nEngine.currentLang);
  },

  /**
   * Apply RTL/LTR direction
   */
  applyDirection: function() {
    if (I18nEngine.currentLang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
      document.body.classList.add('rtl-layout');
      document.body.classList.remove('ltr-layout');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
      document.body.classList.remove('rtl-layout');
      document.body.classList.add('ltr-layout');
    }
  },

  /**
   * Translate a key
   * @param {string} key - Translation key
   * @param {object} vars - Optional interpolation variables
   * @returns {string}
   */
  t: function(key, vars) {
    var lang = I18nEngine.currentLang || 'ar';
    var text = null;

    // 1. Check extended translations
    if (I18nEngine._extraTranslations[lang] && I18nEngine._extraTranslations[lang][key]) {
      text = I18nEngine._extraTranslations[lang][key];
    }
    // 2. Check existing ARABIC_DICT for Arabic
    else if (lang === 'ar' && typeof ARABIC_DICT !== 'undefined' && ARABIC_DICT[key]) {
      text = ARABIC_DICT[key];
    }
    // 3. Check loaded JSON translations
    else if (typeof I18n !== 'undefined' && I18n.translations && I18n.translations[key]) {
      text = I18n.translations[key];
    }
    // 4. Fallback: return the key itself (cleaned up)
    else {
      text = key.replace(/_/g, ' ');
    }

    // Variable interpolation: {{varName}}
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach(function(v) {
        text = text.replace(new RegExp('\\{\\{' + v + '\\}\\}', 'g'), vars[v]);
      });
    }

    return text;
  },

  /**
   * Switch language and save to DB
   * @param {string} lang - 'ar' or 'en'
   * @param {function} cb - Optional callback
   */
  switchLanguage: function(lang, cb) {
    if (lang !== 'ar' && lang !== 'en') return;
    I18nEngine.currentLang = lang;
    localStorage.setItem('lang', lang);

    // Apply direction immediately
    I18nEngine.applyDirection();

    // Save to user profile in DB
    if (App.user && App.user.id) {
      sbClient.from('users').update({ preferred_language: lang }).eq('id', App.user.id)
        .then(function(res) {
          if (res.error) console.warn('Language save error:', res.error.message);
          else App.user.preferred_language = lang;
        });
    }

    // Update existing I18n
    if (typeof I18n !== 'undefined') {
      I18n.currentLang = lang;
      if (typeof I18n.loadTranslations === 'function') I18n.loadTranslations();
    }

    // Reload page to apply all translations
    if (cb) cb();
    else window.location.reload();
  },

  /**
   * Get current language direction
   */
  isRTL: function() {
    return I18nEngine.currentLang === 'ar';
  },

  /**
   * Format number with locale
   */
  formatNumber: function(num) {
    if (typeof num !== 'number') num = parseFloat(num) || 0;
    return num.toLocaleString(I18nEngine.currentLang === 'ar' ? 'ar-EG' : 'en-US');
  },

  /**
   * Format currency
   */
  formatCurrency: function(amount) {
    if (typeof amount !== 'number') amount = parseFloat(amount) || 0;
    var label = I18nEngine.currentLang === 'ar' ? 'ج.م' : 'EGP';
    return label + ' ' + I18nEngine.formatNumber(amount);
  },

  /**
   * Format date with locale
   */
  formatDate: function(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(I18nEngine.currentLang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }
};

// Global shorthand
window.t = function(key, vars) { return I18nEngine.t(key, vars); };
