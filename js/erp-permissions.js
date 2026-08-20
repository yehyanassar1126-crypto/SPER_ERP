// =============================================
// ERP Screen Permission Management
// =============================================
var ERPPermissions = {

  allScreens: [
    {id:'dashboard',label:'Dashboard'},
    {id:'employees',label:'Employees'},
    {id:'attendance',label:'Attendance'},
    {id:'leaves',label:'Leaves'},
    {id:'overtime',label:'Overtime'},
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
    {id:'announcements',label:'Announcements'},
    {id:'internal-chat',label:'Internal Chat'},
    {id:'reports',label:'Reports'},
    {id:'audit-log',label:'Audit Log'},
    {id:'inventory',label:'Inventory'},
    {id:'purchase-requests',label:'Purchase Requests'},
    {id:'petty-cash',label:'Financial Suite'},
    {id:'it-tickets',label:'IT Support'},
    {id:'legal-affairs',label:'Legal Affairs'},
    {id:'erp-sales',label:'Sales'},
    {id:'erp-products',label:'Products'},
    {id:'erp-planning',label:'Planning'},
    {id:'erp-production',label:'Production'},
    {id:'erp-bom',label:'BOM'},
    {id:'erp-quality',label:'Quality'},
    {id:'engineering',label:'Engineering'},
    {id:'erp-maintenance',label:'Maintenance'},
    {id:'erp-equipment',label:'Equipment'},
    {id:'maint-companies',label:'Maint Companies'},
    {id:'spare-parts',label:'Spare Parts'},
    {id:'logistics',label:'Logistics'},
    {id:'erp-fleet',label:'Fleet'},
    {id:'erp-suppliers',label:'Suppliers'},
    {id:'global-search',label:'Global Search'},
    {id:'supplier-performance',label:'Supplier Performance'},
    {id:'system-settings',label:'System Settings'},
  ],

  actions: ['view','create','edit','delete','approve','reject','export','print'],

  render: function() {
    var html = '<div class="page-header"><h2>🔐 Screen Permissions (صلاحيات الشاشات)</h2></div>';
    html += '<div class="form-row" style="margin-bottom:20px;gap:12px">';
    html += '<div class="form-group" style="flex:1"><label>المستخدم</label><select class="form-input" id="perm-user"><option value="">— اختر مستخدم —</option></select></div>';
    html += '<div class="form-group" style="flex:1"><label>أو الـ Role</label><select class="form-input" id="perm-role"><option value="">— كل الأدوار —</option>';
    html += '<option>owner</option><option>hr manager</option><option>hr</option><option>hall manager</option><option>department head</option>';
    html += '<option>employee</option><option>warehouse manager</option><option>procurement manager</option><option>driver</option></select></div>';
    html += '<button class="btn btn-primary" style="align-self:flex-end" onclick="ERPPermissions.loadPerms()">تحميل الصلاحيات</button></div>';
    html += '<div id="perm-grid"></div>';
    document.getElementById('page-content').innerHTML = html;

    sbClient.from('users').select('id,full_name,role,department').order('full_name').then(function(r) {
      var sel = document.getElementById('perm-user');
      (r.data||[]).forEach(function(u) {
        var opt = document.createElement('option'); opt.value = u.id;
        opt.textContent = u.full_name + ' (' + u.role + ')'; sel.appendChild(opt);
      });
    });
  },

  loadPerms: function() {
    var userId = document.getElementById('perm-user').value;
    var role = document.getElementById('perm-role').value;
    var el = document.getElementById('perm-grid');

    var query = sbClient.from('screen_permissions').select('*');
    if (userId) query = query.eq('user_id', userId);
    else if (role) query = query.eq('role', role);
    else { el.innerHTML = '<p class="text-muted">اختر مستخدم أو Role</p>'; return; }

    query.then(function(r) {
      var existing = {};
      (r.data||[]).forEach(function(p) { existing[p.screen_id + '_' + p.action] = p; });

      var userScreens = [];
      var availableScreens = [];
      ERPPermissions.allScreens.forEach(function(s) {
        var hasPerm = ERPPermissions.actions.some(function(a) { return existing[s.id + '_' + a]; });
        if (hasPerm) userScreens.push(s);
        else availableScreens.push(s);
      });

      var html = '<div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;">';
      html += '<select id="add-screen-select" class="form-input" style="max-width:300px"><option value="">— إضافة شاشة جديدة —</option>';
      availableScreens.forEach(function(s) { html += '<option value="'+s.id+'">'+s.label+' ('+s.id+')</option>'; });
      html += '</select>';
      html += '<button class="btn btn-outline" onclick="ERPPermissions.addScreenRow()">➕ إضافة شاشة</button>';
      html += '</div>';

      html += '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>الشاشة</th>';
      ERPPermissions.actions.forEach(function(a) { html += '<th style="text-align:center">'+a+'</th>'; });
      html += '<th>الكل</th><th>إزالة</th></tr></thead><tbody id="perms-tbody">';

      userScreens.forEach(function(s) {
        html += ERPPermissions._renderRow(s, existing);
      });
      html += '</tbody></table></div>';
      html += '<div style="margin-top:20px;display:flex;gap:12px">';
      html += '<button class="btn btn-primary" onclick="ERPPermissions.saveAll()">💾 حفظ الصلاحيات</button>';
      html += '<button class="btn btn-outline" onclick="ERPPermissions.selectAll(true)">تحديد الكل</button>';
      html += '<button class="btn btn-outline" onclick="ERPPermissions.selectAll(false)">إلغاء الكل</button></div>';
      el.innerHTML = html;
    });
  },

  _renderRow: function(s, existing) {
    var html = '<tr id="row-'+s.id+'"><td><strong>'+s.label+'</strong><br><small class="text-muted">'+s.id+'</small></td>';
    ERPPermissions.actions.forEach(function(a) {
      var checked = existing && existing[s.id + '_' + a] ? 'checked' : '';
      html += '<td style="text-align:center"><input type="checkbox" class="perm-cb" data-screen="'+s.id+'" data-action="'+a+'" '+checked+'></td>';
    });
    html += '<td style="text-align:center"><input type="checkbox" class="perm-all" data-screen="'+s.id+'" onchange="ERPPermissions.toggleRow(this)"></td>';
    html += '<td style="text-align:center"><button class="btn btn-xs btn-outline" style="color:red;border-color:red" onclick="ERPPermissions.removeScreenRow(\''+s.id+'\', \''+s.label+'\')">🗑️</button></td></tr>';
    return html;
  },

  addScreenRow: function() {
    var select = document.getElementById('add-screen-select');
    var screenId = select.value;
    if(!screenId) return;
    var screenObj = ERPPermissions.allScreens.find(function(s){ return s.id === screenId; });
    if(!screenObj) return;

    var tbody = document.getElementById('perms-tbody');
    var temp = document.createElement('tbody');
    temp.innerHTML = ERPPermissions._renderRow(screenObj, {});
    tbody.appendChild(temp.firstChild);

    // Remove from select
    var option = select.querySelector('option[value="'+screenId+'"]');
    if(option) option.remove();
  },

  removeScreenRow: function(id, label) {
    document.getElementById('row-'+id).remove();
    var select = document.getElementById('add-screen-select');
    if(select) {
      var opt = document.createElement('option');
      opt.value = id; opt.textContent = label + ' (' + id + ')';
      select.appendChild(opt);
    }
  },

  toggleRow: function(cb) {
    var screen = cb.getAttribute('data-screen');
    document.querySelectorAll('.perm-cb[data-screen="'+screen+'"]').forEach(function(c) { c.checked = cb.checked; });
  },

  selectAll: function(val) {
    document.querySelectorAll('.perm-cb').forEach(function(c) { c.checked = val; });
    document.querySelectorAll('.perm-all').forEach(function(c) { c.checked = val; });
  },

  saveAll: function() {
    var userId = document.getElementById('perm-user').value;
    var role = document.getElementById('perm-role').value;
    var perms = [];
    document.querySelectorAll('.perm-cb:checked').forEach(function(cb) {
      perms.push({
        user_id: userId || null, role: role || null,
        screen_id: cb.getAttribute('data-screen'),
        action: cb.getAttribute('data-action'),
        granted: true
      });
    });

    // Delete old then insert new
    var delQuery = sbClient.from('screen_permissions').delete();
    if (userId) delQuery = delQuery.eq('user_id', userId);
    else if (role) delQuery = delQuery.eq('role', role);

    delQuery.then(function() {
      if (perms.length === 0) { showToast('تم مسح كل الصلاحيات','info'); return; }
      sbClient.from('screen_permissions').insert(perms).then(function(r) {
        if (r.error) { showToast('خطأ: '+r.error.message,'error'); return; }
        showToast('تم حفظ '+perms.length+' صلاحية بنجاح ✅','success');
        // Audit log
        sbClient.from('audit_log').insert({
          action: 'PERMISSION_CHANGE', user_name: App.user?App.user.full_name:'',
          details: 'Updated permissions for '+(userId||role)+': '+perms.length+' permissions',
          user_id: App.user?App.user.id:null
        }).then(function(){});
      });
    });
  }
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
