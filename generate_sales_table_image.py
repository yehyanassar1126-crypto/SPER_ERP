import os
import asyncio
from playwright.async_api import async_playwright

HTML_SALES_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Sales & Customer Care Cycles - Ninja Smart Factory ERP</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #0b1120;
    color: #e2e8f0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 30px;
    width: 1800px;
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
    border: 1px solid #8b5cf6;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #c4b5fd;
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
    background: #5b21b6;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #7c3aed;
  }

  td {
    padding: 9.5px 10px;
    border-bottom: 1px solid #334155;
    font-size: 12.5px;
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
    color: #c4b5fd;
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
    color: #c4b5fd;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(139, 92, 246, 0.15);
    border: 1px solid #8b5cf6;
    color: #c4b5fd;
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
    color: #c4b5fd;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية الـ 14 للمبيعات وخدمة العملاء</h1>
    <p>التكامل المعماري بين استقطاب العملاء، حجز المخزون، إطلاق أوامر التصنيع (MTO)، والفوترة والتحصيل</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#4c1d95; color:#ddd6fe;">4 محاور استراتيجية كبرى</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">14 دورة تشغيلية متكاملة</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">تصنيع حسب الطلب (Make-to-Order Trigger)</span>
      <span class="badge-macro" style="background:#713f12; color:#fde68a;">بوابة عملاء ذكية وتتبع لحظي (Customer Portal)</span>
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
        <td><span class="cycle-name">دورة استقطاب العملاء من السوشيال ميديا</span><span class="cycle-cat">محور: التسويق واستقطاب العملاء</span></td>
        <td><span class="screen-tag">64. متابعة الفيس بوك</span><span class="screen-tag">13. منتجات</span></td>
        <td class="output-cell">استقبال طلبات واستفسارات العملاء الواردة من الحملات الإعلانية وتحويلها لفرص بيعية (Leads) ومتابعتها.</td>
        <td><span class="target-badge">قائمة العملاء المحتملين</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة تسجيل وتأهيل العملاء الجدد</span><span class="cycle-cat">محور: التسويق واستقطاب العملاء</span></td>
        <td><span class="screen-tag">14. طلبات التسجيل</span><span class="screen-tag">28. بوابة العملاء</span></td>
        <td class="output-cell">مراجعة بيانات تسجيل العميل الذاتي عبر البوابة (السجل التجاري، البطاقة الضريبية)، وتفعيل حسابه.</td>
        <td><span class="target-badge">سجل العملاء المعتمدين</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة إدارة سقف الائتمان والشروط المالية</span><span class="cycle-cat">محور: التسويق واستقطاب العملاء</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">تحديد سقف الائتمان المالي للعميل، فحص المديونيات السابقة، وتحديد شروط الدفع وفترات السماح.</td>
        <td><span class="target-badge target-fin">الحد الائتماني بالمالية (8)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة إعداد وتتبع عروض الأسعار</span><span class="cycle-cat">محور: التعاقد وأوامر البيع</span></td>
        <td><span class="screen-tag">عروض الأسعار</span><span class="screen-tag">13. منتجات</span></td>
        <td class="output-cell">إصدار عروض أسعار رسمية متضمنة المواصفات الفنية، الكميات، نسب الخصم المعتمدة، وفترة صلاحية العرض.</td>
        <td><span class="target-badge">عرض سعر رسمي للعميل</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة إصدار واعتماد أوامر البيع (SO)</span><span class="cycle-cat">محور: التعاقد وأوامر البيع</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">13. منتجات</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">تحويل العرض المقبول إلى أمر بيع مؤكد، التحقق من الموقف الائتماني، وتثبيت الأسعار ومواعيد التسليم.</td>
        <td><span class="target-badge">أمر بيع ملزم ومعتمد (12)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة حجز أرصدة المخزون التام</span><span class="cycle-cat">محور: التنسيق مع المخازن والإنتاج</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">6. مخازن التام</span></td>
        <td class="output-cell">فحص توافر المنتج في مخزن التام وحجز الكميات المطلوبة فوراً لمنع بيعها لعميل آخر.</td>
        <td><span class="target-badge">حجز الرصيد بمخزن التام (6)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة إطلاق أوامر التصنيع (Make-to-Order)</span><span class="cycle-cat">محور: التنسيق مع المخازن والإنتاج</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">15. خطة الإنتاج</span><span class="screen-tag">17. أوامر الإنتاج</span></td>
        <td class="output-cell">في حال عدم كفاية المخزون الجاهز، يطلق النظام أمر تشغيل فوري لخطوط الإنتاج لجدولة التصنيع.</td>
        <td><span class="target-badge target-prod">أمر إنتاج مرتبط بالطلب (17)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة تتبع مراحل تنفيذ طلبات العملاء</span><span class="cycle-cat">محور: التنسيق مع المخازن والإنتاج</span></td>
        <td><span class="screen-tag">19. تتبع</span><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">28. بوابة العملاء</span></td>
        <td class="output-cell">متابعة مسار تصنيع الأوردر عبر محطات التشغيل واختبارات الجودة، وعرض نسبة الإنجاز للعميل بالبوابة.</td>
        <td><span class="target-badge">تحديث حالة الطلب لحظياً</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة التوزيع والشحن اللوجستي للعميل</span><span class="cycle-cat">محور: الشحن والفوترة وما بعد البيع</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">26. حركة العربيات</span><span class="screen-tag">27. الأسطول</span></td>
        <td class="output-cell">إصدار أذون صرف وشحن البضاعة، تعيين سيارة من الأسطول والسائق، ومتابعة تسليم الطلبية لمقر العميل.</td>
        <td><span class="target-badge">إذن تسليم بضاعة للعميل</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة بوابة الخدمة الذاتية للعملاء</span><span class="cycle-cat">محور: التسويق واستقطاب العملاء</span></td>
        <td><span class="screen-tag">28. بوابة العملاء</span><span class="screen-tag">12. أوامر البيع</span></td>
        <td class="output-cell">تمكين العميل من متابعة طلبياته، تحميل الفواتير الضريبية، الاطلاع على كشف حسابه، وطلب عروض جديدة.</td>
        <td><span class="target-badge">تجربة عميل ذاتية شفافة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة الفوترة الضريبية للمبيعات</span><span class="cycle-cat">محور: الشحن والفوترة وما بعد البيع</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">إصدار الفاتورة الضريبية المعتمدة فور تسليم البضاعة، متضمنة ضريبة القيمة المضافة وتكلفة الشحن.</td>
        <td><span class="target-badge target-fin">قيد إثبات المديونية والإيراد (8)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة تحصيل مستحقات العملاء</span><span class="cycle-cat">محور: الشحن والفوترة وما بعد البيع</span></td>
        <td><span class="screen-tag">8. الإدارة المالية</span><span class="screen-tag">12. أوامر البيع</span></td>
        <td class="output-cell">متابعة آجال استحقاق الفواتير، التحصيل عبر التحويلات البنكية أو الشيكات الآجلة، وتحديث رصيد العميل.</td>
        <td><span class="target-badge target-fin">قيد التحصيل وإقفال الفاتورة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة مرتجعات المبيعات وفحص الجودة</span><span class="cycle-cat">محور: الشحن والفوترة وما بعد البيع</span></td>
        <td><span class="screen-tag">مرتجعات المبيعات</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">استقبال مرتجعات البضاعة من العميل، إخضاعها لإعادة فحص الجودة لتحديد العيب، وإصدار إشعار دائن للعميل.</td>
        <td><span class="target-badge target-fin">إشعار دائن وتخفيض مديونية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">14</span></td>
        <td><span class="cycle-name">دورة الحوافز وتسويات الخصم التجاري</span><span class="cycle-cat">محور: الشحن والفوترة وما بعد البيع</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">حساب بونص الكميات السنوي للعملاء المميزين (Rebates) وتطبيق إشعارات الخصم المعتمدة بحساباتهم.</td>
        <td><span class="target-badge target-fin">تسوية ختامية لحساب العميل</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> تمثل دورة المبيعات شرارة بدء التشغيل للمصنع عبر ميزة <b>(Demand-Driven Manufacturing)</b>؛ فأمر البيع يطلق خطة الإنتاج ويحرك الأسطول والمخازن والمالية آلياً.</div>
    <div style="font-weight:700; color:#c4b5fd;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_sales_table_image():
    html_path = os.path.abspath("ninja_sales_table.html")
    png_path = os.path.abspath("ninja_sales_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_SALES_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1850, "height": 1250}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Sales Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_sales_table_image())
