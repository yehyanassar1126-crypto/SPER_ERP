import os
import asyncio
from playwright.async_api import async_playwright

HTML_SECURITY_TABLE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Enterprise Security & Cybersecurity Architecture - Ninja Smart Factory ERP</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #060b14;
    color: #e2e8f0;
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    padding: 30px;
    width: 1850px;
  }

  .container {
    background: #0b1324;
    border: 1px solid #1e293b;
    border-radius: 14px;
    padding: 25px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }

  .header {
    text-align: center;
    margin-bottom: 22px;
    padding: 22px;
    background: linear-gradient(135deg, #0f1d38, #0b1324);
    border-radius: 10px;
    border: 1px solid #06b6d4;
    position: relative;
  }
  .header h1 {
    font-size: 27px;
    font-weight: 900;
    color: #38bdf8;
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
    padding: 4px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    background: #0f1a30;
    border-radius: 8px;
    overflow: hidden;
  }

  th {
    background: #132442;
    color: #ffffff;
    padding: 12px 10px;
    font-size: 13.5px;
    font-weight: 800;
    text-align: right;
    border-bottom: 2px solid #06b6d4;
  }

  td {
    padding: 12px 10px;
    border-bottom: 1px solid #1e2d4a;
    font-size: 12px;
    vertical-align: top;
    line-height: 1.5;
  }

  tr:nth-child(even) {
    background: #0a1426;
  }
  tr:hover {
    background: #14223d;
  }

  .sec-title {
    font-weight: 800;
    font-size: 14px;
    color: #ffffff;
    margin-bottom: 4px;
  }

  .sec-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11.5px;
    margin-top: 4px;
  }
  .badge-cipher {
    background: rgba(6, 182, 212, 0.2);
    border: 1px solid #06b6d4;
    color: #67e8f9;
  }
  .badge-rbac {
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid #6366f1;
    color: #a5b4fc;
  }
  .badge-audit {
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid #f59e0b;
    color: #fde68a;
  }
  .badge-db {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid #10b981;
    color: #6ee7b7;
  }

  .tech-detail {
    color: #e2e8f0;
  }
  .tech-detail b {
    color: #38bdf8;
  }
  .tech-detail ul {
    padding-right: 16px;
    margin-top: 4px;
  }
  .tech-detail li {
    margin-bottom: 3px;
  }

  .code-cell {
    font-family: Consolas, monospace;
    font-size: 11px;
    direction: ltr;
    text-align: left;
    color: #cbd5e1;
  }
  .code-tag {
    display: inline-block;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid #334155;
    color: #38bdf8;
    padding: 2px 7px;
    border-radius: 4px;
    margin: 2px;
  }

  .footer-summary {
    margin-top: 18px;
    padding: 14px 20px;
    background: linear-gradient(90deg, #0f1d38, #0b1324);
    border-radius: 8px;
    border: 1px solid #06b6d4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    color: #94a3b8;
  }
  .footer-summary b {
    color: #38bdf8;
  }
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>NINJA SMART FACTORY ERP - المعمارية الأمنية والسيبرانية الشاملة المطبقة في النظام (Security Architecture)</h1>
    <p>التشفير التمليحي SHA-256، مصفوفة الصلاحيات اللحظية RBAC، عزل البيانات RLS، وسجلات التدقيق اللحظية والحماية من الاختراق</p>
    <div class="badge-bar">
      <span class="badge-macro" style="background:#083344; color:#67e8f9;">طبقة التشفير والمصادقة الصارمة</span>
      <span class="badge-macro" style="background:#1e1b4b; color:#c7d2fe;">مصفوفة أذونات فورية Realtime RBAC</span>
      <span class="badge-macro" style="background:#022c22; color:#a7f3d0;">عزل قواعد البيانات Row Level Security</span>
      <span class="badge-macro" style="background:#451a03; color:#fde68a;">سجل مراجعة وتدقيق كامل Audit Trail</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 18%;">طبقة الأمان والمحور</th>
        <th style="width: 32%;">ما هو مطبق برمجياً في الكود (Implemented in Code)</th>
        <th style="width: 30%;">الآلية الفنية والتقنيات المستخدمة (Technical Mechanism)</th>
        <th style="width: 20%;">الملفات البرمجية وجداول البيانات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="sec-title">1. المصادقة وتشفير كلمات السر</div>
          <div style="font-size:11px; color:#94a3b8;">Authentication & Salt Hashing</div>
          <span class="sec-badge badge-cipher">تشفير خوارزمي غير قابل للعكس</span>
        </td>
        <td class="tech-detail">
          <b>تأمين الهوية وبيانات الاعتماد:</b>
          <ul>
            <li>تشفير كلمات المرور عبر <b>SHA-256</b> مع إضافة Salt تشفيري خاص بالمنظومة لمنع كسر التجزئة بجداول قوس قزح (Rainbow Tables).</li>
            <li>تنظيف جلسة المستخدم (Memory Sanitization): حذف الـ <code>password_hash</code> فوراً من ذاكرة المتصفح قبل حفظ الجلسة.</li>
            <li>قفل تسجيل الدخول التلقائي للحسابات المعطلة أو المؤرشفة (Inactive Status Check).</li>
          </ul>
        </td>
        <td class="tech-detail">
          <b>Web Crypto API + Salt:</b>
          <ul>
            <li>دالة <code>hashPassword</code> تستدعي <code>crypto.subtle.digest</code> بتشفير عتادي سريع ومحمي.</li>
            <li>فصل مسار مصادقة موظفي المصنع عن الموردين الخارجيين بجدولين منفصلين.</li>
          </ul>
        </td>
        <td class="code-cell">
          <span class="code-tag">js/security-helpers.js</span>
          <span class="code-tag">SecurityHelpers.hashPassword</span>
          <span class="code-tag">SecurityHelpers.secureLogin</span>
          <span class="code-tag">table: users</span>
        </td>
      </tr>

      <tr>
        <td>
          <div class="sec-title">2. مصفوفة الصلاحيات اللحظية (RBAC)</div>
          <div style="font-size:11px; color:#94a3b8;">Realtime RBAC Engine</div>
          <span class="sec-badge badge-rbac">صلاحيات ثمانية لحظية</span>
        </td>
        <td class="tech-detail">
          <b>التحكم الصارم بالوصول والعمليات:</b>
          <ul>
            <li>تخصيص الأذونات على مستوى 8 أفعال: <b>View, Create, Edit, Delete, Approve, Reject, Export, Print</b>.</li>
            <li>إمكانية منح الصلاحية على مستوى الدور (Role) أو تخصيص استثناء لمستخدم محدد (User Override).</li>
            <li><b>حارس الواجهة التلقائي:</b> مسح أزرار الشاشة وإخفاء/تعطيل أزرار الحذف والتعديل تلقائياً لمن لا يملك الصلاحية.</li>
          </ul>
        </td>
        <td class="tech-detail">
          <b>Supabase Realtime WebSockets:</b>
          <ul>
            <li>الاشتراك بقناة الـ Realtime؛ بمجرد تعديل أذونات مستخدم في الإدارة، تتحدث شاشته فوراً خلال 1 ثانية دون إعادة تحميل.</li>
            <li>فلترة استعلامات الصلاحية لمنع تجاوز حدود الـ 1000 صف.</li>
          </ul>
        </td>
        <td class="code-cell">
          <span class="code-tag">js/erp-permissions.js</span>
          <span class="code-tag">SecurityHelpers.loadPermissions</span>
          <span class="code-tag">SecurityHelpers.applyPermissionsUI</span>
          <span class="code-tag">table: screen_permissions</span>
        </td>
      </tr>

      <tr>
        <td>
          <div class="sec-title">3. عزل البيانات في قاعدة البيانات (RLS)</div>
          <div style="font-size:11px; color:#94a3b8;">Row Level Security (RLS)</div>
          <span class="sec-badge badge-db">حماية جذرية من تسريب البيانات</span>
        </td>
        <td class="tech-detail">
          <b>عزل مستوى الصف في PostgreSQL:</b>
          <ul>
            <li>تفعيل <code>ENABLE ROW LEVEL SECURITY</code> على الجداول الحساسة.</li>
            <li><b>عزل بوابة الموظف:</b> الموظف لا يستطيع برمجياً استرجاع أي سجلات تخص غيره، حيث تقيد الاستعلامات بـ <code>user_id = current_user</code>.</li>
            <li>قصر رؤية تذاكر الدعم الفني والمستحقات والعهد على أصحابها أو الإدارة العليا.</li>
          </ul>
        </td>
        <td class="tech-detail">
          <b>PostgreSQL Policies:</b>
          <ul>
            <li>سياسات RLS مفروضة على محرك قاعدة البيانات نفسه؛ حتى لو حاول مستخدم استدعاء الـ API يدوياً، ترفض قاعدة البيانات إعادة الصفوف.</li>
          </ul>
        </td>
        <td class="code-cell">
          <span class="code-tag">supabase_schema.sql</span>
          <span class="code-tag">fix_gate_logs_rls.sql</span>
          <span class="code-tag">setup_nursing_clinic.sql</span>
          <span class="code-tag">ALTER TABLE ENABLE RLS</span>
        </td>
      </tr>

      <tr>
        <td>
          <div class="sec-title">4. سجل التدقيق والرقابة المضادة للتلاعب</div>
          <div style="font-size:11px; color:#94a3b8;">Audit Trail & Anti-Tampering</div>
          <span class="sec-badge badge-audit">توثيق شامل وغير قابل للإنكار</span>
        </td>
        <td class="tech-detail">
          <b>سجل العمليات اللحظي (Audit & Activity Logs):</b>
          <ul>
            <li>توثيق كل عملية إنشاء، تعديل، حذف، أو ترحيل مالي ومخزني.</li>
            <li>تسجيل هوية المستخدم، الشاشة، نوع الإجراء، الطابع الزمني، والقيم قبل وبعد التعديل (Old vs New Values).</li>
            <li>سجل مراجعة تسجيل الدخول <code>login_history</code> يرصد محاولات الدخول الفاشلة وأسبابها وعناوين الـ IP.</li>
          </ul>
        </td>
        <td class="tech-detail">
          <b>Immutable Audit Records:</b>
          <ul>
            <li>جداول التدقيق مخصصة للقراءة والإضافة فقط؛ يمنع تعديل أو حذف أي سجل تاريخي لضمان حماية النظام في القضايا القانونية.</li>
          </ul>
        </td>
        <td class="code-cell">
          <span class="code-tag">table: audit_log</span>
          <span class="code-tag">table: activity_log</span>
          <span class="code-tag">table: login_history</span>
          <span class="code-tag">SecurityHelpers.logActivity</span>
        </td>
      </tr>

      <tr>
        <td>
          <div class="sec-title">5. حماية الـ API والحقن (Anti-Injection)</div>
          <div style="font-size:11px; color:#94a3b8;">API Defense & SQL Injection Prevention</div>
          <span class="sec-badge badge-cipher">حماية استعلامية 100%</span>
        </td>
        <td class="tech-detail">
          <b>الحماية ضد هجمات الويب الشائعة (OWASP Top 10):</b>
          <ul>
            <li><b>مكافحة الـ SQL Injection:</b> الاعتماد بنسبة 100% على واجهات PostgREST ذات الاستعلامات المجهزة مسبقاً (Parameterized Queries).</li>
            <li><b>الحماية من XSS:</b> فلترة مدخلات المستخدمين قبل إدراجها بالـ DOM باستخدام دوال الهروب (Sanitizing Text).</li>
            <li>التحقق من صحة المدخلات الرقمية والتواريخ قبل الإرسال لمنع أخطاء الـ Buffer.</li>
          </ul>
        </td>
        <td class="tech-detail">
          <b>Parameterized REST APIs:</b>
          <ul>
            <li>تتعامل الواجهة مع قاعدة البيانات عبر طبقة RESTful آمنة ومحمية بـ API Keys و JWT Tokens مشفرة.</li>
          </ul>
        </td>
        <td class="code-cell">
          <span class="code-tag">js/supabaseClient.js</span>
          <span class="code-tag">Supabase REST Engine</span>
          <span class="code-tag">PostgREST Guard</span>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="footer-summary">
    <div><b>ملاحظة معمارية للمناقشة:</b> يعتمد نظام Ninja ERP نموذج <b>الدفاع المتعمق (Defense-in-Depth)</b>؛ فلا يكتفي بحماية الواجهة الأمامية، بل يفرض سياسات الأمان والتشفير والعزل على مستوى المحرك وقاعدة البيانات مباشرة.</div>
    <div style="font-weight:700; color:#38bdf8;">Ninja Smart Factory ERP © 2026</div>
  </div>

</div>

</body>
</html>
"""

async def generate_security_table_image():
    html_path = os.path.abspath("ninja_security_table.html")
    png_path = os.path.abspath("ninja_security_architecture_table.png")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_SECURITY_TABLE)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1850, "height": 1150}, device_scale_factor=2)
        await page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        await page.wait_for_timeout(500)
        await page.screenshot(path=png_path, full_page=True)
        await browser.close()
    print(f"Security Table Image generated successfully at: {png_path}")

if __name__ == "__main__":
    asyncio.run(generate_security_table_image())
