// ==========================================
// Enterprise UX Engine v2.0
// Command Palette, Theme, Quick Actions, CEO Dashboard, Activity Timeline
// ==========================================
var EnterpriseUX = {

  // All navigable pages for Command Palette & Global Search
  allPages: [
    { id: 'dashboard', name: 'Dashboard (لوحة التحكم)', icon: 'layoutDashboard', section: 'Overview' },
    { id: 'ceo-dashboard', name: 'CEO Dashboard (لوحة المدير)', icon: 'trendingUp', section: 'Executive' },
    { id: 'owner-dashboard', name: 'Owner Dashboard (لوحة المالك)', icon: 'globe', section: 'Executive' },
    { id: 'activity-timeline', name: 'Activity Timeline (سجل العمليات)', icon: 'clock', section: 'Analytics' },
    { id: 'employees', name: 'Employees (الموظفون)', icon: 'users', section: 'HR' },
    { id: 'attendance', name: 'Attendance (الحضور)', icon: 'calendarCheck', section: 'HR' },
    { id: 'leaves', name: 'Leave Requests (الإجازات)', icon: 'calendarDays', section: 'HR' },
    { id: 'payroll', name: 'Payroll (المرتبات)', icon: 'dollarSign', section: 'HR' },
    { id: 'shifts', name: 'Shift Management (الشيفتات)', icon: 'clock', section: 'HR' },
    { id: 'overtime', name: 'Overtime (الأوفرتايم)', icon: 'timer', section: 'HR' },
    { id: 'recruitment', name: 'Recruitment (التوظيف)', icon: 'userCheck', section: 'HR' },
    { id: 'hr-ats', name: 'AI ATS (فحص السيرة الذاتية)', icon: 'search', section: 'HR' },
    { id: 'loans', name: 'Loans & Advances (السلفيات)', icon: 'creditCard', section: 'HR' },
    { id: 'performance-reviews', name: 'Performance Reviews (تقييم الأداء)', icon: 'trendingUp', section: 'HR' },
    { id: 'training', name: 'Training (التدريب)', icon: 'book', section: 'HR' },
    { id: 'employee-warnings', name: 'Warnings (الإنذارات)', icon: 'alertTriangle', section: 'HR' },
    { id: 'erp-sales', name: 'Sales Orders (أوامر البيع)', icon: 'shoppingBag', section: 'Sales' },
    { id: 'erp-planning', name: 'Production Planning (التخطيط)', icon: 'calendarCheck', section: 'Production' },
    { id: 'erp-production', name: 'Production Orders (أوامر الإنتاج)', icon: 'settings', section: 'Production' },
    { id: 'erp-quality', name: 'Quality Control (الجودة)', icon: 'checkCircle', section: 'Quality' },
    { id: 'erp-maintenance', name: 'Maintenance (الصيانة)', icon: 'tool', section: 'Maintenance' },
    { id: 'inventory', name: 'Inventory (المخازن)', icon: 'package', section: 'Operations' },
    { id: 'purchase-requests', name: 'Purchase Requests (طلبات الشراء)', icon: 'shoppingCart', section: 'Operations' },
    { id: 'petty-cash', name: 'Financial Suite (الإدارة المالية)', icon: 'dollarSign', section: 'Finance' },
    { id: 'financial-reports', name: 'Financial Reports (التقارير المالية)', icon: 'barChart', section: 'Finance' },
    { id: 'cost-centers', name: 'Cost Centers (مراكز التكلفة)', icon: 'pieChart', section: 'Finance' },
    { id: 'chart-of-accounts', name: 'Chart of Accounts (شجرة الحسابات - GL)', icon: 'list', section: 'Finance' },
    { id: 'logistics', name: 'Vehicle Movement (حركة السيارات)', icon: 'truck', section: 'Logistics' },
    { id: 'erp-fleet', name: 'Fleet & Drivers (إدارة الأسطول)', icon: 'map', section: 'Logistics' },
    { id: 'engineering', name: 'Engineering (الهندسة)', icon: 'edit3', section: 'Engineering' },
    { id: 'spare-parts', name: 'Spare Parts (قطع الغيار)', icon: 'settings', section: 'Maintenance' },
    { id: 'erp-suppliers', name: 'Suppliers (الموردون)', icon: 'users', section: 'Supply Chain' },
    { id: 'it-tickets', name: 'IT Support (الدعم الفني)', icon: 'cpu', section: 'IT' },
    { id: 'legal-affairs', name: 'Legal Affairs (الشئون القانونية)', icon: 'shield', section: 'Legal' },
    { id: 'reports', name: 'Reports (التقارير)', icon: 'barChart', section: 'Analytics' },
    { id: 'kpi-dashboard', name: 'KPI Dashboard (مؤشرات الأداء)', icon: 'trendingUp', section: 'Analytics' },
    { id: 'audit-log', name: 'Audit Log (سجل التدقيق)', icon: 'fileText', section: 'Analytics' },
    { id: 'announcements', name: 'Announcements (الإعلانات)', icon: 'megaphone', section: 'Communication' },
    { id: 'internal-chat', name: 'Internal Chat (المحادثات)', icon: 'messageSquare', section: 'Communication' },
    { id: 'task-management', name: 'Tasks (المهام)', icon: 'checkCircle', section: 'Collaboration' },
    { id: 'system-settings', name: 'Settings (الإعدادات)', icon: 'settings', section: 'Admin' },
  ],

  quickActions: [
    { name: 'إضافة موظف جديد', nameEn: 'Add Employee', icon: 'userPlus', page: 'employees' },
    { name: 'إنشاء أمر بيع', nameEn: 'Create Sales Order', icon: 'shoppingBag', page: 'erp-sales' },
    { name: 'إنشاء أمر شراء', nameEn: 'Create Purchase Request', icon: 'shoppingCart', page: 'purchase-requests' },
    { name: 'إنشاء أمر إنتاج', nameEn: 'Create Production Order', icon: 'settings', page: 'erp-production' },
    { name: 'إنشاء رحلة نقل', nameEn: 'Create Trip', icon: 'truck', page: 'erp-fleet' },
    { name: 'إضافة مورد', nameEn: 'Add Supplier', icon: 'users', page: 'erp-suppliers' },
    { name: 'إنشاء تذكرة دعم', nameEn: 'Create IT Ticket', icon: 'cpu', page: 'it-tickets' },
    { name: 'طلب صيانة', nameEn: 'Maintenance Request', icon: 'tool', page: 'erp-maintenance' },
  ],

  init: function() {
    this.initTheme();
    this.injectCommandPalette();
    this.bindGlobalKeys();
    this.enhanceHeaderOnLoad();
    this.registerPages();
  },

  // ===== THEME =====
  initTheme: function() {
    var t = localStorage.getItem('erp_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  },

  toggleTheme: function() {
    var c = document.documentElement.getAttribute('data-theme');
    var n = c === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    localStorage.setItem('erp_theme', n);
    var btn = document.getElementById('theme-toggle');
    if (btn && typeof icon !== 'undefined') btn.innerHTML = n === 'light' ? icon('sun') : icon('moon');
  },

  // ===== SIDEBAR COLLAPSE =====
  toggleSidebarCollapse: function() {
    var sb = document.getElementById('sidebar');
    if (!sb) return;
    sb.classList.toggle('collapsed');
    localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed'));
  },

  restoreSidebarState: function() {
    if (localStorage.getItem('sidebar_collapsed') === 'true') {
      var sb = document.getElementById('sidebar');
      if (sb) sb.classList.add('collapsed');
    }
  },

  // ===== COMMAND PALETTE =====
  injectCommandPalette: function() {
    if (document.getElementById('command-palette')) return;
    var cp = document.createElement('div');
    cp.id = 'command-palette';
    cp.className = 'command-palette-overlay';
    cp.onclick = function(e) { if (e.target === cp) EnterpriseUX.closeCommandPalette(); };
    cp.innerHTML = '<div class="command-palette-modal">' +
      '<div class="cp-header">' + (typeof icon !== 'undefined' ? icon('search') : '🔍') +
      '<input type="text" id="cp-input" placeholder="Search pages, actions... (Ctrl+K)" autocomplete="off">' +
      '<button class="cp-close" onclick="EnterpriseUX.closeCommandPalette()">ESC</button></div>' +
      '<div class="cp-results" id="cp-results"></div></div>';
    document.body.appendChild(cp);
  },

  openCommandPalette: function() {
    var cp = document.getElementById('command-palette');
    if (cp) { cp.classList.add('active'); var inp = document.getElementById('cp-input'); if (inp) { inp.value = ''; inp.focus(); } this.renderCPResults(''); }
  },

  closeCommandPalette: function() {
    var cp = document.getElementById('command-palette');
    if (cp) cp.classList.remove('active');
  },

  renderCPResults: function(query) {
    var el = document.getElementById('cp-results');
    if (!el) return;
    query = (query || '').toLowerCase().trim();
    var ic = typeof icon !== 'undefined' ? icon : function() { return ''; };

    // Filter pages
    var pages = this.allPages.filter(function(p) {
      // Security check for legal-affairs
      if (p.id === 'legal-affairs') {
        var canViewLegal = App.isOwner() || (App.user && App.user.role === 'lawyer');
        if (!canViewLegal) return false;
      }
      return !query || p.name.toLowerCase().indexOf(query) !== -1 || p.id.toLowerCase().indexOf(query) !== -1;
    });

    // Filter actions
    var actions = this.quickActions.filter(function(a) {
      return !query || a.name.toLowerCase().indexOf(query) !== -1 || a.nameEn.toLowerCase().indexOf(query) !== -1;
    });

    if (pages.length === 0 && actions.length === 0) {
      el.innerHTML = '<div class="cp-empty">لا توجد نتائج لـ "' + query + '"</div>';
      return;
    }

    var html = '';
    if (actions.length > 0 && query) {
      html += '<div class="cp-section-label">Quick Actions</div>';
      actions.slice(0, 5).forEach(function(a) {
        html += '<div class="cp-item" onclick="App.navigate(\'' + a.page + '\'); EnterpriseUX.closeCommandPalette();">' +
          '<div class="cp-item-icon">' + ic(a.icon) + '</div>' +
          '<div class="cp-item-text">' + a.name + '</div>' +
          '<div class="cp-item-type">Action</div></div>';
      });
    }

    // Group pages by section
    var sections = {};
    pages.slice(0, 15).forEach(function(p) {
      if (!sections[p.section]) sections[p.section] = [];
      sections[p.section].push(p);
    });

    Object.keys(sections).forEach(function(sec) {
      html += '<div class="cp-section-label">' + sec + '</div>';
      sections[sec].forEach(function(p) {
        html += '<div class="cp-item" onclick="App.navigate(\'' + p.id + '\'); EnterpriseUX.closeCommandPalette();">' +
          '<div class="cp-item-icon">' + ic(p.icon) + '</div>' +
          '<div class="cp-item-text">' + p.name + '</div>' +
          '<div class="cp-item-type">Page</div></div>';
      });
    });

    el.innerHTML = html;
  },

  // ===== GLOBAL KEYS =====
  bindGlobalKeys: function() {
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        EnterpriseUX.openCommandPalette();
      }
      if (e.key === 'Escape') EnterpriseUX.closeCommandPalette();
    });
  },

  // ===== HEADER ENHANCEMENT =====
  enhanceHeaderOnLoad: function() {
    var self = this;
    // Observe DOM changes to inject header buttons after app renders
    var observer = new MutationObserver(function() {
      var headerRight = document.querySelector('.header-right');
      if (headerRight && !document.getElementById('theme-toggle')) {
        self.injectHeaderButtons(headerRight);
        self.restoreSidebarState();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  injectHeaderButtons: function(headerRight) {
    var ic = typeof icon !== 'undefined' ? icon : function() { return ''; };

    // Search button (opens Command Palette)
    var searchBtn = document.createElement('button');
    searchBtn.className = 'header-btn';
    searchBtn.title = 'Global Search (Ctrl+K)';
    searchBtn.id = 'global-search-btn';
    searchBtn.innerHTML = ic('search');
    searchBtn.onclick = function() { EnterpriseUX.openCommandPalette(); };

    // Quick Actions
    var qaBtn = document.createElement('button');
    qaBtn.className = 'header-btn';
    qaBtn.title = 'Quick Actions';
    qaBtn.id = 'qa-toggle';
    qaBtn.innerHTML = ic('plusCircle');
    qaBtn.onclick = function(e) { e.stopPropagation(); EnterpriseUX.toggleQuickActions(); };

    // Theme Toggle
    var themeBtn = document.createElement('button');
    themeBtn.className = 'header-btn';
    themeBtn.title = 'Toggle Theme (Light/Dark)';
    themeBtn.id = 'theme-toggle';
    var currentTheme = document.documentElement.getAttribute('data-theme');
    themeBtn.innerHTML = currentTheme === 'light' ? ic('sun') : ic('moon');
    themeBtn.onclick = function() { EnterpriseUX.toggleTheme(); };

    // Insert buttons before language toggle
    var langBtn = headerRight.querySelector('#lang-toggle-btn');
    if (langBtn) {
      headerRight.insertBefore(searchBtn, langBtn);
      headerRight.insertBefore(qaBtn, langBtn);
      headerRight.insertBefore(themeBtn, langBtn);
    } else {
      headerRight.insertBefore(themeBtn, headerRight.firstChild);
      headerRight.insertBefore(qaBtn, themeBtn);
      headerRight.insertBefore(searchBtn, qaBtn);
    }

    // Sidebar Collapse in header-left
    var headerLeft = document.querySelector('.header-left');
    if (headerLeft && !document.querySelector('.collapse-desktop')) {
      var collapseBtn = document.createElement('button');
      collapseBtn.className = 'collapse-desktop';
      collapseBtn.title = 'Collapse Sidebar';
      collapseBtn.innerHTML = ic('sidebar') || ic('menu');
      collapseBtn.onclick = function() { EnterpriseUX.toggleSidebarCollapse(); };
      headerLeft.insertBefore(collapseBtn, headerLeft.firstChild);
    }

    // Command Palette input listener
    var cpInput = document.getElementById('cp-input');
    if (cpInput) {
      cpInput.addEventListener('input', function() { EnterpriseUX.renderCPResults(this.value); });
    }
  },

  // ===== QUICK ACTIONS MENU =====
  toggleQuickActions: function() {
    var existing = document.getElementById('quick-actions-menu');
    if (existing) { existing.remove(); return; }
    var ic = typeof icon !== 'undefined' ? icon : function() { return ''; };

    var menu = document.createElement('div');
    menu.id = 'quick-actions-menu';
    menu.className = 'dropdown-menu show';

    var html = '<div class="dropdown-header">⚡ Quick Actions</div>';
    this.quickActions.forEach(function(a) {
      html += '<a class="dropdown-item" onclick="App.navigate(\'' + a.page + '\'); document.getElementById(\'quick-actions-menu\')?.remove();">' +
        '<span style="width:20px;display:inline-flex;justify-content:center">' + ic(a.icon) + '</span> ' + a.name + '</a>';
    });
    menu.innerHTML = html;

    var btn = document.getElementById('qa-toggle');
    if (btn) {
      var rect = btn.getBoundingClientRect();
      menu.style.top = (rect.bottom + 8) + 'px';
      menu.style.right = (window.innerWidth - rect.right) + 'px';
    }
    document.body.appendChild(menu);

    setTimeout(function() {
      var handler = function(e) {
        if (!e.target.closest('#quick-actions-menu') && !e.target.closest('#qa-toggle')) {
          var m = document.getElementById('quick-actions-menu');
          if (m) m.remove();
          document.removeEventListener('click', handler);
        }
      };
      document.addEventListener('click', handler);
    }, 50);
  },

  // ===== REGISTER PAGES =====
  registerPages: function() {
    if (typeof Pages === 'undefined') return;
    Pages['ceo-dashboard'] = function(el) { EnterpriseUX.renderCEODashboard(el); };
    Pages['activity-timeline'] = function(el) { EnterpriseUX.renderActivityTimeline(el); };
  },

  // ===== CEO DASHBOARD =====
  renderCEODashboard: function(el) {
    var ic = typeof icon !== 'undefined' ? icon : function() { return ''; };

    // Fetch real data from Supabase
    var promises = [];
    var data = { empCount: 0, presentToday: 0, salesCount: 0, prodCount: 0, tripCount: 0, ticketCount: 0 };

    if (typeof sbClient !== 'undefined') {
      promises.push(sbClient.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active').then(function(r) { if (r.count) data.empCount = r.count; }));
      promises.push(sbClient.from('attendance').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().substring(0, 10)).then(function(r) { if (r.count) data.presentToday = r.count; }));
    }

    Promise.all(promises).then(function() {
      var attRate = data.empCount > 0 ? Math.round((data.presentToday / data.empCount) * 100) : 0;
      el.innerHTML = '<div class="breadcrumb"><a onclick="App.navigate(\'dashboard\')">Home</a> <span class="sep">/</span> CEO Dashboard</div>' +
        '<div class="stats-grid">' +
        '<div class="stat-card" data-accent="green"><div class="stat-card-header"><div class="stat-card-icon" style="background:var(--accent-success-soft);color:var(--accent-success)">' + ic('dollarSign') + '</div><span class="stat-card-trend up">↑ 15%</span></div><div class="stat-card-value">$2.4M</div><div class="stat-card-label">Total Revenue (YTD)</div></div>' +
        '<div class="stat-card" data-accent="blue"><div class="stat-card-header"><div class="stat-card-icon" style="background:var(--accent-primary-soft);color:var(--accent-primary)">' + ic('trendingUp') + '</div><span class="stat-card-trend up">↑ 8%</span></div><div class="stat-card-value">$850K</div><div class="stat-card-label">Net Profit</div></div>' +
        '<div class="stat-card" data-accent="yellow"><div class="stat-card-header"><div class="stat-card-icon" style="background:var(--accent-warning-soft);color:var(--accent-warning)">' + ic('users') + '</div></div><div class="stat-card-value">' + data.empCount + '</div><div class="stat-card-label">Active Employees</div></div>' +
        '<div class="stat-card" data-accent="red"><div class="stat-card-header"><div class="stat-card-icon" style="background:var(--accent-danger-soft);color:var(--accent-danger)">' + ic('calendarCheck') + '</div></div><div class="stat-card-value">' + attRate + '%</div><div class="stat-card-label">Attendance Rate Today</div></div>' +
        '</div>' +
        '<div class="card" style="margin-bottom: 24px; border: 1px solid var(--accent-primary); border-radius: var(--radius-lg); background: linear-gradient(145deg, var(--bg-card) 0%, rgba(59,130,246,0.05) 100%);">' +
        '<div class="card-header" style="border-bottom: none"><h3>' + ic('cpu') + ' AI Predictive Insights (تحليلات الذكاء الاصطناعي)</h3></div>' +
        '<div class="card-body" style="padding-top: 0; display: flex; flex-direction: column; gap: 12px;">' +
        '<div style="padding: 12px 16px; background: rgba(245,158,11,0.1); border-right: 4px solid var(--accent-warning); border-radius: 6px; display: flex; align-items: center; gap: 12px; direction: rtl; text-align: right;"><span style="color:var(--accent-warning)">' + ic('alertTriangle') + '</span> <div><strong style="color:var(--accent-warning)">تحذير مالي:</strong> بناءً على معدل الصرف الحالي، قد تواجه نقصاً في السيولة بالخزينة الرئيسية خلال 4 أيام. يُنصح بتحويل مبلغ من البنك.</div></div>' +
        '<div style="padding: 12px 16px; background: rgba(59,130,246,0.1); border-right: 4px solid var(--accent-primary); border-radius: 6px; display: flex; align-items: center; gap: 12px; direction: rtl; text-align: right;"><span style="color:var(--accent-primary)">' + ic('trendingUp') + '</span> <div><strong style="color:var(--accent-primary)">تنبؤ المبيعات:</strong> بناءً على البيانات التاريخية، متوقع زيادة الطلب بنسبة 20% الأسبوع القادم. تأكد من توافر مخزون كافٍ.</div></div>' +
        '<div style="padding: 12px 16px; background: rgba(239,68,68,0.1); border-right: 4px solid var(--accent-danger); border-radius: 6px; display: flex; align-items: center; gap: 12px; direction: rtl; text-align: right;"><span style="color:var(--accent-danger)">' + ic('clock') + '</span> <div><strong style="color:var(--accent-danger)">مؤشر انضباط (HR):</strong> تأخيرات الموظفين في إدارة "الإنتاج" ارتفعت بنسبة 15%. يُرجى مراجعة إدارة الموارد البشرية لتفادي توقف التشغيل.</div></div>' +
        '</div></div>' +
        '<div class="grid-2">' +
        '<div class="card"><div class="card-header"><h3>📊 Department Performance</h3></div><div class="card-body"><canvas id="ceoDeptChart" height="250"></canvas></div></div>' +
        '<div class="card"><div class="card-header"><h3>📋 Recent System Activity</h3></div><div class="card-body" id="ceo-recent-activity" style="max-height:280px;overflow-y:auto"><div class="skeleton-row"><div class="skeleton-block"></div></div><div class="skeleton-row"><div class="skeleton-block w-60"></div></div></div></div>' +
        '</div>';

      // Render Chart
      setTimeout(function() {
        var ctx = document.getElementById('ceoDeptChart');
        if (ctx && window.Chart) {
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Sales', 'Production', 'HR', 'Finance', 'Logistics', 'Quality'],
              datasets: [{
                label: 'Performance Score',
                data: [88, 75, 92, 84, 70, 90],
                backgroundColor: ['rgba(37,99,235,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)', 'rgba(139,92,246,0.7)', 'rgba(59,130,246,0.7)', 'rgba(14,165,233,0.7)'],
                borderRadius: 6,
                borderSkipped: false
              }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
          });
        }
      }, 300);

      // Load recent activity
      if (typeof sbClient !== 'undefined') {
        sbClient.from('audit_log').select('*').order('created_at', { ascending: false }).limit(8).then(function(res) {
          var div = document.getElementById('ceo-recent-activity');
          if (!div) return;
          if (res.error || !res.data || res.data.length === 0) { div.innerHTML = '<p style="color:var(--text-muted);text-align:center">No recent activity</p>'; return; }
          var html = '';
          res.data.forEach(function(l) {
            html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color)">' +
              '<div class="status-dot online"></div>' +
              '<div style="flex:1"><strong style="font-size:0.85rem">' + (l.action || '') + '</strong> <span style="color:var(--text-muted);font-size:0.8rem">by ' + (l.user_name || 'System') + '</span>' +
              '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">' + new Date(l.created_at).toLocaleString() + '</div></div></div>';
          });
          div.innerHTML = html;
        });
      }
    });
  },

  // ===== ACTIVITY TIMELINE =====
  renderActivityTimeline: function(el) {
    el.innerHTML = '<div class="breadcrumb"><a onclick="App.navigate(\'dashboard\')">Home</a> <span class="sep">/</span> Activity Timeline</div>' +
      '<div class="card"><div class="card-header"><h3>🕐 System Activity Timeline</h3><p>Real-time log of all operations across all departments</p></div>' +
      '<div class="card-body"><div class="timeline" id="global-timeline">' +
      '<div class="skeleton-row"><div class="skeleton-block h-lg"></div></div>' +
      '<div class="skeleton-row"><div class="skeleton-block h-lg w-60"></div></div>' +
      '<div class="skeleton-row"><div class="skeleton-block h-lg"></div></div>' +
      '</div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50).then(function(res) {
        var tl = document.getElementById('global-timeline');
        if (!tl) return;
        if (res.error || !res.data || res.data.length === 0) { tl.innerHTML = '<div class="cp-empty">No activity logged yet</div>'; return; }
        var html = '<ul class="timeline-list">';
        res.data.forEach(function(l) {
          html += '<li class="timeline-item">' +
            '<div class="timeline-marker"></div>' +
            '<div class="timeline-content">' +
            '<h4>' + (l.action || 'Action') + ' — <span style="color:var(--accent-primary)">' + (l.user_name || 'System') + '</span></h4>' +
            '<p>' + (l.details || '') + '</p>' +
            '<span class="timeline-date">' + new Date(l.created_at).toLocaleString() + '</span>' +
            '</div></li>';
        });
        html += '</ul>';
        tl.innerHTML = html;
      });
    }
  }
};

window.EnterpriseUX = EnterpriseUX;

// Auto-init after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { EnterpriseUX.init(); });
} else {
  EnterpriseUX.init();
}
