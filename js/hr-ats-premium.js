// ===== HR ATS Premium - AI-Powered Applicant Tracking System =====
// Implements Advanced AI CV Screening, Job Postings, and Recruitment Pipeline

window.Pages = window.Pages || {};
window.Pages.hrATS = function(el) {
  if (!App.isHR()) { el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 غير مصرح بالدخول</h2></div>'; return; }

  var state = {
    jobs: [],
    applications: [],
    currentView: 'dashboard', // dashboard, jobs, apps, upload, compare
    selectedJobId: null
  };

  // --- AI Integration Layer ---
  window.AIEngine = {
    apiKey: localStorage.getItem('erp_ai_key') || null, 
    provider: 'openai', // Can be configured
    
    analyzeCV: function(cvText, jobData, rawEmail, rawPhone) {
      return new Promise(function(resolve, reject) {
        if (window.AIEngine.apiKey) {
          // Call Real AI API (Implementation ready for OpenAI structured JSON)
          window.AIEngine._callOpenAI(cvText, jobData)
            .then(function(res) {
               // Ensure we inject rawEmail/rawPhone if AI missed them
               if (!res.candidate.email && rawEmail) res.candidate.email = rawEmail;
               if (!res.candidate.phone && rawPhone) res.candidate.phone = rawPhone;
               resolve(res);
            })
            .catch(function(err) {
              console.warn("AI API Failed, falling back to internal engine", err);
              resolve(window.AIEngine._fallbackAnalysis(cvText, jobData, rawEmail, rawPhone));
            });
        } else {
          // Fallback to advanced local semantic extraction (Simulated AI)
          setTimeout(function() {
            resolve(window.AIEngine._fallbackAnalysis(cvText, jobData, rawEmail, rawPhone));
          }, 1500);
        }
      });
    },

    _callOpenAI: function(cvText, jobData) {
      return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + window.AIEngine.apiKey
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are an expert HR AI Assistant. Extract CV details and evaluate against the Job Description. Output strictly in JSON matching the schema: { candidate: {name, email, phone, location, linkedin}, education: [{degree, university, year}], experience: [{company, title, duration, responsibilities}], skills: {technical:[], soft:[], tools:[]}, match_score: Number, strengths: [], weaknesses: [], missing_requirements: [], ai_recommendation: 'Strong'|'Potential'|'Weak', ai_summary: String, interview_questions: {hr:[], technical:[]}, flags: [] }" },
            { role: "user", content: "Job Req: " + JSON.stringify(jobData) + "\n\nCV Text:\n" + cvText }
          ]
        })
      }).then(res => res.json()).then(data => JSON.parse(data.choices[0].message.content));
    },

    _fallbackAnalysis: function(cvText, jobData, rawEmail, rawPhone) {
      var cvLower = cvText.toLowerCase();
      var reqSkills = jobData ? (jobData.required_skills || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) : [];
      var matched = [], missing = [];
      
      reqSkills.forEach(function(sk) {
        if (cvLower.indexOf(sk) !== -1) matched.push(sk);
        else missing.push(sk);
      });

      // --- Extended Skills Detection (English + Arabic) ---
      var allSkillsMap = {
        tech: ['react','angular','vue','node.js','express','java','python','c++','c#','.net','php','ruby','swift','kotlin','typescript','javascript','html','css','sql','mongodb','postgresql','mysql','firebase','aws','azure','gcp','docker','kubernetes','git','jenkins','ci/cd','rest api','graphql','machine learning','deep learning','tensorflow','autocad','solidworks','matlab','sap','erp','excel','power bi','tableau','photoshop','illustrator','figma','wordpress'],
        soft: ['leadership','communication','management','agile','teamwork','problem solving','negotiation','presentation','time management','project management','scrum','قيادة','تواصل','إدارة','تفاوض','حل المشكلات','العمل الجماعي','إدارة المشاريع','تنظيم','تخطيط'],
        industry: ['تسويق','مبيعات','موارد بشرية','هندسة','محاسبة','مالية','تصنيع','إنتاج','جودة','صيانة','مشتريات','مخازن','تخزين','لوجستيك','marketing','sales','procurement','logistics','warehouse','manufacturing','quality','maintenance','accounting','finance','hr','supply chain']
      };
      var techSkills = [], softSkills = [], industrySkills = [];
      allSkillsMap.tech.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) techSkills.push(sk); });
      allSkillsMap.soft.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) softSkills.push(sk); });
      allSkillsMap.industry.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) industrySkills.push(sk); });

      // --- Contact Extraction ---
      var emailMatch = rawEmail || (cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || '';
      var phoneMatch = rawPhone || (cvText.match(/(?:\+?20|0)?1[0125]\d{8}/) || cvText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/) || [])[0] || '';

      // --- Experience Years ---
      var expMatch = cvText.match(/(\d+)\s*(?:years?|yrs?|سنوات|سنة|سنين)/i) || cvText.match(/(?:experience|خبرة)\s*[:\-]?\s*(\d+)/i);
      var expYears = expMatch ? parseInt(expMatch[1]) : 0;

      // --- Name Extraction ---
      var lines = cvText.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      var name = "";
      // Strategy 1: Look for a short line (2-5 words) near the top that looks like a name
      for (var i = 0; i < Math.min(lines.length, 15); i++) {
        var cleanLine = lines[i].replace(/[_.\-\|]/g, '').replace(/\s+/g, ' ').trim();
        var l = cleanLine.toLowerCase();
        if (l.includes('resume') || l.includes('cv') || l.includes('سيرة') || l.includes('ذاتية') || l.includes('page') || l.includes('email') || l.includes('@') || l.includes('phone') || l.includes('mobile') || l.includes('address') || l.includes('objective') || cleanLine.length < 4) continue;
        // Skip lines that are mostly numbers or symbols
        if (cleanLine.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').length < 4) continue;
        var wordCount = cleanLine.split(/\s+/).length;
        if (wordCount >= 2 && wordCount <= 5 && cleanLine.length < 50) { name = cleanLine; break; }
      }
      // Strategy 2: Try to extract name from email (e.g. samiraliseada@gmail.com -> Samir Ali Seada)
      if (!name && emailMatch) {
        var emailName = emailMatch.split('@')[0].replace(/[._\-0-9]/g, ' ').trim();
        if (emailName.length > 3) {
          name = emailName.split(' ').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
        }
      }
      if (!name) name = "مرشح غير معروف";

      // --- Education Extraction (Real Data) ---
      var eduKeywords = ['bachelor','master','phd','mba','diploma','بكالوريوس','ماجستير','دكتوراه','دبلوم','ليسانس'];
      var uniKeywords = ['university','جامعة','كلية','معهد','أكاديمية','institute','college','academy'];
      var detectedDegrees = [];
      var detectedUnis = [];
      lines.forEach(function(line) {
        var ll = line.toLowerCase();
        eduKeywords.forEach(function(ek) {
          if (ll.indexOf(ek) !== -1 && detectedDegrees.indexOf(line) === -1) {
            detectedDegrees.push(line.substring(0, 80));
          }
        });
        uniKeywords.forEach(function(uk) {
          if (ll.indexOf(uk) !== -1 && detectedUnis.indexOf(line) === -1) {
            detectedUnis.push(line.substring(0, 80));
          }
        });
      });
      var eduDegree = detectedDegrees.length > 0 ? detectedDegrees[0] : 'غير مكتشف';
      var eduUni = detectedUnis.length > 0 ? detectedUnis[0] : 'غير معروف';

      // --- Experience Extraction (Real Companies & Titles) ---
      var companyKeywords = ['company','شركة','مصنع','مؤسسة','factory','group','corp','inc','ltd','organization','hospital','مستشفى','بنك','bank'];
      var titleKeywords = ['manager','مدير','engineer','مهندس','supervisor','مشرف','specialist','أخصائي','accountant','محاسب','developer','مبرمج','analyst','محلل','director','رئيس','coordinator','منسق','technician','فني','مندوب','representative','inspector','مفتش','worker','عامل'];
      var detectedCompanies = [];
      var detectedTitles = [];
      lines.forEach(function(line) {
        var ll = line.toLowerCase();
        companyKeywords.forEach(function(ck) {
          if (ll.indexOf(ck) !== -1 && detectedCompanies.indexOf(line) === -1 && line.length < 100) {
            detectedCompanies.push(line.substring(0, 80));
          }
        });
        titleKeywords.forEach(function(tk) {
          if (ll.indexOf(tk) !== -1 && detectedTitles.indexOf(line) === -1 && line.length < 100) {
            detectedTitles.push(line.substring(0, 80));
          }
        });
      });

      // --- Location Extraction ---
      var locationKeywords = ['القاهرة','الإسكندرية','الجيزة','المنصورة','أسيوط','الأقصر','أسوان','طنطا','الزقازيق','بورسعيد','السويس','دمياط','cairo','alexandria','giza','egypt','مصر','riyadh','jeddah','dubai','الرياض','جدة','دبي'];
      var detectedLocation = '';
      locationKeywords.forEach(function(loc) {
        if (cvLower.indexOf(loc) !== -1 && !detectedLocation) detectedLocation = loc;
      });

      var reqExp = jobData ? parseFloat(jobData.required_experience_years || 0) : 0;

      // --- Scoring ---
      var score = 25;
      if (reqSkills.length > 0) score += (matched.length / reqSkills.length) * 35;
      else score += 35;
      if (expYears >= reqExp && reqExp > 0) score += 20;
      else if (expYears > 0) score += 10;
      if (techSkills.length > 3) score += 5;
      if (softSkills.length > 2) score += 5;
      if (cvText.length > 1500) score += 5;
      else if (cvText.length > 800) score += 3;
      var eduScore = 0;
      if (detectedDegrees.length > 0) eduScore = 10;
      score += eduScore;
      if (detectedCompanies.length >= 2) score += 5;
      score = Math.min(Math.round(score), 98);

      var rec = score >= 75 ? 'accepted' : score >= 45 ? 'review' : 'rejected';

      // --- Build REAL Summary from extracted data ---
      var summaryParts = [];
      summaryParts.push(name + " - ");
      if (expYears > 0) summaryParts.push("خبرة " + expYears + " سنوات");
      else summaryParts.push("لم يتم تحديد سنوات الخبرة بدقة");
      if (detectedTitles.length > 0) summaryParts.push(" في مجال: " + detectedTitles[0]);
      summaryParts.push(". ");
      if (detectedCompanies.length > 0) summaryParts.push("عمل سابقاً في: " + detectedCompanies.slice(0,2).join(' / ') + ". ");
      if (eduDegree !== 'غير مكتشف') summaryParts.push("المؤهل: " + eduDegree + ". ");
      if (detectedLocation) summaryParts.push("الموقع: " + detectedLocation + ". ");
      var allFoundSkills = matched.concat(techSkills).concat(industrySkills);
      if (allFoundSkills.length > 0) summaryParts.push("المهارات المكتشفة: " + allFoundSkills.slice(0,6).join('، ') + ". ");
      if (matched.length > 0) summaryParts.push("تطابق مع المطلوب: " + matched.join('، ') + ". ");
      if (missing.length > 0) summaryParts.push("مهارات مفقودة: " + missing.join('، ') + ".");
      var summary = summaryParts.join('');

      // --- Build REAL Strengths & Weaknesses ---
      var strengths = [];
      if (matched.length > 0) strengths.push("يمتلك المهارات المطلوبة: " + matched.join('، '));
      if (expYears >= reqExp && expYears > 0) strengths.push("خبرة " + expYears + " سنوات تلبي أو تتجاوز المطلوب (" + reqExp + ")");
      if (detectedDegrees.length > 0) strengths.push("مؤهل علمي: " + eduDegree);
      if (detectedCompanies.length >= 2) strengths.push("خبرة متنوعة في " + detectedCompanies.length + " جهات عمل");
      if (techSkills.length > 0) strengths.push("مهارات تقنية إضافية: " + techSkills.slice(0,4).join('، '));
      if (softSkills.length > 0) strengths.push("مهارات شخصية: " + softSkills.slice(0,3).join('، '));
      if (strengths.length === 0) strengths.push("السيرة الذاتية تحتاج مراجعة يدوية لتحديد نقاط القوة");

      var weaknesses = [];
      if (missing.length > 0) missing.forEach(function(s) { weaknesses.push("مهارة مطلوبة غير موجودة: " + s); });
      if (expYears < reqExp && reqExp > 0) weaknesses.push("الخبرة (" + expYears + " سنوات) أقل من المطلوب (" + reqExp + " سنوات)");
      if (detectedDegrees.length === 0) weaknesses.push("لم يتم اكتشاف مؤهل علمي واضح في السيرة الذاتية");
      if (cvText.length < 500) weaknesses.push("السيرة الذاتية قصيرة وتفتقر للتفاصيل الكافية");
      // If score < 100, there MUST be weaknesses - generate smart ones based on what's missing
      if (score < 98 && weaknesses.length === 0) {
        if (softSkills.length < 3) weaknesses.push("عدد المهارات الشخصية المذكورة قليل (" + softSkills.length + " فقط) - يُفضل إبراز مهارات القيادة والتواصل");
        if (techSkills.length < 4) weaknesses.push("عدد المهارات التقنية محدود (" + techSkills.length + " فقط) - يُنصح بتطوير مهارات تقنية إضافية");
        if (detectedCompanies.length < 2) weaknesses.push("خبرة عملية محدودة في عدد جهات العمل السابقة");
        if (!detectedLocation) weaknesses.push("لم يتم ذكر الموقع الجغرافي في السيرة الذاتية");
        if (cvText.length < 1500) weaknesses.push("السيرة الذاتية تحتاج لمزيد من التفصيل حول المسؤوليات والإنجازات");
      }
      // Final fallback - always show something if not perfect
      if (score < 98 && weaknesses.length === 0) {
        weaknesses.push("التقييم لم يصل 100% - يُنصح بمراجعة يدوية لتحديد نقاط التحسين");
      }

      var flags = [];
      if (expYears === 0) flags.push("لم يتم اكتشاف سنوات خبرة واضحة في النص.");
      if (cvText.length < 300) flags.push("السيرة الذاتية قصيرة جداً (" + cvText.length + " حرف) وقد تكون غير مكتملة.");
      if (!emailMatch) flags.push("لم يتم العثور على بريد إلكتروني في السيرة الذاتية.");
      if (!phoneMatch) flags.push("لم يتم العثور على رقم هاتف في السيرة الذاتية.");

      // --- Build REAL Interview Questions based on extracted data ---
      var hrQuestions = [];
      if (detectedCompanies.length > 0) hrQuestions.push("حدثنا عن تجربتك في " + detectedCompanies[0] + " وما أبرز إنجازاتك هناك؟");
      if (expYears > 0) hrQuestions.push("لديك خبرة " + expYears + " سنوات، ما الذي تعلمته وتريد تطبيقه في هذه الوظيفة؟");
      hrQuestions.push("لماذا ترغب في الانضمام لفريقنا وما الذي يميزك عن باقي المرشحين؟");
      if (detectedTitles.length > 1) hrQuestions.push("انتقلت بين عدة مناصب، ما سبب تغييراتك الوظيفية؟");

      var techQuestions = [];
      matched.forEach(function(s) { techQuestions.push("صف لنا مشروعاً عملياً استخدمت فيه " + s + " وما التحديات التي واجهتها؟"); });
      missing.forEach(function(s) { techQuestions.push("كيف ستكتسب وتطور مهاراتك في " + s + " خلال أول 3 أشهر؟"); });
      if (techSkills.length > 0) techQuestions.push("كيف توظف مهاراتك في " + techSkills[0] + " لحل مشكلة عملية في بيئة العمل؟");

      // Build education array from real data
      var educationArr = detectedDegrees.length > 0 
        ? detectedDegrees.map(function(d, idx) { return {degree: d, university: detectedUnis[idx] || 'غير محدد', year: ''}; })
        : [{degree: 'غير مكتشف', university: 'غير معروف', year: ''}];

      // Build experience array from real data
      var experienceArr = [];
      if (detectedTitles.length > 0 || detectedCompanies.length > 0) {
        var maxExp = Math.max(detectedTitles.length, detectedCompanies.length, 1);
        for (var e = 0; e < Math.min(maxExp, 4); e++) {
          experienceArr.push({
            company: detectedCompanies[e] || 'غير محدد',
            title: detectedTitles[e] || (jobData ? jobData.title : 'غير محدد'),
            duration: e === 0 ? (expYears + ' سنوات') : '',
            responsibilities: ''
          });
        }
      } else {
        experienceArr.push({company: 'غير محدد', title: jobData ? jobData.title : 'غير محدد', duration: expYears + ' سنوات', responsibilities: ''});
      }

      return {
        candidate: {
          name: name,
          email: emailMatch,
          phone: phoneMatch,
          location: detectedLocation,
          linkedin: ''
        },
        education: educationArr,
        experience: experienceArr,
        skills: {
          technical: matched.concat(techSkills).concat(industrySkills),
          soft: softSkills,
          tools: []
        },
        match_score: score,
        strengths: strengths,
        weaknesses: weaknesses,
        missing_requirements: missing,
        ai_recommendation: rec,
        ai_summary: summary,
        interview_questions: {
          hr: hrQuestions,
          technical: techQuestions
        },
        flags: flags
      };
    }
  };

  // --- Data Loading ---
  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span> Loading AI ATS System...</div>';
    
    // Check if job_postings exists, if not use mock or just ats_applications
    sbClient.from('job_postings').select('*').order('created_at', {ascending: false}).then(function(rJobs) {
      if (rJobs.error && rJobs.error.code === '42P01') {
        // Table doesn't exist yet, we will just simulate jobs internally
        state.jobs = []; 
      } else {
        state.jobs = rJobs.data || [];
      }
      
      sbClient.from('ats_applications').select('*').order('created_at', {ascending: false}).then(function(rApps) {
        state.applications = rApps.data || [];
        render();
      });
    });
  }

  // --- Rendering ---
  function render() {
    var html = '<div class="ats-premium-container">';
    html += renderHeader();
    
    html += '<div class="ats-content" style="margin-top:20px;">';
    if (state.currentView === 'dashboard') html += renderDashboard();
    else if (state.currentView === 'jobs') html += renderJobs();
    else if (state.currentView === 'apps') html += renderApplications();
    else if (state.currentView === 'upload') html += renderUpload();
    html += '</div></div>';

    el.innerHTML = html;
    attachEvents();
  }

  function renderHeader() {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
        <div>
          <h2 style="margin:0; display:flex; align-items:center; gap:8px;">🤖 AI CV Screening & Recruitment</h2>
          <p style="color:var(--text-muted); margin:4px 0 0;">Enterprise Grade Applicant Tracking System</p>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn ${state.currentView==='dashboard'?'btn-primary':'btn-outline'}" data-view="dashboard">📊 Dashboard</button>
          <button class="btn ${state.currentView==='jobs'?'btn-primary':'btn-outline'}" data-view="jobs">💼 Job Postings</button>
          <button class="btn ${state.currentView==='apps'?'btn-primary':'btn-outline'}" data-view="apps">👥 Candidates</button>
          <button class="btn btn-success" data-view="upload">⬆️ Upload CVs</button>
        </div>
      </div>
    `;
  }

  function renderDashboard() {
    var total = state.applications.length;
    var shortlisted = state.applications.filter(a => a.status === 'screening' || a.status === 'interview').length;
    var hired = state.applications.filter(a => a.status === 'hired').length;
    var avgScore = total > 0 ? Math.round(state.applications.reduce((acc, a) => acc + (a.ai_score || 0), 0) / total) : 0;

    return `
      <div class="stats-grid">
        ${_statCard('#3b82f6', 'users', total, 'Total Candidates')}
        ${_statCard('#f59e0b', 'star', shortlisted, 'Shortlisted / Active')}
        ${_statCard('#22c55e', 'check', hired, 'Hired Candidates')}
        ${_statCard('#8b5cf6', 'activity', avgScore + '%', 'Avg AI Score')}
      </div>
      <div class="card" style="margin-top:20px;">
        <div class="card-header"><h3>Recent AI Screenings</h3></div>
        <div class="card-body no-pad">
          ${renderAppsTable(state.applications.slice(0, 5))}
        </div>
      </div>
    `;
  }

  function renderJobs() {
    var html = `
      <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
        <h3>Open Vacancies</h3>
        <button class="btn btn-primary" id="btn-create-job">➕ Create Job</button>
      </div>
      <div class="grid-3">
    `;
    if (state.jobs.length === 0) html += '<p style="color:var(--text-muted)">No jobs found. Create one to start screening CVs.</p>';
    
    state.jobs.forEach(job => {
      var count = state.applications.filter(a => a.job_id === job.id).length;
      html += `
        <div class="card" style="border-top:4px solid var(--accent-primary)">
          <div class="card-body">
            <h4>${job.title}</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">${job.department || 'General'}</p>
            <div style="margin:10px 0; font-size:0.9rem;">
              <div><strong>Req. Exp:</strong> ${job.required_experience_years} Years</div>
              <div><strong>Skills:</strong> ${job.required_skills ? job.required_skills.split(',').length : 0} tags</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
              <span class="badge badge-info">${count} Candidates</span>
              <button class="btn btn-xs btn-outline btn-view-job-apps" data-id="${job.id}">View Candidates</button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  }

  function renderApplications() {
    var html = `
      <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between;">
          <h3>Candidate Ranking & Pipeline</h3>
          <div>
            <select id="filter-job" class="form-input" style="width:auto; display:inline-block; padding:4px 8px;">
              <option value="">All Jobs</option>
              ${state.jobs.map(j => `<option value="${j.id}" ${state.selectedJobId===j.id?'selected':''}>${j.title}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body no-pad">
          ${renderAppsTable(state.selectedJobId ? state.applications.filter(a => a.job_id === state.selectedJobId) : state.applications)}
        </div>
      </div>
    `;
    return html;
  }

  function renderAppsTable(apps) {
    if (apps.length === 0) return '<div style="padding:40px; text-align:center; color:var(--text-muted)">No candidates found.</div>';
    
    // Sort by score
    apps.sort((a,b) => (b.ai_score||0) - (a.ai_score||0));

    var html = '<table class="data-table"><thead><tr>';
    html += '<th>Rank</th><th>Candidate</th><th>Job</th><th>Match Score</th><th>AI Rec</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    apps.forEach((app, idx) => {
      var scoreColor = (app.ai_score || 0) >= 80 ? 'var(--accent-success)' : (app.ai_score || 0) >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      var rec = app.ai_verdict || 'Unknown';
      var recIcon = rec === 'accepted' ? '🟢' : rec === 'review' ? '🟡' : '🔴';
      var displayRec = rec === 'accepted' ? 'Strong' : rec === 'review' ? 'Potential' : 'Weak';
      
      var jobTitle = app.job_title;
      if (app.job_id) {
        var j = state.jobs.find(x => x.id === app.job_id);
        if (j) jobTitle = j.title;
      }

      html += `<tr>
        <td><strong>#${idx+1}</strong></td>
        <td>
          <div style="font-weight:600">${app.candidate_name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted)">${app.candidate_email || 'No Email'}</div>
        </td>
        <td>${jobTitle || '-'}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:60px; background:var(--bg-tertiary); border-radius:4px; height:8px; overflow:hidden;">
              <div style="width:${app.ai_score||0}%; background:${scoreColor}; height:100%;"></div>
            </div>
            <span style="font-weight:700; color:${scoreColor}">${app.ai_score||0}%</span>
          </div>
        </td>
        <td>${recIcon} ${displayRec}</td>
        <td><span class="badge badge-primary">${app.status || 'pending'}</span></td>
        <td>
          <button class="btn btn-xs btn-outline btn-view-profile" data-id="${app.id}">AI Profile</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderUpload() {
    var sysJobs = [
      'General Manager', 'Factory Manager', 'HR Manager', 'HR Specialist',
      'Finance Manager', 'Accountant', 'Procurement Manager', 'Procurement Specialist',
      'Warehouse Manager', 'Warehouse Clerk', 'Production Manager', 'Hall Manager', 
      'Hall Supervisor', 'Production Worker', 'Maintenance Manager', 'Technician',
      'Quality Manager', 'QA Inspector', 'Sales Manager', 'Sales Representative',
      'Planning Manager', 'Planning Specialist', 'IT Manager', 'IT Specialist'
    ];
    return `
      <div class="card" style="max-width:800px; margin:0 auto;">
        <div class="card-header"><h3>⬆️ AI Bulk CV Screening</h3></div>
        <div class="card-body">
          <div class="form-field">
            <label>Select Target Job</label>
            <select id="upload-job-id" class="form-input">
              <option value="">-- General Pool (No specific job) --</option>
              <optgroup label="Custom Job Postings">
                ${state.jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('')}
              </optgroup>
              <optgroup label="System Positions">
                ${sysJobs.map(j => `<option value="${j}">${j}</option>`).join('')}
              </optgroup>
            </select>
          </div>
          
          <div id="ai-dropzone" style="border:2px dashed var(--accent-primary); border-radius:12px; padding:60px 20px; text-align:center; cursor:pointer; background:rgba(99,102,241,0.05); transition:all 0.3s; margin-top:20px;">
            <div style="font-size:3rem; margin-bottom:12px;">📄</div>
            <h3 style="margin:0">Drag & Drop CVs Here</h3>
            <p style="color:var(--text-muted); margin-top:8px;">Supports PDF files. You can select multiple files.</p>
            <input type="file" id="ai-file-input" multiple accept=".pdf" style="display:none">
            <button class="btn btn-success" style="margin-top:16px; font-size:1.1rem; padding:12px 30px; border-radius:8px; box-shadow:0 4px 12px rgba(34,197,94,0.3);" onclick="document.getElementById('ai-file-input').click()">🔍 فحص السيرة الذاتية (Scan CV)</button>
          </div>

          <div id="upload-queue" style="margin-top:20px; display:none;">
            <h4>Processing Queue</h4>
            <div id="queue-list" style="display:flex; flex-direction:column; gap:10px; margin-top:10px;"></div>
          </div>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    // Navigation
    document.querySelectorAll('.ats-premium-container [data-view]').forEach(btn => {
      btn.addEventListener('click', function() {
        state.currentView = this.getAttribute('data-view');
        if (state.currentView === 'apps') state.selectedJobId = null;
        render();
      });
    });

    // Create Job
    var btnCreateJob = document.getElementById('btn-create-job');
    if (btnCreateJob) {
      btnCreateJob.addEventListener('click', function() {
        var body = `
          <div class="form-field"><label>Job Title *</label><input type="text" id="cj-title" class="form-input"></div>
          <div class="form-field"><label>Department</label><input type="text" id="cj-dept" class="form-input"></div>
          <div class="form-field"><label>Required Skills (Comma separated)</label><input type="text" id="cj-skills" class="form-input" placeholder="React, Node.js, SQL..."></div>
          <div class="form-field"><label>Required Experience (Years)</label><input type="number" id="cj-exp" class="form-input" value="0"></div>
          <div class="form-field"><label>Full Job Description</label><textarea id="cj-desc" class="form-input" rows="4"></textarea></div>
        `;
        App.showModal('Create New Job Vacancy', body, `
          <button class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button class="btn btn-primary" id="cj-save">Save Job</button>
        `);
        document.getElementById('cj-save').onclick = function() {
          var title = document.getElementById('cj-title').value.trim();
          if(!title) return alert('Title required');
          var record = {
            title: title,
            department: document.getElementById('cj-dept').value,
            required_skills: document.getElementById('cj-skills').value,
            required_experience_years: parseFloat(document.getElementById('cj-exp').value) || 0,
            description: document.getElementById('cj-desc').value,
            status: 'open',
            created_by: App.user.id,
            created_by_name: App.user.full_name
          };
          sbClient.from('job_postings').insert([record]).then(r => {
            if (r.error && r.error.code !== '42P01') return alert(r.error.message);
            // If table missing, mock it
            if (r.error && r.error.code === '42P01') {
              record.id = 'mock-' + Date.now();
              state.jobs.push(record);
            }
            App.closeModal();
            showToast('Job Created', 'success');
            loadData();
          });
        };
      });
    }

    // View Job Apps
    document.querySelectorAll('.btn-view-job-apps').forEach(btn => {
      btn.addEventListener('click', function() {
        state.selectedJobId = this.getAttribute('data-id');
        state.currentView = 'apps';
        render();
      });
    });

    // Filter apps
    var filterJob = document.getElementById('filter-job');
    if (filterJob) {
      filterJob.addEventListener('change', function() {
        state.selectedJobId = this.value || null;
        render();
      });
    }

    // View Profile
    document.querySelectorAll('.btn-view-profile').forEach(btn => {
      btn.addEventListener('click', function() {
        showCandidateProfile(this.getAttribute('data-id'));
      });
    });

    // Upload Logic
    var dropzone = document.getElementById('ai-dropzone');
    var fileInput = document.getElementById('ai-file-input');
    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor='var(--accent-success)'; });
      dropzone.addEventListener('dragleave', e => { dropzone.style.borderColor='var(--accent-primary)'; });
      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.style.borderColor='var(--accent-primary)';
        handleFiles(e.dataTransfer.files);
      });
      fileInput.addEventListener('change', function() { handleFiles(this.files); });
    }
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    var jobId = document.getElementById('upload-job-id').value;
    // Check if it's a UUID (custom job) or a System Position name
    var isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(jobId);
    var jobData = isUUID ? state.jobs.find(j => j.id === jobId) : null;
    var jobTitleDisplay = jobData ? jobData.title : (jobId || 'General Applicant');
    
    document.getElementById('upload-queue').style.display = 'block';
    var queueList = document.getElementById('queue-list');
    
    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are supported currently.', 'warning');
        return;
      }
      
      var qId = 'q-' + Math.random().toString(36).substr(2, 9);
      var itemHtml = `
        <div id="${qId}" style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-tertiary); border-radius:8px; border-left:4px solid var(--accent-primary);">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="spinner" id="${qId}-spin" style="width:16px; height:16px; border-width:2px;"></span>
            <span style="font-weight:600;">${file.name}</span>
          </div>
          <div id="${qId}-status" style="font-size:0.85rem; color:var(--text-muted)">Extracting Text...</div>
        </div>
      `;
      queueList.insertAdjacentHTML('beforeend', itemHtml);
      
      processPDFFile(file).then(resObj => {
        document.getElementById(qId+'-status').innerText = 'AI Analyzing...';
        return window.AIEngine.analyzeCV(resObj.text, jobData, resObj.rawEmail, resObj.rawPhone).then(parsed => ({text: resObj.text, parsed}));
      }).then(res => {
        document.getElementById(qId+'-status').innerText = 'Saving to Database...';
        var parsed = res.parsed;
        
        var verdictMap = { 'Strong': 'accepted', 'Potential': 'review', 'Weak': 'rejected', 'accepted': 'accepted', 'review': 'review', 'rejected': 'rejected' };
        
        var record = {
          job_id: (jobId && isUUID) ? jobId : null,
          candidate_name: parsed.candidate.name,
          candidate_email: parsed.candidate.email,
          candidate_phone: parsed.candidate.phone,
          job_title: jobTitleDisplay,
          experience_years: parseInt(parsed.experience[0].duration) || 0,
          cv_text: res.text,
          status: 'screening',
          ai_score: parsed.match_score,
          ai_verdict: verdictMap[parsed.ai_recommendation] || 'review',
          ai_analysis: parsed.ai_summary,
          skills_matched: parsed.skills.technical.join(', '),
          skills_missing: parsed.missing_requirements.join(', '),
          ai_structured_data: parsed // Store the full JSON payload
        };

        return sbClient.from('ats_applications').insert([record]).select().then(dbRes => {
          if (dbRes.error) throw dbRes.error;
          var insertedRecord = dbRes.data[0];
          state.applications.unshift(insertedRecord); // add to UI state
          
          document.getElementById(qId).style.borderLeftColor = 'var(--accent-success)';
          document.getElementById(qId+'-spin').style.display = 'none';
          document.getElementById(qId+'-status').innerHTML = `<span style="color:var(--accent-success); font-weight:bold;">Complete - Score: ${parsed.match_score}%</span>`;
          
          // Pop up the report immediately if it's a single file, or just show it for the last processed file
          setTimeout(function() {
             showCandidateProfile(insertedRecord.id);
          }, 500);
        });
      }).catch(err => {
        console.error(err);
        document.getElementById(qId).style.borderLeftColor = 'var(--accent-danger)';
        document.getElementById(qId+'-spin').style.display = 'none';
        document.getElementById(qId+'-status').innerHTML = `<span style="color:var(--accent-danger)">Error: ${err.message||'Failed'}</span>`;
      });
    });
  }

  function processPDFFile(file) {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function(e) {
        var typedarray = new Uint8Array(e.target.result);
        if (typeof pdfjsLib === 'undefined') return reject(new Error("PDF.js not loaded"));
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        
        pdfjsLib.getDocument({data: typedarray, cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true})
        .promise.then(pdf => {
          var promises = [];
          for (var i = 1; i <= pdf.numPages; i++) {
            promises.push(pdf.getPage(i).then(page => page.getTextContent().then(c => c.items.map(item => item.str).join(' '))));
          }
          return Promise.all(promises);
        }).then(pageTexts => {
          var rawText = pageTexts.join('\n');
          // Strip out weird binary/font symbols entirely before any processing
          rawText = rawText.replace(/[^\u0600-\u06FFa-zA-Z0-9\s.,:@+()\-\/'"%]/g, ' ');
          
          // Extract Email and Phone before Arabic Reversal (since English chars aren't backwards in raw LTR extraction)
          var emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          var phoneMatch = rawText.match(/(?:\+?20|0)?1[0125]\d{8}/) || rawText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/);
          
          // Fix Arabic reversing safely
          var allText = rawText.split('\n').map(function(line) {
            if (!/[\u0600-\u06FF]/.test(line)) return line;
            var reversedLine = line.split('').reverse().join('');
            return reversedLine.replace(/[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+/g, function(match) {
                return match.split('').reverse().join('');
            }).replace(/[a-zA-Z0-9_.-]+/g, function(match) {
              return match.split('').reverse().join('');
            });
          }).join('\n');
          
          resolve({text: allText, rawEmail: emailMatch ? emailMatch[0] : null, rawPhone: phoneMatch ? phoneMatch[0] : null});
        }).catch(reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function showCandidateProfile(id) {
    var app = state.applications.find(a => a.id === id);
    if (!app) return;
    
    var data = app.ai_structured_data || {};
    var strengths = data.strengths || [];
    var weaknesses = data.weaknesses || [];
    var missing = data.missing_requirements || [];
    var flags = data.flags || [];
    var iq = data.interview_questions || {hr:[], technical:[]};

    var scoreColor = (app.ai_score || 0) >= 80 ? 'var(--accent-success)' : (app.ai_score || 0) >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    var body = `
      <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="flex:1; text-align:center; padding:20px; background:var(--bg-tertiary); border-radius:12px; border-top:4px solid ${scoreColor};">
          <div style="font-size:3rem; font-weight:900; color:${scoreColor}; line-height:1;">${app.ai_score||0}%</div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:8px;">Overall Match Score</div>
          <div style="margin-top:12px; padding:6px; background:rgba(0,0,0,0.1); border-radius:20px; font-weight:600;">
            ${app.ai_verdict === 'accepted' ? '🟢 Strong Candidate' : app.ai_verdict === 'review' ? '🟡 Potential Match' : '🔴 Weak Match'}
          </div>
        </div>
        <div style="flex:2.5; display:flex; flex-direction:column; justify-content:center;">
          <h2 style="margin:0;">${app.candidate_name}</h2>
          <p style="font-size:1.1rem; color:var(--text-muted); margin:4px 0;">${app.job_title || 'Applicant'}</p>
          <div style="display:flex; gap:16px; margin-top:12px; flex-wrap:wrap;">
            <span>📧 ${app.candidate_email || 'No email'}</span>
            <span>📱 ${app.candidate_phone || 'No phone'}</span>
            <span>💼 ${app.experience_years || 0} Years Exp.</span>
          </div>
        </div>
      </div>

      <div class="tabs" style="display:flex; gap:10px; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
        <button class="btn btn-ghost active" onclick="switchProfTab(this, 'tab-ai')">🤖 AI Analysis</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-skills')">⚡ Skills Matrix</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-questions')">❓ Interview Qs</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-raw')">📄 Raw CV</button>
      </div>

      <div id="tab-ai" class="prof-tab">
        <div style="padding:16px; background:rgba(99,102,241,0.05); border-radius:8px; border-left:4px solid var(--accent-primary); margin-bottom:16px;">
          <h4 style="margin-top:0;">ملخص تحليل الذكاء الاصطناعي</h4>
          <p style="margin-bottom:0; line-height:1.6;" dir="rtl">${app.ai_analysis || 'لم يتم إنشاء ملخص.'}</p>
        </div>
        
        <div class="grid-2">
          <div>
            <h4 style="color:var(--accent-success);">✅ نقاط القوة</h4>
            <ul style="padding-right:20px; margin-top:8px;" dir="rtl">
              ${strengths.length>0 ? strengths.map(s=>`<li>${s}</li>`).join('') : '<li>لم يتم تحديد نقاط قوة محددة</li>'}
            </ul>
          </div>
          <div>
            <h4 style="color:var(--accent-danger);">❌ نقاط الضعف والمهارات المفقودة</h4>
            <ul style="padding-right:20px; margin-top:8px;" dir="rtl">
              ${weaknesses.length>0 ? weaknesses.map(w=>`<li>${w}</li>`).join('') : '<li>لا يوجد نقاط ضعف جوهرية</li>'}
            </ul>
          </div>
        </div>
        
        ${flags.length > 0 ? `
          <div style="margin-top:16px; padding:12px; background:rgba(239,68,68,0.1); border-radius:8px; border:1px solid rgba(239,68,68,0.3);">
            <h4 style="margin:0; color:var(--accent-danger);">⚠️ تنبيهات ذكاء اصطناعي (تتطلب مراجعة HR)</h4>
            <ul style="margin:8px 0 0; padding-left:20px;">
              ${flags.map(f=>`<li>${f}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <div id="tab-skills" class="prof-tab" style="display:none;">
        <h4>Technical Skills</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
          ${(data.skills?.technical||[]).map(s=>`<span class="badge badge-primary">${s}</span>`).join('') || '<span class="text-muted">لم يتم اكتشافها</span>'}
        </div>
        <h4>Soft Skills</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
          ${(data.skills?.soft||[]).map(s=>`<span class="badge badge-info">${s}</span>`).join('') || '<span class="text-muted">لم يتم اكتشافها</span>'}
        </div>
        <h4>Missing Required Skills</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${missing.map(s=>`<span class="badge badge-danger">${s}</span>`).join('') || '<span class="badge badge-success">يطابق جميع المهارات المطلوبة!</span>'}
        </div>
      </div>

      <div id="tab-questions" class="prof-tab" style="display:none;">
        <p class="text-muted">أسئلة مقابلة مقترحة بناءً على تحليل الذكاء الاصطناعي للسيرة الذاتية.</p>
        <h4>Technical Questions</h4>
        <ul dir="rtl" style="padding-right: 20px;">
          ${(iq.technical||[]).map(q=>`<li>${q}</li>`).join('') || '<li>لا يوجد أسئلة تقنية.</li>'}
        </ul>
        <h4>HR / Behavioral Questions</h4>
        <ul dir="rtl" style="padding-right: 20px;">
          ${(iq.hr||[]).map(q=>`<li>${q}</li>`).join('') || '<li>لا يوجد أسئلة موارد بشرية.</li>'}
        </ul>
      </div>

      <div id="tab-raw" class="prof-tab" style="display:none;">
        <pre dir="rtl" style="background:var(--bg-tertiary); padding:16px; border-radius:8px; white-space:pre-wrap; font-size:0.85rem; max-height:400px; overflow:auto; text-align:right;">${app.cv_text || 'لم يتم استخراج نص.'}</pre>
      </div>
    `;

    var footer = `
      <div style="display:flex; justify-content:space-between; width:100%;">
        <div>
          <button class="btn btn-outline" onclick="App.closeModal()">Close</button>
        </div>
        <div style="display:flex; gap:8px;">
          <select id="prof-action-status" class="form-input" style="width:auto; padding:4px 8px;">
            <option value="screening" ${app.status==='screening'?'selected':''}>Screening</option>
            <option value="shortlisted" ${app.status==='shortlisted'?'selected':''}>Shortlisted</option>
            <option value="interview" ${app.status==='interview'?'selected':''}>Interview</option>
            <option value="rejected" ${app.status==='rejected'?'selected':''}>Rejected</option>
          </select>
          <button class="btn btn-primary" onclick="window.atsUpdateAppStatus('${app.id}')">Save Status</button>
          <button class="btn btn-success" onclick="window.atsConvertToEmp('${app.id}')">Convert to Employee</button>
        </div>
      </div>
    `;

    App.showModal('Candidate Profile: ' + app.candidate_name, body, footer, true);
  }

  window.switchProfTab = function(btn, tabId) {
    document.querySelectorAll('.prof-tab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tabs .btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    btn.classList.add('active');
  };

  window.atsUpdateAppStatus = function(id) {
    var newStatus = document.getElementById('prof-action-status').value;
    sbClient.from('ats_applications').update({status: newStatus}).eq('id', id).then(r => {
      if(r.error) return alert(r.error.message);
      showToast('Status Updated', 'success');
      var app = state.applications.find(a => a.id === id);
      if(app) app.status = newStatus;
      render();
    });
  };

  window.atsConvertToEmp = function(id) {
    var app = state.applications.find(a => a.id === id);
    if (!app) return;
    if (!confirm('Are you sure you want to convert this candidate to an employee? This will open the Employee Registration form pre-filled.')) return;
    
    App.closeModal();
    // Assuming erp-hr-core.js is loaded and has a global function or we just navigate to HR
    showToast('Candidate data extracted. Please navigate to Employees > Add New.', 'info');
    // Pre-fill localStorage to be caught by HR module
    localStorage.setItem('hr_prefill_emp', JSON.stringify({
      full_name: app.candidate_name,
      email: app.candidate_email,
      phone: app.candidate_phone,
      job_title: app.job_title
    }));
  };

  loadData();
};
