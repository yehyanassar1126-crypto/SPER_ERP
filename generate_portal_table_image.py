import os
import asyncio
from playwright.async_api import async_playwright

HTML_PORTAL_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Employee Self-Service Portal Cycles - Ninja Smart Factory ERP</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #042f2e;
    color: #e2e8f0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 30px;
    width: 1850px;
  }

  .container {
    background: #0f172a;
    border: 1px solid #134e4a;
    border-radius: 14px;
    padding: 25px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  }

  .header {
    text-align: center;
    margin-bottom: 22px;
    padding: 20px;
    background: linear-gradient(135deg, #115e59, #0f172a);
    border-radius: 10px;
    border: 1px solid #14b8a6;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #2dd4bf;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .header p {
    font-size: 15px;
    color: #99f6e4;
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
    background: #134e4a;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #14b8a6;
  }

  td {
    padding: 10px 10px;
    border-bottom: 1px solid #334155;
    font-size: 12.5px;
    vertical-align: middle;
  }

  tr:nth-child(even) {
    background: #162235;
  }
  tr:hover {
    background: #1e334a;
  }

  .num-badge {
    background: #0f766e;
    color: #ccfbf1;
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
    color: #5eead4;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(20, 184, 166, 0.15);
    border: 1px solid #14b8a6;
    color: #99f6e4;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    margin: 2px;
  }

  .output-cell {
    color: #e2e8f0;
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
  .target-time {
    background: #1e3a8a;
    border: 1px solid #38bdf8;
    color: #bae6fd;
  }
  .target-help {
    background: #701a75;
    border: 1px solid #d946ef;
    color: #f5d0fe;
  }

  .footer-summary {
    margin-top: 18px;
    padding: 14px 20px;
    background: linear-gradient(90deg, #115e59, #0f172a);
    border-radius: 8px;
    border: 1px solid #14b8a6;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #99f6e4;
  }
  .footer-summary b {
    color: #ffffff;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية الذاتية الـ 13 لبوابة الموظف (Employee Portal)</h1>
    <p>واجهة الخدمة الذاتية المقيدة: تسجيل البصمة الجغرافية، طلبات الإجازات والسلف، مفردات المرتب، والمطالبات الطبية وتذاكر الدعم</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#134e4a; color:#ccfbf1;">4 محاور للخدمة الذاتية</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">13 دورة ذاتية للموظف (شاشات 65 إلى 77)</span>
      <span class="badge-macro" style="background:#701a75; color:#f5d0fe;">عزل كامل للبيانات الشخصية والخصوصية</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">اعتمادات آلية دون مراجعات ورقية</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3.5%;">#</th>
        <th style="width: 22%;">الدورة الذاتية للموظف</th>
        <th style="width: 24%;">شاشة البوابة والشاشات المرتبطة</th>
        <th style="width: 31%;">مخرجات وهدف الدورة التشغيلي بالمصنع</th>
        <th style="width: 19.5%;">المصب النهائي للبيانات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="num-badge">01</span></td>
        <td><span class="cycle-name">دورة تسجيل بصمة الحضور الذكية بالـ GPS</span><span class="cycle-cat">محور: إثبات الدوام الذاتي والتحقق الجغرافي</span></td>
        <td><span class="screen-tag">67. الحضور</span><span class="screen-tag">30. الحضور العام</span></td>
        <td>تسجيل حضور الموظف عبر هاتفه المحمول مع التحقق من النطاق الجغرافي (Geofencing) لصالة ومصنع الإنتاج.</td>
        <td><span class="target-badge target-time">قيد حضور لحظي بجدول الدوام (30)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة تسجيل بصمة الانصراف عند انتهاء الوردية</span><span class="cycle-cat">محور: إثبات الدوام الذاتي والتحقق الجغرافي</span></td>
        <td><span class="screen-tag">68. الانصراف</span><span class="screen-tag">35. الورديات</span></td>
        <td>إثبات انصراف الموظف فور اكتمال ساعات الشفت الرسمية وحساب صافي الساعات الفعلية المنفذة لليوم.</td>
        <td><span class="target-badge target-time">إغلاق وردية الموظف وحساب الساعات</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة استعراض سجل الحضور والغياب الشهري</span><span class="cycle-cat">محور: إثبات الدوام الذاتي والتحقق الجغرافي</span></td>
        <td><span class="screen-tag">66. سجل حضوري</span><span class="screen-tag">30. الحضور العام</span></td>
        <td>متابعة الموظف لسجل دوامه التاريخي، أيام الحضور، الغياب، التأخيرات، والتحقق من سلامة تسجيلاته.</td>
        <td><span class="target-badge">شفافية كاملة وتقليل مراجعات HR</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة تقديم وتبرير أعذار التأخير الصباحي</span><span class="cycle-cat">محور: إثبات الدوام الذاتي والتحقق الجغرافي</span></td>
        <td><span class="screen-tag">74. تأخراتي</span><span class="screen-tag">31. سجل التأخيرات</span></td>
        <td>الاطلاع على دقائق التأخير المحتسبة ورفع عذر رسمي مدعوم بمستند (عطل مواصلات، ظرف قهري) لاعتماده.</td>
        <td><span class="target-badge target-time">إلغاء خصم التأخير بعد موافقة الإدارة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة طلب الإجازة ومتابعة الرصيد المتبقي</span><span class="cycle-cat">محور: الإجازات والوقت الإضافي والمأموريات</span></td>
        <td><span class="screen-tag">69. إجازاتي</span><span class="screen-tag">34. الإجازات (إدارية)</span></td>
        <td>معاينة رصيد الإجازات السنوية المتاح، تقديم طلب إجازة وتحديد الموظف البديل ومتابعة قبول المدير المباشر.</td>
        <td><span class="target-badge target-time">إجازة معتمدة وخصم من الرصيد السنوي</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة تسجيل واعتماد ساعات العمل الإضافي</span><span class="cycle-cat">محور: الإجازات والوقت الإضافي والمأموريات</span></td>
        <td><span class="screen-tag">71. وقتي الإضافي</span><span class="screen-tag">36. الإضافي (إداري)</span></td>
        <td>تقديم طلب احتساب ساعات إضافية تم إنجازها على الخط بعد الوردية مع بيان سبب التشغيل وموافقة المشرف.</td>
        <td><span class="target-badge target-fin">ساعات إضافي معتمدة بمسير الراتب (37)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة تقديم طلب مأمورية عمل خارجية</span><span class="cycle-cat">محور: الإجازات والوقت الإضافي والمأموريات</span></td>
        <td><span class="screen-tag">75. المأموريات (الشخصية)</span><span class="screen-tag">32. المأموريات</span></td>
        <td>تسجيل تكليف مأمورية خارجية لزيارة عميل أو مورد، وتحديد خط السير وزمن المغادرة وتكلفة الانتقال.</td>
        <td><span class="target-badge target-time">تصريح مأمورية معتمد وبدل انتقال</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة استعراض وتحميل قسيمة الراتب (Payslip)</span><span class="cycle-cat">محور: التعويضات المالية والشفافية</span></td>
        <td><span class="screen-tag">70. راتبي</span><span class="screen-tag">37. المرتبات</span></td>
        <td>عرض تفصيلي لراتب الشهر: الراتب الأساسي، البدلات، الإضافي، الحوافز، خصومات الغياب والضرائب، وصافي الراتب.</td>
        <td><span class="target-badge target-fin">قسيمة راتب إلكترونية خاصة ومحمية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة التقديم على سلفة مالية ومتابعة الأقساط</span><span class="cycle-cat">محور: التعويضات المالية والشفافية</span></td>
        <td><span class="screen-tag">72. سلفي</span><span class="screen-tag">44. السلف والقروض</span></td>
        <td>طلب سلفة مالية طارئة وتحديد عدد أشهر السداد ومتابعة المبالغ المسددة والأقساط المتبقية ذمة الموظف.</td>
        <td><span class="target-badge target-fin">جدولة خصم القسط الشهري بالراتب (44)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة رفع واسترداد المصروفات النثرية</span><span class="cycle-cat">محور: التعويضات المالية والشفافية</span></td>
        <td><span class="screen-tag">76. مصروفاتي</span><span class="screen-tag">45. المصروفات (إدارية)</span></td>
        <td>تصوير ورفع إيصالات المشتريات الطارئة أو الضيافة أو الانتقالات التي سددها الموظف لطلب رد قيمتها نقدياً.</td>
        <td><span class="target-badge target-fin">إذن صرف نقدي معتمد من المالية (45)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة المطالبات والتعويضات الطبية</span><span class="cycle-cat">محور: الرعاية الصحية والدعم الرقمي</span></td>
        <td><span class="screen-tag">73. الاحتياجات الطبية</span><span class="screen-tag">42. الطلبات الطبية</span></td>
        <td>رفع روشتات الأدوية وفواتير التحاليل والعيادات الخارجية لطلب التعويض المالي أو صرف العلاج من العيادة.</td>
        <td><span class="target-badge">اعتماد تعويض طبي بصندوق العلاج (43)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة إدارة الملف الشخصي ووثائق الموظف</span><span class="cycle-cat">محور: الرعاية الصحية والدعم الرقمي</span></td>
        <td><span class="screen-tag">65. ملف شخصي</span><span class="screen-tag">29. الموظفين</span></td>
        <td>تحديث أرقام الهواتف، العنوان، الحساب البنكي، رفع شهادات الدورات التدريبية وتغيير كلمة السر بأمان.</td>
        <td><span class="target-badge">تحديث لحظي لملف الموظف بـ HR</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة فتح ومتابعة تذاكر الدعم الفني</span><span class="cycle-cat">محور: الرعاية الصحية والدعم الرقمي</span></td>
        <td><span class="screen-tag">77. دعم فني</span><span class="screen-tag">57. الإشعارات</span></td>
        <td>الإبلاغ عن أعطال أجهزة الحاسب، بطء النظام، طابعات الباركود، ومتابعة حل التذكرة مع مهندس الـ IT.</td>
        <td><span class="target-badge target-help">تذكرة مغلقة وحل المشكلة التقنية</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> بوابة الموظف تعتمد سياسة <b>Strict Row-Level Security (RLS)</b>؛ لا يرى الموظف سوى بياناته الخاصة وتمر طلباته بسلسلة اعتمادات هرمية آلية تلغي 100% من المعاملات الورقية.</div>
    <div style="font-weight:700; color:#2dd4bf;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_portal_table_image():
    html_path = os.path.abspath("ninja_portal_table.html")
    png_path = os.path.abspath("ninja_portal_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_PORTAL_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1300}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Portal Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_portal_table_image())
