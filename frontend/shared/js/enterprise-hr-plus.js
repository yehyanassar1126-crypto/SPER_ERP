// ===== ENTERPRISE HR+: Performance, Training, Assets, Warnings =====
window.Pages = window.Pages || {};

// ==========================================
// PERFORMANCE REVIEWS
// ==========================================
Pages.performanceReviews = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('performance_reviews').select('*').order('created_at', {ascending: false}).then(function(res) {
    var reviews = res.data || [];
    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>⭐ Performance Reviews (تقييم الأداء)</h3>';
    if (App.isHR() || App.isOwner()) html += '<button class="btn btn-primary" onclick="newReviewModal()">' + icon('plus') + ' New Review</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Overall</th><th>Status</th><th>Reviewer</th><th>Actions</th></tr></thead><tbody>';
    if (reviews.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No reviews yet</td></tr>';
    } else {
      reviews.forEach(function(r) {
        var stars = '';
        for (var i = 0; i < 5; i++) stars += i < (r.overall_rating || 0) ? '⭐' : '☆';
        var sColor = r.status === 'acknowledged' ? 'success' : r.status === 'reviewed' ? 'info' : r.status === 'submitted' ? 'warning' : 'secondary';
        html += '<tr><td style="font-weight:600">' + (r.employee_name || '-') + '</td>';
        html += '<td>' + r.review_period + '</td>';
        html += '<td>' + stars + '</td>';
        html += '<td><span class="badge badge-' + sColor + '">' + r.status + '</span></td>';
        html += '<td>' + (r.reviewer_name || '-') + '</td>';
        html += '<td><button class="btn btn-xs btn-outline" onclick="viewReview(\'' + r.id + '\')">View</button></td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.newReviewModal = function() {
      sbClient.from('users').select('id,full_name').eq('status','active').then(function(res) {
        var emps = res.data || [];
        var body = '<div class="form-row"><div class="form-field"><label>Employee *</label><select id="rv-emp" class="form-input">';
        emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '">' + e.full_name + '</option>'; });
        body += '</select></div><div class="form-field"><label>Period *</label><input type="text" id="rv-period" class="form-input" placeholder="Q2 2026" value="Q2 2026"></div></div>';
        var cats = ['attendance','quality','teamwork','initiative','communication'];
        cats.forEach(function(c) {
          body += '<div class="form-field"><label>' + c.charAt(0).toUpperCase() + c.slice(1) + ' (1-5)</label><select id="rv-' + c + '" class="form-input"><option value="3">3</option><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="5">5</option></select></div>';
        });
        body += '<div class="form-field"><label>Strengths</label><textarea id="rv-str" class="form-input" rows="2"></textarea></div>';
        body += '<div class="form-field"><label>Areas for Improvement</label><textarea id="rv-imp" class="form-input" rows="2"></textarea></div>';
        var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-rv-btn">Submit Review</button>';
        App.showModal('New Performance Review', body, footer, true);
        document.getElementById('save-rv-btn').addEventListener('click', function() {
          var empVal = document.getElementById('rv-emp').value.split('|');
          var scores = cats.map(function(c) { return parseInt(document.getElementById('rv-' + c).value); });
          var avg = Math.round(scores.reduce(function(a,b){return a+b;},0) / scores.length);
          sbClient.from('performance_reviews').insert({
            employee_id: empVal[0], employee_name: empVal[1],
            reviewer_id: App.user.id, reviewer_name: App.user.full_name,
            review_period: document.getElementById('rv-period').value,
            attendance_score: scores[0], quality_score: scores[1], teamwork_score: scores[2],
            initiative_score: scores[3], communication_score: scores[4],
            overall_rating: avg, strengths: document.getElementById('rv-str').value,
            improvements: document.getElementById('rv-imp').value, status: 'submitted'
          }).then(function(r) {
            if (r.error) { alert(r.error.message); return; }
            App.closeModal(); Pages.performanceReviews(el); showToast('Review submitted', 'success');
          });
        });
      });
    };
    window.viewReview = function(id) {
      var r = reviews.find(function(x) { return x.id === id; });
      if (!r) return;
      var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
      body += '<div><strong>Employee:</strong> ' + (r.employee_name || '-') + '</div>';
      body += '<div><strong>Period:</strong> ' + r.review_period + '</div>';
      body += '<div><strong>Attendance:</strong> ' + '⭐'.repeat(r.attendance_score || 0) + '</div>';
      body += '<div><strong>Quality:</strong> ' + '⭐'.repeat(r.quality_score || 0) + '</div>';
      body += '<div><strong>Teamwork:</strong> ' + '⭐'.repeat(r.teamwork_score || 0) + '</div>';
      body += '<div><strong>Initiative:</strong> ' + '⭐'.repeat(r.initiative_score || 0) + '</div>';
      body += '<div><strong>Communication:</strong> ' + '⭐'.repeat(r.communication_score || 0) + '</div>';
      body += '<div><strong>Overall:</strong> ' + '⭐'.repeat(r.overall_rating || 0) + '</div>';
      body += '</div>';
      if (r.strengths) body += '<div style="margin-top:12px"><strong>Strengths:</strong><p>' + r.strengths + '</p></div>';
      if (r.improvements) body += '<div style="margin-top:8px"><strong>Improvements:</strong><p>' + r.improvements + '</p></div>';
      App.showModal('Performance Review - ' + r.employee_name, body, '<button class="btn btn-outline" onclick="App.closeModal()">Close</button>');
    };
  });
};

// ==========================================
// TRAINING & DEVELOPMENT
// ==========================================
Pages.training = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  Promise.all([
    sbClient.from('training_courses').select('*').order('created_at', {ascending: false}),
    sbClient.from('training_enrollments').select('*')
  ]).then(function(results) {
    var courses = results[0].data || [];
    var enrollments = results[1].data || [];

    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>🎓 Training & Development (التدريب والتطوير)</h3>';
    if (App.isHR() || App.isOwner()) html += '<button class="btn btn-primary" onclick="newCourseModal()">' + icon('plus') + ' New Course</button>';
    html += '</div>';

    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #6366f1"><div style="font-size:1.5rem;margin-bottom:8px">📚</div><div style="font-size:1.6rem;font-weight:800">' + courses.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Total Courses</div></div>';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #22c55e"><div style="font-size:1.5rem;margin-bottom:8px">✅</div><div style="font-size:1.6rem;font-weight:800">' + courses.filter(function(c){return c.status==='completed';}).length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Completed</div></div>';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #f59e0b"><div style="font-size:1.5rem;margin-bottom:8px">👥</div><div style="font-size:1.6rem;font-weight:800">' + enrollments.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Total Enrollments</div></div>';
    html += '</div>';

    html += '<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Course</th><th>Type</th><th>Trainer</th><th>Date</th><th>Status</th><th>Enrolled</th></tr></thead><tbody>';
    if (courses.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No courses yet</td></tr>';
    } else {
      courses.forEach(function(c) {
        var enrolled = enrollments.filter(function(e) { return e.course_id === c.id; }).length;
        var sColor = c.status === 'completed' ? 'success' : c.status === 'ongoing' ? 'warning' : c.status === 'cancelled' ? 'danger' : 'info';
        html += '<tr><td style="font-weight:600">' + c.title + '</td>';
        html += '<td><span class="badge badge-info">' + c.course_type + '</span></td>';
        html += '<td>' + (c.trainer || '-') + '</td>';
        html += '<td>' + (c.start_date ? formatDate(c.start_date) : '-') + '</td>';
        html += '<td><span class="badge badge-' + sColor + '">' + c.status + '</span></td>';
        html += '<td>' + enrolled + '/' + (c.max_participants || 20) + '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.newCourseModal = function() {
      var body = '<div class="form-field"><label>Course Title *</label><input type="text" id="cr-title" class="form-input"></div>';
      body += '<div class="form-row"><div class="form-field"><label>Type</label><select id="cr-type" class="form-input"><option value="internal">Internal</option><option value="external">External</option><option value="online">Online</option></select></div>';
      body += '<div class="form-field"><label>Trainer</label><input type="text" id="cr-trainer" class="form-input"></div></div>';
      body += '<div class="form-row"><div class="form-field"><label>Start Date</label><input type="date" id="cr-start" class="form-input"></div>';
      body += '<div class="form-field"><label>End Date</label><input type="date" id="cr-end" class="form-input"></div></div>';
      body += '<div class="form-field"><label>Max Participants</label><input type="number" id="cr-max" class="form-input" value="20"></div>';
      body += '<div class="form-field"><label>Description</label><textarea id="cr-desc" class="form-input" rows="2"></textarea></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-cr-btn">Create Course</button>';
      App.showModal('New Training Course', body, footer);
      document.getElementById('save-cr-btn').addEventListener('click', function() {
        var title = document.getElementById('cr-title').value;
        if (!title) { alert('Title required'); return; }
        sbClient.from('training_courses').insert({
          title: title, course_type: document.getElementById('cr-type').value,
          trainer: document.getElementById('cr-trainer').value,
          start_date: document.getElementById('cr-start').value || null,
          end_date: document.getElementById('cr-end').value || null,
          max_participants: parseInt(document.getElementById('cr-max').value) || 20,
          description: document.getElementById('cr-desc').value,
          created_by: App.user.id
        }).then(function(r) {
          if (r.error) { alert(r.error.message); return; }
          App.closeModal(); Pages.training(el); showToast('Course created', 'success');
        });
      });
    };
  });
};

// ==========================================
// ASSET ASSIGNMENT
// ==========================================
Pages.assetAssignment = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('asset_assignments').select('*').order('created_at', {ascending: false}).then(function(res) {
    var assets = res.data || [];
    var assigned = assets.filter(function(a) { return a.status === 'assigned'; });

    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>💻 Asset Assignment (تسليم العهد)</h3>';
    html += '<button class="btn btn-primary" onclick="newAssetModal()">' + icon('plus') + ' Assign Asset</button></div>';

    html += '<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Asset</th><th>Type</th><th>Serial</th><th>Assigned To</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    if (assets.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No assets assigned yet</td></tr>';
    } else {
      assets.forEach(function(a) {
        var sColor = a.status === 'assigned' ? 'warning' : a.status === 'returned' ? 'success' : 'danger';
        html += '<tr><td style="font-weight:600">' + a.asset_name + '</td>';
        html += '<td><span class="badge badge-info">' + (a.asset_type || '-') + '</span></td>';
        html += '<td>' + (a.serial_number || '-') + '</td>';
        html += '<td>' + (a.assigned_to_name || '-') + '</td>';
        html += '<td>' + formatDate(a.assigned_date) + '</td>';
        html += '<td><span class="badge badge-' + sColor + '">' + a.status + '</span></td>';
        html += '<td>';
        if (a.status === 'assigned') html += '<button class="btn btn-xs btn-outline" onclick="returnAsset(\'' + a.id + '\')">Return</button>';
        html += '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.newAssetModal = function() {
      sbClient.from('users').select('id,full_name').eq('status','active').then(function(res) {
        var emps = res.data || [];
        var body = '<div class="form-field"><label>Asset Name *</label><input type="text" id="ast-name" class="form-input" placeholder="MacBook Pro 14"></div>';
        body += '<div class="form-row"><div class="form-field"><label>Type</label><select id="ast-type" class="form-input"><option value="laptop">Laptop</option><option value="phone">Phone</option><option value="tablet">Tablet</option><option value="key">Key</option><option value="uniform">Uniform</option><option value="tool">Tool</option><option value="vehicle">Vehicle</option><option value="other">Other</option></select></div>';
        body += '<div class="form-field"><label>Serial Number</label><input type="text" id="ast-serial" class="form-input"></div></div>';
        body += '<div class="form-field"><label>Assign To *</label><select id="ast-emp" class="form-input">';
        emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '">' + e.full_name + '</option>'; });
        body += '</select></div>';
        var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-ast-btn">Assign</button>';
        App.showModal('Assign Asset', body, footer);
        document.getElementById('save-ast-btn').addEventListener('click', function() {
          var name = document.getElementById('ast-name').value;
          if (!name) { alert('Asset name required'); return; }
          var empVal = document.getElementById('ast-emp').value.split('|');
          sbClient.from('asset_assignments').insert({
            asset_name: name, asset_type: document.getElementById('ast-type').value,
            serial_number: document.getElementById('ast-serial').value,
            assigned_to: empVal[0], assigned_to_name: empVal[1],
            assigned_by: App.user.id
          }).then(function(r) {
            if (r.error) { alert(r.error.message); return; }
            App.closeModal(); Pages.assetAssignment(el); showToast('Asset assigned', 'success');
          });
        });
      });
    };
    window.returnAsset = function(id) {
      sbClient.from('asset_assignments').update({ status: 'returned', return_date: new Date().toISOString().slice(0,10) }).eq('id', id).then(function(r) {
        if (r.error) { alert(r.error.message); return; }
        Pages.assetAssignment(el); showToast('Asset returned', 'success');
      });
    };
  });
};

// ==========================================
// EMPLOYEE WARNINGS
// ==========================================
Pages.employeeWarnings = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('employee_warnings').select('*').order('created_at', {ascending: false}).then(function(res) {
    var warnings = res.data || [];
    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>⚠️ Employee Warnings (الإنذارات والجزاءات)</h3>';
    if (App.isHR() || App.isOwner()) html += '<button class="btn btn-primary" onclick="newWarningModal()">' + icon('plus') + ' Issue Warning</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Reason</th><th>Date</th><th>Deduction</th><th>Status</th></tr></thead><tbody>';
    if (warnings.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No warnings issued</td></tr>';
    } else {
      warnings.forEach(function(w) {
        var tColor = w.warning_type === 'verbal' ? 'info' : w.warning_type === 'written' ? 'warning' : w.warning_type === 'final' ? 'danger' : 'danger';
        html += '<tr><td style="font-weight:600">' + (w.employee_name || '-') + '</td>';
        html += '<td><span class="badge badge-' + tColor + '">' + w.warning_type + '</span></td>';
        html += '<td>' + (w.reason || '-') + '</td>';
        html += '<td>' + formatDate(w.incident_date || w.created_at) + '</td>';
        html += '<td>' + (w.deduction_amount > 0 ? w.deduction_amount + ' EGP' : w.deduction_days > 0 ? w.deduction_days + ' days' : '-') + '</td>';
        html += '<td><span class="badge badge-' + (w.status === 'active' ? 'danger' : 'secondary') + '">' + w.status + '</span></td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.newWarningModal = function() {
      sbClient.from('users').select('id,full_name').eq('status','active').then(function(res) {
        var emps = res.data || [];
        var body = '<div class="form-field"><label>Employee *</label><select id="wr-emp" class="form-input">';
        emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '">' + e.full_name + '</option>'; });
        body += '</select></div>';
        body += '<div class="form-field"><label>Warning Type *</label><select id="wr-type" class="form-input"><option value="verbal">Verbal (شفهي)</option><option value="written">Written (كتابي)</option><option value="final">Final (إنذار نهائي)</option><option value="suspension">Suspension (إيقاف)</option></select></div>';
        body += '<div class="form-field"><label>Reason *</label><textarea id="wr-reason" class="form-input" rows="2"></textarea></div>';
        body += '<div class="form-row"><div class="form-field"><label>Deduction Amount (EGP)</label><input type="number" id="wr-amt" class="form-input" value="0"></div>';
        body += '<div class="form-field"><label>Deduction Days</label><input type="number" id="wr-days" class="form-input" value="0"></div></div>';
        var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-wr-btn">Issue Warning</button>';
        App.showModal('Issue Warning', body, footer);
        document.getElementById('save-wr-btn').addEventListener('click', function() {
          var empVal = document.getElementById('wr-emp').value.split('|');
          var reason = document.getElementById('wr-reason').value;
          if (!reason) { alert('Reason required'); return; }
          sbClient.from('employee_warnings').insert({
            employee_id: empVal[0], employee_name: empVal[1],
            warning_type: document.getElementById('wr-type').value, reason: reason,
            deduction_amount: parseFloat(document.getElementById('wr-amt').value) || 0,
            deduction_days: parseInt(document.getElementById('wr-days').value) || 0,
            incident_date: new Date().toISOString().slice(0,10),
            issued_by: App.user.id, issued_by_name: App.user.full_name
          }).then(function(r) {
            if (r.error) { alert(r.error.message); return; }
            App.closeModal(); Pages.employeeWarnings(el); showToast('Warning issued', 'success');
          });
        });
      });
    };
  });
};
