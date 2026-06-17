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
            html += '<button class="btn btn-xs btn-success" onclick="issueMaterial(\''+m.id+'\',\''+m.item_id+'\','+m.quantity_needed+', ' + isTool + ')">✅ Issue (صرف)</button>';
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

  window.issueMaterial = function(mrId, itemId, qty, isTool) {
    var confirmMsg = isTool ? 'Issue ' + qty + ' units as a Tool (عُهدة) to Maintenance?' : 'Issue ' + qty + ' units from Warehouse?';
    if(!confirm(confirmMsg)) return;

    var doIssue = function() {
      var nextStatus = isTool ? 'tool_out' : 'issued';
      sbClient.from('material_requests').update({status: nextStatus, quantity_issued: qty, approved_by: App.user.full_name}).eq('id', mrId).then(function(r2) {
        if(r2.error) return alert(r2.error.message);
        
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
        if(res.error || !res.data) return alert('Item not found');
        var currentQty = res.data.quantity;
        if(qty > currentQty) return alert('Not enough stock! Current: ' + currentQty);
        sbClient.from('inventory_items').update({quantity: currentQty - qty}).eq('id', itemId).then(function(r) {
          if(r.error) return alert(r.error.message);
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
          sbClient.from('inventory_transactions').insert({
            item_id: itemId, item_name: itemName,
            transaction_type: 'out', quantity: qty,
            processed_by: App.user.full_name,
            notes: notes
          }).then(function(r) {
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

  var isAllowed = isFinance || isOwner || isHRManager || isProcManager || isProcEmp;

  if (!isAllowed) {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to Finance, Procurement, and Management.</p></div>';
    return;
  }

  var txs = [];
  var bankTotal = 0;
  var safeTotal = 0;

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Treasury Data...</div>';
    sbClient.from('finance_treasury_tx').select('*').order('created_at', {ascending: false}).then(function(res) {
      if (res.error && res.error.message.includes('relation "finance_treasury_tx" does not exist')) {
        renderSetup();
        return;
      }
      if (res.error) {
        if(res.error.message.includes('relationship')) return alert('Schema Error: ' + res.error.message);
        return alert(res.error.message);
      }
      txs = res.data || [];
      
      Promise.all([
        sbClient.from('users').select('id, full_name, department'),
        sbClient.from('purchase_requests').select('*, purchase_orders(*)').eq('status', 'pending_finance'),
        sbClient.from('sales_workflow_orders').select('*').order('created_at', {ascending: false}),
        sbClient.from('supplier_orders').select('*, suppliers(company_name)').order('created_at', {ascending: false}),
        sbClient.from('finance_payments').select('*').order('payment_date', {ascending: false})
      ]).then(function(uRes) {
        var userMap = {};
        var allUsers = uRes[0].data || [];
        var pendingReqs = uRes[1].data || [];
        var allSales = uRes[2] ? (uRes[2].data || []) : [];
        var allPurchases = uRes[3] ? (uRes[3].data || []) : [];
        var allPayments = uRes[4] ? (uRes[4].data || []) : [];
        var pendingSales = allSales.filter(function(s) { return s.status === 'Pending Payment' || (s.remaining_amount > 0 && s.status !== 'Delivered'); });
        
        allUsers.forEach(function(u) { userMap[u.id] = u; });
        txs.forEach(function(t) {
          t.employee_name = userMap[t.employee_id] ? userMap[t.employee_id].full_name : 'Unknown';
          t.employee_dept = userMap[t.employee_id] ? userMap[t.employee_id].department : 'Unknown';
        });
        calculateTotals();
        render(allUsers, pendingReqs, pendingSales, allSales, allPurchases, allPayments);
      });
    });
  }

  function calculateTotals() {
    bankTotal = 0;
    safeTotal = 0;
    txs.forEach(function(t) {
      var amt = Number(t.amount);
      if (t.type === 'deposit') {
        if (t.method === 'bank') bankTotal += amt;
        if (t.method === 'safe') safeTotal += amt;
      } else if (t.type === 'petty_cash' || t.type === 'expense') {
        if (t.method === 'bank') bankTotal -= amt;
        if (t.method === 'safe') safeTotal -= amt;
      } else if (t.type === 'transfer') {
        if (t.method === 'bank' && t.transfer_to === 'safe') { bankTotal -= amt; safeTotal += amt; }
        if (t.method === 'safe' && t.transfer_to === 'bank') { safeTotal -= amt; bankTotal += amt; }
      } else if (t.type === 'check_clearance') {
        bankTotal += amt;
      }
    });
  }

  function renderSetup() {
    var sql = "CREATE TABLE finance_treasury_tx (\\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\\n  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,\\n  type text NOT NULL,\\n  amount numeric NOT NULL,\\n  method text NOT NULL,\\n  transfer_to text,\\n  status text DEFAULT 'completed',\\n  employee_id uuid REFERENCES auth.users(id),\\n  notes text,\\n  created_by uuid REFERENCES auth.users(id)\\n);\\nALTER TABLE finance_treasury_tx ENABLE ROW LEVEL SECURITY;\\nCREATE POLICY \"Enable all\" ON finance_treasury_tx FOR ALL USING (true) WITH CHECK (true);";
    var html = '<div style="padding:40px; text-align:center;"><h2>⚠️ جدول الخزنة غير موجود</h2>';
    html += '<p>أرجو نسخ هذا الكود وتشغيله في SQL Editor في Supabase لتفعيل الخزنة والعهد:</p>';
    html += '<textarea style="width:100%; height:250px; text-align:left; direction:ltr;" readonly>' + sql + '</textarea>';
    html += '<button class="btn btn-primary" onclick="window.Pages.pettyCash(document.getElementById(\'page-content\'))" style="margin-top:20px">تحديث الصفحة بعد الإضافة</button></div>';
    el.innerHTML = html;
  }

  function render(allUsers, pendingReqs, pendingSales, allSales, allPurchases, allPayments) {
    var isProcurementOnly = isProcManager || isProcEmp;
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Treasury & Petty Cash (الخزنة والعهد)</h3>';
    html += '<div style="display:flex; gap:10px">';
    if (!isProcurementOnly) {
      html += '<button class="btn btn-outline" id="tab-treasury" style="border-color:var(--accent-primary);color:var(--accent-primary)">🏦 الخزنة والبنك</button>';
      html += '<button class="btn btn-ghost" id="tab-sales-payments">💳 مبيعات بانتظار التحصيل (' + (pendingSales ? pendingSales.length : 0) + ')</button>';
      html += '<button class="btn btn-ghost" id="tab-finance-req">🛒 تسويات الشراء (' + (pendingReqs ? pendingReqs.length : 0) + ')</button>';
      html += '<button class="btn btn-ghost" id="tab-balances">👥 حسابات العملاء والموردين</button>';
      html += '<button class="btn btn-ghost" id="tab-reports">📊 التقارير المالية</button>';
      html += '<button class="btn btn-ghost" id="tab-petty">💸 العهد (Petty Cash)</button>';
      html += '<button class="btn btn-ghost" id="tab-checks">📑 الشيكات تحت التحصيل</button>';
    } else {
      html += '<button class="btn btn-outline" id="tab-petty" style="border-color:var(--accent-primary);color:var(--accent-primary)">💸 العهد (Petty Cash)</button>';
    }
    html += '</div></div>';

    if (!isProcurementOnly) {
      html += '<div style="display:flex; gap:20px; margin-bottom:20px;">';
      html += '<div class="card" style="flex:1"><div class="card-body"><h4>إجمالي البنك</h4><h2 style="color:var(--accent-primary)">EGP ' + bankTotal.toLocaleString() + '</h2></div></div>';
      html += '<div class="card" style="flex:1"><div class="card-body"><h4>إجمالي الخزنة (كاش)</h4><h2 style="color:var(--accent-success)">EGP ' + safeTotal.toLocaleString() + '</h2></div></div>';
      html += '</div>';

      html += '<div id="view-treasury">';
      html += '<div style="margin-bottom:15px"><button class="btn btn-success" onclick="window.trAddFunds()">' + icon('plus') + ' إيداع رصيد</button> <button class="btn btn-warning" style="margin-left:8px" onclick="window.trTransfer()">' + icon('refreshCw') + ' تحويل بين الحسابات</button></div>';
      html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>الطريقة</th><th>ملاحظات</th></tr></thead><tbody>';
      var trTxs = txs.filter(function(t) { return t.type !== 'petty_cash' && t.type !== 'check_clearance' && t.method !== 'check'; });
      trTxs.forEach(function(t) {
        html += '<tr><td>' + formatDate(t.created_at) + '</td><td><span class="badge badge-info">' + (t.type==='deposit' ? 'إيداع' : 'تحويل') + '</span></td><td style="font-weight:bold">' + t.amount + '</td><td>' + (t.method==='safe'?'كاش':t.method) + (t.transfer_to ? ' ➡️ '+(t.transfer_to==='safe'?'كاش':t.transfer_to) : '') + '</td><td>' + (t.notes||'-') + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    html += '<div id="view-petty" style="display:' + (isProcurementOnly ? 'block' : 'none') + '">';
    
    if (isProcManager) {
      // Show all procurement employees and their advance status
      var procUsers = allUsers.filter(function(u) { return u.department === 'Procurement'; });
      html += '<div class="card" style="margin-bottom:20px"><div class="card-header"><h3>حالة العهد لموظفي المشتريات</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>الموظف</th><th>استلم عهدة؟</th><th>إجمالي العهد</th></tr></thead><tbody>';
      procUsers.forEach(function(pu) {
        var userAdvances = txs.filter(function(t) { return t.type === 'petty_cash' && t.employee_id === pu.id; });
        var totalAdvances = userAdvances.reduce(function(sum, t) { return sum + Number(t.amount); }, 0);
        html += '<tr><td>' + pu.full_name + '</td><td>' + (totalAdvances > 0 ? '<span class="badge badge-success">نعم</span>' : '<span class="badge badge-danger">لا</span>') + '</td><td style="font-weight:bold">EGP ' + totalAdvances + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    if (!isProcurementOnly) {
      html += '<div style="margin-bottom:15px"><button class="btn btn-primary" onclick="window.trIssuePetty()">' + icon('dollarSign') + ' إصدار عهدة لموظف</button></div>';
    }
    
    html += '<h3>تفاصيل حركات العهد</h3><div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>الموظف</th><th>المبلغ</th><th>طريقة الصرف</th><th>البيان</th></tr></thead><tbody>';
    
    var pcTxs = txs.filter(function(t) { 
      if (t.type !== 'petty_cash') return false;
      if (isProcEmp) return t.employee_id === App.user.id;
      if (isProcManager) return t.employee_dept === 'Procurement';
      return true;
    });
    
    if(pcTxs.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:20px">لا يوجد عهد</td></tr>';
    pcTxs.forEach(function(t) {
      var empName = t.employee_name || 'Unknown';
      html += '<tr><td>' + formatDate(t.created_at) + '</td><td>' + empName + '</td><td style="color:var(--accent-danger);font-weight:bold">-' + t.amount + '</td><td>' + (t.method==='safe'?'كاش':t.method) + '</td><td>' + (t.notes||'-') + '</td></tr>';
    });
    html += '</tbody></table></div></div>';

    if (!isProcurementOnly) {
      html += '<div id="view-checks" style="display:none">';
    html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظات</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    var chTxs = txs.filter(function(t) { return t.method === 'check'; });
    if(chTxs.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:20px">لا يوجد شيكات</td></tr>';
    chTxs.forEach(function(t) {
      html += '<tr><td>' + formatDate(t.created_at) + '</td><td style="font-weight:bold">' + t.amount + '</td><td>' + (t.notes||'-') + '</td>';
      html += '<td><span class="badge badge-'+(t.status==='completed'?'success':'warning')+'">' + (t.status==='completed'?'تم التحصيل':'تحت التحصيل') + '</span></td>';
      html += '<td>';
      if(t.status !== 'completed') {
        html += '<button class="btn btn-sm btn-success" onclick="window.trClearCheck(\''+t.id+'\', '+t.amount+')">تأكيد تحصيل الشيك وإضافته للبنك</button>';
      } else {
        html += '-';
      }
      html += '</td></tr>';
    });
    html += '</tbody></table></div></div>';
    } // End if (!isProcurementOnly)

    if (!isProcurementOnly) {
      html += '<div id="view-finance-req" style="display:none">';
      html += '<h3>تسويات طلبات الشراء المعتمدة</h3>';
      html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>الصنف</th><th>مبلغ الشراء</th><th>الموظف الموكل</th><th>رصيد عهدته</th><th>إجراءات الحسابات</th></tr></thead><tbody>';
      
      if (!pendingReqs || pendingReqs.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;padding:20px">لا توجد طلبات في انتظار التسوية</td></tr>';
      } else {
        pendingReqs.forEach(function(req) {
          // Find if there is an approved quote for this request
          var approvedOrder = (req.purchase_orders || []).find(function(o) { return Number(o.petty_cash_amount) > 0; });
          var reqAmt = approvedOrder ? Number(approvedOrder.petty_cash_amount) : 0;
          
          // Let's assume requested_by is full name, find their ID
          var empObj = allUsers.find(function(u) { return u.full_name === req.requested_by; });
          var empId = empObj ? empObj.id : null;
          
          // Calculate advance balance
          var empAdvance = 0;
          if (empId) {
            empAdvance = txs.filter(function(t) { return t.type === 'petty_cash' && t.employee_id === empId; })
                            .reduce(function(sum, t) { return sum + Number(t.amount); }, 0);
          }

          html += '<tr>';
          html += '<td>' + formatDate(req.created_at) + '</td>';
          html += '<td>' + req.item_name + '</td>';
          html += '<td style="font-weight:bold;color:var(--accent-primary)">EGP ' + reqAmt + '</td>';
          html += '<td>' + (req.requested_by || 'غير محدد') + '</td>';
          html += '<td style="font-weight:bold;color:' + (empAdvance >= reqAmt ? 'var(--accent-success)' : 'var(--accent-danger)') + '">EGP ' + empAdvance + '</td>';
          
          html += '<td><div style="display:flex;gap:5px">';
          if (empAdvance > 0) {
            html += '<button class="btn btn-sm btn-primary" onclick="window.trSettlePurchase(\'' + req.id + '\', ' + reqAmt + ', \'' + empId + '\', true)">خصم من العهدة</button>';
          }
          html += '<button class="btn btn-sm btn-success" onclick="window.trSettlePurchase(\'' + req.id + '\', ' + reqAmt + ', \'' + (empId||'') + '\', false)">صرف كاش مستقل</button>';
          html += '</div></td></tr>';
        });
      }
      html += '</tbody></table></div></div>';
    }

    if (!isProcurementOnly) {
      html += '<div id="view-sales-payments" style="display:none">';
      html += '<div class="card"><div class="card-header"><h3>💳 مدفوعات المبيعات بانتظار التحصيل</h3></div><div class="card-body no-pad">';
      if (!pendingSales || pendingSales.length === 0) {
        html += '<div class="empty-state">لا توجد مدفوعات معلقة حالياً</div>';
      } else {
        html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>العميل</th><th>المنتج</th><th>الكمية</th><th>المبلغ المطلوب</th><th>إجراءات الحسابات</th></tr></thead><tbody>';
        pendingSales.forEach(function(ps) {
          // Calculate amount: assume a fixed price or let Finance enter it if total_amount is null
          var reqAmt = ps.total_amount || 0; 
          html += '<tr>';
          html += '<td>' + formatDate(ps.created_at) + '</td>';
          html += '<td><strong>' + ps.customer_name + '</strong></td>';
          html += '<td>' + ps.product_name + '</td>';
          html += '<td>' + ps.quantity_requested + '</td>';
          if (reqAmt > 0) {
            html += '<td style="font-weight:bold;color:var(--accent-primary)">EGP ' + reqAmt + '</td>';
          } else {
            html += '<td><span style="color:var(--text-muted);font-size:0.8rem">غير محدد (سيتم إدخاله عند الاستلام)</span></td>';
          }
          html += '<td><button class="btn btn-sm btn-success" onclick="window.trReceiveSalesPayment(\'' + ps.id + '\', \'' + ps.customer_name + '\')">تأكيد استلام المبلغ</button></td></tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div></div></div>';

      // --- Balances View ---
      var custMap = {}, suppMap = {};
      allSales.forEach(function(s) {
        var n = s.customer_name;
        if(!custMap[n]) custMap[n] = {name:n, invoices:0, total:0, paid:0, remaining:0, unpaid_count:0};
        custMap[n].invoices++;
        custMap[n].total += (s.total_amount || 0);
        custMap[n].paid += (s.paid_amount || 0);
        custMap[n].remaining += ((s.total_amount||0) - (s.paid_amount||0));
        if(s.payment_status !== 'paid') custMap[n].unpaid_count++;
      });
      allPurchases.forEach(function(p) {
        var n = (p.suppliers && p.suppliers.company_name) ? p.suppliers.company_name : 'مورد غير معروف';
        if(!suppMap[n]) suppMap[n] = {name:n, invoices:0, total:0, paid:0, remaining:0, unpaid_count:0};
        suppMap[n].invoices++;
        suppMap[n].total += (p.total_amount || 0);
        suppMap[n].paid += (p.paid_amount || 0);
        suppMap[n].remaining += ((p.total_amount||0) - (p.paid_amount||0));
        if(p.payment_status !== 'paid') suppMap[n].unpaid_count++;
      });

      html += '<div id="view-balances" style="display:none">';
      html += '<div style="display:flex; gap:20px;">';
      
      // Customers
      html += '<div class="card" style="flex:1"><div class="card-header"><h3>👥 حسابات العملاء</h3></div><div class="card-body no-pad"><div class="table-responsive"><table class="data-table"><thead><tr><th>العميل</th><th>مبيعات</th><th>مدفوع</th><th>مديونية</th><th>فواتير متأخرة</th></tr></thead><tbody>';
      Object.values(custMap).forEach(function(c) {
        html += '<tr><td><strong>' + c.name + '</strong></td><td>' + c.total + '</td><td style="color:var(--accent-success)">' + c.paid + '</td><td style="color:var(--accent-danger);font-weight:bold">' + c.remaining + '</td><td>' + c.unpaid_count + '</td></tr>';
      });
      if(Object.keys(custMap).length === 0) html += '<tr><td colspan="5" style="text-align:center">لا يوجد بيانات</td></tr>';
      html += '</tbody></table></div></div></div>';

      // Suppliers
      html += '<div class="card" style="flex:1"><div class="card-header"><h3>🏢 حسابات الموردين</h3></div><div class="card-body no-pad"><div class="table-responsive"><table class="data-table"><thead><tr><th>المورد</th><th>مشتريات</th><th>مسدد</th><th>مستحقات (علينا)</th><th>فواتير متأخرة</th></tr></thead><tbody>';
      Object.values(suppMap).forEach(function(s) {
        html += '<tr><td><strong>' + s.name + '</strong></td><td>' + s.total + '</td><td style="color:var(--accent-success)">' + s.paid + '</td><td style="color:var(--accent-danger);font-weight:bold">' + s.remaining + '</td><td>' + s.unpaid_count + '</td></tr>';
      });
      if(Object.keys(suppMap).length === 0) html += '<tr><td colspan="5" style="text-align:center">لا يوجد بيانات</td></tr>';
      html += '</tbody></table></div></div></div>';

      html += '</div></div>'; // end view-balances

      // --- Reports View ---
      html += '<div id="view-reports" style="display:none">';
      html += '<div class="card"><div class="card-header"><h3>📊 التقارير المالية (سجل المدفوعات)</h3></div><div class="card-body no-pad">';
      html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>طريقة السداد</th><th>المبلغ</th><th>مرجع</th><th>بواسطة</th></tr></thead><tbody>';
      allPayments.forEach(function(pmt) {
        var uName = allUsers.find(function(u){return u.id === pmt.created_by;});
        uName = uName ? uName.full_name : '-';
        html += '<tr><td>' + formatDate(pmt.payment_date) + '</td>';
        html += '<td><span class="badge badge-' + (pmt.invoice_type==='sales'?'success':'warning') + '">' + (pmt.invoice_type==='sales'?'مبيعات (تحصيل)':'مشتريات (سداد)') + '</span></td>';
        html += '<td>' + pmt.payment_method + '</td>';
        html += '<td><strong>EGP ' + pmt.amount + '</strong></td>';
        html += '<td>' + (pmt.reference_number || '-') + '</td>';
        html += '<td>' + uName + '</td></tr>';
      });
      if(allPayments.length === 0) html += '<tr><td colspan="6" style="text-align:center">لا يوجد بيانات</td></tr>';
      html += '</tbody></table></div>';
      html += '</div></div></div>'; // end view-reports
    }

    el.innerHTML = html;

    var allTabs = isProcurementOnly ? ['tab-petty'] : ['tab-treasury','tab-petty','tab-checks', 'tab-finance-req', 'tab-sales-payments', 'tab-balances', 'tab-reports'];
    var allViews = isProcurementOnly ? ['view-petty'] : ['view-treasury','view-petty','view-checks', 'view-finance-req', 'view-sales-payments', 'view-balances', 'view-reports'];
    allTabs.forEach(function(tid, idx) {
      var tabBtn = document.getElementById(tid);
      if(tabBtn) {
        tabBtn.addEventListener('click', function() {
          allTabs.forEach(function(t) { var b=document.getElementById(t); if(b){ b.className='btn btn-ghost'; b.style.color='inherit'; b.style.borderColor='transparent'; } });
          this.className='btn btn-outline'; this.style.color='var(--accent-primary)'; this.style.borderColor='var(--accent-primary)';
          allViews.forEach(function(v) { var vEl=document.getElementById(v); if(vEl) vEl.style.display='none'; });
          document.getElementById(allViews[idx]).style.display='block';
        });
      }
    });
  }

  window.trReceiveSalesPayment = function(id, customerName) {
    sbClient.from('sales_workflow_orders').select('*').eq('id', id).single().then(function(sRes) {
      if (sRes.error) return alert('خطأ في جلب بيانات الفاتورة: ' + sRes.error.message);
      var o = sRes.data;
      var remaining = o.remaining_amount !== undefined ? o.remaining_amount : (o.total_amount || 0);
      
      var b = '<div class="form-grid">';
      b += '<div class="form-group"><label>إجمالي الفاتورة</label><input type="text" class="form-input" disabled value="EGP ' + (o.total_amount||0) + '"></div>';
      b += '<div class="form-group"><label>المتبقي سداده</label><input type="text" class="form-input" disabled value="EGP ' + remaining + '"></div>';
      b += '<div class="form-group"><label>المبلغ المستلم (EGP) *</label><input type="number" id="pay-amt" class="form-input" value="' + remaining + '" max="' + remaining + '"></div>';
      b += '<div class="form-group"><label>طريقة الدفع *</label><select id="pay-method" class="form-input"><option value="cash">نقدي (خزنة)</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option></select></div>';
      b += '<div class="form-group" style="grid-column: span 2;"><label>رقم المرجع (رقم الشيك أو التحويل)</label><input type="text" id="pay-ref" class="form-input"></div>';
      b += '</div>';

      App.showModal('تسجيل دفعة للعميل: ' + customerName, b, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-success" id="pay-save">حفظ الدفعة</button>');

      document.getElementById('pay-save').onclick = function() {
        var amt = Number(document.getElementById('pay-amt').value);
        var method = document.getElementById('pay-method').value;
        var ref = document.getElementById('pay-ref').value;

        if (!amt || amt <= 0 || amt > remaining) return alert('مبلغ غير صحيح');

        var btn = document.getElementById('pay-save');
        btn.disabled = true; btn.innerHTML = 'جاري الحفظ...';

        var newPaid = (o.paid_amount || 0) + amt;
        var newRemaining = (o.total_amount || 0) - newPaid;
        var newPayStatus = newRemaining <= 0 ? 'paid' : 'partial';

        // 1. Insert into finance_payments
        sbClient.from('finance_payments').insert({
          invoice_type: 'sales', invoice_id: id, amount: amt, payment_method: method, reference_number: ref, created_by: App.user.id
        }).then(function() {
          // 2. Add to treasury (if cash or bank)
          var trMethod = method === 'cash' ? 'safe' : method;
          var trStatus = method === 'check' ? 'pending_clearance' : 'completed';
          sbClient.from('finance_treasury_tx').insert({
            type: 'deposit', method: trMethod, amount: amt, notes: 'دفعة من العميل ' + customerName + (ref ? ' - مرجع: ' + ref : ''), status: trStatus, created_by: App.user.id
          }).then(function() {
            // 3. Update Sales Order
            var updateData = {
              paid_amount: newPaid,
              remaining_amount: newRemaining,
              payment_status: newPayStatus
            };
            if (newPayStatus === 'paid') updateData.status = 'Pending Warehouse Delivery Approval';

            sbClient.from('sales_workflow_orders').update(updateData).eq('id', id).then(function() {
              App.closeModal();
              loadData();
            });
          });
        });
      };
    });
  };

  window.trAddFunds = function() {
    var body = '<div class="form-field"><label>طريقة الإيداع *</label><select id="tr-m" class="form-input"><option value="safe">كاش (في الخزنة)</option><option value="bank">تحويل بنكي</option><option value="check">شيك</option></select></div>';
    body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="tr-a" class="form-input" min="1"></div>';
    body += '<div class="form-field"><label>ملاحظات (اختياري)</label><input type="text" id="tr-n" class="form-input"></div>';
    App.showModal('إيداع رصيد (Add Funds)', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-success" id="tr-s1">حفظ الإيداع</button>');
    document.getElementById('tr-s1').onclick = function() {
      var m = document.getElementById('tr-m').value;
      var a = parseFloat(document.getElementById('tr-a').value);
      var n = document.getElementById('tr-n').value;
      if(!a) return alert('ادخل المبلغ');
      var status = m === 'check' ? 'pending_clearance' : 'completed';
      sbClient.from('finance_treasury_tx').insert({ type: 'deposit', method: m, amount: a, notes: n, status: status, created_by: App.user.id }).then(function(res) {
        if(res.error) return alert(res.error.message); App.closeModal(); loadData();
      });
    };
  };

  window.trTransfer = function() {
    var body = '<div class="form-field"><label>من حساب *</label><select id="tr-f" class="form-input"><option value="bank">البنك</option><option value="safe">الخزنة (كاش)</option></select></div>';
    body += '<div class="form-field"><label>إلى حساب *</label><select id="tr-t" class="form-input"><option value="safe">الخزنة (كاش)</option><option value="bank">البنك</option></select></div>';
    body += '<div class="form-field"><label>المبلغ (EGP) *</label><input type="number" id="tr-a2" class="form-input" min="1"></div>';
    App.showModal('تحويل بين الحسابات', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-warning" id="tr-s2">تأكيد التحويل</button>');
    document.getElementById('tr-s2').onclick = function() {
      var f = document.getElementById('tr-f').value; var t = document.getElementById('tr-t').value;
      var a = parseFloat(document.getElementById('tr-a2').value);
      if(f === t) return alert('لا يمكن التحويل لنفس الحساب');
      if(!a) return alert('ادخل المبلغ');
      sbClient.from('finance_treasury_tx').insert({ type: 'transfer', method: f, transfer_to: t, amount: a, created_by: App.user.id }).then(function(res) {
        if(res.error) return alert(res.error.message); App.closeModal(); loadData();
      });
    };
  };

  window.trIssuePetty = function() {
    sbClient.from('users').select('id, full_name').then(function(res) {
      var users = res.data || [];
      var body = '<div class="form-field"><label>الموظف *</label><select id="tr-e" class="form-input">';
      users.forEach(function(u){ body += '<option value="'+u.id+'">'+u.full_name+'</option>'; });
      body += '</select></div>';
      body += '<div class="form-field"><label>مبلغ العهدة (EGP) *</label><input type="number" id="tr-a3" class="form-input" min="1"></div>';
      body += '<div class="form-field"><label>طريقة الصرف *</label><select id="tr-m2" class="form-input"><option value="safe">كاش (من الخزنة)</option><option value="bank">تحويل بنكي</option></select></div>';
      body += '<div class="form-field"><label>البيان / سبب العهدة</label><input type="text" id="tr-n2" class="form-input"></div>';
      App.showModal('إصدار عهدة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="tr-s3">صرف العهدة</button>');
      document.getElementById('tr-s3').onclick = function() {
        var e = document.getElementById('tr-e').value;
        var a = parseFloat(document.getElementById('tr-a3').value);
        var m = document.getElementById('tr-m2').value;
        var n = document.getElementById('tr-n2').value;
        if(!a) return alert('ادخل المبلغ');
        sbClient.from('finance_treasury_tx').insert({ type: 'petty_cash', method: m, amount: a, employee_id: e, notes: n, created_by: App.user.id }).then(function(res) {
          if(res.error) return alert(res.error.message); App.closeModal(); loadData();
        });
      };
    });
  };

  window.trClearCheck = function(id, amt) {
    if(!confirm('تأكيد تحصيل الشيك بمبلغ ' + amt + ' وإضافته لرصيد البنك؟')) return;
    sbClient.from('finance_treasury_tx').update({status: 'completed'}).eq('id', id).then(function(res) {
      if(res.error) return alert(res.error.message);
      sbClient.from('finance_treasury_tx').insert({ type: 'check_clearance', method: 'bank', amount: amt, notes: 'تحصيل شيك', created_by: App.user.id }).then(function(r) {
        loadData();
      });
    });
  };

  window.trSettlePurchase = function(reqId, amt, empId, isDeduction) {
    var msg = isDeduction ? 'هل أنت متأكد من تسوية طلب الشراء بخصم ' + amt + ' من عهدة الموظف؟' : 'هل أنت متأكد من صرف ' + amt + ' كاش لطلب الشراء هذا؟';
    if (!confirm(msg)) return;
    
    var txObj = {
      amount: isDeduction ? -amt : amt,
      employee_id: empId || App.user.id,
      notes: 'تسوية طلب شراء #' + reqId.split('-')[0],
      created_by: App.user.id,
      type: isDeduction ? 'petty_cash' : 'expense',
      method: isDeduction ? 'settlement' : 'safe'
    };

    sbClient.from('finance_treasury_tx').insert(txObj).then(function(res) {
      if(res.error) return alert(res.error.message);
      sbClient.from('purchase_requests').update({status: 'purchased'}).eq('id', reqId).then(function(r) {
         if(r.error) return alert(r.error.message);
         loadData();
         showToast('تمت التسوية بنجاح', 'success');
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
