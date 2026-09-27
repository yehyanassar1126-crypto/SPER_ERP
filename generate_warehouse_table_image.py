import os
import asyncio
from playwright.async_api import async_playwright

HTML_WH_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Warehouse & Inventory Cycles - Ninja Smart Factory ERP</title>
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
    border: 1px solid #06b6d4;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #22d3ee;
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
    background: #0e7490;
    color: #ffffff;
    padding: 11px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #0891b2;
  }

  td {
    padding: 9px 10px;
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
    color: #22d3ee;
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
    color: #22d3ee;
    display: block;
    margin-top: 2px;
  }

  .screen-tag {
    display: inline-block;
    background: rgba(6, 182, 212, 0.15);
    border: 1px solid #06b6d4;
    color: #67e8f9;
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
    color: #22d3ee;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - مصفوفة الدورات التشغيلية الـ 15 للمخازن وإدارة المخزون</h1>
    <p>التكامل المعماري بين إدارة الأرصدة، التتبع بالباركود واللوت، صرف الخامات، واستلام التام وتسويات الجرد</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#164e63; color:#a5f3fc;">4 محاور استراتيجية كبرى</span>
      <span class="badge-macro" style="background:#1e3a8a; color:#bfdbfe;">15 دورة تشغيلية متكاملة</span>
      <span class="badge-macro" style="background:#065f46; color:#a7f3d0;">تتبع كامل بالأرفف واللوت (Lot & Bin Tracking)</span>
      <span class="badge-macro" style="background:#713f12; color:#fde68a;">تقييم مالي فوري وجرد دقيق (COGS & Valuation)</span>
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
        <td><span class="cycle-name">دورة الاستلام المبدئي وساحة الحجر</span><span class="cycle-cat">محور: حركة الوارد والتسكين</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">7. طلبات شراء</span></td>
        <td class="output-cell">استقبال الشاحنات وتفريغ الطرود بمنطقة الحجر المؤقت، الفحص الظاهري، ومطابقة بوالص الشحن.</td>
        <td><span class="target-badge target-prod">إذن استلام مؤقت للفحص</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">02</span></td>
        <td><span class="cycle-name">دورة التكويد بالباركود وتوليد اللوت</span><span class="cycle-cat">محور: حركة الوارد والتسكين</span></td>
        <td><span class="screen-tag">19. تتبع</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">توليد أرقام اللوت وسيريالات الباركود لكل دفعة خام مقبولة لضمان التتبع العكسي لمصدر التوريد.</td>
        <td><span class="target-badge">ملصق باركود وتاريخ الصنع</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">03</span></td>
        <td><span class="cycle-name">دورة التسكين وإدارة مواقع الأرفف (Bins)</span><span class="cycle-cat">محور: حركة الوارد والتسكين</span></td>
        <td><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">توجيه الأصناف إلى أماكن تخزينها الدقيقة (الممر / الحامل / الرف) لتسريع عمليات الجرد والصرف.</td>
        <td><span class="target-badge">تحديث إحداثيات موقع الصنف</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">04</span></td>
        <td><span class="cycle-name">دورة صرف الخامات لأوامر الإنتاج</span><span class="cycle-cat">محور: الصرف للتشغيل والصيانة</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">18. BOM</span></td>
        <td class="output-cell">صرف المواد الخام بناءً على شجرة المنتج لأمر الشغل، وتخفيض رصيد الخام وإثبات التشغيل.</td>
        <td><span class="target-badge target-fin">قيد تحويل خامات إلى WIP (8)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">05</span></td>
        <td><span class="cycle-name">دورة ارتجاع الخامات الفائضة</span><span class="cycle-cat">محور: الصرف للتشغيل والصيانة</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">17. أوامر الإنتاج</span></td>
        <td class="output-cell">إعادة الخامات المتبقية من خطوط الإنتاج بعد انتهاء أمر الشغل إلى المخزن وتحديث الأرصدة.</td>
        <td><span class="target-badge target-fin">تخفيض تكلفة أمر الشغل (17)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">06</span></td>
        <td><span class="cycle-name">دورة صرف قطع الغيار لمعدات الصيانة</span><span class="cycle-cat">محور: الصرف للتشغيل والصيانة</span></td>
        <td><span class="screen-tag">25. دورة قطع الغيار</span><span class="screen-tag">22. الصيانة</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">صرف قطع الغيار بناءً على تذكرة صيانة معتمدة، وتوجيه التكلفة مباشرة على كود الماكينة المتضررة.</td>
        <td><span class="target-badge target-fin">تحميل تكلفة الصيانة (3)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">07</span></td>
        <td><span class="cycle-name">دورة استلام الإنتاج التام من الخطوط</span><span class="cycle-cat">محور: استلام التام والشحن</span></td>
        <td><span class="screen-tag">6. مخازن التام</span><span class="screen-tag">17. الإنتاج</span><span class="screen-tag">21. الجودة</span></td>
        <td class="output-cell">استلام المنتجات التامة الصنع بعد اجتياز فحص الجودة النهائي، وإدخالها لمخزن التام بباركود تتبع.</td>
        <td><span class="target-badge target-fin">إقفال WIP وزيادة مخزن التام</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">08</span></td>
        <td><span class="cycle-name">دورة حجز وصرف البضاعة لأوامر البيع</span><span class="cycle-cat">محور: استلام التام والشحن</span></td>
        <td><span class="screen-tag">6. مخازن التام</span><span class="screen-tag">12. أوامر البيع</span><span class="screen-tag">26. العربيات</span></td>
        <td class="output-cell">تجهيز طلبات العملاء (Picking & Packing)، إصدار إذن صرف بضاعة، وتحميلها على أسطول الشحن.</td>
        <td><span class="target-badge target-fin">قيد تكلفة بضاعة مباعة (COGS)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">09</span></td>
        <td><span class="cycle-name">دورة استلام وفحص مرتجعات العملاء</span><span class="cycle-cat">محور: استلام التام والشحن</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">12. أوامر البيع</span></td>
        <td class="output-cell">استلام البضائع المعادة من العميل، فحصها بالجودة لتحديد إمكانية إعادة طرحها أو تخريدها.</td>
        <td><span class="target-badge target-fin">إشعار دائن وتعديل المخزون</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">10</span></td>
        <td><span class="cycle-name">دورة التحويلات والمناقلات بين المخازن</span><span class="cycle-cat">محور: الرقابة والجرد والتحويلات</span></td>
        <td><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">نقل الأصناف بين مخازن المصنع (خام، تام، قطع غيار، مخازن فرعية) مع إثبات أذون الصرف والإضافة.</td>
        <td><span class="target-badge">مطابقة أرصدة المخازن المنقولة</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">11</span></td>
        <td><span class="cycle-name">دورة مراقبة الحدود الدنيا وإعادة الطلب</span><span class="cycle-cat">محور: الرقابة والجرد والتحويلات</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">7. طلبات شراء</span><span class="screen-tag">58. العقل الذكي</span></td>
        <td class="output-cell">تتبع المخزون الأمني (Safety Stock) وإطلاق تنبيهات ذكية لتوليد طلب شراء فوري قبل نفاد الرصيد.</td>
        <td><span class="target-badge target-prod">إشعار طلب شراء آلي (PR)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">12</span></td>
        <td><span class="cycle-name">دورة الجرد الدوري والمفاجئ</span><span class="cycle-cat">محور: الرقابة والجرد والتحويلات</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">إجراء الجرد السنوي والمفاجئ بواسطة قارئات الباركود ومطابقة الرصيد الفعلي بالرصيد الدفتري.</td>
        <td><span class="target-badge">قائمة الفروق الجردية</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">13</span></td>
        <td><span class="cycle-name">دورة تسوية فروق الجرد والعجز والزيادة</span><span class="cycle-cat">محور: الرقابة والجرد والتحويلات</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">8. الإدارة المالية</span></td>
        <td class="output-cell">معالجة الفروق الجردية محاسبياً بتحميل العجز غير المبرر على أمين المخزن أو إثبات الزيادة كإيراد.</td>
        <td><span class="target-badge target-fin">قيد تسوية العجز الجردي (8)</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">14</span></td>
        <td><span class="cycle-name">دورة إدارة الراكد والهالك وتواريخ الصلاحية</span><span class="cycle-cat">محور: الرقابة والجرد والتحويلات</span></td>
        <td><span class="screen-tag">6. مخازن</span><span class="screen-tag">21. الجودة</span><span class="screen-tag">8. المالية</span></td>
        <td class="output-cell">حصر الأصناف بطيئة الحركة وتواريخ الصلاحية القريبة، وعزل التالف تمهيداً لبيعه خردة أو إعدامه.</td>
        <td><span class="target-badge target-fin">قيد تخريد وإعدام المخزون</span></td>
      </tr>
      <tr>
        <td><span class="num-badge">15</span></td>
        <td><span class="cycle-name">دورة صرف واسترداد العهد العينية والأدوات</span><span class="cycle-cat">محور: الصرف للتشغيل والصيانة</span></td>
        <td><span class="screen-tag">50. تسليم العهد</span><span class="screen-tag">6. مخازن</span></td>
        <td class="output-cell">إدارة مستودع العدد والأدوات (Tool Crib)، وصرف الأجهزة للموظفين، واستلامها وفحصها عند إخلاء الطرف.</td>
        <td><span class="target-badge">سجل عهدة الموظف بالمخزن</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> المخازن هي <b>نقطة الارتكاز المادية والمالية</b>؛ حيث تربط بين توريدات المشتريات، وصرف خامات الإنتاج، ومبيعات التام، مع تقييم محاسبي لحظي للأرصدة.</div>
    <div style="font-weight:700; color:#22d3ee;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_wh_table_image():
    html_path = os.path.abspath("ninja_wh_table.html")
    png_path = os.path.abspath("ninja_warehouse_cycles_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_WH_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1900, "height": 1300}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Warehouse Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_wh_table_image())
