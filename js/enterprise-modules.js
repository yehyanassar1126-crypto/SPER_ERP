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

// ==========================================
// MODULE 8: Inventory Management
// ==========================================
Pages.inventory = function(el) {
  var isWarehouse = App.user && (App.user.department === 'Warehouse' || App.user.role === 'warehouse manager');
  var isManagerView = !isWarehouse; // read-only for others (Owner, Hall Manager, HR)

  var items = [];
  var transactions = [];
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Inventory...</div>';
    Promise.all([
      sbClient.from('inventory_items').select('*').order('name'),
      sbClient.from('inventory_transactions').select('*').order('date', {ascending: false}).limit(100)
    ]).then(function(res) {
      items = res[0].data || [];
      transactions = res[1].data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<div style="display:flex; gap:8px;">';
    html += '<button class="btn btn-sm btn-outline" id="tab-items" style="border-color:var(--accent-primary); color:var(--accent-primary)">Stock & Items (رصيد المخزن)</button>';
    html += '<button class="btn btn-sm btn-ghost" id="tab-tx">Transactions (حركة المخزون)</button>';
    html += '</div>';
    
    if (isWarehouse) {
      html += '<div>';
      html += '<button class="btn btn-outline" onclick="warehousePurchaseRequestModal()" style="margin-right:10px; border-color:#3b82f6; color:#3b82f6;">' + icon('shoppingCart') + ' Request Purchase (طلب شراء)</button>';
      html += '<button class="btn btn-primary" onclick="newInventoryItemModal()" style="margin-right:10px">' + icon('plus') + ' Add New Item</button>';
      html += '<button class="btn btn-success" onclick="newTransactionModal()">' + icon('refreshCw') + ' Add Transaction (صرف/إضافة)</button>';
      html += '</div>';
    }
    html += '</div>';

    // 1. Items View
    html += '<div id="view-items">';
    html += '<div class="card"><div class="card-header"><div><h3>Current Stock (رصيد المخزن)</h3><p>' + items.length + ' registered items</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Item Name</th><th>Category</th><th>Current Qty</th><th>Min Qty</th><th>Alert</th></tr></thead><tbody>';
    
    if (items.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No items found.</td></tr>';
    } else {
      items.forEach(function(item) {
        var isLow = item.quantity <= item.min_quantity;
        var rowStyle = isLow ? 'background:rgba(245,158,11,0.05)' : '';
        html += '<tr style="' + rowStyle + '">';
        html += '<td style="font-weight:600">' + item.name + '</td>';
        html += '<td><span class="badge badge-info">' + item.category + '</span></td>';
        html += '<td style="font-weight:700; font-size:1.1rem; color:' + (isLow ? 'var(--accent-danger)' : 'var(--text-primary)') + '">' + item.quantity + '</td>';
        html += '<td>' + item.min_quantity + '</td>';
        
        if (isLow) {
          html += '<td><span class="badge badge-danger">?? Low Stock</span></td>';
        } else {
          html += '<td><span class="badge badge-success">OK</span></td>';
        }
        
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    // 2. Transactions View
    html += '<div id="view-tx" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>Inventory Transactions (حركة المخزون)</h3><p>Recent IN/OUT operations</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Requested By</th><th>Processed By</th></tr></thead><tbody>';
    if (transactions.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No transactions yet.</td></tr>';
    } else {
      transactions.forEach(function(tx) {
        var isOut = tx.transaction_type === 'out';
        html += '<tr>';
        html += '<td>' + formatDate(tx.date) + '</td>';
        html += '<td style="font-weight:600">' + tx.item_name + '</td>';
        html += '<td><span class="badge badge-' + (isOut ? 'warning' : 'success') + '">' + (isOut ? 'OUT (صرف)' : 'IN (إضافة)') + '</span></td>';
        html += '<td style="font-weight:700">' + (isOut ? '-' : '+') + tx.quantity + '</td>';
        html += '<td>' + (tx.requested_by || '-') + '</td>';
        html += '<td>' + (tx.processed_by || '-') + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    el.innerHTML = html;

    // Tabs logic
    var tabItems = document.getElementById('tab-items');
    var tabTx = document.getElementById('tab-tx');
    var viewItems = document.getElementById('view-items');
    var viewTx = document.getElementById('view-tx');

    if (tabItems && tabTx) {
      tabItems.addEventListener('click', function() {
        tabItems.className = 'btn btn-sm btn-outline';
        tabItems.style.borderColor = 'var(--accent-primary)';
        tabItems.style.color = 'var(--accent-primary)';
        tabTx.className = 'btn btn-sm btn-ghost';
        tabTx.style.borderColor = 'transparent';
        tabTx.style.color = 'inherit';
        viewItems.style.display = 'block';
        viewTx.style.display = 'none';
      });
      tabTx.addEventListener('click', function() {
        tabTx.className = 'btn btn-sm btn-outline';
        tabTx.style.borderColor = 'var(--accent-primary)';
        tabTx.style.color = 'var(--accent-primary)';
        tabItems.className = 'btn btn-sm btn-ghost';
        tabItems.style.borderColor = 'transparent';
        tabItems.style.color = 'inherit';
        viewTx.style.display = 'block';
        viewItems.style.display = 'none';
      });
    }
  }

  window.newInventoryItemModal = function() {
    var body = '<div class="form-field"><label>Item Name *</label><input type="text" id="inv-name" class="form-input"></div>';
    body += '<div class="form-row"><div class="form-field"><label>Category *</label><select id="inv-cat" class="form-input"><option value="Maintenance">Maintenance (قطع غيار صيانة)</option><option value="Workshop">Workshop (ورشة)</option><option value="Supplies">Supplies (مستلزمات)</option><option value="Chemicals">Chemicals (كيماويات)</option><option value="Fixed Assets">Fixed Assets (أصول ثابتة)</option></select></div>';
    body += '<div class="form-field"><label>Minimum Qty Alert *</label><input type="number" id="inv-min" class="form-input" value="2"></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Supplier Name (اسم المورد)</label><input type="text" id="inv-supplier" class="form-input" placeholder="Optional"></div>';
    body += '<div class="form-field"><label>Purchase Price (السعر)</label><input type="number" id="inv-price" class="form-input" value="0"></div></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-inv-btn">Save Item</button>';
    App.showModal('Add New Inventory Item', body, footer);

    document.getElementById('save-inv-btn').addEventListener('click', function() {
      var name = document.getElementById('inv-name').value;
      var cat = document.getElementById('inv-cat').value;
      var min = parseInt(document.getElementById('inv-min').value);
      var supplier = document.getElementById('inv-supplier').value;
      var price = parseFloat(document.getElementById('inv-price').value) || 0;
      if(!name) return alert('Name is required');

      sbClient.from('inventory_items').insert([{
        name: name, category: cat, min_quantity: min || 0, quantity: 0,
        supplier_name: supplier, last_purchase_price: price
      }]).then(function(r) {
        if (r.error) return alert(r.error.message);
        App.closeModal();
        loadData();
        showToast('Item Added Successfully', 'success');
      });
    });
  };

  window.newTransactionModal = function() {
    var body = '<div class="form-field"><label>Item *</label><select id="tx-item" class="form-input"><option value="">-- Select Item --</option>';
    items.forEach(function(i) {
      body += '<option value="' + i.id + '" data-qty="' + i.quantity + '">' + i.name + ' (Current: ' + i.quantity + ')</option>';
    });
    body += '</select></div>';
    
    body += '<div class="form-row"><div class="form-field"><label>Type *</label><select id="tx-type" class="form-input" onchange="window.toggleTxFields()"><option value="out">OUT (صرف للإنتاج)</option><option value="in">IN (إضافة للمخزن)</option></select></div>';
    body += '<div class="form-field"><label>Quantity *</label><input type="number" id="tx-qty" class="form-input" min="1" value="1"></div></div>';
    
    body += '<div class="form-field" id="tx-req-container"><label>Requested By (For OUT only)</label><input type="text" id="tx-req" class="form-input" placeholder="e.g. Production Manager Name"></div>';
    
    body += '<div class="form-row" id="tx-in-fields" style="display:none;"><div class="form-field"><label>New Supplier (اختياري)</label><input type="text" id="tx-supplier" class="form-input" placeholder="Update supplier if changed"></div>';
    body += '<div class="form-field"><label>New Price (تحديث السعر)</label><input type="number" id="tx-price" class="form-input" placeholder="Optional"></div></div>';

    window.toggleTxFields = function() {
      var isIn = document.getElementById('tx-type').value === 'in';
      document.getElementById('tx-in-fields').style.display = isIn ? 'flex' : 'none';
      document.getElementById('tx-req-container').style.display = isIn ? 'none' : 'block';
    };

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-tx-btn">Process Transaction</button>';
    App.showModal('Inventory Transaction', body, footer);

    document.getElementById('save-tx-btn').addEventListener('click', function() {
      var select = document.getElementById('tx-item');
      var itemId = select.value;
      var itemName = select.options[select.selectedIndex].text.split(' (')[0];
      var currentQty = parseInt(select.options[select.selectedIndex].getAttribute('data-qty'));
      
      var type = document.getElementById('tx-type').value;
      var qty = parseInt(document.getElementById('tx-qty').value);
      var reqBy = document.getElementById('tx-req').value;
      var newSupplier = document.getElementById('tx-supplier').value;
      var newPrice = document.getElementById('tx-price').value;

      if(!itemId || !qty) return alert('Please fill all fields');
      if(type === 'out' && qty > currentQty) return alert('Not enough stock! Current stock: ' + currentQty);

      var newQty = type === 'in' ? currentQty + qty : currentQty - qty;
      var updateData = { quantity: newQty };
      if (type === 'in') {
        if (newSupplier) updateData.supplier_name = newSupplier;
        if (newPrice) updateData.last_purchase_price = parseFloat(newPrice);
      }

      sbClient.from('inventory_items').update(updateData).eq('id', itemId).then(function(r) {
        if(r.error) return alert(r.error.message);
        
        sbClient.from('inventory_transactions').insert([{
          item_id: itemId, item_name: itemName, transaction_type: type, quantity: qty,
          requested_by: reqBy, processed_by: App.user.full_name
        }]).then(function(r2) {
          if(r2.error) return alert(r2.error.message);
          App.closeModal();
          loadData();
          showToast('Transaction processed successfully', 'success');
        });
      });
    });
  };

  window.warehousePurchaseRequestModal = function() {
    var body = '<div class="form-field"><label>Item Name (Or select from inventory) *</label>';
    body += '<input type="text" id="wh-pr-item-name" class="form-input" placeholder="e.g. Printer Paper A4" list="wh-inv-items-list">';
    body += '<datalist id="wh-inv-items-list">';
    items.forEach(function(i) {
      body += '<option value="' + i.name + '" data-id="' + i.id + '">';
    });
    body += '</datalist></div>';
    
    body += '<div class="form-field"><label>Quantity Required *</label><input type="number" id="wh-pr-qty" class="form-input" min="1" value="1"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-wh-pr-btn">Submit Request to Procurement</button>';
    App.showModal('Request Purchase (طلب شراء)', body, footer);

    document.getElementById('save-wh-pr-btn').addEventListener('click', function() {
      var nameInput = document.getElementById('wh-pr-item-name').value;
      var qty = parseInt(document.getElementById('wh-pr-qty').value);
      if(!nameInput || !qty) return alert('Please provide item name and quantity');

      var matchedItem = items.find(function(i) { return i.name.toLowerCase() === nameInput.toLowerCase(); });
      var itemId = matchedItem ? matchedItem.id : null;

      sbClient.from('purchase_requests').insert([{
        item_id: itemId, item_name: nameInput, requested_quantity: qty,
        status: 'pending', requested_by: App.user.full_name + ' (Warehouse)'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal();
        showToast('Purchase request sent to Procurement successfully', 'success');
      });
    });
  };

  loadData();
};

// ==========================================
// MODULE 9: Procurement & Purchase Requests
// ==========================================
Pages.purchaseRequests = function(el) {
  var isProcurementMgr = App.user && App.user.role === 'procurement manager';
  var isProcurementSpec = App.user && App.user.role === 'procurement specialist';
  var isProcurement = isProcurementMgr || isProcurementSpec || App.isOwner();
  var isWarehouse = App.user && (App.user.department === 'Warehouse' || App.user.role === 'warehouse manager' || App.user.role === 'hall manager') && !isProcurement;
  var isManager = App.isManager() && !isProcurement && !isWarehouse;

  var requests = [];
  var inventoryItems = [];
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Purchase Requests...</div>';
    
    var reqQuery = (isProcurement || isWarehouse) ? 
      sbClient.from('purchase_requests').select('*').order('created_at', {ascending: false}) :
      sbClient.from('purchase_requests').select('*').eq('requested_by', App.user.full_name).order('created_at', {ascending: false});

    Promise.all([
      reqQuery,
      sbClient.from('inventory_items').select('id, name').order('name')
    ]).then(function(res) {
      requests = res[0].data || [];
      inventoryItems = res[1].data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Purchase Requests (طلبات الشراء)</h3>';
    if (!isProcurement) {
      html += '<button class="btn btn-primary" onclick="newPurchaseRequestModal()">' + icon('plus') + ' Request Purchase</button>';
    }
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>Material & Purchase Requisitions</h3><p>Manage requested items, warehouse dispensations, and procurement</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Item</th><th>Qty</th><th>Requested By</th><th>Status</th>' + ((isProcurement || isWarehouse) ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    
    if (requests.length === 0) {
      html += '<tr><td colspan="' + (isProcurement ? '6' : '5') + '" style="text-align:center;padding:40px;color:var(--text-muted)">No purchase requests found.</td></tr>';
    } else {
      requests.forEach(function(req) {
        var statusColor = 'warning';
        var statusIcon = 'clock';
        if(req.status === 'approved') { statusColor = 'info'; statusIcon = 'check'; }
        if(req.status === 'rejected') { statusColor = 'danger'; statusIcon = 'x'; }
        if(req.status === 'quotation_requested') { statusColor = 'primary'; statusIcon = 'fileText'; }
        if(req.status === 'purchased') { statusColor = 'success'; statusIcon = 'checkCheck'; }

        if(req.status === 'pending_warehouse') { statusColor = 'secondary'; statusIcon = 'package'; }
        if(req.status === 'dispensed') { statusColor = 'success'; statusIcon = 'checkCheck'; }

        html += '<tr>';
        html += '<td>' + formatDate(req.created_at) + '</td>';
        html += '<td style="font-weight:600">' + req.item_name + '</td>';
        html += '<td>' + req.requested_quantity + '</td>';
        html += '<td>' + (req.requested_by || '-') + '</td>';
        var displayStatus = req.status.replace('_', ' ').toUpperCase();
        if (req.status === 'pending_warehouse') displayStatus = 'PENDING WAREHOUSE';
        html += '<td><span class="badge badge-' + statusColor + '">' + icon(statusIcon, 12) + ' ' + displayStatus + '</span></td>';
        
        if (isProcurement || isWarehouse) {
          html += '<td>';
          if (isWarehouse && req.status === 'pending_warehouse') {
            html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateReqStatus(\'' + req.id + '\', \'dispensed\')">Dispense</button>';
            html += '<button class="btn btn-xs btn-warning" onclick="updateReqStatus(\'' + req.id + '\', \'pending\')">Send to Procurement</button>';
          } else if (isProcurementMgr && req.status === 'pending') {
            html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateReqStatus(\'' + req.id + '\', \'approved\')">Approve</button>';
            html += '<button class="btn btn-xs btn-danger" onclick="updateReqStatus(\'' + req.id + '\', \'rejected\')">Reject</button>';
          } else if ((isProcurementSpec || isProcurementMgr) && req.status === 'approved') {
             html += '<button class="btn btn-xs btn-primary" onclick="requestPettyCashModal(\'' + req.id + '\', \'' + req.item_name.replace(/'/g, "\\'") + '\')">Request Petty Cash</button>';
          } else if (req.status === 'quotation_requested') {
             html += '<span style="color:var(--text-muted);font-size:0.8rem">Awaiting Finance</span>';
          } else {
             html += '<span style="color:var(--text-muted);font-size:0.8rem">No Action</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    
    el.innerHTML = html;
  }

  window.newPurchaseRequestModal = function() {
    var body = '<div class="form-field"><label>Item Name (Or select from inventory) *</label>';
    body += '<input type="text" id="pr-item-name" class="form-input" placeholder="e.g. Printer Paper A4" list="inv-items-list">';
    body += '<datalist id="inv-items-list">';
    inventoryItems.forEach(function(i) {
      body += '<option value="' + i.name + '" data-id="' + i.id + '">';
    });
    body += '</datalist></div>';
    
    body += '<div class="form-row"><div class="form-field"><label>Quantity Required *</label><input type="number" id="pr-qty" class="form-input" min="0.01" step="0.01" value="1"></div>';
    body += '<div class="form-field"><label>Estimated Price (السعر المتوقع)</label><input type="number" id="pr-price" class="form-input" min="0" step="0.01" placeholder="Optional"></div></div>';
    body += '<div class="form-field"><label>Supplier Name (اسم المورد)</label><input type="text" id="pr-supplier" class="form-input" placeholder="Optional"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-pr-btn">Submit Request</button>';
    App.showModal('New Purchase Request', body, footer);

    document.getElementById('save-pr-btn').addEventListener('click', function() {
      var nameInput = document.getElementById('pr-item-name').value;
      var qty = parseFloat(document.getElementById('pr-qty').value);
      var price = parseFloat(document.getElementById('pr-price').value) || 0;
      var supplier = document.getElementById('pr-supplier').value;
      
      if(!nameInput || !qty || isNaN(qty)) return alert('Please provide item name and quantity');

      var matchedItem = inventoryItems.find(function(i) { return i.name.toLowerCase() === nameInput.toLowerCase(); });
      var itemId = matchedItem ? matchedItem.id : null;

      sbClient.from('purchase_requests').insert([{
        item_id: itemId, item_name: nameInput, requested_quantity: qty,
        supplier_name: supplier, estimated_price: price,
        requested_by: App.user.full_name, status: 'pending_warehouse'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal();
        loadData();
        showToast('Purchase request submitted', 'success');
      });
    });
  };

  window.requestPettyCashModal = function(reqId, itemName) {
    var body = '<div class="form-field"><label>Supplier Name *</label><input type="text" id="pc-supplier" class="form-input"></div>';
    body += '<div class="form-field"><label>Total Price (EGP) *</label><input type="number" id="pc-price" class="form-input" min="1"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-pc-btn">Request Cash</button>';
    App.showModal('Request Petty Cash (طلب عهدة)', body, footer);

    document.getElementById('save-pc-btn').addEventListener('click', function() {
      var supplier = document.getElementById('pc-supplier').value;
      var price = parseFloat(document.getElementById('pc-price').value);
      if(!supplier || !price) return alert('Please provide supplier and price');

      sbClient.from('purchase_orders').insert([{
        request_id: reqId, item_name: itemName, supplier_name: supplier, price: price,
        status: 'pending_approval', specialist_name: App.user.full_name, manager_name: App.user.full_name,
        petty_cash_amount: price
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        
        sbClient.from('purchase_requests').update({status: 'quotation_requested'}).eq('id', reqId).then(function(r2) {
           App.closeModal();
           loadData();
           showToast('Petty cash requested from Finance', 'success');
        });
      });
    });
  };

  window.updateReqStatus = function(id, newStatus) {
    if(confirm('Update request status to ' + newStatus + '?')) {
      sbClient.from('purchase_requests').update({
        status: newStatus,
        approved_by: (newStatus === 'approved' ? App.user.full_name : null)
      }).eq('id', id).then(function(r) {
        if(r.error) return alert(r.error.message);
        loadData();
        showToast('Status updated successfully', 'success');
      });
    }
  };

  loadData();
};

// ==========================================
// MODULE 10: Petty Cash & Settlements (Finance)
// ==========================================
Pages.pettyCash = function(el) {
  var isFinance = App.user && App.user.department === 'Finance';
  var isOwner = App.isOwner();
  var isProcurement = App.user && (App.user.role === 'procurement specialist' || App.user.role === 'procurement manager');
  
  var orders = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Petty Cash Data...</div>';
    
    var query = sbClient.from('purchase_orders').select('*').order('created_at', {ascending: false});
    if (isProcurement) {
      query = query.eq('specialist_name', App.user.full_name);
    }
    
    query.then(function(res) {
      orders = res.data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Petty Cash & Settlements (العهد والتسويات)</h3>';
    if (isFinance || isOwner) {
      html += '<button class="btn btn-primary" onclick="newManualPettyCashModal()">' + icon('plus') + ' Issue Cash (إضافة عهدة مباشرة)</button>';
    }
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>Active Cash Advances</h3><p>Manage procurement funds and invoices</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Specialist</th><th>Item</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Invoice</th><th>Actions</th></tr></thead><tbody>';
    
    if (orders.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No petty cash requests found.</td></tr>';
    } else {
      orders.forEach(function(o) {
        var statusColor = 'warning';
        var statusText = 'Pending Finance';
        if(o.status === 'approved') { statusColor = 'info'; statusText = 'Cash Issued'; }
        if(o.status === 'purchased') { statusColor = 'primary'; statusText = 'Pending Settlement'; }
        if(o.status === 'settled') { statusColor = 'success'; statusText = 'Settled'; }

        html += '<tr>';
        html += '<td>' + formatDate(o.created_at) + '</td>';
        html += '<td>' + (o.specialist_name || '-') + '</td>';
        html += '<td style="font-weight:600">' + o.item_name + '</td>';
        html += '<td>' + o.supplier_name + '</td>';
        
        var amtHtml = '<div style="font-weight:700">EGP ' + o.petty_cash_amount + '</div>';
        if (o.status === 'settled') {
          var returned = o.petty_cash_amount - (o.petty_cash_spent || 0);
          amtHtml += '<div style="font-size:0.75rem;color:var(--text-secondary)">Spent: EGP ' + (o.petty_cash_spent || 0) + '</div>';
          amtHtml += '<div style="font-size:0.75rem;color:' + (returned > 0 ? 'var(--accent-success)' : 'var(--text-secondary)') + '">Returned: EGP ' + returned + '</div>';
        }
        html += '<td>' + amtHtml + '</td>';
        html += '<td><span class="badge badge-' + statusColor + '">' + statusText + '</span></td>';
        
        html += '<td>';
        if(o.invoice_url) {
          html += '<a href="' + o.invoice_url + '" target="_blank" style="color:var(--accent-primary);text-decoration:underline;">View Invoice</a>';
        } else {
          html += '<span style="color:var(--text-muted)">-</span>';
        }
        html += '</td>';

        html += '<td>';
        if ((isFinance || isOwner) && o.status === 'pending_approval') {
          html += '<button class="btn btn-xs btn-success" onclick="approveCash(\'' + o.id + '\')">Issue Cash</button>';
        } else if (isProcurement && o.status === 'approved') {
          html += '<button class="btn btn-xs btn-primary" onclick="uploadInvoiceModal(\'' + o.id + '\')">Upload Invoice / Price</button>';
        } else if ((isFinance || isOwner) && o.status === 'purchased') {
          html += '<button class="btn btn-xs btn-success" onclick="settleCashModal(\'' + o.id + '\', ' + o.petty_cash_amount + ', \'' + o.request_id + '\', ' + (o.petty_cash_spent || o.petty_cash_amount) + ')">Settle (تسوية)</button>';
        } else {
          html += '<span style="color:var(--text-muted);font-size:0.8rem">No Action</span>';
        }
        html += '</td>';
        
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.approveCash = function(id) {
    if(confirm('Approve and issue cash advance?')) {
      sbClient.from('purchase_orders').update({status: 'approved'}).eq('id', id).then(function(r) {
        if(r.error) return alert(r.error.message);
        loadData();
        showToast('Cash Issued Successfully', 'success');
      });
    }
  };

  window.uploadInvoiceModal = function(id) {
    var body = '<div class="form-field"><label>Actual Spent Amount (السعر الفعلي للصرف) EGP *</label><input type="number" id="pc-actual-spent" class="form-input" min="0" step="0.01" placeholder="e.g. 500"></div>';
    body += '<div class="form-field"><label>Upload Invoice Image (صورة الفاتورة - اختياري)</label><input type="file" id="pc-inv-file" accept="image/*" class="form-input" style="padding:10px"></div>';
    body += '<div id="inv-preview" style="margin-top:10px;text-align:center"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-inv-btn">Submit Record</button>';
    App.showModal('Confirm Purchase & Upload Invoice', body, footer);

    var base64Img = '';
    document.getElementById('pc-inv-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var MAX_WIDTH = 800; var MAX_HEIGHT = 800;
          var width = img.width; var height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          base64Img = canvas.toDataURL('image/jpeg', 0.7);
          document.getElementById('inv-preview').innerHTML = '<img src="' + base64Img + '" style="max-width:100%;max-height:200px;border-radius:8px">';
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('save-inv-btn').addEventListener('click', function() {
      var spent = parseFloat(document.getElementById('pc-actual-spent').value);
      if(isNaN(spent)) return alert('Please enter the actual spent amount (السعر الفعلي)');
      
      var btn = this;
      btn.innerHTML = '<span class="spinner"></span> Saving...';
      btn.disabled = true;
      
      var updateData = { status: 'purchased', petty_cash_spent: spent };
      if (base64Img) updateData.invoice_url = base64Img;

      sbClient.from('purchase_orders').update(updateData).eq('id', id).then(function(r) {
        if(r.error) {
          btn.innerHTML = 'Submit Record';
          btn.disabled = false;
          return alert(r.error.message);
        }
        App.closeModal();
        loadData();
        showToast('Purchase confirmed, awaiting settlement', 'success');
      });
    });
  };

  window.settleCashModal = function(id, issuedAmount, requestId, spentAmount) {
    var defaultSpent = spentAmount || issuedAmount;
    var body = '<div style="margin-bottom:16px;font-weight:600">Issued Cash: EGP ' + issuedAmount + '</div>';
    body += '<div class="form-field"><label>Actual Spent Amount (EGP) *</label><input type="number" id="pc-spent" class="form-input" value="' + defaultSpent + '"></div>';
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-success" id="save-stl-btn">Confirm Settlement</button>';
    App.showModal('Settle Petty Cash (تسوية العهدة)', body, footer);

    document.getElementById('save-stl-btn').addEventListener('click', function() {
      var spent = parseFloat(document.getElementById('pc-spent').value);
      if(!spent) return alert('Please enter the actual spent amount');
      
      sbClient.from('purchase_orders').update({status: 'settled', petty_cash_spent: spent}).eq('id', id).then(function(r) {
        if(r.error) return alert(r.error.message);
        
        if (requestId && requestId !== 'null' && requestId !== 'undefined') {
          sbClient.from('purchase_requests').update({status: 'purchased'}).eq('id', requestId).then(function(r2) {
            App.closeModal();
            loadData();
            showToast('Petty cash settled', 'success');
          });
        } else {
          App.closeModal();
          loadData();
          showToast('Petty cash settled', 'success');
        }
      });
    });
  };

  window.newManualPettyCashModal = function() {
    sbClient.from('users').select('id, full_name, role').ilike('role', '%procurement%').then(function(res) {
      var procUsers = res.data || [];
      var body = '<div class="form-field"><label>Specialist (موظف المشتروات) *</label><select id="mc-specialist" class="form-input"><option value="">-- Select --</option>';
      procUsers.forEach(function(u) { body += '<option value="' + u.full_name + '">' + u.full_name + '</option>'; });
      body += '</select></div>';
      body += '<div class="form-row"><div class="form-field"><label>Item / Description (البيان) *</label><input type="text" id="mc-item" class="form-input"></div>';
      body += '<div class="form-field"><label>Supplier (المورد - اختياري)</label><input type="text" id="mc-supplier" class="form-input" placeholder="Optional"></div></div>';
      body += '<div class="form-field"><label>Amount Issued (مبلغ العهدة) EGP *</label><input type="number" id="mc-amount" class="form-input" min="1" step="0.01"></div>';
      
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-mc-btn">Issue Cash</button>';
      App.showModal('Issue Manual Petty Cash', body, footer);
      
      document.getElementById('save-mc-btn').addEventListener('click', function() {
        var spec = document.getElementById('mc-specialist').value;
        var item = document.getElementById('mc-item').value;
        var supp = document.getElementById('mc-supplier').value || 'N/A';
        var amt = parseFloat(document.getElementById('mc-amount').value);
        if(!spec || !item || isNaN(amt)) return alert('Please fill required fields');
        
        sbClient.from('purchase_orders').insert([{
          item_name: item, supplier_name: supp, petty_cash_amount: amt, price: amt,
          status: 'approved', specialist_name: spec, manager_name: App.user.full_name
        }]).then(function(r) {
          if(r.error) return alert(r.error.message);
          App.closeModal();
          loadData();
          showToast('Petty cash issued manually', 'success');
        });
      });
    });
  };

  loadData();
};
