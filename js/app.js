// ===== MAIN APP CONTROLLER =====
var App = {
  user: null,
  activePage: 'dashboard',
  notifications: [],

  init: function () {
    App.user = null;
    localStorage.removeItem('hr_portal_user');

    // One-time migration for leaves from 1/6/2026
    if (!localStorage.getItem('migrated_leaves_1_6_2026_v2')) {
      localStorage.setItem('migrated_leaves_1_6_2026_v2', 'true');
      setTimeout(function() {
        if (typeof sbClient !== 'undefined') {
          sbClient.from('leave_requests').select('*').eq('status', 'approved').gte('start_date', '2026-06-01').then(function(res) {
            if (res.data) {
              res.data.forEach(function(l) {
                var sDate = new Date(l.start_date);
                var eDate = new Date(l.end_date);
                var duration = Math.ceil((eDate - sDate) / 86400000) + 1;
                var attRecords = [];
                for (var d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
                  if (l.days !== 0.5 && duration < 7 && d.getDay() === 5) continue;
                  var dateStr = d.toISOString().substring(0, 10);
                  attRecords.push({
                    employee_id: l.employee_id,
                    employee_name: l.employee_name,
                    department: l.department,
                    date: dateStr,
                    check_in: null,
                    check_out: null,
                    shift: 'morning',
                    working_hours: 0,
                    delay_minutes: 0,
                    status: 'leave'
                  });
                }
                if (attRecords.length > 0) {
                  var dates = attRecords.map(function(r) { return r.date; });
                  sbClient.from('attendance').delete().eq('employee_id', l.employee_id).in('date', dates).then(function() {
                    sbClient.from('attendance').insert(attRecords).then(function() {});
                  });
                }
              });
            }
          });
        }
      }, 3000);
    }

    if (App.user) {
      App.loadNotifications();
      App.renderApp();
    } else {
      App.renderLogin();
    }
  },

  // ========== AUTH ==========
  login: function (username, password) {
    App.activePage = null;
    // QR Station shortcut
    if (username === 'qr' && password === '1234') {
      window.location.href = 'qr.html';
      return;
    }
    // Supabase mode
    sbClient.from('users').select('*').eq('username', username).single().then(function (res) {
      if (res.error || !res.data || res.data.password_hash !== password) {
        // Try Supplier Login
        sbClient.from('suppliers').select('*').eq('email', username).single().then(function (sRes) {
          if (sRes.error || !sRes.data || sRes.data.password_hash !== password) {
            // Log failed attempt
            sbClient.from('login_history').insert({ user_name: username, login_status: 'failed', failure_reason: 'Invalid credentials' }).then(function(){});
            App.showLoginError('Invalid credentials');
            return;
          }
          // Supplier Login Success
          App.user = {
            id: sRes.data.id,
            supplier_id: sRes.data.id,
            username: sRes.data.email,
            full_name: sRes.data.company_name,
            role: 'supplier_external',
            department: 'External Supplier'
          };
          localStorage.setItem('hr_portal_user', JSON.stringify(App.user));
          sbClient.from('login_history').insert({ user_id: sRes.data.id, user_name: sRes.data.company_name, login_status: 'success' }).then(function(){});
          App.renderApp();
        });
        return;
      }
      
      // Check if user is active
      if (res.data.status !== 'active') {
        sbClient.from('login_history').insert({ user_id: res.data.id, user_name: res.data.full_name, login_status: 'failed', failure_reason: 'Account inactive' }).then(function(){});
        App.showLoginError('Account is inactive. Contact HR.');
        return;
      }

      var userData = Object.assign({}, res.data);
      delete userData.password_hash;
      App.user = userData;
      localStorage.setItem('hr_portal_user', JSON.stringify(App.user));
      App.loadNotifications();
      // Load permissions
      if (typeof SecurityHelpers !== 'undefined') SecurityHelpers.loadPermissions();
      App.renderApp();
      // Log login to both audit_log and login_history
      sbClient.from('audit_log').insert({ action: 'LOGIN', user_name: res.data.full_name, details: res.data.role.toUpperCase() + ' user logged in', user_id: res.data.id }).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); } });
      sbClient.from('login_history').insert({ user_id: res.data.id, user_name: res.data.full_name, login_status: 'success' }).then(function(){});
      if (typeof SecurityHelpers !== 'undefined') SecurityHelpers.logActivity('auth', 'LOGIN', 'user', res.data.id);
    });
  },

  logout: function () {
    App.user = null;
    App.activePage = null;
    localStorage.removeItem('hr_portal_user');
    App.notifications = [];
    App.renderLogin();
  },

  toggleSidebar: function () {
    var s = document.getElementById('sidebar');
    var o = document.getElementById('mobile-overlay');
    if (s) s.classList.toggle('open');
    if (o) o.classList.toggle('open');
  },

  closeSidebar: function () {
    var s = document.getElementById('sidebar');
    var o = document.getElementById('mobile-overlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('open');
  },

  isOwner: function () { return App.user && App.user.role && App.user.role.toLowerCase() === 'owner'; },
  isHR: function () { return App.user && App.user.role && ['owner', 'hr manager', 'hr'].indexOf(App.user.role.toLowerCase()) !== -1; },
  isManager: function () { return App.user && App.user.role && ['owner', 'hall manager', 'department head', 'manager', 'supervisor', 'procurement manager', 'warehouse manager'].indexOf(App.user.role.toLowerCase()) !== -1; },
  isNursing: function () { return App.user && App.user.role && App.user.role.toLowerCase() === 'nursing management'; },
  getRoleLevel: function (r) { if (!r) return 1; var rl = r.toLowerCase(); return rl === 'owner' ? 6 : rl === 'hr manager' ? 5 : rl === 'hr' ? 4 : (rl === 'hall manager' || rl === 'nursing management') ? 3 : rl === 'department head' ? 2 : 1; },

  showLoginError: function (msg) {
    var el = document.getElementById('login-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  // ========== NOTIFICATIONS ==========
  loadNotifications: function () {
    if (!App.user) return;
    sbClient.from('notifications').select('*').eq('user_id', App.user.id).order('created_at', { ascending: false }).limit(50).then(function (res) {
      if (res.data) App.notifications = res.data;
      App.updateNotifBadge();
    });

    // Enable Realtime Notifications
    sbClient.channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + App.user.id }, function (payload) {
        var newNotif = payload.new;
        App.notifications.unshift(newNotif);
        App.updateNotifBadge();
        if (typeof showToast === 'function') {
          showToast('🔔 ' + newNotif.title, 'info');
        }
      })
      .subscribe();
  },

  addNotification: function (notif) {
    var newNotif = Object.assign({ read: false, created_at: new Date().toISOString() }, notif);
    if (notif.user_id === App.user.id) {
      App.notifications.unshift(newNotif);
    }
    sbClient.from('notifications').insert(newNotif).then(function (r) {
      if (r && r.error) {
        console.error("Supabase Error:", r.error);
        // Don't alert on UI for background notifications, just log it
      }
    });
    App.updateNotifBadge();
  },

  getUnreadCount: function () {
    return App.notifications.filter(function (n) { return !n.read; }).length;
  },

  updateNotifBadge: function () {
    var count = App.getUnreadCount();
    var badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  markNotifRead: function (id) {
    App.notifications = App.notifications.map(function (n) { return n.id === id ? Object.assign({}, n, { read: true }) : n; });
    sbClient.from('notifications').update({ read: true }).eq('id', id).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
    App.updateNotifBadge();
  },

  markAllRead: function () {
    App.notifications = App.notifications.map(function (n) { return Object.assign({}, n, { read: true }); });
    if (App.user) sbClient.from('notifications').update({ read: true }).eq('user_id', App.user.id).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
    App.updateNotifBadge();
    App.showNotifPanel();
  },

  // ========== RENDERING ==========
  renderLogin: function () {
    document.getElementById('app').innerHTML = '<div class="login-wrapper"><div class="login-bg"></div><div class="login-card">' +
      '<div class="login-logo"><img src="public/logo.png" alt="Logo" style="width:130px;height:130px;border-radius:12px;object-fit:contain;box-shadow:0 8px 24px rgba(0,0,0,0.5);border:2px solid rgba(225,29,72,0.5);margin-bottom:16px;background:rgba(255,255,255,0.05);padding:4px"><h1>Ninja Factory</h1><p>ERP System</p></div>' +
      '<form class="login-form" id="login-form">' +
      '<div id="login-error" class="login-error" style="display:none"></div>' +
      '<div class="form-group"><label class="form-label">Username (اسم المستخدم)</label><div class="form-input-wrapper"><input type="text" class="form-input" placeholder="Enter your username" id="login-username" autofocus></div></div>' +
      '<div class="form-group"><label class="form-label">Password (كلمة المرور)</label><div class="form-input-wrapper"><input type="password" class="form-input" placeholder="Enter your password" id="login-password"></div></div>' +
      '<button type="submit" class="login-btn" id="login-submit">Sign In (تسجيل الدخول)</button></form>' +

      '</div></div>';

    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('login-username').value.trim();
      var p = document.getElementById('login-password').value.trim();
      if (!u || !p) { App.showLoginError('Please fill in all fields'); return; }
      document.getElementById('login-error').style.display = 'none';
      App.login(u, p);
    });
  },

  renderApp: function () {
    var isHR = App.isHR();
    document.getElementById('app').innerHTML = '<div class="app-layout">' +
      '<div class="mobile-overlay" id="mobile-overlay"></div>' +
      '<aside class="sidebar" id="sidebar"></aside>' +
      '<div class="main-content"><header class="header" id="header"></header><div class="page-content" id="page-content"></div></div>' +
      '</div><div id="notif-panel-container"></div><div id="modal-container"></div>';

    document.getElementById('mobile-overlay').addEventListener('click', App.closeSidebar);

    App.renderSidebar();
    App.renderHeader();
    App.navigate(App.activePage);

    // Initialize Chatbot for employees
    if (typeof EmployeeChatbot !== 'undefined') {
      setTimeout(function () {
        EmployeeChatbot.init();
      }, 500);
    }
  },

  navigate: function (page) {
    App.activePage = page;
    var sidebarNav = document.querySelector('.sidebar-nav');
    var scrollPos = sidebarNav ? sidebarNav.scrollTop : 0;
    
    App.renderSidebar();
    App.renderHeader();
    App.renderPage();
    
    var newSidebarNav = document.querySelector('.sidebar-nav');
    if (newSidebarNav) {
      newSidebarNav.scrollTop = scrollPos;
    }
  },

  // ========== SIDEBAR ==========
  renderSidebar: function () {
    var menu = [];
    if (App.user.role === 'supplier_external') {
      menu = [
        { section: 'بوابة الموردين', items: [
          { id: 'supplier-portal', label: 'لوحة تحكم المورد', icon: 'truck' }
        ]}
      ];
    } else {
      var isHR = App.isHR();
      var isManager = App.isManager();
      if (isHR) {
        menu = [];
        if (!App.isOwner()) {
          menu.push({
            section: 'Overview', items: [
              { id: 'dashboard', label: 'Dashboard', icon: 'layoutDashboard' }
            ]
          });
        }
        
        var hrItems = [
          {
            section: 'Management', items: [
              { id: 'employees', label: 'Employees', icon: 'users' },
              { id: 'attendance', label: 'Attendance', icon: 'calendarCheck' },
              { id: 'all-delays', label: 'Delays Log', icon: 'alertTriangle' },
              { id: 'all-missions', label: 'Missions', icon: 'briefcase' },
              { id: 'absence-leave', label: 'Permission Requests', icon: 'calendarDays' },
          { id: 'leaves', label: 'Leave Requests', icon: 'calendarDays' },
              { id: 'shifts', label: 'Shift Management', icon: 'clock' },
              { id: 'overtime', label: 'Overtime', icon: 'timer' },
              ...(App.user && (App.user.role === 'hr manager' || App.user.role === 'owner') ? [{ id: 'payroll', label: 'Payroll', icon: 'dollarSign' }, { id: 'payroll-funding', label: 'Payroll Funding (صرف المرتبات)', icon: 'briefcase' }] : []),
              { id: 'hr-adjustments', label: 'Salary Adjustments', icon: 'fileText' },
              { id: 'recruitment', label: 'Recruitment', icon: 'userCheck' },
              { id: 'hr-ats', label: '🤖 AI ATS (فحص السير الذاتية)', icon: 'search' },
              { id: 'documents', label: 'Documents', icon: 'fileText' },
              { id: 'performance', label: 'Performance', icon: 'trendingUp' },
              { id: 'uniforms', label: 'Uniforms', icon: 'shield' },
              { id: 'medical-requests', label: 'Medical Requests', icon: 'heart' },
              { id: 'nursing-medical-approvals', label: '🏥 Medical Approvals (موافقات طبية)', icon: 'heart' },
              { id: 'loans', label: 'Loans & Advances', icon: 'creditCard' },
              { id: 'expenses', label: 'Expenses', icon: 'receipt' },
              { id: 'complaints', label: 'Disciplinary & Grievances', icon: 'gavel' },
              { id: 'friday-work', label: 'Friday Work (عمل الجمعة)', icon: 'calendarPlus' },
              { id: 'offboarding', label: 'Offboarding', icon: 'logOut' },
              { id: 'performance-reviews', label: '⭐ Performance Reviews (تقييم الأداء)', icon: 'trendingUp' },
              { id: 'training', label: '🎓 Training (التدريب)', icon: 'book' },
              { id: 'asset-assignment', label: '💻 Asset Assignment (العهد)', icon: 'monitor' },
              { id: 'employee-warnings', label: '⚠️ Warnings (الإنذارات)', icon: 'alertTriangle' },
            ]
          },
          { section: 'Communication', items: [
            { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
            { id: 'internal-chat', label: '💬 Internal Chat', icon: 'messageSquare' },
          ]},
          {
            section: 'Workplace', items: [
              { id: 'org-directory', label: 'Company Directory', icon: 'users' },
              { id: 'shift-swap', label: 'Shift Marketplace', icon: 'refreshCw' },
              { id: 'calendar', label: '📅 Calendar', icon: 'calendarDays' },
            ]
          },
          {
            section: 'Analytics', items: [
              { id: 'reports', label: 'Reports', icon: 'barChart' },
              { id: 'kpi-dashboard', label: '📊 KPI Dashboard', icon: 'trendingUp' },
              { id: 'audit-log', label: 'Audit Log', icon: 'fileText' },
              { id: 'login-history', label: '🔐 Login History', icon: 'lock' },
              { id: 'activity-log-page', label: '📋 Activity Log', icon: 'fileText' },
              { id: 'ai-mind', label: 'AI Mind', icon: 'brain' },
            ]
          },
          {
            section: 'Collaboration', items: [
              { id: 'task-management', label: '📝 Tasks (المهام)', icon: 'checkCircle' },
              { id: 'document-management', label: '📁 Documents (المستندات)', icon: 'folder' },
              { id: 'approval-workflows', label: '✅ Approvals (الموافقات)', icon: 'checkSquare' },
            ]
          },
          {
            section: 'Administration', items: [
              { id: 'system-settings', label: '⚙️ Settings (الإعدادات)', icon: 'settings' },
            ]
          }
        ];
        
        menu = menu.concat(hrItems);
        
        if (!App.isOwner()) {
          menu.push({
            section: 'My Info (بياناتي)', items: [
              { id: 'hr-personal', label: '👤 My Profile (ملفي الشخصي)', icon: 'user' },
              { id: 'my-attendance', label: 'My Attendance (حضوري)', icon: 'calendarCheck' },
              { id: 'scan-checkin', label: 'Check-In (تسجيل حضور)', icon: 'logIn' },
              { id: 'scan-checkout', label: 'Check-Out (تسجيل انصراف)', icon: 'logOut' },
              { id: 'my-leaves', label: 'My Leaves (إجازاتي)', icon: 'calendarDays' },
              { id: 'my-salary', label: 'My Salary (مرتبي)', icon: 'dollarSign' },
              { id: 'my-overtime', label: 'My Overtime (الأوفرتايم)', icon: 'timer' },
              { id: 'my-loans', label: 'My Loans (سلفياتي)', icon: 'creditCard' },
              { id: 'my-medical', label: 'Medical Needs (طلبات طبية)', icon: 'heart' },
              { id: 'my-delays', label: 'My Delays (تأخيراتي)', icon: 'alertTriangle' },
              { id: 'my-missions', label: 'My Missions (مأمورياتي)', icon: 'briefcase' },
              { id: 'my-expenses', label: 'My Expenses (مصروفاتي)', icon: 'receipt' },
            ]
          });
        }
      } else if (isManager) {
        menu = [
          {
            section: 'Overview', items: [
              { id: 'dashboard', label: 'My Dashboard', icon: 'layoutDashboard' }
            ]
          },
          {
            section: 'Team Management', items: [
              { id: 'leaves', label: '📋 Leave Approvals (موافقات الإجازات)', icon: 'calendarDays' },
              { id: 'dept-purchase-approvals', label: '📦 Purchase Approvals (موافقات المشتريات)', icon: 'shoppingCart' },
              { id: 'friday-work', label: 'Friday Work (عمل الجمعة)', icon: 'calendarPlus' },
              { id: 'team-adjustments', label: 'Team Adjustments', icon: 'fileText' },
            ]
          },
          {
            section: 'My Info', items: [
              { id: 'my-attendance', label: 'My Attendance', icon: 'calendarCheck' },
              { id: 'scan-checkin', label: 'Check-In (حضور)', icon: 'logIn' },
              { id: 'scan-checkout', label: 'Check-Out (انصراف)', icon: 'logOut' },
              { id: 'my-leaves', label: 'My Leaves', icon: 'calendarDays' },
              { id: 'my-salary', label: 'My Salary', icon: 'dollarSign' },
              { id: 'my-overtime', label: 'My Overtime', icon: 'timer' },
              { id: 'my-loans', label: 'My Loans', icon: 'creditCard' },
              { id: 'my-medical', label: 'Medical Needs', icon: 'heart' },
              { id: 'my-delays', label: 'تأخيراتي', icon: 'alertTriangle' },
              { id: 'my-missions', label: 'المأموريات', icon: 'briefcase' },
              { id: 'my-expenses', label: 'My Expenses', icon: 'receipt' },
              { id: 'complaints', label: 'My Complaints', icon: 'messageSquare' },
            ]
          },
          {
            section: 'Other', items: [
              { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
              { id: 'ai-mind', label: 'AI Mind', icon: 'brain' },
            ]
          },
          {
            section: 'Workplace', items: [
              { id: 'shift-swap', label: 'Shift Marketplace', icon: 'refreshCw' }
            ]
          }
        ];
      } else if (App.user && App.user.role === 'supplier_external') {
        menu = [];
      } else if (App.isNursing()) {
        menu = [
          { section: 'Overview', items: [{ id: 'dashboard', label: 'My Dashboard', icon: 'layoutDashboard' }] },
          {
            section: 'Nursing Management (إدارة التمريض)', items: [
              { id: 'nursing-medical-approvals', label: '🏥 Medical Approvals (موافقات طبية)', icon: 'heart' },
            ]
          },
          {
            section: 'My Info', items: [
              { id: 'my-attendance', label: 'My Attendance', icon: 'calendarCheck' },
              { id: 'scan-checkin', label: 'Check-In (حضور)', icon: 'logIn' },
              { id: 'scan-checkout', label: 'Check-Out (انصراف)', icon: 'logOut' },
              { id: 'my-leaves', label: 'My Leaves', icon: 'calendarDays' },
              { id: 'my-salary', label: 'My Salary', icon: 'dollarSign' },
              { id: 'my-overtime', label: 'My Overtime', icon: 'timer' },
              { id: 'my-loans', label: 'My Loans', icon: 'creditCard' },
              { id: 'my-medical', label: 'Medical Needs', icon: 'heart' },
              { id: 'my-delays', label: 'تأخيراتي', icon: 'alertTriangle' },
              { id: 'my-missions', label: 'المأموريات', icon: 'briefcase' },
              { id: 'my-expenses', label: 'My Expenses', icon: 'receipt' },
              { id: 'complaints', label: 'My Complaints', icon: 'messageSquare' },
            ]
          },
          { section: 'Other', items: [{ id: 'announcements', label: 'Announcements', icon: 'megaphone' }] },
        ];
      } else if (App.user && (App.user.department === 'Legal' || App.user.role === 'lawyer') && !App.isOwner()) {
        menu = [
          { section: 'Overview', items: [{ id: 'dashboard', label: 'My Dashboard', icon: 'layoutDashboard' }] },
          {
            section: 'My Info (بياناتي)', items: [
              { id: 'my-attendance', label: 'My Attendance', icon: 'calendarCheck' },
              { id: 'scan-checkin', label: 'Check-In (حضور)', icon: 'logIn' },
              { id: 'scan-checkout', label: 'Check-Out (انصراف)', icon: 'logOut' },
              { id: 'my-leaves', label: 'My Leaves', icon: 'calendarDays' },
              { id: 'my-salary', label: 'My Salary', icon: 'dollarSign' },
              { id: 'my-overtime', label: 'My Overtime', icon: 'timer' },
              { id: 'my-loans', label: 'My Loans', icon: 'creditCard' },
              { id: 'my-medical', label: 'Medical Needs', icon: 'heart' },
              { id: 'my-delays', label: 'تأخيراتي', icon: 'alertTriangle' },
              { id: 'my-missions', label: 'المأموريات', icon: 'briefcase' },
              { id: 'my-expenses', label: 'My Expenses', icon: 'receipt' },
              { id: 'complaints', label: 'My Complaints', icon: 'messageSquare' },
            ]
          },
          { section: 'Legal & Compliance (الشؤون القانونية)', items: [
              { id: 'legal-affairs', label: 'Legal Affairs (الشؤون القانونية)', icon: 'shield' }
          ]},
          { section: 'Other', items: [
              { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
              { id: 'internal-chat', label: '💬 Chat', icon: 'messageSquare' },
          ]},
          { section: 'Workplace', items: [
              { id: 'shift-swap', label: 'Shift Marketplace', icon: 'refreshCw' },
              { id: 'calendar', label: '📅 Calendar', icon: 'calendarDays' },
              { id: 'task-management', label: '📝 My Tasks', icon: 'checkCircle' },
          ]},
        ];
      } else {
        menu = [
          { section: 'Overview', items: [{ id: 'dashboard', label: 'My Dashboard', icon: 'layoutDashboard' }] },
          {
            section: 'My Info', items: [
              { id: 'my-attendance', label: 'My Attendance', icon: 'calendarCheck' },
              { id: 'scan-checkin', label: 'Check-In (حضور)', icon: 'logIn' },
              { id: 'scan-checkout', label: 'Check-Out (انصراف)', icon: 'logOut' },
              { id: 'my-leaves', label: 'My Leaves', icon: 'calendarDays' },
              { id: 'my-salary', label: 'My Salary', icon: 'dollarSign' },
              { id: 'my-overtime', label: 'My Overtime', icon: 'timer' },
              { id: 'my-loans', label: 'My Loans', icon: 'creditCard' },
              { id: 'my-medical', label: 'Medical Needs', icon: 'heart' },
              { id: 'my-delays', label: 'تأخيراتي', icon: 'alertTriangle' },
              { id: 'my-missions', label: 'المأموريات', icon: 'briefcase' },
              { id: 'my-expenses', label: 'My Expenses', icon: 'receipt' },
              { id: 'complaints', label: 'My Complaints', icon: 'messageSquare' },
            ]
          },
          { section: 'Other', items: [
            { id: 'announcements', label: 'Announcements', icon: 'megaphone' },
            { id: 'internal-chat', label: '💬 Chat', icon: 'messageSquare' },
          ]},
          {
            section: 'Workplace', items: [
              { id: 'shift-swap', label: 'Shift Marketplace', icon: 'refreshCw' },
              { id: 'calendar', label: '📅 Calendar', icon: 'calendarDays' },
              { id: 'task-management', label: '📝 My Tasks', icon: 'checkCircle' },
            ]
          },
        ];
      }

      if (App.isOwner()) {
        menu.unshift({
          section: 'ERP Control', items: [
            { id: 'owner-dashboard', label: 'Owner Dashboard (لوحة المالك)', icon: 'globe' },
            { id: 'ceo-dashboard', label: 'CEO Dashboard (لوحة المدير)', icon: 'trendingUp' },
            { id: 'cost-centers', label: 'Cost Centers (تكلفة الإدارات)', icon: 'pieChart' },
            { id: 'activity-timeline', label: 'Activity Timeline (سجل العمليات)', icon: 'clock' }
          ]
        });
      }

      if (App.user && App.user.role === 'driver' && App.user.driver_type === 'external') {
        menu = [
          { section: 'Transportation (النقل)', items: [{ id: 'logistics', label: 'Vehicle Movement (حركة العربيات)', icon: 'truck' }] },
          { section: 'Collaboration (التواصل)', items: [{ id: 'internal-chat', label: 'Internal Chat (المحادثات)', icon: 'messageSquare' }] }
        ];
      } else {
        var canViewInventory = App.isOwner() || (App.user && (App.user.department === 'Warehouse' || App.user.role === 'warehouse manager' || App.user.role === 'sales coordinator' || App.user.department === 'Planning' || App.user.role === 'planning manager'));
        var canViewProcurement = App.isOwner() || (App.user && (App.user.role === 'hr manager' || App.user.department === 'Finance' || App.user.department === 'Procurement'));

      if (canViewInventory || canViewProcurement) {
        var opItems = [];
        if (canViewInventory) opItems.push({ id: 'inventory', label: 'Inventory (المخازن)', icon: 'package' });
        if (canViewProcurement) opItems.push({ id: 'purchase-requests', label: 'Purchase Requests (طلبات الشراء)', icon: 'shoppingCart' });
        
        menu.push({
          section: 'Operations & Logistics', items: opItems
        });
      }

      var isPureFinance = App.isOwner() || (App.user && App.user.department === 'Finance');
      var canViewFinance = isPureFinance || (App.user && App.user.role === 'hr manager');
      
      if (canViewFinance || canViewProcurement) {
        var finItems = [];
        
        var isProcurementOnly = App.user && App.user.department === 'Procurement';
        if (isPureFinance || isProcurementOnly) {
          finItems.push({ id: 'petty-cash', label: 'Financial Suite (الإدارة المالية)', icon: 'dollarSign' });
        }
        
        if (canViewFinance) {
          finItems.push({ id: 'payroll-funding', label: 'Payroll Funding (صرف المرتبات)', icon: 'briefcase' });
          finItems.push({ id: 'payroll', label: 'Payroll (سجل الرواتب)', icon: 'dollarSign' });
        }
        
        if (isPureFinance) {
          finItems.push({ id: 'financial-reports', label: '📊 Financial Reports (التقارير المالية)', icon: 'barChart' });
          finItems.push({ id: 'driver-payments', label: 'Driver Payments (حسابات السائقين)', icon: 'truck' });
        }

        if (finItems.length > 0) {
          menu.push({
            section: 'Finance & Accounting', items: finItems
          });
        }
      }

      var canViewIT = App.isManager() || App.isHR() || App.isOwner() || (App.user && App.user.department === 'IT');
      if (canViewIT) {
        menu.push({
          section: 'IT & Support', items: [
            { id: 'it-tickets', label: 'IT Support (الدعم الفني)', icon: 'cpu' }
          ]
        });
      }
      
      var canViewLegal = App.isOwner() || (App.user && (App.user.department === 'Legal' || App.user.role === 'lawyer'));
      if (canViewLegal) {
        menu.push({
          section: 'Legal & Compliance', items: [
            { id: 'legal-affairs', label: 'Legal Affairs (الشئون القانونية)', icon: 'shield' }
          ]
        });
      }

      // ERP Departments
      var canViewSales = App.isOwner() || (App.user && (App.user.department === 'Sales' || App.user.role === 'sales manager'));
      var canViewPlanning = App.isOwner() || (App.user && (App.user.department === 'Planning' || App.user.role === 'planning manager'));
      var canViewProduction = App.isOwner() || (App.user && (App.user.department === 'Production' || App.user.role === 'hall manager'));
      var canViewQuality = App.isOwner() || (App.user && (App.user.department === 'Quality' || App.user.role === 'qc inspector' || App.user.role === 'quality manager'));

      if (canViewSales) {
        menu.push({ section: 'Sales (المبيعات)', items: [{ id: 'erp-sales', label: 'Sales Orders (أوامر البيع)', icon: 'shoppingBag' }] });
      }
      var canViewSuppliers = App.isOwner() || (App.user && (App.user.department === 'Sales' || App.user.role === 'hr manager' || App.user.department === 'Finance'));

      var supplyChainItems = [];
      if (canViewPlanning) {
        supplyChainItems.push({ id: 'erp-planning', label: 'Production Planning (تخطيط)', icon: 'calendarCheck' });
      }
      if (canViewSuppliers) {
        supplyChainItems.push({ id: 'erp-suppliers', label: 'Suppliers (الموردين)', icon: 'users' });
      }

      if (supplyChainItems.length > 0) {
        menu.push({ section: 'Supply Chain (الإمداد)', items: supplyChainItems });
      }
      if (canViewProduction) {
        menu.push({ section: 'Production (الإنتاج)', items: [{ id: 'erp-production', label: 'Production Orders (أوامر الإنتاج)', icon: 'settings' }] });
      }
      
      var canViewEngineering = App.isOwner() || (App.user && (App.user.role === 'hr manager' || (App.user.department === 'Engineering' && App.user.role !== 'spare parts inspector') || App.user.role === 'engineering manager' || App.user.role === 'engineer' || App.user.role === 'technical office'));
      if (canViewEngineering) {
        menu.push({ section: 'Engineering (الإدارة الهندسية)', items: [{ id: 'engineering', label: 'Projects & Designs', icon: 'edit3' }] });
      }
      
      if (canViewQuality) {
        menu.push({ section: 'Quality (الجودة)', items: [{ id: 'erp-quality', label: 'QC Inspections (فحص الجودة)', icon: 'checkCircle' }] });
      }
      var canViewMaintenance = (App.isOwner() || (App.user && (
        App.user.department === 'Production' || App.user.role === 'hall manager' ||
        App.user.department === 'Maintenance' || App.user.role === 'maintenance manager' || App.user.role === 'technician' ||
        App.user.role === 'hr manager'
      ))) && !App.isNursing();

      if (canViewMaintenance) {
        menu.push({ section: 'Maintenance (الصيانة)', items: [
          { id: 'erp-maintenance', label: 'Maintenance & Facilities', icon: 'tool' }
        ]});
      }

      var canViewSpareParts = (App.isOwner() || (App.user && (
        App.user.department === 'Maintenance' || App.user.role === 'maintenance manager' || App.user.role === 'technician' ||
        App.user.department === 'Warehouse' || App.user.role === 'warehouse manager' ||
        App.user.department === 'Quality' || App.user.role === 'quality manager' ||
        App.user.role === 'hr manager' || App.user.role === 'spare parts inspector'
      ))) && !App.isNursing();

      if (canViewSpareParts) {
        menu.push({ section: 'Spare Parts (قطع الغيار)', items: [
          { id: 'spare-parts', label: 'Spare Parts Lifecycle (دورة قطع الغيار)', icon: 'settings' }
        ]});
      }

      var canViewLogistics = App.isOwner() || (App.user && (App.user.role === 'hr manager' || App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'driver'));
      if (canViewLogistics) {
        menu.push({ section: 'Transportation (النقل والحركة)', items: [
          { id: 'logistics', label: 'Vehicle Movement (حركة العربيات)', icon: 'truck' },
          { id: 'erp-fleet', label: 'Fleet & Drivers (إدارة الأسطول)', icon: 'map' }
        ]});
      }

      var canViewSupplierPortal = App.isOwner() || (App.user && (
        App.user.department === 'Sales' || 
        App.user.department === 'Finance' || 
        App.user.role === 'supplier_external'
      ));

        if (canViewSupplierPortal) {
          var menuLabel = (App.user && App.user.role === 'supplier_external') ? 'لوحة تحكم العميل' : 'Customer Portal';
          menu.push({
            section: 'Customer Portal (بوابة العملاء)', items: [
              { id: 'supplier-portal', label: menuLabel, icon: 'layoutDashboard' }
            ]
          });
        }
      } // End of driver else block
    } // End of supplier_external else block

    var html = '<div class="sidebar-header"><div class="sidebar-logo" style="width:55px;height:55px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;padding:4px;border:1px solid rgba(255,255,255,0.1);"><img src="public/logo.png" onerror="this.style.display=\'none\'; this.parentNode.innerHTML=icon(\'factory\', 30);" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;"></div><div class="sidebar-brand"><h2>Ninja Factory</h2><p>ERP System</p></div></div>';
    html += '<nav class="sidebar-nav">';
    menu.forEach(function (section) {
      html += '<div class="sidebar-section"><div class="sidebar-section-title">' + section.section + '</div>';
      section.items.forEach(function (item) {
        html += '<button class="sidebar-item' + (App.activePage === item.id ? ' active' : '') + '" data-page="' + item.id + '" id="nav-' + item.id + '">' +
          '<span class="sidebar-item-icon">' + icon(item.icon) + '</span><span>' + item.label + '</span></button>';
      });
      html += '</div>';
    });
    html += '</nav>';
    html += '<div class="sidebar-footer"><div class="sidebar-user">' +
      '<div class="sidebar-avatar" style="background:' + (App.user.avatar_color || '#6366f1') + '">' + getInitials(App.user.full_name) + '</div>' +
      '<div class="sidebar-user-info"><h4>' + App.user.full_name + '</h4><p>' + App.user.position + '</p></div>' +
      '<button class="sidebar-logout" id="logout-btn" title="Sign out">' + icon('logOut') + '</button></div></div>';

    document.getElementById('sidebar').innerHTML = html;

    // Bind events
    document.querySelectorAll('.sidebar-item').forEach(function (btn) {
      btn.addEventListener('click', function () { App.navigate(this.getAttribute('data-page')); App.closeSidebar(); });
    });
    document.getElementById('logout-btn').addEventListener('click', App.logout);
  },

  // ========== HEADER ==========
  renderHeader: function () {
    var titles = {
      'dashboard': { title: 'Dashboard', sub: 'Overview & Analytics' },
      'employees': { title: 'Employee Management', sub: 'Manage all employees' },
      'attendance': { title: 'Attendance', sub: 'Track employee attendance' },
      'leaves': { title: 'Leave Management', sub: 'Handle leave requests' },
      'shifts': { title: 'Shift Management', sub: 'Morning, Evening & Night shifts' },
      'overtime': { title: 'Overtime Management', sub: 'Track & approve overtime' },
      'payroll': { title: 'Payroll', sub: 'Salary processing & reports' },
      'announcements': { title: 'Announcements', sub: 'Company-wide messages' },
      'reports': { title: 'Reports & Analytics', sub: 'Insights & data export' },
      'audit-log': { title: 'Audit Log', sub: 'System activity tracking' },
      'my-attendance': { title: 'My Attendance', sub: 'Your attendance records' },
      'hr-qr-generator': { title: 'QR Generator (HR)', sub: 'Generate changing QR codes for check-in/out' },
      'scan-checkin': { title: 'Check-In (حضور)', sub: 'Scan QR to start your shift' },
      'scan-checkout': { title: 'Check-Out (انصراف)', sub: 'Scan QR to end your shift' },
      'hr-personal': { title: 'My HR Profile', sub: 'Your personal HR records' },
      'hr-ats': { title: '🤖 AI ATS (فحص السير الذاتية)', sub: 'AI-powered applicant tracking & CV screening' },
      'my-leaves': { title: 'My Leaves', sub: 'Your leave requests' },
      'my-salary': { title: 'My Salary', sub: 'Your salary details' },
      'my-overtime': { title: 'My Overtime', sub: 'Your overtime records' },
      'team-adjustments': { title: 'Team Adjustments', sub: 'Submit bonuses & penalties for your team' },
      'hr-adjustments': { title: 'Salary Adjustments', sub: 'Approve or reject manager requests' },
      'recruitment': { title: 'Recruitment', sub: 'Manage job postings and applicants' },
      'documents': { title: 'Documents', sub: 'Track employee documents and expiries' },
      'performance': { title: 'Performance', sub: 'Employee appraisals and goals' },
      'uniforms': { title: 'Uniforms', sub: 'Track issued uniforms and sizes' },
      'loans': { title: 'Loans & Advances', sub: 'Manage employee loans' },
      'my-loans': { title: 'My Loans', sub: 'Your loan requests and remaining balance' },
      'medical-requests': { title: 'Medical Requests', sub: 'Manage medical needs and disbursements' },
      'my-medical': { title: 'My Medical Needs', sub: 'Upload medical needs and receipts' },
      'nursing-medical-approvals': { title: '🏥 Medical Approvals (موافقات طبية)', sub: 'Review employee medical requests' },
      'ai-mind': { title: 'AI Mind', sub: 'Neural-powered workforce intelligence' },
      'org-directory': { title: 'Company Directory', sub: 'Interactive Org Chart & Skills Finder' },
      'shift-swap': { title: 'Shift Marketplace', sub: 'Request and accept shift swaps intelligently' },
      'expenses': { title: 'Expenses', sub: 'Manage and approve expense claims' },
      'my-expenses': { title: 'My Expenses', sub: 'Your expense claims' },
      'complaints': { title: 'Grievances & Disciplinary', sub: 'Complaints and disciplinary actions' },
      'offboarding': { title: 'Offboarding', sub: 'Manage employee exit process' },
      'inventory': { title: 'Inventory (المخازن)', sub: 'Warehouse Management' },
      'purchase-requests': { title: 'Material Requests (طلبات صرف وشراء)', sub: 'Warehouse and Procurement workflows' },
      'petty-cash': { title: 'Financial Suite (الإدارة المالية الشاملة)', sub: 'Manage treasury, AP/AR, assets, and more' },
      'it-tickets': { title: 'IT Support (الدعم الفني)', sub: 'Technical support and issue tracking' },
      'legal-affairs': { title: 'Legal Affairs (الشئون القانونية)', sub: 'Company investigations and legal issues' },
      'owner-dashboard': { title: 'Owner Dashboard (لوحة المالك)', sub: 'Enterprise Command Center' },
      'cost-centers': { title: 'Cost Centers (تكلفة الإدارات)', sub: 'Department Costs & Analytics' },
      'erp-sales': { title: 'Sales (المبيعات)', sub: 'Sales orders & client management' },
      'erp-planning': { title: 'Planning (التخطيط)', sub: 'Production planning & scheduling' },
      'erp-production': { title: 'Production (الإنتاج)', sub: 'Manufacturing & material requests' },
      'erp-quality': { title: 'Quality Control (الجودة)', sub: 'QC inspections & approvals' },
      'engineering': { title: 'Engineering (الإدارة الهندسية)', sub: 'Technical specs & supervision' },
      'erp-maintenance': { title: 'Maintenance (الصيانة)', sub: 'Equipment repairs & preventative maintenance' },
      'spare-parts': { title: 'Spare Parts Lifecycle (دورة قطع الغيار)', sub: 'Manage spare parts requests, returns, and quality checks' },
      'erp-suppliers': { title: 'Supplier Management', sub: 'Manage external suppliers' },
      'supplier-portal': { title: 'Supplier Portal', sub: 'View your orders and requests' },
      'logistics': { title: 'Transportation & Logistics', sub: 'Manage driver and vehicle movements' },
      'erp-fleet': { title: 'Fleet & Drivers (إدارة الأسطول والسائقين)', sub: 'Manage drivers, vehicles, and trips' },
      'kpi-dashboard': { title: '📊 KPI Dashboard', sub: 'Real-time performance indicators' },
      'login-history': { title: '🔐 Login History', sub: 'Track all login attempts' },
      'activity-log-page': { title: '📋 Activity Log', sub: 'Detailed system activity tracking' },
      'task-management': { title: '📝 Task Management', sub: 'Manage and track tasks' },
      'internal-chat': { title: '💬 Internal Chat', sub: 'Team messaging & collaboration' },
      'calendar': { title: '📅 Calendar', sub: 'Events, meetings & deadlines' },
      'financial-reports': { title: '📊 Financial Reports', sub: 'P&L, Balance Sheet, Cash Flow' },
      'system-settings': { title: '⚙️ System Settings', sub: 'Configure system parameters' },
      'document-management': { title: '📁 Document Management', sub: 'Upload and manage documents' },
      'approval-workflows': { title: '✅ Approval Workflows', sub: 'Manage approval requests' },
      'performance-reviews': { title: '⭐ Performance Reviews', sub: 'Employee performance evaluation' },
      'training': { title: '🎓 Training & Development', sub: 'Courses and skill development' },
      'asset-assignment': { title: '💻 Asset Assignment', sub: 'Track company assets and custody' },
      'absence-leave': { title: 'Permission Requests (الأذونات)', sub: 'Manage employee early leave/absence permissions' },
      'employee-warnings': { title: '⚠️ Employee Warnings', sub: 'Disciplinary actions and penalties' },
      'ceo-dashboard': { title: '📊 CEO Dashboard', sub: 'Enterprise High-Level Overview' },
      'activity-timeline': { title: '🕐 Activity Timeline', sub: 'Real-time audit of all operations' },
      'dept-purchase-approvals': { title: '📦 موافقات طلبات الشراء', sub: 'Department Purchase Approvals — موافقة المدير على طلبات الشراء' }
    };
    var page = titles[App.activePage] || { title: 'Dashboard', sub: '' };
    var unread = App.getUnreadCount();

    document.getElementById('header').innerHTML =
      '<div class="header-left"><button class="menu-toggle" id="menu-toggle">' + icon('menu') + '</button><div class="header-title"><h2>' + page.title + '</h2><p>' + page.sub + '</p></div></div>' +
      '<div class="header-right"><button class="btn btn-sm btn-outline" id="lang-toggle-btn" style="margin-right:14px">' + (localStorage.getItem('lang') === 'ar' ? 'English' : 'عربي') + '</button><button class="header-btn" id="notif-toggle" title="Notifications">' + icon('bell') +
      '<span class="notif-badge" id="notif-badge" style="display:' + (unread > 0 ? 'flex' : 'none') + '">' + (unread > 9 ? '9+' : unread) + '</span></button></div>';

    document.getElementById('menu-toggle').addEventListener('click', App.toggleSidebar);
    document.getElementById('notif-toggle').addEventListener('click', function () { App.showNotifPanel(); });
    document.getElementById('lang-toggle-btn').addEventListener('click', function () { var curr = localStorage.getItem('lang'); if (curr === 'ar') { localStorage.setItem('lang', 'en'); document.body.classList.remove('rtl-layout'); } else { localStorage.setItem('lang', 'ar'); document.body.classList.add('rtl-layout'); } window.location.reload(); });
  },

  // ========== NOTIFICATION PANEL ==========
  showNotifPanel: function () {
    var unread = App.getUnreadCount();
    var html = '<div style="position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:99" id="notif-overlay"></div>' +
      '<div class="notif-panel"><div class="notif-panel-header"><h3>🔔 Notifications</h3><div style="display:flex;gap:8px">';
    if (unread > 0) html += '<button class="btn btn-xs btn-outline" id="mark-all-read">' + icon('checkCheck') + ' Mark all read</button>';
    html += '<button class="modal-close" id="close-notif">' + icon('x') + '</button></div></div>';
    html += '<div class="notif-panel-body">';
    if (App.notifications.length === 0) {
      html += '<div class="notif-empty">' + icon('bellOff') + '<p>No notifications yet</p></div>';
    } else {
      App.notifications.forEach(function (n) {
        html += '<div class="notif-item' + (!n.read ? ' unread' : '') + '" data-notif-id="' + n.id + '"><div class="notif-item-title">' + n.title + '</div><div class="notif-item-msg">' + n.message + '</div><div class="notif-item-time">' + formatDateTime(n.created_at) + '</div></div>';
      });
    }
    html += '</div></div>';
    document.getElementById('notif-panel-container').innerHTML = html;

    document.getElementById('notif-overlay').addEventListener('click', function () { document.getElementById('notif-panel-container').innerHTML = ''; });
    document.getElementById('close-notif').addEventListener('click', function () { document.getElementById('notif-panel-container').innerHTML = ''; });
    var markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) markAllBtn.addEventListener('click', function () { App.markAllRead(); });
    document.querySelectorAll('.notif-item').forEach(function (item) {
      item.addEventListener('click', function () { App.markNotifRead(this.getAttribute('data-notif-id')); this.classList.remove('unread'); });
    });
  },

  // ========== PAGE ROUTER ==========
  renderPage: function () {
    var el = document.getElementById('page-content');
    if (App.user && App.user.role === 'supplier_external') {
      App.activePage = App.activePage || 'supplier-portal';
    } else if (App.user && App.user.role === 'driver') {
      App.activePage = App.activePage || 'logistics';
    } else {
      App.activePage = App.activePage || 'dashboard';
    }

    switch (App.activePage) {
      case 'supplier-portal': Pages['supplier-portal'] && Pages['supplier-portal'](el); break;
      case 'dashboard': Pages.empDashboard(el); break;
      case 'hr-admin': App.isHR() ? Pages.hrDashboard(el) : Pages.empDashboard(el); break;
      case 'employees': (App.isHR() || App.isOwner()) ? Pages.employees(el) : Pages.empDashboard(el); break;
      case 'friday-work': Pages.fridayWork(el); break;
      case 'attendance': case 'my-attendance': Pages.attendance(el); break;
      case 'all-delays': App.isHR() ? Pages.allDelays(el) : Pages.empDashboard(el); break;
      case 'hr-qr-generator': Pages.hrQrGenerator(el); break;
      case 'scan-checkin': Pages.scanCheckin(el); break;
      case 'scan-checkout': Pages.scanCheckout(el); break;
      case 'hr-personal': Pages.hrPersonal(el); break;
      case 'my-missions': Pages.missions(el); break;
      case 'all-missions': App.isHR() ? Pages.allMissions(el) : Pages.empDashboard(el); break;
      case 'leaves': case 'my-leaves': Pages.leaves(el); break;
      case 'shifts': App.isHR() ? Pages.shifts(el) : Pages.empDashboard(el); break;
      case 'overtime': case 'my-overtime': Pages.overtime(el); break;
      case 'payroll': case 'my-salary': Pages.payroll(el); break;
      case 'payroll-funding': Pages.payrollFunding(el); break;
      case 'driver-payments': if (Pages.driverPayments) Pages.driverPayments(el); else el.innerHTML = 'Module missing'; break;
      case 'announcements': Pages.announcements(el); break;
      case 'reports': App.isHR() ? Pages.reports(el) : Pages.empDashboard(el); break;
      case 'audit-log': App.isHR() ? Pages.auditLog(el) : Pages.empDashboard(el); break;
      case 'team-adjustments': Pages.teamAdjustments(el); break;
      case 'hr-adjustments': App.isHR() ? Pages.hrAdjustments(el) : Pages.empDashboard(el); break;
      case 'recruitment': App.isHR() ? Pages.recruitment(el) : Pages.empDashboard(el); break;
      case 'documents': App.isHR() ? Pages.documents(el) : Pages.empDashboard(el); break;
      case 'performance': (App.isHR() || App.isManager()) ? Pages.performance(el) : Pages.empDashboard(el); break;
      case 'uniforms': App.isHR() ? Pages.uniforms(el) : Pages.empDashboard(el); break;
      case 'loans': App.isHR() ? Pages.loans(el) : Pages.empDashboard(el); break;
      case 'legal-affairs': if (Pages.legalAffairs) Pages.legalAffairs(el); else el.innerHTML = 'Module missing'; break;
      case 'my-loans': Pages.myLoans(el); break;
      case 'medical-requests': (App.isHR() || App.isManager()) ? Pages.medicalRequests(el) : Pages.empDashboard(el); break;
      case 'nursing-medical-approvals': (App.isNursing() || App.isHR() || App.isOwner()) ? Pages.medicalRequests(el) : Pages.empDashboard(el); break;
      case 'my-medical': Pages.myMedical(el); break;
      case 'ai-mind': (App.isHR() || App.isManager()) ? Pages.aiMind(el) : Pages.empDashboard(el); break;
      case 'org-directory': Pages.orgDirectory(el); break;
      case 'shift-swap': Pages.shiftSwap(el); break;
      case 'my-delays': Pages['my-delays'](el); break;
      case 'expenses': case 'my-expenses': Pages.expenses(el); break;
      case 'complaints': Pages.complaints(el); break;
      case 'offboarding': App.isHR() ? Pages.offboarding(el) : Pages.empDashboard(el); break;
      case 'owner-dashboard': App.isOwner() ? Pages.ownerDashboard(el) : Pages.hrDashboard(el); break;
      case 'cost-centers': App.isOwner() ? Pages.costCenters(el) : Pages.hrDashboard(el); break;
      case 'inventory': Pages.inventory(el); break;
      case 'purchase-requests': Pages.purchaseRequests(el); break;
      case 'petty-cash': Pages.pettyCash(el); break;
      case 'payroll-funding': Pages.payrollFunding(el); break;
      case 'it-tickets': Pages.itTickets(el); break;
      case 'erp-sales': Pages.sales(el); break;
      case 'erp-planning': Pages.planning(el); break;
      case 'erp-production': Pages.production(el); break;
      case 'erp-quality': Pages.quality(el); break;
      case 'engineering': Pages.engineering(el); break;
      case 'erp-maintenance': Pages.maintenance(el); break;
      case 'spare-parts': Pages.spareParts(el); break;
      case 'erp-suppliers': ERPSuppliers.renderAdmin(); break;
      case 'supplier-portal': ERPSuppliers.renderExternalPortal(); break;
      case 'logistics': Pages.logistics(el); break;
      case 'erp-fleet': Pages['erp-fleet'](el); break;
      case 'hr-ats': Pages.hrATS(el); break;
      case 'kpi-dashboard': Pages.kpiDashboard(el); break;
      case 'login-history': Pages.loginHistory(el); break;
      case 'activity-log-page': Pages.activityLog(el); break;
      case 'task-management': Pages.taskManagement(el); break;
      case 'internal-chat': Pages.internalChat(el); break;
      case 'calendar': Pages.calendar(el); break;
      case 'financial-reports': Pages.financialReports(el); break;
      case 'system-settings': Pages.systemSettings(el); break;
      case 'document-management': Pages.documentManagement(el); break;
      case 'approval-workflows': Pages.approvalWorkflows(el); break;
      case 'performance-reviews': Pages.performanceReviews(el); break;
      case 'training': Pages.training(el); break;
      case 'asset-assignment': Pages.assetAssignment(el); break;
      case 'absence-leave':
        if (typeof HRAbsenceModule !== 'undefined') HRAbsenceModule.renderDashboard(c);
        else c.innerHTML = '<p>Error loading Absence module.</p>';
        break;
      case 'employee-warnings': Pages.employeeWarnings(el); break;
      case 'ceo-dashboard': if (Pages['ceo-dashboard']) Pages['ceo-dashboard'](el); else el.innerHTML = 'Module loading...'; break;
      case 'activity-timeline': if (Pages['activity-timeline']) Pages['activity-timeline'](el); else el.innerHTML = 'Module loading...'; break;
      case 'dept-purchase-approvals': if (Pages['deptPurchaseApprovals']) Pages['deptPurchaseApprovals'](el); else el.innerHTML = 'Module loading...'; break;
      case 'dashboard':
        if (App.isOwner() && Pages['ceo-dashboard']) Pages['ceo-dashboard'](el);
        else Pages.empDashboard(el);
        break;
      default: Pages.empDashboard(el);
    }
  },

  // ========== MODAL HELPER ==========
  showModal: function (title, bodyHtml, footerHtml, isLg) {
    var mc = document.getElementById('modal-container');
    mc.innerHTML = '<div class="modal-overlay" id="modal-overlay"><div class="modal' + (isLg ? ' modal-lg' : '') + '" onclick="event.stopPropagation()">' +
      '<div class="modal-header"><h3>' + title + '</h3><button class="modal-close" id="modal-close-btn">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + bodyHtml + '</div>' +
      (footerHtml ? '<div class="modal-footer">' + footerHtml + '</div>' : '') +
      '</div></div>';
    document.getElementById('modal-overlay').addEventListener('click', function (e) { if (e.target === this) App.closeModal(); });
    document.getElementById('modal-close-btn').addEventListener('click', App.closeModal);
  },

  closeModal: function () { document.getElementById('modal-container').innerHTML = ''; },
};

// ========== ALL PAGES ==========
window.Pages = window.Pages || {};
// ----- OWNER DASHBOARD -----
Pages.ownerDashboard = function (el) {
  el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p>Loading Enterprise Command Center...</p></div>';

  Promise.all([
    sbClient.from('users').select('id, department, status'),
    sbClient.from('attendance').select('id, status, delay_minutes').eq('date', todayStr()),
    sbClient.from('inventory_items').select('id, name, quantity, min_quantity, category'),
    sbClient.from('it_tickets').select('id, status, priority'),
    sbClient.from('purchase_requests').select('id, status'),
    sbClient.from('purchase_orders').select('id, status')
  ]).then(function (results) {
    var users = results[0].data || [];
    var attendance = results[1].data || [];
    var inventory = results[2].data || [];
    var tickets = results[3].data || [];
    var purchReq = results[4].data || [];
    var purchOrd = results[5].data || [];

    var activeUsers = users.filter(function (u) { return u.status === 'active'; }).length;
    var presentCount = attendance.filter(function (a) { return a.status === 'present' || a.status === 'Closed Automatically' || a.status === 'checked_in'; }).length;
    var lowStock = inventory.filter(function (i) { return i.quantity <= i.min_quantity; }).length;
    var openTickets = tickets.filter(function (t) { return t.status !== 'resolved'; }).length;
    var pendingReqs = purchReq.filter(function (r) { return r.status === 'pending'; }).length;
    var pendingCash = purchOrd.filter(function (o) { return o.status === 'pending_approval'; }).length;

    var html = '<div class="owner-hero" style="background: linear-gradient(135deg, #0f172a, #3b82f6); border-radius: var(--radius-xl); padding: 40px; color: white; margin-bottom: 32px; box-shadow: 0 20px 40px rgba(59, 130, 246, 0.25); display: flex; align-items: center; justify-content: space-between; overflow: hidden; position: relative;">';
    html += '<div style="position:relative; z-index:2;">';
    html += '<h1 style="font-size: 2.2rem; margin-bottom: 10px; color: white; font-weight: 800; letter-spacing: -0.5px;">Enterprise Command Center</h1>';
    html += '<p style="opacity: 0.85; font-size: 1.15rem; max-width: 600px;">Welcome back, General Manager. Here is a real-time overview of all factory operations, resources, and departments.</p>';
    html += '</div>';
    html += '<div style="font-size: 120px; opacity: 0.1; position: absolute; right: 20px; top: -10px; transform: rotate(-15deg); pointer-events: none;">🏢</div>';
    html += '</div>';

    // Key Metrics Grid
    html += '<div class="stats-grid" style="margin-bottom: 32px;">';
    html += '<div class="stat-card" style="--stat-color:#6366f1; background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s;"><div class="stat-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><div class="stat-card-icon" style="width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(99,102,241,0.12); color:#6366f1;">' + icon('users', 24) + '</div></div><div class="stat-card-value" style="font-size:2rem; font-weight:800; margin-bottom:4px;">' + activeUsers + '</div><div class="stat-card-label" style="color:var(--text-muted); font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Active Workforce</div></div>';

    html += '<div class="stat-card" style="--stat-color:#22c55e; background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s;"><div class="stat-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><div class="stat-card-icon" style="width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(34,197,94,0.12); color:#22c55e;">' + icon('calendarCheck', 24) + '</div></div><div class="stat-card-value" style="font-size:2rem; font-weight:800; margin-bottom:4px;">' + presentCount + '</div><div class="stat-card-label" style="color:var(--text-muted); font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Present Today</div></div>';

    html += '<div class="stat-card" style="--stat-color:#f59e0b; background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s;"><div class="stat-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><div class="stat-card-icon" style="width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(245,158,11,0.12); color:#f59e0b;">' + icon('alertTriangle', 24) + '</div></div><div class="stat-card-value" style="font-size:2rem; font-weight:800; margin-bottom:4px;">' + lowStock + '</div><div class="stat-card-label" style="color:var(--text-muted); font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Low Stock Alerts</div></div>';

    html += '<div class="stat-card" style="--stat-color:#10b981; background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.3s;"><div class="stat-card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;"><div class="stat-card-icon" style="width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:rgba(16, 185, 129,0.12); color:#10b981;">' + icon('dollarSign', 24) + '</div></div><div class="stat-card-value" style="font-size:2rem; font-weight:800; margin-bottom:4px;">' + pendingCash + '</div><div class="stat-card-label" style="color:var(--text-muted); font-size:0.9rem; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Pending Petty Cash</div></div>';
    html += '</div>';

    // Department Modules Grid
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">';
    html += '<h3 style="font-size: 1.4rem; font-weight: 700;">Department Portals</h3>';
    html += '<span style="font-size:0.9rem; color:var(--text-muted);">Quick access to all ERP modules</span>';
    html += '</div>';

    html += '<div class="grid-3" style="gap: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">';

    // HR Module
    html += '<div onclick="App.navigate(\'employees\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#6366f1\'; this.style.boxShadow=\'0 12px 30px rgba(99,102,241,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(99,102,241,0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('users', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Human Resources (HR)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Workforce management, attendance tracking, payroll, and employee requests.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(99,102,241,0.1); color: #6366f1; font-size: 0.8rem; font-weight: 700;">' + activeUsers + ' Employees</span></div>';
    html += '</div>';

    // Inventory Module
    html += '<div onclick="App.navigate(\'inventory\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f59e0b\'; this.style.boxShadow=\'0 12px 30px rgba(245,158,11,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(245,158,11,0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('package', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Warehouse (المخازن)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Monitor stock levels, inventory transactions, and supply shortages.</p>';
    html += '<div>' + (lowStock > 0 ? '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(239,68,68,0.1); color: #ef4444; font-size: 0.8rem; font-weight: 700;">' + lowStock + ' Low Stock</span>' : '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); color: #22c55e; font-size: 0.8rem; font-weight: 700;">Stock Optimized</span>') + '</div>';
    html += '</div>';

    // Procurement Module
    html += '<div onclick="App.navigate(\'purchase-requests\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#3b82f6\'; this.style.boxShadow=\'0 12px 30px rgba(59,130,246,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(59,130,246,0.1); color: #3b82f6; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('shoppingCart', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Procurement (المشتريات)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Manage purchase requests, supplier quotations, and purchase orders.</p>';
    html += '<div>' + (pendingReqs > 0 ? '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 0.8rem; font-weight: 700;">' + pendingReqs + ' Pending Requests</span>' : '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); color: #22c55e; font-size: 0.8rem; font-weight: 700;">All Clear</span>') + '</div>';
    html += '</div>';

    // Finance Module
    html += '<div onclick="App.navigate(\'petty-cash\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#10b981\'; this.style.boxShadow=\'0 12px 30px rgba(16,185,129,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(16,185,129,0.1); color: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('dollarSign', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Finance (الحسابات)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Handle petty cash advances, settlements, payroll integration, and general ledger.</p>';
    html += '<div>' + (pendingCash > 0 ? '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(239,68,68,0.1); color: #ef4444; font-size: 0.8rem; font-weight: 700;">' + pendingCash + ' Pending Advances</span>' : '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); color: #22c55e; font-size: 0.8rem; font-weight: 700;">Up to Date</span>') + '</div>';
    html += '</div>';

    // IT Module
    html += '<div onclick="App.navigate(\'it-tickets\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#8b5cf6\'; this.style.boxShadow=\'0 12px 30px rgba(139,92,246,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(139,92,246,0.1); color: #8b5cf6; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('monitor', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">IT Support</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Manage system infrastructure, employee support tickets, and hardware maintenance.</p>';
    html += '<div>' + (openTickets > 0 ? '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(239,68,68,0.1); color: #ef4444; font-size: 0.8rem; font-weight: 700;">' + openTickets + ' Open Tickets</span>' : '<span style="padding: 6px 12px; border-radius: 20px; background: rgba(34,197,94,0.1); color: #22c55e; font-size: 0.8rem; font-weight: 700;">Systems Normal</span>') + '</div>';
    html += '</div>';

    // Production Module
    html += '<div onclick="App.navigate(\'erp-production\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#06b6d4\'; this.style.boxShadow=\'0 12px 30px rgba(6,182,212,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(6,182,212,0.1); color: #06b6d4; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('settings', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Production (الإنتاج)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Oversee factory lines, production orders, and daily output tracking.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(6,182,212,0.1); color: #06b6d4; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Sales Module
    html += '<div onclick="App.navigate(\'erp-sales\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f43f5e\'; this.style.boxShadow=\'0 12px 30px rgba(244,63,94,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(244,63,94,0.1); color: #f43f5e; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('shoppingBag', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Sales (المبيعات)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Monitor client orders, revenue, contracts, and product deliveries.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(244,63,94,0.1); color: #f43f5e; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Planning Module
    html += '<div onclick="App.navigate(\'erp-planning\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#8b5cf6\'; this.style.boxShadow=\'0 12px 30px rgba(139,92,246,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(139,92,246,0.1); color: #8b5cf6; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('calendar', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Planning (التخطيط)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Strategic planning, resource allocation, and factory timeline scheduling.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(139,92,246,0.1); color: #8b5cf6; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Quality Module
    html += '<div onclick="App.navigate(\'erp-quality\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#14b8a6\'; this.style.boxShadow=\'0 12px 30px rgba(20,184,166,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(20,184,166,0.1); color: #14b8a6; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('checkCircle', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Quality (الجودة)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">QC inspections, defect tracking, and factory standard compliance.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(20,184,166,0.1); color: #14b8a6; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Engineering Module
    html += '<div onclick="App.navigate(\'engineering\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#3b82f6\'; this.style.boxShadow=\'0 12px 30px rgba(59,130,246,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(59,130,246,0.1); color: #3b82f6; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('edit3', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Engineering (الهندسية)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Engineering projects, design approvals, technical specs, and supervision workflow.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(59,130,246,0.1); color: #3b82f6; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Maintenance Module
    html += '<div onclick="App.navigate(\'erp-maintenance\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f97316\'; this.style.boxShadow=\'0 12px 30px rgba(249,115,22,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(249,115,22,0.1); color: #f97316; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('tool', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Maintenance (الصيانة)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Equipment repairs, preventative maintenance schedules, and breakdown tracking.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(249,115,22,0.1); color: #f97316; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Logistics Module
    html += '<div onclick="App.navigate(\'logistics\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#0ea5e9\'; this.style.boxShadow=\'0 12px 30px rgba(14,165,233,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(14,165,233,0.1); color: #0ea5e9; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('mapPin', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Logistics & Transport (النقل)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Track vehicle movements, driver assignments, and trip destinations.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(14,165,233,0.1); color: #0ea5e9; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Legal Affairs Module
    if (App.isOwner() || (App.user && App.user.role === 'lawyer')) {
      html += '<div onclick="App.navigate(\'legal-affairs\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f43f5e\'; this.style.boxShadow=\'0 12px 30px rgba(244,63,94,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
      html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(244,63,94,0.1); color: #f43f5e; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('shield', 26) + '</div>';
      html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Legal Affairs (الشئون القانونية)</h3>';
      html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Company investigations, legal issues, and employee penalties.</p>';
      html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(244,63,94,0.1); color: #f43f5e; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
      html += '</div>';
    }

    // Suppliers Module
    html += '<div onclick="App.navigate(\'erp-suppliers\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f59e0b\'; this.style.boxShadow=\'0 12px 30px rgba(245,158,11,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(245,158,11,0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('truck', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Suppliers (الموردين)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Manage supplier directory, vendor ratings, and external contracts.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(245,158,11,0.1); color: #f59e0b; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Spare Parts Module
    html += '<div onclick="App.navigate(\'erp-spare-parts\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#10b981\'; this.style.boxShadow=\'0 12px 30px rgba(16,185,129,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(16,185,129,0.1); color: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('settings', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Spare Parts (قطع الغيار)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Spare parts inventory tracking, consumption, and requests.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(16,185,129,0.1); color: #10b981; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Nursing Module
    html += '<div onclick="App.navigate(\'nursing-medical-approvals\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#f43f5e\'; this.style.boxShadow=\'0 12px 30px rgba(244,63,94,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(244,63,94,0.1); color: #f43f5e; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('heart', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Nursing (التمريض)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Employee health records, medical checkups, sick leaves, and clinic visits.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(244,63,94,0.1); color: #f43f5e; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Cost Centers Module
    html += '<div onclick="App.navigate(\'cost-centers\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\'translateY(-5px)\'; this.style.borderColor=\'#2563eb\'; this.style.boxShadow=\'0 12px 30px rgba(37,99,235,0.15)\'" onmouseout="this.style.transform=\'none\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(37,99,235,0.1); color: #2563eb; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('pieChart', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Cost Centers (تكلفة الإدارات)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Department costs, analytics, expenses, and budget allocation.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(37,99,235,0.1); color: #2563eb; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    html += '</div>'; // End grid
    el.innerHTML = html;
  });
};

// ----- HR DASHBOARD -----
Pages.hrDashboard = function (el) {
  el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p>Loading Dashboard...</p></div>';

  var tds = todayStr();

  Promise.all([
    sbClient.from('users').select('*'),
    sbClient.from('attendance').select('*').eq('date', tds),
    sbClient.from('leave_requests').select('*'),
    sbClient.from('overtime').select('*'),
    sbClient.from('payroll').select('*'),
    sbClient.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
    sbClient.from('missions').select('*').eq('status', 'pending'),
    sbClient.from('loans').select('*').eq('status', 'pending'),
    sbClient.from('medical_requests').select('*').eq('status', 'pending'),
    sbClient.from('expenses').select('*').eq('status', 'pending')
  ]).then(function (results) {
    var employees = results[0].data || [];
    var attendance = results[1].data || [];
    var leaves = results[2].data || [];
    var overtime = results[3].data || [];
    var payroll = results[4].data || [];
    var announcements = results[5].data || [];
    var pendingMissions = results[6].data || [];
    var pendingLoans = results[7].data || [];
    var pendingMedical = results[8].data || [];
    var pendingExpenses = results[9].data || [];

    var totalEmployees = employees.length;
    var presentToday = attendance.filter(function (a) { return a.status === 'present' || a.status === 'Closed Automatically' || a.status === 'checked_in'; }).length;
    var absentToday = totalEmployees - presentToday;
    var pendingLeaves = leaves.filter(function (l) { return l.status === 'pending'; }).length;
    var pendingOvertime = overtime.filter(function (o) { return o.status === 'pending'; }).length;
    var totalPayroll = payroll.reduce(function (s, p) { return s + p.net_salary; }, 0);

    var html = '';

    // ===== QUICK CHECK-IN FOR HR/MANAGERS =====
    html += '<div style="display:flex; flex-wrap:wrap; gap:16px; justify-content:space-between; align-items:center; background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary)); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); direction: rtl; text-align: right;">';
    html += '<div><h3 style="margin:0; font-weight: 800; color: var(--text-primary); font-size: 1.3rem;">مرحباً بك! 👋</h3><p style="margin:6px 0 0; color: var(--text-secondary); font-size: 0.95rem;">نظام تسجيل حضور وانصراف الإدارة (مرن - 8 ساعات تلقائية بدون تأخير)</p></div>';
    html += '<button class="btn btn-primary" onclick="App.navigate(\'scan-checkin\')" style="font-size:1.05rem; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(99,102,241,0.3);">' + icon('scanLine') + ' تسجيل الحضور / الانصراف الآن</button>';
    html += '</div>';

    // ===== PENDING REQUESTS ALERT BANNER =====
    var alertItems = [];
    if (pendingLeaves > 0) alertItems.push({ count: pendingLeaves, label: 'طلب إجازة', labelEn: 'Leave Requests', icon: 'calendarDays', color: '#f59e0b', page: 'leaves' });
    if (pendingOvertime > 0) alertItems.push({ count: pendingOvertime, label: 'طلب عمل إضافي', labelEn: 'Overtime', icon: 'timer', color: '#06b6d4', page: 'overtime' });
    if (pendingMissions.length > 0) alertItems.push({ count: pendingMissions.length, label: 'طلب مأمورية', labelEn: 'Missions', icon: 'briefcase', color: '#8b5cf6', page: 'all-missions' });
    if (pendingLoans.length > 0) alertItems.push({ count: pendingLoans.length, label: 'طلب سلفة', labelEn: 'Loans', icon: 'creditCard', color: '#ec4899', page: 'loans' });
    if (pendingMedical.length > 0) alertItems.push({ count: pendingMedical.length, label: 'طلب طبي', labelEn: 'Medical', icon: 'heart', color: '#ef4444', page: 'medical-requests' });
    if (pendingExpenses.length > 0) alertItems.push({ count: pendingExpenses.length, label: 'طلب مصروفات', labelEn: 'Expenses', icon: 'receipt', color: '#14b8a6', page: 'expenses' });

    if (alertItems.length > 0) {
      var totalPending = alertItems.reduce(function (s, i) { return s + i.count; }, 0);
      html += '<style>';
      html += '@keyframes alert-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(245,158,11,0.25); } 50%{ box-shadow:0 0 20px 4px rgba(245,158,11,0.15); } }';
      html += '.pending-alert-banner { animation: alert-pulse 2.5s infinite; }';
      html += '</style>';
      html += '<div class="pending-alert-banner" style="margin-bottom:24px;padding:20px 24px;border-radius:var(--radius-lg);background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06));border:1.5px solid rgba(245,158,11,0.3);direction:rtl;text-align:right">';
      html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">';
      html += '<div style="width:44px;height:44px;border-radius:50%;background:rgba(245,158,11,0.15);display:flex;align-items:center;justify-content:center;color:#f59e0b;font-size:1.3rem;flex-shrink:0">⚠️</div>';
      html += '<div style="flex:1"><h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--text-primary)">🔔 يوجد ' + totalPending + ' طلب معلق يحتاج مراجعتك</h3>';
      html += '<p style="margin:4px 0 0;font-size:0.82rem;color:var(--text-secondary)">Pending requests need your attention</p></div></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px">';
      alertItems.forEach(function (item) {
        html += '<div onclick="App.navigate(\'' + item.page + '\')" style="cursor:pointer;padding:14px;border-radius:var(--radius-md);background:var(--bg-secondary);border:1px solid var(--border-color);display:flex;align-items:center;gap:10px;transition:all 0.2s" onmouseover="this.style.borderColor=\'' + item.color + '\';this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.borderColor=\'var(--border-color)\';this.style.transform=\'none\'">';
        html += '<div style="width:36px;height:36px;border-radius:8px;background:' + item.color + '18;display:flex;align-items:center;justify-content:center;color:' + item.color + '">' + icon(item.icon, 18) + '</div>';
        html += '<div><div style="font-size:1.15rem;font-weight:800;color:' + item.color + '">' + item.count + '</div>';
        html += '<div style="font-size:0.72rem;color:var(--text-muted)">' + item.label + '</div></div></div>';
      });
      html += '</div></div>';
    }

    html += '<div class="stats-grid">';
    html += _statCard('#6366f1', 'users', totalEmployees, 'Total Employees');
    html += _statCard('#22c55e', 'userCheck', presentToday, 'Present Today');
    html += _statCard('#ef4444', 'userX', absentToday, 'Absent Today');
    html += _statCard('#f59e0b', 'calendarCheck', pendingLeaves, 'Pending Leave Requests');
    html += _statCard('#06b6d4', 'clock', pendingOvertime, 'Pending Overtime');
    html += _statCard('#a855f7', 'dollarSign', 'EGP ' + totalPayroll.toLocaleString(), 'Total Payroll (This Month)');
    html += '</div>';

    html += '<div class="grid-2" style="margin-bottom:24px">';
    html += '<div class="card"><div class="card-header"><div><h3>Today\'s Attendance</h3><p>Employee check-in status overview</p></div></div><div class="chart-container" style="height:260px"><canvas id="chart-attendance"></canvas></div></div>';
    html += '<div class="card"><div class="card-header"><div><h3>Department Distribution</h3><p>Employees per department</p></div></div><div class="chart-container" style="height:260px"><canvas id="chart-dept"></canvas></div></div>';
    html += '</div>';

    html += '<div class="grid-2">';
    html += '<div class="card"><div class="card-header"><div><h3>Pending Leave Requests</h3><p>Awaiting your approval</p></div><button class="btn btn-sm btn-outline" onclick="App.navigate(\'leaves\')">View All</button></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead><tbody>';
    var pendingL = leaves.filter(function (l) { return l.status === 'pending'; }).slice(0, 4);
    if (pendingL.length === 0) html += '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:30px">No pending requests</td></tr>';
    pendingL.forEach(function (l) {
      html += '<tr><td style="color:var(--text-primary);font-weight:500">' + l.employee_name + '</td><td>' + l.type + '</td><td>' + l.days + '</td><td><span class="badge badge-warning"><span class="badge-dot"></span>Pending</span></td></tr>';
    });
    html += '</tbody></table></div></div></div>';

    html += '<div class="card"><div class="card-header"><div><h3>Recent Announcements</h3><p>Latest company updates</p></div><button class="btn btn-sm btn-outline" onclick="App.navigate(\'announcements\')">View All</button></div><div class="card-body" style="display:flex;flex-direction:column;gap:12px">';
    if (announcements.length === 0) html += '<p style="text-align:center;color:var(--text-muted);padding:20px">No announcements</p>';
    announcements.slice(0, 3).forEach(function (a) {
      html += '<div class="announcement-item ' + a.priority + '" style="margin-bottom:0"><div class="announcement-title">' + a.title + '</div><div class="announcement-msg" style="-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden">' + a.message + '</div><div class="announcement-meta"><span>' + formatDate(a.created_at) + '</span><span>' + a.department + '</span></div></div>';
    });
    html += '</div></div></div>';

    el.innerHTML = html;

    setTimeout(function () {
      var lateToday = attendance.filter(function (a) { return a.delay_minutes > 0 && a.date === tds; }).length;
      new Chart(document.getElementById('chart-attendance'), {
        type: 'doughnut', data: { labels: ['Present', 'Absent', 'Late'], datasets: [{ data: [presentToday, absentToday, lateToday], backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'], borderWidth: 0 }] },
        options: { cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 12 } } } }, maintainAspectRatio: false }
      });
      var deptCounts = {};
      DEPARTMENTS.forEach(function (d) { deptCounts[d] = 0; });
      employees.forEach(function (e) { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });
      new Chart(document.getElementById('chart-dept'), {
        type: 'bar', data: { labels: Object.keys(deptCounts), datasets: [{ data: Object.values(deptCounts), backgroundColor: ['#6366f1', '#06b6d4', '#f59e0b', '#22c55e'], borderWidth: 0, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false }, border: { display: false } }, y: { ticks: { color: '#64748b', stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.06)' }, border: { display: false } } } }
      });
    }, 50);
  });
};

Pages.empDashboard = function (el) {
  var user = App.user;
  el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p>Loading Your Dashboard...</p></div>';

  var d = new Date();
  var currentMonth = d.toISOString().substring(0, 7);
  var monthStart = currentMonth + '-01';
  var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  var monthEnd = currentMonth + '-' + lastDay;

  Promise.all([
    sbClient.from('attendance').select('*').eq('employee_id', user.id).eq('date', todayStr()).limit(1).single(),
    sbClient.from('leave_requests').select('*').eq('employee_id', user.id),
    sbClient.from('payroll').select('*').eq('employee_id', user.id).order('month', { ascending: false }).limit(1).single(),
    sbClient.from('overtime').select('hours').eq('employee_id', user.id),
    sbClient.from('announcements').select('*').order('created_at', { ascending: false }).limit(5),
    sbClient.from('attendance').select('id, date, delay_minutes').eq('employee_id', user.id).gte('date', monthStart).lte('date', monthEnd),
    sbClient.from('salary_adjustments').select('*').eq('employee_id', user.id).eq('status', 'approved').eq('month', currentMonth)
  ]).then(function (results) {
    var todayAtt = results[0].data || null;
    var myLeaves = results[1].data || [];
    var latestPay = results[2].data || null;
    var myOvertime = results[3].data || [];
    var announcements = results[4].data || [];
    var monthAttendance = results[5].data || [];
    var monthAdjustments = results[6].data || [];

    var pendingL = myLeaves.filter(function (l) { return l.status === 'pending'; }).length;
    var insurance = calculateInsuranceDuration(user.insurance_start);
    var empShiftSystem = user.shift_system || '3-shift';
    var shift = getShiftConfig(user.shift, empShiftSystem);
    var totalOT = myOvertime.reduce(function (s, o) { return s + o.hours; }, 0);
    var hasInsurance = user.insurance_start && user.insurance_active;

    // ===== DAILY SALARY TRACKER CALCULATION =====
    var baseSalary = user.base_salary || 0;
    var dailyRate = Math.round(baseSalary / 30);
    
    var todayDate = new Date();
    var dayOfMonth = todayDate.getDate();
    var monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    var currentMonthName = monthNames[todayDate.getMonth()];

    // Build a map of attendance with late deduction per day
    var attDatesMap = {};
    var earnedSoFar = 0;
    var totalLateDeduction = 0;
    monthAttendance.forEach(function (att) {
      var dm = att.delay_minutes || 0;
      var lateDed = 0;
      if (dm > 360) lateDed = dailyRate * 1;
      else if (dm > 120) lateDed = dailyRate * 0.5;
      else if (dm > 15) lateDed = dailyRate * 0.25;
      lateDed = Math.round(lateDed);
      // Net for this day: dailyRate - late deduction (never below 0)
      var dayNet = Math.max(0, dailyRate - lateDed);
      totalLateDeduction += lateDed;
      earnedSoFar += dayNet;
      attDatesMap[att.date] = { record: att, lateDed: lateDed, dayNet: dayNet };
    });

    var firstActiveDay = dayOfMonth;
    if (monthAttendance.length === 0) {
      firstActiveDay = 99; // no active days, all fridays unpaid
    } else {
      monthAttendance.forEach(function (att) {
        var dayNum = parseInt(att.date.split('-')[2], 10);
        if (dayNum < firstActiveDay) firstActiveDay = dayNum;
      });
      myLeaves.forEach(function(lv) {
        if (lv.start_date >= monthStart && lv.start_date <= monthEnd && lv.status === 'approved') {
          var dayNum = parseInt(lv.start_date.split('-')[2], 10);
          if (dayNum < firstActiveDay) firstActiveDay = dayNum;
        }
      });
    }

    var fridaysPassed = 0;
    for (var fDay = 1; fDay <= dayOfMonth; fDay++) {
      if (new Date(todayDate.getFullYear(), todayDate.getMonth(), fDay).getDay() === 5) {
         if (fDay >= firstActiveDay) fridaysPassed++;
      }
    }
    earnedSoFar += (fridaysPassed * dailyRate);
    var daysWorked = monthAttendance.length + fridaysPassed;

    // Calculate bonuses and penalties from salary_adjustments
    var totalBonuses = 0;
    var totalPenalties = 0;
    monthAdjustments.forEach(function (adj) {
      if (adj.type === 'bonus') totalBonuses += (adj.amount || 0);
      else totalPenalties += (adj.amount || 0);
    });

    // Net can only go negative from penalties (جزاءات)
    var netAccumulated = earnedSoFar + totalBonuses - totalPenalties;
    var salaryProgress = baseSalary > 0 ? Math.round((earnedSoFar / baseSalary) * 100) : 0;

    var html = '<div class="profile-header" style="flex-wrap:wrap"><div style="display:flex;align-items:center;gap:15px"><div class="profile-avatar" style="background:' + (user.avatar_color || '#6366f1') + '">' + getInitials(user.full_name) + '</div>' +
      '<div class="profile-info"><h2>Welcome back, ' + user.full_name.split(' ')[0] + '! 👋</h2><div class="profile-meta">' +
      '<span>🏢 ' + user.department + '</span><span>💼 ' + user.position + '</span><span>🆔 ' + user.employee_id + '</span>' +
      '<span class="shift-badge shift-' + user.shift + '">' + icon('clock', 12) + ' ' + (shift ? shift.label + ' (' + shift.start + '-' + shift.end + ')' : '') + '</span></div></div></div>';
      
    if (App.isHR() || App.isOwner()) {
      html += '<div style="margin-left:auto"><button class="btn btn-primary" onclick="App.navigate(\'hr-admin\')" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,0.3);font-size:1.05rem">' + icon('shield', 18) + ' لوحة الإدارة والطلبات</button></div>';
    }
    html += '</div>';

    // ===== DAILY SALARY TRACKER CARD =====
    html += '<div style="margin-bottom:24px;padding:24px;border-radius:var(--radius-lg);background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(6,182,212,0.04));border:1.5px solid rgba(99,102,241,0.2);direction:rtl;text-align:right">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">';
    html += '<div style="width:44px;height:44px;border-radius:50%;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem">💰</div>';
    html += '<div style="flex:1"><h3 style="margin:0;font-size:1.1rem;font-weight:800;color:var(--text-primary)">مرتبك التراكمي لشهر ' + currentMonthName + ' (يوم ' + dayOfMonth + ')</h3>';
    html += '<p style="margin:4px 0 0;font-size:0.78rem;color:var(--text-secondary)">يبدأ من 0 يوم 1 في الشهر ويزيد كل يوم حضور بمقدار ' + dailyRate.toLocaleString() + ' ج.م</p></div></div>';

    // Big Net Amount - always the accumulated total including bonuses/penalties
    html += '<div style="text-align:center;margin-bottom:18px">';
    html += '<div style="font-size:2.2rem;font-weight:900;color:var(--accent-primary);letter-spacing:-1px">EGP ' + netAccumulated.toLocaleString() + '</div>';
    html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">صافي المرتب التراكمي (شامل المكافآت والجزاءات لـ ' + daysWorked + ' يوم)</div>';
    html += '</div>';

    // Progress bar
    html += '<div style="margin-bottom:18px">';
    html += '<div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-bottom:6px"><span>' + netAccumulated.toLocaleString() + ' ج.م (صافي)</span><span>' + baseSalary.toLocaleString() + ' ج.م (المرتب الكامل)</span></div>';
    html += '<div style="width:100%;height:12px;background:var(--bg-secondary);border-radius:6px;overflow:hidden">';
    html += '<div style="width:' + Math.min(salaryProgress, 100) + '%;height:100%;background:linear-gradient(90deg,#6366f1,#06b6d4);border-radius:6px;transition:width 0.6s ease"></div>';
    html += '</div>';
    html += '<div style="text-align:center;font-size:0.75rem;color:var(--accent-primary);margin-top:4px;font-weight:700">' + salaryProgress + '% من المرتب</div>';
    html += '</div>';

    // Breakdown grid - only positives + penalties if any
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">';
    html += '<div style="padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);border-right:3px solid #6366f1"><div style="font-size:0.7rem;color:var(--text-muted)">صافي مجمّع</div><div style="font-size:1rem;font-weight:800;color:var(--text-primary)">' + netAccumulated.toLocaleString() + ' ج.م</div></div>';
    html += '<div style="padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);border-right:3px solid #06b6d4"><div style="font-size:0.7rem;color:var(--text-muted)">اليومية</div><div style="font-size:1rem;font-weight:800;color:#06b6d4">' + dailyRate.toLocaleString() + ' ج.م</div></div>';
    if (totalBonuses > 0) html += '<div style="padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);border-right:3px solid #22c55e"><div style="font-size:0.7rem;color:var(--text-muted)">مكافآت</div><div style="font-size:1rem;font-weight:800;color:#22c55e">+' + totalBonuses.toLocaleString() + '</div></div>';
    if (totalPenalties > 0) html += '<div style="padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);border-right:3px solid #ef4444"><div style="font-size:0.7rem;color:var(--text-muted)">جزاءات</div><div style="font-size:1rem;font-weight:800;color:#ef4444">-' + totalPenalties.toLocaleString() + '</div></div>';
    if (totalLateDeduction > 0) html += '<div style="padding:12px;background:var(--bg-secondary);border-radius:var(--radius-md);border-right:3px solid #f59e0b"><div style="font-size:0.7rem;color:var(--text-muted)">إجمالي خصم تأخيرات</div><div style="font-size:1rem;font-weight:800;color:#f59e0b">' + totalLateDeduction.toLocaleString() + ' ج.م</div></div>';
    html += '</div>';

    // ===== DAY-BY-DAY BREAKDOWN TABLE (from 1st of month) =====
    html += '<div style="margin-top:18px;border-top:1px solid var(--border-color);padding-top:16px">';
    html += '<h4 style="font-weight:800;font-size:0.9rem;margin-bottom:12px;display:flex;align-items:center;gap:8px">' + icon('calendarCheck', 16) + ' تفصيل يومي من 1/' + (todayDate.getMonth() + 1) + '</h4>';
    html += '<div style="max-height:280px;overflow-y:auto;border-radius:var(--radius-md);border:1px solid var(--border-color)">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem">';
    html += '<thead><tr style="background:var(--bg-secondary);position:sticky;top:0">';
    html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:var(--text-secondary)">اليوم</th>';
    html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:var(--text-secondary)">التاريخ</th>';
    html += '<th style="padding:10px 12px;text-align:center;font-weight:700;color:var(--text-secondary)">الحالة</th>';
    html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:var(--text-secondary)">مكتسب اليوم</th>';
    html += '<th style="padding:10px 12px;text-align:right;font-weight:700;color:var(--text-secondary)">الإجمالي التراكمي</th>';
    html += '</tr></thead><tbody>';

    var monthLeaves = myLeaves.filter(function (l) { return l.status === 'approved' && l.start_date <= monthEnd && l.end_date >= monthStart; });

    var cumulative = 0;
    var dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (var d = 1; d <= dayOfMonth; d++) {
      var dateStr = currentMonth + '-' + (d < 10 ? '0' + d : d);
      var dateObj = new Date(dateStr + 'T00:00:00');
      var dayName = dayNames[dateObj.getDay()];
      var isFriday = dateObj.getDay() === 5;
      var attInfo = attDatesMap[dateStr];
      var leaveInfo = monthLeaves.find(function (l) { return dateStr >= l.start_date && dateStr <= l.end_date; });
      var dayEarned = 0;
      var statusBadge = '';
      var rowBg = '';
      var earnLabel = '-';

      if (isFriday) {
        if (d >= firstActiveDay) {
          dayEarned = dailyRate;
          cumulative += dayEarned;
          statusBadge = '<span style="background:rgba(99,102,241,0.1);color:#6366f1;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">إجازة رسمية مدفوعة</span>';
          earnLabel = '<span style="color:#6366f1">+' + dayEarned.toLocaleString() + '</span>';
        } else {
          statusBadge = '<span style="background:rgba(156,163,175,0.1);color:#9ca3af;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">إجازة رسمية (قبل التعيين)</span>';
          earnLabel = '<span style="color:#9ca3af">-</span>';
        }
        rowBg = 'background:rgba(99,102,241,0.03);';
      } else if (attInfo) {
        dayEarned = attInfo.dayNet;
        cumulative += dayEarned;
        if (attInfo.lateDed > 0) {
          statusBadge = '<span style="background:rgba(245,158,11,0.1);color:#f59e0b;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">⚠️ حاضر (خصم تأخير)</span>';
          rowBg = 'background:rgba(245,158,11,0.02);';
          earnLabel = '<span style="color:#22c55e">+' + dayEarned.toLocaleString() + '</span> <span style="font-size:0.65rem;color:#f59e0b">(خصم ' + attInfo.lateDed.toLocaleString() + ')</span>';
        } else {
          statusBadge = '<span style="background:rgba(34,197,94,0.1);color:#22c55e;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">✅ حاضر</span>';
          rowBg = 'background:rgba(34,197,94,0.02);';
          earnLabel = '<span style="color:#22c55e">+' + dayEarned.toLocaleString() + '</span>';
        }
      } else if (leaveInfo) {
        dayEarned = Number(leaveInfo.days) === 0.5 ? dailyRate * 0.5 : dailyRate;
        cumulative += dayEarned;
        statusBadge = '<span style="background:rgba(59,130,246,0.1);color:#3b82f6;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">⛱️ إجازة معتمدة</span>';
        rowBg = 'background:rgba(59,130,246,0.02);';
        earnLabel = '<span style="color:#3b82f6">+' + dayEarned.toLocaleString() + '</span>';
      } else if (d < dayOfMonth) {
        statusBadge = '<span style="background:rgba(239,68,68,0.1);color:#ef4444;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">❌ غائب</span>';
        rowBg = 'background:rgba(239,68,68,0.02);';
      } else {
        statusBadge = '<span style="background:rgba(245,158,11,0.1);color:#f59e0b;padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600">⏳ اليوم</span>';
      }

      var barWidth = baseSalary > 0 ? Math.round((cumulative / baseSalary) * 100) : 0;
      html += '<tr style="border-bottom:1px solid var(--border-color);' + rowBg + '">';
      html += '<td style="padding:8px 12px;font-weight:600;color:var(--text-primary)">' + dayName + '</td>';
      html += '<td style="padding:8px 12px;color:var(--text-secondary);direction:ltr;text-align:right">' + d + '/' + (todayDate.getMonth() + 1) + '</td>';
      html += '<td style="padding:8px 12px;text-align:center">' + statusBadge + '</td>';
      html += '<td style="padding:8px 12px;font-weight:700">' + earnLabel + '</td>';
      html += '<td style="padding:8px 12px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg-secondary);border-radius:3px;overflow:hidden;min-width:50px"><div style="width:' + barWidth + '%;height:100%;background:linear-gradient(90deg,#6366f1,#06b6d4);border-radius:3px"></div></div><span style="font-weight:800;color:var(--text-primary);min-width:70px;text-align:left;font-size:0.78rem">' + cumulative.toLocaleString() + '</span></div></td>';
      html += '</tr>';
    }
    html += '</tbody></table></div></div>';

    html += '</div>';

    html += '<div class="stats-grid">';
    var attStatus = todayAtt ? (todayAtt.check_out ? 'Completed' : 'Checked In') : 'Not Checked In';
    var attColor = todayAtt ? '#22c55e' : '#f59e0b';
    html += '<div class="stat-card" style="--stat-color:' + attColor + ';cursor:pointer" onclick="App.navigate(\'my-attendance\')"><div class="stat-card-header"><div class="stat-card-icon" style="background:' + (todayAtt ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)') + '">' + icon('calendarCheck', 20) + '</div></div><div class="stat-card-value" style="font-size:1.2rem">' + attStatus + '</div><div class="stat-card-label">Today\'s Status</div></div>';
    html += '<div class="stat-card" style="--stat-color:#6366f1;cursor:pointer" onclick="App.navigate(\'my-leaves\')"><div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(99,102,241,0.12)">' + icon('calendarDays', 20) + '</div>' + (pendingL > 0 ? '<span class="stat-card-trend down">' + pendingL + ' pending</span>' : '') + '</div><div class="stat-card-value">' + myLeaves.length + '</div><div class="stat-card-label">Leave Requests</div></div>';
    html += '<div class="stat-card" style="--stat-color:#06b6d4;cursor:pointer" onclick="App.navigate(\'my-salary\')"><div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(6,182,212,0.12)">' + icon('dollarSign', 20) + '</div></div><div class="stat-card-value">EGP ' + (latestPay ? latestPay.net_salary.toLocaleString() : '—') + '</div><div class="stat-card-label">Latest Salary</div></div>';
    html += '<div class="stat-card" style="--stat-color:#a855f7;cursor:pointer" onclick="App.navigate(\'my-overtime\')"><div class="stat-card-header"><div class="stat-card-icon" style="background:rgba(168,85,247,0.12)">' + icon('timer', 20) + '</div></div><div class="stat-card-value">' + totalOT + 'h</div><div class="stat-card-label">Overtime Hours</div></div>';
    html += '</div>';

    html += '<div class="grid-2" style="margin-bottom:24px">';
    if (hasInsurance) {
      var isFutureIns = new Date(user.insurance_start) > new Date();
      var insStatusText = isFutureIns ? '⏳ Pending — Starts ' + formatDate(user.insurance_start) : '✅ Active — Started ' + formatDate(user.insurance_start);
      html += '<div class="insurance-card"><div style="display:flex;align-items:center;gap:10px">' + icon('shield', 22) + '<div><h3 style="font-size:1rem;font-weight:700">Insurance Status</h3><p style="font-size:0.8rem;color:var(--text-tertiary)">' + insStatusText + '</p></div></div>';
      html += '<div class="insurance-grid"><div class="insurance-stat"><div class="value">' + insurance.years + '</div><div class="label">Years</div></div><div class="insurance-stat"><div class="value">' + insurance.months + '</div><div class="label">Months</div></div><div class="insurance-stat"><div class="value">' + insurance.days + '</div><div class="label">Days</div></div><div class="insurance-stat"><div class="value">' + insurance.totalDays + '</div><div class="label">Total Days</div></div></div></div>';
    } else {
      html += '<div style="padding:20px;background:rgba(239,68,68,0.08);border-radius:var(--radius-lg);border:1px solid rgba(239,68,68,0.15)"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:1.5rem">🚫</span><div><h3 style="font-size:1rem;font-weight:700">No Insurance</h3><p style="font-size:0.8rem;color:var(--accent-danger)">Salary divided by 30 working days</p></div></div></div>';
    }

    html += '<div class="card"><div class="card-header"><div><h3>Today\'s Attendance</h3><p>' + formatDate(new Date()) + '</p></div>';
    if (user.role !== 'owner') html += '<button class="btn btn-sm btn-primary" onclick="App.navigate(\'scan-checkin\')">QR Check-In ' + icon('arrowRight') + '</button>';
    html += '</div><div class="card-body">';
    if (todayAtt) {
      html += '<div style="display:flex;flex-direction:column;gap:14px">';
      html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-tertiary);font-size:0.82rem">Check In</span><span style="font-weight:600">' + formatTime(todayAtt.check_in) + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-tertiary);font-size:0.82rem">Check Out</span><span style="font-weight:600">' + (todayAtt.check_out ? formatTime(todayAtt.check_out) : '—') + '</span></div>';
      html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-tertiary);font-size:0.82rem">Working Hours</span><span style="font-weight:600">' + (todayAtt.working_hours || 0) + 'h</span></div>';
      if (todayAtt.delay_minutes > 0) html += '<div style="display:flex;justify-content:space-between"><span style="color:var(--accent-warning);font-size:0.82rem">⚠️ Late by</span><span style="font-weight:600;color:var(--accent-warning)">' + formatDelay(todayAtt.delay_minutes) + '</span></div>';
      html += '</div>';
    } else {
      html += '<div class="empty-state" style="padding:30px">' + icon('alertTriangle', 32) + '<p>You haven\'t checked in today</p><button class="btn btn-primary btn-sm" onclick="App.navigate(\'scan-checkin\')">Go to QR Check-In</button></div>';
    }
    html += '</div></div></div>';

    html += '<div class="card"><div class="card-header"><div><h3>📢 Recent Announcements</h3><p>Stay updated with the latest news</p></div><button class="btn btn-sm btn-outline" onclick="App.navigate(\'announcements\')">View All</button></div><div class="card-body" style="display:flex;flex-direction:column;gap:12px">';
    var visibleAnnouncements = announcements.filter(function (a) { return a.department === 'All' || a.department.indexOf(user.department) !== -1; }).slice(0, 3);
    if (visibleAnnouncements.length === 0) html += '<p style="color:var(--text-muted);text-align:center;padding:10px 0;">No announcements</p>';
    visibleAnnouncements.forEach(function (a) {
      html += '<div class="announcement-item ' + a.priority + '" style="margin-bottom:0"><div class="announcement-title">' + a.title + '</div><div class="announcement-msg">' + a.message + '</div><div class="announcement-meta"><span>' + formatDate(a.created_at) + '</span></div></div>';
    });
    html += '</div></div>';

    el.innerHTML = html;
  });
};

Pages.employees = function (el) {
  var employees = [];
  var search = '';
  var deptFilter = '';

  var DOC_LIST = [
    "شهاده الميلاد",
    "صوره البطاقه",
    "شهاده المؤهل الدراسي",
    "شهاده الخدمه العسكريه",
    "6 صور 4*6",
    "فيش و تشبيه",
    "برنت تأمينات",
    "كعب عمل",
    "مزاوله مهنه"
  ];

  function render() {
    var filtered = employees.filter(function (e) {
      var matchSearch = !search || e.full_name.toLowerCase().indexOf(search.toLowerCase()) !== -1 || (e.employee_id && e.employee_id.toLowerCase().indexOf(search.toLowerCase()) !== -1) || (e.email && e.email.toLowerCase().indexOf(search.toLowerCase()) !== -1);
      var matchDept = !deptFilter || e.department === deptFilter;
      return matchSearch && matchDept;
    });

    var isHR = App.isHR();
    var html = '<div class="toolbar"><div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search by name, ID or email..." id="emp-search" value="' + (search || '').replace(/"/g, '&quot;') + '"></div>';
    html += '<select class="filter-select" id="emp-dept-filter"><option value="">All Departments</option>';
    DEPARTMENTS.forEach(function (d) { html += '<option value="' + d + '"' + (deptFilter === d ? ' selected' : '') + '>' + d + '</option>'; });
    html += '</select>';
    if (isHR) html += '<button class="btn btn-primary" id="add-emp-btn">' + icon('plus') + ' Add Employee</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>All Employees</h3><p>' + filtered.length + ' employees found</p></div></div><div class="card-body no-pad">';
    if (filtered.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:var(--text-muted)">No employees found</div>';
    } else {
      var grouped = {};
      filtered.forEach(function(emp) {
        var d = emp.department || 'Unknown';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(emp);
      });
      
      var sortedDepts = Object.keys(grouped).sort();
      sortedDepts.forEach(function(d) {
        html += '<div style="background:var(--bg-tertiary);padding:12px 20px;font-weight:700;font-size:0.95rem;border-bottom:1px solid var(--border-color);border-top:1px solid var(--border-color);color:var(--accent-primary);display:flex;align-items:center;gap:10px;">' + icon('users') + ' ' + (window.t ? t(d) : d) + ' <span class="badge badge-neutral" style="font-size:0.7rem">' + grouped[d].length + ' Employees</span></div>';
        html += '<div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>ID</th><th>Position</th><th>Shift System</th><th>Shift</th><th>Status</th><th>Docs</th><th>Actions</th></tr></thead><tbody>';
        grouped[d].forEach(function (emp) {
          var empEmail = emp.email || 'No email';
          var empShiftSystem = emp.shift_system || '3-shift';
          var shiftConf = getShiftConfig(emp.shift, empShiftSystem);
          var sysLabel = empShiftSystem === '2-shift' ? '2-Shift (12h)' : '3-Shift (8h)';
          html += '<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="sidebar-avatar" style="background:' + (emp.avatar_color || '#e11d48') + ';width:32px;height:32px;font-size:0.7rem">' + getInitials(emp.full_name) + '</div><div><div style="color:var(--text-primary);font-weight:600;font-size:0.85rem">' + emp.full_name + '</div><div style="font-size:0.72rem;color:var(--text-muted)">' + empEmail + '</div></div></div></td>';
          html += '<td><code style="color:var(--accent-primary);font-size:0.78rem">' + emp.employee_id + '</code></td><td>' + (window.t ? t(emp.position || '—') : (emp.position || '—')) + '</td>';
          html += '<td><span class="badge badge-info" style="font-size:0.72rem">' + sysLabel + '</span></td>';
          html += '<td><span class="shift-badge shift-' + emp.shift + '">' + icon('clock', 11) + ' ' + shiftConf.label + ' (' + shiftConf.start + '-' + shiftConf.end + ')</span></td>';
          html += '<td><span class="badge badge-success"><span class="badge-dot"></span>' + emp.status + '</span></td>';
          var docsHtml = emp.documents_complete ? '<span class="badge badge-info" style="cursor:pointer" data-doc-complete="' + emp.id + '" title="View Documents">' + icon('checkCheck', 12) + ' Complete</span>' : '<button class="btn btn-xs btn-warning" data-doc-complete="' + emp.id + '" title="Manage Documents">?? Missing</button>';
          html += '<td>' + docsHtml + '</td>';
          html += '<td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-icon" data-view="' + emp.id + '" title="View">' + icon('eye') + '</button>';
          if (isHR) html += '<button class="btn btn-ghost btn-icon" data-edit="' + emp.id + '" title="Edit">' + icon('edit') + '</button><button class="btn btn-ghost btn-icon" data-del="' + emp.id + '" title="Delete" style="color:var(--accent-danger)">' + icon('trash') + '</button>';
          html += '</div></td></tr>';
        });
        html += '</tbody></table></div>';
      });
    }
    html += '</div></div>';


    el.innerHTML = html;

    // Restore focus to search input after re-render
    var searchEl = document.getElementById('emp-search');
    if (searchEl && search) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }

    // Events
    document.getElementById('emp-search').addEventListener('input', function () { search = this.value; render(); });
    document.getElementById('emp-dept-filter').addEventListener('change', function () { deptFilter = this.value; render(); });
    if (isHR) {
      var addBtn = document.getElementById('add-emp-btn');
      if (addBtn) addBtn.addEventListener('click', function () { showEmpModal(); });
    }
    document.querySelectorAll('[data-view]').forEach(function (btn) { btn.addEventListener('click', function () { showEmpView(this.getAttribute('data-view')); }); });
    if (isHR) {
      document.querySelectorAll('[data-edit]').forEach(function (btn) { btn.addEventListener('click', function () { showEmpModal(this.getAttribute('data-edit')); }); });
      document.querySelectorAll('[data-del]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = this.getAttribute('data-del');
          if (confirm('Are you sure you want to remove this employee?')) {
            sbClient.from('users').delete().eq('id', id).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
            employees = employees.filter(function (e) { return e.id !== id; });
            render();
          }
        });
      });
    }

    // Document Checklist
    document.querySelectorAll('[data-doc-complete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-doc-complete');
        var emp = employees.find(function (e) { return e.id === id; });
        var savedState = {};
        try { savedState = JSON.parse(localStorage.getItem('doc_state_' + id)) || {}; } catch (e) { }

        var body = '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">';
        body += '<div style="background:var(--bg-secondary);padding:14px;border-radius:var(--radius-md);margin-bottom:8px"><h4 style="margin:0 0 4px 0;font-size:0.95rem;font-weight:700">الاوراق المطلوبه</h4><p style="margin:0;font-size:0.8rem;color:var(--text-muted)">Check the boxes as the documents are physically submitted.</p></div>';

        DOC_LIST.forEach(function (doc, idx) {
          var isChecked = (emp.documents_complete || savedState[idx]) ? 'checked' : '';
          body += '<label style="display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border-color);border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s" class="doc-chk-lbl"><input type="checkbox" class="doc-chk" data-idx="' + idx + '" ' + isChecked + ' style="width:20px;height:20px;accent-color:var(--accent-primary);flex-shrink:0"> <span style="font-weight:600;font-size:0.9rem">' + doc + '</span></label>';
        });
        body += '</div>';

        var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-docs-btn">Save Status</button>';
        App.showModal('Required Documents - ' + emp.full_name, body, footer, true);

        // Highlight selected items
        document.querySelectorAll('.doc-chk').forEach(function (chk) {
          var updateStyle = function () {
            var lbl = chk.parentElement;
            if (chk.checked) { lbl.style.background = 'rgba(99, 102, 241, 0.08)'; lbl.style.borderColor = 'var(--accent-primary)'; }
            else { lbl.style.background = 'transparent'; lbl.style.borderColor = 'var(--border-color)'; }
          };
          chk.addEventListener('change', updateStyle);
          updateStyle();
        });

        document.getElementById('save-docs-btn').addEventListener('click', function () {
          var newState = {};
          var allChecked = true;
          document.querySelectorAll('.doc-chk').forEach(function (chk) {
            newState[chk.getAttribute('data-idx')] = chk.checked;
            if (!chk.checked) allChecked = false;
          });
          localStorage.setItem('doc_state_' + id, JSON.stringify(newState));

          if (allChecked !== emp.documents_complete) {
            sbClient.from('users').update({ documents_complete: allChecked }).eq('id', id).then(function (r) {
              if (r && r.error) { alert('Error updating database: ' + r.error.message); return; }
              emp.documents_complete = allChecked;
              render();
              if (allChecked) showToast('All documents submitted!', 'success');
              else showToast('Document status updated', 'info');
              App.closeModal();
            });
          } else {
            // Unchanged complete status, just close
            App.closeModal();
            showToast('Document checklist saved internally', 'info');
          }
        });
      });
    });
  }

  function showEmpView(id) {
    var emp = employees.find(function (e) { return e.id === id; });
    if (!emp) return;
    var ins = calculateInsuranceDuration(emp.insurance_start);
    var empShiftSystem = emp.shift_system || '3-shift';
    var shiftConf = getShiftConfig(emp.shift, empShiftSystem);
    var hasInsurance = emp.insurance_start && emp.insurance_active;
    var body = '<div class="profile-header" style="margin-bottom:20px"><div class="profile-avatar" style="background:' + (emp.avatar_color || '#6366f1') + '">' + getInitials(emp.full_name) + '</div><div class="profile-info"><h2>' + emp.full_name + '</h2><div class="profile-meta"><span>🆔 ' + emp.employee_id + '</span><span>🏢 ' + emp.department + '</span><span>💼 ' + (emp.position || '—') + '</span></div></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Email</label><input value="' + (emp.email || 'No email') + '" readonly class="form-input" style="padding:10px 14px"></div><div class="form-field"><label>Phone</label><input value="' + (emp.phone || '—') + '" readonly class="form-input" style="padding:10px 14px"></div></div>';
    var isDailyView = emp.position && emp.position.indexOf('(عامل يومية)') !== -1;
    var displayedSalary = isDailyView ? Math.round((emp.base_salary || 0) / 30) : (emp.base_salary || 0);
    body += '<div class="form-row"><div class="form-field"><label>Hire Date</label><input value="' + formatDate(emp.hire_date) + '" readonly class="form-input" style="padding:10px 14px"></div><div class="form-field"><label>' + (isDailyView ? 'Daily Wage' : 'Base Salary') + '</label><input value="EGP ' + displayedSalary.toLocaleString() + (isDailyView ? ' / day' : '') + '" readonly class="form-input" style="padding:10px 14px"></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Shift System</label><input value="' + (empShiftSystem === '2-shift' ? '2-Shift (12h)' : '3-Shift (8h)') + '" readonly class="form-input" style="padding:10px 14px"></div><div class="form-field"><label>Shift</label><input value="' + shiftConf.label + ' (' + shiftConf.start + ' - ' + shiftConf.end + ')" readonly class="form-input" style="padding:10px 14px"></div></div>';
    if (hasInsurance) {
      var isFutureEmpIns = new Date(emp.insurance_start) > new Date();
      var empInsText = isFutureEmpIns ? 'Pending: Starts ' + formatDate(emp.insurance_start) : 'Active since ' + formatDate(emp.insurance_start);
      body += '<div class="insurance-card" style="margin-top:16px"><div style="display:flex;align-items:center;gap:8px">' + icon('shield') + '<span style="font-weight:600">Insurance: ' + empInsText + '</span></div><div class="insurance-grid" style="margin-top:12px"><div class="insurance-stat"><div class="value">' + ins.years + '</div><div class="label">Years</div></div><div class="insurance-stat"><div class="value">' + ins.months + '</div><div class="label">Months</div></div><div class="insurance-stat"><div class="value">' + ins.days + '</div><div class="label">Days</div></div><div class="insurance-stat"><div class="value">' + ins.totalDays + '</div><div class="label">Total Days</div></div></div></div>';
    } else {
      body += '<div style="margin-top:16px;padding:16px;background:rgba(239,68,68,0.08);border-radius:var(--radius-md);border:1px solid rgba(239,68,68,0.2);display:flex;align-items:center;gap:10px"><span style="font-size:1.2rem">🚫</span><span style="font-weight:600;color:var(--accent-danger)">No Insurance — Salary divided by 30 days</span></div>';
    }
    App.showModal('Employee Profile', body, '', true);
  }

  function showEmpModal(editId) {
    var emp = editId ? employees.find(function (e) { return e.id === editId; }) : null;
    var currentSystem = emp ? (emp.shift_system || '3-shift') : '3-shift';
    var currentShift = emp ? (emp.shift || 'morning') : 'morning';

    var body = '<div class="form-row"><div class="form-field"><label>Full Name *</label><input id="ef-name" value="' + (emp ? emp.full_name : '') + '" placeholder="e.g. Ahmed Hassan"></div><div class="form-field"><label>Email <span style="color:var(--text-muted);font-size:0.75rem">(optional)</span></label><input type="email" id="ef-email" value="' + (emp ? (emp.email || '') : '') + '" placeholder="e.g. ahmed@factory.com"></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Username *</label><input id="ef-username" value="' + (emp ? emp.username : '') + '" placeholder="Login username"></div>';
    if (!emp) { body += '<div class="form-field"><label>Password *</label><input type="password" id="ef-password" placeholder="Login password"></div>'; }
    else { body += '<div class="form-field"><label>Phone</label><input id="ef-phone" value="' + (emp ? (emp.phone || '') : '') + '" placeholder="+20 1xx xxx xxxx"></div>'; }
    body += '</div>';
    if (!emp) { body += '<div class="form-row"><div class="form-field"><label>Phone</label><input id="ef-phone" value="" placeholder="+20 1xx xxx xxxx"></div><div></div></div>'; }
    var isDaily = emp && emp.position && emp.position.indexOf('(عامل يومية)') !== -1;
    var baseVal = emp ? (isDaily ? Math.round(emp.base_salary / 30) : emp.base_salary) : '';
    var myLevel = App.getRoleLevel(App.user ? App.user.role : 'hr');
    var roleOptions = '';
    if (myLevel >= 6) roleOptions += '<option value="owner" ' + (emp && emp.role === 'owner' ? 'selected' : '') + '>Owner / General Manager</option>';
    if (myLevel >= 6) roleOptions += '<option value="hr manager" ' + (emp && emp.role === 'hr manager' ? 'selected' : '') + '>HR Manager</option>';
    if (myLevel >= 5) roleOptions += '<option value="hr" ' + (emp && emp.role === 'hr' ? 'selected' : '') + '>HR</option>';
    if (myLevel >= 4) roleOptions += '<option value="manager" ' + (emp && emp.role === 'manager' ? 'selected' : '') + '>Manager (مدير إدارة)</option>';
    if (myLevel >= 4) roleOptions += '<option value="hall manager" ' + (emp && emp.role === 'hall manager' ? 'selected' : '') + '>Hall Manager (مدير صالة)</option>';
    if (myLevel >= 3) roleOptions += '<option value="department head" ' + (emp && emp.role === 'department head' ? 'selected' : '') + '>Department Head (رئيس قسم)</option>';
    if (myLevel >= 3) roleOptions += '<option value="supervisor" ' + (emp && emp.role === 'supervisor' ? 'selected' : '') + '>Supervisor (مشرف)</option>';
    if (myLevel >= 3) roleOptions += '<option value="procurement manager" ' + (emp && emp.role === 'procurement manager' ? 'selected' : '') + '>Procurement Manager (مدير مشتروات)</option>';
    if (myLevel >= 2) roleOptions += '<option value="procurement specialist" ' + (emp && emp.role === 'procurement specialist' ? 'selected' : '') + '>Procurement Specialist (أخصائي مشتروات)</option>';
    if (myLevel >= 2) roleOptions += '<option value="warehouse manager" ' + (emp && emp.role === 'warehouse manager' ? 'selected' : '') + '>Warehouse Manager (أمين مخزن)</option>';
    if (myLevel >= 4) roleOptions += '<option value="engineering manager" ' + (emp && emp.role === 'engineering manager' ? 'selected' : '') + '>Engineering Manager (مدير هندسي)</option>';
    if (myLevel >= 2) roleOptions += '<option value="engineer" ' + (emp && emp.role === 'engineer' ? 'selected' : '') + '>Engineer (مهندس)</option>';
    if (myLevel >= 2) roleOptions += '<option value="spare parts inspector" ' + (emp && emp.role === 'spare parts inspector' ? 'selected' : '') + '>Spare Parts Inspector (مراقب قطع غيار)</option>';
    if (myLevel >= 2) roleOptions += '<option value="technical office" ' + (emp && emp.role === 'technical office' ? 'selected' : '') + '>Technical Office (مكتب فني)</option>';
    if (myLevel >= 2) roleOptions += '<option value="it" ' + (emp && emp.role === 'it' ? 'selected' : '') + '>IT Support (دعم فني)</option>';
    if (myLevel >= 3) roleOptions += '<option value="nursing management" ' + (emp && emp.role === 'nursing management' ? 'selected' : '') + '>Nursing Management (إدارة التمريض)</option>';
    if (myLevel >= 2) roleOptions += '<option value="driver" ' + (emp && emp.role === 'driver' ? 'selected' : '') + '>Driver (سائق)</option>';
    if (myLevel >= 2) roleOptions += '<option value="logistics manager" ' + (emp && emp.role === 'logistics manager' ? 'selected' : '') + '>Logistics Manager (مدير حركة)</option>';
    if (myLevel >= 2) roleOptions += '<option value="lawyer" ' + (emp && emp.role === 'lawyer' ? 'selected' : '') + '>Lawyer (محامي)</option>';
    if (myLevel >= 2) roleOptions += '<option value="employee" ' + (!emp || emp.role === 'employee' ? 'selected' : '') + '>Employee (موظف)</option>';

    body += '<div class="form-row"><div class="form-field"><label>System Role *</label><select id="ef-role">' + roleOptions + '</select></div><div class="form-field"><label>Department *</label><input type="text" id="ef-dept" list="dept-list" class="form-input" placeholder="Type or select..." value="' + (emp && emp.department ? emp.department : '') + '">';
    body += '<datalist id="dept-list">';
    DEPARTMENTS.forEach(function (d) { body += '<option value="' + d + '">'; });
    body += '</datalist></div></div>';
    
    // Driver Type (only shown if role == driver)
    body += '<div class="form-row" id="ef-driver-type-row" style="display:' + (emp && emp.role === 'driver' ? 'flex' : 'none') + '">';
    body += '<div class="form-field"><label>Driver Type *</label><select id="ef-driver-type">';
    body += '<option value="internal"' + (emp && emp.driver_type === 'internal' ? ' selected' : '') + '>Internal (موظف بالشركة - راتب ثابت)</option>';
    body += '<option value="external"' + (emp && emp.driver_type === 'external' ? ' selected' : '') + '>External (سائق خارجي - يحاسب بالمشوار)</option>';
    body += '</select></div><div></div></div>';
    
    body += '<div class="form-row"><div class="form-field"><label>Position / Title *</label><select id="ef-pos">';
    var currentPos = emp ? (emp.position || '').replace(' (عامل يومية)', '') : '';
    var positionsList = [
      'General Manager', 'Factory Manager',
      'HR Manager', 'HR Specialist',
      'Finance Manager', 'Accountant',
      'Procurement Manager', 'Procurement Specialist',
      'Warehouse Manager', 'Warehouse Clerk',
      'Production Manager', 'Hall Manager', 'Hall Supervisor', 'Production Worker',
      'Maintenance Manager', 'Technician',
      'Quality Manager', 'QA Inspector',
      'Sales Manager', 'Sales Representative',
      'Planning Manager', 'Planning Specialist',
      'Engineering Manager', 'Engineering Projects Manager',
      'Operations & Maintenance Manager', 'Facilities Manager',
      'Civil Engineer', 'Electrical Engineer',
      'Mechanical Engineer', 'Technical Office Engineer',
      'Spare Parts Inspector',
      'IT Support',
      'Nursing Manager', 'Nurse',
      'Logistics Manager', 'Driver',
      'Safety & Security Officer', 'Secretary',
      'Lawyer',
      'Employee'
    ];
    positionsList.forEach(function (p) {
      // Check if DB value has the old mixed format so selection still works
      var isSelected = (currentPos === p || currentPos.startsWith(p));
      body += '<option value="' + p + '"' + (isSelected ? ' selected' : '') + '>' + (window.t ? t(p) : p) + '</option>';
    });
    body += '</select></div><div></div></div>';

    var canEditSalary = true;
    if (App.user && App.user.role === 'hr') {
      var perms = App.user.permissions || {};
      if (!perms.can_edit_salary && emp) canEditSalary = false;
    }
    body += '<div style="margin-bottom:12px"><label style="display:inline-flex;align-items:center;gap:8px;font-weight:600;cursor:pointer"><input type="checkbox" id="ef-is-daily" ' + (isDaily ? 'checked' : '') + ' ' + (canEditSalary ? '' : 'disabled') + '> عامل يومية (Daily Worker - Paid per attended day)</label></div>';
    body += '<div class="form-row"><div class="form-field"><label id="ef-salary-label">' + (isDaily ? 'Daily Wage (EGP) *' : 'Monthly Base Salary (EGP) *') + '</label><input type="number" id="ef-salary" value="' + baseVal + '" placeholder="0" ' + (canEditSalary ? '' : 'disabled title="Restricted"') + '>' + (!canEditSalary ? '<div style="font-size:0.7rem;color:var(--accent-danger);margin-top:4px">Access Restricted</div>' : '') + '</div><div class="form-field"><label>Shift System *</label><select id="ef-shift-system">';
    body += '<option value="2-shift"' + (currentSystem === '2-shift' ? ' selected' : '') + '>2-Shift (12h each)</option>';
    body += '<option value="3-shift"' + (currentSystem === '3-shift' ? ' selected' : '') + '>3-Shift (8h each)</option>';
    body += '</select></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Shift *</label><select id="ef-shift">';
    var availableShifts = getShiftsForSystem(currentSystem);
    availableShifts.forEach(function (s) { body += '<option value="' + s.key + '"' + (currentShift === s.key ? ' selected' : '') + '>' + s.label + '</option>'; });
    body += '</select></div><div class="form-field"><label>Hire Date</label><input type="date" id="ef-hire" value="' + (emp ? (emp.hire_date || '') : '') + '"></div></div>';
    var monthValStr = new Date().toISOString().substring(0, 7) + '-01';
    body += '<div class="form-row"><div class="form-field"><label>Insurance Start Date <span style="color:var(--text-muted);font-size:0.75rem">(leave blank = no insurance)</span></label><input type="date" id="ef-ins" value="' + (emp ? (emp.insurance_start || '') : monthValStr) + '"></div>';
    body += '<div class="form-field"><label>Insurance Salary (EGP) <span style="color:var(--text-muted);font-size:0.75rem">(المرتب التأميني)</span></label><input type="number" id="ef-ins-salary" value="' + (emp ? (emp.insurance_salary || 0) : 0) + '"></div></div>';
    var insDeductionVal = Math.round((emp ? (emp.insurance_salary || 0) : 0) * 0.10);
    body += '<div class="form-row"><div class="form-field"><label>Monthly Insurance Deduction (10%) <span style="color:var(--text-muted);font-size:0.75rem">(خصم التأمينات الشهري)</span></label><input type="text" id="ef-ins-deduction" value="EGP ' + insDeductionVal.toLocaleString() + '" readonly style="background:var(--bg-secondary);font-weight:700;color:var(--accent-warning)"></div><div></div></div>';

    if (myLevel >= 5) {
      var p = emp ? (emp.permissions || {}) : {};
      body += '<div id="hr-permissions-section" style="display:' + (emp && emp.role === 'hr' ? 'block' : 'none') + ';margin-top:16px;margin-bottom:16px;padding:16px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:rgba(99,102,241,0.04)">';
      body += '<h4 style="margin:0 0 12px 0;font-size:0.9rem;font-weight:700;color:var(--accent-primary)">HR Custom Permissions</h4>';
      body += '<label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="ef-perm-edit-salary" ' + (p.can_edit_salary ? 'checked' : '') + '> Allow Editing Base Salaries</label>';
      body += '<label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer"><input type="checkbox" id="ef-perm-adjust-salary" ' + (p.can_adjust_salary ? 'checked' : '') + '> Allow Issuing Bonuses & Deductions</label>';
      body += '</div>';
    }

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="emp-save-btn">' + (emp ? 'Save Changes' : 'Add Employee') + '</button>';
    App.showModal(emp ? 'Edit Employee' : 'Add New Employee', body, footer, true);

    if (document.getElementById('ef-is-daily')) {
      document.getElementById('ef-is-daily').addEventListener('change', function () {
        document.getElementById('ef-salary-label').textContent = this.checked ? 'Daily Wage (EGP) *' : 'Monthly Base Salary (EGP) *';
      });
    }

    if (document.getElementById('ef-ins-salary')) {
      document.getElementById('ef-ins-salary').addEventListener('input', function () {
        var insSal = Number(this.value) || 0;
        var ded = Math.round(insSal * 0.10);
        var dedField = document.getElementById('ef-ins-deduction');
        if (dedField) dedField.value = 'EGP ' + ded.toLocaleString();
      });
    }

    if (myLevel >= 5 && document.getElementById('ef-role')) {
      var updatePermSection = function () {
        var sec = document.getElementById('hr-permissions-section');
        if (!sec) return;
        sec.style.display = document.getElementById('ef-role').value === 'hr' ? 'block' : 'none';
      };
      document.getElementById('ef-role').addEventListener('change', updatePermSection);
    }
    
    if (document.getElementById('ef-role')) {
      document.getElementById('ef-role').addEventListener('change', function() {
        var drvRow = document.getElementById('ef-driver-type-row');
        if(drvRow) drvRow.style.display = this.value === 'driver' ? 'flex' : 'none';
      });
    }

    // Dynamic: when shift system changes, update shift dropdown
    document.getElementById('ef-shift-system').addEventListener('change', function () {
      var sys = this.value;
      var shiftSelect = document.getElementById('ef-shift');
      var currentVal = shiftSelect.value;
      var shifts = getShiftsForSystem(sys);
      shiftSelect.innerHTML = '';
      shifts.forEach(function (s) {
        var opt = document.createElement('option');
        opt.value = s.key;
        opt.textContent = s.label;
        if (s.key === currentVal) opt.selected = true;
        shiftSelect.appendChild(opt);
      });
    });

    function autoSetShift() {
      var r = document.getElementById('ef-role').value;
      var d = document.getElementById('ef-dept').value;
      var adminRoles = ['hr manager', 'hr', 'procurement manager'];
      var adminDepts = ['HR', 'Finance', 'Sales', 'Procurement'];
      var shiftSys = document.getElementById('ef-shift-system');
      var shiftVal = document.getElementById('ef-shift');
      
      if (adminRoles.indexOf(r) !== -1 || adminDepts.indexOf(d) !== -1) {
        if (shiftSys.value === '3-shift' && !emp) {
          shiftVal.value = 'admin';
        }
      } else {
        if (shiftSys.value === '3-shift' && shiftVal.value === 'admin' && !emp) {
          shiftVal.value = 'morning';
        }
      }
    }
    document.getElementById('ef-role').addEventListener('change', autoSetShift);
    document.getElementById('ef-dept').addEventListener('change', autoSetShift);
    if (!emp) setTimeout(autoSetShift, 100);

    document.getElementById('emp-save-btn').addEventListener('click', function () {
      var insVal = document.getElementById('ef-ins').value;
      var hasInsurance = !!insVal;
      var dailyChecked = document.getElementById('ef-is-daily') && document.getElementById('ef-is-daily').checked;
      var rawSalary = Number(document.getElementById('ef-salary').value);
      var form = {
        full_name: document.getElementById('ef-name').value,
        email: document.getElementById('ef-email').value || null,
        username: document.getElementById('ef-username').value,
        role: document.getElementById('ef-role') ? document.getElementById('ef-role').value : 'employee',
        department: document.getElementById('ef-dept').value,
        position: document.getElementById('ef-pos').value + (dailyChecked ? ' (عامل يومية)' : ''),
        phone: document.getElementById('ef-phone').value,
        base_salary: dailyChecked ? (rawSalary * 30) : rawSalary,
        shift_system: document.getElementById('ef-shift-system').value,
        shift: document.getElementById('ef-shift').value,
        hire_date: document.getElementById('ef-hire').value || null,
        insurance_start: insVal || null,
        insurance_active: dailyChecked ? false : hasInsurance,
        insurance_salary: Number(document.getElementById('ef-ins-salary').value || 0),
        documents_complete: (emp ? emp.documents_complete : false)
      };
      
      if (form.role === 'driver') {
        form.driver_type = document.getElementById('ef-driver-type') ? document.getElementById('ef-driver-type').value : 'internal';
        if (form.driver_type === 'external') {
           form.base_salary = 0; // External drivers don't have a base salary
        }
      } else {
        form.driver_type = null;
      }

      var canEditSalary = true;
      if (App.user && App.user.role === 'hr') {
        var perms = App.user.permissions || {};
        if (!perms.can_edit_salary) canEditSalary = false;
      }
      if (!canEditSalary && emp) {
        form.base_salary = emp.base_salary;
        form.position = emp.position;
      }

      var ml = App.getRoleLevel(App.user.role);
      if (form.role === 'hr' && ml >= 5) {
        form.permissions = {
          can_edit_salary: document.getElementById('ef-perm-edit-salary') ? document.getElementById('ef-perm-edit-salary').checked : false,
          can_adjust_salary: document.getElementById('ef-perm-adjust-salary') ? document.getElementById('ef-perm-adjust-salary').checked : false
        };
      }

      if (!form.full_name) { alert('Full name is required'); return; }
      if (!emp && !rawSalary) { alert('الراتب مطلوب - يجب كتابة الراتب الأساسي قبل إضافة الموظف'); return; }
      if (!form.username) { alert('Username is required'); return; }
      if (emp) {
        Object.assign(emp, form);
        sbClient.from('users').update(form).eq('id', emp.id).then(function (r) { 
           if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); return; }
           if (form.role === 'driver') {
              // Ensure they exist in logistics_drivers
              sbClient.from('logistics_drivers').upsert({ id: emp.id, employee_id: emp.id, driver_name: form.full_name, car_number: 'N/A', driver_type: form.driver_type }).then(function(){});
           }
        });
      } else {
        var passInputValue = document.getElementById('ef-password') ? document.getElementById('ef-password').value : 'emp123';
        if (!form.username) { alert('Username is required'); return; }
        if (!passInputValue) { alert('Password is required'); return; }

        sbClient.from('users').select('employee_id').then(function (res) {
          var allIds = res.data || [];
          var maxNum = 0;
          allIds.forEach(function (u) {
            if (u.employee_id && u.employee_id.indexOf('EMP-') === 0) {
              var num = parseInt(u.employee_id.replace('EMP-', ''), 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          });
          var nextEmpId = 'EMP-' + (maxNum + 1).toString().padStart(3, '0');
          var hireMonth = new Date(form.hire_date || new Date()).getMonth() + 1;
          var calculatedLeaveBalance = (12 - hireMonth + 1) * 2; // 2 days per remaining month in the year

          var newEmp = Object.assign({ employee_id: nextEmpId, status: 'active', avatar_color: 'hsl(' + Math.floor(Math.random() * 360) + ',60%,50%)', password_hash: passInputValue, annual_leave_balance: calculatedLeaveBalance }, form);
          sbClient.from('users').insert([newEmp]).select().single().then(function (r) {
            if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); return; }
            if (r.data) {
              if (form.role === 'driver') {
                 // Automatically insert into logistics_drivers
                 sbClient.from('logistics_drivers').insert({ id: r.data.id, employee_id: r.data.id, driver_name: form.full_name, car_number: 'N/A', driver_type: form.driver_type }).then(function(){});
              }
              employees.push(r.data);
              render();
              showToast('Employee added!', 'success');
            }
          });
        });
      }
      App.closeModal();
      if (emp) {
        render();
        showToast('Employee updated!', 'success');
      }
    });
  }

  {
    sbClient.from('users').select('*').order('created_at', { ascending: false }).then(function (res) {
      if (res.data) { employees = res.data; render(); }
    });
  }
  render();
};

// ----- FRIDAY WORK (صفحة عمل الجمعة) -----
Pages.fridayWork = function (el) {
  var isHR = App.isHR();
  var isManager = App.isManager();
  var deptEmployees = [];
  var requests = [];

  function render() {
    var html = '';

    // Stats
    var pending = requests.filter(function(r) { return r.status === 'pending'; }).length;
    var approved = requests.filter(function(r) { return r.status === 'approved'; }).length;
    var rejected = requests.filter(function(r) { return r.status === 'rejected'; }).length;

    html += '<div class="stats-grid">';
    html += _statCard('#f59e0b', 'timer', pending, 'Pending (معلق)');
    html += _statCard('#22c55e', 'checkCircle', approved, 'Approved (معتمد)');
    html += _statCard('#ef4444', 'xCircle', rejected, 'Rejected (مرفوض)');
    html += _statCard('#6366f1', 'calendarPlus', requests.length, 'Total Requests');
    html += '</div>';

    // Manager: Submit new request
    if (isManager && !isHR) {
      html += '<div class="toolbar">';
      html += '<button class="btn btn-primary" id="add-friday-btn">' + icon('plus') + ' Request Friday Work (طلب عمل إضافي / يوم جمعة)</button>';
      html += '</div>';
    }

    // Request table
    html += '<div class="card"><div class="card-header"><div><h3>' + (isHR ? 'All Friday Work Requests (كل طلبات عمل الجمعة)' : 'My Department Requests (طلبات إدارتي)') + '</h3><p>' + requests.length + ' requests</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    if (isHR) html += '<th>Department (القسم)</th>';
    html += '<th>Requested By (مقدم الطلب)</th><th>Date (التاريخ)</th><th>Employees (عدد الموظفين)</th><th>Status (الحالة)</th>';
    if (isHR) html += '<th>Actions (إجراءات)</th>';
    html += '</tr></thead><tbody>';

    if (requests.length === 0) {
      var cols = isHR ? 6 : 4;
      html += '<tr><td colspan="' + cols + '" style="text-align:center;padding:40px;color:var(--text-muted)">No Friday Work requests yet</td></tr>';
    } else {
      requests.forEach(function(fw) {
        var sc = fw.status === 'approved' ? 'badge-success' : fw.status === 'rejected' ? 'badge-danger' : 'badge-warning';
        html += '<tr>';
        if (isHR) html += '<td style="font-weight:600">' + (fw.department || '-') + '</td>';
        html += '<td>' + (fw.requested_by_name || '-') + '</td>';
        html += '<td>' + formatDate(fw.request_date) + '</td>';
        html += '<td style="font-weight:700">' + (fw.employees ? fw.employees.length : 0) + ' Employees</td>';
        html += '<td><span class="badge ' + sc + '"><span class="badge-dot"></span>' + fw.status + '</span></td>';
        if (isHR) {
          html += '<td>';
          if (fw.status === 'pending') {
            html += '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" data-fw-approve="' + fw.id + '">Approve</button><button class="btn btn-danger btn-xs" data-fw-reject="' + fw.id + '">Reject</button></div>';
          } else {
            html += '<span style="color:var(--text-muted);font-size:0.8rem">—</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';

    el.innerHTML = html;

    // Manager: Submit button handler
    var fridayBtn = document.getElementById('add-friday-btn');
    if (fridayBtn) {
      fridayBtn.addEventListener('click', function () {
        var dateVal = todayStr();
        var b = '<div class="form-field"><label>Date (تاريخ العمل الإضافي/يوم الجمعة) *</label><input type="date" id="fw-date" value="' + dateVal + '"></div>';
        b += '<div class="form-field"><label>Select Employees from ' + App.user.department + ' (يمكن اختيار أكثر من موظف) *</label><select id="fw-emps" multiple style="height:150px">';
        deptEmployees.forEach(function (u) { b += '<option value="' + u.id + '">' + u.full_name + ' — ' + (u.position || 'Employee') + '</option>'; });
        b += '</select></div><p style="font-size:0.8rem;color:var(--text-muted)">اضغط Ctrl (أو Cmd) لاختيار أكثر من موظف</p>';
        
        App.showModal('Request Friday Work (طلب عمل الجمعة)', b, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="fw-save">Submit Request</button>');

        document.getElementById('fw-save').addEventListener('click', function () {
          var date = document.getElementById('fw-date').value;
          var sel = document.getElementById('fw-emps');
          var selectedEmps = [];
          for (var i=0; i<sel.options.length; i++) { if(sel.options[i].selected) selectedEmps.push(sel.options[i].value); }
          
          if (!date || selectedEmps.length === 0) { alert('يرجى اختيار التاريخ وموظف واحد على الأقل'); return; }

          var rec = { department: App.user.department, requested_by: App.user.id, requested_by_name: App.user.full_name, employees: selectedEmps, request_date: date, status: 'pending' };
          sbClient.from('friday_work_requests').insert([rec]).then(function (r) {
            if (r.error) { alert('Error: ' + r.error.message); return; }
            App.closeModal(); 
            showToast('تم إرسال الطلب بنجاح!', 'success'); 
            loadData();
          });
        });
      });
    }

    // HR: Approve/Reject handlers
    document.querySelectorAll('[data-fw-approve]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-fw-approve');
        sbClient.from('friday_work_requests').update({status:'approved'}).eq('id',id).then(function(r) {
          if(!r.error) { showToast('تمت الموافقة ✅', 'success'); loadData(); }
        });
      });
    });
    document.querySelectorAll('[data-fw-reject]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = this.getAttribute('data-fw-reject');
        sbClient.from('friday_work_requests').update({status:'rejected'}).eq('id',id).then(function(r) {
          if(!r.error) { showToast('تم الرفض ❌', 'danger'); loadData(); }
        });
      });
    });
  }

  function loadData() {
    var promises = [];
    
    // Load department employees (only manager's department)
    if (isManager && !isHR) {
      promises.push(sbClient.from('users').select('id, full_name, position, department').eq('department', App.user.department).eq('status', 'active'));
      promises.push(sbClient.from('friday_work_requests').select('*').eq('department', App.user.department).order('created_at', {ascending:false}));
    } else {
      // HR sees all
      promises.push(Promise.resolve({data: []}));
      promises.push(sbClient.from('friday_work_requests').select('*').order('created_at', {ascending:false}));
    }

    Promise.all(promises).then(function(results) {
      deptEmployees = results[0].data || [];
      requests = results[1].data || [];
      render();
    });
  }

  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading...</div>';
  loadData();
};

// ----- ATTENDANCE -----
Pages.attendance = function (el) {
  var isPersonalView = (App.activePage === 'my-attendance');
  var isHR = App.isHR() && !isPersonalView;
  var canEdit = App.user && (App.user.role === 'hr manager' || App.user.role === 'owner') && !isPersonalView;
  var records = isHR ? [] : [].filter(function (a) { return a.employee_id === App.user.id; });
  var search = '';
  var deptFilter = '';
  var dateFilter = '';
  var statusFilter = '';

  function render(data) {
    var html = '<div class="toolbar">';
    if (isHR) html += '<div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search by name..." id="att-search" value="' + (search || '').replace(/"/g, '&quot;') + '"></div>';
    if (isHR) { html += '<select class="filter-select" id="att-dept"><option value="">All Departments</option>'; DEPARTMENTS.forEach(function (d) { html += '<option value="' + d + '"' + (deptFilter === d ? ' selected' : '') + '>' + d + '</option>'; }); html += '</select>'; }
    html += '<input type="date" class="filter-select" id="att-date" value="' + dateFilter + '"><select class="filter-select" id="att-status"><option value=""' + (statusFilter === '' ? ' selected' : '') + '>All Status</option><option value="present"' + (statusFilter === 'present' ? ' selected' : '') + '>Present</option><option value="checked_in"' + (statusFilter === 'checked_in' ? ' selected' : '') + '>Checked In</option><option value="absent"' + (statusFilter === 'absent' ? ' selected' : '') + '>Absent</option><option value="leave"' + (statusFilter === 'leave' ? ' selected' : '') + '>Leave (اجازة)</option></select>';
    html += '<button class="btn btn-outline" id="att-export">' + icon('download') + ' Export</button></div>';

    var colCount = 9; // Date, CheckIn, CheckOut, Shift, WorkingHours, Delay, EarlyLeave, Overtime, Status
    if (isHR) colCount += 2; // Employee, Dept
    if (canEdit) colCount += 1; // Actions

    html += '<div class="card"><div class="card-header"><div><h3>' + (isHR ? 'Attendance Records (سجل الحضور)' : 'My Attendance History') + '</h3><p>' + data.length + ' records</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    if (isHR) html += '<th>Employee</th><th>Department</th>';
    html += '<th>Date</th><th>Check In</th><th>Check Out</th><th>Shift</th><th>Working Hours</th><th>Delay</th><th>Early Leave</th><th>Overtime</th><th>Status</th>';
    if (canEdit) html += '<th>Actions (إجراءات)</th>';
    html += '</tr></thead><tbody>';
    
    var lastDate = null;
    data.sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).forEach(function (r) {
      if (lastDate !== r.date) {
        html += '<tr style="background:var(--bg-secondary);border-top:3px solid var(--accent-primary);border-bottom:1px solid var(--border-color)"><td colspan="' + colCount + '" style="font-weight:800;color:var(--text-primary);padding:10px 16px;font-size:1.05rem;">📅 سجلات يوم: ' + formatDate(r.date) + '</td></tr>';
        lastDate = r.date;
      }

      html += '<tr>';
      if (isHR) html += '<td style="color:var(--text-primary);font-weight:500">' + r.employee_name + '</td><td>' + r.department + '</td>';
      html += '<td>' + formatDate(r.date) + '</td><td>' + formatTime(r.check_in) + '</td><td>' + formatTime(r.check_out) + '</td>';
      html += '<td><span class="shift-badge shift-' + r.shift + '">' + icon('clock', 11) + ' ' + r.shift + '</span></td>';
      html += '<td>' + (r.working_hours ? r.working_hours + 'h' : '—') + '</td>';
      html += '<td>' + (r.status === 'leave' ? '—' : (r.delay_minutes > 0 ? '<span style="color:var(--accent-warning);font-weight:600">' + icon('alertTriangle') + ' ' + formatDelay(r.delay_minutes) + '</span>' : '<span style="color:var(--text-muted)">0m</span>')) + '</td>';
      
      var earlyL = r.early_departure_minutes || 0;
      var otH = r.overtime_hours || 0;
      html += '<td>' + (earlyL > 0 ? '<span style="color:var(--accent-danger);font-weight:600">' + earlyL + 'm</span>' : '<span style="color:var(--text-muted)">0m</span>') + '</td>';
      html += '<td>' + (otH > 0 ? '<span style="color:var(--accent-info);font-weight:600">+' + otH + 'h</span>' : '<span style="color:var(--text-muted)">0h</span>') + '</td>';

      var badge = (r.status === 'present' || r.status === 'Closed Automatically') ? 'badge-success' : r.status === 'checked_in' ? 'badge-info' : r.status === 'leave' ? 'badge-warning' : 'badge-danger';
      var statusText = r.status === 'leave' ? 'Leave (اجازة)' : r.status.replace('_', ' ');
      html += '<td><span class="badge ' + badge + '"><span class="badge-dot"></span>' + statusText + '</span></td>';
      if (canEdit) {
        html += '<td><button class="btn btn-xs btn-outline" onclick="window.editAttendanceRecord(\'' + r.id + '\')" style="font-size:0.72rem">' + icon('edit', 12) + ' تعديل</button></td>';
      }
      html += '</tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="' + colCount + '" style="text-align:center;padding:40px;color:var(--text-muted)">No attendance records found</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    // Restore focus to search input after re-render
    var searchEl = document.getElementById('att-search');
    if (searchEl && search) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }

    // Filters
    function applyFilters() {
      search = document.getElementById('att-search') ? document.getElementById('att-search').value.toLowerCase() : '';
      deptFilter = document.getElementById('att-dept') ? document.getElementById('att-dept').value : '';
      dateFilter = document.getElementById('att-date').value;
      statusFilter = document.getElementById('att-status').value;
      var f = records.filter(function (r) {
        if (search && r.employee_name && r.employee_name.toLowerCase().indexOf(search) === -1) return false;
        if (deptFilter && r.department !== deptFilter) return false;
        if (dateFilter && r.date !== dateFilter) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
      });
      render(f);
    }
    if (document.getElementById('att-search')) document.getElementById('att-search').addEventListener('input', applyFilters);
    if (document.getElementById('att-dept')) document.getElementById('att-dept').addEventListener('change', applyFilters);
    document.getElementById('att-date').addEventListener('change', applyFilters);
    document.getElementById('att-status').addEventListener('change', applyFilters);
    document.getElementById('att-export').addEventListener('click', function () { exportToExcel(data, 'attendance_report'); });
  }

  // ---- Edit Attendance Record Modal (HR Manager / Owner only) ----
  window.editAttendanceRecord = function(recordId) {
    var rec = records.find(function(r) { return r.id === recordId; });
    if (!rec) return alert('Record not found');

    var body = '<div style="margin-bottom:16px;padding:14px;background:var(--bg-secondary);border-radius:var(--radius-md);border:1px solid var(--border-color)">';
    body += '<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:var(--text-muted);font-size:0.82rem">الموظف (Employee)</span><span style="font-weight:700">' + rec.employee_name + '</span></div>';
    body += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted);font-size:0.82rem">التاريخ (Date)</span><span style="font-weight:700">' + formatDate(rec.date) + '</span></div>';
    body += '</div>';

    body += '<div class="form-field"><label>نوع التعديل *</label><select id="edit-att-action" class="form-input" onchange="var v=this.value;document.getElementById(\'edit-fields\').style.display=v===\'edit\'?\'block\':\'none\';document.getElementById(\'delete-warn\').style.display=v===\'delete_checkout\'?\'block\':\'none\';document.getElementById(\'reopen-warn\').style.display=v===\'reopen\'?\'block\':\'none\';">';
    body += '<option value="edit">✏️ تعديل بيانات الحضور/الانصراف</option>';
    body += '<option value="delete_checkout">🗑️ حذف الانصراف (السماح بإعادة التسجيل)</option>';
    body += '<option value="reopen">🔄 إعادة فتح اليوم بالكامل</option>';
    body += '</select></div>';

    body += '<div id="edit-fields">';
    body += '<div class="form-field"><label>الحالة (Status) *</label><select id="edit-att-status" class="form-input">';
    body += '<option value="present"' + (rec.status === 'present' ? ' selected' : '') + '>✅ حاضر (Present)</option>';
    body += '<option value="absent"' + (rec.status === 'absent' ? ' selected' : '') + '>❌ غائب (Absent)</option>';
    body += '<option value="checked_in"' + (rec.status === 'checked_in' ? ' selected' : '') + '>🔵 سجل حضور (Checked In)</option>';
    body += '<option value="leave"' + (rec.status === 'leave' ? ' selected' : '') + '>⛱️ إجازة (Leave)</option>';
    body += '</select></div>';
    body += '<div class="form-field"><label>وقت الحضور (Check-In Time)</label><input type="time" id="edit-att-checkin" class="form-input" value="' + (rec.check_in ? new Date(rec.check_in).toTimeString().slice(0,5) : '') + '"></div>';
    body += '<div class="form-field"><label>وقت الانصراف (Check-Out Time)</label><input type="time" id="edit-att-checkout" class="form-input" value="' + (rec.check_out ? new Date(rec.check_out).toTimeString().slice(0,5) : '') + '"></div>';
    body += '<div class="form-field"><label>التأخير بالدقائق (Delay Minutes)</label><input type="number" id="edit-att-delay" class="form-input" value="' + (rec.delay_minutes || 0) + '" min="0"></div>';
    body += '<div class="form-field"><label>ساعات العمل (Working Hours)</label><input type="number" id="edit-att-hours" class="form-input" value="' + (rec.working_hours || 0) + '" min="0" step="0.5"></div>';
    body += '</div>';

    body += '<div id="delete-warn" style="display:none;margin-top:12px;padding:14px;background:rgba(239,68,68,0.08);border-radius:var(--radius-sm);border:1px solid rgba(239,68,68,0.2)"><p style="color:#ef4444;font-weight:700;margin:0">⚠️ سيتم حذف بيانات الانصراف والسماح للموظف بإعادة مسح QR الانصراف.</p></div>';
    body += '<div id="reopen-warn" style="display:none;margin-top:12px;padding:14px;background:rgba(245,158,11,0.08);border-radius:var(--radius-sm);border:1px solid rgba(245,158,11,0.2)"><p style="color:#f59e0b;font-weight:700;margin:0">⚠️ سيتم حذف بيانات الحضور والانصراف بالكامل لإعادة فتح اليوم.</p></div>';

    body += '<div class="form-field" style="margin-top:12px"><label>سبب التعديل (مطلوب) *</label><textarea id="edit-att-reason" class="form-input" rows="2" placeholder="اكتب سبب التعديل هنا..."></textarea></div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>';
    footer += '<button class="btn btn-primary" id="save-att-edit">💾 حفظ التعديل</button>';
    App.showModal('✏️ تعديل سجل حضور - Edit Attendance', body, footer);

    document.getElementById('save-att-edit').addEventListener('click', function() {
      var action = document.getElementById('edit-att-action').value;
      var reason = document.getElementById('edit-att-reason').value.trim();
      if (!reason) return alert('يجب كتابة سبب التعديل!');

      var updateObj = {};
      var modType = action;

      if (action === 'edit') {
        modType = 'edit_checkout';
        var newStatus = document.getElementById('edit-att-status').value;
        var newDelay = parseInt(document.getElementById('edit-att-delay').value) || 0;
        var newHours = parseFloat(document.getElementById('edit-att-hours').value) || 0;
        var newCheckin = document.getElementById('edit-att-checkin').value;
        var newCheckout = document.getElementById('edit-att-checkout').value;
        updateObj = { status: newStatus, delay_minutes: newDelay, working_hours: newHours, modified_by: App.user.full_name, modification_reason: reason };
        if (newCheckin) updateObj.check_in = rec.date + 'T' + newCheckin + ':00';
        if (newCheckout) updateObj.check_out = rec.date + 'T' + newCheckout + ':00';
        if (newStatus === 'absent') { updateObj.check_in = null; updateObj.check_out = null; updateObj.delay_minutes = 0; updateObj.working_hours = 0; }
      } else if (action === 'delete_checkout') {
        updateObj = { check_out: null, working_hours: 0, status: 'checked_in', modified_by: App.user.full_name, modification_reason: reason };
      } else if (action === 'reopen') {
        updateObj = { check_in: null, check_out: null, working_hours: 0, delay_minutes: 0, status: 'absent', modified_by: App.user.full_name, modification_reason: reason };
      }

      // Save modification audit
      sbClient.from('attendance_modifications').insert({
        attendance_id: recordId,
        employee_id: rec.employee_id,
        employee_name: rec.employee_name,
        modified_by: App.user.id,
        modified_by_name: App.user.full_name,
        modification_type: modType,
        old_value: JSON.stringify({status: rec.status, check_in: rec.check_in, check_out: rec.check_out, delay: rec.delay_minutes}),
        new_value: JSON.stringify(updateObj),
        reason: reason
      }).then(function() {});

      sbClient.from('attendance').update(updateObj).eq('id', recordId).then(function(res) {
        if (res.error) return alert('Error: ' + res.error.message);
        App.closeModal();
        showToast('تم تعديل السجل بنجاح ✅', 'success');
        sbClient.from('audit_log').insert({ action: 'ATTENDANCE_MODIFY', user_name: App.user.full_name, user_id: App.user.id, details: action + ' for ' + rec.employee_name + ' on ' + rec.date + ' - Reason: ' + reason }).then(function(){});
        var query = sbClient.from('attendance').select('*').order('date', { ascending: false });
        if (!isHR) query = query.eq('employee_id', App.user.id);
        query.then(function (res2) { if (res2.data) { records = res2.data; render(records); } });
      });
    });
  };

  {
    var query = sbClient.from('attendance').select('*').order('date', { ascending: false });
    if (!isHR) query = query.eq('employee_id', App.user.id);
    query.then(function (res) { if (res.data) { records = res.data; render(records); } });
  }
  render(records);
};

// ----- QR CHECKIN (HR Manager) -----
Pages.hrQrGenerator = function (el) {
  var user = App.user;
  if (!App.isHR() || user.role === 'owner') {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--text-muted)"><h2>🚫 Not Available</h2></div>';
    return;
  }
  
  var html = '<div style="max-width:600px;margin:0 auto;text-align:center;">';
  html += '<div class="card"><div class="card-header" style="justify-content:center"><h3>Scan to Check In / Out</h3></div>';
  html += '<div class="card-body"><div id="hr-qr-container" style="display:inline-block;padding:20px;background:#fff;border-radius:10px;margin-bottom:20px"></div>';
  html += '<p style="color:var(--text-muted)">QR code changes every 30 seconds</p></div></div></div>';
  el.innerHTML = html;

  var qrTimer;
  function updateQR() {
    var container = document.getElementById('hr-qr-container');
    if (!container) { clearInterval(qrTimer); return; }
    container.innerHTML = '';
    var qrData = JSON.stringify({
      hr_id: user.id,
      timestamp: Date.now(),
      type: 'hr_qr'
    });
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, { text: qrData, width: 250, height: 250, colorDark: '#0a0e1a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    }
  }

  updateQR();
  qrTimer = setInterval(updateQR, 5000);
};

// ----- SCAN CHECKIN (Employee) -----
Pages.scanCheckin = function (el) {
  renderScanner(el, 'checkin');
};

// ----- SCAN CHECKOUT (Employee) -----
Pages.scanCheckout = function (el) {
  renderScanner(el, 'checkout');
};

function renderScanner(el, type) {
  var title = type === 'checkin' ? 'Check-In (تسجيل حضور)' : 'Check-Out (تسجيل انصراف)';
  var html = '<div style="max-width:600px;margin:0 auto;text-align:center;">';
  html += '<div class="card"><div class="card-header" style="justify-content:center"><h3>' + title + '</h3></div>';
  html += '<div class="card-body">';
  html += '<div id="reader" style="width:100%;max-width:400px;margin:0 auto"></div>';
  html += '<p style="margin-top:20px;color:var(--text-muted)">Please scan the QR code generated by the HR Manager</p>';
  html += '</div></div></div>';
  el.innerHTML = html;

  if (typeof Html5Qrcode === 'undefined') {
    el.innerHTML += '<p style="color:red">Scanner library not loaded. Please refresh the page.</p>';
    return;
  }

  var html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: {width: 250, height: 250} },
    function(decodedText) {
      try {
        var data = JSON.parse(decodedText);
        if (data.type !== 'hr_qr' || !data.timestamp) throw new Error();
        var diffSec = Math.abs((Date.now() - data.timestamp) / 1000);
        if (diffSec > 35) {
          showToast('❌ QR Code منتهي الصلاحية - Expired', 'danger');
          return;
        }
        
        // Check if this QR token was already used by this employee
        var tokenKey = data.timestamp + '_' + data.hr_id;
        sbClient.from('qr_tokens').select('id').eq('token', tokenKey).eq('employee_id', App.user.id).then(function(tokenRes) {
          if (tokenRes.data && tokenRes.data.length > 0) {
            showToast('❌ تم استخدام هذا الـ QR مسبقاً - Already used', 'danger');
            return;
          }
          
          html5QrCode.stop().then(function() {
            // Save QR token as used
            sbClient.from('qr_tokens').insert({ token: tokenKey, hr_id: data.hr_id, employee_id: App.user.id, action_type: type }).then(function(){});
            
            if (type === 'checkout') {
              var confirmHtml = '<div style="text-align:center;padding:20px"><p style="font-size:1.1rem;margin-bottom:20px">هل أنت متأكد من تسجيل الانصراف ومغادرة العمل؟</p>';
              confirmHtml += '<div style="display:flex;gap:10px;justify-content:center"><button class="btn btn-outline" id="cancel-checkout">إلغاء</button><button class="btn btn-primary" id="confirm-checkout">تأكيد الانصراف</button></div></div>';
              App.showModal('Confirm Check-Out (تأكيد الانصراف)', confirmHtml);
              
              document.getElementById('cancel-checkout').addEventListener('click', function() {
                App.closeModal();
                renderScanner(el, type);
              });
              document.getElementById('confirm-checkout').addEventListener('click', function() {
                App.closeModal();
                processScan(type);
              });
            } else {
              processScan(type);
            }
          }).catch(function(err) { console.error(err); });
        });
      } catch(e) {
        showToast('❌ Invalid QR code format', 'danger');
      }
    },
    function(error) {
      // ignore
    }
  ).catch(function(err) {
    document.getElementById('reader').innerHTML = '<p style="color:red">Failed to start camera: ' + err + '</p>';
  });
}

function processScan(actionType) {
  var user = App.user;
  var timeNow = new Date();
  var dateStr = todayStr();

  // Validate double scan
  sbClient.from('attendance').select('*').eq('employee_id', user.id).eq('date', dateStr).then(function(res) {
    var rec = res.data && res.data[0];
    if (actionType === 'checkin') {
      if (rec && rec.check_in) {
        showToast('❌ You have already checked in today!', 'danger');
        return;
      }

      // ===== AUTO-CLOSE PREVIOUS UNCLOSED DAYS =====
      // If employee forgot to check out on a previous day, close it with the official shift end time
      sbClient.from('attendance').select('*').eq('employee_id', user.id).is('check_out', null).neq('date', dateStr).then(function(unclosedRes) {
        var unclosed = unclosedRes.data || [];
        if (unclosed.length > 0) {
          var empShiftSystem = user.shift_system || '3-shift';
          var shiftKey = user.shift || 'morning';

          var closePromises = unclosed.map(function(oldRec) {
            var sConf = getShiftConfig(oldRec.shift || shiftKey, empShiftSystem);
            var checkOutTime = new Date(oldRec.date + 'T' + sConf.end + ':00');
            
            if (sConf.end === '00:00') {
              checkOutTime = new Date(oldRec.date + 'T23:59:00');
            } else {
              var startHour = parseInt(sConf.start.split(':')[0]);
              var endHour = parseInt(sConf.end.split(':')[0]);
              // If shift ends next day (night shift)
              if (endHour <= startHour) {
                checkOutTime.setDate(checkOutTime.getDate() + 1);
              }
            }
            
            var checkInTime = new Date(oldRec.check_in);
            var workHrs = Math.max(0, ((checkOutTime - checkInTime) / 3600000)).toFixed(2);

            return sbClient.from('attendance').update({
              check_out: checkOutTime.toISOString(),
              working_hours: parseFloat(workHrs),
              status: 'Closed Automatically',
              modification_reason: 'Auto Closed بسبب تسجيل حضور في اليوم التالي'
            }).eq('id', oldRec.id);
          });

          Promise.all(closePromises).then(function() {
            showToast('⚠️ تم إغلاق ' + unclosed.length + ' سجل حضور مفتوح تلقائياً', 'warning');
            sbClient.from('audit_log').insert({
              action: 'AUTO_CLOSE_ATTENDANCE',
              user_name: user.full_name,
              user_id: user.id,
              details: 'Auto-closed unclosed days: ' + unclosed.map(function(r) { return r.date; }).join(', ')
            }).then(function(){});
          });
        }
      });
      
      // Validation check for leaves/missions/etc.
      Promise.all([
        sbClient.from('leave_requests').select('*').eq('employee_id', user.id).eq('status', 'approved').lte('start_date', dateStr).gte('end_date', dateStr),
        sbClient.from('missions').select('*').eq('employee_id', user.id).eq('status', 'approved').eq('mission_date', dateStr)
      ]).then(function(results) {
        var isExempt = (results[0].data && results[0].data.length > 0) || (results[1].data && results[1].data.length > 0);
        
        var delayMin = 0;
        var empShiftSystem = user.shift_system || '3-shift';
        var shiftKey = user.shift || 'morning';
        
        if (!isExempt && ['owner', 'hr manager'].indexOf(user.role.toLowerCase()) === -1) {
          var sConf = getShiftConfig(shiftKey, empShiftSystem);
          var parts = sConf.start.split(':');
          var expectedStart = new Date(timeNow);
          expectedStart.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
          var diffMs = timeNow - expectedStart;
          if (diffMs > 0) {
            delayMin = Math.floor(diffMs / 60000);
          }
        }
        
        // Location capture
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(pos) {
            var loc = pos.coords.latitude + ',' + pos.coords.longitude;
            insertCheckIn(loc, delayMin);
          }, function() { insertCheckIn(null, delayMin); });
        } else {
          insertCheckIn(null, delayMin);
        }
      });
    } else {
      if (!rec || !rec.check_in) {
        showToast('❌ You must check in first!', 'danger');
        return;
      }
      if (rec.check_out) {
        showToast('❌ You have already checked out today!', 'danger');
        return;
      }
      
      var workHrs = ((timeNow - new Date(rec.check_in)) / 3600000).toFixed(2);
      var baseSalary = user.base_salary || 0;
      var dailyRate30 = baseSalary / 30;
      var hourlyRate = dailyRate30 / 8;
      var overtimeHrs = 0;
      var overtimeAmt = 0;
      var isFriday = timeNow.getDay() === 5;
      
      if (isFriday) {
        // Friday: all hours × 2
        var fridayBonus = Math.round(workHrs * hourlyRate * 2);
        overtimeHrs = parseFloat(workHrs);
        overtimeAmt = fridayBonus;
        
        if (fridayBonus > 0) {
          sbClient.from('salary_adjustments').insert([{
            employee_id: user.id,
            employee_name: user.full_name,
            department: user.department,
            type: 'bonus',
            amount: fridayBonus,
            reason: 'عمل إضافي (يوم الجمعة): ' + workHrs + ' ساعات × 2',
            month: timeNow.toISOString().substring(0, 7),
            requested_by: 'النظام (تلقائي)',
            status: 'approved'
          }]).then(function() {});
        }
      } else {
        // Regular day: check if worked beyond shift end time → overtime at 1.5x
        var shiftKey = user.shift || 'morning';
        var empShiftSystem = user.shift_system || '3-shift';
        var sConf = getShiftConfig(shiftKey, empShiftSystem);
        if (sConf && sConf.end) {
          var endParts = sConf.end.split(':');
          var expectedEnd = new Date(timeNow);
          expectedEnd.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
          var extraMs = timeNow - expectedEnd;
          if (extraMs > 0) {
            overtimeHrs = parseFloat((extraMs / 3600000).toFixed(2));
            overtimeAmt = Math.round(overtimeHrs * hourlyRate * 1.5);
            if (overtimeAmt > 0) {
              sbClient.from('salary_adjustments').insert([{
                employee_id: user.id,
                employee_name: user.full_name,
                department: user.department,
                type: 'bonus',
                amount: overtimeAmt,
                reason: 'عمل إضافي: ' + overtimeHrs + ' ساعات × 1.5',
                month: timeNow.toISOString().substring(0, 7),
                requested_by: 'النظام (تلقائي)',
                status: 'approved'
              }]).then(function() {});
            }
          }
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
          var loc = pos.coords.latitude + ',' + pos.coords.longitude;
          updateCheckOut(rec.id, loc, workHrs, overtimeHrs, overtimeAmt, isFriday);
        }, function() { updateCheckOut(rec.id, null, workHrs, overtimeHrs, overtimeAmt, isFriday); });
      } else {
        updateCheckOut(rec.id, null, workHrs, overtimeHrs, overtimeAmt, isFriday);
      }
    }
  });

  function insertCheckIn(loc, delayMin) {
    sbClient.from('attendance').insert({
      employee_id: user.id,
      employee_name: user.full_name,
      department: user.department,
      date: dateStr,
      check_in: timeNow.toISOString(),
      shift: user.shift || 'morning',
      delay_minutes: delayMin,
      status: 'checked_in',
      check_in_location: loc
    }).then(function(r) {
      if(r.error) { showToast('DB Error: ' + r.error.message, 'danger'); return; }
      showToast('✅ Check-In successful!', 'success');
      sbClient.from('audit_log').insert({ action: 'CHECK_IN', user_name: user.full_name, user_id: user.id, details: 'Checked in at ' + timeNow.toLocaleTimeString() }).then(function(){});
    });
  }

  function updateCheckOut(id, loc, workHrs, otHrs, otAmt, isFriday) {
    sbClient.from('attendance').update({
      check_out: timeNow.toISOString(),
      working_hours: parseFloat(workHrs),
      status: 'present',
      check_out_location: loc,
      overtime_hours: otHrs || 0,
      overtime_amount: otAmt || 0,
      is_friday_work: isFriday || false
    }).eq('id', id).then(function(r) {
      if(r.error) { showToast('DB Error: ' + r.error.message, 'danger'); return; }
      var msg = '✅ Check-Out successful!';
      if (otHrs > 0) msg += ' (إضافي: ' + otHrs + ' ساعات = ' + otAmt + ' EGP)';
      showToast(msg, 'success');
      sbClient.from('audit_log').insert({ action: 'CHECK_OUT', user_name: user.full_name, user_id: user.id, details: 'Checked out at ' + timeNow.toLocaleTimeString() + (otHrs > 0 ? ' | OT: ' + otHrs + 'h' : '') }).then(function(){});
    });
  }
}

// ----- HR PERSONAL SCREEN (Full Dashboard) -----
Pages.hrPersonal = function(el) {
  var user = App.user;
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)"><span class="spinner"></span> Loading your profile...</div>';

  Promise.all([
    sbClient.from('attendance').select('*').eq('employee_id', user.id).order('date', {ascending: false}).limit(60),
    sbClient.from('leave_requests').select('*').eq('employee_id', user.id).order('created_at', {ascending: false}).limit(30),
    sbClient.from('salary_adjustments').select('*').eq('employee_id', user.id).order('created_at', {ascending: false}).limit(30),
    sbClient.from('missions').select('*').eq('employee_id', user.id).order('created_at', {ascending: false}).limit(30)
  ]).then(function(res) {
    var att = res[0].data || [];
    var leaves = res[1].data || [];
    var adj = res[2].data || [];
    var missions = res[3].data || [];

    var totalDays = att.length;
    var presentDays = att.filter(function(a) { return a.status === 'present' || a.status === 'Closed Automatically'; }).length;
    var totalDelay = att.reduce(function(s,a) { return s + (a.delay_minutes || 0); }, 0);
    var totalOT = att.reduce(function(s,a) { return s + (parseFloat(a.overtime_hours) || 0); }, 0);
    var pendingLeaves = leaves.filter(function(l) { return l.status === 'pending'; }).length;
    var bonuses = adj.filter(function(a) { return a.type === 'bonus'; }).reduce(function(s,a) { return s + Number(a.amount); }, 0);
    var penalties = adj.filter(function(a) { return a.type === 'penalty'; }).reduce(function(s,a) { return s + Number(a.amount); }, 0);

    var html = '<div style="margin-bottom:20px"><h3 style="margin:0">👤 ' + user.full_name + ' — ' + (user.position || user.role) + '</h3><p style="color:var(--text-muted);margin:4px 0 0">' + user.department + '</p></div>';

    // Stats
    html += '<div class="stats-grid">';
    html += _statCard('#22c55e', 'checkCircle', presentDays + '/' + totalDays, 'أيام الحضور');
    html += _statCard('#f59e0b', 'alertTriangle', totalDelay + 'm', 'إجمالي التأخير');
    html += _statCard('#6366f1', 'timer', totalOT.toFixed(1) + 'h', 'ساعات إضافية');
    html += _statCard('#ef4444', 'calendarDays', pendingLeaves, 'إجازات معلقة');
    html += '</div>';

    // Tabs
    html += '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">';
    html += '<button class="btn btn-outline" id="hp-tab-att" style="border-color:var(--accent-primary);color:var(--accent-primary)">📅 حضوري</button>';
    html += '<button class="btn btn-ghost" id="hp-tab-delays">⏰ تأخيراتي</button>';
    html += '<button class="btn btn-ghost" id="hp-tab-salary">💰 المرتب والخصومات</button>';
    html += '<button class="btn btn-ghost" id="hp-tab-ot">⏱️ الإضافي</button>';
    html += '<button class="btn btn-ghost" id="hp-tab-missions">🚗 مأمورياتي</button>';
    html += '</div>';

    // Tab 1: Attendance
    html += '<div id="hp-view-att">';
    html += '<div class="card"><div class="card-header"><h3>سجل الحضور والانصراف</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>ساعات العمل</th><th>التأخير</th><th>الحالة</th></tr></thead><tbody>';
    att.forEach(function(a) {
      var badge = (a.status === 'present' || a.status === 'Closed Automatically') ? 'badge-success' : a.status === 'leave' ? 'badge-warning' : a.status === 'checked_in' ? 'badge-info' : 'badge-danger';
      html += '<tr><td>' + formatDate(a.date) + '</td><td>' + formatTime(a.check_in) + '</td><td>' + formatTime(a.check_out) + '</td><td>' + (a.working_hours || '—') + 'h</td><td>' + (a.delay_minutes > 0 ? '<span style="color:var(--accent-warning);font-weight:600">' + a.delay_minutes + 'm</span>' : '0m') + '</td><td><span class="badge ' + badge + '">' + a.status + '</span></td></tr>';
    });
    if (att.length === 0) html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">لا يوجد سجلات</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Tab 2: Delays
    html += '<div id="hp-view-delays" style="display:none">';
    var delays = att.filter(function(a) { return a.delay_minutes > 0; });
    html += '<div class="card"><div class="card-header"><h3>تأخيراتي التفصيلية</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>التاريخ</th><th>الوردية</th><th>وقت الحضور</th><th>التأخير</th><th>نوع الخصم</th></tr></thead><tbody>';
    delays.forEach(function(d) {
      var deductType = d.delay_minutes > 360 ? 'يوم كامل' : d.delay_minutes > 120 ? 'نصف يوم' : d.delay_minutes > 15 ? 'ربع يوم' : 'بدون خصم';
      var deductColor = d.delay_minutes > 360 ? 'danger' : d.delay_minutes > 120 ? 'warning' : d.delay_minutes > 15 ? 'info' : 'success';
      html += '<tr><td>' + formatDate(d.date) + '</td><td>' + d.shift + '</td><td>' + formatTime(d.check_in) + '</td><td style="font-weight:700;color:var(--accent-warning)">' + d.delay_minutes + ' دقيقة</td><td><span class="badge badge-' + deductColor + '">' + deductType + '</span></td></tr>';
    });
    if (delays.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted)">لا يوجد تأخيرات 🎉</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Tab 3: Salary & Adjustments
    html += '<div id="hp-view-salary" style="display:none">';
    html += '<div style="display:flex;gap:16px;margin-bottom:16px"><div class="card" style="flex:1"><div class="card-body"><h4>الراتب الأساسي</h4><h2 style="color:var(--accent-primary)">' + (user.base_salary ? user.base_salary.toLocaleString() + ' EGP' : 'غير محدد') + '</h2></div></div>';
    html += '<div class="card" style="flex:1"><div class="card-body"><h4>إجمالي المكافآت</h4><h2 style="color:var(--accent-success)">+' + bonuses.toLocaleString() + ' EGP</h2></div></div>';
    html += '<div class="card" style="flex:1"><div class="card-body"><h4>إجمالي الخصومات</h4><h2 style="color:var(--accent-danger)">-' + penalties.toLocaleString() + ' EGP</h2></div></div></div>';
    html += '<div class="card"><div class="card-header"><h3>سجل المكافآت والخصومات</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>التاريخ</th><th>النوع</th><th>المبلغ</th><th>السبب</th><th>الحالة</th></tr></thead><tbody>';
    adj.forEach(function(a) {
      var isBonus = a.type === 'bonus';
      html += '<tr><td>' + formatDate(a.created_at) + '</td><td><span class="badge badge-' + (isBonus ? 'success' : 'danger') + '">' + (isBonus ? 'مكافأة' : 'خصم') + '</span></td><td style="font-weight:700;color:var(--accent-' + (isBonus ? 'success' : 'danger') + ')">' + (isBonus ? '+' : '-') + a.amount + ' EGP</td><td>' + (a.reason || '-') + '</td><td><span class="badge badge-' + (a.status === 'approved' ? 'success' : 'warning') + '">' + a.status + '</span></td></tr>';
    });
    if (adj.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:30px">لا يوجد سجلات</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Tab 4: Overtime
    html += '<div id="hp-view-ot" style="display:none">';
    var otRecs = att.filter(function(a) { return (parseFloat(a.overtime_hours) || 0) > 0; });
    html += '<div class="card"><div class="card-header"><h3>ساعات العمل الإضافي</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>التاريخ</th><th>ساعات العمل</th><th>ساعات إضافية</th><th>المبلغ</th></tr></thead><tbody>';
    otRecs.forEach(function(o) {
      html += '<tr><td>' + formatDate(o.date) + '</td><td>' + (o.working_hours || 0) + 'h</td><td style="font-weight:700;color:var(--accent-info)">+' + (o.overtime_hours || 0) + 'h</td><td style="font-weight:700;color:var(--accent-success)">' + (o.overtime_amount || 0) + ' EGP</td></tr>';
    });
    if (otRecs.length === 0) html += '<tr><td colspan="4" style="text-align:center;padding:30px">لا يوجد ساعات إضافية</td></tr>';
    html += '</tbody></table></div></div></div>';

    // Tab 5: Missions
    html += '<div id="hp-view-missions" style="display:none">';
    html += '<div class="card"><div class="card-header"><h3>مأمورياتي</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>التاريخ</th><th>الوجهة</th><th>خروج</th><th>عودة</th><th>الحالة</th></tr></thead><tbody>';
    missions.forEach(function(m) {
      var mBadge = m.status === 'approved' ? 'badge-success' : m.status === 'completed' ? 'badge-primary' : 'badge-warning';
      html += '<tr><td>' + formatDate(m.mission_date || m.created_at) + '</td><td>' + (m.destination || m.reason || '-') + '</td><td>' + (m.time_out || '—') + '</td><td>' + (m.time_in || '—') + '</td><td><span class="badge ' + mBadge + '">' + m.status + '</span></td></tr>';
    });
    if (missions.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:30px">لا يوجد مأموريات</td></tr>';
    html += '</tbody></table></div></div></div>';

    el.innerHTML = html;

    // Tab switching
    var tabs = ['att','delays','salary','ot','missions'];
    tabs.forEach(function(t, idx) {
      var btn = document.getElementById('hp-tab-' + t);
      if (btn) btn.addEventListener('click', function() {
        tabs.forEach(function(tt) {
          var b = document.getElementById('hp-tab-' + tt);
          var v = document.getElementById('hp-view-' + tt);
          if (b) { b.className = 'btn btn-ghost'; b.style.color = 'inherit'; b.style.borderColor = 'transparent'; }
          if (v) v.style.display = 'none';
        });
        this.className = 'btn btn-outline'; this.style.color = 'var(--accent-primary)'; this.style.borderColor = 'var(--accent-primary)';
        var view = document.getElementById('hp-view-' + t);
        if (view) view.style.display = 'block';
      });
    });
  });
};

// ----- LEAVES -----
Pages.leaves = function (el) {
  var isPersonalView = (App.activePage === 'my-leaves');
  var isHR = (App.isHR() || App.isOwner()) && !isPersonalView;
  var isManagerView = App.isManager() && !isHR && !isPersonalView;
  var canApprove = isHR || isManagerView;
  
  var leaves = [];

  var search = '';
  var statusFilter = '';
  var deptFilter = '';

  function render(data) {
    var html = '<div class="toolbar">';
    if (isHR) html += '<div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search employee..." id="lv-search" value="' + (search || '').replace(/"/g, '&quot;') + '"></div>';
    html += '<select class="filter-select" id="lv-status"><option value=""' + (statusFilter === '' ? ' selected' : '') + '>All Status</option><option value="pending"' + (statusFilter === 'pending' ? ' selected' : '') + '>Pending</option><option value="approved"' + (statusFilter === 'approved' ? ' selected' : '') + '>Approved</option><option value="rejected"' + (statusFilter === 'rejected' ? ' selected' : '') + '>Rejected</option></select>';
    if (isHR) { html += '<select class="filter-select" id="lv-dept"><option value="">All Departments</option>'; DEPARTMENTS.forEach(function (d) { html += '<option value="' + d + '"' + (deptFilter === d ? ' selected' : '') + '>' + d + '</option>'; }); html += '</select>'; }
    if (!isHR) html += '<button class="btn btn-primary" id="req-leave-btn">' + icon('plus') + ' Request Leave</button>';
    if (isHR) html += '<button class="btn btn-outline" id="lv-export">' + icon('download') + ' Export</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>' + (isHR ? 'All Leave Requests' : 'My Leave Requests') + '</h3><p>' + data.length + ' requests</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    if (canApprove) html += '<th>Employee</th><th>Department</th>';
    html += '<th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>';
    if (canApprove) html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    data.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }).forEach(function (l) {
      html += '<tr>';
      if (canApprove) html += '<td style="color:var(--text-primary);font-weight:500">' + l.employee_name + '</td><td>' + l.department + '</td>';
      html += '<td><span class="badge badge-info">' + l.type + '</span></td><td>' + formatDate(l.start_date) + '</td><td>' + formatDate(l.end_date) + '</td><td style="font-weight:600">' + l.days + '</td>';
      html += '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">' + l.reason + '</td>';
      var badge = l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning';
      var statusText = l.status;
      if (statusText === 'pending_manager') statusText = 'Pending Manager';
      if (statusText === 'pending_hr') statusText = 'Pending HR';
      if (statusText === 'pending_owner') statusText = 'Pending Owner';
      if (statusText === 'pending') statusText = 'Pending';
      
      var rejectHtml = l.rejection_reason ? '<br><small style="color:var(--accent-danger)">' + l.rejection_reason + '</small>' : '';
      
      html += '<td><span class="badge ' + badge + '"><span class="badge-dot"></span>' + statusText + '</span>' + rejectHtml + '</td>';
      
      if (canApprove) {
        html += '<td>';
        var canApproveThis = false;
        if (l.status === 'pending_manager' && isManagerView) canApproveThis = true;
        if ((l.status === 'pending_hr' || l.status === 'pending') && App.isHR()) canApproveThis = true;
        if (l.status === 'pending_owner' && App.isOwner()) canApproveThis = true;

        if (canApproveThis) {
            html += '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" data-approve="' + l.id + '">' + icon('checkCircle') + ' Approve</button><button class="btn btn-danger btn-xs" data-reject="' + l.id + '">' + icon('xCircle') + ' Reject</button></div>';
        } else if (l.status.indexOf('pending') !== -1) {
            html += '<span style="font-size:0.75rem;color:var(--text-muted)">Waiting Approval</span>';
        } else {
            html += '<span style="font-size:0.75rem;color:var(--text-muted)">By ' + (l.approved_by || 'System') + '</span>';
        }
        html += '</td>';
      }
      html += '</tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="' + (isHR ? 9 : 7) + '" style="text-align:center;padding:40px;color:var(--text-muted)">No leave requests found</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var searchEl = document.getElementById('lv-search');
    if (searchEl && search) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }

    // Events
    function applyFilters() {
      search = document.getElementById('lv-search') ? document.getElementById('lv-search').value.toLowerCase() : '';
      statusFilter = document.getElementById('lv-status').value;
      deptFilter = document.getElementById('lv-dept') ? document.getElementById('lv-dept').value : '';
      var f = leaves.filter(function (l) {
        if (search && l.employee_name && l.employee_name.toLowerCase().indexOf(search) === -1) return false;
        if (statusFilter && l.status !== statusFilter) return false;
        if (deptFilter && l.department !== deptFilter) return false;
        return true;
      });
      render(f);
    }
    if (document.getElementById('lv-search')) document.getElementById('lv-search').addEventListener('input', applyFilters);
    document.getElementById('lv-status').addEventListener('change', applyFilters);
    if (document.getElementById('lv-dept')) document.getElementById('lv-dept').addEventListener('change', applyFilters);
    if (document.getElementById('lv-export')) document.getElementById('lv-export').addEventListener('click', function () { exportToExcel(data, 'leave_report'); });

    // Request leave
    var reqBtn = document.getElementById('req-leave-btn');
    if (reqBtn) reqBtn.addEventListener('click', function () {
      var body = '<div class="form-row"><div class="form-field"><label>Leave Type</label><select id="lf-type">';
      var leaveTranslations = {
        'Annual': 'إجازة سنوية',
        'Sick': 'إجازة مرضية',
        'Emergency': 'إجازة عارضة',
        'Unpaid': 'إجازة بدون راتب',
        'Maternity/Paternity': 'إجازة وضع/أبوة'
      };
      LEAVE_TYPES.forEach(function (t) { body += '<option value="' + t + '">' + (leaveTranslations[t] || t) + '</option>'; });
      body += '</select></div></div><div class="form-row"><div class="form-field"><label>Start Date</label><input type="date" id="lf-start"></div><div class="form-field"><label>End Date</label><input type="date" id="lf-end"></div></div>';
      body += '<div class="form-field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="lf-half" style="width:18px;height:18px"><label for="lf-half" style="margin:0;cursor:pointer">Half Day (نصف يوم)</label></div>';
      body += '<div class="form-field" style="margin-bottom:0"><label>Reason</label><textarea id="lf-reason" placeholder="Explain the reason for your leave..."></textarea></div>';
      App.showModal('Request Leave', body, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="submit-leave">Submit Request</button>');
      document.getElementById('submit-leave').addEventListener('click', function () {
        var type = document.getElementById('lf-type').value;
        var start = document.getElementById('lf-start').value;
        var end = document.getElementById('lf-end').value;
        var reason = document.getElementById('lf-reason').value;
        var isHalf = document.getElementById('lf-half').checked;
        if (!start || !reason) return;
        if (!end) end = start;

        var sDate = new Date(start);
        
        // 24-Hour Rule
        if (App.user.role !== 'hr') {
          var now = new Date();
          var requestTime = new Date(sDate);
          requestTime.setHours(0, 0, 0, 0);
          var timeDiff = requestTime - now;
          if (timeDiff < 24 * 60 * 60 * 1000) {
             alert('Leave requests must be submitted at least 24 hours before the requested leave date. (يجب تقديم الطلب قبل 24 ساعة على الأقل)');
             return;
          }
        }

        var eDate = new Date(end);
        var duration = Math.ceil((eDate - sDate) / 86400000) + 1;
        var days = 0;

        if (isHalf) {
          days = 0.5;
        } else if (duration >= 7) {
          days = duration; // Includes Fridays
        } else {
          for (var d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
            if (d.getDay() !== 5) days++; // 5 is Friday
          }
        }

        var initialStatus = 'pending_manager';
        if (App.user.position && App.user.position.toLowerCase().includes('manager')) {
           if (App.user.role === 'hr manager') {
               initialStatus = 'pending_owner';
           } else {
               initialStatus = 'pending_hr';
           }
        }

        var newLeave = { employee_id: App.user.id, employee_name: App.user.full_name, department: App.user.department, type: type, start_date: start, end_date: end, days: days, reason: reason, status: initialStatus, created_at: new Date().toISOString() };
        sbClient.from('leave_requests').insert([newLeave]).select().single().then(function (r) {
          if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); }
          if (r.data) leaves.unshift(r.data); render(leaves);
        });
        App.closeModal();
        render(leaves);
        showToast('Leave request submitted!', 'success');
      });
    });

    // Approve / Reject
    document.querySelectorAll('[data-approve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-approve');
        handleLeaveAction(id, 'approved');
      });
    });
    document.querySelectorAll('[data-reject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-reject');
        handleLeaveAction(id, 'rejected');
      });
    });
  }

  function handleLeaveAction(id, action) {
    var l = leaves.find(function (x) { return x.id === id; });
    if (!l) return;

    var newStatus = action;
    var rejectionReason = null;

    if (action === 'rejected') {
       rejectionReason = prompt('برجاء كتابة سبب الرفض (Please enter rejection reason):');
       if (rejectionReason === null) return; // User cancelled
    } else if (action === 'approved') {
       if (l.status === 'pending_manager' && isManagerView) {
           newStatus = 'pending_hr'; // Manager approved, goes to HR
       }
    }

    var updates = { status: newStatus, approved_by: App.user.full_name };
    if (rejectionReason) updates.rejection_reason = rejectionReason;

    sbClient.from('leave_requests').update(updates).eq('id', id).then(function (r) {
      if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); return; }

      if (newStatus === 'approved') {
        if (l.type === 'Annual') {
          sbClient.from('users').select('annual_leave_balance').eq('id', l.employee_id).single().then(function (res) {
            if (res.data) {
              var currentBalance = res.data.annual_leave_balance !== null ? res.data.annual_leave_balance : 24;
              var newBalance = Math.max(0, currentBalance - l.days);
              sbClient.from('users').update({ annual_leave_balance: newBalance }).eq('id', l.employee_id).then(function (uRes) { });
            }
          });
        }

        var sDate = new Date(l.start_date);
        var eDate = new Date(l.end_date);
        var duration = Math.ceil((eDate - sDate) / 86400000) + 1;
        var attRecords = [];
        for (var d = new Date(sDate); d <= eDate; d.setDate(d.getDate() + 1)) {
           if (l.days !== 0.5 && duration < 7 && d.getDay() === 5) continue;
           var dateStr = d.toISOString().substring(0, 10);
           attRecords.push({
             employee_id: l.employee_id,
             employee_name: l.employee_name,
             department: l.department,
             date: dateStr,
             check_in: null,
             check_out: null,
             shift: 'morning',
             working_hours: 0,
             delay_minutes: 0,
             status: 'leave'
           });
        }

        if (attRecords.length > 0) {
           var dates = attRecords.map(function(r) { return r.date; });
           sbClient.from('attendance').delete().eq('employee_id', l.employee_id).in('date', dates).then(function() {
               sbClient.from('attendance').insert(attRecords).then(function() {});
           });
        }
      }
    });

    sbClient.from('audit_log').insert({ action: action === 'approved' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED', user_name: App.user.full_name, user_id: App.user.id, details: 'Leave status changed to ' + newStatus + ' for ID: ' + id }).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); } });

    leaves = leaves.map(function (l) {
      if (l.id === id) {
        var nMsg = 'Your ' + l.type + ' leave (' + formatDate(l.start_date) + ' - ' + formatDate(l.end_date) + ') status updated to ' + newStatus;
        if (rejectionReason) nMsg += '. Reason: ' + rejectionReason;
        App.addNotification({ user_id: l.employee_id, type: 'leave_update', title: 'Leave Update', message: nMsg });
        
        var upd = { status: newStatus, approved_by: App.user.full_name };
        if (rejectionReason) upd.rejection_reason = rejectionReason;
        return Object.assign({}, l, upd);
      }
      return l;
    });
    render(leaves);
    showToast('Leave action applied successfully!', 'success');
  }

  {
    var query = sbClient.from('leave_requests').select('*').order('created_at', { ascending: false });
    if (isPersonalView) {
       query = query.eq('employee_id', App.user.id);
    } else if (isManagerView) {
       query = query.eq('department', App.user.department);
    }
    query.then(function (res) { if (res.data) { leaves = res.data; render(leaves); } });
  }
  render(leaves);
};

// ----- SHIFTS -----
Pages.shifts = function (el) {
  var employees = [];
  function render() {
    var twoShiftCount = employees.filter(function (e) { return (e.shift_system || '3-shift') === '2-shift'; }).length;
    var threeShiftCount = employees.filter(function (e) { return (e.shift_system || '3-shift') === '3-shift'; }).length;
    var colors = { day: '#fbbf24', morning: '#fbbf24', evening: '#fb923c', night: '#818cf8' };
    var shiftIcons = { day: 'sun', morning: 'sun', evening: 'sunset', night: 'moon' };

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#6366f1', 'users', employees.length, 'Total Employees');
    html += _statCard('#22c55e', 'clock', twoShiftCount, '2-Shift System (12h)');
    html += _statCard('#06b6d4', 'clock', threeShiftCount, '3-Shift System (8h)');
    html += '</div>';
    html += '<div class="toolbar"><div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search employees..." id="sh-search"></div>';
    html += '<select class="filter-select" id="sh-dept"><option value="">All Departments</option>'; DEPARTMENTS.forEach(function (d) { html += '<option value="' + d + '">' + d + '</option>'; }); html += '</select>';
    html += '<select class="filter-select" id="sh-system"><option value="">All Systems</option><option value="2-shift">2-Shift (12h)</option><option value="3-shift">3-Shift (8h)</option></select></div>';

    html += '<div class="card"><div class="card-header"><div><h3>Shift Assignments</h3><p>' + employees.length + ' employees</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Shift System</th><th>Current Shift</th><th>Hours</th><th>Change System</th><th>Change Shift</th></tr></thead><tbody>';
    employees.forEach(function (emp) {
      var sys = emp.shift_system || '3-shift';
      var conf = getShiftConfig(emp.shift, sys);
      html += '<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="sidebar-avatar" style="background:' + (emp.avatar_color || '#6366f1') + ';width:32px;height:32px;font-size:0.7rem">' + getInitials(emp.full_name) + '</div><span style="color:var(--text-primary);font-weight:500">' + emp.full_name + '</span></div></td><td>' + emp.department + '</td>';
      html += '<td><span class="badge badge-info" style="font-size:0.72rem">' + (sys === '2-shift' ? '2-Shift (12h)' : '3-Shift (8h)') + '</span></td>';
      html += '<td><span class="shift-badge shift-' + emp.shift + '">' + icon('clock', 11) + ' ' + conf.label + '</span></td>';
      html += '<td>' + conf.start + ' - ' + conf.end + ' (' + conf.hours + 'h)</td>';
      html += '<td><select class="filter-select" style="padding:6px 10px" data-system-emp="' + emp.id + '">';
      html += '<option value="2-shift"' + (sys === '2-shift' ? ' selected' : '') + '>2-Shift (12h)</option>';
      html += '<option value="3-shift"' + (sys === '3-shift' ? ' selected' : '') + '>3-Shift (8h)</option>';
      html += '</select></td>';
      html += '<td><select class="filter-select" style="padding:6px 10px" data-shift-emp="' + emp.id + '" data-emp-system="' + sys + '">';
      var availShifts = getShiftsForSystem(sys);
      availShifts.forEach(function (s) { html += '<option value="' + s.key + '"' + (emp.shift === s.key ? ' selected' : '') + '>' + s.label + '</option>'; });
      html += '</select></td></tr>';
    });
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    // Change shift system
    document.querySelectorAll('[data-system-emp]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var empId = this.getAttribute('data-system-emp');
        var newSystem = this.value;
        var defaultShift = newSystem === '2-shift' ? 'day' : 'morning';
        employees = employees.map(function (e) { return e.id === empId ? Object.assign({}, e, { shift_system: newSystem, shift: defaultShift }) : e; });
        sbClient.from('users').update({ shift_system: newSystem, shift: defaultShift }).eq('id', empId).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
        showToast('Shift system updated!', 'success');
        render();
      });
    });

    // Change shift
    document.querySelectorAll('[data-shift-emp]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var empId = this.getAttribute('data-shift-emp');
        var newShift = this.value;
        employees = employees.map(function (e) { return e.id === empId ? Object.assign({}, e, { shift: newShift }) : e; });
        sbClient.from('users').update({ shift: newShift }).eq('id', empId).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
        showToast('Shift updated!', 'success');
        render();
      });
    });
  }
  {
    sbClient.from('users').select('*').then(function (r) {
      if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); }
      if (r.data) { employees = r.data; render(); }
    });
  }
  render();
};

// ----- OVERTIME -----
Pages.overtime = function (el) {
  var isPersonalView = (App.activePage === 'my-overtime');
  var isHR = App.isHR() && !isPersonalView;
  var overtime = isHR ? [] : [].filter(function (o) { return o.employee_id === App.user.id; });

  var search = '';
  var statusFilter = '';

  var search = '';
  var statusFilter = '';

  function render(data) {
    var totalApproved = data.filter(function (o) { return o.status === 'approved'; }).reduce(function (s, o) { return s + o.hours; }, 0);
    var totalPending = data.filter(function (o) { return o.status === 'pending'; }).reduce(function (s, o) { return s + o.hours; }, 0);

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#22c55e', 'checkCircle', totalApproved + 'h', 'Approved Hours');
    html += _statCard('#f59e0b', 'timer', totalPending + 'h', 'Pending Approval');
    html += _statCard('#6366f1', 'timer', data.length, 'Total Records');
    html += '</div>';

    html += '<div class="toolbar">';
    if (isHR) html += '<div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search employee..." id="ot-search" value="' + (search || '').replace(/"/g, '&quot;') + '"></div>';
    html += '<select class="filter-select" id="ot-status"><option value=""' + (statusFilter === '' ? ' selected' : '') + '>All Status</option><option value="pending"' + (statusFilter === 'pending' ? ' selected' : '') + '>Pending</option><option value="approved"' + (statusFilter === 'approved' ? ' selected' : '') + '>Approved</option><option value="rejected"' + (statusFilter === 'rejected' ? ' selected' : '') + '>Rejected</option></select>';
    if (!isHR) html += '<button class="btn btn-primary" id="log-ot-btn">' + icon('plus') + ' Log Overtime</button>';
    html += '<button class="btn btn-outline" id="ot-export">' + icon('download') + ' Export</button></div>';

    html += '<div class="card"><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    if (isHR) html += '<th>Employee</th><th>Department</th>';
    html += '<th>Date</th><th>Hours</th><th>Rate</th><th>Reason</th><th>Status</th>';
    if (isHR) html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    data.sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).forEach(function (o) {
      html += '<tr>';
      if (isHR) html += '<td style="color:var(--text-primary);font-weight:500">' + o.employee_name + '</td><td>' + o.department + '</td>';
      html += '<td>' + formatDate(o.date) + '</td><td style="font-weight:700">' + o.hours + 'h</td><td>' + o.rate + 'x</td>';
      html += '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">' + o.reason + '</td>';
      var badge = o.status === 'approved' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger';
      html += '<td><span class="badge ' + badge + '"><span class="badge-dot"></span>' + o.status.charAt(0).toUpperCase() + o.status.slice(1) + '</span></td>';
      if (isHR) {
        html += '<td>';
            if (o.status === 'pending') {
      if (typeof canApprove === 'function' && canApprove(o.employee_id, o.requester_role)) {
        html += '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" data-ot-approve="' + o.id + '">' + icon('checkCircle') + ' Approve</button><button class="btn btn-danger btn-xs" data-ot-reject="' + o.id + '">' + icon('xCircle') + ' Reject</button></div>';
      } else {
        html += '<span style="font-size:0.75rem;color:var(--text-muted)">Waiting Higher Approval</span>';
      }
    }
        else html += '<span style="font-size:0.75rem;color:var(--text-muted)">By ' + o.approved_by + '</span>';
        html += '</td>';
      }
      html += '</tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="' + (isHR ? 8 : 6) + '" style="text-align:center;padding:40px;color:var(--text-muted)">No overtime records</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var searchEl = document.getElementById('ot-search');
    if (searchEl && search) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }

    // Events
    function applyFilters() {
      search = document.getElementById('ot-search') ? document.getElementById('ot-search').value.toLowerCase() : '';
      statusFilter = document.getElementById('ot-status').value;
      render(overtime.filter(function (o) {
        if (search && o.employee_name && o.employee_name.toLowerCase().indexOf(search) === -1) return false;
        if (statusFilter && o.status !== statusFilter) return false;
        return true;
      }));
    }
    if (document.getElementById('ot-search')) document.getElementById('ot-search').addEventListener('input', applyFilters);
    document.getElementById('ot-status').addEventListener('change', applyFilters);
    document.getElementById('ot-export').addEventListener('click', function () { exportToExcel(data, 'overtime_report'); });

    if (document.getElementById('log-ot-btn')) document.getElementById('log-ot-btn').addEventListener('click', function () {
      var body = '<div class="form-row"><div class="form-field"><label>Date</label><input type="date" id="otf-date"></div><div class="form-field"><label>Hours</label><input type="number" step="0.5" min="0.5" max="8" id="otf-hours" placeholder="e.g. 2"></div></div><div class="form-field" style="margin-bottom:16px"><label>Rate Multiplier</label><select id="otf-rate"><option value="1.5">1.5x (Regular Overtime)</option><option value="2">2x (Holiday/Weekend)</option></select></div><div class="form-field"><label>Reason</label><textarea id="otf-reason" placeholder="Why did you work overtime?"></textarea></div>';
      App.showModal('Log Overtime Hours', body, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="submit-ot">Submit for Approval</button>');
      document.getElementById('submit-ot').addEventListener('click', function () {
        var date = document.getElementById('otf-date').value;
        var hours = Number(document.getElementById('otf-hours').value);
        var reason = document.getElementById('otf-reason').value;
        var rate = Number(document.getElementById('otf-rate').value);
        if (!date || !hours || !reason) return;
        var newOT = { employee_id: App.user.id, employee_name: App.user.full_name, department: App.user.department, date: date, hours: hours, reason: reason, status: 'pending', rate: rate, approved_by: null };
        sbClient.from('overtime').insert([newOT]).select().single().then(function (r) {
          if (r.error) { alert('Error: ' + r.error.message); return; }
          if (r.data) {
            overtime.unshift(r.data);
            render(overtime);
          }
        });
        App.closeModal();
        showToast('Overtime submitted!', 'success');
      });
    });

    
    if (isHR) {
      function loadHRFridayWork() {
        sbClient.from('friday_work_requests').select('*').order('created_at', {ascending:false}).then(function(r) {
          var tb = document.getElementById('hr-friday-tbody');
          if(!tb) return;
          if(r.error || !r.data || r.data.length===0) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">No Friday Work requests</td></tr>'; return; }
          
          window.fwData = r.data;
          var h = '';
          r.data.forEach(function(fw) {
            var sc = fw.status === 'approved' ? 'badge-success' : fw.status === 'rejected' ? 'badge-danger' : 'badge-warning';
            h += '<tr>';
            h += '<td>' + fw.department + '</td>';
            h += '<td>' + fw.requested_by_name + '</td>';
            h += '<td>' + formatDate(fw.request_date) + '</td>';
            h += '<td style="font-weight:700">' + (fw.employees ? fw.employees.length : 0) + ' Employees</td>';
            h += '<td><span class="badge ' + sc + '"><span class="badge-dot"></span>' + fw.status + '</span></td>';
            h += '<td>';
            if (fw.status === 'pending') {
              h += '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" onclick="approveFridayWork(\'' + fw.id + '\')">Approve</button><button class="btn btn-danger btn-xs" onclick="rejectFridayWork(\'' + fw.id + '\')">Reject</button></div>';
            }
            h += '</td></tr>';
          });
          tb.innerHTML = h;
        });
      }

      window.approveFridayWork = function(id) {
        sbClient.from('friday_work_requests').update({status:'approved'}).eq('id',id).then(function(r) {
          if(!r.error) { showToast('Approved!', 'success'); loadHRFridayWork(); }
        });
      };
      window.rejectFridayWork = function(id) {
        sbClient.from('friday_work_requests').update({status:'rejected'}).eq('id',id).then(function(r) {
          if(!r.error) { showToast('Rejected!', 'danger'); loadHRFridayWork(); }
        });
      };

      loadHRFridayWork();
    }

    document.querySelectorAll('[data-ot-approve]').forEach(function (btn) { btn.addEventListener('click', function () { handleOTAction(this.getAttribute('data-ot-approve'), 'approved'); }); });
    document.querySelectorAll('[data-ot-reject]').forEach(function (btn) { btn.addEventListener('click', function () { handleOTAction(this.getAttribute('data-ot-reject'), 'rejected'); }); });
  }

  function handleOTAction(id, action) {
    sbClient.from('overtime').update({ status: action, approved_by: App.user.full_name }).eq('id', id).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
    overtime = overtime.map(function (o) {
      if (o.id === id) {
        App.addNotification({ user_id: o.employee_id, type: action === 'approved' ? 'overtime_approved' : 'overtime_rejected', title: 'Overtime ' + (action === 'approved' ? 'Approved ✅' : 'Rejected ❌'), message: 'Your ' + o.hours + 'h overtime on ' + formatDate(o.date) + ' has been ' + action + '.' });
        return Object.assign({}, o, { status: action, approved_by: App.user.full_name });
      }
      return o;
    });
    render(overtime);
    showToast('Overtime ' + action + '!', action === 'approved' ? 'success' : 'error');
  }

  {
    var q = sbClient.from('overtime').select('*').order('date', { ascending: false });
    if (!isHR) q = q.eq('employee_id', App.user.id);
    q.then(function (r) {
      if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); }
      if (r.data) { overtime = r.data; render(overtime); }
    });
  }
  render(overtime);
};

// ----- PAYROLL -----
Pages.payroll = function (el) {
  var isPersonalView = (App.activePage === 'my-salary');
  var isHRManagerOrOwner = App.user && (App.user.role === 'hr manager' || App.user.role === 'owner') && !isPersonalView;
  var isFinance = App.user && App.user.department === 'Finance' && !isPersonalView;
  var isHR = isHRManagerOrOwner || isFinance;
  var payroll = isHR ? [] : [].filter(function (p) { return p.employee_id === App.user.id; });
  var medicalClaims = [];
  var salaryAdjustments = [];

  var search = '';
  var monthFilter = '';
  var statusFilter = '';

  function render(data) {
    var totalPayroll = data.reduce(function (s, p) { return s + p.net_salary; }, 0);
    var paidCount = data.filter(function (p) { return p.status === 'paid'; }).length;
    var processingCount = data.filter(function (p) { return p.status === 'processing'; }).length;

    var html = '';

    // Employee Current Month Salary Card
    if (!isHR && data.length > 0) {
      var latestP = data[0];
      var isFirstDay = new Date().getDate() === 1;
      var totalDed = (latestP.penalties || 0) + (latestP.late_deductions || 0) + (latestP.absence_deductions || 0);

      var deductionReasons = [];
      if (latestP.absence_deductions > 0) deductionReasons.push("غياب وأيام انقطاع");
      if (latestP.late_deductions > 0) deductionReasons.push("تأخيرات دقائق الحضور");
      if (latestP.penalties > 0) deductionReasons.push("جزاءات وخصومات إدارية");
      var deductionReasonsStr = deductionReasons.length > 0 ? deductionReasons.join(" و ") : "لا يوجد خصومات";

      var monthlyAdjustments = salaryAdjustments.filter(function (adj) {
        return adj.month === latestP.month;
      });
      var bonusesHtml = '';
      var penaltiesHtml = '';
      monthlyAdjustments.forEach(function (adj) {
        if (adj.type === 'bonus') {
          bonusesHtml += '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;display:flex;justify-content:space-between"><span>🎁 ' + adj.reason + '</span><span style="color:var(--accent-success);font-weight:600">+' + adj.amount + ' EGP</span></div>';
        } else {
          penaltiesHtml += '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;display:flex;justify-content:space-between"><span>⚠️ ' + adj.reason + '</span><span style="color:var(--accent-danger);font-weight:600">-' + adj.amount + ' EGP</span></div>';
        }
      });
      if (latestP.absence_deductions > 0) {
        penaltiesHtml += '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px;display:flex;justify-content:space-between"><span>🚫 غياب وأيام انقطاع</span><span style="color:var(--accent-danger);font-weight:600">-' + latestP.absence_deductions + ' EGP</span></div>';
      }

      var monthlyMedicalClaims = medicalClaims.filter(function (m) {
        return m.created_at && m.created_at.substring(0, 7) === latestP.month;
      });
      var totalMedicalDisbursed = monthlyMedicalClaims.reduce(function (sum, m) { return sum + (m.amount || 0); }, 0);

      var titleText = isFirstDay ? "💰 القبض نزل! تفاصيل راتبك لشهر " + latestP.month : "💵 تفاصيل راتبك لشهر " + latestP.month;
      var alertClass = isFirstDay ? "alert-success-pulse" : "alert-normal-salary";

      html += '<style>' +
        '@keyframes pulse-green {' +
        '  0% { transform: scale(1); }' +
        '  50% { transform: scale(1.005); box-shadow: 0 0 15px rgba(34, 197, 94, 0.2); }' +
        '  100% { transform: scale(1); }' +
        '}' +
        '.alert-success-pulse {' +
        '  border: 2px solid var(--accent-success) !important;' +
        '  animation: pulse-green 2s infinite;' +
        '}' +
        '</style>';

      html += '<div class="card ' + alertClass + '" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg);">';
      html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
      html += '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-success-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-success)">' + icon('dollarSign', 22) + '</div>';
      html += '<h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">' + titleText + '</h3>';
      html += '</div>';

      html += '<div style="font-size:0.95rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;text-align:right;direction:rtl">';
      html += 'أهلاً بك <strong>' + App.user.full_name + '</strong>، إليك تفصيل راتبك لشهر ' + latestP.month + ':';
      html += '</div>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:16px;margin-bottom:20px;direction:rtl;text-align:right">';

      html += '<div style="background:var(--bg-secondary);padding:14px;border-radius:var(--radius-md);border-right:4px solid var(--accent-primary)">';
      html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">الراتب الأساسي</div>';
      html += '<div style="font-size:1.1rem;font-weight:700;color:var(--text-primary)">EGP ' + (latestP.base_salary || 0).toLocaleString() + '</div>';
      html += '</div>';

      html += '<div style="background:var(--bg-secondary);padding:14px;border-radius:var(--radius-md);border-right:4px solid var(--accent-success)">';
      html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">العمل الإضافي والحوافز</div>';
      var totalOTandBonus = (latestP.overtime_pay || 0) + (latestP.bonuses || 0);
      html += '<div style="font-size:1.1rem;font-weight:700;color:var(--accent-success)">+EGP ' + totalOTandBonus.toLocaleString() + '</div>';
      if (bonusesHtml) {
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px">' + bonusesHtml + '</div>';
      } else {
        html += '<div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:2px">الإضافي: EGP ' + (latestP.overtime_pay || 0).toLocaleString() + '</div>';
      }
      html += '</div>';

      html += '<div style="background:var(--bg-secondary);padding:14px;border-radius:var(--radius-md);border-right:4px solid var(--accent-danger)">';
      html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">إجمالي الخصومات</div>';
      html += '<div style="font-size:1.1rem;font-weight:700;color:var(--accent-danger)">-EGP ' + (totalDed || 0).toLocaleString() + '</div>';
      if (penaltiesHtml) {
        html += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.05);padding-top:6px">' + penaltiesHtml + '</div>';
      } else {
        html += '<div style="font-size:0.72rem;color:var(--text-tertiary);margin-top:2px">السبب: ' + deductionReasonsStr + '</div>';
      }
      html += '</div>';

      if (totalMedicalDisbursed > 0) {
        html += '<div style="background:var(--bg-secondary);padding:14px;border-radius:var(--radius-md);border-right:4px solid var(--accent-info)">';
        html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">صرف روشتة / بدل علاج وعمليات</div>';
        html += '<div style="font-size:1.1rem;font-weight:700;color:var(--accent-info)">+EGP ' + totalMedicalDisbursed.toLocaleString() + '</div>';
        html += '</div>';
      }

      html += '</div>';

      var displayNet = latestP.net_salary + totalMedicalDisbursed;
      html += '<div style="border-top:1px solid var(--border-color);padding-top:16px;display:flex;justify-content:space-between;align-items:center;direction:rtl">';
      html += '<span style="font-size:1.05rem;font-weight:800;color:var(--text-primary)">صافي القبض المستلم (الإجمالي)</span>';
      html += '<span style="font-size:1.5rem;font-weight:900;color:var(--accent-primary-hover)">EGP ' + displayNet.toLocaleString() + '</span>';
      html += '</div>';

      html += '</div>';
    } else if (!isHR && data.length === 0) {
      html += '<div class="card" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg); text-align:center">';
      html += '<div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:8px">💵 تفاصيل راتبك التعاقدي</div>';
      html += '<p style="color:var(--text-secondary)">مرتبك الأساسي المسجل في النظام هو: <strong style="color:var(--accent-primary)">EGP ' + (App.user.base_salary || 0).toLocaleString() + '</strong> شهرياً.</p>';
      html += '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px">سيتم عرض تفاصيل القبض هنا فور اعتماده من الحسابات.</p>';
      html += '</div>';
    }

    var htmlStats = '<div class="stats-grid" style="margin-bottom:24px">';
    htmlStats += _statCard('#6366f1', 'dollarSign', 'EGP ' + totalPayroll.toLocaleString(), isHR ? 'Total Payroll' : 'Total Earnings');
    if (isHR) { htmlStats += _statCard('#22c55e', 'trendingUp', paidCount, 'Paid'); htmlStats += _statCard('#f59e0b', 'fileText', processingCount, 'Processing'); }
    htmlStats += '</div>';

    html += htmlStats;

    html += '<div class="toolbar">';
    if (isHR) html += '<div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search employee..." id="pay-search" value="' + (search || '').replace(/"/g, '&quot;') + '"></div>';
    html += '<input type="month" class="filter-select" id="pay-month" value="' + monthFilter + '"><select class="filter-select" id="pay-status"><option value=""' + (statusFilter === '' ? ' selected' : '') + '>All Status</option><option value="paid"' + (statusFilter === 'paid' ? ' selected' : '') + '>Paid</option><option value="processing"' + (statusFilter === 'processing' ? ' selected' : '') + '>Processing</option></select>';
    html += '' + (isHRManagerOrOwner ? '<button class="btn btn-primary" id="add-payroll" style="margin-right:8px">' + icon('plus') + ' Process Salary</button><button class="btn btn-outline" id="add-adj-direct-btn" style="margin-right:8px">' + icon('plus') + ' Add Manual Amount</button>' : '') + '<button class="btn btn-outline" id="pay-export">' + icon('download') + ' Export</button></div>';

    if (!isHR && salaryAdjustments && salaryAdjustments.length > 0) {
      html += '<div class="card" style="margin-bottom:24px"><div class="card-header"><div><h3 style="color:var(--text-primary)">📋 سجل الخصومات والمكافآت التفصيلي</h3><p>' + salaryAdjustments.length + ' سجلات محفوظة في الداتا بيز</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table" style="direction:rtl;text-align:right"><thead><tr>';
      html += '<th>التاريخ</th><th>الشهر</th><th>النوع</th><th>المبلغ</th><th>السبب</th></tr></thead><tbody>';
      var sortedAdjs = salaryAdjustments.slice().sort(function (a, b) { return new Date(b.created_at || 0) - new Date(a.created_at || 0); });
      sortedAdjs.forEach(function (adj) {
        var isBonus = adj.type === 'bonus';
        html += '<tr>';
        html += '<td style="direction:ltr;text-align:right">' + (adj.created_at ? formatDate(adj.created_at) : '-') + '</td>';
        html += '<td>' + adj.month + '</td>';
        html += '<td><span class="badge ' + (isBonus ? 'badge-success' : 'badge-danger') + '">' + (isBonus ? 'مكافأة' : 'خصم') + '</span></td>';
        html += '<td style="font-weight:bold;color:' + (isBonus ? 'var(--accent-success)' : 'var(--accent-danger)') + '">' + (isBonus ? '+' : '-') + 'EGP ' + adj.amount + '</td>';
        html += '<td>' + adj.reason + '</td>';
        html += '</tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    html += '<div class="card"><div class="card-header"><div><h3>' + (isHR ? 'Payroll Records' : 'My Salary History') + '</h3><p>' + data.length + ' records</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    if (isHR) html += '<th>Employee</th><th>Department</th>';
    html += '<th>Month</th><th>Base</th><th>Overtime</th><th>Bonuses</th><th>Deductions</th><th>Net Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    data.forEach(function (p) {
      var totalDed = (p.penalties || 0) + (p.late_deductions || 0) + (p.absence_deductions || 0);
      html += '<tr>';
      if (isHR) html += '<td style="color:var(--text-primary);font-weight:500">' + p.employee_name + '</td><td>' + p.department + '</td>';
      html += '<td style="font-weight:600">' + p.month + '</td><td>EGP ' + (p.base_salary || 0).toLocaleString() + '</td>';
      html += '<td style="color:var(--accent-success)">+' + (p.overtime_pay || 0).toLocaleString() + '</td>';
      html += '<td style="color:var(--accent-info)">+' + ((p.bonuses || 0) + (p.performance_bonus || 0)).toLocaleString() + '</td>';
      html += '<td style="color:' + (totalDed > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)') + '">' + ((totalDed || 0) > 0 ? '-' + (totalDed || 0).toLocaleString() : '0') + '</td>';
      html += '<td style="font-weight:800;color:var(--accent-primary-hover);font-size:0.95rem">EGP ' + (p.net_salary || 0).toLocaleString() + '</td>';
      html += '<td>' + (p.status === 'paid' ? '<span class="badge badge-success"><span class="badge-dot"></span>Paid</span>' : (p.status === 'funds_accepted' ? '<span class="badge badge-info"><span class="badge-dot"></span>Ready to Pay</span>' : (p.status === 'funds_released' ? '<span class="badge badge-primary"><span class="badge-dot"></span>Awaiting HR</span>' : '<span class="badge badge-warning"><span class="badge-dot"></span>Processing</span>'))) + '</td>';
      html += '<td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-icon" data-view-slip="' + p.id + '" title="View Slip">' + icon('eye') + '</button>';
      if (isHRManagerOrOwner && p.status === 'funds_accepted') {
        html += '<button class="btn btn-success btn-xs" data-mark-paid="' + p.id + '">Mark Paid</button>';
      } else if (isHRManagerOrOwner && p.status === 'funds_released') {
        html += '<span style="color:var(--accent-warning);font-size:0.75rem;font-weight:600">Please Accept Funds</span>';
      } else if (isHRManagerOrOwner && p.status === 'processing') {
        html += '<span style="color:var(--text-muted);font-size:0.75rem">Waiting Funds</span>';
      } else if (isFinance && p.status === 'processing') {
        html += '<span style="color:var(--text-muted);font-size:0.75rem">Review Funding</span>';
      }
      html += '</div></td></tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="' + (isHR ? 10 : 8) + '" style="text-align:center;padding:40px;color:var(--text-muted)">No payroll records</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var searchEl = document.getElementById('pay-search');
    if (searchEl && search) {
      searchEl.focus();
      searchEl.setSelectionRange(search.length, search.length);
    }

    // Events
    function applyFilters() {
      search = document.getElementById('pay-search') ? document.getElementById('pay-search').value.toLowerCase() : '';
      monthFilter = document.getElementById('pay-month').value;
      statusFilter = document.getElementById('pay-status').value;
      render(payroll.filter(function (p) {
        if (search && p.employee_name && p.employee_name.toLowerCase().indexOf(search) === -1) return false;
        if (monthFilter && p.month !== monthFilter) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        return true;
      }));
    }
    if (document.getElementById('pay-search')) document.getElementById('pay-search').addEventListener('input', applyFilters);
    document.getElementById('pay-month').addEventListener('change', applyFilters);
    document.getElementById('pay-status').addEventListener('change', applyFilters);
    document.getElementById('pay-export').addEventListener('click', function () { exportToExcel(data, 'payroll_report'); });

    if (document.getElementById('add-payroll')) {
      document.getElementById('add-payroll').addEventListener('click', function () {
        sbClient.from('users').select('id, full_name, base_salary, department, insurance_active, insurance_start, created_at, insurance_salary').eq('status', 'active').then(function (res) {
          var users = res.data || [];
          var monthVal = new Date().toISOString().substring(0, 7);
          var b = '<div class="form-row"><div class="form-field"><label>Employee *</label><select id="pf-emp"><option value="">-- Select --</option>';
          users.forEach(function (u) { b += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-base="' + (u.base_salary || 0) + '" data-dept="' + u.department + '" data-insured="' + (u.insurance_active ? '1' : '0') + '" data-ins-salary="' + (u.insurance_salary || 0) + '" data-pos="' + (u.position || '') + '" data-hire="' + (u.created_at || '') + '">' + u.full_name + ' - ' + u.department + (u.insurance_active ? '' : ' (No Insurance)') + '</option>'; });
          b += '</select></div><div class="form-field"><label>Month *</label><input type="month" id="pf-m" value="' + monthVal + '"></div></div>';
          b += '<div id="pf-calc-result" style="padding:16px;background:var(--bg-tertiary);border-radius:var(--radius-md);border:1px solid var(--border-color);margin-bottom:16px;display:none"><p style="color:var(--text-muted);text-align:center">Select an employee and click Calculate</p></div>';
          b += '<div class="form-row"><div class="form-field"><label>Extra HR Bonus (Manual)</label><input type="number" id="pf-extra-b" value="0"></div><div class="form-field"><label>Extra HR Penalty (Manual)</label><input type="number" id="pf-extra-p" value="0"></div></div>';
          App.showModal('Auto-Calculate Salary', b, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-info" id="pf-calc" style="margin-right:8px">🔄 Calculate</button><button class="btn btn-primary" id="pf-save" disabled>Save Record</button>', true);

          var calcData = null;

          document.getElementById('pf-calc').addEventListener('click', function () {
            var sel = document.getElementById('pf-emp');
            if (!sel.value) { alert('Select an employee first'); return; }
            var opt = sel.options[sel.selectedIndex];
            var empId = sel.value;
            var empName = opt.getAttribute('data-name');
            var empDept = opt.getAttribute('data-dept') + (opt.getAttribute('data-pos').indexOf('(عامل يومية)') !== -1 ? ' (عامل يومية)' : '');
            var base = Number(opt.getAttribute('data-base')) || 0;
            var isInsured = opt.getAttribute('data-insured') === '1';
            var insSalary = Number(opt.getAttribute('data-ins-salary')) || 0;
            var hireDateStr = opt.getAttribute('data-hire');
            var month = document.getElementById('pf-m').value;
            if (!month) { alert('Select a month'); return; }

            var resultDiv = document.getElementById('pf-calc-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<p style="text-align:center;color:var(--text-muted)">⏳ Calculating...</p>';

            // Fetch overtime, adjustments, attendance (with delay), and approved leaves for the month
            var monthStart = month + '-01';
            var [yy, mm] = month.split('-');
            var lastDay = new Date(Number(yy), Number(mm), 0).getDate();
            var monthEnd = month + '-' + lastDay;

            Promise.all([
              sbClient.from('overtime').select('hours, rate').eq('employee_id', empId).eq('status', 'approved').gte('date', monthStart).lte('date', monthEnd),
              sbClient.from('salary_adjustments').select('type, amount').eq('employee_id', empId).eq('status', 'approved').eq('month', month),
              sbClient.from('attendance').select('id, date, delay_minutes').eq('employee_id', empId).gte('date', monthStart).lte('date', monthEnd),
              sbClient.from('leave_requests').select('start_date, end_date, days').eq('employee_id', empId).eq('status', 'approved').gte('start_date', monthStart).lte('end_date', monthEnd),
              sbClient.from('medical_requests').select('amount, created_at').eq('employee_id', empId).eq('status', 'disbursed'),
              sbClient.from('loans').select('*').eq('employee_id', empId).eq('status', 'active')
            ]).then(function (results) {
              var otRecords = results[0].data || [];
              var adjRecords = results[1].data || [];
              var attRecords = results[2].data || [];
              var leaveRecords = results[3].data || [];
              var medicalRecords = (results[4].data || []).filter(function(m) {
                return m.created_at.substring(0, 7) === month;
              });
              var loanRecords = results[5].data || [];

              var dailyRate = Math.round(base / 30);

              // Calculate overtime pay: (base/30/8) * hours * rate
              var hourlyRate = dailyRate / 8;
              var totalOTPay = 0;
              otRecords.forEach(function (ot) { totalOTPay += hourlyRate * (ot.hours || 0) * (ot.rate || 1.5); });
              totalOTPay = Math.round(totalOTPay);

              // Calculate adjustments
              var totalBonuses = 0; var totalPenalties = 0;
              adjRecords.forEach(function (adj) {
                if (adj.type === 'bonus') totalBonuses += (adj.amount || 0);
                else totalPenalties += (adj.amount || 0);
              });

              // Medical Disbursed
              var totalMedical = 0;
              medicalRecords.forEach(function (m) { totalMedical += (m.amount || 0); });

              // Loans / Advances Deduction
              var totalLoanDeduction = 0;
              loanRecords.forEach(function (loan) {
                 var deferred = loan.deferred_months || [];
                 if (deferred.indexOf(month) === -1) {
                    var deduct = Math.min(loan.monthly_deduction, loan.remaining_amount);
                    totalLoanDeduction += deduct;
                 }
              });

              // EXACT MATCH WITH EMPLOYEE DASHBOARD
              var totalLateDeduction = 0;
              attRecords.forEach(function (att) {
                if (att.status === 'leave') return;
                var dm = att.delay_minutes || 0;
                var lateDed = 0;
                if (!att.delay_excused) {
                  if (dm > 360) lateDed = dailyRate * 1;
                  else if (dm > 120) lateDed = dailyRate * 0.5;
                  else if (dm > 15) lateDed = dailyRate * 0.25;
                }
                lateDed = Math.round(lateDed);
                totalLateDeduction += lateDed;
              });

              // Calculate approved leave days in this month
              var approvedLeaveDays = 0;
              leaveRecords.forEach(function (lv) {
                var s = new Date(lv.start_date > monthStart ? lv.start_date : monthStart);
                var e = new Date(lv.end_date < monthEnd ? lv.end_date : monthEnd);
                if (Number(lv.days) === 0.5) {
                  approvedLeaveDays += 0.5;
                } else {
                  for (var d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                    if (d.getDay() !== 5) approvedLeaveDays++; // exclude Fridays
                  }
                }
              });

              var firstActiveDay = lastDay;
              if (attRecords.length === 0 && approvedLeaveDays === 0) {
                firstActiveDay = 99; // no active days, all fridays unpaid
              } else {
                attRecords.forEach(function (att) {
                  var dayNum = parseInt(att.date.split('-')[2], 10);
                  if (dayNum < firstActiveDay) firstActiveDay = dayNum;
                });
                leaveRecords.forEach(function(lv) {
                  if (lv.start_date >= monthStart && lv.start_date <= monthEnd && lv.status === 'approved') {
                    var dayNum = parseInt(lv.start_date.split('-')[2], 10);
                    if (dayNum < firstActiveDay) firstActiveDay = dayNum;
                  }
                });
              }

              var fridaysCount = 0;
              var totalFridaysInMonth = 0;
              for (var fDay = 1; fDay <= lastDay; fDay++) {
                if (new Date(Number(yy), Number(mm)-1, fDay).getDay() === 5) {
                  totalFridaysInMonth++;
                  if (fDay >= firstActiveDay) fridaysCount++;
                }
              }

              var attendedDays = attRecords.length;
              var paidDaysDisplay = attendedDays + fridaysCount;

              // Use a standard 30-day baseline for salary calculation.
              // This perfectly prorates new hires and handles 28/31-day months correctly.
              var totalPaidDays = attendedDays + fridaysCount + Math.floor(approvedLeaveDays);
              var totalMissedDays = Math.max(0, 30 - totalPaidDays);
              var calculatedAbsenceDeductions = Math.round(totalMissedDays * dailyRate);

              var earnedSoFar = base; // Start from full 30 days base
              var extraB = Number(document.getElementById('pf-extra-b').value) || 0;
              var extraP = Number(document.getElementById('pf-extra-p').value) || 0;

              var insuranceDeduction = isInsured ? Math.round(insSalary * 0.10) : 0;

              var totalEarnings = earnedSoFar + totalOTPay + totalBonuses + extraB + totalMedical;
              var totalDeductions = totalPenalties + extraP + totalLateDeduction + calculatedAbsenceDeductions + insuranceDeduction + totalLoanDeduction;
              var net = totalEarnings - totalDeductions;

              calcData = {
                employee_id: empId, employee_name: empName, department: empDept,
                month: month, base_salary: base,
                overtime_pay: totalOTPay, bonuses: totalBonuses + extraB + totalMedical,
                performance_bonus: 0,
                penalties: totalPenalties + extraP,
                late_deductions: totalLateDeduction, absence_deductions: calculatedAbsenceDeductions,
                insurance_deduction: insuranceDeduction, loan_deduction: totalLoanDeduction,
                net_salary: net, status: 'processing'
              };

              // Build cumulative daily salary breakdown
              var cumulativeHtml = '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color)"><h4 style="font-weight:700;font-size:0.8rem;margin-bottom:8px">📅 Cumulative Earned Progress (Max 30 Days)</h4>';
              cumulativeHtml += '<div style="max-height:180px;overflow-y:auto;font-size:0.78rem">';
              var cumDisplay = 0;
              for (var d = 1; d <= Math.min(paidDaysDisplay + approvedLeaveDays, 30); d++) {
                cumDisplay += dailyRate; // simple estimation for display
                var barWidth = Math.round((d / 30) * 100);
                cumulativeHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="min-width:55px;color:var(--text-muted)">Day ' + d + '</span><div style="flex:1;background:var(--bg-secondary);border-radius:4px;height:18px;overflow:hidden"><div style="width:' + barWidth + '%;height:100%;background:linear-gradient(90deg,#6366f1,#818cf8);border-radius:4px"></div></div><span style="min-width:85px;text-align:right;font-weight:600">EGP ' + cumDisplay.toLocaleString() + '</span></div>';
              }
              cumulativeHtml += '</div></div>';

              resultDiv.innerHTML = '<h4 style="font-weight:700;margin-bottom:12px;font-size:0.9rem">📊 Salary Breakdown - ' + empName + '</h4>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem">' +
                '<div style="color:var(--text-secondary)">Base Salary:</div><div style="font-weight:600">EGP ' + base.toLocaleString() + '</div>' +
                '<div style="color:var(--text-secondary)">Salary Division:</div><div style="font-weight:600">÷ 30 days = EGP ' + Math.round(dailyRate).toLocaleString() + '/day</div>' +
                '<div style="color:var(--accent-success)">Attended Days:</div><div style="font-weight:600;color:var(--accent-success)">' + attendedDays + ' days</div>' +
                '<div style="color:var(--accent-success)">Fridays (Paid Holiday):</div><div style="font-weight:600;color:var(--accent-success)">' + fridaysCount + ' days</div>' +
                '<div style="color:var(--accent-info)">Approved Leaves:</div><div style="font-weight:600;color:var(--accent-info)">' + approvedLeaveDays + ' days</div>' +
                '<div style="color:var(--accent-primary)">Base Salary (30 Days):</div><div style="font-weight:600;color:var(--accent-primary)">EGP ' + base.toLocaleString() + '</div>' +
                '<div style="color:var(--accent-success)">Overtime (' + otRecords.length + ' records):</div><div style="font-weight:600;color:var(--accent-success)">+EGP ' + totalOTPay.toLocaleString() + '</div>' +
                '<div style="color:var(--accent-info)">Bonuses (' + adjRecords.filter(function (a) { return a.type === "bonus" }).length + ' approved):</div><div style="font-weight:600;color:var(--accent-info)">+EGP ' + (totalBonuses + extraB).toLocaleString() + '</div>' +
                '<div style="color:var(--accent-info)">Medical Allowances:</div><div style="font-weight:600;color:var(--accent-info)">+EGP ' + totalMedical.toLocaleString() + '</div>' +
                '<div style="color:var(--accent-danger)">Penalties:</div><div style="font-weight:600;color:var(--accent-danger)">-EGP ' + (totalPenalties + extraP).toLocaleString() + '</div>' +
                '<div style="color:var(--accent-warning)">⏰ Late Deductions:</div><div style="font-weight:600;color:var(--accent-warning)">-EGP ' + totalLateDeduction.toLocaleString() + '</div>' +
                '<div style="color:var(--accent-danger)">🚫 Absence Deductions:</div><div style="font-weight:600;color:var(--accent-danger)">-EGP ' + calculatedAbsenceDeductions.toLocaleString() + ' (' + totalMissedDays + ' days)</div>' +
                (insuranceDeduction > 0 ? '<div style="color:var(--accent-danger)">🛡️ Insurance Deduction (10%):</div><div style="font-weight:600;color:var(--accent-danger)">-EGP ' + insuranceDeduction.toLocaleString() + '</div>' : '') +
                (totalLoanDeduction > 0 ? '<div style="color:var(--accent-danger)">💳 Loan/Advance Installments:</div><div style="font-weight:600;color:var(--accent-danger)">-EGP ' + totalLoanDeduction.toLocaleString() + '</div>' : '') +
                '</div>' +
                '<div style="border-top:2px solid var(--accent-primary);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center"><span style="font-weight:800;font-size:1rem">NET SALARY</span><span style="font-weight:900;font-size:1.3rem;color:var(--accent-primary-hover)">EGP ' + net.toLocaleString() + '</span></div>' +
                cumulativeHtml;

              document.getElementById('pf-save').removeAttribute('disabled');
            });
          });

          document.getElementById('pf-save').addEventListener('click', function () {
            if (!calcData) { alert('Click Calculate first'); return; }

            var extraB = Number(document.getElementById('pf-extra-b').value) || 0;
            var extraP = Number(document.getElementById('pf-extra-p').value) || 0;

            var promises = [];
            if (extraB > 0) {
              promises.push(sbClient.from('salary_adjustments').insert([{ employee_id: calcData.employee_id, employee_name: calcData.employee_name, department: calcData.department, type: 'bonus', amount: extraB, month: calcData.month, reason: 'HR Manual Extra Bonus during Payroll', status: 'approved' }]));
            }
            if (extraP > 0) {
              promises.push(sbClient.from('salary_adjustments').insert([{ employee_id: calcData.employee_id, employee_name: calcData.employee_name, department: calcData.department, type: 'penalty', amount: extraP, month: calcData.month, reason: 'HR Manual Extra Penalty during Payroll', status: 'approved' }]));
            }

            promises.push(sbClient.from('payroll').insert([calcData]).select().single().then(function (s) { return s; }));

            Promise.all(promises).then(function (results) {
              var s = results[results.length - 1]; // payroll result
              if (s.error) { alert('Error: ' + s.error.message); return; }
              if (s.data) { payroll.unshift(s.data); render(payroll); App.closeModal(); showToast('Salary calculated & saved securely in database!', 'success'); }
            });
          });
        });
      });
    }

    if (document.getElementById('add-adj-direct-btn')) {
      document.getElementById('add-adj-direct-btn').addEventListener('click', function () {
        sbClient.from('users').select('id, full_name, department').eq('status', 'active').then(function (res) {
          var allUsers = res.data || [];
          var monthVal = new Date().toISOString().substring(0, 7);
          var b = '<div class="form-row"><div class="form-field"><label>Employee *</label><select id="direct-adj-emp"><option value="">-- Select --</option>';
          allUsers.forEach(function (u) { b += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-dept="' + u.department + '">' + u.full_name + ' - ' + u.department + '</option>'; });
          b += '</select></div><div class="form-field"><label>Type *</label><select id="direct-adj-type"><option value="bonus">🎁 Bonus (Add Money / مكافأة)</option><option value="penalty">⚠️ Penalty (Deduct Money / خصم أو جزاء)</option></select></div></div>';
          b += '<div class="form-row"><div class="form-field"><label>Amount (EGP) *</label><input type="number" id="direct-adj-amount" min="1" placeholder="e.g. 500"></div><div class="form-field"><label>Month *</label><input type="month" id="direct-adj-month" value="' + monthVal + '"></div></div>';
          b += '<div class="form-field"><label>Reason / Details *</label><textarea id="direct-adj-reason" placeholder="Explain the reason for this manual adjustment..."></textarea></div>';

          App.showModal('Add Direct Manual Amount', b, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="direct-adj-save">Save Adjustment</button>', true);

          document.getElementById('direct-adj-save').addEventListener('click', function () {
            var sel = document.getElementById('direct-adj-emp');
            var type = document.getElementById('direct-adj-type').value;
            var amount = Number(document.getElementById('direct-adj-amount').value);
            var month = document.getElementById('direct-adj-month').value;
            var reason = document.getElementById('direct-adj-reason').value;

            if (!sel.value || !amount || !reason || !month) {
              alert('Please fill all required fields');
              return;
            }

            var opt = sel.options[sel.selectedIndex];
            var rec = {
              employee_id: sel.value,
              employee_name: opt.getAttribute('data-name'),
              department: opt.getAttribute('data-dept'),
              type: type,
              amount: amount,
              reason: reason,
              month: month,
              requested_by: App.user.full_name,
              status: 'approved'
            };

            sbClient.from('salary_adjustments').insert([rec]).then(function (r) {
              if (r.error) { alert('DB Error: ' + r.error.message); return; }
              App.closeModal();
              showToast('Manual amount added & approved successfully!', 'success');

              var textAr = type === 'bonus' ? 'تمت إضافة مكافأة يدوية لك بقيمة ' + amount + ' ج.م لشهر ' + month : 'تم خصم مبلغ يدوي بقيمة ' + amount + ' ج.م لشهر ' + month;
              var titleAr = type === 'bonus' ? '🎁 إضافة مكافأة يدوية' : '⚠️ خصم يدوي';
              App.addNotification({
                user_id: rec.employee_id,
                type: type === 'bonus' ? 'bonus_added' : 'penalty_added',
                title: titleAr,
                message: textAr + ' (السبب: ' + reason + ')'
              });
            });
          });
        });
      });
    }

    document.querySelectorAll('[data-view-slip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = payroll.find(function (x) { return x.id === this.getAttribute('data-view-slip'); }.bind(this));
        if (!p) return;
        var body = '<div style="padding:24px;background:var(--bg-tertiary);border-radius:var(--radius-lg);border:1px solid var(--border-color)">';
        body += '<div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--border-color)"><h2 style="font-size:1.2rem;font-weight:800;margin-bottom:4px">Ninja Factory</h2><p style="color:var(--text-tertiary);font-size:0.82rem">Salary Slip - ' + p.month + '</p><p style="color:var(--text-tertiary);font-size:0.82rem">' + p.employee_name + ' — ' + p.department + '</p></div>';
        body += '<h4 style="font-size:0.8rem;font-weight:700;color:var(--accent-success);margin-bottom:12px">EARNINGS</h4><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">';
        [['Base Salary', p.base_salary || 0], ['Overtime Pay', p.overtime_pay || 0], ['Bonuses', p.bonuses || 0], ['Performance Bonus', p.performance_bonus || 0]].forEach(function (item) {
          body += '<div style="display:flex;justify-content:space-between;font-size:0.88rem"><span style="color:var(--text-secondary)">' + item[0] + '</span><span style="font-weight:600">EGP ' + (item[1] || 0).toLocaleString() + '</span></div>';
        });
        body += '</div><h4 style="font-size:0.8rem;font-weight:700;color:var(--accent-danger);margin-bottom:12px">DEDUCTIONS</h4><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">';
        [['Penalties', p.penalties || 0], ['Late Deductions', p.late_deductions || 0], ['Absence Deductions', p.absence_deductions || 0], ['Insurance Deduction', p.insurance_deduction || 0]].forEach(function (item) {
          body += '<div style="display:flex;justify-content:space-between;font-size:0.88rem"><span style="color:var(--text-secondary)">' + item[0] + '</span><span style="font-weight:600;color:' + (item[1] > 0 ? 'var(--accent-danger)' : 'inherit') + '">' + (item[1] > 0 ? '-EGP ' + (item[1] || 0).toLocaleString() : 'EGP 0') + '</span></div>';
        });
        body += '</div><div style="border-top:2px solid var(--accent-primary);padding-top:16px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:1rem;font-weight:800">NET SALARY</span><span style="font-size:1.4rem;font-weight:900;color:var(--accent-primary-hover)">EGP ' + (p.net_salary || 0).toLocaleString() + '</span></div>';
        if (p.paid_date) body += '<p style="text-align:center;margin-top:16px;font-size:0.78rem;color:var(--accent-success)">✅ Paid on ' + formatDate(p.paid_date) + '</p>';
        body += '</div>';
        App.showModal('💰 Salary Slip - ' + p.month, body, '', true);
      });
    });

    document.querySelectorAll('[data-mark-paid]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-mark-paid');
        sbClient.from('payroll').update({ status: 'paid', paid_date: todayStr() }).eq('id', id).then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
        payroll = payroll.map(function (p) {
          if (p.id === id) {
            App.addNotification({ user_id: p.employee_id, type: 'salary_ready', title: '💰 Salary Processed', message: 'Your ' + p.month + ' salary of EGP ' + (p.net_salary || 0).toLocaleString() + ' has been processed.' });
            return Object.assign({}, p, { status: 'paid', paid_date: todayStr() });
          }
          return p;
        });
        render(payroll);
        showToast('Salary marked as paid!', 'success');
      });
    });
  }

  {
    var q = sbClient.from('payroll').select('*').order('month', { ascending: false });
    if (!isHR) q = q.eq('employee_id', App.user.id);
    q.then(function (r) {
      if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); }
      if (r.data) {
        payroll = r.data;
        if (!isHR) {
          Promise.all([
            sbClient.from('medical_requests').select('*').eq('employee_id', App.user.id).eq('status', 'disbursed'),
            sbClient.from('salary_adjustments').select('*').eq('employee_id', App.user.id).eq('status', 'approved')
          ]).then(function (results) {
            medicalClaims = results[0].data || [];
            salaryAdjustments = results[1].data || [];
            render(payroll);
          }).catch(function (err) {
            console.error('Error fetching additional payroll details:', err);
            render(payroll);
          });
        } else {
          render(payroll);
        }
      }
    });
  }
  render(payroll);
};

// ----- ANNOUNCEMENTS -----
Pages.announcements = function (el) {
  var isHR = App.isHR();
  var announcements = [];
  var visible = isHR ? announcements : announcements.filter(function (a) { return a.department === 'All' || a.department.indexOf(App.user.department) !== -1; });

  function render() {
    var html = '';
    if (isHR) html += '<div class="toolbar"><div style="flex:1"></div><button class="btn btn-primary" id="post-ann-btn">' + icon('plus') + ' Post Announcement</button></div>';
    html += '<div style="display:flex;flex-direction:column;gap:16px">';
    var priorityIcons = { high: 'alertTriangle', medium: 'bell', low: 'info' };
    var priorityColors = { high: { bg: 'var(--accent-danger-soft)', color: '#ef4444' }, medium: { bg: 'var(--accent-warning-soft)', color: '#f59e0b' }, low: { bg: 'var(--accent-info-soft)', color: '#3b82f6' } };
    visible.forEach(function (a) {
      var pc = priorityColors[a.priority] || priorityColors.medium;
      html += '<div class="announcement-item ' + a.priority + '"><div style="display:flex;align-items:flex-start;gap:12px"><div style="width:40px;height:40px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;background:' + pc.bg + '">' + icon(priorityIcons[a.priority] || 'info', 18) + '</div><div style="flex:1"><div class="announcement-title">' + a.title + '</div><div class="announcement-msg">' + a.message + '</div><div class="announcement-meta"><span>📅 ' + formatDate(a.created_at) + '</span><span>👤 ' + a.created_by + '</span><span>🏢 ' + a.department + '</span><span class="badge ' + (a.priority === 'high' ? 'badge-danger' : a.priority === 'medium' ? 'badge-warning' : 'badge-info') + '">' + a.priority + '</span></div></div></div></div>';
    });
    if (visible.length === 0) html += '<div class="empty-state" style="padding:60px">' + icon('megaphone', 40) + '<p>No announcements yet</p></div>';
    html += '</div>';
    el.innerHTML = html;

    if (document.getElementById('post-ann-btn')) document.getElementById('post-ann-btn').addEventListener('click', function () {
      var body = '<div class="form-field" style="margin-bottom:16px"><label>Title</label><input id="af-title" placeholder="Announcement title..."></div>';
      body += '<div class="form-field" style="margin-bottom:16px"><label>Message</label><textarea id="af-msg" placeholder="Write your announcement..." style="min-height:120px"></textarea></div>';
      body += '<div class="form-row"><div class="form-field"><label>Priority</label><select id="af-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div><div class="form-field"><label>Target Department</label><select id="af-dept"><option value="All">All Departments</option>';
      DEPARTMENTS.forEach(function (d) { body += '<option value="' + d + '">' + d + '</option>'; });
      body += '</select></div></div>';
      App.showModal('📢 Post Announcement', body, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="publish-ann">Publish Announcement</button>', true);
      document.getElementById('publish-ann').addEventListener('click', function () {
        var title = document.getElementById('af-title').value;
        var msg = document.getElementById('af-msg').value;
        var priority = document.getElementById('af-priority').value;
        var dept = document.getElementById('af-dept').value;
        if (!title || !msg) return;
        var newAnn = { title: title, message: msg, priority: priority, department: dept, created_by: App.user.full_name, created_at: new Date().toISOString() };
        sbClient.from('announcements').insert([newAnn]).select().single().then(function (r) { if (r && r.error) { console.error("Supabase Error:", r.error); alert("DB Error: " + r.error.message); } });
        announcements.unshift(newAnn);
        visible = isHR ? announcements : announcements.filter(function (a) { return a.department === 'All' || a.department.indexOf(App.user.department) !== -1; });

        App.closeModal();
        render();
        showToast('Announcement published!', 'success');
      });
    });
  }

  {
    sbClient.from('announcements').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) { alert('DB Error: ' + r.error.message + (r.error.details ? ' - ' + r.error.details : '')); console.error(r.error); }
      if (r.data) { announcements = r.data; visible = isHR ? announcements : announcements.filter(function (a) { return a.department === 'All' || a.department.indexOf(App.user.department) !== -1; }); render(); }
    });
  }
  render();
};

// ----- REPORTS -----
Pages.reports = function (el) {
  var employees = [];
  var attendance = [];
  var leaves = [];
  var payroll = [];
  var purchaseReqs = [];
  var inventory = [];
  var expenses = [];
  var activeReport = 'attendance';

  function render() {
    var html = '<div style="margin-bottom:24px;border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:4px;background:var(--bg-card);display:inline-flex;gap:0;flex-wrap:wrap;">';
    var tabs = [{ id: 'attendance', label: '📊 Attendance' }, { id: 'absenteeism', label: '🔴 Absenteeism' }, { id: 'performance', label: '📈 Dept Performance' }, { id: 'absence-leave', label: 'Permission Requests', icon: 'calendarDays' },
          { id: 'leaves', label: '🏖️ Leave Analytics' }, { id: 'procurement', label: '🛒 Procurement' }, { id: 'inventory', label: '📦 Inventory' }, { id: 'expenses', label: '💰 Expenses' }];
    tabs.forEach(function (tab) {
      html += '<button class="tab' + (activeReport === tab.id ? ' active' : '') + '" data-report="' + tab.id + '" style="border-bottom:none;border-radius:var(--radius-md);margin:0;background:' + (activeReport === tab.id ? 'var(--accent-primary-soft)' : 'transparent') + '">' + tab.label + '</button>';
    });
    html += '</div>';

    var titles = { attendance: '📊 Monthly Attendance Report', absenteeism: '🔴 Absenteeism Analysis', performance: '📈 Department Performance', leaves: '🏖️ Leave Analytics', procurement: '🛒 Procurement Requests Analysis', inventory: '📦 Inventory Categories', expenses: '💰 Expenses Status' };
    html += '<div class="card"><div class="card-header"><div><h3>' + titles[activeReport] + '</h3></div><button class="btn btn-outline" id="rpt-export">' + icon('download') + ' Export CSV</button></div><div class="chart-container" style="height:350px;padding:24px"><canvas id="report-chart"></canvas></div></div>';

    el.innerHTML = html;

    document.querySelectorAll('[data-report]').forEach(function (btn) { btn.addEventListener('click', function () { activeReport = this.getAttribute('data-report'); render(); }); });
    document.getElementById('rpt-export').addEventListener('click', function () {
      var dataToExport = attendance;
      if (activeReport === 'performance') dataToExport = payroll;
      else if (activeReport === 'leaves') dataToExport = leaves;
      else if (activeReport === 'absenteeism') dataToExport = attendance.filter(function (a) { return a.status === 'absent'; });
      else if (activeReport === 'procurement') dataToExport = purchaseReqs;
      else if (activeReport === 'inventory') dataToExport = inventory;
      else if (activeReport === 'expenses') dataToExport = expenses;
      exportToExcel(dataToExport, activeReport + '_report');
    });

    setTimeout(function () {
      var ctx = document.getElementById('report-chart');
      if (!ctx) return;
      var chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, font: { size: 11 } } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false }, border: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.06)' }, border: { display: false } } } };
      if (activeReport === 'attendance') {
        var attData = {};
        DEPARTMENTS.forEach(function (d) { var recs = attendance.filter(function (a) { return a.department === d; }); attData[d] = { present: recs.filter(function (a) { return a.status === 'present' || a.status === 'Closed Automatically' || a.status === 'checked_in'; }).length, absent: recs.filter(function (a) { return a.status === 'absent'; }).length, late: recs.filter(function (a) { return a.delay_minutes > 0; }).length }; });
        new Chart(ctx, { type: 'bar', data: { labels: DEPARTMENTS, datasets: [{ label: 'Present', data: DEPARTMENTS.map(function (d) { return attData[d].present; }), backgroundColor: '#22c55e', borderRadius: 4 }, { label: 'Absent', data: DEPARTMENTS.map(function (d) { return attData[d].absent; }), backgroundColor: '#ef4444', borderRadius: 4 }, { label: 'Late', data: DEPARTMENTS.map(function (d) { return attData[d].late; }), backgroundColor: '#f59e0b', borderRadius: 4 }] }, options: chartOpts });
      } else if (activeReport === 'absenteeism') {
        var empAbsent = {};
        attendance.filter(function (a) { return a.status === 'absent'; }).forEach(function (a) { empAbsent[a.employee_name] = (empAbsent[a.employee_name] || 0) + 1; });
        new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(empAbsent), datasets: [{ data: Object.values(empAbsent), backgroundColor: ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'], borderWidth: 0 }] }, options: Object.assign({}, chartOpts, { scales: undefined, cutout: '60%' }) });
      } else if (activeReport === 'performance') {
        var deptPerf = {};
        DEPARTMENTS.forEach(function (d) { var dp = payroll.filter(function (p) { return p.department === d; }); deptPerf[d] = { avg: dp.length ? Math.round(dp.reduce(function (s, p) { return s + p.net_salary; }, 0) / dp.length) : 0, bonus: dp.length ? Math.round(dp.reduce(function (s, p) { return s + p.performance_bonus; }, 0) / dp.length) : 0 }; });
        new Chart(ctx, { type: 'line', data: { labels: DEPARTMENTS, datasets: [{ label: 'Avg Salary', data: DEPARTMENTS.map(function (d) { return deptPerf[d].avg; }), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4, fill: true }, { label: 'Avg Performance Bonus', data: DEPARTMENTS.map(function (d) { return deptPerf[d].bonus; }), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.4, fill: true }] }, options: chartOpts });
      } else if (activeReport === 'leaves') {
        var leaveByType = {};
        leaves.forEach(function (l) { leaveByType[l.type] = (leaveByType[l.type] || 0) + 1; });
        new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(leaveByType), datasets: [{ data: Object.values(leaveByType), backgroundColor: ['#6366f1', '#ef4444', '#f59e0b', '#06b6d4', '#a855f7'], borderWidth: 0 }] }, options: Object.assign({}, chartOpts, { scales: undefined, cutout: '60%' }) });
      } else if (activeReport === 'procurement') {
        var reqByStatus = {};
        purchaseReqs.forEach(function(r) { reqByStatus[r.status] = (reqByStatus[r.status] || 0) + 1; });
        new Chart(ctx, { type: 'pie', data: { labels: Object.keys(reqByStatus), datasets: [{ data: Object.values(reqByStatus), backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#14b8a6'], borderWidth: 0 }] }, options: Object.assign({}, chartOpts, { scales: undefined }) });
      } else if (activeReport === 'inventory') {
        var invByCat = {};
        inventory.forEach(function(i) { invByCat[i.category] = (invByCat[i.category] || 0) + 1; });
        new Chart(ctx, { type: 'bar', data: { labels: Object.keys(invByCat), datasets: [{ label: 'Items per Category', data: Object.values(invByCat), backgroundColor: '#06b6d4', borderRadius: 4 }] }, options: chartOpts });
      } else if (activeReport === 'expenses') {
        var expByStatus = {};
        expenses.forEach(function(e) { expByStatus[e.status] = (expByStatus[e.status] || 0) + 1; });
        new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(expByStatus), datasets: [{ data: Object.values(expByStatus), backgroundColor: ['#f59e0b', '#22c55e', '#ef4444'], borderWidth: 0 }] }, options: Object.assign({}, chartOpts, { scales: undefined, cutout: '60%' }) });
      }
    }, 50);
  }

  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading report data...</div>';

  Promise.all([
    sbClient.from('users').select('*').eq('status', 'active'),
    sbClient.from('attendance').select('*'),
    sbClient.from('leave_requests').select('*'),
    sbClient.from('payroll').select('*'),
    sbClient.from('purchase_requests').select('*'),
    sbClient.from('inventory_items').select('*'),
    sbClient.from('expenses').select('*')
  ]).then(function (results) {
    employees = results[0].data || [];
    attendance = results[1].data || [];
    leaves = results[2].data || [];
    payroll = results[3].data || [];
    purchaseReqs = results[4].data || [];
    inventory = results[5].data || [];
    expenses = results[6].data || [];
    render();
  }).catch(function (err) {
    console.error('Reports Data Load Error:', err);
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">Error loading report data.</div>';
  });
};

// ----- AUDIT LOG -----
Pages.auditLog = function (el) {
  var logs = [];
  var actionTypes = [];
  logs.forEach(function (l) { if (actionTypes.indexOf(l.action) === -1) actionTypes.push(l.action); });

  function render(data) {
    var html = '<div class="toolbar"><div class="search-wrapper"><span class="search-icon">' + icon('search') + '</span><input type="text" class="search-input" placeholder="Search by user or details..." id="al-search"></div>';
    html += '<select class="filter-select" id="al-action"><option value="">All Actions</option>';
    actionTypes.forEach(function (a) { html += '<option value="' + a + '">' + a.replace(/_/g, ' ') + '</option>'; });
    html += '</select><input type="date" class="filter-select" id="al-date"><button class="btn btn-outline" id="al-export">' + icon('download') + ' Export</button></div>';

    html += '<div class="card"><div class="card-header"><div><h3>🔒 System Audit Log</h3><p>' + data.length + ' events recorded</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th><th>IP Address</th></tr></thead><tbody>';
    data.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); }).forEach(function (log) {
      html += '<tr><td style="font-family:monospace;font-size:0.78rem">' + formatDateTime(log.timestamp) + '</td><td><span class="audit-action audit-' + log.action + '">' + log.action.replace(/_/g, ' ') + '</span></td><td style="color:var(--text-primary);font-weight:500">' + log.user + '</td><td style="max-width:300px">' + log.details + '</td><td style="font-family:monospace;font-size:0.78rem;color:var(--text-muted)">' + log.ip + '</td></tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No audit entries found</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    function applyFilters() {
      var s = document.getElementById('al-search').value.toLowerCase();
      var action = document.getElementById('al-action').value;
      var date = document.getElementById('al-date').value;
      render(logs.filter(function (l) {
        if (s && l.user.toLowerCase().indexOf(s) === -1 && l.details.toLowerCase().indexOf(s) === -1) return false;
        if (action && l.action !== action) return false;
        if (date && l.timestamp.indexOf(date) === -1) return false;
        return true;
      }));
    }
    document.getElementById('al-search').addEventListener('input', applyFilters);
    document.getElementById('al-action').addEventListener('change', applyFilters);
    document.getElementById('al-date').addEventListener('change', applyFilters);
    document.getElementById('al-export').addEventListener('click', function () { exportToExcel(data, 'audit_log'); });
  }

  {
    sbClient.from('audit_log').select('*').order('timestamp', { ascending: false }).then(function (r) {
      if (r.error) { console.error('Audit Load Error:', r.error); el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">Error loading audit log: ' + r.error.message + '</div>'; return; }
      if (r.data) { logs = r.data.map(function (l) { return Object.assign({}, l, { user: l.user_name, timestamp: l.timestamp, ip: l.ip || '127.0.0.1' }); }); actionTypes = []; logs.forEach(function (l) { if (actionTypes.indexOf(l.action) === -1) actionTypes.push(l.action); }); render(logs); }
    });
  }
  render(logs);
};

// ----- MANAGER: TEAM ADJUSTMENTS -----
Pages.teamAdjustments = function (el) {
  var adjustments = [];
  var teamMembers = [];

  function render() {
    var html = '<div class="toolbar">';
    html += '<button class="btn btn-primary" id="add-adj-btn">' + icon('plus') + ' Submit Bonus / Penalty</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>My Submitted Adjustments</h3><p>' + adjustments.length + ' requests</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Amount (EGP)</th><th>Reason</th><th>Month</th><th>Status</th></tr></thead><tbody>';
    adjustments.forEach(function (a) {
      var typeClass = a.type === 'bonus' ? 'badge-success' : 'badge-danger';
      var typeLabel = a.type === 'bonus' ? '🎁 Bonus' : '⚠️ Penalty';
      var statusClass = a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-danger' : 'badge-warning';
      html += '<tr><td style="font-weight:600">' + a.employee_name + '</td><td>' + (a.department || '') + '</td>';
      html += '<td><span class="badge ' + typeClass + '">' + typeLabel + '</span></td>';
      html += '<td style="font-weight:700">EGP ' + (a.amount || 0).toLocaleString() + '</td>';
      html += '<td>' + (a.reason || '') + '</td><td>' + (a.month || '') + '</td>';
      html += '<td><span class="badge ' + statusClass + '"><span class="badge-dot"></span>' + a.status + '</span></td></tr>';
    });
    if (adjustments.length === 0) html += '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No adjustments submitted yet</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    document.getElementById('add-friday-btn').addEventListener('click', function () {
      var dateVal = todayStr();
      var b = '<div class="form-field"><label>Date (تاريخ العمل الإضافي/يوم الجمعة) *</label><input type="date" id="fw-date" value="' + dateVal + '"></div>';
      b += '<div class="form-field"><label>Select Employees (يمكن اختيار أكثر من موظف) *</label><select id="fw-emps" multiple style="height:120px">';
      teamMembers.forEach(function (u) { b += '<option value="' + u.id + '">' + u.full_name + '</option>'; });
      b += '</select></div><p style="font-size:0.8rem;color:var(--text-muted)">اضغط Ctrl (أو Cmd) لاختيار أكثر من موظف</p>';
      
      App.showModal('Request Friday Work', b, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="fw-save">Submit Request</button>');

      document.getElementById('fw-save').addEventListener('click', function () {
        var date = document.getElementById('fw-date').value;
        var sel = document.getElementById('fw-emps');
        var selectedEmps = [];
        for (var i=0; i<sel.options.length; i++) { if(sel.options[i].selected) selectedEmps.push(sel.options[i].value); }
        
        if (!date || selectedEmps.length === 0) { alert('Please select date and at least one employee'); return; }

        var rec = { department: App.user.department, requested_by: App.user.id, requested_by_name: App.user.full_name, employees: selectedEmps, request_date: date, status: 'pending' };
        sbClient.from('friday_work_requests').insert([rec]).then(function (r) {
          if (r.error) { alert('Error: ' + r.error.message); return; }
          App.closeModal(); 
          showToast('Friday Work requested!', 'success'); 
          loadFridayWork();
        });
      });
    });

    function loadFridayWork() {
      sbClient.from('friday_work_requests').select('*').eq('department', App.user.department).order('created_at', {ascending:false}).then(function(r) {
        var tb = document.getElementById('friday-tbody');
        if(!tb) return;
        if(r.error || !r.data || r.data.length===0) { tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No Friday Work requests</td></tr>'; return; }
        
        var h = '';
        r.data.forEach(function(fw) {
          var sc = fw.status === 'approved' ? 'badge-success' : fw.status === 'rejected' ? 'badge-danger' : 'badge-warning';
          h += '<tr>';
          h += '<td>' + fw.requested_by_name + '</td>';
          h += '<td>' + formatDate(fw.request_date) + '</td>';
          h += '<td style="font-weight:700">' + (fw.employees ? fw.employees.length : 0) + ' Employees</td>';
          h += '<td><span class="badge ' + sc + '"><span class="badge-dot"></span>' + fw.status + '</span></td>';
          h += '</tr>';
        });
        tb.innerHTML = h;
      });
    }
    loadFridayWork();

    document.getElementById('add-adj-btn').addEventListener('click', function () {
      var monthVal = new Date().toISOString().substring(0, 7);
      var b = '<div class="form-row"><div class="form-field"><label>Employee *</label><select id="adj-emp"><option value="">-- Select --</option>';
      teamMembers.forEach(function (u) { b += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-dept="' + u.department + '">' + u.full_name + '</option>'; });
      b += '</select></div><div class="form-field"><label>Type *</label><select id="adj-type"><option value="bonus">🎁 Bonus (Reward)</option><option value="penalty">⚠️ Penalty (Deduction)</option></select></div></div>';
      b += '<div class="form-row"><div class="form-field"><label>Amount (EGP) *</label><input type="number" id="adj-amount" min="1" placeholder="e.g. 500"></div><div class="form-field"><label>Month *</label><input type="month" id="adj-month" value="' + monthVal + '"></div></div>';
      b += '<div class="form-field"><label>Reason *</label><textarea id="adj-reason" placeholder="Describe the reason..."></textarea></div>';
      App.showModal('Submit Bonus / Penalty', b, '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="adj-save">Submit for Approval</button>');

      document.getElementById('adj-save').addEventListener('click', function () {
        var sel = document.getElementById('adj-emp');
        var type = document.getElementById('adj-type').value;
        var amount = Number(document.getElementById('adj-amount').value);
        var month = document.getElementById('adj-month').value;
        var reason = document.getElementById('adj-reason').value;
        if (!sel.value || !amount || !reason) { alert('Please fill all required fields'); return; }
        var opt = sel.options[sel.selectedIndex];

        var rec = { employee_id: sel.value, employee_name: opt.getAttribute('data-name'), department: opt.getAttribute('data-dept'), type: type, amount: amount, reason: reason, month: month, requested_by: App.user.full_name, status: 'pending' };
        sbClient.from('salary_adjustments').insert([rec]).select().single().then(function (r) {
          if (r.error) { alert('Error: ' + r.error.message); return; }
          if (r.data) { adjustments.unshift(r.data); App.closeModal(); render(); showToast('Adjustment submitted!', 'success'); }
        });
      });
    });
  }

  // Load team members (same department) and existing adjustments
  var dept = App.user.department;
  Promise.all([
    sbClient.from('users').select('id, full_name, department').eq('department', dept).eq('role', 'employee'),
    sbClient.from('salary_adjustments').select('*').eq('requested_by', App.user.full_name).order('created_at', { ascending: false })
  ]).then(function (results) {
    teamMembers = (results[0].data || []);
    adjustments = (results[1].data || []);
    render();
  });
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading team data...</div>';
};

// ----- HR: SALARY ADJUSTMENTS APPROVAL -----
Pages.hrAdjustments = function (el) {
  var adjustments = [];
  var filterStatus = '';

  function render(data) {
    data = data || adjustments;
    var pending = data.filter(function (a) { return a.status === 'pending'; });
    var html = '<div class="stats-grid">';
    html += _statCard('#f59e0b', 'timer', pending.length, 'Pending Requests');
    html += _statCard('#10b981', 'checkCheck', data.filter(function (a) { return a.status === 'approved'; }).length, 'Approved');
    html += _statCard('#ef4444', 'x', data.filter(function (a) { return a.status === 'rejected'; }).length, 'Rejected');
    html += _statCard('#6366f1', 'dollarSign', 'EGP ' + data.reduce(function (s, a) { return s + (a.status === 'approved' ? (a.type === 'bonus' ? a.amount : -a.amount) : 0); }, 0).toLocaleString(), 'Net Impact');
    html += '</div>';

    html += '<div class="toolbar"><select class="filter-select" id="adj-filter"><option value="">All Status</option><option value="pending"' + (filterStatus === 'pending' ? ' selected' : '') + '>Pending</option><option value="approved"' + (filterStatus === 'approved' ? ' selected' : '') + '>Approved</option><option value="rejected"' + (filterStatus === 'rejected' ? ' selected' : '') + '>Rejected</option></select></div>';

    html += '<div class="card"><div class="card-header"><div><h3>Salary Adjustment Requests</h3><p>' + data.length + ' requests from managers</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Amount</th><th>Reason</th><th>Requested By</th><th>Month</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
    data.forEach(function (a) {
      var typeClass = a.type === 'bonus' ? 'badge-success' : 'badge-danger';
      var typeLabel = a.type === 'bonus' ? '🎁 Bonus' : '⚠️ Penalty';
      var statusClass = a.status === 'approved' ? 'badge-success' : a.status === 'rejected' ? 'badge-danger' : 'badge-warning';
      html += '<tr><td style="font-weight:600">' + a.employee_name + '</td><td>' + (a.department || '') + '</td>';
      html += '<td><span class="badge ' + typeClass + '">' + typeLabel + '</span></td>';
      html += '<td style="font-weight:700">EGP ' + (a.amount || 0).toLocaleString() + '</td>';
      html += '<td style="max-width:200px">' + (a.reason || '') + '</td>';
      html += '<td>' + (a.requested_by || '') + '</td><td>' + (a.month || '') + '</td>';
      html += '<td><span class="badge ' + statusClass + '"><span class="badge-dot"></span>' + a.status + '</span></td>';
      html += '<td>';
      if (a.status === 'pending') {
        var canApprove = true;
        if (App.user.role === 'hr') {
          var perms = App.user.permissions || {};
          if (!perms.can_adjust_salary) canApprove = false;
        }
        if (canApprove) {
          html += '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" data-adj-approve="' + a.id + '">Approve</button><button class="btn btn-xs" style="background:var(--accent-danger);color:#fff" data-adj-reject="' + a.id + '">Reject</button></div>';
        } else {
          html += '<span style="color:var(--accent-danger);font-size:0.75rem">Blocked (No Roles Perm)</span>';
        }
      } else { html += '<span style="color:var(--text-muted);font-size:0.78rem">Done</span>'; }
      html += '</td></tr>';
    });
    if (data.length === 0) html += '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">No adjustment requests</td></tr>';
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    // Events
    document.getElementById('adj-filter').addEventListener('change', function () {
      filterStatus = this.value;
      render(filterStatus ? adjustments.filter(function (a) { return a.status === filterStatus; }) : adjustments);
    });

    document.querySelectorAll('[data-adj-approve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-adj-approve');
        sbClient.from('salary_adjustments').update({ status: 'approved' }).eq('id', id).then(function (r) {
          if (r && r.error) { alert('Error: ' + r.error.message); return; }
          adjustments = adjustments.map(function (a) { if (a.id === id) a.status = 'approved'; return a; });
          render(filterStatus ? adjustments.filter(function (a) { return a.status === filterStatus; }) : adjustments);
          showToast('Adjustment approved!', 'success');
        });
      });
    });

    document.querySelectorAll('[data-adj-reject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-adj-reject');
        sbClient.from('salary_adjustments').update({ status: 'rejected' }).eq('id', id).then(function (r) {
          if (r && r.error) { alert('Error: ' + r.error.message); return; }
          adjustments = adjustments.map(function (a) { if (a.id === id) a.status = 'rejected'; return a; });
          render(filterStatus ? adjustments.filter(function (a) { return a.status === filterStatus; }) : adjustments);
          showToast('Adjustment rejected', 'info');
        });
      });
    });
  }

  sbClient.from('salary_adjustments').select('*').order('created_at', { ascending: false }).then(function (r) {
    if (r.error) { alert('DB Error: ' + r.error.message); el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">Error loading adjustments</div>'; console.error(r.error); return; }
    if (r.data) { adjustments = r.data; render(); }
  });
  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading adjustments...</div>';
};

// ----- MY DELAYS & DEDUCTIONS -----
Pages['my-delays'] = function (el) {
  var isHR = App.isHR();
  if (isHR) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">This page is for employee view. HR can use reports.</div>';
    return;
  }

  var attendanceWithDelay = [];
  var baseSalary = App.user.base_salary || 0;
  var dailyRate30 = Math.round(baseSalary / 30);

  function render() {
    var html = '<div class="card" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-danger-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-danger)">' + icon('alertTriangle', 22) + '</div>';
    html += '<h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">سجل تأخيراتي وخصوماتي (من البصمة)</h3>';
    html += '</div>';
    html += '<p style="color:var(--text-secondary);direction:rtl;text-align:right;line-height:1.6">هذا الجدول يعرض أيام التأخير التي سجلتها بناءً على حضورك الفعلي. يتم حساب عدد الساعات وربطها بالخصم المادي فوراً ويتم حفظ هذه البيانات تلقائياً في قاعدة البيانات.</p>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>سجل التأخيرات</h3><p>' + attendanceWithDelay.length + ' مرات تأخير</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table" style="direction:rtl;text-align:right"><thead><tr>';
    html += '<th>التاريخ (يوم كام)</th><th>مدة التأخير (متأخر كام ساعة)</th><th>الإجراء المطبق</th><th>تم خصم كام بالأرقام (EGP)</th></tr></thead><tbody>';

    if (attendanceWithDelay.length === 0) {
      html += '<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--accent-success)">🎉 لا يوجد لديك أي تأخيرات! ممتاز جداً.</td></tr>';
    } else {
      attendanceWithDelay.forEach(function (att) {
        var delayMin = att.delay_minutes || 0;
        var deductionFraction = 0;
        var deductionLabel = '';
        if (delayMin > 360) { deductionFraction = 1; deductionLabel = 'خصم يوم كامل'; }
        else if (delayMin > 120) { deductionFraction = 0.5; deductionLabel = 'خصم نصف يوم'; }
        else if (delayMin > 15) { deductionFraction = 0.25; deductionLabel = 'خصم ربع يوم'; }
        else { deductionLabel = 'تأخير مسموح (أقل من 15 دقيقة)'; }

        var deductionAmount = Math.round(dailyRate30 * deductionFraction);
        var hoursStr = (delayMin / 60).toFixed(1) + ' ساعة (' + delayMin + ' دقيقة)';

        html += '<tr>';
        html += '<td>' + formatDate(att.date) + '</td>';
        html += '<td style="color:var(--accent-warning);font-weight:600">' + hoursStr + '</td>';
        html += '<td><span class="badge ' + (deductionFraction > 0 ? 'badge-danger' : 'badge-success') + '">' + deductionLabel + '</span></td>';
        html += '<td style="font-weight:bold;color:' + (deductionFraction > 0 ? 'var(--accent-danger)' : 'var(--text-primary)') + '">' + (deductionFraction > 0 ? '- ' + deductionAmount + ' ج.م' : '0 ج.م') + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">جاري التحميل من قاعدة البيانات...</div>';
  sbClient.from('attendance').select('*').eq('employee_id', App.user.id).gt('delay_minutes', 0).order('date', { ascending: false }).then(function (r) {
    if (r.error) { alert('DB Error: ' + r.error.message); return; }
    if (r.data) {
      attendanceWithDelay = r.data;
      render();
    }
  });
};

// ----- ALL DELAYS (HR VIEW) -----
Pages.allDelays = function (el) {
  if (!App.isHR()) return;
  var delays = [];

  function render() {
    var html = '<div class="card" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-danger-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-danger)">' + icon('alertTriangle', 22) + '</div>';
    html += '<h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">سجل تأخيرات وخصومات جميع الموظفين</h3>';
    html += '</div>';
    html += '<p style="color:var(--text-secondary);direction:rtl;text-align:right">هذا الجدول يعرض تأخيرات الموظفين (المحفوظة في قاعدة البيانات) ويوضح عدد ساعات التأخير والمبلغ المخصوم بناءً على الشفتات.</p>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>سجل التأخيرات العام</h3><p>' + delays.length + ' سجل تأخير</p></div><button class="btn btn-outline" id="export-delays">' + icon('download') + ' Export CSV</button></div><div class="card-body no-pad"><div class="table-container"><table class="data-table" style="direction:rtl;text-align:right"><thead><tr>';
    html += '<th>الموظف</th><th>القسم</th><th>التاريخ</th><th>مدة التأخير</th><th>الخصم</th><th>سبب التأخير</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';

    if (delays.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد تأخيرات مسجلة</td></tr>';
    } else {
      var lastDate = null;
      delays.forEach(function (d) {
        if (lastDate !== d.delay_date) {
          html += '<tr style="background:var(--bg-secondary);border-top:3px solid var(--accent-primary);border-bottom:1px solid var(--border-color)"><td colspan="8" style="font-weight:800;color:var(--text-primary);padding:10px 16px;font-size:1.05rem;">📅 سجلات يوم: ' + formatDate(d.delay_date) + '</td></tr>';
          lastDate = d.delay_date;
        }

        var hoursStr = (d.delay_minutes / 60).toFixed(1) + ' ساعة (' + d.delay_minutes + ' دقيقة)';
        html += '<tr>';
        html += '<td><div style="font-weight:bold;color:var(--text-primary)">' + (d.employee_name || 'غير معروف') + '</div></td>';
        html += '<td>' + (d.department || '-') + '</td>';
        html += '<td>' + formatDate(d.delay_date) + '</td>';
        html += '<td style="color:var(--accent-warning);font-weight:600">' + hoursStr + '</td>';
        html += '<td style="font-weight:bold;color:' + (d.delay_excused ? 'var(--text-muted)' : 'var(--accent-danger)') + '">' + (d.delay_excused ? '<s>' + d.deduction_type + '</s>' : d.deduction_type) + '</td>';
        html += '<td>' + (d.delay_reason || '<span style="color:var(--text-muted)">لم يسجل</span>') + '</td>';
        
        var statusBadge = d.delay_excused ? '<span class="badge badge-success">تم الإعفاء</span>' : '<span class="badge badge-warning">خصم ساري</span>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td><button class="btn btn-xs btn-outline" onclick="window.editDelayStatus(\'' + d.id + '\')">' + icon('edit', 12) + ' تعديل</button></td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var exportBtn = document.getElementById('export-delays');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var csv = 'Employee,Department,Date,Delay Minutes,Deduction Amount,Type\n';
        delays.forEach(function (d) {
          csv += '"' + (d.employee_name || '') + '","' + (d.department || '') + '","' + (d.delay_date || '') + '",' + d.delay_minutes + ',"' + d.deduction_amount + '","' + d.deduction_type + '"\n';
        });
        App.downloadCSV(csv, 'Employees_Delays.csv');
      });
    }
  }

  el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">جاري التحميل من قاعدة البيانات...</div>';

  // We fetch directly from attendance where delay_minutes > 0.
  // This bypasses the old late_deductions table completely.
  sbClient.from('attendance').select('*').gt('delay_minutes', 0).order('date', { ascending: false }).then(function (r) {
    if (r.error) { alert('DB Error: ' + r.error.message); return; }

    if (r.data) {
      delays = r.data.map(function (d) {
        var deductionLabel = '';
        var deductionFraction = 0;

        if (d.delay_minutes > 360) { deductionLabel = 'خصم يوم كامل'; deductionFraction = 1; }
        else if (d.delay_minutes > 120) { deductionLabel = 'خصم نصف يوم'; deductionFraction = 0.5; }
        else if (d.delay_minutes > 15) { deductionLabel = 'خصم ربع يوم'; deductionFraction = 0.25; }
        else { deductionLabel = 'بدون خصم'; deductionFraction = 0; }

        return {
          id: d.id,
          employee_name: d.employee_name || 'غير معروف',
          department: d.department || '-',
          delay_date: d.date,
          delay_minutes: d.delay_minutes,
          deduction_type: deductionLabel,
          delay_reason: d.delay_reason,
          delay_excused: d.delay_excused
        };
      });
      render();
    }
  });

  window.editDelayStatus = function(attId) {
    var rec = delays.find(function(d) { return d.id === attId; });
    if (!rec) return;

    var body = '<div class="form-group"><label>سبب التأخير</label><input type="text" id="delay-reason" class="form-input" value="' + (rec.delay_reason || '') + '"></div>';
    body += '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="delay-excuse" ' + (rec.delay_excused ? 'checked' : '') + '> إعفاء الموظف من الخصم (Excused)</label></div>';

    App.showModal('تعديل حالة التأخير', body, {
      label: 'حفظ التعديلات',
      onClick: function() {
        var r = document.getElementById('delay-reason').value;
        var e = document.getElementById('delay-excuse').checked;
        sbClient.from('attendance').update({ delay_reason: r, delay_excused: e }).eq('id', attId).then(function(res) {
          if (!res.error) {
            App.closeModal();
            Pages.allDelays(document.getElementById('page-content')); // reload
          }
        });
      }
    });
  };
};

// ----- MISSIONS (Employee View) -----
Pages.missions = function (el) {
  var missions = [];

  function render() {
    var html = '<div class="card" style="margin-bottom:24px;border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 24px; border-radius: var(--radius-lg);">';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">';
    html += '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-primary-soft);display:flex;align-items:center;justify-content:center;color:var(--accent-primary)">' + icon('briefcase', 22) + '</div>';
    html += '<h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">طلب وتسجيل المأموريات (Missions)</h3>';
    html += '</div>';
    html += '<p style="color:var(--text-secondary);direction:rtl;text-align:right">قم بتقديم طلب مأمورية عمل للـ HR. بعد الموافقة، يمكنك تسجيل بصمة الخروج والعودة من هنا.</p>';

    html += '<div style="margin-top:20px;padding:20px;background:var(--bg-secondary);border-radius:8px;text-align:center;">';
    html += '<input type="date" id="mission-date" class="input-field" value="' + todayStr() + '" style="margin-bottom:15px;width:100%">';
    html += '<input type="text" id="mission-reason" class="input-field" placeholder="سبب المأمورية والوجهة (مطلوب)" style="margin-bottom:15px;width:100%">';
    html += '<button class="btn btn-primary" style="width:100%" id="req-mission-btn">إرسال طلب المأمورية</button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><h3>سجل مأمورياتك</h3></div><div class="card-body no-pad"><div class="table-container"><table class="data-table" style="direction:rtl;text-align:right"><thead><tr>';
    html += '<th>التاريخ</th><th>الوجهة/السبب</th><th>الحالة</th><th>وقت الخروج</th><th>وقت العودة</th><th>إجراء البصمة</th></tr></thead><tbody>';

    if (missions.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد مأموريات مسجلة</td></tr>';
    } else {
      missions.forEach(function (m) {
        var statusBadge = m.status === 'approved' ? '<span class="badge badge-success">مقبول</span>' :
          (m.status === 'rejected' ? '<span class="badge badge-danger">مرفوض</span>' : '<span class="badge badge-warning">قيد الانتظار</span>');

        var actionHtml = '-';
        if (m.status === 'approved') {
          if (!m.time_out && m.mission_date === todayStr()) {
            actionHtml = '<button class="btn btn-warning btn-xs" data-start-mission="' + m.id + '">تسجيل الخروج</button>';
          } else if (m.time_out && !m.time_in) {
            actionHtml = '<button class="btn btn-success btn-xs" data-end-mission="' + m.id + '">تسجيل العودة</button>';
          } else if (m.time_in) {
            actionHtml = '<span style="color:var(--text-muted)">مكتملة</span>';
          } else if (m.mission_date !== todayStr() && !m.time_out) {
            actionHtml = '<span style="color:var(--text-muted)">غير متاحة اليوم</span>';
          }
        }

        html += '<tr>';
        html += '<td>' + formatDate(m.mission_date) + '</td>';
        html += '<td>' + (m.reason || 'بدون سبب') + '</td>';
        html += '<td>' + statusBadge + '</td>';
        html += '<td style="color:var(--accent-warning);font-weight:bold">' + (m.time_out ? m.time_out.substring(0, 5) : '-') + '</td>';
        html += '<td style="color:var(--accent-success);font-weight:bold">' + (m.time_in ? m.time_in.substring(0, 5) : '-') + '</td>';
        html += '<td>' + actionHtml + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    var reqBtn = document.getElementById('req-mission-btn');
    if (reqBtn) {
      reqBtn.addEventListener('click', function () {
        var reason = document.getElementById('mission-reason').value;
        var date = document.getElementById('mission-date').value;
        if (!reason || !date) { alert('يرجى كتابة سبب المأمورية وتاريخها.'); return; }

        sbClient.from('missions').insert([{
          employee_id: App.user.id,
          employee_name: App.user.full_name,
          mission_date: date,
          reason: reason,
          status: 'pending'
        }]).then(function (r) {
          if (r.error) {
            alert('خطأ في التسجيل: ' + r.error.message + ' | code: ' + r.error.code + ' | details: ' + r.error.details);
            console.error(r.error);
          } else {
            showToast('تم إرسال الطلب للـ HR في انتظار الموافقة!', 'success');
            loadData();
          }
        });
      });
    }

    el.querySelectorAll('[data-start-mission]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-start-mission');

        var modalBody = '<div style="text-align:center"><div id="mission-reader" style="width:100%;max-width:300px;margin:0 auto 20px;"></div><p style="color:var(--text-secondary);font-size:0.95rem">قم بمسح باركود البوابة لتسجيل <b>خروجك</b> للمأمورية</p></div>';
        App.showModal('تسجيل خروج للمأمورية', modalBody);

                setTimeout(function () {
          if (typeof Html5Qrcode !== 'undefined') {
            var html5QrCode = new Html5Qrcode("mission-reader");
            html5QrCode.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: {width: 200, height: 200} },
              function(decodedText) {
                html5QrCode.stop().then(function() {
                  App.closeModal();
                  var now = new Date();
                  var timeStr = now.toTimeString().split(' ')[0];
                  sbClient.from('missions').update({ actual_time_out: now.toISOString(), time_out: timeStr, qr_out: decodedText }).eq('id', id).then(function (r) {
                    if (!r.error) { showToast('تم تسجيل الخروج للمأمورية بنجاح!', 'success'); loadData(); }
                    else { alert('حدث خطأ: ' + r.error.message); }
                  });
                });
              },
              function(err) {}
            ).catch(function(err) {
              document.getElementById('mission-reader').innerHTML = '<p style="color:red">Camera error: ' + err + '</p>';
            });
          } else {
            document.getElementById('mission-reader').innerHTML = '<p style="color:red">Scanner library not loaded</p>';
          }
        }, 100);
      });
    });

    el.querySelectorAll('[data-end-mission]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-end-mission');

        var modalBody = '<div style="text-align:center"><div id="mission-reader-in" style="width:100%;max-width:300px;margin:0 auto 20px;"></div><p style="color:var(--text-secondary);font-size:0.95rem">قم بمسح باركود البوابة لتسجيل <b>العودة</b> من المأمورية</p></div>';
        App.showModal('تسجيل عودة المأمورية', modalBody);

                setTimeout(function () {
          if (typeof Html5Qrcode !== 'undefined') {
            var html5QrCode = new Html5Qrcode("mission-reader-in");
            html5QrCode.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: {width: 200, height: 200} },
              function(decodedText) {
                html5QrCode.stop().then(function() {
                  App.closeModal();
                  var now = new Date();
                  var timeStr = now.toTimeString().split(' ')[0];
                  
                  sbClient.from('missions').update({ actual_time_in: now.toISOString(), time_in: timeStr, qr_in: decodedText }).eq('id', id).then(function (r) {
                    if (r.error) { alert('حدث خطأ: ' + r.error.message); return; }

                    // Calculate Overtime automatically!
                    var empShiftSystem = App.user.shift_system || '3-shift';
                    var shift = getShiftConfig(App.user.shift || 'morning', empShiftSystem);
                    var overTimeAmount = 0;
                    var diffHours = 0;

                    if (shift && shift.end) {
                      var parts = shift.end.split(':');
                      var shiftEnd = new Date(now);
                      shiftEnd.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);

                      if (parseInt(parts[0]) <= 8 && now.getHours() > 12) {
                        shiftEnd.setDate(shiftEnd.getDate() + 1);
                      }

                      var diffMs = now - shiftEnd;
                      if (diffMs > 0) {
                        diffHours = diffMs / 3600000;
                        var baseSalary = App.user.base_salary || 0;
                        var dailyRate30 = baseSalary / 30;
                        var hourlyRate = dailyRate30 / shift.hours;
                        overTimeAmount = Math.round(diffHours * hourlyRate * 1.5);
                        sbClient.from('missions').update({ overtime_hours: diffHours.toFixed(2) }).eq('id', id).then(function(){});
                      }
                    }

                    if (overTimeAmount > 0) {
                      var currentMonth = now.toISOString().substring(0, 7);
                      sbClient.from('salary_adjustments').insert([{
                        employee_id: App.user.id,
                        employee_name: App.user.full_name,
                        department: App.user.department,
                        type: 'bonus',
                        amount: overTimeAmount,
                        reason: 'إضافي تلقائي: عودة مأمورية متأخرة (' + diffHours.toFixed(2) + ' ساعات × 1.5)',
                        month: currentMonth,
                        requested_by: 'النظام (تلقائي)',
                        status: 'approved'
                      }]).then(function () {
                        showToast('تم تسجيل العودة! وإضافة ' + overTimeAmount + ' ج.م كإضافي لمرتبك تلقائياً ✅', 'success');
                        loadData();
                      });
                    } else {
                      showToast('تم تسجيل العودة من المأمورية بنجاح!', 'success');
                      loadData();
                    }
                  });
                });
              },
              function(err) {}
            ).catch(function(err) {
              document.getElementById('mission-reader-in').innerHTML = '<p style="color:red">Camera error: ' + err + '</p>';
            });
          } else {
            document.getElementById('mission-reader-in').innerHTML = '<p style="color:red">Scanner library not loaded</p>';
          }
        }, 100);
      });
    });
  }

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">جاري التحميل...</div>';
    sbClient.from('missions').select('*').eq('employee_id', App.user.id).order('created_at', { ascending: false }).then(function (r) {
      if (r.error) {
        el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">لا يمكن عرض المأموريات. يرجى التأكد من إنشاء جدول missions في Supabase.<br><code>' + r.error.message + '</code></div>';
        return;
      }
      missions = r.data || [];
      render();
    });
  }

  loadData();
};

// ----- ALL MISSIONS (HR View) -----
Pages.allMissions = function (el) {
  if (!App.isHR()) return;
  var missions = [];

  function render() {
    var html = '<div class="card"><div class="card-header"><div><h3>سجل طلبات مأموريات الموظفين</h3><p>' + missions.length + ' طلب مسجل</p></div><button class="btn btn-outline" id="export-missions">' + icon('download') + ' Export CSV</button></div><div class="card-body no-pad"><div class="table-container"><table class="data-table" style="direction:rtl;text-align:right"><thead><tr>';
    html += '<th>الموظف</th><th>التاريخ</th><th>السبب/الوجهة</th><th>الخروج</th><th>العودة</th><th>الإجراء / الحالة</th></tr></thead><tbody>';

    if (missions.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">لا توجد مأموريات مسجلة</td></tr>';
    } else {
      missions.forEach(function (m) {
        var actionHtml = '-';
        if (m.status === 'pending') {
          if (typeof canApprove === 'function' && canApprove(m.employee_id, m.requester_role)) {
            actionHtml = '<div style="display:flex;gap:4px"><button class="btn btn-success btn-xs" data-approve-mission="' + m.id + '">قبول</button><button class="btn btn-xs" style="background:var(--accent-danger);color:#fff" data-reject-mission="' + m.id + '">رفض</button></div>';
          } else {
            actionHtml = '<span style="font-size:0.75rem;color:var(--text-muted)">في انتظار موافقة أعلى</span>';
          }
        } else {
          actionHtml = m.status === 'approved' ? '<span class="badge badge-success">مقبول</span>' : '<span class="badge badge-danger">مرفوض</span>';
        }

        html += '<tr>';
        html += '<td><div style="font-weight:bold;color:var(--text-primary)">' + (m.employee_name || 'غير معروف') + '</div></td>';
        html += '<td>' + formatDate(m.mission_date) + '</td>';
        html += '<td>' + (m.reason || 'بدون سبب') + '</td>';
        html += '<td style="color:var(--accent-warning);font-weight:bold">' + (m.time_out ? m.time_out.substring(0, 5) : '-') + '</td>';
        html += '<td style="color:var(--accent-success);font-weight:bold">' + (m.time_in ? m.time_in.substring(0, 5) : '-') + '</td>';
        html += '<td>' + actionHtml + '</td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;

    el.querySelectorAll('[data-approve-mission]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-approve-mission');
        sbClient.from('missions').update({ status: 'approved' }).eq('id', id).then(function (r) {
          if (!r.error) { showToast('تم قبول المأمورية', 'success'); loadData(); }
        });
      });
    });

    el.querySelectorAll('[data-reject-mission]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-reject-mission');
        sbClient.from('missions').update({ status: 'rejected' }).eq('id', id).then(function (r) {
          if (!r.error) { showToast('تم رفض المأمورية', 'warning'); loadData(); }
        });
      });
    });

    var exportBtn = document.getElementById('export-missions');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var csv = 'Employee,Date,Reason,Time Out,Time In,Status\n';
        missions.forEach(function (m) {
          csv += '"' + (m.employee_name || '') + '","' + (m.mission_date || '') + '","' + (m.reason || '') + '",' + (m.time_out || '') + ',' + (m.time_in || '') + ',"' + m.status + '"\n';
        });
        App.downloadCSV(csv, 'Employees_Missions.csv');
      });
    }
  }

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">جاري التحميل...</div>';
    sbClient.from('missions').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) {
        el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--accent-danger)">لا يمكن عرض المأموريات. يرجى التأكد من إنشاء جدول missions في Supabase.</div>';
        return;
      }
      missions = r.data || [];
      render();
    });
  }

  loadData();
};

// ========== STAT CARD HELPER ==========
function _statCard(color, iconName, value, label, trendHtml) {
  return '<div class="stat-card" style="--stat-color:' + color + '"><div class="stat-card-header"><div class="stat-card-icon" style="background:' + color + '20">' + icon(iconName, 20) + '</div>' + (trendHtml || '') + '</div><div class="stat-card-value">' + value + '</div><div class="stat-card-label">' + label + '</div></div>';
}

// ========== START APP ==========
document.addEventListener('DOMContentLoaded', function () { App.init(); });


