import os
import asyncio
from playwright.async_api import async_playwright

HTML_PROD_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Production & Operations Cycles - Ninja Smart Factory ERP</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0b1120;
    color: #e2e8f0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 30px;
    width: 1850px;
  }

  .container {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 25px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  }

  .header {
    text-align: center;
    margin-bottom: 22px;
    padding: 20px;
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 10px;
    border: 1px solid #f59e0b;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #fbbf24;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .header p {
    font-size: 15px;
    color: #94a3b8;
    font-weight: 600;
  }

  .badge-bar {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
  }
  .badge-macro {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background: #1e293b;
    border-radius: 8px;
    overflow: hidden;
  }

  th {
    background: #b45309;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #d97706;
  }

  td {
    padding: 8.8px 10px;
    border-bottom: 1px solid #334155;
    font-size: 12.3px;
    vertical-align: middle;
  }

  tr:nth-child(even) {
    background: #162032;
  }
  tr:hover {
    background: #1e2d42;
  }

  .num-badge {
    background: #334155;
    color: #fbbf24;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 12px;
    text-align: center;
    display: inline-block;
  }

  .cycle-name {
    font-weight: 800;
    font-size: 13.5px;
    color: #f8fafc;
  }
  .cycle-cat {
    font-size: 11px;
    color: #fbbf24;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid #f59e0b;
    color: #fbbf24;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    margin: 2px;
  }

  .output-cell {
    color: #cbd5e1;
    line-height: 1.35;
    font-size: 12px;
  }

  .target-badge {
    display: inline-block;
    background: #064e3b;
    border: 1px solid #10b981;
    color: #a7f3d0;
    padding: 3px 8px;
    border-radius: 5px;
    font-size: 11.5px;
    font-weight: 700;
  }
  .target-fin {
    background: #713f12;
    border: 1px solid #eab308;
    color: #fef08a;
  }
  .target-prod {
    background: #1e3a8a;
    border: 1px solid #38bdf8;
    color: #bae6fd;
  }

  .footer-summary {
    margin-top: 18px;
    padding: 14px 20px;
    background: linear-gradient(90deg, #1e293b, #0f172a);
    border-radius: 8px;
    border: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #94a3b8;
  }
  .footer-summary b {
    color: #fbbf24;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية والهندسية الـ 16 لقطاع الإنتاج</h1>
    <p>التكامل المعماري بين تخطيط الاحتياجات (MRP)، شجرة المنتج (BOM)، تشغيل الخطوط، حصر الهدر، ومؤشر OEE</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#78350f; color:#fef3c7;">5 أقسام تخصصية للإنتاج</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">16 دورة تشغيلية وهندسية</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">تخطيط طاقة الماكينات (Capacity & Routing)</span>
      <span class="badge-macro" style="background:#831843; color:#fbcfe8;">إقفال تكلفة أوامر الشغل (Work Order Costing)</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3.5%;">#</th>
        <th style="width: 22%;">الدورة التشغيلية والمحور</th>
        <th style="width: 24%;">الشاشات المرتبطة في النظام</th>
        <th style="width: 31%;">مخرجات وهدف الدورة التشغيلي بالمصنع</th>
        <th style="width: 19.5%;">المصب النهائي للبيانات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="num-badge">01</span></td>
        <td><span class="cycle-name">دورة إعداد وتعديل شجرة المنتج (BOM)</span><span class="cycle-cat">محور: التصميم والهندسة الفنية</span></td>
        <td><span class="screen-tag">18. مكونات المنتج</span><span class="screen-tag">13. منتجات</span><span class="screen-tag">20. الرسومات</span></td>
        <td class="output-cell">تعريف المكونات المعيارية ونسب الخامات وهدر التشغيل المسموح لكل وحدة منتجة وحفظ إصداراتها.</td>
        <td><span class="target-badge">معيار صرف الخامات والتكاليف</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة المخططات الهندسية والتعديل (ECO)</span><span class="cycle-cat">محور: التصميم والهندسة الفنية</span></td>
        <td><span class="screen-tag">20. المشاريع والرسومات</span><span class="screen-tag">18. BOM</span></td>
        <td class="output-cell">أرشفة تصاميم CAD وتوثيق أوامر التعديل الهندسي (Engineering Change Order) واعتمادها فنياً.</td>
        <td><span class="target-badge">ملف الرسم المعتمد للماكينة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة الجدولة الرئيسية للإنتاج (MPS)</span><span class="cycle-cat">محور: تخطيط الطاقة وجدولة الموارد</span></td>
        <td><span class="screen-tag">15. خطة الإنتاج</span><span class="screen-tag">12. البيع</span><span class="screen-tag">24. المعدات</span></td>
        <td class="output-cell">تحويل طلبيات البيع إلى خطة إنتاج شهرية وأسبوعية متوازنة وتوزيع الكميات على الخطوط المتاحة.</td>
        <td><span class="target-badge target-prod">الخطة الإنتاجية المعتمدة (15)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة تخطيط الاحتياج من المواد (MRP)</span><span class="cycle-cat">محور: تخطيط الطاقة وجدولة الموارد</span></td>
        <td><span class="screen-tag">15. خطة الإنتاج</span><span class="screen-tag">18. BOM</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">حساب صافي احتياجات الخامات بمطابقة الخطة مع المخزون المتاح، وتوليد طلبات شراء للمواد الناقصة.</td>
        <td><span class="target-badge">طلبات شراء خامات آلية (7)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة جدولة الماكينات ومحطات العمل</span><span class="cycle-cat">محور: تخطيط الطاقة وجدولة الموارد</span></td>
        <td><span class="screen-tag">15. خطة الإنتاج</span><span class="screen-tag">24. المعدات</span><span class="screen-tag">55. التقويم</span></td>
        <td class="output-cell">موازنة أحمال الخطوط (Line Balancing)، تحديد أوقات البدء والانتهاء، وتفادي فترات الصيانة المجدولة.</td>
        <td><span class="target-badge">جدول تشغيل عنابر المصنع</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة تعيين أطقم التشغيل والورديات</span><span class="cycle-cat">محور: تخطيط الطاقة وجدولة الموارد</span></td>
        <td><span class="screen-tag">35. الورديات</span><span class="screen-tag">54. تبديل الورديات</span><span class="screen-tag">17. الإنتاج</span></td>
        <td class="output-cell">تسكين العمال والفنيين المؤهلين على ماكينات الوردية لضمان اكتمال الطاقم الفني وتفادي نقص العمالة.</td>
        <td><span class="target-badge">جدول وردية تشغيل الماكينة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة إصدار وتفعيل أمر الإنتاج (WO)</span><span class="cycle-cat">محور: التنفيذ على أرضية المصنع</span></td>
        <td><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">15. خطة الإنتاج</span></td>
        <td class="output-cell">إصدار بطاقة الشغل الرسمية متضمنة: كود المنتج، الكمية المطلوبة، الماكينة المحددة، وزمن الدورة المعياري.</td>
        <td><span class="target-badge target-prod">أمر إنتاج نشط بالأرضية (17)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة طلب وصرف خامات التشغيل</span><span class="cycle-cat">محور: التنفيذ على أرضية المصنع</span></td>
        <td><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">18. BOM</span><span class="screen-tag">6. المخازن</span></td>
        <td class="output-cell">إرسال إذن صرف الخامات لمخزن الخام بناءً على كميات الـ BOM المحددة، وتحويلها لساحة الخط.</td>
        <td><span class="target-badge target-fin">قيد خامات قيد التشغيل (WIP)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة إعداد الماكينة وفحص أول قطعة (FAI)</span><span class="cycle-cat">محور: التنفيذ على أرضية المصنع</span></td>
        <td><span class="screen-tag">24. المعدات</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">17. الإنتاج</span></td>
        <td class="output-cell">تركيب القالب والمعايرة، تشغيل تجريبي، وفحص أول عينة بواسطة الجودة قبل اعتماد التشغيل المستمر.</td>
        <td><span class="target-badge">إذن انطلاق خط الإنتاج</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة تسجيل المخرجات وساعات التشغيل</span><span class="cycle-cat">محور: التنفيذ على أرضية المصنع</span></td>
        <td><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">19. تتبع</span><span class="screen-tag">30. الحضور</span></td>
        <td class="output-cell">تسجيل الكميات المنجزة كل وردية، عدادات الإنتاج، ساعات عمل الماكينة، وساعات العمالة المباشرة.</td>
        <td><span class="target-badge target-prod">إثبات الإنجاز الفعلي لأمر الشغل</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة إدارة التوقفات والأعطال الطارئة</span><span class="cycle-cat">محور: التنفيذ على أرضية المصنع</span></td>
        <td><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">22. الصيانة</span><span class="screen-tag">58. العقل الذكي</span></td>
        <td class="output-cell">تسجيل توقف الماكينة فوراً، تحديد السبب (عطل ميكانيكي، انقطاع كهرباء، نقص خامة)، واستدعاء الصيانة.</td>
        <td><span class="target-badge">سجل التوقفات وحساب Downtime</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة التتبع اللحظي للوتات والباركود</span><span class="cycle-cat">محور: المخرجات والرقابة والهدر</span></td>
        <td><span class="screen-tag">19. تتبع</span><span class="screen-tag">17. أوامر الإنتاج</span></td>
        <td class="output-cell">ربط القطع المنتجة برقم أمر الشغل، اللوت، الماكينة، وتاريخ وساعة الإنتاج لضمان التتبع الشامل.</td>
        <td><span class="target-badge">باركود وسيريال المنتج التام</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة حصر وفرز الهدر والتالف الصناعي</span><span class="cycle-cat">محور: المخرجات والرقابة والهدر</span></td>
        <td><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">18. BOM</span></td>
        <td class="output-cell">حصر المعيب أثناء التشغيل، مقارنته بنسبة الهدر المسموح في الـ BOM، وتحديد أسباب الزيادة لاتخاذ إجراء.</td>
        <td><span class="target-badge target-fin">تحميل تكلفة الهدر ومحاضر التالف</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">14</span></td>
        <td><span class="cycle-name">دورة استلام وتسليم المنتج التام للمخازن</span><span class="cycle-cat">محور: المخرجات والرقابة والهدر</span></td>
        <td><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">6. مخازن التام</span></td>
        <td class="output-cell">إجراء الفحص النهائي وتسليم البضاعة الجاهزة لمخزن الإنتاج التام بإذن استلام معتمد لخدمة المبيعات.</td>
        <td><span class="target-badge">زيادة رصيد مخزن التام (6)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">15</span></td>
        <td><span class="cycle-name">دورة إقفال أمر الشغل واحتساب التكاليف</span><span class="cycle-cat">محور: المخرجات والرقابة والهدر</span></td>
        <td><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">3. تكلفة الإدارات</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">إغلاق أمر الإنتاج وحساب تكلفة الوحدة النهائية شاملة (خامات مباشرة + أجور عمالة + استهلاك ماكينات FOH).</td>
        <td><span class="target-badge target-fin">إقفال حساب WIP وترحيل التكلفة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">16</span></td>
        <td><span class="cycle-name">دورة قياس فاعلية المعدات الشاملة (OEE)</span><span class="cycle-cat">محور: المخرجات والرقابة والهدر</span></td>
        <td><span class="screen-tag">56. مؤشرات الأداء</span><span class="screen-tag">2. لوحة المدير</span><span class="screen-tag">24. المعدات</span></td>
        <td class="output-cell">حساب مؤشر OEE رياضياً بضرب (نسبة الجاهزية Availability × معدل الأداء Performance × نسبة الجودة Quality).</td>
        <td><span class="target-badge">مؤشر كفاءة المصنع الشاملة OEE %</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> الإنتاج هو <b>قلب المصنع الصناعي</b>؛ حيث يربط الخامات المستهلكة بساعات تشغيل الماكينات وأجور العمالة ليفرز المنتج النهائي وتكلفته الدقيقة بدعم من مؤشر OEE.</div>
    <div style="font-weight:700; color:#fbbf24;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_prod_table_image():
    html_path = os.path.abspath("ninja_prod_table.html")
    png_path = os.path.abspath("ninja_production_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_PROD_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1350}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Production Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_prod_table_image())
