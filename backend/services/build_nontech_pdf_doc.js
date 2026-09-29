const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const getPart1 = require('./doc_parts/part1_setup');

console.log('=== Starting Master ERP Manual Generator (Blue Edition v5) ===');

// 1. Parse Database Schema to extract all tables
function parseDatabaseSchema() {
  const sqlFiles = [
    '../models/supabase_schema.sql',
    '../models/setup_erp_v2.sql',
    '../models/setup_accounting.sql',
    '../models/setup_fleet_module.sql',
    '../models/setup_logistics.sql',
    '../models/setup_spare_parts.sql',
    '../models/setup_engineering.sql',
    '../models/setup_hr_absence.sql',
    '../models/setup_attendance_v2.sql',
    '../models/SUPABASE_COPY_PASTE.sql',
    '../models/SUPABASE_PART5_ONLY.sql',
    '../models/driver_system_upgrade.sql',
    '../models/fleet_odometer_setup.sql',
    '../models/001_enterprise_security.sql',
    '../models/002_enterprise_multi.sql',
    '../models/003_enterprise_features.sql',
    '../models/004_enterprise_kpis_views.sql',
    '../models/005_enterprise_extra.sql',
    '../models/006_public_product_catalog.sql',
    '../models/007_client_auth.sql',
    '../models/007_premium_ats.sql',
    '../models/008_manufacturing_equipment.sql',
    '../models/009_password_encryption.sql',
    '../models/010_bilingual_chat.sql',
    '../models/011_screen_permissions.sql',
    '../models/ai_erp_migration.sql',
    '../models/setup_finance_enterprise.sql'
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

// Get Parts
const { CSS, deptHTML, dbHTML } = getPart1(logoDataUri, tableKeys, dbSchema);

// Giant Master SVG Diagram
const giantMasterSVG = `
<div class="diagram-box" style="padding:22px; background:#ffffff; border:4px solid #1d4ed8;">
  <div style="font-weight:bold; color:#1e3a8a; font-size:13pt; margin-bottom:12px;">الرسمة العملاقة الجامعة للنظام بالكامل (MEGA MASTER SYSTEM MAP)</div>
  <svg class="diagram-svg" viewBox="0 0 850 1250" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="830" height="1230" rx="16" fill="#f8fafc" stroke="#1e3a8a" stroke-width="4"/>
    <rect x="30" y="25" width="790" height="55" rx="8" fill="#1e3a8a"/>
    <text x="425" y="60" font-weight="bold" font-size="16" text-anchor="middle" fill="#ffffff">NINJA SMART TECHNOLOGY FACTORY — MEGA MASTER SYSTEM MAP</text>

    <!-- Block 1 -->
    <rect x="40" y="100" width="770" height="100" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
    <text x="425" y="130" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">🔐 بوابات الأمان والحسابات والمستخدمين (RBAC & Screen Security)</text>
    <text x="425" y="155" font-size="10" text-anchor="middle" fill="#1d4ed8">Owner, Admin, HR Manager, Finance Officer, Production Engineer, Driver, Client Portal</text>
    <text x="425" y="175" font-size="9" text-anchor="middle" fill="#475569">حظر الشاشات وحماية الأزرار والنسخ الاحتياطي التلقائي</text>
    <path d="M 425 200 L 425 235" stroke="#3b82f6" stroke-width="3"/>

    <!-- Block 2 -->
    <rect x="40" y="235" width="770" height="135" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
    <text x="425" y="265" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">📈 دورة المبيعات الكبرى كاملة ودورة المرتجعات (Sales & Customer Delivery Lifecycle)</text>
    <text x="425" y="295" font-size="10" text-anchor="middle" fill="#1e40af">طلب العميل (RFQ) ← عرض سعر Quotation ← أمر مبيعات Sales Order ← فحص المخزون والإنتاج BOM</text>
    <text x="425" y="320" font-size="10" text-anchor="middle" fill="#1e40af">تحصيل الدفعة بالخزنة ← إذن الشحن Delivery Note ← الفاتورة الضريبية والقيد ← تحميل الشاحنة وتسليم البضاعة (العميل يشيل المنتج)</text>
    <path d="M 425 370 L 425 405" stroke="#2563eb" stroke-width="3"/>

    <!-- Block 3 -->
    <rect x="40" y="405" width="770" height="135" rx="10" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
    <text x="425" y="435" font-weight="bold" font-size="13" text-anchor="middle" fill="#0f172a">⚙️ إدارة خطوط الإنتاج والخصم المخزني الآلي والجودة والصيانة</text>
    <text x="425" y="465" font-size="10" text-anchor="middle" fill="#1e3a8a">أمر الإنتاج ← خصم الخامات المباشر بحسب قائمة BOM ← فحص الجودة الفنية المعملية QC</text>
    <text x="425" y="490" font-size="10" text-anchor="middle" fill="#1e3a8a">تحويل للمنتج التام + جدولة صيانة الآلات الوقائية وصرف قطع الغيار</text>
    <path d="M 425 540 L 425 575" stroke="#1d4ed8" stroke-width="3"/>

    <!-- Block 4 -->
    <rect x="40" y="575" width="770" height="135" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5"/>
    <text x="425" y="605" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">📦 دورات المشتريات والموردين وإدارة المخازن والخامات</text>
    <text x="425" y="635" font-size="10" text-anchor="middle" fill="#1d4ed8">طلب الشراء PR ← طلب عروض أسعار RFQ ← أمر الشراء PO ← استلام المخزن والفحص الفني QC</text>
    <text x="425" y="660" font-size="10" text-anchor="middle" fill="#1d4ed8">مراقبة حد إعادة الطلب وتحديث الأرصدة المخزنية وتسجيل قيد المورد المحاسبي</text>
    <path d="M 425 710 L 425 745" stroke="#3b82f6" stroke-width="3"/>

    <!-- Block 5 -->
    <rect x="40" y="745" width="770" height="145" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2.5"/>
    <text x="425" y="775" font-weight="bold" font-size="13" text-anchor="middle" fill="#1e3a8a">👔 منظومة الموارد البشرية والرواتب (20 دورة متكاملة) والخزائن المالية</text>
    <text x="425" y="805" font-size="10" text-anchor="middle" fill="#1e40af">التوظيف الذكي ATS ← المقابلة والملف ← الحضور والـ QR ← السلف التلقائية والطارئة ← الجزاءات والخصومات</text>
    <text x="425" y="830" font-size="10" text-anchor="middle" fill="#1e40af">المكافآت والإضافي ← الإجازات والأذونات ← القروض والأقساط ← زر الصرف الذكي (Pay) والتأمين والإخلاء</text>
    <path d="M 425 890 L 425 925" stroke="#2563eb" stroke-width="3"/>

    <!-- Block 6 -->
    <rect x="40" y="925" width="770" height="110" rx="10" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2.5"/>
    <text x="425" y="955" font-weight="bold" font-size="13" text-anchor="middle" fill="#0f172a">🚚 أسطول السيارات والشاحنات وقراءة العداد (Odometer) ورحلات السائقين</text>
    <text x="425" y="980" font-size="10" text-anchor="middle" fill="#1e3a8a">قراءة العداد الفعلي قبل وبعد الرحلة + تصفية عهد الوقود والسولار ومستحقات السائق من الخزنة</text>
    <path d="M 425 1035 L 425 1070" stroke="#1d4ed8" stroke-width="3"/>

    <!-- Block 7 -->
    <rect x="40" y="1070" width="770" height="145" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="3.5"/>
    <text x="425" y="1105" font-weight="bold" font-size="14" text-anchor="middle" fill="#60a5fa">🤖 محرك الذكاء الاصطناعي والمركز الحاكم لقواعد البيانات (170 DATABASE TABLES HUB)</text>
    <text x="425" y="1135" font-size="10.5" text-anchor="middle" fill="#ffffff">شات بوت تفاعلي للموظفين + شاشة تنبؤية للرئيس التنفيذي للتنبيه بالأخطار والربط المالي والمخزني</text>
    <text x="425" y="1160" font-size="9.5" text-anchor="middle" fill="#93c5fd">🔒 Supabase Cloud Enterprise Infrastructure with Instant Backup & RLS Security Policies</text>
  </svg>
</div>
`;

// Database Schema SVG Diagram
const dbSchemaSVG = `
<div class="diagram-box">
  <div style="font-weight:bold; color:#1e3a8a; font-size:12.5pt; margin-bottom:12px;">رسمة سكيما قاعدة البيانات الشاملة (170 TABLES DATABASE ARCHITECTURE MAP)</div>
  <svg class="diagram-svg" viewBox="0 0 820 480" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="800" height="460" rx="10" fill="#ffffff" stroke="#1d4ed8" stroke-width="3"/>
    
    <rect x="30" y="30" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="140" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">1. الحسابات والأمان (22 جدول)</text>
    <text x="140" y="75" font-size="8.5" text-anchor="middle">users, screen_permissions</text>
    <text x="140" y="92" font-size="8.5" text-anchor="middle">user_sessions, audit_logs</text>

    <rect x="290" y="30" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text x="405" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">2. HR والحضور (25 جدول)</text>
    <text x="405" y="75" font-size="8.5" text-anchor="middle">attendance, leave_requests</text>
    <text x="405" y="92" font-size="8.5" text-anchor="middle">shifts, hr_absence, ats_apps</text>

    <rect x="550" y="30" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
    <text x="660" y="55" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">3. الرواتب والسلف (18 جدول)</text>
    <text x="660" y="75" font-size="8.5" text-anchor="middle">payroll, worker_advances</text>
    <text x="660" y="92" font-size="8.5" text-anchor="middle">loans, bonus_penalties</text>

    <rect x="30" y="175" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="140" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">4. المالية والحسابات (24 جدول)</text>
    <text x="140" y="220" font-size="8.5" text-anchor="middle">chart_of_accounts, journal_entries</text>
    <text x="140" y="237" font-size="8.5" text-anchor="middle">cost_centers, taxes_ledger</text>

    <rect x="290" y="175" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text x="405" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">5. الخزائن والبنوك (16 جدول)</text>
    <text x="405" y="220" font-size="8.5" text-anchor="middle">finance_safes, bank_accounts</text>
    <text x="405" y="237" font-size="8.5" text-anchor="middle">cash_transfers, bank_checks</text>

    <rect x="550" y="175" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
    <text x="660" y="200" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">6. المشتريات والموردين (20 جدول)</text>
    <text x="660" y="220" font-size="8.5" text-anchor="middle">suppliers, purchase_orders</text>
    <text x="660" y="237" font-size="8.5" text-anchor="middle">supplier_invoices, rfqs</text>

    <rect x="30" y="320" width="220" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="140" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">7. المخازن والخامات (17 جدول)</text>
    <text x="140" y="365" font-size="8.5" text-anchor="middle">inventory_items, stock_movements</text>
    <text x="140" y="382" font-size="8.5" text-anchor="middle">warehouses, stock_adjustments</text>

    <rect x="290" y="320" width="230" height="120" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
    <text x="405" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#1e3a8a">8. الإنتاج والجودة (16 جدول)</text>
    <text x="405" y="365" font-size="8.5" text-anchor="middle">bom, production_orders</text>
    <text x="405" y="382" font-size="8.5" text-anchor="middle">qc_inspections, machines</text>

    <rect x="550" y="320" width="220" height="120" rx="8" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="2"/>
    <text x="660" y="345" font-weight="bold" font-size="11" text-anchor="middle" fill="#0f172a">9&10. الأسطول والذاتية (14 جدول)</text>
    <text x="660" y="365" font-size="8.5" text-anchor="middle">fleet_vehicles, fleet_trips</text>
    <text x="660" y="382" font-size="8.5" text-anchor="middle">spare_parts, ai_prompts</text>
  </svg>
</div>
`;

// Build Master HTML
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>الدليل التشغيلي الموحد والدورات الكاملة - NINJA SMART TECHNOLOGY FACTORY ERP</title>
  <style>${CSS}</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div>
      <div style="margin-top:20px; margin-bottom:25px;">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="NINJA FACTORY LOGO" class="cover-logo-img" />` : '<div style="font-size:70px;">🏢</div>'}
      </div>
      <h1 class="cover-title">NINJA SMART TECHNOLOGY FACTORY</h1>
      <div class="cover-subtitle">نظام إدارة المصانع الذكية والموارد البشرية والتخطيط المؤسسي<br>(Smart Factory HR & Enterprise ERP System)</div>
      <div class="cover-badge">الدليل الموسع الكلي — شامل الـ 15 إدارة، 20 دورة HR، دورتين لكل قسم، 170 جدول، والخريطة العملاقة للنظام</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #eff6ff; font-size: 11pt; line-height: 1.8;">المرجع الميداني والتشغيلي المكتمل. يغطي 20 دورة تفصيلية للـ HR، دورتين تشغيليتين لكل إدارة من الإدارات الـ 15، سكيما البيانات الـ 170 جدول، وخريطة الربط الهندسية الكبرى للنظام بالكامل.</p>
    </div>

    <div class="cover-meta">
      <div><strong>فترة التطوير الميداني:</strong> 1 يناير 2026 حتى 22 أغسطس 2026 (مستمر والتحديث جارٍ)</div>
      <div><strong>إعداد وتطوير:</strong> فريق النظم الهندسية والذكاء الاصطناعي</div>
    </div>
  </div>

  <!-- CHAPTER 1 -->
  <div class="page-break">
    <h2 class="chapter-title">🌟 الفصل الأول: مقدمة ومفهوم إدارة الموارد المؤسسية</h2>
    <div class="notice-box">
      <strong>تأكيد التطوير الميداني:</strong> تم بدء العمل والتطوير الهندسي في هذا النظام منذ <strong>1 يناير 2026</strong> واستمر حتى اليوم <strong>22 أغسطس 2026</strong>. النظام حالياً في حالة تطوير ونشر نشطة لضمان تلبية أحدث متطلبات المصانع الذكية.
    </div>
    <div class="section-title">1.1 الهدف الأساسي من النظام</div>
    <p>صُمم نظام <strong>NINJA SMART TECHNOLOGY FACTORY ERP</strong> ليكون العقل المحرك والعمود الفقري الرقمي للمؤسسة. يربط النظام كافة الإدارات (المبيعات، المشتريات، الموارد البشرية، المالية، المخازن، والإنتاج) في بيئة سحابية واحدة. بمجرد إدخال الحركة، يقوم النظام بفحص الصلاحيات، التطبيق الآلي لقواعد العمل، والترحيل المحاسبي والتأثير المخزني الفوري.</p>
  </div>

  <!-- CHAPTER 2: DEPARTMENTS & DUAL WORKFLOWS -->
  <div class="page-break">
    <h2 class="chapter-title">🏬 الفصل الثاني: تفاصيل الإدارات الـ 15 والدورات التشغيلية الثنائية والرسومات</h2>
    <p>فيما يلي تفصيل شامل لجميع الإدارات الـ 15، حيث تحتوي كل إدارة على <strong>دورتين تشغيليتين كاملتين (Dual Workflows)</strong> ورسمة SVG تفصيلية لكل دورة:</p>
    ${deptHTML}
  </div>

  <!-- CHAPTER 3: DATABASE SCHEMA (170 TABLES) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الثالث: توثيق وسكيما قاعدة البيانات (${tableKeys.length} جدولاً بالكامل)</h2>
    <div class="section-title">3.1 الرسمة الشاملة الهندسية لقاعدة البيانات (170 Database Tables Schema SVG)</div>
    ${dbSchemaSVG}
    <div class="section-title">3.2 كشف جداول قاعدة البيانات (${tableKeys.length} جدولاً - سطر واحد لكل جدول)</div>
    ${dbHTML}
  </div>

  <!-- CHAPTER 4: COMMERCIAL PROPOSAL (420,000 EGP) -->
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

  <!-- CHAPTER 5: MEGA GIANT MASTER FULL SYSTEM SVG MAP -->
  <div class="page-break">
    <h2 class="chapter-title">👑 الفصل الخامس: الخريطة العملاقة الكبرى للنظام بالكامل (MEGA MASTER SYSTEM ARCHITECTURE MAP)</h2>
    <p>تضم هذه الخريطة الهندسية العملاقة التفاعل الربطي المتكامل بين جميع الـ 15 إدارة، 20 دورة HR، دورة المبيعات الكبرى، المشتريات، الخزائن، المخازن، الأسطول، وقاعدة البيانات الـ 170 جدول:</p>
    ${giantMasterSVG}
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../../frontend/shared/docs/master_nontech_erp_documentation.html'), htmlContent);
console.log('Successfully generated HTML template: master_nontech_erp_documentation.html');

// 4. Render HTML to PDF via Puppeteer
async function renderPdf() {
  console.log('Launching Puppeteer for Non-Technical PDF rendering...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = 'file:///' + path.join(__dirname, '../../frontend/shared/docs/master_nontech_erp_documentation.html').replace(/\\/g, '/');
  
  console.log('Loading HTML content into Puppeteer...');
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 120000 });

  const pdfPath = path.join(__dirname, 'Smart_Factory_ERP_NonTechnical_System_Manual.pdf');
  console.log(`Generating PDF artifact at: ${pdfPath}`);

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
  console.log('=== Master ERP PDF Generated Successfully! ===');
}

renderPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
