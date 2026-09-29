window.icon = window.icon || function(n){return '<i data-lucide="'+n+'"></i>';};
// ==========================================
// Absence & Leave Workflow Module
// ==========================================

var HRAbsenceModule = {
  settings: {
    advance_notice_days: 1,
    default_penalty_days: 2,
    consecutive_days_for_warning: 3
  },

  init: function() {
    this.loadSettings();
  },

  loadSettings: function() {
    if (typeof sbClient === 'undefined') return;
    sbClient.from('hr_absence_settings').select('*').then(function(res) {
      if (!res.error && res.data) {
        res.data.forEach(function(s) {
          HRAbsenceModule.settings[s.setting_key] = isNaN(s.setting_value) ? s.setting_value : parseFloat(s.setting_value);
        });
      }
    });
  },

  logAudit: function(recordId, tableName, action, oldVal, newVal, reason) {
    if (typeof sbClient === 'undefined') return;
    sbClient.from('hr_absence_audit').insert({
      record_id: recordId,
      table_name: tableName,
      action: action,
      old_value: oldVal ? JSON.stringify(oldVal) : null,
      new_value: newVal ? JSON.stringify(newVal) : null,
      changed_by: App.user ? App.user.full_name : 'System',
      reason: reason || ''
    }).then(function(){});
  },

  isHR: function() { return App.isHR(); },

  isHRManager: function() { return App.isOwner() || (App.user && App.user.role && App.user.role.toLowerCase() === 'hr manager'); },

  isManager: function() { return App.isManager(); },

  renderDashboard: function(el) {
    var isEmp = !this.isHR() && !this.isManager();
    var isMgr = this.isManager() && !this.isHR();
    
    var html = '<div class="card" style="margin-bottom:20px;"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><h3>' + icon('calendar') + ' نظام إدارة الغياب والإجازات</h3>' +
      '<p style="color:var(--text-tertiary);font-size:0.85rem;margin-top:4px;">Workflow مخصص لاعتماد الإجازات وتطبيق الجزاءات</p></div>' +
      '<div><button class="btn btn-primary" onclick="HRAbsenceModule.showRequestModal()">' + icon('plus') + ' تقديم طلب جديد</button></div>' +
      '</div></div>';

    html += '<div class="tabs" style="margin-bottom:20px;">' +
      '<button class="tab-btn active" onclick="HRAbsenceModule.switchTab(\'requests\', this)">' + icon('list') + ' الطلبات</button>' +
      (this.isHR() ? '<button class="tab-btn" onclick="HRAbsenceModule.switchTab(\'violations\', this)">' + icon('alertTriangle') + ' سجل المخالفات</button>' : '') +
      (this.isHR() ? '<button class="tab-btn" onclick="HRAbsenceModule.switchTab(\'dashboard_stats\', this)">' + icon('pieChart') + ' الإحصائيات (HR)</button>' : '') +
      (this.isHRManager() ? '<button class="tab-btn" onclick="HRAbsenceModule.switchTab(\'settings\', this)">' + icon('settings') + ' الإعدادات</button>' : '') +
      '</div>';

    html += '<div id="absence-content"></div>';
    el.innerHTML = html;
    this.renderRequests();
  },

  switchTab: function(tab, btn) {
    document.querySelectorAll('#hr-absence-leave .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
    if(tab === 'requests') this.renderRequests();
    if(tab === 'violations') this.renderViolations();
    if(tab === 'dashboard_stats') this.renderHRStats();
    if(tab === 'settings') this.renderSettings();
  },

  renderRequests: function() {
    var c = document.getElementById('absence-content');
    c.innerHTML = '<div class="card"><div class="card-header"><h3>الطلبات الحالية</h3></div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="abs-req-table">' +
      '<thead><tr><th>رقم الطلب</th><th>الموظف</th><th>القسم</th><th>النوع</th><th>التاريخ</th><th>المدة</th><th>حالة المدير</th><th>حالة HR</th><th>الإجراءات</th></tr></thead>' +
      '<tbody><tr><td colspan="9" class="text-center" style="padding:40px;">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      var query = sbClient.from('hr_absence_requests').select('*').order('created_at', { ascending: false });
      
      // Filter based on role
      if (!this.isHR() && !this.isManager()) {
        query = query.eq('employee_id', App.user.id);
      } else if (this.isManager() && !this.isHR()) {
        query = query.eq('department', App.user.department);
      }

      query.then(function(res) {
        var tbody = document.querySelector('#abs-req-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:40px;">لا توجد طلبات مسجلة</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function(d) {
          var mgrBadge = d.status === 'pending_manager' ? 'warning' : (d.status.includes('rejected') ? 'danger' : 'success');
          var hrBadge = d.status === 'approved' ? 'success' : (d.status === 'pending_hr' ? 'warning' : (d.status === 'rejected_hr' ? 'danger' : 'info'));
          
          var actions = '<button class="btn btn-sm btn-outline" onclick="HRAbsenceModule.viewTimeline(\''+d.id+'\')">' + icon('clock') + ' التتبع</button> ';
          
          if (HRAbsenceModule.isManager() && d.status === 'pending_manager') {
            actions += '<button class="btn btn-sm btn-success" style="margin-right:5px" onclick="HRAbsenceModule.managerAction(\''+d.id+'\', \'approve\')">موافقة</button> ';
            actions += '<button class="btn btn-sm btn-danger" style="margin-right:5px" onclick="HRAbsenceModule.managerAction(\''+d.id+'\', \'reject\')">رفض</button>';
          }
          if (HRAbsenceModule.isHR() && d.status === 'pending_hr') {
            actions += '<button class="btn btn-sm btn-success" style="margin-right:5px" onclick="HRAbsenceModule.hrAction(\''+d.id+'\', \'approve\')">اعتماد</button> ';
            actions += '<button class="btn btn-sm btn-danger" style="margin-right:5px" onclick="HRAbsenceModule.hrAction(\''+d.id+'\', \'reject\')">رفض</button>';
          }

          html += '<tr>' +
            '<td>REQ-' + d.id.substring(0,6).toUpperCase() + (d.emergency_flag ? ' <span class="badge badge-danger">طارئ</span>' : '') + '</td>' +
            '<td>' + (d.employee_name || '-') + '</td>' +
            '<td>' + (d.department || '-') + '</td>' +
            '<td>' + d.type + '</td>' +
            '<td>' + d.start_date + ' إلى ' + d.end_date + '</td>' +
            '<td>' + HRAbsenceModule.calcDays(d.start_date, d.end_date) + ' أيام</td>' +
            '<td><span class="badge badge-' + mgrBadge + '">' + (d.status === 'pending_manager' ? 'قيد الانتظار' : (d.status.includes('rejected') ? 'مرفوض' : 'موافق عليه')) + '</span></td>' +
            '<td><span class="badge badge-' + hrBadge + '">' + (d.status === 'approved' ? 'معتمد' : (d.status === 'pending_hr' ? 'قيد المراجعة' : (d.status === 'rejected_hr' ? 'مرفوض' : '-'))) + '</span></td>' +
            '<td>' + actions + '</td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  calcDays: function(start, end) {
    var d1 = new Date(start), d2 = new Date(end);
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  },

  showRequestModal: function() {
    var bypassHtml = '';
    if (this.isHR()) {
      bypassHtml = '<div class="form-group" style="grid-column:span 2;"><label class="form-label" style="color:var(--accent-danger)">تجاوز سياسة الوقت (لـ HR فقط)</label><div style="display:flex;gap:10px;"><input type="checkbox" id="l_bypass" style="width:20px;height:20px;"> <span style="line-height:20px;">السماح بالتقديم في نفس اليوم أو بأثر رجعي</span></div><input type="text" id="l_bypass_reason" class="form-input" placeholder="سبب التجاوز (مطلوب)" style="margin-top:10px; display:none;"></div>';
    }

    App.openModal('تقديم طلب غياب / إجازة',
      '<form id="leave-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      (this.isHR() ? '<div class="form-group" style="grid-column:span 2;"><label class="form-label">الموظف (اختياري لـ HR)</label><input type="text" id="l_emp_name" class="form-input" placeholder="اكتب اسم الموظف لإنشاء طلب نيابة عنه"></div>' : '') +
      '<div class="form-group"><label class="form-label">تاريخ البداية</label><input type="date" id="l_start" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">تاريخ النهاية</label><input type="date" id="l_end" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">النوع</label><select id="l_type" class="form-input"><option value="إجازة سنوية">إجازة سنوية</option><option value="إجازة عارضة">إجازة عارضة</option><option value="إجازة مرضية">إجازة مرضية</option><option value="غياب بإذن">غياب بإذن</option><option value="إجازة بدون أجر">إجازة بدون أجر</option></select></div>' +
      '<div class="form-group"><label class="form-label">حالة طارئة؟</label><select id="l_emergency" class="form-input"><option value="false">لا</option><option value="true">نعم (ظرف قهري)</option></select></div>' +
      bypassHtml +
      '<div class="form-group" style="grid-column:span 2;"><label class="form-label">السبب / التفاصيل</label><textarea id="l_reason" class="form-input" rows="3" required></textarea></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">إرسال الطلب</button></div></form>',
      '');

    if (this.isHR()) {
      var bypassCb = document.getElementById('l_bypass');
      if (bypassCb) {
        bypassCb.addEventListener('change', function() {
          document.getElementById('l_bypass_reason').style.display = this.checked ? 'block' : 'none';
          if (this.checked) document.getElementById('l_bypass_reason').setAttribute('required', 'true');
          else document.getElementById('l_bypass_reason').removeAttribute('required');
        });
      }
    }

    document.getElementById('leave-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var start = document.getElementById('l_start').value;
      var isEmergency = document.getElementById('l_emergency').value === 'true';
      var bypass = HRAbsenceModule.isHR() && document.getElementById('l_bypass') && document.getElementById('l_bypass').checked;
      
      var today = new Date();
      today.setHours(0,0,0,0);
      var reqDate = new Date(start);
      reqDate.setHours(0,0,0,0);
      
      var diffDays = Math.floor((reqDate - today) / (1000 * 60 * 60 * 24));
      var noticeRequired = HRAbsenceModule.settings.advance_notice_days;

      if (!isEmergency && !bypass && diffDays < noticeRequired) {
        alert("لا يمكن تقديم طلب غياب أو إجازة في نفس اليوم، يجب تقديم الطلب قبل موعد الغياب بـ " + noticeRequired + " يوم على الأقل.");
        HRAbsenceModule.logAudit(App.user.id, 'hr_absence_requests', 'REQUEST_REJECTED_SYSTEM', null, {start: start}, "Policy violation: Advance notice less than " + noticeRequired + " days");
        return;
      }

      var empName = App.user.full_name;
      if (HRAbsenceModule.isHR() && document.getElementById('l_emp_name') && document.getElementById('l_emp_name').value.trim() !== '') {
        empName = document.getElementById('l_emp_name').value;
      }

      var reqData = {
        employee_id: App.user.id,
        employee_name: empName,
        department: App.user.department || 'General',
        start_date: start,
        end_date: document.getElementById('l_end').value,
        type: document.getElementById('l_type').value,
        reason: document.getElementById('l_reason').value,
        emergency_flag: isEmergency,
        status: bypass ? 'pending_hr' : 'pending_manager'
      };

      sbClient.from('hr_absence_requests').insert(reqData).select().single().then(function(r) {
        if (r.error) {
          alert('Error: ' + r.error.message);
        } else {
          HRAbsenceModule.logAudit(r.data.id, 'hr_absence_requests', 'CREATED', null, reqData, bypass ? document.getElementById('l_bypass_reason').value : '');
          App.addNotification({ user_id: App.user.id, title: 'تم تقديم الطلب', message: 'تم إرسال طلبك للمدير المباشر للمراجعة.', type: 'info' });
          App.closeModal();
          HRAbsenceModule.renderRequests();
        }
      });
    });
  },

  managerAction: function(id, action) {
    var notes = prompt("إضافة ملاحظات (اختياري):");
    if (notes === null) return;
    
    var newStatus = action === 'approve' ? 'pending_hr' : 'rejected_manager';
    sbClient.from('hr_absence_requests').update({ status: newStatus, manager_notes: notes, manager_name: App.user.full_name }).eq('id', id).select().single().then(function(r) {
      if(!r.error) {
        HRAbsenceModule.logAudit(id, 'hr_absence_requests', 'MANAGER_REVIEW', {status: 'pending_manager'}, {status: newStatus, notes: notes}, '');
        if(action === 'reject') {
          App.addNotification({ user_id: r.data.employee_id, title: 'تم رفض الطلب', message: 'رفض مديرك المباشر طلبك. السبب: ' + notes, type: 'danger' });
        } else {
          App.addNotification({ user_id: r.data.employee_id, title: 'موافقة مبدئية', message: 'وافق مديرك على الطلب، وتم تحويله للـ HR.', type: 'info' });
        }
        HRAbsenceModule.renderRequests();
      }
    });
  },

  hrAction: function(id, action) {
    var notes = prompt("ملاحظات الموارد البشرية (HR):");
    if (notes === null) return;
    
    var newStatus = action === 'approve' ? 'approved' : 'rejected_hr';
    sbClient.from('hr_absence_requests').update({ status: newStatus, hr_notes: notes }).eq('id', id).select().single().then(function(r) {
      if(!r.error) {
        HRAbsenceModule.logAudit(id, 'hr_absence_requests', 'HR_REVIEW', {status: 'pending_hr'}, {status: newStatus, notes: notes}, '');
        App.addNotification({ user_id: r.data.employee_id, title: (action==='approve'?'تم اعتماد الإجازة':'رفض من الـ HR'), message: 'HR Notes: ' + notes, type: (action==='approve'?'success':'danger') });
        HRAbsenceModule.renderRequests();
      }
    });
  },

  viewTimeline: function(id) {
    sbClient.from('hr_absence_audit').select('*').eq('record_id', id).order('created_at', {ascending: true}).then(function(r) {
      if(r.error || !r.data) return;
      var html = '<div class="timeline">';
      r.data.forEach(function(a) {
        html += '<div style="margin-bottom:15px; border-left:2px solid var(--accent-primary); padding-left:15px;">' +
          '<div style="font-size:0.8rem; color:var(--text-tertiary)">' + new Date(a.created_at).toLocaleString() + '</div>' +
          '<div style="font-weight:bold">' + a.action + ' (' + a.changed_by + ')</div>' +
          (a.reason ? '<div style="font-size:0.9rem; color:var(--text-secondary)">السبب: ' + a.reason + '</div>' : '') +
          '</div>';
      });
      html += '</div>';
      App.openModal('التسلسل الزمني للطلب (Timeline)', html, '');
    });
  },

  // ==========================
  // سجل المخالفات والغياب بدون إذن
  // ==========================
  renderViolations: function() {
    var c = document.getElementById('absence-content');
    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('alertTriangle') + ' سجل الغياب والمخالفات</h3></div>' +
      '<div><button class="btn btn-outline" onclick="HRAbsenceModule.addUnauthorizedAbsence()">' + icon('plus') + ' تسجيل غياب بدون إذن</button></div></div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="abs-viol-table">' +
      '<thead><tr><th>التاريخ</th><th>الموظف</th><th>النوع</th><th>الخصم (أيام)</th><th>القرار الحالي</th><th>الحالة</th><th>الإجراءات</th></tr></thead>' +
      '<tbody><tr><td colspan="7" class="text-center" style="padding:40px;">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>' +
      '<div class="card" style="margin-top:20px"><div class="card-header"><h3>الإنذارات التلقائية (Warnings)</h3></div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="abs-warn-table">' +
      '<thead><tr><th>الموظف</th><th>القسم</th><th>نوع الإنذار</th><th>أيام غياب متتالية</th><th>السبب</th><th>تاريخ الإصدار</th></tr></thead>' +
      '<tbody><tr><td colspan="6" class="text-center" style="padding:40px;">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('hr_absence_records').select('*').order('created_at', { ascending: false }).then(function(res) {
        var tbody = document.querySelector('#abs-viol-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:40px;">لا توجد سجلات غياب</td></tr>';
        } else {
          var html = '';
          res.data.forEach(function(d) {
            html += '<tr>' +
              '<td>' + d.date + '</td>' +
              '<td>' + (d.employee_name || '-') + '</td>' +
              '<td><span class="badge badge-danger">' + d.type + '</span></td>' +
              '<td style="font-weight:bold; color:var(--accent-danger)">' + d.penalty_days + ' يوم</td>' +
              '<td><span class="badge badge-info">' + d.hr_decision + '</span></td>' +
              '<td>' + d.status + '</td>' +
              '<td><button class="btn btn-sm btn-outline" onclick="HRAbsenceModule.modifyAbsenceDecision(\''+d.id+'\')">تعديل القرار</button></td>' +
              '</tr>';
          });
          tbody.innerHTML = html;
        }
      });

      sbClient.from('hr_violations_warnings').select('*').order('created_at', { ascending: false }).then(function(res) {
        var tbody = document.querySelector('#abs-warn-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px;">لا توجد إنذارات</td></tr>';
        } else {
          var html = '';
          res.data.forEach(function(d) {
            html += '<tr>' +
              '<td>' + (d.employee_name || '-') + '</td>' +
              '<td>' + (d.department || '-') + '</td>' +
              '<td><span class="badge badge-warning">' + d.warning_level + '</span></td>' +
              '<td>' + d.consecutive_days + '</td>' +
              '<td>' + d.reason + '</td>' +
              '<td>' + new Date(d.created_at).toLocaleDateString() + '</td>' +
              '</tr>';
          });
          tbody.innerHTML = html;
        }
      });
    }
  },

  addUnauthorizedAbsence: function() {
    App.openModal('تسجيل غياب بدون إذن',
      '<form id="u-abs-form" style="display:grid;gap:15px;">' +
      '<div class="form-group"><label class="form-label">اسم الموظف</label><input type="text" id="u_emp_name" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">تاريخ الغياب</label><input type="date" id="u_date" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">الخصم (الافتراضي: ' + this.settings.default_penalty_days + ' يوم)</label><input type="number" id="u_pen" class="form-input" step="0.5" value="' + this.settings.default_penalty_days + '"></div>' +
      '<button type="submit" class="btn btn-danger">تسجيل وتطبيق الخصم</button></form>',
      '');

    document.getElementById('u-abs-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('u_emp_name').value;
      var date = document.getElementById('u_date').value;
      var pen = document.getElementById('u_pen').value;
      
      sbClient.from('hr_absence_records').insert({
        employee_id: App.user.id, // Dummy for manual entry if ID isn't searched
        employee_name: name,
        date: date,
        type: 'unauthorized',
        penalty_days: pen,
        hr_decision: 'deduct_' + pen
      }).select().single().then(function(r) {
        if(!r.error) {
          HRAbsenceModule.logAudit(r.data.id, 'hr_absence_records', 'SYSTEM_ABSENCE_LOGGED', null, r.data, 'Manual entry by HR');
          App.closeModal();
          HRAbsenceModule.renderViolations();
        }
      });
    });
  },

  modifyAbsenceDecision: function(id) {
    App.openModal('تعديل قرار الغياب',
      '<form id="mod-abs-form" style="display:grid;gap:15px;">' +
      '<div class="form-group"><label class="form-label">القرار الجديد</label><select id="mod_dec" class="form-input">' +
      '<option value="deduct_2">خصم يومين (الافتراضي)</option>' +
      '<option value="deduct_1">خصم يوم واحد فقط</option>' +
      '<option value="casual_leave">تحويل لإجازة عارضة (مدفوعة)</option>' +
      '<option value="unpaid_leave">تحويل لإجازة بدون أجر</option>' +
      '<option value="cancelled">إلغاء الجزاء بالكامل</option>' +
      '</select></div>' +
      '<div class="form-group"><label class="form-label">سبب التعديل (مطلوب)</label><textarea id="mod_reason" class="form-input" rows="2" required></textarea></div>' +
      '<button type="submit" class="btn btn-primary">تحديث القرار</button></form>',
      '');

    document.getElementById('mod-abs-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var dec = document.getElementById('mod_dec').value;
      var reason = document.getElementById('mod_reason').value;
      var pen = 0;
      if(dec === 'deduct_2') pen = 2;
      else if(dec === 'deduct_1' || dec === 'unpaid_leave') pen = 1;
      
      sbClient.from('hr_absence_records').update({ hr_decision: dec, penalty_days: pen, status: 'overridden' }).eq('id', id).then(function(r) {
        if(!r.error) {
          HRAbsenceModule.logAudit(id, 'hr_absence_records', 'HR_DECISION_MODIFIED', {decision: 'previous'}, {decision: dec, penalty: pen}, reason);
          App.closeModal();
          HRAbsenceModule.renderViolations();
        }
      });
    });
  },

  renderHRStats: function() {
    var c = document.getElementById('absence-content');
    c.innerHTML = '<div class="kpi-grid">' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(37,99,235,0.15);color:#3b82f6;">' + icon('list') + '</div><div class="kpi-info"><h3>إجمالي الطلبات</h3><p id="st_tot">0</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(239,68,68,0.15);color:#ef4444;">' + icon('alertTriangle') + '</div><div class="kpi-info"><h3>الغياب بدون إذن</h3><p id="st_unauth">0</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b;">' + icon('bell') + '</div><div class="kpi-info"><h3>إنذارات نشطة</h3><p id="st_warn">0</p></div></div>' +
      '</div>';
      
    if (typeof sbClient !== 'undefined') {
      sbClient.from('hr_absence_requests').select('id', {count: 'exact'}).then(function(r) { if(document.getElementById('st_tot')) document.getElementById('st_tot').textContent = r.count || 0; });
      sbClient.from('hr_absence_records').select('id', {count: 'exact'}).eq('type', 'unauthorized').then(function(r) { if(document.getElementById('st_unauth')) document.getElementById('st_unauth').textContent = r.count || 0; });
      sbClient.from('hr_violations_warnings').select('id', {count: 'exact'}).then(function(r) { if(document.getElementById('st_warn')) document.getElementById('st_warn').textContent = r.count || 0; });
    }
  },

  renderSettings: function() {
    var c = document.getElementById('absence-content');
    c.innerHTML = '<div class="card" style="max-width:600px"><div class="card-header"><h3>إعدادات الغياب (Owner & HR Manager)</h3></div>' +
      '<div class="card-body"><form id="abs-settings-form" style="display:flex;flex-direction:column;gap:15px;">' +
      '<div class="form-group"><label class="form-label">أيام التقديم المسبق (لرفض طلبات نفس اليوم)</label><input type="number" id="s_adv" class="form-input" value="' + this.settings.advance_notice_days + '"></div>' +
      '<div class="form-group"><label class="form-label">الخصم الافتراضي للغياب (بالأيام)</label><input type="number" id="s_pen" class="form-input" step="0.5" value="' + this.settings.default_penalty_days + '"></div>' +
      '<div class="form-group"><label class="form-label">عدد الأيام المتتالية لإصدار إنذار</label><input type="number" id="s_cons" class="form-input" value="' + this.settings.consecutive_days_for_warning + '"></div>' +
      '<button type="submit" class="btn btn-primary">حفظ الإعدادات</button></form></div></div>';

    document.getElementById('abs-settings-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var adv = document.getElementById('s_adv').value;
      var pen = document.getElementById('s_pen').value;
      var cons = document.getElementById('s_cons').value;

      if (typeof sbClient !== 'undefined') {
        Promise.all([
          sbClient.from('hr_absence_settings').upsert({setting_key: 'advance_notice_days', setting_value: adv}),
          sbClient.from('hr_absence_settings').upsert({setting_key: 'default_penalty_days', setting_value: pen}),
          sbClient.from('hr_absence_settings').upsert({setting_key: 'consecutive_days_for_warning', setting_value: cons})
        ]).then(function() {
          HRAbsenceModule.settings.advance_notice_days = adv;
          HRAbsenceModule.settings.default_penalty_days = pen;
          HRAbsenceModule.settings.consecutive_days_for_warning = cons;
          alert('تم حفظ الإعدادات بنجاح');
        });
      }
    });
  }
};

window.HRAbsenceModule = HRAbsenceModule;
