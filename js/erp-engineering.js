window.ERPEngineering = {
  renderEngineering: function(el) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Engineering Department...</p></div>';
    
    // Fetch Projects and Drawings
    Promise.all([
      sbClient.from('engineering_projects').select('*').order('created_at', { ascending: false }),
      sbClient.from('engineering_drawings').select('*').order('created_at', { ascending: false })
    ]).then(function(results) {
      let projRes = results[0];
      let drawRes = results[1];
      
      if (projRes.error || drawRes.error) {
        el.innerHTML = '<div class="alert" style="background:#fef2f2;color:#ef4444;padding:20px;border-radius:8px">Please run setup_engineering.sql in your Supabase SQL Editor first.</div>';
        return;
      }
      
      let projects = projRes.data || [];
      let drawings = drawRes.data || [];
      
      let html = '<div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">';
      html += '<div><h2 style="font-size:1.8rem; font-weight:700; margin-bottom:4px;">Engineering Department (الإدارة الهندسية)</h2>';
      html += '<p style="color:var(--text-muted)">Design, Specifications, Approvals, and Technical Supervision</p></div>';
      html += '<button class="btn btn-primary" id="new-project-btn">' + icon('plus') + ' New Project</button>';
      html += '</div>';
      
      // --- Stats Cards ---
      let civilCount = projects.filter(p => p.project_type === 'civil').length;
      let elecCount = projects.filter(p => p.project_type === 'electrical').length;
      let mechCount = projects.filter(p => p.project_type === 'mechanical').length;
      
      html += '<div class="grid-3" style="gap:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:32px;">';
      html += `<div style="background:var(--bg-card); padding:20px; border-radius:var(--radius-lg); border:1px solid var(--border-color); border-top:4px solid #3b82f6;">
                <div style="color:var(--text-muted); font-size:0.9rem; font-weight:600">Civil & Architecture</div>
                <div style="font-size:1.8rem; font-weight:700; margin-top:8px">${civilCount} Projects</div>
               </div>`;
      html += `<div style="background:var(--bg-card); padding:20px; border-radius:var(--radius-lg); border:1px solid var(--border-color); border-top:4px solid #f59e0b;">
                <div style="color:var(--text-muted); font-size:0.9rem; font-weight:600">Electrical Networks</div>
                <div style="font-size:1.8rem; font-weight:700; margin-top:8px">${elecCount} Projects</div>
               </div>`;
      html += `<div style="background:var(--bg-card); padding:20px; border-radius:var(--radius-lg); border:1px solid var(--border-color); border-top:4px solid #10b981;">
                <div style="color:var(--text-muted); font-size:0.9rem; font-weight:600">Mechanical & Production Lines</div>
                <div style="font-size:1.8rem; font-weight:700; margin-top:8px">${mechCount} Projects</div>
               </div>`;
      html += '</div>';

      // --- Projects Section ---
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700;">Engineering Projects (المشاريع الهندسية)</h3>';
      html += '</div>';
      
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:20px; border:1px solid var(--border-color); margin-bottom: 32px;">';
      html += '<div class="table-responsive"><table class="table" style="width:100%; border-collapse:collapse;">';
      html += '<thead><tr style="text-align:left; border-bottom:1px solid var(--border-color);">';
      html += '<th style="padding:12px">Project Title</th>';
      html += '<th style="padding:12px">Type / Specialization</th>';
      html += '<th style="padding:12px">Engineer</th>';
      html += '<th style="padding:12px">Status</th>';
      html += '<th style="padding:12px">Actions</th>';
      html += '</tr></thead><tbody>';
      
      if (projects.length === 0) {
        html += '<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted)">No projects created yet.</td></tr>';
      } else {
        projects.forEach(function(p) {
          let badgeColor = p.status === 'completed' ? '#10b981' : p.status === 'in_progress' ? '#3b82f6' : p.status === 'supervision' ? '#8b5cf6' : '#f59e0b';
          let typeLabel = p.project_type.replace('_', ' ').toUpperCase();
          
          html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)">';
          html += '<td style="padding:12px; font-weight:600;">' + p.title + '</td>';
          html += '<td style="padding:12px"><span style="background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:4px; font-size:0.8rem">' + typeLabel + '</span></td>';
          html += '<td style="padding:12px">' + p.engineer_name + '</td>';
          html += '<td style="padding:12px"><span style="background:' + badgeColor + '20; color:' + badgeColor + '; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:600">' + p.status.replace('_', ' ').toUpperCase() + '</span></td>';
          html += '<td style="padding:12px">';
          html += '<button class="btn btn-sm btn-outline view-project" data-id="' + p.id + '">' + icon('eye', 14) + ' View</button> ';
          html += '<button class="btn btn-sm btn-outline upload-drawing" data-id="' + p.id + '">' + icon('upload', 14) + ' Drawings</button>';
          html += '</td>';
          html += '</tr>';
        });
      }
      html += '</tbody></table></div></div>';

      // --- Drawings & Approvals Section ---
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700;">Engineering Drawings & Approvals (اعتماد الرسومات)</h3>';
      html += '</div>';
      
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:20px; border:1px solid var(--border-color);">';
      html += '<div class="grid-3" style="gap:16px; display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));">';
      if (drawings.length === 0) {
        html += '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted)">No drawings uploaded yet.</div>';
      } else {
        drawings.forEach(function(d) {
          let pTitle = projects.find(p => p.id === d.project_id)?.title || 'Unknown Project';
          let stColor = d.status === 'approved' ? '#10b981' : d.status === 'rejected' ? '#ef4444' : '#f59e0b';
          html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;">';
          html += '<div style="font-weight:600; margin-bottom:4px">' + d.title + '</div>';
          html += '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px">Project: ' + pTitle + '</div>';
          html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">';
          html += '<span style="color:' + stColor + '; font-weight:600; font-size:0.8rem; background:' + stColor + '15; padding:2px 8px; border-radius:12px;">' + d.status.toUpperCase() + '</span>';
          html += '<span style="font-size:0.8rem; color:var(--text-muted)">By: ' + d.uploader_name + '</span>';
          html += '</div>';
          if (d.status === 'pending') {
            html += '<div style="display:flex; gap:8px;">';
            html += '<button class="btn btn-sm approve-drawing" data-id="' + d.id + '" style="background:#10b981; color:white; flex:1">Approve</button>';
            html += '<button class="btn btn-sm btn-outline reject-drawing" data-id="' + d.id + '" style="flex:1">Reject</button>';
            html += '</div>';
          } else {
            html += '<div style="font-size:0.8rem; color:var(--text-muted)">Approved/Rejected by: ' + (d.approved_by || 'Unknown') + '</div>';
          }
          html += '</div>';
        });
      }
      html += '</div></div>';
      
      el.innerHTML = html;
      
      // Events
      document.getElementById('new-project-btn').addEventListener('click', function() {
        let formHtml = `
          <div class="form-group"><label class="form-label">Project Title</label><input type="text" class="form-input" id="proj-title" required></div>
          <div class="form-group"><label class="form-label">Project Type (التخصص)</label>
            <select class="form-input" id="proj-type">
              <option value="civil">Civil & Architecture (مدني/معماري)</option>
              <option value="electrical">Electrical Networks (شبكات كهرباء)</option>
              <option value="mechanical">Mechanical (ميكانيكا)</option>
              <option value="production_line">Production Line (خطوط الإنتاج)</option>
              <option value="other">Other (أخرى)</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Description & Load Calculations (وصف وحسابات)</label><textarea class="form-input" id="proj-desc" rows="3"></textarea></div>
          <div class="form-group"><label class="form-label">Technical Specs (المواصفات الفنية)</label><textarea class="form-input" id="proj-specs" rows="3"></textarea></div>
        `;
        let footerHtml = '<button class="btn btn-outline" id="cancel-proj">Cancel</button><button class="btn btn-primary" id="save-proj">Create Project</button>';
        
        App.showModal('Create Engineering Project', formHtml, footerHtml);
        document.getElementById('cancel-proj').addEventListener('click', App.closeModal);
        document.getElementById('save-proj').addEventListener('click', function() {
          let title = document.getElementById('proj-title').value.trim();
          let type = document.getElementById('proj-type').value;
          let desc = document.getElementById('proj-desc').value.trim();
          let specs = document.getElementById('proj-specs').value.trim();
          
          if(!title) return alert("Title is required.");
          
          let btn = this;
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span> Saving...';
          
          sbClient.from('engineering_projects').insert({
            employee_id: App.user.id,
            engineer_name: App.user.full_name,
            title: title,
            project_type: type,
            description: desc,
            technical_specs: specs
          }).then(function() {
            App.closeModal();
            App.navigate('engineering');
          });
        });
      });
      
      document.querySelectorAll('.upload-drawing').forEach(btn => {
        btn.addEventListener('click', function() {
          let pId = this.getAttribute('data-id');
          let formHtml = `
            <div class="form-group"><label class="form-label">Drawing / Document Title</label><input type="text" class="form-input" id="draw-title" required></div>
            <div class="form-group"><label class="form-label">File Link / URL</label><input type="text" class="form-input" id="draw-url" placeholder="https://..."></div>
          `;
          let footerHtml = '<button class="btn btn-outline" id="cancel-draw">Cancel</button><button class="btn btn-primary" id="save-draw">Upload</button>';
          
          App.showModal('Upload Engineering Drawing', formHtml, footerHtml);
          document.getElementById('cancel-draw').addEventListener('click', App.closeModal);
          document.getElementById('save-draw').addEventListener('click', function() {
            let dTitle = document.getElementById('draw-title').value.trim();
            let dUrl = document.getElementById('draw-url').value.trim();
            if(!dTitle) return alert("Title required.");
            
            let saveBtn = this;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
            
            sbClient.from('engineering_drawings').insert({
              project_id: pId,
              uploaded_by: App.user.id,
              uploader_name: App.user.full_name,
              title: dTitle,
              file_url: dUrl
            }).then(function() {
              App.closeModal();
              App.navigate('engineering');
            });
          });
        });
      });
      
      document.querySelectorAll('.approve-drawing').forEach(btn => {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          if(!confirm("Approve this engineering drawing?")) return;
          sbClient.from('engineering_drawings').update({ status: 'approved', approved_by: App.user.full_name }).eq('id', id).then(function() {
            App.navigate('engineering');
          });
        });
      });
      
      document.querySelectorAll('.reject-drawing').forEach(btn => {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          if(!confirm("Reject this drawing?")) return;
          sbClient.from('engineering_drawings').update({ status: 'rejected', approved_by: App.user.full_name }).eq('id', id).then(function() {
            App.navigate('engineering');
          });
        });
      });
      
      document.querySelectorAll('.view-project').forEach(btn => {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          let proj = projects.find(p => p.id === id);
          if(!proj) return;
          
          let html = `
            <div style="margin-bottom:16px;"><strong>Type:</strong> ${proj.project_type.toUpperCase()}</div>
            <div style="margin-bottom:16px;"><strong>Description / Loads:</strong><br>${proj.description || '-'}</div>
            <div style="margin-bottom:16px;"><strong>Technical Specs:</strong><br>${proj.technical_specs || '-'}</div>
            <div class="form-group"><label class="form-label">Update Status</label>
              <select class="form-input" id="update-status-${id}">
                <option value="planning" ${proj.status==='planning'?'selected':''}>Planning</option>
                <option value="designing" ${proj.status==='designing'?'selected':''}>Designing</option>
                <option value="in_progress" ${proj.status==='in_progress'?'selected':''}>In Progress</option>
                <option value="supervision" ${proj.status==='supervision'?'selected':''}>Technical Supervision</option>
                <option value="completed" ${proj.status==='completed'?'selected':''}>Completed</option>
              </select>
            </div>
          `;
          let footer = `<button class="btn btn-outline" id="close-proj-view">Close</button><button class="btn btn-primary" id="save-proj-status">Update Status</button>`;
          
          App.showModal(proj.title, html, footer);
          document.getElementById('close-proj-view').addEventListener('click', App.closeModal);
          document.getElementById('save-proj-status').addEventListener('click', function() {
            let newStatus = document.getElementById('update-status-' + id).value;
            sbClient.from('engineering_projects').update({ status: newStatus }).eq('id', id).then(function() {
              App.closeModal();
              App.navigate('engineering');
            });
          });
        });
      });
      
    });
  }
};

Pages['engineering'] = ERPEngineering.renderEngineering;
