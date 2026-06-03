/* ===== EXTENDED HR MODULES ===== */
// Contains Recruitment, Documents, Performance, and Uniforms modules

window.Pages = window.Pages || {};

// ----- RECRUITMENT (ATS) -----
Pages.recruitment = function (el) {
  var jobs = [];
  var applicants = [];
  
  function render() {
    var html = '<div class="toolbar">';
    html += '<button class="btn btn-primary" id="add-job-btn">' + icon('plus') + ' Post New Job</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>🎯 Smart Recruitment & ATS</h3><p>Manage job postings and applicants</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Job Title</th><th>Department</th><th>Status</th><th>Applicants</th><th>Actions</th></tr></thead><tbody>';
    
    if (jobs.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No jobs posted yet. (Supabase tables "recruitment_jobs" might be empty or missing).</td></tr>';
    } else {
      jobs.forEach(function (j) {
        var appCount = applicants.filter(function(a) { return a.job_id === j.id; }).length;
        html += '<tr><td style="font-weight:600">' + j.title + '</td><td>' + j.department + '</td>';
        html += '<td><span class="badge ' + (j.status === 'open' ? 'badge-success' : 'badge-danger') + '">' + j.status + '</span></td>';
        html += '<td>' + appCount + ' candidates</td>';
        html += '<td><button class="btn btn-xs btn-outline">View Candidates</button></td></tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var addBtn = document.getElementById('add-job-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var modalBody = '<div class="form-group"><label class="form-label">Job Title *</label><input type="text" id="job-title" class="form-input" placeholder="e.g. Senior Accountant"></div>' +
          '<div class="form-group"><label class="form-label">Department *</label><select id="job-dept" class="form-input">';
        if (typeof DEPARTMENTS !== 'undefined') {
          DEPARTMENTS.forEach(function(d) { modalBody += '<option value="' + d + '">' + d + '</option>'; });
        } else {
          modalBody += '<option value="IT">IT</option><option value="HR">HR</option><option value="Production">Production</option><option value="Engineering">Engineering</option>';
        }
        modalBody += '</select></div>' +
          '<div class="form-group"><label class="form-label">Status</label><select id="job-status" class="form-input"><option value="open">Open (Accepting Applications)</option><option value="closed">Closed</option></select></div>';
        
        var modalFooter = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-job-btn">Post Job</button>';
        
        App.showModal('Post New Job', modalBody, modalFooter);
        
        document.getElementById('save-job-btn').addEventListener('click', function() {
          var title = document.getElementById('job-title').value.trim();
          var dept = document.getElementById('job-dept').value;
          var status = document.getElementById('job-status').value;
          
          if (!title) { alert('Please enter the job title.'); return; }
          
          var newJob = {
            title: title,
            department: dept,
            status: status
          };
          
          sbClient.from('recruitment_jobs').insert([newJob]).select().then(function(res) {
            if (res.error) {
              alert('Error posting job: ' + res.error.message);
            } else {
              jobs.unshift(res.data[0]);
              App.closeModal();
              render();
            }
          });
        });
      });
    }
  }

  // Fetch from DB or mock if table missing
  Promise.all([
    sbClient.from('recruitment_jobs').select('*'),
    sbClient.from('recruitment_applicants').select('*')
  ]).then(function (results) {
    if (results[0].error && results[0].error.code === '42P01') {
      // Table doesn\'t exist, use mock data
      jobs = [{id: '1', title: 'Senior Developer', department: 'IT', status: 'open'}, {id: '2', title: 'HR Specialist', department: 'HR', status: 'closed'}];
      applicants = [];
    } else {
      jobs = results[0].data || [];
      applicants = results[1].data || [];
    }
    render();
  });
  
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Recruitment ATS...</div>';
};

// ----- DOCUMENTS MANAGEMENT -----
Pages.documents = function (el) {
  var documents = [];
  var employees = [];
  
  function render() {
    var html = '<div class="toolbar">';
    html += '<button class="btn btn-primary" id="upload-doc-btn">' + icon('plus') + ' Upload Document</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>📄 Document Management</h3><p>Track employee IDs, contracts, and expiries</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Document Type</th><th>Expiry Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    if (documents.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No documents uploaded yet.</td></tr>';
    } else {
      documents.forEach(function (d) {
        var emp = employees.find(function(e) { return e.id === d.employee_id; });
        var isExpired = new Date(d.expiry_date) < new Date();
        html += '<tr><td style="font-weight:600">' + (emp ? emp.full_name : 'Unknown') + '</td>';
        html += '<td>' + d.doc_type + '</td>';
        html += '<td>' + d.expiry_date + '</td>';
        html += '<td><span class="badge ' + (isExpired ? 'badge-danger' : 'badge-success') + '">' + (isExpired ? 'Expired' : 'Valid') + '</span></td>';
        html += '<td><button class="btn btn-xs btn-outline">View File</button></td></tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var uploadBtn = document.getElementById('upload-doc-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function() {
        var modalBody = '<div class="form-group"><label class="form-label">Employee *</label><select id="doc-emp" class="form-input">';
        if (employees.length === 0) {
          modalBody += '<option value="">No employees found</option>';
        } else {
          employees.forEach(function(e) { modalBody += '<option value="' + e.id + '">' + e.full_name + '</option>'; });
        }
        modalBody += '</select></div>' +
          '<div class="form-group"><label class="form-label">Document Type *</label><select id="doc-type" class="form-input"><option value="National ID">National ID</option><option value="Contract">Contract</option><option value="Health Certificate">Health Certificate</option><option value="Military Certificate">Military Certificate</option></select></div>' +
          '<div class="form-group"><label class="form-label">Expiry Date *</label><input type="date" id="doc-expiry" class="form-input" required></div>';
        
        var modalFooter = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-doc-btn">Save Document Info</button>';
        
        App.showModal('Upload Document', modalBody, modalFooter);
        
        document.getElementById('save-doc-btn').addEventListener('click', function() {
          var empId = document.getElementById('doc-emp').value;
          var type = document.getElementById('doc-type').value;
          var expiry = document.getElementById('doc-expiry').value;
          
          if (!empId || !type || !expiry) { alert('Please fill in all fields.'); return; }
          
          var newDoc = {
            employee_id: empId,
            doc_type: type,
            expiry_date: expiry
          };
          
          sbClient.from('employee_documents').insert([newDoc]).select().then(function(res) {
            if (res.error) {
              alert('Error uploading document: ' + res.error.message);
            } else {
              documents.unshift(res.data[0]);
              App.closeModal();
              render();
            }
          });
        });
      });
    }
  }

  Promise.all([
    sbClient.from('employee_documents').select('*'),
    sbClient.from('users').select('id, full_name')
  ]).then(function (results) {
    if (results[0].error && results[0].error.code === '42P01') {
      documents = [{employee_id: 'mock', doc_type: 'National ID', expiry_date: '2024-01-01'}, {employee_id: 'mock', doc_type: 'Contract', expiry_date: '2027-01-01'}];
      employees = [{id: 'mock', full_name: 'Demo Employee'}];
    } else {
      documents = results[0].data || [];
      employees = results[1].data || [];
    }
    render();
  });
  
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Documents...</div>';
};

// ----- PERFORMANCE APPRAISALS -----
Pages.performance = function (el) {
  var reviews = [];
  
  function render() {
    var html = '<div class="toolbar">';
    html += '<button class="btn btn-primary" id="add-review-btn">' + icon('plus') + ' New Review</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>📈 Performance & OKRs</h3><p>Manage employee goals and appraisals</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Rating</th><th>Goals Met</th><th>Actions</th></tr></thead><tbody>';
    
    if (reviews.length === 0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No performance reviews found.</td></tr>';
    } else {
      reviews.forEach(function (r) {
        html += '<tr><td style="font-weight:600">' + (r.employee_name || 'Emp') + '</td>';
        html += '<td>' + r.period + '</td>';
        html += '<td>' + '⭐'.repeat(r.rating) + ' (' + r.rating + '/5)</td>';
        html += '<td><span class="badge ' + (r.goals_met ? 'badge-success' : 'badge-danger') + '">' + (r.goals_met ? 'Yes' : 'No') + '</span></td>';
        html += '<td><button class="btn btn-xs btn-outline">Details</button></td></tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var addBtn = document.getElementById('add-review-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        var modalBody = '<div class="form-group"><label class="form-label">Employee Name *</label><input type="text" id="rev-emp" class="form-input" placeholder="e.g. Ahmed Ali"></div>' +
          '<div class="form-group"><label class="form-label">Review Period *</label><input type="text" id="rev-period" class="form-input" placeholder="e.g. Q1 2026"></div>' +
          '<div class="form-group"><label class="form-label">Rating</label><select id="rev-rating" class="form-input"><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3" selected>3 - Average</option><option value="2">2 - Needs Improvement</option><option value="1">1 - Poor</option></select></div>' +
          '<div class="form-group" style="margin-top:10px;"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="rev-goals" style="width:16px;height:16px;" checked> <span>Employee met their goals for this period</span></label></div>';
        
        var modalFooter = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-rev-btn">Save Review</button>';
        
        App.showModal('Add Performance Review', modalBody, modalFooter);
        
        document.getElementById('save-rev-btn').addEventListener('click', function() {
          var emp = document.getElementById('rev-emp').value.trim();
          var period = document.getElementById('rev-period').value.trim();
          var rating = parseInt(document.getElementById('rev-rating').value);
          var goals = document.getElementById('rev-goals').checked;
          
          if (!emp || !period) { alert('Please enter the employee name and period.'); return; }
          
          var newReview = {
            employee_name: emp,
            period: period,
            rating: rating,
            goals_met: goals
          };
          
          sbClient.from('performance_reviews').insert([newReview]).select().then(function(res) {
            if (res.error) {
              alert('Error saving review: ' + res.error.message);
            } else {
              reviews.unshift(res.data[0]);
              App.closeModal();
              render();
            }
          });
        });
      });
    }
  }

  sbClient.from('performance_reviews').select('*').then(function (r) {
    if (r.error && r.error.code === '42P01') {
      reviews = [{employee_name: 'John Doe', period: 'Q1 2026', rating: 4, goals_met: true}];
    } else {
      reviews = r.data || [];
    }
    render();
  });
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Performance...</div>';
};

// ----- UNIFORMS (ASSETS) -----
Pages.uniforms = function (el) {
  var uniforms = [];
  
  function render() {
    var html = '<div class="toolbar">';
    html += '<button class="btn btn-primary" id="btn-issue-uniform">' + icon('plus') + ' Issue Uniform</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>👕 Uniform Management</h3><p>Track employee uniforms, sizes, and issuance dates</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Uniform Type</th><th>Size</th><th>Issued Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    
    if (uniforms.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No uniforms issued yet.</td></tr>';
    } else {
      uniforms.forEach(function (u, index) {
        html += '<tr><td style="font-weight:600">' + u.employee_name + '</td>';
        html += '<td>' + u.uniform_type + '</td>';
        html += '<td>' + u.size + '</td>';
        html += '<td>' + u.issued_date + '</td>';
        html += '<td><span class="badge ' + (u.status === 'Active' ? 'badge-success' : 'badge-warning') + '">' + u.status + '</span></td>';
        html += '<td><button class="btn btn-xs btn-outline btn-return-uni" data-id="' + (u.id || index) + '" data-status="' + u.status + '">Toggle Status</button></td></tr>';
      });
    }
    
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
    
    // Add event listeners for Return/Replace
    document.querySelectorAll('.btn-return-uni').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-id');
        var currentStatus = this.getAttribute('data-status');
        var newStatus = currentStatus === 'Active' ? 'Returned' : 'Active';
        
        // If it's a mock entry without a real Supabase UUID, just update locally
        if (typeof id === 'string' && id.length < 10) {
          uniforms[parseInt(id)].status = newStatus;
          render();
          return;
        }

        // Update in Supabase
        sbClient.from('employee_uniforms').update({ status: newStatus }).eq('id', id).then(function(res) {
          if (res.error) {
             alert('Error updating status: ' + res.error.message);
          } else {
             var uIndex = uniforms.findIndex(function(u) { return u.id == id; });
             if (uIndex > -1) uniforms[uIndex].status = newStatus;
             render();
          }
        });
      });
    });
    
    var btn = document.getElementById('btn-issue-uniform');
    if (btn) {
      btn.addEventListener('click', function() {
        var modalBody = '<form id="form-issue-uniform">' +
          '<div class="form-group"><label class="form-label">Employee Name</label><input type="text" id="uni-emp" class="form-input" required></div>' +
          '<div class="form-group"><label class="form-label">Uniform Type</label><select id="uni-type" class="form-input"><option>Summer Polo</option><option>Winter Jacket</option><option>Safety Shoes</option><option>Overall</option></select></div>' +
          '<div class="form-group"><label class="form-label">Size</label><select id="uni-size" class="form-input"><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select></div>' +
          '</form>';
        var modalFooter = '<button class="btn btn-outline" id="btn-uni-cancel">Cancel</button><button class="btn btn-primary" id="btn-uni-save">Save & Issue</button>';
        
        App.showModal('Issue New Uniform', modalBody, modalFooter);
        
        document.getElementById('btn-uni-cancel').addEventListener('click', App.closeModal);
        document.getElementById('btn-uni-save').addEventListener('click', function() {
          var emp = document.getElementById('uni-emp').value;
          var type = document.getElementById('uni-type').value;
          var size = document.getElementById('uni-size').value;
          if (!emp) return alert('Please enter employee name');
          
          var newUniform = {
            employee_name: emp,
            uniform_type: type,
            size: size,
            issued_date: new Date().toISOString().split('T')[0],
            status: 'Active'
          };
          
          // Insert into Supabase
          sbClient.from('employee_uniforms').insert([newUniform]).then(function(res) {
            if (res.error) {
              console.error("Supabase Error:", res.error);
              alert("DB Error: " + res.error.message);
            } else {
              uniforms.unshift(newUniform);
              App.closeModal();
              render();
            }
          });
        });
      });
    }
  }

  sbClient.from('employee_uniforms').select('*').then(function (r) {
    if (r.error && r.error.code === '42P01') {
      uniforms = [
        {employee_name: 'Ahmed Ali', uniform_type: 'Summer Polo', size: 'L', issued_date: '2026-05-01', status: 'Active'},
        {employee_name: 'Mona Sayed', uniform_type: 'Winter Jacket', size: 'M', issued_date: '2025-11-01', status: 'Active'}
      ];
    } else {
      uniforms = r.data || [];
    }
    render();
  });
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Uniforms...</div>';
};
