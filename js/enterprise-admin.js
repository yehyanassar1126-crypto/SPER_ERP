// ===== ENTERPRISE ADMIN: Settings, Documents, Approvals =====
window.Pages = window.Pages || {};

// ==========================================
// SYSTEM SETTINGS PAGE
// ==========================================
Pages.systemSettings = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('system_settings').select('*').order('module').then(function(res) {
    var settings = res.data || [];
    var modules = {};
    settings.forEach(function(s) {
      if (!modules[s.module]) modules[s.module] = [];
      modules[s.module].push(s);
    });

    var html = '<div style="background:linear-gradient(135deg,#0f172a,#334155);border-radius:16px;padding:32px;color:white;margin-bottom:24px">';
    html += '<h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;color:white">⚙️ System Settings (إعدادات النظام)</h1>';
    html += '<p style="opacity:0.8">Configure system-wide parameters</p></div>';

    Object.keys(modules).forEach(function(mod) {
      html += '<div class="card" style="margin-bottom:16px"><div class="card-header"><div><h3>' + mod.charAt(0).toUpperCase() + mod.slice(1) + ' Settings</h3></div></div>';
      html += '<div class="card-body"><div style="display:grid;gap:16px">';
      modules[mod].forEach(function(s) {
        html += '<div style="display:flex;align-items:center;gap:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px">';
        html += '<div style="flex:1"><label style="font-weight:700;display:block;margin-bottom:4px">' + s.setting_key.replace(/_/g, ' ').toUpperCase() + '</label>';
        html += '<small style="color:var(--text-muted)">' + (s.description || '') + '</small></div>';
        if (s.setting_value === 'true' || s.setting_value === 'false') {
          html += '<select class="form-input setting-input" data-id="' + s.id + '" style="width:120px"><option value="true"' + (s.setting_value === 'true' ? ' selected' : '') + '>Enabled</option><option value="false"' + (s.setting_value === 'false' ? ' selected' : '') + '>Disabled</option></select>';
        } else {
          html += '<input type="text" class="form-input setting-input" data-id="' + s.id + '" value="' + (s.setting_value || '') + '" style="width:200px">';
        }
        html += '</div>';
      });
      html += '</div></div></div>';
    });

    html += '<button class="btn btn-primary" id="save-settings-btn" style="margin-top:8px">💾 Save All Settings</button>';
    el.innerHTML = html;

    document.getElementById('save-settings-btn').addEventListener('click', function() {
      var inputs = document.querySelectorAll('.setting-input');
      var promises = [];
      inputs.forEach(function(inp) {
        promises.push(sbClient.from('system_settings').update({ setting_value: inp.value, updated_at: new Date().toISOString() }).eq('id', inp.dataset.id));
      });
      Promise.all(promises).then(function() {
        showToast('Settings saved!', 'success');
        if (typeof SecurityHelpers !== 'undefined') SecurityHelpers.logActivity('settings', 'UPDATE_SETTINGS');
      });
    });
  });
};

// ==========================================
// DOCUMENT MANAGEMENT PAGE
// ==========================================
Pages.documentManagement = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('documents').select('*').order('created_at', {ascending: false}).limit(200).then(function(res) {
    var docs = res.data || [];
    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>📁 Document Management (إدارة المستندات)</h3>';
    html += '<button class="btn btn-primary" onclick="newDocModal()">' + icon('plus') + ' Upload Document</button></div>';

    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #6366f1"><div style="font-size:1.5rem;margin-bottom:8px">📄</div><div style="font-size:1.6rem;font-weight:800">' + docs.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Total Documents</div></div>';
    var types = {};
    docs.forEach(function(d) { var t = d.module || 'general'; if (!types[t]) types[t] = 0; types[t]++; });
    Object.keys(types).slice(0, 3).forEach(function(t) {
      html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #22c55e"><div style="font-size:1.5rem;margin-bottom:8px">📂</div><div style="font-size:1.6rem;font-weight:800">' + types[t] + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">' + t + '</div></div>';
    });
    html += '</div>';

    html += '<div class="card"><div class="card-body no-pad"><table class="data-table"><thead><tr><th>Title</th><th>Module</th><th>Type</th><th>Uploaded By</th><th>Date</th></tr></thead><tbody>';
    if (docs.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No documents yet</td></tr>';
    } else {
      docs.forEach(function(d) {
        html += '<tr><td style="font-weight:600">' + d.title + '</td>';
        html += '<td><span class="badge badge-info">' + (d.module || 'general') + '</span></td>';
        html += '<td>' + (d.file_type || '-') + '</td>';
        html += '<td>' + (d.uploaded_by_name || '-') + '</td>';
        html += '<td>' + formatDate(d.created_at) + '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.newDocModal = function() {
      var body = '<div class="form-field"><label>Title *</label><input type="text" id="doc-title" class="form-input"></div>';
      body += '<div class="form-row"><div class="form-field"><label>Module</label><select id="doc-module" class="form-input"><option value="general">General</option><option value="hr">HR</option><option value="finance">Finance</option><option value="sales">Sales</option><option value="production">Production</option><option value="quality">Quality</option><option value="maintenance">Maintenance</option></select></div>';
      body += '<div class="form-field"><label>File Type</label><input type="text" id="doc-type" class="form-input" placeholder="PDF, DOCX, etc."></div></div>';
      body += '<div class="form-field"><label>File URL</label><input type="text" id="doc-url" class="form-input" placeholder="https://..."></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-doc-btn">Upload</button>';
      App.showModal('Upload Document', body, footer);
      document.getElementById('save-doc-btn').addEventListener('click', function() {
        var title = document.getElementById('doc-title').value;
        if (!title) { alert('Title required'); return; }
        sbClient.from('documents').insert({
          title: title, module: document.getElementById('doc-module').value,
          file_type: document.getElementById('doc-type').value, file_url: document.getElementById('doc-url').value,
          uploaded_by: App.user.id, uploaded_by_name: App.user.full_name
        }).then(function(r) {
          if (r.error) { alert(r.error.message); return; }
          App.closeModal(); Pages.documentManagement(el); showToast('Document uploaded', 'success');
        });
      });
    };
  });
};

// ==========================================
// APPROVAL WORKFLOWS PAGE
// ==========================================
Pages.approvalWorkflows = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
  sbClient.from('approval_requests').select('*').order('created_at', {ascending: false}).limit(100).then(function(res) {
    var requests = res.data || [];
    var pending = requests.filter(function(r) { return r.status === 'pending'; });
    var approved = requests.filter(function(r) { return r.status === 'approved'; });

    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>✅ Approval Workflows (سير عمل الموافقات)</h3></div>';

    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #f59e0b"><div style="font-size:1.5rem;margin-bottom:8px">⏳</div><div style="font-size:1.6rem;font-weight:800">' + pending.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Pending</div></div>';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #22c55e"><div style="font-size:1.5rem;margin-bottom:8px">✅</div><div style="font-size:1.6rem;font-weight:800">' + approved.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Approved</div></div>';
    html += '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid #6366f1"><div style="font-size:1.5rem;margin-bottom:8px">📊</div><div style="font-size:1.6rem;font-weight:800">' + requests.length + '</div><div style="color:var(--text-muted);font-size:0.85rem;text-transform:uppercase">Total</div></div>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>All Approval Requests</h3></div></div><div class="card-body no-pad">';
    html += '<table class="data-table"><thead><tr><th>Date</th><th>Requested By</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    if (requests.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No approval requests yet</td></tr>';
    } else {
      requests.forEach(function(r) {
        var sColor = r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning';
        html += '<tr><td>' + formatDate(r.created_at) + '</td>';
        html += '<td style="font-weight:600">' + (r.requested_by_name || '-') + '</td>';
        html += '<td>' + r.entity_type + '</td>';
        html += '<td><span class="badge badge-' + sColor + '">' + r.status + '</span></td>';
        html += '<td>';
        if (r.status === 'pending' && (App.isOwner() || App.isHR())) {
          html += '<button class="btn btn-xs btn-primary" onclick="approveRequest(\'' + r.id + '\')">✅ Approve</button> ';
          html += '<button class="btn btn-xs btn-outline" style="color:var(--accent-danger)" onclick="rejectRequest(\'' + r.id + '\')">❌ Reject</button>';
        } else {
          html += '-';
        }
        html += '</td></tr>';
      });
    }
    html += '</tbody></table></div></div>';
    el.innerHTML = html;

    window.approveRequest = function(id) {
      sbClient.from('approval_requests').update({ status: 'approved', completed_at: new Date().toISOString() }).eq('id', id).then(function(r) {
        if (r.error) { alert(r.error.message); return; }
        sbClient.from('approval_actions').insert({ request_id: id, action: 'approve', acted_by: App.user.id, acted_by_name: App.user.full_name }).then(function(){});
        Pages.approvalWorkflows(el); showToast('Approved!', 'success');
      });
    };
    window.rejectRequest = function(id) {
      sbClient.from('approval_requests').update({ status: 'rejected', completed_at: new Date().toISOString() }).eq('id', id).then(function(r) {
        if (r.error) { alert(r.error.message); return; }
        sbClient.from('approval_actions').insert({ request_id: id, action: 'reject', acted_by: App.user.id, acted_by_name: App.user.full_name }).then(function(){});
        Pages.approvalWorkflows(el); showToast('Rejected', 'info');
      });
    };
  });
};
