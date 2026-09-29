import os
import asyncio
from playwright.async_api import async_playwright

HTML_SHARED_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Shared Collaboration & System Utilities Cycles - Ninja Smart Factory ERP</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #110d24;
    color: #e2e8f0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 30px;
    width: 1850px;
  }

  .container {
    background: #171233;
    border: 1px solid #3b2d71;
    border-radius: 14px;
    padding: 25px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.7);
  }

  .header {
    text-align: center;
    margin-bottom: 22px;
    padding: 20px;
    background: linear-gradient(135deg, #2e1d66, #171233);
    border-radius: 10px;
    border: 1px solid #8b5cf6;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #c084fc;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .header p {
    font-size: 15px;
    color: #e9d5ff;
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
    background: #231b4a;
    border-radius: 8px;
    overflow: hidden;
  }

  th {
    background: #3b2d71;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #8b5cf6;
  }

  td {
    padding: 10px 10px;
    border-bottom: 1px solid #3b2d71;
    font-size: 12.5px;
    vertical-align: middle;
  }

  tr:nth-child(even) {
    background: #1c153d;
  }
  tr:hover {
    background: #2f2361;
  }

  .num-badge {
    background: #6b21a8;
    color: #f3e8ff;
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
    color: #ffffff;
  }
  .cycle-cat {
    font-size: 11px;
    color: #c084fc;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(139, 92, 246, 0.2);
    border: 1px solid #8b5cf6;
    color: #e9d5ff;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    margin: 2px;
  }

  .output-cell {
    color: #f3e8ff;
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
  .target-purp {
    background: #581c87;
    border: 1px solid #a855f7;
    color: #f3e8ff;
  }
  .target-cyan {
    background: #164e63;
    border: 1px solid #06b6d4;
    color: #cffafe;
  }
  .target-amber {
    background: #713f12;
    border: 1px solid #eab308;
    color: #fef08a;
  }

  .footer-summary {
    margin-top: 18px;
    padding: 14px 20px;
    background: linear-gradient(90deg, #2e1d66, #171233);
    border-radius: 8px;
    border: 1px solid #8b5cf6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #e9d5ff;
  }
  .footer-summary b {
    color: #ffffff;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية للأدوات المشتركة والأتمتة والتعاون (Utilities & Automation)</h1>
    <p>الشات الداخلي، تبديل الورديات، إدارة مهام كانبان، العقل الذكي، الأرشيف الإلكتروني DMS، والتقويم ومتابعة الفيس بوك</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#581c87; color:#f3e8ff;">4 محاور للتعاون والأتمتة</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">12 دورة تشغيلية وتنسيقية</span>
      <span class="badge-macro" style="background:#0f766e; color:#ccfbf1;">أتمتة ذكية للعقل الذكي وقواعد الأحداث</span>
      <span class="badge-macro" style="background:#701a75; color:#f5d0fe;">الأرشيف المستندي DMS ولوحات كانبان</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3.5%;">#</th>
        <th style="width: 22%;">الدورة المشتركة والمحور</th>
        <th style="width: 24%;">الشاشات المرتبطة في النظام</th>
        <th style="width: 31%;">مخرجات وهدف الدورة التشغيلي بالمصنع</th>
        <th style="width: 19.5%;">المصب النهائي للبيانات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="num-badge">01</span></td>
        <td><span class="cycle-name">دورة البث الإداري والتعميمات المركزية</span><span class="cycle-cat">محور: التواصل والتعاون والتسويق الرقمي</span></td>
        <td><span class="screen-tag">52. الإعلانات</span><span class="screen-tag">57. الإشعارات</span></td>
        <td>نشر القرارات الإدارية، قرارات الترقيات، ومواعيد الإجازات الرسمية كشريط إخباري وإشعار فوري لجميع المستخدمين.</td>
        <td><span class="target-badge target-purp">تعميم رسمي يصل لكافة العاملين فوراً</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة المراسلات الفورية المشفرة بين الأقسام</span><span class="cycle-cat">محور: التواصل والتعاون والتسويق الرقمي</span></td>
        <td><span class="screen-tag">53. الشات الداخلي</span><span class="screen-tag">29. الموظفين</span></td>
        <td>قناة محادثة فورية مشفرة ومؤمنة بين غرف التحكم بالإنتاج، مهندسي الصيانة، وأمناء المخازن لحل معضلات التشغيل.</td>
        <td><span class="target-badge target-purp">سجل تواصل موثق داخلياً دون تطبيقات خارجية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة التقاط ومتابعة عملاء السوشيال ميديا</span><span class="cycle-cat">محور: التواصل والتعاون والتسويق الرقمي</span></td>
        <td><span class="screen-tag">64. متابعة الفيس بوك</span><span class="screen-tag">12. أوامر البيع</span></td>
        <td>استقبال استفسارات وطلبات العملاء المحتملين (Leads) من صفحات التواصل وتوزيعها على مسؤولي المبيعات للمتابعة.</td>
        <td><span class="target-badge target-cyan">تحويل العميل المحتمل لأمر بيع (12)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة تبادل الورديات التوافقي بين الفنيين</span><span class="cycle-cat">محور: المرونة التشغيلية وإدارة المهام</span></td>
        <td><span class="screen-tag">54. تبديل الورديات</span><span class="screen-tag">35. الورديات</span><span class="screen-tag">30. الحضور</span></td>
        <td>تقديم فني طلب تبادل وردية مع زميل محدد وتأكيد الطرفين وموافقة المشرف لتعديل جدول الدوام تلقائياً دون احتساب غياب.</td>
        <td><span class="target-badge">استقرار قوة العمل بالخطوط دون عجز</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة إدارة المهام التشغيلية ببطاقات كانبان</span><span class="cycle-cat">محور: المرونة التشغيلية وإدارة المهام</span></td>
        <td><span class="screen-tag">59. المهام</span><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">22. الصيانة</span></td>
        <td>لوحة كانبان تفاعلية (جديدة / قيد التنفيذ / مكتملة) لإسناد المهام الاستثنائية لفرق العمل ومراقبة نسب الإنجاز.</td>
        <td><span class="target-badge target-cyan">إنجاز المهام الاستثنائية في مواعيدها</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة المزامنة الزمنية لأحداث ومواعيد المصنع</span><span class="cycle-cat">محور: المرونة التشغيلية وإدارة المهام</span></td>
        <td><span class="screen-tag">55. التقويم</span><span class="screen-tag">15. خطة الإنتاج</span><span class="screen-tag">22. الصيانة</span></td>
        <td>تقويم صناعي مركزي يجمع مواعيد الصيانة الوقائية، مواعيد شحن البضائع، استلام الخامات، وجلسات المحاكم.</td>
        <td><span class="target-badge target-cyan">رؤية زمنية موحدة لكافة أنشطة المصنع</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة المشغلات الآلية وقواعد العقل الذكي</span><span class="cycle-cat">محور: الأتمتة الذكية والرقابة اللحظية</span></td>
        <td><span class="screen-tag">58. العقل الذكي</span><span class="screen-tag">57. الإشعارات</span></td>
        <td>محرك أتمتة يطلق إجراءات تلقائية بناءً على أحداث النظام (تنبيه عند وصول خامة لحد الخطر، إرسال إشعار تأخير).</td>
        <td><span class="target-badge target-purp">تشغيل آلي استباقي يقضي على الإهمال</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة المراقبة اللحظية لمؤشرات الأداء (KPIs)</span><span class="cycle-cat">محور: الأتمتة الذكية والرقابة اللحظية</span></td>
        <td><span class="screen-tag">56. مؤشرات الأداء</span><span class="screen-tag">2. لوحة المدير</span></td>
        <td>شاشات عرض رقمية تعرض مؤشرات الكفاءة التشغيلية OEE، معدل الهدر، نسب التحصيل، والإنتاجية لحظياً.</td>
        <td><span class="target-badge target-amber">تقييم ومحاسبة الأقسام بناءً على أرقام دقيقة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة تنبيهات الصلاحيات وانتهاء التراخيص</span><span class="cycle-cat">محور: الأتمتة الذكية والرقابة اللحظية</span></td>
        <td><span class="screen-tag">58. العقل الذكي</span><span class="screen-tag">27. الأسطول</span><span class="screen-tag">11. القانونية</span></td>
        <td>فحص مؤتمت ليلي يرصد الوثائق والتراخيص ورخص المركبات التي توشك على الانتهاء خلال 30 يوماً وتنبيه المسؤولين.</td>
        <td><span class="target-badge target-amber">تفادي توقف الشاحنات أو غرامات المصنع</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة الأرشفة الرقمية والتوثيق الإلكتروني (DMS)</span><span class="cycle-cat">محور: الأرشيف الرقمي والأمان والضبط</span></td>
        <td><span class="screen-tag">60. المستندات</span><span class="screen-tag">62. الصلاحيات</span></td>
        <td>مستودع سحابي لحفظ وتصنيف شهادات ISO، الرسومات الهندسية، سجلات الضرائب، وعقود الموردين برقم تسلسلي.</td>
        <td><span class="target-badge">أرشيف مؤسسي رقمي مفهرس وسريع البحث</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة الضبط المركزي للإعدادات والعملات</span><span class="cycle-cat">محور: الأرشيف الرقمي والأمان والضبط</span></td>
        <td><span class="screen-tag">61. الإعدادات</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td>تعريف أسعار صرف العملات الأجنبية، نسب الضرائب والقيمة المضافة، سياسات الإجازات، وإعدادات السنة المالية.</td>
        <td><span class="target-badge">قواعد أعمال موحدة ومطبقة على النظام كاملاً</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة تدقيق مصفوفة الأذونات وجلسات الدخول</span><span class="cycle-cat">محور: الأرشيف الرقمي والأمان والضبط</span></td>
        <td><span class="screen-tag">62. الصلاحيات</span><span class="screen-tag">63. سجل الدخول</span></td>
        <td>تطبيق مصفوفة أذونات الشاشات الثمانية وتدقيق جلسات الدخول المشبوهة وفرض معايير تسجيل الخروج التلقائي.</td>
        <td><span class="target-badge target-purp">بيئة برمجية آمنة ومحصنة ضد الاختراق</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> الأدوات المشتركة والعقل الذكي هي <b>المحرك الخفي الذي يربط بين جميع إدارات المصنع</b>؛ يضمن تدفق المعلومات دون جزر منعزلة ويحول النظام من برنامج تسجيل إلى نظام إدارة ذاتي القيادة.</div>
    <div style="font-weight:700; color:#c084fc;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_shared_table_image():
    html_path = os.path.abspath("ninja_shared_table.html")
    png_path = os.path.abspath("ninja_shared_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_SHARED_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1250}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Shared Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_shared_table_image())
