window.Pages = window.Pages || {};

Pages.legalAffairs = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Legal Affairs...</p></div>';

  sbClient.from('legal_issues').select('*').order('created_at', { ascending: false }).then(function(res) {
    if (res.error) {
      el.innerHTML = '<div class="alert alert-danger">Database error. Please run legal_issues.sql first.</div>';
      return;
    }
    
    let issues = res.data || [];
    let isLawyer = App.user && App.user.role === 'lawyer';
    let canManage = isLawyer || App.isOwner() || App.isManager();

    let html = '<div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">';
    html += '<div><h2 style="font-size:1.8rem; font-weight:700; margin-bottom:4px;">Legal Affairs & Investigations (الشئون القانونية)</h2>';
    html += '<p style="color:var(--text-muted)">Manage internal disputes, legal issues, and employee investigations.</p></div>';
    
    if (App.isHR() || App.isManager() || App.isOwner()) {
      html += '<button class="btn btn-primary" id="new-issue-btn">' + icon('plus', 16) + ' Report Issue</button>';
    }
    html += '</div>';

    html += '<div class="grid-3" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">';
    
    if (issues.length === 0) {
      html += '<div style="grid-column:1/-1; padding:24px; text-align:center; background:var(--bg-card); border-radius:8px; border:1px dashed var(--border-color); color:var(--text-muted);">No legal issues or investigations reported.</div>';
    } else {
      issues.forEach(function(iss) {
        let stColor = iss.status === 'closed' ? '#16a34a' : (iss.status === 'in_progress' ? '#f59e0b' : '#ef4444');
        let stBadge = `<span style="background:${stColor}22; color:${stColor}; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:600;">${iss.status.toUpperCase()}</span>`;
        
        html += `<div class="card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:8px; padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
            <h3 style="font-size:1.1rem; font-weight:700;">${iss.title}</h3>
            ${stBadge}
          </div>
          <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px; line-height:1.5;">${iss.description}</p>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">
            <div><strong>Reported By:</strong> ${iss.reported_name}</div>
            <div><strong>Date:</strong> ${new Date(iss.created_at).toLocaleString()}</div>
          </div>
        `;
        
        if (canManage && iss.status !== 'closed') {
          html += `<div style="display:flex; gap:8px; border-top:1px solid #eee; padding-top:12px;">`;
          if (iss.status === 'open') {
             html += `<button class="btn btn-warning btn-sm update-issue-btn" data-id="${iss.id}" data-status="in_progress">Investigate</button>`;
          }
          html += `<button class="btn btn-success btn-sm update-issue-btn" data-id="${iss.id}" data-status="closed">Close Case</button>`;
          html += `</div>`;
        }
        
        html += `</div>`;
      });
    }
    
    html += '</div>';
    el.innerHTML = html;

    // Events
    let newBtn = document.getElementById('new-issue-btn');
    if (newBtn) {
      newBtn.addEventListener('click', function() {
        let form = '<div class="form-group"><label>Issue Title (الموضوع)</label><input type="text" class="form-input" id="issue-title" required></div>';
        form += '<div class="form-group"><label>Details (التفاصيل)</label><textarea class="form-input" id="issue-desc" rows="4" required></textarea></div>';
        let footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-issue">Submit</button>';
        App.showModal('Report Legal Issue', form, footer);
        
        document.getElementById('save-issue').addEventListener('click', function() {
          let title = document.getElementById('issue-title').value.trim();
          let desc = document.getElementById('issue-desc').value.trim();
          if (!title || !desc) { alert('All fields required'); return; }
          
          this.disabled = true; this.innerHTML = 'Saving...';
          sbClient.from('legal_issues').insert({
             title: title,
             description: desc,
             reported_by: App.user.id,
             reported_name: App.user.full_name,
             status: 'open'
          }).then(function(insRes) {
             App.closeModal();
             Pages.legalAffairs(el);
          });
        });
      });
    }

    document.querySelectorAll('.update-issue-btn').forEach(btn => {
      btn.addEventListener('click', function() {
         let id = this.getAttribute('data-id');
         let newStat = this.getAttribute('data-status');
         if (confirm('Are you sure you want to change the status?')) {
            sbClient.from('legal_issues').update({ status: newStat, updated_at: new Date().toISOString() }).eq('id', id).then(function() {
               Pages.legalAffairs(el);
            });
         }
      });
    });

  });
};
