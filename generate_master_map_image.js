const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

console.log('=== Generating Mega Integrated Master System Map PNG (Ultra Resolution & Connected Arrows) ===');

// Giant Multi-Layer SVG Diagram with connected directional arrows between all 15 departments, AI, and 170 Tables Hub
const megaSVG = `
<svg viewBox="0 0 1600 2400" width="3200" height="4800" xmlns="http://www.w3.org/2000/svg" style="background:#0f172a; font-family:'Cairo', sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8"/>
    </marker>
    <marker id="arrow-gold" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24"/>
    </marker>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Title Banner -->
  <rect x="50" y="40" width="1500" height="100" rx="20" fill="linear-gradient(90deg, #1e3a8a, #1d4ed8)" stroke="#60a5fa" stroke-width="4"/>
  <text x="800" y="95" font-weight="900" font-size="34" text-anchor="middle" fill="#ffffff">NINJA SMART TECHNOLOGY FACTORY ERP — MEGA MASTER INTEGRATED MAP</text>
  <text x="800" y="125" font-weight="700" font-size="18" text-anchor="middle" fill="#93c5fd">الخريطة الكبرى المتكاملة: ربط الإدارات الـ 15 والدورات التشغيلية والأسهم البينية بقاعدة البيانات الـ 170 جدول</text>

  <!-- ROW 1: Security & Sales & Procurement -->
  <g id="row1">
    <!-- Dept 1: Sales -->
    <rect x="50" y="180" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="280" y="220" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">1. إدارة المبيعات وخدمة العملاء (Sales & CRM)</text>
    <text x="70" y="255" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة المبيعات: RFQ ← عرض سعر ← أمر مبيعات ← BOM ← تحصيل خزنة ← شحن ← تسليم العميل</text>
    <text x="70" y="290" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة المرتجعات: طلب مرتجع ← فحص QC ← إذن إضافة ← إشعار دائن ← تسوية الخزنة</text>
    <rect x="70" y="325" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="280" y="350" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول المبيعات: sales_orders, quotations, customers, credit_notes</text>

    <!-- Dept 2: Procurement -->
    <rect x="570" y="180" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="800" y="220" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">2. إدارة المشتريات والموردين (Procurement)</text>
    <text x="590" y="255" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة الشراء: طلب احتياج PR ← RFQ ← أمر شراء PO ← فحص QC ← إذن إضافة ← سداد المورد</text>
    <text x="590" y="290" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة الموردين: تسجيل MVR ← تقييم أداء التوريد ← تصنيف المعتمد ← التجديد</text>
    <rect x="590" y="325" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="800" y="350" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول المشتريات: suppliers, purchase_orders, purchase_requests</text>

    <!-- Dept 3: Inventory -->
    <rect x="1090" y="180" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="1320" y="220" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">3. إدارة المخازن والخامات (Inventory)</text>
    <text x="1110" y="255" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة المخزن: استلام خامات ← إذن إضافة ← خصم آلي للإنتاج ← حد إعادة الطلب</text>
    <text x="1110" y="290" font-weight="700" font-size="14" fill="#e2e8f0">🔄 دورة الجرد: فتح أمر جرد ← عَد فعلي ← مقارنة مستندية ← تسوية عجز/زيادة</text>
    <rect x="1110" y="325" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="1320" y="350" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول المخازن: inventory_items, stock_movements, warehouses</text>
  </g>

  <!-- Connective Arrows Row 1 to Row 2 -->
  <path d="M 280 460 L 280 520" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 800 460 L 800 520" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 1320 460 L 1320 520" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <!-- Cross Connectors -->
  <path d="M 510 320 L 570 320" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow-gold)"/>
  <path d="M 1030 320 L 1090 320" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow-gold)"/>

  <!-- ROW 2: Manufacturing & Quality & Maintenance -->
  <g id="row2">
    <!-- Dept 4: Manufacturing -->
    <rect x="50" y="520" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="280" y="560" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">4. خطوط الإنتاج والـ BOM (Production)</text>
    <text x="70" y="595" font-weight="700" font-size="14" fill="#e2e8f0">🔄 أمر تشغيل ← خصم المعايير آلياً من الـ BOM ← متابعة خط التشغيل</text>
    <text x="70" y="630" font-weight="700" font-size="14" fill="#e2e8f0">🔄 إنهاء التصنيع ← فحص الجودة ← تحويل المنتج التام للمخازن</text>
    <rect x="70" y="665" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="280" y="690" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الإنتاج: bom, production_orders, finished_goods</text>

    <!-- Dept 5: Quality Control -->
    <rect x="570" y="520" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="800" y="560" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">5. ضبط الجودة والفحص المعملي (QC)</text>
    <text x="590" y="595" font-weight="700" font-size="14" fill="#e2e8f0">🔄 فحص الخامات: سحب عينات الشحنة ← الفحص الفني ← إجازة/رفض</text>
    <text x="590" y="630" font-weight="700" font-size="14" fill="#e2e8f0">🔄 جودة التصنيع: التفتيش الدوري على الخطوط ← عزل التالف قبل التعبئة</text>
    <rect x="590" y="665" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="800" y="690" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الجودة: qc_inspections, quality_standards</text>

    <!-- Dept 6: Maintenance -->
    <rect x="1090" y="520" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="1320" y="560" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">6. الصيانة وقطع الغيار (Maintenance)</text>
    <text x="1110" y="595" font-weight="700" font-size="14" fill="#e2e8f0">🔄 الأعطال الطارئة: بلاغ عطل ← صرف قطع الغيار ← إصلاح الآلة</text>
    <text x="1110" y="630" font-weight="700" font-size="14" fill="#e2e8f0">🔄 الصيانة الوقائية: تتبع ساعات التشغيل ← جدولة العمرات آلياً</text>
    <rect x="1110" y="665" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="1320" y="690" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الصيانة: equipment, maintenance_logs, spare_parts</text>
  </g>

  <!-- Connective Arrows Row 2 to Row 3 -->
  <path d="M 280 800 L 280 860" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 800 800 L 800 860" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 1320 800 L 1320 860" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 510 660 L 570 660" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow-gold)"/>
  <path d="M 1030 660 L 1090 660" stroke="#fbbf24" stroke-width="3" stroke-dasharray="6,6" marker-end="url(#arrow-gold)"/>

  <!-- ROW 3: HR & Attendance & ATS -->
  <g id="row3">
    <!-- Dept 7: HR 20 Workflows -->
    <rect x="50" y="860" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="280" y="900" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">7. الموارد البشرية والرواتب (20 HR Workflows)</text>
    <text x="70" y="935" font-weight="700" font-size="14" fill="#e2e8f0">🔄 20 دورة HR: توظيف ← ملفات ← سلف يومية/شهري ← جزاءات ← إجازات ← رواتب Pay</text>
    <text x="70" y="970" font-weight="700" font-size="14" fill="#e2e8f0">🔄 التخارج: تسليم العهد ← تصفية مستحقات ← إخلاء طرف ← تجميد حساب</text>
    <rect x="70" y="1005" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="280" y="1030" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول HR: users, payroll, attendance, worker_advances</text>

    <!-- Dept 8: Attendance QR -->
    <rect x="570" y="860" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="800" y="900" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">8. الحضور والبصمة الذكية (Attendance QR)</text>
    <text x="590" y="935" font-weight="700" font-size="14" fill="#e2e8f0">🔄 مسح QR الموبايل ← مطابقة الشيفت ← حساب دقائق التأخير والغياب آلياً</text>
    <text x="590" y="970" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تقديم تظلم تأخير ← موافقة مدير HR ← تعديل كشف الحضور</text>
    <rect x="590" y="1005" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="800" y="1030" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الحضور: attendance, shifts, attendance_appeals</text>

    <!-- Dept 9: ATS Recruitment -->
    <rect x="1090" y="860" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="1320" y="900" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">9. التوظيف الذكي (ATS Recruitment)</text>
    <text x="1110" y="935" font-weight="700" font-size="14" fill="#e2e8f0">🔄 رفع CV PDF ← تحليل المهارات بالـ AI ← استخراج نسبة المطابقة</text>
    <text x="1110" y="970" font-weight="700" font-size="14" fill="#e2e8f0">🔄 جدولة المقابلات الفنية ← التقييم ← إصدار عرض العمل والعقد</text>
    <rect x="1110" y="1005" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="1320" y="1030" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول التوظيف: ats_applications, job_postings</text>
  </g>

  <!-- Connective Arrows Row 3 to Row 4 -->
  <path d="M 280 1140 L 280 1200" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 800 1140 L 800 1200" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 1320 1140 L 1320 1200" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>

  <!-- ROW 4: Finance & Safes & Cost Centers -->
  <g id="row4">
    <!-- Dept 10: General Ledger -->
    <rect x="50" y="1200" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="280" y="1240" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">10. الإدارة المالية والقيود المحاسبية</text>
    <text x="70" y="1275" font-weight="700" font-size="14" fill="#e2e8f0">🔄 إنشاء قيد متوازن تلقائي لكل حركة شراء/بيع/رواتب دون تدخل يدوي</text>
    <text x="70" y="1310" font-weight="700" font-size="14" fill="#e2e8f0">🔄 الإقفال الشهري ← ميزان المراجعة ← الميزانية العمومية</text>
    <rect x="70" y="1345" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="280" y="1370" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول المالية: journal_entries, chart_of_accounts</text>

    <!-- Dept 11: Treasury Safes -->
    <rect x="570" y="1200" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="800" y="1240" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">11. الخزائن والبنوك (Treasury)</text>
    <text x="590" y="1275" font-weight="700" font-size="14" fill="#e2e8f0">🔄 صرف وقبض نقدي ← فحص السيولة المتاحة ← حظر السحب المكشوف</text>
    <text x="590" y="1310" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تحويلات نقدية بين الخزائن والبنوك ← اعتماد الإدارة والقيد</text>
    <rect x="590" y="1345" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="800" y="1370" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الخزائن: finance_safes, bank_accounts</text>

    <!-- Dept 12: Cost Centers -->
    <rect x="1090" y="1200" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="1320" y="1240" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">12. مراكز التكلفة (Cost Centers)</text>
    <text x="1110" y="1275" font-weight="700" font-size="14" fill="#e2e8f0">🔄 ربط المصروفات والرواتب بكود مركز التكلفة (خط إنتاج/مشروع)</text>
    <text x="1110" y="1310" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تقرير تحليل الربحية والإنتاجية لكل مركز منفصل</text>
    <rect x="1110" y="1345" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="1320" y="1370" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول مراكز التكلفة: cost_centers, cost_allocations</text>
  </g>

  <!-- Connective Arrows Row 4 to Row 5 -->
  <path d="M 280 1480 L 280 1540" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 800 1480 L 800 1540" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>
  <path d="M 1320 1480 L 1320 1540" stroke="#38bdf8" stroke-width="4" marker-end="url(#arrow)"/>

  <!-- ROW 5: Fleet & Logistics & AI -->
  <g id="row5">
    <!-- Dept 13: Fleet -->
    <rect x="50" y="1540" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="280" y="1580" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">13. أسطول السيارات والعداد (Fleet)</text>
    <text x="70" y="1615" font-weight="700" font-size="14" fill="#e2e8f0">🔄 قراءة Odometer ← صرف السولار ← حساب معدل استهلاك الوقود</text>
    <text x="70" y="1650" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تنبيهات مواعيد تراخيص الشاحنات والفحص الفني والإطارات</text>
    <rect x="70" y="1685" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="280" y="1710" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الأسطول: fleet_vehicles, fuel_logs, odometer_reads</text>

    <!-- Dept 14: Logistics -->
    <rect x="570" y="1540" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="800" y="1580" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">14. رحلات السائقين والشحن (Logistics)</text>
    <text x="590" y="1615" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تكليف السائق بالرحلة ← تسليم العميل ← إشعار الاستلام</text>
    <text x="590" y="1650" font-weight="700" font-size="14" fill="#e2e8f0">🔄 تصفية عهد الوقود ومصاريف الطرق والسولار بالخزنة</text>
    <rect x="590" y="1685" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="800" y="1710" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الرحلات: fleet_trips, driver_allowances</text>

    <!-- Dept 15: AI Engine -->
    <rect x="1090" y="1540" width="460" height="280" rx="16" fill="#1e293b" stroke="#3b82f6" stroke-width="3"/>
    <text x="1320" y="1580" font-weight="900" font-size="20" text-anchor="middle" fill="#60a5fa">15. الذكاء الاصطناعي والـ CEO (AI Suite)</text>
    <text x="1110" y="1615" font-weight="700" font-size="14" fill="#e2e8f0">🔄 شات بوت تفاعلي باللغة العربية لإجابة استفسارات الموظفين</text>
    <text x="1110" y="1650" font-weight="700" font-size="14" fill="#e2e8f0">🔄 لوحة قيادة تنبؤية للرئيس التنفيذي للتنبيه بالأخطار والمالية</text>
    <rect x="1110" y="1685" width="420" height="40" rx="8" fill="#0284c7"/>
    <text x="1320" y="1710" font-weight="bold" font-size="13" text-anchor="middle" fill="#ffffff">🗄️ جداول الذكاء الاصطناعي: ai_prompts, ceo_analytics</text>
  </g>

  <!-- Connective Arrows Row 5 to Central Hub -->
  <path d="M 280 1820 L 800 1920" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-gold)"/>
  <path d="M 800 1820 L 800 1920" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-gold)"/>
  <path d="M 1320 1820 L 800 1920" stroke="#fbbf24" stroke-width="4" marker-end="url(#arrow-gold)"/>

  <!-- CENTRAL DATABASE HUB (170 TABLES CORE) -->
  <g id="central-hub">
    <rect x="50" y="1920" width="1500" height="380" rx="24" fill="linear-gradient(135deg, #0f172a, #1e3a8a)" stroke="#38bdf8" stroke-width="5" filter="url(#glow)"/>
    <text x="800" y="1980" font-weight="900" font-size="32" text-anchor="middle" fill="#38bdf8">🌐 النواة المركزية لقواعد البيانات (170 DATABASE TABLES ARCHITECTURE HUB)</text>
    <text x="800" y="2025" font-weight="800" font-size="20" text-anchor="middle" fill="#ffffff">الربط والتأثير المحاسبي والمخزني الآلي واللحظي بين جميع الـ 15 إدارة والدورات التشغيلية</text>
    
    <g transform="translate(100, 2060)">
      <rect x="0" y="0" width="260" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <text x="130" y="40" font-weight="bold" font-size="16" text-anchor="middle" fill="#60a5fa">الحسابات والأمان (22)</text>
      <text x="130" y="65" font-size="13" text-anchor="middle" fill="#cbd5e1">users, screen_permissions</text>

      <rect x="290" y="0" width="260" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <text x="420" y="40" font-weight="bold" font-size="16" text-anchor="middle" fill="#60a5fa">HR والرواتب (43)</text>
      <text x="420" y="65" font-size="13" text-anchor="middle" fill="#cbd5e1">payroll, attendance, shifts</text>

      <rect x="580" y="0" width="260" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <text x="710" y="40" font-weight="bold" font-size="16" text-anchor="middle" fill="#60a5fa">المالية والخزائن (40)</text>
      <text x="710" y="65" font-size="13" text-anchor="middle" fill="#cbd5e1">journal_entries, safes</text>

      <rect x="870" y="0" width="260" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <text x="1000" y="40" font-weight="bold" font-size="16" text-anchor="middle" fill="#60a5fa">المشتريات والمخازن (37)</text>
      <text x="1000" y="65" font-size="13" text-anchor="middle" fill="#cbd5e1">suppliers, inventory</text>

      <rect x="1160" y="0" width="240" height="90" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
      <text x="1280" y="40" font-weight="bold" font-size="16" text-anchor="middle" fill="#60a5fa">الإنتاج والأسطول (28)</text>
      <text x="1280" y="65" font-size="13" text-anchor="middle" fill="#cbd5e1">bom, fleet_trips</text>
    </g>

    <text x="800" y="2220" font-weight="700" font-size="16" text-anchor="middle" fill="#fbbf24">🔒 Supabase Enterprise Cloud Infrastructure with Row-Level Security (RLS) & Instant Automated Backup</text>
  </g>
</svg>
`;

fs.writeFileSync(path.join(__dirname, 'master_map_standalone.html'), `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Mega Master Integrated System Map</title>
  <style>
    body { margin:0; padding:0; background:#0f172a; display:flex; justify-content:center; }
  </style>
</head>
<body>
  ${megaSVG}
</body>
</html>
`);

console.log('Saved standalone mega map HTML: master_map_standalone.html');

async function exportPNG() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 3300, height: 4900, deviceScaleFactor: 1 });
  
  const fileUrl = 'file:///' + path.join(__dirname, 'master_map_standalone.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const pngPath = path.join(__dirname, 'Master_ERP_Integrated_System_Map.png');
  await page.screenshot({ path: pngPath, fullPage: true });

  console.log(`Successfully exported ultra mega high-res map image: ${pngPath}`);
  await browser.close();
}

exportPNG().catch(err => console.error('PNG Export Error:', err));
