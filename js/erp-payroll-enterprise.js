// ===== ENTERPRISE PAYROLL FUNDING MODULE =====
// Clean, professional, no animations

Pages.payrollFunding = function(el) {
  var isFinance = App.user && App.user.department === 'Finance';
  var isOwner = App.isOwner();
  var isHR = App.isHR();
  if(!isFinance && !isOwner && !isHR) {
    el.innerHTML = '<div class="alert alert-danger text-center">Access Denied. Finance & HR Management only.</div>';
    return;
  }

  var payrollData = [];
  var employees = [];
  var selectedMonth = '';
  var isLoading = true;

  function loadData() {
    if(isLoading) {
      el.innerHTML = '<div style="padding:60px; text-align:center;"><div class="spinner" style="width:48px;height:48px;border-width:3px;"></div><p style="margin-top:16px;color:var(--text-muted)">جاري تحميل نظام الرواتب...</p></div>';
    }
    
    Promise.all([
      sbClient.from('payroll').select('*').in('status', ['processing', 'funds_released', 'paid', 'collected']),
      sbClient.from('users').select('id,full_name,department')
    ]).then(function(res) {
      if(res[0].error || res[1].error) { 
        el.innerHTML = '<div class="alert alert-danger">خطأ في تحميل البيانات.</div>'; 
        return; 
      }
      
      payrollData = res[0].data || [];
      employees = res[1].data || [];
      
      if(!selectedMonth && payrollData.length > 0) {
        var months = [...new Set(payrollData.map(p => p.month))].sort().reverse();
        selectedMonth = months[0];
      }
      
      isLoading = false;
      renderUI();
    });
  }

  function renderUI() {
    var filteredPayroll = payrollData.filter(p => p.month === selectedMonth);
    
    var totalAmount = 0;
    var remainingAmount = 0;
    var processingCount = 0;
    var releasedCount = 0;
    var paidCount = 0;
    var collectedCount = 0;
    
    filteredPayroll.forEach(p => {
      totalAmount += p.net_salary || 0;
      if(p.status === 'processing') { processingCount++; remainingAmount += p.net_salary || 0; }
      else if(p.status === 'funds_released') { releasedCount++; remainingAmount += p.net_salary || 0; }
      else if(p.status === 'paid') paidCount++;
      else if(p.status === 'collected') collectedCount++;
    });
    
    var totalEmp = filteredPayroll.length;
    var doneCount = paidCount + collectedCount;
    var progress = totalEmp ? Math.round((doneCount / totalEmp) * 100) : 0;

    var html = '<div class="erp-payroll-enterprise" style="direction:rtl;">';
    
    // ── Header ──
    html += '<div class="card mb-3" style="background:linear-gradient(135deg, #1e1b4b, #312e81); border:none; border-radius:12px;">';
    html += '<div class="card-body" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:20px 24px;">';
    html += '<div>';
    html += '<h2 style="color:#fff; margin:0 0 4px 0; font-size:1.3rem; font-weight:700;">💰 صرف المرتبات - ' + (selectedMonth || 'لا يوجد') + '</h2>';
    html += '<p style="color:rgba(255,255,255,0.6); margin:0; font-size:0.85rem;">نظام صرف المرتبات المؤسسي</p>';
    html += '</div>';
    html += '<div style="display:flex; gap:30px; text-align:left;">';
    html += '<div>';
    html += '<h2 style="color:#22c55e; margin:0; font-weight:900; font-size:1.6rem;">EGP ' + remainingAmount.toLocaleString() + '</h2>';
    html += '<p style="color:rgba(255,255,255,0.6); margin:0; font-size:0.8rem;">المبلغ المتبقي للصرف</p>';
    html += '</div>';
    html += '<div style="opacity:0.6;">';
    html += '<h2 style="color:#fff; margin:0; font-weight:700; font-size:1.2rem; text-decoration:line-through;">EGP ' + totalAmount.toLocaleString() + '</h2>';
    html += '<p style="color:#fff; margin:0; font-size:0.7rem;">الإجمالي العام</p>';
    html += '</div>';
    html += '</div>';
    html += '</div></div>';

    // ── KPI Cards ──
    html += '<div class="row mb-3">';
    html += _kpi('إجمالي الموظفين', totalEmp, '#6366f1');
    html += _kpi('بانتظار التحويل', processingCount, '#f59e0b');
    html += _kpi('تم التحويل للـ HR', releasedCount, '#3b82f6');
    html += _kpi('تم الصرف', paidCount, '#10b981');
    html += _kpi('تم القبض', collectedCount, '#22c55e');
    html += _kpi('نسبة الإنجاز', progress + '%', progress === 100 ? '#22c55e' : '#8b5cf6');
    html += '</div>';

    // ── Progress Bar ──
    html += '<div class="card mb-3"><div class="card-body" style="padding:16px 20px;">';
    html += '<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><strong>تقدم عملية الصرف</strong><span>' + progress + '% (' + doneCount + '/' + totalEmp + ')</span></div>';
    html += '<div style="height:10px; border-radius:5px; background:var(--bg-secondary); overflow:hidden;">';
    html += '<div style="width:' + progress + '%; height:100%; background:linear-gradient(90deg, #6366f1, #22c55e); border-radius:5px;"></div>';
    html += '</div></div></div>';

    // ── Actions & Month Selection ──
    html += '<div class="card mb-3"><div class="card-body" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding:14px 20px;">';
    // Month selector
    html += '<select class="form-select" style="width:160px;" onchange="window.prSelectMonth(this.value)">';
    var allMonths = [...new Set(payrollData.map(p => p.month))].sort().reverse();
    allMonths.forEach(m => { html += '<option value="'+m+'" '+(m===selectedMonth?'selected':'')+'>'+m+'</option>'; });
    html += '</select>';

    // Finance: Release Funds
    if (isFinance || isOwner) {
      if(processingCount > 0) {
        html += '<button class="btn btn-warning" onclick="window.prReleaseFunds()"><i data-lucide="unlock"></i> تحويل الأموال للـ HR (' + processingCount + ')</button>';
      } else {
        html += '<button class="btn btn-secondary" disabled>لا يوجد مبالغ للتحويل</button>';
      }
    }

    // HR: Generate Payroll
    if (isHR || isOwner) {
      html += '<button class="btn btn-primary" onclick="App.navigate(\'payroll\')"><i data-lucide="calculator"></i> إصدار راتب</button>';
      
      // HR: Confirm receipt from accountant & disburse
      if(releasedCount > 0) {
        html += '<button class="btn btn-success" onclick="window.prConfirmReceiptAndPay()"><i data-lucide="check-circle"></i> تأكيد استلام المرتبات وصرفها (' + releasedCount + ')</button>';
      }
    }

    html += '<button class="btn btn-outline-secondary" onclick="loadData()"><i data-lucide="refresh-cw"></i> تحديث</button>';
    html += '</div></div>';

    // ── Data Table ──
    html += '<div class="card"><div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">';
    html += '<h3 style="margin:0;">سجل رواتب الموظفين</h3>';
    html += '<input type="text" class="form-control form-control-sm" style="width:220px;" placeholder="بحث بالاسم..." onkeyup="window.prFilter(this.value)">';
    html += '</div>';
    html += '<div class="card-body p-0"><div class="table-responsive"><table class="table table-hover m-0" id="pr-table">';
    html += '<thead style="background:var(--bg-secondary);"><tr>';
    html += '<th>الموظف</th><th>القسم</th><th>الراتب الأساسي</th><th>الإضافي</th><th>الخصومات</th><th>صافي الراتب</th><th>الحالة</th><th>إجراء</th>';
    html += '</tr></thead><tbody>';
    
    if(filteredPayroll.length === 0) {
      html += '<tr><td colspan="8" class="text-center" style="padding:40px; color:var(--text-muted);">لا توجد رواتب مسجلة لهذا الشهر.</td></tr>';
    }

    filteredPayroll.forEach(p => {
      var emp = employees.find(e => e.id === p.employee_id) || {full_name: p.employee_name || 'غير معروف', department: '-'};
      
      var isPaid = p.status === 'paid' || p.status === 'collected';
      
      html += '<tr>';
      html += '<td><strong>' + emp.full_name + '</strong></td>';
      html += '<td>' + emp.department + '</td>';
      html += '<td>' + (p.base_salary||0).toLocaleString() + '</td>';
      html += '<td style="color:#10b981;">' + ((p.overtime_pay||0) + (p.bonuses||0)).toLocaleString() + '</td>';
      html += '<td style="color:#ef4444;">' + ((p.penalties||0) + (p.late_deductions||0) + (p.absence_deductions||0) + (p.insurance_deduction||0) + (p.loan_deduction||0)).toLocaleString() + '</td>';
      html += '<td><strong>EGP ' + (p.net_salary||0).toLocaleString() + '</strong></td>';
      
      html += '<td>';
      if (!isPaid) {
        html += '<button class="btn btn-sm" onclick="window.prMarkPaidIndividual(\'' + p.id + '\')" style="background:#f59e0b; color:#fff; border-radius:20px; padding:4px 16px; border:none; font-weight:bold; transition:0.3s; cursor:pointer;" onmouseover="this.style.background=\'#d97706\'" onmouseout="this.style.background=\'#f59e0b\'">اصرف</button>';
      } else {
        html += '<span class="badge" style="background:#10b981; color:#fff; padding:6px 12px; border-radius:20px;">تم الصرف ✓</span>';
      }
      html += '</td>';

      html += '<td>';
      html += '<button class="btn btn-sm btn-outline-secondary" onclick="window.prViewDetails(\'' + p.id + '\')">تفاصيل</button>';
      html += '</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table></div></div></div>';

    // ── Lifecycle Timeline ──
    html += '<div class="card mt-3"><div class="card-header"><h3 style="margin:0;">🔄 دورة حياة الراتب</h3></div><div class="card-body">';
    html += '<div style="display:flex; justify-content:space-around; text-align:center; position:relative; flex-wrap:wrap; gap:10px;">';
    
    var steps = [
      { label: '1. إصدار من HR', done: totalEmp > 0 },
      { label: '2. تحويل من المحاسب', done: releasedCount > 0 || paidCount > 0 || collectedCount > 0 },
      { label: '3. تأكيد استلام HR', done: paidCount > 0 || collectedCount > 0 },
      { label: '4. قبض الموظفين', done: collectedCount > 0 },
      { label: '5. مكتمل', done: progress === 100 && totalEmp > 0 }
    ];
    
    steps.forEach(function(s) {
      var bg = s.done ? '#22c55e' : 'var(--bg-tertiary, #374151)';
      var textColor = s.done ? '#fff' : 'var(--text-muted)';
      html += '<div style="flex:1; min-width:100px; padding:10px;">';
      html += '<div style="width:36px; height:36px; border-radius:50%; background:' + bg + '; color:' + textColor + '; display:flex; align-items:center; justify-content:center; margin:0 auto 8px auto; font-weight:700; font-size:14px;">';
      html += s.done ? '✓' : '○';
      html += '</div>';
      html += '<strong style="font-size:0.8rem;">' + s.label + '</strong>';
      html += '</div>';
    });
    
    html += '</div></div></div>';
    
    html += '</div>';
    el.innerHTML = html;
    if(window.lucide) lucide.createIcons();
  }

  function _kpi(title, value, color) {
    return '<div class="col-md-2 col-6 mb-2"><div class="card h-100" style="border-right:4px solid ' + color + '; border-radius:8px;"><div class="card-body p-3 text-center">' +
           '<h4 style="margin:0 0 4px 0; font-weight:800; color:' + color + ';">' + value + '</h4>' +
           '<small style="color:var(--text-muted); font-size:0.75rem;">' + title + '</small>' +
           '</div></div></div>';
  }

  function _statusBadge(status) {
    var map = {
      'processing': '<span class="badge" style="background:#f59e0b; color:#000;">بانتظار التحويل</span>',
      'funds_released': '<span class="badge" style="background:#3b82f6; color:#fff;">تم التحويل</span>',
      'paid': '<span class="badge" style="background:#10b981; color:#fff;">تم الصرف</span>',
      'collected': '<span class="badge" style="background:#22c55e; color:#fff;">تم القبض ✓</span>'
    };
    return map[status] || '<span class="badge bg-secondary">' + status + '</span>';
  }

  // --- Actions ---
  window.prSelectMonth = function(m) {
    selectedMonth = m;
    renderUI();
  };
  
  window.prFilter = function(val) {
    val = val.toLowerCase();
    var rows = document.querySelectorAll('#pr-table tbody tr');
    rows.forEach(r => {
      r.style.display = r.innerText.toLowerCase().includes(val) ? '' : 'none';
    });
  };

  // Finance: Release funds to HR
  window.prReleaseFunds = function() {
    var toRelease = payrollData.filter(p => p.month === selectedMonth && p.status === 'processing');
    var ids = toRelease.map(p => p.id);
    var amt = toRelease.reduce((s,p) => s + (p.net_salary||0), 0);
    
    var body = '<h4>تحويل الأموال إلى قسم HR</h4>';
    body += '<p>سيتم تحويل مبلغ <strong>EGP ' + amt.toLocaleString() + '</strong> لعدد <strong>' + ids.length + '</strong> موظف.</p>';
    body += '<table class="table table-sm" style="font-size:0.85rem;"><tr><th>الشهر</th><td>' + selectedMonth + '</td></tr>';
    body += '<tr><th>عدد الموظفين</th><td>' + ids.length + '</td></tr>';
    body += '<tr><th>إجمالي المبلغ</th><td>EGP ' + amt.toLocaleString() + '</td></tr></table>';
    body += '<div class="alert alert-info" style="font-size:0.85rem;">✅ الرصيد كافي لإتمام العملية.</div>';
    
    App.showModal('تأكيد تحويل الأموال', body, '<button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button> <button class="btn btn-warning" id="pr-confirm-release">تأكيد التحويل</button>');
    
    document.getElementById('pr-confirm-release').onclick = function() {
      this.disabled = true; this.innerHTML = 'جاري المعالجة...';
      sbClient.from('payroll').update({status: 'funds_released'}).in('id', ids).then(r => {
        App.closeModal();
        if(r.error) return alert(r.error.message);
        showToast('تم تحويل الأموال بنجاح إلى قسم HR.', 'success');
        loadData();
      });
    };
  };

  // HR: Confirm receipt from accountant and mark as paid
  window.prConfirmReceiptAndPay = function() {
    var toConfirm = payrollData.filter(p => p.month === selectedMonth && p.status === 'funds_released');
    var ids = toConfirm.map(p => p.id);
    var amt = toConfirm.reduce((s,p) => s + (p.net_salary||0), 0);

    var body = '<h4>تأكيد استلام المرتبات من المحاسب</h4>';
    body += '<p>هل أنت متأكد من استلام مرتبات هذا الشهر من قسم الحسابات؟</p>';
    body += '<table class="table table-sm" style="font-size:0.85rem;"><tr><th>الشهر</th><td>' + selectedMonth + '</td></tr>';
    body += '<tr><th>عدد الموظفين</th><td>' + ids.length + '</td></tr>';
    body += '<tr><th>إجمالي المبلغ</th><td>EGP ' + amt.toLocaleString() + '</td></tr></table>';
    body += '<div class="alert alert-warning" style="font-size:0.85rem;">⚠️ بعد التأكيد، ستظهر أسماء الموظفين في صفحة "قبض الموظفين" لتسجيل الاستلام الفردي.</div>';

    App.showModal('تأكيد استلام المرتبات', body, '<button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button> <button class="btn btn-success" id="pr-confirm-receipt">تأكيد الاستلام ✓</button>');

    document.getElementById('pr-confirm-receipt').onclick = function() {
      this.disabled = true; this.innerHTML = 'جاري المعالجة...';
      sbClient.from('payroll').update({status: 'paid'}).in('id', ids).then(r => {
        App.closeModal();
        if(r.error) return alert(r.error.message);
        showToast('تم تأكيد استلام المرتبات بنجاح! يمكنك الآن الانتقال لصفحة "قبض الموظفين".', 'success');
        loadData();
      });
    };
  };

  window.prViewDetails = function(id) {
    var p = payrollData.find(x => x.id == id);
    if(!p) return;
    var emp = employees.find(e => e.id === p.employee_id) || {full_name: p.employee_name || 'غير معروف'};
    var body = '<table class="table table-bordered" style="font-size:0.9rem;">';
    body += '<tr><th>الموظف</th><td>' + emp.full_name + '</td></tr>';
    body += '<tr><th>الشهر</th><td>' + p.month + '</td></tr>';
    body += '<tr><th>الراتب الأساسي</th><td>' + (p.base_salary||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>الإضافي (عمل إضافي)</th><td>' + (p.overtime_pay||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>المكافآت</th><td>' + (p.bonuses||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>الجزاءات</th><td style="color:#ef4444;">' + (p.penalties||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>خصم التأخير</th><td style="color:#ef4444;">' + (p.late_deductions||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>خصم الغياب</th><td style="color:#ef4444;">' + (p.absence_deductions||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>خصم التأمينات</th><td style="color:#ef4444;">' + (p.insurance_deduction||0).toLocaleString() + '</td></tr>';
    body += '<tr><th>خصم السلف</th><td style="color:#ef4444;">' + (p.loan_deduction||0).toLocaleString() + '</td></tr>';
    body += '<tr style="background:var(--bg-secondary);"><th><strong>صافي الراتب</strong></th><td><strong style="font-size:1.1rem;">EGP ' + (p.net_salary||0).toLocaleString() + '</strong></td></tr>';
    body += '<tr><th>الحالة</th><td>' + _statusBadge(p.status) + '</td></tr>';
    body += '</table>';
    App.showModal('تفاصيل الراتب', body, '<button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>');
  };

  window.prMarkPaidIndividual = function(id) {
    if(!confirm('هل أنت متأكد من صرف راتب هذا الموظف؟')) return;
    sbClient.from('payroll').update({status: 'paid'}).eq('id', id).then(r => {
      if(r.error) {
        showToast('حدث خطأ أثناء حفظ الحالة.', 'danger');
        return;
      }
      showToast('تم صرف الراتب وخصمه من الإجمالي بنجاح.', 'success');
      loadData();
    });
  };

  loadData();
};
