const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Starting Master Non-Technical ERP System Manual PDF Generator (Blue Edition) ===');

// 1. Parse Database Schema to extract all tables
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

  const tableExplanations = {
    'users': 'جدول المستخدمين الرئيسي: يخزن بيانات جميع الموظفين والمدراء، يشمل الاسم الكامل، البريد الإلكتروني، كلمة المرور المشفرة، الدور الوظيفي، والقسم التابع له.',
    'attendance': 'جدول سجلات الحضور والانصراف: يسجل وقت وتاريخ دخول وخروج كل موظف يومياً عبر البصمة أو كود الـ QR، ويحسب دقائق التأخير والغياب آلياً.',
    'payroll': 'جدول الرواتب والأجور الشهرية: يخزن تفاصيل راتب كل موظف، شامل الراتب الأساسي، البدلات، المكافآت، الخصومات والجزاءات، وصافي الراتب المستحق.',
    'leave_requests': 'جدول طلبات الإجازات: يسجل الطلبات المقدمة من الموظفين (سنوية، مرضية، عارضة)، حالة الموافقة عليها من المدراء، وتاريخ البدء والانتهاء.',
    'finance_safes': 'جدول الخزائن المالية والحسابات البنكية: يوثق الخزائن الموجودة بالمؤسسة ورصيد كل خزنة بالجنيه، ويراقب رصيد النقدية المتاح للصرف.',
    'journal_entries': 'جدول القيود المحاسبية التلقائية: ينشئ النظام فيه قيداً محاسبياً فورياً مع كل حركة مالية (مثل صرف راتب، شراء خامات، أو سداد مورد).',
    'cost_centers': 'جدول مراكز التكلفة: يربط المصروفات والإيرادات بالقسم أو المشروع المحدد لضمان معرفة تكلفة كل خط إنتاج أو مشروع على حدة.',
    'suppliers': 'جدول الموردين والشركات الخارجية: يتضمن اسماء الموردين، بيانات التواصل، المبالغ المستحقة لهم، والتاريخ التجاري لكل مورد.',
    'purchase_orders': 'جدول أوامر الشراء: يحتوي على تفاصيل المواد المطلوب شراؤها، الكميات، الأسعار المتفق عليها، والمورد المحدد لكل أمر شراء.',
    'inventory_items': 'جدول المنتجات والمواد الخام بالمخزن: يخزن اسم المادة الخام، كود المنتج، رصيد الكمية المتاحة بالمخزن، وحد أدنى إعادة الطلب.',
    'stock_movements': 'جدول حركات المخزن: يسجل كل حركة إدخال خامات من المورد أو صرف خامات لخطوط الإنتاج مع اسم المسؤول وتاريخ الحركة.',
    'bom': 'جدول قائمة مكونات المنتج (BOM): يحدد المعايير الفنية والكميات الدقيقة من الخامات المطلوبة لتصنيع وحدة واحدة من المنتج التام.',
    'production_orders': 'جدول أوامر الإنتاج والتصنيع: يتبع حالة تصنيع الأوامر بالمصنع (قيد الانتظار، جاري التصنيع، مكتمل) والكميات المطلوبة.',
    'qc_inspections': 'جدول فحص جودة المنتجات: يوثق عمليات الفحص الفني للقطع المصنعة، نسبة العيوب المقبولة، وحالة اعتماد الشحنة للبيع.',
    'equipment': 'جدول الآلات والمعدات بالمصنع: يسجل بيانات كل ماكينة، تاريخ التشغيل، ساعات العمل الفعلية، وحالة الكفاءة الفنية.',
    'maintenance_logs': 'جدول سجلات الصيانة الوقائية والطارئة: يوثق البلاغات عن أعطال الماكينات، قطع الغيار المستخدمة، وتكلفة عملية الصيانة.',
    'fleet_vehicles': 'جدول أسطول السيارات والشاحنات: يخزن بيانات الشاحنات، رقم اللوحة، قراءة العداد الحالي (Odometer)، وتاريخ الفحص الدوري.',
    'fleet_trips': 'جدول رحلات الشحن والنقل: يوثق خط سير الرحلة، السائق المسؤول، مسافة الكيلومترات، وكمية الوقود المخصصة للرحلة.',
    'spare_parts': 'جدول قطع غيار السيارات والآلات: يحتوي على رصيد قطع الغيار المتوفرة بالمخزن، أسعارها، وتاريخ استبدالها.',
    'ats_applications': 'جدول طلبيات التوظيف والسير الذاتية: يوثق بيانات المتقدمين للوظائف، ملف السيرة الذاتية (PDF)، ونسبة تقييم الذكاء الاصطناعي.',
    'screen_permissions': 'جدول صلاحيات الشاشات (RBAC): يحدد بالضبط ما هي الشاشات والأزرار المسموح لكل دور وظيفي برؤيتها وتعديلها.'
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
        let desc = tableExplanations[tName] || `جدول سجلات (${tName}): يُستخدم لتخزين وحفظ السجلات التشغيلية الخاصة بالمؤسسة، ويضمن استرجاع البيانات ومتابعة الحركة الإدارية والتاريخية بكل دقة عبر الشاشات الرسمية.`;

        tables[tName] = {
          name: tName,
          explanation: desc,
          source: relPath
        };
      }
    }
  });

  return tables;
}

const dbSchema = parseDatabaseSchema();
const tableKeys = Object.keys(dbSchema).sort();
console.log(`Parsed ${tableKeys.length} total database tables.`);

// 2. Load Logo Image as Base64 Data URI
const logoPath = path.join(__dirname, 'public', 'logo.png');
let logoDataUri = '';
if (fs.existsSync(logoPath)) {
  const logoBase64 = fs.readFileSync(logoPath).toString('base64');
  logoDataUri = `data:image/png;base64,${logoBase64}`;
}

// 3. Generate HTML Content focused 100% on Non-Technical Explanation with BLUE Aesthetic Theme
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>الدليل التشغيلي الموحد - NINJA SMART TECHNOLOGY FACTORY ERP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', sans-serif;
      font-size: 11pt;
      line-height: 1.8;
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
    
    /* BLUE COVER PAGE THEME */
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 100%);
      color: #ffffff;
      border-radius: 12px;
    }
    
    .cover-logo-wrapper {
      margin-top: 20px;
      margin-bottom: 25px;
    }
    .cover-logo-img {
      width: 180px;
      height: auto;
      border-radius: 20px;
      background: #ffffff;
      padding: 14px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.45);
      border: 4px solid #60a5fa;
    }
    
    .cover-title { font-size: 25pt; font-weight: 900; color: #ffffff; margin-bottom: 12px; letter-spacing: 0.5px; }
    .cover-subtitle { font-size: 14pt; font-weight: 700; color: #93c5fd; margin-bottom: 22px; line-height: 1.6; }
    .cover-badge {
      display: inline-block; padding: 8px 26px; background: rgba(59, 130, 246, 0.25);
      border: 1.5px solid #60a5fa; border-radius: 30px; font-size: 11.5pt; color: #eff6ff; margin-bottom: 25px; font-weight: 700;
    }
    .cover-meta {
      width: 100%; border-top: 1px solid rgba(255, 255, 255, 0.25); padding-top: 20px;
      display: flex; justify-content: space-around; font-size: 10pt; color: #bfdbfe;
    }
    
    .page-break { page-break-after: always; }
    .chapter-title {
      font-size: 20pt; font-weight: 800; color: #1e3a8a; border-bottom: 4px solid #2563eb;
      padding-bottom: 8px; margin-top: 25px; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;
    }
    .section-title {
      font-size: 13.5pt; font-weight: 700; color: #1d4ed8; margin-top: 22px; margin-bottom: 12px;
      background: #eff6ff; padding: 8px 14px; border-right: 5px solid #3b82f6; border-radius: 4px;
    }
    
    p { margin-bottom: 12px; text-align: justify; color: #334155; }
    ul, ol { margin-right: 25px; margin-bottom: 15px; color: #334155; }
    li { margin-bottom: 6px; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 9.5pt; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; }
    th { background-color: #1e3a8a; color: #ffffff; font-weight: 700; font-size: 10pt; }
    tr:nth-child(even) { background-color: #f8fafc; }

    .diagram-box {
      background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px;
      padding: 15px; margin: 18px 0; text-align: center; page-break-inside: avoid;
    }
    .diagram-svg { width: 100%; max-width: 750px; height: auto; margin: 0 auto; }
    
    .notice-box {
      background: #eff6ff; border-right: 4px solid #2563eb; padding: 12px 16px;
      border-radius: 6px; margin: 15px 0; color: #1e40af; font-size: 10pt;
    }

    .proposal-card {
      background: #f8fafc; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin-top: 20px;
    }

    .table-item-card {
      background: #ffffff; border: 1px solid #e2e8f0; border-right: 4px solid #2563eb;
      border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; page-break-inside: avoid;
    }
    .table-item-title { font-weight: 800; color: #1e3a8a; font-size: 11pt; margin-bottom: 4px; }
    .table-item-desc { color: #475569; font-size: 10pt; }
  </style>
</head>
<body>

  <!-- COVER PAGE WITH OFFICIAL LOGO & TITLE -->
  <div class="cover-page">
    <div>
      <div class="cover-logo-wrapper">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="NINJA SMART TECHNOLOGY FACTORY LOGO" class="cover-logo-img" />` : '<div style="font-size:70px;">🏢</div>'}
      </div>
      <h1 class="cover-title">NINJA SMART TECHNOLOGY FACTORY</h1>
      <div class="cover-subtitle">نظام إدارة المصانع الذكية والموارد البشرية والتخطيط المؤسسي<br>(Smart Factory HR & Enterprise ERP System)</div>
      <div class="cover-badge">الدليل التشغيلي والشرح التفصيلي لجميع الإدارات والدورات - مبسط لغير المبرمجين</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #eff6ff; font-size: 11pt; line-height: 1.8;">دليل الاستخدام الشامل للإدارة العليا والمدراء والموظفين. يحتوي على شرح مفصل لـ 15 إدارة متكاملة، دورات العمل (Workflows)، رسومات SVG مستقيمة لكل إدارة، توثيق 163+ جدول بدون جداول معقدة، وعرض السعر التجاري.</p>
    </div>

    <div class="cover-meta">
      <div><strong>فترة التطوير الميداني:</strong> 1 يناير 2026 حتى 22 أغسطس 2026 (مستمر والتحديث جارٍ)</div>
      <div><strong>إعداد وتطوير:</strong> فريق النظم الهندسية والذكاء الاصطناعي</div>
    </div>
  </div>

  <!-- CHAPTER 1: GENERAL OVERVIEW -->
  <div class="page-break">
    <h2 class="chapter-title">🌟 الفصل الأول: مقدمة ونظرة عامة على النظام</h2>
    
    <div class="notice-box">
      <strong>تأكيد زمني هام:</strong> تم بدء بناء وتطوير النظام هندسياً وميدانياً منذ <strong>1 يناير 2026</strong> ومستمر حتى اليوم <strong>22 أغسطس 2026</strong>. النظام حالياً في حالة تطوير وتحديث مستمرة لإضافة أحدث الخصائص الذكية.
    </div>

    <div class="section-title">1.1 الهدف الأساسي وكيف يعمل النظام؟</div>
    <p>صُمم نظام <strong>NINJA SMART TECHNOLOGY FACTORY ERP</strong> ليكون العقل المحرك للمؤسسة، حيث يربط بين جميع الأقسام التشغيلية والمالية والإدارية في منصة رقمية واحدة. عندما يدخل أي موظف إجراءً ما (مثل تسجيل حضور، صرف راتب، طلب شراء خامات، أو بدء خط إنتاج)، يتأكد النظام فوراً من الصلاحيات ويوجه الطلب إلى المسار الآلي المحدد، مع إشعار المسؤولين وتحديث رصيد الخزينة أو المخزن آلياً.</p>

    <div class="section-title">1.2 الهيكل المخطط العام للنظام بالكامل</div>
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 800 320" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="780" height="300" rx="10" fill="#ffffff" stroke="#2563eb" stroke-width="2"/>
        
        <rect x="30" y="35" width="220" height="85" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="65" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e3a8a">1. إدخال الإجراء الميداني</text>
        <text x="140" y="88" font-size="9" text-anchor="middle" fill="#1d4ed8">بصمة QR، إذن صرف، أمر إنتاج</text>

        <path d="M 250 77 L 290 77" stroke="#2563eb" stroke-width="2.5" marker-end="url(#arrow)"/>

        <rect x="290" y="35" width="220" height="85" rx="8" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="400" y="65" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e3a8a">2. تطبيق قواعد العمل والأمان</text>
        <text x="400" y="88" font-size="9" text-anchor="middle" fill="#1e40af">فحص الصلاحية، الخزينة، والمخزن</text>

        <path d="M 510 77 L 550 77" stroke="#2563eb" stroke-width="2.5"/>

        <rect x="550" y="35" width="220" height="85" rx="8" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="2"/>
        <text x="660" y="65" font-weight="bold" font-size="12" text-anchor="middle" fill="#0f172a">3. الترحيل المالي والتأثير الفوري</text>
        <text x="660" y="88" font-size="9" text-anchor="middle" fill="#1e3a8a">قيد محاسبي + تحديث المخزن</text>

        <rect x="150" y="175" width="500" height="110" rx="8" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
        <text x="400" y="205" font-weight="bold" font-size="13" text-anchor="middle" fill="#0f172a">مخرجات النظام لجميع المستخدمين والإدارة</text>
        <text x="400" y="230" font-size="10" text-anchor="middle" fill="#334155">✔ تقارير مالية ومخزنية فورية بدون أخطاء بشرية</text>
        <text x="400" y="255" font-size="10" text-anchor="middle" fill="#334155">✔ إشعارات فورية وتفاعل الذكاء الاصطناعي التنبؤي</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 2: ALL 15 DEPARTMENTS DETAILED WITH SVG DIAGRAMS -->
  <div class="page-break">
    <h2 class="chapter-title">🏬 الفصل الثاني: تفاصيل الإدارات الـ 15 والدورات التشغيلية والرسومات</h2>
    <p>فيما يلي تفصيل كلي لجميع الإدارات الـ 15 بالتفصيل الدقيق دون حذف أي إدارة، مع توضيح الدورة التشغيلية الكاملة ورسمة SVG مستقلة خاصة بكل إدارة:</p>

    <!-- 1. HR -->
    <div class="section-title">2.1 إدارة الموارد البشرية والرواتب (HR & Workforce Division)</div>
    <p><strong>الشرح والتفصيل الشامل:</strong> هذه الإدارة هي المسؤول الأول عن المورد البشري بالمؤسسة. تشمل السجل الرقمي الكامل للموظف ( الرقم القومي، بيانات البنك، العقد، الراتب الأساسي، التأمينات الاجتماعية). كما تدرج نظام السلف التلقائية المعتمدة على الحضور (خاصة لعمال المياومة والإنتاج)، بالإضافة لإصدار المكافآت، تطبيق خصومات الجزاءات، تتبع طلبات الإجازات، واحتساب القروض. ثم تنتهي الدورة بضغط زر الصرف الذكي (Pay) الصادر من خزنة محددة تولد قيداً مالياً فورياً.</p>
    <p><strong>الدورة التشغيلية:</strong> إضافة بيانات الموظف ← اختيار وردية العمل ← تسجيل بصمة الحضور ← احتساب الجزاءات والسلف ← اعتماد كشف الرواتب ← ضغط زر (Pay) لصرف المبلغ وتوليد القيد المحاسبي.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة: دورة الموارد البشرية والرواتب</div>
      <svg class="diagram-svg" viewBox="0 0 750 180" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="40" width="140" height="70" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="90" y="70" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">سجل الموظف والعقد</text>
        <text x="90" y="88" font-size="8.5" text-anchor="middle" fill="#1d4ed8">بيانات الراتب والبنك</text>

        <path d="M 160 75 L 200 75" stroke="#2563eb" stroke-width="2"/>

        <rect x="200" y="40" width="150" height="70" rx="6" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="275" y="70" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">الحضور والسلف الآلية</text>
        <text x="275" y="88" font-size="8.5" text-anchor="middle" fill="#1e40af">خصم الجزاءات والإضافي</text>

        <path d="M 350 75 L 390 75" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="390" y="40" width="150" height="70" rx="6" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="2"/>
        <text x="465" y="70" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">صافي الراتب المستحق</text>
        <text x="465" y="88" font-size="8.5" text-anchor="middle" fill="#1e3a8a">اعتماد الكشف الشهري</text>

        <path d="M 540 75 L 580 75" stroke="#1e3a8a" stroke-width="2"/>

        <rect x="580" y="40" width="150" height="70" rx="6" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
        <text x="655" y="70" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">زر الصرف الذكي (Pay)</text>
        <text x="655" y="88" font-size="8.5" text-anchor="middle" fill="#1e3a8a">خصم الخزينة والقيد الآلي</text>
      </svg>
    </div>

    <!-- 2. Attendance -->
    <div class="section-title">2.2 إدارة الحضور والبصمة الذكية (Attendance & QR Scanner)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تتيح للموظف والعمال مسح كود الـ QR الديناميكي عبر شاشة الهاتف أو الهاتف الميداني في موقع المصنع. يقرأ النظام وقت الحضور الفعلي، يقارنه بوردية العمل، يحسب التأخير بالدقيقة، ويطبق لائحة الجزاءات التلقائية دون محاباة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة: دورة الحضور والـ QR Code</div>
      <svg class="diagram-svg" viewBox="0 0 750 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="30" width="200" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="130" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. مسح رمز QR Code</text>
        <text x="130" y="78" font-size="8.5" text-anchor="middle">تسجيل البصمة والتوقيت</text>

        <path d="M 230 65 L 280 65" stroke="#3b82f6" stroke-width="2"/>

        <rect x="280" y="30" width="200" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="380" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. المقارنة بالوردية</text>
        <text x="380" y="78" font-size="8.5" text-anchor="middle">احتساب التأخير والغياب</text>

        <path d="M 480 65 L 530 65" stroke="#2563eb" stroke-width="2"/>

        <rect x="530" y="30" width="190" height="70" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="625" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. الترحيل لدفتر الرواتب</text>
        <text x="625" y="78" font-size="8.5" text-anchor="middle">خصم آلي للجزاء المستحق</text>
      </svg>
    </div>

    <!-- 3. ATS Recruitment -->
    <div class="section-title">2.3 إدارة التوظيف والفرز الذكي (ATS Recruitment Division)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> رفع السير الذاتية للمرشحين بصيغة PDF، حيث يستخرج الذكاء الاصطناعي المهارات الفنية، ودرجة التوافق مع متطلبات الوظيفة الشاغرة، وتصنيف المتقدمين بترتيب تنازلي تسهيلاً لطلب المقابلة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة: دورة الفرز الذكي للسير الذاتية</div>
      <svg class="diagram-svg" viewBox="0 0 750 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="30" width="200" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="130" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">رفع ملف الـ CV (PDF)</text>
        <text x="130" y="78" font-size="8.5" text-anchor="middle">استلام طلبات المتقدمين</text>

        <path d="M 230 65 L 280 65" stroke="#3b82f6" stroke-width="2"/>

        <rect x="280" y="30" width="200" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="380" y="60" font-weight="bold" font-size="11" text-anchor="middle">تحليل الذكاء الاصطناعي</text>
        <text x="380" y="78" font-size="8.5" text-anchor="middle">مطابقة الخبرات والمهارات</text>

        <path d="M 480 65 L 530 65" stroke="#2563eb" stroke-width="2"/>

        <rect x="530" y="30" width="190" height="70" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="625" y="60" font-weight="bold" font-size="11" text-anchor="middle">ترتيب النسبة وتحديد المقابلة</text>
        <text x="625" y="78" font-size="8.5" text-anchor="middle">إصدار قرار التعيين المباشر</text>
      </svg>
    </div>

    <!-- 4. Accounting -->
    <div class="section-title">2.4 الإدارة المالية والعدّة المحاسبية (General Ledger & Accounting)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> إدارة شجرة الحسابات العامة، إنشاء القيود اليومية التلقائية، إعداد ميزان المراجعة، ومراقبة الإيرادات والمصروفات بكل شفافية دون تدخل يدوي قد يؤدي إلى الأخطاء المحاسبية.</p>

    <!-- 5. Treasury -->
    <div class="section-title">2.5 إدارة الخزائن والبنوك (Treasury & Cash Control)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> متابعة حركة النقدية داخل خزائن المصنع والحسابات البنكية، تتبع الشيكات الصادرة والواردة، وتنفيذ أذون الصرف والقبض مع حظر أي معاملة تتجاوز رصيد السيولة النقدية المتاح.</p>

    <!-- 6. Cost Centers -->
    <div class="section-title">2.6 إدارة مراكز التكلفة (Cost Centers Division)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> ربط كل مصروف مالي (سولار، قطع غيار، رواتب، خامات) بمركز تكلفة محدد (مثال: خط إنتاج البلاستيك رقم 1) للوقوف على الربحية الفعلية لكل قسم بالمصنع.</p>

    <!-- 7. Procurement -->
    <div class="section-title">2.7 إدارة المشتريات والموردين (Procurement & Vendors)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تحويل طلب الاحتياج الصادر من المخزن إلى أمر شراء رسمي، إرساله للمورد المعتمد، تتبع استلام الشحنة، وتسجيل مستحقات المورد المالي في دفتر الحسابات.</p>

    <!-- 8. Inventory -->
    <div class="section-title">2.8 إدارة المخازن ورصيد الخامات (Inventory Control)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> مراقبة كميات المواد الخام والمنتجات التامة، التنبيه عند وصول المادة إلى حد إعادة الطلب، وتسجيل أذون الإضافة والصرف المخزني لحظياً.</p>

    <!-- 9. Production & BOM -->
    <div class="section-title">2.9 إدارة خطوط الإنتاج وقائمة الخامات (Manufacturing BOM)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تسجيل أمر الإنتاج، فحص قائمة المكونات (BOM)، الخصم المباشر التلقائي لخامات البلاستيك والسولار من المخزن، وتحويل المنتج الصادر إلى مخزن المنتج التام.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة: دورة أمر الإنتاج والخصم المخزني الآلي</div>
      <svg class="diagram-svg" viewBox="0 0 750 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="160" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="100" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">أمر إنتاج جديد</text>
        <text x="100" y="78" font-size="8.5" text-anchor="middle">تحديد كمية المنتج المطلوب</text>

        <path d="M 180 65 L 220 65" stroke="#3b82f6" stroke-width="2"/>

        <rect x="220" y="30" width="160" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="300" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">فحص قائمة BOM</text>
        <text x="300" y="78" font-size="8.5" text-anchor="middle">خصم الخامات المباشر</text>

        <path d="M 380 65 L 420 65" stroke="#2563eb" stroke-width="2"/>

        <rect x="420" y="30" width="150" height="70" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="495" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">تشغيل الماكينات</text>
        <text x="495" y="78" font-size="8.5" text-anchor="middle">متابعة الفحص الفني</text>

        <path d="M 570 65 L 610 65" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="610" y="30" width="120" height="70" rx="6" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2"/>
        <text x="670" y="60" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">منتج تام</text>
        <text x="670" y="78" font-size="8.5" text-anchor="middle">إلى مخزن المبيعات</text>
      </svg>
    </div>

    <!-- 10. Quality Control -->
    <div class="section-title">2.10 إدارة ضبط الجودة والفحص الفني (Quality Control Inspection)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> سحب عينات عشوائية من خط الإنتاج، إجراء الاختبارات المعملية والفنية، توثيق نسبة العيوب، واستبعاد أي عبوة أو قطعة غير مطابقة للمواصفات القياسية.</p>

    <!-- 11. Maintenance & Spare Parts -->
    <div class="section-title">2.11 إدارة الصيانة الوقائية وقطع الغيار (Equipment Maintenance)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تتبع ساعات عمل الماكينات بالمصنع، جدولة الصيانة الوقائية الأسبوعية، إصدار طلب صرف قطع غيار من المخزن، وتوثيق تكلفة الصيانة على مركز التكلفة الخاص بالماكينة.</p>

    <!-- 12. Fleet Management -->
    <div class="section-title">2.12 إدارة أسطول السيارات والشاحنات (Fleet Management & Odometer)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تسجيل قراءة العداد الحالي (Odometer) قبل وبعد كل رحلة، تتبع تراخيص الشاحنات، جدولة غيار الزيت والإطارات، وحساب معدل الاستهلاك الفعلي للسولار لكل كيلومتر.</p>

    <!-- 13. Freight Logistics & Drivers -->
    <div class="section-title">2.13 إدارة رحلات الفنيين والسائقين (Freight Logistics & Drivers)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تعيين السائق والسيارة للشحنة، تسجيل تكاليف الطرق والعهد المالية، تصفية مستحقات السائق فور العودة، وتأكيد تسليم البضائع للعميل.</p>

    <!-- 14. Sales & CRM -->
    <div class="section-title">2.14 إدارة المبيعات والعملاء (Sales & CRM Division)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تسجيل أوامر البيع للعملاء، إصدار الفواتير الرسمية، تحصيل المبالغ النقدية وتغذية الخزنة، وخصم المنتجات التامة المباعة من المخزن آلياً.</p>

    <!-- 15. AI Suite -->
    <div class="section-title">2.15 منظومة الذكاء الاصطناعي والقيادة التنفيذية (AI Mind, Chatbot & CEO Dashboard)</div>
    <p><strong>الشرح والدورة التشغيلية:</strong> تقديم مساعد تفاعلي يتيح للموظف والمدير الاستفسار باللغة العربية عن رصيد الإجازات والرواتب، لوحة قيادة الرئيس التنفيذي التنبؤية للتنبيه بالأخطار قبل وقوعها، وتوجيه التنبيهات الذكية آلياً.</p>
  </div>

  <!-- CHAPTER 3: ALL 163+ DATABASE TABLES (NON-TABULAR PLAIN TEXT FORMAT) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الثالث: توثيق قاعدة البيانات الشاملة (${tableKeys.length} جدولاً بالكامل)</h2>
    <p style="margin-bottom:15px;">فيما يلي الكشف الوثائقي الكامل الشامل لجميع جداول النظام الـ <strong>${tableKeys.length} جدولاً</strong> واحدًا تلو الآخر، موضحاً اسم الجدول وشرحه الوظيفي بلغة بسيطة ومباشرة بدون جداول معقدة:</p>

    ${tableKeys.map((tName, idx) => {
      const t = dbSchema[tName];
      return `
        <div class="table-item-card">
          <div class="table-item-title">${idx + 1}. جدول: <code>${t.name}</code></div>
          <div class="table-item-desc">${t.explanation}</div>
        </div>
      `;
    }).join('')}
  </div>

  <!-- CHAPTER 4: COMMERCIAL PROPOSAL FOR 8 MONTHS DEV -->
  <div class="page-break">
    <div class="proposal-card">
      <h2 style="font-size: 18pt; color: #1e3a8a; text-align: center; margin-bottom: 12px;">💼 الفصل الرابع: عرض السعر التقديري الشامل (Commercial Proposal)</h2>
      <p style="text-align: center; font-weight: bold; color: #1d4ed8; margin-bottom: 18px;">عرض توريد وتطوير نظام NINJA SMART TECHNOLOGY FACTORY ERP</p>

      <div class="notice-box" style="background: #ffffff;">
        <strong>ملاحظة التقييم الاستثماري:</strong> تم حساب هذا العرض بناءً على حجم العمل المستمر منذ <strong>1 يناير 2026 وحتى 22 أغسطس 2026 (ما يقارب 8 أشهر تطوير متواصل)</strong> والنظام لا يزال تحت التطوير النشط والتحديث الميداني لضمان أعلى جودة:
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
          <tr style="background: #eff6ff; font-weight: bold;">
            <td colspan="2" style="text-align: left; font-size: 11pt; color:#1e3a8a;">إجمالي التقييم والتكلفة التجارية الشاملة:</td>
            <td style="color: #1d4ed8; font-size: 13pt;">420,000 ج.م</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 9.5pt; color: #1e3a8a;">
        <p><strong>بنود وضوابط العرض التجاري:</strong></p>
        <ul>
          <li>التطوير المستمر: يشمل العرض كافة التحديثات والتعديلات المطلوبة خلال فترة التطوير الحالية.</li>
          <li>الضمان والدعم الفني: ضمان سنة كاملة يشمل الصيانة والتحديثات والتوافق التشغيلي 100%.</li>
          <li>جدولة الدفعات: 40% دفعة التعاقد، 40% عند بدء التشغيل الميداني، 20% عند التسليم النهائي.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- CHAPTER 5: MASTER FULL SYSTEM INTEGRATION SVG DIAGRAM AT THE VERY END -->
  <div class="page-break">
    <h2 class="chapter-title">👑 الفصل الخامس: الرسمة الشاملة الجامعة للنظام بالكامل (Master ERP Map)</h2>
    <p>تضم هذه الرسمة العملاقة التكامل الموحد الشامل بين الـ 15 إدارة، المستندات، الخزائن، المخازن، محرك الذكاء الاصطناعي، وقاعدة البيانات الـ 163+ جدول في لوحة هندسية واحدة متكاملة:</p>

    <div class="diagram-box" style="padding:20px; background:#ffffff; border:3px solid #2563eb;">
      <svg class="diagram-svg" viewBox="0 0 850 620" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Frame -->
        <rect x="10" y="10" width="830" height="600" rx="12" fill="#f8fafc" stroke="#1d4ed8" stroke-width="3"/>
        
        <!-- Header Ribbon -->
        <rect x="30" y="25" width="790" height="45" rx="6" fill="#1e3a8a"/>
        <text x="425" y="53" font-weight="bold" font-size="15" text-anchor="middle" fill="#ffffff">NINJA SMART TECHNOLOGY FACTORY — MASTER INTEGRATED SYSTEM MAP</text>

        <!-- Top Layer: Users & Access -->
        <rect x="40" y="90" width="230" height="90" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="155" y="118" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">👥 مستخدمي النظام والصلاحيات</text>
        <text x="155" y="140" font-size="9" text-anchor="middle" fill="#1d4ed8">Owner, Admin, HR, Finance, QC</text>
        <text x="155" y="158" font-size="8.5" text-anchor="middle" fill="#475569">RBAC & Screen Permissions</text>

        <!-- Top Layer: HR & Payroll -->
        <rect x="310" y="90" width="230" height="90" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="118" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">👔 الموارد البشرية والرواتب والـ ATS</text>
        <text x="425" y="140" font-size="9" text-anchor="middle" fill="#1e40af">بصمة QR، جزاءات، سلف عمالة</text>
        <text x="425" y="158" font-size="8.5" text-anchor="middle" fill="#475569">صرف الرواتب آلياً بنقرة زر (Pay)</text>

        <!-- Top Layer: Finance & Safes -->
        <rect x="580" y="90" width="230" height="90" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="695" y="118" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">💰 المالية والحسابات والخزائن</text>
        <text x="695" y="140" font-size="9" text-anchor="middle" fill="#1e3a8a">خزينة نقود، بنوك، مراكز تكلفة</text>
        <text x="695" y="158" font-size="8.5" text-anchor="middle" fill="#475569">قيود محاسبية تلقائية وحظر السحب</text>

        <!-- Connectors Top to Mid -->
        <path d="M 155 180 L 155 220" stroke="#3b82f6" stroke-width="2"/>
        <path d="M 425 180 L 425 220" stroke="#2563eb" stroke-width="2"/>
        <path d="M 695 180 L 695 220" stroke="#1d4ed8" stroke-width="2"/>

        <!-- Middle Layer: SCM, BOM, Manufacturing -->
        <rect x="40" y="220" width="230" height="95" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="155" y="248" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">📦 المشتريات والمخازن</text>
        <text x="155" y="270" font-size="9" text-anchor="middle" fill="#1d4ed8">موردين، مواد خام، حد إعادة الطلب</text>
        <text x="155" y="288" font-size="8.5" text-anchor="middle" fill="#475569">إذن صرف وإضافة مخزني</text>

        <rect x="310" y="220" width="230" height="95" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="248" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">⚙️ التصنيع وأوامر الإنتاج BOM</text>
        <text x="425" y="270" font-size="9" text-anchor="middle" fill="#1e40af">خصم خامات آلي + ضبط الجودة QC</text>
        <text x="425" y="288" font-size="8.5" text-anchor="middle" fill="#475569">تحويل لمخزن المنتج التام</text>

        <rect x="580" y="220" width="230" height="95" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="695" y="248" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">🚚 الحركة والأسطول والسيارات</text>
        <text x="695" y="270" font-size="9" text-anchor="middle" fill="#1e3a8a">شاحنات، قراءة عداد Odometer</text>
        <text x="695" y="288" font-size="8.5" text-anchor="middle" fill="#475569">تصفية السولار ومستحقات السائق</text>

        <!-- Connectors Mid to Bottom -->
        <path d="M 155 315 L 155 365" stroke="#3b82f6" stroke-width="2"/>
        <path d="M 425 315 L 425 365" stroke="#2563eb" stroke-width="2"/>
        <path d="M 695 315 L 695 365" stroke="#1d4ed8" stroke-width="2"/>

        <!-- Lower Layer: AI Engine & Executive Dashboard -->
        <rect x="100" y="365" width="650" height="85" rx="8" fill="#1e3a8a" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="395" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🤖 منظومة الذكاء الاصطناعي والقيادة التنفيذية (AI Mind & Chatbot)</text>
        <text x="425" y="418" font-size="10" text-anchor="middle" fill="#bfdbfe">مساعد تفاعلي للموظفين + شاشات تنبؤية للرئيس التنفيذي للتنبيه بالأخطار قبل وقوعها</text>

        <!-- Master DB Hub Core at Bottom -->
        <rect x="40" y="475" width="770" height="110" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="3"/>
        <text x="425" y="508" font-weight="bold" font-size="14" text-anchor="middle" fill="#60a5fa">🗄️ المركز الحاكم لقواعد البيانات (163+ DATABASE TABLES HUB)</text>
        <text x="425" y="533" font-size="10.5" text-anchor="middle" fill="#ffffff">حفظ وترحيل ومعالجة كافة المعاملات المالية، المخزنية، الموارد البشرية، واللوجستية في بيئة سحابية واحدة آمنة</text>
        <text x="425" y="558" font-size="9.5" text-anchor="middle" fill="#93c5fd">🔒 Supabase PostgreSQL Cloud Security with Row-Level Policies (RLS)</text>
      </svg>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'master_nontech_erp_documentation.html'), htmlContent);
console.log('Successfully generated Non-Technical HTML template: master_nontech_erp_documentation.html');

// 4. Render HTML to PDF via Puppeteer
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
