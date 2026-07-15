// ==========================================
// Fleet & Drivers Management System (إدارة الأسطول والسائقين)
// ==========================================
var FleetModule = {
  render: function (el) {
    el.innerHTML = '<div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">' +
      '<div><h2>إدارة الأسطول والسائقين (Fleet & Drivers)</h2>' +
      '<p>إدارة السائقين، السيارات، الرحلات، والصيانة</p></div>' +
      '<div><button class="btn btn-outline" onclick="FleetModule.renderDashboard()">' + icon('layoutDashboard') + ' لوحة التحكم</button></div>' +
      '</div>' +
      '<div class="tabs" style="margin-bottom: 20px;">' +
      '<button class="tab-btn active" onclick="FleetModule.switchTab(\'dashboard\', this)">' + icon('pieChart') + ' Dashboard</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'internal_drivers\', this)">' + icon('user') + ' السائقين الداخليين</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'external_drivers\', this)">' + icon('users') + ' شركات النقل (خارجي)</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'vehicles\', this)">' + icon('truck') + ' السيارات (Fleet)</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'trips\', this)">' + icon('map') + ' سجل الرحلات</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'maintenance\', this)">' + icon('tool') + ' الصيانة</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'incidents\', this)">' + icon('alertTriangle') + ' الحوادث والمخالفات</button>' +
      '<button class="tab-btn" onclick="FleetModule.switchTab(\'reports\', this)">' + icon('barChart') + ' التقارير</button>' +
      '</div>' +
      '<div id="fleet-content"></div>';
    
    this.renderDashboard();
  },

  switchTab: function (tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    
    var content = document.getElementById('fleet-content');
    content.innerHTML = '<div class="loader"></div>';

    switch (tab) {
      case 'dashboard': this.renderDashboard(); break;
      case 'internal_drivers': this.renderInternalDrivers(); break;
      case 'external_drivers': this.renderExternalDrivers(); break;
      case 'vehicles': this.renderVehicles(); break;
      case 'trips': this.renderTrips(); break;
      case 'maintenance': this.renderMaintenance(); break;
      case 'incidents': this.renderIncidents(); break;
      case 'reports': this.renderReports(); break;
    }
  },

  // =====================================
  // Dashboard
  // =====================================
  renderDashboard: function () {
    var c = document.getElementById('fleet-content');
    
    // Simulate Fetching Data
    var kpis = {
      internal_drivers: 15,
      external_drivers: 5,
      vehicles: 20,
      active_trips: 8,
      maintenance: 3,
      alerts: 4
    };

    var html = '<div class="kpi-grid">' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(99,102,241,0.1);color:#6366f1;">' + icon('user') + '</div><div class="kpi-info"><h3>سائقين داخليين</h3><p>' + kpis.internal_drivers + '</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(16,185,129,0.1);color:#10b981;">' + icon('users') + '</div><div class="kpi-info"><h3>شركات خارجية</h3><p>' + kpis.external_drivers + '</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b;">' + icon('truck') + '</div><div class="kpi-info"><h3>إجمالي السيارات</h3><p>' + kpis.vehicles + '</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(59,130,246,0.1);color:#3b82f6;">' + icon('map') + '</div><div class="kpi-info"><h3>رحلات نشطة</h3><p>' + kpis.active_trips + '</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(239,68,68,0.1);color:#ef4444;">' + icon('tool') + '</div><div class="kpi-info"><h3>سيارات بالصيانة</h3><p>' + kpis.maintenance + '</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(225,29,72,0.1);color:#e11d48;">' + icon('alertTriangle') + '</div><div class="kpi-info"><h3>تنبيهات (رخص/تأمين)</h3><p>' + kpis.alerts + '</p></div></div>' +
      '</div>';
    
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">' +
      '<div class="card"><h3>التنبيهات الذكية (Smart Alerts)</h3><div id="fleet-alerts"><div class="loader"></div></div></div>' +
      '<div class="card"><h3>حالة الرحلات اليوم</h3><div id="fleet-trips-chart"><canvas id="tripsChart"></canvas></div></div>' +
      '</div>';

    c.innerHTML = html;

    // Fetch Alerts
    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_alerts').select('*').then(function (res) {
        var alertsDiv = document.getElementById('fleet-alerts');
        if (res.error || !res.data || res.data.length === 0) {
          alertsDiv.innerHTML = '<p style="color:#64748b; text-align:center; padding:20px;">لا توجد تنبيهات حالية.</p>';
        } else {
          var alertHtml = '<div style="display:flex; flex-direction:column; gap:10px;">';
          res.data.forEach(function(a) {
            alertHtml += '<div style="padding:10px; background:rgba(239,68,68,0.1); border-left:4px solid #ef4444; border-radius:4px;">' +
              '<strong>' + a.alert_type + '</strong>: ' + a.entity + ' (تاريخ الانتهاء: ' + a.due_date + ')' +
              '</div>';
          });
          alertHtml += '</div>';
          alertsDiv.innerHTML = alertHtml;
        }
      });
    }

    // Chart
    setTimeout(function() {
      var ctx = document.getElementById('tripsChart');
      if (ctx && window.Chart) {
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['مجدولة', 'في الطريق', 'تم التوصيل'],
            datasets: [{
              data: [3, 5, 12],
              backgroundColor: ['#f59e0b', '#3b82f6', '#10b981']
            }]
          }
        });
      }
    }, 500);
  },

  // =====================================
  // Internal Drivers
  // =====================================
  renderInternalDrivers: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showInternalDriverModal()">' + icon('plus') + ' إضافة سائق</button>' : '';
    
    c.innerHTML = '<div class="card">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
      '<h3>السائقين الداخليين</h3>' + addBtnHtml +
      '</div>' +
      '<div class="table-responsive"><table class="table" id="internal-drivers-table">' +
      '<thead><tr><th>كود السائق</th><th>الاسم</th><th>الرقم القومي</th><th>رقم الرخصة</th><th>تاريخ الانتهاء</th><th>الحالة</th><th>الإجراءات</th></tr></thead>' +
      '<tbody><tr><td colspan="7" class="text-center">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_internal_drivers').select('*').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#internal-drivers-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          html += '<tr>' +
            '<td>' + (d.driver_code || '-') + '</td>' +
            '<td>' + (d.driver_name || '-') + '</td>' +
            '<td>' + (d.national_id || '-') + '</td>' +
            '<td>' + (d.license_number || '-') + '</td>' +
            '<td>' + (d.license_expiry || '-') + '</td>' +
            '<td><span class="badge badge-' + (d.status === 'متاح' ? 'success' : d.status === 'في رحلة' ? 'warning' : 'danger') + '">' + d.status + '</span></td>' +
            '<td><button class="btn btn-sm btn-outline" onclick="FleetModule.viewDriver(\'' + d.id + '\')">عرض</button></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showInternalDriverModal: function () {
    var m = document.getElementById('modal-container');
    m.innerHTML = '<div class="modal-overlay" style="display:flex;">' +
      '<div class="modal" style="width:700px; max-width:95%;">' +
      '<div class="modal-header"><h3>إضافة سائق داخلي</h3><button class="modal-close" onclick="document.getElementById(\'modal-container\').innerHTML=\'\'">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
      '<form id="driver-form" style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">' +
      '<div class="form-group"><label class="form-label">كود السائق</label><input type="text" id="d_code" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">الاسم</label><input type="text" id="d_name" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">رقم الهاتف</label><input type="text" id="d_phone" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">الرقم القومي</label><input type="text" id="d_national" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">رقم الرخصة</label><input type="text" id="d_lic" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">تاريخ انتهاء الرخصة</label><input type="date" id="d_lic_exp" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">نوع الرخصة</label><select id="d_lic_type" class="form-input"><option value="درجة أولى">درجة أولى</option><option value="درجة ثانية">درجة ثانية</option><option value="درجة ثالثة">درجة ثالثة</option></select></div>' +
      '<div class="form-group"><label class="form-label">القسم التابع له</label><input type="text" id="d_dept" class="form-input"></div>' +
      '<div class="form-group" style="grid-column: span 2; text-align:right;">' +
      '<button type="submit" class="btn btn-primary">حفظ البيانات</button>' +
      '</div></form></div></div></div>';

    document.getElementById('driver-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        driver_code: document.getElementById('d_code').value,
        driver_name: document.getElementById('d_name').value,
        phone: document.getElementById('d_phone').value,
        national_id: document.getElementById('d_national').value,
        license_number: document.getElementById('d_lic').value,
        license_expiry: document.getElementById('d_lic_exp').value || null,
        license_type: document.getElementById('d_lic_type').value,
        department: document.getElementById('d_dept').value,
        status: 'متاح'
      };
      sbClient.from('fleet_internal_drivers').insert(data).then(function (res) {
        if (res.error) alert('Error: ' + res.error.message);
        else {
          document.getElementById('modal-container').innerHTML = '';
          FleetModule.renderInternalDrivers();
        }
      });
    });
  },

  // =====================================
  // External Drivers & Companies
  // =====================================
  renderExternalDrivers: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="alert(\'سيتم إضافة شاشة الإدخال قريباً\')">' + icon('plus') + ' إضافة مورد نقل</button>' : '';

    c.innerHTML = '<div class="card">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
      '<h3>شركات النقل والسائقين الخارجيين</h3>' + addBtnHtml +
      '</div>' +
      '<div class="table-responsive"><table class="table" id="ext-drivers-table">' +
      '<thead><tr><th>السائق / الشركة</th><th>بيانات التواصل</th><th>رقم السيارة</th><th>النوع</th><th>الحمولة</th><th>سعر النقل</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" class="text-center">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_external_drivers').select('*').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#ext-drivers-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          html += '<tr>' +
            '<td>' + (d.driver_name) + (d.company_name ? ' ('+d.company_name+')' : '') + '</td>' +
            '<td>' + (d.contact_info || '-') + '</td>' +
            '<td>' + (d.car_number || '-') + '</td>' +
            '<td>' + (d.car_type || '-') + '</td>' +
            '<td>' + (d.capacity || '-') + '</td>' +
            '<td>' + (d.transport_rate || '-') + '</td>' +
            '<td><span class="badge badge-info">' + d.status + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  // =====================================
  // Vehicles
  // =====================================
  renderVehicles: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="alert(\'سيتم إضافة شاشة الإدخال قريباً\')">' + icon('plus') + ' إضافة سيارة</button>' : '';

    c.innerHTML = '<div class="card">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
      '<h3>أسطول السيارات</h3>' + addBtnHtml +
      '</div>' +
      '<div class="table-responsive"><table class="table" id="vehicles-table">' +
      '<thead><tr><th>رقم السيارة</th><th>اللوحة</th><th>النوع والموديل</th><th>السائق الحالي</th><th>عداد الكيلومترات</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="6" class="text-center">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_vehicles').select('*, fleet_internal_drivers(driver_name)').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#vehicles-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          html += '<tr>' +
            '<td>' + d.car_number + '</td>' +
            '<td>' + d.plate_number + '</td>' +
            '<td>' + (d.car_type || '') + ' ' + (d.model || '') + ' ' + (d.year || '') + '</td>' +
            '<td>' + (d.fleet_internal_drivers ? d.fleet_internal_drivers.driver_name : 'غير محدد') + '</td>' +
            '<td>' + d.odometer + ' كم</td>' +
            '<td><span class="badge badge-' + (d.status === 'متاحة' ? 'success' : 'warning') + '">' + d.status + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  // =====================================
  // Trips
  // =====================================
  renderTrips: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="alert(\'سيتم إضافة شاشة الإدخال قريباً\')">' + icon('plus') + ' إنشاء رحلة جديدة</button>' : '';

    c.innerHTML = '<div class="card">' +
      '<div style="display:flex; justify-content:space-between; margin-bottom:15px;">' +
      '<h3>سجل الرحلات (Logistics & Trips)</h3>' + addBtnHtml +
      '</div>' +
      '<div class="table-responsive"><table class="table" id="trips-table">' +
      '<thead><tr><th>رقم الرحلة</th><th>العميل</th><th>السائق</th><th>السيارة</th><th>الخروج</th><th>الوصول</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" class="text-center">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_trips').select('*, fleet_internal_drivers(driver_name), fleet_external_drivers(driver_name), fleet_vehicles(plate_number)').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#trips-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          var driver = d.driver_type === 'internal' && d.fleet_internal_drivers ? d.fleet_internal_drivers.driver_name : 
                       (d.fleet_external_drivers ? d.fleet_external_drivers.driver_name : '-');
          var vehicle = d.fleet_vehicles ? d.fleet_vehicles.plate_number : '-';
          
          html += '<tr>' +
            '<td>' + d.trip_number + '</td>' +
            '<td>' + (d.client_name || '-') + '</td>' +
            '<td>' + driver + '</td>' +
            '<td>' + vehicle + '</td>' +
            '<td>' + (d.departure_time ? new Date(d.departure_time).toLocaleString() : '-') + '</td>' +
            '<td>' + (d.arrival_time ? new Date(d.arrival_time).toLocaleString() : '-') + '</td>' +
            '<td><span class="badge badge-info">' + d.status + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  // =====================================
  // Maintenance, Incidents, Reports placeholders
  // =====================================
  renderMaintenance: function () {
    document.getElementById('fleet-content').innerHTML = '<div class="card"><h3>الصيانة والوقود</h3><p>جاري تطوير هذه الشاشة بناءً على سجلات الصيانة...</p></div>';
  },
  renderIncidents: function () {
    document.getElementById('fleet-content').innerHTML = '<div class="card"><h3>الحوادث والمخالفات</h3><p>جاري تطوير هذه الشاشة لتسجيل غرامات السائقين والحوادث وربطها بالخصومات...</p></div>';
  },
  renderReports: function () {
    document.getElementById('fleet-content').innerHTML = '<div class="card"><h3>تقارير الأسطول والسائقين</h3><p>التقارير التفصيلية لتكاليف النقل واستهلاك الوقود...</p>' +
      '<button class="btn btn-outline" style="margin-top:10px" onclick="window.print()">طباعة التقرير الشامل</button></div>';
  }
};

window.FleetModule = FleetModule;
if (typeof Pages !== 'undefined') {
  Pages['erp-fleet'] = function(el) {
    FleetModule.render(el);
  };
}
