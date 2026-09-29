// ==========================================
// Fleet & Drivers Management System (إدارة الأسطول والسائقين)
// ==========================================
var FleetModule = {
  render: function (el) {
    el.innerHTML = '<div class="card" style="margin-bottom:20px;"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div><h3>' + icon('truck') + ' إدارة الأسطول والسائقين (Fleet & Drivers)</h3>' +
      '<p style="color:var(--text-tertiary);font-size:0.85rem;margin-top:4px;">إدارة السائقين، السيارات، الرحلات، والصيانة</p></div>' +
      '</div></div>' +
      '<div class="tabs" style="margin-bottom: 20px;">' +
      '<button class="tab-btn active" onclick="FleetModule.switchTab(\'dashboard\', this)">' + icon('pieChart') + ' لوحة التحكم</button>' +
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
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showExternalDriverModal()">' + icon('plus') + ' إضافة مورد نقل</button>' : '';

    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('users') + ' شركات النقل والسائقين الخارجيين</h3></div>' + addBtnHtml + '</div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="ext-drivers-table">' +
      '<thead><tr><th>السائق / الشركة</th><th>بيانات التواصل</th><th>رقم السيارة</th><th>النوع</th><th>الحمولة</th><th>سعر النقل</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_external_drivers').select('*').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#ext-drivers-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' + icon('users') + ' لا توجد بيانات</td></tr>';
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
            '<td><span class="badge badge-info">' + (d.status || 'متاح') + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showExternalDriverModal: function () {
    App.openModal('إضافة مورد نقل / سائق خارجي',
      '<form id="ext-drv-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      '<div class="form-group"><label class="form-label">اسم السائق</label><input type="text" id="ed_name" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">اسم الشركة</label><input type="text" id="ed_company" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">بيانات التواصل</label><input type="text" id="ed_contact" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">رقم السيارة</label><input type="text" id="ed_car" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">نوع السيارة</label><input type="text" id="ed_type" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">الحمولة (طن)</label><input type="number" id="ed_cap" class="form-input" step="0.1"></div>' +
      '<div class="form-group"><label class="form-label">سعر النقل</label><input type="number" id="ed_rate" class="form-input" step="0.01"></div>' +
      '<div class="form-group"><label class="form-label">مناطق العمل</label><input type="text" id="ed_areas" class="form-input"></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">حفظ البيانات</button></div></form>',
      '');
    document.getElementById('ext-drv-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sbClient.from('fleet_external_drivers').insert({
        driver_name: document.getElementById('ed_name').value,
        company_name: document.getElementById('ed_company').value,
        contact_info: document.getElementById('ed_contact').value,
        car_number: document.getElementById('ed_car').value,
        car_type: document.getElementById('ed_type').value,
        capacity: parseFloat(document.getElementById('ed_cap').value) || 0,
        transport_rate: parseFloat(document.getElementById('ed_rate').value) || 0,
        operating_areas: document.getElementById('ed_areas').value,
        status: 'متاح'
      }).then(function (r) {
        if (r.error) alert('Error: ' + r.error.message);
        else { App.closeModal(); FleetModule.renderExternalDrivers(); }
      });
    });
  },

  // =====================================
  // Vehicles
  // =====================================
  renderVehicles: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showVehicleModal()">' + icon('plus') + ' إضافة سيارة</button>' : '';

    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('truck') + ' أسطول السيارات</h3></div>' + addBtnHtml + '</div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="vehicles-table">' +
      '<thead><tr><th>رقم السيارة</th><th>اللوحة</th><th>النوع والموديل</th><th>السائق الحالي</th><th>عداد الكيلومترات</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_vehicles').select('*, fleet_internal_drivers(driver_name)').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#vehicles-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">' + icon('truck') + ' لا توجد بيانات</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          html += '<tr>' +
            '<td>' + (d.car_number || '-') + '</td>' +
            '<td>' + (d.plate_number || '-') + '</td>' +
            '<td>' + (d.car_type || '') + ' ' + (d.model || '') + ' ' + (d.year || '') + '</td>' +
            '<td>' + (d.fleet_internal_drivers ? d.fleet_internal_drivers.driver_name : 'غير محدد') + '</td>' +
            '<td>' + (d.odometer || 0) + ' كم</td>' +
            '<td><span class="badge badge-' + (d.status === 'متاحة' ? 'success' : d.status === 'في الصيانة' ? 'warning' : 'danger') + '">' + (d.status || '-') + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showVehicleModal: function () {
    App.openModal('إضافة سيارة جديدة',
      '<form id="veh-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      '<div class="form-group"><label class="form-label">رقم السيارة</label><input type="text" id="v_num" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">رقم اللوحة</label><input type="text" id="v_plate" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">النوع</label><input type="text" id="v_type" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">الموديل</label><input type="text" id="v_model" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">سنة الصنع</label><input type="number" id="v_year" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">القسم</label><input type="text" id="v_dept" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">عداد الكيلومترات</label><input type="number" id="v_odo" class="form-input" step="0.01"></div>' +
      '<div class="form-group"><label class="form-label">رقم التأمين</label><input type="text" id="v_ins" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">تاريخ انتهاء التأمين</label><input type="date" id="v_ins_exp" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">تاريخ انتهاء الرخصة</label><input type="date" id="v_lic_exp" class="form-input"></div>' +
      '<div class="form-group" style="grid-column:span 2;"><label class="form-label">ملاحظات</label><textarea id="v_notes" class="form-input" rows="2"></textarea></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">حفظ السيارة</button></div></form>',
      '');
    document.getElementById('veh-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sbClient.from('fleet_vehicles').insert({
        car_number: document.getElementById('v_num').value,
        plate_number: document.getElementById('v_plate').value,
        car_type: document.getElementById('v_type').value,
        model: document.getElementById('v_model').value,
        year: parseInt(document.getElementById('v_year').value) || null,
        department: document.getElementById('v_dept').value,
        odometer: parseFloat(document.getElementById('v_odo').value) || 0,
        insurance_number: document.getElementById('v_ins').value,
        insurance_expiry: document.getElementById('v_ins_exp').value || null,
        license_expiry: document.getElementById('v_lic_exp').value || null,
        notes: document.getElementById('v_notes').value,
        status: 'متاحة'
      }).then(function (r) {
        if (r.error) alert('Error: ' + r.error.message);
        else { App.closeModal(); FleetModule.renderVehicles(); }
      });
    });
  },

  // =====================================
  // Trips
  // =====================================
  renderTrips: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'hr manager'));
    var addBtnHtml = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showTripModal()">' + icon('plus') + ' إنشاء رحلة جديدة</button>' : '';

    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('map') + ' سجل الرحلات (Logistics & Trips)</h3></div>' + addBtnHtml + '</div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="trips-table">' +
      '<thead><tr><th>رقم الرحلة</th><th>العميل</th><th>السائق</th><th>السيارة</th><th>الخروج</th><th>الوصول</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_trips').select('*, fleet_internal_drivers(driver_name), fleet_external_drivers(driver_name), fleet_vehicles(plate_number)').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#trips-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' + icon('map') + ' لا توجد رحلات مسجلة</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          var driver = d.driver_type === 'internal' && d.fleet_internal_drivers ? d.fleet_internal_drivers.driver_name : 
                       (d.fleet_external_drivers ? d.fleet_external_drivers.driver_name : '-');
          var vehicle = d.fleet_vehicles ? d.fleet_vehicles.plate_number : '-';
          var stColor = d.status === 'تم التوصيل' ? 'success' : d.status === 'في الطريق' ? 'info' : d.status === 'ملغاة' ? 'danger' : 'warning';
          
          html += '<tr>' +
            '<td style="font-weight:700;">' + (d.trip_number || '-') + '</td>' +
            '<td>' + (d.client_name || '-') + '</td>' +
            '<td>' + driver + '</td>' +
            '<td>' + vehicle + '</td>' +
            '<td>' + (d.departure_time ? new Date(d.departure_time).toLocaleString() : '-') + '</td>' +
            '<td>' + (d.arrival_time ? new Date(d.arrival_time).toLocaleString() : '-') + '</td>' +
            '<td><span class="badge badge-' + stColor + '">' + (d.status || '-') + '</span></td>' +
            '</tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showTripModal: function () {
    App.openModal('إنشاء رحلة جديدة',
      '<form id="trip-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      '<div class="form-group"><label class="form-label">رقم الرحلة</label><input type="text" id="t_num" class="form-input" required placeholder="TRIP-001"></div>' +
      '<div class="form-group"><label class="form-label">اسم العميل</label><input type="text" id="t_client" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">نوع السائق</label><select id="t_drv_type" class="form-input"><option value="internal">داخلي</option><option value="external">خارجي</option></select></div>' +
      '<div class="form-group"><label class="form-label">تاريخ ووقت الخروج</label><input type="datetime-local" id="t_dep" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">المسافة (كم)</label><input type="number" id="t_dist" class="form-input" step="0.1"></div>' +
      '<div class="form-group"><label class="form-label">تكلفة النقل</label><input type="number" id="t_cost" class="form-input" step="0.01"></div>' +
      '<div class="form-group" style="grid-column:span 2;"><label class="form-label">ملاحظات</label><textarea id="t_notes" class="form-input" rows="2"></textarea></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">إنشاء الرحلة</button></div></form>',
      '');
    document.getElementById('trip-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sbClient.from('fleet_trips').insert({
        trip_number: document.getElementById('t_num').value,
        client_name: document.getElementById('t_client').value,
        driver_type: document.getElementById('t_drv_type').value,
        departure_time: document.getElementById('t_dep').value || null,
        distance: parseFloat(document.getElementById('t_dist').value) || 0,
        transport_cost: parseFloat(document.getElementById('t_cost').value) || 0,
        notes: document.getElementById('t_notes').value,
        status: 'مجدولة'
      }).then(function (r) {
        if (r.error) alert('Error: ' + r.error.message);
        else { App.closeModal(); FleetModule.renderTrips(); }
      });
    });
  },

  // =====================================
  // Maintenance, Incidents, Reports placeholders
  // =====================================
  renderMaintenance: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager'));
    var addBtn = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showMaintenanceModal()">' + icon('plus') + ' تسجيل صيانة</button>' : '';

    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('tool') + ' سجل الصيانة والوقود</h3><p style="color:var(--text-tertiary);font-size:0.85rem;margin-top:4px;">تتبع جميع عمليات الصيانة والتزويد بالوقود</p></div>' + addBtn + '</div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="maint-table">' +
      '<thead><tr><th>التاريخ</th><th>السيارة</th><th>النوع</th><th>الوصف</th><th>التكلفة</th><th>الكيلومترات</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_maintenance').select('*').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#maint-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' + icon('tool') + ' لا توجد سجلات صيانة حالياً</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          var typeColor = d.type === 'وقود' ? 'warning' : d.type === 'صيانة دورية' ? 'info' : 'danger';
          html += '<tr><td>' + (d.date || '-') + '</td><td>' + (d.vehicle_plate || '-') + '</td>' +
            '<td><span class="badge badge-' + typeColor + '">' + (d.type || '-') + '</span></td>' +
            '<td>' + (d.description || '-') + '</td><td style="font-weight:700;">' + (d.cost ? d.cost.toLocaleString() + ' جنيه' : '-') + '</td>' +
            '<td>' + (d.odometer || '-') + '</td><td><span class="badge badge-' + (d.status === 'مكتمل' ? 'success' : 'warning') + '">' + (d.status || '-') + '</span></td></tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showMaintenanceModal: function () {
    App.openModal('تسجيل صيانة / وقود',
      '<form id="maint-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      '<div class="form-group"><label class="form-label">السيارة (رقم اللوحة)</label><input type="text" id="m_plate" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">النوع</label><select id="m_type" class="form-input"><option value="صيانة دورية">صيانة دورية</option><option value="إصلاح">إصلاح</option><option value="وقود">وقود</option><option value="إطارات">إطارات</option><option value="أخرى">أخرى</option></select></div>' +
      '<div class="form-group"><label class="form-label">التاريخ</label><input type="date" id="m_date" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">التكلفة</label><input type="number" id="m_cost" class="form-input" step="0.01"></div>' +
      '<div class="form-group"><label class="form-label">عداد الكيلومترات</label><input type="number" id="m_odo" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">الحالة</label><select id="m_status" class="form-input"><option value="مكتمل">مكتمل</option><option value="قيد التنفيذ">قيد التنفيذ</option></select></div>' +
      '<div class="form-group" style="grid-column:span 2;"><label class="form-label">الوصف</label><textarea id="m_desc" class="form-input" rows="2"></textarea></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">حفظ</button></div></form>',
      '');
    document.getElementById('maint-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sbClient.from('fleet_maintenance').insert({
        vehicle_plate: document.getElementById('m_plate').value,
        type: document.getElementById('m_type').value,
        date: document.getElementById('m_date').value,
        cost: parseFloat(document.getElementById('m_cost').value) || 0,
        odometer: parseInt(document.getElementById('m_odo').value) || 0,
        status: document.getElementById('m_status').value,
        description: document.getElementById('m_desc').value
      }).then(function (r) {
        if (r.error) alert('Error: ' + r.error.message);
        else { App.closeModal(); FleetModule.renderMaintenance(); }
      });
    });
  },

  renderIncidents: function () {
    var c = document.getElementById('fleet-content');
    var canManage = App.isOwner() || (App.user && (App.user.department === 'Logistics' || App.user.role === 'logistics manager'));
    var addBtn = canManage ? '<button class="btn btn-primary" onclick="FleetModule.showIncidentModal()">' + icon('plus') + ' تسجيل حادث/مخالفة</button>' : '';

    c.innerHTML = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><div><h3>' + icon('alertTriangle') + ' الحوادث والمخالفات</h3><p style="color:var(--text-tertiary);font-size:0.85rem;margin-top:4px;">تسجيل ومتابعة حوادث ومخالفات السائقين</p></div>' + addBtn + '</div>' +
      '<div class="card-body no-pad"><div class="table-responsive"><table class="table" id="incidents-table">' +
      '<thead><tr><th>التاريخ</th><th>السائق</th><th>السيارة</th><th>النوع</th><th>الوصف</th><th>الغرامة</th><th>الحالة</th></tr></thead>' +
      '<tbody><tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">جاري التحميل...</td></tr></tbody>' +
      '</table></div></div></div>';

    if (typeof sbClient !== 'undefined') {
      sbClient.from('fleet_incidents').select('*').order('created_at', { ascending: false }).then(function (res) {
        var tbody = document.querySelector('#incidents-table tbody');
        if (res.error || !res.data || res.data.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">' + icon('alertTriangle') + ' لا توجد حوادث أو مخالفات مسجلة</td></tr>';
          return;
        }
        var html = '';
        res.data.forEach(function (d) {
          var tColor = d.type === 'حادث' ? 'danger' : 'warning';
          html += '<tr><td>' + (d.date || '-') + '</td><td>' + (d.driver_name || '-') + '</td><td>' + (d.vehicle_plate || '-') + '</td>' +
            '<td><span class="badge badge-' + tColor + '">' + (d.type || '-') + '</span></td>' +
            '<td>' + (d.description || '-') + '</td><td style="font-weight:700;">' + (d.fine_amount ? d.fine_amount.toLocaleString() + ' جنيه' : '-') + '</td>' +
            '<td><span class="badge badge-' + (d.status === 'تم الحل' ? 'success' : 'danger') + '">' + (d.status || 'معلق') + '</span></td></tr>';
        });
        tbody.innerHTML = html;
      });
    }
  },

  showIncidentModal: function () {
    App.openModal('تسجيل حادث / مخالفة',
      '<form id="inc-form" style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">' +
      '<div class="form-group"><label class="form-label">اسم السائق</label><input type="text" id="i_driver" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">رقم السيارة</label><input type="text" id="i_plate" class="form-input"></div>' +
      '<div class="form-group"><label class="form-label">النوع</label><select id="i_type" class="form-input"><option value="مخالفة">مخالفة مرورية</option><option value="حادث">حادث</option><option value="تلف">تلف بالسيارة</option></select></div>' +
      '<div class="form-group"><label class="form-label">التاريخ</label><input type="date" id="i_date" class="form-input" required></div>' +
      '<div class="form-group"><label class="form-label">قيمة الغرامة</label><input type="number" id="i_fine" class="form-input" step="0.01"></div>' +
      '<div class="form-group"><label class="form-label">الحالة</label><select id="i_status" class="form-input"><option value="معلق">معلق</option><option value="تم الخصم">تم الخصم</option><option value="تم الحل">تم الحل</option></select></div>' +
      '<div class="form-group" style="grid-column:span 2;"><label class="form-label">الوصف</label><textarea id="i_desc" class="form-input" rows="2"></textarea></div>' +
      '<div style="grid-column:span 2;text-align:left;"><button type="submit" class="btn btn-primary">حفظ</button></div></form>',
      '');
    document.getElementById('inc-form').addEventListener('submit', function (e) {
      e.preventDefault();
      sbClient.from('fleet_incidents').insert({
        driver_name: document.getElementById('i_driver').value,
        vehicle_plate: document.getElementById('i_plate').value,
        type: document.getElementById('i_type').value,
        date: document.getElementById('i_date').value,
        fine_amount: parseFloat(document.getElementById('i_fine').value) || 0,
        status: document.getElementById('i_status').value,
        description: document.getElementById('i_desc').value
      }).then(function (r) {
        if (r.error) alert('Error: ' + r.error.message);
        else { App.closeModal(); FleetModule.renderIncidents(); }
      });
    });
  },

  renderReports: function () {
    var c = document.getElementById('fleet-content');
    c.innerHTML = '<div class="kpi-grid" style="margin-bottom:20px;">' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(37,99,235,0.15);color:#3b82f6;">' + icon('truck') + '</div><div class="kpi-info"><h3>إجمالي الرحلات</h3><p id="r_trips">--</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(245,158,11,0.15);color:#f59e0b;">' + icon('dollarSign') + '</div><div class="kpi-info"><h3>تكاليف الصيانة</h3><p id="r_maint">--</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(239,68,68,0.15);color:#ef4444;">' + icon('alertTriangle') + '</div><div class="kpi-info"><h3>الحوادث والمخالفات</h3><p id="r_inc">--</p></div></div>' +
      '<div class="kpi-card"><div class="kpi-icon" style="background:rgba(16,185,129,0.15);color:#10b981;">' + icon('user') + '</div><div class="kpi-info"><h3>السائقين النشطين</h3><p id="r_drv">--</p></div></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
      '<div class="card"><div class="card-header"><h3>توزيع تكاليف الصيانة</h3></div><div class="card-body"><canvas id="maintChart" height="250"></canvas></div></div>' +
      '<div class="card"><div class="card-header"><h3>حالات الرحلات</h3></div><div class="card-body"><canvas id="tripsReportChart" height="250"></canvas></div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:20px;"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;"><h3>طباعة وتصدير</h3>' +
      '<button class="btn btn-outline" onclick="window.print()">' + icon('download') + ' طباعة التقرير</button></div></div>';

    if (typeof sbClient !== 'undefined') {
      Promise.all([
        sbClient.from('fleet_trips').select('id,status'),
        sbClient.from('fleet_maintenance').select('id,cost,type'),
        sbClient.from('fleet_incidents').select('id'),
        sbClient.from('fleet_internal_drivers').select('id').eq('status', 'متاح')
      ]).then(function (r) {
        var trips = r[0].data || [], maint = r[1].data || [], inc = r[2].data || [], drv = r[3].data || [];
        var el1 = document.getElementById('r_trips'); if (el1) el1.textContent = trips.length;
        var totalCost = maint.reduce(function (s, m) { return s + (m.cost || 0); }, 0);
        var el2 = document.getElementById('r_maint'); if (el2) el2.textContent = totalCost.toLocaleString() + ' جنيه';
        var el3 = document.getElementById('r_inc'); if (el3) el3.textContent = inc.length;
        var el4 = document.getElementById('r_drv'); if (el4) el4.textContent = drv.length;
      });
    }

    setTimeout(function () {
      if (window.Chart) {
        var ctx1 = document.getElementById('maintChart');
        if (ctx1) new Chart(ctx1, { type: 'doughnut', data: { labels: ['وقود', 'صيانة دورية', 'إصلاح', 'إطارات'], datasets: [{ data: [40, 25, 20, 15], backgroundColor: ['#f59e0b', '#3b82f6', '#ef4444', '#10b981'] }] }, options: { plugins: { legend: { labels: { color: '#94A3B8' } } } } });
        var ctx2 = document.getElementById('tripsReportChart');
        if (ctx2) new Chart(ctx2, { type: 'bar', data: { labels: ['مكتملة', 'في الطريق', 'مجدولة', 'ملغاة'], datasets: [{ label: 'الرحلات', data: [12, 5, 3, 1], backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'] }] }, options: { plugins: { legend: { labels: { color: '#94A3B8' } } }, scales: { x: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#64748B' }, grid: { color: 'rgba(255,255,255,0.05)' } } } } });
      }
    }, 500);
  }
};

window.FleetModule = FleetModule;
if (typeof Pages !== 'undefined') {
  Pages['erp-fleet'] = function(el) {
    FleetModule.render(el);
  };
}
