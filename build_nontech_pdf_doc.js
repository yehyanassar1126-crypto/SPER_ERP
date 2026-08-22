const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Starting Comprehensive Non-Technical ERP Manual Generator (Blue Edition v2) ===');

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

// 3. Generate HTML Content focused 100% on Non-Technical Explanation with BLUE Aesthetic Theme
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>الدليل التشغيلي الموحد والدورات الكاملة - NINJA SMART TECHNOLOGY FACTORY ERP</title>
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
      background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px;
      padding: 15px; margin: 18px 0; text-align: center; page-break-inside: avoid;
    }
    .diagram-svg { width: 100%; max-width: 780px; height: auto; margin: 0 auto; }
    
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
      <div class="cover-badge">الدليل التشغيلي التفصيلي — شامل 15 إدارة، 10 دورات HR، دورة المبيعات والمشتريات الكبرى، ورسومات SVG</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #eff6ff; font-size: 11pt; line-height: 1.8;">المؤلف والتوثيق الوظيفي الشامل الموجه لغير المبرمجين. يغطي جميع دورات العمل الحقيقية، رسمة SVG خاصة لكل إدارة، رسمة قاعدة البيانات الـ 163+ جدول، ورسمة النظام الكبرى الشاملة في النهاية.</p>
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

  <!-- CHAPTER 2: ALL 15 DEPARTMENTS WITH DETAILED WORKFLOWS & SVG DIAGRAMS -->
  <div class="page-break">
    <h2 class="chapter-title">🏬 الفصل الثاني: تفاصيل الإدارات الـ 15 والدورات التشغيلية والرسومات</h2>
    <p>فيما يلي تفصيل شامل لجميع الإدارات الـ 15، مع وضع دورات العمل (Workflows) الحقيقية التفصيلية لكل إدارة، ورسمة SVG مستقلة خاصة بكل قسم دون استثناء:</p>

    <!-- 1. SALES DIVISION -->
    <div class="section-title">2.1 إدارة المبيعات وإدارة العملاء (Sales & CRM Division)</div>
    <p><strong>الشرح التفصيلي:</strong> تُعد إدارة المبيعات المحرك الرئيسي لإيرادات المؤسسة. تبدأ الدورة من اللحظة الأولى لاستلام طلب العميل وتستمر عبر 8 مراحل دقيقة حتى يتسلم العميل شحنة المنتج النهائية وتصفية الحساب المالي.</p>
    
    <div class="workflow-card">
      <div class="workflow-title">🔄 الدورة الكبرى الكاملة للمبيعات (End-to-End Sales Cycle):</div>
      <div class="workflow-steps">
        <strong>1. استلام طلب العميل / RFQ:</strong> تسجيل بيانات العميل والمنتجات المطلوبة.<br>
        <strong>2. إعداد عرض السعر (Quotation):</strong> إصدار عرض سعر رسمي شامل خصم الكميات وحجز مبدئي للمخزون.<br>
        <strong>3. أمر المبيعات (Sales Order):</strong> اعتماد العميل وتحويل عرض السعر إلى أمر مبيعات مؤكد.<br>
        <strong>4. فحص المخزون والإنتاج:</strong> التحقق آلياً من توفر المنتج التام، أو تحويل الطلب فوراً إلى خط الإنتاج (BOM).<br>
        <strong>5. التحصيل المالي المبدئي:</strong> استلام الدفعة المقدمة في الخزنة وتأكيد رصيد الائتمان (Credit Limit).<br>
        <strong>6. إذن الشحن والتخصيص:</strong> إصدار إذن صرف البضاعة (Delivery Note) وتخصيص شاحنة من الأسطول.<br>
        <strong>7. الفاتورة الضريبية وقيد الإيراد:</strong> أصدار الفاتورة النهائية والترحيل المحاسبي التلقائي.<br>
        <strong>8. تسليم العميل والشحن (العميل يشيل المنتج):</strong> خروج الشاحنة وتسليم البضاعة واستلام العميل للإشعار النهائي.
      </div>
    </div>

    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة 1: دورة المبيعات الكبرى من طلب العميل حتى التسليم</div>
      <svg class="diagram-svg" viewBox="0 0 760 160" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="40" width="130" height="75" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="80" y="70" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">1. طلب العميل</text>
        <text x="80" y="88" font-size="8.5" text-anchor="middle">طلب واستفسار</text>

        <path d="M 145 77 L 165 77" stroke="#3b82f6" stroke-width="2"/>

        <rect x="165" y="40" width="135" height="75" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="232" y="70" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">2. عرض السعر والأمر</text>
        <text x="232" y="88" font-size="8.5" text-anchor="middle">Quotation & Sales Order</text>

        <path d="M 300 77 L 320 77" stroke="#2563eb" stroke-width="2"/>

        <rect x="320" y="40" width="135" height="75" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="387" y="70" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">3. فحص المخزن / BOM</text>
        <text x="387" y="88" font-size="8.5" text-anchor="middle">تأكيد توفر المنتجات</text>

        <path d="M 455 77 L 475 77" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="475" y="40" width="135" height="75" rx="6" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2"/>
        <text x="542" y="70" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">4. التحصيل والشحن</text>
        <text x="542" y="88" font-size="8.5" text-anchor="middle">تغذية الخزنة + الأسطول</text>

        <path d="M 610 77 L 630 77" stroke="#1e3a8a" stroke-width="2"/>

        <rect x="630" y="40" width="115" height="75" rx="6" fill="#1e3a8a" stroke="#2563eb" stroke-width="2"/>
        <text x="687" y="70" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#ffffff">5. تسليم العميل</text>
        <text x="687" y="88" font-size="8.5" text-anchor="middle" fill="#93c5fd">العميل يشيل المنتج</text>
      </svg>
    </div>

    <!-- 2. PROCUREMENT DIVISION -->
    <div class="section-title">2.2 إدارة المشتريات والموردين (Procurement & Vendor Management)</div>
    <p><strong>الشرح والتفصيل:</strong> تُعنى بتأمين كافة الاحتياجات من المواد الخام وقطع الغيار بأفضل الأسعار وأعلى جودة عبر 5 دورات متخصصة.</p>

    <div class="workflow-card">
      <div class="workflow-title">🔄 دورات المشتريات الـ 5 المعتمدة:</div>
      <div class="workflow-steps">
        <strong>1. طلب الاحتياج والشراء (PR):</strong> إشعار آلي من مخزن الخامات عند الوصول لحد إعادة الطلب.<br>
        <strong>2. طلب عروض الأسعار (RFQ):</strong> إرسال طلبات عروض أسعار للموردين المعتمدين والمفاضلة بينهم.<br>
        <strong>3. إصدار أمر الشراء (PO):</strong> اعتماد أفضل عرض سعر وإصدار أمر شراء رسمي للمورد.<br>
        <strong>4. الاستلام وفحص الجودة (QC Receipt):</strong> استلام الخامات بمخزن المصنع وفحص المطابقة الفنية.<br>
        <strong>5. سداد مستحقات المورد:</strong> إذن صرف مالي من الخزنة/البنك وتسجيل قيد المورد المحاسبي.
      </div>
    </div>

    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة 2: دورة المشتريات واستلام الخامات</div>
      <svg class="diagram-svg" viewBox="0 0 750 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="150" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="95" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">طلب الاحتياج (PR)</text>
        <text x="95" y="78" font-size="8.5" text-anchor="middle">من المهندس / المخزن</text>

        <path d="M 170 65 L 210 65" stroke="#3b82f6" stroke-width="2"/>

        <rect x="210" y="30" width="160" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="290" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">أمر الشراء (PO)</text>
        <text x="290" y="78" font-size="8.5" text-anchor="middle">المفاضلة واعتماد المورد</text>

        <path d="M 370 65 L 410 65" stroke="#2563eb" stroke-width="2"/>

        <rect x="410" y="30" width="150" height="70" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="485" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">استلام المخزن و الجودة</text>
        <text x="485" y="78" font-size="8.5" text-anchor="middle">إذن إضافة خامات</text>

        <path d="M 560 65 L 600 65" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="600" y="30" width="130" height="70" rx="6" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2"/>
        <text x="665" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">سداد المورد</text>
        <text x="665" y="78" font-size="8.5" text-anchor="middle">خصم الخزنة + القيد</text>
      </svg>
    </div>

    <!-- 3. HR DIVISION (10 WORKFLOWS) -->
    <div class="section-title">2.3 إدارة الموارد البشرية والرواتب (HR Division — 10 Full Workflows)</div>
    <p><strong>الشرح والتفصيل:</strong> تشمل إدارة الموارد البشرية 10 دورات تشغيلية كاملة تغطي كافة معاملة الموظف والعامل بالمصنع من اليوم الأول حتى إنهاء الخدمة:</p>

    <div class="workflow-card">
      <div class="workflow-title">🔄 دورات الـ HR الـ 10 التفصيلية بالكامل:</div>
      <div class="workflow-steps">
        <strong>1. التوظيف والفرز الذكي (ATS):</strong> رفع السيرة الذاتية (PDF)، تحليل الذكاء الاصطناعي، واستخراج نسبة المطابقة.<br>
        <strong>2. التعاقد والبيانات الأساسية:</strong> تسجيل الرقم القومي، العقد، البنك، التأمينات الاجتماعية، والراتب الأساسي.<br>
        <strong>3. الحضور والـ QR Code:</strong> تسجيل البصمة اليومية بالـ QR وتحديد التأخيرات ومقارنتها بنظام الوردية.<br>
        <strong>4. السلف التلقائية المعتمدة على الحضور:</strong> احتساب سلف العمالة الأسبوعية آلياً بحسب أيام الحضور المعتمدة.<br>
        <strong>5. الجزاءات والخصومات التلقائية:</strong> تطبيق لائحة الخصم الآلي عند التأخير أو الغياب بدون إذن رسمياً.<br>
        <strong>6. المكافآت وساعات الإضافي (Overtime):</strong> احتساب ساعات العمل الإضافية وحوافز الإنتاج وإضافتها للراتب.<br>
        <strong>7. الإجازات والأذونات الرسمية:</strong> تقديم طلب إجازة (سنوية/مرضية) واعتماد مدير القسم وتحديث الرصيد.<br>
        <strong>8. القروض والأقساط الشهرية:</strong> طلب قروض طويلة الأجل وجدولة الخصم الشهري من دفتر الرواتب آلياً.<br>
        <strong>9. مسرد الرواتب وصرف النقدية (Pay Execution):</strong> حساب صافي الراتب وصرفه بنقرة زر من الخزنة المحددة.<br>
        <strong>10. إنهاء الخدمة والإخلاء (Offboarding):</strong> تصفية مستحقات الموظف، إخلاء الطرف، وتجميد الحساب بالنظام.
      </div>
    </div>

    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة 3: منظومة الموارد البشرية والرواتب والسلف</div>
      <svg class="diagram-svg" viewBox="0 0 750 140" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="130" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="85" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">الملف والعقد</text>
        <text x="85" y="78" font-size="8.5" text-anchor="middle">بيانات الموظف والراتب</text>

        <path d="M 150 65 L 190 65" stroke="#3b82f6" stroke-width="2"/>

        <rect x="190" y="30" width="140" height="70" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="260" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#1e3a8a">الحضور والـ QR</text>
        <text x="260" y="78" font-size="8.5" text-anchor="middle">سلف آلي + جزاءات</text>

        <path d="M 330 65 L 370 65" stroke="#2563eb" stroke-width="2"/>

        <rect x="370" y="30" width="150" height="70" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="445" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">الإجازات والقروض</text>
        <text x="445" y="78" font-size="8.5" text-anchor="middle">جدولة الخصم الشهري</text>

        <path d="M 520 65 L 560 65" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="560" y="30" width="170" height="70" rx="6" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2"/>
        <text x="645" y="60" font-weight="bold" font-size="10.5" text-anchor="middle" fill="#0f172a">زر الصرف الذكي (Pay)</text>
        <text x="645" y="78" font-size="8.5" text-anchor="middle">تأثير الخزنة + القيد الآلي</text>
      </svg>
    </div>

    <!-- 4. ATTENDANCE SCANNER -->
    <div class="section-title">2.4 إدارة الحضور والبصمة الذكية (Attendance & QR Scanner)</div>
    <p><strong>الدورة التشغيلية:</strong> مسح كود QR عبر الموبايل ← تسجيل وقت الدخول والخروج ← مطابقة الوردية ← ترحيل دقائق التأخير والغياب لدفتر الرواتب.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 4: دورة الحضور والـ QR Code</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">مسح QR Code الميداني</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">مطابقة الوقت بالوردية</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">تحديث كشف الحضور والجزاءات</text>
      </svg>
    </div>

    <!-- 5. ATS RECRUITMENT -->
    <div class="section-title">2.5 إدارة التوظيف والفرز الذكي (ATS Recruitment Division)</div>
    <p><strong>الدورة التشغيلية:</strong> استلام السيرة الذاتية (PDF) ← تحليل الذكاء الاصطناعي ← حساب درجة التوافق الوظيفي ← تحديد المقابلة والتعيين.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 5: دورة التوظيف الذكي ATS</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">رفع ملف الـ CV (PDF)</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">استخراج وتفريغ المهارات بالذكاء</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">ترتيب المتقدمين والدعوة للمقابلة</text>
      </svg>
    </div>

    <!-- 6. ACCOUNTING -->
    <div class="section-title">2.6 الإدارة المالية والعدّة المحاسبية (General Ledger & Accounting)</div>
    <p><strong>الدورة التشغيلية:</strong> استلام المعاملة المالية ← توليد القيد اليومي التلقائي ← التحديث المستمر لدليل الحسابات ← استخراج ميزان المراجعة والقوائم المالية.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 6: دورة القيود اليومية والدفتر العام</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">معاملة مالية (صرف/قبض)</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">إنشاء قيد محاسبي تلقائي</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">ترحيل لميزان المراجعة والميزانية</text>
      </svg>
    </div>

    <!-- 7. TREASURY -->
    <div class="section-title">2.7 إدارة الخزائن والبنوك (Treasury & Cash Control)</div>
    <p><strong>الدورة التشغيلية:</strong> اختيار الخزنة المصدر/الهدف ← التحقق من كفاية السيولة ← تحويل النقدية أو صرف الإذن ← تحديث رصيد الخزنة لحظياً.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 7: دورة الخزينة والسيولة النقدية</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">طلب صرف أو إذن قبض</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">فحص رصيد الخزينة والحظر</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">تحديث الرصيد الفعلي وطباعة الإيصال</text>
      </svg>
    </div>

    <!-- 8. COST CENTERS -->
    <div class="section-title">2.8 إدارة مراكز التكلفة (Cost Centers Division)</div>
    <p><strong>الدورة التشغيلية:</strong> ربط المصروف/الراتب بكود مركز التكلفة ← توجيه التكلفة للمشروع أو خط الإنتاج ← تحليل الربحية الفعلية لكل قسم.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 8: دورة توجيه التكاليف للمشاريع</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">مصروف خامات أو رواتب</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">ربط كود مركز التكلفة</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">استخراج تقرير ربحية المركز</text>
      </svg>
    </div>

    <!-- 9. INVENTORY -->
    <div class="section-title">2.9 إدارة المخازن ورصيد الخامات (Inventory Control)</div>
    <p><strong>الدورة التشغيلية:</strong> استلام المواد الخام ← إذن إضافة مخزني ← مراقبة حد إعادة الطلب ← إذن صرف لخط الإنتاج وتحديث الكميات المتاحة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 9: دورة الرصيد المخزني</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">إذن إضافة أو صرف مادة</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">تحديث الكميات المتاحة آلياً</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">التنبيه عند وصول الحد الأدنى</text>
      </svg>
    </div>

    <!-- 10. MANUFACTURING & BOM -->
    <div class="section-title">2.10 إدارة خطوط الإنتاج والـ BOM (Manufacturing & Production BOM)</div>
    <p><strong>الدورة التشغيلية:</strong> إصدار أمر الإنتاج ← قراءة معايير BOM ← الخصم الآلي لخامات البلاستيك/السولار ← تحويل المنتج التام للمخازن.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 10: دورة أمر الإنتاج والـ BOM</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">إنشاء أمر إنتاج جديد</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">خصم الخامات بحسب BOM</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">إضافة المنتج التام لمخزن البيع</text>
      </svg>
    </div>

    <!-- 11. QUALITY CONTROL -->
    <div class="section-title">2.11 إدارة ضبط الجودة والفحص الفني (Quality Control Inspection)</div>
    <p><strong>الدورة التشغيلية:</strong> سحب عينة تشغيلية ← إجراء الفحص الفني والقياسات ← تحديد نسبة العيوب ← اعتماد الشحنة للبيع أو إعادة التدوير.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 11: دورة الفرز واختبارات الجودة</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">سحب عينات من خط الإنتاج</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">الفحص والمعايرة الفنية</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">اعتماد الإذن أو استبعاد العيوب</text>
      </svg>
    </div>

    <!-- 12. MAINTENANCE -->
    <div class="section-title">2.12 إدارة الصيانة الوقائية والقطع الغيار (Equipment Maintenance)</div>
    <p><strong>الدورة التشغيلية:</strong> تتبع ساعات تشغيل الماكينة ← جدولة الصيانة الدوري ← إصدار إذن صرف قطع غيار ← إغلاق بلاغ الصيانة وتوجيه التكلفة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 12: دورة صيانة الآلات بالمصنع</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">بلاغ عطل أو جدول صيانة</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">صرف قطع غيار الماكينة</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">إصلاح الماكينة وتوثيق التكلفة</text>
      </svg>
    </div>

    <!-- 13. FLEET MANAGEMENT -->
    <div class="section-title">2.13 إدارة أسطول السيارات والشاحنات (Fleet Management & Odometer)</div>
    <p><strong>الدورة التشغيلية:</strong> قراءة العداد الحالي (Odometer) ← تسليم عهدة الوقود ← تتبع الرحلة الميدانية ← حساب مسافة الكيلومترات ومعدل استهلاك السولار.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 13: دورة العداد والأسطول</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">تسجيل قراءة عداد السيارة</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">تخصيص كمية السولار</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">مقارنة المسافة بالاستهلاك الفعلي</text>
      </svg>
    </div>

    <!-- 14. DRIVERS LOGISTICS -->
    <div class="section-title">2.14 إدارة رحلات الفنيين والسائقين (Freight Logistics & Drivers)</div>
    <p><strong>الدورة التشغيلية:</strong> تكليف السائق بالشحنة ← فتح أمر رحلة نقل ← تسليم الإشعار للعميل ← تصفية مصاريف الطرق ومستحقات السائق من الخزنة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 14: دورة رحلات نقل السائقين</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">تكليف أمر الرحلة للسائق</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">تسليم البضاعة في موقع العميل</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">تصفية مستحقات السائق من الخزنة</text>
      </svg>
    </div>

    <!-- 15. AI SUITE -->
    <div class="section-title">2.15 منظومة الذكاء الاصطناعي والقيادة التنفيذية (AI Mind, Chatbot & CEO Dashboard)</div>
    <p><strong>الدورة التشغيلية:</strong> توجيه سؤال باللغة العربية لشات بوت الموظفين ← معالجة الاستفسار بحسب الصلاحيات المسموحة ← تحليل البيانات التنبؤية بالكامل وإرسال التنبيهات لرئيس مجلس الإدارة.</p>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:6px;">رسمة توضيحية مستقلة 15: منظومة الذكاء الاصطناعي والـ CEO</div>
      <svg class="diagram-svg" viewBox="0 0 700 110" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="20" width="180" height="65" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="120" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">سؤال الموظف للشات بوت</text>

        <path d="M 210 52 L 260 52" stroke="#3b82f6" stroke-width="2"/>

        <rect x="260" y="20" width="180" height="65" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="350" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#1e3a8a">معالجة البيانات بحسب الصلاحية</text>

        <path d="M 440 52 L 490 52" stroke="#2563eb" stroke-width="2"/>

        <rect x="490" y="20" width="180" height="65" rx="6" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="580" y="50" font-weight="bold" font-size="10" text-anchor="middle" fill="#0f172a">تنبيهات تنبؤية للرئيس التنفيذي</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 3: DATABASE TABLES (NON-TABULAR FORMAT + DEDICATED DATABASE SVG DIAGRAM) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الثالث: توثيق وسكيما قاعدة البيانات (${tableKeys.length} جدولاً بالكامل)</h2>
    
    <div class="section-title">3.1 رسمة وسكيما قاعدة البيانات المجمعة (163+ Tables Schema SVG)</div>
    <div class="diagram-box">
      <div style="font-weight:bold; color:#1e3a8a; margin-bottom:8px;">رسمة توضيحية مستقلة: هيكل وقاعدة البيانات الـ 163+ جدول (Database Schema Diagram)</div>
      <svg class="diagram-svg" viewBox="0 0 780 320" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="760" height="300" rx="10" fill="#ffffff" stroke="#1d4ed8" stroke-width="2"/>
        
        <rect x="30" y="30" width="220" height="110" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">مجموعة المستخدمين والأمان</text>
        <text x="140" y="75" font-size="8.5" text-anchor="middle">users, screen_permissions</text>
        <text x="140" y="92" font-size="8.5" text-anchor="middle">user_sessions, audit_logs</text>

        <rect x="280" y="30" width="220" height="110" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="390" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">مجموعة الموارد البشرية</text>
        <text x="390" y="75" font-size="8.5" text-anchor="middle">attendance, payroll, loans</text>
        <text x="390" y="92" font-size="8.5" text-anchor="middle">leave_requests, ats_apps</text>

        <rect x="530" y="30" width="220" height="110" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="640" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">مجموعة المالية والحسابات</text>
        <text x="640" y="75" font-size="8.5" text-anchor="middle">safes, journal_entries</text>
        <text x="640" y="92" font-size="8.5" text-anchor="middle">cost_centers, checks, taxes</text>

        <path d="M 250 85 L 280 85" stroke="#2563eb" stroke-width="2"/>
        <path d="M 500 85 L 530 85" stroke="#1d4ed8" stroke-width="2"/>

        <rect x="30" y="170" width="220" height="110" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="140" y="195" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">مجموعة المشتريات والمخازن</text>
        <text x="140" y="215" font-size="8.5" text-anchor="middle">suppliers, inventory_items</text>
        <text x="140" y="232" font-size="8.5" text-anchor="middle">stock_movements, purchase_orders</text>

        <rect x="280" y="170" width="220" height="110" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="390" y="195" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">مجموعة الإنتاج والمبيعات</text>
        <text x="390" y="215" font-size="8.5" text-anchor="middle">bom, production_orders</text>
        <text x="390" y="232" font-size="8.5" text-anchor="middle">sales_orders, qc_inspections</text>

        <rect x="530" y="170" width="220" height="110" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="640" y="195" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">مجموعة الأسطول والسيارات</text>
        <text x="640" y="215" font-size="8.5" text-anchor="middle">fleet_vehicles, fleet_trips</text>
        <text x="640" y="232" font-size="8.5" text-anchor="middle">spare_parts, maintenance_logs</text>

        <path d="M 140 140 L 140 170" stroke="#3b82f6" stroke-width="2"/>
        <path d="M 390 140 L 390 170" stroke="#2563eb" stroke-width="2"/>
        <path d="M 640 140 L 640 170" stroke="#1d4ed8" stroke-width="2"/>
      </svg>
    </div>

    <div class="section-title">3.2 كشف وشرح جداول قاعدة البيانات (اسم الجدول وتحته شرحه المباشر)</div>
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
    </div>
  </div>

  <!-- CHAPTER 5: GIANT MASTER FULL SYSTEM SVG MAP -->
  <div class="page-break">
    <h2 class="chapter-title">👑 الفصل الخامس: الخريطة الشاملة العملاقة للربط التكاملي الموحد للنظام (Master System Architecture Map)</h2>
    <p>توضح هذه الخريطة الشاملة العملاقة الربط المباشر بين الـ 15 إدارة، دورات المبيعات الكبرى، المشتريات، الـ HR بـ 10 دوراته، الخزائن المالية، الأسطول، محرك الذكاء الاصطناعي وقاعدة البيانات 163+ جدول:</p>

    <div class="diagram-box" style="padding:20px; background:#ffffff; border:3.5px solid #1d4ed8;">
      <svg class="diagram-svg" viewBox="0 0 850 780" xmlns="http://www.w3.org/2000/svg">
        <!-- Master Border -->
        <rect x="10" y="10" width="830" height="760" rx="14" fill="#f8fafc" stroke="#1e3a8a" stroke-width="3.5"/>
        
        <!-- Header Banner -->
        <rect x="30" y="25" width="790" height="50" rx="8" fill="#1e3a8a"/>
        <text x="425" y="56" font-weight="bold" font-size="15" text-anchor="middle" fill="#ffffff">NINJA SMART TECHNOLOGY FACTORY — GIANT MASTER SYSTEM MAP</text>

        <!-- Layer 1: Users & RBAC -->
        <rect x="40" y="95" width="230" height="100" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="155" y="125" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">👥 المستعملين والصلاحيات (RBAC)</text>
        <text x="155" y="148" font-size="9" text-anchor="middle" fill="#1d4ed8">Owner, HR, Finance, QC, Driver</text>
        <text x="155" y="168" font-size="8.5" text-anchor="middle" fill="#475569">حماية الشاشات والأزرار RLS</text>

        <!-- Layer 1: HR 10 Workflows -->
        <rect x="310" y="95" width="230" height="100" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="125" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">👔 الموارد البشرية (10 دورات)</text>
        <text x="425" y="148" font-size="9" text-anchor="middle" fill="#1e40af">بصمة QR، سلف عمالة، جزاءات</text>
        <text x="425" y="168" font-size="8.5" text-anchor="middle" fill="#475569">زر الصرف الذكي (Pay) للخزينة</text>

        <!-- Layer 1: Finance & Cash Safes -->
        <rect x="580" y="95" width="230" height="100" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="695" y="125" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">💰 المالية والخزائن والبنوك</text>
        <text x="695" y="148" font-size="9" text-anchor="middle" fill="#1e3a8a">خزائن نقدية، مراكز تكلفة</text>
        <text x="695" y="168" font-size="8.5" text-anchor="middle" fill="#475569">قيود يومية وميزان المراجعة</text>

        <!-- Connecting Lines 1 -> 2 -->
        <path d="M 155 195 L 155 240" stroke="#3b82f6" stroke-width="2"/>
        <path d="M 425 195 L 425 240" stroke="#2563eb" stroke-width="2"/>
        <path d="M 695 195 L 695 240" stroke="#1d4ed8" stroke-width="2"/>

        <!-- Layer 2: Sales End to End -->
        <rect x="40" y="240" width="230" height="110" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="155" y="270" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">📈 دورة المبيعات الكبرى</text>
        <text x="155" y="293" font-size="9" text-anchor="middle" fill="#1d4ed8">عرض سعر ← طلب مبيعات</text>
        <text x="155" y="313" font-size="8.5" text-anchor="middle" fill="#475569">تحصيل الدفعة + الشحن والتسليم</text>

        <!-- Layer 2: Manufacturing & BOM -->
        <rect x="310" y="240" width="230" height="110" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="270" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">⚙️ التصنيع والجودة (BOM)</text>
        <text x="425" y="293" font-size="9" text-anchor="middle" fill="#1e40af">خصم خامات آلي + فحص QC</text>
        <text x="425" y="313" font-size="8.5" text-anchor="middle" fill="#475569">صيانة الآلات وقطع الغيار</text>

        <!-- Layer 2: Procurement & SCM -->
        <rect x="580" y="240" width="230" height="110" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
        <text x="695" y="270" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">📦 المشتريات والمخازن</text>
        <text x="695" y="293" font-size="9" text-anchor="middle" fill="#1e3a8a">موردين، أذون إضافة وصرف</text>
        <text x="695" y="313" font-size="8.5" text-anchor="middle" fill="#475569">حد إعادة الطلب والرصيد الآلي</text>

        <!-- Connecting Lines 2 -> 3 -->
        <path d="M 155 350 L 155 395" stroke="#3b82f6" stroke-width="2"/>
        <path d="M 425 350 L 425 395" stroke="#2563eb" stroke-width="2"/>
        <path d="M 695 350 L 695 395" stroke="#1d4ed8" stroke-width="2"/>

        <!-- Layer 3: Fleet, Drivers & Logistics -->
        <rect x="100" y="395" width="650" height="95" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="425" font-weight="bold" font-size="12" text-anchor="middle" fill="#1e3a8a">🚚 أسطول الشاحنات وقراءة العداد (Odometer) ورحلات السائقين</text>
        <text x="425" y="448" font-size="9.5" text-anchor="middle" fill="#1d4ed8">تخصيص السولار + تسليم الشحنات للعميل + تصفية مستحقات السائق من الخزنة</text>

        <!-- Connecting Lines 3 -> 4 -->
        <path d="M 425 490 L 425 530" stroke="#1d4ed8" stroke-width="2.5"/>

        <!-- Layer 4: AI Mind & CEO Suite -->
        <rect x="60" y="530" width="730" height="90" rx="8" fill="#1e3a8a" stroke="#2563eb" stroke-width="2"/>
        <text x="425" y="562" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🤖 منظومة الذكاء الاصطناعي التفاعلية وشاشة رئيس مجلس الإدارة (AI Mind & CEO)</text>
        <text x="425" y="585" font-size="10" text-anchor="middle" fill="#bfdbfe">تحليل السير الذاتية ATS + شات بوت الموظفين + تنبيهات تنبؤية بنقص المواد والخزائن</text>

        <!-- Layer 5: Master DB Core at Bottom -->
        <rect x="40" y="640" width="770" height="105" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="3"/>
        <text x="425" y="673" font-weight="bold" font-size="14" text-anchor="middle" fill="#60a5fa">🗄️ المركز الحاكم لقواعد البيانات (163+ DATABASE TABLES HUB)</text>
        <text x="425" y="698" font-size="10" text-anchor="middle" fill="#ffffff">ربط وحفظ وتحديث جميع المعاملات المالية، المخزنية، الإنتاجية، واللوجستية في بيئة سحابية آمنة 100%</text>
        <text x="425" y="722" font-size="9" text-anchor="middle" fill="#93c5fd">🔒 Supabase Cloud Infrastructure with Instant Backup & RLS Security Policies</text>
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
