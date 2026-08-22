// Part 1: Setup, CSS, Cover, and department HTML generators
// This file is consumed by the main build script

module.exports = function(logoDataUri, tableKeys, dbSchema) {

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Cairo', sans-serif; font-size: 11pt; line-height: 1.8; color: #1e293b; background: #fff; direction: rtl; }
@page { size: A4; margin: 16mm 12mm 16mm 12mm; }
.cover-page { page-break-after: always; height: 100vh; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 40%, #1d4ed8 100%); color: #fff; border-radius: 12px; }
.cover-logo-img { width: 180px; height: auto; border-radius: 20px; background: #fff; padding: 14px; box-shadow: 0 15px 35px rgba(0,0,0,0.45); border: 4px solid #60a5fa; }
.cover-title { font-size: 25pt; font-weight: 900; color: #fff; margin-bottom: 12px; }
.cover-subtitle { font-size: 14pt; font-weight: 700; color: #93c5fd; margin-bottom: 22px; line-height: 1.6; }
.cover-badge { display: inline-block; padding: 8px 26px; background: rgba(59,130,246,0.25); border: 1.5px solid #60a5fa; border-radius: 30px; font-size: 11.5pt; color: #eff6ff; margin-bottom: 25px; font-weight: 700; }
.cover-meta { width: 100%; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 20px; display: flex; justify-content: space-around; font-size: 10pt; color: #bfdbfe; }
.page-break { page-break-after: always; }
.chapter-title { font-size: 20pt; font-weight: 800; color: #1e3a8a; border-bottom: 4px solid #2563eb; padding-bottom: 8px; margin-top: 25px; margin-bottom: 18px; }
.section-title { font-size: 13.5pt; font-weight: 700; color: #1d4ed8; margin-top: 22px; margin-bottom: 12px; background: #eff6ff; padding: 8px 14px; border-right: 5px solid #3b82f6; border-radius: 4px; }
p { margin-bottom: 12px; text-align: justify; color: #334155; }
table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 9.5pt; }
th, td { border: 1px solid #cbd5e1; padding: 7px 10px; text-align: right; }
th { background-color: #1e3a8a; color: #fff; font-weight: 700; font-size: 10pt; }
tr:nth-child(even) { background-color: #f8fafc; }
.diagram-box { background: #eff6ff; border: 2.5px solid #3b82f6; border-radius: 10px; padding: 18px; margin: 18px 0; text-align: center; page-break-inside: avoid; }
.diagram-svg { width: 100%; max-width: 820px; height: auto; margin: 0 auto; }
.notice-box { background: #eff6ff; border-right: 4px solid #2563eb; padding: 12px 16px; border-radius: 6px; margin: 15px 0; color: #1e40af; font-size: 10pt; }
.wf-card { background: #f8fafc; border: 1.5px solid #cbd5e1; border-right: 4px solid #2563eb; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px; page-break-inside: avoid; }
.wf-title { font-weight: 800; color: #1e3a8a; font-size: 11pt; margin-bottom: 6px; }
.wf-steps { color: #334155; font-size: 10pt; line-height: 1.7; }
.proposal-card { background: #f8fafc; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin-top: 20px; }
`;

// SVG helper: creates a flow diagram with N steps
function flowSVG(steps, h=130) {
  const w = 820;
  const boxW = Math.min(160, (w - 30) / steps.length - 10);
  const boxH = 65;
  const y = (h - boxH) / 2;
  const fills = ['#eff6ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8'];
  const strokes = ['#3b82f6','#2563eb','#1d4ed8','#1e3a8a','#1e3a8a','#1e3a8a','#1e3a8a','#0f172a'];
  let svg = `<svg class="diagram-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
  const gap = (w - 20) / steps.length;
  steps.forEach((s, i) => {
    const x = 10 + i * gap;
    const fi = Math.min(i, fills.length - 1);
    const textColor = i >= 6 ? '#ffffff' : '#0f172a';
    svg += `<rect x="${x}" y="${y}" width="${boxW}" height="${boxH}" rx="8" fill="${fills[fi]}" stroke="${strokes[fi]}" stroke-width="2"/>`;
    svg += `<text x="${x + boxW/2}" y="${y + boxH/2 + 4}" font-weight="bold" font-size="9.5" text-anchor="middle" fill="${textColor}">${s}</text>`;
    if (i < steps.length - 1) {
      svg += `<path d="M ${x + boxW} ${y + boxH/2} L ${x + gap} ${y + boxH/2}" stroke="#2563eb" stroke-width="2"/>`;
    }
  });
  svg += '</svg>';
  return svg;
}

// Department data: name, description, workflows with steps
const departments = [
  {
    id: '2.1', name: 'إدارة المبيعات وخدمة العملاء', en: 'Sales & CRM',
    desc: 'المحرك الرئيسي لإيرادات المؤسسة. تبدأ من استلام طلب العميل وتستمر عبر 8 مراحل حتى تسليم البضاعة للعميل وتصفية الحساب المالي.',
    workflows: [
      { title: 'دورة المبيعات الكبرى (طلب العميل حتى التسليم)', steps: ['طلب العميل RFQ','عرض السعر','أمر مبيعات','فحص المخزن/BOM','تحصيل الخزنة','إذن الشحن','الفاتورة والقيد','تسليم العميل'] },
      { title: 'دورة المرتجعات والتسويات المالية', steps: ['طلب مرتجع','فحص الجودة','إذن إضافة مخزني','إشعار دائن','تسوية الحساب'] }
    ]
  },
  {
    id: '2.2', name: 'إدارة المشتريات والموردين', en: 'Procurement',
    desc: 'تأمين كافة الاحتياجات من المواد الخام وقطع الغيار بأفضل الأسعار وأعلى جودة عبر دورتين.',
    workflows: [
      { title: 'دورة الشراء الخارجي والاستلام', steps: ['طلب احتياج PR','عروض أسعار RFQ','أمر شراء PO','استلام وفحص QC','سداد المورد'] },
      { title: 'دورة تقييم واعتماد الموردين', steps: ['تسجيل المورد','تقييم الأداء','تصنيف المعتمد','تجديد أو حظر'] }
    ]
  },
  {
    id: '2.3', name: 'إدارة الموارد البشرية والرواتب (20 دورة)', en: 'HR & Payroll',
    desc: 'تحتوي على 20 دورة تشغيلية مكتملة تغطي كافة شؤون العامل والموظف من التوظيف حتى إنهاء الخدمة.',
    workflows: [
      { title: 'دورة التوظيف والتعاقد', steps: ['رفع CV','تحليل AI','المقابلة','التقييم','عرض العمل','توقيع العقد'] },
      { title: 'دورة الحضور والورديات والسلف', steps: ['مسح QR','مطابقة الوردية','تسجيل التأخير','احتساب السلف','خصم الجزاءات'] },
      { title: 'دورة الإجازات والقروض والتأمين', steps: ['طلب إجازة','موافقة المدير','خصم الرصيد','طلب قرض','جدولة أقساط','تأمين صحي'] },
      { title: 'دورة الرواتب والصرف وإنهاء الخدمة', steps: ['احتساب المسرد','المكافآت والإضافي','صافي الراتب','زر Pay','قيد محاسبي','إنهاء الخدمة'] }
    ]
  },
  {
    id: '2.4', name: 'إدارة الحضور والبصمة الذكية', en: 'Attendance & QR',
    desc: 'تسجيل حضور وانصراف الموظفين عبر الـ QR Code ومطابقة الورديات وتسجيل التأخيرات آلياً.',
    workflows: [
      { title: 'دورة تسجيل الحضور اليومي', steps: ['مسح QR الموبايل','تحديد الوردية','تسجيل الدخول','تسجيل الخروج','حساب الساعات'] },
      { title: 'دورة التظلمات وتعديل السجلات', steps: ['تقديم تظلم','مراجعة HR','تعديل السجل','تحديث المسرد'] }
    ]
  },
  {
    id: '2.5', name: 'إدارة التوظيف الذكي ATS', en: 'ATS Recruitment',
    desc: 'فرز السير الذاتية آلياً بالذكاء الاصطناعي واستخراج نسبة المطابقة الوظيفية وجدولة المقابلات.',
    workflows: [
      { title: 'دورة الفرز الآلي بالذكاء الاصطناعي', steps: ['رفع PDF','استخراج المهارات','حساب التوافق','ترتيب المتقدمين'] },
      { title: 'دورة المقابلات والتعيين', steps: ['جدولة المقابلة','التقييم الفني','عرض العمل','إصدار العقد'] }
    ]
  },
  {
    id: '2.6', name: 'الإدارة المالية والمحاسبية', en: 'General Ledger',
    desc: 'توليد القيود المحاسبية الآلية لكل معاملة مالية وإقفال الدفاتر الشهرية واستخراج القوائم المالية.',
    workflows: [
      { title: 'دورة القيد اليومي التلقائي', steps: ['معاملة مالية','إنشاء قيد آلي','مدين = دائن','ترحيل الدفتر'] },
      { title: 'دورة الإقفال الشهري والقوائم', steps: ['مطابقة الحسابات','إقفال الفترة','ميزان المراجعة','الميزانية العمومية'] }
    ]
  },
  {
    id: '2.7', name: 'إدارة الخزائن والبنوك', en: 'Treasury & Cash',
    desc: 'مراقبة السيولة النقدية في الخزائن والحسابات البنكية وحظر السحب عند عدم كفاية الرصيد.',
    workflows: [
      { title: 'دورة الصرف والقبض النقدي', steps: ['طلب صرف/قبض','فحص الرصيد','تنفيذ العملية','تحديث السيولة','طباعة الإيصال'] },
      { title: 'دورة التحويل بين الخزائن والبنوك', steps: ['طلب تحويل','اعتماد الإدارة','خصم المصدر','إضافة الهدف'] }
    ]
  },
  {
    id: '2.8', name: 'إدارة مراكز التكلفة', en: 'Cost Centers',
    desc: 'ربط كل مصروف وراتب ومادة خام بمركز تكلفة محدد لمعرفة ربحية كل خط إنتاج أو مشروع.',
    workflows: [
      { title: 'دورة توزيع المصروفات على المراكز', steps: ['فاتورة/راتب','تحديد كود المركز','توجيه التكلفة','تجميع المركز'] },
      { title: 'دورة تحليل الربحية', steps: ['إيرادات المركز','تكاليف المركز','هامش الربح','تقرير المقارنة'] }
    ]
  },
  {
    id: '2.9', name: 'إدارة المخازن ورصيد الخامات', en: 'Inventory Control',
    desc: 'تتبع حركات الإضافة والصرف المخزني والتنبيه عند الوصول لحد إعادة الطلب.',
    workflows: [
      { title: 'دورة الإضافة والصرف المخزني', steps: ['استلام خامة','إذن إضافة','تحديث الرصيد','إذن صرف','خصم للإنتاج'] },
      { title: 'دورة الجرد الدوري والتسوية', steps: ['فتح أمر جرد','عد فعلي','مقارنة بالمستندي','تسوية العجز/الزيادة'] }
    ]
  },
  {
    id: '2.10', name: 'إدارة خطوط الإنتاج والـ BOM', en: 'Manufacturing',
    desc: 'إصدار أوامر التشغيل وخصم الخامات آلياً بحسب معايير BOM وتحويل المنتج التام للمخازن.',
    workflows: [
      { title: 'دورة أمر التشغيل والخصم الآلي', steps: ['أمر إنتاج','قراءة BOM','خصم الخامات','بدء التصنيع','تتبع الإنجاز'] },
      { title: 'دورة استلام المنتج التام', steps: ['إنهاء التصنيع','فحص الجودة QC','إذن إضافة تام','تحويل لمخزن البيع'] }
    ]
  },
  {
    id: '2.11', name: 'إدارة ضبط الجودة والفحص', en: 'Quality Control',
    desc: 'فحص عينات المشتريات والمنتجات المصنعة وتحديد نسبة العيوب واعتماد أو استبعاد الشحنات.',
    workflows: [
      { title: 'دورة فحص خامات المشتريات', steps: ['سحب عينة','الفحص الفني','تحديد العيوب','إجازة أو رفض الشحنة'] },
      { title: 'دورة فحص خطوط الإنتاج', steps: ['تفتيش دوري','عينات التصنيع','عزل العيوب','اعتماد التعبئة'] }
    ]
  },
  {
    id: '2.12', name: 'إدارة الصيانة وقطع الغيار', en: 'Maintenance',
    desc: 'متابعة بلاغات الأعطال وجدولة الصيانة الوقائية وصرف قطع الغيار من مخزن الصيانة.',
    workflows: [
      { title: 'دورة الصيانة الطارئة والأعطال', steps: ['بلاغ عطل','تشخيص المشكلة','صرف قطعة غيار','الإصلاح','إغلاق البلاغ'] },
      { title: 'دورة الصيانة الوقائية الدورية', steps: ['تتبع ساعات التشغيل','جدولة العمرة','تغيير الزيوت','تقرير الكفاءة'] }
    ]
  },
  {
    id: '2.13', name: 'إدارة أسطول الشاحنات والعداد', en: 'Fleet & Odometer',
    desc: 'تتبع عداد الكيلومترات وصرف الوقود واحتساب معدل الاستهلاك وتنبيهات الترخيص.',
    workflows: [
      { title: 'دورة العداد والوقود', steps: ['قراءة Odometer','صرف السولار','حساب المسافة','معدل الاستهلاك'] },
      { title: 'دورة الترخيص والفحص الفني', steps: ['تنبيه الموعد','فحص فني','تجديد الترخيص','تحديث السجل'] }
    ]
  },
  {
    id: '2.14', name: 'إدارة رحلات السائقين والشحن', en: 'Logistics & Drivers',
    desc: 'تكليف السائقين بالرحلات وتسليم الشحنات وتصفية مصاريف الطرق ومستحقات السائق.',
    workflows: [
      { title: 'دورة رحلة النقل والتسليم', steps: ['تكليف الرحلة','تحميل الشاحنة','التسليم للعميل','إشعار الاستلام'] },
      { title: 'دورة تصفية العهد ومصاريف الطرق', steps: ['تقديم الفواتير','مراجعة الحسابات','صرف المستحقات','قيد محاسبي'] }
    ]
  },
  {
    id: '2.15', name: 'منظومة الذكاء الاصطناعي والـ CEO', en: 'AI Mind & CEO',
    desc: 'شات بوت تفاعلي للموظفين بالعربية وتحليلات تنبؤية وتنبيهات مبكرة للرئيس التنفيذي.',
    workflows: [
      { title: 'دورة الشات بوت واستفسارات الموظفين', steps: ['سؤال بالعربية','فحص الصلاحيات','معالجة البيانات','الرد الفوري'] },
      { title: 'دورة التنبؤات والتنبيهات التنفيذية', steps: ['تحليل الاتجاهات','رصد المخاطر','تنبيه مبكر CEO','اقتراح الحلول'] }
    ]
  }
];

// Build department HTML sections
let deptHTML = '';
departments.forEach(dept => {
  deptHTML += `<div class="section-title">${dept.id} ${dept.name} (${dept.en})</div>`;
  deptHTML += `<p><strong>الوصف:</strong> ${dept.desc}</p>`;
  dept.workflows.forEach((wf, wi) => {
    deptHTML += `<div class="wf-card"><div class="wf-title">🔄 الدورة ${wi+1}: ${wf.title}</div>`;
    deptHTML += `<div class="wf-steps">${wf.steps.map((s,i) => `<strong>${i+1}.</strong> ${s}`).join(' ← ')}</div></div>`;
    deptHTML += `<div class="diagram-box"><div style="font-weight:bold;color:#1e3a8a;margin-bottom:8px;">رسمة: ${wf.title}</div>${flowSVG(wf.steps)}</div>`;
  });
});

// Build DB tables compact listing
let dbHTML = `<table><thead><tr><th style="width:40px">#</th><th style="width:180px">اسم الجدول</th><th>الوظيفة</th></tr></thead><tbody>`;
tableKeys.forEach((tName, idx) => {
  const t = dbSchema[tName];
  const short = t.explanation.split(':').length > 1 ? t.explanation.split(':')[1].split('،')[0].trim() : t.explanation.split('،')[0];
  dbHTML += `<tr><td>${idx+1}</td><td><code>${t.name}</code></td><td>${short}</td></tr>`;
});
dbHTML += '</tbody></table>';

return { CSS, deptHTML, dbHTML, flowSVG };

};
