window.Pages = window.Pages || {};
window.ERPEngineering = {
  renderEngineering: function(el) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Engineering Department...</p></div>';
    
    Promise.all([
      sbClient.from('engineering_projects').select('*').order('created_at', { ascending: false }),
      sbClient.from('engineering_drawings').select('*').order('created_at', { ascending: false })
    ]).then(function(results) {
      let projRes = results[0];
      let drawRes = results[1];
      
      if (projRes.error || drawRes.error) {
        let errMsg = (projRes.error || drawRes.error).message;
        el.innerHTML = '<div style="background:#fef2f2;color:#ef4444;padding:20px;border-radius:8px">Please run setup_engineering.sql in your Supabase SQL Editor first.<br><small>' + errMsg + '</small></div>';
        return;
      }
      
      let projects = projRes.data || [];
      let drawings = drawRes.data || [];
      
      // Role checks
      let isEngineeringRole = App.isOwner() || (App.user && (
        App.user.department === 'Engineering' ||
        App.user.role === 'engineering manager' ||
        App.user.role === 'engineer' ||
        App.user.role === 'technical office' ||
        App.user.role === 'manager' ||
        App.user.role === 'hr manager'
      ));
      
      // --- Header ---
      let html = '<div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">';
      html += '<div><h2 style="font-size:1.8rem; font-weight:700; margin-bottom:4px;">Engineering Department (الإدارة الهندسية)</h2>';
      html += '<p style="color:var(--text-muted)">Design, Specifications, Approvals, and Technical Supervision</p></div>';
      if (isEngineeringRole) {
        html += '<button class="btn btn-primary" id="new-project-btn">' + icon('plus') + ' New Project</button>';
      } else {
        html += '<div style="font-size:0.85rem; color:var(--text-muted); background:rgba(99,102,241,0.08); padding:8px 14px; border-radius:8px;">' + icon('upload', 14) + ' You can upload drawings to any project</div>';
      }
      html += '</div>';
      
      // --- Stats Cards ---
      let civilCount = projects.filter(p => p.project_type === 'civil').length;
      let elecCount  = projects.filter(p => p.project_type === 'electrical').length;
      let mechCount  = projects.filter(p => p.project_type === 'mechanical').length;
      
      html += '<div style="gap:20px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); margin-bottom:32px;">';
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

      // --- Workflow Pipeline ---
      let stages = [
        { key: 'planning',    label: 'Planning',     ar: 'التخطيط',         color: '#f59e0b', depts: ['HR (توفير الكوادر)', 'Finance (اعتماد الميزانية)', 'Procurement (تسعير المواد)'] },
        { key: 'designing',   label: 'Designing',    ar: 'التصميم',         color: '#6366f1', depts: ['Quality (مراجعة المواصفات)', 'Technical Office (الرسومات)'] },
        { key: 'in_progress', label: 'In Progress',  ar: 'التنفيذ',         color: '#3b82f6', depts: ['Production (خطوط الإنتاج)', 'Warehouse (المواد والخامات)', 'Maintenance (المعدات)'] },
        { key: 'supervision', label: 'Supervision',  ar: 'الإشراف الفني',   color: '#8b5cf6', depts: ['Quality (فحص وتفتيش)', 'Maintenance (دعم فني)'] },
        { key: 'completed',   label: 'Completed',    ar: 'التسليم',         color: '#10b981', depts: ['Finance (توريد وتسوية)', 'HR (إغلاق المشروع)'] }
      ];
      
      html += '<div style="margin-bottom:28px;">';
      html += '<h3 style="font-size:1.1rem; font-weight:700; margin-bottom:14px;">Project Workflow (مراحل المشروع) <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted)">& Department Dependencies</span></h3>';
      html += '<div style="display:grid; grid-template-columns:repeat(5,1fr); gap:8px;">';
      stages.forEach(function(s, i) {
        let stageProjects = projects.filter(p => (p.status || 'planning') === s.key);
        let count = stageProjects.length;
        let deptsHtml = s.depts.map(d => '<span style="display:block; font-size:0.72rem; margin-bottom:2px; opacity:0.85">• ' + d + '</span>').join('');
        html += '<div style="background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-color); border-top:3px solid ' + s.color + '; padding:12px; position:relative;">';
        if (i < 4) html += '<div style="position:absolute; right:-10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:1rem; z-index:1;">→</div>';
        html += '<div style="font-weight:700; font-size:0.85rem; color:' + s.color + '; margin-bottom:2px;">' + (i+1) + '. ' + s.label + '</div>';
        html += '<div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">' + s.ar + '</div>';
        html += '<div style="font-size:1.3rem; font-weight:800; color:var(--text-primary); margin-bottom:8px;">' + count + ' <span style="font-size:0.7rem; font-weight:400; color:var(--text-muted)">projects</span></div>';
        html += '<div style="border-top:1px dashed var(--border-color); padding-top:6px; margin-top:4px;">';
        html += '<div style="font-size:0.7rem; color:var(--text-muted); font-weight:600; margin-bottom:4px;">Linked Departments:</div>';
        html += deptsHtml;
        html += '</div></div>';
      });
      html += '</div></div>';
      
      // --- Projects Table ---
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700;">Engineering Projects (المشاريع الهندسية)</h3>';
      html += '</div>';
      
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:20px; border:1px solid var(--border-color); margin-bottom: 32px;">';
      html += '<div class="table-responsive"><table class="table" style="width:100%; border-collapse:collapse;">';
      html += '<thead><tr style="text-align:left; border-bottom:1px solid var(--border-color);">';
      html += '<th style="padding:12px">Project Title</th>';
      html += '<th style="padding:12px">Type</th>';
      html += '<th style="padding:12px">Engineer</th>';
      html += '<th style="padding:12px">Status</th>';
      html += '<th style="padding:12px">Actions</th>';
      html += '</tr></thead><tbody>';
      
      if (projects.length === 0) {
        html += '<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted)">No projects created yet.</td></tr>';
      } else {
        projects.forEach(function(p) {
          let badgeColor = p.status === 'completed' ? '#10b981' : p.status === 'in_progress' ? '#3b82f6' : p.status === 'supervision' ? '#8b5cf6' : '#f59e0b';
          let typeLabel = (p.project_type || 'other').replace('_', ' ').toUpperCase();
          html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)">';
          html += '<td style="padding:12px; font-weight:600;">' + p.title + '</td>';
          html += '<td style="padding:12px"><span style="background:rgba(0,0,0,0.05); padding:4px 8px; border-radius:4px; font-size:0.8rem">' + typeLabel + '</span></td>';
          html += '<td style="padding:12px">' + p.engineer_name + '</td>';
          html += '<td style="padding:12px"><span style="background:' + badgeColor + '20; color:' + badgeColor + '; padding:4px 8px; border-radius:12px; font-size:0.8rem; font-weight:600">' + (p.status || 'planning').replace('_', ' ').toUpperCase() + '</span></td>';
          html += '<td style="padding:12px">';
          // ALL employees can upload drawings
          html += '<button class="btn btn-sm btn-outline upload-drawing" data-id="' + p.id + '">' + icon('upload', 14) + ' Upload Drawing</button> ';
          // Only engineering roles can view/update project details
          if (isEngineeringRole) {
            html += '<button class="btn btn-sm btn-outline view-project" data-id="' + p.id + '">' + icon('eye', 14) + ' View</button>';
          }
          html += '</td>';
          html += '</tr>';
        });
      }
      html += '</tbody></table></div></div>';

      // --- Drawings Section ---
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700;">Engineering Drawings & Approvals (اعتماد الرسومات) <span style="font-size:0.8rem; color:var(--text-muted); font-weight:400">— Any employee can upload</span></h3>';
      html += '</div>';
      
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:20px; border:1px solid var(--border-color);">';
      html += '<div style="gap:16px; display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));">';
      if (drawings.length === 0) {
        html += '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted)">No drawings uploaded yet. Use "Upload Drawing" on any project above.</div>';
      } else {
        drawings.forEach(function(d) {
          let pTitle = (projects.find(p => p.id === d.project_id) || {}).title || 'Unknown Project';
          let stColor = d.status === 'approved' ? '#10b981' : d.status === 'rejected' ? '#ef4444' : '#f59e0b';
          html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;">';
          html += '<div style="font-weight:600; margin-bottom:4px">' + d.title + '</div>';
          html += '<div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:8px">Project: ' + pTitle + '</div>';
          html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">';
          html += '<span style="color:' + stColor + '; font-weight:600; font-size:0.8rem; background:' + stColor + '15; padding:2px 8px; border-radius:12px;">' + (d.status || 'pending').toUpperCase() + '</span>';
          html += '<span style="font-size:0.8rem; color:var(--text-muted)">By: ' + d.uploader_name + '</span>';
          html += '</div>';
          // Show file link for everyone
          if (d.file_url) {
            html += '<a href="' + d.file_url + '" target="_blank" class="btn btn-sm btn-outline" style="width:100%; text-align:center; margin-bottom:8px; display:block">' + icon('eye', 13) + ' View File</a>';
          }
          if (d.status === 'pending') {
            // Approve/Reject only for engineering roles
            if (isEngineeringRole) {
              html += '<div style="display:flex; gap:8px;">';
              html += '<button class="btn btn-sm approve-drawing" data-id="' + d.id + '" style="background:#10b981; color:white; flex:1">Approve</button>';
              html += '<button class="btn btn-sm btn-outline reject-drawing" data-id="' + d.id + '" style="flex:1">Reject</button>';
              html += '</div>';
            } else {
              html += '<div style="font-size:0.8rem; color:#f59e0b; text-align:center">Pending approval by engineering team</div>';
            }
          } else {
            html += '<div style="font-size:0.8rem; color:var(--text-muted)">Decision by: ' + (d.approved_by || 'Unknown') + '</div>';
          }
          html += '</div>';
        });
      }
      html += '</div></div>';
      
      el.innerHTML = html;
      
      // --- Events ---
      
      // New Project (engineering roles only)
      if (isEngineeringRole) {
        let newProjBtn = document.getElementById('new-project-btn');
        if (newProjBtn) {
          newProjBtn.addEventListener('click', function() {
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
              let type  = document.getElementById('proj-type').value;
              let desc  = document.getElementById('proj-desc').value.trim();
              let specs = document.getElementById('proj-specs').value.trim();
              if (!title) return alert('Title is required.');
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
              }).then(function(res) {
                if (res.error) {
                  alert('Error: ' + res.error.message);
                  btn.disabled = false;
                  btn.innerHTML = 'Create Project';
                } else {
                  App.closeModal();
                  App.navigate('engineering');
                }
              });
            });
          });
        }
      }
      
      // Upload Drawing (ALL employees)
      document.querySelectorAll('.upload-drawing').forEach(function(btn) {
        btn.addEventListener('click', function() {
          let pId = this.getAttribute('data-id');
          let formHtml = `
            <div class="form-group"><label class="form-label">Drawing / Document Title</label><input type="text" class="form-input" id="draw-title" required></div>
            <div class="form-group"><label class="form-label">File Link / URL (رابط الملف)</label><input type="text" class="form-input" id="draw-url" placeholder="https://drive.google.com/... or any link"></div>
          `;
          let footerHtml = '<button class="btn btn-outline" id="cancel-draw">Cancel</button><button class="btn btn-primary" id="save-draw">' + icon('upload', 14) + ' Upload</button>';
          App.showModal('Upload Engineering Drawing (رفع رسم هندسي)', formHtml, footerHtml);
          document.getElementById('cancel-draw').addEventListener('click', App.closeModal);
          document.getElementById('save-draw').addEventListener('click', function() {
            let dTitle = document.getElementById('draw-title').value.trim();
            let dUrl   = document.getElementById('draw-url').value.trim();
            if (!dTitle) return alert('Title required.');
            let saveBtn = this;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner"></span> Saving...';
            sbClient.from('engineering_drawings').insert({
              project_id:    pId,
              uploaded_by:   App.user.id,
              uploader_name: App.user.full_name,
              title:         dTitle,
              file_url:      dUrl
            }).then(function(res) {
              if (res.error) {
                alert('Error uploading drawing: ' + res.error.message);
                saveBtn.disabled = false;
                saveBtn.innerHTML = 'Upload';
              } else {
                App.closeModal();
                App.navigate('engineering');
              }
            });
          });
        });
      });
      
      // Approve Drawing (engineering roles only)
      document.querySelectorAll('.approve-drawing').forEach(function(btn) {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          if (!confirm('Approve this engineering drawing?')) return;
          sbClient.from('engineering_drawings').update({ status: 'approved', approved_by: App.user.full_name }).eq('id', id).then(function() {
            App.navigate('engineering');
          });
        });
      });
      
      // Reject Drawing (engineering roles only)
      document.querySelectorAll('.reject-drawing').forEach(function(btn) {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          if (!confirm('Reject this drawing?')) return;
          sbClient.from('engineering_drawings').update({ status: 'rejected', approved_by: App.user.full_name }).eq('id', id).then(function() {
            App.navigate('engineering');
          });
        });
      });
      
      // View/Update Project status (engineering roles only)
      document.querySelectorAll('.view-project').forEach(function(btn) {
        btn.addEventListener('click', function() {
          let id = this.getAttribute('data-id');
          let proj = projects.find(p => p.id === id);
          if (!proj) return;
          let modalHtml = `
            <div style="margin-bottom:16px;"><strong>Type:</strong> ${(proj.project_type || 'other').toUpperCase()}</div>
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
          let footer = '<button class="btn btn-outline" id="close-proj-view">Close</button><button class="btn btn-primary" id="save-proj-status">Update Status</button>';
          App.showModal(proj.title, modalHtml, footer);
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
