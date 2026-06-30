// ===== HR ATS - AI-Powered Applicant Tracking System =====
window.Pages = window.Pages || {};

Pages.hrATS = function(el) {
  if (!App.isHR()) { el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied</h2></div>'; return; }

  var applications = [];
  var activeTab = 'applications';

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span> Loading ATS...</div>';
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

    var html = '<div style="margin-bottom:20px"><h3 style="margin:0">🤖 AI-Powered Applicant Tracking System (نظام تتبع المتقدمين)</h3><p style="color:var(--text-muted)">Upload CVs and let AI analyze candidate suitability</p></div>';

    html += '<div class="stats-grid">';
    html += _statCard('#f59e0b','clock',pending,'Pending');
    html += _statCard('#6366f1','search',screening,'Screening');
    html += _statCard('#3b82f6','users',interview,'Interview');
    html += _statCard('#22c55e','userCheck',hired,'Hired');
    html += _statCard('#ef4444','xCircle',rejected,'Rejected');
    html += '</div>';

    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:16px">';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn btn-outline" id="ats-tab-apps" style="border-color:var(--accent-primary);color:var(--accent-primary)">📋 Applications</button>';
    html += '<button class="btn btn-ghost" id="ats-tab-add">➕ Add Candidate</button>';
    html += '</div>';
    html += '<select class="filter-select" id="ats-filter"><option value="">All Status</option><option value="pending">Pending</option><option value="screening">Screening</option><option value="interview">Interview</option><option value="offered">Offered</option><option value="hired">Hired</option><option value="rejected">Rejected</option></select>';
    html += '</div>';

    // Applications Table
    html += '<div id="ats-view-apps">';
    html += '<div class="card"><div class="card-header"><h3>All Applications (' + applications.length + ')</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr>';
    html += '<th>Candidate</th><th>Position</th><th>Department</th><th>AI Score</th><th>AI Verdict</th><th>Status</th><th>Date</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    var filtered = applications;
    filtered.forEach(function(app) {
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
      html += '<button class="btn btn-xs btn-outline" onclick="window.atsViewApp(\'' + app.id + '\')">View</button>';
      if (app.status !== 'hired' && app.status !== 'rejected') {
        html += '<button class="btn btn-xs btn-success" onclick="window.atsUpdateStatus(\'' + app.id + '\',\'next\')">▶</button>';
        html += '<button class="btn btn-xs btn-danger" onclick="window.atsUpdateStatus(\'' + app.id + '\',\'rejected\')">✕</button>';
      }
      html += '</div></td></tr>';
    });
    if (filtered.length === 0) html += '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No applications yet</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Add Candidate Form
    html += '<div id="ats-view-add" style="display:none">';
    html += '<div class="card"><div class="card-header"><h3>➕ Add New Candidate</h3></div><div class="card-body">';
    html += '<div class="grid-2">';
    html += '<div class="form-field"><label>Candidate Name *</label><input type="text" id="ats-name" class="form-input" placeholder="Full name"></div>';
    html += '<div class="form-field"><label>Job Title *</label><input type="text" id="ats-job" class="form-input" placeholder="e.g. Production Engineer"></div>';
    html += '<div class="form-field"><label>Email</label><input type="email" id="ats-email" class="form-input"></div>';
    html += '<div class="form-field"><label>Phone</label><input type="text" id="ats-phone" class="form-input"></div>';
    html += '<div class="form-field"><label>Department</label><select id="ats-dept" class="form-input"><option value="">Select</option>';
    if (typeof DEPARTMENTS !== 'undefined') DEPARTMENTS.forEach(function(d) { html += '<option>' + d + '</option>'; });
    html += '</select></div>';
    html += '<div class="form-field"><label>Years of Experience</label><input type="number" id="ats-exp" class="form-input" min="0" step="0.5"></div>';
    html += '</div>';
    html += '<div class="form-field"><label>CV / Resume Text * (Paste CV content here)</label><textarea id="ats-cv" class="form-input" rows="8" placeholder="Paste the full CV text here for AI analysis..."></textarea></div>';
    html += '<div class="form-field"><label>Required Skills (comma separated)</label><input type="text" id="ats-skills" class="form-input" placeholder="e.g. AutoCAD, Excel, Leadership"></div>';
    html += '<div style="margin-top:16px;display:flex;gap:10px"><button class="btn btn-primary" id="ats-analyze">🤖 Analyze with AI & Save</button><button class="btn btn-outline" id="ats-save-only">💾 Save Without AI</button></div>';
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
        if (statusCell && statusCell.textContent.trim().toLowerCase().indexOf(val) !== -1) row.style.display = '';
        else row.style.display = 'none';
      });
    });

    // AI Analyze
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

    if (!name || !job) return alert('Please fill candidate name and job title');

    var record = {
      candidate_name: name,
      job_title: job,
      candidate_email: email,
      candidate_phone: phone,
      department: dept,
      experience_years: exp,
      cv_text: cvText,
      status: 'pending'
    };

    if (useAI && cvText) {
      // AI Analysis
      var score = 0;
      var matched = [];
      var missing = [];
      var cvLower = cvText.toLowerCase();

      // Score based on required skills
      if (reqSkills) {
        var skills = reqSkills.split(',').map(function(s) { return s.trim(); });
        skills.forEach(function(skill) {
          if (cvLower.indexOf(skill.toLowerCase()) !== -1) {
            matched.push(skill);
            score += Math.round(60 / skills.length);
          } else {
            missing.push(skill);
          }
        });
      } else {
        score += 30; // No specific skills required
      }

      // Score based on experience
      if (exp >= 5) score += 20;
      else if (exp >= 3) score += 15;
      else if (exp >= 1) score += 10;
      else score += 5;

      // Score based on CV length/detail
      if (cvText.length > 1000) score += 10;
      else if (cvText.length > 500) score += 5;

      // Bonus for education keywords
      var eduKeywords = ['bachelor','master','phd','engineering','university','degree','بكالوريوس','ماجستير','هندسة','جامعة'];
      eduKeywords.forEach(function(k) { if (cvLower.indexOf(k) !== -1) score += 2; });

      score = Math.min(score, 100);

      var verdict = score >= 70 ? 'accepted' : score >= 40 ? 'review' : 'rejected';
      var analysis = 'AI Score: ' + score + '% | Skills matched: ' + matched.join(', ') + ' | Missing: ' + missing.join(', ') + ' | Experience: ' + exp + ' years';

      record.ai_score = score;
      record.ai_verdict = verdict;
      record.ai_analysis = analysis;
      record.skills_matched = matched.join(', ');
      record.skills_missing = missing.join(', ');
      record.status = 'screening';
    }

    sbClient.from('ats_applications').insert([record]).then(function(r) {
      if (r.error) return alert('Error: ' + r.error.message);
      showToast('✅ Candidate added' + (useAI ? ' with AI analysis!' : '!'), 'success');
      loadData();
    });
  }

  // View application details
  window.atsViewApp = function(id) {
    var app = applications.find(function(a) { return a.id === id; });
    if (!app) return;

    var scoreColor = (app.ai_score || 0) >= 70 ? 'var(--accent-success)' : (app.ai_score || 0) >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    var body = '<div style="display:flex;gap:20px;margin-bottom:16px">';
    body += '<div style="flex:1;padding:16px;background:var(--bg-tertiary);border-radius:12px;text-align:center">';
    body += '<div style="font-size:2.5rem;font-weight:900;color:' + scoreColor + '">' + (app.ai_score || '—') + '%</div>';
    body += '<div style="color:var(--text-muted);font-size:0.8rem">AI Score</div>';
    body += '</div>';
    body += '<div style="flex:2">';
    body += '<h4 style="margin:0">' + app.candidate_name + '</h4>';
    body += '<p style="color:var(--text-muted);margin:4px 0">' + app.job_title + ' | ' + (app.department || '-') + '</p>';
    body += '<p style="margin:4px 0">' + (app.candidate_email || '') + ' | ' + (app.candidate_phone || '') + '</p>';
    body += '<p>Experience: ' + (app.experience_years || 0) + ' years</p>';
    body += '</div></div>';

    if (app.ai_analysis) {
      body += '<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;margin-bottom:12px;border-left:4px solid ' + scoreColor + '">';
      body += '<b>🤖 AI Analysis:</b><br>' + app.ai_analysis;
      body += '</div>';
    }
    if (app.skills_matched) body += '<p><b style="color:var(--accent-success)">✅ Skills Matched:</b> ' + app.skills_matched + '</p>';
    if (app.skills_missing) body += '<p><b style="color:var(--accent-danger)">❌ Skills Missing:</b> ' + app.skills_missing + '</p>';
    if (app.cv_text) body += '<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">📄 View CV Text</summary><pre style="white-space:pre-wrap;max-height:200px;overflow:auto;padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:0.8rem;margin-top:8px">' + app.cv_text + '</pre></details>';

    body += '<div class="form-field" style="margin-top:12px"><label>HR Notes</label><textarea id="ats-notes" class="form-input" rows="2">' + (app.notes || '') + '</textarea></div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Close</button>';
    if (app.status !== 'hired' && app.status !== 'rejected') {
      footer += ' <button class="btn btn-success" onclick="window.atsUpdateStatus(\'' + id + '\',\'next\');App.closeModal()">▶ Next Stage</button>';
      footer += ' <button class="btn btn-danger" onclick="window.atsUpdateStatus(\'' + id + '\',\'rejected\');App.closeModal()">✕ Reject</button>';
    }
    App.showModal('📋 Application Details', body, footer, true);
  };

  window.atsUpdateStatus = function(id, action) {
    var app = applications.find(function(a) { return a.id === id; });
    if (!app) return;
    var flow = ['pending','screening','interview','offered','hired'];
    var newStatus;
    if (action === 'rejected') {
      newStatus = 'rejected';
    } else {
      var idx = flow.indexOf(app.status);
      newStatus = (idx >= 0 && idx < flow.length - 1) ? flow[idx + 1] : app.status;
    }
    sbClient.from('ats_applications').update({ status: newStatus, reviewed_by: App.user.id, reviewed_by_name: App.user.full_name }).eq('id', id).then(function(r) {
      if (r.error) return alert(r.error.message);
      showToast('Status → ' + newStatus, newStatus === 'rejected' ? 'danger' : 'success');
      loadData();
    });
  };

  loadData();
};
