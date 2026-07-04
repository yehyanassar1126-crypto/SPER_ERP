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
  var isPersonalView = (App.activePage === 'my-expenses');
  var isHR = App.isHR() && !isPersonalView;
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
  var isSalesCoord = App.user && (App.user.role === 'sales coordinator' || App.user.department === 'Sales');
  var isPlanning = App.user && (App.user.department === 'Planning' || App.user.role === 'planning manager');
  var canViewInventory = App.isOwner() || isWarehouse || isSalesCoord || isPlanning;

  if (!canViewInventory) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Warehouse, Sales, and Planning departments.</p></div>';
    return;
  }

  var isManagerView = !isWarehouse; // read-only for Owner, Sales, and Planning
  window.currentWarehouseTab = 'raw';

  var items = [];
  var transactions = [];
  var matReqs = [];
  var qualityOrders = [];
  var sparePartsReqs = [];
  var rawPending = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Inventory...</div>';
    Promise.all([
      sbClient.from('inventory_items').select('*').order('name'),
      sbClient.from('inventory_transactions').select('*').order('date', {ascending: false}).limit(100),
      sbClient.from('material_requests').select('*').order('created_at', {ascending: false}),
      sbClient.from('sales_workflow_orders').select('*').in('status', ['Pending Warehouse FG', 'Pending Warehouse Delivery Approval', 'Ready for Customer Pickup from Factory']),
      sbClient.from('spare_parts_requests').select('*').order('created_at', {ascending: false}),
      sbClient.from('raw_material_receipts').select('*').eq('status', 'pending_warehouse')
    ]).then(function(res) {
      var err = res.find(function(r) { return r && r.error; });
      if (err) {
        console.error(err.error);
        el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-danger)"><h2>Error Loading Inventory</h2><p>' + err.error.message + '</p></div>';
        return;
      }
      items = res[0].data || [];
      transactions = res[1].data || [];
      matReqs = res[2].data || [];
      qualityOrders = res[3] ? (res[3].data || []) : [];
      sparePartsReqs = res[4] ? (res[4].data || []) : [];
      rawPending = res[5] ? (res[5].data || []) : [];
      render();
    }).catch(function(err) {
      console.error(err);
      el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-danger)"><h2>Error Loading Inventory</h2><p>' + err.message + '</p></div>';
    });
  }

  function render() {
    var rawItems = items.filter(function(i){return !i.warehouse_type || i.warehouse_type==='raw'});
    var finishedItems = items.filter(function(i){return i.warehouse_type==='finished'});
    var generalItems = items.filter(function(i){return i.warehouse_type==='general'});
    var pendingMR = matReqs.filter(function(m){return m.status==='pending'||m.status==='approved'||m.status==='tool_out'});
    var pendingSpare = sparePartsReqs.filter(function(r){return r.status==='approved'||r.status==='issued'});

    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<div style="display:flex; gap:8px;">';
    html += '<button class="btn btn-sm btn-outline" id="tab-items" style="border-color:var(--accent-primary); color:var(--accent-primary)">📦 مخزن خام (Raw)</button>';
    if (!isPlanning) {
      html += '<button class="btn btn-sm btn-ghost" id="tab-finished">📦 مخزن تام (Finished)</button>';
      html += '<button class="btn btn-sm btn-ghost" id="tab-general">📦 مخزن عام (General)</button>';
      html += '<button class="btn btn-sm btn-ghost" id="tab-tx">Transactions (حركة المخزون)</button>';
      if(pendingMR.length>0) html += '<button class="btn btn-sm btn-ghost" id="tab-mr" style="color:var(--accent-warning)">⚠️ Material Requests ('+pendingMR.length+')</button>';
      if(isWarehouse && pendingSpare.length>0) html += '<button class="btn btn-sm btn-ghost" id="tab-spare" style="color:var(--accent-primary)">⚙️ قطع الغيار ('+pendingSpare.length+')</button>';
    }
    html += '</div>';
        if (isWarehouse) {
      html += '<div>';
      html += '<button class="btn btn-outline" id="btn-request-purchase" onclick="warehousePurchaseRequestModal()" style="margin-right:10px; border-color:#3b82f6; color:#3b82f6; display:none;">' + icon('shoppingCart') + ' Request Purchase (طلب شراء)</button>';
      html += '<button class="btn btn-primary" onclick="newInventoryItemModal()" style="margin-right:10px">' + icon('plus') + ' Add New Item</button>';
      html += '<button class="btn btn-success" onclick="newTransactionModal()">' + icon('refreshCw') + ' Add Transaction (صرف/إضافة)</button>';
      html += '</div>';
    }
    html += '</div>';

    // Helper: render life_time_percentage badge from DB column
    function lifeTimeBadge(lt) {
      if (lt === null || lt === undefined) return '<span style="color:var(--text-muted);font-size:0.8rem">لا يوجد بيانات</span>';
      var ltColor = lt >= 75 ? 'var(--accent-success)' : lt >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';
      return '<span style="color:' + ltColor + ';font-weight:700;font-size:1.1rem">' + Math.round(lt) + '%</span>';
    }

    // Raw Items View
    html += '<div id="view-items">';

    // Incoming Raw Materials Section
    if (rawPending.length > 0 && isWarehouse) {
      html += '<div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-warning)"><div class="card-header" style="background:rgba(245,158,11,0.05)"><div><h3 style="color:var(--accent-warning)">📥 وارد من قسم الجودة (مخزن الخام)</h3><p>خامات تم استلامها واعتمادها بانتظار استلام المخزن</p></div></div><div class="card-body no-pad">';
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>تاريخ الاعتماد</th><th>الخامة</th><th>الكمية المقبولة</th><th>الإجراء</th></tr></thead><tbody>';
      rawPending.forEach(function(rp) {
        html += '<tr><td>' + formatDate(rp.qc_date || rp.created_at) + '</td><td><strong>' + rp.item_name + '</strong></td><td><strong style="font-size:1.1rem;color:var(--text-primary)">' + rp.quantity_accepted + '</strong></td>';
        html += '<td><button class="btn btn-sm btn-success" onclick="window.warehouseReceiveRaw(\''+rp.id+'\',\''+rp.item_name+'\','+rp.quantity_accepted+')">تأكيد استلام المخزن</button></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    html += '<div class="card"><div class="card-header"><div><h3>📦 مخزن خام - Raw Materials Warehouse</h3><p>' + rawItems.length + ' items</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Item Name</th><th>Category</th><th>Current Qty</th><th>Min Qty</th><th>Life Time %</th><th>Alert</th></tr></thead><tbody>';
    
    if (rawItems.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No raw materials.</td></tr>';
    } else {
      rawItems.forEach(function(item) {
        var isLow = item.quantity <= item.min_quantity;
        var rowStyle = isLow ? 'background:rgba(245,158,11,0.05)' : '';
        html += '<tr style="' + rowStyle + '">';
        html += '<td style="font-weight:600">' + item.name + '</td>';
        html += '<td><span class="badge badge-info">' + item.category + '</span></td>';
        html += '<td style="font-weight:700; font-size:1.1rem; color:' + (isLow ? 'var(--accent-danger)' : 'var(--text-primary)') + '">' + item.quantity + '</td>';
        html += '<td>' + item.min_quantity + '</td>';
        html += '<td>' + lifeTimeBadge(item.life_time_percentage) + '</td>';
        html += '<td>' + (isLow ? '<span class="badge badge-danger">⚠️ Low Stock</span>' : '<span class="badge badge-success">OK</span>') + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';;

    // Finished Goods View
    html += '<div id="view-finished" style="display:none">';
    
    var qOrders = qualityOrders.filter(function(o) { return o.status === 'Pending Warehouse FG'; });
    var deliveryApprovals = qualityOrders.filter(function(o) { return o.status === 'Pending Warehouse Delivery Approval'; });
    var readyPickups = qualityOrders.filter(function(o) { return o.status === 'Ready for Customer Pickup from Factory'; });

    // Quality Transfer Section
    if (qOrders.length > 0 && isWarehouse) {
      html += '<div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-success)"><div class="card-header" style="background:rgba(16,185,129,0.05)"><div><h3 style="color:var(--accent-success)">📥 وارد من قسم الجودة (مخزن التام)</h3><p>طلبات إنتاج معتمدة من الجودة بانتظار استلام المخزن</p></div></div><div class="card-body no-pad">';
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>تاريخ الاعتماد</th><th>المنتج</th><th>الكمية المنتجة</th><th>الإجراء</th></tr></thead><tbody>';
      qOrders.forEach(function(qo) {
        var qty = qo.quantity_available !== null ? qo.quantity_available : qo.quantity_requested;
        html += '<tr><td>' + formatDate(qo.created_at) + '</td><td><strong>' + qo.product_name + '</strong></td><td><strong style="font-size:1.1rem;color:var(--text-primary)">' + qty + '</strong></td>';
        html += '<td><button class="btn btn-sm btn-success" onclick="window.warehouseReceiveQuality(\''+qo.id+'\')">تأكيد استلام المخزن وإرسال للتخطيط</button></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    // Delivery Approvals Section
    if (deliveryApprovals.length > 0 && isWarehouse) {
      html += '<div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-warning)"><div class="card-header" style="background:rgba(245,158,11,0.05)"><div><h3 style="color:var(--accent-warning)">⏳ مراجعة المخزن لتسليم العميل</h3><p>طلبات تم الدفع لها وتنتظر موافقة أمين المخزن على التسليم النهائي</p></div></div><div class="card-body no-pad">';
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>العميل</th><th>المنتج</th><th>الكمية</th><th>الإجراء</th></tr></thead><tbody>';
      deliveryApprovals.forEach(function(da) {
        html += '<tr><td>' + formatDate(da.created_at) + '</td><td><strong>' + da.customer_name + '</strong></td><td>' + da.product_name + '</td><td><strong style="font-size:1.1rem;color:var(--text-primary)">' + da.quantity_requested + '</strong></td>';
        html += '<td><div style="display:flex;gap:4px;"><button class="btn btn-sm btn-success" onclick="window.warehouseApproveDelivery(\''+da.id+'\')">موافق على التسليم</button><button class="btn btn-sm btn-danger" onclick="window.warehouseRejectDelivery(\''+da.id+'\')">رفض</button></div></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    // Ready Pickups Section
    if (readyPickups.length > 0 && isWarehouse) {
      html += '<div class="card" style="margin-bottom:20px;border-left:4px solid var(--accent-primary)"><div class="card-header" style="background:rgba(59,130,246,0.05)"><div><h3 style="color:var(--accent-primary)">📦 طلبات جاهزة للاستلام من المصنع</h3><p>طلبات معتمدة وتنتظر حضور العميل لاستلامها</p></div></div><div class="card-body no-pad">';
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>العميل</th><th>المنتج</th><th>الكمية</th><th>الإجراء</th></tr></thead><tbody>';
      readyPickups.forEach(function(rp) {
        html += '<tr><td>' + formatDate(rp.created_at) + '</td><td><strong>' + rp.customer_name + '</strong></td><td>' + rp.product_name + '</td><td><strong style="font-size:1.1rem;color:var(--text-primary)">' + rp.quantity_requested + '</strong></td>';
        html += '<td><button class="btn btn-sm btn-primary" onclick="window.warehouseConfirmCustomerPickup(\''+rp.id+'\', \'' + rp.product_name + '\', ' + rp.quantity_requested + ')">تأكيد استلام العميل (تسليم نهائي)</button></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    html += '<div class="card"><div class="card-header"><div><h3>📦 مخزن تام - Finished Goods Warehouse</h3><p>' + finishedItems.length + ' products</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Product Name</th><th>Category</th><th>Qty in Stock</th><th>Status</th>' + ((isWarehouse || isSalesCoord) ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    if (finishedItems.length === 0) {
      html += '<tr><td colspan="' + ((isWarehouse || isSalesCoord) ? '5' : '4') + '" style="text-align:center;padding:40px;color:var(--text-muted)">No finished goods yet. Products pass through Quality → here.</td></tr>';
    } else {
      finishedItems.forEach(function(item) {
        html += '<tr><td style="font-weight:600">' + item.name + '</td>';
        html += '<td><span class="badge badge-success">Finished Product</span></td>';
        html += '<td style="font-weight:700;font-size:1.1rem">' + item.quantity + '</td>';
        html += '<td><span class="badge badge-success">Ready to Ship</span></td>';
        
        if (isWarehouse || isSalesCoord) {
          html += '<td>';
          if (isWarehouse) {
            html += '<button class="btn btn-xs btn-primary" onclick="dispatchFinishedGoods(\'' + item.id + '\', \'' + item.name.replace(/'/g,"\\'") + '\')">Dispatch (صرف تام)</button>';
          }
          if (isSalesCoord) {
            html += '<button class="btn btn-xs btn-warning" style="margin-left:4px" onclick="requestProduction(\'' + item.name.replace(/'/g,"\\'") + '\')">Request Prod. (تخطيط)</button>';
          }
          html += '</td>';
        }
        
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    // General Goods View
    html += '<div id="view-general" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>📦 مخزن عام - General Warehouse</h3><p>' + generalItems.length + ' items</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Item Name</th><th>Category</th><th>Current Qty</th><th>Min Qty</th><th>Life Time %</th><th>Alert</th></tr></thead><tbody>';
    
    if (generalItems.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No general items.</td></tr>';
    } else {
      generalItems.forEach(function(item) {
        var isLow = item.quantity <= item.min_quantity;
        var rowStyle = isLow ? 'background:rgba(245,158,11,0.05)' : '';
        html += '<tr style="' + rowStyle + '">';
        html += '<td style="font-weight:600">' + item.name + '</td>';
        html += '<td><span class="badge badge-info">' + item.category + '</span></td>';
        html += '<td style="font-weight:700; font-size:1.1rem; color:' + (isLow ? 'var(--accent-danger)' : 'var(--text-primary)') + '">' + item.quantity + '</td>';
        html += '<td>' + item.min_quantity + '</td>';
        html += '<td>' + lifeTimeBadge(item.life_time_percentage) + '</td>';
        html += '<td>' + (isLow ? '<span class="badge badge-danger">⚠️ Low Stock</span>' : '<span class="badge badge-success">OK</span>') + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    // Transactions View
    html += '<div id="view-tx" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>Inventory Transactions (حركة المخزون)</h3><p>Recent IN/OUT operations</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Qty</th><th>Requested By</th><th>Processed By</th></tr></thead><tbody>';
    if (transactions.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No transactions yet.</td></tr>';
    } else {
      transactions.forEach(function(tx) {
        var isOut = tx.transaction_type === 'out';
        html += '<tr><td>' + formatDate(tx.date) + '</td>';
        html += '<td style="font-weight:600">' + tx.item_name + '</td>';
        html += '<td><span class="badge badge-' + (isOut ? 'warning' : 'success') + '">' + (isOut ? 'OUT (صرف)' : 'IN (إضافة)') + '</span></td>';
        html += '<td style="font-weight:700">' + (isOut ? '-' : '+') + tx.quantity + '</td>';
        html += '<td>' + (tx.requested_by || '-') + '</td>';
        html += '<td>' + (tx.processed_by || '-') + '</td></tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    // Material Requests View
    html += '<div id="view-mr" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>⚠️ Material Requests (طلبات الصرف)</h3><p>' + pendingMR.length + ' pending</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Material</th><th>Qty Needed</th><th>Issued</th><th>Requested By</th><th>Status</th>';
    if(isWarehouse) html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    if (matReqs.length === 0) {
      html += '<tr><td colspan="'+(isWarehouse?7:6)+'" style="text-align:center;padding:40px;color:var(--text-muted)">No material requests</td></tr>';
    } else {
      matReqs.forEach(function(m) {
        var sBadge = 'warning';
        if(m.status === 'issued') sBadge = 'success';
        else if(m.status === 'approved') sBadge = 'info';
        else if(m.status === 'rejected') sBadge = 'danger';
        else if(m.status === 'tool_out') sBadge = 'primary';
        else if(m.status === 'returned') sBadge = 'secondary';
        html += '<tr><td>' + formatDate(m.created_at) + '</td>';
        html += '<td style="font-weight:600">' + m.item_name + '</td>';
        html += '<td style="font-weight:700">' + m.quantity_needed + '</td>';
        html += '<td>' + (m.quantity_issued||0) + '</td>';
        html += '<td>' + (m.requested_by||'-') + '</td>';
        html += '<td><span class="badge badge-' + sBadge + '">' + m.status.toUpperCase() + '</span></td>';
        if(isWarehouse) {
          html += '<td>';
          if(m.status==='pending') {
            var isTool = m.requested_by && m.requested_by.indexOf('Maintenance (Tool)') !== -1;
            html += '<button class="btn btn-xs btn-success" onclick="issueMaterial(\''+m.id+'\',\''+m.item_id+'\','+m.quantity_needed+', ' + isTool + ', this)">✅ Issue (صرف)</button>';
            html += ' <button class="btn btn-xs btn-danger" onclick="rejectMaterial(\''+m.id+'\')">❌ Reject</button>';
          } else if(m.status === 'tool_out') {
            html += '<button class="btn btn-xs btn-primary" onclick="returnToolMaterial(\''+m.id+'\',\''+m.item_name.replace(/'/g,"\\'")+'\','+m.quantity_needed+')">🔄 Return (تم استرجاعها)</button>';
          } else { html += '<span style="font-size:0.75rem;color:var(--text-muted)">Done</span>'; }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div></div>';

    // ---- Spare Parts Pending View (Warehouse) ----
    if (isWarehouse) {
      html += '<div id="view-spare" style="display:none">';
      html += '<div class="card"><div class="card-header"><div><h3>⚙️ طلبات صرف قطع الغيار</h3><p>الطلبات المعتمدة والمنتظر استرجاع التالفة</p></div></div><div class="card-body no-pad">';
      html += '<div class="table-container"><table class="data-table"><thead><tr><th>التاريخ</th><th>الموظف / القسم</th><th>المعدة</th><th>القطعة</th><th>الحالة</th><th>آخر فحص جودة لها</th><th>الإجراء</th></tr></thead><tbody>';

      var spareToShow = sparePartsReqs.filter(function(r) { return r.status === 'approved' || r.status === 'issued' || r.status === 'damaged_returned'; });
      if (spareToShow.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد طلبات معلقة لقطع الغيار</td></tr>';
      } else {
        spareToShow.forEach(function(r) {
          // Find last quality check for same item name
          var lastQC = sparePartsReqs.filter(function(x) {
            return x.item_name === r.item_name && x.status === 'quality_checked' && x.life_time_percentage;
          }).sort(function(a, b) { return new Date(b.quality_checked_at) - new Date(a.quality_checked_at); })[0];

          var stBadge = r.status === 'approved' ? '<span class="badge badge-info">معتمد (في انتظار الصرف)</span>' :
                        r.status === 'issued' ? '<span class="badge badge-primary">تم الصرف (في انتظار التالف)</span>' :
                        '<span class="badge badge-warning">تم استلام التالف (في انتظار الجودة)</span>';

          var lastQCHtml = lastQC ?
            '<span style="color:var(--accent-' + (lastQC.life_time_percentage >= 75 ? 'success' : lastQC.life_time_percentage >= 50 ? 'warning' : 'danger') + ');font-weight:bold">' + lastQC.life_time_percentage + '% عمر</span> <small style="color:var(--text-muted)">(' + (lastQC.is_natural_wear ? 'طبيعي' : 'سوء استخدام') + ')</small>' :
            '<span style="color:var(--text-muted);font-size:0.8rem">لا يوجد سجل سابق</span>';

          html += '<tr>';
          html += '<td>' + formatDate(r.created_at) + '</td>';
          html += '<td>' + r.requested_by_name + '<br><small>' + (r.department || '') + '</small></td>';
          html += '<td style="font-weight:600">' + (r.machine_or_vehicle || '-') + '</td>';
          html += '<td>' + r.item_name + ' <small>(كمية: ' + r.requested_quantity + ')</small></td>';
          html += '<td>' + stBadge + '</td>';
          html += '<td>' + lastQCHtml + '</td>';
          html += '<td>';
          if (r.status === 'approved') {
            html += '<button class="btn btn-sm btn-info" onclick="window.whIssueSpare(\'' + r.id + '\')">صرف القطعة الجديدة</button>';
          } else if (r.status === 'issued') {
            html += '<button class="btn btn-sm btn-warning" onclick="window.whReceiveSpare(\'' + r.id + '\')">استلام التالف</button>';
          } else {
            html += '<span style="color:var(--text-muted);font-size:0.8rem">تم - في انتظار الجودة</span>';
          }
          html += '</td>';
          html += '</tr>';
        });
      }
      html += '</tbody></table></div></div></div></div>';
    }

    el.innerHTML = html;

    window.warehouseApproveDelivery = function(id) {
      if(!confirm('هل أنت متأكد من جاهزية الأوردر للاستلام ومطابقته للجودة والكمية؟')) return;
      sbClient.from('sales_workflow_orders').update({
        status: 'Ready for Customer Pickup from Factory'
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);
        showToast('تم اعتماد التسليم من المخزن. بانتظار استلام العميل.', 'success');
        loadData();
      });
    };

    window.warehouseRejectDelivery = function(id) {
      var reason = prompt('يرجى إدخال سبب عدم الموافقة على تسليم الأوردر (نقص كمية، مشكلة جودة...):');
      if (!reason) return;
      sbClient.from('sales_workflow_orders').update({
        status: 'Rejected By Warehouse',
        warehouse_rejection_reason: reason
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);
        showToast('تم إيقاف التسليم وتسجيل السبب.', 'warning');
        loadData();
      });
    };

    window.warehouseConfirmCustomerPickup = function(id, productName, qty) {
      var b = '<div class="form-grid">';
      b += '<div class="form-group"><label>اسم المستلم (العميل أو المندوب) *</label><input type="text" id="rcv-name" class="form-input"></div>';
      b += '<div class="form-group"><label>رقم الهوية / التفويض</label><input type="text" id="rcv-id" class="form-input"></div>';
      b += '</div>';
      App.showModal('تأكيد الاستلام النهائي وتسليم البضاعة', b, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="btn-confirm-pickup">تأكيد التسليم وخصم المخزون</button>');
      
      document.getElementById('btn-confirm-pickup').onclick = function() {
        var rcvName = document.getElementById('rcv-name').value;
        var rcvId = document.getElementById('rcv-id').value;
        if (!rcvName) return alert('يرجى إدخال اسم المستلم');
        
        var btn = document.getElementById('btn-confirm-pickup');
        btn.disabled = true; btn.innerHTML = 'جاري التنفيذ...';

        sbClient.from('inventory_items').select('id, quantity').ilike('name', '%' + productName + '%').single().then(function(invRes) {
          if (!invRes.error && invRes.data) {
            var newQty = invRes.data.quantity - qty;
            sbClient.from('inventory_items').update({quantity: newQty}).eq('id', invRes.data.id).then(function() {});
          }
          sbClient.from('sales_workflow_orders').update({
            status: 'Delivered',
            receiver_name: rcvName,
            receiver_id_number: rcvId,
            receive_time: new Date().toISOString()
          }).eq('id', id).then(function(res) {
            App.closeModal();
            if(res.error) return alert(res.error.message);
            showToast('تم التسليم للعميل وخصم الكمية من المخزون بنجاح!', 'success');
            loadData();
          });
        });
      };
    };

    window.warehouseReceiveQuality = function(id) {
      if(!confirm('تأكيد استلام المنتجات من الجودة وإضافتها لمخزن التام وإعلام التخطيط؟')) return;
      if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');
      
      // Get order details to update inventory
      sbClient.from('sales_workflow_orders').select('product_name, quantity_available').eq('id', id).single().then(function(r) {
        if (!r.error && r.data) {
          var qty = r.data.quantity_available || 0;
          sbClient.from('inventory_items').select('id, quantity').ilike('name', r.data.product_name).then(function(inv) {
            if (inv.data && inv.data.length > 0) {
              sbClient.from('inventory_items').update({ quantity: (inv.data[0].quantity || 0) + qty }).eq('id', inv.data[0].id).then(function() {});
            } else {
              sbClient.from('inventory_items').insert({
                name: r.data.product_name,
                category: 'Finished Good',
                quantity: qty,
                min_quantity: 0,
                warehouse_type: 'finished'
              }).then(function() {});
            }
          });
        }
        window.SalesWorkflow.updateStatus(id, 'Received by Warehouse', {}, loadData);
      });
    };

    window.warehouseReceiveRaw = function(id, itemName, acceptedQty) {
      if(!confirm('تأكيد استلام ' + acceptedQty + ' من الخامة (' + itemName + ') وإضافتها للمخزن؟')) return;
      
      sbClient.from('inventory_items').select('id, quantity').ilike('name', itemName).then(function(invRes) {
        if (invRes.data && invRes.data.length > 0) {
          var item = invRes.data[0];
          sbClient.from('inventory_items').update({ quantity: (item.quantity || 0) + acceptedQty }).eq('id', item.id).then(function() {});
        } else {
          sbClient.from('inventory_items').insert({
            name: itemName,
            category: 'Raw Material',
            quantity: acceptedQty,
            min_quantity: 5,
            warehouse_type: 'raw'
          }).then(function() {});
        }
        
        sbClient.from('raw_material_receipts').update({ status: 'warehouse_received' }).eq('id', id).then(function(res) {
          if (!res.error) loadData();
        });
      });
    };

    // Tab switching
    var allTabs = ['tab-items','tab-finished','tab-general','tab-tx','tab-mr','tab-spare'];
    var allViews = ['view-items','view-finished','view-general','view-tx','view-mr','view-spare'];
    function switchTab(activeTab, activeView) {
      allTabs.forEach(function(t) { var e=document.getElementById(t); if(e){e.className='btn btn-sm btn-ghost';e.style.borderColor='transparent';e.style.color='inherit';} });
      allViews.forEach(function(v) { var e=document.getElementById(v); if(e) e.style.display='none'; });
      var at=document.getElementById(activeTab); if(at){at.className='btn btn-sm btn-outline';at.style.borderColor='var(--accent-primary)';at.style.color='var(--accent-primary)';}
      var av=document.getElementById(activeView); if(av) av.style.display='block';
      
      var prBtn = document.getElementById('btn-request-purchase');
      if (prBtn) {
        prBtn.style.display = (activeTab === 'tab-general') ? 'inline-block' : 'none';
      }
      
      if (activeTab === 'tab-items') window.currentWarehouseTab = 'raw';
      else if (activeTab === 'tab-finished') window.currentWarehouseTab = 'finished';
      else if (activeTab === 'tab-general') window.currentWarehouseTab = 'general';
    }
    allTabs.forEach(function(t,i) { var e=document.getElementById(t); if(e) e.addEventListener('click', function(){switchTab(t,allViews[i]);}); });

    // Spare Parts actions
    window.whIssueSpare = function(id) {
      var body = '<div class="form-field"><label>رقم تسلسل القطعة الجديدة (المنصرفة) *</label><input type="text" id="wh-sp-new-num" class="form-input"></div>';
      body += '<p style="color:var(--accent-warning);font-size:0.9rem">لن يتم إغلاق العملية إلا بعد استلام القطعة التالفة القديمة.</p>';
      App.showModal('صرف القطعة الجديدة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-info" id="wh-sp-issue-save">صرف القطعة</button>');
      document.getElementById('wh-sp-issue-save').onclick = function() {
        var newNum = document.getElementById('wh-sp-new-num').value;
        if (!newNum) return alert('أدخل رقم القطعة الجديدة');
        sbClient.from('spare_parts_requests').update({
          status: 'issued', new_part_number: newNum, issued_at: new Date().toISOString(), issued_by: App.user.id
        }).eq('id', id).then(function(res) {
          if(res.error) return alert(res.error.message);
          App.closeModal(); loadData(); showToast('تم صرف القطعة بنجاح', 'success');
        });
      };
    };

    window.whReceiveSpare = function(id) {
      var body = '<div class="form-field"><label>رقم القطعة التالفة (المرتجعة) *</label><input type="text" id="wh-sp-old-num" class="form-input"></div>';
      App.showModal('استلام القطعة التالفة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-warning" id="wh-sp-rec-save">تأكيد الاستلام</button>');
      document.getElementById('wh-sp-rec-save').onclick = function() {
        var oldNum = document.getElementById('wh-sp-old-num').value;
        if (!oldNum) return alert('أدخل رقم القطعة التالفة');
        sbClient.from('spare_parts_requests').update({
          status: 'damaged_returned', old_part_number: oldNum, returned_at: new Date().toISOString(), received_by: App.user.id
        }).eq('id', id).then(function(res) {
          if(res.error) return alert(res.error.message);
          App.closeModal(); loadData(); showToast('تم استلام التالف وتحويله للجودة', 'success');
        });
      };
    };
  }

  window.newInventoryItemModal = function() {
    var whValue = window.currentWarehouseTab || 'raw';
    var whLabel = whValue === 'raw' ? 'مخزن خام (Raw)' : (whValue === 'finished' ? 'مخزن تام (Finished)' : 'مخزن عام (General)');
    
    var body = '<div class="form-field"><label>Item Name *</label><input type="text" id="inv-name" class="form-input"></div>';
    body += '<div class="form-row"><div class="form-field"><label>Category *</label><select id="inv-cat" class="form-input"><option value="Maintenance">Maintenance (قطع غيار صيانة)</option><option value="Workshop">Workshop (ورشة)</option><option value="Supplies">Supplies (مستلزمات)</option><option value="Chemicals">Chemicals (كيماويات)</option><option value="Raw Material">Raw Material (خامات)</option><option value="Finished Good">Finished Good (منتج تام)</option><option value="Spare Part">Spare Part (قطع غيار)</option><option value="Packaging">Packaging (تغليف)</option><option value="Tools">Tools (أدوات)</option><option value="Other">Other (أخرى)</option></select></div>';
    body += '<div class="form-field"><label>Warehouse (المخزن)</label><input type="text" class="form-input" disabled value="' + whLabel + '"><input type="hidden" id="inv-wh" value="' + whValue + '"></div></div>';
    body += '<div class="form-field"><label>Minimum Qty Alert *</label><input type="number" id="inv-min" class="form-input" value="2"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-inv-btn">Save Item</button>';
    App.showModal('Add New Inventory Item', body, footer);

    document.getElementById('save-inv-btn').addEventListener('click', function() {
      var name = document.getElementById('inv-name').value;
      var cat = document.getElementById('inv-cat').value;
      var min = parseInt(document.getElementById('inv-min').value);
      if(!name) return alert('Name is required');

      sbClient.from('inventory_items').insert([{
        name: name, category: cat, min_quantity: min || 0, quantity: 0, warehouse_type: document.getElementById('inv-wh').value
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
      
      var type = document.getElementById('tx-type').value;
      var qty = parseInt(document.getElementById('tx-qty').value);
      var reqBy = document.getElementById('tx-req').value;
      var newSupplier = document.getElementById('tx-supplier').value;
      var newPrice = document.getElementById('tx-price').value;

      if(!itemId || isNaN(qty) || qty <= 0) return alert('Please fill all fields with valid positive quantity');

      document.getElementById('save-tx-btn').disabled = true;
      document.getElementById('save-tx-btn').textContent = 'Processing...';

      // Re-fetch current quantity to avoid concurrency issues
      sbClient.from('inventory_items').select('quantity').eq('id', itemId).single().then(function(res) {
        if (res.error || !res.data) {
          alert('Item not found in database');
          return resetBtn();
        }
        var currentQty = res.data.quantity;

        if (type === 'out' && qty > currentQty) {
          alert('Not enough stock! Current database stock is: ' + currentQty);
          return resetBtn();
        }

        var newQty = type === 'in' ? currentQty + qty : currentQty - qty;
        var updateData = { quantity: newQty };
        if (type === 'in') {
          if (newSupplier) updateData.supplier_name = newSupplier;
          if (newPrice) updateData.last_purchase_price = parseFloat(newPrice);
        }

        sbClient.from('inventory_items').update(updateData).eq('id', itemId).then(function(r) {
          if(r.error) {
            alert(r.error.message);
            return resetBtn();
          }
          
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

      function resetBtn() {
        var btn = document.getElementById('save-tx-btn');
        if (btn) { btn.disabled = false; btn.textContent = 'Process Transaction'; }
      }
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
    
    body += '<div class="form-field"><label>Description (الوصف) *</label><textarea id="wh-pr-desc" class="form-input" rows="2" placeholder="مواصفات الصنف..."></textarea></div>';
    body += '<div class="form-row">';
    body += '<div class="form-field"><label>Quantity Required *</label><input type="number" id="wh-pr-qty" class="form-input" min="1" value="1"></div>';
    body += '<div class="form-field"><label>Unit (الوحدة) *</label><select id="wh-pr-unit" class="form-input"><option value="Piece">Piece (قطعة)</option><option value="Kilogram">Kilogram (كجم)</option><option value="Liter">Liter (لتر)</option><option value="Meter">Meter (متر)</option><option value="Box">Box (كرتونة)</option></select></div>';
    body += '</div>';
    body += '<div class="form-field"><label>Delivery Date (ميعاد التوريد المطلوب) *</label><input type="date" id="wh-pr-date" class="form-input"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-wh-pr-btn">Submit Request to Procurement</button>';
    App.showModal('Request Purchase (طلب شراء)', body, footer);

    document.getElementById('save-wh-pr-btn').addEventListener('click', function() {
      var nameInput = document.getElementById('wh-pr-item-name').value;
      var qty = parseInt(document.getElementById('wh-pr-qty').value);
      var descInput = document.getElementById('wh-pr-desc').value;
      var unitInput = document.getElementById('wh-pr-unit').value;
      var dateInput = document.getElementById('wh-pr-date').value;
      if(!nameInput || !qty || !descInput || !dateInput) return alert('Please fill in all required fields');

      var matchedItem = items.find(function(i) { return i.name.toLowerCase() === nameInput.toLowerCase(); });
      var itemId = matchedItem ? matchedItem.id : null;

      sbClient.from('purchase_requests').insert([{
        item_id: itemId, item_name: nameInput, requested_quantity: qty,
        description: descInput, unit: unitInput, delivery_date: dateInput,
        status: 'pending', requested_by: App.user.full_name + ' (Warehouse)'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal();
        showToast('Purchase request sent to Procurement successfully', 'success');
      });
    });
  };

  window.issueMaterial = function(mrId, itemId, qty, isTool, btnEl) {
    if (isNaN(qty) || qty <= 0) return alert('Invalid requested quantity');
    var confirmMsg = isTool ? 'Issue ' + qty + ' units as a Tool (عُهدة) to Maintenance?' : 'Issue ' + qty + ' units from Warehouse?';
    if(!confirm(confirmMsg)) return;

    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Processing...'; }

    var resetBtn = function() { if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Issue (صرف)'; } };

    var doIssue = function() {
      var nextStatus = isTool ? 'tool_out' : 'issued';
      sbClient.from('material_requests').update({status: nextStatus, quantity_issued: qty, approved_by: App.user.full_name}).eq('id', mrId).then(function(r2) {
        if(r2.error) { alert(r2.error.message); return resetBtn(); }
        
        if(itemId && itemId !== 'null' && itemId !== 'undefined') {
          var item = items.find(function(i){return i.id===itemId});
          sbClient.from('inventory_transactions').insert([{
            item_id: itemId, item_name: item ? item.name : 'Unknown',
            transaction_type: 'out', quantity: qty,
            requested_by: isTool ? 'Maintenance' : 'Production', processed_by: App.user.full_name
          }]).then(function() {
            loadData();
            showToast('Issued successfully', 'success');
          });
        } else {
          loadData();
          showToast('Issued successfully', 'success');
        }
      });
    };

    if(itemId && itemId !== 'null' && itemId !== 'undefined') {
      sbClient.from('inventory_items').select('quantity').eq('id', itemId).single().then(function(res) {
        if(res.error || !res.data) { alert('Item not found'); return resetBtn(); }
        var currentQty = res.data.quantity;
        if(qty > currentQty) { alert('Not enough stock! Current: ' + currentQty); return resetBtn(); }
        sbClient.from('inventory_items').update({quantity: currentQty - qty}).eq('id', itemId).then(function(r) {
          if(r.error) { alert(r.error.message); return resetBtn(); }
          doIssue();
        });
      });
    } else {
      doIssue();
    }
  };

  window.returnToolMaterial = function(mrId, itemName, qty) {
    if(!confirm('Mark ' + itemName + ' as returned to the warehouse?')) return;
    
    sbClient.from('material_requests').update({status: 'returned', approved_by: App.user.full_name}).eq('id', mrId).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData();
      showToast('Tool marked as returned!', 'success');
    });
  };

  window.rejectMaterial = function(mrId) {
    if(!confirm('Reject this material request?')) return;
    sbClient.from('material_requests').update({status: 'rejected', approved_by: App.user.full_name}).eq('id', mrId).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData();
      showToast('Material request rejected', 'warning');
    });
  };

  window.dispatchFinishedGoods = function(itemId, itemName) {
    var b = '<div class="form-field"><label>Dispatch Quantity (الكمية المنصرفة) *</label><input type="number" id="fg-qty" class="form-input" min="1" value="1"></div>';
    b += '<div class="form-field"><label>Destination Type (جهة الصرف) *</label><select id="fg-type" class="form-input">';
    b += '<option value="عملاء (Customers)">عملاء (Customers)</option>';
    b += '<option value="مناديب بيع (Sales Reps)">مناديب بيع (Sales Reps)</option>';
    b += '<option value="فروع (Branches)">فروع (Branches)</option>';
    b += '<option value="سلاسل / منصات (Amazon, Noon)">سلاسل / منصات (Amazon, Noon)</option>';
    b += '<option value="أخرى (Other)">أخرى (Other)</option>';
    b += '</select></div>';
    b += '<div class="form-field"><label>Destination Details / Name (اسم العميل/الفرع/المندوب)</label><input type="text" id="fg-dest" class="form-input" placeholder="e.g. Amazon, Branch 1, Ahmed (Rep)"></div>';
    
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-fg-btn">Confirm Dispatch</button>';
    App.showModal('Dispatch Finished Goods - ' + itemName, b, f);

    document.getElementById('save-fg-btn').addEventListener('click', function() {
      var qty = parseFloat(document.getElementById('fg-qty').value);
      var typ = document.getElementById('fg-type').value;
      var dest = document.getElementById('fg-dest').value.trim();
      if (!qty || isNaN(qty) || qty <= 0) return alert('Invalid quantity');
      
      var notes = 'جهة الصرف: ' + typ + (dest ? ' - ' + dest : '');

      sbClient.from('inventory_items').select('quantity').eq('id', itemId).single().then(function(res) {
        if(res.error) return alert(res.error.message);
        var curQty = res.data.quantity;
        if(curQty < qty) return alert('Insufficient stock. Available: ' + curQty);
        
        sbClient.from('inventory_items').update({quantity: curQty - qty}).eq('id', itemId).then(function() {
          sbClient.from('inventory_transactions').insert([{
            item_id: itemId, item_name: itemName,
            transaction_type: 'out', quantity: qty,
            processed_by: App.user.full_name,
            notes: notes
          }]).then(function(r) {
            App.closeModal(); loadData();
            showToast('Goods dispatched successfully', 'success');
          });
        });
      });
    });
  };

  window.requestProduction = function(itemName) {
    var b = '<div class="form-field"><label>Required Quantity (الكمية المطلوبة للإنتاج) *</label><input type="number" id="rp-qty" class="form-input" min="1" value="100"></div>';
    b += '<div class="form-field"><label>Notes / Deadline (ملاحظات أو ميعاد التسليم)</label><textarea id="rp-notes" class="form-input" rows="2"></textarea></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-success" id="save-rp-btn">Send to Planning</button>';
    App.showModal('Request Production - ' + itemName, b, f);

    document.getElementById('save-rp-btn').addEventListener('click', function() {
      var qty = parseFloat(document.getElementById('rp-qty').value);
      var notes = document.getElementById('rp-notes').value.trim();
      if (!qty || isNaN(qty) || qty <= 0) return alert('Invalid quantity');

      var itemsArr = [{ name: itemName, qty: qty, price: 0 }];
      
      sbClient.from('sales_orders').insert({
        client_name: 'Warehouse Replenishment (طلب داخلي)',
        items: JSON.stringify(itemsArr),
        total_amount: 0,
        status: 'sent_to_planning',
        sales_rep: App.user.full_name,
        notes: 'Sales Coordinator Request: ' + notes
      }).then(function(r) {
        if (r.error) return alert(r.error.message);
        App.closeModal();
        showToast('Request sent to Planning successfully', 'success');
      });
    });
  };

  loadData();
};

// ==========================================
// MODULE 9: Procurement & Purchase Requests
// ==========================================
Pages.purchaseRequests = function(el) {
  var isAllowed = App.isOwner() || (App.user && (App.user.role === 'hr manager' || App.user.department === 'Finance' || App.user.department === 'Procurement'));
  if (!isAllowed) {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-danger)"><h3>Access Denied</h3><p>This module is restricted to Procurement, Finance, HR, and Owner.</p></div>';
    return;
  }

  var isProcurementMgr = App.user && App.user.role === 'procurement manager';
  var isProcurementSpec = App.user && App.user.role === 'procurement specialist';
  var isProcurement = true;
  var isWarehouse = false;
  var isManager = false;

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
      html += '<tr><td colspan="' + ((isProcurement || isWarehouse) ? '6' : '5') + '" style="text-align:center;padding:40px;color:var(--text-muted)">No purchase requests found.</td></tr>';
    } else {
      requests.forEach(function(req) {
        var statusColor = 'warning';
        var statusIcon = 'clock';
        if(req.status === 'approved') { statusColor = 'info'; statusIcon = 'check'; }
        if(req.status === 'rejected') { statusColor = 'danger'; statusIcon = 'x'; }
        if(req.status === 'quotation_requested') { statusColor = 'primary'; statusIcon = 'fileText'; }
        if(req.status === 'pending_finance') { statusColor = 'warning'; statusIcon = 'dollarSign'; }
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
          html += '<button class="btn btn-xs btn-outline" style="margin-right:4px; margin-bottom:4px" onclick="printDocument(\'PR\', \'' + req.id + '\')" title="Print Purchase Request">' + icon('printer', 14) + ' Print PR</button>';
          if (isWarehouse && req.status === 'pending_warehouse') {
            html += '<br><button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateReqStatus(\'' + req.id + '\', \'dispensed\')">Dispense</button>';
            html += '<button class="btn btn-xs btn-warning" onclick="updateReqStatus(\'' + req.id + '\', \'pending\')">Send to Procurement</button>';
          } else if (isProcurementMgr && req.status === 'pending') {
             html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateReqStatus(\'' + req.id + '\', \'approved\')">Approve Request</button>';
             html += '<button class="btn btn-xs btn-danger" onclick="updateReqStatus(\'' + req.id + '\', \'rejected\')">Reject</button>';
          } else if (req.status === 'approved') {
             if (isProcurementSpec) {
                html += '<button class="btn btn-xs btn-primary" onclick="submitQuotesModal(\'' + req.id + '\', \'' + req.item_name.replace(/'/g, "\\'") + '\')">Submit Quotes</button>';
             } else {
                html += '<span style="color:var(--text-muted);font-size:0.8rem">Awaiting Quotes (Specialist)</span>';
             }
          } else if (isProcurementMgr && req.status === 'quotation_requested') {
             html += '<button class="btn btn-xs btn-warning" onclick="reviewQuotesModal(\'' + req.id + '\', \'' + req.item_id + '\')">Review Quotes</button>';
          } else if (req.status === 'quotation_requested') {
             html += '<span style="color:var(--text-muted);font-size:0.8rem">Awaiting Manager</span>';
          } else if (req.status === 'pending_finance') {
             html += '<span style="color:var(--text-muted);font-size:0.8rem">Pending Finance Settlement</span>';
          } else if (req.status === 'purchased') {
             html += '<span style="color:var(--text-muted);font-size:0.8rem">Sent to Finance / Purchasing</span>';
             if (isProcurementMgr || isProcurementSpec) {
                html += '<br><button class="btn btn-xs btn-success" style="margin-top:4px" onclick="sendWhatsAppPO(\'' + req.id + '\', ' + req.requested_quantity + ')">Send PO (WhatsApp)</button>';
                html += ' <button class="btn btn-xs btn-outline" style="margin-top:4px" onclick="printDocument(\'PO\', \'' + req.id + '\')" title="Print Supply Order">' + icon('printer', 14) + ' Print PO</button>';
             }
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
    
    body += '<div class="form-field"><label>Quantity Required *</label><input type="number" id="pr-qty" class="form-input" min="0.01" step="0.01" value="1"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-pr-btn">Submit Request</button>';
    App.showModal('New Purchase Request', body, footer);

    document.getElementById('save-pr-btn').addEventListener('click', function() {
      var nameInput = document.getElementById('pr-item-name').value;
      var qty = parseFloat(document.getElementById('pr-qty').value);
      
      if(!nameInput || !qty || isNaN(qty)) return alert('Please provide item name and quantity');

      var matchedItem = inventoryItems.find(function(i) { return i.name.toLowerCase() === nameInput.toLowerCase(); });
      var itemId = matchedItem ? matchedItem.id : null;

      sbClient.from('purchase_requests').insert([{
        item_id: itemId, item_name: nameInput, requested_quantity: qty,
        requested_by: App.user.full_name, status: 'pending_warehouse'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal();
        loadData();
        showToast('Purchase request submitted', 'success');
      });
    });
  };

  window.submitQuotesModal = function(reqId, itemName) {
    var body = '<p>Enter quotes for <b>' + itemName + '</b></p>';
    for(var i=1; i<=3; i++) {
      body += '<div style="background:var(--bg-tertiary); padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid var(--border-color)">';
      body += '<b>Supplier ' + i + ' Option</b>';
      body += '<input type="text" id="q-sup-' + i + '" class="form-input" style="margin-bottom:10px" placeholder="Supplier Name">';
      body += '<div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:5px">Available Types/Brands & Prices from this supplier:</div>';
      for(var j=1; j<=3; j++) {
        var isReq = j===1 ? '*' : '';
        body += '<div class="form-row" style="margin-bottom:5px">';
        body += '<div class="form-field" style="margin-bottom:0"><input type="text" id="q-type-' + i + '-' + j + '" class="form-input form-input-sm" placeholder="Type/Brand ' + isReq + '"></div>';
        body += '<div class="form-field" style="margin-bottom:0"><input type="number" id="q-price-' + i + '-' + j + '" class="form-input form-input-sm" placeholder="Price ' + isReq + '"></div>';
        body += '</div>';
      }
      body += '</div>';
    }
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-quotes-btn">Submit Quotes</button>';
    App.showModal('Submit Quotes', body, footer);

    document.getElementById('save-quotes-btn').addEventListener('click', function() {
      var inserts = [];
      for(var i=1; i<=3; i++) {
        var sup = document.getElementById('q-sup-' + i).value;
        if (!sup) continue;
        for(var j=1; j<=3; j++) {
          var type = document.getElementById('q-type-' + i + '-' + j).value;
          var p = parseFloat(document.getElementById('q-price-' + i + '-' + j).value);
          if (type && p) {
            inserts.push({
              request_id: reqId, 
              item_name: itemName + ' (' + type + ')', 
              supplier_name: sup, 
              price: p,
              status: 'pending_approval', 
              specialist_name: App.user.full_name, 
              manager_name: App.user.full_name,
              petty_cash_amount: 0 // Keep 0 so it doesn't show in Finance Petty Cash yet
            });
          }
        }
      }
      if(inserts.length === 0) return alert('Please provide at least one valid quote with type and price.');

      sbClient.from('purchase_orders').insert(inserts).then(function(r) {
        if(r.error) return alert(r.error.message);
        
        sbClient.from('purchase_requests').update({status: 'quotation_requested'}).eq('id', reqId).then(function(r2) {
           App.closeModal();
           loadData();
           showToast('Quotes submitted to Manager', 'success');
        });
      });
    });
  };

  window.reviewQuotesModal = function(reqId, itemId) {
    App.showModal('Review Quotes', '<div style="padding:20px;text-align:center">Loading Quotes...</div>', '');
    
    sbClient.from('purchase_orders').select('*').eq('request_id', reqId).then(function(res) {
      var quotes = res.data || [];
      if(quotes.length === 0) {
        App.closeModal();
        return alert('No quotes found.');
      }
      
      var body = '<p>Select the best quote to approve for Petty Cash:</p>';
      body += '<div style="display:flex; flex-direction:column; gap:12px">';
      quotes.forEach(function(q, idx) {
        body += '<div style="border:1px solid var(--border-color); padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary)">';
        body += '<div><div style="font-weight:600">' + q.supplier_name + '</div><div style="color:var(--text-secondary)">Item: ' + q.item_name + '<br>Price: EGP ' + q.price + '</div></div>';
        body += '<button class="btn btn-sm btn-success" onclick="approveQuote(\'' + reqId + '\', \'' + q.id + '\', ' + q.price + ', \'' + itemId + '\', \'' + q.supplier_name.replace(/'/g, "\\'") + '\')">Approve This</button>';
        body += '</div>';
      });
      body += '</div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-danger" onclick="rejectAllQuotes(\'' + reqId + '\')">Reject All (لا أوافق)</button>';
      
      App.showModal('Review Quotes', body, footer);
    });
  };

  window.approveQuote = function(reqId, orderId, price, itemId, supplier) {
    if(confirm('Approve this quote and request EGP ' + price + ' petty cash?')) {
      sbClient.from('purchase_orders').delete().eq('request_id', reqId).neq('id', orderId).then(function() {
        sbClient.from('purchase_orders').update({petty_cash_amount: price}).eq('id', orderId).then(function() {
          sbClient.from('purchase_requests').update({status: 'pending_finance'}).eq('id', reqId).then(function() {
             
             // Update inventory item if it exists
             if (itemId && itemId !== 'null' && itemId !== 'undefined') {
                sbClient.from('inventory_items').update({
                  last_purchase_price: price,
                  supplier_name: supplier
                }).eq('id', itemId).then(function() {
                  App.closeModal();
                  loadData();
                  showToast('Quote approved & price updated. Sent to Finance for settlement.', 'success');
                });
             } else {
                App.closeModal();
                loadData();
                showToast('Quote approved. Sent to Finance for settlement.', 'success');
             }

          });
        });
      });
    }
  };

  window.rejectAllQuotes = function(reqId) {
    if(confirm('Reject all quotes? The specialist will need to submit new quotes.')) {
      sbClient.from('purchase_orders').delete().eq('request_id', reqId).then(function() {
        sbClient.from('purchase_requests').update({status: 'pending'}).eq('id', reqId).then(function() {
           App.closeModal();
           loadData();
           showToast('Quotes rejected.', 'warning');
        });
      });
    }
  };

  window.sendWhatsAppPO = function(reqId, qty) {
    sbClient.from('purchase_orders').select('*').eq('request_id', reqId).gt('petty_cash_amount', 0).single().then(function(res) {
      if(res.error || !res.data) return alert('Approved quote not found.');
      var order = res.data;
      
      var body = '<p>Send Supply Order to <b>' + order.supplier_name + '</b></p>';
      body += '<div class="form-field"><label>Supplier WhatsApp Number *</label><input type="text" id="wa-number" class="form-input" placeholder="e.g. +201012345678"></div>';
      
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-success" id="send-wa-btn">Send Message</button>';
      App.showModal('WhatsApp Supply Order', body, footer);
      
      document.getElementById('send-wa-btn').addEventListener('click', function() {
        var num = document.getElementById('wa-number').value.replace(/[^0-9+]/g, '');
        if(!num) return alert('Please enter a valid number');
        if(!num.startsWith('+')) num = '+' + num;
        
        var message = "مرحباً،\nنود طلب توريد الأصناف التالية:\n";
        message += "الصنف: " + order.item_name + "\n";
        message += "الكمية: " + qty + "\n";
        message += "بناءً على السعر المتفق عليه: " + order.price + " ج.م.\n\n";
        message += "برجاء تأكيد الطلب. شكراً.";
        
        var url = "https://wa.me/" + num.replace('+', '') + "?text=" + encodeURIComponent(message);
        window.open(url, '_blank');
        App.closeModal();
      });
    });
  };

  window.printDocument = function(type, reqId) {
    var reqQuery = sbClient.from('purchase_requests').select('*, inventory_items(quantity, category)').eq('id', reqId).single();
    var orderQuery = type === 'PO' ? sbClient.from('purchase_orders').select('*').eq('request_id', reqId).gt('petty_cash_amount', 0).single() : Promise.resolve({data: null});
    
    Promise.all([reqQuery, orderQuery]).then(function(res) {
      if(res[0].error || !res[0].data) return alert('Request not found');
      var req = res[0].data;
      var order = res[1].data;
      
      var html = '<html dir="rtl"><head><title>Print Document</title>';
      html += '<style>';
      html += '@page { margin: 0; } body { font-family: Tahoma, Arial, sans-serif; direction: rtl; text-align: right; margin: 40px; }';
      html += '.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }';
      html += '.logo-container { text-align: left; }';
      html += '.logo-text { font-size: 32px; font-weight: bold; color: #5a7b9e; }';
      html += '.logo-sub { font-size: 18px; font-weight: bold; color: #666; margin-top: -5px; }';
      html += '.doc-id { font-size: 16px; font-weight: bold; }';
      html += '.title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; }';
      html += '.info-row { margin-bottom: 10px; font-size: 16px; display:flex; gap: 20px; }';
      html += '.info-label { width: 150px; }';
      html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; font-size: 14px; }';
      html += 'th, td { border: 1px solid #000; padding: 10px; }';
      html += 'th { background: #f9f9f9; }';
      html += '</style></head><body>';
      
      html += '<div class="header">';
      html += '<div class="doc-id">' + (type === 'PR' ? 'F-840-01-04' : 'F-840-01-07') + '</div>';
      html += '<div class="logo-container"><div class="logo-text">Mac<span style="color:#2b2b2b">plast</span></div><div class="logo-sub">Smart Factory</div></div>';
      html += '</div>';
      
      var dateObj = new Date(req.created_at);
      var dateStr = ('0' + dateObj.getDate()).slice(-2) + '-' + ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' + dateObj.getFullYear();
      
      if (type === 'PR') {
         html += '<div class="title">طلب شراء ( ' + req.id.split('-')[0].toUpperCase() + ' )</div>';
         html += '<div class="info-row"><div class="info-label">التاريخ :</div><div>' + dateStr + '</div></div>';
         html += '<div class="info-row" style="margin-bottom:20px"><div class="info-label">القسم :</div><div>المخازن (التخطيط)</div></div>';
         html += '<div class="info-row" style="margin-bottom:10px">أرجو من سيادتكم التكرم بالموافقة على شراء الأصناف الآتية :-</div>';
         
         html += '<table><tr><th>م</th><th>الكود</th><th>الصنف / الحساب النوعي</th><th>الوصف</th><th>الكمية</th><th>الوحدة</th><th>الرصيد الحالي في المخزن</th><th>ميعاد التوريد</th></tr>';
         var stock = (req.inventory_items && req.inventory_items.quantity !== undefined) ? req.inventory_items.quantity : '0.00';
         html += '<tr><td>1</td><td>' + (req.item_id ? req.item_id.split('-')[0] : '-') + '</td><td>' + req.item_name + '</td><td>' + (req.description || req.item_name) + '</td><td>' + req.requested_quantity + '</td><td>' + (req.unit || 'Piece') + '</td><td>' + stock + '</td><td>' + (req.delivery_date || dateStr) + '</td></tr>';
         html += '</table>';
         html += '<div style="margin-top:20px; font-size:14px; text-align:center;">ملحوظة : برجاء مراعاة متطلبات البيئة والسلامة ومتطلبات ترشيد الطاقة في الاصناف المشتراه.</div>';
      } else {
         html += '<div class="title">أمر توريد رقم ( ' + req.id.split('-')[0].toUpperCase() + ' )</div>';
         html += '<div style="display:flex; justify-content:flex-end; margin-bottom:20px"><div style="text-align:right">';
         html += '<div class="info-row"><div class="info-label">التاريخ :</div><div>' + dateStr + '</div></div>';
         html += '<div class="info-row"><div class="info-label">السادة شركة :</div><div>' + (order ? order.supplier_name : '') + '</div></div>';
         html += '<div class="info-row"><div class="info-label">عناية :</div><div>المبيعات</div></div>';
         html += '</div></div>';
         html += '<div class="title" style="font-size:18px; text-decoration:none">برجاء التكرم بتوريد الأتى :-</div>';
         
         html += '<table><tr><th>م</th><th>كود</th><th>اسم الصنف</th><th>مواصفات الصنف</th><th>الوحدة</th><th>الكمية</th><th>سعر الوحدة</th><th>اجمالى القيمة</th><th>ميعاد التسليم</th></tr>';
         if(order) {
            var total = parseFloat(order.price) * parseFloat(req.requested_quantity);
            html += '<tr><td>1</td><td>' + (req.item_id ? req.item_id.split('-')[0] : '-') + '</td><td>' + req.item_name + '</td><td>' + (order ? order.supplier_name : '') + '</td><td>' + (req.unit || 'Piece') + '</td><td>' + req.requested_quantity + '</td><td>' + parseFloat(order.price).toFixed(2) + '</td><td>' + total.toFixed(2) + '</td><td>' + (req.delivery_date || dateStr) + '</td></tr>';
         }
         html += '</table>';
      }
      
      html += '</body></html>';
      
      var printWin = window.open('', '_blank');
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(function() { printWin.print(); }, 500);
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
  var isHRManager = App.user && App.user.role === 'hr manager';
  var isProcManager = App.user && App.user.department === 'Procurement' && (App.user.role === 'procurement manager' || App.user.role === 'manager');
  var isProcEmp = App.user && App.user.department === 'Procurement' && !isProcManager;
  var isChiefAcc = App.user && App.user.role === 'chief accountant';
  var isCFO = App.user && App.user.role === 'cfo';

  var isAllowed = isFinance || isOwner || isHRManager || isProcManager || isProcEmp || isChiefAcc || isCFO;

  if (!isAllowed) {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to Finance, Procurement, and Management.</p></div>';
    return;
  }

  var safes = [], banks = [], clients = [], suppliers = [], invoices = [];
  var journalEntries = [], costCenters = [], assets = [], taxes = [];
  var txs = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)"><span class="spinner"></span> Loading Comprehensive Finance Data...</div>';
    
    Promise.all([
      sbClient.from('finance_safes').select('*'),
      sbClient.from('finance_bank_accounts').select('*'),
      sbClient.from('finance_clients').select('*'),
      sbClient.from('finance_suppliers').select('*'),
      sbClient.from('finance_invoices').select('*'),
      sbClient.from('finance_journal_entries').select('*, finance_journal_lines(*)'),
      sbClient.from('finance_cost_centers').select('*'),
      sbClient.from('finance_fixed_assets').select('*'),
      sbClient.from('finance_taxes').select('*'),
      sbClient.from('finance_treasury_tx').select('*').order('created_at', {ascending: false})
    ]).then(function(res) {
      if (res[0].error && res[0].error.message.includes('relation "finance_safes" does not exist')) {
        renderSetup();
        return;
      }
      
      safes = res[0].data || [];
      banks = res[1].data || [];
      clients = res[2].data || [];
      suppliers = res[3].data || [];
      invoices = res[4].data || [];
      journalEntries = res[5].data || [];
      costCenters = res[6].data || [];
      assets = res[7].data || [];
      taxes = res[8].data || [];
      txs = res[9].data || [];
      
      render();
    }).catch(function(err) {
      el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-danger)">Error: ' + err.message + '</div>';
    });
  }

  function renderSetup() {
    el.innerHTML = '<div style="padding:40px; text-align:center;"><h2>⚠️ جدول الحسابات غير موجود</h2><p>يجب تشغيل setup_accounting.sql في قاعدة البيانات.</p></div>';
  }

  function render() {
    var isProcurementOnly = isProcManager || isProcEmp;
    
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Comprehensive Financial Suite (الإدارة المالية الشاملة)</h3>';
    html += '<div style="display:flex; gap:10px; flex-wrap:wrap;">';
    
    if (!isProcurementOnly) {
      html += '<button class="btn btn-outline" id="tab-treasury" style="border-color:var(--accent-primary);color:var(--accent-primary)">🏦 Treasury (الخزائن والبنوك)</button>';
      html += '<button class="btn btn-ghost" id="tab-ap-ar">🧾 AP/AR (العملاء والموردين)</button>';
      html += '<button class="btn btn-ghost" id="tab-journal">📝 Journal (القيود)</button>';
      html += '<button class="btn btn-ghost" id="tab-assets">🏢 Assets (الأصول)</button>';
      html += '<button class="btn btn-ghost" id="tab-taxes">⚖️ Taxes (الضرائب)</button>';
      html += '<button class="btn btn-ghost" id="tab-petty">💸 Petty Cash (العهد)</button>';
      if (isOwner || isChiefAcc || isCFO) {
        html += '<button class="btn btn-ghost" id="tab-reports">📊 Financial Reports</button>';
        html += '<button class="btn btn-ghost" id="tab-closing">🔒 Period Closing</button>';
      }
    } else {
      html += '<button class="btn btn-outline" id="tab-petty" style="border-color:var(--accent-primary);color:var(--accent-primary)">💸 Petty Cash (العهد)</button>';
    }
    
    html += '</div></div>';

    // 1. Treasury View
    html += '<div id="view-treasury" style="display:' + (isProcurementOnly ? 'none' : 'block') + '">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">';
    html += '<h3>Treasury (الخزائن والبنوك)</h3>';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="btn btn-primary" onclick="window.showAddFinanceModal(\'treasury\')">➕ Add Safe/Bank/Check (إضافة خزنة/بنك/شيك)</button>';
    html += '<button class="btn btn-outline" style="border-color:var(--accent-primary);color:var(--accent-primary)" onclick="window.showTransferModal()">🔄 تحويل بين الحسابات</button>';
    html += '</div>';
    html += '</div>';
    html += '<div style="display:flex; gap:20px; margin-bottom:20px;">';
    
    html += '<div class="card" style="flex:1"><div class="card-header"><h3>الخزائن (Safes)</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>الاسم</th><th>الرصيد</th></tr></thead><tbody>';
    var totalSafe = 0;
    safes.forEach(s => { html += '<tr><td>'+s.name+'</td><td>'+Number(s.balance).toLocaleString()+'</td></tr>'; totalSafe += Number(s.balance); });
    html += '<tr style="background:rgba(0,0,0,0.03)"><td style="font-weight:bold">الإجمالي</td><td style="font-weight:bold;color:var(--accent-success);font-size:1.1rem">'+totalSafe.toLocaleString()+' EGP</td></tr>';
    html += '</tbody></table></div></div>';

    html += '<div class="card" style="flex:1"><div class="card-header"><h3>البنوك (Banks)</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>الاسم</th><th>الرصيد</th></tr></thead><tbody>';
    var totalBank = 0;
    banks.forEach(b => { html += '<tr><td>'+b.name+'</td><td>'+Number(b.balance).toLocaleString()+'</td></tr>'; totalBank += Number(b.balance); });
    html += '<tr style="background:rgba(0,0,0,0.03)"><td style="font-weight:bold">الإجمالي</td><td style="font-weight:bold;color:var(--accent-primary);font-size:1.1rem">'+totalBank.toLocaleString()+' EGP</td></tr>';
    html += '</tbody></table></div></div>';
    
    html += '</div>';

    // Checks section in Treasury
    var checkTxs = txs.filter(t => t.method === 'check');
    html += '<div class="card" style="margin-top:20px"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(168,85,247,0.05))"><h3>🧾 Checks (الشيكات)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'treasury\')">➕ Issue/Receive Check (إضافة شيك)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Check No (رقم الشيك)</th><th>Type (النوع)</th><th>Beneficiary/Client</th><th>Amount (المبلغ)</th><th>Due Date (الاستحقاق)</th><th>Status (الحالة)</th><th>Action (إجراء)</th></tr></thead><tbody>';
    if (checkTxs.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">No checks issued or received yet (لا يوجد شيكات حتى الآن)</td></tr>';
    } else {
      checkTxs.forEach(t => {
        var isOut = t.type === 'check_issued' || t.type === 'supplier_payment' || t.type === 'petty_cash';
        var typeHtml = isOut ? '<span style="color:var(--accent-danger);font-weight:bold">صادر ⬆️</span>' : '<span style="color:var(--accent-success);font-weight:bold">وارد ⬇️</span>';
        
        var statusHtml = '';
        if (t.status === 'cleared') {
          statusHtml = '<span style="color:var(--accent-success);font-weight:bold">✅ Cleared (' + (isOut ? 'تم الصرف' : 'تم التحصيل') + ')</span><br><small style="color:var(--text-muted)">' + (t.cleared_account||'') + '</small>';
        } else {
          statusHtml = '<span style="color:var(--accent-warning);font-weight:bold">⏳ Pending (معلق)</span>';
        }
        var btnText = isOut ? 'صرف الشيك' : 'تحصيل الشيك';
        var actionHtml = t.status === 'cleared' ? '<span style="color:var(--text-muted)">—</span>' : '<button class="btn btn-xs btn-primary" onclick="window.clearCheck(\'' + t.id + '\')">💳 Clear ('+btnText+')</button>';
        html += '<tr>';
        html += '<td style="font-weight:bold">' + (t.check_number||'-') + '</td>';
        html += '<td>' + typeHtml + '</td>';
        html += '<td>' + (t.employee_name || t.description || '-') + '</td>';
        html += '<td style="font-weight:bold;color:var(--accent-primary)">' + Number(t.amount).toLocaleString() + ' EGP</td>';
        html += '<td>' + (t.check_due_date || '-') + '</td>';
        html += '<td>' + statusHtml + '</td>';
        html += '<td>' + actionHtml + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div>';

    html += '</div>';

    // 2. AP/AR View
    html += '<div id="view-ap-ar" style="display:none">';
    html += '<div style="display:flex; gap:20px;">';
    html += '<div class="card" style="flex:1"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Clients (العملاء - AR)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'client\')">➕ Add Client (إضافة عميل)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Client (العميل)</th><th>Balance (الرصيد)</th></tr></thead><tbody>';
    clients.forEach(c => { html += '<tr><td>'+c.name+'</td><td>'+c.balance+'</td></tr>'; });
    html += '</tbody></table></div></div>';
    html += '<div class="card" style="flex:1"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Suppliers (الموردين - AP)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'supplier\')">➕ Add Supplier (إضافة مورد)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Supplier (المورد)</th><th>Balance (الرصيد)</th></tr></thead><tbody>';
    suppliers.forEach(s => { html += '<tr><td>'+s.name+'</td><td>'+s.balance+'</td></tr>'; });
    html += '</tbody></table></div></div>';
    html += '</div>';

    // === Pending Sales Payments (from Sales module) ===
    html += '<div class="card" style="margin-top:20px"><div class="card-header" style="background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.05))"><h3>💰 مدفوعات مبيعات معلقة (Pending Sales Payments)</h3></div>';
    html += '<div class="card-body no-pad" id="pending-sales-payments"><div style="padding:20px;text-align:center;color:var(--text-muted)">جاري التحميل...</div></div></div>';

    // === Pending Purchase Payments (from Procurement) ===
    html += '<div class="card" style="margin-top:20px"><div class="card-header" style="background:linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.05))"><h3>🛒 مدفوعات مشتريات معلقة (Pending Purchase Payments)</h3></div>';
    html += '<div class="card-body no-pad" id="pending-purchase-payments"><div style="padding:20px;text-align:center;color:var(--text-muted)">جاري التحميل...</div></div></div>';

    html += '</div>';

    // 3. Journal View
    html += '<div id="view-journal" style="display:none">';
    html += '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Journal Entries (القيود اليومية)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'journal\')">➕ Add Entry (إضافة قيد)</button></div><div class="card-body no-pad">';
    html += '<table class="data-table"><thead><tr><th>Entry No (رقم القيد)</th><th>Date (التاريخ)</th><th>Description (البيان)</th><th>Total Debit (إجمالي مدين)</th><th>Total Credit (إجمالي دائن)</th><th>Status (الحالة)</th><th>Change Status (تغيير الحالة)</th></tr></thead><tbody>';
    journalEntries.forEach(j => {
      var stColor = j.status==='posted'?'var(--accent-success)':j.status==='rejected'?'var(--accent-danger)':'var(--accent-warning)';
      var stLabel = j.status==='posted'?'✅ معتمد':j.status==='rejected'?'❌ مرفوض':'⏳ مسودة';
      html += '<tr><td>'+(j.entry_number||'-')+'</td><td>'+formatDate(j.entry_date)+'</td><td>'+(j.description||'-')+'</td><td>'+j.total_debit+'</td><td>'+j.total_credit+'</td>';
      html += '<td><span style="color:'+stColor+';font-weight:bold">'+stLabel+'</span></td>';
      html += '<td><select class="form-input" style="padding:4px 8px;font-size:0.8rem;min-width:120px" onchange="window.changeFinStatus(\'finance_journal_entries\',\''+j.id+'\',this.value)">';
      html += '<option value="" disabled selected>تغيير...</option><option value="draft">⏳ مسودة</option><option value="posted">✅ معتمد</option><option value="rejected">❌ مرفوض</option></select></td></tr>';
    });
    if(journalEntries.length === 0) html += '<tr><td colspan="7" style="text-align:center">لا يوجد قيود</td></tr>';
    html += '</tbody></table></div></div></div>';

    // 4. Assets
    html += '<div id="view-assets" style="display:none">';
    html += '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Fixed Assets (الأصول الثابتة)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'asset\')">➕ Add Asset (إضافة أصل)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Asset (الأصل)</th><th>Code (الكود)</th><th>Category (الفئة)</th><th>Purchase Date (تاريخ الشراء)</th><th>Original Value (القيمة الأصلية)</th><th>Current Value (القيمة الحالية)</th><th>Status (الحالة)</th><th>Change Status (تغيير الحالة)</th></tr></thead><tbody>';
    assets.forEach(a => { 
      var asColor = a.status==='active'?'var(--accent-success)':a.status==='disposed'?'var(--accent-danger)':a.status==='sold'?'var(--accent-primary)':'var(--accent-warning)';
      var asLabel = a.status==='active'?'✅ نشط':a.status==='disposed'?'🗑️ تم الإهلاك':a.status==='sold'?'💰 مباع':a.status==='under_maintenance'?'🔧 تحت الصيانة':'⏳ '+a.status;
      html += '<tr><td>'+a.name+'</td><td>'+(a.asset_code||'-')+'</td><td>'+(a.category||'-')+'</td><td>'+(a.purchase_date||'-')+'</td><td>'+(a.original_value||'-')+'</td><td>'+a.current_value+'</td>';
      html += '<td><span style="color:'+asColor+';font-weight:bold">'+asLabel+'</span></td>';
      html += '<td><select class="form-input" style="padding:4px 8px;font-size:0.8rem;min-width:120px" onchange="window.changeFinStatus(\'finance_fixed_assets\',\''+a.id+'\',this.value)">';
      html += '<option value="" disabled selected>Change... (تغيير...)</option><option value="active">✅ نشط</option><option value="under_maintenance">🔧 تحت الصيانة</option><option value="disposed">🗑️ تم الإهلاك</option><option value="sold">💰 مباع</option></select></td></tr>';
    });
    if(assets.length === 0) html += '<tr><td colspan="8" style="text-align:center">لا يوجد أصول مسجلة</td></tr>';
    html += '</tbody></table></div></div></div>';

    // 5. Taxes
    html += '<div id="view-taxes" style="display:none">';
    html += '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Taxes (الضرائب)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'tax\')">➕ Add Tax (إضافة ضريبة)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Tax Type (نوع الضريبة)</th><th>Period (الفترة)</th><th>Taxable Amount (المبلغ الخاضع)</th><th>Tax Amount (قيمة الضريبة)</th><th>Status (الحالة)</th><th>Change Status (تغيير الحالة)</th></tr></thead><tbody>';
    taxes.forEach(t => {
      var txColor = t.status==='paid'?'var(--accent-success)':t.status==='overdue'?'var(--accent-danger)':'var(--accent-warning)';
      var txLabel = t.status==='paid'?'✅ مدفوعة':t.status==='overdue'?'❌ متأخرة':'⏳ معلقة';
      html += '<tr><td>'+t.tax_type+'</td><td>'+(t.period||'-')+'</td><td>'+t.taxable_amount+'</td><td>'+t.tax_amount+'</td>';
      html += '<td><span style="color:'+txColor+';font-weight:bold">'+txLabel+'</span></td>';
      html += '<td><select class="form-input" style="padding:4px 8px;font-size:0.8rem;min-width:120px" onchange="window.changeFinStatus(\'finance_taxes\',\''+t.id+'\',this.value)">';
      html += '<option value="" disabled selected>Change... (تغيير...)</option><option value="pending">⏳ معلقة</option><option value="paid">✅ مدفوعة</option><option value="overdue">❌ متأخرة</option></select></td></tr>';
    });
    if(taxes.length === 0) html += '<tr><td colspan="6" style="text-align:center">لا يوجد ضرائب مسجلة</td></tr>';
    html += '</tbody></table></div></div></div>';

    // 6. Petty Cash
    html += '<div id="view-petty" style="display:' + (isProcurementOnly ? 'block' : 'none') + '">';
    html += '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center"><h3>Petty Cash & Advances (العهد والسلف والشيكات)</h3><button class="btn btn-sm btn-primary" onclick="window.showAddFinanceModal(\'petty\')">➕ Issue Cash/Check (صرف نقدية / شيك)</button></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Date (التاريخ)</th><th>Employee (الموظف)</th><th>Description (البيان)</th><th>Method (طريقة الصرف)</th><th>Amount (المبلغ)</th><th>Check Status (حالة الشيك)</th><th>Settlement (تسوية العهدة)</th></tr></thead><tbody>';
    var pcTxs = txs.filter(t => t.type === 'petty_cash' || t.type === 'check_issued');
    pcTxs.forEach(t => { 
      var chkStatus = '-';
      if (t.method === 'check') {
        if (t.status === 'cleared') {
          chkStatus = '<span style="color:var(--accent-success)">✅ تم الصرف (' + (t.cleared_account||'') + ')</span>';
        } else {
          chkStatus = '<button class="btn btn-xs btn-outline" style="border-color:var(--accent-primary);color:var(--accent-primary)" onclick="window.clearCheck(\'' + t.id + '\')">⏳ معلق - تحديث للصرف</button>';
        }
      }
      // Settlement status
      var settleCol = '';
      if (t.settlement_status === 'settled') {
        settleCol = '<div style="font-size:0.8rem"><span style="color:var(--accent-success);font-weight:bold">✅ تمت التسوية</span>';
        settleCol += '<br>مصروف: ' + (t.amount_spent||0) + ' EGP';
        settleCol += '<br>مرتجع: ' + (t.amount_returned||0) + ' EGP';
        if (t.settlement_notes) settleCol += '<br><small style="color:var(--text-muted)">' + t.settlement_notes + '</small>';
        settleCol += '</div>';
      } else {
        settleCol = '<button class="btn btn-xs btn-warning" onclick="window.settlePettyCash(\'' + t.id + '\',' + t.amount + ')">📋 تسوية العهدة</button>';
      }
      var empName = t.employee_name || t.created_by_name || '-';
      html += '<tr><td>'+formatDate(t.created_at)+'</td><td>'+empName+'</td><td>'+(t.description||'-')+'</td><td>'+t.method+'</td><td style="color:var(--accent-danger);font-weight:bold">-' + t.amount + '</td><td>'+chkStatus+'</td><td>'+settleCol+'</td></tr>'; 
    });
    if(pcTxs.length===0) html += '<tr><td colspan="7" style="text-align:center">لا يوجد عهد أو شيكات</td></tr>';
    html += '</tbody></table></div></div></div>';

    // 7. Reports
    html += '<div id="view-reports" style="display:none">';
    html += '<div class="card"><div class="card-header"><h3>Financial Reports & Analytics (التقارير المالية)</h3></div>';
    html += '<div class="card-body">';
    html += '<div class="form-row" style="margin-bottom:20px;">';
    html += '<div class="form-field" style="flex:2;"><label>Report Type (نوع التقرير)</label>';
    html += '<select id="report-type" class="form-input">';
    html += '<option value="income">Income Statement (قائمة الدخل)</option>';
    html += '<option value="balance">Balance Sheet (الميزانية العمومية)</option>';
    html += '<option value="trial">Trial Balance (ميزان المراجعة)</option>';
    html += '<option value="apar">AP/AR Summary (أرصدة العملاء والموردين)</option>';
    html += '<option value="taxes">Taxes Summary (تقرير الضرائب)</option>';
    html += '</select></div>';
    html += '<div class="form-field" style="flex:1;"><label>From (من)</label><input type="date" id="report-from" class="form-input"></div>';
    html += '<div class="form-field" style="flex:1;"><label>To (إلى)</label><input type="date" id="report-to" class="form-input"></div>';
    html += '<div class="form-field" style="flex:1; display:flex; align-items:flex-end;"><button class="btn btn-primary" id="btn-generate-report" style="width:100%">' + icon('barChart') + ' Generate</button></div>';
    html += '</div>';
    html += '<div id="report-output" style="min-height:300px; border:1px dashed var(--border-color); padding:20px; border-radius:8px; background:var(--bg-tertiary); text-align:center; color:var(--text-muted);">';
    html += 'Select a report type and click Generate to view results.';
    html += '</div>';
    html += '</div></div></div>';

    // 8. Closing
    html += '<div id="view-closing" style="display:none">';
    html += '<div class="card"><div class="card-body" style="text-align:center; padding:60px; color:var(--text-muted)"><h3>Financial Period Closing (الإقفال المالي)</h3><p style="margin-bottom:20px;">Lock all transactions for the current period to prevent further modifications.</p><button class="btn btn-danger btn-lg">' + icon('lock') + ' Close Current Month</button></div></div></div>';

    el.innerHTML = html;

    var allTabs = isProcurementOnly ? ['tab-petty'] : ['tab-treasury','tab-ap-ar','tab-journal','tab-assets','tab-taxes','tab-petty','tab-reports','tab-closing'];
    var allViews = isProcurementOnly ? ['view-petty'] : ['view-treasury','view-ap-ar','view-journal','view-assets','view-taxes','view-petty','view-reports','view-closing'];
    
    allTabs.forEach((tid, idx) => {
      var btn = document.getElementById(tid);
      if(btn) {
        btn.addEventListener('click', function() {
          allTabs.forEach(t => { var b=document.getElementById(t); if(b){b.className='btn btn-ghost';b.style.color='inherit';b.style.borderColor='transparent';} });
          this.className='btn btn-outline'; this.style.color='var(--accent-primary)'; this.style.borderColor='var(--accent-primary)';
          allViews.forEach(v => { var vEl=document.getElementById(v); if(vEl) vEl.style.display='none'; });
          var target = document.getElementById(allViews[idx]);
          if(target) target.style.display='block';
        });
      }
    });

    // Reports Logic
    var btnGenerate = document.getElementById('btn-generate-report');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', function() {
        var rType = document.getElementById('report-type').value;
        var rFrom = document.getElementById('report-from').value;
        var rTo = document.getElementById('report-to').value;
        var out = document.getElementById('report-output');
        
        out.innerHTML = '<span class="spinner"></span> Processing...';
        
        setTimeout(function() {
          var repHtml = '<div style="text-align:left; color:var(--text-primary);">';
          repHtml += '<h3 style="margin-bottom:16px; border-bottom:2px solid var(--accent-primary); padding-bottom:8px;">';
          if(rType === 'income') repHtml += 'Income Statement (قائمة الدخل)';
          if(rType === 'balance') repHtml += 'Balance Sheet (الميزانية العمومية)';
          if(rType === 'trial') repHtml += 'Trial Balance (ميزان المراجعة)';
          if(rType === 'apar') repHtml += 'AP/AR Summary (أرصدة العملاء والموردين)';
          if(rType === 'taxes') repHtml += 'Taxes Summary (تقرير الضرائب)';
          repHtml += '</h3>';
          
          if (rFrom || rTo) {
            repHtml += '<div style="margin-bottom:20px; font-size:0.9rem; color:var(--text-muted);">Period: ' + (rFrom||'Start') + ' to ' + (rTo||'Present') + '</div>';
          }
          
          repHtml += '<table class="table" style="width:100%; border-collapse:collapse; background:var(--bg-card);">';
          
          if (rType === 'apar') {
            repHtml += '<thead><tr style="border-bottom:1px solid var(--border-color);text-align:left;"><th>Entity Name</th><th>Type</th><th>Current Balance (EGP)</th></tr></thead><tbody>';
            var totalAR = 0, totalAP = 0;
            clients.forEach(c => { repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td>'+c.name+'</td><td>Client (AR)</td><td style="color:#10b981">'+Number(c.balance).toLocaleString()+'</td></tr>'; totalAR += Number(c.balance); });
            suppliers.forEach(s => { repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td>'+s.name+'</td><td>Supplier (AP)</td><td style="color:#ef4444">'+Number(s.balance).toLocaleString()+'</td></tr>'; totalAP += Number(s.balance); });
            repHtml += '<tr style="font-weight:bold; background:rgba(0,0,0,0.02);"><td colspan="2" style="text-align:right">Total Accounts Receivable:</td><td style="color:#10b981">'+totalAR.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="font-weight:bold; background:rgba(0,0,0,0.02);"><td colspan="2" style="text-align:right">Total Accounts Payable:</td><td style="color:#ef4444">'+totalAP.toLocaleString()+'</td></tr>';
            repHtml += '</tbody></table>';
          } 
          else if (rType === 'taxes') {
            repHtml += '<thead><tr style="border-bottom:1px solid var(--border-color);text-align:left;"><th>Tax Type</th><th>Period</th><th>Taxable Amount</th><th>Tax Amount</th><th>Status</th></tr></thead><tbody>';
            var totTax = 0;
            taxes.forEach(t => { 
              repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td>'+t.tax_type.toUpperCase()+'</td><td>'+(t.period||'-')+'</td><td>'+Number(t.taxable_amount).toLocaleString()+'</td><td>'+Number(t.tax_amount).toLocaleString()+'</td><td>'+t.status+'</td></tr>';
              if(t.status!=='paid') totTax += Number(t.tax_amount);
            });
            repHtml += '<tr style="font-weight:bold; background:rgba(0,0,0,0.02);"><td colspan="3" style="text-align:right">Total Unpaid Taxes Liability:</td><td colspan="2" style="color:#ef4444">'+totTax.toLocaleString()+' EGP</td></tr>';
            repHtml += '</tbody></table>';
          }
          else if (rType === 'income') {
            // Simplified Income Statement based on invoices and petty cash
            var salesRev = invoices.filter(i=>i.invoice_type==='sales').reduce((a,b)=>a+Number(b.total),0);
            var costOfGoods = invoices.filter(i=>i.invoice_type==='purchase').reduce((a,b)=>a+Number(b.total),0);
            var expenses = txs.filter(t=>t.type==='petty_cash').reduce((a,b)=>a+Number(b.amount),0);
            var netIncome = salesRev - costOfGoods - expenses;
            
            repHtml += '<tbody>';
            repHtml += '<tr><td style="padding:12px;font-weight:bold;font-size:1.1rem" colspan="2">Revenue (الإيرادات)</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:12px 24px">Sales Revenue</td><td style="text-align:right;padding:12px">'+salesRev.toLocaleString()+'</td></tr>';
            repHtml += '<tr><td style="padding:12px;font-weight:bold;font-size:1.1rem" colspan="2">Cost of Goods Sold (تكلفة المبيعات)</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:12px 24px">Purchases / Materials</td><td style="text-align:right;padding:12px">('+costOfGoods.toLocaleString()+')</td></tr>';
            repHtml += '<tr style="background:rgba(0,0,0,0.02);font-weight:bold"><td style="padding:12px">Gross Profit (إجمالي الربح)</td><td style="text-align:right;padding:12px">'+(salesRev - costOfGoods).toLocaleString()+'</td></tr>';
            repHtml += '<tr><td style="padding:12px;font-weight:bold;font-size:1.1rem" colspan="2">Operating Expenses (مصروفات التشغيل)</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:12px 24px">Petty Cash & Admin Expenses</td><td style="text-align:right;padding:12px">('+expenses.toLocaleString()+')</td></tr>';
            repHtml += '<tr style="background:var(--accent-primary);color:white;font-weight:bold;font-size:1.2rem"><td style="padding:12px">Net Income (صافي الربح)</td><td style="text-align:right;padding:12px">'+netIncome.toLocaleString()+' EGP</td></tr>';
            repHtml += '</tbody></table>';
          }
          else if (rType === 'balance') {
            // Simplified Balance Sheet
            var totalSafe = safes.reduce((a,b)=>a+Number(b.balance),0);
            var totalBank = banks.reduce((a,b)=>a+Number(b.balance),0);
            var totalAR = clients.reduce((a,b)=>a+Number(b.balance),0);
            var totalAssets = assets.reduce((a,b)=>a+Number(b.current_value),0);
            
            var totalAP = suppliers.reduce((a,b)=>a+Number(b.balance),0);
            var totalTaxes = taxes.filter(t=>t.status!=='paid').reduce((a,b)=>a+Number(b.tax_amount),0);
            
            var totalAssetsSum = totalSafe + totalBank + totalAR + totalAssets;
            var totalLiabilities = totalAP + totalTaxes;
            var equity = totalAssetsSum - totalLiabilities; // Plug number
            
            repHtml += '<tbody>';
            repHtml += '<tr><td style="padding:12px;font-weight:bold;font-size:1.1rem;color:#3b82f6" colspan="2">ASSETS (الأصول)</td></tr>';
            repHtml += '<tr><td style="padding:8px 24px;font-weight:600" colspan="2">Current Assets</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Cash in Safes</td><td style="text-align:right;padding:8px">'+totalSafe.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Cash at Banks</td><td style="text-align:right;padding:8px">'+totalBank.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Accounts Receivable</td><td style="text-align:right;padding:8px">'+totalAR.toLocaleString()+'</td></tr>';
            repHtml += '<tr><td style="padding:8px 24px;font-weight:600" colspan="2">Non-Current Assets</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Fixed Assets</td><td style="text-align:right;padding:8px">'+totalAssets.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="background:rgba(59,130,246,0.1);font-weight:bold"><td style="padding:12px">Total Assets (إجمالي الأصول)</td><td style="text-align:right;padding:12px">'+totalAssetsSum.toLocaleString()+'</td></tr>';
            
            repHtml += '<tr><td style="padding:12px;font-weight:bold;font-size:1.1rem;color:#ef4444" colspan="2">LIABILITIES & EQUITY (الخصوم وحقوق الملكية)</td></tr>';
            repHtml += '<tr><td style="padding:8px 24px;font-weight:600" colspan="2">Current Liabilities</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Accounts Payable</td><td style="text-align:right;padding:8px">'+totalAP.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Taxes Payable</td><td style="text-align:right;padding:8px">'+totalTaxes.toLocaleString()+'</td></tr>';
            repHtml += '<tr><td style="padding:8px 24px;font-weight:600" colspan="2">Equity</td></tr>';
            repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td style="padding:8px 40px">Owner\'s Equity / Retained Earnings</td><td style="text-align:right;padding:8px">'+equity.toLocaleString()+'</td></tr>';
            repHtml += '<tr style="background:rgba(239,68,68,0.1);font-weight:bold"><td style="padding:12px">Total Liabilities & Equity</td><td style="text-align:right;padding:12px">'+(totalLiabilities+equity).toLocaleString()+'</td></tr>';
            
            repHtml += '</tbody></table>';
          }
          else if (rType === 'trial') {
            repHtml += '<thead><tr style="border-bottom:1px solid var(--border-color);text-align:left;"><th>Account Name</th><th>Debit (مدين)</th><th>Credit (دائن)</th></tr></thead><tbody>';
            var accs = {};
            journalEntries.forEach(j => {
              if(j.status === 'posted' || j.status === 'approved') {
                (j.finance_journal_lines || []).forEach(l => {
                  if(!accs[l.account_name]) accs[l.account_name] = {d:0, c:0};
                  accs[l.account_name].d += Number(l.debit);
                  accs[l.account_name].c += Number(l.credit);
                });
              }
            });
            var tD = 0, tC = 0;
            Object.keys(accs).forEach(k => {
              repHtml += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)"><td>'+k+'</td><td>'+accs[k].d.toLocaleString()+'</td><td>'+accs[k].c.toLocaleString()+'</td></tr>';
              tD += accs[k].d; tC += accs[k].c;
            });
            repHtml += '<tr style="font-weight:bold; background:rgba(0,0,0,0.02);"><td>Total:</td><td>'+tD.toLocaleString()+'</td><td>'+tC.toLocaleString()+'</td></tr>';
            if (tD !== tC) repHtml += '<tr><td colspan="3" style="text-align:center;color:#ef4444;font-weight:bold">Warning: Trial Balance is unbalanced!</td></tr>';
            repHtml += '</tbody></table>';
          }
          
          repHtml += '<div style="margin-top:20px;text-align:right"><button class="btn btn-outline btn-sm" onclick="window.print()">' + icon('printer', 14) + ' Print Report</button></div>';
          repHtml += '</div>';
          out.innerHTML = repHtml;
        }, 600);
      });
    }

    // --- Load Pending Payments Data ---
    function loadPendingPayments() {
      var sCon = document.getElementById('pending-sales-payments');
      var pCon = document.getElementById('pending-purchase-payments');
      if(!sCon || !pCon) return;

      // Sales
      sbClient.from('sales_workflow_orders').select('*').eq('status', 'Pending Payment').then(function(res) {
        if(res.error) { sCon.innerHTML = 'Error loading sales'; return; }
        var orders = res.data || [];
        if(orders.length === 0) {
          sCon.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">لا يوجد مدفوعات مبيعات معلقة</div>';
        } else {
          var h = '<table class="data-table"><thead><tr><th>الطلب</th><th>العميل</th><th>المبلغ المطلوب</th><th>طريقة السداد</th><th>إجراء</th></tr></thead><tbody>';
          orders.forEach(o => {
            h += '<tr><td>'+(o.id.split('-')[0].toUpperCase())+'</td><td>'+o.customer_name+'</td><td style="color:var(--accent-success);font-weight:bold">+ '+(o.remaining_amount||o.total_amount)+' EGP</td><td>'+(o.payment_method||'cash')+'</td>';
            h += '<td><button class="btn btn-sm btn-primary" onclick="window.processPendingPayment(\'sales\',\''+o.id+'\',\''+o.customer_name+'\','+(o.remaining_amount||o.total_amount)+')">💰 تحصيل / دفع</button></td></tr>';
          });
          h += '</tbody></table>';
          sCon.innerHTML = h;
        }
      });

      // Purchases
      sbClient.from('purchase_orders').select('*, purchase_requests(*)').in('payment_status', ['pending', 'unpaid', 'partial']).then(function(res) {
        if(res.error) { pCon.innerHTML = 'Error loading purchases'; return; }
        var orders = res.data || [];
        if(orders.length === 0) {
          pCon.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">لا يوجد مدفوعات مشتريات معلقة</div>';
        } else {
          var h = '<table class="data-table"><thead><tr><th>الطلب</th><th>المورد</th><th>المنتج</th><th>المبلغ المطلوب</th><th>إجراء</th></tr></thead><tbody>';
          orders.forEach(o => {
            var reqName = o.purchase_requests ? o.purchase_requests.item_name : '-';
            var amt = (o.price || 0) * (o.quantity || 0);
            h += '<tr><td>'+(o.id.split('-')[0].toUpperCase())+'</td><td>'+(o.supplier_name||'-')+'</td><td>'+reqName+'</td><td style="color:var(--accent-danger);font-weight:bold">- '+amt+' EGP</td>';
            h += '<td><button class="btn btn-sm btn-danger" onclick="window.processPendingPayment(\'purchase\',\''+o.id+'\',\''+(o.supplier_name||'-')+'\','+amt+')">💳 سداد للمورد</button></td></tr>';
          });
          h += '</tbody></table>';
          pCon.innerHTML = h;
        }
      });
    }
    loadPendingPayments();
  }

  // ===== ADD MODALS FOR EACH FINANCIAL TAB =====
  window.showAddFinanceModal = function(type) {
    var body = '';
    var title = '';

    if (type === 'treasury') {
      title = '➕ إضافة خزنة / بنك / شيك';
      body = '<div class="form-field"><label>النوع *</label><select id="fin-type" class="form-input" onchange="var c=document.getElementById(\'fin-check-fields\');var s=document.getElementById(\'fin-safe-fields\');if(this.value===\'check\'){c.style.display=\'block\';s.style.display=\'none\';}else{c.style.display=\'none\';s.style.display=\'block\';}"><option value="safe">خزنة (Safe)</option><option value="bank">بنك (Bank)</option><option value="check">شيك (Check)</option></select></div>';
      // Safe/Bank fields
      body += '<div id="fin-safe-fields">';
      body += '<div class="form-field"><label>الاسم *</label><input type="text" id="fin-name" class="form-input" placeholder="مثلاً: الخزنة الرئيسية"></div>';
      body += '<div class="form-field"><label>الرصيد الافتتاحي (EGP)</label><input type="number" id="fin-balance" class="form-input" value="0"></div>';
      body += '</div>';
      // Check fields
      body += '<div id="fin-check-fields" style="display:none">';
      body += '<div class="form-field"><label>اتجاه الشيك (Incoming / Outgoing) *</label><select id="fin-check-direction" class="form-input"><option value="check_issued">صادر - دفع مصروفات (Outgoing)</option><option value="check_received">وارد - تحصيل إيرادات (Incoming)</option></select></div>';
      body += '<div class="form-field"><label>رقم الشيك *</label><input type="text" id="fin-check-num" class="form-input" placeholder="CHK-001"></div>';
      body += '<div class="form-field"><label>المستفيد / العميل *</label><input type="text" id="fin-check-beneficiary" class="form-input" placeholder="اسم الشخص أو الجهة"></div>';
      body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="fin-check-amount" class="form-input"></div>';
      body += '<div class="form-field"><label>تاريخ الاستحقاق *</label><input type="date" id="fin-check-date" class="form-input"></div>';
      body += '<div class="form-field"><label>البيان</label><input type="text" id="fin-check-desc" class="form-input" placeholder="سبب إصدار أو استلام الشيك"></div>';
      body += '</div>';
    }
    else if (type === 'client') {
      title = '➕ إضافة عميل جديد';
      body = '<div class="form-field"><label>اسم العميل *</label><input type="text" id="fin-name" class="form-input"></div>';
      body += '<div class="form-field"><label>رقم الهاتف</label><input type="text" id="fin-phone" class="form-input"></div>';
      body += '<div class="form-field"><label>البريد الإلكتروني</label><input type="email" id="fin-email" class="form-input"></div>';
      body += '<div class="form-field"><label>الرصيد الافتتاحي (EGP)</label><input type="number" id="fin-balance" class="form-input" value="0"></div>';
    }
    else if (type === 'supplier') {
      title = '➕ إضافة مورد جديد';
      body = '<div class="form-field"><label>اسم المورد *</label><input type="text" id="fin-name" class="form-input"></div>';
      body += '<div class="form-field"><label>رقم الهاتف</label><input type="text" id="fin-phone" class="form-input"></div>';
      body += '<div class="form-field"><label>البريد الإلكتروني</label><input type="email" id="fin-email" class="form-input"></div>';
      body += '<div class="form-field"><label>الرصيد الافتتاحي (EGP)</label><input type="number" id="fin-balance" class="form-input" value="0"></div>';
    }
    else if (type === 'journal') {
      title = '➕ إضافة قيد يومي';
      body = '<div class="form-field"><label>تاريخ القيد *</label><input type="date" id="fin-date" class="form-input" value="' + new Date().toISOString().split('T')[0] + '"></div>';
      body += '<div class="form-field"><label>البيان *</label><input type="text" id="fin-desc" class="form-input" placeholder="وصف القيد"></div>';
      body += '<div class="form-field"><label>الحساب المدين *</label><select id="fin-debit-acc" class="form-input"><option value="">اختر الحساب</option></select></div>';
      body += '<div class="form-field"><label>الحساب الدائن *</label><select id="fin-credit-acc" class="form-input"><option value="">اختر الحساب</option></select></div>';
      body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="fin-amount" class="form-input" min="0"></div>';
    }
    else if (type === 'asset') {
      title = '➕ تسجيل أصل ثابت';
      body = '<div class="form-field"><label>اسم الأصل *</label><input type="text" id="fin-name" class="form-input" placeholder="مثلاً: سيارة نقل"></div>';
      body += '<div class="form-field"><label>كود الأصل</label><input type="text" id="fin-code" class="form-input" placeholder="FA-001"></div>';
      body += '<div class="form-field"><label>الفئة *</label><select id="fin-category" class="form-input"><option value="vehicles">سيارات (Vehicles)</option><option value="machinery">آلات ومعدات (Machinery)</option><option value="furniture">أثاث (Furniture)</option><option value="electronics">إلكترونيات (Electronics)</option><option value="building">مباني (Buildings)</option><option value="land">أراضي (Land)</option><option value="other">أخرى (Other)</option></select></div>';
      body += '<div class="form-field"><label>تاريخ الشراء *</label><input type="date" id="fin-date" class="form-input"></div>';
      body += '<div class="form-field"><label>القيمة الأصلية (EGP) *</label><input type="number" id="fin-amount" class="form-input"></div>';
      body += '<div class="form-field"><label>العمر الافتراضي (سنوات)</label><input type="number" id="fin-life" class="form-input" value="5"></div>';
      body += '<div class="form-field"><label>الحالة *</label><select id="fin-status" class="form-input"><option value="active">نشط (Active)</option><option value="disposed">تم التصرف (Disposed)</option></select></div>';
    }
    else if (type === 'tax') {
      title = '➕ تسجيل ضريبة';
      body = '<div class="form-field"><label>نوع الضريبة *</label><select id="fin-tax-type" class="form-input"><option value="vat">ضريبة القيمة المضافة (VAT)</option><option value="income_tax">ضريبة الدخل (Income Tax)</option><option value="payroll_tax">ضريبة كسب العمل (Payroll Tax)</option><option value="stamp_duty">ضريبة الدمغة (Stamp Duty)</option><option value="withholding">ضريبة الخصم والإضافة (Withholding)</option><option value="other">أخرى (Other)</option></select></div>';
      body += '<div class="form-field"><label>الفترة *</label><input type="month" id="fin-period" class="form-input"></div>';
      body += '<div class="form-field"><label>المبلغ الخاضع (EGP) *</label><input type="number" id="fin-taxable" class="form-input"></div>';
      body += '<div class="form-field"><label>قيمة الضريبة (EGP) *</label><input type="number" id="fin-amount" class="form-input"></div>';
      body += '<div class="form-field"><label>الحالة *</label><select id="fin-status" class="form-input"><option value="pending">معلقة (Pending)</option><option value="paid">مدفوعة (Paid)</option><option value="overdue">متأخرة (Overdue)</option></select></div>';
    }
    else if (type === 'petty') {
      title = '➕ صرف نقدية / عهدة';
      body = '<div class="form-field"><label>الموظف *</label><select id="fin-employee" class="form-input"><option value="">اختر الموظف</option></select></div>';
      body += '<div class="form-field"><label>طريقة الصرف *</label><select id="fin-method" class="form-input"><option value="cash">كاش من الخزنة (Cash)</option><option value="bank_transfer">تحويل بنكي (Bank Transfer)</option><option value="check">شيك (Check)</option></select></div>';
      body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="fin-amount" class="form-input"></div>';
      body += '<div class="form-field"><label>البيان / السبب</label><input type="text" id="fin-desc" class="form-input" placeholder="سبب الصرف"></div>';
    }

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button> <button class="btn btn-primary" id="fin-save-btn">💾 حفظ</button>';
    App.showModal(title, body, footer, true);

    // Populate dropdowns after modal opens
    if (type === 'journal') {
      sbClient.from('chart_of_accounts').select('*').eq('is_active', true).then(function(r) {
        var accs = r.data || [];
        var opts = '';
        accs.forEach(function(a) { opts += '<option value="' + a.code + '">' + a.code + ' - ' + a.name_ar + ' (' + a.name_en + ')</option>'; });
        var dSel = document.getElementById('fin-debit-acc');
        var cSel = document.getElementById('fin-credit-acc');
        if (dSel) dSel.innerHTML = '<option value="">اختر الحساب</option>' + opts;
        if (cSel) cSel.innerHTML = '<option value="">اختر الحساب</option>' + opts;
      });
    }
    if (type === 'petty') {
      sbClient.from('users').select('id, full_name, department').order('full_name').then(function(r) {
        var emps = r.data || [];
        var opts = '';
        emps.forEach(function(e) { opts += '<option value="' + e.id + '">' + e.full_name + ' (' + (e.department || '') + ')</option>'; });
        var sel = document.getElementById('fin-employee');
        if (sel) sel.innerHTML = '<option value="">اختر الموظف</option>' + opts;
      });
    }

    // Save handler
    setTimeout(function() {
      var saveBtn = document.getElementById('fin-save-btn');
      if (!saveBtn) return;
      saveBtn.addEventListener('click', function() {
        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ جاري الحفظ...';

        if (type === 'treasury') {
          var tType = document.getElementById('fin-type').value;
          if (tType === 'check') {
            // Issue or receive a check
            var chkDir = document.getElementById('fin-check-direction') ? document.getElementById('fin-check-direction').value : 'check_issued';
            var chkNum = document.getElementById('fin-check-num').value;
            var chkBen = document.getElementById('fin-check-beneficiary').value;
            var chkAmt = parseFloat(document.getElementById('fin-check-amount').value) || 0;
            var chkDate = document.getElementById('fin-check-date').value;
            var chkDesc = document.getElementById('fin-check-desc').value;
            if (!chkNum || !chkBen || !chkAmt) return alert('يرجى ملء بيانات الشيك');
            sbClient.from('finance_treasury_tx').insert({
              type: chkDir, method: 'check', amount: chkAmt,
              status: 'pending', check_number: chkNum, 
              description: 'شيك رقم ' + chkNum + ' — ' + chkBen + (chkDesc ? ' — ' + chkDesc : ''),
              employee_name: chkBen, check_due_date: chkDate || null,
              created_by: App.user.id, created_by_name: App.user.full_name
            }).then(function(r) {
              if (r.error) return alert(r.error.message);
              showToast('✅ تم حفظ الشيك رقم ' + chkNum, 'success');
              App.closeModal(); loadData();
            });
          } else {
            var tbl = tType === 'bank' ? 'finance_bank_accounts' : 'finance_safes';
            sbClient.from(tbl).insert({ name: document.getElementById('fin-name').value, balance: parseFloat(document.getElementById('fin-balance').value) || 0 }).then(function(r) {
              if (r.error) return alert(r.error.message);
              showToast('✅ تم إضافة ' + (tType === 'bank' ? 'البنك' : 'الخزنة'), 'success');
              App.closeModal(); loadData();
            });
          }
        }
        else if (type === 'client') {
          sbClient.from('finance_clients').insert({ name: document.getElementById('fin-name').value, phone: document.getElementById('fin-phone').value, email: document.getElementById('fin-email').value, balance: parseFloat(document.getElementById('fin-balance').value) || 0 }).then(function(r) {
            if (r.error) return alert(r.error.message);
            showToast('✅ تم إضافة العميل', 'success'); App.closeModal(); loadData();
          });
        }
        else if (type === 'supplier') {
          sbClient.from('finance_suppliers').insert({ name: document.getElementById('fin-name').value, phone: document.getElementById('fin-phone').value, email: document.getElementById('fin-email').value, balance: parseFloat(document.getElementById('fin-balance').value) || 0 }).then(function(r) {
            if (r.error) return alert(r.error.message);
            showToast('✅ تم إضافة المورد', 'success'); App.closeModal(); loadData();
          });
        }
        else if (type === 'journal') {
          var debitAcc = document.getElementById('fin-debit-acc').value;
          var creditAcc = document.getElementById('fin-credit-acc').value;
          var amt = parseFloat(document.getElementById('fin-amount').value) || 0;
          if (!debitAcc || !creditAcc || !amt) return alert('يرجى ملء جميع الحقول');
          sbClient.from('finance_journal_entries').insert({
            entry_date: document.getElementById('fin-date').value, description: document.getElementById('fin-desc').value,
            total_debit: amt, total_credit: amt, status: 'draft',
            created_by: App.user.id, created_by_name: App.user.full_name
          }).select().then(function(r) {
            if (r.error) return alert(r.error.message);
            var entryId = r.data[0].id;
            var dName = document.getElementById('fin-debit-acc').selectedOptions[0].text;
            var cName = document.getElementById('fin-credit-acc').selectedOptions[0].text;
            sbClient.from('finance_journal_lines').insert([
              { journal_entry_id: entryId, account_code: debitAcc, account_name: dName, debit: amt, credit: 0 },
              { journal_entry_id: entryId, account_code: creditAcc, account_name: cName, debit: 0, credit: amt }
            ]).then(function() {
              showToast('✅ تم إضافة القيد', 'success'); App.closeModal(); loadData();
            });
          });
        }
        else if (type === 'asset') {
          sbClient.from('finance_fixed_assets').insert({
            name: document.getElementById('fin-name').value, asset_code: document.getElementById('fin-code').value,
            category: document.getElementById('fin-category').value, purchase_date: document.getElementById('fin-date').value,
            original_value: parseFloat(document.getElementById('fin-amount').value) || 0,
            current_value: parseFloat(document.getElementById('fin-amount').value) || 0,
            useful_life_years: parseInt(document.getElementById('fin-life').value) || 5,
            status: document.getElementById('fin-status').value
          }).then(function(r) {
            if (r.error) return alert(r.error.message);
            showToast('✅ تم تسجيل الأصل', 'success'); App.closeModal(); loadData();
          });
        }
        else if (type === 'tax') {
          sbClient.from('finance_taxes').insert({
            tax_type: document.getElementById('fin-tax-type').value, period: document.getElementById('fin-period').value,
            taxable_amount: parseFloat(document.getElementById('fin-taxable').value) || 0,
            tax_amount: parseFloat(document.getElementById('fin-amount').value) || 0,
            status: document.getElementById('fin-status').value
          }).then(function(r) {
            if (r.error) return alert(r.error.message);
            showToast('✅ تم تسجيل الضريبة', 'success'); App.closeModal(); loadData();
          });
        }
        else if (type === 'petty') {
          var empId = document.getElementById('fin-employee').value;
          var empName = document.getElementById('fin-employee').options[document.getElementById('fin-employee').selectedIndex].text.split(' (')[0];
          var method = document.getElementById('fin-method').value;
          if (!empId) return alert('اختر الموظف');
          sbClient.from('finance_treasury_tx').insert({
            type: method === 'check' ? 'check_issued' : 'petty_cash', 
            status: method === 'check' ? 'pending' : 'cleared',
            method: method,
            amount: parseFloat(document.getElementById('fin-amount').value) || 0,
            description: document.getElementById('fin-desc').value,
            employee_id: empId, 
            employee_name: empName,
            created_by: App.user.id, 
            created_by_name: App.user.full_name
          }).then(function(r) {
            if (r.error) return alert(r.error.message);
            showToast('✅ تم صرف النقدية', 'success'); App.closeModal(); loadData();
          });
        }
      });
    }, 200);
  };

  // Check Clearance Logic
  window.clearCheck = function(id) {
    // Fetch transaction details first
    sbClient.from('finance_treasury_tx').select('*').eq('id', id).single().then(function(txRes) {
      if(txRes.error || !txRes.data) return alert('خطأ في استرجاع بيانات الشيك');
      var tx = txRes.data;
      var isOutbound = (tx.type === 'check_issued' || tx.type === 'supplier_payment' || tx.type === 'petty_cash');
      var amount = parseFloat(tx.amount) || 0;

      sbClient.from('finance_bank_accounts').select('*').then(function(bres) {
        sbClient.from('finance_safes').select('*').then(function(sres) {
          var opts = '';
          (bres.data||[]).forEach(b => { opts += '<option value="bank|'+b.id+'|'+b.name+'">بنك: '+b.name+' (رصيد: '+b.balance+')</option>'; });
          (sres.data||[]).forEach(s => { opts += '<option value="safe|'+s.id+'|'+s.name+'">خزنة: '+s.name+' (رصيد: '+s.balance+')</option>'; });
          
          var body = '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;margin-bottom:12px">';
          body += '<strong>نوع الشيك:</strong> ' + (isOutbound ? '<span style="color:var(--accent-danger)">صرف (خروج نقدية)</span>' : '<span style="color:var(--accent-success)">تحصيل (دخول نقدية)</span>') + '<br>';
          body += '<strong>المبلغ:</strong> <span style="font-weight:bold">' + amount.toLocaleString() + ' EGP</span><br>';
          body += '</div>';
          body += '<div class="form-field"><label>الحساب المرتبط (بنك / خزنة) *</label><select id="chk-acc" class="form-input">'+opts+'</select></div>';
          
          App.showModal('تأكيد صرف / تحصيل الشيك', body, 
            '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="chk-confirm">تأكيد العملية</button>');
          
          document.getElementById('chk-confirm').onclick = function() {
            var sel = document.getElementById('chk-acc').value.split('|');
            var accType = sel[0];
            var accId = sel[1];
            var accName = sel[2];
            var table = accType === 'bank' ? 'finance_bank_accounts' : 'finance_safes';
            
            this.disabled = true; this.innerHTML = 'جاري التحديث...';

            // Get current balance of that account
            sbClient.from(table).select('balance').eq('id', accId).single().then(function(bRes) {
              if (bRes.error) return alert(bRes.error.message);
              var currentBalance = parseFloat(bRes.data.balance) || 0;
              
              if (isOutbound && amount > currentBalance) {
                alert('الرصيد غير كافي في ' + accName);
                document.getElementById('chk-confirm').disabled = false;
                document.getElementById('chk-confirm').innerHTML = 'تأكيد العملية';
                return;
              }

              var newBalance = isOutbound ? (currentBalance - amount) : (currentBalance + amount);
              
              // Update balance
              sbClient.from(table).update({ balance: newBalance }).eq('id', accId).then(function(updRes) {
                if(updRes.error) return alert('خطأ في تحديث الرصيد: ' + updRes.error.message);

                // Mark check as cleared
                sbClient.from('finance_treasury_tx').update({
                  status: 'cleared',
                  cleared_account: accName,
                  cleared_date: new Date().toISOString()
                }).eq('id', id).then(function(res) {
                  if(res.error) return alert(res.error.message);
                  App.closeModal();
                  loadData();
                  showToast('✅ تم تأكيد صرف الشيك وتحديث رصيد: ' + accName, 'success');
                });
              });
            });
          };
        });
      });
    });
  };

  // Generic Status Change for any finance table
  window.changeFinStatus = function(table, id, newStatus) {
    if (!confirm('تأكيد تغيير الحالة إلى: ' + newStatus + '؟')) return;
    sbClient.from(table).update({ status: newStatus }).eq('id', id).then(function(res) {
      if (res.error) return alert(res.error.message);
      showToast('✅ تم تحديث الحالة بنجاح', 'success');
      loadData();
    });
  };

  // Transfer between accounts
  window.showTransferModal = function() {
    sbClient.from('finance_bank_accounts').select('*').then(function(bres) {
      sbClient.from('finance_safes').select('*').then(function(sres) {
        var allAccounts = [];
        (sres.data||[]).forEach(function(s) { allAccounts.push({ type: 'safe', table: 'finance_safes', id: s.id, name: 'خزنة: ' + s.name, balance: Number(s.balance) }); });
        (bres.data||[]).forEach(function(b) { allAccounts.push({ type: 'bank', table: 'finance_bank_accounts', id: b.id, name: 'بنك: ' + b.name, balance: Number(b.balance) }); });

        var opts = '';
        allAccounts.forEach(function(a, i) { opts += '<option value="' + i + '">' + a.name + ' (رصيد: ' + a.balance.toLocaleString() + ' EGP)</option>'; });

        var body = '<div class="form-field"><label>من حساب (المصدر) *</label><select id="tf-from" class="form-input">' + opts + '</select></div>';
        body += '<div class="form-field"><label>إلى حساب (الوجهة) *</label><select id="tf-to" class="form-input">' + opts + '</select></div>';
        body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="tf-amount" class="form-input" min="1"></div>';
        body += '<div class="form-field"><label>ملاحظات</label><input type="text" id="tf-notes" class="form-input" placeholder="سبب التحويل"></div>';

        App.showModal('🔄 تحويل بين الحسابات', body,
          '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button> <button class="btn btn-primary" id="tf-save">تأكيد التحويل</button>');

        // Store accounts for reference
        window._tfAccounts = allAccounts;

        document.getElementById('tf-save').onclick = function() {
          var fromIdx = Number(document.getElementById('tf-from').value);
          var toIdx = Number(document.getElementById('tf-to').value);
          var amount = parseFloat(document.getElementById('tf-amount').value) || 0;
          var notes = document.getElementById('tf-notes').value;

          if (fromIdx === toIdx) return alert('لا يمكن التحويل لنفس الحساب');
          if (amount <= 0) return alert('المبلغ غير صحيح');

          var fromAcc = window._tfAccounts[fromIdx];
          var toAcc = window._tfAccounts[toIdx];

          if (amount > fromAcc.balance) return alert('الرصيد غير كافي! المتاح: ' + fromAcc.balance.toLocaleString() + ' EGP');

          this.disabled = true; this.textContent = 'جاري التحويل...';

          // Deduct from source
          sbClient.from(fromAcc.table).update({ balance: fromAcc.balance - amount }).eq('id', fromAcc.id).then(function(r1) {
            if (r1.error) return alert('خطأ في الخصم: ' + r1.error.message);
            // Add to destination
            sbClient.from(toAcc.table).update({ balance: toAcc.balance + amount }).eq('id', toAcc.id).then(function(r2) {
              if (r2.error) return alert('خطأ في الإيداع: ' + r2.error.message);
              // Log the transfer
              sbClient.from('finance_treasury_tx').insert({
                type: 'transfer', method: 'internal_transfer', amount: amount,
                description: 'تحويل من ' + fromAcc.name + ' إلى ' + toAcc.name + (notes ? ' — ' + notes : ''),
                status: 'cleared', created_by: App.user.id, created_by_name: App.user.full_name
              }).then(function() {
                App.closeModal();
                loadData();
                showToast('✅ تم تحويل ' + amount.toLocaleString() + ' EGP من ' + fromAcc.name + ' إلى ' + toAcc.name, 'success');
              });
            });
          });
        };
      });
    });
  };

  // Petty Cash Settlement
  window.settlePettyCash = function(id, originalAmount) {
    var body = '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;margin-bottom:12px">';
    body += '<strong>مبلغ العهدة الأصلي:</strong> <span style="color:var(--accent-primary);font-weight:bold">' + originalAmount + ' EGP</span>';
    body += '</div>';
    body += '<div class="form-field"><label>المبلغ المصروف فعلياً (EGP) *</label><input type="number" id="stl-spent" class="form-input" min="0" max="' + originalAmount + '" oninput="var r=document.getElementById(\'stl-returned\');if(r)r.value=(' + originalAmount + '-Number(this.value)).toFixed(2)"></div>';
    body += '<div class="form-field"><label>المبلغ المرتجع (EGP)</label><input type="number" id="stl-returned" class="form-input" value="0" readonly style="background:var(--bg-secondary)"></div>';
    body += '<div class="form-field"><label>ملاحظات التسوية</label><textarea id="stl-notes" class="form-input" rows="2" placeholder="تفاصيل المصروفات..."></textarea></div>';

    App.showModal('📋 تسوية العهدة', body,
      '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button> <button class="btn btn-primary" id="stl-save">💾 تأكيد التسوية</button>');

    document.getElementById('stl-save').onclick = function() {
      var spent = parseFloat(document.getElementById('stl-spent').value) || 0;
      var returned = parseFloat(document.getElementById('stl-returned').value) || 0;
      var notes = document.getElementById('stl-notes').value;

      if (spent <= 0 && returned <= 0) return alert('يرجى إدخال المبلغ المصروف');
      if (spent > originalAmount) return alert('المبلغ المصروف أكبر من العهدة الأصلية');

      this.disabled = true; this.textContent = '⏳ جاري الحفظ...';

      sbClient.from('finance_treasury_tx').update({
        settlement_status: 'settled',
        amount_spent: spent,
        amount_returned: returned,
        settlement_notes: notes,
        settlement_date: new Date().toISOString(),
        settled_by: App.user.full_name
      }).eq('id', id).then(function(res) {
        if (res.error) return alert(res.error.message);
        App.closeModal();
        loadData();
        showToast('✅ تمت تسوية العهدة — مصروف: ' + spent + ' EGP | مرتجع: ' + returned + ' EGP', 'success');
      });
    };
  };

  // Process Pending Payments (Sales/Purchases)
  window.processPendingPayment = function(type, orderId, name, amount) {
    sbClient.from('finance_bank_accounts').select('*').then(function(bres) {
      sbClient.from('finance_safes').select('*').then(function(sres) {
        var opts = '';
        var allAccs = [];
        (sres.data||[]).forEach(s => { allAccs.push({id: s.id, type: 'safe', table: 'finance_safes', name: 'خزنة: ' + s.name, balance: Number(s.balance)}); });
        (bres.data||[]).forEach(b => { allAccs.push({id: b.id, type: 'bank', table: 'finance_bank_accounts', name: 'بنك: ' + b.name, balance: Number(b.balance)}); });

        allAccs.forEach((a, i) => { opts += '<option value="'+i+'">'+a.name+' (رصيد: '+a.balance.toLocaleString()+' EGP)</option>'; });

        var title = type === 'sales' ? '💰 تحصيل فاتورة مبيعات' : '💳 سداد فاتورة مشتريات';
        var body = '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;margin-bottom:12px">';
        body += '<strong>المبلغ:</strong> <span style="font-size:1.1rem;font-weight:bold;color:'+(type==='sales'?'var(--accent-success)':'var(--accent-danger)')+'">' + amount.toLocaleString() + ' EGP</span><br>';
        body += '<strong>الطرف الآخر:</strong> ' + name;
        body += '</div>';
        body += '<div class="form-field"><label>الحساب (خزنة / بنك) *</label><select id="pay-acc" class="form-input">'+opts+'</select></div>';
        
        App.showModal(title, body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="pay-confirm">تأكيد العملية</button>');

        document.getElementById('pay-confirm').onclick = function() {
          var accIdx = document.getElementById('pay-acc').value;
          var acc = allAccs[accIdx];
          
          if(type === 'purchase' && amount > acc.balance) return alert('الرصيد غير كافي في ' + acc.name);

          this.disabled = true; this.innerHTML = 'جاري المعالجة...';

          var newBal = type === 'sales' ? (acc.balance + amount) : (acc.balance - amount);
          
          // Update Account Balance
          sbClient.from(acc.table).update({ balance: newBal }).eq('id', acc.id).then(function(r1) {
            if(r1.error) return alert(r1.error.message);

            // Log Transaction
            var desc = (type === 'sales' ? 'تحصيل مبيعات من العميل: ' : 'سداد مشتريات للمورد: ') + name + ' (طلب: ' + orderId.split('-')[0].toUpperCase() + ')';
            sbClient.from('finance_treasury_tx').insert({
              type: type === 'sales' ? 'client_payment' : 'supplier_payment',
              method: acc.type === 'bank' ? 'bank_transfer' : 'cash',
              amount: amount, description: desc, status: 'cleared', cleared_account: acc.name,
              created_by: App.user.id, created_by_name: App.user.full_name
            }).then(function() {
              
              // Update Original Order
              if (type === 'sales') {
                sbClient.from('sales_workflow_orders').update({
                  status: 'Paid - Awaiting Pickup', paid_amount: amount, remaining_amount: 0, payment_status: 'paid'
                }).eq('id', orderId).then(function() {
                  App.closeModal(); loadData(); showToast('✅ تم تحصيل المبلغ بنجاح', 'success');
                });
              } else {
                sbClient.from('purchase_orders').update({
                  payment_status: 'paid'
                }).eq('id', orderId).then(function() {
                  App.closeModal(); loadData(); showToast('✅ تم سداد المبلغ بنجاح', 'success');
                });
              }
            });
          });
        };
      });
    });
  };



  loadData();
};

// ==========================================
// MODULE 11: IT Tickets & Support
// ==========================================
Pages.itTickets = function(el) {
  var isIT = App.user && (App.user.department === 'IT' || App.user.role === 'it support' || App.user.role === 'it manager');
  var canEdit = isIT; // Only IT can edit/control
  var canControl = isIT; // Only IT can update ticket status
  var canViewAll = isIT || App.isOwner() || (App.user && App.user.role === 'hr manager');
  var tickets = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading IT Tickets...</div>';
    
    var query = sbClient.from('it_tickets').select('*').order('created_at', {ascending: false});
    if (!canViewAll) {
      query = query.eq('employee_id', App.user.id);
    }
    
    query.then(function(res) {
      tickets = res.data || [];
      render();
    });
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>IT Support Tickets (طلبات الدعم الفني)</h3>';
    if (true) {
      html += '<button class="btn btn-primary" onclick="newItTicketModal()">' + icon('plus') + ' Request IT Support</button>';
    }
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>IT Requests</h3><p>Manage hardware, software, and network issues' + (!canControl && canViewAll ? ' <span style="color:var(--accent-warning);font-size:0.8rem">(Read-Only)</span>' : '') + '</p></div></div><div class="card-body no-pad">';
    html += '<div class="table-container"><table class="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Department</th><th>Issue Type</th><th>Description</th><th>Priority</th><th>Status</th>' + (canControl ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    
    if (tickets.length === 0) {
      html += '<tr><td colspan="' + (canControl ? '8' : '7') + '" style="text-align:center;padding:40px;color:var(--text-muted)">No IT tickets found.</td></tr>';
    } else {
      tickets.forEach(function(t) {
        var statusColor = 'warning'; var statusIcon = 'alertCircle';
        if(t.status === 'in_progress') { statusColor = 'primary'; statusIcon = 'clock'; }
        if(t.status === 'resolved') { statusColor = 'success'; statusIcon = 'checkCircle'; }
        
        var prioColor = 'secondary';
        if(t.priority === 'high') prioColor = 'danger';
        if(t.priority === 'medium') prioColor = 'warning';

        html += '<tr>';
        html += '<td>' + formatDate(t.created_at) + '</td>';
        html += '<td style="font-weight:600">' + t.employee_name + '</td>';
        html += '<td>' + (t.department || '-') + '</td>';
        html += '<td>' + t.issue_type + '</td>';
        html += '<td style="max-width:250px;white-space:normal">' + t.description + '</td>';
        html += '<td><span class="badge badge-' + prioColor + '">' + t.priority.toUpperCase() + '</span></td>';
        html += '<td><span class="badge badge-' + statusColor + '">' + icon(statusIcon, 12) + ' ' + t.status.replace('_', ' ').toUpperCase() + '</span></td>';
        
        if (canEdit) {
          html += '<td>';
          if (t.status === 'open') {
            html += '<button class="btn btn-xs btn-primary" onclick="updateITStatus(\'' + t.id + '\', \'in_progress\')">Mark In Progress</button>';
          } else if (t.status === 'in_progress') {
            html += '<button class="btn btn-xs btn-success" onclick="updateITStatus(\'' + t.id + '\', \'resolved\')">Resolve</button>';
          } else {
            html += '<span style="color:var(--text-muted);font-size:0.8rem">Resolved</span>';
          }
          html += '</td>';
        }
        
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.updateITStatus = function(id, newStatus) {
    sbClient.from('it_tickets').update({status: newStatus, assigned_to: App.user.full_name}).eq('id', id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData();
      showToast('Ticket marked as ' + newStatus.replace('_', ' '), 'success');
    });
  };

  window.newItTicketModal = function() {
    var body = '<div class="form-row"><div class="form-field"><label>Issue Type (نوع المشكلة) *</label><select id="it-type" class="form-input">';
    body += '<option value="Hardware">Hardware (أجهزة)</option><option value="Software">Software (برامج)</option><option value="Network">Network (شبكات)</option><option value="Other">Other (أخرى)</option></select></div>';
    body += '<div class="form-field"><label>Priority (مستوى المشكلة) *</label><select id="it-prio" class="form-input">';
    body += '<option value="low">Low (سهلة / بسيطة)</option><option value="medium" selected>Medium (متوسطة)</option><option value="high">High (صعبة / طارئة)</option></select></div></div>';
    body += '<div class="form-field"><label>Description (تفاصيل المشكلة) *</label><textarea id="it-desc" class="form-input" rows="4" placeholder="Describe the issue..."></textarea></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-it-btn">Submit Request</button>';
    App.showModal('New IT Request (طلب دعم فني)', body, footer);
    
    document.getElementById('save-it-btn').addEventListener('click', function() {
      var type = document.getElementById('it-type').value;
      var prio = document.getElementById('it-prio').value;
      var desc = document.getElementById('it-desc').value.trim();
      
      if(!desc) return alert('Please describe the issue');
      
      var btn = this;
      btn.innerHTML = '<span class="spinner"></span> Sending...';
      btn.disabled = true;
      
      sbClient.from('it_tickets').insert([{
        employee_id: App.user.id,
        employee_name: App.user.full_name,
        department: App.user.department,
        issue_type: type,
        description: desc,
        priority: prio,
        status: 'open'
      }]).then(function(r) {
        if(r.error) {
          btn.innerHTML = 'Submit Request';
          btn.disabled = false;
          return alert(r.error.message);
        }
        App.closeModal();
        loadData();
        showToast('IT Support Request Submitted Successfully', 'success');
      });
    });
  };

  loadData();
};
// MODULE 12: Payroll Funding (Finance)
Pages.payrollFunding = function(el) {
  var isFinance = App.user && App.user.department === 'Finance';
  var isOwner = App.isOwner();
  var isHRManager = App.user && App.user.role === 'hr manager';
  if(!isFinance && !isOwner && !isHRManager) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Access Denied. Finance & Management only.</div>';
    return;
  }

  var processingPayroll = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading payroll funds...</div>';
    sbClient.from('payroll').select('*').in('status', ['processing', 'funds_released']).then(function(r) {
      if(r.error) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">Error: ' + r.error.message + '</div>'; return; }
      processingPayroll = r.data || [];
      render();
    });
  }

  function render() {
    var fundsGroups = {};
    processingPayroll.forEach(function(p) {
      var key = p.month + '|' + p.status;
      if(!fundsGroups[key]) fundsGroups[key] = { month: p.month, status: p.status, records: [], total: 0 };
      fundsGroups[key].records.push(p);
      fundsGroups[key].total += p.net_salary || 0;
    });

    var html = '<div class="card" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-success-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-success)">' + icon('briefcase', 22) + '</div>';
    html += '<h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">صرف المرتبات للـ HR (Payroll Funding)</h3>';
    html += '</div>';
    html += '<p style="color:var(--text-secondary);direction:rtl;text-align:right">دورة صرف الرواتب: 1) مراجعة الحسابات وتسليم العهدة 2) استلام الـ HR للعهدة 3) الدفع للموظفين.</p>';
    html += '</div>';

    var keys = Object.keys(fundsGroups).sort(function(a, b) { return a > b ? -1 : 1; });

    if(keys.length === 0) {
      html += '<div class="empty-state" style="padding:60px">' + icon('checkCircle', 40) + '<p>No pending salaries require funding or acceptance.</p></div>';
      el.innerHTML = html;
      return;
    }

    keys.forEach(function(k) {
      var group = fundsGroups[k];
      html += '<div class="card" style="margin-bottom:20px"><div class="card-header"><div><h3>' + group.month + ' - ' + (group.status === 'processing' ? 'Pending Finance Funding' : 'Awaiting HR Acceptance') + '</h3><p>' + group.records.length + ' employees need payment</p></div></div>';
      html += '<div class="card-body" style="text-align:center;padding:30px">';
      html += '<div style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:8px">إجمالي المبلغ المطلوب</div>';
      html += '<div style="font-size:2.5rem;font-weight:900;color:var(--accent-primary);margin-bottom:24px">EGP ' + group.total.toLocaleString() + '</div>';
      
      if (group.status === 'processing') {
        if (isFinance || isOwner) {
          html += '<button class="btn btn-success btn-lg" onclick="window.releaseFunds(\'' + k + '\')">💰 تسليم العهدة للـ HR (Release Funds)</button>';
        } else {
          html += '<div style="color:var(--text-muted)">⏳ بانتظار موافقة وتسليم الحسابات...</div>';
        }
      } else if (group.status === 'funds_released') {
        if (isHRManager || isOwner) {
          html += '<div style="display:flex;justify-content:center;gap:16px">';
          html += '<button class="btn btn-success btn-lg" onclick="window.acceptFunds(\'' + k + '\')">✅ استلام العهدة (Accept Funds)</button>';
          html += '<button class="btn btn-outline btn-lg" style="color:var(--accent-danger);border-color:var(--accent-danger)" onclick="window.rejectFunds(\'' + k + '\')">❌ رفض العهدة (Reject)</button>';
          html += '</div>';
        } else {
          html += '<div style="color:var(--text-muted)">⏳ بانتظار استلام الـ HR للعهدة...</div>';
        }
      }
      
      html += '</div></div>';
    });

    el.innerHTML = html;

    window.releaseFunds = function(k) {
      var group = fundsGroups[k];
      if(!confirm('Are you sure you want to release EGP ' + group.total.toLocaleString() + ' to HR?')) return;
      var recordIds = group.records.map(function(r) { return r.id; });
      sbClient.from('payroll').update({ status: 'funds_released' }).in('id', recordIds).then(function(r) {
        if(r.error) return alert(r.error.message);
        showToast('Funds released successfully. HR must now accept them.', 'success');
        loadData();
      });
    };

    window.acceptFunds = function(k) {
      var group = fundsGroups[k];
      if(!confirm('Are you sure you want to Accept EGP ' + group.total.toLocaleString() + ' from Finance?')) return;
      var recordIds = group.records.map(function(r) { return r.id; });
      sbClient.from('payroll').update({ status: 'funds_accepted' }).in('id', recordIds).then(function(r) {
        if(r.error) return alert(r.error.message);
        showToast('Funds accepted! You can now mark salaries as paid.', 'success');
        loadData();
      });
    };

    window.rejectFunds = function(k) {
      var group = fundsGroups[k];
      if(!confirm('Are you sure you want to Reject this funding and return it to Finance?')) return;
      var recordIds = group.records.map(function(r) { return r.id; });
      sbClient.from('payroll').update({ status: 'processing' }).in('id', recordIds).then(function(r) {
        if(r.error) return alert(r.error.message);
        showToast('Funds rejected and returned to Finance.', 'warning');
        loadData();
      });
    };
  }

  loadData();
};
