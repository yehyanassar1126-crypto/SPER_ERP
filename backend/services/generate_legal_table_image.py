import os
import asyncio
from playwright.async_api import async_playwright

HTML_LEGAL_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Legal Affairs & Compliance Cycles - Ninja Smart Factory ERP</title>
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
    border: 1px solid #64748b;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #94a3b8;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .header p {
    font-size: 15px;
    color: #cbd5e1;
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
    background: #334155;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #475569;
  }

  td {
    padding: 10px 10px;
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
    color: #94a3b8;
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
    color: #94a3b8;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(148, 163, 184, 0.15);
    border: 1px solid #64748b;
    color: #cbd5e1;
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
    color: #cbd5e1;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية والتنظيمية الـ 12 للشؤون القانونية والامتثال</h1>
    <p>التكامل المعماري بين إدارة العقود التجارية، التحقيقات والجزاءات، التراخيص الصناعية، حماية الملكية الفكرية، وإبراء الذمة</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#1e293b; color:#cbd5e1;">4 محاور استراتيجية كبرى</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">12 دورة تشغيلية وتنظيمية</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">امتثال لقانون العمل والتراخيص الصناعية</span>
      <span class="badge-macro" style="background:#831843; color:#fbcfe8;">إدارة النزاعات القضائية وحماية حقوق المصنع</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3.5%;">#</th>
        <th style="width: 22%;">الدورة القانونية والمحور</th>
        <th style="width: 24%;">الشاشات المرتبطة في النظام</th>
        <th style="width: 31%;">مخرجات وهدف الدورة التشغيلي بالمصنع</th>
        <th style="width: 19.5%;">المصب النهائي للبيانات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="num-badge">01</span></td>
        <td><span class="cycle-name">دورة تدقيق وصياغة العقود التجارية</span><span class="cycle-cat">محور: العقود والاتفاقيات التجارية</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">16. الموردين</span><span class="screen-tag">12. البيع</span></td>
        <td class="output-cell">مراجعة بنود التعاقد، الشروط الجزائية، فض النزاعات، والتحقق من الأهلية القانونية للموردين والعملاء.</td>
        <td><span class="target-badge">عقد تجاري رسمي موثق ومحمٍ</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة عقود العمل واتفاقيات السرية (NDA)</span><span class="cycle-cat">محور: العقود والاتفاقيات التجارية</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">29. الموظفين</span><span class="screen-tag">60. المستندات</span></td>
        <td class="output-cell">صياغة عقود العمل الفردية، وتضمين شروط عدم إفشاء أسرار التصنيع (NDA) وشرط عدم المنافسة للمهندسين.</td>
        <td><span class="target-badge">عقد عمل قانوني بملف الموظف</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة عقود الصيانة ومستويات الخدمة (SLA)</span><span class="cycle-cat">محور: العقود والاتفاقيات التجارية</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">23. شركات الصيانة</span></td>
        <td class="output-cell">صياغة عقود الصيانة مع وكلاء الماكينات وتحديد مدد الاستجابة للأعطال وغرامات التأخير عن فترات التوقف.</td>
        <td><span class="target-badge target-prod">عقد صيانة ملزم فنياً ومالياً</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة التحقيقات الإدارية والعمالية</span><span class="cycle-cat">محور: التحقيقات وقانون العمل</span></td>
        <td><span class="screen-tag">46. الشكاوى والجزاءات</span><span class="screen-tag">11. شؤون قانونية</span></td>
        <td class="output-cell">استدعاء الأطراف، سماع الأقوال وتفريغ الشهادات ومراجعة كاميرات المراقبة وسجلات النظام لإثبات المخالفة.</td>
        <td><span class="target-badge">محضر تحقيق قانوني رسمي</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة تطبيق لائحة الجزاءات المعتمدة</span><span class="cycle-cat">محور: التحقيقات وقانون العمل</span></td>
        <td><span class="screen-tag">46. الشكاوى والجزاءات</span><span class="screen-tag">37. المرتبات</span></td>
        <td class="output-cell">تكييف المخالفة طبقاً للمادة القانونية بلائحة الجزاءات المعتمدة من مكتب العمل وإقرار توقيع الخصم.</td>
        <td><span class="target-badge target-fin">خصم الجزاء بمسير الرواتب (37)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة إصدار وتوثيق الإنذارات الرسمية</span><span class="cycle-cat">محور: التحقيقات وقانون العمل</span></td>
        <td><span class="screen-tag">51. الإنذارات</span><span class="screen-tag">11. شؤون قانونية</span></td>
        <td class="output-cell">إصدار الإنذار الكتابي القانوني (أول / ثانٍ / نهائي) وإرساله بخطاب مسجل بعلم الوصول وإخطار مكتب العمل.</td>
        <td><span class="target-badge">إنذار قانوني موثق بالبريد</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة المتابعة القانونية لانقطاع العمل</span><span class="cycle-cat">محور: التحقيقات وقانون العمل</span></td>
        <td><span class="screen-tag">30. الحضور</span><span class="screen-tag">51. الإنذارات</span><span class="screen-tag">11. القانونية</span></td>
        <td class="output-cell">رصد الانقطاع (5 أيام متصلة أو 10 منفصلة)، توجيه الإنذار بعد 5 أيام، وإنهاء التعاقد بموجب المادة القانونية.</td>
        <td><span class="target-badge">إنهاء خدمة بموجب القانون</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة تجديد التراخيص الصناعية والبيئية</span><span class="cycle-cat">محور: التراخيص والامتثال الحكومي</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">55. التقويم</span><span class="screen-tag">60. المستندات</span></td>
        <td class="output-cell">متابعة مواعيد تجديد السجل الصناعي، رخصة هيئة التنمية الصناعية، الموافقات البيئية، وتفادي الغرامات.</td>
        <td><span class="target-badge">رخص صناعية وبيئية سارية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة تراخيص الدفاع المدني والسلامة</span><span class="cycle-cat">محور: التراخيص والامتثال الحكومي</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">55. التقويم</span><span class="screen-tag">41. الزي</span></td>
        <td class="output-cell">استيفاء اشتراطات الحماية المدنية، فحص شبكات الإطفاء الدورية، وتجديد شهادة استيفاء شروط السلامة السنوية.</td>
        <td><span class="target-badge">شهادة صلاحية الدفاع المدني</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة إدارة القضايا والنزاعات القضائية</span><span class="cycle-cat">محور: القضايا والتسويات ونهاية الخدمة</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">55. التقويم</span><span class="screen-tag">60. المستندات</span></td>
        <td class="output-cell">إدارة ملفات الدعاوى المرفوعة من المصنع أو ضده (عمالية، تجارية، شيكات)، وتتبع جلسات المحاكم بالتقويم.</td>
        <td><span class="target-badge">أحكام قضائية وتسويات لصالح المصنع</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة إبراء الذمة والمخالصة القانونية</span><span class="cycle-cat">محور: القضايا والتسويات ونهاية الخدمة</span></td>
        <td><span class="screen-tag">48. نهاية الخدمة</span><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">60. المستندات</span></td>
        <td class="output-cell">صياغة إقرار استلام كامل المستحقات والمخالصة النهائية لمنع رفع دعاوى قضائية لاحقة بعد ترك العمل.</td>
        <td><span class="target-badge target-fin">مخالصة وبراءة ذمة قانونية نهائية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة حماية الملكية الفكرية والعلامات</span><span class="cycle-cat">محور: العقود والاتفاقيات التجارية</span></td>
        <td><span class="screen-tag">11. شؤون قانونية</span><span class="screen-tag">20. الرسومات</span><span class="screen-tag">13. منتجات</span></td>
        <td class="output-cell">تسجيل العلامات التجارية الصناعية وبراءات الاختراع للتصاميم والقوالب الهندسية وملاحقة المقلدين.</td>
        <td><span class="target-badge">شهادات تسجيل العلامات وبراءات الاختراع</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> الشؤون القانونية هي <b>الدرع التنظيمي والحامي لحقوق المصنع</b>؛ حيث تضمن سلامة العقود وصحة إجراءات الجزاءات والتراخيص وإبراء الذمة لمنع أي مساءلة قانونية.</div>
    <div style="font-weight:700; color:#cbd5e1;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_legal_table_image():
    html_path = os.path.abspath("ninja_legal_table.html")
    png_path = os.path.abspath("ninja_legal_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_LEGAL_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1200}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Legal Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_legal_table_image())
