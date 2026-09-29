// =============================================
// FORMAT SCREEN LABEL — Universal Bilingual Label Formatter
// Strips Arabic parentheses for EN, extracts Arabic for AR
// Ensures clean English without Arabic parentheses in EN mode,
// and clean Arabic without English parentheses in AR mode.
// =============================================
(function() {
  'use strict';

  // Emoji pattern: match leading emoji characters
  var EMOJI_PATTERN = /^[\s]*(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F000}-\u{1FFFF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u2B50]|[\u2705]|[\u274C]|[\u2611]|[\u2714]|[\u2716]|[\u26A0]|[\u2699]|[\u2709]|[\u270F]|[\u2712]|[\u2702]|[\u2708]|[\u2764]|[\u267B]|[\u2728]|[\u2734]|[\u2747]|[\u2757]|[\u2753]|[\u2755]|[\uFE0F])+[\s]*/u;

  // Bilingual dictionaries for instant exact matching
  var EN_TO_AR = {
    // Navigation & Sections
    'Overview': 'نظرة عامة',
    'Dashboard': 'لوحة التحكم',
    'My Dashboard': 'لوحة التحكم',
    'My Info': 'بياناتي',
    'Self Service': 'الخدمة الذاتية',
    'Communication': 'التواصل',
    'Workplace': 'مكان العمل',
    'Workplace & Collaboration': 'مكان العمل والتواصل',
    'Communication & Workplace': 'التواصل ومكان العمل',
    'Management': 'الإدارة',
    'Team Management': 'إدارة الفريق',
    'Human Resources': 'الموارد البشرية',
    'HR': 'الموارد البشرية',
    'Factory Clinic': 'عيادة المصنع والتمريض',
    'Nursing Management': 'إدارة التمريض',
    'Operations & Logistics': 'العمليات واللوجستيات',
    'Warehouse & Supply Chain': 'المخازن وسلاسل الإمداد',
    'Procurement': 'المشتريات والموردين',
    'Sales & Customers': 'المبيعات والعملاء',
    'Sales & Products': 'المبيعات والمنتجات',
    'Production & Manufacturing': 'الإنتاج والتصنيع',
    'Quality Control': 'مراقبة الجودة',
    'Maintenance & Engineering': 'الصيانة والإدارة الهندسية',
    'Fleet & Logistics': 'النقل واللوجستيات',
    'Finance & Accounting': 'المالية والحسابات',
    'Legal & Compliance': 'الشؤون القانونية والامتثال',
    'Legal Affairs': 'الشؤون القانونية',
    'Admin & Executive AI': 'إدارة النظام والأمان والذكاء الاصطناعي',
    'Administration': 'إدارة النظام',
    'Enterprise Control': 'التحكم المؤسسي',
    'ERP Control': 'التحكم المؤسسي',
    'Collaboration': 'العمل الجماعي',
    'Analytics': 'التحليلات والتقارير',
    'Transportation': 'النقل والحركة',
    'Supply Chain': 'سلاسل الإمداد',
    'Production': 'الإنتاج',
    'Engineering': 'الإدارة الهندسية',
    'Quality': 'الجودة',
    'Maintenance': 'الصيانة',
    'Spare Parts': 'قطع الغيار',
    'Customer Portal': 'بوابة العملاء',
    'Supplier Portal': 'بوابة الموردين',

    // Screens
    'My Profile': 'ملفي الشخصي',
    'My Attendance': 'سجل حضوري',
    'Check-In': 'تسجيل حضور',
    'Check-In QR': 'تسجيل حضور',
    'Check-Out': 'تسجيل انصراف',
    'Check-Out QR': 'تسجيل انصراف',
    'My Leaves': 'إجازاتي',
    'My Salary': 'مفردات الراتب',
    'My Overtime': 'وقتي الإضافي',
    'My Loans': 'سلفياتي',
    'Medical Needs': 'طلباتي الطبية',
    'My Medical Needs': 'طلباتي الطبية',
    'My Delays': 'تأخيراتي',
    'My Missions': 'مأمورياتي',
    'My Expenses': 'مصروفاتي',
    'Complaints': 'الشكاوى والمقترحات',
    'My Complaints': 'الشكاوى والمقترحات',
    'Complaints & Grievances': 'الشكاوى والمقترحات',
    'Disciplinary & Grievances': 'الشكاوى والجزاءات',
    'Announcements': 'الإعلانات والتعميمات',
    'Internal Chat': 'المحادثات الداخلية',
    'Shift Marketplace': 'سوق تبديل الورديات',
    'Calendar': 'التقويم وجدول المواعيد',
    'Task Management': 'إدارة المهام',
    'My Tasks': 'مهامي',
    'Tasks': 'المهام',
    'Company Directory': 'دليل الشركة',
    'AI Mind': 'عقل الذكاء الاصطناعي',
    'Leave Approvals': 'موافقات الإجازات',
    'Purchase Approvals': 'موافقات طلبات الشراء',
    'Friday Work': 'عمل الجمعة',
    'Team Adjustments': 'تسويات الفريق',
    'HR Dashboard': 'لوحة الموارد البشرية',
    'Employees': 'سجلات الموظفين',
    'Attendance': 'الحضور والانصراف',
    'Shifts': 'إدارة الورديات',
    'Shift Management': 'إدارة الورديات',
    'Overtime': 'الوقت الإضافي',
    'Overtime Management': 'إدارة الوقت الإضافي',
    'Permission Requests': 'طلبات الأذونات',
    'All Delays': 'سجل التأخيرات',
    'All Missions': 'سجل المأموريات',
    'Employee Warnings': 'الإنذارات والجزاءات',
    'Warnings': 'الإنذارات',
    'Asset Assignment': 'تسليم العهد',
    'Payroll': 'الرواتب والأجور',
    'Payroll Funding': 'تمويل الرواتب',
    'Salary Adjustments': 'تعديلات الرواتب',
    'Recruitment': 'التوظيف والتعيين',
    'AI ATS': 'فحص السير الذاتية بالذكاء الاصطناعي',
    'Documents': 'إدارة المستندات',
    'Performance': 'تقييم الأداء',
    'Uniforms': 'الزي الرسمي',
    'Medical Requests': 'الطلبات الطبية',
    'Medical Approvals': 'الموافقات الطبية',
    'Factory Clinic & Nursing': 'عيادة المصنع والتمريض',
    'Factory Clinic & Nursing Hub': 'عيادة المصنع والتمريض',
    'Loans': 'السلف والقروض',
    'Loans & Advances': 'السلف والقروض',
    'Expenses': 'المصروفات',
    'Offboarding': 'إنهاء الخدمة',
    'Performance Reviews': 'مراجعات الأداء',
    'Training': 'التدريب والتطوير',
    'QR Generator': 'مولد رموز QR',
    'Inventory': 'المخازن والمستودعات',
    'Purchase Requests': 'طلبات الشراء والصرف',
    'Material Requests': 'طلبات صرف وشراء',
    'Spare Parts Lifecycle': 'دورة قطع الغيار',
    'Spare Parts': 'قطع الغيار',
    'WMS': 'إدارة المستودعات',
    'WMS Warehouse': 'إدارة المستودعات الذكية',
    'Suppliers': 'الموردين',
    'Supplier Management': 'إدارة الموردين',
    'Supplier Rating': 'تقييم الموردين',
    'Supplier Performance': 'تقييم الموردين',
    'Sales': 'المبيعات',
    'Sales Orders': 'أوامر البيع',
    'Products': 'المنتجات والكتالوج',
    'Products & Catalog': 'المنتجات والكتالوج',
    'Customer Requests': 'طلبات تسجيل العملاء',
    'Planning': 'تخطيط الإنتاج',
    'Production Planning': 'تخطيط الإنتاج',
    'Production Orders': 'أوامر الإنتاج',
    'BOM': 'مكونات المنتج (BOM)',
    'Traceability': 'تتبع مسار الإنتاج',
    'Production Traceability': 'تتبع مسار الإنتاج',
    'QC Inspections': 'فحص الجودة',
    'Projects & Designs': 'المشاريع والتصاميم الهندسية',
    'Maintenance & Facilities': 'الصيانة والمرافق',
    'Maintenance Companies': 'شركات الصيانة',
    'Equipment': 'المعدات والآلات',
    'Vehicle Movement': 'حركة السيارات واللوجستيات',
    'Fleet & Drivers': 'إدارة الأسطول والسائقين',
    'Financial Suite': 'الإدارة المالية الشاملة',
    'Financial Reports': 'التقارير المالية',
    'Chart of Accounts': 'شجرة الحسابات',
    'Driver Payments': 'حسابات ومستحقات السائقين',
    'Reports': 'التقارير والإحصائيات',
    'Reports & Analytics': 'التقارير والإحصائيات',
    'KPI Dashboard': 'مؤشرات الأداء الرئيسية',
    'Audit Log': 'سجل العمليات والنشاط',
    'Login History': 'سجل تسجيل الدخول',
    'Activity Log': 'سجل النشاطات',
    'Activity Timeline': 'الجدول الزمني للعمليات',
    'IT Support': 'الدعم الفني وتقنية المعلومات',
    'Document Management': 'إدارة المستندات والأرشيف',
    'Approval Workflows': 'مسارات الاعتماد والموافقات',
    'Global Search': 'البحث الشامل في النظام',
    'System Settings': 'إعدادات النظام',
    'Screen Permissions': 'صلاحيات الشاشات',
    'Permissions': 'صلاحيات الشاشات',
    'Notification Settings': 'إعدادات الإشعارات',
    'Notifications': 'الإشعارات',
    'Facebook Leads': 'عملاء فيسبوك',
    'Owner Dashboard': 'لوحة تحكم المالك',
    'CEO Dashboard': 'لوحة تحكم المدير التنفيذي',
    'AI CEO Dashboard': 'لوحة الذكاء الاصطناعي للمدير',
    'Cost Centers': 'مراكز التكلفة'
  };

  // Arabic to English dictionary for clean reverse translation
  var AR_TO_EN = {
    'تأخيراتي': 'My Delays',
    'المأموريات': 'My Missions',
    'مأمورياتي': 'My Missions',
    'حضور': 'Check-In',
    'انصراف': 'Check-Out',
    'تسجيل حضور': 'Check-In',
    'تسجيل انصراف': 'Check-Out',
    'بياناتي': 'My Info',
    'نظرة عامة': 'Overview',
    'لوحة التحكم': 'Dashboard',
    'ملفي الشخصي': 'My Profile',
    'سجل حضوري': 'My Attendance',
    'إجازاتي': 'My Leaves',
    'مرتبي': 'My Salary',
    'مفردات الراتب': 'My Salary',
    'راتبي': 'My Salary',
    'وقتي الإضافي': 'My Overtime',
    'الأوفرتايم': 'My Overtime',
    'سلفياتي': 'My Loans',
    'طلباتي الطبية': 'Medical Needs',
    'طلبات طبية': 'Medical Needs',
    'مصروفاتي': 'My Expenses',
    'الشكاوى': 'Complaints',
    'الشكاوى والمقترحات': 'Complaints',
    'الإعلانات': 'Announcements',
    'المحادثات': 'Internal Chat',
    'المحادثات الداخلية': 'Internal Chat',
    'سوق الورديات': 'Shift Marketplace',
    'التقويم': 'Calendar',
    'مهامي': 'My Tasks',
    'المهام': 'Tasks',
    'دليل الشركة': 'Company Directory',
    'موافقات الإجازات': 'Leave Approvals',
    'موافقات المشتريات': 'Purchase Approvals',
    'موافقات طلبات الشراء': 'Purchase Approvals',
    'عمل الجمعة': 'Friday Work',
    'تسويات الفريق': 'Team Adjustments',
    'الموظفين': 'Employees',
    'الحضور والانصراف': 'Attendance',
    'إدارة الورديات': 'Shift Management',
    'الوقت الإضافي': 'Overtime',
    'طلبات الأذونات': 'Permission Requests',
    'الأذونات': 'Permission Requests',
    'سجل التأخيرات': 'All Delays',
    'سجل المأموريات': 'All Missions',
    'الإنذارات': 'Warnings',
    'الإنذارات والجزاءات': 'Employee Warnings',
    'العهد': 'Asset Assignment',
    'الرواتب': 'Payroll',
    'سجل الرواتب': 'Payroll',
    'تمويل الرواتب': 'Payroll Funding',
    'تعديلات الرواتب': 'Salary Adjustments',
    'التوظيف': 'Recruitment',
    'المستندات': 'Documents',
    'تقييم الأداء': 'Performance',
    'الزي الرسمي': 'Uniforms',
    'الطلبات الطبية': 'Medical Requests',
    'عيادة المصنع والتمريض': 'Factory Clinic & Nursing',
    'الموافقات الطبية': 'Medical Approvals',
    'السلف': 'Loans',
    'السلفيات': 'Loans',
    'المصروفات': 'Expenses',
    'إنهاء الخدمة': 'Offboarding',
    'التدريب': 'Training',
    'المخازن': 'Inventory',
    'طلبات الشراء': 'Purchase Requests',
    'المبيعات': 'Sales',
    'المنتجات': 'Products',
    'أوامر البيع': 'Sales Orders',
    'طلبات التسجيل': 'Customer Requests',
    'التخطيط': 'Planning',
    'الإنتاج': 'Production',
    'الجودة': 'Quality',
    'الصيانة': 'Maintenance',
    'الهندسة': 'Engineering',
    'الإدارة الهندسية': 'Engineering',
    'شركات الصيانة': 'Maintenance Companies',
    'المعدات': 'Equipment',
    'قطع الغيار': 'Spare Parts',
    'النقل': 'Transportation',
    'النقل والحركة': 'Transportation',
    'اللوجستيات': 'Logistics',
    'حركة العربيات': 'Vehicle Movement',
    'حركة السيارات': 'Vehicle Movement',
    'الأسطول': 'Fleet',
    'إدارة الأسطول': 'Fleet & Drivers',
    'الموردين': 'Suppliers',
    'بوابة العملاء': 'Customer Portal',
    'بوابة الموردين': 'Supplier Portal',
    'لوحة تحكم المورد': 'Supplier Dashboard',
    'لوحة تحكم العميل': 'Customer Portal',
    'الإدارة المالية': 'Financial Suite',
    'التقارير المالية': 'Financial Reports',
    'شجرة الحسابات': 'Chart of Accounts',
    'حسابات السائقين': 'Driver Payments',
    'التقارير': 'Reports',
    'مؤشرات الأداء': 'KPI Dashboard',
    'سجل العمليات': 'Audit Log',
    'سجل الدخول': 'Login History',
    'سجل النشاط': 'Activity Log',
    'الدعم الفني': 'IT Support',
    'الشؤون القانونية': 'Legal Affairs',
    'الشئون القانونية': 'Legal Affairs',
    'مسارات الموافقات': 'Approval Workflows',
    'بحث موحد': 'Global Search',
    'البحث الشامل': 'Global Search',
    'إعدادات النظام': 'System Settings',
    'الإعدادات': 'System Settings',
    'الصلاحيات': 'Screen Permissions',
    'صلاحيات الشاشات': 'Screen Permissions',
    'الإشعارات': 'Notifications',
    'إعدادات الإشعارات': 'Notification Settings',
    'لوحة المالك': 'Owner Dashboard',
    'لوحة المدير': 'CEO Dashboard',
    'تكلفة الإدارات': 'Cost Centers',
    'إدارة المستودعات': 'WMS',
    'تتبع الإنتاج': 'Production Traceability',
    'تسجيل الدخول': 'Sign In',
    'اسم المستخدم': 'Username',
    'كلمة المرور': 'Password',
    'تسجيل الخروج': 'Sign Out',
    'تحديد الكل كمقروء': 'Mark all read',
    'لا توجد إشعارات حتى الآن': 'No notifications yet'
  };

  // Subtitle translations for headers
  var AR_SUBS = {
    'Overview & Analytics': 'نظرة عامة وتحليلات المؤسسة',
    'Manage all employees': 'إدارة جميع الموظفين وسجلات العمل',
    'Track employee attendance': 'تتبع سجلات الحضور والانصراف اليومية',
    'Handle leave requests': 'متابعة واعتماد طلبات الإجازات',
    'Morning, Evening & Night shifts': 'إدارة الورديات الصباحية والمسائية والليلية',
    'Track & approve overtime': 'تتبع واعتماد ساعات العمل الإضافي',
    'Salary processing & reports': 'معالجة مسيرات الرواتب وتقارير البنوك',
    'Company-wide messages': 'الإعلانات والتعميمات الإدارية للشركة',
    'Insights & data export': 'تحليلات متقدمة وتصدير البيانات',
    'System activity tracking': 'تتبع سجل نشاطات وأمان النظام',
    'Your attendance records': 'سجل حضورك وانصرافك الشخصي',
    'Generate changing QR codes for check-in/out': 'إنشاء رموز QR المتغيرة لتسجيل الحضور',
    'Scan QR to start your shift': 'امسح الرمز لبدء وردية عملك',
    'Scan QR to end your shift': 'امسح الرمز لإنهاء وردية عملك',
    'Your personal HR records': 'ملفك الوظيفي وسجلاتك في الموارد البشرية',
    'AI-powered applicant tracking & CV screening': 'فحص السير الذاتية بالذكاء الاصطناعي وتتبع المتقدمين',
    'Your leave requests': 'سجل طلبات الإجازة الخاصة بك',
    'Your salary details': 'تفاصيل ومفردات راتبك الشهري',
    'Your overtime records': 'سجل ساعات العمل الإضافي الخاصة بك',
    'Submit bonuses & penalties for your team': 'رفع المكافآت والجزاءات لفريق عملك',
    'Approve or reject manager requests': 'اعتماد أو رفض تسويات المديرين',
    'Manage job postings and applicants': 'إدارة إعلانات الوظائف والمتقدمين للعمل',
    'Track employee documents and expiries': 'متابعة وثائق ومستندات الموظفين وتواريخ انتهائها',
    'Employee appraisals and goals': 'تقييمات أداء الموظفين ومتابعة الأهداف',
    'Track issued uniforms and sizes': 'متابعة استلام وتسليم الزي الرسمي والمقاسات',
    'Manage employee loans': 'إدارة طلبات السلف والقروض وجدول سدادها',
    'Your loan requests and remaining balance': 'سجل سلفياتك والرصيد المتبقي للأقساط',
    'Manage medical needs and disbursements': 'إدارة الاحتياجات والروشتات الطبية للموظفين',
    'Upload medical needs and receipts': 'رفع الفواتير والاحتياجات والروشتات الطبية',
    'Review employee medical requests': 'مراجعة واعتماد الطلبات الطبية والصرف',
    'Daily clinic visits, occupational health, safety injuries, rest permits & pharmacy': 'سجل زيارات العيادة، إصابات العمل، تصاريح الراحة، والصيدلية',
    'Neural-powered workforce intelligence': 'ذكاء اصطناعي تحليلي للقوى العاملة',
    'Interactive Org Chart & Skills Finder': 'الهيكل التنظيمي التفاعلي ودليل الكفاءات',
    'Request and accept shift swaps intelligently': 'طلب وقبول تبادل الورديات بين الزملاء',
    'Manage and approve expense claims': 'إدارة واعتماد طلبات تسوية المصروفات',
    'Your expense claims': 'سجل مصروفاتك ومطالباتك المالية',
    'Complaints and disciplinary actions': 'سجل الشكاوى والتحقيقات الإدارية والجزاءات',
    'Manage employee exit process': 'إجراءات ومراحل إنهاء خدمة الموظفين',
    'Warehouse Management': 'إدارة المستودعات وحركة المخزون',
    'Warehouse and Procurement workflows': 'دورة عمل المخازن والمشتريات',
    'Manage treasury, AP/AR, assets, and more': 'إدارة الخزينة، المقبوضات والمدفوعات، الأصول الثابتة',
    'Technical support and issue tracking': 'الدعم الفني وتتبع الأعطال والتذاكر',
    'Company investigations and legal issues': 'الشؤون القانونية والتحقيقات الإدارية',
    'Enterprise Command Center': 'مركز القيادة والتحكم للمنشأة',
    'Department Costs & Analytics': 'تحليلات وتكاليف الإدارات ومراكز التكلفة',
    'Income statement & balance sheet': 'قوائم الدخل والميزانية العمومية والتقارير المالية',
    'General Ledger & Double-Entry': 'دفتر الأستاذ العام وقيود اليومية المزدوجة',
    'Sales orders & client management': 'أوامر البيع وإدارة العملاء وعروض الأسعار',
    'Manage industrial products and public catalog': 'إدارة المنتجات الصناعية والكتالوج العام',
    'Review pending customer registration requests': 'مراجعة طلبات تسجيل العملاء الجدد',
    'Production planning & scheduling': 'تخطيط الإنتاج والجدولة ومراقبة الخطوط',
    'Manufacturing & material requests': 'أوامر التصنيع وطلبات صرف المواد الخام',
    'QC inspections & approvals': 'فحوصات الجودة واعتمادات خطوط الإنتاج',
    'Technical specs & supervision': 'المواصفات الفنية والإشراف الهندسي والمشاريع',
    'Equipment repairs & preventative maintenance': 'إصلاحات المعدات وجداول الصيانة الوقائية',
    'Bill of Materials & production recipes': 'مكونات المنتجات وتركيبات التشغيل (BOM)',
    'Equipment registry, rental & tracking': 'سجل المعدات والآلات ومتابعة التشغيل',
    'Contractor management & visit tracking': 'إدارة مقاولي وشركات الصيانة ومتابعة الزيارات',
    'Search across all ERP modules': 'البحث الشامل والموحد في جميع أقسام النظام',
    'AI-powered supplier rating & analysis': 'تقييم الموردين بالذكاء الاصطناعي وتحليل الأداء',
    'Manage user & role access': 'إدارة صلاحيات الوصول على مستوى المستخدمين والأدوار',
    'Track batch from raw material to customer': 'تتبع التشغيلة من المادة الخام حتى التسليم للعميل',
    'Push notifications & channels': 'إعدادات قنوات الإشعارات والتنبيهات المباشرة',
    'Sync leads from Meta/Facebook': 'مزامنة بيانات العملاء المحتملين من فيسبوك',
    'Manage spare parts requests, returns, and quality checks': 'إدارة طلبات ومرتجعات وفحص جودة قطع الغيار',
    'Manage external suppliers': 'إدارة الموردين الخارجيين وسجلات التعامل',
    'View your orders and requests': 'عرض أوامر الشراء والطلبات المباشرة',
    'Manage driver and vehicle movements': 'إدارة حركة السائقين وتوزيع الرحلات',
    'Manage drivers, vehicles, and trips': 'إدارة أسطول النقل والسائقين والسيارات',
    'Real-time performance indicators': 'مؤشرات الأداء اللحظية ولوحات المتابعة',
    'Track all login attempts': 'سجل تتبع ومراقبة محاولات تسجيل الدخول',
    'Detailed system activity tracking': 'سجل تفصيلي دقيق لجميع نشاطات النظام',
    'Manage and track tasks': 'إدارة ومتابعة المهام ومراحل التنفيذ',
    'Team messaging & collaboration': 'المراسلات المباشرة والتعاون الداخلي للفريق',
    'Events, meetings & deadlines': 'الأحداث والاجتماعات والمواعيد النهائية',
    'Configure system parameters': 'تكوين وضبط إعدادات ومعايير النظام',
    'Upload and manage documents': 'رفع وأرشفة وتنظيم المستندات الإدارية',
    'Manage approval requests': 'إدارة واعتماد دورات الموافقات الإدارية',
    'Employee performance evaluation': 'متابعة وتقييم أداء وإنتاجية الموظفين',
    'Courses and skill development': 'الدورات التدريبية وتنمية مهارات العاملين',
    'Track company assets and custody': 'تتبع العهد المستلمة والأصول المسلمة للموظفين',
    'Manage employee early leave/absence permissions': 'إدارة أذونات الانصراف المبكر والغياب المؤقت',
    'Disciplinary actions and penalties': 'إجراءات التحقيق والجزاءات الإدارية والتأديبية',
    'Enterprise High-Level Overview': 'نظرة شمولية عليا لقيادة المنشأة',
    'Real-time audit of all operations': 'تدقيق وتسجيل فوري لكافة عمليات النظام',
    'Department Purchase Approvals — موافقة المدير على طلبات الشراء': 'موافقة مدير الإدارة على طلبات الشراء للأقسام',
    'Department Purchase Approvals': 'موافقات طلبات الشراء للأقسام'
  };

  function getLang(lang) {
    if (lang) return lang;
    if (typeof I18nEngine !== 'undefined' && I18nEngine.currentLang) return I18nEngine.currentLang;
    var stored = localStorage.getItem('lang');
    return stored || 'ar';
  }

  function stripEmoji(str) {
    if (!str) return '';
    return str.replace(EMOJI_PATTERN, '').trim();
  }

  function extractArabic(str) {
    if (!str) return null;
    var match = str.match(/\(([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][^)]*)\)/);
    return match ? match[1].trim() : null;
  }

  function extractEnglish(str) {
    if (!str) return '';
    var cleaned = stripEmoji(str);
    // Remove Arabic in parentheses
    cleaned = cleaned.replace(/\s*\([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF][^)]*\)/g, '');
    return cleaned.trim();
  }

  /**
   * Format a screen label based on current language
   * @param {string} label - The bilingual or language-specific string
   * @param {string} [lang] - 'ar' or 'en', auto-detected if omitted
   * @returns {string} Clean string for the active language
   */
  function formatScreenLabel(label, lang) {
    if (!label) return '';
    lang = getLang(lang);

    if (lang === 'en') {
      // 1. Strip leading emojis and remove any Arabic in parentheses
      var en = extractEnglish(label);

      // 2. If the result still contains Arabic letters, do reverse lookup
      if (/[\u0600-\u06FF]/.test(en)) {
        // Check for English inside parentheses: e.g. "نظام (ERP)" -> "ERP"
        var enParen = label.match(/\(([A-Za-z0-9\s&\/\\\-_.,]+)\)/);
        if (enParen && enParen[1].trim()) {
          return enParen[1].trim();
        }

        // Check direct Arabic-to-English dictionary
        var cleanAr = stripEmoji(label).trim();
        if (AR_TO_EN[cleanAr]) {
          return AR_TO_EN[cleanAr];
        }

        // Check reverse lookup in EN_TO_AR
        for (var enKey in EN_TO_AR) {
          if (EN_TO_AR[enKey] === cleanAr) {
            return enKey;
          }
        }

        // Check reverse lookup in global ARABIC_DICT if available
        if (typeof ARABIC_DICT !== 'undefined') {
          for (var dictKey in ARABIC_DICT) {
            if (ARABIC_DICT[dictKey] === cleanAr) {
              return dictKey;
            }
          }
        }

        // Strip remaining Arabic characters if mixed
        var stripped = en.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').trim();
        if (stripped) return stripped;
      }

      return en || label;
    } else {
      // ARABIC MODE:
      // 1. First, check if there is Arabic inside parentheses: e.g. "Check-In (حضور)" -> "حضور"
      var ar = extractArabic(label);
      if (ar) return ar;

      // 2. Check if subtitle has an exact Arabic translation
      var cleanEn = extractEnglish(label);
      if (AR_SUBS[cleanEn]) {
        return AR_SUBS[cleanEn];
      }
      if (AR_SUBS[label]) {
        return AR_SUBS[label];
      }

      // 3. Check EN_TO_AR dictionary
      if (EN_TO_AR[cleanEn]) {
        return EN_TO_AR[cleanEn];
      }
      if (EN_TO_AR[label]) {
        return EN_TO_AR[label];
      }

      // 4. Check global ARABIC_DICT
      if (typeof ARABIC_DICT !== 'undefined') {
        if (ARABIC_DICT[cleanEn]) return ARABIC_DICT[cleanEn];
        if (ARABIC_DICT[label]) return ARABIC_DICT[label];
      }

      // 5. If it's already Arabic, return it cleanly without English parentheses or leading emoji
      if (/[\u0600-\u06FF]/.test(label)) {
        return stripEmoji(label.replace(/\s*\([A-Za-z0-9\s&\/\\\-_.,]+\)/g, '')).trim();
      }

      return label;
    }
  }

  /**
   * Format a module/section label based on current language
   */
  function formatModuleLabel(label, lang) {
    return formatScreenLabel(label, lang);
  }

  // Expose globally
  var root = (typeof window !== 'undefined') ? window : (typeof global !== 'undefined' ? global : this);
  root.formatScreenLabel = formatScreenLabel;
  root.formatModuleLabel = formatModuleLabel;
  root.EN_TO_AR = EN_TO_AR;
  root.AR_TO_EN = AR_TO_EN;

})();
