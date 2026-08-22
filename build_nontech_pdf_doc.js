const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Starting Master Non-Technical ERP System Manual PDF Generator ===');

// 1. Parse Database Schema to extract all tables and generate human-friendly Arabic descriptions
function parseDatabaseSchema() {
  const sqlFiles = [
    'supabase_schema.sql',
    'setup_erp_v2.sql',
    'setup_accounting.sql',
    'setup_fleet_module.sql',
    'setup_logistics.sql',
    'setup_spare_parts.sql',
    'setup_engineering.sql',
    'setup_hr_absence.sql',
    'setup_attendance_v2.sql',
    'SUPABASE_COPY_PASTE.sql',
    'SUPABASE_PART5_ONLY.sql',
    'driver_system_upgrade.sql',
    'fleet_odometer_setup.sql',
    'migrations/001_enterprise_security.sql',
    'migrations/002_enterprise_multi.sql',
    'migrations/003_enterprise_features.sql',
    'migrations/004_enterprise_kpis_views.sql',
    'migrations/005_enterprise_extra.sql',
    'migrations/006_public_product_catalog.sql',
    'migrations/007_client_auth.sql',
    'migrations/007_premium_ats.sql',
    'migrations/008_manufacturing_equipment.sql',
    'migrations/009_password_encryption.sql',
    'migrations/010_bilingual_chat.sql',
    'migrations/011_screen_permissions.sql',
    'migrations/ai_erp_migration.sql',
    'migrations/setup_finance_enterprise.sql'
  ];

  let tables = {};

  const fieldDescriptions = {
    'id': 'الرقم التعريفي الفريد المميز للسجل',
    'user_id': 'الرقم الخاص بالموظف أو المستخدم في النظام',
    'created_at': 'تاريخ وساعة إنشاء التسجيل تلقائياً',
    'updated_at': 'تاريخ وساعة آخر تعديل تم على السجل',
    'status': 'حالة الطلب أو السجل الحالية (مقبول/مرفوض/معلق)',
    'full_name': 'الاسم الكامل والشخصي للموظف أو العميل',
    'email': 'البريد الإلكتروني المعتمد للتواصل والإشعارات',
    'phone': 'رقم الهاتف ورقم التواصل المعتمد',
    'role': 'الدور الوظيفي ومستوى الوصول للموظف',
    'department': 'اسم الإدارة أو القسم التابع له الموظف',
    'salary': 'قيمة الراتب الأساسي الشهري بالجنيه',
    'net_salary': 'صافي المستحق للراتب بعد الخصومات والبدلات',
    'amount': 'المبلغ المالي الإجمالي للمعاملة',
    'description': 'الوصف التفصيلي والشارح للعملية',
    'notes': 'ملاحظات وتوجيهات إضافية مسجلة',
    'date': 'تاريخ العملية أو الحركة',
    'time': 'التوقيت الزمني الدقيق للعملية',
    'code': 'الكود المرجعي الفريد للتعريف',
    'name': 'الاسم المعتمد في السجلات الرسمية',
    'quantity': 'الكمية العددية المطلوبة أو المتوفرة',
    'price': 'السعر الفردي للوحدة',
    'total': 'إجمالي التكلفة أو القيمة المالية',
    'safe_id': 'الرقم التعريفي للخزينة المالية المستخدمة',
    'bank_id': 'الرقم التعريفي للحساب البنكي المستخدم',
    'check_in': 'وقت وتاريخ تسجيل الحضور',
    'check_out': 'وقت وتاريخ تسجيل الانصراف',
    'penalty': 'قيمة خصم الجزاء المالي المقدر'
  };

  sqlFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    const sql = fs.readFileSync(fullPath, 'utf8');

    const tableRegex = /CREATE\ TABLE\ (IF\ Not\ EXISTS\ )?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tName = match[2].toLowerCase().trim();
      const body = match[3];

      if (!tables[tName]) {
        tables[tName] = { name: tName, columns: [], source: relPath };

        const lines = body.split('\n');
        lines.forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('FOREIGN KEY') || line.startsWith('UNIQUE')) {
            return;
          }
          const colMatch = line.match(/^"?([a-zA-Z0-9_]+)"?\s+([a-zA-Z0-9_]+(?:\([0-9,\s]+\))?)(.*)/);
          if (colMatch) {
            const colName = colMatch[1];
            const colType = colMatch[2];
            const rest = colMatch[3] || '';
            
            const isPk = /PRIMARY\ KEY/i.test(rest) || colName === 'id';
            const isFk = /REFERENCES/i.test(rest);

            let desc = fieldDescriptions[colName] || `بيان تشغيلي يمثل (${colName}) في سجلات النظام`;

            tables[tName].columns.push({
              name: colName,
              type: colType,
              pk: isPk,
              fk: isFk,
              desc: desc
            });
          }
        });
      }
    }
  });

  return tables;
}

const dbSchema = parseDatabaseSchema();
const tableKeys = Object.keys(dbSchema).sort();
console.log(`Parsed ${tableKeys.length} total database tables for non-technical documentation.`);

// 2. Generate HTML Content focused 100% on Non-Technical Explanation
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>دليل التشغيل الشامل ودليل المستخدم النهائي - Smart Factory ERP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1e293b;
      background: #ffffff;
      direction: rtl;
    }
    
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-center {
        content: "صفحة " counter(page) " من " counter(pages);
        font-family: 'Cairo', sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }
    
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #065f46 0%, #047857 50%, #064e3b 100%);
      color: #ffffff;
      border-radius: 12px;
    }
    
    .cover-logo {
      width: 140px;
      height: 140px;
      background: rgba(255, 255, 255, 0.15);
      border: 3px solid #34d399;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 65px;
      margin-top: 30px;
      box-shadow: 0 10px 25px rgba(52, 211, 153, 0.4);
    }
    
    .cover-title { font-size: 26pt; font-weight: 900; color: #ffffff; margin-bottom: 15px; }
    .cover-subtitle { font-size: 15pt; font-weight: 600; color: #a7f3d0; margin-bottom: 25px; }
    .cover-badge {
      display: inline-block; padding: 8px 24px; background: rgba(52, 211, 153, 0.2);
      border: 1px solid #34d399; border-radius: 30px; font-size: 11pt; color: #ecfdf5; margin-bottom: 30px;
    }
    .cover-meta {
      width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 20px;
      display: flex; justify-content: space-around; font-size: 10pt; color: #d1fae5;
    }
    
    .page-break { page-break-after: always; }
    .chapter-title {
      font-size: 20pt; font-weight: 800; color: #064e3b; border-bottom: 4px solid #059669;
      padding-bottom: 8px; margin-top: 25px; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
    }
    .section-title {
      font-size: 13pt; font-weight: 700; color: #047857; margin-top: 22px; margin-bottom: 12px;
      background: #ecfdf5; padding: 8px 14px; border-right: 5px solid #10b981; border-radius: 4px;
    }
    
    p { margin-bottom: 12px; text-align: justify; color: #334155; }
    ul, ol { margin-right: 25px; margin-bottom: 15px; color: #334155; }
    li { margin-bottom: 6px; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 9.5pt; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
    th { background-color: #064e3b; color: #ffffff; font-weight: 700; font-size: 10pt; }
    tr:nth-child(even) { background-color: #f8fafc; }

    .diagram-box {
      background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px;
      padding: 15px; margin: 15px 0; text-align: center;
    }
    .diagram-svg { width: 100%; max-width: 750px; height: auto; margin: 0 auto; }
    
    .notice-box {
      background: #eff6ff; border-right: 4px solid #3b82f6; padding: 12px 16px;
      border-radius: 6px; margin: 15px 0; color: #1e40af; font-size: 10pt;
    }

    .proposal-card {
      background: #fdf4ff; border: 2px solid #c084fc; border-radius: 10px; padding: 20px; margin-top: 20px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="cover-logo">🏢</div>
      <h1 class="cover-title">الدليل التشغيلي والنظرة الوظيفية الشاملة</h1>
      <div class="cover-subtitle">نظام إدارة المصانع الذكية والموارد البشرية (Smart Factory Enterprise ERP)</div>
      <div class="cover-badge">دليل الإدارات والشاشات والخطوات - مبسط بالكامل لغير المبرمجين</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #ecfdf5; font-size: 11pt;">دليل الاستخدام والتشغيل التفصيلي الموجه للإدارة العليا، مدراء الأقسام، والموظفين. يقدم شرحاً شاملاً لكافة الوظائف، الشاشات، مسارات العمل، وقاعدة البيانات بدون أكواد برمجية.</p>
    </div>

    <div class="cover-meta">
      <div><strong>فترة التطوير الميداني:</strong> 1 يناير 2026 حتى 22 أغسطس 2026 (مستمر والتحديث جارٍ)</div>
      <div><strong>إعداد وتطوير:</strong> فريق النظم الهندسية والذكاء الاصطناعي</div>
    </div>
  </div>

  <!-- CHAPTER 1 -->
  <div class="page-break">
    <h2 class="chapter-title">🌟 الفصل الأول: شرح النظام بالكامل (لغير المبرمجين)</h2>
    
    <div class="notice-box">
      <strong>ملاحظة زمنية مهمة:</strong> تم بدء العمل والتطوير الهندسي في هذا النظام منذ <strong>1 يناير 2026</strong> واستمر حتى تاريخ إعداد هذا التوثيق في <strong>22 أغسطس 2026</strong>. النظام حالياً في حالة تطوير نشطة ومستمرة، ويتم تحديث وتطوير الوظائف يومياً لضمان أعلى كفاءة تشغيلية.
    </div>

    <div class="section-title">1.1 الهدف الأساسي من النظام</div>
    <p>تم بناء نظام <strong>Smart Factory Enterprise ERP</strong> ليحل محل الورقيات والمعاملات اليدوية المتفرقة داخل المصنع والشركة. يربط النظام جميع إدارات الشركة (الموارد البشرية، الحضور، الرواتب، المالية، المشتريات، المخازن، الإنتاج، الصيانة، الأسطول، والمبيعات) في بيئة سحابية واحدة موحدة تفاعلية.</p>

    <div class="section-title">1.2 كيف يعمل النظام وتبادل البيانات؟</div>
    <p>يبدأ الموظف رحلته في النظام بدخول واجهة التشغيل بحسب حسابه الشخصي. عندما يقوم الموظف بتنفيذ أي حركة (مثل تقديم طلب إجازة، تسجيل بصمة حضور، إذن صرف من المخزن، أو أمر إنتاج جديد)، يقوم النظام بـ:</p>
    <ul>
      <li><strong>التحقق الآلي من الصلاحيات</strong>: يضمن أن الموظف يملك حق تنفيذ العملية.</li>
      <li><strong>التطبيق الفوري لقواعد العمل (Business Logic)</strong>: مثال: إذا كانت المادة الخام غير متوفرة في المخزن، يمنع النظام بدء أمر الإنتاج ويرسل إشعاراً لقسم المشتريات.</li>
      <li><strong>الحفظ والتأثير المحاسبي والمخزني المباشر</strong>: عند صرف راتب أو شراء مادة، يتم تحديث رصيد الخزينة ورصيد المخزن ومراكز التكلفة فوراً دون الحاجة لإدخال القيد يدويًا.</li>
    </ul>

    <div class="section-title">1.3 مخطط توضيحي عام لحركة البيانات والنظام</div>
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 800 350" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="780" height="330" rx="8" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
        
        <!-- Step 1 -->
        <rect x="30" y="40" width="210" height="80" rx="6" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
        <text x="135" y="70" font-weight="bold" font-size="12" text-anchor="middle" fill="#064e3b">1. إدخال الحركة / الطلب</text>
        <text x="135" y="90" font-size="9" text-anchor="middle" fill="#047857">بصمة، طلب إجازة، إذن مخزن</text>

        <!-- Arrow -->
        <path d="M 240 80 L 290 80" stroke="#059669" stroke-width="2"/>

        <!-- Step 2 -->
        <rect x="290" y="40" width="220" height="80" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="400" y="70" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e40af">2. التحقق من الصلاحيات والمنطق</text>
        <text x="400" y="90" font-size="9" text-anchor="middle" fill="#1d4ed8">فحص رصيد الإجازات والخزينة</text>

        <!-- Arrow -->
        <path d="M 510 80 L 560 80" stroke="#2563eb" stroke-width="2"/>

        <!-- Step 3 -->
        <rect x="560" y="40" width="210" height="80" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="665" y="70" font-weight="bold" font-size="12" text-anchor="middle" fill="#78350f">3. الاعتماد والترحيل التلقائي</text>
        <text x="665" y="90" font-size="9" text-anchor="middle" fill="#b45309">إنشاء القيود وتحديث الرصيد</text>

        <!-- Bottom Level -->
        <rect x="150" y="180" width="500" height="130" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
        <text x="400" y="210" font-weight="bold" font-size="13" text-anchor="middle" fill="#334155">النتيجة النهائية للمستخدم والإدارة العليا</text>
        <text x="400" y="240" font-size="10" text-anchor="middle">✔ تحديث فورى للتقارير الماليـة ومراكز التكلفة</text>
        <text x="400" y="265" font-size="10" text-anchor="middle">✔ إشعار فوري للمدير المسـؤول والشات بوت الذكي</text>
        <text x="400" y="290" font-size="10" text-anchor="middle">✔ حظر أو قبول المعاملة وحفظ السجل الميداني</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 2: DEPARTMENTS & DIVISIONS -->
  <div class="page-break">
    <h2 class="chapter-title">🏬 الفصل الثاني: تفاصيل الإدارات والأقسام والدورات التشغيلية</h2>
    <p>يتألف النظام من 15 إدارة متخصصة تعمل معاً بانسجام تام. فيما يلي شرح كل إدارة والدورات التشغيلية التابعة لها مع الرسم التوضيحي المفصل:</p>

    <div class="section-title">2.1 إدارة الموارد البشرية والرواتب (HR & Payroll Division)</div>
    <p><strong>الوظيفة التشغيلية:</strong> تضمن إدارة كافة بيانات الموظفين، متابعة دوام الحضور عبر البصمة والـ QR Code، احتساب الجزاءات والساعات الإضافية، وصرف الرواتب المستحقة آلياً بنقرة زر مع توثيق الخزنة أو البنك الصادر منه الراتب.</p>
    
    <!-- HR Diagram -->
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 750 220" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="150" height="70" rx="6" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
        <text x="95" y="60" font-weight="bold" font-size="11" text-anchor="middle">سجل الموظف</text>
        <text x="95" y="78" font-size="9" text-anchor="middle">البيانات والراتب الأساسي</text>

        <path d="M 170 65 L 230 65" stroke="#4f46e5" stroke-width="2"/>

        <rect x="230" y="30" width="150" height="70" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
        <text x="305" y="60" font-weight="bold" font-size="11" text-anchor="middle">بصمة QR والحضور</text>
        <text x="305" y="78" font-size="9" text-anchor="middle">خصم التأخير والغابات</text>

        <path d="M 380 65 L 440 65" stroke="#16a34a" stroke-width="2"/>

        <rect x="440" y="30" width="150" height="70" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="515" y="60" font-weight="bold" font-size="11" text-anchor="middle">احتساب صافي الراتب</text>
        <text x="515" y="78" font-size="9" text-anchor="middle">إضافة البدلات والخصومات</text>

        <path d="M 515 100 L 515 140" stroke="#d97706" stroke-width="2"/>

        <rect x="440" y="140" width="280" height="60" rx="6" fill="#faf5ff" stroke="#9333ea" stroke-width="2"/>
        <text x="580" y="165" font-weight="bold" font-size="11" text-anchor="middle">زر الصرف الذكي (Pay) والتأثير المالي</text>
        <text x="580" y="183" font-size="9" text-anchor="middle">خصم من الخزنة / البنك + قيد محاسبي تلقائي</text>
      </svg>
    </div>

    <div class="section-title">2.2 إدارة المشتريات والمخازن والإنتاج (SCM & Manufacturing Division)</div>
    <p><strong>الوظيفة التشغيلية:</strong> ربط طلب الشراء الصادر من المهندس مع المورد المعتمد، واستلام المواد الخام في مخزن الخامات، تمهيداً لخصمها المباشر بمجرد بدء أمر الإنتاج بحسب قائمة مكونات المنتج (BOM).</p>
    
    <!-- Manufacturing Diagram -->
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 750 200" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="40" width="150" height="70" rx="6" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <text x="95" y="70" font-weight="bold" font-size="11" text-anchor="middle">طلب الاحتياج للشراء</text>
        <text x="95" y="88" font-size="9" text-anchor="middle">من مهندس الإنتاج</text>

        <path d="M 170 75 L 220 75" stroke="#ea580c" stroke-width="2"/>

        <rect x="220" y="40" width="150" height="70" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
        <text x="295" y="70" font-weight="bold" font-size="11" text-anchor="middle">استلام المخزن والفحص</text>
        <text x="295" y="88" font-size="9" text-anchor="middle">مخزن المواد الخام</text>

        <path d="M 370 75 L 420 75" stroke="#16a34a" stroke-width="2"/>

        <rect x="420" y="40" width="150" height="70" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="495" y="70" font-weight="bold" font-size="11" text-anchor="middle">أمر الإنتاج (BOM)</text>
        <text x="495" y="88" font-size="9" text-anchor="middle">خصم الخامات التلقائي</text>

        <path d="M 570 75 L 620 75" stroke="#2563eb" stroke-width="2"/>

        <rect x="620" y="40" width="110" height="70" rx="6" fill="#fdf4ff" stroke="#c084fc" stroke-width="2"/>
        <text x="675" y="70" font-weight="bold" font-size="11" text-anchor="middle">المنتج التام</text>
        <text x="675" y="88" font-size="9" text-anchor="middle">إلى مخزن البيع</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 3: SCREENS -->
  <div class="page-break">
    <h2 class="chapter-title">🖥️ الفصل الثالث: دليل شاشات النظام واستخدامها التشغيلي</h2>
    <p>فيما يلي دليل شامل لشاشات النظام الرئيسية، موضحاً وظيفتها للمستخدم وكيفية التعامل مع عناصرها بدون أكواد:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>اسم الشاشة</th>
            <th>الهدف التشغيلي للموظف</th>
            <th>الأزرار والحقول المتاحة</th>
            <th>ماذا يحدث عند النقر والتنفيذ؟</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>شاشة دليل الموظفين</strong></td>
            <td>إضافة وإدارة بيانات العاملين والرواتب</td>
            <td>زر (إضافة موظف)، خانة البحث باسم الموظف، زر (تعديل)، زر (تجميد الحساب)</td>
            <td>يفتح نموذج إدخال البيانات الشخصية والراتب، وعند الحفظ يظهر الموظف فوراً في كشوفات الحضور والرواتب.</td>
          </tr>
          <tr>
            <td><strong>شاشة الرواتب والأجور</strong></td>
            <td>استعراض واعتماد وصرف الرواتب الشهرية</td>
            <td>زر (احتساب الرواتب)، قائمة اختيار الشهر، زر (اعتماد)، زر (Pay) لكل موظف</td>
            <td>يحسب النظام الخصومات والبدلات، وعند ضغط زر Pay يطلب اختيار الخزنة ثم يصرف المبلغ ويولد قيداً مالياً.</td>
          </tr>
          <tr>
            <td><strong>شاشة الحضور والبصمة</strong></td>
            <td>مسح كود الـ QR للحضور والانصراف</td>
            <td>زر (مسح الكود QR)، جدول الحضور اليومي، فلاتر تاريخ الحضور</td>
            <td>يسجل وقت الحضور الفلي ويقارنه بوردية العمل لحساب التأخيرات وتطبيق خصم الجزاء آلياً.</td>
          </tr>
          <tr>
            <td><strong>شاشة الخزينة والبنوك</strong></td>
            <td>إدارة المقبوضات والمصروفات المالية</td>
            <td>زر (تحويل بين خزنتين)، جدول الحركة المالية، زر (إذن صرف/قبض)</td>
            <td>تحديث الرصيد الفعلي للخزينة فوراً، وحظر أي معاملة صرف تتجاوز السيولة المتوفرة.</td>
          </tr>
          <tr>
            <td><strong>شاشة أمر الإنتاج (BOM)</strong></td>
            <td>تشغيل وتتبع خطوط الإنتاج بالمصنع</td>
            <td>زر (بدء أمر إنتاج جديد)، قائمة اختيار المنتج التام، مدخل الكمية المطلوبة</td>
            <td>يفحص رصيد الخامات في المخزن، فإذا كانت متوفرة يخصم المواد الخام ويُسجل حالة الأمر "جاري التشغيل".</td>
          </tr>
          <tr>
            <td><strong>شاشة حركة السيارات والعدادات</strong></td>
            <td>تتبع أسطول الشاحنات وتصفية الرحلات</td>
            <td>خانة إدخال العداد الحالي (Odometer)، زر (إنشاء رحلة)، زر (تصفية الوقود)</td>
            <td>حساب مسافة الرحلة، مقارنتها باستهلاك السولار المعياري، وتصفية مستحقات السائق المالية.</td>
          </tr>
          <tr>
            <td><strong>شاشة فحص الـ CV الذكي (ATS)</strong></td>
            <td>تقييم المتقدمين للوظائف بالذكاء الاصطناعي</td>
            <td>منطقة رفع السير الذاتية (PDF)، زر (فحص وتحليل)، زر (قبول للمقابلة)</td>
            <td>يستخرج الذكاء الاصطناعي مهارات المتقدم، يحسب نسبة توافقه مع الوظيفة، ويرتب المتقدمين حسب الأفضلية.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 4: APIs (NON-TECHNICAL EXPLANATION) -->
  <div class="page-break">
    <h2 class="chapter-title">🔌 الفصل الرابع: الواجهات الخدمية للنظام (APIs - لغير المبرمجين)</h2>
    <p>الـ API في هذا النظام هو بمثابة <strong>"المندوب أو الموصل الآلي"</strong> الذي ينقل الطلب من شاشة الموظف إلى قاعدة البيانات ويعود بالنتيجة فوراً بدون تدخل بشري. فيما يلي شرح الخدمات الرئيسية وكيف تفيد المستخدم:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>اسم الخدمة / الوظيفة الآلية</th>
            <th>أين تستخدم في الشاشات؟</th>
            <th>ماذا تنقل من بيانات؟ (المدخلات)</th>
            <th>ما هي النتيجة التي تراها على الشاشة؟ (المخرجات)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>خدمة تسجيل الدخول والأمان</strong></td>
            <td>صفحة الدخول الرئيسية</td>
            <td>اسم المستخدم وكلمة المرور</td>
            <td>فتح النظام وتفعيل الشاشات المسموحة فقط لهذا الموظف</td>
          </tr>
          <tr>
            <td><strong>خدمة تسجيل البصمة الفورية</strong></td>
            <td>شاشة الحضور عبر الـ QR</td>
            <td>كود الموظف والتوقيت الحالي</td>
            <td>إظهار رسالة "تم تسجيل حضورك بنجاح" وتأكيد الوقت</td>
          </tr>
          <tr>
            <td><strong>خدمة الصرف المالي الذكي</strong></td>
            <td>شاشة الرواتب والخزينة</td>
            <td>رقم الموظف، قيمة الراتب، الخزنة</td>
            <td>تحديث رصيد الخزينة وطباعة إيصال الصرف ورسالة التأكيد</td>
          </tr>
          <tr>
            <td><strong>خدمة فحص توفر المواد الخام</strong></td>
            <td>شاشة أمر الإنتاج</td>
            <td>كود المنتج والكميات المطلوبة</td>
            <td>تأكيد إمكانية التصنيع أو تحذير "نقص في خام السولار/البلاستيك"</td>
          </tr>
          <tr>
            <td><strong>خدمة تحليل السيرة الذاتية</strong></td>
            <td>شاشة التوظيف (ATS)</td>
            <td>ملف السيرة الذاتية (PDF)</td>
            <td>استخراج اسم المرشح وسنوات الخبرة ودرجة التوافق (مثال: 95%)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 5: ALL 163+ TABLES (NON-TECHNICAL CATALOG) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الخامس: كشف وقاعدة البيانات الشاملة (${tableKeys.length} جدولاً بالكامل)</h2>
    <p>فيما يلي كشف وثائقي مفصل يشرح جميع جداول النظام الـ <strong>${tableKeys.length} جدولاً</strong> واحدًا تلو الآخر، موضحاً الهدف الوظيفي من كل جدول وماذا يخزن وما هي الحقول الموجودة فيه بلغة بسيطة يفهمها الشخص غير البرمجي:</p>

    ${tableKeys.map((tName, idx) => {
      const t = dbSchema[tName];
      return `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="font-size: 11pt; color: #064e3b; background: #ecfdf5; padding: 6px 12px; border-right: 4px solid #10b981; border-radius: 4px;">
            ${idx + 1}. جدول: <code style="color:#047857;">${t.name}</code> — (سجل تشغيلي محفوظ)
          </h3>
          <p style="font-size: 9.5pt; margin-bottom: 6px;"><strong>الغرض الوظيفي:</strong> يُستخدم هذا الجدول لتخزين وحفظ سجلات (${t.name}) الخاصة بعمليات المؤسسة، ويستند عليه النظام لإظهار البيانات في الشاشات والتقارير الرسمية.</p>
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">اسم الحقل التشغيلي</th>
                <th style="width: 25%;">نوع البيان المخزن</th>
                <th style="width: 45%;">الشرح الوظيفي للبيان</th>
              </tr>
            </thead>
            <tbody>
              ${t.columns.length > 0 ? t.columns.map(c => `
                <tr>
                  <td><code>${c.name}</code> ${c.pk ? '🔑 (رئيسي)' : ''}</td>
                  <td><code style="color:#2563eb;">${c.type}</code></td>
                  <td>${c.desc}</td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align:center; color:#64748b;">سجل تشغيلي يتم تحديثه ديناميكياً بحسب المعاملات الإدارية.</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }).join('')}
  </div>

  <!-- CHAPTER 6: MASTER ERD DIAGRAM & RELATIONSHIPS -->
  <div class="page-break">
    <h2 class="chapter-title">🗺️ الفصل السادس: المخطط الشامل لقاعدة البيانات (Master ERD Diagram)</h2>
    <p>يوضح الرسم الهيكلي التالي الربط المحوري الشامل بين كافة مجموعات الجداول الـ 163+ في قاعدة البيانات وكيف تتكامل الإدارات معاً:</p>

    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="780" height="430" rx="10" fill="#ffffff" stroke="#059669" stroke-width="2"/>
        
        <!-- Core Auth Box -->
        <rect x="40" y="30" width="220" height="110" rx="8" fill="#ecfdf5" stroke="#059669" stroke-width="2"/>
        <text x="150" y="55" font-weight="bold" font-size="12" text-anchor="middle" fill="#064e3b">مجموعة الحسابات والصلاحيات</text>
        <text x="150" y="80" font-size="9" text-anchor="middle">users, screen_permissions</text>
        <text x="150" y="98" font-size="9" text-anchor="middle">login_history, user_sessions</text>

        <!-- HR Box -->
        <rect x="300" y="30" width="200" height="110" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="400" y="55" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e40af">مجموعة الموارد البشرية والرواتب</text>
        <text x="400" y="80" font-size="9" text-anchor="middle">attendance, payroll, loans</text>
        <text x="400" y="98" font-size="9" text-anchor="middle">leave_requests, ats_applications</text>

        <!-- Finance Box -->
        <rect x="540" y="30" width="220" height="110" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="650" y="55" font-weight="bold" font-size="12" text-anchor="middle" fill="#78350f">مجموعة المالية والعدّة المحاسبية</text>
        <text x="650" y="80" font-size="9" text-anchor="middle">finance_safes, journal_entries</text>
        <text x="650" y="98" font-size="9" text-anchor="middle">cost_centers, checks, taxes</text>

        <!-- Supply Chain Box -->
        <rect x="40" y="180" width="220" height="110" rx="8" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <text x="150" y="205" font-weight="bold" font-size="12" text-anchor="middle" fill="#7c2d12">مجموعة سلاسل الإمداد والمخازن</text>
        <text x="150" y="230" font-size="9" text-anchor="middle">suppliers, inventory_items</text>
        <text x="150" y="248" font-size="9" text-anchor="middle">purchase_orders, stock_movements</text>

        <!-- Production Box -->
        <rect x="300" y="180" width="200" height="110" rx="8" fill="#fdf4ff" stroke="#c084fc" stroke-width="2"/>
        <text x="400" y="205" font-weight="bold" font-size="12" text-anchor="middle" fill="#581c87">مجموعة التصنيع والإنتاج</text>
        <text x="400" y="230" font-size="9" text-anchor="middle">bom, production_orders</text>
        <text x="400" y="248" font-size="9" text-anchor="middle">qc_inspections, machines</text>

        <!-- Fleet Box -->
        <rect x="540" y="180" width="220" height="110" rx="8" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
        <text x="650" y="205" font-weight="bold" font-size="12" text-anchor="middle" fill="#14532d">مجموعة الحركة والأسطول والسيارات</text>
        <text x="650" y="230" font-size="9" text-anchor="middle">fleet_vehicles, fleet_trips</text>
        <text x="650" y="248" font-size="9" text-anchor="middle">spare_parts, maintenance_logs</text>

        <!-- Connecting Arrows -->
        <path d="M 260 85 L 300 85" stroke="#059669" stroke-width="2"/>
        <path d="M 500 85 L 540 85" stroke="#2563eb" stroke-width="2"/>
        <path d="M 150 140 L 150 180" stroke="#ea580c" stroke-width="2"/>
        <path d="M 400 140 L 400 180" stroke="#c084fc" stroke-width="2"/>
        <path d="M 650 140 L 650 180" stroke="#16a34a" stroke-width="2"/>

        <!-- Bottom Core Integration -->
        <rect x="150" y="320" width="500" height="90" rx="8" fill="#f1f5f9" stroke="#475569" stroke-width="2"/>
        <text x="400" y="350" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e293b">المحرك التكاملي الرئيسي الشامل (163+ Tables Database Hub)</text>
        <text x="400" y="375" font-size="10" text-anchor="middle" fill="#475569">جميع المعاملات الإدارية، المالية، المخزنية واللوجستية يتم ترحيلها وحفظها تلقائياً بالربط الشبكي</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 7: WORKFLOWS -->
  <div class="page-break">
    <h2 class="chapter-title">🔄 الفصل السابع: خطوات ومسارات العمل التفصيلية (Workflows)</h2>
    
    <div class="section-title">7.1 دورة التوظيف وفحص الـ CV الذكي</div>
    <p>1. يرفع مسؤول التوظيف ملف السيرة الذاتية (PDF) للمتقدم -> 2. يحلل الذكاء الاصطناعي المهارات والخبرات -> 3. يحسب النظام نسبة توافق المتقدم للوظيفة -> 4. يظهر زر "قبول المقابلة" للمسؤول لاستكمال إجراءات التعيين.</p>

    <div class="section-title">7.2 دورة تصفية رحلات السيارات وحساب الوقود</div>
    <p>1. يسجل السائق قراءة العداد الحالي (Odometer) قبل بدء الرحلة -> 2. يتم تسجيل خط سير الرحلة والتكلفة -> 3. يقارن النظام مسافة الرحلة بمعدل استهلاك السولار المعياري -> 4. يتم خصم قيمة الوقود وصرف مستحقات السائق من الخزنة المحددة.</p>
  </div>

  <!-- CHAPTER 8 & 9: ROLES, PERMISSIONS & AI -->
  <div class="page-break">
    <h2 class="chapter-title">🔐 الفصل الثامن والتاسع: الصلاحيات والذكاء الاصطناعي للمستخدم</h2>
    
    <div class="section-title">8.1 كيف يضمن النظام أمان صلاحيات الموظفين؟</div>
    <p>يمنح النظام الموظف صلاحيات محددة تماماً بناءً على مسمّاه الوظيفي. إذا حاول موظف الموارد البشرية فتح شاشة المبيعات أو الخزنة، فإن النظام يمنعه تلقائياً ويظهر زر الإجراء بلون باهت وغير مفعل لحماية خصوصية بيانات المؤسسة.</p>

    <div class="section-title">9.1 مميزات الذكاء الاصطناعي اليومية للموظف والمدير</div>
    <ul>
      <li><strong>المساعد الشخصي الذكي (Chatbot)</strong>: يستطيع الموظف كتابة استفسار باللغة العربية مثل "كم رصيد إجازاتي المتبقي؟" أو "تفاصيل راتب هذا الشهر"، فيجيب المساعد الذكي فوراً بحسب صلاحيات الموظف المسموحة فقط.</li>
      <li><strong>عقل المصنع التنبؤي (AI Mind)</strong>: ينبه المدير التنفيذي تلقائياً عند وجود نقص متوقع في المواد الخام قبل وقوع المشكلة بأسبوع.</li>
    </ul>
  </div>

  <!-- CHAPTER 10 & 11: REPORTS & COMPARISON -->
  <div class="page-break">
    <h2 class="chapter-title">📊 الفصل العاشر والحادي عشر: التقارير والمقارنة التنافسية</h2>
    
    <div class="section-title">10.1 التقارير ولوحات الأداء الشاملة</div>
    <p>يتيح النظام استخراج وطباعة أكثر من 30 تقريراً رسمياً بنقرة زر واحدة وتصديرها بصيغ (PDF, Excel) مثل: تقرير كشف حركة الخزائن، كشف مسرد الرواتب، تقرير صيانة الأسطول، وتقرير الأداء التشغيلي.</p>

    <div class="section-title">11.1 المقارنة السوقية مع الأنظمة الأخرى (Odoo / SAP)</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>عنصر المقارنة التشغيلي</th>
            <th>نظامنا (Smart Factory ERP)</th>
            <th>الأنظمة التقليدية المنافسة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>سهولة الاستخدام والتصفح</strong></td>
            <td>سهل ومبسط جداً باللغة العربية لغير التقنيين</td>
            <td>معقد ويحتاج كورسات وتدريب طويل</td>
          </tr>
          <tr>
            <td><strong>الذكاء الاصطناعي التفاعلي</strong></td>
            <td>مدمج بالكامل (مساعد تفاعلي + فحص CV)</td>
            <td>غير متاح أو يتطلب إضافات مكلفة جداً</td>
          </tr>
          <tr>
            <td><strong>دقة ربط الخزينة بالرواتب</strong></td>
            <td>صرف تلقائي فور الموافقة وربط بالخزنة</td>
            <td>يتطلب إدخال قيد يدوي إضافي</td>
          </tr>
          <tr>
            <td><strong>تكلفة الاشتراك والتحديث</strong></td>
            <td>مرنة وبدون مصاريف تراخيص تعسفية</td>
            <td>تراخيص سنوية باهظة لكل مستخدم</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 12: COMMERCIAL PROPOSAL FOR 8 MONTHS DEV -->
  <div class="page-break">
    <div class="proposal-card">
      <h2 style="font-size: 18pt; color: #064e3b; text-align: center; margin-bottom: 12px;">💼 الفصل الثاني عشر: عرض السعر التقديري الشامل (Commercial Proposal)</h2>
      <p style="text-align: center; font-weight: bold; color: #047857; margin-bottom: 18px;">عرض توريد وتشغيل وتطوير نظام Smart Factory Enterprise ERP</p>

      <div class="notice-box" style="background: #ffffff;">
        <strong>ملاحظة التقييم الاستثماري:</strong> تم حصر هذا العرض التجاري بناءً على حجم العمل الهندسي والبرمجي الفعلي المستمر منذ <strong>1 يناير 2026 وحتى 22 أغسطس 2026 (ما يقارب 8 أشهر تطوير متواصل)</strong>، ونظراً لأن النظام لا يزال تحت التطوير النشط والتحديث المستمر، فإن العرض يغطي كافة الموديولات الـ 15 والجداول الـ 163+ وقواعد الذكاء الاصطناعي:
      </div>

      <table style="width:100%; background: white;">
        <thead>
          <tr>
            <th>بيان النطاق والخدمات المشمولة</th>
            <th>التفاصيل الفنية والتشغيلية</th>
            <th>التكلفة الاستثمارية (EGP)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. ترخيص واستخدام النظام الشامل (Enterprise License)</strong></td>
            <td>تغطية الـ 15 موديول بالكامل (HR, Payroll, Finance, SCM, Fleet, AI, Sales)</td>
            <td>220,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>2. تطوير وبناء قاعدة البيانات (163+ Tables Architecture)</strong></td>
            <td>بناء وهيكلة الـ 163+ جدول، وتفعيل الحماية التلقائية RLS والنسخ الاحتياطي</td>
            <td>55,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>3. محرك الذكاء الاصطناعي والتفاعل (AI Mind & ATS Engine)</strong></td>
            <td>فحص السير الذاتية ATS، شات بوت الموظفين الذكي، ولوحة قيادة الرئيس التنفيذي</td>
            <td>65,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>4. جهد التطوير المستمر (8 أشهر من 1/1/2026 إلى 22/8/2026)</strong></td>
            <td>تعديلات وتحسينات ميدانية مستمرة، دعم فني، وتطوير الشاشات والتقارير</td>
            <td>80,000 ج.م</td>
          </tr>
          <tr style="background: #ecfdf5; font-weight: bold;">
            <td colspan="2" style="text-align: left; font-size: 11pt;">إجمالي التقييم والتكلفة التجارية الشاملة:</td>
            <td style="color: #047857; font-size: 13pt;">420,000 ج.م</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 9.5pt; color: #064e3b;">
        <p><strong>بنود وضوابط العرض التجاري:</strong></p>
        <ul>
          <li>التطوير المستمر: يشمل العرض كافة التحديثات والتعديلات المطلوبة خلال فترة التطوير الحالية.</li>
          <li>الضمان والدعم الفني: ضمان سنة كاملة يشمل الصيانة والتحديثات والتوافق التشغيلي 100%.</li>
          <li>جدولة الدفعات: 40% دفعة التعاقد، 40% عند بدء التشغيل الميداني، 20% عند التسليم النهائي.</li>
        </ul>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'master_nontech_erp_documentation.html'), htmlContent);
console.log('Successfully generated Non-Technical HTML template: master_nontech_erp_documentation.html');

// 3. Render HTML to PDF via Puppeteer
async function renderPdf() {
  console.log('Launching Puppeteer for Non-Technical PDF rendering...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = 'file:///' + path.join(__dirname, 'master_nontech_erp_documentation.html').replace(/\\/g, '/');
  
  console.log('Loading HTML content into Puppeteer...');
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 120000 });

  const pdfPath = path.join(__dirname, 'Smart_Factory_ERP_NonTechnical_System_Manual.pdf');
  console.log(`Generating Non-Technical PDF artifact at: ${pdfPath}`);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '12mm',
      bottom: '15mm',
      left: '12mm'
    }
  });

  await browser.close();
  console.log('=== Master Non-Technical ERP PDF Generated Successfully! ===');
}

renderPdf().catch(err => {
  console.error('Error generating Non-Technical PDF:', err);
  process.exit(1);
});
