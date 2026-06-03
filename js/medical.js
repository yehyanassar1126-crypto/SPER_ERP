window.Pages = window.Pages || {};

Pages.medicalRequests = function (el) {
  var requests = [];
  
  function render() {
    var canApprove = App.user.role === 'owner' || App.user.role === 'hr manager';
    var canDisburse = App.user.role === 'hr' || App.user.role === 'hr manager' || App.user.role === 'owner';

    var html = '<div class="card"><div class="card-header"><div><h3>Medical Needs</h3><p>Manage employee medical requests</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Employee</th><th>Date</th><th>Description</th><th>Document</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    if (requests.length === 0) {
      html += '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:30px">No medical requests</td></tr>';
    } else {
      requests.forEach(function(r) {
        var statusBadge = '';
        if (r.status === 'pending') statusBadge = '<span class="badge badge-warning">Awaiting Owner Approval</span>';
        else if (r.status === 'approved_by_owner') statusBadge = '<span class="badge badge-info">Awaiting HR Disbursement</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">Disbursed</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
        
        var docLink = r.document_url ? '<a href="' + r.document_url + '" target="_blank" class="btn btn-xs btn-outline">View</a>' : 'No doc';

        html += '<tr>';
        html += '<td><div style="font-weight:600">' + (r.employee_name || 'Unknown') + '</div></td>';
        html += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        html += '<td>' + r.description + '</td>';
        html += '<td>' + docLink + '</td>';
        html += '<td>' + (r.amount > 0 ? 'EGP ' + r.amount.toLocaleString() : '—') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        
        html += '<td><div style="display:flex;gap:4px">';
        if (r.status === 'pending' && canApprove) {
          html += '<button class="btn btn-xs btn-success btn-approve" data-id="' + r.id + '">Approve</button>';
          html += '<button class="btn btn-xs btn-danger btn-reject" data-id="' + r.id + '">Reject</button>';
        } else if (r.status === 'approved_by_owner' && canDisburse) {
          html += '<button class="btn btn-xs btn-primary btn-disburse" data-id="' + r.id + '">Add Amount</button>';
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
        sbClient.from('medical_requests').update({ status: 'approved_by_owner' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message);
          else loadData();
        });
      });
    }
    
    var rejectBtns = el.querySelectorAll('.btn-reject');
    for (var i = 0; i < rejectBtns.length; i++) {
      rejectBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        sbClient.from('medical_requests').update({ status: 'rejected' }).eq('id', id).then(function(res) {
          if (res.error) alert(res.error.message);
          else loadData();
        });
      });
    }

    var disburseBtns = el.querySelectorAll('.btn-disburse');
    for (var i = 0; i < disburseBtns.length; i++) {
      disburseBtns[i].addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var amount = prompt("Enter the amount to disburse (EGP) on their salary:");
        if (amount && !isNaN(parseFloat(amount))) {
          sbClient.from('medical_requests').update({ status: 'disbursed', amount: parseFloat(amount) }).eq('id', id).then(function(res) {
            if (res.error) alert(res.error.message);
            else {
              alert('Amount added successfully. It will be added to the next payroll.');
              loadData();
            }
          });
        }
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
    var html = '<div class="toolbar"><button class="btn btn-primary" id="btn-request-medical">' + icon('plus') + ' Submit Medical Receipt</button></div>';
    
    html += '<div class="card"><div class="card-header"><div><h3>My Medical Needs</h3><p>Track your medical requests and reimbursements</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    html += '<thead><tr><th>Date</th><th>Description</th><th>Reimbursed Amount</th><th>Status</th></tr></thead><tbody>';
    
    if (requests.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px">You have no medical requests</td></tr>';
    } else {
      requests.forEach(function(r) {
        var statusBadge = '';
        if (r.status === 'pending') statusBadge = '<span class="badge badge-warning">Under Review</span>';
        else if (r.status === 'approved_by_owner') statusBadge = '<span class="badge badge-info">Approved - Pending Payment</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">Disbursed to Salary</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">Rejected</span>';
        
        html += '<tr>';
        html += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        html += '<td>' + r.description + '</td>';
        html += '<td>' + (r.amount > 0 ? ('EGP ' + r.amount.toLocaleString()) : '—') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '</tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    document.getElementById('btn-request-medical').addEventListener('click', showRequestModal);
  }
  
  function showRequestModal() {
    var body = '<div class="form-field"><label>Description (What is this for?)</label><input type="text" id="req-desc" class="form-input" placeholder="e.g. Pharmacy receipt, Surgery..."></div>';
    body += '<div class="form-field"><label>Upload Document / Receipt</label><input type="file" id="req-doc" class="form-input" accept="image/*,.pdf"></div>';
    body += '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">Note: The amount will be determined by HR after Owner approval.</p>';
    
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="btn-submit-req">Submit Request</button>';
    App.showModal('Medical Request', body, footer);
    
    document.getElementById('btn-submit-req').addEventListener('click', function() {
      var desc = document.getElementById('req-desc').value;
      var fileInput = document.getElementById('req-doc');
      
      if (!desc) {
        alert('Please provide a description.');
        return;
      }
      
      var file = fileInput.files[0];
      var submitRequest = function(url) {
        sbClient.from('medical_requests').insert({
          employee_id: App.user.id,
          employee_name: App.user.full_name,
          description: desc,
          document_url: url,
          status: 'pending'
        }).then(function(res) {
          if (res.error) alert(res.error.message);
          else {
            App.closeModal();
            alert('Medical request submitted successfully!');
            loadData();
          }
        });
      };

      if (file) {
        var filePath = 'medical/' + App.user.id + '/' + Date.now() + '_' + file.name;
        sbClient.storage.from('documents').upload(filePath, file).then(function(uploadRes) {
          if (uploadRes.error) {
            alert('Error uploading file: ' + uploadRes.error.message);
            submitRequest(null);
          } else {
            var publicUrl = sbClient.storage.from('documents').getPublicUrl(filePath).data.publicUrl;
            submitRequest(publicUrl);
          }
        });
      } else {
        submitRequest(null);
      }
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
