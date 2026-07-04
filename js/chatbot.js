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
        response = "عشان ترفع احتياج طبي (روشتة، إيصال مستشفى، إلخ):\n1. روح لصفحة 'Medical Needs' (الاحتياجات الطبية) من القائمة الجانبية.\n2. اضغط 'Submit Medical Receipt'.\n3. اكتب الوصف وارفع صورة الإيصال أو الروشتة.\n4. دورتها كالتالي: (التمريض ➔ المدير ➔ الحسابات لإصدار فاتورة ➔ الـ HR للإضافة للراتب).\n5. تقدر تتابع حالة الطلب وسبب الرفض (لو اترفض) من نفس الشاشة.";
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
      } else if (q.match(/(مأمورية|مأموريات|mission)/)) {
        response = "لعمل مأمورية:\n1. روح لصفحة 'المأموريات' من القائمة الجانبية.\n2. اكتب السبب واضغط 'إرسال طلب المأمورية'.\n3. بعد الموافقة، اضغط 'تسجيل الخروج'.\n4. بعد العودة، اضغط 'تسجيل العودة'.";
      } else if (q.match(/(مصاريف|مصروفات|بدل|expense|claims)/)) {
        response = "عشان تقدم طلب مصاريف (سفر، انتقالات، ضيافة):\n1. روح لصفحة 'My Expenses' من القائمة الجانبية.\n2. اضغط 'Submit Expense Claim'.\n3. حدد نوع المصروف وقيمته وتاريخه.\n4. اضغط 'Submit Claim' واستنى موافقة المالية والـ HR.";
      } else if (q.match(/(شكوى|شكاوى|تظلم|اقتراح|complaint|grievance)/)) {
        response = "لتقديم شكوى أو مقترح للإدارة:\n1. ادخل على صفحة 'My Complaints' أو 'Grievances & Disciplinary'.\n2. اضغط 'Submit Complaint'.\n3. تقدر تكتب الشكوى وكمان تختار 'Submit Anonymously' لو حابب اسمك ميبانش للـ HR.";
      } else if (q.match(/(استقالة|اخلاء|إخلاء|offboarding|resign)/)) {
        response = "لطلب استقالة أو إخلاء طرف، يرجى التوجه لمديرك المباشر أو الـ HR مباشرة ليتم بدء سير عمل إخلاء الطرف (Offboarding) وتسليم العهد.";
      } else if (q.match(/(شراء|مشتريات|طلبات|purchase)/)) {
        response = "لو عايز تطلب أدوات للقسم بتاعك (طلبات شراء):\n1. روح لصفحة 'Purchase Requests' (طلبات الشراء).\n2. اضغط 'Request Purchase'.\n3. اختار الصنف من المخزن أو اكتب اسم صنف جديد، وحدد الكمية.\n4. اضغط 'Submit' والطلب هيروح لمدير المشتروات عشان يوافق عليه.";
      } else if (q.match(/(مخزن|مخازن|مخزون|رصيد المخزن|inventory|stock)/)) {
        response = "بالنسبة للمخازن، لو إنت أمين مخزن أو مدير صالة:\n1. افتح 'Inventory & Stock' (المخازن).\n2. هتقدر تشوف رصيد كل صنف ونواقص المخزون.\n3. لو أمين مخزن تقدر تضيف أصناف جديدة وتسجل حركات (صرف/إضافة) للإنتاج.";
      } else if (q.match(/(لوحة|تحكم|مالك|إدارة|owner|dashboard)/)) {
        response = "لوحة تحكم الإدارة العليا (Owner Dashboard) متاحة فقط لمالك الشركة (Owner). بتعرض نظرة عامة على كل الأقسام زي الحضور، المخازن، تذاكر الدعم الفني، والمبيعات من شاشة واحدة.";
      } else if (q.match(/(دعم|فني|اي تي|مشكلة|كمبيوتر|لابتوب|شبكة|نت|عطل|صيانة|it|support|ticket)/)) {
        response = "عشان تطلب دعم فني (IT Support):\n1. روح لصفحة 'IT Support (الدعم الفني)' من القائمة الجانبية.\n2. اضغط 'Request IT Support'.\n3. حدد نوع المشكلة (Hardware, Software, Network) ومستوى أولويتها واكتب التفاصيل.\n4. اضغط 'Submit' وقسم الـ IT هيستلمها ويحلها وتتسجل في الداتا بيز.";
      } else if (q.match(/(عهدة|عهد|فلوس|تسوية|فاتورة|فواتير|petty|cash|settlement)/)) {
        response = "بالنسبة للعهد والتسويات (Petty Cash & Settlements):\n1. قسم الحسابات يقدر يطلع عهدة للمشتروات من 'Issue Cash'.\n2. المشتروات بترفع صورة الفاتورة وتكتب السعر الفعلي اللي اتصرف.\n3. الحسابات بتراجع وتعمل 'تسوية (Settle)' — بيكتب المبلغ المصروف فعلياً والسيستم بيحسب المرتجع أوتوماتيك.\n4. بعد التسوية بتظهر التفاصيل (مصروف + مرتجع + ملاحظات) في الجدول.\n\n**جديد - الشيكات (Checks):**\n• تقدر تصدر شيك من الخزينة (رقم الشيك + المستفيد + المبلغ + تاريخ الاستحقاق).\n• الشيك بينزل بحالة 'معلق ⏳'.\n• لما تيجي تصرفه بتختار يتحول لأي بنك أو خزنة.";
      } else {
        response = "عشان أقدر أساعدك بالخطوات، ياريت تحددلي إنت عايز تعمل إيه بالظبط؟ (مثلاً: ازاي اقدم على اجازة، دعم فني، سلفة، أو تسوية عهدة).";
      }
    }
    else if (q.match(/(إجازات|اجازة|اجازات|إجازاتي|اجازاتي|leave|vacation|رصيد)/)) {
      var remaining = App.user.annual_leave_balance !== undefined && App.user.annual_leave_balance !== null ? App.user.annual_leave_balance : 24;
      var taken = 24 - remaining;
      response = "إجمالي رصيد إجازاتك السنوي الأساسي هو 24 يوم.\nأنت أخذت **" + taken + " يوم**.\nمتبقي لك في الرصيد **" + remaining + " أيام** تقدر تاخدهم.";
    }
    else if (q.match(/(مرتب|راتب|salary|فلوس|pay)/)) {
      response = "مرتبك الأساسي المسجل هو **" + (App.user.base_salary ? App.user.base_salary.toLocaleString() + " جنيه" : "غير محدد") + "**.\nتقدر تشوف تفاصيل مفردات المرتب بالكامل من صفحة 'My Salary' في القائمة الجانبية.";
    }
    else if (q.match(/(حضور|غياب|تأخير|attendance|absent|late|delay|تاخير|تأخيرات|تأخيراتي)/)) {
      response = "عشان تشوف كل أيام حضورك وغيابك بالتفصيل، ادخل على صفحة 'My Attendance'.\nلو عايز تشوف التأخيرات والخصومات بالتفصيل (متأخر كام ساعة، يوم كام، اتخصم كام بالأرقام)، ادخل على صفحة 'تأخيراتي' (My Delays) من القائمة الجانبية.\nكل تأخير فوق 15 دقيقة بيتخصم ربع يوم، فوق ساعتين نص يوم، فوق 6 ساعات يوم كامل.\nلو نسيت تعمل Check-in النهاردة، تقدر تعمله دلوقتي من زرار الـ QR Check-In فوق!";
    }
    else if (q.match(/(مأمورية|مأموريات|مأموريه|مأمورياتي|mission|missions)/)) {
      response = "لطلب مأمورية عمل خارجية:\n1. ادخل على صفحة 'المأموريات' (My Missions) من القائمة الجانبية.\n2. اكتب سبب ووجهة المأمورية واضغط 'إرسال طلب'.\n3. بمجرد موافقة الـ HR، هيظهرلك زرار 'تسجيل الخروج'.\n4. لما تخلص مأموريتك، متنساش تدخل تاني وتضغط 'تسجيل العودة' عشان تتحسبلك ساعات المأمورية ضمن يوم عملك.";
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
    else if (q.match(/(مخزن|مخازن|مخزون|رصيد المخزن|inventory|stock)/)) {
      response = "المخازن ومراقبة المخزون مخصصة فقط لأمناء المخازن ومديري الصالات. هتلاقيها في القائمة الجانبية باسم 'Inventory (المخازن)' وتقدر من خلالها تشوف الرصيد وتسجل حركات الصرف والإضافة.";
    }
    else if (q.match(/(شراء|مشتريات|طلبات|استلام|خامات|مورد|purchase|supplier)/)) {
      response = "دورة المشتريات والموردين:\n1. كل مدير يقدر يطلب مشتريات للقسم بتاعه.\n2. قسم المشتريات بيجيب عروض أسعار ويعتمدها.\n3. **جديد:** لما المورد يورد الخامات، قسم المشتريات بيسجل 'استلام' من تبويب (استلام مواد خام)، والسيستم بيبعتها أوتوماتيك لقسم الجودة للفحص قبل ما تدخل المخزن.";
    }
    else if (q.match(/(مبيعات|بيع|sales|عملاء|أوامر بيع|اوامر بيع)/)) {
      response = "**قسم المبيعات (Sales):**\nهو المسؤول عن إنشاء 'أوامر البيع'.\n**جديد:** لو التخطيط بلغ بوجود نقص خامات، المبيعات بترجع للعميل وتاخد قراره:\n• استلام جزئي للكمية المتاحة دلوقتي والباقي بعدين.\n• انتظار الكمية كاملة بعد التوريد.\n• رفض الطلب.";
    }
    else if (q.match(/(تخطيط|خطط|planning|انتاج|إنتاج|خطة|نقص|خام)/) && !q.match(/انتاج/)) {
      response = "**قسم التخطيط (Planning):**\nهو حلقة الوصل.\n**جديد:** التخطيط بيراجع مخزون الخامات لأي طلب بيع جديد.\n• لو الخامات متوفرة: بيدي أمر تشغيل للإنتاج.\n• لو الخامات ناقصة: بيبعت إشعار للمبيعات بالكمية المتاحة والتاريخ المتوقع، وبيعمل 'طلب شراء' آلي للمشتريات بالكمية الناقصة.";
    }
    else if (q.match(/(إنتاج|انتاج|تصنيع|مصنع|production|manufacturing)/)) {
      response = "**قسم الإنتاج (Production):**\nبيستلم خطة الإنتاج. ولما يخلص تصنيع المنتج، بيسجله 'تحت الفحص' (Under Inspection) وبيبعته لقسم الجودة عشان يتفحص قبل ما يدخل المخزن التام.\nلو اترفض، بيرجع للإنتاج (Rework) أو يُهلك (Scrap).";
    }
    else if (q.match(/(دعم|فني|اي تي|مشكلة|كمبيوتر|لابتوب|شبكة|نت|عطل|صيانة|it|support|ticket)/)) {
      response = "أي مدير يقدر يبعت طلب دعم فني (IT Support) من القائمة الجانبية. بيختار المشكلة (صعبة/متوسطة/بسيطة) وبيكتب التفاصيل، وقسم الـ IT بيستلم الطلب ويحدث حالته (جاري العمل أو تم الحل) وكل ده محفوظ في الداتا بيز.";
    }
    else if (q.match(/(عهدة|عهد|فلوس|تسوية|فاتورة|فواتير|petty|cash|settlement)/)) {
      response = "دورة العهد والتسويات بتبدأ من الحسابات بصرف المبلغ (Issue Cash)، بعدين المشتروات بترفع الفاتورة وتكتب السعر الفعلي، وأخيراً الحسابات بتعمل تسوية عشان تشوف المتبقي اللي المفروض يرجع.\n\n**جديد - تسويات الشراء:**\nبعد اعتماد عرض السعر من مدير المشتروات، الطلب بيروح تلقائي لقسم الحسابات في تبويب 'تسويات الشراء'.\nالحسابات بتشوف لو الموظف واخد عهدة قبل كده:\n• لو واخد عهدة → بيخصم من العهدة تلقائي.\n• لو مش واخد → بيصرفله كاش مستقل من الخزنة.";
    }
    else if (q.match(/(خزنة|بنك|أرصدة|حسابات|مالية|موردين|عملاء|قيود|ضرائب|أصول|ميزانية|safe|bank|treasury|finance|accounting|assets|taxes|شيك|تحويل)/)) {
      response = "**النظام المالي المتكامل (Enterprise Financial Suite):**\n1. **الخزنة والبنوك (Treasury):** تتابع أرصدة الخزنة والبنوك، وتعمل تحويلات بينهم، وتصدر شيكات.\n2. **العملاء والموردين (AP/AR):** سجلات كاملة + **مدفوعات معلقة** من المبيعات والمشتريات بتظهر أوتوماتيك عشان المحاسب يحصّل أو يسدد.\n3. **الأصول الثابتة (Fixed Assets):** تسجيل وتغيير الحالة (نشط، صيانة، مباع، مهلك).\n4. **الضرائب (Taxes):** متابعة الإقرارات وتغيير الحالة (معلق، مدفوع، متأخر).\n5. **القيود اليومية (Journal):** كل حركة بتتسجل أوتوماتيك.\n6. **العهد والشيكات (Petty Cash):** صرف عهد وشيكات + تسوية العهدة + صرف الشيك لبنك أو خزنة.\n7. **التحويلات (Transfers):** تحويل بين أي حساب (خزنة ↔ بنك ↔ خزنة).\n*ادخل على قسم الإدارة المالية الشاملة لكل التفاصيل.*";
    }
    else if (q.match(/(قطعة غيار|قطع غيار|قطعه غيار|مراقب|فحص قطع|متابعة قطع|spare part|inspector|فحص التالف|تالف|تلف)/)) {
      response = "**دورة قطع الغيار ومراقب قطع الغيار:**\n1. أي موظف (صيانة، لوجستيات) يطلب قطعة غيار من المخزن.\n2. يتم اعتماد الطلب وصرف القطعة الجديدة.\n3. **مراقب/مسؤول متابعة قطع الغيار** (Engineering) يتابع القطع المسترجعة وحركتها، ويفحص التالف ليحدد نسبة الاستهلاك، وسوء الاستخدام، والسبب الفني.\n4. **صلاحيات المراقب:** لا يمكنه إضافة أو خصم الأرصدة أو عمل استلامات مخزنية (هذا دور أمين المخزن)، ولكنه يملك صلاحية رؤية المشاريع والرسومات الهندسية وإصدار تقارير الاستهلاك وحركة قطع الغيار.";
    }
    else if (q.match(/(تسليم العميل|تسليم المبيعات|تسليم اوردر|تسليم الاوردر|تسليم المصنع|موافقة المخزن|تسليم مخزني|delivery)/)) {
      response = "**دورة التسليم للعملاء الجديدة:**\n1. بعد دفع العميل للحسابات، ينتقل الأوردر إلى أمين المخزن (تحت المراجعة لتسليم العميل).\n2. يراجع أمين المخزن البضاعة ويوافق على التسليم.\n3. يتحول الأوردر إلى 'جاهز للاستلام من المصنع'.\n4. يحضر العميل أو مندوبه، ويسجل أمين المخزن (اسمه ورقمه القومي أو تفويضه) ويؤكد التسليم النهائي ليتم خصم البضاعة نهائياً وإغلاق الطلب.";
    }
    else if (q.match(/(شيفت إداري|شيفت اداري|admin shift|9.*5|٩.*٥|تسعة.*خمسة|ميعاد الاداره|ميعاد الحسابات|ميعاد الاتش ار|ميعاد المديرين)/)) {
      response = "**الشيفت الإداري (Admin Shift):**\nتم التحديث! الشيفت الإداري (9 الصبح لـ 5 المساء) بقى مُخصص فقط للإدارات دي:\n• الموارد البشرية (HR)\n• الحسابات (Finance)\n• المبيعات (Sales)\n• المشتريات (Procurement)\n\nباقي الموظفين في الإنتاج، الهندسة، الجودة، والمخازن بيطبق عليهم تلقائياً الشيفت العادي من (8 الصبح لـ 4 العصر).";
    }
    else if (q.match(/(جودة|جوده|فحص|quality|qc|inspect)/)) {
      response = "**قسم الجودة (Quality Control) - محدث:**\nالجودة متقسمة دلوقتي لجزئين:\n1. **فحص مواد خام (Incoming):** بتستلم الخامات الموردة وتفحصها (مقبول، مرفوض، أو مقبول بشروط)، والمقبول بيدخل مخزن الخامات تلقائياً.\n2. **فحص منتج تام (Finished Goods):** بيفحص إنتاج المصنع، لو مطابق (Accept) بيدخل مخزن المنتجات التامة، ولو مرفوض بيرجع للإنتاج.\n\n**ملاحظة مهمة:** قطع الغيار التالفة **مش** مسؤولية الجودة، دي مسؤولية 'مراقب قطع الغيار'.";
    }
    else if (q.match(/(cv|سيرة ذاتية|ats|توظيف|متقدم|مرشح|تعيين|فحص cv|applicant|resume|hire|candidate)/)) {
      response = "**نظام فحص السير الذاتية بالذكاء الاصطناعي (AI ATS):**\n1. ادخل على '🤖 AI ATS' من القائمة الجانبية (متاحة للـ HR فقط).\n2. اضغط 'إضافة متقدم'.\n3. ارفع ملف الـ CV كـ PDF.\n4. النظام هيستخرج النص تلقائياً من الـ PDF.\n5. حدد المهارات المطلوبة واضغط 'تحليل بالذكاء الاصطناعي'.\n6. الـ AI هيديك Score من 100% ويحدد لو المتقدم مقبول أو محتاج مراجعة أو مرفوض.\n7. تقدر تنقل المتقدم بين المراحل: فحص → مقابلة → عرض → تعيين.";
    }
    else if (q.match(/(ملفي|بياناتي الشخصية|hr personal|my profile|ملف شخصي)/)) {
      response = "**ملفك الشخصي (HR Personal Profile):**\nلو إنت HR، تقدر تشوف بياناتك الشخصية زي أي موظف من صفحة 'ملفي الشخصي'.\nالصفحة فيها 5 تابات:\n• 📅 حضوري\n• ⏰ تأخيراتي\n• 💰 المرتب والخصومات\n• ⏱️ الإضافي\n• 🚗 مأمورياتي\nودي مش بتأثر على شاشات إدارة الموظفين.";
    }
    else if (q.match(/(تعديل حضور|حذف انصراف|إعادة فتح|اعادة فتح|edit attendance|delete checkout|reopen)/)) {
      response = "**تعديل سجل الحضور (للـ HR فقط):**\nمن شاشة الحضور، اضغط 'تعديل' بجانب أي سجل.\nتقدر:\n• ✏️ تعديل وقت الحضور/الانصراف والتأخير\n• 🗑️ حذف الانصراف (عشان الموظف يقدر يعمل scan تاني)\n• 🔄 إعادة فتح اليوم بالكامل\nكل تعديل لازم يكون له **سبب**، وبيتسجل في Audit Log.";
    }
    else if (q.match(/(لوحة|تحكم|مالك|إدارة|owner|dashboard)/)) {
      response = "الـ 'Owner Dashboard' هي لوحة تحكم خاصة بمالك الشركة فقط (General Manager) عشان يشوف ملخص لحالة كل الأقسام، الحضور، نواقص المخازن، والـ IT في شاشة واحدة.";
    }
    else {
      response = "عذراً، مش فاهم سؤالك أوي. تقدر تسألني عن:\n• المبيعات، التخطيط، الإنتاج، الجودة\n• إجازاتك، الحضور، التأخيرات\n• الدعم الفني (IT)\n• طلبات الشراء والمشتريات\n• **نظام فحص الـ CV بالذكاء الاصطناعي (ATS)**\n• **ملفي الشخصي (HR Personal)**\n• **تعديل/حذف سجلات الحضور**\n• قطع الغيار وتسليم المبيعات\n• **الإدارة المالية الشاملة** (خزنة، بنوك، شيكات، تسويات، تحويلات)\n• **مدفوعات المبيعات والمشتريات المعلقة** (جديد)\n• **تسوية العهد وصرف الشيكات** (جديد)";
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
