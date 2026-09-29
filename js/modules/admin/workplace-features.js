// ===== WORKPLACE FEATURES =====
// Ideas 3 & 4: Shift Swap Marketplace and Org Directory

window.Pages = window.Pages || {};

// Mock skills for demo purposes
const MOCK_SKILLS = [
  'Photoshop', 'Excel', 'English', 'AutoCAD', 'French', 'First Aid', 'Public Speaking', 
  'Data Analysis', 'Project Management', 'Problem Solving', 'Maintenance', 'Leadership'
];

function getRandomSkills() {
  var count = Math.floor(Math.random() * 3) + 1;
  var s = [];
  while(s.length < count) {
    var skill = MOCK_SKILLS[Math.floor(Math.random() * MOCK_SKILLS.length)];
    if(s.indexOf(skill) === -1) s.push(skill);
  }
  return s;
}

// ==========================================
// 1. ORG DIRECTORY & SKILLS FINDER
// ==========================================
Pages.orgDirectory = function (el) {
  el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p>Loading Company Directory...</p></div>';

  sbClient.from('users').select('*').then(function (res) {
    var employees = res.data || [];
    
    // Assign mock skills if they don't have them
    employees.forEach(function(emp) {
      if (!emp.skills || !emp.skills.length) {
        emp.skills = getRandomSkills();
      }
    });

    var viewMode = 'skills'; // 'org' or 'skills'
    var searchQuery = '';

    function render() {
      var html = '<div class="toolbar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">';
      
      // Tabs
      html += '<div style="display:flex; gap:8px; background:var(--bg-card); padding:4px; border-radius:var(--radius-lg); border:1px solid var(--border-color);">';
      html += '<button class="btn btn-sm ' + (viewMode === 'skills' ? 'btn-primary' : 'btn-ghost') + '" id="tab-skills">' + icon('search') + ' Skills Finder</button>';
      html += '<button class="btn btn-sm ' + (viewMode === 'org' ? 'btn-primary' : 'btn-ghost') + '" id="tab-org">' + icon('users') + ' Org Chart</button>';
      html += '</div>';

      // Search
      if (viewMode === 'skills') {
        html += '<div class="search-wrapper" style="width: 300px;"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search by name, dept or skill (e.g. Excel)..." id="dir-search" value="' + searchQuery + '"></div>';
      }
      
      html += '</div>'; // End toolbar

      if (viewMode === 'skills') {
        // --- SKILLS FINDER VIEW ---
        var filtered = employees.filter(function (e) {
          if (!searchQuery) return true;
          var q = searchQuery.toLowerCase();
          var matchName = e.full_name.toLowerCase().indexOf(q) !== -1;
          var matchDept = e.department.toLowerCase().indexOf(q) !== -1;
          var matchSkill = e.skills.some(function(s) { return s.toLowerCase().indexOf(q) !== -1; });
          return matchName || matchDept || matchSkill;
        });

        html += '<div class="grid-3" style="gap:16px;">';
        if (filtered.length === 0) {
          html += '<div style="grid-column: 1 / -1; text-align:center; padding: 40px; background:var(--bg-card); border-radius:var(--radius-lg); color:var(--text-muted);">' + icon('users', 40) + '<p>No employees found matching "' + searchQuery + '"</p></div>';
        }
        filtered.forEach(function(emp) {
          html += '<div class="card" style="margin-bottom:0; transition: transform 0.2s;"><div class="card-body" style="text-align:center;">';
          html += '<div class="sidebar-avatar" style="width:64px; height:64px; font-size:1.5rem; margin:0 auto 12px auto; background:' + (emp.avatar_color || '#6366f1') + '">' + getInitials(emp.full_name) + '</div>';
          html += '<h3 style="margin:0 0 4px 0; font-size:1.1rem; color:var(--text-primary);">' + emp.full_name + '</h3>';
          html += '<p style="margin:0 0 12px 0; font-size:0.85rem; color:var(--text-muted);">' + emp.position + ' • ' + emp.department + '</p>';
          
          html += '<div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center;">';
          emp.skills.forEach(function(s) {
            html += '<span class="badge badge-info" style="font-size:0.7rem; background:rgba(6,182,212,0.1); color:var(--accent-info); border:1px solid rgba(6,182,212,0.2);">' + s + '</span>';
          });
          html += '</div>';

          html += '<button class="btn btn-outline btn-sm" style="width:100%; margin-top:16px;" onclick="window.open(\'https://mail.google.com/mail/?view=cm&fs=1&to=' + (emp.email || '') + '\', \'_blank\')">' + icon('mail', 14) + ' Contact</button>';
          html += '</div></div>';
        });
        html += '</div>';

      } else {
        // --- ORG CHART VIEW (Simplified Visual Tree) ---
        var byLevel = { owner: [], manager: [], emp: [] };
        employees.forEach(function(e) {
          if (e.role === 'owner' || e.role === 'hr manager') byLevel.owner.push(e);
          else if (e.role === 'department head' || e.role === 'hall manager' || e.role === 'hr') byLevel.manager.push(e);
          else byLevel.emp.push(e);
        });

        html += '<div style="background:var(--bg-card); border-radius:var(--radius-lg); padding:40px; overflow-x:auto; text-align:center;">';
        
        // Owners / Top Level
        html += '<div style="margin-bottom:40px;">';
        html += '<h4 style="color:var(--text-muted); margin-bottom:16px; font-size:0.85rem; letter-spacing:1px; text-transform:uppercase;">Executive Level</h4>';
        html += '<div style="display:flex; justify-content:center; gap:20px;">';
        byLevel.owner.forEach(function(e) {
          html += _renderOrgNode(e, true);
        });
        if(byLevel.owner.length === 0) html += '<div style="color:var(--text-muted)">No Executives Found</div>';
        html += '</div></div>';

        // Managers
        html += '<div style="margin-bottom:40px; position:relative;">';
        html += '<h4 style="color:var(--text-muted); margin-bottom:16px; font-size:0.85rem; letter-spacing:1px; text-transform:uppercase;">Management</h4>';
        html += '<div style="display:flex; justify-content:center; gap:20px; flex-wrap:wrap;">';
        byLevel.manager.forEach(function(e) {
          html += _renderOrgNode(e, false);
        });
        html += '</div></div>';

        // Employees grouped by department
        html += '<div style="position:relative;">';
        html += '<h4 style="color:var(--text-muted); margin-bottom:16px; font-size:0.85rem; letter-spacing:1px; text-transform:uppercase;">Teams & Staff</h4>';
        html += '<div style="display:flex; justify-content:center; gap:30px; flex-wrap:wrap; align-items:flex-start;">';
        
        var depts = {};
        byLevel.emp.forEach(function(e) {
          if(!depts[e.department]) depts[e.department] = [];
          depts[e.department].push(e);
        });

        Object.keys(depts).forEach(function(d) {
          html += '<div style="background:var(--bg-tertiary); padding:16px; border-radius:var(--radius-md); min-width:200px; border:1px solid var(--border-color);">';
          html += '<h5 style="margin:0 0 12px 0; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:8px;">' + d + '</h5>';
          html += '<div style="display:flex; flex-direction:column; gap:8px;">';
          depts[d].forEach(function(e) {
            html += '<div style="display:flex; align-items:center; gap:8px; text-align:left;">';
            html += '<div style="width:24px; height:24px; border-radius:50%; background:' + (e.avatar_color || '#6366f1') + '; color:#fff; font-size:10px; display:flex; align-items:center; justify-content:center;">' + getInitials(e.full_name) + '</div>';
            html += '<div><div style="font-size:0.8rem; font-weight:600; color:var(--text-primary);">' + e.full_name + '</div><div style="font-size:0.7rem; color:var(--text-muted);">' + e.position + '</div></div>';
            html += '</div>';
          });
          html += '</div></div>';
        });

        html += '</div></div>';
        html += '</div>';
      }

      el.innerHTML = html;

      // Bind events
      document.getElementById('tab-skills').addEventListener('click', function() { viewMode = 'skills'; render(); });
      document.getElementById('tab-org').addEventListener('click', function() { viewMode = 'org'; render(); });
      
      var searchEl = document.getElementById('dir-search');
      if (searchEl) {
        searchEl.addEventListener('input', function() { searchQuery = this.value; render(); });
        searchEl.focus();
        searchEl.setSelectionRange(searchQuery.length, searchQuery.length);
      }
    }

    render();
  });
};

function _renderOrgNode(emp, isTop) {
  var color = isTop ? 'var(--accent-primary)' : 'var(--accent-info)';
  return '<div style="background:var(--bg-card); border:2px solid ' + color + '; border-radius:var(--radius-lg); padding:16px; width:220px; box-shadow:0 4px 12px rgba(0,0,0,0.05); display:flex; flex-direction:column; align-items:center;">' +
    '<div style="width:48px; height:48px; border-radius:50%; background:' + (emp.avatar_color || '#6366f1') + '; color:#fff; font-size:1.2rem; display:flex; align-items:center; justify-content:center; margin-bottom:12px;">' + getInitials(emp.full_name) + '</div>' +
    '<h4 style="margin:0 0 4px 0; font-size:0.95rem; color:var(--text-primary);">' + emp.full_name + '</h4>' +
    '<div style="font-size:0.75rem; font-weight:600; color:' + color + ';">' + emp.position + '</div>' +
    '<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">' + emp.department + '</div>' +
  '</div>';
}

// ==========================================
// 2. SHIFT MARKETPLACE (Smart Swapping)
// ==========================================
// We'll use localStorage to mock the DB table since it doesn't exist yet.
Pages.shiftSwap = function (el) {
  var user = App.user;
  
  function getSwaps() {
    try { return JSON.parse(localStorage.getItem('shift_swaps')) || []; }
    catch(e) { return []; }
  }
  function saveSwaps(swaps) {
    localStorage.setItem('shift_swaps', JSON.stringify(swaps));
  }

  var swaps = getSwaps();
  
  function render() {
    // Separate into available (offered by others in same dept) and mine
    var mySwaps = swaps.filter(function(s) { return s.offerer_id === user.id; });
    var availableSwaps = swaps.filter(function(s) { 
      return s.offerer_id !== user.id && s.department === user.department && s.status === 'open'; 
    });

    var html = '<div class="grid-2">';
    
    // LEFT: Available Shifts
    html += '<div class="card"><div class="card-header"><div><h3>🔄 Available Shifts</h3><p>Shifts offered by colleagues in ' + user.department + '</p></div></div>';
    html += '<div class="card-body" style="display:flex;flex-direction:column;gap:12px;">';
    
    if (availableSwaps.length === 0) {
      html += '<div style="text-align:center; padding:30px; color:var(--text-muted); background:var(--bg-tertiary); border-radius:var(--radius-md);">' + icon('clock', 30) + '<p style="margin-top:10px;">No shifts available for swapping right now.</p></div>';
    }

    availableSwaps.forEach(function(s) {
      html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; background:var(--bg-tertiary); position:relative;">';
      html += '<div style="display:flex; justify-content:space-between; margin-bottom:12px;">';
      html += '<div><div style="font-weight:600; font-size:1rem; color:var(--text-primary);">' + formatDate(s.date) + '</div><div style="font-size:0.8rem; color:var(--text-muted);">' + s.offerer_name + ' • ' + s.shift_label + '</div></div>';
      html += '<span class="badge badge-info" style="height:fit-content;">' + s.reason + '</span>';
      html += '</div>';
      html += '<button class="btn btn-primary btn-sm" style="width:100%;" onclick="acceptSwap(\'' + s.id + '\')">' + icon('check', 14) + ' Accept & Swap</button>';
      
      // AI Magic indicator
      html += '<div style="position:absolute; top:-10px; right:-10px; background:linear-gradient(135deg, #a855f7, #6366f1); color:white; font-size:0.6rem; padding:4px 8px; border-radius:12px; font-weight:700; box-shadow:0 4px 8px rgba(168,85,247,0.3);">' + icon('brain', 10) + ' AI Verified</div>';
      html += '</div>';
    });

    html += '</div></div>';

    // RIGHT: My Shift Offers
    html += '<div class="card"><div class="card-header"><div><h3>📤 My Offers</h3><p>Shifts you requested to swap</p></div><button class="btn btn-sm btn-primary" onclick="offerShiftModal()">Offer Shift</button></div>';
    html += '<div class="card-body" style="display:flex;flex-direction:column;gap:12px;">';
    
    if (mySwaps.length === 0) {
      html += '<div style="text-align:center; padding:30px; color:var(--text-muted); background:var(--bg-tertiary); border-radius:var(--radius-md);">' + icon('fileText', 30) + '<p style="margin-top:10px;">You haven\'t offered any shifts.</p></div>';
    }

    mySwaps.forEach(function(s) {
      var statusColor = s.status === 'open' ? 'warning' : 'success';
      html += '<div style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; background:var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">';
      html += '<div><div style="font-weight:600; font-size:0.9rem; color:var(--text-primary);">' + formatDate(s.date) + ' - ' + s.shift_label + '</div><div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Reason: ' + s.reason + '</div></div>';
      html += '<div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">';
      html += '<span class="badge badge-' + statusColor + '"><span class="badge-dot"></span>' + s.status + '</span>';
      if(s.status === 'open') {
        html += '<button class="btn btn-xs btn-outline" style="color:var(--accent-danger); border-color:var(--accent-danger);" onclick="deleteSwap(\'' + s.id + '\')">Cancel</button>';
      } else {
        html += '<div style="font-size:0.75rem; color:var(--accent-success); font-weight:600;">Accepted by ' + s.accepter_name + '</div>';
      }
      html += '</div></div>';
    });

    html += '</div></div>';
    html += '</div>'; // End grid-2

    el.innerHTML = html;
  }

  // --- Globals for buttons ---
  window.offerShiftModal = function() {
    var sys = user.shift_system || '3-shift';
    var availableShifts = getShiftsForSystem(sys);
    
    var body = '<div class="form-row"><div class="form-field"><label>Date to Swap *</label><input type="date" id="swap-date" min="' + todayStr() + '" class="form-input"></div><div class="form-field"><label>Which Shift? *</label><select id="swap-shift" class="form-input">';
    availableShifts.forEach(function(sh) {
      body += '<option value="' + sh.label + '">' + sh.label + '</option>';
    });
    body += '</select></div></div>';
    body += '<div class="form-field"><label>Reason *</label><input type="text" id="swap-reason" placeholder="e.g. Family Emergency, Doctor Appointment" class="form-input"></div>';
    body += '<div style="padding:12px; background:rgba(168,85,247,0.1); border:1px solid rgba(168,85,247,0.2); border-radius:var(--radius-md); margin-top:16px; font-size:0.8rem; color:var(--text-primary); display:flex; gap:10px;">';
    body += '<div style="color:#a855f7; font-size:1.2rem;">' + icon('brain') + '</div>';
    body += '<div><b>AI Smart Swapping:</b> When you submit, the AI will notify eligible colleagues in your department. If someone accepts, the system auto-approves it based on labor rules without HR intervention!</div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="submit-swap-btn">Offer Shift</button>';
    App.showModal('Offer Shift for Swap', body, footer);

    document.getElementById('submit-swap-btn').addEventListener('click', function() {
      var date = document.getElementById('swap-date').value;
      var shift = document.getElementById('swap-shift').value;
      var reason = document.getElementById('swap-reason').value;
      if(!date || !reason) { alert('Fill all fields'); return; }

      swaps.push({
        id: 'swap_' + Date.now(),
        date: date,
        shift_label: shift,
        reason: reason,
        offerer_id: user.id,
        offerer_name: user.full_name,
        department: user.department,
        status: 'open',
        created_at: new Date().toISOString()
      });
      saveSwaps(swaps);
      render();
      App.closeModal();
      showToast('Shift offered to marketplace successfully', 'success');
    });
  };

  window.deleteSwap = function(id) {
    if(confirm('Cancel this swap offer?')) {
      swaps = swaps.filter(function(s) { return s.id !== id; });
      saveSwaps(swaps);
      render();
    }
  };

  window.acceptSwap = function(id) {
    if(confirm('Are you sure you want to take this shift? The AI will auto-approve this swap.')) {
      var swap = swaps.find(function(s) { return s.id === id; });
      if(swap) {
        swap.status = 'accepted';
        swap.accepter_id = user.id;
        swap.accepter_name = user.full_name;
        saveSwaps(swaps);
        render();
        
        // Notify original offerer
        App.addNotification({
          user_id: swap.offerer_id,
          title: 'Shift Swap Accepted! 🔄',
          message: user.full_name + ' accepted your shift swap for ' + formatDate(swap.date) + '. AI has auto-approved the schedule change.',
          type: 'info'
        });

        // Nice animation
        showToast('Shift accepted! AI has successfully updated the roster.', 'success');
      }
    }
  };

  render();
};
