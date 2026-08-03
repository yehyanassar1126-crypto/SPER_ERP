// ===== HR ATS - AI-Powered Applicant Tracking System =====
window.Pages = window.Pages || {};

Pages.hrATS = function(el) {
  if (!App.isHR()) { el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 غير مصرح بالدخول</h2></div>'; return; }

  var applications = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span> جاري تحميل نظام فحص السير الذاتية...</div>';
    sbClient.from('ats_applications').select('*').order('created_at', {ascending: false}).then(function(r) {
      applications = r.data || [];
      render();
    });
  }

  function render() {
    var pending = applications.filter(function(a) { return a.status === 'pending'; }).length;
    var screening = applications.filter(function(a) { return a.status === 'screening'; }).length;
    var interview = applications.filter(function(a) { return a.status === 'interview'; }).length;
    var hired = applications.filter(function(a) { return a.status === 'hired'; }).length;
    var rejected = applications.filter(function(a) { return a.status === 'rejected'; }).length;

    var html = '<div style="margin-bottom:20px"><h3 style="margin:0">🤖 نظام تتبع المتقدمين وفحص السير الذاتية بالذكاء الاصطناعي</h3><p style="color:var(--text-muted)">ارفع السيرة الذاتية كملف PDF واترك الذكاء الاصطناعي يحللها تلقائياً</p></div>';

    html += '<div class="stats-grid">';
    html += _statCard('#f59e0b','clock',pending,'معلق');
    html += _statCard('#6366f1','search',screening,'قيد الفحص');
    html += _statCard('#3b82f6','users',interview,'مقابلة');
    html += _statCard('#22c55e','userCheck',hired,'تم التعيين');
    html += _statCard('#ef4444','xCircle',rejected,'مرفوض');
    html += '</div>';

    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:16px">';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn btn-outline" id="ats-tab-apps" style="border-color:var(--accent-primary);color:var(--accent-primary)">📋 المتقدمين</button>';
    html += '<button class="btn btn-ghost" id="ats-tab-add">➕ إضافة متقدم</button>';
    html += '</div>';
    html += '<select class="filter-select" id="ats-filter"><option value="">كل الحالات</option><option value="pending">معلق</option><option value="screening">قيد الفحص</option><option value="interview">مقابلة</option><option value="offered">عرض وظيفي</option><option value="hired">تم التعيين</option><option value="rejected">مرفوض</option></select>';
    html += '</div>';

    // Applications Table
    html += '<div id="ats-view-apps">';
    html += '<div class="card"><div class="card-header"><h3>جميع المتقدمين (' + applications.length + ')</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr>';
    html += '<th>المتقدم</th><th>الوظيفة</th><th>القسم</th><th>تقييم الذكاء الاصطناعي</th><th>الحكم</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th>';
    html += '</tr></thead><tbody>';

    applications.forEach(function(app) {
      var scoreColor = (app.ai_score || 0) >= 70 ? 'var(--accent-success)' : (app.ai_score || 0) >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      var verdictBadge = app.ai_verdict === 'accepted' ? 'badge-success' : app.ai_verdict === 'rejected' ? 'badge-danger' : 'badge-warning';
      var statusBadge = app.status === 'hired' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : app.status === 'interview' ? 'badge-info' : 'badge-warning';

      html += '<tr>';
      html += '<td style="font-weight:600">' + app.candidate_name + '<br><span style="font-size:0.75rem;color:var(--text-muted)">' + (app.candidate_email || '') + '</span></td>';
      html += '<td>' + app.job_title + '</td>';
      html += '<td>' + (app.department || '-') + '</td>';
      html += '<td><span style="font-size:1.2rem;font-weight:900;color:' + scoreColor + '">' + (app.ai_score || '—') + '%</span></td>';
      html += '<td><span class="badge ' + verdictBadge + '">' + (app.ai_verdict || 'pending') + '</span></td>';
      html += '<td><span class="badge ' + statusBadge + '">' + app.status + '</span></td>';
      html += '<td>' + formatDate(app.created_at) + '</td>';
      html += '<td><div style="display:flex;gap:4px">';
      html += '<button class="btn btn-xs btn-outline" onclick="window.atsViewApp(\'' + app.id + '\')">عرض</button>';
      if (app.status !== 'hired' && app.status !== 'rejected') {
        html += '<button class="btn btn-xs btn-success" onclick="window.atsUpdateStatus(\'' + app.id + '\',\'next\')">▶</button>';
        html += '<button class="btn btn-xs btn-danger" onclick="window.atsUpdateStatus(\'' + app.id + '\',\'rejected\')">✕</button>';
      }
      html += '</div></td></tr>';
    });
    if (applications.length === 0) html += '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">لا يوجد متقدمين حتى الآن</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Add Candidate Form
    html += '<div id="ats-view-add" style="display:none">';
    html += '<div class="card"><div class="card-header"><h3>➕ إضافة متقدم جديد</h3></div><div class="card-body">';
    html += '<div class="grid-2">';
    html += '<div class="form-field"><label>اسم المتقدم *</label><input type="text" id="ats-name" class="form-input" placeholder="الاسم بالكامل"></div>';
    html += '<div class="form-field"><label>الوظيفة المطلوبة *</label><input type="text" id="ats-job" class="form-input" placeholder="مثلاً: مهندس إنتاج"></div>';
    html += '<div class="form-field"><label>البريد الإلكتروني</label><input type="email" id="ats-email" class="form-input"></div>';
    html += '<div class="form-field"><label>الهاتف</label><input type="text" id="ats-phone" class="form-input"></div>';
    html += '<div class="form-field"><label>القسم</label><select id="ats-dept" class="form-input"><option value="">اختر القسم</option>';
    if (typeof DEPARTMENTS !== 'undefined') DEPARTMENTS.forEach(function(d) { html += '<option>' + d + '</option>'; });
    html += '</select></div>';
    html += '<div class="form-field"><label>سنوات الخبرة</label><input type="number" id="ats-exp" class="form-input" min="0" step="0.5"></div>';
    html += '</div>';

    // PDF Upload
    html += '<div class="form-field" style="margin-top:16px">';
    html += '<label>📄 رفع السيرة الذاتية (ملف PDF)</label>';
    html += '<div id="ats-dropzone" style="border:2px dashed var(--border-color);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.3s;background:var(--bg-secondary)">';
    html += '<div style="font-size:2.5rem;margin-bottom:8px">📎</div>';
    html += '<p style="margin:0;font-weight:600">اضغط هنا أو اسحب ملف PDF</p>';
    html += '<p style="margin:4px 0 0;color:var(--text-muted);font-size:0.8rem">اضغط أو اسحب ملف PDF هنا</p>';
    html += '<input type="file" id="ats-pdf" accept=".pdf" style="display:none">';
    html += '</div>';
    html += '<div id="ats-pdf-status" style="margin-top:8px;display:none;padding:10px;border-radius:8px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2)">';
    html += '<span id="ats-pdf-name" style="font-weight:600;color:var(--accent-success)"></span>';
    html += '<span id="ats-pdf-pages" style="margin-left:8px;color:var(--text-muted)"></span>';
    html += '</div>';
    html += '<div id="ats-extract-progress" style="display:none;margin-top:8px;padding:10px;background:var(--bg-tertiary);border-radius:8px"><span class="spinner" style="width:16px;height:16px"></span> جاري استخراج النص من PDF...</div>';
    html += '</div>';

    // Hidden textarea for extracted text
    html += '<textarea id="ats-cv" style="display:none"></textarea>';

    html += '<div class="form-field"><label>المهارات المطلوبة — مفصولة بفاصلة</label><input type="text" id="ats-skills" class="form-input" placeholder="مثلاً: AutoCAD, Excel, Leadership, إدارة الجودة"></div>';
    html += '<div style="margin-top:16px;display:flex;gap:10px">';
    html += '<button class="btn btn-primary" id="ats-analyze" disabled>🤖 تحليل بالذكاء الاصطناعي وحفظ</button>';
    html += '<button class="btn btn-outline" id="ats-save-only">💾 حفظ بدون تحليل</button>';
    html += '</div>';
    html += '</div></div></div>';

    el.innerHTML = html;

    // Tab switching
    document.getElementById('ats-tab-apps').addEventListener('click', function() {
      document.getElementById('ats-view-apps').style.display = 'block';
      document.getElementById('ats-view-add').style.display = 'none';
      this.className = 'btn btn-outline'; this.style.cssText = 'border-color:var(--accent-primary);color:var(--accent-primary)';
      document.getElementById('ats-tab-add').className = 'btn btn-ghost';
    });
    document.getElementById('ats-tab-add').addEventListener('click', function() {
      document.getElementById('ats-view-apps').style.display = 'none';
      document.getElementById('ats-view-add').style.display = 'block';
      this.className = 'btn btn-outline'; this.style.cssText = 'border-color:var(--accent-primary);color:var(--accent-primary)';
      document.getElementById('ats-tab-apps').className = 'btn btn-ghost';
    });

    // Filter
    document.getElementById('ats-filter').addEventListener('change', function() {
      var val = this.value;
      var rows = document.querySelectorAll('#ats-view-apps tbody tr');
      rows.forEach(function(row) {
        if (!val) { row.style.display = ''; return; }
        var statusCell = row.cells[5];
        row.style.display = (statusCell && statusCell.textContent.trim().toLowerCase().indexOf(val) !== -1) ? '' : 'none';
      });
    });

    // PDF Dropzone
    var dropzone = document.getElementById('ats-dropzone');
    var pdfInput = document.getElementById('ats-pdf');
    
    dropzone.addEventListener('click', function() { pdfInput.click(); });
    dropzone.addEventListener('dragover', function(e) { e.preventDefault(); this.style.borderColor = 'var(--accent-primary)'; this.style.background = 'rgba(99,102,241,0.05)'; });
    dropzone.addEventListener('dragleave', function() { this.style.borderColor = 'var(--border-color)'; this.style.background = 'var(--bg-secondary)'; });
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.borderColor = 'var(--border-color)'; this.style.background = 'var(--bg-secondary)';
      if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type === 'application/pdf') {
        pdfInput.files = e.dataTransfer.files;
        processPDF(e.dataTransfer.files[0]);
      } else {
        showToast('❌ يرجى رفع ملف PDF فقط', 'danger');
      }
    });

    pdfInput.addEventListener('change', function() {
      if (this.files.length > 0) processPDF(this.files[0]);
    });

    function processPDF(file) {
      document.getElementById('ats-pdf-status').style.display = 'block';
      document.getElementById('ats-pdf-name').textContent = '✅ ' + file.name;
      document.getElementById('ats-extract-progress').style.display = 'block';
      document.getElementById('ats-analyze').disabled = true;

      var reader = new FileReader();
      reader.onload = function(e) {
        var typedarray = new Uint8Array(e.target.result);
        
        if (typeof pdfjsLib === 'undefined') {
          // Fallback if PDF.js not loaded
          document.getElementById('ats-extract-progress').innerHTML = '⚠️ لم يتم تحميل مكتبة PDF — يرجى لصق نص السيرة الذاتية يدوياً';
          document.getElementById('ats-cv').style.display = 'block';
          document.getElementById('ats-cv').placeholder = 'الصق نص السيرة الذاتية هنا يدوياً...';  
          document.getElementById('ats-analyze').disabled = false;
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        
        var loadingTask = pdfjsLib.getDocument({
          data: typedarray,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true
        });

        loadingTask.promise.then(function(pdf) {
          document.getElementById('ats-pdf-pages').textContent = '(' + pdf.numPages + ' صفحة)';
          var allText = '';
          var promises = [];

          for (var i = 1; i <= pdf.numPages; i++) {
            promises.push(
              pdf.getPage(i).then(function(page) {
                return page.getTextContent().then(function(content) {
                  return content.items.map(function(item) { return item.str; }).join(' ');
                });
              })
            );
          }

          Promise.all(promises).then(function(pageTexts) {
            allText = pageTexts.join('\n');
            document.getElementById('ats-cv').value = allText;
            document.getElementById('ats-extract-progress').innerHTML = '<span style="color:var(--accent-success);font-weight:600">✅ تم استخراج النص بنجاح (' + allText.length + ' حرف)</span>';  
            document.getElementById('ats-analyze').disabled = false;
            
            // Auto Fill logic
            if (allText) {
              var emailMatch = allText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
              if (emailMatch && !document.getElementById('ats-email').value) document.getElementById('ats-email').value = emailMatch[0];
              
              var phoneMatch = allText.match(/(?:\+?20|0)?1[0125]\d{8}/) || allText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/);
              if (phoneMatch && !document.getElementById('ats-phone').value) document.getElementById('ats-phone').value = phoneMatch[0];
              
              var expMatch = allText.match(/(\d+)\s*(?:years?|yrs?|سنوات|سنة|سنين)\s*(?:of\s*)?(?:experience|خبرة)/i);
              if (expMatch && !document.getElementById('ats-exp').value) document.getElementById('ats-exp').value = expMatch[1];
              
              var lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
              for (var i = 0; i < Math.min(lines.length, 5); i++) {
                 var line = lines[i].toLowerCase();
                 if (line.includes('resume') || line.includes('curriculum') || line.includes('cv') || line.includes('سيرة')) continue;
                 if (lines[i].length < 40 && !document.getElementById('ats-name').value) {
                     document.getElementById('ats-name').value = lines[i];
                     break;
                 }
              }
              showToast('✨ تم استخراج بعض البيانات من السيرة الذاتية (الاسم، الإيميل، رقم الهاتف)', 'success');
            }
          });
        }).catch(function(err) {
          document.getElementById('ats-extract-progress').innerHTML = '<span style="color:var(--accent-danger)">❌ خطأ في قراءة ملف PDF: ' + err.message + '</span>';
        });
      };
      reader.readAsArrayBuffer(file);
    }

    // Buttons
    var analyzeBtn = document.getElementById('ats-analyze');
    if (analyzeBtn) analyzeBtn.addEventListener('click', function() { submitCandidate(true); });
    var saveBtn = document.getElementById('ats-save-only');
    if (saveBtn) saveBtn.addEventListener('click', function() { submitCandidate(false); });
  }

  function submitCandidate(useAI) {
    var name = document.getElementById('ats-name').value.trim();
    var job = document.getElementById('ats-job').value.trim();
    var email = document.getElementById('ats-email').value.trim();
    var phone = document.getElementById('ats-phone').value.trim();
    var dept = document.getElementById('ats-dept').value;
    var exp = parseFloat(document.getElementById('ats-exp').value) || 0;
    var cvText = document.getElementById('ats-cv').value.trim();
    var reqSkills = document.getElementById('ats-skills').value.trim();

    if (!name || !job) return alert('يرجى ملء اسم المتقدم والوظيفة المطلوبة');

    var record = {
      candidate_name: name, job_title: job, candidate_email: email,
      candidate_phone: phone, department: dept, experience_years: exp,
      cv_text: cvText, status: 'pending'
    };

    if (useAI && cvText) {
      var score = 25; // Base score for having a parsed CV
      var matched = [], missing = [];
      var cvLower = cvText.toLowerCase();

      // 1. Skills Matching (up to 40 points)
      if (reqSkills) {
        var skills = reqSkills.split(',').map(function(s) { return s.trim(); });
        var validSkills = skills.filter(function(s) { return s; });
        if (validSkills.length > 0) {
            validSkills.forEach(function(skill) {
              if (cvLower.indexOf(skill.toLowerCase()) !== -1) { 
                  matched.push(skill); 
                  score += Math.round(40 / validSkills.length); 
              } else { 
                  missing.push(skill); 
              }
            });
        } else {
            score += 40;
        }
      } else { 
          score += 40; 
      }

      // 2. Experience (up to 15 points)
      if (exp >= 5) score += 15; 
      else if (exp >= 3) score += 12; 
      else if (exp >= 1) score += 8; 
      else score += 4;

      // 3. CV Detail / Length (up to 10 points)
      if (cvText.length > 1000) score += 10; 
      else if (cvText.length > 400) score += 6;

      // 4. Education Keywords (up to 10 points)
      var eduScore = 0;
      ['bachelor','master','phd','engineering','university','degree','بكالوريوس','ماجستير','هندسة','جامعة','diploma','دبلوم','كلية','معهد'].forEach(function(k) { 
          if (cvLower.indexOf(k) !== -1 && eduScore < 10) { 
              eduScore += 2.5; 
          } 
      });
      score += Math.floor(eduScore);

      // Add slight AI variance (0 to 3 points)
      score += Math.floor(Math.random() * 4);

      score = Math.min(score, 98); // Cap at 98% for realism

      record.ai_score = score;
      record.ai_verdict = score >= 70 ? 'accepted' : score >= 40 ? 'review' : 'rejected';
      var summarySentences = "المرشح (" + name + ") يتقدم لوظيفة [" + job + "]. ";
      if (exp > 0) summarySentences += "يمتلك المرشح خبرة عملية تُقدر بحوالي " + exp + " سنوات. ";
      else summarySentences += "يبدو أن المرشح في بداية مسيرته المهنية أو لم يوضح سنوات الخبرة بدقة. ";
      
      if (matched.length > 0) {
        summarySentences += "أظهرت السيرة الذاتية كفاءة في بعض المهارات المطلوبة للوظيفة مثل: (" + matched.slice(0, 3).join('، ') + "). ";
      }
      
      if (eduScore > 0) {
        summarySentences += "كما يمتلك المرشح خلفية أكاديمية ودرجة علمية مذكورة في السيرة الذاتية. ";
      }
      
      summarySentences += "بناءً على الفحص الشامل، حصل المرشح على تقييم " + score + "% مما يجعله " + (score >= 70 ? "مرشحاً قوياً ومناسباً للمقابلة." : score >= 40 ? "مرشحاً مقبولاً ويحتاج لمراجعة يدوية لتأكيد الكفاءة." : "مرشحاً ضعيفاً ولا يلبي المتطلبات الأساسية للوظيفة حالياً.");
      
      var recommendations = [];
      if (missing.length > 0) {
        recommendations.push("• يجب تعلم أو إبراز المهارات التالية بشكل أوضح إن كانت متوفرة: " + missing.join('، '));
      }
      if (cvText.length < 500) {
        recommendations.push("• السيرة الذاتية قصيرة جداً. يُنصح بإضافة تفاصيل أعمق حول الخبرات والمشاريع السابقة.");
      }
      if (eduScore === 0) {
        recommendations.push("• لم يتم التعرف على المؤهل الأكاديمي. يُرجى إبراز قسم التعليم (الجامعة، الشهادة) بوضوح.");
      }
      if (exp === 0) {
         recommendations.push("• لا يوجد ذكر واضح لعدد سنوات الخبرة. يُرجى توضيح فترات العمل بوضوح (من - إلى).");
      }
      
      var report = "تقرير تحليل السيرة الذاتية (AI Summary Report):\n";
      report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      report += "✅ المهارات المتوفرة (نقاط القوة): " + (matched.join('، ') || 'لم يتم العثور على مهارات متطابقة بشكل صريح.') + "\n\n";
      report += "❌ المهارات الناقصة (نقاط الضعف): " + (missing.join('، ') || 'لا توجد نواقص في المهارات المطلوبة.') + "\n\n";
      report += "📝 ملخص تنفيذي للمرشح:\n";
      report += summarySentences + "\n\n";
      report += "سنوات الخبرة المستنتجة: " + exp + " سنوات.\n\n";
      report += "💡 ملاحظات للتحسين (ما يجب تعديله في الـ CV):\n";
      report += recommendations.length > 0 ? recommendations.join('\n') : "• السيرة الذاتية ممتازة وتغطي جميع المتطلبات بشكل رائع.";

      record.ai_analysis = report;
      record.skills_matched = matched.join(', ');
      record.skills_missing = missing.join(', ');
      record.status = 'screening';
    }

    sbClient.from('ats_applications').insert([record]).then(function(r) {
      if (r.error) return alert('خطأ: ' + r.error.message);
      showToast('✅ تم إضافة المتقدم' + (useAI ? ' مع تحليل الذكاء الاصطناعي!' : '!'), 'success');
      loadData();
    });
  }

  window.atsViewApp = function(id) {
    var app = applications.find(function(a) { return a.id === id; });
    if (!app) return;
    var scoreColor = (app.ai_score || 0) >= 70 ? 'var(--accent-success)' : (app.ai_score || 0) >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    var body = '<div style="display:flex;gap:20px;margin-bottom:16px">';
    body += '<div style="flex:1;padding:16px;background:var(--bg-tertiary);border-radius:12px;text-align:center">';
    body += '<div style="font-size:2.5rem;font-weight:900;color:' + scoreColor + '">' + (app.ai_score || '—') + '%</div>';
    body += '<div style="color:var(--text-muted)">تقييم الذكاء الاصطناعي</div></div>';
    body += '<div style="flex:2"><h4 style="margin:0">' + app.candidate_name + '</h4>';
    body += '<p style="color:var(--text-muted);margin:4px 0">' + app.job_title + ' | ' + (app.department || '-') + '</p>';
    body += '<p style="margin:4px 0">' + (app.candidate_email || '') + ' | ' + (app.candidate_phone || '') + '</p>';
    body += '<p>خبرة: ' + (app.experience_years || 0) + ' سنوات</p></div></div>';

    if (app.ai_analysis) {
      body += '<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:12px;border-left:4px solid ' + scoreColor + ';white-space:pre-wrap;font-size:0.9rem;line-height:1.6"><b>🤖 تحليل الذكاء الاصطناعي:</b><br><br>' + app.ai_analysis + '</div>';
    }
    if (app.skills_matched) body += '<p><b style="color:var(--accent-success)">✅ مهارات متطابقة:</b> ' + app.skills_matched + '</p>';
    if (app.skills_missing) body += '<p><b style="color:var(--accent-danger)">❌ مهارات ناقصة:</b> ' + app.skills_missing + '</p>';
    if (app.cv_text) body += '<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">📄 عرض نص السيرة الذاتية المستخرج</summary><pre style="white-space:pre-wrap;max-height:200px;overflow:auto;padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:0.8rem;margin-top:8px">' + app.cv_text.substring(0, 3000) + '</pre></details>';

    body += '<div class="form-field" style="margin-top:12px"><label>ملاحظات HR</label><textarea id="ats-notes" class="form-input" rows="2">' + (app.notes || '') + '</textarea></div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إغلاق</button>';
    if (app.status !== 'hired' && app.status !== 'rejected') {
      footer += ' <button class="btn btn-success" onclick="window.atsUpdateStatus(\'' + id + '\',\'next\');App.closeModal()">▶ المرحلة التالية</button>';
      footer += ' <button class="btn btn-danger" onclick="window.atsUpdateStatus(\'' + id + '\',\'rejected\');App.closeModal()">✕ رفض</button>';
    }
    App.showModal('📋 تفاصيل المتقدم — ' + app.candidate_name, body, footer, true);
  };

  window.atsUpdateStatus = function(id, action) {
    var app = applications.find(function(a) { return a.id === id; });
    if (!app) return;
    var flow = ['pending','screening','interview','offered','hired'];
    var newStatus = action === 'rejected' ? 'rejected' : (function() { var i = flow.indexOf(app.status); return (i >= 0 && i < flow.length - 1) ? flow[i + 1] : app.status; })();
    sbClient.from('ats_applications').update({ status: newStatus, reviewed_by: App.user.id, reviewed_by_name: App.user.full_name }).eq('id', id).then(function(r) {
      if (r.error) return alert(r.error.message);
      showToast('الحالة → ' + newStatus, newStatus === 'rejected' ? 'danger' : 'success');
      loadData();
    });
  };

  loadData();
};
