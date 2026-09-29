import os
import asyncio
from playwright.async_api import async_playwright

HTML_MAINT_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Plant Maintenance & Asset Reliability Cycles - Ninja Smart Factory ERP</title>
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
    border: 1px solid #ef4444;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #f87171;
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
    background: #991b1b;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #b91c1c;
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
    color: #f87171;
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
    color: #f87171;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid #ef4444;
    color: #fca5a5;
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
    color: #f87171;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية والهندسية الـ 14 لإدارة الصيانة والأصول</h1>
    <p>التكامل المعماري بين صيانة المعدات، إدارة قطع الغيار، مقاولي الصيانة، وحساب مؤشرات الموثوقية (MTBF / MTTR)</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#7f1d1d; color:#fecaca;">4 محاور استراتيجية كبرى</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">14 دورة تشغيلية وهندسية</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">صيانة وقائية وتنبؤية (TPM / PdM)</span>
      <span class="badge-macro" style="background:#713f12; color:#fde68a;">حساب موثوقية الماكينات (MTBF / MTTR)</span>
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
        <td><span class="cycle-name">دورة تسجيل وتكويد أصول المعدات</span><span class="cycle-cat">محور: إدارة الأصول وسجل الماكينات</span></td>
        <td><span class="screen-tag">24. المعدات</span><span class="screen-tag">20. الرسومات</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">إنشاء السجل الرقمي لكل ماكينة (كود الأصل، الرقم المسلسل، الموديل، الخط، تاريخ التوريد، والقدرة).</td>
        <td><span class="target-badge">بطاقة الأصل والماكينة (24)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة المخططات الفنية وكتالوجات التشغيل</span><span class="cycle-cat">محور: إدارة الأصول وسجل الماكينات</span></td>
        <td><span class="screen-tag">20. المشاريع والرسومات</span><span class="screen-tag">24. المعدات</span></td>
        <td class="output-cell">أرشفة المخططات الكهربائية والميكانيكية وكتالوجات قطع الغيار (Spare Parts Manuals) للرجوع السريع.</td>
        <td><span class="target-badge">الملف الفني الهندسي للماكينة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة جدولة الصيانة الوقائية (PM)</span><span class="cycle-cat">محور: الصيانة الوقائية والتنبؤية</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">24. المعدات</span><span class="screen-tag">55. التقويم</span></td>
        <td class="output-cell">برمجة خطط التفتيش الدوري وفحص السيور والتروس والفلاتر أسبوعياً وشهرياً لمنع الأعطال المفاجئة.</td>
        <td><span class="target-badge">جدول الصيانة الدورية بالتقويم</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة التزييت والتشحيم الدورية</span><span class="cycle-cat">محور: الصيانة الوقائية والتنبؤية</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">24. المعدات</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">تنفيذ مسارات التشحيم المجدولة للرولمان بلي والمحركات وصرف الزيوت والشحوم المحددة من المخزن.</td>
        <td><span class="target-badge target-prod">إذن استهلاك الزيوت والشحوم</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة الصيانة التنبؤية وساعات التشغيل</span><span class="cycle-cat">محور: الصيانة الوقائية والتنبؤية</span></td>
        <td><span class="screen-tag">24. المعدات</span><span class="screen-tag">58. العقل الذكي</span><span class="screen-tag">22. الصيانة</span></td>
        <td class="output-cell">مراقبة عدادات ساعات تشغيل الماكينة وإطلاق تنبيه ذكي لاستبدال القطع المستهلكة قبل كسرها.</td>
        <td><span class="target-badge target-prod">تنبيه صيانة استباقي ذكي</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة بلاغات الأعطال والإصلاح الطارئ (CM)</span><span class="cycle-cat">محور: الصيانة العلاجية والطارئة</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">58. العقل الذكي</span></td>
        <td class="output-cell">إرسال بلاغ عطل فوري من المشغل على الخط إلى قسم الصيانة، وتوثيق وقت التوقف وبدء الاستجابة.</td>
        <td><span class="target-badge">تذكرة عطل طارئ مفتوحة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة تفعيل أمر شغل الصيانة (WO)</span><span class="cycle-cat">محور: الصيانة العلاجية والطارئة</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">24. المعدات</span></td>
        <td class="output-cell">إصدار أمر الشغل وتكليف الفنيين المتخصصين (ميكانيكا/كهرباء/هيدروليك) وتحديد خطوات الإصلاح.</td>
        <td><span class="target-badge target-prod">أمر صيانة نشط قيد التنفيذ</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة طلب وصرف واسترجاع قطع الغيار</span><span class="cycle-cat">محور: قطع الغيار والتكاليف</span></td>
        <td><span class="screen-tag">25. دورة قطع الغيار</span><span class="screen-tag">6. المخازن</span><span class="screen-tag">22. الصيانة</span></td>
        <td class="output-cell">صرف قطع الغيار الجديدة من مخزن الصيانة، واسترجاع القطع التالفة لتسجيلها خردة أو إعادة تأهيلها.</td>
        <td><span class="target-badge target-fin">تحميل تكلفة القطع على الماكينة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة مراقبة قطع الغيار الحرجة (Min/Max)</span><span class="cycle-cat">محور: قطع الغيار والتكاليف</span></td>
        <td><span class="screen-tag">25. دورة قطع الغيار</span><span class="screen-tag">6. مخازن</span><span class="screen-tag">7. الشراء</span></td>
        <td class="output-cell">مراقبة حدود الأمان لقطع الغيار الحيوية (المحركات، الحساسات، البلوف) وتوليد طلب شراء فوسفوري.</td>
        <td><span class="target-badge">طلب شراء قطع غيار حرج (7)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة تكليف مقاولي الصيانة الخارجيين</span><span class="cycle-cat">محور: الصيانة العلاجية والطارئة</span></td>
        <td><span class="screen-tag">23. شركات الصيانة</span><span class="screen-tag">22. الصيانة</span><span class="screen-tag">7. الشراء</span></td>
        <td class="output-cell">استدعاء وكلاء الماكينات المعتمدين للأعطال المعقدة وفق عقود الصيانة (SLA)، ومتابعة تقرير الزيارة.</td>
        <td><span class="target-badge target-fin">فاتورة مقاول صيانة معتمدة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة اختبار الماكينة وإعادة التشغيل</span><span class="cycle-cat">محور: الصيانة العلاجية والطارئة</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">24. المعدات</span><span class="screen-tag">17. الإنتاج</span></td>
        <td class="output-cell">تشغيل تجريبي للماكينة بعد الإصلاح والتأكد من مطابقة حرارة وسرعة التشغيل قبل تسليمها للإنتاج.</td>
        <td><span class="target-badge target-prod">إذن تسليم ماكينة صالحة للتشغيل</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة إغلاق أمر الصيانة وحساب التوقف</span><span class="cycle-cat">محور: الصيانة العلاجية والطارئة</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">24. المعدات</span><span class="screen-tag">17. الإنتاج</span></td>
        <td class="output-cell">إغلاق التذكرة رسمياً، وتوثيق زمن التوقف الكلي (Downtime Hours) وتصنيف السبب الجذري للعطل.</td>
        <td><span class="target-badge">سجل التوقفات الفعلي للخط</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة حساب وتوزيع تكاليف الصيانة</span><span class="cycle-cat">محور: قطع الغيار والتكاليف</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">25. قطع الغيار</span><span class="screen-tag">3. التكلفة</span></td>
        <td class="output-cell">تجميع تكلفة الإصلاح (قطع غيار + زيوت + ساعات عمل الفنيين + فواتير الشركات) وتحميلها على مركز التكلفة.</td>
        <td><span class="target-badge target-fin">قيد مصروفات الصيانة بالدفتر العام</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">14</span></td>
        <td><span class="cycle-name">دورة قياس مؤشرات موثوقية الماكينات</span><span class="cycle-cat">محور: قطع الغيار والتكاليف</span></td>
        <td><span class="screen-tag">56. مؤشرات الأداء</span><span class="screen-tag">2. لوحة المدير</span><span class="screen-tag">22. الصيانة</span></td>
        <td class="output-cell">حساب متوسط الوقت بين الأعطال (MTBF) ومتوسط زمن الإصلاح (MTTR) ونسبة مساهمة الصيانة في رفع OEE.</td>
        <td><span class="target-badge">مؤشرات موثوقية الأصول (KPIs)</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> الصيانة هي <b>ضامن الجاهزية والإنتاجية (Asset Availability)</b>؛ حيث تربط بين سجلات المعدات، استهلاك قطع الغيار، ومؤشرات MTBF/MTTR لرفع كفاءة المصنع الكلية.</div>
    <div style="font-weight:700; color:#f87171;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_maint_table_image():
    html_path = os.path.abspath("ninja_maint_table.html")
    png_path = os.path.abspath("ninja_maintenance_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_MAINT_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1250}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Maintenance Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_maint_table_image())
