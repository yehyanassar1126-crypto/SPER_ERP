const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Starting Master ERP PDF Generation Engine ===');

// 1. Parse all SQL files to extract all tables and columns
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
    '../models/migrations/001_enterprise_security.sql',
    '../models/migrations/002_enterprise_multi.sql',
    '../models/migrations/003_enterprise_features.sql',
    '../models/migrations/004_enterprise_kpis_views.sql',
    '../models/migrations/005_enterprise_extra.sql',
    '../models/migrations/006_public_product_catalog.sql',
    '../models/migrations/007_client_auth.sql',
    '../models/migrations/007_premium_ats.sql',
    '../models/migrations/008_manufacturing_equipment.sql',
    '../models/migrations/009_password_encryption.sql',
    '../models/migrations/010_bilingual_chat.sql',
    '../models/migrations/011_screen_permissions.sql',
    '../models/migrations/ai_erp_migration.sql',
    '../models/migrations/setup_finance_enterprise.sql'
  ];

  let tables = {};

  sqlFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    const sql = fs.readFileSync(fullPath, 'utf8');

    // Regex for CREATE TABLE
    const tableRegex = /CREATE\ TABLE\ (IF\ NOT\ EXISTS\ )?(?:public\.)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
    let match;
    while ((match = tableRegex.exec(sql)) !== null) {
      const tName = match[2].toLowerCase().trim();
      const body = match[3];

      if (!tables[tName]) {
        tables[tName] = { name: tName, columns: [], source: relPath };

        // Parse lines
        const lines = body.split('\n');
        lines.forEach(line => {
          line = line.trim();
          if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('FOREIGN KEY') || line.startsWith('UNIQUE')) {
            return;
          }
          // Column definition match
          const colMatch = line.match(/^"?([a-zA-Z0-9_]+)"?\s+([a-zA-Z0-9_]+(?:\([0-9,\s]+\))?)(.*)/);
          if (colMatch) {
            const colName = colMatch[1];
            const colType = colMatch[2];
            const rest = colMatch[3] || '';
            
            const isPk = /PRIMARY\ KEY/i.test(rest) || colName === 'id';
            const isFk = /REFERENCES/i.test(rest);
            const isNotNull = /NOT\ NULL/i.test(rest);
            const defaultMatch = rest.match(/DEFAULT\s+([^,]+)/i);
            const defVal = defaultMatch ? defaultMatch[1].trim() : '-';

            tables[tName].columns.push({
              name: colName,
              type: colType,
              pk: isPk,
              fk: isFk,
              nullable: !isNotNull,
              defaultVal: defVal
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
console.log(`Successfully parsed ${tableKeys.length} database tables.`);

// 2. Load Logo Image as Base64 Data URI
const candidateLogoPaths = [
  path.join(__dirname, '../../frontend/shared/assets', 'logo.png'),
  path.join(__dirname, '../../public', 'logo.png'),
  path.join(__dirname, 'public', 'logo.png')
];
let logoDataUri = '';
for (const p of candidateLogoPaths) {
  if (fs.existsSync(p)) {
    const logoBase64 = fs.readFileSync(p).toString('base64');
    logoDataUri = `data:image/png;base64,${logoBase64}`;
    break;
  }
}

// 3. Generate Complete Master HTML Template
const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>التوثيق الفني الشامل ونظام التشغيل المؤسسي - Smart Factory ERP</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background-color: #ffffff;
      direction: rtl;
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
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
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
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
      border: 4px solid #818cf8;
    }
    
    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 15px;
      letter-spacing: -0.5px;
    }
    
    .cover-subtitle {
      font-size: 15pt;
      font-weight: 600;
      color: #818cf8;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    
    .cover-badge {
      display: inline-block;
      padding: 8px 24px;
      background: rgba(99, 102, 241, 0.2);
      border: 1.5px solid #818cf8;
      border-radius: 30px;
      font-size: 11pt;
      color: #c7d2fe;
      margin-bottom: 40px;
      font-weight: 700;
    }
    
    .cover-meta {
      width: 100%;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding-top: 20px;
      display: flex;
      justify-content: space-around;
      font-size: 10pt;
      color: #94a3b8;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .chapter-title {
      font-size: 20pt;
      font-weight: 800;
      color: #1e1b4b;
      border-bottom: 4px solid #4f46e5;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 700;
      color: #312e81;
      margin-top: 25px;
      margin-bottom: 12px;
      background: #f1f5f9;
      padding: 8px 14px;
      border-right: 5px solid #6366f1;
      border-radius: 4px;
    }
    
    p {
      margin-bottom: 12px;
      text-align: justify;
      color: #334155;
    }

    ul, ol {
      margin-right: 25px;
      margin-bottom: 15px;
      color: #334155;
    }

    li {
      margin-bottom: 6px;
    }

    .table-container {
      width: 100%;
      margin-bottom: 20px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 15px;
      font-size: 9.5pt;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: right;
    }

    th {
      background-color: #1e1b4b;
      color: #ffffff;
      font-weight: 700;
      font-size: 10pt;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .badge-pk {
      background-color: #ef4444;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: bold;
    }

    .badge-fk {
      background-color: #3b82f6;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: bold;
    }

    .diagram-box {
      background: #f8fafc;
      border: 2px dashed #6366f1;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }

    .diagram-svg {
      width: 100%;
      max-width: 750px;
      height: auto;
      margin: 0 auto;
    }

    .notice-box {
      background: #eff6ff;
      border-right: 4px solid #3b82f6;
      padding: 12px 16px;
      border-radius: 6px;
      margin: 15px 0;
      color: #1e40af;
      font-size: 10pt;
    }

    .proposal-card {
      background: #fdf4ff;
      border: 2px solid #c084fc;
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
    }
  </style>
</head>
<body>

  <!-- MASTER COVER PAGE -->
  <div class="cover-page">
    <div>
      <div class="cover-logo-wrapper">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="NINJA SMART TECHNOLOGY FACTORY LOGO" class="cover-logo-img" />` : '<div style="font-size:70px;">⚙️</div>'}
      </div>
      <h1 class="cover-title">NINJA SMART TECHNOLOGY FACTORY</h1>
      <div class="cover-subtitle">التوثيق الفني المعماري والمشهد التشغيلي الكامل<br>(Smart Factory HR & Enterprise ERP System)</div>
      <div class="cover-badge">الدليل الفني المرجعي - الإصدار v10.0 المعماري الشامل</div>
    </div>
    
    <div style="max-width: 650px; text-align: center;">
      <p style="color: #cbd5e1; font-size: 11pt; line-height: 1.8;">دليل الحوكمة الفنية والهندسة المعمارية الشامل، يغطي 163+ جدولاً في قاعدة البيانات، 15 موديول رئيسي، مصفوفة الصلاحيات، ومحرك الذكاء الاصطناعي.</p>
    </div>

    <div class="cover-meta">
      <div><strong>التاريخ:</strong> أغسطس 2026</div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page-break">
    <h2 class="chapter-title">📑 فهرس المحتويات التنفيذي</h2>
    <table style="width:100%; margin-top:20px;">
      <thead>
        <tr>
          <th>رقم الفصل</th>
          <th>عنوان الفصل</th>
          <th>النطاق والمحتويات المفصلة</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>الفصل الأول</td><td>معمارية النظام والنظرة العامة (System Architecture)</td><td>مكونات الواجهة البرمجية، الموديولات، الربط المحوري مع Supabase</td></tr>
        <tr><td>الفصل الثاني</td><td>دليل الأقسام والإدارات (Departments & Divisions)</td><td>شرح 15 إدارة متخصصة والربط التشغيلي والوظيفي بينها</td></tr>
        <tr><td>الفصل الثالث</td><td>كتالوج الشاشات التفصيلي (System Screens Catalog)</td><td>شاشات النظام بالكامل: المدخلات، الأزرار، الجداول والصلاحيات</td></tr>
        <tr><td>الفصل الرابع</td><td>دليل الواجهات البرمجية (APIs & Functions)</td><td>نقاط الاتصال، استعلامات البيانات والدوال المخزنة RPC</td></tr>
        <tr><td>الفصل الخامس</td><td>قاعدة البيانات الشاملة (163+ Tables Catalog)</td><td>توثيق تفصيلي لكل جدول بالأنواع، المفاتيح، والقيود دون اختصار</td></tr>
        <tr><td>الفصل السادس</td><td>مخططات العلاقات وER Diagrams</td><td>رسومات ومخططات العلاقات بين الجداول والموديولات المختلفة</td></tr>
        <tr><td>الفصل السابع</td><td>مسارات العمل ودورة البيانات (Workflows)</td><td>دورة التوظيف، الحضور، الصرف المالي، المشتريات والإنتاج</td></tr>
        <tr><td>الفصل الثامن</td><td>الأدوار ومصفوفة الصلاحيات (Roles & RBAC Matrix)</td><td>مصفوفة صلاحيات الشاشات والعمليات لكل مسمى وظيفي</td></tr>
        <tr><td>الفصل التاسع</td><td>منظومة الذكاء الاصطناعي (AI & Chatbot Engine)</td><td>AI Mind, CEO Dashboard, ATS Scanner, Chatbot</td></tr>
        <tr><td>الفصل العاشر</td><td>التقارير والمؤشرات (Reports & Dashboards)</td><td>تقارير الأداء، الميزانيات، وتصديرات Excel/PDF</td></tr>
        <tr><td>الفصل الحادي عشر</td><td>المقارنة التنافسية السوقية (Market Comparison)</td><td>مقارنة الفروق التقنية مع SAP, Oracle, Odoo</td></tr>
        <tr><td>الفصل الثاني عشر</td><td>عرض السعر والتكلفة التجاري (Commercial Proposal)</td><td>نطاق العمل، التكلفة التجاري، والجدول الزمني لتسليم المشروع</td></tr>
      </tbody>
    </table>
  </div>

  <!-- CHAPTER 1 -->
  <div class="page-break">
    <h2 class="chapter-title">🏗️ الفصل الأول: معمارية النظام والنظرة العامة (System Architecture)</h2>
    <p>يتكون نظام <strong>Smart Factory Enterprise ERP</strong> من معمارية برمجية متطورة مصممة خصيصاً للمؤسسات والمصانع الذكية. يعتمد النظام على نموذج تطبيق الصفحة الواحدة (Single Page Application - SPA) عالي السرعة، مع وجود محرك مركز يدير حالة التطبيق وهيكلية الصلاحيات الديناميكية.</p>
    
    <div class="section-title">1.1 المكونات الهيكلية الرئيسية</div>
    <ul>
      <li><strong>الواجهة الأمامية (Frontend Presentation Layer)</strong>: مبنية باستخدام HTML5, CSS3 Custom Theme, Vanilla JS (ES6+), Chart.js, PDF.js, QRCode.js.</li>
      <li><strong>محرك الصلاحيات (Security & RBAC Engine)</strong>: ينفذ بروتوكولات <code>SecurityHelpers</code> للتحقق من صلاحيات الشاشات والعمليات بناءً على جداول <code>screen_permissions</code> في قاعدة البيانات.</li>
      <li><strong>الطبقة البرمجية للموديولات (Domain Modules)</strong>: مقسمة بنظام الموديولات المعزولة لكل إدارة (HR, Finance, Supply Chain, Manufacturing, Sales, AI).</li>
      <li><strong>قاعدة البيانات والخدمات السحابية (Supabase BaaS)</strong>: محرك PostgreSQL لإدارة البيانات، RLS لحماية الصفوف، Realtime Subscriptions للتحديثات الفورية، وStorage المرفقات.</li>
    </ul>

    <div class="section-title">1.2 رسم توضيحي لمعمارية النظام (System Architecture Diagram)</div>
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="780" height="380" rx="10" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>
        
        <!-- Frontend Box -->
        <rect x="40" y="40" width="220" height="320" rx="8" fill="#e0e7ff" stroke="#4f46e5" stroke-width="2"/>
        <text x="150" y="70" font-weight="bold" font-size="14" text-anchor="middle" fill="#1e1b4b">SPA Frontend (Browser)</text>
        <rect x="60" y="100" width="180" height="40" rx="5" fill="#ffffff" stroke="#6366f1"/>
        <text x="150" y="125" font-size="11" text-anchor="middle">App Engine (app.js)</text>
        <rect x="60" y="155" width="180" height="40" rx="5" fill="#ffffff" stroke="#6366f1"/>
        <text x="150" y="180" font-size="11" text-anchor="middle">Security Helpers (RBAC)</text>
        <rect x="60" y="210" width="180" height="40" rx="5" fill="#ffffff" stroke="#6366f1"/>
        <text x="150" y="235" font-size="11" text-anchor="middle">15+ Domain Modules</text>
        <rect x="60" y="265" width="180" height="70" rx="5" fill="#ffffff" stroke="#6366f1"/>
        <text x="150" y="295" font-size="11" font-weight="bold" text-anchor="middle">AI Intelligence</text>
        <text x="150" y="315" font-size="9" text-anchor="middle">Chatbot & Mind & ATS</text>

        <!-- Arrows -->
        <path d="M 260 200 L 340 200" stroke="#4f46e5" stroke-width="3" marker-end="url(#arrow)"/>
        
        <!-- Supabase Client Layer -->
        <rect x="340" y="140" width="180" height="120" rx="8" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="430" y="170" font-weight="bold" font-size="13" text-anchor="middle" fill="#78350f">Supabase Client</text>
        <text x="430" y="195" font-size="10" text-anchor="middle">Realtime Protocol</text>
        <text x="430" y="215" font-size="10" text-anchor="middle">Auth & JWT Session</text>
        <text x="430" y="235" font-size="10" text-anchor="middle">Storage & Buckets</text>

        <!-- Arrow 2 -->
        <path d="M 520 200 L 580 200" stroke="#d97706" stroke-width="3"/>

        <!-- Postgres DB -->
        <rect x="580" y="40" width="180" height="320" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
        <text x="670" y="70" font-weight="bold" font-size="14" text-anchor="middle" fill="#14532d">PostgreSQL DB</text>
        <text x="670" y="95" font-size="11" text-anchor="middle" fill="#15803d">163+ Relational Tables</text>
        <rect x="600" y="120" width="140" height="35" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="670" y="142" font-size="10" text-anchor="middle">Core HR & Payroll</text>
        <rect x="600" y="165" width="140" height="35" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="670" y="187" font-size="10" text-anchor="middle">Finance & Treasury</text>
        <rect x="600" y="210" width="140" height="35" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="670" y="232" font-size="10" text-anchor="middle">Procurement & Inventory</text>
        <rect x="600" y="255" width="140" height="35" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="670" y="277" font-size="10" text-anchor="middle">Production & Quality</text>
        <rect x="600" y="300" width="140" height="45" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="670" y="320" font-size="10" font-weight="bold" text-anchor="middle">RLS & Permissions</text>
        <text x="670" y="335" font-size="9" text-anchor="middle">screen_permissions</text>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 2 -->
  <div class="page-break">
    <h2 class="chapter-title">🏢 الفصل الثاني: دليل الأقسام والإدارات (Departments & Divisions Map)</h2>
    <p>يحتوي النظام على 15 إدارة متخصصة تغطي كافة العمليات التشغيلية والمالية والإدارية والصناعية داخل المصنع والشركة:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>اسم الإدارة / القسم</th>
            <th>الوظيفة الرئيسية</th>
            <th>الشاشات والموديولات المرتبطة</th>
            <th>البيانات والمدخلات الرئيسية</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. الموارد البشرية (HR)</strong></td>
            <td>إدارة الموظفين، العقود، الهياكل الوظيفية، والجزاءات</td>
            <td>دليل الموظفين، ملفات العمالة، الإنذارات والجزاءات</td>
            <td>بيانات الشخصية، الرواتب الأساسية، الوثائق الرسمية</td>
          </tr>
          <tr>
            <td><strong>2. الحضور والانصراف (Attendance)</strong></td>
            <td>تتبع الوقت عبر QR Code، تصاريح الإجازات والاستئذان</td>
            <td>شاشة الحضور اليومي، طلبات الإجازات، ورديات العمل</td>
            <td>سجلات البصمة/QR، حساب التأخيرات، خصومات الغياب</td>
          </tr>
          <tr>
            <td><strong>3. الاستقطاب والتوظيف (AI ATS)</strong></td>
            <td>إدارة الوظائف، فحص الـ CV الذكي، وتقييم المرشحين</td>
            <td>منصة الوظائف، شاشة الذكاء الاصطناعي للـ CV، المقابلات</td>
            <td>سير ذاتية PDF، درجات التوافق، مهارات المرشحين</td>
          </tr>
          <tr>
            <td><strong>4. الرواتب والأجور (Payroll)</strong></td>
            <td>احتساب الرواتب، البدلات، الخصومات وصرف المستحقات</td>
            <td>مسرد الرواتب الشهرية، إيصالات الصرف، ربط الخزنة</td>
            <td>صافي الرواتب، السلف، الجزاءات، الساعات الإضافية</td>
          </tr>
          <tr>
            <td><strong>5. المالية والعدّة (Treasury & Finance)</strong></td>
            <td>إدارة الخزائن، البنوك، الشيكات، المعاملات، ودليل الحسابات</td>
            <td>الخزينة، الحسابات البنكية، المعاملات المالية، الشيكات</td>
            <td>حركات القبض والصرف، أرصدة البنوك، القيود المحاسبية</td>
          </tr>
          <tr>
            <td><strong>6. مراكز التكلفة (Cost Centers)</strong></td>
            <td>توزيع المصروفات والإيرادات على الأقسام الإنتاجية</td>
            <td>شاشة مراكز التكلفة، ميزانيات الأقسام، التحليلات</td>
            <td>توزيع التكاليف المباشرة وغير المباشرة</td>
          </tr>
          <tr>
            <td><strong>7. المشتريات والموردين (Procurement)</strong></td>
            <td>إدارة الموردين، طلبات الشراء، المناقصات، وأوامر التوريد</td>
            <td>دليل الموردين، طلبات الشراء، أوامر الشراء، استلام البضائع</td>
            <td>عروض الأسعار، المشتريات، تقييم أداء الموردين</td>
          </tr>
          <tr>
            <td><strong>8. المخازن والمخزون (Inventory)</strong></td>
            <td>إدارة الخامات، المنتجات التامة، وحركات الصرف والإضافة</td>
            <td>مخزن الخامات، مخزن المنتج التام، كارت الحساب، الأذونات</td>
            <td>كميات المخزون، حد الطلب، التوالف، التسويات المخزنية</td>
          </tr>
          <tr>
            <td><strong>9. التخطيط والإنتاج (Production)</strong></td>
            <td>إدارة شجرة المنتج (BOM)، أوامر الإنتاج، ومتابعة المراحل</td>
            <td>قائمة المكونات BOM، خطط الإنتاج، متابعة الأوامر</td>
            <td>خطوط الإنتاج، ساعات التشغيل، استهلاك المواد الخام</td>
          </tr>
          <tr>
            <td><strong>10. الجودة والفحص (Quality Control)</strong></td>
            <td>فحص الخامات الواردة والمنتجات التامة والتقارير</td>
            <td>فحص الواردات، فحص خط الإنتاج، اختبارات الجودة</td>
            <td>نسبة العيوب، عينات الفحص، قرار الاعتماد/الرفض</td>
          </tr>
          <tr>
            <td><strong>11. الصيانة والمعدات (Maintenance)</strong></td>
            <td>صيانة الأجهزة، بلاغات الاعطال، قطع الغيار، والإيجارات</td>
            <td>أوامر الصيانة، جدول الصيانة الوقائية، طلب قطع الغيار</td>
            <td>تذاكر الأعطال، تكاليف قطع الغيار، سجل معدات المصنع</td>
          </tr>
          <tr>
            <td><strong>12. الأسطول واللوجستيات (Fleet & Freight)</strong></td>
            <td>إدارة الشاحنات، حركة السائقين، العدادات، وصرف الوقود</td>
            <td>دليل السيارات، حركات السائقين، قراءات العداد، مصاريف الرحلات</td>
            <td>رحلات الشحن، استهلاك السولار، تصفية حسابات السائقين</td>
          </tr>
          <tr>
            <td><strong>13. المبيعات والعملاء (Sales CRM)</strong></td>
            <td>إدارة العملاء، عروض الأسعار، طلبات البيع، وفواتير البيع</td>
            <td>كتالوج المنتجات، طلبات العملاء، عروض الأسعار، الفواتير</td>
            <td>بيانات العملاء، المبيعات الإجمالية، التحصيلات الآجلة</td>
          </tr>
          <tr>
            <td><strong>14. الشؤون القانونية (Legal Affairs)</strong></td>
            <td>متابعة والقضايا، العقود الرسمية، والاستشارات القانونية</td>
            <td>شاشة القضايا، العقود والتوثيق، سجل النزاعات</td>
            <td>تاريخ الجلسات، أطراف النزاع، التعويضات والقرارات</td>
          </tr>
          <tr>
            <td><strong>15. الذكاء الاصطناعي (AI Operations)</strong></td>
            <td>التحليل التنبؤي، لوحة قيادة الرئيس التنفيذي، والشات بوت</td>
            <td>AI CEO Dashboard, AI Mind, Employee Chatbot Assistant</td>
            <td>التنبؤ بالمبيعات، كشف الانحرافات، الإجابة التلقائية</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 3 -->
  <div class="page-break">
    <h2 class="chapter-title">🖥️ الفصل الثالث: كتالوج الشاشات التفصيلي (System Screens Catalog)</h2>
    <p>يتضمن النظام أكثر من 45 شاشة تفاعلية متكاملة، مصممة بأحدث معايير تجربة المستخدم UX/UI مع حماية كل عنصر بحسب صلاحية الموظف:</p>

    <div class="section-title">3.1 شاشات الموارد البشرية والرواتب (HR Screens)</div>
    <ul>
      <li><strong>شاشة لوحة تحكم الموظفين (Employee Dashboard)</strong>: تعرض الإحصائيات الشخصية للموظف، ساعات الحضور، الإجازات المتبقية، والسلف النشطة. تحتوي على جدول الإشعارات اليومية ورابط للبصمة التفاعلية.</li>
      <li><strong>شاشة إدارة دليل الموظفين (HR Directory Screen)</strong>: تحتوي على جدول بجميع موظفي المصنع، مدخلات بحث عن اسم الموظف/الرقم القومي، أزرار (إضافة موظف جديد، تعديل البيانات، إيقاف الحساب). جدول البيانات يعرض: الاسم، القسم، المسمى الوظيفي، الراتب، الحالة، والإجراءات.</li>
      <li><strong>شاشة الرواتب المسردة (Payroll Enterprise Screen)</strong>: تعرض جدول رواتب الشهر الحالي. تحتوي على مدخلات اختيار الشهر/السنة، زر (احتساب الرواتب التلقائي)، زر (اعتماد الرواتب)، وزر (صرف فردي Pay) الصادر لكل موظف مع اختيار بنك/خزنة الصرف.</li>
      <li><strong>شاشة الحضور وتصاريح الإجازات (Attendance & Leaves Screen)</strong>: تحتوي على نموذج تقديم طلب إجازة (نوع الإجازة، تاريخ البدء، تاريخ النهاية، السبب)، وجدول يوضح الطلبات السابقة وحالتها (مقبول/مرفوض/قيد الانتظار).</li>
      <li><strong>شاشة نظام فحص الـ CV بالذكاء الاصطناعي (AI ATS Screen)</strong>: تحتوي على منطقة سحب وإسقاط لملفات الـ PDF، زر (فحص وتحليل بالذكاء الاصطناعي)، جدول يعرض أسماء المرشحين، درجة التوافق (Match Score %)، المهارات المستخرجة، وأزرار (قبول للمقابلة / رفض).</li>
    </ul>

    <div class="section-title">3.2 شاشات المالية والعدّة (Finance Screens)</div>
    <ul>
      <li><strong>شاشة الخزينة والأرصدة (Treasury & Safes Screen)</strong>: تعرض الأرصدة الحالية لكل خزنة وبنك، نموذج تحويل بين الخزائن، جدول حركات الصرف والقبض، وأزرار طباعة إذن الصرف.</li>
      <li><strong>شاشة الشيكات والمبيعات الآجلة (Checks & Deferred Transactions)</strong>: جدول بالشيكات الصادرة والواردة، تاريخ الاستحقاق، اسم البنك، أزرار (تحصيل، تظهير، إدراج بالبنك).</li>
      <li><strong>شاشة مراكز التكلفة (Cost Centers Screen)</strong>: تعرض الهيكل الشجري لمراكز التكلفة (المصنع، الخطوط، الإدارات)، نسبة التحميل، والمصروفات المباشرة.</li>
    </ul>

    <div class="section-title">3.3 شاشات الإنتاج والمشتريات والأسطول (Manufacturing & SCM Screens)</div>
    <ul>
      <li><strong>شاشة قائمة المكونات (BOM Engineering Screen)</strong>: نموذج تحديد المنتج النهائي، الخامات المطلوبة، الكميات لكل قطعة، ونسبة الهدر المسموح بها.</li>
      <li><strong>شاشة أوامر الإنتاج (Production Orders Screen)</strong>: جدول بأوامر الإنتاج (قيد الانتظار، جاري التشغيل، مكتمل)، أزرار بدء التشغيل، وصرف الخامات من المخزن.</li>
      <li><strong>شاشة حركة السيارات والعدادات (Fleet Logistics Screen)</strong>: جدول بسيارات المصنع، قراءة العداد الحالي (Odometer)، قراءات الوقود، السائق المسؤول، وأزرار تصفية مصاريف الرحلة.</li>
    </ul>
  </div>

  <!-- CHAPTER 4 -->
  <div class="page-break">
    <h2 class="chapter-title">⚡ الفصل الرابع: دليل الواجهات البرمجية (APIs & RPC Functions)</h2>
    <p>يتعامل النظام مع قاعدة بيانات Supabase عبر واجهات برمجية RESTful وواجهات RPC المباشرة. فيما يلي أهم الـ APIs المستخدمة في النظام:</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>اسم الـ API / RPC</th>
            <th>النوع (Method)</th>
            <th>الموديول المرتبط</th>
            <th>الوظيفة والوصف البرمجي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>sbClient.from('users').select()</code></td>
            <td>GET / Select</td>
            <td>Auth & Users</td>
            <td>التحقق من بيانات تسجيل الدخول واسترجاع الموظف ودوره</td>
          </tr>
          <tr>
            <td><code>sbClient.from('screen_permissions').select()</code></td>
            <td>GET / Select</td>
            <td>Security / RBAC</td>
            <td>استرجاع صلاحيات الشاشات المخصصة للموظف الحالي</td>
          </tr>
          <tr>
            <td><code>sbClient.from('attendance').insert()</code></td>
            <td>POST / Insert</td>
            <td>HR Attendance</td>
            <td>تسجيل حركة حضور جديدة عبر بصمة الـ QR Code</td>
          </tr>
          <tr>
            <td><code>sbClient.from('payroll').update()</code></td>
            <td>PATCH / Update</td>
            <td>Payroll</td>
            <td>تحديث حالة راتب الموظف إلى "صُرف Paid" وتسجيل الخزنة</td>
          </tr>
          <tr>
            <td><code>sbClient.from('erp_journal_entries').insert()</code></td>
            <td>POST / Insert</td>
            <td>Finance</td>
            <td>إنشاء قيد محاسبي تلقائي عند الصرف أو القبض</td>
          </tr>
          <tr>
            <td><code>sbClient.from('ats_applications').insert()</code></td>
            <td>POST / Insert</td>
            <td>HR ATS Engine</td>
            <td>حفظ نتائج تحليل الـ CV والدرجات المحسوبة بالذكاء الاصطناعي</td>
          </tr>
          <tr>
            <td><code>sbClient.from('production_orders').update()</code></td>
            <td>PATCH / Update</td>
            <td>Production</td>
            <td>تحويل حالة أمر الإنتاج وخصم الخامات المباشرة من المخزن</td>
          </tr>
          <tr>
            <td><code>sbClient.from('fleet_trips').insert()</code></td>
            <td>POST / Insert</td>
            <td>Fleet Logistics</td>
            <td>تسجيل رحلة شحن جديدة وقراءة العداد وتكلفة الوقود</td>
          </tr>
          <tr>
            <td><code>sbClient.rpc('hash_password')</code></td>
            <td>RPC Call</td>
            <td>Security Auth</td>
            <td>تشفير كلمة المرور دليلياً بدالة Cryptographic Hash</td>
          </tr>
          <tr>
            <td><code>sbClient.rpc('check_inventory_availability')</code></td>
            <td>RPC Call</td>
            <td>Inventory / BOM</td>
            <td>التحقق من توفر المواد الخام اللازمة لأمر إنتاج جديد</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 5: DATABASE TABLES (163+ TABLES CATALOG) -->
  <div class="page-break">
    <h2 class="chapter-title">🗄️ الفصل الخامس: كشف قاعدة البيانات الشامل (${tableKeys.length} جدول)</h2>
    <p>فيما يلي كشف كامل ومفصل لجميع جداول قاعدة البيانات الـ <strong>${tableKeys.length} جدولاً</strong> الموجودة فعلياً في النظام، موضحاً اسم الجدول، المصدر، وأعمدته بالتفصيل دون اختصار:</p>

    ${tableKeys.map((tName, idx) => {
      const t = dbSchema[tName];
      return `
        <div style="margin-bottom: 25px; page-break-inside: avoid;">
          <h3 style="font-size: 11pt; color: #1e1b4b; background: #e0e7ff; padding: 6px 12px; border-right: 4px solid #4f46e5; border-radius: 4px;">
            ${idx + 1}. جدول: <code style="color:#d97706;">${t.name}</code> (ملف المصدر: ${t.source})
          </h3>
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">اسم العمود (Column)</th>
                <th style="width: 20%;">نوع البيانات (Type)</th>
                <th style="width: 15%;">الخصائص (Keys)</th>
                <th style="width: 20%;">القيمة الافتراضية</th>
                <th style="width: 20%;">يقبل فارغ (Null)</th>
              </tr>
            </thead>
            <tbody>
              ${t.columns.length > 0 ? t.columns.map(c => `
                <tr>
                  <td><code>${c.name}</code></td>
                  <td><code style="color:#2563eb;">${c.type}</code></td>
                  <td>
                    ${c.pk ? '<span class="badge-pk">PK</span> ' : ''}
                    ${c.fk ? '<span class="badge-fk">FK</span>' : ''}
                    ${!c.pk && !c.fk ? '-' : ''}
                  </td>
                  <td><code>${c.defaultVal}</code></td>
                  <td>${c.nullable ? 'نعم (Yes)' : 'لا (No)'}</td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align:center; color:#64748b;">تعريف الأعمدة مسجل عبر الاستعلامات الديناميكية (Dynamic Definitions)</td></tr>'}
            </tbody>
          </table>
        </div>
      `;
    }).join('')}
  </div>

  <!-- CHAPTER 6 -->
  <div class="page-break">
    <h2 class="chapter-title">🗺️ الفصل السادس: مخططات العلاقات بين الجداول (Database ERD & Relationships)</h2>
    <p>توضح المخططات الهندسية التالية العلاقات بين جداول قاعدة البيانات الرئيسية في الموديولات المحورية:</p>

    <div class="section-title">6.1 مخطط علاقات الموارد البشرية والرواتب (HR & Payroll ERD)</div>
    <div class="diagram-box">
      <svg class="diagram-svg" viewBox="0 0 700 280" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="160" height="90" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <text x="100" y="45" font-weight="bold" font-size="12" text-anchor="middle">users / employees</text>
        <text x="100" y="65" font-size="9" text-anchor="middle">PK: id</text>
        <text x="100" y="80" font-size="9" text-anchor="middle">full_name, role, salary</text>

        <path d="M 180 65 L 260 65" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4"/>

        <rect x="260" y="20" width="160" height="90" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
        <text x="340" y="45" font-weight="bold" font-size="12" text-anchor="middle">attendance</text>
        <text x="340" y="65" font-size="9" text-anchor="middle">FK: user_id</text>
        <text x="340" y="80" font-size="9" text-anchor="middle">check_in, status, penalty</text>

        <path d="M 100 110 L 100 170" stroke="#3b82f6" stroke-width="2"/>

        <rect x="20" y="170" width="160" height="90" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="2"/>
        <text x="100" y="195" font-weight="bold" font-size="12" text-anchor="middle">payroll</text>
        <text x="100" y="215" font-size="9" text-anchor="middle">FK: user_id</text>
        <text x="100" y="230" font-size="9" text-anchor="middle">net_salary, status, bank_id</text>

        <path d="M 180 215 L 260 215" stroke="#dc2626" stroke-width="2"/>

        <rect x="260" y="170" width="160" height="90" rx="6" fill="#faf5ff" stroke="#9333ea" stroke-width="2"/>
        <text x="340" y="195" font-weight="bold" font-size="12" text-anchor="middle">erp_journal_entries</text>
        <text x="340" y="215" font-size="9" text-anchor="middle">FK: reference_id</text>
        <text x="340" y="230" font-size="9" text-anchor="middle">debit, credit, safe_id</text>

        <rect x="500" y="90" width="170" height="100" rx="6" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/>
        <text x="585" y="115" font-weight="bold" font-size="12" text-anchor="middle">screen_permissions</text>
        <text x="585" y="135" font-size="9" text-anchor="middle">FK: user_id / role</text>
        <text x="585" y="155" font-size="9" text-anchor="middle">screen_code, can_view</text>
        <text x="585" y="170" font-size="9" text-anchor="middle">can_edit, can_delete</text>

        <path d="M 180 45 L 500 135" stroke="#ea580c" stroke-width="1.5"/>
      </svg>
    </div>
  </div>

  <!-- CHAPTER 7 -->
  <div class="page-break">
    <h2 class="chapter-title">🔄 الفصل السابع: مسارات العمل ودورة البيانات (Workflows)</h2>
    
    <div class="section-title">7.1 دورة صرف الرواتب الشهرية والربط المالي (Payroll & Treasury Workflow)</div>
    <ol>
      <li><strong>احتساب الرواتب التلقائي</strong>: يقوم نظام الرواتب بجمع الرواتب الأساسية ومسابقة سجلات جدول <code>attendance</code> واحتساب الخصومات الناتجة عن الغياب والتأخيرات وتأكيد صافي الراتب لكل موظف.</li>
      <li><strong>مراجعة الاعتماد الإداري</strong>: يقوم مدير الموارد البشرية (HR Admin) بفتح شاشة الرواتب واعتماد جدول الرواتب الشهري.</li>
      <li><strong>الصرف الفردي الذكي (Pay)</strong>: ينقر المحاسب على زر "Pay" الخاص بالموظف، وتظهر شاشة اختيار بنك الصرف أو الخزنة.</li>
      <li><strong>توليد القيد والتحديث الفوري</strong>: بمجرد تأكيد الصرف، تنفذ دالة <code>payroll.update</code>، ويتم إنشاء قيد محاسبي تلقائي في جدول <code>erp_journal_entries</code> وخصم المبلغ من الخزنة المحددة.</li>
    </ol>

    <div class="section-title">7.2 دورة الإنتاج واستهلاك المواد الخام (Manufacturing Workflow)</div>
    <ol>
      <li><strong>تحديد قائمة المكونات (BOM)</strong>: يقوم مهندس الإنتاج بتحديد شجرة المنتج والمكونات في شاشة BOM.</li>
      <li><strong>إصدار امر الإنتاج</strong>: يتم إنشاء أمر إنتاج جديد بقيم كمية معينة.</li>
      <li><strong>التحقق من الرصيد المخزني</strong>: يفحص النظام تلقائياً رصيد الخامات في مخزن المواد الخام <code>inventory_items</code>.</li>
      <li><strong>الخصم والتصنيع</strong>: عند بدء التشغيل، يتم خصم الكميات المحددة فوراً وتحويل المنتجات التامة إلى مخزن المنتج التام.</li>
    </ol>
  </div>

  <!-- CHAPTER 8 -->
  <div class="page-break">
    <h2 class="chapter-title">🔐 الفصل الثامن: الأدوار ومصفوفة الصلاحيات (Roles & RBAC Matrix)</h2>
    <p>يدعم النظام مصفوفة صلاحيات تفصيلية يتم تخزينها ديناميكياً في جداول <code>screen_permissions</code> لتحديد صلاحية كل موظف على كل شاشة (عرض View، إضافة Add، تعديل Edit، حذف Delete، تصدير Export):</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>الدور الوظيفي (Role)</th>
            <th>إدارة HR والرواتب</th>
            <th>المالية والخزنة</th>
            <th>المشتريات والمخزن</th>
            <th>الإنتاج والجودة</th>
            <th>الأسطول والسيارات</th>
            <th>لوحة الرئيس التنفيذي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>مالك النظام (Owner)</strong></td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>مفعلة (Active)</td>
          </tr>
          <tr>
            <td><strong>مدير النظام (Admin)</strong></td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>كاملة (Full)</td>
            <td>عرض فقط (View)</td>
          </tr>
          <tr>
            <td><strong>مدير HR (HR Manager)</strong></td>
            <td>كاملة (Full)</td>
            <td>عرض فقط (View)</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>عرض (View)</td>
            <td>مغلقة (Disabled)</td>
          </tr>
          <tr>
            <td><strong>المحاسب (Accountant)</strong></td>
            <td>الرواتب (Pay)</td>
            <td>كاملة (Full)</td>
            <td>عروض الأسعار</td>
            <td>مغلقة (Disabled)</td>
            <td>مصاريف الرحلات</td>
            <td>مغلقة (Disabled)</td>
          </tr>
          <tr>
            <td><strong>أمين المخزن (Warehouse)</strong></td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>كاملة (Full)</td>
            <td>صرف الخامات</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
          </tr>
          <tr>
            <td><strong>مهندس الإنتاج (Engineer)</strong></td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>طلب خامات</td>
            <td>كاملة (Full)</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
          </tr>
          <tr>
            <td><strong>الموظف العادي (Employee)</strong></td>
            <td>ملفه فقط</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
            <td>مغلقة (Disabled)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 9 -->
  <div class="page-break">
    <h2 class="chapter-title">🤖 الفصل التاسع: منظومة الذكاء الاصطناعي (AI Suite)</h2>
    <ul>
      <li><strong>عقل النظام التنبؤي (AI Mind - <code>js/ai-mind.js</code>)</strong>: خوارزمية ذكية تقوم بتحليل اتجاهات المبيعات واستئناف المخزون، وإطلاق تنبيهات مبكرة عند اقتراب خامات التصنيع من حد الخطر.</li>
      <li><strong>شات بوت الموظفين الذكي (Permission-Aware Employee Chatbot)</strong>: مساعد تفاعلي يتحدث اللغة العربية والإنجليزية، يتيح للموظف الاستفسار عن رصيد إجازاته، تفاصيل رواتبه، وبنود الصيانة. يتميز الشات بوت بحماية البيانات؛ حيث يرفض الرد على أي استفسارات مالية أو إنتاجية حساسة إذا لم يكن الموظف يملك الصلاحية الخاصة بها في <code>SecurityHelpers</code>.</li>
      <li><strong>فحص السير الذاتية (AI ATS Scanner - <code>js/hr-ats-premium.js</code>)</strong>: يحلل ملفات الـ PDF الخاصة بالمرشحين للوظائف، ويستخرج المهارات والسنوات والشهادات تلقائياً لحساب درجة ملاءمة المرشح (Match Score %) للوظيفة.</li>
    </ul>
  </div>

  <!-- CHAPTER 10 & 11 -->
  <div class="page-break">
    <h2 class="chapter-title">📊 الفصل العاشر والحادي عشر: التقارير والمقارنة التنافسية السوقية</h2>
    
    <div class="section-title">10.1 التقارير ولوحات الأداء</div>
    <p>يتضمن النظام محرك تقارير شامل يقدم تقارير دورية قابلة للتصدير بصيغ (PDF, Excel XLSX, CSV) وتشمل: تقرير كشف الرواتب، تقرير الجرد المخزني، تقرير أداء الموردين، تقرير صيانة الأسطول، وتقارير ميزانية مراكز التكلفة.</p>

    <div class="section-title">11.1 المقارنة السوقية التنافسية (Market Comparison)</div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>وجه المقارنة</th>
            <th>نظامنا (Smart Factory ERP)</th>
            <th>نظام Odoo Enterprise</th>
            <th>نظام SAP / Oracle ERP</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>السرعة واستجابة الواجهة</strong>:</td>
            <td>فائقة السرعة (Single Page SPA)</td>
            <td>متوسطة (تعتمد على إضافات Python)</td>
            <td>ثقيلة وتحتاج سيرفرات ضخمة</td>
          </tr>
          <tr>
            <td><strong>الذكاء الاصطناعي المدمج</strong>:</td>
            <td>مدمج بالكامل (ATS + Chatbot + CEO)</td>
            <td>يحتاج إضافات خارجية ومدفوعة</td>
            <td>تكلفة إضافية باهظة جداً</td>
          </tr>
          <tr>
            <td><strong>دعم اللغة العربية والـ RTL</strong>:</td>
            <td>دعم أصلي ممتاز 100% RTL</td>
            <td>دعم جيد يتطلب ضبط قوالب</td>
            <td>دعم معقد وتكاليف تعريب عالية</td>
          </tr>
          <tr>
            <td><strong>تكلفة التشغيل والتراخيص</strong>:</td>
            <td>مرنة وبدون رسوم مستخدم شهرية باهظة</td>
            <td>رسوم شهرية لكل مستخدم/موديول</td>
            <td>تراخيص سنوية باهظة ومكلفة</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- CHAPTER 12: COMMERCIAL PROPOSAL -->
  <div class="page-break">
    <div class="proposal-box">
      <h2 style="font-size: 18pt; color: #7e22ce; text-align: center; margin-bottom: 15px;">💼 الفصل الثاني عشر: عرض السعر والنطاق التجاري (Commercial Proposal)</h2>
      <p style="text-align: center; font-weight: bold; color: #581c87; margin-bottom: 20px;">عرض توريد وتشغيل نظام ERP المتكامل للمصانع الذكية والحوكمة الإدارية</p>
      
      <table style="width:100%; background: white;">
        <thead>
          <tr>
            <th>بيان النطاق والخدمة (Scope of Work)</th>
            <th>تفاصيل التسليمات</th>
            <th>التكلفة التقديرية (EGP)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. رخصة النظام الأساسية (Enterprise ERP Core License)</strong></td>
            <td>شاملة الـ 15 موديول (HR, Finance, Supply Chain, Production, Fleet, AI Suite)</td>
            <td>180,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>2. إعداد قاعدة البيانات والـ 163+ جدول (Database Setup)</strong></td>
            <td>تهيأة سيرفر Supabase PostgreSQL, RLS Policies, وربط النسخ الاحتياطي التلقائي</td>
            <td>35,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>3. منظومة الذكاء الاصطناعي والـ ATS (AI Engine Integration)</strong></td>
            <td>تفعيل AI ATS Scanner, Employee Chatbot, و AI CEO Dashboard</td>
            <td>45,000 ج.م</td>
          </tr>
          <tr>
            <td><strong>4. التدريب والاختبارات الميدانية (Training & Deployment)</strong></td>
            <td>تدريب مدراء الأقسام، واختبارات التشغيل الميدانية وضمان التوافق 100%</td>
            <td>20,000 ج.م</td>
          </tr>
          <tr style="background: #f3e8ff; font-weight: bold;">
            <td colspan="2" style="text-align: left; font-size: 11pt;">الإجمالي التجاري التقديري (Total Investment):</td>
            <td style="color: #7e22ce; font-size: 12pt;">280,000 ج.م</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px; font-size: 9.5pt; color: #4c1d95;">
        <p><strong>الشروط والأحكام التجارية:</strong></p>
        <ul>
          <li>مدة التنفيذ والربط الميداني: 45 يوماً من تاريخ التوقيع والاعتماد.</li>
          <li>الدعم الفني والضمان: ضمان سنة كاملة يشمل الصيانة والتحديثات الدورية مجاناً.</li>
          <li>سداد المستحقات: 50% دفعة مقدمة عند التوقيع، 30% بعد اختبار الموديولات، و 20% عند التسليم النهائي.</li>
        </ul>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '../../frontend/screens/reports/master_erp_documentation.html'), htmlContent);
console.log('Successfully generated HTML template: master_erp_documentation.html');

// 3. Convert HTML to PDF using Puppeteer
async function renderPdf() {
  console.log('Launching Puppeteer headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const htmlPath = 'file:///' + path.join(__dirname, '../../frontend/screens/reports/master_erp_documentation.html').replace(/\\/g, '/');
  
  console.log('Loading HTML content into page...');
  await page.goto(htmlPath, { waitUntil: 'networkidle0', timeout: 90000 });

  const pdfPath = path.join(__dirname, 'Smart_Factory_ERP_Complete_Documentation.pdf');
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
