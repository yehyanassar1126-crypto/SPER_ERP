window.Pages = window.Pages || {};

Pages.medicalRequests = function (el) {
  var requests = [];
  
  function render() {
    var isOwner = App.user.role === 'owner';
    var isNursing = App.user.role === 'nursing management';
    var isManager = App.user.role === 'manager' || App.user.role === 'hall manager' || App.user.role === 'department head';
    var isHR = App.user.role === 'hr' || App.user.role === 'hr manager';
    var isFinance = App.user.department === 'Finance' || App.user.role === 'accountant' || App.user.role === 'chief accountant';

    var html = '<div class="card"><div class="card-header"><div><h3>🏥 Medical Approvals (موافقات طبية)</h3><p>Review and process employee medical requests (مراجعة الطلبات الطبية)</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Employee (الموظف)</th><th>Date (التاريخ)</th><th>Description (البيان)</th><th>Doc (المرفق)</th><th>Amount (المبلغ)</th><th>Status (الحالة)</th><th>Rejection Reason (سبب الرفض)</th><th>Actions (إجراءات)</th></tr></thead><tbody>';
    
    // Filter requests based on role
    var visibleRequests = requests.filter(function(r) {
      if (isOwner) return true;
      if (isNursing) return r.status === 'pending_nursing' || r.status === 'rejected';
      if (isManager) return r.status === 'pending_manager';
      if (isFinance) return r.status === 'pending_finance';
      if (isHR) return r.status === 'pending_hr' || r.status === 'disbursed';
      return false;
    });

    if (visibleRequests.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px">No pending medical requests (لا توجد طلبات معلقة)</td></tr>';
    } else {
      visibleRequests.forEach(function(r) {
        var statusBadge = '';
        if (r.status === 'pending_nursing') statusBadge = '<span class="badge badge-warning">⏳ Nursing Approval (مراجعة التمريض)</span>';
        else if (r.status === 'pending_manager') statusBadge = '<span class="badge badge-warning">👔 Manager Approval (مراجعة المدير)</span>';
        else if (r.status === 'pending_finance') statusBadge = '<span class="badge badge-info">💰 Finance Processing (الحسابات - إصدار فاتورة)</span>';
        else if (r.status === 'pending_hr') statusBadge = '<span class="badge badge-primary">📋 HR Payroll (اعتماد لإضافته للراتب)</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">✅ Added to Payroll (تمت الإضافة للراتب)</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">❌ Rejected (مرفوض)</span>';
        
        var docLink = r.document_url ? '<a href="' + r.document_url + '" target="_blank" class="btn btn-xs btn-outline">👁️ View</a>' : '-';

        html += '<tr>';
        html += '<td><div style="font-weight:600">' + (r.employee_name || 'Unknown') + '</div></td>';
        html += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        html += '<td>' + r.description + '</td>';
        html += '<td>' + docLink + '</td>';
        html += '<td style="font-weight:bold;color:var(--accent-primary)">' + (r.amount > 0 ? r.amount.toLocaleString() + ' EGP' : '—') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td style="color:var(--accent-danger);font-size:0.85rem">' + (r.rejection_reason || '-') + '</td>';
        
        html += '<td><div style="display:flex;gap:4px;flex-wrap:wrap">';
        
        // Nursing Actions
        if (r.status === 'pending_nursing' && (isNursing || isOwner)) {
          html += '<button class="btn btn-xs btn-success btn-approve-nursing" data-id="' + r.id + '">Approve (موافقة)</button>';
          html += '<button class="btn btn-xs btn-danger btn-reject" data-id="' + r.id + '">Reject (رفض)</button>';
        }
        
        // Manager Actions
        if (r.status === 'pending_manager' && (isManager || isOwner)) {
          html += '<button class="btn btn-xs btn-success btn-approve-manager" data-id="' + r.id + '">Approve (موافقة)</button>';
          html += '<button class="btn btn-xs btn-danger btn-reject" data-id="' + r.id + '">Reject (رفض)</button>';
        }

        // Finance Actions
        if (r.status === 'pending_finance' && (isFinance || isOwner)) {
          html += '<button class="btn btn-xs btn-info btn-create-invoice" data-id="' + r.id + '" data-emp="' + r.employee_name + '">Create Invoice (إصدار فاتورة)</button>';
        }

        // HR Actions
        if (r.status === 'pending_hr' && (isHR || isOwner)) {
          html += '<button class="btn btn-xs btn-primary btn-add-payroll" data-id="' + r.id + '">Add to Payroll (اعتماد للراتب)</button>';
        }

        html += '</div></td>';
        html += '</tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    // Bind Nursing Approval
    var btnAppNurs = el.querySelectorAll('.btn-approve-nursing');
    for (var i = 0; i < btnAppNurs.length; i++) {
      btnAppNurs[i].addEventListener('click', function() {
        if (!confirm('Confirm medical validity? (هل تؤكد صحة الطلب طبيًا؟)')) return;
        var id = this.getAttribute('data-id');
        sbClient.from('medical_requests').update({ status: 'pending_manager' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message); else { showToast('✅ Forwarded to Manager', 'success'); loadData(); }
        });
      });
    }

    // Bind Manager Approval
    var btnAppMgr = el.querySelectorAll('.btn-approve-manager');
    for (var i = 0; i < btnAppMgr.length; i++) {
      btnAppMgr[i].addEventListener('click', function() {
        if (!confirm('Approve this request? (هل توافق على هذا الطلب؟)')) return;
        var id = this.getAttribute('data-id');
        sbClient.from('medical_requests').update({ status: 'pending_finance' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message); else { showToast('✅ Forwarded to Finance', 'success'); loadData(); }
        });
      });
    }

    // Bind Reject
    var rejectBtns = el.querySelectorAll('.btn-reject');
    for (var i = 0; i < rejectBtns.length; i++) {
      rejectBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var reason = prompt("Enter rejection reason (أدخل سبب الرفض):");
        if (reason === null) return;
        sbClient.from('medical_requests').update({ status: 'rejected', rejection_reason: reason }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message); else { showToast('❌ Request Rejected', 'success'); loadData(); }
        });
      });
    }

    // Bind Finance Invoice
    var invBtns = el.querySelectorAll('.btn-create-invoice');
    for (var i = 0; i < invBtns.length; i++) {
      invBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var empName = this.getAttribute('data-emp');
        var amount = prompt("Enter approved invoice amount in EGP (أدخل قيمة الفاتورة المعتمدة):");
        if (!amount || isNaN(parseFloat(amount))) return;
        
        // 1. Create Finance AP/AR Invoice automatically
        sbClient.from('finance_general_ledger').insert({
          account_id: 'liabilities', // Example category
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Medical Invoice for ' + empName,
          debit: 0, credit: parseFloat(amount),
          reference_type: 'medical_invoice',
          reference_id: id,
          created_by: App.user.id
        }).then(function(invRes) {
          if(invRes.error) return alert('Failed to create invoice: ' + invRes.error.message);
          
          // 2. Update medical request
          sbClient.from('medical_requests').update({ status: 'pending_hr', amount: parseFloat(amount) }).eq('id', id).then(function(res) {
            if (res.error) alert(res.error.message); else { showToast('✅ Invoice Created! Forwarded to HR', 'success'); loadData(); }
          });
        });
      });
    }

    // Bind HR Add to Payroll
    var hrBtns = el.querySelectorAll('.btn-add-payroll');
    for (var i = 0; i < hrBtns.length; i++) {
      hrBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        if (!confirm('Confirm adding this amount to employee payroll? (تأكيد إضافة المبلغ لراتب الموظف؟)')) return;
        sbClient.from('medical_requests').update({ status: 'disbursed' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message); else { showToast('✅ Added to Payroll successfully', 'success'); loadData(); }
        });
      });
    }
  }
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    sbClient.from('medical_requests').select('*').order('created_at', { ascending: false }).then(function(res) {
      requests = res.data || [];
      render();
    });
  }
  
  loadData();
};

Pages.myMedical = function (el) {
  var requests = [];
  
  function render() {
    var html = '<div class="toolbar"><button class="btn btn-primary" id="btn-request-medical">➕ Submit Medical Receipt (تقديم طلب طبي)</button></div>';
    
    html += '<div class="card"><div class="card-header"><div><h3>My Medical Needs (احتياجاتي الطبية)</h3><p>Track your medical requests and reimbursements</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Date (التاريخ)</th><th>Description (البيان)</th><th>Reimbursed Amount (المبلغ)</th><th>Status (الحالة)</th><th>Rejection Reason (سبب الرفض)</th></tr></thead><tbody>';
    
    if (requests.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">You have no medical requests (لا توجد طلبات)</td></tr>';
    } else {
      requests.forEach(function(r) {
        var statusBadge = '';
        if (r.status === 'pending_nursing') statusBadge = '<span class="badge badge-warning">⏳ Pending Nursing (مراجعة التمريض)</span>';
        else if (r.status === 'pending_manager') statusBadge = '<span class="badge badge-warning">⏳ Pending Manager (مراجعة المدير)</span>';
        else if (r.status === 'pending_finance') statusBadge = '<span class="badge badge-info">⏳ Finance Processing (قيد المراجعة المالية)</span>';
        else if (r.status === 'pending_hr') statusBadge = '<span class="badge badge-primary">⏳ HR Processing (قيد الإضافة للراتب)</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">✅ Added to Payroll (تمت الإضافة للراتب)</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">❌ Rejected (مرفوض)</span>';
        
        // Map old statuses to new for display
        if (r.status === 'pending') statusBadge = '<span class="badge badge-warning">⏳ Pending Nursing (مراجعة التمريض)</span>';
        if (r.status === 'approved_by_owner') statusBadge = '<span class="badge badge-primary">⏳ HR Processing (قيد الإضافة للراتب)</span>';

        html += '<tr>';
        html += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        html += '<td>' + r.description + '</td>';
        html += '<td style="font-weight:bold">' + (r.amount > 0 ? ('EGP ' + r.amount.toLocaleString()) : '—') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td style="color:var(--accent-danger);font-size:0.85rem">' + (r.rejection_reason || '-') + '</td>';
        html += '</tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    document.getElementById('btn-request-medical').addEventListener('click', showRequestModal);
  }
  
  function showRequestModal() {
    var body = '<div class="form-field"><label>Description / Diagnosis (الوصف أو التشخيص) *</label><input type="text" id="req-desc" class="form-input" placeholder="e.g. Pharmacy receipt, Surgery..."></div>';
    body += '<div class="form-field"><label>Upload Document / Receipt (المرفق) *</label><input type="file" id="req-doc" class="form-input" accept="image/*,.pdf"></div>';
    body += '<p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px">Note: The request will go through Nursing ➔ Manager ➔ Finance ➔ HR.</p>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="btn-submit-req">Submit Request</button>';
    App.showModal('Medical Request', body, footer);
    
    document.getElementById('btn-submit-req').addEventListener('click', function() {
      var desc = document.getElementById('req-desc').value;
      var fileInput = document.getElementById('req-doc');
      
      if (!desc) return alert('Please provide a description.');
      if (!fileInput.files[0]) return alert('Please upload a document/receipt.');
      
      var file = fileInput.files[0];
      this.disabled = true;
      this.textContent = 'Uploading...';

      var submitRequest = function(url) {
        sbClient.from('medical_requests').insert({
          employee_id: App.user.id,
          employee_name: App.user.full_name,
          description: desc,
          document_url: url,
          status: 'pending_nursing' // Step 1: Nursing
        }).then(function(res) {
          if (res.error) alert(res.error.message);
          else {
            App.closeModal();
            showToast('✅ Medical request submitted successfully!', 'success');
            loadData();
          }
        });
      };

      var filePath = 'medical/' + App.user.id + '/' + Date.now() + '_' + file.name;
      sbClient.storage.from('documents').upload(filePath, file).then(function(uploadRes) {
        if (uploadRes.error) {
          alert('Error uploading file: ' + uploadRes.error.message);
          document.getElementById('btn-submit-req').disabled = false;
        } else {
          var publicUrl = sbClient.storage.from('documents').getPublicUrl(filePath).data.publicUrl;
          submitRequest(publicUrl);
        }
      });
    });
  }
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    sbClient.from('medical_requests').select('*').eq('employee_id', App.user.id).order('created_at', { ascending: false }).then(function(res) {
      requests = res.data || [];
      render();
    });
  }
  
  loadData();
};
