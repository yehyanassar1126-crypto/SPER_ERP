// =============================================
// ERP Screen Permission Management
// =============================================
var ERPPermissions = {

  allScreens: [
    // Basic Employee Screens (My Info)
    {id:'dashboard',label:'My Dashboard'},
    {id:'hr-personal',label:'My Profile'},
    {id:'my-attendance',label:'My Attendance'},
    {id:'scan-checkin',label:'Check-In'},
    {id:'scan-checkout',label:'Check-Out'},
    {id:'my-leaves',label:'My Leaves'},
    {id:'my-salary',label:'My Salary'},
    {id:'my-overtime',label:'My Overtime'},
    {id:'my-loans',label:'My Loans'},
    {id:'my-medical',label:'Medical Needs'},
    {id:'my-delays',label:'تأخيراتي'},
    {id:'my-missions',label:'المأموريات'},
    {id:'my-expenses',label:'My Expenses'},
    
    // Workplace & Communication
    {id:'announcements',label:'Announcements'},
    {id:'internal-chat',label:'Internal Chat'},
    {id:'shift-swap',label:'Shift Marketplace'},
    {id:'calendar',label:'Calendar'},
    {id:'task-management',label:'My Tasks'},
    {id:'ai-mind',label:'AI Mind'},
    
    // Managers
    {id:'dept-purchase-approvals',label:'Purchase Approvals'},
    {id:'friday-work',label:'Friday Work'},
    {id:'team-adjustments',label:'Team Adjustments'},
    
    // HR
    {id:'employees',label:'Employees'},
    {id:'attendance',label:'Attendance'},
    {id:'leaves',label:'Leaves'},
    {id:'absence-leave',label:'Permission Requests'},
    {id:'shifts',label:'Shifts'},
    {id:'overtime',label:'Overtime'},
    {id:'all-delays',label:'All Delays'},
    {id:'all-missions',label:'All Missions'},
    {id:'employee-warnings',label:'Employee Warnings'},
    {id:'asset-assignment',label:'Asset Assignment'},
    {id:'payroll',label:'Payroll'},
    {id:'payroll-funding',label:'Payroll Funding'},
    {id:'hr-adjustments',label:'Salary Adjustments'},
    {id:'recruitment',label:'Recruitment'},
    {id:'hr-ats',label:'AI ATS'},
    {id:'documents',label:'Documents'},
    {id:'performance',label:'Performance'},
    {id:'uniforms',label:'Uniforms'},
    {id:'loans',label:'Loans'},
    {id:'expenses',label:'Expenses'},
    {id:'complaints',label:'Complaints'},
    {id:'medical-requests',label:'Medical'},
    {id:'offboarding',label:'Offboarding'},
    {id:'training',label:'Training'},
    {id:'performance-reviews',label:'Performance Reviews'},
    {id:'reports',label:'Reports'},
    {id:'kpi-dashboard',label:'KPI Dashboard'},
    {id:'audit-log',label:'Audit Log'},
    {id:'login-history',label:'Login History'},
    {id:'activity-log-page',label:'Activity Log'},
    {id:'document-management',label:'Document Management'},
    {id:'approval-workflows',label:'Approval Workflows'},
    {id:'hr-qr-generator',label:'QR Generator'},
    {id:'org-directory',label:'Org Directory'},
    
    // Operations & Supply Chain
    {id:'inventory',label:'Inventory'},
    {id:'purchase-requests',label:'Purchase Requests'},
    {id:'petty-cash',label:'Financial Suite'},
    {id:'financial-reports',label:'Financial Reports'},
    {id:'chart-of-accounts',label:'Chart of Accounts'},
    {id:'driver-payments',label:'Driver Payments'},
    {id:'erp-sales',label:'Sales'},
    {id:'erp-products',label:'Products'},
    {id:'customer-requests',label:'Customer Requests'},
    {id:'supplier-portal',label:'Supplier Portal'},
    {id:'erp-planning',label:'Planning'},
    {id:'erp-production',label:'Production'},
    {id:'erp-bom',label:'BOM'},
    {id:'production-trace',label:'Traceability'},
    {id:'erp-quality',label:'Quality'},
    {id:'engineering',label:'Engineering'},
    {id:'erp-maintenance',label:'Maintenance'},
    {id:'erp-equipment',label:'Equipment'},
    {id:'maint-companies',label:'Maint Companies'},
    {id:'spare-parts',label:'Spare Parts'},
    {id:'logistics',label:'Logistics'},
    {id:'erp-fleet',label:'Fleet'},
    {id:'erp-suppliers',label:'Suppliers'},
    {id:'supplier-performance',label:'Supplier Performance'},
    
    // Other
    {id:'it-tickets',label:'IT Support'},
    {id:'legal-affairs',label:'Legal Affairs'},
    {id:'nursing-medical-approvals',label:'Nursing Approvals'},
    {id:'global-search',label:'Global Search'},
    {id:'system-settings',label:'System Settings'},
    {id:'screen-permissions',label:'Screen Permissions'},
    {id:'notification-settings',label:'Notification Settings'},
    {id:'facebook-leads',label:'Facebook Leads'},
    
    // Owner
    {id:'owner-dashboard',label:'Owner Dashboard'},
    {id:'ceo-dashboard',label:'CEO Dashboard'},
    {id:'cost-centers',label:'Cost Centers'},
    {id:'activity-timeline',label:'Activity Timeline'},
    {id:'ai-ceo-dashboard',label:'AI CEO Dashboard'}
  ],

  actions: ['view','create','edit','delete','approve','reject','export','print'],

  isCurrentUserOwner: function() {
    if (typeof App !== 'undefined' && typeof App.isOwner === 'function') {
      return App.isOwner();
    }
    if (typeof App === 'undefined' || !App.user) return false;
    var r = (App.user.role || '').toLowerCase();
    return r === 'owner';
  },

  isTargetOwner: function(userId, role) {
    if (role && role.toLowerCase() === 'owner') return true;
    if (userId) {
      if (ERPPermissions.allUsers) {
        var u = ERPPermissions.allUsers.find(function(x){ return x.id === userId; });
        if (u && u.role && u.role.toLowerCase() === 'owner') return true;
      }
      var sel = document.getElementById('perm-user');
      if (sel && sel.selectedOptions && sel.selectedOptions[0]) {
        var optRole = sel.selectedOptions[0].getAttribute('data-role') || '';
        if (optRole.toLowerCase() === 'owner') return true;
      }
    }
    return false;
  },

  render: function() {
    var html = '<div class="page-header"><h2>🔐 Screen Permissions (صلاحيات الشاشات)</h2></div>';
    html += '<div class="form-row" style="margin-bottom:20px;gap:12px">';
    html += '<div class="form-group" style="flex:1"><label>المستخدم</label><select class="form-input" id="perm-user" onchange="ERPPermissions.loadPerms()"><option value="">— اختر مستخدم —</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label>أو الـ Role</label><select class="form-input" id="perm-role" onchange="ERPPermissions.loadPerms()"><option value="">— كل الأدوار —</option>';
    html += '<option>owner</option><option>hr manager</option><option>hr</option><option>hall manager</option><option>department head</option>';
    html += '<option>employee</option><option>warehouse manager</option><option>procurement manager</option><option>driver</option></select></div>';
    html += '<button class="btn btn-primary" style="align-self:flex-end" onclick="ERPPermissions.loadPerms()">تحميل الصلاحيات</button></div>';

    // Bulk Actions Bar
    html += '<div id="bulk-actions-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:10px;border:1px solid var(--border-color)">';
    html += '<span style="font-weight:700;align-self:center;margin-right:8px">⚡ Bulk Actions:</span>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'HR (الموارد البشرية)\')">✅ Grant All HR</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Operations (العمليات)\')">✅ Grant All Ops</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Finance (المالية)\')">✅ Grant All Finance</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.grantModule(\'Admin (إدارة النظام)\')">✅ Grant All Admin</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" onclick="ERPPermissions.selectAll(true)">☑️ Grant ALL</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="color:var(--accent-danger);border-color:var(--accent-danger)" onclick="ERPPermissions.selectAll(false)">❌ Revoke ALL</button>';
    html += '<button class="btn btn-xs btn-outline bulk-btn" style="color:var(--accent-info);border-color:var(--accent-info)" onclick="ERPPermissions.copyFromTemplate()">📋 Copy from Role Template</button>';
    html += '</div>';

    html += '<div id="perm-grid"></div>';
    document.getElementById('page-content').innerHTML = html;

    sbClient.from('users').select('id,full_name,role,department').order('full_name').then(function(r) {
      var sel = document.getElementById('perm-user');
      ERPPermissions.allUsers = r.data || [];
      ERPPermissions.allUsers.forEach(function(u) {
        var opt = document.createElement('option'); opt.value = u.id;
        opt.setAttribute('data-role', u.role || '');
        opt.textContent = u.full_name + ' (' + u.role + ')'; 
        sel.appendChild(opt);
      });
    });
  },

  loadPerms: function() {
    var userId = document.getElementById('perm-user').value;
    var role = document.getElementById('perm-role').value;
    var el = document.getElementById('perm-grid');

    if (!userId && !role) { el.innerHTML = '<p class="text-muted">اختر مستخدم أو Role</p>'; return; }

    var isRestricted = !ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role);

    var query = sbClient.from('screen_permissions').select('*');
    if (userId) query = query.eq('user_id', userId);
    else if (role) query = query.eq('role', role);

    query.then(function(r) {
      var existing = {};
      (r.data||[]).forEach(function(p) { existing[p.screen_id + '_' + p.action] = p; });

      var defaultScreens = [];
      if (userId && ERPPermissions.allUsers) {
        var u = ERPPermissions.allUsers.find(function(x){ return x.id === userId; });
        if(u) {
            var dep = u.department || ''; var roleStr = u.role || '';
            
            // 1. Basic screens for ALL users (My Info, Workplace, Other)
            defaultScreens.push(
                'dashboard', 'my-attendance', 'scan-checkin', 'scan-checkout', 'my-leaves', 'my-salary', 
                'my-overtime', 'my-loans', 'my-medical', 'my-delays', 'my-missions', 'my-expenses', 'complaints',
                'announcements', 'internal-chat', 'shift-swap', 'calendar', 'task-management'
            );
            
            if(roleStr === 'owner') {
                defaultScreens = ERPPermissions.allScreens.map(function(s){ return s.id; });
            } else {
                // 2. HR & Management
                var isHR = dep === 'HR' || roleStr === 'hr manager' || roleStr === 'hr';
                var isManager = roleStr === 'manager' || roleStr === 'department head';
                
                if (isManager && !isHR) {
                    defaultScreens.push('leaves', 'dept-purchase-approvals', 'friday-work', 'team-adjustments', 'ai-mind');
                }
                
                if (isHR) {
                    defaultScreens.push('employees', 'attendance', 'leaves', 'shifts', 'overtime', 'reports', 'audit-log', 'hr-qr-generator', 'hr-adjustments', 'team-adjustments', 'recruitment', 'hr-ats', 'documents', 'performance', 'uniforms', 'loans', 'expenses', 'complaints', 'medical-requests', 'nursing-medical-approvals', 'ai-mind', 'org-directory', 'offboarding', 'training', 'performance-reviews');
                }
                
                // 3. Department specific
                if(dep === 'Sales' || roleStr === 'sales coordinator') defaultScreens.push('erp-sales', 'erp-products', 'customer-requests', 'supplier-portal');
                if(dep === 'Warehouse' || roleStr === 'warehouse manager') defaultScreens.push('inventory', 'spare-parts', 'erp-products');
                if(dep === 'Finance' || roleStr === 'hr manager') defaultScreens.push('petty-cash', 'financial-reports', 'chart-of-accounts', 'payroll-funding', 'payroll', 'erp-suppliers', 'purchase-requests', 'supplier-portal', 'driver-payments');
                if(dep === 'Procurement') defaultScreens.push('purchase-requests', 'petty-cash', 'erp-suppliers');
                if(dep === 'Production' || roleStr === 'hall manager') defaultScreens.push('erp-production', 'erp-bom', 'erp-maintenance', 'erp-equipment', 'production-trace');
                if(dep === 'Quality' || roleStr === 'qc inspector' || roleStr === 'quality manager') defaultScreens.push('erp-quality', 'spare-parts');
                if(dep === 'Maintenance' || roleStr === 'maintenance manager' || roleStr === 'technician') defaultScreens.push('erp-maintenance', 'maint-companies', 'erp-equipment', 'spare-parts');
                if(dep === 'Engineering' || roleStr === 'engineer' || roleStr === 'engineering manager' || roleStr === 'technical office') defaultScreens.push('engineering');
                if(dep === 'Logistics' || roleStr === 'logistics manager' || roleStr === 'driver') defaultScreens.push('logistics', 'erp-fleet');
                if(dep === 'IT') defaultScreens.push('it-tickets', 'system-settings', 'global-search', 'screen-permissions', 'notification-settings', 'facebook-leads');
            }
        }
      }

      var userScreens = [];
      var availableScreens = [];
      ERPPermissions.allScreens.forEach(function(s) {
        var hasPerm = ERPPermissions.actions.some(function(a) { return existing[s.id + '_' + a]; });
        if (hasPerm || defaultScreens.includes(s.id)) {
            if(!hasPerm) { 
                ERPPermissions.actions.forEach(function(act) {
                    existing[s.id + '_' + act] = { granted: true };
                });
            }
            userScreens.push(s);
        } else {
            availableScreens.push(s);
        }
      });

      var html = '';

      if (isRestricted) {
        html += '<div style="margin-bottom:16px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#ef4444;padding:12px 16px;border-radius:10px;font-weight:bold;direction:rtl;text-align:right;display:flex;align-items:center;gap:10px;">';
        html += '<span style="font-size:20px;">🔒</span> <span>تنبيه أمني: حساب HR لا يمتلك صلاحية تعديل أو سحب أو إضافة صلاحيات لحساب المالك (Owner). تعديل صلاحيات المالك متاح حكراً للمالك فقط.</span>';
        html += '</div>';
      }

      var btnStyle = isRestricted 
        ? 'background:#64748b;color:#cbd5e1;font-weight:bold;cursor:not-allowed;opacity:0.5;padding:8px 18px;border-radius:8px;border:none;'
        : 'background:#2563eb;color:#ffffff;font-weight:bold;cursor:pointer;padding:8px 18px;border-radius:8px;border:none;box-shadow:0 2px 8px rgba(37,99,235,0.4);';

      html += '<div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;">';
      html += '<select id="add-screen-select" class="form-input" style="max-width:320px" ' + (isRestricted ? 'disabled' : '') + '><option value="">— إضافة شاشة جديدة —</option>';
      availableScreens.forEach(function(s) { html += '<option value="'+s.id+'">'+s.label+' ('+s.id+')</option>'; });
      html += '</select>';
      html += '<button type="button" class="btn btn-primary" onclick="ERPPermissions.addScreenRow()" style="' + btnStyle + '" ' + (isRestricted ? 'disabled' : '') + '>➕ إضافة الشاشة</button>';
      html += '</div>';

      html += '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الشاشة</th>';
      ERPPermissions.actions.forEach(function(a) { html += '<th style="text-align:center">'+a+'</th>'; });
      html += '<th>الكل</th><th>إزالة</th></tr></thead><tbody id="perms-tbody">';

      userScreens.forEach(function(s) {
        html += ERPPermissions._renderRow(s, existing, isRestricted);
      });
      html += '</tbody></table></div>';
      html += '<div style="margin-top:20px;display:flex;gap:12px">';
      html += '<button class="btn btn-primary" onclick="ERPPermissions.saveAll()" ' + (isRestricted ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>💾 حفظ الصلاحيات</button>';
      html += '<button class="btn btn-outline" onclick="ERPPermissions.selectAll(true)" ' + (isRestricted ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>تحديد الكل</button>';
      html += '<button class="btn btn-outline" onclick="ERPPermissions.selectAll(false)" ' + (isRestricted ? 'disabled style="opacity:0.5;cursor:not-allowed"' : '') + '>إلغاء الكل</button></div>';
      el.innerHTML = html;

      // Disable bulk action buttons if restricted
      document.querySelectorAll('.bulk-btn').forEach(function(btn) {
        if (isRestricted) {
          btn.setAttribute('disabled', 'true');
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
        } else {
          btn.removeAttribute('disabled');
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    });
  },

  _renderRow: function(s, existing, isRestricted) {
    var disabledAttr = isRestricted ? 'disabled' : '';
    var html = '<tr id="row-'+s.id+'"><td><strong>'+s.label+'</strong><br><small class="text-muted">'+s.id+'</small></td>';
    ERPPermissions.actions.forEach(function(a) {
      var checked = existing && existing[s.id + '_' + a] ? 'checked' : '';
      html += '<td style="text-align:center"><input type="checkbox" class="perm-cb" data-screen="'+s.id+'" data-action="'+a+'" '+checked+' '+disabledAttr+'></td>';
    });
    html += '<td style="text-align:center"><input type="checkbox" class="perm-all" data-screen="'+s.id+'" onchange="ERPPermissions.toggleRow(this)" '+disabledAttr+'></td>';
    html += '<td style="text-align:center"><button class="btn btn-xs btn-outline" style="color:red;border-color:red" onclick="ERPPermissions.removeScreenRow(\''+s.id+'\', \''+s.label+'\')" '+disabledAttr+'>🗑️</button></td></tr>';
    return html;
  },

  addScreenRow: function() {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';

    if (!userId && !role) {
      showToast('⚠️ اختر مستخدم أو Role أولاً', 'warning');
      return;
    }

    if (!ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role)) {
      showToast('⛔ غير مسموح لـ HR بإضافة شاشات لحساب المالك (Owner)', 'error');
      return;
    }

    var select = document.getElementById('add-screen-select');
    if (!select) return;
    var screenId = select.value;
    if (!screenId) {
      showToast('⚠️ اختر شاشة من القائمة أولاً لإضافتها', 'warning');
      return;
    }

    var screenObj = ERPPermissions.allScreens.find(function(s){ return s.id === screenId; });
    if (!screenObj) return;

    var tbody = document.getElementById('perms-tbody');
    if (tbody) {
      var temp = document.createElement('tbody');
      var defaultPerms = {};
      ERPPermissions.actions.forEach(function(act) {
        defaultPerms[screenId + '_' + act] = { granted: true };
      });
      temp.innerHTML = ERPPermissions._renderRow(screenObj, defaultPerms, false);
      tbody.insertBefore(temp.firstChild, tbody.firstChild);
    }

    // Remove option from dropdown & reset selection
    var option = select.querySelector('option[value="'+screenId+'"]');
    if (option) option.remove();
    select.value = "";

    // Auto-save permissions immediately to Supabase
    ERPPermissions.saveAll();
  },

  removeScreenRow: function(id, label) {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';
    if (!ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role)) {
      showToast('⛔ غير مسموح لـ HR بحذف شاشات لحساب المالك (Owner)', 'error');
      return;
    }

    var row = document.getElementById('row-'+id);
    if (row) row.remove();

    var select = document.getElementById('add-screen-select');
    if(select) {
      var opt = document.createElement('option');
      opt.value = id; opt.textContent = label + ' (' + id + ')';
      select.appendChild(opt);
    }
  },

  toggleRow: function(cb) {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';
    if (!ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role)) return;

    var screen = cb.getAttribute('data-screen');
    document.querySelectorAll('.perm-cb[data-screen="'+screen+'"]').forEach(function(c) { c.checked = cb.checked; });
  },

  selectAll: function(val) {
    var userId = document.getElementById('perm-user') ? document.getElementById('perm-user').value : '';
    var role = document.getElementById('perm-role') ? document.getElementById('perm-role').value : '';
    if (!ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role)) {
      showToast('⛔ غير مسموح لـ HR بتعديل صلاحيات المالك (Owner)', 'error');
      return;
    }

    document.querySelectorAll('.perm-cb').forEach(function(c) { c.checked = val; });
    document.querySelectorAll('.perm-all').forEach(function(c) { c.checked = val; });
  },

  saveAll: function() {
    var userId = document.getElementById('perm-user').value;
    var role = document.getElementById('perm-role').value;
    if (!userId && !role) { showToast('اختر مستخدم أو Role', 'warning'); return; }

    if (!ERPPermissions.isCurrentUserOwner() && ERPPermissions.isTargetOwner(userId, role)) {
      showToast('⛔ غير مسموح لـ HR بتعديل أو سحب أو إضافة صلاحيات لم حساب المالك (Owner)', 'error');
      return;
    }

    // Collect what's currently checked in the UI
    var wantedPerms = {};
    document.querySelectorAll('.perm-cb:checked').forEach(function(cb) {
      var key = cb.getAttribute('data-screen') + '|' + cb.getAttribute('data-action');
      wantedPerms[key] = { screen_id: cb.getAttribute('data-screen'), action: cb.getAttribute('data-action') };
    });
    // Always include SYSTEM_CONFIG marker
    wantedPerms['SYSTEM_CONFIG|custom'] = { screen_id: 'SYSTEM_CONFIG', action: 'custom' };

    // Fetch current DB permissions for this user/role
    var query = sbClient.from('screen_permissions').select('id,screen_id,action');
    if (userId) query = query.eq('user_id', userId);
    else query = query.eq('role', role);

    query.then(function(res) {
      var existingPerms = {};
      (res.data || []).forEach(function(p) {
        existingPerms[p.screen_id + '|' + p.action] = p.id;
      });

      // Calculate diff: what to ADD and what to REMOVE
      var toInsert = [];
      var toDeleteIds = [];

      // Find NEW permissions (in UI but not in DB)
      for (var key in wantedPerms) {
        if (!existingPerms[key]) {
          toInsert.push({
            user_id: userId || null, role: role || null,
            screen_id: wantedPerms[key].screen_id,
            action: wantedPerms[key].action,
            granted: true
          });
        }
      }

      // Find REMOVED permissions (in DB but not in UI)
      for (var key2 in existingPerms) {
        if (!wantedPerms[key2]) {
          toDeleteIds.push(existingPerms[key2]);
        }
      }

      // Execute changes
      var promises = [];

      if (toInsert.length > 0) {
        promises.push(sbClient.from('screen_permissions').insert(toInsert));
      }
      if (toDeleteIds.length > 0) {
        promises.push(sbClient.from('screen_permissions').delete().in('id', toDeleteIds));
      }

      if (promises.length === 0) {
        showToast('لا يوجد تغييرات جديدة للحفظ', 'info');
        return;
      }

      Promise.all(promises).then(function(results) {
        var hasError = results.some(function(r) { return r.error; });
        if (hasError) {
          var errMsg = results.filter(function(r){return r.error;}).map(function(r){return r.error.message;}).join(', ');
          showToast('خطأ: ' + errMsg, 'error');
          return;
        }

        var targetUserObj = ERPPermissions.allUsers ? ERPPermissions.allUsers.find(function(x){ return x.id === userId; }) : null;
        var targetName = targetUserObj ? targetUserObj.full_name : (role || 'المستخدم');

        var msg = '✅ تم حفظ صلاحيات ' + targetName + ' بنجاح';
        if (toInsert.length > 0) msg += ' (إضافة ' + toInsert.length + ')';
        if (toDeleteIds.length > 0) msg += ' (سحب ' + toDeleteIds.length + ')';
        showToast(msg, 'success');

        // Audit log
        sbClient.from('audit_log').insert({
          action: 'PERMISSION_CHANGE', user_name: App.user ? App.user.full_name : '',
          details: 'Permissions for ' + targetName + ': +' + toInsert.length + ' -' + toDeleteIds.length,
          user_id: App.user ? App.user.id : null
        }).then(function(){});

        // Instant sidebar update if editing active user's permissions
        if (typeof SecurityHelpers !== 'undefined' && SecurityHelpers.loadPermissions) {
          if ((userId && App.user && App.user.id === userId) || (role && App.user && App.user.role === role)) {
            SecurityHelpers.loadPermissions();
          }
        }

        // Reload permissions table grid
        ERPPermissions.loadPerms();
      });
    });
  },
};

// =============================================
// Production Traceability
// =============================================
var ERPTraceability = {

  renderTrace: function(batchId) {
    var html = '<div class="page-header"><h2>🔗 Production Traceability (تتبع الإنتاج)</h2></div>';
    html += '<div class="form-group"><label>رقم الدُفعة (Batch Number)</label>';
    html += '<div style="display:flex;gap:8px"><input class="form-input" id="trace-batch" placeholder="أدخل رقم الدُفعة...">';
    html += '<button class="btn btn-primary" onclick="ERPTraceability.trace()">🔍 تتبع</button></div></div>';
    html += '<div id="trace-result"></div>';
    document.getElementById('page-content').innerHTML = html;
    if (batchId) { document.getElementById('trace-batch').value = batchId; ERPTraceability.trace(); }
  },

  trace: async function() {
    var batchNum = document.getElementById('trace-batch').value.trim();
    var el = document.getElementById('trace-result');
    if (!batchNum) { showToast('أدخل رقم الدُفعة','error'); return; }
    el.innerHTML = '<div class="loading">جاري التتبع...</div>';

    // 1. Get batch
    var r1 = await sbClient.from('production_batches').select('*').eq('batch_number', batchNum).single();
    if (r1.error || !r1.data) { el.innerHTML = '<div class="empty-state">لم يتم العثور على الدُفعة "'+batchNum+'"</div>'; return; }
    var batch = r1.data;

    // 2. Get production order
    var order = null;
    if (batch.production_order_id) {
      var r2 = await sbClient.from('production_orders').select('*').eq('id', batch.production_order_id).single();
      order = r2.data;
    }

    // 3. Get stages
    var stages = [];
    if (batch.production_order_id) {
      var r3 = await sbClient.from('production_stage_logs').select('*').eq('production_order_id', batch.production_order_id).order('created_at');
      stages = r3.data || [];
    }

    // 4. Get consumption
    var consumption = [];
    if (batch.production_order_id) {
      var r4 = await sbClient.from('production_consumption').select('*').eq('production_order_id', batch.production_order_id);
      consumption = r4.data || [];
    }

    // 5. Get QC
    var qc = null;
    if (batch.qc_inspection_id) {
      var r5 = await sbClient.from('qc_inspections').select('*').eq('id', batch.qc_inspection_id).single();
      qc = r5.data;
    }

    // Build timeline
    var html = '<div style="margin-top:24px">';
    html += '<h3 style="margin-bottom:16px">🔗 Traceability Timeline — Batch: '+batchNum+'</h3>';

    // Timeline
    var timeline = [
      { icon: '📦', title: 'خامات مستهلكة', content: consumption.length ? consumption.map(function(c){return c.actual_qty+' '+c.unit;}).join(', ') : 'لا يوجد بيانات استهلاك', color: '#8b5cf6' },
      { icon: '🏭', title: 'أمر الإنتاج', content: order ? order.order_number+' — '+order.status : 'غير مرتبط', color: '#3b82f6' },
    ];
    stages.forEach(function(s) {
      timeline.push({ icon: s.status==='completed'?'✅':'⏳', title: s.stage_name, content: 'الحالة: '+s.status+(s.waste_quantity?' | هالك: '+s.waste_quantity:''), color: s.status==='completed'?'#10b981':'#f59e0b' });
    });
    timeline.push({ icon: '🔬', title: 'فحص الجودة', content: qc ? 'النتيجة: '+qc.result : 'لم يتم الفحص بعد', color: qc&&qc.result==='pass'?'#10b981':'#ef4444' });
    timeline.push({ icon: '📦', title: 'المنتج النهائي', content: 'الكمية: '+batch.quantity+' '+batch.unit+' | الحالة: '+batch.status, color: '#6366f1' });

    timeline.forEach(function(t) {
      html += '<div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-start">';
      html += '<div style="width:48px;height:48px;background:'+t.color+'22;border:2px solid '+t.color+';border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+t.icon+'</div>';
      html += '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;flex:1">';
      html += '<strong>'+t.title+'</strong><p class="text-muted" style="margin-top:4px">'+t.content+'</p></div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }
};

if (typeof window !== 'undefined') { window.ERPPermissions = ERPPermissions; window.ERPTraceability = ERPTraceability; }
