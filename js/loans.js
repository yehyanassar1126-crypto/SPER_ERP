window.Pages = window.Pages || {};

Pages.loans = function (el) {
  var loans = [];
  var employees = [];
  
  function render() {
    var html = '<div class="toolbar"><button class="btn btn-primary" id="btn-new-loan">' + icon('plus') + ' New Loan Record</button></div>';
    
    html += '<div class="card"><div class="card-header"><div><h3>All Loans</h3><p>Manage employee loans and advances</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Employee</th><th>Amount</th><th>Remaining</th><th>Installments</th><th>Monthly</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    if (loans.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No loans found</td></tr>';
    } else {
      loans.forEach(function(l) {
        var statusBadge = '';
        if (l.status === 'pending') statusBadge = '<span class="badge badge-warning">Pending</span>';
        else if (l.status === 'active') statusBadge = '<span class="badge badge-info">Active</span>';
        else if (l.status === 'completed') statusBadge = '<span class="badge badge-success">Completed</span>';
        else if (l.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
        
        html += '<tr>';
        html += '<td><div style="font-weight:600">' + (l.employee_name || 'Unknown') + '</div></td>';
        html += '<td>EGP ' + l.amount.toLocaleString() + '</td>';
        html += '<td>EGP ' + l.remaining_amount.toLocaleString() + '</td>';
        html += '<td>' + l.installments + ' months</td>';
        html += '<td>EGP ' + l.monthly_deduction.toLocaleString() + '</td>';
        html += '<td>' + statusBadge + '</td>';
        
        html += '<td><div style="display:flex;gap:4px">';
        if (l.status === 'pending') {
          html += '<button class="btn btn-xs btn-success btn-approve" data-id="' + l.id + '">Approve</button>';
          html += '<button class="btn btn-xs btn-danger btn-reject" data-id="' + l.id + '">Reject</button>';
        } else if (l.status === 'active') {
          var thisMonth = new Date().toISOString().substring(0, 7);
          var currentDeferred = l.deferred_months || [];
          if (currentDeferred.indexOf(thisMonth) !== -1) {
            html += '<span style="font-size:0.8rem;color:var(--accent-warning)">Paused for ' + thisMonth + '</span>';
          } else {
            html += '<button class="btn btn-xs btn-outline btn-defer" data-id="' + l.id + '" title="Defer Deduction for This Month">' + icon('calendarOff', 14) + ' Defer</button>';
          }
        }
        html += '</div></td>';
        html += '</tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    // Bind events
    var approveBtns = el.querySelectorAll('.btn-approve');
    for (var i = 0; i < approveBtns.length; i++) {
      approveBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        sbClient.from('loans').update({ status: 'active', approved_by: App.user.full_name }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message);
          else loadData();
        });
      });
    }
    
    var rejectBtns = el.querySelectorAll('.btn-reject');
    for (var i = 0; i < rejectBtns.length; i++) {
      rejectBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        sbClient.from('loans').update({ status: 'rejected' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message);
          else loadData();
        });
      });
    }

    var deferBtns = el.querySelectorAll('.btn-defer');
    for (var i = 0; i < deferBtns.length; i++) {
      deferBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var loan = loans.find(function(ll) { return ll.id === id; });
        var thisMonth = new Date().toISOString().substring(0, 7);
        
        var currentDeferred = loan.deferred_months || [];
        if (currentDeferred.indexOf(thisMonth) !== -1) {
          alert('Already deferred for this month (' + thisMonth + ')');
          return;
        }
        
        if (confirm('Are you sure you want to pause deduction for this month (' + thisMonth + ')?')) {
          currentDeferred.push(thisMonth);
          sbClient.from('loans').update({ deferred_months: currentDeferred }).eq('id', id).then(function(res) {
            if (res.error) alert(res.error.message);
            else {
              alert('Loan deduction postponed for ' + thisMonth);
              loadData();
            }
          });
        }
      });
    }
    
    document.getElementById('btn-new-loan').addEventListener('click', showAddModal);
  }
  
  function showAddModal() {
    var body = '<div class="form-field"><label>Employee</label><select id="loan-emp" class="form-input">';
    employees.forEach(function(e) { body += '<option value="' + e.id + '" data-name="' + e.full_name + '">' + e.full_name + '</option>'; });
    body += '</select></div>';
    
    body += '<div class="form-row">';
    body += '<div class="form-field"><label>Amount (EGP)</label><input type="number" id="loan-amount" class="form-input" placeholder="0"></div>';
    body += '<div class="form-field"><label>Months (Installments)</label><input type="number" id="loan-months" class="form-input" placeholder="0"></div>';
    body += '</div>';
    
    body += '<div class="form-field"><label>Reason</label><input type="text" id="loan-reason" class="form-input" placeholder="Optional"></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="btn-save-loan">Add Loan</button>';
    
    App.showModal('New Loan', body, footer);
    
    document.getElementById('btn-save-loan').addEventListener('click', function() {
      var sel = document.getElementById('loan-emp');
      var empId = sel.value;
      var empName = sel.options[sel.selectedIndex].getAttribute('data-name');
      var amt = parseFloat(document.getElementById('loan-amount').value);
      var months = parseInt(document.getElementById('loan-months').value);
      var reason = document.getElementById('loan-reason').value;
      
      if (!empId || isNaN(amt) || isNaN(months) || amt <= 0 || months <= 0) {
        alert('Please fill all required fields correctly');
        return;
      }
      
      var monthly = amt / months;
      
      sbClient.from('loans').insert({
        employee_id: empId,
        employee_name: empName,
        amount: amt,
        installments: months,
        monthly_deduction: monthly,
        remaining_amount: amt,
        status: 'active',
        approved_by: App.user.full_name,
        reason: reason
      }).then(function(res) {
        if (res.error) alert(res.error.message);
        else {
          App.closeModal();
          loadData();
        }
      });
    });
  }
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    Promise.all([
      sbClient.from('loans').select('*').order('created_at', { ascending: false }),
      sbClient.from('users').select('id, full_name').eq('status', 'active')
    ]).then(function(results) {
      loans = results[0].data || [];
      employees = results[1].data || [];
      render();
    });
  }
  
  loadData();
};

Pages.myLoans = function (el) {
  var loans = [];
  
  function render() {
    var html = '<div class="toolbar"><button class="btn btn-primary" id="btn-request-loan">' + icon('plus') + ' Request Loan</button></div>';
    
    html += '<div class="card"><div class="card-header"><div><h3>My Loans</h3><p>Track your active and past loans</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Date</th><th>Amount</th><th>Remaining</th><th>Monthly</th><th>Status</th></tr></thead><tbody>';
    
    if (loans.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px">You have no loans</td></tr>';
    } else {
      loans.forEach(function(l) {
        var statusBadge = '';
        if (l.status === 'pending') statusBadge = '<span class="badge badge-warning">Pending</span>';
        else if (l.status === 'active') statusBadge = '<span class="badge badge-info">Active</span>';
        else if (l.status === 'completed') statusBadge = '<span class="badge badge-success">Completed</span>';
        else if (l.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
        
        html += '<tr>';
        html += '<td>' + new Date(l.created_at).toLocaleDateString() + '</td>';
        html += '<td>EGP ' + l.amount.toLocaleString() + '</td>';
        html += '<td>EGP ' + l.remaining_amount.toLocaleString() + '</td>';
        html += '<td>EGP ' + l.monthly_deduction.toLocaleString() + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '</tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    document.getElementById('btn-request-loan').addEventListener('click', showRequestModal);
  }
  
  function showRequestModal() {
    var body = '<div class="form-row">';
    body += '<div class="form-field"><label>Amount (EGP)</label><input type="number" id="req-amount" class="form-input" placeholder="0"></div>';
    body += '<div class="form-field"><label>Preferred Installments (Months)</label><input type="number" id="req-months" class="form-input" placeholder="0"></div>';
    body += '</div>';
    body += '<div class="form-field"><label>Reason / Note</label><textarea id="req-reason" class="form-input" rows="3"></textarea></div>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="btn-submit-req">Submit Request</button>';
    App.showModal('Request Loan', body, footer);
    
    document.getElementById('btn-submit-req').addEventListener('click', function() {
      var amt = parseFloat(document.getElementById('req-amount').value);
      var months = parseInt(document.getElementById('req-months').value);
      var reason = document.getElementById('req-reason').value;
      
      if (isNaN(amt) || isNaN(months) || amt <= 0 || months <= 0) {
        alert('Please provide valid amount and months');
        return;
      }
      
      var monthly = amt / months;
      
      sbClient.from('loans').insert({
        employee_id: App.user.id,
        employee_name: App.user.full_name,
        amount: amt,
        installments: months,
        monthly_deduction: monthly,
        remaining_amount: amt,
        status: 'pending',
        reason: reason
      }).then(function(res) {
        if (res.error) alert(res.error.message);
        else {
          App.closeModal();
          alert('Loan request submitted successfully!');
          loadData();
        }
      });
    });
  }
  
  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    sbClient.from('loans').select('*').eq('employee_id', App.user.id).order('created_at', { ascending: false }).then(function(res) {
      loans = res.data || [];
      render();
    });
  }
  
  loadData();
};
