const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Starting Mega Master Non-Technical ERP Manual Generator (Blue Edition v4 — 20 HR Workflows & Dual Dept Workflows) ===');

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
    'users': 'جدول سجل الحسابات الموحد: يخزن الحسابات الشخصية لجميع الموظفين والمدراء، يشمل الاسم، البريد، كلمة المرور المشفرة، الدور الوظيفي، والقسم التابع له.',
    'attendance': 'جدول سجلات الحضور والانصراف: يسجل وقت وتاريخ دخول وخروج الموظف عبر كود الـ QR أو البصمة، ويحسب دقائق التأخير والغياب آلياً.',
    'payroll': 'جدول كشوفات الرواتب والأجور: يخزن الراتب الأساسي، البدلات، المكافآت، الخصومات والجزاءات، وصافي المستحق المالي الصادر من الخزنة.',
    'leave_requests': 'جدول طلبات الإجازات والأذونات: يوثق الإجازات السنوية والمرضية والعارضة، حالة الموافقة من مدير القسم، والرصيد المتبقي للموظف.',
    'finance_safes': 'جدول الخزائن الحقيقية والبنكية: يراقب حركة النقود والسيولة في خزينة المصنع والحسابات البنكية وحظر السحب عند عدم كفاية الرصيد.',
    'journal_entries': 'جدول القيود المحاسبية الآلية: ينشئ قيداً مالياً متوازناً فورياً لكل حركة شراء، بيع، صرف راتب، أو سداد مورد دون أي تدخل يدوي.',
    'cost_centers': 'جدول مراكز التكلفة: يربط التكاليف والرواتب والمصروفات بالقسم أو خط الإنتاج لمعرفة ربحية كل خط إنتاج بشكل منفصل.',
    'suppliers': 'جدول بيانات الموردين: يحتوي على اسماء الموردين، شركات التوريد، أرقام التواصل، والالتزامات المالية المستحقة للمورد.',
    'purchase_orders': 'جدول أوامر الشراء الرسمية: يخزن الكميات المطلوب شراؤها من المواد الخام، الأسعار المتفق عليها، والموردين المعتمدين.',
    'inventory_items': 'جدول المنتجات والمواد الخام بالمخزن: يحتوي على كود المادة الخام، رصيد الكمية المتاحة، وسعر التكلفة وحد الإعادة.',
    'stock_movements': 'جدول حركات أذون المخزن: يسجل حركة إضافة الخامات أو صرفها لخطوط الإنتاج وتوثيق اسم المسؤول وتاريخ الحركة.',
    'bom': 'جدول قائمة مكونات المنتج (BOM): يحدد النسب والمعايير الفنية الدقيقة من المواد الخام السائبة اللازمة لتصنيع كل منتج.',
    'production_orders': 'جدول أوامر التشغيل والإنتاج: يتابع حالة تصنيع الشحنات على خطوط الإنتاج والكميات المستهدفة ونسبة الإنجاز.',
    'qc_inspections': 'جدول فحص جودة المنتجات: يوثق العينات المعملية، نسبة العيوب المقبولة، وإجازة المنتجات للتعبئة أو استبعادها.',
    'equipment': 'جدول خطوط الإنتاج والماكينات: يسجل الماكينات التشغيلية، تاريخ الصيانة، ساعات العمل، وحالة الكفاءة الفنية لكل آلة.',
    'maintenance_logs': 'جدول الصيانة والقطع المستبدلة: يوثق بلاغات الأعطال، قطع الغيار المصروفة من المخزن، وتكلفة الصيانة التشغيلية.',
    'fleet_vehicles': 'جدول أسطول الشاحنات والسيارات: يحتوي على شاحنات النقل، رخص القيادة، قراءة العداد الحالي (Odometer)، وحالة السولار.',
    'fleet_trips': 'جدول رحلات النقل والشحن: يوثق خط سير الرحلة، اسم السائق، مسافة الكيلومترات، وعهد الوقود والمستحقات المترتبة.',
    'spare_parts': 'جدول قطع الغيار المستهلكة: يراقب رصيد قطع غيار الماكينات والسيارات المتوفرة بمخزن الصيانة لضمان عدم توقف العمل.',
    'ats_applications': 'جدول طلبات التوظيف (ATS): يسجل السير الذاتية (PDF)، درجة تقييم الذكاء الاصطناعي، ونتائج المقابلات الشخصية.',
    'screen_permissions': 'جدول صلاحيات الشاشات (RBAC): يحدد بالضبط ما هي الشاشات والأزرار المسموح لكل مستخدم برؤيتها وتعديلها.'
  };

  sqlFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    const sql = fs.readFileSync(fullPath, 'utf8');

    const tableRegex = /CREATE\ TABLE\ (IF\ Not\ EXISTS\ )?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tName = match[2].toLowerCase().trim();
      if (!tables[tName]) {
        let desc = tableExplanations[tName] || `جدول سجلات (${tName}): يُستخدم لتخزين وحفظ البيانات والمعاملات الإدارية الخاصة بنشاط المؤسسة، مع توثيق الحركة التاريخية واستعراضها عبر الشاشات المعتمدة.`;
        tables[tName] = { name: tName, explanation: desc, source: relPath };
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

// 3. Generate HTML Content with 20 HR Workflows, 2 Workflows per department, 170 Tables Schema SVG, and Mega System Map
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>الدليل التشغيلي الشامل والموسع - NINJA SMART TECHNOLOGY FACTORY ERP</title>
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
    
    /* ROYAL BLUE COVER PAGE THEME */
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
      background: #eff6ff; border: 2.5px solid #3b82f6; border-radius: 10px;
      padding: 20px; margin: 22px 0; text-align: center; page-break-inside: avoid;
    }
    .diagram-svg { width: 100%; max-width: 820px; height: auto; margin: 0 auto; }
    
    .notice-box {
      background: #eff6ff; border-right: 4px solid #2563eb; padding: 12px 16px;
      border-radius: 6px; margin: 15px 0; color: #1e40af; font-size: 10pt;
    }

    .workflow-card {
      background: #f8fafc; border: 1.5px solid #cbd5e1; border-right: 4px solid #2563eb;
      border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; page-break-inside: avoid;
    }
    .workflow-title { font-weight: 800; color: #1e3a8a; font-size: 11pt; margin-bottom: 6px; }
    .workflow-steps { color: #334155; font-size: 10pt; line-height: 1.7; }

    .proposal-card {
      background: #f8fafc; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin-top: 20px;
    }

    .table-item-card {
      background: #ffffff; border: 1px solid #e2e8f0; border-right: 4px solid #2563eb;
      border-radius: 6px; padding: 10px 14px; margin-bottom: 10px; page-break-inside: avoid;
    }
    .table-item-title { font-weight: 800; color: #1e3a8a; font-size: 10.5pt; margin-bottom: 2px; }
    .table-item-desc { color: #475569; font-size: 9.5pt; }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="cover-logo-wrapper">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="NINJA SMART TECHNOLOGY FACTORY LOGO" class="cover-logo-img" />` : '<div style="font-size:70px;">🏢</div>'}
      </div>
      <h1 class="cover-title">NINJA SMART TECHNOLOGY FACTORY</h1>
      <div class="cover-subtitle">نظام إدارة المصانع الذكية والموارد البشرية والتخطيط المؤسسي<br>(Smart Factory HR & Enterprise ERP System)</div>
      <div class="cover-badge">الدليل الموسع الكلي — 20 دورة HR، دورتين لكل إدارة، 170 جدول، والخريطة العملاقة للنظام</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #eff6ff; font-size: 11pt; line-height: 1.8;">المرجع الميداني والتشغيلي المكتمل. يغطي 20 دورة تفصيلية للـ HR، دورتين تشغيليتين لكل إدارة من الإدارات الـ 15، سكيما البيانات الـ 170 جدول، وخريطة الربط الهندسية الكبرى للنظام بالكامل.</p>
    </div>

    <div class="cover-meta">
      <div><strong>فترة التطوير الميداني:</strong> 1 يناير 2026 حتى 22 أغسطس 2026 (مستمر والتحديث جارٍ)</div>
      <div><strong>إعداد وتطوير:</strong> فريق النظم الهندسية والذكاء الاصطناعي</div>
    </div>
  </div>

  <!-- CHAPTER 1: OVERVIEW -->
  <div class="page-break">
    <h2 class="chapter-title">🌟 الفصل الأول: مقدمة ومفهوم إدارة الموارد المؤسسية</h2>
    
    <div class="notice-box">
      <strong>تأكيد التطوير الميداني:</strong> تم بدء العمل والتطوير الهندسي في هذا النظام منذ <strong>1 يناير 2026</strong> واستمر حتى اليوم <strong>22 أغسطس 2026</strong>. النظام حالياً في حالة تطوير ونشر نشطة لضمان تلبية أحدث متطلبات المصانع الذكية.
    </div>

    <div class="section-title">1.1 الهدف الأساسي من النظام</div>
    <p>صُمم نظام <strong>NINJA SMART TECHNOLOGY FACTORY ERP</strong> ليكون العقل المحرك والعمود الفقري الرقمي للمؤسسة. يربط النظام كافة الإدارات (المبيعات، المشتريات، الموارد البشرية، المالية، المخازن، والإنتاج) في بيئة سحابية واحدة. بمجرد إدخال الحركة، يقوم النظام بفحص الصلاحيات، التطبيق الآلي لقواعد العمل، والترحيل المحاسبي والتأثير المخزني الفوري.</p>
  </div>

  <!-- CHAPTER 2: ALL 15 DEPARTMENTS WITH DUAL WORKFLOWS & ENLARGED SVG DIAGRAMS -->
  <div class="page-break">
    <h2 class="chapter-title">🏬 الفصل الثاني: تفاصيل الإدارات الـ 15 ودورات العمل الثنائية والرسومات المكبرة</h2>
    <p>فيما يلي تفصيل شامل لجميع الإدارات الـ 15، حيث تحتوي كل إدارة على <strong>دورتين تشغيليتين كاملتين (Dual Workflows)</strong> ورسمة SVG مكبرة واسعة النطاق دون استثناء:</p>

    <!-- 1. SALES DIVISION -->
    <div class="section-title">2.1 إدارة المبيعات وإدارة العملاء (Sales & CRM Division)</div>
    <p><strong>الشرح التفصيلي:</strong> تُعد إدارة المبيعات المحرك الرئيسي لإيرادات المؤسسة عبر دورتين رئيسيتين:</p>
    
    <div class="workflow-card">
      <div class="workflow-title">🔄 الدورة الأولى: دورة المبيعات الكبرى والشحن للعميل (End-to-End Sales Cycle):</div>
      <div class="workflow-steps">
        1. استلام طلب العميل (RFQ) ← 2. إصدار عرض السعر الرسمية (Quotation) ← 3. أمر المبيعات المؤكد (Sales Order) ← 4. فحص المخزن وأمر الإنتاج (BOM) ← 5. تحصيل الدفعة المقدمة بالخزنة ← 6. إذن الشحن (Delivery Note) ← 7. الفاتورة الضريبية والقيد الآلي ← 8. تحميل البضاعة وتسليم العميل (العميل يشيل المنتج).
      </div>
    </div>

    <div class="workflow-card">
      <div class="workflow-title">🔄 الدورة الثانية: دورة المرتجعات والتسويات الماليّة للعملاء (Sales Returns & Credit Notes):</div>
      <div class="workflow-steps">
        1. تقديم طلب إرجاع بضاعة من العميل ← 2. الفحص المعملي والجودة لتحديد العيب ← 3. إصدار إذن استلام مخزني للمرتجع ← 4. إصدار إشعار دائن (Credit Note) للعميل ← 5. تسوية حساب العميل في المحاسبة وتعديل رصيد الخزنة.
      </div>
    </div>

    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; font-size:12pt; margin-bottom:12px;">رسمة مكبرة تفصيلية 1: دورة المبيعات الشاملة والدورة الماليّة للمرتجعات</div>
      <svg class="diagram-svg" viewBox="0 0 820 180" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="20" width="180" height="65" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="105" y="48" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. طلب المبيعات وعرض السعر</text>

        <path d="M 195 52 L 225 52" stroke="#3b82f6" stroke-width="2.5"/>

        <rect x="225" y="20" width="180" height="65" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
        <text x="315" y="48" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. تحصيل الخزنة والـ BOM</text>

        <path d="M 405 52 L 435 52" stroke="#2563eb" stroke-width="2.5"/>

        <rect x="435" y="20" width="180" height="65" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
        <text x="525" y="48" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. الفاتورة الشحن والأسطول</text>

        <path d="M 615 52 L 645 52" stroke="#1d4ed8" stroke-width="2.5"/>

        <rect x="645" y="20" width="160" height="65" rx="8" fill="#1e3a8a" stroke="#2563eb" stroke-width="2.5"/>
        <text x="725" y="48" font-weight="bold" font-size="11" text-anchor="middle" fill="#ffffff">4. تسليم العميل الشحنة</text>

        <!-- Secondary Row for Returns -->
        <rect x="180" y="105" width="460" height="55" rx="8" fill="#eff6ff" stroke="#2563eb" stroke-width="2"/>
        <text x="410" y="138" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">🔄 دورة المرتجعات: طلب مرتجع ← فحص الجودة ← إذن إضافة مخزني ← إشعار دائن وتسوية الخزنة</text>
      </svg>
    </div>

    <!-- 2. PROCUREMENT DIVISION -->
    <div class="section-title">2.2 إدارة المشتريات والموردين (Procurement & Vendor Management)</div>
    <p><strong>الشرح والتفصيل:</strong> تأمين الاحتياجات عبر دورتين متكاملتين:</p>

    <div class="workflow-card">
      <div class="workflow-title">🔄 الدورة الأولى: دورة الشراء الخارجي والاستلام المخزني (Procurement Cycle):</div>
      <div class="workflow-steps">
        1. طلب احتياج مخزني (PR) ← 2. طلب عروض أسعار (RFQ) ← 3. أمر شراء PO ← 4. استلام وفحص الجودة QC ← 5. سداد مستحقات المورد من الخزنة والقيد.
      </div>
    </div>

    <div class="workflow-card">
      <div class="workflow-title">🔄 الدورة الثانية: دورة تقييم الموردين وتجديد الاعتماد (Vendor Qualification):</div>
      <div class="workflow-steps">
        1. تسجيل بيانات المورد والشركاء ← 2. تقييم سرعة التوريد ونسبة العيوب ← 3. تصنيف المورد المعتمد (Approved Vendor) ← 4. تجديد الاتفاقية أو الحظر آلياً.
      </div>
    </div>

    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; font-size:12pt; margin-bottom:12px;">رسمة مكبرة تفصيلية 2: منظومة المشتريات وتقييم الموردين</div>
      <svg class="diagram-svg" viewBox="0 0 800 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="30" width="140" height="85" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="85" y="65" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. طلب الشراء PR</text>

        <path d="M 155 72 L 180 72" stroke="#3b82f6" stroke-width="2.5"/>

        <rect x="180" y="30" width="140" height="85" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
        <text x="250" y="65" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. أمر الشراء PO</text>

        <path d="M 320 72 L 345 72" stroke="#2563eb" stroke-width="2.5"/>

        <rect x="345" y="30" width="140" height="85" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
        <text x="415" y="65" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. فحص QC والمخزن</text>

        <path d="M 485 72 L 510 72" stroke="#1d4ed8" stroke-width="2.5"/>

        <rect x="510" y="30" width="140" height="85" rx="8" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2.5"/>
        <text x="580" y="65" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">4. سداد المورد</text>

        <path d="M 650 72 L 675 72" stroke="#1e3a8a" stroke-width="2.5"/>

        <rect x="675" y="30" width="110" height="85" rx="8" fill="#1e3a8a" stroke="#2563eb" stroke-width="2.5"/>
        <text x="730" y="65" font-weight="bold" font-size="11" text-anchor="middle" fill="#ffffff">5. تقييم المورد</text>
      </svg>
    </div>

    <!-- 3. HR DIVISION (20 WORKFLOWS) -->
    <div class="section-title">2.3 إدارة الموارد البشرية والرواتب (HR Division — 20 Full Workflows)</div>
    <p><strong>الشرح والتفصيل:</strong> تحتوي إدارة الموارد البشرية على <strong>20 دورة تشغيلية مكتملة</strong> تغطي كافة شؤون العامل والموظف بالمصنع:</p>

    <div class="workflow-card">
      <div class="workflow-title">🔄 كشف ودورات الموارد البشرية الـ 20 الكاملة:</div>
      <div class="workflow-steps">
        <strong>1. التوظيف والفرز الذكي (ATS):</strong> رفع السير الذاتية (PDF)، تحليل المهارات آلياً بالذكاء الاصطناعي.<br>
        <strong>2. المقابلة والتقييم الفني:</strong> جدولة المقابلة، تسجيل درجات التقييم، وتحديد التوافق الوظيفي.<br>
        <strong>3. العقد وتحديد الراتب والبدلات:</strong> صياغة العقد وتحديد الراتب الأساسي، بدل السكن، والمواصلات.<br>
        <strong>4. إنشاء الملف الشخصي والرقم القومي:</strong> حفظ صور الرقم القومي، الشهادات، وفيش التشبيه بصورة آمنة.<br>
        <strong>5. ربط البنك وتحويل المرتبات:</strong> تسجيل رقم الحساب البنكي أو كارت الميزة لتحويل المستحقات.<br>
        <strong>6. الحضور والانصراف بالـ QR Code:</strong> مسح الكود اليومي وتحديد وقت الدخول والخروج ودقائق التأخير.<br>
        <strong>7. تغيير الورديات ونظام الشيفتات:</strong> توزيع الموظفين والعمالة على وردية صباحية/مسائية ومطابقة البصمة.<br>
        <strong>8. السلف اليومية والأسبوعية للعمالة:</strong> احتساب سلف العمالة تلقائياً بناءً على عدد أيام الحضور الأسبوعية.<br>
        <strong>9. السلف الشهرية الطارئة:</strong> تقديم طلب سلفة طارئة واعتماد مدير HR والخصم من راتب الشهر.<br>
        <strong>10. الخصومات والتأخيرات الآلية:</strong> تطبيق لائحة الخصم التلقائية عند التأخير عن ميعاد الوردية الرسمي.<br>
        <strong>11. جزاءات الغياب بدون إذن:</strong> الخصم الآلي لمبلغ يومين من الراتب الأساسي عند الغياب غير المبرر.<br>
        <strong>12. حوافز الإنتاج والمكافآت:</strong> احتساب مكافآت التميز وحوافز تحقيق خطة الإنتاج وتضمينها بالمسرد.<br>
        <strong>13. ساعات العمل الإضافية (Overtime):</strong> تسجيل ساعات الإضافي بعد الوردية واحتساب قيمتها المضاعفة.<br>
        <strong>14. طلبات الإجازات السنوية والمرضية:</strong> تقديم طلب إجازة وتخصيمها من رصيد الموظف بعد موافقة المدير.<br>
        <strong>15. الأذونات والخروج المؤقت:</strong> تسجيل إذن خروج لساعات محددة أثناء العمل ومتابعة العودة.<br>
        <strong>16. القروض طويلة الأجل وجدولة الأقساط:</strong> طلب قرض وجدولة أقساطه الشهرية لتخصم تلقائياً من الرواتب.<br>
        <strong>17. التأمينات الاجتماعية والصحية:</strong> تسجيل رصيد الاشتراك التأميني واستقطاع حصة الموظف والشركة.<br>
        <strong>18. التقييم السنوي والترقيات:</strong> قياس كفاءة الموظف السنوية وتوثيق الترقيات وزيادات الراتب.<br>
        <strong>19. زر الصرف الذكي (Pay Execution):</strong> ترحيل مسرد الرواتب وصرف صافي المستحق من الخزنة المحددة.<br>
        <strong>20. إنهاء الخدمة وإخلاء الطرف (Offboarding):</strong> تصفية مستحقات الموظف، تسليم العهد، وتجميد الحساب.
      </div>
    </div>

    <!-- ENLARGED SVG DIAGRAM 3 -->
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; font-size:12pt; margin-bottom:12px;">رسمة مكبرة تفصيلية 3: الشبكة الموسعة لدورات الموارد البشرية والرواتب الـ 20</div>
      <svg class="diagram-svg" viewBox="0 0 820 230" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="20" width="180" height="80" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="105" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. التوظيف والتعاقد</text>
        <text x="105" y="75" font-size="9" text-anchor="middle" fill="#1d4ed8">ATS + المقابلة والملف</text>

        <path d="M 195 60 L 225 60" stroke="#3b82f6" stroke-width="2.5"/>

        <rect x="225" y="20" width="180" height="80" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
        <text x="315" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. الحضور والـ QR</text>
        <text x="315" y="75" font-size="9" text-anchor="middle" fill="#1d4ed8">الورديات والتأخيرات</text>

        <path d="M 405 60 L 435 60" stroke="#2563eb" stroke-width="2.5"/>

        <rect x="435" y="20" width="180" height="80" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
        <text x="525" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. السلف والجزاءات</text>
        <text x="525" y="75" font-size="9" text-anchor="middle" fill="#1e3a8a">سلف أسبوعية وتلقائية</text>

        <path d="M 615 60 L 645 60" stroke="#1d4ed8" stroke-width="2.5"/>

        <rect x="645" y="20" width="160" height="80" rx="8" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2.5"/>
        <text x="725" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">4. الإجازات والقروض</text>
        <text x="725" y="75" font-size="9" text-anchor="middle" fill="#1e3a8a">أقساط وتأمين صحي</text>

        <!-- Down Arrow & Row 2 -->
        <path d="M 725 100 L 725 135" stroke="#1e3a8a" stroke-width="2.5"/>

        <rect x="520" y="135" width="285" height="75" rx="8" fill="#1e3a8a" stroke="#2563eb" stroke-width="2.5"/>
        <text x="662" y="168" font-weight="bold" font-size="11.5" text-anchor="middle" fill="#ffffff">5. زر الصرف الذكي (Pay) الصادر من الخزنة</text>
        <text x="662" y="188" font-size="9" text-anchor="middle" fill="#bfdbfe">ترحيل المسرد وتوليد القيد المحاسبي آلياً</text>

        <path d="M 520 172 L 490 172" stroke="#2563eb" stroke-width="2.5"/>

        <rect x="15" y="135" width="475" height="75" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="252" y="168" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">6. إنهاء الخدمة وتصفية المستحقات والتخارج (Offboarding)</text>
        <text x="252" y="188" font-size="9" text-anchor="middle" fill="#1d4ed8">تسليم العهد الميدانية، إخلاء الطرف وتجميد الحساب</text>
      </svg>
    </div>

    <!-- 4 TO 15 OTHER DEPARTMENTS DUAL WORKFLOWS -->
    <div class="section-title">2.4 دورتين تفصيليتين لكل قسم من الأقسام الـ 12 الباقية</div>

    <!-- 4. ATTENDANCE -->
    <div class="workflow-card">
      <div class="workflow-title">4. إدارة الحضور والبصمة الذكية (Attendance & QR):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: مسح الـ QR والورديات:</strong> مسح البصمة ← مطابقة وقت الوردية ← تسجيل التأخيرات.<br>
        <strong>الدورة 2: التسوية والتظلمات:</strong> تقديم تظلم تأخير ← موافقة HR ← تعديل سجل الحضور آلياً.
      </div>
    </div>

    <!-- 5. ATS RECRUITMENT -->
    <div class="workflow-card">
      <div class="workflow-title">5. إدارة التوظيف الذكي (ATS Recruitment):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: الفرز السريع بالذكاء:</strong> رفع السيرة الذاتية PDF ← تحليل المهارات ← استخراج نسبة المطابقة.<br>
        <strong>الدورة 2: الاختبار الميداني والتعيين:</strong> إرسال اختبار أونلاين ← تقييم النتيجة ← إصدار عرض العمل.
      </div>
    </div>

    <!-- 6. ACCOUNTING -->
    <div class="workflow-card">
      <div class="workflow-title">6. الإدارة المالية والقيود (General Ledger):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: توليد القيد التلقائي:</strong> استلام المعاملة (بيع/شراء/رواتب) ← إنشاء قيد متوازن آلياً.<br>
        <strong>الدورة 2: الإقفال الشهري والقوائم:</strong> مطابقة الحسابات ← إقفال الدفتر ← استخراج ميزان المراجعة والميزانية.
      </div>
    </div>

    <!-- 7. TREASURY -->
    <div class="workflow-card">
      <div class="workflow-title">7. إدارة الخزائن والبنوك (Treasury & Cash Control):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: الصرف والقبض النقدي:</strong> فحص رصيد الخزنة ← تنفيذ الصرف ← تحديث السيولة الفورية.<br>
        <strong>الدورة 2: التحويل بين الخزائن والبنوك:</strong> طلب نقل سيولة ← اعتماد الإدارة ← تحديث حساب الخزنتين.
      </div>
    </div>

    <!-- 8. COST CENTERS -->
    <div class="workflow-card">
      <div class="workflow-title">8. إدارة مراكز التكلفة (Cost Centers):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: توزيع المصروفات:</strong> ربط الفاتورة بكود مركز التكلفة ← توجيه التكلفة لخط الإنتاج.<br>
        <strong>الدورة 2: تقرير تحليل الربحية:</strong> تجميع الإيرادات والتكاليف لكل مركز ← استخراج نسبة ربحية الخط.
      </div>
    </div>

    <!-- 9. INVENTORY -->
    <div class="workflow-card">
      <div class="workflow-title">9. إدارة المخازن ورصيد الخامات (Inventory Control):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: إذن الإضافة والصرف:</strong> استلام الخامة ← إذن إضافة مخزني ← الخصم عند التغذية للإنتاج.<br>
        <strong>الدورة 2: الجرد الدوري والتسوية:</strong> مطابقة الرصيد الفعلي بالمستندي ← تعديل عجز/زيادة المخزون.
      </div>
    </div>

    <!-- 10. MANUFACTURING & BOM -->
    <div class="workflow-card">
      <div class="workflow-title">10. إدارة خطوط الإنتاج والـ BOM (Manufacturing):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: أمر التشغيل والخصم الآلي:</strong> فتح أمر إنتاج ← خصم الخامات بحسب معايير BOM المحددة.<br>
        <strong>الدورة 2: استلام المنتج التام:</strong> إنهاء التصنيع ← تحويل البضاعة لمخزن البيع وتحديث الكميات.
      </div>
    </div>

    <!-- 11. QUALITY CONTROL -->
    <div class="workflow-card">
      <div class="workflow-title">11. إدارة ضبط الجودة والفحص (Quality Control):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: فحص خامات المشتريات:</strong> سحب عينة من شحنة المورد ← الفحص الفني ← إجازة/رفض الشحنة.<br>
        <strong>الدورة 2: فحص خطوط الإنتاج:</strong> التفتيش الدوري على عينات التصنيع ← عزيل العيوب لمنع التعبئة الخطأ.
      </div>
    </div>

    <!-- 12. MAINTENANCE -->
    <div class="workflow-card">
      <div class="workflow-title">12. إدارة الصيانة وقطع الغيار (Equipment Maintenance):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: الصيانة الطارئة والأعطال:</strong> تقديم بلاغ عطل ← صرف قطعة غيار ← إغلاق بلاغ الصيانة.<br>
        <strong>الدورة 2: الصيانة الوقائية السنوية:</strong> تتبع ساعات تشغيل الآلة ← جدولة العمرات وتغيير الزيوت آلياً.
      </div>
    </div>

    <!-- 13. FLEET MANAGEMENT -->
    <div class="workflow-card">
      <div class="workflow-title">13. إدارة أسطول السيارات والعداد (Fleet Management):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: تتبع العداد والوقود:</strong> تسجيل قراءة Odometer ← صرف السولار ← احتساب معدل الاستهلاك.<br>
        <strong>الدورة 2: ترخيص وتراخيص السيارات:</strong> التنبيه بميعاد الفحص الفني والترخيص وتغيير إطارات الشاحنة.
      </div>
    </div>

    <!-- 14. DRIVERS LOGISTICS -->
    <div class="workflow-card">
      <div class="workflow-title">14. إدارة رحلات السائقين والشحن (Freight Logistics):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: رحلة النقل والتسليم:</strong> تكليف السائق بالرحلة ← التسليم في موقع العميل ← استلام الإشعار.<br>
        <strong>الدورة 2: تصفية العهد ومصاريف الطرق:</strong> تقديم فواتير الكارتة والوقود ← صرف مستحقات السائق بالخزنة.
      </div>
    </div>

    <!-- 15. AI SUITE -->
    <div class="workflow-card">
      <div class="workflow-title">15. منظومة الذكاء الاصطناعي والـ CEO (AI Mind Suite):</div>
      <div class="workflow-steps">
        <strong>الدورة 1: شات بوت استفسارات الموظفين:</strong> السؤال باللغة العربية ← معالجة البيانات بحسب الصلاحيات.<br>
        <strong>الدورة 2: التنبؤات التنفيذية للرئيس التنفيذي:</strong> تحليل اتجاهات المبيعات والمخزون وإرسال تنبيهات مبكرة.
      </div>
    </div>
  </div>

  <!-- CHAPTER 3: DATABASE TABLES & MASSIVE DATABASE SCHEMA SVG (170 TABLES) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الثالث: توثيق وسكيما قاعدة البيانات (170 جدولاً بالكامل)</h2>
    
    <div class="section-title">3.1 الرسمة الشاملة الهندسية لقاعدة البيانات (170 Database Tables Schema SVG)</div>
    <p>توضح هذه الرسمة المكبرة تقسيم الـ 170 جدولاً في قاعدة البيانات على 10 مجموعات تشغيلية رئيسية:</p>

    <!-- MASSIVE DATABASE SCHEMA SVG (170 TABLES) -->
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; font-size:12.5pt; margin-bottom:12px;">رسمة سكيما قاعدة البيانات الشاملة (170 TABLES DATABASE ARCHITECTURE MAP)</div>
      <svg class="diagram-svg" viewBox="0 0 820 480" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="800" height="460" rx="10" fill="#ffffff" stroke="#1d4ed8" stroke-width="3"/>
        
        <!-- Module 1 -->
        <rect x="30" y="30" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. الحسابات والأمان (22 جدول)</text>
        <text x="140" y="75" font-size="8.5" text-anchor="middle">users, screen_permissions</text>
        <text x="140" y="92" font-size="8.5" text-anchor="middle">user_sessions, audit_logs</text>

        <!-- Module 2 -->
        <rect x="290" y="30" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="405" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. HR والحضور (25 جدول)</text>
        <text x="405" y="75" font-size="8.5" text-anchor="middle">attendance, leave_requests</text>
        <text x="405" y="92" font-size="8.5" text-anchor="middle">shifts, hr_absence, ats_apps</text>

        <!-- Module 3 -->
        <rect x="550" y="30" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="660" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. الرواتب والسلف (18 جدول)</text>
        <text x="660" y="75" font-size="8.5" text-anchor="middle">payroll, worker_advances</text>
        <text x="660" y="92" font-size="8.5" text-anchor="middle">loans, bonus_penalties</text>

        <!-- Module 4 -->
        <rect x="30" y="175" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">4. المالية والحسابات (24 جدول)</text>
        <text x="140" y="220" font-size="8.5" text-anchor="middle">chart_of_accounts, journal_entries</text>
        <text x="140" y="237" font-size="8.5" text-anchor="middle">cost_centers, taxes_ledger</text>

        <!-- Module 5 -->
        <rect x="290" y="175" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="405" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">5. الخزائن والبنوك (16 جدول)</text>
        <text x="405" y="220" font-size="8.5" text-anchor="middle">finance_safes, bank_accounts</text>
        <text x="405" y="237" font-size="8.5" text-anchor="middle">cash_transfers, bank_checks</text>

        <!-- Module 6 -->
        <rect x="550" y="175" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="660" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">6. المشتريات والموردين (20 جدول)</text>
        <text x="660" y="220" font-size="8.5" text-anchor="middle">suppliers, purchase_orders</text>
        <text x="660" y="237" font-size="8.5" text-anchor="middle">supplier_invoices, rfqs</text>

        <!-- Module 7 -->
        <rect x="30" y="320" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">7. المخازن والخامات (17 جدول)</text>
        <text x="140" y="365" font-size="8.5" text-anchor="middle">inventory_items, stock_movements</text>
        <text x="140" y="382" font-size="8.5" text-anchor="middle">warehouses, stock_adjustments</text>

        <!-- Module 8 -->
        <rect x="290" y="320" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="405" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">8. الإنتاج والجودة (16 جدول)</text>
        <text x="405" y="365" font-size="8.5" text-anchor="middle">bom, production_orders</text>
        <text x="405" y="382" font-size="8.5" text-anchor="middle">qc_inspections, machines</text>

        <!-- Module 9 & 10 -->
        <rect x="550" y="320" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="660" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">9&10. الأسطول والذاتية (14 جدول)</text>
        <text x="660" y="365" font-size="8.5" text-anchor="middle">fleet_vehicles, fleet_trips</text>
        <text x="660" y="382" font-size="8.5" text-anchor="middle">spare_parts, ai_prompts</text>
      </svg>
    </div>

    <div class="section-title">3.2 كشف جداول قاعدة البيانات (${tableKeys.length} جدولاً)</div>
    <table>
      <thead><tr><th>#</th><th>اسم الجدول</th><th>الوظيفة الأساسية</th></tr></thead>
      <tbody>
    ${tableKeys.map((tName, idx) => {
      const t = dbSchema[tName];
      const shortDesc = t.explanation.split(':')[1] ? t.explanation.split(':')[1].split('،')[0].trim() : t.explanation.split('،')[0];
      return `<tr><td>${idx + 1}</td><td><code>${t.name}</code></td><td>${shortDesc}</td></tr>`;
    }).join('\n    ')}
      </tbody>
    </table>
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
            <td><strong>2. تطوير وبناء قاعدة البيانات (170 Tables Architecture)</strong></td>
            <td>بناء وهيكلة الـ 170 جدول، وتفعيل الحماية التلقائية RLS والنسخ الاحتياطي</td>
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
    </div>
  </div>

  <!-- CHAPTER 5: MEGA GIANT MASTER FULL SYSTEM SVG MAP (EXTREMELY LARGE & DETAILED) -->
  <div class="page-break">
    <h2 class="chapter-title">👑 الفصل الخامس: الخريطة العملاقة الكبرى للنظام بالكامل (MEGA MASTER SYSTEM ARCHITECTURE MAP)</h2>
    <p>تضم هذه الخريطة الهندسية العملاقة التفاعل الربطي المتكامل بين جميع الـ 15 إدارة، 20 دورة HR، دورة المبيعات الكبرى، المشتريات، الخزائن، المخازن، الأسطول، وقاعدة البيانات الـ 170 جدول:</p>

    <!-- MEGA GIANT SVG MAP (HEIGHT 1250px) -->
    <div class="diagram-box" style="padding:22px; background:#ffffff; border:4px solid #1d4ed8;">
      <svg class="diagram-svg" viewBox="0 0 850 1250" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer Frame -->
        <rect x="10" y="10" width="830" height="1230" rx="16" fill="#f8fafc" stroke="#1e3a8a" stroke-width="4"/>
        
        <!-- Header Banner -->
        <rect x="30" y="25" width="790" height="55" rx="8" fill="#1e3a8a"/>
        <text x="425" y="60" font-weight="bold" font-size="16" text-anchor="middle" fill="#ffffff">NINJA SMART TECHNOLOGY FACTORY — MEGA MASTER SYSTEM MAP</text>

        <!-- Block 1: Security & Users -->
        <rect x="40" y="100" width="770" height="100" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="425" y="130" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">🔐 بوابات الأمان والحسابات والمستخدمين (RBAC & Screen Security)</text>
        <text x="425" y="155" font-size="10" text-anchor="middle" fill="#1d4ed8">Owner, Admin, HR Manager, Finance Officer, Production Engineer, Driver, Client Portal</text>
        <text x="425" y="175" font-size="9" text-anchor="middle" fill="#475569">حظر الشاشات وحماية الأزرار والنسخ الاحتياطي التلقائي</text>

        <path d="M 425 200 L 425 235" stroke="#3b82f6" stroke-width="3"/>

        <!-- Block 2: Sales End-to-End -->
        <rect x="40" y="235" width="770" height="135" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
        <text x="425" y="265" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">📈 دورة المبيعات الكبرى كاملة ودورة المرتجعات (Sales & Customer Delivery Lifecycle)</text>
        <text x="425" y="295" font-size="10" text-anchor="middle" fill="#1e40af">طلب العميل (RFQ) ← عرض سعر Quotation ← أمر مبيعات Sales Order ← فحص المخزون والإنتاج BOM</text>
        <text x="425" y="320" font-size="10" text-anchor="middle" fill="#1e40af">تحصيل الدفعة بالخزنة ← إذن الشحن Delivery Note ← الفاتورة الضريبية والقيد ← تحميل الشاحنة وتسليم البضاعة (العميل يشيل المنتج)</text>

        <path d="M 425 370 L 425 405" stroke="#2563eb" stroke-width="3"/>

        <!-- Block 3: Manufacturing & BOM & QC -->
        <rect x="40" y="405" width="770" height="135" rx="10" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
        <text x="425" y="435" font-weight="bold" font-size="13" text-anchor="middle" fill="#0f172a">⚙️ إدارة خطوط الإنتاج والخصم المخزني الآلي والجودة والصيانة</text>
        <text x="425" y="465" font-size="10" text-anchor="middle" fill="#1e3a8a">أمر الإنتاج ← خصم الخامات المباشر بحسب قائمة BOM ← فحص الجودة الفنية المعملية QC</text>
        <text x="425" y="490" font-size="10" text-anchor="middle" fill="#1e3a8a">تحويل للمنتج التام + جدولة صيانة الآلات الوقائية وصرف قطع الغيار</text>

        <path d="M 425 540 L 425 575" stroke="#1d4ed8" stroke-width="3"/>

        <!-- Block 4: Procurement & Inventory & Warehouses -->
        <rect x="40" y="575" width="770" height="135" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
        <text x="425" y="605" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">📦 دورات المشتريات والموردين وإدارة المخازن والخامات</text>
        <text x="425" y="635" font-size="10" text-anchor="middle" fill="#1d4ed8">طلب الشراء PR ← طلب عروض أسعار RFQ ← أمر الشراء PO ← استلام المخزن والفحص الفني QC</text>
        <text x="425" y="660" font-size="10" text-anchor="middle" fill="#1d4ed8">مراقبة حد إعادة الطلب وتحديث الأرصدة المخزنية وتسجيل قيد المورد المحاسبي</text>

        <path d="M 425 710 L 425 745" stroke="#3b82f6" stroke-width="3"/>

        <!-- Block 5: HR 20 Workflows & Safes -->
        <rect x="40" y="745" width="770" height="145" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
        <text x="425" y="775" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">👔 منظومة الموارد البشرية والرواتب (20 دورة متكاملة) والخزائن المالية</text>
        <text x="425" y="805" font-size="10" text-anchor="middle" fill="#1e40af">التوظيف الذكي ATS ← المقابلة والملف ← الحضور والـ QR ← السلف التلقائية والطارئة ← الجزاءات والخصومات</text>
        <text x="425" y="830" font-size="10" text-anchor="middle" fill="#1e40af">المكافآت والإضافي ← الإجازات والأذونات ← القروض والأقساط ← زر الصرف الذكي (Pay) والتأمين والإخلاء</text>

        <path d="M 425 890 L 425 925" stroke="#2563eb" stroke-width="3"/>

        <!-- Block 6: Fleet & Logistics -->
        <rect x="40" y="925" width="770" height="110" rx="10" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
        <text x="425" y="955" font-weight="bold" font-size="13" text-anchor="middle" fill="#0f172a">🚚 أسطول السيارات والشاحنات وقراءة العداد (Odometer) ورحلات السائقين</text>
        <text x="425" y="980" font-size="10" text-anchor="middle" fill="#1e3a8a">قراءة العداد الفعلي قبل وبعد الرحلة + تصفية عهد الوقود والسولار ومستحقات السائق من الخزنة</text>

        <path d="M 425 1035 L 425 1070" stroke="#1d4ed8" stroke-width="3"/>

        <!-- Block 7: AI Mind & Master Database Core -->
        <rect x="40" y="1070" width="770" height="145" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="3.5"/>
        <text x="425" y="1105" font-weight="bold" font-size="14" text-anchor="middle" fill="#60a5fa">🤖 محرك الذكاء الاصطناعي والمركز الحاكم لقواعد البيانات (170 DATABASE TABLES HUB)</text>
        <text x="425" y="1135" font-size="10.5" text-anchor="middle" fill="#ffffff">شات بوت تفاعلي للموظفين + شاشة تنبؤية للرئيس التنفيذي للتنبيه بالأخطار والربط المالي والمخزني</text>
        <text x="425" y="1160" font-size="9.5" text-anchor="middle" fill="#93c5fd">🔒 Supabase Cloud Enterprise Infrastructure with Instant Backup & RLS Security Policies</text>
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
  console.log('=== Mega Master Non-Technical ERP PDF Generated Successfully! ===');
}

renderPdf().catch(err => {
  console.error('Error generating Non-Technical PDF:', err);
  process.exit(1);
});
