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
            { role: "system", content: "You are an expert AI Recruiter, ATS Expert, Career Advisor, and CV Consultant. Read the CV carefully and extract all data without removing anything. Output strictly in JSON: {\n\"candidate\":{\"name\":\"\",\"title\":\"\",\"email\":\"\",\"phone\":\"\",\"location\":\"\",\"linkedin\":\"\",\"github\":\"\",\"portfolio\":\"\"},\n\"cv_audit\":{\"content_quality\":0,\"professionalism\":0,\"readability\":0,\"ats_compatibility\":0,\"issues\":[{\"problem\":\"\",\"why\":\"\",\"fix\":\"\"}]},\n\"strong_points\":[],\n\"weak_points\":[{\"weakness\":\"\",\"why\":\"\",\"fix\":\"\"}],\n\"what_to_remove\":[{\"item\":\"\",\"why\":\"\",\"priority\":\"High/Medium/Low\"}],\n\"what_to_add\":[{\"item\":\"\",\"priority\":\"Critical/High/Medium/Low\"}],\n\"what_to_rewrite\":[{\"current\":\"\",\"problem\":\"\",\"improved\":\"\"}],\n\"achievements_improvement\":[{\"current\":\"\",\"missing_metric\":\"\",\"suggested_metric\":\"\"}],\n\"skills_gap\":{\"current\":[],\"missing\":[],\"recommended\":[{\"skill\":\"\",\"priority\":\"\"}]},\n\"courses_recommendation\":[{\"name\":\"\",\"skill\":\"\",\"why\":\"\",\"difficulty\":\"\",\"priority\":\"MUST TAKE/HIGH VALUE/OPTIONAL\"}],\n\"certifications_strategy\":{\"current_analysis\":[],\"recommended\":[]},\n\"projects_recommendation\":[{\"name\":\"\",\"idea\":\"\",\"tech_stack\":[],\"impact\":\"High/Medium\"}],\n\"portfolio_improvement\":[],\n\"github_analysis\":{\"status\":\"\",\"recommendations\":[]},\n\"linkedin_analysis\":{\"status\":\"\",\"recommendations\":[]},\n\"job_match\":{\"score\":0,\"matched_reqs\":[],\"missing_reqs\":[]},\n\"career_paths\":[{\"path\":\"\",\"readiness_percent\":0,\"missing_skills\":[],\"next_steps\":[]}],\n\"plan_30_60_90\":{\"30_days\":[],\"60_days\":[],\"90_days\":[]},\n\"action_plan\":[{\"task\":\"\",\"priority\":\"Critical/High\"}],\n\"top_5_changes\":[],\n\"final_career_score\":{\"career_readiness\":0,\"cv_quality\":0,\"interview_readiness\":0},\n\"education\":[],\"experience\":[],\"skills\":{\"technical\":[],\"soft\":[],\"inferred\":[]},\"projects\":[],\"certifications\":[],\"languages\":[],\n\"match_score\":0,\"ai_summary\":\"\",\"ai_recommendation\":\"accepted/review/rejected\",\"missing_requirements\":[],\"flags\":[],\"interview_questions\":{\"hr\":[],\"technical\":[]},\n\"full_cv_arabic_translation_points\":[]\n}\nUse Arabic for text fields. Do not invent information. For full_cv_arabic_translation_points, translate the entire raw CV line by line into beautiful Arabic bullet points." },
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
        tech: ['react','angular','vue','node.js','express','java','python','c++','c#','.net','php','ruby','swift','kotlin','typescript','javascript','html','css','sql','mongodb','postgresql','mysql','firebase','aws','azure','gcp','docker','kubernetes','git','jenkins','ci/cd','rest api','graphql','machine learning','deep learning','tensorflow','autocad','solidworks','matlab','sap','erp','excel','power bi','tableau','photoshop','illustrator','figma','wordpress','seo','google analytics','linux','bash','powershell','ruby on rails','django','flask','spring boot','laravel','flutter','react native','xcode','android studio','jira','trello','confluence','slack','microsoft office','word','powerpoint','access','data analysis','data mining','big data','hadoop','spark','kafka','elasticsearch','redis','memcached','nginx','apache','tomcat','iis','vmware','hyper-v','active directory','windows server','cisco','ccna','ccnp','network+','security+','ceh','cissp','cism','cisa','itil','pmp','scrum','agile','kanban','lean','six sigma','qa','testing','selenium','cypress','jest','mocha','chai','junit','testng','postman','swagger','openapi'],
        soft: ['leadership','communication','management','agile','teamwork','problem solving','negotiation','presentation','time management','project management','scrum','قيادة','تواصل','إدارة','تفاوض','حل المشكلات','العمل الجماعي','إدارة المشاريع','تنظيم','تخطيط','إبداع','ابتكار','مرونة','قدرة على التكيف','اتخاذ القرارات','تفكير نقدي','تحليل','توجيه','تدريب','تحفيز','إدارة النزاعات','ذكاء عاطفي','تعاطف','استماع نشط','إقناع','تأثير','بناء العلاقات','خدمة العملاء','تعدد المهام','انتباه للتفاصيل','مبادرة','استقلالية','تعلم مستمر','تقبل النقد','العمل تحت الضغط'],
        industry: ['تسويق','مبيعات','موارد بشرية','هندسة','محاسبة','مالية','تصنيع','إنتاج','جودة','صيانة','مشتريات','مخازن','تخزين','لوجستيك','marketing','sales','procurement','logistics','warehouse','manufacturing','quality','maintenance','accounting','finance','hr','supply chain','رعاية صحية','طب','تمريض','صيدلة','تعليم','تدريب','تطوير','بحث','قانون','استشارات','عقارات','مقاولات','بناء','سياحة','ضيافة','طيران','نقل','شحن','تخليص جمركي','تجارة إلكترونية','تجزئة','جملة','إعلام','صحافة','تصميم','فنون','رياضة']
      };
      var techSkills = [], softSkills = [], industrySkills = [];
      allSkillsMap.tech.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) techSkills.push(sk); });
      allSkillsMap.soft.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) softSkills.push(sk); });
      allSkillsMap.industry.forEach(function(sk) { if (cvLower.indexOf(sk) !== -1 && matched.indexOf(sk) === -1) industrySkills.push(sk); });

      // --- Contact Extraction ---
      var emailMatch = rawEmail || (cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || '';
      var phoneMatch = rawPhone || (cvText.match(/(?:\+?20|0)?1[0125]\d{8}/) || cvText.match(/(?:(?:\+?\d{1,3})|(?:\(\+?\d{1,3}\)))?[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}(?:[\s-]?\d{1,4})?/) || [])[0] || '';

      // --- Experience Years ---
      var expYears = 0;
      var totalYearsFromDates = 0;
      var currentYear = new Date().getFullYear();
      
      // 1. Calculate from dates (e.g., 2014 - 2021), using a Set to handle overlapping periods correctly
      var dateRegex = /\b(19\d\d|20\d\d)\b\s*(?:-|to|إلى|–)\s*\b(19\d\d|20\d\d|present|now|current|الآن|الحاضر)\b/gi;
      var match;
      var yearsSet = new Set();
      while ((match = dateRegex.exec(cvText)) !== null) {
        var startY = parseInt(match[1]);
        var endStr = match[2].toLowerCase();
        var endY = (endStr.includes('present') || endStr.includes('now') || endStr.includes('current') || endStr.includes('الآن') || endStr.includes('الحاضر')) ? currentYear : parseInt(endStr);
        if (startY >= 1950 && startY <= currentYear && endY >= startY && endY <= currentYear) {
          for(var y = startY; y <= endY; y++) {
            yearsSet.add(y);
          }
        }
      }
      totalYearsFromDates = yearsSet.size > 0 ? yearsSet.size - 1 : 0;

      // 2. Explicit match (strict)
      var expMatch = cvText.match(/(\d+)\s*(?:years?|yrs?|سنوات|سنة|سنين)(?:\s+of)?\s+(?:experience|خبرة)/i) || cvText.match(/(?:experience|خبرة)\s*[:\-]?\s*(\d+)/i);
      var explicitYears = expMatch ? parseInt(expMatch[1]) : 0;

      // 3. Final decision
      if (totalYearsFromDates > 0) {
        // Prefer date calculation if available as it is usually more accurate and avoids fake numbers
        // But if explicit is much higher and reasonable, they might have older experience not listed with dates
        if (explicitYears > totalYearsFromDates && explicitYears < 40) {
           expYears = explicitYears;
        } else {
           expYears = totalYearsFromDates;
        }
      } else if (explicitYears > 0 && explicitYears < 40) {
        expYears = explicitYears;
      } else {
        // Fallback to broader match
        var broadMatch = cvText.match(/(\d+)\s*(?:years?|yrs?|سنوات|سنة|سنين)/i);
        expYears = (broadMatch && parseInt(broadMatch[1]) < 40) ? parseInt(broadMatch[1]) : 0;
      }

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
      var eduKeywords = ['bachelor','master','phd','mba','diploma','بكالوريوس','ماجستير','دكتوراه','دبلوم','ليسانس','b.sc','b.a','degree','graduate','graduated','faculty'];
      var uniKeywords = ['university','جامعة','كلية','معهد','أكاديمية','institute','college','academy','faculty'];
      var detectedDegrees = [];
      var detectedUnis = [];
      lines.forEach(function(line) {
        var ll = line.toLowerCase();
        eduKeywords.forEach(function(ek) {
          if (ll.indexOf(ek) !== -1 && detectedDegrees.indexOf(line) === -1) {
            detectedDegrees.push(line.substring(0, 80).trim());
          }
        });
        uniKeywords.forEach(function(uk) {
          if (ll.indexOf(uk) !== -1 && detectedUnis.indexOf(line) === -1) {
            detectedUnis.push(line.substring(0, 80).trim());
          }
        });
      });
      // Cleanup long strings
      detectedDegrees = detectedDegrees.filter(function(d) { return d.length > 5; });
      detectedUnis = detectedUnis.filter(function(u) { return u.length > 5; });
      var eduDegree = detectedDegrees.length > 0 ? detectedDegrees[0] : 'غير مكتشف';
      var eduUni = detectedUnis.length > 0 ? detectedUnis[0] : 'غير معروف';

      // --- Experience Extraction (Real Companies, Titles & Responsibilities) ---
      var companyKeywords = ['company','شركة','مصنع','مؤسسة','factory','group','corp','inc','ltd','organization','hospital','مستشفى','بنك','bank'];
      var titleKeywords = ['manager','مدير','engineer','مهندس','supervisor','مشرف','specialist','أخصائي','accountant','محاسب','developer','مبرمج','analyst','محلل','director','رئيس','coordinator','منسق','technician','فني','مندوب','representative','inspector','مفتش','worker','عامل'];
      var detectedCompanies = [];
      var detectedTitles = [];
      var experienceContexts = [];
      
      lines.forEach(function(line, idx) {
        var ll = line.toLowerCase();
        if(line.length < 120) {
           var foundCompany = false;
           companyKeywords.forEach(function(ck) {
             if (ll.indexOf(ck) !== -1 && detectedCompanies.indexOf(line) === -1) {
               detectedCompanies.push(line.substring(0, 80).trim());
               foundCompany = true;
             }
           });
           
           var foundTitle = false;
           titleKeywords.forEach(function(tk) {
             if (ll.indexOf(tk) !== -1 && detectedTitles.indexOf(line) === -1) {
               detectedTitles.push(line.substring(0, 80).trim());
               foundTitle = true;
             }
           });
           
           if (foundTitle || foundCompany) {
              var ctx = [];
              for(var k = 1; k <= 4; k++) {
                 if (idx + k < lines.length) {
                    var nxt = lines[idx+k].trim();
                    // Grab next lines that look like bullet points or short descriptions
                    if (nxt.length > 10 && nxt.length < 200 && !nxt.includes('@') && !titleKeywords.some(tk=>nxt.toLowerCase().includes(tk))) {
                       ctx.push(nxt);
                    }
                 }
              }
              experienceContexts.push(ctx.join(' - '));
           }
        }
      });

      // --- Location Extraction ---
      var locationKeywords = ['القاهرة','الإسكندرية','الجيزة','المنصورة','أسيوط','الأقصر','أسوان','طنطا','الزقازيق','بورسعيد','السويس','دمياط','cairo','alexandria','giza','egypt','مصر','riyadh','jeddah','dubai','الرياض','جدة','دبي'];
      var detectedLocation = '';
      locationKeywords.forEach(function(loc) {
        if (cvLower.indexOf(loc) !== -1 && !detectedLocation) detectedLocation = loc;
      });

      // --- Languages & Certifications Extraction ---
      var langKeywords = ['english', 'arabic', 'french', 'german', 'spanish', 'إنجليزية', 'عربية', 'فرنسية'];
      var certKeywords = ['pmp', 'cpa', 'cma', 'aws certified', 'cisco', 'ccna', 'itil', 'six sigma', 'ielts', 'toefl', 'شهادة', 'دورة'];
      var detectedLangs = [];
      var detectedLangsObj = [];
      var detectedCerts = [];
      langKeywords.forEach(function(lk) { 
        if (cvLower.indexOf(lk) !== -1) {
           detectedLangs.push(lk);
           var idx = cvLower.indexOf(lk);
           var contextStr = cvLower.substring(Math.max(0, idx - 30), Math.min(cvLower.length, idx + 40));
           var level = 'Native/Bilingual';
           if (contextStr.includes('fluent') || contextStr.includes('ممتاز') || contextStr.includes('excellent') || contextStr.includes('advanced')) level = 'Fluent';
           else if (contextStr.includes('good') || contextStr.includes('جيد') || contextStr.includes('working') || contextStr.includes('intermediate')) level = 'Good Command';
           else if (contextStr.includes('native') || contextStr.includes('أم') || contextStr.includes('mother')) level = 'Native';
           else if (contextStr.includes('basic') || contextStr.includes('مبتدئ') || contextStr.includes('fair')) level = 'Basic';
           detectedLangsObj.push({name: lk.charAt(0).toUpperCase() + lk.slice(1), level: level});
        }
      });
      certKeywords.forEach(function(ck) { if (cvLower.indexOf(ck) !== -1) detectedCerts.push(ck); });

      var reqExp = jobData ? parseFloat(jobData.required_experience_years || 0) : 0;

      // --- Scoring ---
      var score = 20; // Base score
      if (reqSkills.length > 0) score += (matched.length / reqSkills.length) * 35;
      else score += 35; // Free points if no skills required
      
      if (reqExp > 0) {
        if (expYears >= reqExp) score += 20;
        else if (expYears > 0) score += (expYears / reqExp) * 15; // Partial points for some experience
      } else {
        if (expYears > 0) score += 15;
      }
      
      if (techSkills.length > 4) score += 5;
      else if (techSkills.length > 1) score += 3;
      if (softSkills.length > 2) score += 5;
      
      if (cvText.length > 2000) score += 5;
      else if (cvText.length > 1000) score += 3;
      
      var eduScore = 0;
      if (detectedDegrees.length > 0) {
        eduScore = 5;
        if (eduDegree.toLowerCase().includes('master') || eduDegree.toLowerCase().includes('phd') || eduDegree.includes('ماجستير') || eduDegree.includes('دكتوراه')) eduScore = 10;
      }
      score += eduScore;
      
      if (detectedCompanies.length >= 2) score += 5;
      if (detectedLangs.length > 1) score += 3;
      if (detectedCerts.length > 0) score += 2;
      
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
      if (detectedCompanies.length >= 2) strengths.push("خبرة متنوعة في " + detectedCompanies.length + " جهات عمل (" + detectedCompanies.slice(0,2).join('، ') + ")");
      if (techSkills.length > 0) strengths.push("مهارات تقنية إضافية: " + techSkills.slice(0,4).join('، '));
      if (softSkills.length > 0) strengths.push("مهارات شخصية داعمة: " + softSkills.slice(0,3).join('، '));
      if (detectedLangs.length > 1) strengths.push("متعدد اللغات (" + detectedLangs.join('، ') + ")");
      if (detectedCerts.length > 0) strengths.push("يمتلك شهادات إضافية (" + detectedCerts.slice(0,2).join('، ') + ")");
      if (strengths.length === 0) strengths.push("السيرة الذاتية تحتاج مراجعة يدوية لتحديد نقاط القوة بشكل دقيق");

      var weaknesses = [];
      if (missing.length > 0) missing.forEach(function(s) { weaknesses.push("تفتقر السيرة لمهارة أساسية مطلوبة: " + s); });
      if (expYears < reqExp && reqExp > 0) weaknesses.push("الخبرة (" + expYears + " سنوات) أقل من الحد الأدنى المطلوب (" + reqExp + " سنوات)");
      if (detectedDegrees.length === 0) weaknesses.push("لم يتم اكتشاف مؤهل علمي واضح (يفضل مراجعة السيرة يدوياً)");
      if (cvText.length < 500) weaknesses.push("السيرة الذاتية قصيرة جداً وتفتقر للتفاصيل الكافية للحكم الدقيق");
      
      // If score < 100, there MUST be weaknesses - generate smart ones based on what's missing
      if (score < 98 && weaknesses.length === 0) {
        if (softSkills.length < 3) weaknesses.push("عدد المهارات الشخصية (Soft Skills) المذكورة قليل - يُفضل التركيز عليها في المقابلة");
        if (techSkills.length < 4) weaknesses.push("النطاق التقني للمرشح يبدو محدوداً نسبياً من خلال النص");
        if (detectedCompanies.length < 2) weaknesses.push("خبرة عملية محدودة في عدد جهات العمل السابقة (قد يدل على خبرة في بيئة واحدة فقط)");
        if (!detectedLocation) weaknesses.push("لم يتم تحديد الموقع الجغرافي للمرشح في السيرة الذاتية");
        if (detectedLangs.length === 0) weaknesses.push("لم يتم تحديد اللغات المتقنة بوضوح في السيرة");
      }
      // Final fallback - always show something if not perfect
      if (score < 98 && weaknesses.length === 0) {
        weaknesses.push("التقييم العام جيد ولكن ينصح باختبار المرشح عملياً للتأكد من المهارات المذكورة");
      }

      var flags = [];
      if (expYears === 0) flags.push("لم يتم اكتشاف سنوات خبرة واضحة في النص.");
      if (cvText.length < 300) flags.push("السيرة الذاتية قصيرة جداً (" + cvText.length + " حرف) وقد تكون غير مكتملة.");
      if (!emailMatch) flags.push("لم يتم العثور على بريد إلكتروني في السيرة الذاتية.");
      if (!phoneMatch) flags.push("لم يتم العثور على رقم هاتف في السيرة الذاتية.");

      // --- Build REAL Interview Questions based on extracted data ---
      var hrQuestions = [];
      if (detectedCompanies.length > 0) hrQuestions.push(`حدثنا عن تجربتك السابقة في "${detectedCompanies[0]}" وما هي أبرز إنجازاتك هناك؟`);
      if (expYears > 0) hrQuestions.push(`كيف ستوظف خبرتك التي تمتد لـ ${expYears} سنوات لخدمة أهداف شركتنا؟`);
      if (detectedTitles.length > 1) hrQuestions.push(`لاحظنا تنوعاً في المسميات الوظيفية لديك، ما هو المسار الذي تفضله أكثر ولماذا؟`);
      hrQuestions.push("ما هي التحديات التي تبحث عنها في بيئة العمل القادمة وكيف تتعامل مع الضغوط؟");
      if (softSkills.length > 0) hrQuestions.push(`ذكرت مهارات مثل (${softSkills.slice(0,2).join(', ')}).. اذكر لنا موقفاً حقيقياً طبقت فيه هذه المهارة.`);

      var techQuestions = [];
      matched.forEach(function(s) { techQuestions.push(`صف لنا مشروعاً عملياً معقداً استخدمت فيه تقنية/مهارة "${s}" وما دورك الدقيق فيه؟`); });
      missing.forEach(function(s) { techQuestions.push(`كيف تخطط لاكتساب وتطوير مهاراتك في "${s}" خلال فترة الاختبار (أول 3 أشهر)؟`); });
      if (techSkills.length > 0) techQuestions.push(`من بين خبراتك المتنوعة (${techSkills.slice(0,2).join(', ')}).. كيف تدمج بينها لحل المشكلات التقنية؟`);
      if (detectedCerts.length > 0) techQuestions.push(`كيف أضافت الشهادة/الدورة "${detectedCerts[0]}" لقدراتك المهنية عملياً؟`);

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
            responsibilities: experienceContexts[e] ? [experienceContexts[e].substring(0, 200) + '...'] : []
          });
        }
      } else {
        experienceArr.push({company: 'غير محدد', title: jobData ? jobData.title : 'غير محدد', duration: expYears + ' سنوات', responsibilities: []});
      }

      // Removed old translatedPts
      
      // --- DYNAMIC INTERNAL MODEL (Advanced Engine) ---
      
      // Skill Progression Matrix (If missing is empty, generate "Next Level" skills based on what they have)
      var inferredMissing = [].concat(missing);
      if (inferredMissing.length === 0) {
        if (techSkills.includes('html') && !techSkills.includes('react')) inferredMissing.push('react');
        if (techSkills.includes('javascript') && !techSkills.includes('typescript')) inferredMissing.push('typescript');
        if (techSkills.includes('excel') && !techSkills.includes('power bi')) inferredMissing.push('power bi');
        if (industrySkills.includes('accounting') && !techSkills.includes('erp')) inferredMissing.push('erp systems');
        if (techSkills.includes('java') && !techSkills.includes('spring boot')) inferredMissing.push('spring boot');
        if (industrySkills.includes('hr') && !techSkills.includes('kpi')) inferredMissing.push('kpi tracking');
        if (techSkills.includes('photoshop') && !techSkills.includes('figma')) inferredMissing.push('figma');
        if (inferredMissing.length === 0 && expYears > 3) inferredMissing.push('leadership/management');
        if (inferredMissing.length === 0) inferredMissing.push('advanced data analysis');
      }

      var what_to_remove = [];
      if (cvText.length > 3000) what_to_remove.push({item: "الفقرات الطويلة جداً والتفاصيل القديمة", why: "السيرة الذاتية تتجاوز الطول المثالي (أكثر من 3000 حرف)، مما يشتت القارئ.", priority: "High"});
      if (expYears > 15) what_to_remove.push({item: "الخبرات القديمة جداً (أكثر من 15 سنة)", why: "التركيز يجب أن يكون على آخر 10 سنوات لإظهار التطور الحديث.", priority: "Medium"});
      if (what_to_remove.length === 0) what_to_remove.push({item: "أي بيانات شخصية غير ضرورية (مثل الحالة الاجتماعية أو الديانة)", why: "لتوفير مساحة للخبرات المهنية وتجنب التحيز.", priority: "Low"});

      var what_to_add = [];
      if (missing.length > 0) what_to_add.push({item: "المهارات المفقودة للوظيفة: " + missing.join('، '), priority: "Critical"});
      if (inferredMissing.length > 0 && missing.length === 0) what_to_add.push({item: "مهارات المستوى المتقدم (مثل: " + inferredMissing.join('، ') + ")", priority: "High"});
      if (!detectedLocation) what_to_add.push({item: "الموقع الجغرافي والمدينة", priority: "Medium"});
      if (techSkills.length === 0) what_to_add.push({item: "قسم واضح للمهارات التقنية والأدوات المستخدمة", priority: "High"});
      if (what_to_add.length === 0) what_to_add.push({item: "إنجازات قابلة للقياس بالأرقام في كل خبرة سابقة", priority: "High"});

      var what_to_rewrite = [];
      if (cvText.indexOf('%') === -1 && cvText.indexOf('$') === -1) {
        what_to_rewrite.push({current: "مسؤوليات العمل المكتوبة بشكل سردي", problem: "تفتقر للأرقام والنتائج الملموسة", improved: "صياغتها كإنجازات مثل: (تحسين الكفاءة بنسبة 20%)"});
      }
      if (softSkills.length < 2) {
        what_to_rewrite.push({current: "قسم الملخص المهني", problem: "لا يبرز المهارات الشخصية والقيادية بشكل كافٍ", improved: "دمج مهارات مثل التواصل وإدارة الوقت في مقدمة السيرة"});
      }
      if (what_to_rewrite.length === 0) {
        what_to_rewrite.push({current: "النقاط الروتينية في المهام", problem: "كلمات تقليدية وضعيفة", improved: "استخدام أفعال قوية (أدرت، طورت، حققت) بدلاً من (كنت مسؤولاً عن)"});
      }
      
      var courses_rec = inferredMissing.map(function(m) {
        return {name: "Professional " + m.toUpperCase() + " Masterclass", skill: m, why: "لسد الفجوة التقنية والانتقال للمستوى التالي", difficulty: "Intermediate", priority: "MUST TAKE"};
      });
      if (courses_rec.length === 0 && techSkills.length > 0) {
        courses_rec.push({name: "Advanced " + techSkills[0].toUpperCase() + " Techniques", skill: techSkills[0], why: "للانتقال من مستوى جيد إلى خبير في مجالك", difficulty: "Advanced", priority: "HIGH VALUE"});
      }

      var plan_30 = [], plan_60 = [], plan_90 = [];
      if (inferredMissing.length > 0) {
        plan_30.push("التسجيل في دورة مكثفة لتعلم: " + inferredMissing[0]);
        plan_30.push("تحديث السيرة الذاتية لإضافة الكلمات المفتاحية المتعلقة بـ " + inferredMissing[0]);
        if (inferredMissing.length > 1) plan_60.push("تطبيق مهارة " + inferredMissing[1] + " في مشروع عملي مصغر");
        else plan_60.push("بناء مشروع عملي متكامل يبرز المهارات الجديدة ورفع كفاءة العمليات");
      } else {
        plan_30.push("البدء في دراسة متطلبات الترقية للمستوى الأعلى (Senior/Lead)");
        plan_60.push("قيادة مبادرة أو مشروع تطوعي داخل بيئة العمل لإبراز المهارات القيادية");
      }
      plan_90.push("التقديم على مقابلات تجريبية (Mock Interviews) لاختبار الكفاءة");
      plan_90.push("نشر المشاريع العملية أو المقالات الاحترافية على LinkedIn لزيادة التواجد الرقمي");

      var proj_rec = [];
      if (techSkills.length > 0 || matched.length > 0) {
        var pStack = matched.concat(techSkills).slice(0,4);
        proj_rec.push({name: "نظام أتمتة لعمليات القطاع", idea: "بناء تطبيق أو سير عمل يحل مشكلة حقيقية ويوفر الوقت", tech_stack: pStack, impact: "High"});
      } else {
        proj_rec.push({name: "دراسة حالة (Case Study)", idea: "إنشاء نموذج عملي موثق يعكس خبرتك العميقة في مجالك وكيفية حل المشاكل", tech_stack: [], impact: "Medium"});
      }

      // --- BUILD ARABIC SUMMARY POINTS (from extracted data) ---
      var arabicPts = [];
      arabicPts.push('<strong style="color:var(--accent-primary);">الاسم:</strong> ' + name);
      if (detectedTitles.length > 0) arabicPts.push('<strong style="color:var(--accent-primary);">المسمى الوظيفي:</strong> ' + detectedTitles.join(' / '));
      if (emailMatch) arabicPts.push('<strong style="color:var(--accent-primary);">البريد:</strong> ' + emailMatch);
      if (phoneMatch) arabicPts.push('<strong style="color:var(--accent-primary);">الهاتف:</strong> ' + phoneMatch);
      if (detectedLocation) arabicPts.push('<strong style="color:var(--accent-primary);">الموقع:</strong> ' + detectedLocation);
      if (expYears > 0) arabicPts.push('<strong style="color:var(--accent-primary);">سنوات الخبرة:</strong> ' + expYears + ' سنوات');
      arabicPts.push('<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">');
      arabicPts.push('<strong style="font-size:1.1rem; color:var(--accent-success);">التعليم والمؤهلات:</strong>');
      if (detectedDegrees.length > 0) { detectedDegrees.forEach(function(d, i) { arabicPts.push('• ' + d + (detectedUnis[i] ? ' - ' + detectedUnis[i] : '')); }); }
      else { arabicPts.push('• لم يتم العثور على مؤهل أكاديمي واضح.'); }
      if (detectedCerts.length > 0) { arabicPts.push('<strong style="font-size:1.1rem; color:var(--accent-success); margin-top:8px; display:inline-block;">الشهادات:</strong>'); detectedCerts.forEach(function(c) { arabicPts.push('• ' + c); }); }
      arabicPts.push('<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">');
      arabicPts.push('<strong style="font-size:1.1rem; color:var(--accent-warning);">الخبرات المهنية:</strong>');
      if (experienceArr.length > 0) { experienceArr.forEach(function(exp) { var line = '• <strong>' + (exp.title || '') + '</strong>'; if (exp.company && exp.company !== 'غير محدد') line += ' - ' + exp.company; if (exp.duration) line += ' (' + exp.duration + ')'; arabicPts.push(line); if(exp.responsibilities && exp.responsibilities.length > 0 && exp.responsibilities[0].length > 5) { arabicPts.push('<div style="font-size:0.9rem; color:var(--text-muted); margin-top:4px; margin-bottom:8px; margin-right:16px;">↳ ' + exp.responsibilities[0] + '</div>'); } }); }
      else { arabicPts.push('• لم يتم العثور على خبرات مهنية.'); }
      arabicPts.push('<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">');
      arabicPts.push('<strong style="font-size:1.1rem; color:var(--accent-info);">المهارات المكتشفة:</strong>');
      var pureTechSkills = matched.concat(techSkills);
      if (pureTechSkills.length > 0) arabicPts.push('• <strong>تقنية:</strong> ' + pureTechSkills.join(', '));
      if (industrySkills.length > 0) arabicPts.push('• <strong>مهنية/صناعية:</strong> ' + industrySkills.join(', '));
      if (softSkills.length > 0) arabicPts.push('• <strong>شخصية:</strong> ' + softSkills.join(', '));
      if (pureTechSkills.length === 0 && industrySkills.length === 0 && softSkills.length === 0) arabicPts.push('• لم يتم اكتشاف مهارات.');
      if (detectedLangs.length > 0) {
        var langDisplay = detectedLangsObj.map(function(lo) { return lo.name + ' (' + lo.level + ')'; }).join(', ');
        arabicPts.push('• <strong>اللغات:</strong> ' + langDisplay);
      }
      arabicPts.push('<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">');
      arabicPts.push('<strong style="font-size:1.1rem; color:var(--accent-primary);">التقييم العام:</strong>');
      arabicPts.push('• <strong>نسبة التوافق:</strong> ' + score + '%');
      arabicPts.push('• <strong>التوصية:</strong> ' + (rec === 'accepted' ? 'مرشح قوي' : rec === 'review' ? 'يحتاج مراجعة' : 'غير مناسب'));
      if (strengths.length > 0) { arabicPts.push('<strong style="font-size:1.05rem; margin-top:8px; display:inline-block; color:var(--accent-success);">نقاط القوة:</strong>'); strengths.forEach(function(s) { arabicPts.push('✅ ' + s); }); }
      if (weaknesses.length > 0) { arabicPts.push('<strong style="font-size:1.05rem; margin-top:8px; display:inline-block; color:var(--accent-danger);">نقاط الضعف:</strong>'); weaknesses.forEach(function(w) { arabicPts.push('❌ ' + w); }); }
      if (missing.length > 0) { arabicPts.push('<strong style="font-size:1.05rem; margin-top:8px; display:inline-block; color:var(--accent-warning);">المهارات المفقودة:</strong>'); missing.forEach(function(m) { arabicPts.push('❗ ' + m); }); }
      arabicPts.push('<hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">');
      arabicPts.push('<strong style="font-size:1.1rem; color:var(--text-color);">الملخص الذكي:</strong>');
      arabicPts.push('• ' + summary);

      return {
        candidate: { name: name, title: detectedTitles[0] || '', phone: phoneMatch, email: emailMatch, location: detectedLocation, linkedin: '', github: '', portfolio: '', total_years: expYears },
        cv_audit: { content_quality: 70, professionalism: 80, readability: 75, ats_compatibility: Math.round(score * 0.9), issues: [{problem: "السيرة الذاتية تحتاج تنسيق يتوافق مع ATS", why: "لتسهيل القراءة الآلية", fix: "استخدم خطوط واضحة ونقاط مختصرة"}] },
        strong_points: strengths,
        weak_points: weaknesses.map(w => ({weakness: w, why: "تؤثر على فرص القبول", fix: "قم بتحديث السيرة لتدارك هذه النقطة"})),
        what_to_remove: what_to_remove,
        what_to_add: what_to_add,
        what_to_rewrite: what_to_rewrite,
        achievements_improvement: [{current: "سرد مهام روتينية", missing_metric: "نسبة التحسن أو العائد", suggested_metric: "20% تحسن، أو توفير X دولار"}],
        skills_gap: { current: matched, missing: missing, recommended: missing.map(m => ({skill: m, priority: "High"})) },
        courses_recommendation: courses_rec,
        certifications_strategy: { current_analysis: detectedCerts, recommended: detectedCerts.length === 0 ? ["شهادة مهنية معتمدة في مجالك"] : ["شهادة متقدمة للبناء على ما تملك"] },
        projects_recommendation: proj_rec,
        portfolio_improvement: ["إضافة روابط حية وتوثيق للمشاريع لرفع الموثوقية"],
        github_analysis: { status: "غير محدد", recommendations: ["تأسيس حساب Github إن كان مجالك تقنياً", "رفع الأكواد بانتظام"] },
        linkedin_analysis: { status: "غير محدد", recommendations: ["تحديث العنوان المهني (Headline) ليشمل الكلمات المفتاحية", "كتابة ملخص احترافي يعكس الخبرات"] },
        job_match: { score: score, matched_reqs: matched, missing_reqs: missing },
        career_paths: [{path: detectedTitles[0] || "متخصص", readiness_percent: score, missing_skills: missing, next_steps: ["اكتساب المهارات الناقصة وبناء علاقات مهنية"]}],
        plan_30_60_90: { "30_days": plan_30, "60_days": plan_60, "90_days": plan_90 },
        action_plan: [{task: "تحديث السيرة الذاتية فوراً بناءً على هذه التوصيات", priority: "Critical"}],
        top_5_changes: ["إضافة أرقام وإحصائيات للإنجازات", "إبراز المهارات المفقودة التي تتطلبها الوظيفة", "تحسين قسم الملخص المهني", "تنسيق السيرة لسهولة القراءة", "ربط السيرة بحساب LinkedIn"],
        final_career_score: { career_readiness: score, cv_quality: score > 70 ? 80 : 60, interview_readiness: score > 60 ? 75 : 50 },
        full_cv_arabic_translation_points: arabicPts,
        education: educationArr,
        experience: experienceArr,
        skills: { technical: matched.concat(techSkills), soft: softSkills, industry: industrySkills, inferred: [] },
        projects: [],
        certifications: detectedCerts.map(c => ({name: c, provider: 'Unknown', date: ''})),
        languages: detectedLangsObj,
        // Backwards compatibility keys
        match_score: score,
        missing_requirements: missing,
        ai_recommendation: rec,
        ai_summary: summary,
        interview_questions: { hr: hrQuestions, technical: techQuestions },
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
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="btn-group">
              <button class="btn ${state.viewMode==='list'?'btn-primary':'btn-outline'} btn-sm" onclick="window.atsSetViewMode('list')">قائمة (List)</button>
              <button class="btn ${state.viewMode!=='list'?'btn-primary':'btn-outline'} btn-sm" onclick="window.atsSetViewMode('kanban')">لوحة (Board)</button>
            </div>
            <select id="filter-job" class="form-input" style="width:auto; display:inline-block; padding:4px 8px;">
              <option value="">All Jobs</option>
              ${state.jobs.map(j => `<option value="${j.id}" ${state.selectedJobId===j.id?'selected':''}>${j.title}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body no-pad" style="background:var(--bg-secondary); padding:16px; min-height:400px;">
          ${state.viewMode==='list' ? renderAppsTable(state.selectedJobId ? state.applications.filter(a => a.job_id === state.selectedJobId) : state.applications) : renderKanban(state.selectedJobId ? state.applications.filter(a => a.job_id === state.selectedJobId) : state.applications)}
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
    html += '<th>الترتيب</th><th>المرشح</th><th>الوظيفة</th><th>نسبة التوافق</th><th>توصية الذكاء الاصطناعي</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>';
    
    apps.forEach((app, idx) => {
      var scoreColor = (app.ai_score || 0) >= 80 ? 'var(--accent-success)' : (app.ai_score || 0) >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      var rec = app.ai_verdict || 'Unknown';
      var recIcon = rec === 'accepted' ? '🟢' : rec === 'review' ? '🟡' : '🔴';
      var displayRec = rec === 'accepted' ? 'قوي' : rec === 'review' ? 'محتمل' : 'ضعيف';
      
      var jobTitle = app.job_title;
      if (app.job_id) {
        var j = state.jobs.find(x => x.id === app.job_id);
        if (j) jobTitle = j.title;
      }

      var statusMap = { 'screening': 'فرز أولي', 'shortlisted': 'قائمة مختصرة', 'interview': 'مقابلة', 'hired': 'تم التعيين', 'rejected': 'مرفوض', 'pending': 'قيد الانتظار' };
      var displayStatus = statusMap[app.status] || app.status || 'قيد الانتظار';

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
        <td><span class="badge badge-primary">${displayStatus}</span></td>
        <td>
          <button class="btn btn-xs btn-outline btn-view-profile" data-id="${app.id}">AI Profile</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';
    return html;
  }

  function renderKanban(apps) {
    var cols = [
      { id: 'pending', title: 'قيد الانتظار / جديد', color: 'var(--text-secondary)' },
      { id: 'screening', title: 'فرز أولي', color: 'var(--accent-primary)' },
      { id: 'shortlisted', title: 'قائمة مختصرة', color: 'var(--accent-info)' },
      { id: 'interview', title: 'مقابلة', color: 'var(--accent-warning)' },
      { id: 'hired', title: 'تم التعيين', color: 'var(--accent-success)' },
      { id: 'rejected', title: 'مرفوض', color: 'var(--accent-danger)' }
    ];

    var html = '<div style="display:flex; gap:16px; overflow-x:auto; padding-bottom:16px;">';
    cols.forEach(c => {
      var colApps = apps.filter(a => {
        var st = a.status || 'pending';
        if (c.id === 'pending' && (!a.status || a.status === 'pending')) return true;
        return st === c.id;
      });
      
      // Sort inside column by score
      colApps.sort((a,b) => (b.ai_score||0) - (a.ai_score||0));

      html += `<div style="flex: 0 0 300px; background:var(--bg-tertiary); border-radius:8px; display:flex; flex-direction:column; max-height:70vh;">
        <div style="padding:12px 16px; border-bottom:2px solid ${c.color}; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
          <span>${c.title}</span>
          <span class="badge" style="background:${c.color}; color:#fff;">${colApps.length}</span>
        </div>
        <div style="padding:12px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:12px;">`;
      
      if(colApps.length === 0) {
        html += '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:20px 0;">لا يوجد مرشحين</div>';
      }

      colApps.forEach(app => {
        var scoreColor = (app.ai_score || 0) >= 80 ? 'var(--accent-success)' : (app.ai_score || 0) >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';
        var jobTitle = app.job_title || 'وظيفة عامة';
        if (app.job_id) {
          var j = state.jobs.find(x => x.id === app.job_id);
          if (j) jobTitle = j.title;
        }

        html += `<div class="card" style="padding:12px; cursor:pointer; border-left:3px solid ${scoreColor}; box-shadow:0 2px 4px rgba(0,0,0,0.05);" onclick="window.atsViewProfile('${app.id}')">
          <div style="font-weight:bold; font-size:1rem; margin-bottom:4px;">${app.candidate_name}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px;">${jobTitle}</div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.8rem; font-weight:bold; color:${scoreColor}">التوافق: ${app.ai_score||0}%</span>
            <button class="btn btn-xs btn-primary" onclick="event.stopPropagation(); window.atsViewProfile('${app.id}')">التفاصيل</button>
          </div>
        </div>`;
      });
      html += `</div></div>`;
    });
    html += '</div>';
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
            promises.push(pdf.getPage(i).then(page => page.getTextContent().then(c => {
              var text = '';
              var lastY = -1;
              c.items.forEach(item => {
                if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) { text += '\n'; }
                else if (lastY !== -1) { text += ' '; }
                text += item.str;
                lastY = item.transform[5];
              });
              return text;
            })));
          }
          return Promise.all(promises);
        }).then(pageTexts => {
          var rawText = pageTexts.join('\n');
          // Strip out weird binary/font symbols entirely before any processing
          rawText = rawText.replace(/[^\u0600-\u06FFa-zA-Z0-9\s.,:@+()\-\/'"%]/g, ' ');
          
          // Extract Email and Phone before Arabic Reversal (since English chars aren't backwards in raw LTR extraction)
          var emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          var phoneMatch = rawText.match(/(?:\+?20|0)?1[0125]\d{8}/) || rawText.match(/(?:(?:\+?\d{1,3})|(?:\(\+?\d{1,3}\)))?[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}(?:[\s-]?\d{1,4})?/);
          
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
    var strengths = data.strong_points || data.strengths || [];
    var weaknessesRaw = data.weak_points || data.weaknesses || [];
    var weaknesses = weaknessesRaw.map(w => typeof w === 'string' ? w : (w.weakness || ''));
    var missing = data.missing_requirements || (data.job_match ? data.job_match.missing_reqs : []) || [];
    var flags = data.flags || [];
    var iq = data.interview_questions || {hr:[], technical:[]};
    
    // Dynamic seniority calculation
    var totalYrs = (data.candidate && data.candidate.total_years !== undefined) ? data.candidate.total_years : (data.career_analysis?.total_years || app.experience_years || 0);
    var seniority = data.career_analysis?.seniority || (totalYrs >= 10 ? 'Senior / Expert' : totalYrs >= 5 ? 'Mid-Level' : totalYrs >= 2 ? 'Junior+' : 'Entry Level');
    var totalSkillsCount = (data.skills?.technical||[]).length + (data.skills?.soft||[]).length;

    var scoreColor = (app.ai_score || 0) >= 80 ? 'var(--accent-success)' : (app.ai_score || 0) >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    var body = `
      <div style="display:flex; gap:20px; margin-bottom:20px; flex-wrap:wrap;">
        <div style="flex:1; min-width:140px; text-align:center; padding:20px; background:var(--bg-tertiary); border-radius:12px; border-top:4px solid ${scoreColor};">
          <div style="font-size:3rem; font-weight:900; color:${scoreColor}; line-height:1;">${app.ai_score||0}%</div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:8px;">نسبة التوافق</div>
          <div style="margin-top:12px; padding:6px; background:rgba(0,0,0,0.1); border-radius:20px; font-weight:600;">
            ${app.ai_verdict === 'accepted' ? '🟢 مرشح قوي' : app.ai_verdict === 'review' ? '🟡 يحتاج مراجعة' : '🔴 غير مناسب'}
          </div>
        </div>
        <div style="flex:2.5; min-width:250px; display:flex; flex-direction:column; justify-content:center;">
          <h2 style="margin:0;" dir="auto">${app.candidate_name}</h2>
          <p style="font-size:1.1rem; color:var(--text-muted); margin:4px 0;" dir="auto">${app.job_title || 'متقدم'}</p>
          <div style="display:flex; gap:16px; margin-top:12px; flex-wrap:wrap;" dir="auto">
            <span>📧 ${app.candidate_email || 'غير متوفر'}</span>
            <span>📱 ${app.candidate_phone || 'غير متوفر'}</span>
            <span>💼 ${totalYrs} سنوات خبرة</span>
          </div>
        </div>
      </div>
      <div class="tabs" style="display:flex; gap:10px; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:8px; overflow-x:auto;">
        <button class="btn btn-ghost active" onclick="switchProfTab(this, 'tab-overview')" style="white-space:nowrap;">📊 نظرة عامة</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-experience')" style="white-space:nowrap;">💼 الخبرات</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-education')" style="white-space:nowrap;">🎓 التعليم والشهادات</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-skills')" style="white-space:nowrap;">⚡ المهارات</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-projects')" style="white-space:nowrap;">🚀 المشاريع</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-ats')" style="white-space:nowrap;">🎯 توافق الوظيفة</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-modify')" style="white-space:nowrap;">✍️ تعديل السيرة</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-recommend')" style="white-space:nowrap;">📚 مقترحات</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-online')" style="white-space:nowrap;">🌐 التواجد الرقمي</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-questions')" style="white-space:nowrap;">❓ أسئلة المقابلة</button>
        <button class="btn btn-ghost" onclick="switchProfTab(this, 'tab-raw')" style="white-space:nowrap;">📄 النص الخام</button>
      </div>

      <div id="tab-overview" class="prof-tab">
        <div class="grid-4" style="margin-bottom:16px;">
          <div class="stat-card" style="padding:10px; text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:var(--accent-primary);">${totalYrs}</div><div style="font-size:0.8rem;">سنوات الخبرة</div></div>
          <div class="stat-card" style="padding:10px; text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:var(--accent-primary);">${seniority}</div><div style="font-size:0.8rem;">المستوى المهني</div></div>
          <div class="stat-card" style="padding:10px; text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:var(--accent-primary);">${data.ats_analysis?.score || app.ai_score || 0}%</div><div style="font-size:0.8rem;">نقاط الـ ATS</div></div>
          <div class="stat-card" style="padding:10px; text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:var(--accent-primary);">${totalSkillsCount}</div><div style="font-size:0.8rem;">إجمالي المهارات</div></div>
        </div>
        
        <div style="padding:16px; background:rgba(99,102,241,0.05); border-radius:8px; border-left:4px solid var(--accent-primary); margin-bottom:16px;">
          <h4 style="margin-top:0;">الملخص المهني (Profile Summary)</h4>
          <p style="margin-bottom:0; line-height:1.6;" dir="auto">${data.summary?.overview || app.ai_analysis || 'لا يوجد ملخص.'}</p>
        </div>
        
        <div class="grid-2">
          <div>
            <h4 style="color:var(--accent-success);">✅ نقاط القوة</h4>
            <ul style="padding-right:20px; margin-top:8px;" dir="auto">
              ${strengths.length>0 ? strengths.map(s=>`<li>${s}</li>`).join('') : '<li>لا توجد نقاط قوة واضحة.</li>'}
            </ul>
          </div>
          <div>
            <h4 style="color:var(--accent-danger);">❌ نقاط الضعف / النواقص</h4>
            <ul style="padding-right:20px; margin-top:8px;" dir="auto">
              ${weaknesses.length>0 ? weaknesses.map(w=>`<li>${w}</li>`).join('') : '<li>لا توجد نواقص رئيسية.</li>'}
            </ul>
          </div>
        </div>
        
        ${(data.recommendations||data.top_5_changes||[]).length > 0 ? `
        <div style="margin-top:16px; padding:12px; background:rgba(16, 185, 129, 0.1); border-radius:8px;">
          <h4 style="margin:0; color:var(--accent-success);">💡 أهم 5 تغييرات فورية مطلوبة</h4>
          <ul style="margin:8px 0 0; padding-right:20px;" dir="auto">
            ${(data.recommendations||data.top_5_changes||[]).map(r=>`<li>${r}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>

      <div id="tab-experience" class="prof-tab" style="display:none;">
        <h4 dir="auto">التاريخ الوظيفي (${(data.experience||[]).length} وظائف)</h4>
        ${(data.experience||[]).map(exp => `
          <div style="margin-bottom:16px; padding:16px; background:var(--bg-tertiary); border-radius:8px;" dir="auto">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
              <strong style="font-size:1.1rem;">${exp.title || 'غير محدد'}</strong>
              <span style="color:var(--text-muted); font-size:0.9rem;">${exp.duration || ''}</span>
            </div>
            <div style="color:var(--accent-primary); margin-bottom:8px;">🏢 ${exp.company || 'غير محدد'}</div>
            ${exp.responsibilities && exp.responsibilities.length ? `
              <div style="font-size:0.9rem; font-weight:600; margin-bottom:4px;">المسؤوليات:</div>
              <ul style="margin:0; padding-right:20px; padding-left:20px; font-size:0.9rem; color:var(--text-secondary);">
                ${(typeof exp.responsibilities === 'string' ? [exp.responsibilities] : exp.responsibilities).map(r=>`<li>${r}</li>`).join('')}
              </ul>
            ` : ''}
            ${exp.achievements && exp.achievements.length ? `
              <div style="font-size:0.9rem; font-weight:600; margin-top:8px; margin-bottom:4px; color:var(--accent-success);">الإنجازات:</div>
              <ul style="margin:0; padding-right:20px; padding-left:20px; font-size:0.9rem; color:var(--text-secondary);">
                ${exp.achievements.map(a=>`<li>${a}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('') || '<div style="text-align:center; padding:20px; color:var(--text-muted);">لم يتم اكتشاف خبرات وظيفية.</div>'}
      </div>

      <div id="tab-education" class="prof-tab" style="display:none;">
        <h4 dir="auto">التعليم الأكاديمي</h4>
        ${(data.education||[]).map(edu => `
          <div style="margin-bottom:16px; padding:12px; background:var(--bg-tertiary); border-radius:8px;" dir="auto">
            <strong>🎓 ${edu.degree || 'غير مكتشف'}</strong>
            <div style="color:var(--text-muted); font-size:0.9rem; margin-top:4px;">${edu.university || 'غير معروف'} ${edu.year ? `(${edu.year})` : ''}</div>
          </div>
        `).join('') || '<div style="text-align:center; padding:20px; color:var(--text-muted);">لم يتم اكتشاف تعليم أكاديمي.</div>'}
        
        <h4 dir="auto" style="margin-top:24px;">الشهادات والدورات</h4>
        ${(data.certifications||[]).length > 0 ? (data.certifications).map(cert => `
          <div style="margin-bottom:8px; padding:10px; background:var(--bg-tertiary); border-radius:8px; display:flex; gap:10px; align-items:center;" dir="auto">
            <span>📜</span>
            <div>
              <div style="font-weight:600;" class="notranslate">${cert.name || cert}</div>
              ${cert.provider ? `<div style="font-size:0.8rem; color:var(--text-muted);">${cert.provider} ${cert.date ? `(${cert.date})` : ''}</div>` : ''}
            </div>
          </div>
        `).join('') : '<div style="text-align:center; padding:20px; color:var(--text-muted);">لم يتم اكتشاف شهادات أو دورات.</div>'}
      </div>

      <div id="tab-skills" class="prof-tab" style="display:none;">
        <h4>المهارات التقنية (${(data.skills?.technical||[]).length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;" dir="auto">
          ${(data.skills?.technical||[]).map(s=>`<span class="badge badge-primary notranslate">${s}</span>`).join('') || '<span class="text-muted">غير مكتشف</span>'}
        </div>
        ${(data.skills?.industry||[]).length > 0 ? `
          <h4>المهارات المهنية/الصناعية (${data.skills.industry.length})</h4>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;" dir="auto">
            ${data.skills.industry.map(s=>`<span class="badge notranslate" style="background:rgba(245,158,11,0.2); color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">${s}</span>`).join('')}
          </div>
        ` : ''}
        <h4>المهارات الشخصية (${(data.skills?.soft||[]).length})</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;" dir="auto">
          ${(data.skills?.soft||[]).map(s=>`<span class="badge badge-info notranslate">${s}</span>`).join('') || '<span class="text-muted">غير مكتشف</span>'}
        </div>
        ${(data.skills?.inferred||[]).length > 0 ? `
          <h4>💡 مهارات مستنتجة بالذكاء الاصطناعي</h4>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;" dir="auto">
            ${data.skills.inferred.map(s=>`<span class="badge notranslate" style="background:rgba(99,102,241,0.2); color:var(--accent-primary); border:1px dashed var(--accent-primary);">${s}</span>`).join('')}
          </div>
        ` : ''}
        <h4>اللغات</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;" dir="auto">
          ${(data.languages||[]).length > 0 ? data.languages.map(l=>`<span class="badge badge-success notranslate">${typeof l === 'string' ? l : (l.name + (l.level ? ' - '+l.level : ''))}</span>`).join('') : '<span class="text-muted">غير محدد</span>'}
        </div>
      </div>
      
      <div id="tab-projects" class="prof-tab" style="display:none;">
        <h4 dir="auto">المشاريع والأعمال</h4>
        ${(data.projects||[]).length > 0 ? data.projects.map(p => `
          <div style="margin-bottom:16px; padding:16px; background:var(--bg-tertiary); border-radius:8px; border-left:4px solid var(--accent-warning);" dir="auto">
            <div style="font-weight:bold; font-size:1.1rem; margin-bottom:8px;">🚀 ${p.name || 'مشروع'}</div>
            ${p.role ? `<div style="font-size:0.9rem; margin-bottom:8px;"><strong>الدور:</strong> ${p.role}</div>` : ''}
            ${p.description ? `<p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.5;">${p.description}</p>` : ''}
            ${p.tech_stack && p.tech_stack.length ? `
              <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;">
                ${p.tech_stack.map(t=>`<span class="badge notranslate" style="font-size:0.75rem; background:rgba(0,0,0,0.2);">${t}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('') : `
        <div style="padding:20px; background:var(--bg-tertiary); border-radius:8px; text-align:center;" dir="auto">
          <p style="color:var(--text-muted); margin-bottom:12px;">لم يتم العثور على مشاريع مفصلة في السيرة الذاتية.</p>
          ${(data.projects_recommendation||[]).length > 0 ? '<h4 style="margin-top:0;">💡 مشاريع مقترحة للمرشح:</h4>' + data.projects_recommendation.map(pr => '<div style="text-align:start; margin-bottom:8px; padding:10px; background:rgba(99,102,241,0.1); border-radius:8px;"><strong>'+pr.name+'</strong><br><span style="font-size:0.9rem; color:var(--text-muted);">'+pr.idea+'</span>'+(pr.tech_stack&&pr.tech_stack.length ? '<br><span style="font-size:0.8rem;">Stack: '+pr.tech_stack.join(', ')+'</span>' : '')+'</div>').join('') : ''}
        </div>`}
      </div>
      
      <div id="tab-ats" class="prof-tab" style="display:none;">
        <div class="grid-2" style="margin-bottom:20px;">
          <div style="padding:20px; background:var(--bg-tertiary); border-radius:12px; text-align:center;">
            <div style="font-size:0.9rem; color:var(--text-muted);">توافق الـ ATS</div>
            <div style="font-size:2.5rem; font-weight:900; color:var(--accent-primary);">${data.ats_analysis?.score || Math.round(app.ai_score * 0.9) || 0}%</div>
          </div>
          <div style="padding:20px; background:var(--bg-tertiary); border-radius:12px; text-align:center;">
            <div style="font-size:0.9rem; color:var(--text-muted);">توافق الوظيفة</div>
            <div style="font-size:2.5rem; font-weight:900; color:var(--accent-success);">${data.job_match?.match_percentage || app.ai_score || 0}%</div>
          </div>
        </div>
        
        <h4 style="color:var(--accent-success);">✅ لماذا هذا المرشح مناسب:</h4>
        <p dir="auto" style="font-size:0.95rem; line-height:1.6;">${data.job_match?.why_matches || strengths[0] || 'ملف شخصي جيد بشكل عام.'}</p>
        
        <h4 style="color:var(--accent-danger); margin-top:16px;">❌ لماذا قد لا يكون مناسباً:</h4>
        <p dir="auto" style="font-size:0.95rem; line-height:1.6;">${data.job_match?.why_not || weaknesses[0] || 'لا توجد مشاكل ملحوظة.'}</p>
        
        <h4 style="margin-top:16px;">🔍 الكلمات المفتاحية / المتطلبات المفقودة</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;" dir="auto">
          ${missing.length > 0 ? missing.map(s=>`<span class="badge badge-danger">${s}</span>`).join('') : '<span class="badge badge-success">لا يوجد كلمات مفتاحية مفقودة!</span>'}
        </div>
        
        ${(data.missing_information||flags).length > 0 ? `
          <h4 style="margin-top:16px;">⚠️ معلومات مفقودة في السيرة الذاتية</h4>
          <ul style="padding-left:20px; font-size:0.9rem; color:var(--text-secondary);" dir="auto">
            ${(data.missing_information||flags).map(f=>`<li>${f}</li>`).join('')}
          </ul>
        ` : ''}
      </div>

      <div id="tab-modify" class="prof-tab" style="display:none;">
        <h4 style="color:var(--accent-danger);">🗑️ ما يجب حذفه (What to Remove)</h4>
        ${(data.what_to_remove||[]).length > 0 ? data.what_to_remove.map(r => `
          <div style="background:var(--bg-tertiary); padding:10px; margin-bottom:8px; border-radius:8px; border-left:3px solid var(--accent-danger);">
            <strong>${r.item}</strong> (Priority: ${r.priority})<br>
            <span style="font-size:0.85rem; color:var(--text-muted);">${r.why}</span>
          </div>
        `).join('') : '<div class="text-muted">لا يوجد عناصر مقترحة للحذف.</div>'}

        <h4 style="color:var(--accent-success); margin-top:20px;">➕ ما يجب إضافته (What to Add)</h4>
        ${(data.what_to_add||[]).length > 0 ? data.what_to_add.map(a => `
          <div style="background:var(--bg-tertiary); padding:10px; margin-bottom:8px; border-radius:8px; border-left:3px solid var(--accent-success);">
            <strong>${a.item}</strong> (Priority: ${a.priority})
          </div>
        `).join('') : '<div class="text-muted">لا توجد إضافات محددة مقترحة.</div>'}

        <h4 style="color:var(--accent-warning); margin-top:20px;">✍️ ما يجب إعادة صياغته (What to Rewrite)</h4>
        ${(data.what_to_rewrite||[]).length > 0 ? data.what_to_rewrite.map(w => `
          <div style="background:var(--bg-tertiary); padding:10px; margin-bottom:8px; border-radius:8px; border-left:3px solid var(--accent-warning);">
            <div style="font-size:0.85rem; color:var(--accent-danger); text-decoration:line-through; margin-bottom:4px;">${w.current}</div>
            <div style="font-size:0.85rem; color:var(--accent-success); margin-bottom:4px;">✅ ${w.improved}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">السبب: ${w.problem}</div>
          </div>
        `).join('') : '<div class="text-muted">لا توجد أجزاء تحتاج إعادة صياغة.</div>'}
      </div>

      <div id="tab-recommend" class="prof-tab" style="display:none;">
        <h4>📚 الكورسات المقترحة (Recommended Courses)</h4>
        ${(data.courses_recommendation||[]).length > 0 ? data.courses_recommendation.map(c => `
          <div style="background:var(--bg-tertiary); padding:10px; margin-bottom:8px; border-radius:8px; border-left:3px solid var(--accent-info);">
            <strong>${c.name}</strong> <span class="badge" style="font-size:0.7rem;">${c.priority || ''}</span><br>
            <span style="font-size:0.85rem; color:var(--text-muted);">${c.why} (Target Skill: ${c.skill})</span>
          </div>
        `).join('') : '<div class="text-muted">لا توجد كورسات مقترحة.</div>'}

        <h4 style="margin-top:20px;">📅 خطة 30/60/90 يوم للتطوير</h4>
        <div class="grid-3" style="gap:10px;">
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
            <strong style="color:var(--accent-primary);">خلال 30 يوماً</strong>
            <ul style="padding-left:16px; margin:4px 0 0; font-size:0.85rem;" dir="auto">
              ${(data.plan_30_60_90?.['30_days']||[]).map(t=>`<li>${t}</li>`).join('')||'<li>لا يوجد</li>'}
            </ul>
          </div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
            <strong style="color:var(--accent-warning);">خلال 60 يوماً</strong>
            <ul style="padding-left:16px; margin:4px 0 0; font-size:0.85rem;" dir="auto">
              ${(data.plan_30_60_90?.['60_days']||[]).map(t=>`<li>${t}</li>`).join('')||'<li>لا يوجد</li>'}
            </ul>
          </div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">
            <strong style="color:var(--accent-success);">خلال 90 يوماً</strong>
            <ul style="padding-left:16px; margin:4px 0 0; font-size:0.85rem;" dir="auto">
              ${(data.plan_30_60_90?.['90_days']||[]).map(t=>`<li>${t}</li>`).join('')||'<li>لا يوجد</li>'}
            </ul>
          </div>
        </div>
      </div>

      <div id="tab-online" class="prof-tab" style="display:none;">
        <h4>🐙 تحليل حساب GitHub</h4>
        <div style="background:var(--bg-tertiary); padding:12px; border-radius:8px; margin-bottom:16px;">
          <strong>الحالة:</strong> ${data.github_analysis?.status || 'Unknown'}<br>
          <ul style="margin:8px 0 0; padding-left:20px; font-size:0.9rem;" dir="auto">
            ${(data.github_analysis?.recommendations||[]).map(r=>`<li>${r}</li>`).join('') || '<li>لا توجد نصائح بخصوص GitHub.</li>'}
          </ul>
        </div>
        
        <h4>💼 تحليل حساب LinkedIn</h4>
        <div style="background:var(--bg-tertiary); padding:12px; border-radius:8px;">
          <strong>الحالة:</strong> ${data.linkedin_analysis?.status || 'Unknown'}<br>
          <ul style="margin:8px 0 0; padding-left:20px; font-size:0.9rem;" dir="auto">
            ${(data.linkedin_analysis?.recommendations||[]).map(r=>`<li>${r}</li>`).join('') || '<li>لا توجد نصائح بخصوص LinkedIn.</li>'}
          </ul>
        </div>
      </div>

      <div id="tab-questions" class="prof-tab" style="display:none;">
        <p class="text-muted">أسئلة مقابلة مقترحة بناءً على تحليل الذكاء الاصطناعي للسيرة الذاتية.</p>
        <h4>أسئلة تقنية (Technical)</h4>
        <ul dir="auto" style="padding-right: 20px; padding-left: 20px;">
          ${(iq.technical||[]).map(q=>`<li>${q}</li>`).join('') || '<li>لا توجد أسئلة تقنية مقترحة.</li>'}
        </ul>
        <h4>أسئلة موارد بشرية (HR / Behavioral)</h4>
        <ul dir="auto" style="padding-right: 20px; padding-left: 20px;">
          ${(iq.hr||[]).map(q=>`<li>${q}</li>`).join('') || '<li>لا توجد أسئلة موارد بشرية.</li>'}
        </ul>
      </div>

      <div id="tab-raw" class="prof-tab" style="display:none;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 dir="auto" style="margin:0;">📋 محتوى السيرة الذاتية</h4>
          <button class="btn btn-outline" style="padding:4px 12px; font-size:0.85rem;" onclick="document.getElementById('raw-ar').style.display = document.getElementById('raw-ar').style.display === 'none' ? 'block' : 'none'; document.getElementById('raw-en').style.display = document.getElementById('raw-en').style.display === 'none' ? 'block' : 'none';">
            🌐 تبديل اللغة (عربي/English)
          </button>
        </div>
        
        <div id="raw-ar" dir="auto" style="background:var(--bg-tertiary); padding:16px; border-radius:8px; max-height:450px; overflow:auto; text-align:start; display:block;">
          <ul style="list-style:disc; margin:0; padding: 0 20px;">
            ${(data.full_cv_arabic_translation_points||[]).length > 0 ? data.full_cv_arabic_translation_points.map(function(l){return '<li style="margin-bottom:6px;">'+l+'</li>';}).join('') : '<li>لم يتم استخراج نص مترجم (استخدم زر تبديل اللغة لعرض النص الأصلي).</li>'}
          </ul>
        </div>

        <div id="raw-en" dir="ltr" style="background:var(--bg-tertiary); padding:16px; border-radius:8px; max-height:450px; overflow:auto; text-align:left; display:none;">
          <ul style="list-style:disc; margin:0; padding: 0 20px;">
            ${app.cv_text ? app.cv_text.split('\n').filter(l=>l.trim().length>3).map(l=>'<li style="margin-bottom:6px;">'+l.trim()+'</li>').join('') : '<li>لا يوجد نص خام متاح.</li>'}
          </ul>
        </div>
      </div>
    `;

    var footer = `
      <div style="display:flex; justify-content:space-between; width:100%; flex-wrap:wrap; gap:8px;">
        <div>
          <button class="btn btn-outline" onclick="App.closeModal()">إغلاق</button>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <select id="prof-action-status" class="form-input" style="width:auto; padding:4px 8px;">
            <option value="screening" ${app.status==='screening'?'selected':''}>فرز أولي</option>
            <option value="shortlisted" ${app.status==='shortlisted'?'selected':''}>قائمة مختصرة</option>
            <option value="interview" ${app.status==='interview'?'selected':''}>مقابلة</option>
            <option value="hired" ${app.status==='hired'?'selected':''}>تم التعيين</option>
            <option value="rejected" ${app.status==='rejected'?'selected':''}>مرفوض</option>
          </select>
          <button class="btn btn-primary" onclick="window.atsUpdateAppStatus('${app.id}')">حفظ الحالة</button>
          <button class="btn btn-success" onclick="window.atsConvertToEmp('${app.id}')">تحويل لموظف</button>
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
      showToast('تم تحديث الحالة بنجاح', 'success');
      var app = state.applications.find(a => a.id === id);
      if(app) app.status = newStatus;
      if (typeof App !== 'undefined' && App.closeModal) App.closeModal();
      if (state.currentView === 'upload') {
        state.currentView = 'apps';
        state.viewMode = 'kanban';
      }
      render();
    });
  };

  window.atsSetViewMode = function(mode) {
    state.viewMode = mode;
    render();
  };

  window.atsViewProfile = function(id) {
    showCandidateProfile(id);
  };

  window.atsConvertToEmp = function(id) {
    var app = state.applications.find(a => a.id === id);
    if (!app) return;
    if (!confirm('تأكيد تحويل هذا المرشح إلى موظف؟ سيتم فتح نموذج الإضافة ببياناته.')) return;
    
    // Update status to hired
    sbClient.from('ats_applications').update({status: 'hired'}).eq('id', id).then(r => {
       if(!r.error) {
          app.status = 'hired';
          render();
       }
    });

    App.closeModal();
    showToast('تم حفظ بيانات المرشح. جاري تحويلك لصفحة الإضافة...', 'info');
    localStorage.setItem('hr_prefill_emp', JSON.stringify({
      full_name: app.candidate_name,
      email: app.candidate_email,
      phone: app.candidate_phone,
      job_title: app.job_title
    }));
    
    // Auto-navigate and open modal
    setTimeout(function() {
      if (window.App && window.App.nav) {
        window.App.nav('hr');
        setTimeout(function() {
          var addBtn = document.getElementById('add-emp-btn');
          if (addBtn) addBtn.click();
        }, 300);
      }
    }, 500);
  };

  loadData();
};
