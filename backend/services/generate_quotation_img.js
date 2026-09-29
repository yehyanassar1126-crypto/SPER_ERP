const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f0f4f8;
            --card-bg: #ffffff;
            --card-border: rgba(37, 99, 235, 0.15);
            --card-shadow: rgba(15, 23, 42, 0.05);
            
            --primary: #1d4ed8;
            --primary-light: #3b82f6;
            --secondary: #0ea5e9;
            
            --text-main: #0f172a;
            --text-muted: #475569;
            --text-accent: #2563eb;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Cairo', sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 40%);
            color: var(--text-main);
            width: 2400px;
            padding: 80px;
            position: relative;
        }

        .main-wrapper {
            background: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.8);
            border-radius: 40px;
            padding: 80px;
            box-shadow: 0 40px 100px rgba(15, 23, 42, 0.08),
                        0 10px 30px rgba(15, 23, 42, 0.03);
            position: relative;
            z-index: 10;
        }

        /* Decorative top line */
        .main-wrapper::before {
            content: '';
            position: absolute;
            top: 0; left: 10%; right: 10%;
            height: 6px;
            background: linear-gradient(90deg, transparent, var(--primary-light), var(--primary), var(--primary-light), transparent);
            border-radius: 0 0 10px 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 80px;
        }

        .tag-sale {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, var(--primary), #1e3a8a);
            color: white;
            padding: 12px 35px;
            border-radius: 100px;
            font-weight: 800;
            font-size: 1.4rem;
            letter-spacing: 0.5px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
            text-transform: uppercase;
        }

        h1 {
            font-size: 5rem;
            font-weight: 900;
            letter-spacing: -1px;
            margin-bottom: 25px;
            color: #0f172a;
            text-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }

        .subtitle {
            font-size: 2rem;
            color: var(--text-accent);
            font-weight: 800;
            margin-bottom: 25px;
        }
        
        .desc {
            font-size: 1.4rem;
            color: var(--text-muted);
            max-width: 1400px;
            margin: 0 auto;
            line-height: 1.8;
            font-weight: 600;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 30px;
            margin-bottom: 80px;
        }

        .card {
            background: var(--card-bg);
            border: 2px solid var(--card-border);
            border-radius: 24px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            position: relative;
            box-shadow: 0 15px 40px var(--card-shadow);
            transition: all 0.3s ease;
        }

        .card-header {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-bottom: 25px;
            padding-bottom: 25px;
            border-bottom: 2px dashed rgba(37, 99, 235, 0.15);
        }

        .card-title {
            display: flex;
            align-items: center;
            gap: 18px;
        }
        
        .card-icon {
            font-size: 2rem;
            background: linear-gradient(135deg, #eff6ff, #dbeafe);
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            border: 1px solid rgba(37, 99, 235, 0.2);
            color: var(--primary);
        }

        .card-title h3 {
            font-size: 1.6rem;
            color: var(--text-main);
            font-weight: 800;
            line-height: 1.3;
        }

        .card-price {
            font-size: 2rem;
            font-weight: 900;
            color: var(--primary);
            background: rgba(37, 99, 235, 0.08);
            padding: 10px 25px;
            border-radius: 16px;
            border: 1px solid rgba(37, 99, 235, 0.15);
            display: inline-block;
            align-self: flex-start;
        }

        .feature-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 15px;
            flex-grow: 1;
        }

        .feature-list li {
            position: relative;
            padding-right: 35px;
            font-size: 1.25rem;
            color: var(--text-muted);
            line-height: 1.6;
            font-weight: 600;
        }

        .feature-list li::before {
            content: '✓';
            position: absolute;
            right: 0;
            top: 2px;
            font-size: 1.3rem;
            font-weight: 900;
            color: var(--secondary);
            background: #f0f9ff;
            width: 24px; height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }

        .infrastructure-card {
            grid-column: span 4;
            background: linear-gradient(145deg, #f8fafc, #eff6ff);
            border: 2px solid rgba(37, 99, 235, 0.3);
            flex-direction: row;
            gap: 50px;
            align-items: center;
        }
        
        .infrastructure-card .card-header {
            border-bottom: none;
            border-left: 2px dashed rgba(37, 99, 235, 0.2);
            padding-bottom: 0;
            padding-left: 50px;
            margin-bottom: 0;
            min-width: 400px;
        }
        
        .infrastructure-card .feature-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            column-gap: 50px;
            row-gap: 20px;
        }

        .total-wrapper {
            background: linear-gradient(135deg, var(--primary) 0%, #1e3a8a 100%);
            border-radius: 30px;
            padding: 8px; 
            box-shadow: 0 30px 60px rgba(37, 99, 235, 0.3);
            margin-top: 40px;
        }

        .total-inner {
            background: #ffffff;
            border-radius: 24px;
            padding: 60px 80px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-text h2 {
            font-size: 3rem;
            color: #0f172a;
            font-weight: 900;
            margin-bottom: 15px;
        }

        .total-text p {
            font-size: 1.5rem;
            color: var(--text-accent);
            font-weight: 700;
        }

        .total-amount {
            display: flex;
            align-items: baseline;
            gap: 20px;
        }

        .total-amount .number {
            font-size: 7rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--primary), #0ea5e9);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            line-height: 1;
        }

        .total-amount .currency {
            font-size: 2.5rem;
            font-weight: 900;
            color: var(--primary);
        }

        .footer-terms {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 60px;
        }
        
        .term-item {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            padding: 20px 40px;
            border-radius: 100px;
            color: #334155;
            font-size: 1.4rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.02);
        }

        .term-item span {
            font-size: 1.8rem;
        }

    </style>
</head>
<body>
    <div class="main-wrapper">
        <div class="header">
            <div class="tag-sale">
                <span>🔥</span>
                <span>بيع نهائي - رخصة مدى الحياة</span>
            </div>
            <h1>Smart Factory ERP Enterprise</h1>
            <div class="subtitle">عرض الاستثمار التقني الشامل (14 نظام متكامل)</div>
            <p class="desc">النظام الأقوى والأكثر تطوراً لربط كافة أقسام المؤسسة في شاشة تحكم واحدة. تصميم ذكي، حماية أمنية معقدة، وأتمتة كاملة لكل دورات العمل بدءاً من حضور العامل حتى تسليم البضاعة للعميل.</p>
        </div>

        <div class="grid">
            <!-- 1 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">👥</div>
                        <h3>الموارد البشرية (HR & Payroll)</h3>
                    </div>
                    <div class="card-price">160,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>بصمة QR ذكية متغيرة.</li>
                    <li>تسجيل حضور آلي.</li>
                    <li>مسير رواتب دقيق وسلف.</li>
                    <li>إدارة الإجازات والتقييمات.</li>
                </ul>
            </div>

            <!-- 2 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">💰</div>
                        <h3>المالية والخزينة (Finance)</h3>
                    </div>
                    <div class="card-price">200,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>شاشة سيولة حية وتحويلات.</li>
                    <li>تسويات آلية للمشتريات والعهد.</li>
                    <li>تتبع الشيكات وصرف الرواتب.</li>
                    <li>أرباح وخسائر وسجل مراجعة.</li>
                </ul>
            </div>

            <!-- 3 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">📦</div>
                        <h3>المبيعات والتسليم (Sales)</h3>
                    </div>
                    <div class="card-price">100,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>أوامر بيع ذكية تفحص المخزون.</li>
                    <li>حظر تسليم إلا بتصريح المالية.</li>
                    <li>إثبات استلام بالرقم القومي.</li>
                    <li>ربط مباشر مع التخطيط.</li>
                </ul>
            </div>

            <!-- 4 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">📋</div>
                        <h3>التخطيط (Planning)</h3>
                    </div>
                    <div class="card-price">120,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>تحويل المبيعات لخطط إنتاج.</li>
                    <li>طلبات شراء آلية عند النقص.</li>
                    <li>جدولة الماكينات والورديات.</li>
                    <li>منع التوقف وضمان الاستمرار.</li>
                </ul>
            </div>

            <!-- 5 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🏭</div>
                        <h3>التصنيع (Production)</h3>
                    </div>
                    <div class="card-price">170,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>أوامر صرف خامات رسمية.</li>
                    <li>متابعة حية لحالة التصنيع.</li>
                    <li>إجبار خط الإنتاج على فحص الجودة.</li>
                    <li>تتبع هدر الخامات والعمالة.</li>
                </ul>
            </div>

            <!-- 6 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">✅</div>
                        <h3>رقابة الجودة (QC)</h3>
                    </div>
                    <div class="card-price">90,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>فحص وارد لخامات الموردين.</li>
                    <li>فحص صادر للمنتج النهائي.</li>
                    <li>تسجيل المرفوضات والمتابعة.</li>
                    <li>مسار إعادة التصنيع أو الإعدام.</li>
                </ul>
            </div>

            <!-- 7 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🏪</div>
                        <h3>إدارة المخازن (Warehouse)</h3>
                    </div>
                    <div class="card-price">150,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>جرد لحظي مباشر 100%.</li>
                    <li>تنبيهات نواقص آلية قبل الانتهاء.</li>
                    <li>سجل دقيق لحركات الصادر والوارد.</li>
                    <li>إدارة ثلاث مخازن مترابطة.</li>
                </ul>
            </div>

            <!-- 8 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🛒</div>
                        <h3>المشتريات (Procurement)</h3>
                    </div>
                    <div class="card-price">90,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>موافقات واعتماد طلبات.</li>
                    <li>اختيار أفضل عروض أسعار.</li>
                    <li>تسوية فورية بحسابات العهد.</li>
                    <li>قاعدة بيانات للموردين.</li>
                </ul>
            </div>

            <!-- 9 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🔧</div>
                        <h3>الهندسية (Engineering)</h3>
                    </div>
                    <div class="card-price">110,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>مراقبة دقيقة لقطع الغيار.</li>
                    <li>تحليل أسباب الأعطال بالمصنع.</li>
                    <li>أرشيف تصميمات هندسية.</li>
                    <li>إدارة جداول الصيانة.</li>
                </ul>
            </div>

            <!-- 10 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">💻</div>
                        <h3>الدعم الفني (IT & Ticketing)</h3>
                    </div>
                    <div class="card-price">60,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>نظام تذاكر لأعطال الموظفين.</li>
                    <li>أرشيف معرفي لحل المشكلات.</li>
                    <li>متابعة الصيانة الدورية للأجهزة.</li>
                    <li>تصنيف الأولويات وسرعة الرد.</li>
                </ul>
            </div>

            <!-- 11 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🚚</div>
                        <h3>النقل (Fleet Logistics)</h3>
                    </div>
                    <div class="card-price">120,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>تتبع استهلاك وقود بالعداد.</li>
                    <li>كشف الاختلاسات في البنزين.</li>
                    <li>تنبيهات انتهاء الرخص والصيانة.</li>
                    <li>إدارة ومتابعة خطوط السير.</li>
                </ul>
            </div>

            <!-- 12 -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🎯</div>
                        <h3>علاقات العملاء (CRM)</h3>
                    </div>
                    <div class="card-price">90,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>تتبع مسار العميل المحتمل.</li>
                    <li>تسجيل اجتماعات ومكالمات.</li>
                    <li>تقييم أداء فريق المبيعات.</li>
                    <li>تحويل العميل لطلب مباشر.</li>
                </ul>
            </div>
            
            <!-- 13 -->
            <div class="card" style="grid-column: span 2;">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">🤖</div>
                        <h3>الذكاء الاصطناعي (AI Suite)</h3>
                    </div>
                    <div class="card-price">260,000 ج.م</div>
                </div>
                <ul class="feature-list" style="columns: 2;">
                    <li>مساعد ذكي (Chatbot) يجيب استفسارات الموظفين.</li>
                    <li>تقييم وفرز السير الذاتية آلياً.</li>
                    <li>تحليل سلوك الموظفين الاستباقي.</li>
                    <li>توقع الاستقالات بناءً على الخصومات.</li>
                </ul>
            </div>

            <!-- 14 -->
            <div class="card" style="grid-column: span 2;">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">📊</div>
                        <h3>ذكاء الأعمال (BI Dashboard)</h3>
                    </div>
                    <div class="card-price">170,000 ج.م</div>
                </div>
                <ul class="feature-list" style="columns: 2;">
                    <li>شاشة "عين الصقر" تمنح المالك رؤية شاملة للشركة.</li>
                    <li>تنبيهات أمنية ومالية فورية للتجاوزات.</li>
                    <li>رسوم بيانية متقاطعة تربط الإنتاج.</li>
                    <li>سرعة ودقة في اتخاذ قرارات الإدارة.</li>
                </ul>
            </div>

            <!-- Services -->
            <div class="card infrastructure-card">
                <div class="card-header">
                    <div class="card-title">
                        <div class="card-icon">⚡</div>
                        <h3 style="color: var(--primary);">الخدمات والتأسيس</h3>
                    </div>
                    <div class="card-price">110,000 ج.م</div>
                </div>
                <ul class="feature-list">
                    <li>أنظمة نسخ احتياطي (Backups) يومية.</li>
                    <li>نظام "شات داخلي" مشفر للأقسام.</li>
                    <li>تقويم مؤسسي مدمج للمواعيد وتوزيع المهام.</li>
                    <li>تهيئة قواعد البيانات وإدارة الصلاحيات الصارمة.</li>
                </ul>
            </div>
        </div>

        <div class="total-wrapper">
            <div class="total-inner">
                <div class="total-text">
                    <h2>إجمالي التكلفة الاستثمارية</h2>
                    <p>شامل الـ 14 إدارة بالإضافة للخدمات والتأسيس الكامل</p>
                </div>
                <div class="total-amount">
                    <span class="number">2,000,000</span>
                    <span class="currency">ج.م</span>
                </div>
            </div>
        </div>

        <div class="footer-terms">
            <div class="term-item">
                <span>🛡️</span> رخصة ملكية تامة (بدون اشتراكات)
            </div>
            <div class="term-item">
                <span>👥</span> مستخدمين غير محدودين
            </div>
            <div class="term-item">
                <span>✨</span> دعم فني وتدريب مجاني
            </div>
        </div>
    </div>
</body>
</html>
`;

nodeHtmlToImage({
  output: './smart_factory_quotation_wide.png',
  html: htmlContent,
  puppeteerArgs: { defaultViewport: { width: 2400, height: 1800 } }
})
  .then(() => console.log('Image generated successfully: smart_factory_quotation_wide.png'))
  .catch(err => console.error('Error generating image:', err));
