// ===== ENTERPRISE HR MODULES =====
// Modules: 5 (Disciplinary & Grievances), 6 (Offboarding), 7 (Expenses)

window.Pages = window.Pages || {};

// ==========================================
// MODULE 5: Disciplinary Actions & Grievances
// ==========================================
Pages.complaints = function (el) {
  var user = App.user;
  var isHR = App.isHR();
  var complaints = [];
  var disciplinary = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading...</div>';
    var cQuery = isHR ? sbClient.from('complaints').select('*').order('created_at', {ascending: false}) : sbClient.from('complaints').select('*').eq('employee_id', user.id).order('created_at', {ascending: false});
    cQuery.then(function(cRes) {
      complaints = cRes.data || [];
      if (isHR) {
        sbClient.from('disciplinary_actions').select('*').order('created_at', {ascending: false}).then(function(dRes) {
          disciplinary = dRes.data || [];
          render();
        });
      } else {
        render();
      }
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<div style="display:flex; gap:8px;">';
    html += '<button class="btn btn-sm btn-outline" id="tab-comp" style="border-color:var(--accent-primary); color:var(--accent-primary)">Grievances & Complaints (الشكاوى)</button>';
    if (isHR) {
      html += '<button class="btn btn-sm btn-ghost" id="tab-disc">Disciplinary Actions (الجزاءات)</button>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="newComplaintModal()">' + icon('plus') + ' Submit Complaint</button>';
    if (isHR) {
      html += '<button class="btn btn-danger" style="margin-left:10px" onclick="newDisciplinaryModal()">' + icon('alertTriangle') + ' Issue Warning/Deduction</button>';
    }
    html += '</div>';

    // Complaints View
    html += '<div id="view-complaints">';
    html += '<div class="card"><div class="card-header"><div><h3>Grievances & Complaints</h3><p>Secure & confidential reporting</p></div></div><div class="card-body">';
    if (complaints.length === 0) {
      html += '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)">' + icon('messageSquare', 40) + '<p>No complaints found.</p></div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:12px">';
      complaints.forEach(function(c) {
        html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; background:var(--bg-tertiary)">';
        html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px;">';
        html += '<h4 style="margin:0; color:var(--text-primary)">' + c.subject + '</h4>';
        html += '<span class="badge badge-' + (c.status === 'open' ? 'warning' : 'success') + '">' + c.status + '</span>';
        html += '</div>';
        html += '<p style="margin:0 0 12px 0; font-size:0.9rem; color:var(--text-secondary)">' + c.description + '</p>';
        html += '<div style="font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between">';
        html += '<span>' + formatDate(c.created_at) + '</span>';
        if (isHR) {
          html += '<span>From: ' + (c.is_anonymous ? 'Anonymous' : c.employee_name) + '</span>';
        } else {
          html += '<span>' + (c.is_anonymous ? 'Submitted Anonymously' : 'Submitted with name') + '</span>';
        }
        html += '</div>';
        if (isHR && c.status === 'open') {
          html += '<button class="btn btn-sm btn-outline" style="margin-top:12px; width:100%" onclick="resolveComplaint(\'' + c.id + '\')">Mark as Resolved</button>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div></div></div>';

    if (isHR) {
      // Disciplinary View
      html += '<div id="view-disciplinary" style="display:none">';
      html += '<div class="card"><div class="card-header"><div><h3>Disciplinary Actions</h3><p>Warnings and Deductions log</p></div></div><div class="card-body no-pad">';
      if (disciplinary.length === 0) {
        html += '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)">' + icon('alertTriangle', 40) + '<p>No disciplinary actions recorded.</p></div>';
      } else {
        html += '<table class="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Type</th><th>Reason</th><th>Issued By</th></tr></thead><tbody>';
        disciplinary.forEach(function(d) {
          html += '<tr>';
          html += '<td>' + formatDate(d.created_at) + '</td>';
          html += '<td style="font-weight:600">' + d.employee_name + '</td>';
          html += '<td><span class="badge badge-danger">' + d.type + '</span></td>';
          html += '<td>' + d.reason + '</td>';
          html += '<td>' + d.issued_by_name + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table>';
      }
      html += '</div></div></div>';
    }

    el.innerHTML = html;

    var tabComp = document.getElementById('tab-comp');
    var tabDisc = document.getElementById('tab-disc');
    var viewComp = document.getElementById('view-complaints');
    var viewDisc = document.getElementById('view-disciplinary');

    if (tabComp && tabDisc) {
      tabComp.addEventListener('click', function() {
        tabComp.className = 'btn btn-sm btn-outline';
        tabComp.style.borderColor = 'var(--accent-primary)';
        tabComp.style.color = 'var(--accent-primary)';
        tabDisc.className = 'btn btn-sm btn-ghost';
        tabDisc.style.borderColor = 'transparent';
        tabDisc.style.color = 'inherit';
        viewComp.style.display = 'block';
        viewDisc.style.display = 'none';
      });
      tabDisc.addEventListener('click', function() {
        tabDisc.className = 'btn btn-sm btn-outline';
        tabDisc.style.borderColor = 'var(--accent-primary)';
        tabDisc.style.color = 'var(--accent-primary)';
        tabComp.className = 'btn btn-sm btn-ghost';
        tabComp.style.borderColor = 'transparent';
        tabComp.style.color = 'inherit';
        viewDisc.style.display = 'block';
        viewComp.style.display = 'none';
      });
    }
  }

  window.newComplaintModal = function() {
    var body = '<div class="form-field"><label>Subject *</label><input type="text" id="comp-subject" class="form-input" placeholder="e.g. Issue with shift timing"></div>';
    body += '<div class="form-field"><label>Description *</label><textarea id="comp-desc" class="form-input" rows="4" placeholder="Explain the issue in detail..."></textarea></div>';
    body += '<div style="margin-top:12px"><label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="comp-anon"> Submit Anonymously (Your name will not be shown to HR)</label></div>';
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="submit-comp-btn">Submit Complaint</button>';
    App.showModal('New Grievance / Complaint', body, footer);

    document.getElementById('submit-comp-btn').addEventListener('click', function() {
      var sub = document.getElementById('comp-subject').value;
      var desc = document.getElementById('comp-desc').value;
      var anon = document.getElementById('comp-anon').checked;
      if (!sub || !desc) { alert('Please fill all fields'); return; }
      
      sbClient.from('complaints').insert([{
        employee_id: user.id,
        employee_name: user.full_name,
        subject: sub,
        description: desc,
        is_anonymous: anon,
        status: 'open'
      }]).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        App.closeModal();
        loadData();
        showToast('Complaint submitted successfully', 'success');
      });
    });
  };

  window.resolveComplaint = function(id) {
    if (confirm('Mark this complaint as resolved?')) {
      sbClient.from('complaints').update({status: 'resolved'}).eq('id', id).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        loadData();
      });
    }
  };

  window.newDisciplinaryModal = function() {
    sbClient.from('users').select('id, full_name').eq('status', 'active').then(function(res) {
      var emps = res.data || [];
      var body = '<div class="form-row"><div class="form-field"><label>Employee *</label><select id="disc-emp" class="form-input">';
      emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '">' + e.full_name + '</option>'; });
      body += '</select></div><div class="form-field"><label>Action Type *</label><select id="disc-type" class="form-input"><option value="Written Warning">Written Warning (إنذار كتابي)</option><option value="Deduction (1 Day)">Deduction - 1 Day (خصم يوم)</option><option value="Deduction (3 Days)">Deduction - 3 Days (خصم 3 أيام)</option><option value="Termination">Termination (فصل)</option></select></div></div>';
      body += '<div class="form-field"><label>Reason *</label><textarea id="disc-reason" class="form-input" rows="3" placeholder="Describe the violation..."></textarea></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-danger" id="submit-disc-btn">Issue Action</button>';
      App.showModal('Issue Disciplinary Action', body, footer);

      document.getElementById('submit-disc-btn').addEventListener('click', function() {
        var empVal = document.getElementById('disc-emp').value.split('|');
        var type = document.getElementById('disc-type').value;
        var reason = document.getElementById('disc-reason').value;
        if (!reason) { alert('Please provide a reason'); return; }

        sbClient.from('disciplinary_actions').insert([{
          employee_id: empVal[0],
          employee_name: empVal[1],
          type: type,
          reason: reason,
          issued_by: user.id,
          issued_by_name: user.full_name
        }]).then(function(res) {
          if (res.error) { alert('Error: ' + res.error.message); return; }
          App.closeModal();
          loadData();
          showToast('Disciplinary action recorded', 'warning');
        });
      });
    });
  };

  loadData();
};

// ==========================================
// MODULE 6: Offboarding Process
// ==========================================
Pages.offboarding = function (el) {
  var user = App.user;
  var isHR = App.isHR();
  var offboardingList = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading...</div>';
    sbClient.from('offboarding').select('*').order('created_at', {ascending: false}).then(function(res) {
      offboardingList = res.data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Offboarding & Exit Processing</h3>';
    if (isHR) {
      html += '<button class="btn btn-primary" onclick="startOffboardingModal()">' + icon('logOut') + ' Start Offboarding Process</button>';
    }
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>Active Offboarding Processes</h3><p>Employees currently in exit process</p></div></div><div class="card-body">';
    if (offboardingList.length === 0) {
      html += '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)">' + icon('checkCheck', 40) + '<p>No active offboarding processes.</p></div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:12px">';
      offboardingList.forEach(function(o) {
        var progress = 0;
        var totalTasks = 3;
        if (o.it_cleared) progress++;
        if (o.hr_cleared) progress++;
        if (o.finance_cleared) progress++;
        var pct = Math.round((progress / totalTasks) * 100);
        
        html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; background:var(--bg-tertiary)">';
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">';
        html += '<div><h4 style="margin:0; color:var(--text-primary)">' + o.employee_name + '</h4><span style="font-size:0.8rem; color:var(--text-muted)">ID: ' + o.employee_code + ' | Separation Date: ' + formatDate(o.separation_date) + '</span></div>';
        html += '<span class="badge badge-' + (pct === 100 ? 'success' : 'warning') + '">' + pct + '% Complete</span>';
        html += '</div>';
        
        html += '<div style="display:flex; gap:10px; margin-bottom:16px">';
        html += _clearanceBadge('IT Clearance (Devices, Emails)', o.it_cleared, o.id, 'it');
        html += _clearanceBadge('HR Clearance (Uniform, ID Card)', o.hr_cleared, o.id, 'hr');
        html += _clearanceBadge('Finance Clearance (Loans, Final Pay)', o.finance_cleared, o.id, 'finance');
        html += '</div>';

        if (pct === 100 && o.status !== 'completed' && isHR) {
          html += '<button class="btn btn-sm btn-primary" onclick="finalizeOffboarding(\'' + o.id + '\', \'' + o.employee_id + '\')">Finalize & Deactivate Employee</button>';
        } else if (o.status === 'completed') {
          html += '<span style="color:var(--accent-success); font-weight:600; font-size:0.9rem">' + icon('checkCheck', 14) + ' Offboarding Completed</span>';
        }
        
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  function _clearanceBadge(label, isCleared, id, type) {
    var color = isCleared ? 'success' : 'warning';
    var text = isCleared ? 'Cleared' : 'Pending';
    var iconName = isCleared ? 'checkCheck' : 'clock';
    var cursor = (isHR && !isCleared) ? 'cursor:pointer; text-decoration:underline' : '';
    return '<div style="background:var(--bg-card); border:1px solid var(--border-color); padding:8px 12px; border-radius:var(--radius-sm); font-size:0.8rem; display:flex; flex-direction:column; gap:4px; flex:1">' + 
           '<span style="color:var(--text-secondary); font-weight:600">' + label + '</span>' + 
           '<span style="color:var(--accent-' + color + '); display:flex; align-items:center; gap:4px; ' + cursor + '" ' + (cursor ? 'onclick="markCleared(\'' + id + '\',\'' + type + '\')"' : '') + '>' + icon(iconName, 12) + ' ' + text + '</span>' + 
           '</div>';
  }

  window.markCleared = function(id, type) {
    if (confirm('Mark ' + type.toUpperCase() + ' as cleared?')) {
      var updateObj = {};
      if (type === 'it') updateObj.it_cleared = true;
      if (type === 'hr') updateObj.hr_cleared = true;
      if (type === 'finance') updateObj.finance_cleared = true;
      
      sbClient.from('offboarding').update(updateObj).eq('id', id).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        loadData();
      });
    }
  };

  window.finalizeOffboarding = function(id, userId) {
    if (confirm('Are you sure? This will mark the employee as Inactive in the system.')) {
      sbClient.from('offboarding').update({status: 'completed'}).eq('id', id).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        // Deactivate user in DB
        sbClient.from('users').update({ status: 'inactive' }).eq('id', userId).then(function(r) {
          if (r && r.error) alert('Error updating user status: ' + r.error.message);
          loadData();
          showToast('Employee offboarded and deactivated', 'success');
        });
      });
    }
  };

  window.startOffboardingModal = function() {
    sbClient.from('users').select('id, full_name, employee_id').eq('status', 'active').then(function(res) {
      var emps = res.data || [];
      var body = '<div class="form-field"><label>Select Employee *</label><select id="off-emp" class="form-input">';
      emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '|' + e.employee_id + '">' + e.full_name + ' (' + e.employee_id + ')</option>'; });
      body += '</select></div>';
      body += '<div class="form-row"><div class="form-field"><label>Separation Date *</label><input type="date" id="off-date" class="form-input"></div><div class="form-field"><label>Reason</label><select id="off-reason" class="form-input"><option value="Resignation">Resignation</option><option value="Termination">Termination</option><option value="End of Contract">End of Contract</option></select></div></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="start-off-btn">Start Process</button>';
      App.showModal('Start Offboarding Process', body, footer);

      document.getElementById('start-off-btn').addEventListener('click', function() {
        var empVal = document.getElementById('off-emp').value.split('|');
        var date = document.getElementById('off-date').value;
        var reason = document.getElementById('off-reason').value;
        if (!date) { alert('Please select separation date'); return; }

        if (offboardingList.find(function(x) { return x.employee_id === empVal[0] && x.status !== 'completed'; })) {
          alert('This employee is already in an active offboarding process.');
          return;
        }

        sbClient.from('offboarding').insert([{
          employee_id: empVal[0],
          employee_name: empVal[1],
          employee_code: empVal[2],
          separation_date: date,
          reason: reason,
          status: 'pending'
        }]).then(function(res) {
          if (res.error) { alert('Error: ' + res.error.message); return; }
          App.closeModal();
          loadData();
          showToast('Offboarding process started', 'success');
        });
      });
    });
  };

  loadData();
};

// ==========================================
// MODULE 7: Expense Claims
// ==========================================
Pages.expenses = function (el) {
  var user = App.user;
  var isHR = App.isHR();
  var expenses = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading...</div>';
    var eQuery = isHR ? sbClient.from('expenses').select('*').order('created_at', {ascending: false}) : sbClient.from('expenses').select('*').eq('employee_id', user.id).order('created_at', {ascending: false});
    eQuery.then(function(res) {
      expenses = res.data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Expense & Travel Claims (المصروفات)</h3>';
    if (!isHR || user.role === 'hr') {
      html += '<button class="btn btn-primary" onclick="newExpenseModal()">' + icon('plus') + ' Submit Expense Claim</button>';
    }
    html += '</div>';
    
    html += '<div class="card"><div class="card-header"><div><h3>Expense Requests</h3><p>Travel, supplies, and miscellaneous reimbursements</p></div></div><div class="card-body no-pad">';
    if (expenses.length === 0) {
      html += '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)">' + icon('receipt', 40) + '<p>No expense claims found.</p></div>';
    } else {
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Type</th><th>Amount (EGP)</th><th>Description</th><th>Status</th>' + (isHR ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
      expenses.forEach(function(e) {
        html += '<tr>';
        html += '<td>' + formatDate(e.date) + '</td>';
        html += '<td style="font-weight:600">' + e.employee_name + '</td>';
        html += '<td>' + e.type + '</td>';
        html += '<td style="font-weight:700; color:var(--text-primary)">' + parseFloat(e.amount).toLocaleString() + '</td>';
        html += '<td>' + e.description + '</td>';
        var bClass = e.status === 'pending' ? 'warning' : (e.status === 'approved' ? 'success' : 'danger');
        html += '<td><span class="badge badge-' + bClass + '">' + (e.status.charAt(0).toUpperCase() + e.status.slice(1)) + '</span></td>';
        if (isHR) {
          html += '<td>';
          if (e.status === 'pending') {
            html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateExpense(\'' + e.id + '\', \'approved\')">' + icon('checkCheck', 12) + '</button>';
            html += '<button class="btn btn-xs btn-danger" onclick="updateExpense(\'' + e.id + '\', \'rejected\')">' + icon('x', 12) + '</button>';
          } else {
            html += '<span style="color:var(--text-muted); font-size:0.8rem">Processed</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  window.newExpenseModal = function() {
    var body = '<div class="form-row"><div class="form-field"><label>Expense Type *</label><select id="exp-type" class="form-input"><option value="Travel (سفر وانتقالات)">Travel (سفر وانتقالات)</option><option value="Supplies (مستلزمات)">Supplies (مستلزمات)</option><option value="Client Meeting (ضيافة عملاء)">Client Meeting (ضيافة عملاء)</option><option value="Other">Other</option></select></div><div class="form-field"><label>Amount (EGP) *</label><input type="number" id="exp-amount" class="form-input" placeholder="0"></div></div>';
    body += '<div class="form-field"><label>Date Incurred *</label><input type="date" id="exp-date" class="form-input" max="' + todayStr() + '"></div>';
    body += '<div class="form-field"><label>Description *</label><input type="text" id="exp-desc" class="form-input" placeholder="What was this expense for?"></div>';
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="submit-exp-btn">Submit Claim</button>';
    App.showModal('Submit Expense Claim', body, footer);

    document.getElementById('submit-exp-btn').addEventListener('click', function() {
      var type = document.getElementById('exp-type').value;
      var amt = document.getElementById('exp-amount').value;
      var date = document.getElementById('exp-date').value;
      var desc = document.getElementById('exp-desc').value;
      if (!amt || !date || !desc) { alert('Please fill all fields'); return; }

      sbClient.from('expenses').insert([{
        employee_id: user.id,
        employee_name: user.full_name,
        type: type,
        amount: parseFloat(amt),
        date: date,
        description: desc,
        status: 'pending'
      }]).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        App.closeModal();
        loadData();
        showToast('Expense claim submitted', 'success');
      });
    });
  };

  window.updateExpense = function(id, status) {
    if (confirm('Mark this expense claim as ' + status + '?')) {
      sbClient.from('expenses').update({status: status}).eq('id', id).then(function(res) {
        if (res.error) { alert('Error: ' + res.error.message); return; }
        
        var e = expenses.find(function(x) { return x.id === id; });
        if (e) {
          App.addNotification({
            user_id: e.employee_id,
            title: 'Expense Claim ' + (status === 'approved' ? 'Approved' : 'Rejected'),
            message: 'Your expense claim for EGP ' + e.amount + ' (' + e.description + ') has been ' + status + '.',
            type: status === 'approved' ? 'success' : 'danger'
          });
        }
        loadData();
      });
    }
  };

  loadData();
};
