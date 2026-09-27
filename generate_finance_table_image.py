import os
import asyncio
from playwright.async_api import async_playwright

HTML_FINANCE_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Finance & Accounting Cycles Matrix - Ninja Smart Factory ERP</title>
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
    border: 1px solid #eab308;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #facc15;
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
    background: #854d0e;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #ca8a04;
  }

  td {
    padding: 8.5px 10px;
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
    color: #facc15;
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
    color: #facc15;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid #38bdf8;
    color: #38bdf8;
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

  .entry-box {
    background: #090d16;
    border: 1px solid #334155;
    border-radius: 5px;
    padding: 5px 8px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 11px;
    color: #a7f3d0;
    line-height: 1.4;
  }
  .entry-box b {
    color: #38bdf8;
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
    color: #facc15;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات المحاسبية والتشغيلية الـ 17 للإدارة المالية</h1>
    <p>التكامل المحاسبي، قيود الترحيل التلقائي، ومسارات الربط بين الحركات الصناعية والدفتر العام (General Ledger)</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#713f12; color:#fef08a;">5 محاور استراتيجية كبرى</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">17 دورة محاسبية وتشغيلية</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">ترحيل آلي للقيود (Event-Driven Auto-Posting)</span>
      <span class="badge-macro" style="background:#4c1d95; color:#e9d5ff;">ربط لحظي بشجرة الحسابات ومراكز التكلفة</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3.5%;">#</th>
        <th style="width: 20%;">الدورة المحاسبية والمحور</th>
        <th style="width: 22%;">الشاشات المرتبطة في النظام</th>
        <th style="width: 29.5%;">الوظيفة المحاسبية والتأثير التشغيلي بالمصنع</th>
        <th style="width: 25%;">نوع القيد المحاسبي المتولد (Journal Entry)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="num-badge">01</span></td>
        <td><span class="cycle-name">دورة شجرة الحسابات والهيكل المالي</span><span class="cycle-cat">محور: الدفتر العام والتقارير</span></td>
        <td><span class="screen-tag">9. شجرة الحسابات</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">بناء الدليل المحاسبي الهرمي وتوصيف الحسابات (أصول، خصوم، ملكية، إيرادات، تكاليف، مصروفات).</td>
        <td><div class="entry-box">هيكل تعريفي مركزي لا يولد قيوداً بل يربط كافة المعاملات</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة قيود اليومية والدفتر العام (GL)</span><span class="cycle-cat">محور: الدفتر العام والتقارير</span></td>
        <td><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">إثبات وتدقيق قيود اليومية اليدوية والآلية، استعراض ميزان المراجعة، وإجراء قيود التسويات.</td>
        <td><div class="entry-box"><b>من حـ/</b> الحساب المدين<br><b>إلى حـ/</b> الحساب الدائن</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة مبيعات العملاء والتحصيل (O2C)</span><span class="cycle-cat">محور: العملاء والمبيعات</span></td>
        <td><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">إصدار الفواتير الضريبية، مراقبة حدود الائتمان، وإثبات التحصيلات النقدية والشيكات للعملاء.</td>
        <td><div class="entry-box"><b>من حـ/</b> العملاء (أو البنك)<br><b>إلى حـ/</b> إيرادات المبيعات + ضريبة القيمة المضافة</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة المشتريات والموردين (P2P)</span><span class="cycle-cat">محور: المشتريات والموردين</span></td>
        <td><span class="screen-tag">7. طلبات شراء</span><span class="screen-tag">16. الموردين</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">المطابقة الثلاثية (أمر شراء + إذن استلام مخزن + فاتورة مورد) وجدولة الدفعات والشيكات.</td>
        <td><div class="entry-box"><b>من حـ/</b> المخزن أو المشتريات + الضريبة<br><b>إلى حـ/</b> الموردين (أو أوراق الدفع)</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة تقييم المخزون وتكلفة البضاعة (COGS)</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">18. مكونات المنتج</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">حساب متوسط التكلفة المرجح، وتوليد تكلفة البضاعة المباعة فور خروج البضاعة للعميل.</td>
        <td><div class="entry-box"><b>من حـ/</b> تكلفة البضاعة المباعة (COGS)<br><b>إلى حـ/</b> مخزون الإنتاج التام</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة تكاليف الإنتاج والتشغيل (WIP)</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">18. BOM</span><span class="screen-tag">3. تكلفة الإدارات</span></td>
        <td class="output-cell">تجميع تكاليف أمر الشغل: خامات مباشرة منصرفة + أجور عمالة مباشرة + تكاليف صناعية غير مباشرة (FOH).</td>
        <td><div class="entry-box"><b>من حـ/</b> الإنتاج تحت التشغيل (WIP)<br><b>إلى مذكورين:</b> مخزن الخامات + الأجور المباشرة</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة استلام الإنتاج التام وإقفال الأمر</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">17. أوامر الإنتاج</span><span class="screen-tag">6. مخازن التام</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">تحويل تكلفة أمر الشغل المكتمل من حساب التشغيل لمخزن التام وحساب تكلفة الوحدة المصنعة.</td>
        <td><div class="entry-box"><b>من حـ/</b> مخزن الإنتاج التام<br><b>إلى حـ/</b> الإنتاج تحت التشغيل (WIP)</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة مراكز التكلفة وتوزيع المصروفات</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">3. تكلفة الإدارات</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">تحميل المصروفات المباشرة وغير المباشرة على مراكز التكلفة (عنابر التشغيل، الصيانة، الجودة، الإدارة).</td>
        <td><div class="entry-box"><b>من حـ/</b> مصروفات مركز التكلفة (عنبر محدد)<br><b>إلى حـ/</b> الحساب الوسيط / النقدية</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة مسير الرواتب والأجور (Payroll)</span><span class="cycle-cat">محور: الخزينة والأجور</span></td>
        <td><span class="screen-tag">37. المرتبات</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">استحقاق الرواتب شاملاً الأساسي والبدلات والإضافي، مع استقطاع التأمينات والضرائب والجزاءات.</td>
        <td><div class="entry-box"><b>من حـ/</b> أجور ومرتبات العاملين<br><b>إلى مذكورين:</b> التأمينات + الضرائب + صافي الأجور</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة السلف والقروض وتقسيط الذمم</span><span class="cycle-cat">محور: الخزينة والأجور</span></td>
        <td><span class="screen-tag">44. السلف والقروض</span><span class="screen-tag">37. المرتبات</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">صرف السلفة للعامل وإثبات مديونيتها، وجدولة خصم الأقساط آلياً من المرتبات حتى التصفية.</td>
        <td><div class="entry-box"><b>الصرف:</b> من حـ/ ذمم السلف إلى حـ/ البنك<br><b>السداد:</b> من حـ/ الأجور إلى حـ/ ذمم السلف</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة النثريات والعهد المؤقتة</span><span class="cycle-cat">محور: الخزينة والأجور</span></td>
        <td><span class="screen-tag">45. المصروفات</span><span class="screen-tag">76. مصروفاتي</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">صرف عهدة نقدية لمشتريات الطوارئ، فحص الفواتير المرفوعة ذاتياً، واستعاضة العهدة أو تصفيتها.</td>
        <td><div class="entry-box"><b>من حـ/</b> المصروفات المتنوعة (بموجب الفواتير)<br><b>إلى حـ/</b> عهدة الصندوق / الخزينة</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة حسابات السائقين والأسطول</span><span class="cycle-cat">محور: الخزينة والأجور</span></td>
        <td><span class="screen-tag">10. حسابات السائقين</span><span class="screen-tag">26. حركة العربيات</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">صرف عهد السولار وبدلات الانتقال، مطابقة العدادات بالفواتير وتوزيع التكلفة على طلبيات البيع.</td>
        <td><div class="entry-box"><b>من حـ/</b> مصروفات نقل وشحن المبيعات<br><b>إلى حـ/</b> عهدة السائق / المورد اللوجستي</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة تكاليف الصيانة وقطع الغيار</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">22. الصيانة</span><span class="screen-tag">25. دورة قطع الغيار</span><span class="screen-tag">23. شركات الصيانة</span></td>
        <td class="output-cell">إثبات تكلفة قطع الغيار المستهلكة من المخزن على الماكينة، ومطابقة فواتير مقاولي الصيانة الخارجيين.</td>
        <td><div class="entry-box"><b>من حـ/</b> مصروفات صيانة ماكينات ومعدات<br><b>إلى حـ/</b> مخزن قطع الغيار (أو مورد الصيانة)</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">14</span></td>
        <td><span class="cycle-name">دورة الأصول الثابتة وحساب الإهلاك</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">24. المعدات</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">رسملة الماكينات وخطوط الإنتاج، وحساب وتوليد قيد قسط الإهلاك الشهري آلياً.</td>
        <td><div class="entry-box"><b>من حـ/</b> مصروف إهلاك الماكينات والمعدات<br><b>إلى حـ/</b> مجمع إهلاك الماكينات</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">15</span></td>
        <td><span class="cycle-name">دورة الخزينة والتسويات البنكية</span><span class="cycle-cat">محور: الخزينة والأجور</span></td>
        <td><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">مطابقة كشوف حسابات البنوك بحركات النظام، وإدارة الشيكات تحت التحصيل والشيكات الآجلة.</td>
        <td><div class="entry-box"><b>إيداع:</b> من حـ/ شيكات تحت التحصيل إلى حـ/ عملاء<br><b>مقاصة:</b> من حـ/ البنك إلى حـ/ شيكات تحت التحصيل</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">16</span></td>
        <td><span class="cycle-name">دورة الجرد المخزني وتسوية العجز</span><span class="cycle-cat">محور: التكاليف والإنتاج</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">مقارنة الجرد الفعلي بالرصيد الدفتري، وإثبات فروق الجرد وتحديد المسؤولية المالية للعجز.</td>
        <td><div class="entry-box"><b>من حـ/</b> خسائر عجز المخزون (أو ذمة الأمين)<br><b>إلى حـ/</b> مخزون المواد الخام / التام</div></td>
      </tr>
      <tr>
        <td><span class="num-badge">17</span></td>
        <td><span class="cycle-name">دورة الإقفال الدوري والقوائم المالية</span><span class="cycle-cat">محور: الدفتر العام والتقارير</span></td>
        <td><span class="screen-tag">8. الإدارة المالية</span><span class="screen-tag">1. لوحة المالك</span><span class="screen-tag">3. التكلفة</span></td>
        <td class="output-cell">إقفال حسابات الإيرادات والمصروفات، واستخراج: قائمة الدخل، الميزانية العمومية، والتدفقات النقدية.</td>
        <td><div class="entry-box"><b>إقفال الإيرادات:</b> من حـ/ الإيرادات إلى حـ/ ملخص الدخل<br><b>إقفال المصروفات:</b> من حـ/ ملخص الدخل إلى حـ/ المصروفات</div></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> يعتمد نظام الحسابات على ميزة <b>(Event-Driven Auto-Posting)</b>؛ فكل حركة مخزنية أو أمر بيع أو مسير رواتب يولد قيده المحاسبي المزدوج تلقائياً.</div>
    <div style="font-weight:700; color:#facc15;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_finance_table_image():
    html_path = os.path.abspath("ninja_finance_table.html")
    png_path = os.path.abspath("ninja_finance_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_FINANCE_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1350}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Finance Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_finance_table_image())
