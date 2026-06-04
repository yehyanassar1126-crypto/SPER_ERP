/* ===== EMPLOYEE CHATBOT ===== */
// A floating assistant for employees to ask HR-related questions.

var EmployeeChatbot = {
  isOpen: false,
  messages: [],
  
  init: function() {
    if (!App.user) return; // Only for logged in users
    
    // Inject Chatbot UI into DOM if it doesn't exist
    if (!document.getElementById('employee-chatbot-container')) {
      var container = document.createElement('div');
      container.id = 'employee-chatbot-container';
      document.body.appendChild(container);
    }
    
    this.render();
  },
  
  render: function() {
    var container = document.getElementById('employee-chatbot-container');
    if (!container) return;
    
    var html = '';
    
    if (!this.isOpen) {
      html = '<div class="chatbot-trigger" onclick="EmployeeChatbot.toggle()" style="position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg, var(--accent-primary), #a855f7);box-shadow:0 8px 24px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;color:white;cursor:pointer;z-index:9999;transition:transform 0.3s;font-size:28px;">🤖</div>';
    } else {
      html = '<div class="chatbot-window" style="position:fixed;bottom:24px;right:24px;width:350px;height:500px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-xl);box-shadow:0 12px 32px rgba(0,0,0,0.2);display:flex;flex-direction:column;z-index:9999;overflow:hidden;animation:slideUp 0.3s ease;">';
      
      // Header
      html += '<div style="padding:16px;background:linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1));border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">';
      html += '<div style="display:flex;align-items:center;gap:10px;"><div style="font-size:24px;">🤖</div><div><h4 style="margin:0;font-size:1rem;color:var(--text-primary);">HR Assistant</h4><span style="font-size:0.7rem;color:var(--accent-success);">● Online</span></div></div>';
      html += '<button onclick="EmployeeChatbot.toggle()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;">✖</button>';
      html += '</div>';
      
      // Messages
      html += '<div id="chatbot-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">';
      
      if (this.messages.length === 0) {
        this.messages.push({ role: 'bot', text: 'أهلاً بك يا ' + App.user.full_name.split(' ')[0] + '! 👋\nأنا المساعد الآلي بتاعك، أقدر أجاوبك على أسئلة عن إجازاتك، مرتبك، ساعاتك الإضافية، أو حضورك. اسألني أي حاجة!' });
      }
      
      this.messages.forEach(function(msg) {
        var isUser = msg.role === 'user';
        html += '<div style="display:flex;gap:8px;align-items:flex-end;flex-direction:' + (isUser ? 'row-reverse' : 'row') + '">';
        html += '<div style="width:28px;height:28px;border-radius:50%;background:' + (isUser ? 'var(--bg-tertiary)' : 'var(--accent-primary-soft)') + ';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">' + (isUser ? '👤' : '🤖') + '</div>';
        html += '<div style="max-width:75%;padding:10px 14px;border-radius:14px;font-size:0.85rem;line-height:1.5;background:' + (isUser ? 'var(--accent-primary)' : 'var(--bg-tertiary)') + ';color:' + (isUser ? 'white' : 'var(--text-primary)') + ';' + (isUser ? 'border-bottom-right-radius:4px;' : 'border-bottom-left-radius:4px;') + '">' + msg.text.replace(/\n/g, '<br>') + '</div>';
        html += '</div>';
      });
      
      html += '</div>';
      
      // Input
      html += '<div style="padding:12px;border-top:1px solid var(--border-color);display:flex;gap:8px;">';
      html += '<input type="text" id="chatbot-input" placeholder="اكتب سؤالك هنا..." style="flex:1;padding:10px 14px;border-radius:var(--radius-full);border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);outline:none;font-size:0.85rem;">';
      html += '<button onclick="EmployeeChatbot.sendMessage()" style="width:40px;height:40px;border-radius:50%;background:var(--accent-primary);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">' + (typeof icon !== 'undefined' ? icon('send', 16) : '➤') + '</button>';
      html += '</div>';
      
      html += '</div>';
    }
    
    container.innerHTML = html;
    
    if (this.isOpen) {
      var msgs = document.getElementById('chatbot-messages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
      
      var input = document.getElementById('chatbot-input');
      if (input) {
        input.focus();
        input.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') EmployeeChatbot.sendMessage();
        });
      }
    }
  },
  
  toggle: function() {
    this.isOpen = !this.isOpen;
    this.render();
  },
  
  sendMessage: function() {
    var input = document.getElementById('chatbot-input');
    if (!input || !input.value.trim()) return;
    
    var text = input.value.trim();
    this.messages.push({ role: 'user', text: text });
    input.value = '';
    this.render();
    
    // Show typing
    var msgs = document.getElementById('chatbot-messages');
    msgs.innerHTML += '<div id="chatbot-typing" style="display:flex;gap:8px;align-items:flex-end;margin-top:12px;"><div style="width:28px;height:28px;border-radius:50%;background:var(--accent-primary-soft);display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div><div style="padding:10px 14px;border-radius:14px;background:var(--bg-tertiary);border-bottom-left-radius:4px;font-size:12px;color:var(--text-muted);">أفكر...</div></div>';
    msgs.scrollTop = msgs.scrollHeight;
    
    setTimeout(function() {
      EmployeeChatbot.processQuery(text);
    }, 1000);
  },
  
  processQuery: function(query) {
    var q = query.toLowerCase();
    var response = "";
    
    // Simple intents
    if (q.match(/(ازاى|ازاي|كيف|طريقة|خطوات|عمل|how to|how do i)/)) {
      if (q.match(/(اجازة|إجازة|leave|vacation)/)) {
        response = "عشان تقدم على إجازة، اتبع الخطوات دي:\n1. افتح القائمة الجانبية.\n2. اختار 'Leave Requests'.\n3. اضغط على زر 'New Request'.\n4. اختار نوع الإجازة، وتاريخ البداية والنهاية، واكتب السبب.\n5. اضغط 'Submit' واستنى موافقة الـ HR.";
      } else if (q.match(/(حضور|انصراف|check|بصمة|تسجيل)/)) {
        response = "عشان تسجل حضورك أو انصرافك:\n1. في الصفحة الرئيسية (Dashboard)، هتلاقي زرار 'QR Check-In' فوق.\n2. اضغط عليه ووجه الكاميرا لـ QR Code الخاص بالشركة.\n3. لو تم بنجاح، هيتسجل وقت حضورك/انصرافك فوراً.";
      } else if (q.match(/(سلفة|سلفه|قرض|loan)/)) {
        response = "عشان تطلب سلفة:\n1. افتح 'Loans & Advances' من القائمة الجانبية.\n2. اضغط 'Request Loan'.\n3. حدد المبلغ، وعدد الأقساط، والسبب.\n4. اضغط 'Submit Request' للتقديم واستنى الموافقة.";
      } else if (q.match(/(طبي|طبية|علاج|روشتة|مستشفى|عملية|مرض|دواء|صيدلية|medical)/)) {
        response = "عشان ترفع احتياج طبي (روشتة، إيصال مستشفى، إلخ):\n1. روح لصفحة 'Medical Needs' (الاحتياجات الطبية) من القائمة الجانبية.\n2. اضغط 'Submit Medical Receipt'.\n3. اكتب الوصف وارفع صورة الإيصال أو الروشتة.\n4. اضغط 'Submit Request'.\n5. بعد الموافقة، الـ HR هيضيفلك المبلغ المستحق على المرتب.";
      } else if (q.match(/(مرتب|راتب|salary|فلوس|قبض)/)) {
        response = "عشان تشوف مفردات مرتبك:\n1. ادخل على 'My Salary' من القائمة الجانبية.\n2. هتلاقي تفاصيل الراتب الأساسي، البدلات، الخصومات، وصافي المرتب للشهر الحالي.";
      } else if (q.match(/(اضافي|إضافي|overtime|ساعات)/)) {
        response = "لطلب ساعات إضافية (Overtime):\n1. روح لصفحة 'My Overtime'.\n2. اضغط 'Log Overtime'.\n3. حدد التاريخ، عدد الساعات، وسبب العمل الإضافي.\n4. اضغط 'Submit Request'.";
      } else if (q.match(/(مستند|ورق|شهادة|document|ملف)/)) {
        response = "عشان ترفع مستنداتك (زي كعب العمل أو الفيش):\n1. روح لصفحة 'My Documents'.\n2. اضغط 'Upload Document'.\n3. اختار نوع المستند وارفع الملف.\n4. اضغط 'Upload'.";
      } else if (q.match(/(يونيفورم|زي|لبس|uniform)/)) {
        response = "لطلب يونيفورم جديد:\n1. ادخل على 'My Uniforms' من القائمة الجانبية.\n2. اضغط 'Request Uniform'.\n3. اختار القطعة والمقاس المناسب لك.\n4. اضغط 'Submit Request'.";
      } else if (q.match(/(تأخير|تاخير|خصم|delay|deduction|تأخيرات|تأخيراتي)/)) {
        response = "عشان تشوف تأخيراتك والخصومات بالتفصيل:\n1. افتح القائمة الجانبية.\n2. اختار 'تأخيراتي' (My Delays).\n3. هتلاقي جدول فيه كل يوم اتأخرت فيه، متأخر كام ساعة بالظبط، ونوع الخصم (ربع يوم / نص يوم / يوم كامل)، والمبلغ اللي اتخصم بالأرقام.\n4. الخصومات بتتسجل تلقائي في قاعدة البيانات لحظة ما تعمل Check-in متأخر.";
      } else {
        response = "عشان أقدر أساعدك بالخطوات، ياريت تحددلي إنت عايز تعمل إيه بالظبط؟ (مثلاً: ازاي اقدم على اجازة، ازاي اطلب سلفة، ازاي اسجل حضور).";
      }
    }
    else if (q.match(/(إجازات|اجازة|leave|vacation|رصيد)/)) {
      var taken = App.user.leaves_taken || 0;
      var total = App.user.annual_leave_balance || 21;
      var remaining = total - taken;
      response = "رصيد إجازاتك السنوي هو " + total + " يوم.\nأنت أخذت " + taken + " يوم.\nمتبقي لك **" + remaining + " أيام** تقدر تاخدهم.";
    }
    else if (q.match(/(مرتب|راتب|salary|فلوس|pay)/)) {
      response = "مرتبك الأساسي المسجل هو **" + (App.user.base_salary ? App.user.base_salary.toLocaleString() + " جنيه" : "غير محدد") + "**.\nتقدر تشوف تفاصيل مفردات المرتب بالكامل من صفحة 'My Salary' في القائمة الجانبية.";
    }
    else if (q.match(/(حضور|غياب|تأخير|attendance|absent|late|delay|تاخير|تأخيرات|تأخيراتي)/)) {
      response = "عشان تشوف كل أيام حضورك وغيابك بالتفصيل، ادخل على صفحة 'My Attendance'.\nلو عايز تشوف التأخيرات والخصومات بالتفصيل (متأخر كام ساعة، يوم كام، اتخصم كام بالأرقام)، ادخل على صفحة 'تأخيراتي' (My Delays) من القائمة الجانبية.\nكل تأخير فوق 15 دقيقة بيتخصم ربع يوم، فوق ساعتين نص يوم، فوق 6 ساعات يوم كامل.\nلو نسيت تعمل Check-in النهاردة، تقدر تعمله دلوقتي من زرار الـ QR Check-In فوق!";
    }
    else if (q.match(/(إضافي|اضافي|overtime|ساعات)/)) {
      response = "الساعات الإضافية بتاعتك بتتحسب وتتسجل في صفحة 'My Overtime'. لو عملت أوفرتايم جديد، متنساش تقدم طلب بيه عشان يتوافق عليه وينزل في المرتب.";
    }
    else if (q.match(/(سلام|اهلا|مرحبا|hi|hello)/)) {
      response = "أهلاً بك! إزاي أقدر أساعدك النهاردة؟";
    }
    else if (q.match(/(شكرا|شكر|thanks)/)) {
      response = "العفو! أنا هنا دايماً عشان أساعدك. يوم سعيد! 😊";
    }
    else {
      response = "عذراً، مش فاهم سؤالك أوي. تقدر تسألني عن: إجازاتك، مرتبك، الساعات الإضافية، أو حضورك. \nأو ممكن تتواصل مع الـ HR مباشرة لو محتاج تفاصيل أكتر.";
    }
    
    this.messages.push({ role: 'bot', text: response });
    this.render();
  }
};

// Initialize after app loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (App.user) EmployeeChatbot.init();
  }, 2000); // Give app time to initialize
});
