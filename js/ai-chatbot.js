// ===== AI ERP CHATBOT - Premium Enterprise Assistant =====
var AIChatbot = {
  isOpen: false,
  messages: [],
  data: null,

  init: function() {
    if(document.getElementById('ai-chat-container')) return;
    var wrap = document.createElement('div');
    wrap.id = 'ai-chat-container';
    wrap.className = 'ai-chat-container';
    wrap.innerHTML = 
      '<button class="ai-chat-btn" id="ai-chat-toggle">🧠</button>' +
      '<div class="ai-chat-window" id="ai-chat-window">' +
        '<div class="ai-chat-header">' +
          '<div class="ai-chat-avatar">🧠</div>' +
          '<div class="ai-chat-title"><h4>AI ERP Assistant</h4><p>Enterprise Intelligence</p></div>' +
          '<button class="ai-chat-close" id="ai-chat-close-btn">✕</button>' +
        '</div>' +
        '<div class="ai-chat-messages" id="ai-chat-msgs"></div>' +
        '<div class="ai-chat-input-wrap">' +
          '<button class="ai-voice-btn" id="ai-voice-btn" title="Voice">🎤</button>' +
          '<input class="ai-chat-input" id="ai-chat-input" placeholder="اسأل الذكاء الاصطناعي..." />' +
          '<button class="ai-chat-send" id="ai-chat-send">➤</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    document.getElementById('ai-chat-toggle').addEventListener('click', function(){ AIChatbot.toggle(); });
    document.getElementById('ai-chat-close-btn').addEventListener('click', function(){ AIChatbot.toggle(); });
    document.getElementById('ai-chat-send').addEventListener('click', function(){ AIChatbot.send(); });
    document.getElementById('ai-chat-input').addEventListener('keydown', function(e){ if(e.key==='Enter') AIChatbot.send(); });
    document.getElementById('ai-voice-btn').addEventListener('click', function(){ AIChatbot.startVoice(); });

    // Welcome message
    AIChatbot.addBotMsg('مرحباً! 👋 أنا المساعد الذكي لنظام ERP.\n\nيمكنني مساعدتك في:\n• 📊 تحليل الأرباح والمصروفات\n• 👥 تحليل أداء الموظفين\n• 📦 حالة المخازن\n• 🏪 تقييم الموردين\n• 💵 التنبؤ بالتدفقات النقدية\n• 🚨 كشف الاحتيال\n\nاسألني أي سؤال!',
      ['كم أرباح اليوم؟','حالة المخازن','أداء الموظفين','تحليل الموردين','التدفقات النقدية','كشف الاحتيال']);

    // Preload data
    if(typeof AIBrain !== 'undefined') {
      AIBrain.runFullAnalysis(function(a){ AIChatbot.data = a; });
    }
  },

  toggle: function() {
    var win = document.getElementById('ai-chat-window');
    var btn = document.getElementById('ai-chat-toggle');
    AIChatbot.isOpen = !AIChatbot.isOpen;
    if(AIChatbot.isOpen) { win.classList.add('open'); btn.classList.add('active'); btn.textContent='✕'; document.getElementById('ai-chat-input').focus(); }
    else { win.classList.remove('open'); btn.classList.remove('active'); btn.textContent='🧠'; }
  },

  addBotMsg: function(text, suggestions) {
    var msgs = document.getElementById('ai-chat-msgs');
    if(!msgs) return;
    var div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.innerHTML = AIChatbot.formatMsg(text);
    if(suggestions && suggestions.length) {
      var sg = '<div class="ai-suggestions">';
      suggestions.forEach(function(s){ sg += '<button class="ai-suggestion-btn" onclick="AIChatbot.askSuggestion(\''+s.replace(/'/g,"\\'")+'\')">'+s+'</button>'; });
      sg += '</div>';
      div.innerHTML += sg;
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  addUserMsg: function(text) {
    var msgs = document.getElementById('ai-chat-msgs');
    if(!msgs) return;
    var div = document.createElement('div');
    div.className = 'ai-msg user';
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  showTyping: function() {
    var msgs = document.getElementById('ai-chat-msgs');
    var div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.id = 'ai-typing-indicator';
    div.innerHTML = '<div class="ai-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  },

  hideTyping: function() {
    var el = document.getElementById('ai-typing-indicator');
    if(el) el.remove();
  },

  formatMsg: function(text) {
    return text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  },

  send: function() {
    var input = document.getElementById('ai-chat-input');
    var text = input.value.trim();
    if(!text) return;
    input.value = '';
    AIChatbot.addUserMsg(text);
    AIChatbot.showTyping();

    // Ensure data is loaded
    if(!AIChatbot.data && typeof AIBrain !== 'undefined') {
      AIBrain.runFullAnalysis(function(a) {
        AIChatbot.data = a;
        setTimeout(function(){ AIChatbot.processQuery(text); }, 500);
      });
    } else {
      setTimeout(function(){ AIChatbot.processQuery(text); }, 400 + Math.random()*600);
    }
  },

  askSuggestion: function(text) {
    document.getElementById('ai-chat-input').value = text;
    AIChatbot.send();
  },

  processQuery: function(q) {
    AIChatbot.hideTyping();
    var ql = q.toLowerCase();
    var a = AIChatbot.data || {};
    var fin = a.financial || {};
    var hr = a.hr || {};
    var wh = a.warehouse || {};
    var prod = a.production || {};
    var qual = a.quality || {};
    var sup = a.suppliers || {};
    var cf = a.cashFlow || [];
    var fraud = a.fraud || [];
    var raw = a.raw || {};

    // === PROFITS / REVENUE ===
    if(ql.match(/(أرباح|ربح|profit|revenue|إيراد|ايراد|دخل|كسب|مكسب)/)) {
      var msg = '📊 **تحليل الأرباح والإيرادات**\n\n';
      msg += '💰 **الإيرادات:** EGP '+fin.revenue.toLocaleString()+'\n';
      msg += '📉 **المصروفات:** EGP '+fin.expenses.toLocaleString()+'\n';
      msg += '📈 **صافي الربح:** EGP '+fin.profit.toLocaleString()+'\n\n';
      if(fin.profit < 0) msg += '⚠️ **تنبيه:** هناك خسارة صافية هذا الشهر. السبب الرئيسي هو ارتفاع المصروفات مقارنة بالإيرادات.\n\n**التوصية:** مراجعة بنود المصروفات وتقليل التكاليف غير الضرورية.';
      else msg += '✅ الوضع المالي مستقر. استمر في متابعة التكاليف.';
      if(fin.trends && fin.trends.length) {
        msg += '\n\n📊 **الاتجاهات:**\n';
        fin.trends.forEach(function(t){ msg += '• '+t.metric+': '+(t.change>=0?'↑':'↓')+' '+Math.abs(t.change)+'%\n'; });
      }
      AIChatbot.addBotMsg(msg, ['تكلفة كل قسم','التدفقات النقدية','كشف الاحتيال']);
      return;
    }

    // === EXPENSES / COSTS ===
    if(ql.match(/(مصروف|تكلفة|تكاليف|expense|cost|ميزانية|budget)/)) {
      var msg = '💸 **تحليل المصروفات والتكاليف**\n\n';
      msg += '📊 **إجمالي المصروفات:** EGP '+fin.expenses.toLocaleString()+'\n\n';
      msg += '🏢 **تكلفة كل قسم:**\n';
      Object.keys(fin.costByDept||{}).forEach(function(d){ msg += '• '+d+': EGP '+(fin.costByDept[d]||0).toLocaleString()+'\n'; });
      var maxDept = '', maxCost = 0;
      Object.keys(fin.costByDept||{}).forEach(function(d){ if(fin.costByDept[d]>maxCost){ maxCost=fin.costByDept[d]; maxDept=d; } });
      if(maxDept) msg += '\n⚠️ **أكثر قسم استهلاكاً:** '+maxDept+' (EGP '+maxCost.toLocaleString()+')';
      AIChatbot.addBotMsg(msg, ['الأرباح','حالة المخازن','أداء الموظفين']);
      return;
    }

    // === EMPLOYEES / HR ===
    if(ql.match(/(موظف|عامل|employee|أداء|اداء|غياب|تأخير|تاخير|استقال|staff|hr|حضور)/)) {
      var msg = '👥 **تحليل الموارد البشرية بالذكاء الاصطناعي**\n\n';
      msg += '👤 **إجمالي الموظفين:** '+(raw.employees||[]).length+'\n\n';
      msg += '⚠️ **موظفين معرضين للاستقالة:** '+hr.atRisk.length+'\n';
      hr.atRisk.slice(0,3).forEach(function(e){ msg += '  • '+e.name+' ('+e.dept+') - نسبة الخطر: '+e.risk+'%\n'; });
      msg += '\n⭐ **موظفين متميزين:** '+hr.topPerformers.length+'\n';
      hr.topPerformers.slice(0,3).forEach(function(e){ msg += '  • '+e.name+' ('+e.dept+')\n'; });
      msg += '\n📉 **موظفين منخفضي الأداء:** '+hr.lowPerformers.length+'\n';
      hr.lowPerformers.slice(0,3).forEach(function(e){ msg += '  • '+e.name+' - تأخر '+e.lateCount+' مرة\n'; });
      msg += '\n🏆 **مستحقين للمكافأة:** '+hr.rewardEligible.length;
      AIChatbot.addBotMsg(msg, ['الموظفين المتميزين','الغياب','الرواتب']);
      return;
    }

    // === INVENTORY / WAREHOUSE ===
    if(ql.match(/(مخزن|مخازن|inventory|warehouse|صنف|أصناف|stock|بضاع|راكد|نفد|نفاد)/)) {
      var msg = '📦 **تحليل المخازن بالذكاء الاصطناعي**\n\n';
      msg += '📊 **إجمالي الأصناف:** '+(raw.inventory||[]).length+'\n';
      msg += '🔴 **أصناف تحتاج إعادة طلب:** '+wh.reorderNeeded.length+'\n';
      msg += '⚪ **أصناف نفدت:** '+wh.deadStock.length+'\n';
      msg += '🟡 **أصناف منخفضة:** '+wh.lowStock.length+'\n\n';
      if(wh.reorderNeeded.length) {
        msg += '📋 **أصناف تحتاج إعادة طلب فوري:**\n';
        wh.reorderNeeded.slice(0,5).forEach(function(i){ msg += '• '+i.name+' (متبقي: '+i.qty+' / حد أدنى: '+i.reorder+')\n'; });
      }
      if(wh.alerts.length) { msg += '\n🚨 **تنبيهات:**\n'; wh.alerts.slice(0,3).forEach(function(al){ msg += '• '+al.msg+'\n'; }); }
      AIChatbot.addBotMsg(msg, ['أصناف نفدت','إعادة طلب','الموردين']);
      return;
    }

    // === SUPPLIERS ===
    if(ql.match(/(مورد|موردين|supplier|vendor|شراء|purchase)/)) {
      var msg = '🏪 **تحليل الموردين بالذكاء الاصطناعي**\n\n';
      if(sup.best) msg += '🥇 **أفضل مورد (أكثر تعاملاً):** '+sup.best.name+' ('+sup.best.orders+' طلب)\n';
      if(sup.fastest) msg += '🚀 **أسرع مورد:** '+sup.fastest.name+'\n';
      if(sup.cheapest) msg += '💰 **أقل تكلفة:** '+sup.cheapest.name+'\n';
      if(sup.mostDelayed) msg += '⚠️ **أكثر مورد تأخيراً:** '+sup.mostDelayed.name+' ('+sup.mostDelayed.delayed+' تأخير)\n';
      msg += '\n📊 **ترتيب الموردين:**\n';
      (sup.rankings||[]).slice(0,5).forEach(function(s,i){ msg += (i+1)+'. '+s.name+' - '+s.orders+' طلب - EGP '+s.totalAmount.toLocaleString()+'\n'; });
      AIChatbot.addBotMsg(msg, ['أفضل مورد','حالة المخازن','طلبات الشراء']);
      return;
    }

    // === CASH FLOW ===
    if(ql.match(/(تدفق|نقد|cash.*flow|سيولة|liquidity|forecast|تنبؤ)/)) {
      var msg = '💵 **التنبؤ بالتدفقات النقدية**\n\n';
      cf.forEach(function(f){
        var emoji = f.projected>=0?'✅':'🔴';
        msg += emoji+' **بعد '+f.days+' يوم:** EGP '+f.projected.toLocaleString()+'\n';
        msg += '   إيرادات: '+f.revenue.toLocaleString()+' | مصروفات: '+f.expenses.toLocaleString()+'\n\n';
      });
      AIChatbot.addBotMsg(msg, ['الأرباح','المصروفات','حالة المخازن']);
      return;
    }

    // === FRAUD ===
    if(ql.match(/(احتيال|تلاعب|fraud|مكرر|duplicate|مشبوه|suspicious)/)) {
      var msg = '🚨 **نظام كشف الاحتيال بالذكاء الاصطناعي**\n\n';
      if(fraud.length === 0) { msg += '✅ لم يتم اكتشاف أي عمليات مشبوهة. النظام آمن.'; }
      else {
        msg += '⚠️ **تم اكتشاف '+fraud.length+' تنبيه:**\n\n';
        fraud.forEach(function(f){ msg += '🔴 **'+f.type.replace(/_/g,' ')+'**\n'+f.msg+'\n\n'; });
      }
      AIChatbot.addBotMsg(msg, ['الأرباح','الموردين','أداء الموظفين']);
      return;
    }

    // === PRODUCTION ===
    if(ql.match(/(إنتاج|انتاج|production|مصنع|factory|تشغيل|خط)/)) {
      var msg = '⚙️ **تحليل الإنتاج**\n\n';
      msg += '📊 **الكفاءة:** '+prod.efficiency+'%\n';
      msg += '📋 **إجمالي الأوامر:** '+prod.totalOrders+'\n';
      msg += '✅ **مكتمل:** '+prod.completed+'\n';
      msg += '⏳ **متأخر:** '+prod.delayed+'\n';
      if(prod.alerts.length) { msg += '\n🚨 **تنبيهات:**\n'; prod.alerts.forEach(function(al){ msg += '• '+al.msg+'\n'; }); }
      AIChatbot.addBotMsg(msg, ['حالة المخازن','الصيانة','الجودة']);
      return;
    }

    // === QUALITY ===
    if(ql.match(/(جودة|quality|فحص|inspect|رفض|reject)/)) {
      var msg = '✅ **تحليل الجودة**\n\n';
      msg += '📊 **نسبة النجاح:** '+qual.passRate+'%\n\n';
      var reasons = Object.keys(qual.failReasons||{});
      if(reasons.length) { msg += '❌ **أسباب الرفض:**\n'; reasons.forEach(function(r){ msg += '• '+r+': '+qual.failReasons[r]+' مرة\n'; }); }
      else msg += '✅ لا توجد حالات رفض مسجلة.';
      AIChatbot.addBotMsg(msg, ['الإنتاج','المخازن','الموردين']);
      return;
    }

    // === MAINTENANCE ===
    if(ql.match(/(صيانة|maintenance|عطل|إصلاح|اصلاح|repair)/)) {
      var maint = a.maintenance||{};
      var msg = '🔧 **تحليل الصيانة**\n\n';
      msg += '📋 **طلبات معلقة:** '+(maint.pending||0)+'\n';
      msg += '⚠️ **متأخرة:** '+(maint.overdue||0)+'\n';
      msg += '💰 **التكلفة المقدرة:** EGP '+(maint.costEstimate||0).toLocaleString()+'\n';
      if(maint.alerts && maint.alerts.length) { msg += '\n🚨 **تنبيهات:**\n'; maint.alerts.forEach(function(al){ msg += '• '+al.msg+'\n'; }); }
      AIChatbot.addBotMsg(msg, ['الإنتاج','قطع الغيار','حالة المخازن']);
      return;
    }

    // === PAYROLL ===
    if(ql.match(/(راتب|رواتب|مرتب|مرتبات|salary|payroll)/)) {
      var totalPayroll = (raw.payroll||[]).reduce(function(s,p){ return s+(p.net_salary||0); },0);
      var avgSalary = (raw.payroll||[]).length ? Math.round(totalPayroll/(raw.payroll||[]).length) : 0;
      var msg = '💰 **تحليل الرواتب**\n\n';
      msg += '📊 **إجمالي الرواتب:** EGP '+totalPayroll.toLocaleString()+'\n';
      msg += '📈 **متوسط الراتب:** EGP '+avgSalary.toLocaleString()+'\n';
      msg += '👥 **عدد السجلات:** '+(raw.payroll||[]).length+'\n';
      var pending = (raw.payroll||[]).filter(function(p){ return p.status==='processing'; }).length;
      if(pending) msg += '\n⚠️ **رواتب لم تصرف بعد:** '+pending;
      AIChatbot.addBotMsg(msg, ['أداء الموظفين','المصروفات','الأرباح']);
      return;
    }

    // === Navigate commands (expanded) ===
    var navMap = {
      'مخازن|inventory|warehouse|مخزن': 'inventory',
      'مبيعات|sales': 'erp-sales',
      'موظف|employees|حضور|attendance': 'attendance',
      'إجازة|إجازات|leaves|اجاز': 'leaves',
      'مرتبات|رواتب|payroll|salary': 'payroll',
      'مشتريات|procurement|purchase|شراء': 'purchase-requests',
      'إنتاج|production|انتاج': 'erp-production',
      'جودة|quality': 'erp-quality',
      'صيانة|maintenance': 'erp-maintenance',
      'معدات|equipment': 'erp-equipment',
      'شركات صيانة|maint.*compan': 'maint-companies',
      'bom|مكونات': 'erp-bom',
      'تتبع|traceability|trace': 'production-trace',
      'موردين|suppliers|مورد': 'erp-suppliers',
      'هندس|engineering': 'engineering',
      'لوجستي|logistics': 'logistics',
      'أسطول|fleet': 'erp-fleet',
      'تقارير|reports': 'reports',
      'إعدادات|settings': 'system-settings',
      'صلاحيات|permissions': 'screen-permissions',
      'بحث|search': 'global-search',
      'تقييم.*مورد|supplier.*perf': 'supplier-performance',
      'قطع غيار|spare.*parts': 'spare-parts',
      'dashboard|لوحة': 'dashboard',
    };
    if(ql.match(/(افتح|فتح|روح|open|navigate|go to|اعرض|ورين)/)) {
      for(var pattern in navMap) {
        if(ql.match(new RegExp(pattern))) {
          App.navigate(navMap[pattern]);
          AIChatbot.addBotMsg('✅ تم فتح الصفحة.');
          return;
        }
      }
    }

    // === AI ACTION EXECUTION ===
    // Create Purchase Request
    if(ql.match(/(اعمل|انشئ|create|make).*(طلب شراء|purchase request|طلب.*مشتريات)/i)) {
      var match = ql.match(/(\d+)\s*(kg|كيلو|طن|قطعة|piece|liter|لتر)/i);
      var qty = match ? match[1] : '?';
      var unit = match ? match[2] : '';
      var material = q.replace(/(اعمل|انشئ|create|make).*(طلب شراء|purchase request|طلب.*مشتريات)/i,'').replace(/(\d+)\s*(kg|كيلو|طن|قطعة|piece|liter|لتر)/i,'').trim();
      var msg = '📝 **تأكيد إنشاء طلب شراء**\n\n';
      msg += '📦 المادة: **'+(material||'غير محدد')+'**\n';
      msg += '📊 الكمية: **'+qty+' '+unit+'**\n\n';
      msg += 'هل تريد المتابعة؟';
      AIChatbot.addBotMsg(msg);
      // Add action buttons
      var msgs = document.getElementById('ai-chat-msgs');
      var btnDiv = document.createElement('div');
      btnDiv.style.cssText = 'display:flex;gap:8px;padding:8px 16px';
      btnDiv.innerHTML = '<button class="btn btn-primary btn-xs" onclick="AIChatbot.executePR(\''+material+'\','+qty+',\''+unit+'\')">✅ تأكيد</button>' +
        '<button class="btn btn-outline btn-xs" onclick="AIChatbot.addBotMsg(\'❌ تم الإلغاء.\')">❌ إلغاء</button>';
      msgs.appendChild(btnDiv);
      msgs.scrollTop = msgs.scrollHeight;
      return;
    }

    // Create Leave Request
    if(ql.match(/(اعمل|انشئ|create|عايز).*(إجازة|اجازة|leave)/i)) {
      AIChatbot.addBotMsg('📝 سأفتح لك شاشة الإجازات لإنشاء طلب جديد.');
      App.navigate('leaves');
      return;
    }

    // === FALLBACK ===
    var msg = '🧠 فهمت سؤالك عن **"'+q+'"**\n\nيمكنني مساعدتك في:\n\n';
    msg += '• 💰 **الأرباح والمصروفات** - اسأل "كم أرباح اليوم؟"\n';
    msg += '• 👥 **أداء الموظفين** - اسأل "تحليل الموظفين"\n';
    msg += '• 📦 **المخازن** - اسأل "حالة المخازن"\n';
    msg += '• 🏪 **الموردين** - اسأل "تحليل الموردين"\n';
    msg += '• 💵 **التدفقات النقدية** - اسأل "التنبؤ بالسيولة"\n';
    msg += '• 🚨 **كشف الاحتيال** - اسأل "هل يوجد تلاعب؟"\n';
    msg += '• ⚙️ **الإنتاج** - اسأل "كفاءة الإنتاج"\n';
    msg += '• 🔧 **الصيانة** - اسأل "حالة الصيانة"\n';
    msg += '• ✅ **الجودة** - اسأل "نسبة الجودة"\n';
    msg += '• 📝 **إنشاء طلبات** - قل "اعمل طلب شراء 100 KG"\n';
    msg += '• 🗺️ **تنقل** - قل "افتح المخازن" أو "افتح الإنتاج"\n';
    msg += '• 🗣️ **أوامر صوتية** - اضغط على زر 🎤\n';
    AIChatbot.addBotMsg(msg, ['كم أرباح اليوم؟','حالة المخازن','أداء الموظفين','افتح المشتريات']);
  },

  executePR: function(material, qty, unit) {
    sbClient.from('purchase_requests').insert({
      request_number: 'PR-AI-'+Date.now(),
      item_name: material || 'مادة خام',
      quantity: qty || 1,
      unit: unit || 'KG',
      status: 'pending',
      requested_by: App.user ? App.user.id : null,
      notes: 'Created by AI Assistant'
    }).then(function(r) {
      if(r.error) { AIChatbot.addBotMsg('❌ خطأ: '+r.error.message); return; }
      AIChatbot.addBotMsg('✅ **تم إنشاء طلب الشراء بنجاح!**\n\nرقم الطلب: PR-AI-...\nالحالة: قيد الانتظار\n\nسيتم إشعار قسم المشتريات.');
      // Audit log
      sbClient.from('audit_log').insert({
        action: 'AI_CREATE_PR', user_name: App.user?App.user.full_name:'',
        details: 'AI created purchase request for '+material+' qty '+qty,
        user_id: App.user?App.user.id:null
      }).then(function(){});
    });
  },

  // === VOICE ASSISTANT ===
  startVoice: function() {
    var btn = document.getElementById('ai-voice-btn');
    if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      AIChatbot.addBotMsg('⚠️ المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.');
      return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new SR();
    recognition.lang = 'ar-EG';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btn.classList.add('recording');
    btn.textContent = '⏹️';
    AIChatbot.addBotMsg('🎤 جاري الاستماع... تحدث الآن');

    recognition.onresult = function(event) {
      var text = event.results[0][0].transcript;
      btn.classList.remove('recording');
      btn.textContent = '🎤';
      document.getElementById('ai-chat-input').value = text;
      AIChatbot.send();
    };
    recognition.onerror = function() {
      btn.classList.remove('recording');
      btn.textContent = '🎤';
      AIChatbot.addBotMsg('⚠️ لم أتمكن من سماعك. حاول مرة أخرى.');
    };
    recognition.onend = function() {
      btn.classList.remove('recording');
      btn.textContent = '🎤';
    };
    recognition.start();
  }
};

// Auto-init chatbot after login
var _origRenderApp = App.renderApp;
if(typeof _origRenderApp === 'function') {
  App.renderApp = function() {
    _origRenderApp.call(App);
    setTimeout(function(){ AIChatbot.init(); }, 1000);
  };
}
