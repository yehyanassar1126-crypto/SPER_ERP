// ===== ERP MODULE: Maintenance (إدارة الصيانة) =====
window.Pages = window.Pages || {};

Pages.maintenance = function(el) {
  var isOwner = App.isOwner();
  var isMaintenance = App.user && (App.user.department === 'Maintenance' || App.user.role === 'maintenance manager' || App.user.role === 'technician');
  var isManager = App.isManager();
  
  // Everyone except HR can request maintenance, but only Maintenance dept/Owner can manage it.
  var canEdit = isOwner || isMaintenance;
  var isHR = App.isHR();
  var canViewAll = canEdit || isHR;

  var requests = [];
  var schedules = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Maintenance...</div>';
    Promise.all([
      sbClient.from('maintenance_requests').select('*').order('created_at', {ascending:false}),
      sbClient.from('maintenance_schedules').select('*').order('scheduled_date', {ascending:true})
    ]).then(function(res) {
      if (!res[0].error) requests = res[0].data || [];
      if (!res[1].error) schedules = res[1].data || [];
      render();
    });
  }

  function render() {
    var pendingReqs = requests.filter(function(r) { return r.status === 'pending'; });
    var inProgReqs = requests.filter(function(r) { return r.status === 'in_progress'; });
    var upcomingSchedules = schedules.filter(function(s) { return new Date(s.scheduled_date) >= new Date() && s.status !== 'completed'; });

    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>Maintenance & Facilities (إدارة الصيانة والمرافق)</h3>';
    if (!isHR) {
      html += '<button class="btn btn-primary" onclick="newMaintenanceRequest()">' + icon('tool') + ' Request Maintenance (طلب صيانة)</button>';
    }
    html += '</div>';

    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#ef4444','alertTriangle',pendingReqs.length,'Pending Requests (أعطال مسجلة)');
    html += _statCard('#3b82f6','tool',inProgReqs.length,'In Progress (جاري الإصلاح)');
    html += _statCard('#f59e0b','calendar',upcomingSchedules.length,'Upcoming PM (صيانة وقائية)');
    html += '</div>';

    html += '<div class="grid-2">';
    
    // 1. Maintenance Requests (Breakdowns)
    html += '<div class="card"><div class="card-header"><div><h3>🛠️ Maintenance Requests (طلبات الإصلاح)</h3><p>Reported breakdowns and issues</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Asset / Location</th><th>Issue</th><th>Priority</th><th>Status</th>' + (canEdit ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    
    var visibleRequests = canViewAll ? requests : requests.filter(function(r) { return r.requested_by === App.user.full_name; });
    
    if (visibleRequests.length === 0) {
      html += '<tr><td colspan="' + (canEdit ? '6' : '5') + '" style="text-align:center;padding:30px;color:var(--text-muted)">No maintenance requests found</td></tr>';
    } else {
      visibleRequests.forEach(function(r) {
        var sBadge = 'warning';
        if (r.status === 'in_progress') sBadge = 'primary';
        if (r.status === 'resolved') sBadge = 'success';

        html += '<tr><td>' + formatDate(r.created_at) + '</td><td style="font-weight:600">' + r.asset_name + '</td><td>' + r.issue_description + '</td>';
        html += '<td><span class="badge badge-' + (r.priority === 'high' ? 'danger' : 'warning') + '">' + r.priority.toUpperCase() + '</span></td>';
        html += '<td><span class="badge badge-' + sBadge + '">' + r.status.replace('_', ' ').toUpperCase() + '</span></td>';
        
        if (canEdit) {
          html += '<td>';
          if (r.status === 'pending') {
            html += '<button class="btn btn-xs btn-primary" onclick="updateMaintStatus(\'' + r.id + '\', \'in_progress\')">Start Work</button>';
          } else if (r.status === 'in_progress') {
            html += '<button class="btn btn-xs btn-success" onclick="updateMaintStatus(\'' + r.id + '\', \'resolved\')">Mark Resolved</button>';
          } else {
            html += '<span style="color:var(--text-muted);font-size:0.8rem">Done</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';

    // 2. Preventive Maintenance Schedule
    html += '<div class="card"><div class="card-header"><div style="display:flex;justify-content:space-between;width:100%;align-items:center"><div><h3>📅 Preventive Maintenance (الصيانة الوقائية)</h3><p>Scheduled inspections and servicing</p></div>';
    if (canEdit) html += '<button class="btn btn-sm btn-outline" onclick="newScheduleModal()">' + icon('plus') + ' Add Task</button>';
    html += '</div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Asset</th><th>Task Description</th><th>Assigned To</th><th>Status</th>' + (canEdit ? '<th>Actions</th>' : '') + '</tr></thead><tbody>';
    
    if (schedules.length === 0) {
      html += '<tr><td colspan="' + (canEdit ? '6' : '5') + '" style="text-align:center;padding:30px;color:var(--text-muted)">No scheduled tasks</td></tr>';
    } else {
      schedules.forEach(function(s) {
        var isOverdue = new Date(s.scheduled_date) < new Date() && s.status !== 'completed';
        var dColor = isOverdue ? 'color:var(--accent-danger);font-weight:bold' : '';
        
        html += '<tr><td style="' + dColor + '">' + s.scheduled_date + (isOverdue ? ' (Overdue)' : '') + '</td>';
        html += '<td style="font-weight:600">' + s.asset_name + '</td><td>' + s.task_description + '</td><td>' + (s.assigned_to || 'Unassigned') + '</td>';
        html += '<td><span class="badge badge-' + (s.status === 'completed' ? 'success' : 'secondary') + '">' + s.status.toUpperCase() + '</span></td>';
        
        if (canEdit) {
          html += '<td>';
          if (s.status !== 'completed') {
            html += '<button class="btn btn-xs btn-success" onclick="completeSchedule(\'' + s.id + '\')">Complete</button>';
          } else {
            html += '<span style="color:var(--text-muted);font-size:0.8rem">Done</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';

    html += '</div>'; // end grid-2
    el.innerHTML = html;
  }

  window.newMaintenanceRequest = function() {
    var b = '<div class="form-field"><label>Asset / Location (المعدة أو المكان) *</label><input type="text" id="mr-asset" class="form-input" placeholder="e.g. Generator 1, Office AC, Forklift"></div>';
    b += '<div class="form-field"><label>Issue Description (وصف العطل) *</label><textarea id="mr-issue" class="form-input" rows="3"></textarea></div>';
    b += '<div class="form-field"><label>Priority (الأهمية) *</label><select id="mr-prio" class="form-input"><option value="low">Low (بسيطة)</option><option value="medium" selected>Medium (متوسطة)</option><option value="high">High (عاجلة / توقف إنتاج)</option></select></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-mr">Submit Request</button>';
    App.showModal('Request Maintenance', b, f);

    document.getElementById('save-mr').addEventListener('click', function() {
      var ast = document.getElementById('mr-asset').value.trim();
      var iss = document.getElementById('mr-issue').value.trim();
      var pr = document.getElementById('mr-prio').value;
      if (!ast || !iss) return alert('Please fill in all fields');

      sbClient.from('maintenance_requests').insert({
        asset_name: ast, issue_description: iss, priority: pr,
        requested_by: App.user.full_name, status: 'pending'
      }).then(function(r) {
        if (r.error) return alert(r.error.message);
        App.closeModal(); loadData();
        showToast('Maintenance request submitted', 'success');
      });
    });
  };

  window.updateMaintStatus = function(id, newStatus) {
    sbClient.from('maintenance_requests').update({status: newStatus}).eq('id', id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData();
    });
  };

  window.newScheduleModal = function() {
    var b = '<div class="form-field"><label>Asset Name *</label><input type="text" id="ms-asset" class="form-input"></div>';
    b += '<div class="form-field"><label>Task Description *</label><input type="text" id="ms-task" class="form-input" placeholder="e.g. Oil Change, Filter Replacement"></div>';
    b += '<div class="form-field"><label>Scheduled Date *</label><input type="date" id="ms-date" class="form-input"></div>';
    b += '<div class="form-field"><label>Assigned Technician</label><input type="text" id="ms-tech" class="form-input" placeholder="e.g. Ahmed Ali"></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-ms">Add Schedule</button>';
    App.showModal('Add Preventive Maintenance', b, f);

    document.getElementById('save-ms').addEventListener('click', function() {
      var ast = document.getElementById('ms-asset').value.trim();
      var tsk = document.getElementById('ms-task').value.trim();
      var dt = document.getElementById('ms-date').value;
      var tch = document.getElementById('ms-tech').value;
      if (!ast || !tsk || !dt) return alert('Please fill in required fields');

      sbClient.from('maintenance_schedules').insert({
        asset_name: ast, task_description: tsk, scheduled_date: dt,
        assigned_to: tch, status: 'pending'
      }).then(function(r) {
        if (r.error) return alert(r.error.message);
        App.closeModal(); loadData();
        showToast('Schedule added', 'success');
      });
    });
  };

  window.completeSchedule = function(id) {
    if(!confirm('Mark this scheduled task as completed?')) return;
    sbClient.from('maintenance_schedules').update({status: 'completed'}).eq('id', id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData();
    });
  };

  loadData();
};
