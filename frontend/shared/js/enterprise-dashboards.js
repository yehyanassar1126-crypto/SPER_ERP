// ===== ENTERPRISE DASHBOARDS & KPIs =====
window.Pages = window.Pages || {};

// ==========================================
// EXECUTIVE KPI DASHBOARD
// ==========================================
Pages.kpiDashboard = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading KPI Dashboard...</p></div>';

  Promise.all([
    sbClient.from('users').select('id,department,status,base_salary'),
    sbClient.from('attendance').select('id,status,delay_minutes,date').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)),
    sbClient.from('inventory_items').select('id,name,quantity,min_quantity'),
    sbClient.from('leave_requests').select('id,status,days').eq('status','pending'),
    sbClient.from('loans').select('id,status,remaining_amount').eq('status','active'),
    sbClient.from('it_tickets').select('id,status,priority').neq('status','resolved'),
    sbClient.from('kpi_definitions').select('*').eq('is_active', true),
    sbClient.from('kpi_values').select('*').order('created_at', {ascending: false}).limit(50)
  ]).then(function(results) {
    var users = results[0].data || [];
    var attendance = results[1].data || [];
    var inventory = results[2].data || [];
    var pendingLeaves = results[3].data || [];
    var activeLoans = results[4].data || [];
    var openTickets = results[5].data || [];
    var kpiDefs = results[6].data || [];
    var kpiVals = results[7].data || [];

    var activeUsers = users.filter(function(u) { return u.status === 'active'; });
    var totalSalaries = activeUsers.reduce(function(s,u) { return s + (parseFloat(u.base_salary) || 0); }, 0);
    var presentToday = attendance.filter(function(a) { return a.date === todayStr() && (a.status === 'present' || a.status === 'checked_in'); }).length;
    var attendanceRate = activeUsers.length > 0 ? Math.round((presentToday / activeUsers.length) * 100) : 0;
    var lowStock = inventory.filter(function(i) { return i.quantity <= i.min_quantity; });
    var totalLoanBalance = activeLoans.reduce(function(s,l) { return s + (parseFloat(l.remaining_amount) || 0); }, 0);

    // Department breakdown
    var deptMap = {};
    activeUsers.forEach(function(u) {
      if (!deptMap[u.department]) deptMap[u.department] = 0;
      deptMap[u.department]++;
    });

    var html = '';
    // Hero
    html += '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%);border-radius:16px;padding:32px;color:white;margin-bottom:24px;position:relative;overflow:hidden">';
    html += '<div style="position:relative;z-index:2"><h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;color:white">📊 Executive KPI Dashboard</h1>';
    html += '<p style="opacity:0.8;font-size:1rem">Real-time performance indicators across all departments</p></div>';
    html += '<div style="position:absolute;right:20px;top:10px;font-size:100px;opacity:0.05">📈</div></div>';

    // KPI Cards Row 1
    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _kpiCard('👥', 'Active Employees', activeUsers.length, null, '#6366f1');
    html += _kpiCard('✅', 'Attendance Rate', attendanceRate + '%', attendanceRate >= 90 ? 'success' : 'warning', '#22c55e');
    html += _kpiCard('💰', 'Monthly Payroll', 'EGP ' + totalSalaries.toLocaleString(), null, '#f59e0b');
    html += _kpiCard('📦', 'Low Stock Items', lowStock.length, lowStock.length > 5 ? 'danger' : 'success', '#ef4444');
    html += '</div>';

    // KPI Cards Row 2
    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _kpiCard('📋', 'Pending Leaves', pendingLeaves.length, pendingLeaves.length > 10 ? 'warning' : 'success', '#8b5cf6');
    html += _kpiCard('🏦', 'Active Loans', 'EGP ' + totalLoanBalance.toLocaleString(), null, '#06b6d4');
    html += _kpiCard('🎫', 'Open IT Tickets', openTickets.length, openTickets.length > 5 ? 'warning' : 'success', '#ec4899');
    html += _kpiCard('🏢', 'Departments', Object.keys(deptMap).length, null, '#14b8a6');
    html += '</div>';

    // Department Workforce Chart
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">';
    html += '<div class="card"><div class="card-header"><div><h3>Department Workforce</h3></div></div><div class="card-body"><canvas id="dept-chart" height="250"></canvas></div></div>';
    
    // Low Stock Alerts
    html += '<div class="card"><div class="card-header"><div><h3>⚠️ Low Stock Alerts</h3></div></div><div class="card-body">';
    if (lowStock.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:var(--text-muted)">✅ All inventory levels are healthy</div>';
    } else {
      lowStock.slice(0, 8).forEach(function(item) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-color)">';
        html += '<span style="font-weight:600">' + item.name + '</span>';
        html += '<span style="color:var(--accent-danger);font-weight:700">' + item.quantity + ' / ' + item.min_quantity + '</span></div>';
      });
    }
    html += '</div></div></div>';

    // KPI Definitions Table
    if (kpiDefs.length > 0) {
      html += '<div class="card"><div class="card-header"><div><h3>📊 Performance KPIs</h3><p>Key performance indicators tracking</p></div></div><div class="card-body no-pad">';
      html += '<table class="data-table"><thead><tr><th>KPI</th><th>Module</th><th>Target</th><th>Frequency</th></tr></thead><tbody>';
      kpiDefs.forEach(function(k) {
        html += '<tr><td style="font-weight:600">' + k.name + (k.name_ar ? '<br><small style="color:var(--text-muted)">' + k.name_ar + '</small>' : '') + '</td>';
        html += '<td><span class="badge badge-info">' + k.module + '</span></td>';
        html += '<td style="font-weight:700">' + (k.target_value || '-') + ' ' + (k.unit || '') + '</td>';
        html += '<td>' + (k.frequency || 'monthly') + '</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    el.innerHTML = html;

    // Render Chart
    var ctx = document.getElementById('dept-chart');
    if (ctx && typeof Chart !== 'undefined') {
      var labels = Object.keys(deptMap);
      var data = Object.values(deptMap);
      var colors = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#84cc16','#a855f7','#0ea5e9'];
      new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } } }
      });
    }
  });

  function _kpiCard(emoji, label, value, status, color) {
    var borderColor = status === 'danger' ? 'var(--accent-danger)' : status === 'warning' ? 'var(--accent-warning)' : 'transparent';
    return '<div class="stat-card" style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid ' + (color || '#6366f1') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<span style="font-size:1.8rem">' + emoji + '</span>' +
      (status ? '<span class="badge badge-' + status + '" style="font-size:0.7rem">' + status.toUpperCase() + '</span>' : '') +
      '</div>' +
      '<div style="font-size:1.6rem;font-weight:800;margin-bottom:4px">' + value + '</div>' +
      '<div style="color:var(--text-muted);font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">' + label + '</div></div>';
  }
};

// ==========================================
// LOGIN HISTORY PAGE
// ==========================================
Pages.loginHistory = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('login_history').select('*').order('created_at', {ascending: false}).limit(200).then(function(res) {
    var records = res.data || [];
    var html = '<div class="card"><div class="card-header"><div><h3>🔐 Login History (سجل تسجيل الدخول)</h3><p>' + records.length + ' records</p></div></div>';
    html += '<div class="card-body no-pad"><table class="data-table"><thead><tr><th>Date</th><th>User</th><th>Status</th><th>Reason</th></tr></thead><tbody>';
    if (records.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;padding:40px">No login records yet</td></tr>';
    } else {
      records.forEach(function(r) {
        var badge = r.login_status === 'success' ? 'success' : 'danger';
        html += '<tr><td>' + formatDateTime(r.created_at) + '</td>';
        html += '<td style="font-weight:600">' + (r.user_name || 'Unknown') + '</td>';
        html += '<td><span class="badge badge-' + badge + '">' + r.login_status + '</span></td>';
        html += '<td>' + (r.failure_reason || '-') + '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;
  });
};

// ==========================================
// ACTIVITY LOG PAGE
// ==========================================
Pages.activityLog = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('activity_log').select('*').order('created_at', {ascending: false}).limit(200).then(function(res) {
    var records = res.data || [];
    var html = '<div class="card"><div class="card-header"><div><h3>📋 Activity Log (سجل النشاط)</h3><p>Detailed tracking of all system actions</p></div></div>';
    html += '<div class="card-body no-pad"><table class="data-table"><thead><tr><th>Date</th><th>User</th><th>Module</th><th>Action</th><th>Entity</th></tr></thead><tbody>';
    if (records.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px">No activity recorded yet</td></tr>';
    } else {
      records.forEach(function(r) {
        html += '<tr><td style="white-space:nowrap">' + formatDateTime(r.created_at) + '</td>';
        html += '<td style="font-weight:600">' + (r.user_name || '-') + '</td>';
        html += '<td><span class="badge badge-info">' + r.module + '</span></td>';
        html += '<td>' + r.action + '</td>';
        html += '<td>' + (r.entity_type || '-') + '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;
  });
};

// ==========================================
// TASK MANAGEMENT PAGE
// ==========================================
Pages.taskManagement = function(el) {
  var userId = App.user.id;
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  
  var query = App.isHR() || App.isOwner() 
    ? sbClient.from('tasks').select('*').order('created_at', {ascending: false})
    : sbClient.from('tasks').select('*').eq('assigned_to', userId).order('created_at', {ascending: false});

  query.then(function(res) {
    var tasks = res.data || [];
    var todo = tasks.filter(function(t){ return t.status === 'todo'; });
    var inProgress = tasks.filter(function(t){ return t.status === 'in_progress'; });
    var done = tasks.filter(function(t){ return t.status === 'done'; });

    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>📝 Task Management (إدارة المهام)</h3>';
    html += '<button class="btn btn-primary" onclick="newTaskModal()">' + icon('plus') + ' New Task</button></div>';

    // Stats
    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _kpiCard('📋', 'To Do', todo.length, null, '#6366f1');
    html += _kpiCard('🔄', 'In Progress', inProgress.length, null, '#f59e0b');
    html += _kpiCard('✅', 'Completed', done.length, null, '#22c55e');
    html += _kpiCard('📊', 'Total', tasks.length, null, '#8b5cf6');
    html += '</div>';

    // Task List
    html += '<div class="card"><div class="card-header"><div><h3>All Tasks</h3></div></div><div class="card-body no-pad">';
    html += '<table class="data-table"><thead><tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead><tbody>';
    
    if (tasks.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No tasks yet</td></tr>';
    } else {
      tasks.forEach(function(t) {
        var pColor = t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'info' : 'secondary';
        var sColor = t.status === 'done' ? 'success' : t.status === 'in_progress' ? 'warning' : t.status === 'review' ? 'info' : 'secondary';
        html += '<tr><td style="font-weight:600">' + t.title + '</td>';
        html += '<td>' + (t.assigned_to_name || '-') + '</td>';
        html += '<td><span class="badge badge-' + pColor + '">' + t.priority + '</span></td>';
        html += '<td><span class="badge badge-' + sColor + '">' + t.status + '</span></td>';
        html += '<td>' + (t.due_date ? formatDate(t.due_date) : '-') + '</td>';
        html += '<td>';
        if (t.status !== 'done') {
          var nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'review' : 'done';
          html += '<button class="btn btn-xs btn-primary" onclick="updateTaskStatus(\'' + t.id + '\',\'' + nextStatus + '\')">→ ' + nextStatus.replace('_',' ') + '</button>';
        } else {
          html += '<span style="color:var(--accent-success)">✅</span>';
        }
        html += '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    function _kpiCard(emoji, label, value, status, color) {
      return '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid ' + color + '">' +
        '<div style="font-size:1.5rem;margin-bottom:8px">' + emoji + '</div>' +
        '<div style="font-size:1.6rem;font-weight:800">' + value + '</div>' +
        '<div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">' + label + '</div></div>';
    }
  });

  window.newTaskModal = function() {
    sbClient.from('users').select('id,full_name').eq('status','active').then(function(res) {
      var emps = res.data || [];
      var body = '<div class="form-field"><label>Title *</label><input type="text" id="task-title" class="form-input" placeholder="Task title"></div>';
      body += '<div class="form-field"><label>Description</label><textarea id="task-desc" class="form-input" rows="3"></textarea></div>';
      body += '<div class="form-row"><div class="form-field"><label>Assign To</label><select id="task-assign" class="form-input"><option value="">Unassigned</option>';
      emps.forEach(function(e) { body += '<option value="' + e.id + '|' + e.full_name + '">' + e.full_name + '</option>'; });
      body += '</select></div><div class="form-field"><label>Priority</label><select id="task-priority" class="form-input"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div></div>';
      body += '<div class="form-field"><label>Due Date</label><input type="date" id="task-due" class="form-input"></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-task-btn">Create Task</button>';
      App.showModal('New Task', body, footer);

      document.getElementById('save-task-btn').addEventListener('click', function() {
        var title = document.getElementById('task-title').value;
        if (!title) { alert('Title required'); return; }
        var assignVal = document.getElementById('task-assign').value.split('|');
        var record = {
          title: title,
          description: document.getElementById('task-desc').value,
          assigned_to: assignVal[0] || null,
          assigned_to_name: assignVal[1] || null,
          assigned_by: App.user.id,
          priority: document.getElementById('task-priority').value,
          due_date: document.getElementById('task-due').value || null,
          status: 'todo'
        };
        sbClient.from('tasks').insert(record).then(function(r) {
          if (r.error) { alert(r.error.message); return; }
          App.closeModal();
          Pages.taskManagement(el);
          showToast('Task created', 'success');
        });
      });
    });
  };

  window.updateTaskStatus = function(id, status) {
    var updates = { status: status };
    if (status === 'done') updates.completed_at = new Date().toISOString();
    sbClient.from('tasks').update(updates).eq('id', id).then(function(r) {
      if (r.error) { alert(r.error.message); return; }
      Pages.taskManagement(el);
      showToast('Task updated', 'success');
    });
  };
};
