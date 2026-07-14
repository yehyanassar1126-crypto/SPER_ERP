// ===== DEPARTMENT COST CENTER (تحليل تكلفة الإدارات) =====
window.Pages = window.Pages || {};

Pages.costCenters = function(el) {
  var selectedMonth = new Date().getMonth() + 1;
  var selectedYear = new Date().getFullYear();
  var isExporting = false;
  
  var dataCache = {
    users: [],
    adjustments: [],
    attendance: [],
    pettyCash: [],
    missions: [],
    maintenance: []
  };

  function loadData() {
    el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="width:40px;height:40px;border-width:4px"></span><p style="margin-top:16px;color:var(--text-muted);font-weight:600">جاري تجميع وحساب تكاليف الإدارات...</p></div>';
    
    var startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
    var endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

    Promise.all([
      sbClient.from('users').select('id, full_name, department, base_salary, role').eq('status', 'active'),
      sbClient.from('salary_adjustments').select('*').gte('created_at', startOfMonth).lte('created_at', endOfMonth).eq('status', 'approved'),
      sbClient.from('attendance').select('employee_id, overtime_amount, delay_minutes').gte('date', startOfMonth).lte('date', endOfMonth),
      sbClient.from('petty_cash_transactions').select('*').gte('created_at', startOfMonth).lte('created_at', endOfMonth).eq('type', 'expense').eq('status', 'approved'),
      sbClient.from('driver_missions').select('total_cost, driver_cost, fuel_amount').gte('created_at', startOfMonth).lte('created_at', endOfMonth),
      sbClient.from('maintenance_records').select('cost').gte('created_at', startOfMonth).lte('created_at', endOfMonth)
    ]).then(function(results) {
      dataCache.users = results[0].data || [];
      dataCache.adjustments = results[1].data || [];
      dataCache.attendance = results[2].data || [];
      dataCache.pettyCash = results[3].data || [];
      dataCache.missions = results[4].data || [];
      dataCache.maintenance = results[5].data || [];
      
      renderDashboard();
    }).catch(function(err) {
      el.innerHTML = '<div style="padding:40px;color:var(--accent-danger);text-align:center">Error loading data: ' + err.message + '</div>';
    });
  }

  function renderDashboard() {
    var depts = {};
    var grandTotal = 0;

    // 1. Initialize from users
    var userDept = {};
    dataCache.users.forEach(function(u) {
      var d = u.department || 'Other';
      userDept[u.id] = d;
      if (!depts[d]) depts[d] = { name: d, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
      depts[d].headcount++;
      depts[d].salaries += (parseFloat(u.base_salary) || 0);
    });

    // 2. Adjustments
    dataCache.adjustments.forEach(function(a) {
      var d = userDept[a.employee_id] || 'Other';
      if (!depts[d]) depts[d] = { name: d, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
      if (a.type === 'bonus') depts[d].bonuses += (parseFloat(a.amount) || 0);
      if (a.type === 'penalty') depts[d].penalties += (parseFloat(a.amount) || 0);
    });

    // 3. Attendance (Overtime)
    dataCache.attendance.forEach(function(a) {
      var d = userDept[a.employee_id] || 'Other';
      if (!depts[d]) depts[d] = { name: d, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
      depts[d].overtime += (parseFloat(a.overtime_amount) || 0);
    });

    // 4. Expenses
    dataCache.pettyCash.forEach(function(e) {
      var d = e.department || userDept[e.requested_by] || 'Administration'; 
      if (!depts[d]) depts[d] = { name: d, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
      depts[d].expenses += (parseFloat(e.amount) || 0);
    });

    // 5. Logistics (Missions & Fuel)
    var logDept = 'Logistics';
    if (!depts[logDept]) depts[logDept] = { name: logDept, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
    dataCache.missions.forEach(function(m) {
      depts[logDept].logistics += (parseFloat(m.total_cost) || parseFloat(m.driver_cost) || 0) + (parseFloat(m.fuel_amount) || 0);
    });

    // 6. Maintenance
    var maintDept = 'Maintenance';
    if (!depts[maintDept]) depts[maintDept] = { name: maintDept, headcount: 0, salaries: 0, overtime: 0, bonuses: 0, penalties: 0, expenses: 0, logistics: 0, maintenance: 0, total: 0 };
    dataCache.maintenance.forEach(function(m) {
      depts[maintDept].maintenance += (parseFloat(m.cost) || 0);
    });

    // Calculate Totals
    var sortedDepts = [];
    Object.keys(depts).forEach(function(d) {
      var obj = depts[d];
      obj.total = obj.salaries + obj.overtime + obj.bonuses - obj.penalties + obj.expenses + obj.logistics + obj.maintenance;
      if (obj.total > 0 || obj.headcount > 0) {
        grandTotal += obj.total;
        sortedDepts.push(obj);
      }
    });

    // Sort by highest cost
    sortedDepts.sort(function(a, b) { return b.total - a.total; });

    // Build UI
    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;background:var(--bg-secondary);padding:20px;border-radius:var(--radius-xl);margin-bottom:24px;box-shadow:var(--shadow-sm);border:1px solid var(--border-color)">';
    html += '<div style="display:flex;align-items:center;gap:12px">';
    html += '<div style="width:48px;height:48px;border-radius:12px;background:var(--accent-primary-soft);color:var(--accent-primary);display:flex;align-items:center;justify-content:center">' + icon('pieChart', 24) + '</div>';
    html += '<div><h2 style="margin:0;font-size:1.4rem;font-weight:800;color:var(--text-primary)">Department Cost Centers</h2><p style="margin:0;color:var(--text-tertiary);font-size:0.85rem">تحليل تكلفة الإدارات والمصروفات</p></div>';
    html += '</div>';

    html += '<div style="display:flex;gap:12px;align-items:center">';
    html += '<select id="cc-month" class="form-input" style="width:140px;font-weight:700" onchange="window.CostCenter.changeFilter()">';
    var months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    months.forEach(function(m, i) {
      html += '<option value="' + (i+1) + '" ' + (selectedMonth === i+1 ? 'selected' : '') + '>' + m + '</option>';
    });
    html += '</select>';
    html += '<select id="cc-year" class="form-input" style="width:100px;font-weight:700" onchange="window.CostCenter.changeFilter()">';
    for(var y = 2024; y <= new Date().getFullYear() + 1; y++) {
      html += '<option value="' + y + '" ' + (selectedYear === y ? 'selected' : '') + '>' + y + '</option>';
    }
    html += '</select>';
    html += '<button class="btn btn-primary" onclick="window.CostCenter.exportPDF()">' + icon('download') + ' تقرير PDF</button>';
    html += '</div></div>';

    // Summary Cards
    html += '<div class="stats-grid" style="grid-template-columns:repeat(auto-fit, minmax(280px, 1fr))">';
    html += _ccCard('إجمالي تكلفة الشركة', grandTotal.toLocaleString() + ' EGP', 'اجمالي مصروفات جميع الإدارات', 'briefcase', 'var(--accent-primary)');
    html += _ccCard('أعلى إدارة تكلفة', sortedDepts.length > 0 ? sortedDepts[0].name : 'لا يوجد', sortedDepts.length > 0 ? sortedDepts[0].total.toLocaleString() + ' EGP' : '-', 'trendingUp', 'var(--accent-danger)');
    html += _ccCard('إجمالي الموظفين', dataCache.users.length, 'موزعين على ' + sortedDepts.length + ' إدارات', 'users', 'var(--accent-success)');
    var avgCost = dataCache.users.length > 0 ? (grandTotal / dataCache.users.length) : 0;
    html += _ccCard('متوسط تكلفة الموظف', Math.round(avgCost).toLocaleString() + ' EGP', 'للموظف الواحد خلال الشهر', 'calculator', 'var(--accent-warning)');
    html += '</div>';

    // Charts Container
    html += '<div class="grid-2" style="margin-bottom:24px">';
    html += '<div class="card"><div class="card-header"><h3>التكلفة حسب الإدارة (Distribution)</h3></div><div class="card-body"><canvas id="cc-pie-chart" height="300"></canvas></div></div>';
    html += '<div class="card"><div class="card-header"><h3>مقارنة الإدارات (Cost Breakdown)</h3></div><div class="card-body"><canvas id="cc-bar-chart" height="300"></canvas></div></div>';
    html += '</div>';

    // Departments Details Table
    html += '<div class="card"><div class="card-header"><h3>تفاصيل مراكز التكلفة (Cost Centers Details)</h3><p>موزعة حسب البنود لـ شهر ' + selectedMonth + '/' + selectedYear + '</p></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table" id="cc-table">';
    html += '<thead><tr><th>الإدارة (Cost Center)</th><th style="text-align:center">موظفين</th><th>رواتب وإضافي</th><th>مكافآت وخصومات</th><th>نثريات ومصروفات</th><th>حركة وصيانة</th><th>الإجمالي (Total)</th><th>النسبة</th></tr></thead><tbody>';
    
    sortedDepts.forEach(function(d) {
      var pct = grandTotal > 0 ? ((d.total / grandTotal) * 100).toFixed(1) : 0;
      var payroll = d.salaries + d.overtime;
      var adj = d.bonuses - d.penalties;
      var logMaint = d.logistics + d.maintenance;

      html += '<tr style="cursor:pointer" onclick="window.CostCenter.viewDeptDetails(\'' + d.name + '\')">';
      html += '<td><div style="font-weight:800;color:var(--text-primary);display:flex;align-items:center;gap:8px"><div style="width:10px;height:10px;border-radius:50%;background:var(--accent-primary)"></div>' + d.name + '</div></td>';
      html += '<td style="text-align:center"><span class="badge badge-neutral">' + d.headcount + '</span></td>';
      html += '<td style="font-weight:600">' + payroll.toLocaleString() + ' EGP</td>';
      html += '<td style="font-weight:600;color:' + (adj >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)') + '">' + (adj > 0 ? '+' : '') + adj.toLocaleString() + ' EGP</td>';
      html += '<td>' + d.expenses.toLocaleString() + ' EGP</td>';
      html += '<td>' + logMaint.toLocaleString() + ' EGP</td>';
      html += '<td style="font-weight:800;font-size:1.1rem;color:var(--accent-primary)">' + d.total.toLocaleString() + ' EGP</td>';
      html += '<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:var(--accent-primary)"></div></div><span style="font-size:0.75rem;font-weight:700">' + pct + '%</span></div></td>';
      html += '</tr>';
    });

    if (sortedDepts.length === 0) {
      html += '<tr><td colspan="8"><div class="empty-state"><div style="font-size:3rem">📉</div><p>لا توجد بيانات تكلفة لهذا الشهر</p></div></td></tr>';
    }

    html += '</tbody></table></div></div></div>';

    el.innerHTML = html;

    // Render Charts
    setTimeout(function() {
      renderCharts(sortedDepts);
    }, 100);
  }

  function renderCharts(depts) {
    if (typeof Chart === 'undefined') return;
    
    var labels = depts.map(function(d) { return d.name; });
    var totals = depts.map(function(d) { return d.total; });
    var payrolls = depts.map(function(d) { return d.salaries + d.overtime + d.bonuses - d.penalties; });
    var operations = depts.map(function(d) { return d.expenses + d.logistics + d.maintenance; });

    var colors = ['#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

    // Pie Chart
    var ctxPie = document.getElementById('cc-pie-chart');
    if (ctxPie) {
      new Chart(ctxPie, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{ data: totals, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#CBD5E1', font: { family: 'Tajawal' } } } },
          cutout: '70%'
        }
      });
    }

    // Bar Chart
    var ctxBar = document.getElementById('cc-bar-chart');
    if (ctxBar) {
      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'الرواتب (Payroll)', data: payrolls, backgroundColor: '#2563EB', borderRadius: 4 },
            { label: 'التشغيل والمصروفات (Operations)', data: operations, backgroundColor: '#10B981', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } }
          },
          plugins: { legend: { labels: { color: '#CBD5E1' } } }
        }
      });
    }
  }

  function _ccCard(title, value, sub, icn, color) {
    return '<div class="stat-card" style="background:var(--bg-secondary)"><div class="stat-card-header"><div class="stat-card-icon" style="background:' + color + '20;color:' + color + '">' + icon(icn, 24) + '</div></div><div class="stat-card-value">' + value + '</div><div class="stat-card-label" style="font-size:0.9rem;font-weight:700;color:var(--text-primary)">' + title + '</div><div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">' + sub + '</div></div>';
  }

  window.CostCenter = {
    changeFilter: function() {
      selectedMonth = parseInt(document.getElementById('cc-month').value);
      selectedYear = parseInt(document.getElementById('cc-year').value);
      loadData();
    },
    exportPDF: function() {
      // Simplified PDF export wrapper
      var table = document.getElementById('cc-table');
      if(!table) return;
      var printWin = window.open('', '_blank');
      var html = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تقرير تكلفة الإدارات</title>';
      html += '<style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border:1px solid #ddd;text-align:right}th{background:#f8f9fa}</style></head><body>';
      html += '<h1>تقرير تحليل تكلفة الإدارات (Cost Centers)</h1>';
      html += '<h3>لشهر: ' + selectedMonth + ' / ' + selectedYear + '</h3>';
      html += table.outerHTML;
      html += '<script>window.onload=function(){window.print();}</script></body></html>';
      printWin.document.write(html);
      printWin.document.close();
    },
    viewDeptDetails: function(deptName) {
      showToast('عرض تفاصيل ' + deptName + ' (قريباً في التحديث القادم)', 'info');
    }
  };

  loadData();
};
