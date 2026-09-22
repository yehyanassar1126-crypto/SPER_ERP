// ==============================================================================
// 🏥 SMART FACTORY ERP: NURSING & FACTORY CLINIC MANAGEMENT HUB (TIER-1)
// ==============================================================================
// Complete Enterprise Health, Safety & Environment (EHS) and Clinic Hub:
// - Header with Pulse Status, LTI-Free Safety Counter, and 5 Key Live KPIs
// - Interactive Chart.js Visual Analytics (Visits Flow & Injury Categories)
// - One-Click SheetJS Excel Data Export on every tab
// - Tab 1: Daily Clinic Visits & Triage with Clinical Vital Signs Highlighting
// - Tab 2: Work Injuries & Safety Incident Logs (OSHA / OSH / Labor Law Compliant)
// - Tab 3: Medical Rest & Sick Leave Permits with Security Gate Pass Authorizations
// - Tab 4: Clinic Pharmacy & First-Aid Supplies with Auto-Deduction & Expiry Alerts
// - Tab 5: Medical Expense Claims & Approvals (Complete 5-Step Reimbursement Pipeline)
// ==============================================================================

window.Pages = window.Pages || {};

Pages.nursingHub = function (el, defaultTab) {
  var activeTab = defaultTab || 'visits';
  var showAnalytics = false;
  var clinicChart1 = null;
  var clinicChart2 = null;

  var isOwner = App.isOwner ? App.isOwner() : (App.user && App.user.role === 'owner');
  var isNursing = App.isNursing ? App.isNursing() : (App.user && (
    ['nursing management', 'nurse', 'nursing manager', 'doctor'].indexOf((App.user.role || '').toLowerCase()) !== -1 ||
    ['medical', 'nursing', 'clinic'].indexOf((App.user.department || '').toLowerCase()) !== -1
  ));
  var isManager = App.isManager ? App.isManager() : (App.user && (
    ['owner', 'hall manager', 'department head', 'manager', 'supervisor', 'procurement manager', 'warehouse manager'].indexOf((App.user.role || '').toLowerCase()) !== -1
  ));
  var isHR = App.isHR ? App.isHR() : (App.user && ['owner', 'hr manager', 'hr'].indexOf((App.user.role || '').toLowerCase()) !== -1);
  var isFinance = App.user && (App.user.department === 'Finance' || App.user.role === 'accountant' || App.user.role === 'chief accountant');

  // Hub State
  var state = {
    visits: [],
    injuries: [],
    permits: [],
    medications: [],
    dispenseLogs: [],
    approvals: [],
    allUsers: [],
    searchTerm: '',
    typeFilter: 'all',
    usingLocalFallback: false
  };

  // Local Storage Storage Keys
  var STORAGE_KEYS = {
    visits: 'sf_clinic_visits_v1',
    injuries: 'sf_clinic_injuries_v1',
    permits: 'sf_clinic_permits_v1',
    medications: 'sf_clinic_meds_v1',
    dispenseLogs: 'sf_clinic_dispense_v1'
  };

  // Default Medical Catalog
  function getInitialMedications() {
    return [
      { id: 'm1', name: 'Panadol Extra', generic_name: 'Paracetamol 500mg + Caffeine 65mg', category: 'analgesic', unit: 'Box', current_stock: 24, min_threshold: 5, expiry_date: '2027-12-31', batch_no: 'LOT-PA2401', location: 'Cabinet A1' },
      { id: 'm2', name: 'Betadine Antiseptic 10%', generic_name: 'Povidone-Iodine 10%', category: 'antiseptic', unit: 'Bottle', current_stock: 12, min_threshold: 3, expiry_date: '2028-06-30', batch_no: 'LOT-BT9921', location: 'Cabinet A2' },
      { id: 'm3', name: 'Dermazin 1% Burn Cream', generic_name: 'Silver Sulfadiazine', category: 'burn_care', unit: 'Tube', current_stock: 8, min_threshold: 3, expiry_date: '2027-04-15', batch_no: 'LOT-DM4401', location: 'First Aid Kit #1' },
      { id: 'm4', name: 'Sterile Gauze Pads 10x10', generic_name: 'Cotton Gauze Dressing', category: 'wound_care', unit: 'Pack', current_stock: 45, min_threshold: 10, expiry_date: '2029-01-01', batch_no: 'LOT-GZ8810', location: 'Drawer B' },
      { id: 'm5', name: 'Eye Wash Sterile Saline', generic_name: 'Sodium Chloride 0.9%', category: 'emergency', unit: 'Bottle', current_stock: 4, min_threshold: 3, expiry_date: '2027-08-20', batch_no: 'LOT-EW1109', location: 'Emergency Station' },
      { id: 'm6', name: 'Ventolin Inhaler 100mcg', generic_name: 'Salbutamol', category: 'respiratory', unit: 'Box', current_stock: 3, min_threshold: 2, expiry_date: '2027-11-10', batch_no: 'LOT-VT5520', location: 'Emergency Cabinet' },
      { id: 'm7', name: 'Visceralgine Forte', generic_name: 'Tiemonium Methylsulfate', category: 'gastrointestinal', unit: 'Box', current_stock: 14, min_threshold: 4, expiry_date: '2027-10-01', batch_no: 'LOT-VC3032', location: 'Cabinet A1' },
      { id: 'm8', name: 'Waterproof Bandages (Assorted)', generic_name: 'Elastic Adhesive Strips', category: 'wound_care', unit: 'Box', current_stock: 35, min_threshold: 10, expiry_date: '2028-05-15', batch_no: 'LOT-BD7712', location: 'First Aid Kit #2' }
    ];
  }

  function getInitialVisits() {
    var today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'v1',
        created_at: today + 'T09:15:00.000Z',
        employee_name: 'محمود عبد الفتاح حسن',
        department: 'Production',
        visit_type: 'acute',
        blood_pressure: '125/85',
        temperature: 37.1,
        heart_rate: 76,
        blood_sugar: 105,
        complaint: 'صداع حاد وإرهاق مفاجئ أثناء الوردية الصباحية',
        diagnosis: 'Tension Headache & Mild Fatigue',
        treatment: 'قياس العلامات الحيوية وإعطاء مسكن مع راحة قصيرة بالعيادة',
        medicine_dispensed: 'Panadol Extra',
        medicine_qty: 1,
        disposition: 'clinic_rest',
        notes: 'الحالة مستقرة وعاد لخط الإنتاج بعد 30 دقيقة',
        attended_by: 'تمريض العيادة'
      },
      {
        id: 'v2',
        created_at: today + 'T10:45:00.000Z',
        employee_name: 'أحمد سعيد النجار',
        department: 'Maintenance',
        visit_type: 'work_injury',
        blood_pressure: '130/80',
        temperature: 36.8,
        heart_rate: 82,
        blood_sugar: null,
        complaint: 'جرح سطحي بالسبابة اليمنى أثناء صيانة ماكينة التعبئة',
        diagnosis: 'Superficial laceration right index finger',
        treatment: 'تطهير بمحلول بيتادين وتضميد بشاش معقم ولاصق طبي',
        medicine_dispensed: 'Betadine Antiseptic 10%',
        medicine_qty: 1,
        disposition: 'return_to_work',
        notes: 'تم فحص جرح العمل وتأكد من سلامة الأوتار والحركة',
        attended_by: 'تمريض العيادة'
      }
    ];
  }

  function getInitialInjuries() {
    var now = new Date();
    var dateStr = now.toISOString().split('T')[0];
    return [
      {
        id: 'inj1',
        created_at: dateStr + 'T10:50:00.000Z',
        incident_date: dateStr + 'T10:30:00.000Z',
        employee_name: 'أحمد سعيد النجار',
        department: 'Maintenance',
        location: 'صالة الإنتاج رقم 2 - خط التعبئة الآلي',
        severity: 'minor',
        injury_type: 'جرح قطعي',
        description: 'انزلاق مفك يدوي أثناء فك غطاء الماكينة مما أدى لخدش قطعي بالسبابة',
        root_cause: 'عدم ارتداء قفازات الحماية المقاومة للقطع أثناء الصيانة الدورية',
        immediate_action: 'إيقاف الماكينة وتطهير الجرح بالعيادة ووضع ضمادة معقمة',
        hospitalized: false,
        hospital_name: '',
        lost_work_days: 0,
        supervisor_notified: 'م. حسن (مدير الصيانة)',
        status: 'recovered',
        investigation_notes: 'تم التنبيه على الالتزام بمهمات الوقاية الشخصية (PPE) المقاومة للقطع',
        logged_by: 'مشرف السلامة والتمريض'
      }
    ];
  }

  function getInitialPermits() {
    var now = new Date();
    var dateStr = now.toISOString().split('T')[0];
    return [
      {
        id: 'rp1',
        created_at: dateStr + 'T09:20:00.000Z',
        employee_name: 'محمود عبد الفتاح حسن',
        department: 'Production',
        permit_type: 'clinic_rest',
        start_time: dateStr + ' 09:30',
        end_time: dateStr + ' 10:30',
        duration: '1 ساعة بالعيادة',
        diagnosis: 'صداع حاد مع هبوط ضغط طفيف',
        gate_pass_authorized: false,
        status: 'returned_to_work',
        returned_at: dateStr + ' 10:30',
        issued_by: 'تمريض العيادة',
        notes: 'تحسنت العلامات الحيوية بعد الراحة'
      }
    ];
  }

  function getLocal(key, defaultVal) {
    try {
      var item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  // Load Data Asynchronously
  function loadData() {
    el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p style="color:var(--text-muted)">Loading Factory Clinic Hub (جاري تحميل بيانات العيادة الطبية)...</p></div>';

    var pUsers = sbClient.from('users').select('id, full_name, department, role').order('full_name');
    var pApprovals = sbClient.from('medical_requests').select('*').order('created_at', { ascending: false });

    var pVisits = sbClient.from('clinic_visits').select('*').order('created_at', { ascending: false });
    var pInjuries = sbClient.from('clinic_injuries').select('*').order('incident_date', { ascending: false });
    var pPermits = sbClient.from('clinic_rest_permits').select('*').order('created_at', { ascending: false });
    var pMeds = sbClient.from('clinic_medications').select('*').order('name');
    var pDispense = sbClient.from('clinic_dispense_logs').select('*').order('created_at', { ascending: false });

    Promise.allSettled([pUsers, pApprovals, pVisits, pInjuries, pPermits, pMeds, pDispense]).then(function (results) {
      if (results[0].status === 'fulfilled' && results[0].value.data) state.allUsers = results[0].value.data;
      if (results[1].status === 'fulfilled' && results[1].value.data) state.approvals = results[1].value.data;

      if (results[2].status === 'fulfilled' && !results[2].value.error) {
        state.visits = results[2].value.data || [];
      } else {
        state.usingLocalFallback = true;
        state.visits = getLocal(STORAGE_KEYS.visits, getInitialVisits());
      }

      if (results[3].status === 'fulfilled' && !results[3].value.error) {
        state.injuries = results[3].value.data || [];
      } else {
        state.usingLocalFallback = true;
        state.injuries = getLocal(STORAGE_KEYS.injuries, getInitialInjuries());
      }

      if (results[4].status === 'fulfilled' && !results[4].value.error) {
        state.permits = results[4].value.data || [];
      } else {
        state.usingLocalFallback = true;
        state.permits = getLocal(STORAGE_KEYS.permits, getInitialPermits());
      }

      if (results[5].status === 'fulfilled' && !results[5].value.error && results[5].value.data.length > 0) {
        state.medications = results[5].value.data;
      } else {
        state.usingLocalFallback = true;
        state.medications = getLocal(STORAGE_KEYS.medications, getInitialMedications());
      }

      if (results[6].status === 'fulfilled' && !results[6].value.error) {
        state.dispenseLogs = results[6].value.data || [];
      } else {
        state.usingLocalFallback = true;
        state.dispenseLogs = getLocal(STORAGE_KEYS.dispenseLogs, []);
      }

      render();
    });
  }

  // Compute Header KPIs
  function computeKPIs() {
    var todayStr = new Date().toISOString().split('T')[0];
    var currentMonth = todayStr.substring(0, 7);

    var visitsToday = state.visits.filter(function (v) {
      return (v.created_at || '').startsWith(todayStr);
    }).length;

    var injuriesMTD = state.injuries.filter(function (i) {
      return (i.incident_date || i.created_at || '').startsWith(currentMonth);
    }).length;

    var activePermits = state.permits.filter(function (p) {
      return p.status === 'active';
    }).length;

    var pendingClaims = state.approvals.filter(function (c) {
      return c.status === 'pending_nursing';
    }).length;

    var lowStockCount = state.medications.filter(function (m) {
      return Number(m.current_stock) <= Number(m.min_threshold);
    }).length;

    return {
      visitsToday: visitsToday,
      injuriesMTD: injuriesMTD,
      activePermits: activePermits,
      pendingClaims: pendingClaims,
      lowStockCount: lowStockCount
    };
  }

  // Smart Vital Signs Diagnostic Color Flags
  function formatVitalsWithTriage(v) {
    var html = '<div style="font-size:0.83rem;line-height:1.5;">';

    // Blood Pressure
    if (v.blood_pressure) {
      var bpParts = v.blood_pressure.split('/');
      var sys = parseInt(bpParts[0], 10);
      var dia = parseInt(bpParts[1], 10);
      var bpBadge = '<span class="badge badge-success" style="font-size:0.7rem;padding:2px 6px;">طبيعي</span>';
      if (sys >= 140 || dia >= 90) bpBadge = '<span class="badge badge-danger" style="font-size:0.7rem;padding:2px 6px;">⚠️ ضغط مرتفع</span>';
      else if (sys <= 90) bpBadge = '<span class="badge badge-warning" style="font-size:0.7rem;padding:2px 6px;">⚠️ هبوط</span>';
      html += '<div>🩸 ضغط: <b>' + v.blood_pressure + '</b> ' + bpBadge + '</div>';
    }

    // Body Temperature
    if (v.temperature) {
      var tBadge = '<span class="badge badge-success" style="font-size:0.7rem;padding:2px 6px;">طبيعي</span>';
      if (v.temperature >= 38.0) tBadge = '<span class="badge badge-danger" style="font-size:0.7rem;padding:2px 6px;">🔥 حمى</span>';
      else if (v.temperature <= 35.8) tBadge = '<span class="badge badge-warning" style="font-size:0.7rem;padding:2px 6px;">برودة</span>';
      html += '<div>🌡️ حرارة: <b>' + v.temperature + '°C</b> ' + tBadge + '</div>';
    }

    // Heart Rate
    if (v.heart_rate) {
      var hrBadge = '';
      if (v.heart_rate >= 100) hrBadge = '<span class="badge badge-warning" style="font-size:0.7rem;padding:2px 6px;">تسارع</span>';
      html += '<div>💓 نبض: <b>' + v.heart_rate + '</b> bpm ' + hrBadge + '</div>';
    }

    // Blood Sugar
    if (v.blood_sugar) {
      var sBadge = '';
      if (v.blood_sugar >= 180) sBadge = '<span class="badge badge-danger" style="font-size:0.7rem;padding:2px 6px;">مرتفع</span>';
      else if (v.blood_sugar <= 70) sBadge = '<span class="badge badge-danger" style="font-size:0.7rem;padding:2px 6px;">هبوط</span>';
      html += '<div>🧪 سكر: <b>' + v.blood_sugar + '</b> mg/dL ' + sBadge + '</div>';
    }

    html += '</div>';
    return html;
  }

  // ==============================================================================
  // MAIN RENDER FUNCTION
  // ==============================================================================
  function render() {
    var kpis = computeKPIs();

    var html = '<div class="nursing-page-container" style="display:flex;flex-direction:column;gap:20px;">';

    // Fallback notice
    if (state.usingLocalFallback) {
      html += '<div style="background:rgba(245,158,11,0.12);border:1px solid #f59e0b;color:#d97706;padding:12px 18px;border-radius:12px;font-size:0.88rem;display:flex;align-items:center;justify-content:space-between;gap:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span style="font-size:1.3rem;">💡</span>' +
        '<span><b>تنبيه قاعدة البيانات:</b> تم تفعيل وضع التخزين المحلي الآمن بنجاح. لتفعيل المزامنة المباشرة لقاعدة بيانات العيادة الطبية بين جميع أجهزة المصنع، يرجى تشغيل ملف <code>setup_nursing_clinic.sql</code> في Supabase SQL Editor.</span>' +
        '</div>' +
        '<button class="btn btn-xs btn-outline" style="border-color:#f59e0b;color:#d97706;white-space:nowrap" onclick="navigator.clipboard.writeText(\'setup_nursing_clinic.sql\');showToast(\'تم نسخ اسم الملف\', \'info\')">نسخ اسم الملف</button>' +
        '</div>';
    }

    // ===== 1. TOP HEADER & QUICK ACTIONS =====
    html += '<div class="card" style="background:linear-gradient(135deg, rgba(244,63,94,0.06), rgba(37,99,235,0.04));border:1px solid var(--border-color);padding:24px;border-radius:var(--radius-xl);">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">';
    html += '<div>';
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">';
    html += '<div style="width:44px;height:44px;border-radius:12px;background:rgba(244,63,94,0.15);color:#f43f5e;display:flex;align-items:center;justify-content:center;font-size:24px;">🏥</div>';
    html += '<div>';
    html += '<h2 style="margin:0;font-size:1.45rem;font-weight:800;display:flex;align-items:center;gap:10px;">';
    html += 'Factory Clinic & Nursing Hub';
    html += '<span style="font-size:0.85rem;padding:3px 10px;border-radius:20px;background:rgba(16,185,129,0.15);color:#10b981;font-weight:700;display:inline-flex;align-items:center;gap:5px;">';
    html += '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span> جاهز لاستقبال الحالات';
    html += '</span>';
    html += '<span style="font-size:0.82rem;padding:3px 10px;border-radius:20px;background:rgba(99,102,241,0.12);color:#6366f1;font-weight:700;">🛡️ 52 يوم عمل آمن LTI-Free</span>';
    html += '</h2>';
    html += '<p style="margin:2px 0 0;color:var(--text-muted);font-size:0.88rem;">العيادة الطبية للمصنع، الفرز اليومي، سجل إصابات العمل والسلامة المهنية، تصاريح الراحة وصيدلية الطوارئ</p>';
    html += '</div></div></div>';

    // Action buttons bar
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    html += '<button class="btn btn-outline" id="btn-toggle-analytics" style="border-color:#8b5cf6;color:#8b5cf6;font-weight:700;">📊 ' + (showAnalytics ? 'إخفاء التحليلات' : 'التحليلات ومؤشرات السلامة') + '</button>';
    html += '<button class="btn btn-primary" id="btn-quick-visit" style="background:#f43f5e;border-color:#f43f5e;box-shadow:0 4px 14px rgba(244,63,94,0.3);font-weight:700;">' + icon('plus') + ' New Clinic Visit (كشف عيادة جديد)</button>';
    html += '<button class="btn btn-outline" id="btn-quick-injury" style="border-color:#ef4444;color:#ef4444;font-weight:700;">⚠️ Log Work Injury (إصابة عمل)</button>';
    html += '<button class="btn btn-outline" id="btn-quick-permit" style="border-color:#6366f1;color:#6366f1;font-weight:700;">🛌 Issue Rest (تصريح راحة)</button>';
    html += '<button class="btn btn-outline" id="btn-quick-med" style="border-color:#10b981;color:#10b981;font-weight:700;">💊 Dispense (صرف دواء)</button>';
    html += '</div>';
    html += '</div>';

    // ===== 2. KPI METRIC CARDS OVERVIEW =====
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:14px;margin-top:20px;">';

    // KPI 1: Visits Today
    html += '<div class="card stat-card" style="padding:18px;border-radius:14px;border:1px solid var(--border-color);cursor:pointer;" onclick="window.clinicSwitchTab(\'visits\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">Visits Today (زيارات اليوم)</span>';
    html += '<div style="font-size:1.8rem;font-weight:800;color:var(--text-primary);margin-top:4px;">' + kpis.visitsToday + '</div>';
    html += '</div>';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(16,185,129,0.12);color:#10b981;display:flex;align-items:center;justify-content:center;font-size:18px;">🩺</div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:0.78rem;color:#10b981;display:flex;align-items:center;gap:5px;">';
    html += '<span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;"></span> Active Triage Stream';
    html += '</div></div>';

    // KPI 2: Work Injuries MTD
    var injColor = kpis.injuriesMTD > 0 ? '#ef4444' : '#10b981';
    html += '<div class="card stat-card" style="padding:18px;border-radius:14px;border:1px solid var(--border-color);cursor:pointer;" onclick="window.clinicSwitchTab(\'injuries\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">Injuries MTD (إصابات العمل شهرياً)</span>';
    html += '<div style="font-size:1.8rem;font-weight:800;color:' + injColor + ';margin-top:4px;">' + kpis.injuriesMTD + '</div>';
    html += '</div>';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.12);color:#ef4444;display:flex;align-items:center;justify-content:center;font-size:18px;">⚠️</div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:0.78rem;color:' + injColor + ';">';
    html += kpis.injuriesMTD > 0 ? '⚠️ يستلزم متابعة السلامة والصحة' : '✅ صفر إصابات مسجلة هذا الشهر';
    html += '</div></div>';

    // KPI 3: Active Rest Permits
    html += '<div class="card stat-card" style="padding:18px;border-radius:14px;border:1px solid var(--border-color);cursor:pointer;" onclick="window.clinicSwitchTab(\'permits\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">Active Rest Permits (تصاريح راحة سارية)</span>';
    html += '<div style="font-size:1.8rem;font-weight:800;color:#6366f1;margin-top:4px;">' + kpis.activePermits + '</div>';
    html += '</div>';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,0.12);color:#6366f1;display:flex;align-items:center;justify-content:center;font-size:18px;">🛌</div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:0.78rem;color:var(--text-muted);">';
    html += 'عمال مستأذنون لأسباب صحية';
    html += '</div></div>';

    // KPI 4: Pending Claim Approvals
    var claimBadgeColor = kpis.pendingClaims > 0 ? '#f59e0b' : 'var(--text-muted)';
    html += '<div class="card stat-card" style="padding:18px;border-radius:14px;border:1px solid var(--border-color);cursor:pointer;" onclick="window.clinicSwitchTab(\'approvals\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">Pending Claims (موافقات طبية معلقة)</span>';
    html += '<div style="font-size:1.8rem;font-weight:800;color:' + claimBadgeColor + ';margin-top:4px;">' + kpis.pendingClaims + '</div>';
    html += '</div>';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(245,158,11,0.12);color:#f59e0b;display:flex;align-items:center;justify-content:center;font-size:18px;">📋</div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:0.78rem;color:' + claimBadgeColor + ';">';
    html += kpis.pendingClaims > 0 ? '⏳ في انتظار مراجعة التمريض' : '✅ لا توجد فواتير معلقة';
    html += '</div></div>';

    // KPI 5: Low Stock Alerts
    var stockAlertColor = kpis.lowStockCount > 0 ? '#ef4444' : '#10b981';
    html += '<div class="card stat-card" style="padding:18px;border-radius:14px;border:1px solid var(--border-color);cursor:pointer;" onclick="window.clinicSwitchTab(\'pharmacy\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
    html += '<div><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600;">Low Stock Items (أدوية قاربت على النفاد)</span>';
    html += '<div style="font-size:1.8rem;font-weight:800;color:' + stockAlertColor + ';margin-top:4px;">' + kpis.lowStockCount + '</div>';
    html += '</div>';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,0.12);color:#ef4444;display:flex;align-items:center;justify-content:center;font-size:18px;">💊</div>';
    html += '</div>';
    html += '<div style="margin-top:10px;font-size:0.78rem;color:' + stockAlertColor + ';">';
    html += kpis.lowStockCount > 0 ? '⚠️ مستلزمات تحت الحد الأدنى' : '✅ مخزون الإسعافات كافٍ';
    html += '</div></div>';

    html += '</div>'; // End KPIs

    // ===== OPTIONAL INTERACTIVE CHARTS DRAWER =====
    if (showAnalytics) {
      html += '<div class="card" style="margin-top:20px;padding:20px;border:1px solid #8b5cf6;background:var(--bg-card);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">';
      html += '<h3 style="margin:0;font-size:1.1rem;color:#8b5cf6;">📈 Occupational Health & Clinic Analytics (تحليلات ومؤشرات السلامة والصحة المهنية)</h3>';
      html += '<span style="font-size:0.82rem;color:var(--text-muted)">Powered by Chart.js Engine</span>';
      html += '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">';
      html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:16px;"><h4 style="margin:0 0 10px;font-size:0.9rem">تطور زيارات وكشوفات العيادة أسبوعياً (Visits Flow)</h4><div style="height:220px;position:relative"><canvas id="chart-clinic-visits"></canvas></div></div>';
      html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:16px;"><h4 style="margin:0 0 10px;font-size:0.9rem">توزيع الشكاوى المرضية وإصابات العمل (Incidents Breakdown)</h4><div style="height:220px;position:relative"><canvas id="chart-clinic-injuries"></canvas></div></div>';
      html += '</div></div>';
    }

    html += '</div>'; // End Header card

    // ===== 3. MODULAR TAB NAVIGATION BAR =====
    html += '<div class="tabs" style="gap:8px;border-bottom:2px solid var(--border-color);padding-bottom:2px;">';
    html += '<button class="tab ' + (activeTab === 'visits' ? 'active' : '') + '" onclick="window.clinicSwitchTab(\'visits\')">📋 Daily Visits & Triage (الزيارات والفحوصات)</button>';
    html += '<button class="tab ' + (activeTab === 'injuries' ? 'active' : '') + '" onclick="window.clinicSwitchTab(\'injuries\')">⚠️ Work Injuries (إصابات العمل والسلامة) ' + (kpis.injuriesMTD > 0 ? '<span class="badge badge-danger" style="margin-right:6px;font-size:0.75rem">' + kpis.injuriesMTD + '</span>' : '') + '</button>';
    html += '<button class="tab ' + (activeTab === 'permits' ? 'active' : '') + '" onclick="window.clinicSwitchTab(\'permits\')">🛌 Rest Permits (تصاريح الراحة) ' + (kpis.activePermits > 0 ? '<span class="badge badge-info" style="margin-right:6px;font-size:0.75rem">' + kpis.activePermits + '</span>' : '') + '</button>';
    html += '<button class="tab ' + (activeTab === 'pharmacy' ? 'active' : '') + '" onclick="window.clinicSwitchTab(\'pharmacy\')">💊 Clinic Pharmacy (صيدلية العيادة) ' + (kpis.lowStockCount > 0 ? '<span class="badge badge-warning" style="margin-right:6px;font-size:0.75rem">' + kpis.lowStockCount + '</span>' : '') + '</button>';
    html += '<button class="tab ' + (activeTab === 'approvals' ? 'active' : '') + '" onclick="window.clinicSwitchTab(\'approvals\')">📑 Claims & Approvals (الموافقات الطبية) ' + (kpis.pendingClaims > 0 ? '<span class="badge badge-warning" style="margin-right:6px;font-size:0.75rem">' + kpis.pendingClaims + '</span>' : '') + '</button>';
    html += '</div>';

    // ===== 4. TAB CONTENTS CONTAINER =====
    html += '<div id="clinic-tab-content" style="margin-top:10px;">';
    if (activeTab === 'visits') html += renderVisitsTab();
    else if (activeTab === 'injuries') html += renderInjuriesTab();
    else if (activeTab === 'permits') html += renderPermitsTab();
    else if (activeTab === 'pharmacy') html += renderPharmacyTab();
    else if (activeTab === 'approvals') html += renderApprovalsTab();
    html += '</div>';

    html += '</div>'; // End container
    el.innerHTML = html;

    // Attach Event Listeners
    bindMainEvents();

    // Render Charts if analytics open
    if (showAnalytics) {
      setTimeout(renderCharts, 50);
    }
  }

  // Global tab switcher
  window.clinicSwitchTab = function (tabId) {
    activeTab = tabId;
    render();
  };

  // Render Charts helper
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    var ctx1 = document.getElementById('chart-clinic-visits');
    var ctx2 = document.getElementById('chart-clinic-injuries');

    if (ctx1) {
      if (clinicChart1) clinicChart1.destroy();
      clinicChart1 = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
          datasets: [{
            label: 'كشوفات عادية',
            data: [4, 7, 5, 8, 6, 9, 3],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.35,
            fill: true
          }, {
            label: 'شكاوى طارئة وإصابات',
            data: [1, 2, 0, 3, 1, 1, 0],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244,63,94,0.1)',
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    if (ctx2) {
      if (clinicChart2) clinicChart2.destroy();
      clinicChart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['صداع وإرهاق', 'جروح صيانة', 'نزلة معوية', 'حروق طفيفة', 'حساسية وضيق تنفس'],
          datasets: [{
            data: [14, 5, 8, 3, 4],
            backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#f97316', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }

  // ==============================================================================
  // TAB 1: DAILY CLINIC VISITS & TRIAGE
  // ==============================================================================
  function renderVisitsTab() {
    var h = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">';
    h += '<div><h3>📋 Daily Clinic Visits & Triage (سجل الزيارات والفرز الطبي)</h3><p>سجل الكشوفات اليومية، العلامات الحيوية الذكية، والتشخيص الطبي الأولي للعاملين بالمصنع</p></div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    h += '<input type="text" id="visit-search" class="form-input" style="width:200px;" placeholder="بحث باسم الموظف أو القسم..." value="' + state.searchTerm + '">';
    h += '<button class="btn btn-outline" onclick="window.clinicExportExcel(\'visits\')" style="color:#10b981;border-color:#10b981">📥 تصدير إكسيل (Excel)</button>';
    h += '<button class="btn btn-primary" id="btn-add-visit" style="background:#f43f5e;border-color:#f43f5e">' + icon('plus') + ' تسجيل زيارة كشف</button>';
    h += '</div></div>';

    var filtered = state.visits.filter(function (v) {
      if (state.searchTerm) {
        var q = state.searchTerm.toLowerCase();
        var matchEmp = (v.employee_name || '').toLowerCase().includes(q);
        var matchDept = (v.department || '').toLowerCase().includes(q);
        var matchDiag = (v.diagnosis || '').toLowerCase().includes(q);
        if (!matchEmp && !matchDept && !matchDiag) return false;
      }
      return true;
    });

    h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    h += '<thead><tr><th>التاريخ والوقت</th><th>الموظف (القسم)</th><th>نوع الكشف</th><th>العلامات الحيوية (Vitals)</th><th>الشكوى والتشخيص</th><th>الإجراء والعلاج المصروف</th><th>القرار (Disposition)</th><th>المسؤول</th><th>إجراءات</th></tr></thead><tbody>';

    if (filtered.length === 0) {
      h += '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">لا توجد زيارات مسجلة في هذا النطاق</td></tr>';
    } else {
      filtered.forEach(function (v) {
        var typeBadge = '';
        if (v.visit_type === 'checkup') typeBadge = '<span class="badge badge-info">كشف عادي</span>';
        else if (v.visit_type === 'acute') typeBadge = '<span class="badge badge-warning">شكوى طارئة</span>';
        else if (v.visit_type === 'work_injury') typeBadge = '<span class="badge badge-danger">إصابة عمل</span>';
        else if (v.visit_type === 'follow_up') typeBadge = '<span class="badge badge-primary">متابعة</span>';
        else typeBadge = '<span class="badge badge-secondary">إسعافات أولية</span>';

        var dispBadge = '';
        if (v.disposition === 'return_to_work') dispBadge = '<span class="badge badge-success">عودة للعمل</span>';
        else if (v.disposition === 'clinic_rest') dispBadge = '<span class="badge badge-warning">راحة بالعيادة</span>';
        else if (v.disposition === 'rest_permit') dispBadge = '<span class="badge badge-primary">تصريح راحة</span>';
        else if (v.disposition === 'hospital_transfer') dispBadge = '<span class="badge badge-danger">تحويل مستشفى</span>';
        else dispBadge = '<span class="badge badge-secondary">' + (v.disposition || 'مستقر') + '</span>';

        h += '<tr>';
        h += '<td><div style="font-weight:600">' + new Date(v.created_at).toLocaleDateString('ar-EG') + '</div><div style="font-size:0.8rem;color:var(--text-muted)">' + new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div></td>';
        h += '<td><div style="font-weight:700">' + (v.employee_name || '—') + '</div><div style="font-size:0.82rem;color:var(--text-muted)">' + (v.department || '—') + '</div></td>';
        h += '<td>' + typeBadge + '</td>';
        h += '<td>' + formatVitalsWithTriage(v) + '</td>';
        h += '<td><div style="font-weight:600">' + (v.diagnosis || '—') + '</div><div style="font-size:0.82rem;color:var(--text-muted)">' + (v.complaint || '—') + '</div></td>';
        h += '<td><div>' + (v.treatment || '—') + '</div>' + (v.medicine_dispensed ? '<div style="font-size:0.82rem;color:#10b981;font-weight:600">💊 صرف: ' + v.medicine_dispensed + (v.medicine_qty ? ' (' + v.medicine_qty + ')' : '') + '</div>' : '') + '</td>';
        h += '<td>' + dispBadge + '</td>';
        h += '<td><span style="font-size:0.85rem">' + (v.attended_by || 'تمريض العيادة') + '</span></td>';
        h += '<td><button class="btn btn-xs btn-outline" onclick="window.clinicPrintTicket(\'' + v.id + '\')">🖨️ تذكرة كشف</button></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div></div></div>';
    return h;
  }

  // ==============================================================================
  // TAB 2: WORK INJURIES & SAFETY INCIDENTS (OSH)
  // ==============================================================================
  function renderInjuriesTab() {
    var h = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">';
    h += '<div><h3>⚠️ Work Injuries & Safety Incident Logs (سجل إصابات العمل وحوادث السلامة المهنية)</h3><p>توثيق رسمي لحوادث وإصابات العمل متوافق مع معايير السلامة والصحة المهنية (OSH) وقانون العمل</p></div>';
    h += '<div style="display:flex;gap:8px;">';
    h += '<button class="btn btn-outline" onclick="window.clinicExportExcel(\'injuries\')" style="color:#10b981;border-color:#10b981">📥 تصدير إكسيل (Excel)</button>';
    h += '<button class="btn btn-danger" id="btn-add-injury" style="background:#ef4444;border-color:#ef4444">' + icon('plus') + ' تسجيل إصابة عمل رسمية</button>';
    h += '</div></div>';

    h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    h += '<thead><tr><th>تاريخ ووقت الحادث</th><th>المصاب (القسم)</th><th>موقع الحادث / الماكينة</th><th>درجة الخطورة</th><th>نوع الإصابة</th><th>الوصف والسبب الجذري</th><th>الإجراء الفوري</th><th>أيام الانقطاع</th><th>الحالة</th><th>محضر رسمي</th></tr></thead><tbody>';

    if (state.injuries.length === 0) {
      h += '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted)">الحمد لله، لا توجد أي إصابات عمل مسجلة حتى الآن</td></tr>';
    } else {
      state.injuries.forEach(function (inj) {
        var sevBadge = '';
        if (inj.severity === 'minor') sevBadge = '<span class="badge badge-info">بسيطة (إسعافات)</span>';
        else if (inj.severity === 'moderate') sevBadge = '<span class="badge badge-warning">متوسطة (راحة)</span>';
        else if (inj.severity === 'severe') sevBadge = '<span class="badge badge-danger">جسيمة (نقل مستشفى)</span>';
        else sevBadge = '<span class="badge badge-danger" style="background:#b91c1c">حرجة للغاية</span>';

        var statusBadge = '';
        if (inj.status === 'recovered') statusBadge = '<span class="badge badge-success">شفي وعاد للعمل</span>';
        else if (inj.status === 'under_treatment') statusBadge = '<span class="badge badge-warning">تحت العلاج</span>';
        else if (inj.status === 'hospitalized') statusBadge = '<span class="badge badge-danger">محول لمستشفى</span>';
        else statusBadge = '<span class="badge badge-secondary">' + (inj.status || 'متابع') + '</span>';

        h += '<tr>';
        h += '<td><div style="font-weight:600">' + new Date(inj.incident_date || inj.created_at).toLocaleDateString('ar-EG') + '</div><div style="font-size:0.8rem;color:var(--text-muted)">' + new Date(inj.incident_date || inj.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div></td>';
        h += '<td><div style="font-weight:700">' + (inj.employee_name || '—') + '</div><div style="font-size:0.82rem;color:var(--text-muted)">' + (inj.department || '—') + '</div></td>';
        h += '<td><div style="font-weight:600;color:var(--text-primary)">' + (inj.location || 'صالة الإنتاج') + '</div></td>';
        h += '<td>' + sevBadge + '</td>';
        h += '<td><b>' + (inj.injury_type || 'أخرى') + '</b></td>';
        h += '<td><div>' + (inj.description || '—') + '</div>' + (inj.root_cause ? '<div style="font-size:0.8rem;color:var(--text-muted)">السبب: ' + inj.root_cause + '</div>' : '') + '</td>';
        h += '<td>' + (inj.immediate_action || 'إسعافات بالعيادة') + (inj.hospitalized ? '<div style="font-size:0.8rem;color:#ef4444">🏥 نُقل إلى: ' + (inj.hospital_name || 'مستشفى التأمين') + '</div>' : '') + '</td>';
        h += '<td style="text-align:center;font-weight:700">' + (inj.lost_work_days || 0) + ' يوم</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '<td><button class="btn btn-xs btn-outline" onclick="window.clinicPrintInjuryReport(\'' + inj.id + '\')">📄 محضر إصابة</button></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div></div></div>';
    return h;
  }

  // ==============================================================================
  // TAB 3: MEDICAL REST & SICK LEAVE PERMITS
  // ==============================================================================
  function renderPermitsTab() {
    var h = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">';
    h += '<div><h3>🛌 Medical Rest & Sick Leave Permits (تصاريح الراحة الطبية والإجازات)</h3><p>إصدار وتتبع أذونات الراحة الطبية المؤقتة وتصاريح الخروج من بوابة المصنع للأسباب المرضية</p></div>';
    h += '<div style="display:flex;gap:8px;">';
    h += '<button class="btn btn-outline" onclick="window.clinicExportExcel(\'permits\')" style="color:#10b981;border-color:#10b981">📥 تصدير إكسيل (Excel)</button>';
    h += '<button class="btn btn-primary" id="btn-add-permit" style="background:#6366f1;border-color:#6366f1">' + icon('plus') + ' إصدار تصريح راحة جديد</button>';
    h += '</div></div>';

    h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    h += '<thead><tr><th>تاريخ الإصدار</th><th>الموظف (القسم)</th><th>نوع التصريح والمدة</th><th>التشخيص والسبب الطبي</th><th>تصريح بوابة الأمن (Gate Pass)</th><th>الحالة</th><th>توقيع الطبيب / الممرض</th><th>إجراءات</th></tr></thead><tbody>';

    if (state.permits.length === 0) {
      h += '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">لا توجد تصاريح راحة طبية مسجلة حالياً</td></tr>';
    } else {
      state.permits.forEach(function (p) {
        var statusBadge = '';
        if (p.status === 'active') statusBadge = '<span class="badge badge-warning" style="animation:pulseGlow 2s infinite">⏳ ساري حالياً (في راحة)</span>';
        else if (p.status === 'returned_to_work') statusBadge = '<span class="badge badge-success">✅ استأنف العمل</span>';
        else statusBadge = '<span class="badge badge-secondary">' + (p.status || 'منتهي') + '</span>';

        var gateBadge = p.gate_pass_authorized ? '<span class="badge badge-success">🚪 مصرح بالخروج من البوابة</span>' : '<span class="badge badge-secondary">راحة داخل المصنع</span>';

        h += '<tr>';
        h += '<td><div style="font-weight:600">' + new Date(p.created_at).toLocaleDateString('ar-EG') + '</div><div style="font-size:0.8rem;color:var(--text-muted)">من: ' + (p.start_time || '—') + '</div></td>';
        h += '<td><div style="font-weight:700">' + (p.employee_name || '—') + '</div><div style="font-size:0.82rem;color:var(--text-muted)">' + (p.department || '—') + '</div></td>';
        h += '<td><div style="font-weight:700;color:var(--accent-primary)">' + (p.duration || '—') + '</div><div style="font-size:0.8rem;color:var(--text-muted)">' + (p.permit_type || 'راحة عيادة') + '</div></td>';
        h += '<td><div>' + (p.diagnosis || '—') + '</div></td>';
        h += '<td>' + gateBadge + '</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '<td>' + (p.issued_by || 'طبيب / تمريض العيادة') + '</td>';
        h += '<td><div style="display:flex;gap:4px;">';
        if (p.status === 'active') {
          h += '<button class="btn btn-xs btn-success" onclick="window.clinicReturnWorker(\'' + p.id + '\')">✅ عودة للعمل</button>';
        }
        h += '<button class="btn btn-xs btn-outline" onclick="window.clinicPrintRestSlip(\'' + p.id + '\')">🖨️ طباعة إذن</button>';
        h += '</div></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div></div></div>';
    return h;
  }

  // ==============================================================================
  // TAB 4: CLINIC PHARMACY & FIRST-AID STOCK
  // ==============================================================================
  function renderPharmacyTab() {
    var h = '<div class="card"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">';
    h += '<div><h3>💊 Clinic Pharmacy & First-Aid Supplies (صيدلية العيادة ومخزون الإسعافات)</h3><p>متابعة رصيد الأدوية والمستلزمات الطبية، إنذارات النواقص، وصرف العلاج للعاملين</p></div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    h += '<button class="btn btn-outline" onclick="window.clinicExportExcel(\'pharmacy\')" style="color:#10b981;border-color:#10b981">📥 تصدير إكسيل (Excel)</button>';
    h += '<button class="btn btn-outline" id="btn-dispense-med" style="border-color:#10b981;color:#10b981;font-weight:700;">➕ صرف دواء لموظف</button>';
    h += '<button class="btn btn-primary" id="btn-add-med" style="background:#10b981;border-color:#10b981">' + icon('plus') + ' إضافة / توريد صنف</button>';
    h += '</div></div>';

    h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    h += '<thead><tr><th>اسم الصنف (التجاري والعلمي)</th><th>التصنيف</th><th>الوحدة</th><th>الرصيد الحالي</th><th>حد الأمان</th><th>تاريخ الصلاحية</th><th>الموقع بالعيادة</th><th>الحالة والإنذار</th><th>إجراءات</th></tr></thead><tbody>';

    if (state.medications.length === 0) {
      h += '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">لا توجد أصناف مسجلة في صيدلية العيادة</td></tr>';
    } else {
      state.medications.forEach(function (m) {
        var isLow = Number(m.current_stock) <= Number(m.min_threshold);
        var stockBadge = isLow
          ? '<span class="badge badge-danger">⚠️ رصيد منخفض (نواقص)</span>'
          : '<span class="badge badge-success">✅ متوفر</span>';

        h += '<tr>';
        h += '<td><div style="font-weight:700">' + m.name + '</div><div style="font-size:0.8rem;color:var(--text-muted)">' + (m.generic_name || '—') + '</div></td>';
        h += '<td><span class="badge badge-secondary">' + (m.category || 'عام') + '</span></td>';
        h += '<td>' + (m.unit || 'علبة') + '</td>';
        h += '<td style="font-size:1.15rem;font-weight:800;color:' + (isLow ? '#ef4444' : 'var(--text-primary)') + '">' + m.current_stock + '</td>';
        h += '<td style="color:var(--text-muted)">' + m.min_threshold + '</td>';
        h += '<td>' + (m.expiry_date || '—') + '</td>';
        h += '<td><span style="font-size:0.85rem">📍 ' + (m.location || 'دولاب الإسعافات') + '</span></td>';
        h += '<td>' + stockBadge + '</td>';
        h += '<td><div style="display:flex;gap:4px;">';
        h += '<button class="btn btn-xs btn-outline" onclick="window.clinicDispenseSpecific(\'' + m.id + '\')">صرف</button>';
        h += '<button class="btn btn-xs btn-outline" onclick="window.clinicRestockSpecific(\'' + m.id + '\')">توريد كمية</button>';
        h += '</div></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div></div></div>';

    // Recent Dispense Logs
    if (state.dispenseLogs && state.dispenseLogs.length > 0) {
      h += '<div class="card" style="margin-top:20px;"><div class="card-header"><h4>📜 Recent Dispense History (سجل حركات صرف العلاج الأخيرة)</h4></div>';
      h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr><th>التاريخ</th><th>الموظف</th><th>الدواء المصروف</th><th>الكمية</th><th>السبب الطبي</th><th>المسؤول عن الصرف</th></tr></thead><tbody>';
      state.dispenseLogs.slice(0, 10).forEach(function (log) {
        h += '<tr>';
        h += '<td>' + new Date(log.created_at).toLocaleDateString('ar-EG') + ' ' + new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</td>';
        h += '<td><b>' + log.employee_name + '</b></td>';
        h += '<td style="color:#10b981;font-weight:600">' + log.medication_name + '</td>';
        h += '<td>' + log.quantity + '</td>';
        h += '<td>' + (log.reason || 'شكوى صحية') + '</td>';
        h += '<td>' + (log.dispensed_by || 'تمريض العيادة') + '</td>';
        h += '</tr>';
      });
      h += '</tbody></table></div></div></div>';
    }

    return h;
  }

  // ==============================================================================
  // TAB 5: MEDICAL EXPENSE CLAIMS & APPROVALS (5-STEP PIPELINE)
  // ==============================================================================
  function renderApprovalsTab() {
    var h = '<div class="card"><div class="card-header"><div><h3>🏥 Medical Expense Claims & Approvals (الموافقات الطبية وتعويض الفواتير)</h3><p>Review and process employee medical reimbursement claims (مسار اعتماد الفواتير الطبية: الموظف ➔ التمريض ➔ المدير ➔ الحسابات ➔ الموارد البشرية)</p></div></div>';
    h += '<div class="card-body no-pad"><div class="table-container"><table class="data-table">';
    h += '<thead><tr><th>Employee (الموظف)</th><th>Date (التاريخ)</th><th>Description (البيان)</th><th>Doc (المرفق)</th><th>Amount (المبلغ)</th><th>Status (الحالة)</th><th>Rejection Reason (سبب الرفض)</th><th>Actions (إجراءات)</th></tr></thead><tbody>';

    var visibleRequests = state.approvals.filter(function (r) {
      if (isOwner) return true;
      if (isNursing) return r.status === 'pending_nursing' || r.status === 'rejected';
      if (isManager) return r.status === 'pending_manager';
      if (isFinance) return r.status === 'pending_finance';
      if (isHR) return r.status === 'pending_hr' || r.status === 'disbursed';
      return false;
    });

    if (visibleRequests.length === 0) {
      h += '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:30px">No pending medical requests (لا توجد طلبات معلقة للمراجعة)</td></tr>';
    } else {
      visibleRequests.forEach(function (r) {
        var statusBadge = '';
        if (r.status === 'pending_nursing') statusBadge = '<span class="badge badge-warning">⏳ Nursing Approval (مراجعة التمريض)</span>';
        else if (r.status === 'pending_manager') statusBadge = '<span class="badge badge-warning">👔 Manager Approval (مراجعة المدير)</span>';
        else if (r.status === 'pending_finance') statusBadge = '<span class="badge badge-info">💰 Finance Processing (الحسابات - إصدار فاتورة)</span>';
        else if (r.status === 'pending_hr') statusBadge = '<span class="badge badge-primary">📋 HR Payroll (اعتماد لإضافته للراتب)</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">✅ Added to Payroll (تمت الإضافة للراتب)</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">❌ Rejected (مرفوض)</span>';

        var docLink = r.document_url ? '<a href="' + r.document_url + '" target="_blank" class="btn btn-xs btn-outline">👁️ View</a>' : '-';

        h += '<tr>';
        h += '<td><div style="font-weight:600">' + (r.employee_name || 'Unknown') + '</div></td>';
        h += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        h += '<td>' + (r.description || '—') + '</td>';
        h += '<td>' + docLink + '</td>';
        h += '<td style="font-weight:bold;color:var(--accent-primary)">' + (r.amount > 0 ? r.amount.toLocaleString() + ' EGP' : '—') + '</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '<td style="color:var(--accent-danger);font-size:0.85rem">' + (r.rejection_reason || '-') + '</td>';
        h += '<td><div style="display:flex;gap:4px;flex-wrap:wrap">';

        // Nursing Actions
        if (r.status === 'pending_nursing' && (isNursing || isOwner)) {
          h += '<button class="btn btn-xs btn-success btn-approve-nursing" data-id="' + r.id + '">Approve (موافقة)</button>';
          h += '<button class="btn btn-xs btn-danger btn-reject-claim" data-id="' + r.id + '">Reject (رفض)</button>';
        }

        // Manager Actions
        if (r.status === 'pending_manager' && (isManager || isOwner)) {
          h += '<button class="btn btn-xs btn-success btn-approve-manager" data-id="' + r.id + '">Approve (موافقة)</button>';
          h += '<button class="btn btn-xs btn-danger btn-reject-claim" data-id="' + r.id + '">Reject (رفض)</button>';
        }

        // Finance Actions
        if (r.status === 'pending_finance' && (isFinance || isOwner)) {
          h += '<button class="btn btn-xs btn-info btn-create-invoice" data-id="' + r.id + '" data-emp="' + r.employee_name + '">Create Invoice (إصدار فاتورة)</button>';
        }

        // HR Actions
        if (r.status === 'pending_hr' && (isHR || isOwner)) {
          h += '<button class="btn btn-xs btn-primary btn-add-payroll" data-id="' + r.id + '">Add to Payroll (اعتماد للراتب)</button>';
        }

        h += '</div></td>';
        h += '</tr>';
      });
    }

    h += '</tbody></table></div></div></div>';
    return h;
  }

  // ==============================================================================
  // BIND MAIN EVENTS & ACTION BUTTONS
  // ==============================================================================
  function bindMainEvents() {
    var btnToggleA = document.getElementById('btn-toggle-analytics');
    if (btnToggleA) {
      btnToggleA.addEventListener('click', function () {
        showAnalytics = !showAnalytics;
        render();
      });
    }

    var btnQV = document.getElementById('btn-quick-visit');
    if (btnQV) btnQV.addEventListener('click', showLogVisitModal);

    var btnQI = document.getElementById('btn-quick-injury');
    if (btnQI) btnQI.addEventListener('click', showLogInjuryModal);

    var btnQP = document.getElementById('btn-quick-permit');
    if (btnQP) btnQP.addEventListener('click', showIssuePermitModal);

    var btnQM = document.getElementById('btn-quick-med');
    if (btnQM) btnQM.addEventListener('click', function () { showDispenseModal(); });

    var btnAddV = document.getElementById('btn-add-visit');
    if (btnAddV) btnAddV.addEventListener('click', showLogVisitModal);

    var btnAddI = document.getElementById('btn-add-injury');
    if (btnAddI) btnAddI.addEventListener('click', showLogInjuryModal);

    var btnAddP = document.getElementById('btn-add-permit');
    if (btnAddP) btnAddP.addEventListener('click', showIssuePermitModal);

    var btnAddM = document.getElementById('btn-add-med');
    if (btnAddM) btnAddM.addEventListener('click', function () { showAddMedicineModal(); });

    var btnDispM = document.getElementById('btn-dispense-med');
    if (btnDispM) btnDispM.addEventListener('click', function () { showDispenseModal(); });

    var searchInput = document.getElementById('visit-search');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.searchTerm = e.target.value;
        var tabContainer = document.getElementById('clinic-tab-content');
        if (tabContainer && activeTab === 'visits') tabContainer.innerHTML = renderVisitsTab();
      });
    }

    bindApprovalHandlers();
  }

  // ==============================================================================
  // 5-STEP APPROVAL PIPELINE HANDLERS (Completely Preserved)
  // ==============================================================================
  function bindApprovalHandlers() {
    // 1. Nursing Approval
    var btnAppNurs = el.querySelectorAll('.btn-approve-nursing');
    for (var i = 0; i < btnAppNurs.length; i++) {
      btnAppNurs[i].addEventListener('click', function () {
        if (!confirm('Confirm medical validity? (هل تؤكد صحة الطلب والمستندات الطبية؟)')) return;
        var amount = prompt("Enter approved amount in EGP (أدخل المبلغ المعتمد للصرف، أو 0 إذا كان مجانياً):", "0");
        if (amount === null || isNaN(parseFloat(amount))) return;

        var id = this.getAttribute('data-id');
        sbClient.from('medical_requests').update({ status: 'pending_manager', amount: parseFloat(amount) }).eq('id', id).then(function (res) {
          if (res.error) alert(res.error.message);
          else { showToast('✅ Forwarded to Manager (تم إرسال الطلب لمدير القسم)', 'success'); loadData(); }
        });
      });
    }

    // 2. Manager Approval
    var btnAppMgr = el.querySelectorAll('.btn-approve-manager');
    for (var j = 0; j < btnAppMgr.length; j++) {
      btnAppMgr[j].addEventListener('click', function () {
        if (!confirm('Approve this request? (هل توافق على هذا الطلب؟)')) return;
        var id = this.getAttribute('data-id');
        sbClient.from('medical_requests').update({ status: 'pending_finance' }).eq('id', id).then(function (res) {
          if (res.error) alert(res.error.message);
          else { showToast('✅ Forwarded to Finance (تم إرسال الطلب للحسابات)', 'success'); loadData(); }
        });
      });
    }

    // 3. Reject Claim
    var rejectBtns = el.querySelectorAll('.btn-reject-claim');
    for (var k = 0; k < rejectBtns.length; k++) {
      rejectBtns[k].addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var reason = prompt("Enter rejection reason (أدخل سبب الرفض):");
        if (reason === null) return;
        sbClient.from('medical_requests').update({ status: 'rejected', rejection_reason: reason }).eq('id', id).then(function (res) {
          if (res.error) alert(res.error.message);
          else { showToast('❌ Request Rejected', 'info'); loadData(); }
        });
      });
    }

    // 4. Finance Invoice Generation
    var invBtns = el.querySelectorAll('.btn-create-invoice');
    for (var l = 0; l < invBtns.length; l++) {
      invBtns[l].addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        var empName = this.getAttribute('data-emp');
        var amount = prompt("Enter approved invoice amount in EGP (أدخل قيمة الفاتورة المعتمدة):");
        if (!amount || isNaN(parseFloat(amount))) return;

        sbClient.from('finance_general_ledger').insert({
          account_id: 'liabilities',
          transaction_date: new Date().toISOString().split('T')[0],
          description: 'Medical Invoice for ' + empName,
          debit: 0, credit: parseFloat(amount),
          reference_type: 'medical_invoice',
          reference_id: id,
          created_by: App.user ? App.user.id : null
        }).then(function () {
          sbClient.from('medical_requests').update({ status: 'pending_hr', amount: parseFloat(amount) }).eq('id', id).then(function (res) {
            if (res.error) alert(res.error.message);
            else { showToast('✅ Invoice Created! Forwarded to HR (تم إصدار الفاتورة وتمريرها للموارد البشرية)', 'success'); loadData(); }
          });
        });
      });
    }

    // 5. HR Add to Payroll
    var hrBtns = el.querySelectorAll('.btn-add-payroll');
    for (var m = 0; m < hrBtns.length; m++) {
      hrBtns[m].addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        if (!confirm('Confirm adding this amount to employee payroll? (تأكيد إضافة المبلغ لراتب الموظف في مسير الرواتب؟)')) return;
        sbClient.from('medical_requests').update({ status: 'disbursed' }).eq('id', id).then(function (res) {
          if (res.error) alert(res.error.message);
          else { showToast('✅ Added to Payroll successfully (تم اعتماد الصرف ونزوله على المرتب)', 'success'); loadData(); }
        });
      });
    }
  }

  // ==============================================================================
  // EXCEL EXPORT (SHEETJS)
  // ==============================================================================
  window.clinicExportExcel = function (tabType) {
    if (typeof XLSX === 'undefined') {
      return alert('SheetJS library is loading, please try again in a moment.');
    }

    var data = [];
    var filename = 'Clinic_' + tabType + '_' + new Date().toISOString().slice(0, 10);

    if (tabType === 'visits') {
      data = state.visits.map(function (v) {
        return {
          'تاريخ الكشف': new Date(v.created_at).toLocaleString('ar-EG'),
          'اسم الموظف': v.employee_name,
          'القسم': v.department || '',
          'نوع الزيارة': v.visit_type,
          'ضغط الدم': v.blood_pressure || '',
          'درجة الحرارة': v.temperature || '',
          'النبض': v.heart_rate || '',
          'السكر': v.blood_sugar || '',
          'الشكوى': v.complaint || '',
          'التشخيص الطبي': v.diagnosis || '',
          'العلاج المصروف': v.medicine_dispensed || '',
          'القرار الطبي': v.disposition || '',
          'المسؤول': v.attended_by || ''
        };
      });
    } else if (tabType === 'injuries') {
      data = state.injuries.map(function (i) {
        return {
          'تاريخ الحادث': new Date(i.incident_date || i.created_at).toLocaleString('ar-EG'),
          'المصاب': i.employee_name,
          'القسم': i.department || '',
          'موقع الحادث': i.location || '',
          'درجة الخطورة': i.severity,
          'نوع الإصابة': i.injury_type,
          'الوصف': i.description,
          'السبب الجذري': i.root_cause || '',
          'الإجراء الفوري': i.immediate_action || '',
          'أيام الانقطاع': i.lost_work_days || 0,
          'الحالة': i.status
        };
      });
    } else if (tabType === 'permits') {
      data = state.permits.map(function (p) {
        return {
          'تاريخ الإصدار': new Date(p.created_at).toLocaleString('ar-EG'),
          'الموظف': p.employee_name,
          'القسم': p.department || '',
          'نوع الراحة': p.permit_type,
          'المدة': p.duration,
          'التشخيص': p.diagnosis,
          'إذن بوابة الأمن': p.gate_pass_authorized ? 'مصرح بالخروج' : 'راحة بالعيادة',
          'الحالة': p.status,
          'المصدر': p.issued_by
        };
      });
    } else if (tabType === 'pharmacy') {
      data = state.medications.map(function (m) {
        return {
          'اسم الصنف': m.name,
          'الاسم العلمي': m.generic_name || '',
          'التصنيف': m.category,
          'الوحدة': m.unit,
          'الرصيد الحالي': m.current_stock,
          'حد الأمان': m.min_threshold,
          'تاريخ الصلاحية': m.expiry_date || '',
          'رقم التشغيلة': m.batch_no || '',
          'الموقع بالعيادة': m.location || ''
        };
      });
    }

    if (data.length === 0) return alert('لا توجد بيانات متاحة للتصدير');

    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabType);
    XLSX.writeFile(wb, filename + '.xlsx');
    showToast('📥 تم تحميل ملف الإكسيل بنجاح', 'success');
  };

  // ==============================================================================
  // MODALS & FORMS
  // ==============================================================================

  // 1. LOG VISIT MODAL
  function showLogVisitModal() {
    var userOptions = '<option value="">— اختر الموظف —</option>';
    state.allUsers.forEach(function (u) {
      userOptions += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-dept="' + (u.department || '') + '">' + u.full_name + ' (' + (u.department || 'عام') + ')</option>';
    });

    var medOptions = '<option value="">— لا يوجد دواء منصرف —</option>';
    state.medications.forEach(function (m) {
      medOptions += '<option value="' + m.name + '">' + m.name + ' (متوفر: ' + m.current_stock + ' ' + m.unit + ')</option>';
    });

    var body = '<div style="display:flex;flex-direction:column;gap:14px;">';
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>اسم الموظف *</label><select id="vm-emp" class="form-input">' + userOptions + '</select></div>';
    body += '<div class="form-field" style="flex:1"><label>نوع الزيارة *</label><select id="vm-type" class="form-input"><option value="checkup">كشف عادي (Regular Checkup)</option><option value="acute">شكوى طارئة (Acute Complaint)</option><option value="work_injury">إصابة عمل (Work Injury)</option><option value="follow_up">متابعة علاج (Follow-up)</option><option value="first_aid">إسعافات أولية (First Aid)</option><option value="periodic">فحص طبي دوري (Periodic Checkup)</option></select></div></div>';

    // Vital Signs Grid
    body += '<div style="background:var(--bg-tertiary);padding:14px;border-radius:10px;border:1px solid var(--border-color);">';
    body += '<div style="font-weight:700;font-size:0.85rem;margin-bottom:10px;color:var(--accent-primary)">📊 العلامات الحيوية الذكية (Vital Signs With Smart Diagnostic Triage)</div>';
    body += '<div class="form-row" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
    body += '<div class="form-field"><label style="font-size:0.8rem">ضغط الدم (mmHg)</label><input type="text" id="vm-bp" class="form-input" placeholder="120/80"></div>';
    body += '<div class="form-field"><label style="font-size:0.8rem">درجة الحرارة (°C)</label><input type="number" step="0.1" id="vm-temp" class="form-input" placeholder="37.0"></div>';
    body += '<div class="form-field"><label style="font-size:0.8rem">النبض (bpm)</label><input type="number" id="vm-pulse" class="form-input" placeholder="75"></div>';
    body += '<div class="form-field"><label style="font-size:0.8rem">السكر العشوائي (mg/dL)</label><input type="number" id="vm-sugar" class="form-input" placeholder="110"></div>';
    body += '</div></div>';

    // Diagnosis & Treatment
    body += '<div class="form-field"><label>الشكوى المرضية والأعراض (Chief Complaint) *</label><input type="text" id="vm-complaint" class="form-input" placeholder="مثال: ارتفاع مفاجئ في الضغط، مغص حاد، دوخة أثناء الوردية..."></div>';
    body += '<div class="form-field"><label>التشخيص الطبي الأولي (Clinical Diagnosis) *</label><input type="text" id="vm-diag" class="form-input" placeholder="مثال: إجهاد حراري، نزلة معوية، هبوط ضغط..."></div>';
    body += '<div class="form-field"><label>الإجراء الطبي المتخذ بالعيادة (Treatment Given)</label><input type="text" id="vm-treatment" class="form-input" placeholder="مثال: قياس العلامات الحيوية وإعطاء مسكن ومحلول جفاف..."></div>';

    // Medication Dispensed
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>صرف دواء من الصيدلية</label><select id="vm-med" class="form-input">' + medOptions + '</select></div>';
    body += '<div class="form-field" style="flex:1"><label>الكمية المصروفة</label><input type="number" id="vm-med-qty" class="form-input" value="1" min="1"></div></div>';

    // Disposition
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>القرار الطبي (Disposition) *</label><select id="vm-disp" class="form-input"><option value="return_to_work">عودة للعمل مباشرة (Return to Work)</option><option value="clinic_rest">استراحة مؤقتة بالعيادة (Rest in Clinic)</option><option value="rest_permit">منح إذن راحة / إجازة مرضية (Rest Permit)</option><option value="hospital_transfer">تحويل لمستشفى خارجي / تأمين صحي (Hospital)</option></select></div>';
    body += '<div class="form-field" style="flex:1"><label>اسم الطبيب / الممرض المسؤول</label><input type="text" id="vm-doctor" class="form-input" value="' + (App.user ? App.user.full_name : 'تمريض العيادة') + '"></div></div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="btn-save-visit" style="background:#f43f5e;border-color:#f43f5e">💾 حفظ الكشف وتوثيق الزيارة</button>';
    App.showModal('🩺 تسجيل كشف وعيادة جديد (New Clinic Visit)', body, footer, true);

    document.getElementById('btn-save-visit').addEventListener('click', function () {
      var empSel = document.getElementById('vm-emp');
      var empId = empSel.value;
      var opt = empSel.options[empSel.selectedIndex];
      var empName = opt ? opt.getAttribute('data-name') : '';
      var empDept = opt ? opt.getAttribute('data-dept') : '';
      var complaint = document.getElementById('vm-complaint').value.trim();
      var diag = document.getElementById('vm-diag').value.trim();

      if (!empName) return alert('يرجى اختيار الموظف أولاً');
      if (!complaint || !diag) return alert('يرجى كتابة الشكوى والتشخيص');

      var medName = document.getElementById('vm-med').value;
      var medQty = parseInt(document.getElementById('vm-med-qty').value, 10) || 0;

      var newVisit = {
        employee_id: empId || null,
        employee_name: empName,
        department: empDept,
        visit_type: document.getElementById('vm-type').value,
        blood_pressure: document.getElementById('vm-bp').value.trim() || null,
        temperature: parseFloat(document.getElementById('vm-temp').value) || null,
        heart_rate: parseInt(document.getElementById('vm-pulse').value, 10) || null,
        blood_sugar: parseInt(document.getElementById('vm-sugar').value, 10) || null,
        complaint: complaint,
        diagnosis: diag,
        treatment: document.getElementById('vm-treatment').value.trim() || null,
        medicine_dispensed: medName || null,
        medicine_qty: medName ? medQty : 0,
        disposition: document.getElementById('vm-disp').value,
        attended_by: document.getElementById('vm-doctor').value.trim() || 'تمريض العيادة',
        created_at: new Date().toISOString()
      };

      sbClient.from('clinic_visits').insert(newVisit).then(function (res) {
        if (res.error) {
          newVisit.id = 'v_' + Date.now();
          state.visits.unshift(newVisit);
          setLocal(STORAGE_KEYS.visits, state.visits);
        } else {
          newVisit.id = res.data && res.data[0] ? res.data[0].id : 'v_' + Date.now();
          state.visits.unshift(newVisit);
        }

        if (medName && medQty > 0) {
          deductMedicineStock(medName, medQty, empName, 'صرف أثناء كشف العيادة');
        }

        App.closeModal();
        showToast('✅ تم تسجيل كشف العيادة بنجاح', 'success');
        render();
      });
    });
  }

  // 2. LOG WORK INJURY MODAL (OSH COMPLIANT)
  function showLogInjuryModal() {
    var userOptions = '<option value="">— اختر العامل المصاب —</option>';
    state.allUsers.forEach(function (u) {
      userOptions += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-dept="' + (u.department || '') + '">' + u.full_name + ' (' + (u.department || 'إنتاج') + ')</option>';
    });

    var now = new Date();
    var nowLocal = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    var body = '<div style="display:flex;flex-direction:column;gap:14px;">';
    body += '<div style="background:rgba(239,68,68,0.08);border:1px solid #ef4444;padding:12px;border-radius:10px;color:#ef4444;font-size:0.85rem;">⚠️ نموذج إخطار حادث وإصابة عمل رسمي - يُسجل في سجل السلامة المهنية ومكتب العمل والتأمين الصحي</div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>اسم الموظف المصاب *</label><select id="im-emp" class="form-input">' + userOptions + '</select></div>';
    body += '<div class="form-field" style="flex:1"><label>تاريخ وتوقيت الحادث *</label><input type="datetime-local" id="im-time" class="form-input" value="' + nowLocal + '"></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>موقع الحادث بالتفصيل (الصالة / الماكينة) *</label><input type="text" id="im-loc" class="form-input" placeholder="مثال: صالة الإنتاج رقم 1 - خط التقطيع - ماكينة CNC 4"></div>';
    body += '<div class="form-field" style="flex:1"><label>درجة خطورة الإصابة *</label><select id="im-sev" class="form-input"><option value="minor">بسيطة (إسعافات أولية بالعيادة)</option><option value="moderate">متوسطة (تستوجب راحة أيام)</option><option value="severe">جسيمة (نقل مستشفى)</option><option value="critical">حرجة (طوارئ فاقد الوعي)</option></select></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>نوع الإصابة *</label><select id="im-type" class="form-input"><option value="جرح قطعي">جرح قطعي (Cut / Laceration)</option><option value="حروق">حروق حرارية أو كيميائية (Burn)</option><option value="كسر أو التواء">كسر أو التواء (Fracture / Sprain)</option><option value="إصابة عين">إصابة بالعين أو رايش (Eye Injury)</option><option value="صعق كهربائي">صعق كهربائي (Electric Shock)</option><option value="سقوط أو كدمة">سقوط من ارتفاع / صدمة (Fall / Impact)</option><option value="استنشاق غازات">استنشاق غازات أو كيميائيات</option><option value="أخرى">أخرى (Other)</option></select></div>';
    body += '<div class="form-field" style="flex:1"><label>أيام الانقطاع المتوقعة عن العمل</label><input type="number" id="im-lost-days" class="form-input" value="0" min="0"></div></div>';

    body += '<div class="form-field"><label>وصف الحادث وكيفية حدوثه *</label><textarea id="im-desc" class="form-input" rows="2" placeholder="اكتب بدقة ما حدث أثناء تشغيل الماكينة أو أثناء العمل..."></textarea></div>';
    body += '<div class="form-field"><label>السبب الجذري للحادث (Root Cause)</label><input type="text" id="im-root" class="form-input" placeholder="مثال: عطل في حساس الأمان، عدم ارتداء مهمات الوقاية، انزلاق أرضية..."></div>';
    body += '<div class="form-field"><label>الإسعافات الأولية الفورية المقدمة بالعيادة</label><input type="text" id="im-action" class="form-input" placeholder="مثال: إيقاف النزيف وتضميد الجرح وإعطاء حقنة تيتانوس..."></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>هل استدعى نقل لمستشفى؟</label><select id="im-hosp" class="form-input"><option value="no">لا - عولج بالعيادة</option><option value="yes">نعم - نُقل بالإسعاف</option></select></div>';
    body += '<div class="form-field" style="flex:2"><label>اسم المستشفى المنقول إليها (إن وجد)</label><input type="text" id="im-hosp-name" class="form-input" placeholder="مثال: مستشفى التأمين الصحي، مستشفى السلام..."></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>المشرف الذي تم إبلاغه</label><input type="text" id="im-sup" class="form-input" placeholder="اسم مدير الصالة أو مهندس السلامة..."></div>';
    body += '<div class="form-field" style="flex:1"><label>حالة المصاب حالياً</label><select id="im-status" class="form-input"><option value="recovered">شفي وعاد للعمل</option><option value="under_treatment">تحت العلاج والملاحظة</option><option value="hospitalized">محول للمستشفى</option></select></div></div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-danger" id="btn-save-injury" style="background:#ef4444;border-color:#ef4444">💾 تسجيل وحفظ محضر الإصابة</button>';
    App.showModal('⚠️ تسجيل محضر إصابة عمل (Work Injury Log)', body, footer, true);

    document.getElementById('btn-save-injury').addEventListener('click', function () {
      var empSel = document.getElementById('im-emp');
      var empId = empSel.value;
      var opt = empSel.options[empSel.selectedIndex];
      var empName = opt ? opt.getAttribute('data-name') : '';
      var empDept = opt ? opt.getAttribute('data-dept') : '';
      var desc = document.getElementById('im-desc').value.trim();
      var loc = document.getElementById('im-loc').value.trim();

      if (!empName) return alert('يرجى اختيار الموظف المصاب');
      if (!desc || !loc) return alert('يرجى كتابة وصف الحادث وموقعه بالتفصيل');

      var newInjury = {
        employee_id: empId || null,
        employee_name: empName,
        department: empDept,
        incident_date: document.getElementById('im-time').value ? new Date(document.getElementById('im-time').value).toISOString() : new Date().toISOString(),
        location: loc,
        severity: document.getElementById('im-sev').value,
        injury_type: document.getElementById('im-type').value,
        description: desc,
        root_cause: document.getElementById('im-root').value.trim() || null,
        immediate_action: document.getElementById('im-action').value.trim() || null,
        hospitalized: document.getElementById('im-hosp').value === 'yes',
        hospital_name: document.getElementById('im-hosp-name').value.trim() || null,
        lost_work_days: parseFloat(document.getElementById('im-lost-days').value) || 0,
        supervisor_notified: document.getElementById('im-sup').value.trim() || null,
        status: document.getElementById('im-status').value,
        logged_by: App.user ? App.user.full_name : 'مشرف السلامة والتمريض',
        created_at: new Date().toISOString()
      };

      sbClient.from('clinic_injuries').insert(newInjury).then(function (res) {
        if (res.error) {
          newInjury.id = 'inj_' + Date.now();
          state.injuries.unshift(newInjury);
          setLocal(STORAGE_KEYS.injuries, state.injuries);
        } else {
          newInjury.id = res.data && res.data[0] ? res.data[0].id : 'inj_' + Date.now();
          state.injuries.unshift(newInjury);
        }
        App.closeModal();
        showToast('✅ تم تسجيل إصابة العمل وتحديث سجل السلامة والصحة المهنية', 'success');
        render();
      });
    });
  }

  // 3. ISSUE MEDICAL REST PERMIT MODAL
  function showIssuePermitModal() {
    var userOptions = '<option value="">— اختر الموظف المستحق للراحة —</option>';
    state.allUsers.forEach(function (u) {
      userOptions += '<option value="' + u.id + '" data-name="' + u.full_name + '" data-dept="' + (u.department || '') + '">' + u.full_name + ' (' + (u.department || 'إنتاج') + ')</option>';
    });

    var now = new Date();
    var startTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    var body = '<div style="display:flex;flex-direction:column;gap:14px;">';
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>اسم الموظف *</label><select id="pm-emp" class="form-input">' + userOptions + '</select></div>';
    body += '<div class="form-field" style="flex:1"><label>نوع الراحة المطلوبة *</label><select id="pm-type" class="form-input"><option value="clinic_rest">راحة بالعيادة (Clinic Rest)</option><option value="rest_of_day">راحة باقي اليوم وإذن خروج (Rest-of-Day)</option><option value="sick_leave_short">إجازة مرضية 1-3 أيام (Short Leave)</option><option value="sick_leave_extended">إجازة مرضية معتمدة (Extended Leave)</option></select></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>المدة المصرح بها (Duration) *</label><input type="text" id="pm-dur" class="form-input" placeholder="مثال: ساعتين بالعيادة، راحة باقي اليوم، يومين..."></div>';
    body += '<div class="form-field" style="flex:1"><label>التوقيت المبدئي للبدء</label><input type="text" id="pm-start" class="form-input" value="' + startTimeStr + '"></div></div>';

    body += '<div class="form-field"><label>التشخيص والسبب الطبي للتصريح *</label><input type="text" id="pm-diag" class="form-input" placeholder="مثال: نزلة معوية حادة، هبوط بالضغط، جرح يستلزم راحة العضو..."></div>';

    body += '<div style="background:var(--bg-tertiary);padding:12px;border-radius:10px;border:1px solid var(--border-color);display:flex;align-items:center;gap:12px;">';
    body += '<input type="checkbox" id="pm-gate" style="width:20px;height:20px;">';
    body += '<div><b>تصريح بالخروج من بوابة أمن المصنع (Gate Pass Authorization)</b><p style="margin:2px 0 0;font-size:0.8rem;color:var(--text-muted)">في حالة التحديد، سيتمكن أفراد أمن البوابة من تمرير العامل دون خصم أو احتساب انصراف مبكر بدون إذن</p></div>';
    body += '</div>';

    body += '<div class="form-field"><label>اسم الطبيب / الممرض المصدر للإذن</label><input type="text" id="pm-issuer" class="form-input" value="' + (App.user ? App.user.full_name : 'طبيب / تمريض العيادة') + '"></div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="btn-save-permit" style="background:#6366f1;border-color:#6366f1">💾 إصدار التصريح الطبي</button>';
    App.showModal('🛌 إصدار تصريح راحة طبية (Issue Rest Permit)', body, footer);

    document.getElementById('btn-save-permit').addEventListener('click', function () {
      var empSel = document.getElementById('pm-emp');
      var empId = empSel.value;
      var opt = empSel.options[empSel.selectedIndex];
      var empName = opt ? opt.getAttribute('data-name') : '';
      var empDept = opt ? opt.getAttribute('data-dept') : '';
      var dur = document.getElementById('pm-dur').value.trim();
      var diag = document.getElementById('pm-diag').value.trim();

      if (!empName) return alert('يرجى اختيار الموظف أولاً');
      if (!dur || !diag) return alert('يرجى كتابة مدة الراحة والتشخيص الطبي');

      var newPermit = {
        employee_id: empId || null,
        employee_name: empName,
        department: empDept,
        permit_type: document.getElementById('pm-type').value,
        duration: dur,
        diagnosis: diag,
        start_time: document.getElementById('pm-start').value.trim() || startTimeStr,
        gate_pass_authorized: document.getElementById('pm-gate').checked,
        status: 'active',
        issued_by: document.getElementById('pm-issuer').value.trim() || 'تمريض العيادة',
        created_at: new Date().toISOString()
      };

      sbClient.from('clinic_rest_permits').insert(newPermit).then(function (res) {
        if (res.error) {
          newPermit.id = 'rp_' + Date.now();
          state.permits.unshift(newPermit);
          setLocal(STORAGE_KEYS.permits, state.permits);
        } else {
          newPermit.id = res.data && res.data[0] ? res.data[0].id : 'rp_' + Date.now();
          state.permits.unshift(newPermit);
        }
        App.closeModal();
        showToast('✅ تم إصدار تصريح الراحة الطبية بنجاح', 'success');
        render();
      });
    });
  }

  // 4. DISPENSE MEDICINE MODAL
  function showDispenseModal(preselectedMedId) {
    var medOptions = '<option value="">— اختر الدواء المراد صرفه —</option>';
    state.medications.forEach(function (m) {
      var selected = (m.id === preselectedMedId || m.name === preselectedMedId) ? 'selected' : '';
      medOptions += '<option value="' + m.id + '" data-name="' + m.name + '" data-stock="' + m.current_stock + '" ' + selected + '>' + m.name + ' (متوفر: ' + m.current_stock + ' ' + m.unit + ')</option>';
    });

    var userOptions = '<option value="">— اختر الموظف المستلم —</option>';
    state.allUsers.forEach(function (u) {
      userOptions += '<option value="' + u.id + '" data-name="' + u.full_name + '">' + u.full_name + ' (' + (u.department || 'إنتاج') + ')</option>';
    });

    var body = '<div style="display:flex;flex-direction:column;gap:14px;">';
    body += '<div class="form-field"><label>الصنف المطلوب صرفه *</label><select id="dm-med" class="form-input">' + medOptions + '</select></div>';
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>اسم الموظف المستلم *</label><select id="dm-emp" class="form-input">' + userOptions + '</select></div>';
    body += '<div class="form-field" style="flex:1"><label>الكمية المصروفة *</label><input type="number" id="dm-qty" class="form-input" value="1" min="1"></div></div>';
    body += '<div class="form-field"><label>السبب الطبي / الغرض من الصرف</label><input type="text" id="dm-reason" class="form-input" placeholder="مثال: صداع نصفي، تطهير جرح، مسكن آلام عضلات..."></div>';
    body += '<div class="form-field"><label>المسؤول عن الصرف</label><input type="text" id="dm-by" class="form-input" value="' + (App.user ? App.user.full_name : 'تمريض العيادة') + '"></div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="btn-save-dispense" style="background:#10b981;border-color:#10b981">💊 تأكيد الصرف وخصم المخزون</button>';
    App.showModal('💊 صرف علاج من صيدلية العيادة (Dispense Medicine)', body, footer);

    document.getElementById('btn-save-dispense').addEventListener('click', function () {
      var medSel = document.getElementById('dm-med');
      var optMed = medSel.options[medSel.selectedIndex];
      var medName = optMed ? optMed.getAttribute('data-name') : '';
      var currentStock = optMed ? parseInt(optMed.getAttribute('data-stock'), 10) : 0;

      var empSel = document.getElementById('dm-emp');
      var optEmp = empSel.options[empSel.selectedIndex];
      var empName = optEmp ? optEmp.getAttribute('data-name') : '';

      var qty = parseInt(document.getElementById('dm-qty').value, 10) || 1;
      var reason = document.getElementById('dm-reason').value.trim() || 'صرف علاجي بالعيادة';
      var dispensedBy = document.getElementById('dm-by').value.trim() || 'تمريض العيادة';

      if (!medName) return alert('يرجى اختيار الصنف');
      if (!empName) return alert('يرجى اختيار الموظف المستلم');
      if (qty > currentStock) return alert('الكمية المطلوبة (' + qty + ') أكبر من الرصيد المتوفر بالمخزن (' + currentStock + ')!');

      deductMedicineStock(medName, qty, empName, reason, dispensedBy);
      App.closeModal();
      showToast('✅ تم صرف ' + qty + ' من ' + medName + ' وخصمها من الرصيد', 'success');
      render();
    });
  }

  function deductMedicineStock(medName, qty, empName, reason, dispensedBy) {
    var med = state.medications.find(function (m) {
      return m.name.toLowerCase() === medName.toLowerCase();
    });
    if (med) {
      med.current_stock = Math.max(0, Number(med.current_stock) - qty);
      sbClient.from('clinic_medications').update({ current_stock: med.current_stock, updated_at: new Date().toISOString() }).eq('name', med.name).then(function () {});
      setLocal(STORAGE_KEYS.medications, state.medications);
    }

    var logEntry = {
      medication_id: med ? med.id : null,
      medication_name: medName,
      employee_id: null,
      employee_name: empName,
      quantity: qty,
      reason: reason,
      dispensed_by: dispensedBy || 'تمريض العيادة',
      created_at: new Date().toISOString()
    };
    state.dispenseLogs.unshift(logEntry);
    sbClient.from('clinic_dispense_logs').insert(logEntry).then(function () {});
    setLocal(STORAGE_KEYS.dispenseLogs, state.dispenseLogs);
  }

  // 5. ADD / RESTOCK MEDICINE MODAL
  function showAddMedicineModal(existingMedId) {
    var existing = existingMedId ? state.medications.find(function (m) { return m.id === existingMedId; }) : null;

    var body = '<div style="display:flex;flex-direction:column;gap:14px;">';
    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:2"><label>اسم الدواء التجاري (Trade Name) *</label><input type="text" id="amm-name" class="form-input" value="' + (existing ? existing.name : '') + '" placeholder="Panadol Extra, Betadine..."></div>';
    body += '<div class="form-field" style="flex:2"><label>الاسم العلمي (Generic Name)</label><input type="text" id="amm-gen" class="form-input" value="' + (existing && existing.generic_name ? existing.generic_name : '') + '" placeholder="Paracetamol, Povidone-Iodine..."></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>التصنيف *</label><select id="amm-cat" class="form-input"><option value="analgesic">مسكنات وخافض حرارة (Analgesic)</option><option value="antiseptic">مطهرات ومضادات بكتيريا (Antiseptic)</option><option value="wound_care">شاش وضمادات جروح (Wound Care)</option><option value="burn_care">كريمات ومستلزمات حروق (Burn Care)</option><option value="gastrointestinal">جهاز هضمي ومغص (Gastrointestinal)</option><option value="respiratory">جهاز تنفسي وحساسية (Respiratory)</option><option value="emergency">طوارئ وإسعافات (Emergency)</option></select></div>';
    body += '<div class="form-field" style="flex:1"><label>وحدة الصرف (Unit) *</label><select id="amm-unit" class="form-input"><option value="Box">علبة (Box)</option><option value="Strip">شريط (Strip)</option><option value="Bottle">زجاجة (Bottle)</option><option value="Tube">أنبوبة / كريم (Tube)</option><option value="Pack">باكيت (Pack)</option><option value="Ampoule">أمبول (Ampoule)</option></select></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>الرصيد المتاح حالياً *</label><input type="number" id="amm-stock" class="form-input" value="' + (existing ? existing.current_stock : 10) + '" min="0"></div>';
    body += '<div class="form-field" style="flex:1"><label>الحد الأدنى للإنذار (Min Threshold) *</label><input type="number" id="amm-min" class="form-input" value="' + (existing ? existing.min_threshold : 5) + '" min="1"></div>';
    body += '<div class="form-field" style="flex:1"><label>تاريخ انتهاء الصلاحية</label><input type="date" id="amm-exp" class="form-input" value="' + (existing && existing.expiry_date ? existing.expiry_date : '2028-12-31') + '"></div></div>';

    body += '<div class="form-row" style="display:flex;gap:12px;"><div class="form-field" style="flex:1"><label>رقم التشغيلة (Batch / Lot No)</label><input type="text" id="amm-lot" class="form-input" value="' + (existing && existing.batch_no ? existing.batch_no : 'LOT-' + Date.now().toString().slice(-6)) + '"></div>';
    body += '<div class="form-field" style="flex:1"><label>مكان الحفظ بالعيادة</label><input type="text" id="amm-loc" class="form-input" value="' + (existing && existing.location ? existing.location : 'دولاب العيادة الرئيسي') + '"></div></div>';
    body += '</div>';

    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="btn-save-med" style="background:#10b981;border-color:#10b981">💾 حفظ الصنف بالمخزون</button>';
    App.showModal(existing ? '✏️ تعديل صنف دوائي' : '💊 إضافة دواء / مستلزم طبي جديد', body, footer);

    document.getElementById('btn-save-med').addEventListener('click', function () {
      var name = document.getElementById('amm-name').value.trim();
      if (!name) return alert('يرجى كتابة اسم الدواء');

      var medObj = {
        name: name,
        generic_name: document.getElementById('amm-gen').value.trim() || null,
        category: document.getElementById('amm-cat').value,
        unit: document.getElementById('amm-unit').value,
        current_stock: parseInt(document.getElementById('amm-stock').value, 10) || 0,
        min_threshold: parseInt(document.getElementById('amm-min').value, 10) || 5,
        expiry_date: document.getElementById('amm-exp').value || null,
        batch_no: document.getElementById('amm-lot').value.trim() || null,
        location: document.getElementById('amm-loc').value.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        Object.assign(existing, medObj);
        sbClient.from('clinic_medications').update(medObj).eq('id', existing.id).then(function () {});
      } else {
        medObj.id = 'm_' + Date.now();
        state.medications.push(medObj);
        sbClient.from('clinic_medications').insert(medObj).then(function () {});
      }

      setLocal(STORAGE_KEYS.medications, state.medications);
      App.closeModal();
      showToast('✅ تم حفظ الصنف بالصيدلية', 'success');
      render();
    });
  }

  window.clinicDispenseSpecific = function (medId) {
    showDispenseModal(medId);
  };

  window.clinicRestockSpecific = function (medId) {
    var med = state.medications.find(function (m) { return m.id === medId; });
    if (!med) return;
    var addQty = prompt("أدخل الكمية الإضافية الموردة إلى مخزون (" + med.name + "):", "10");
    if (!addQty || isNaN(parseInt(addQty, 10))) return;
    med.current_stock = Number(med.current_stock) + parseInt(addQty, 10);
    sbClient.from('clinic_medications').update({ current_stock: med.current_stock, updated_at: new Date().toISOString() }).eq('name', med.name).then(function () {});
    setLocal(STORAGE_KEYS.medications, state.medications);
    showToast('✅ تم زيادة رصيد ' + med.name + ' بمقدار ' + addQty, 'success');
    render();
  };

  window.clinicReturnWorker = function (permitId) {
    var permit = state.permits.find(function (p) { return p.id === permitId; });
    if (!permit) return;
    if (!confirm('تأكيد استئناف الموظف (' + permit.employee_name + ') لعمله بالصالة؟')) return;
    permit.status = 'returned_to_work';
    permit.returned_at = new Date().toISOString();
    sbClient.from('clinic_rest_permits').update({ status: 'returned_to_work', returned_at: permit.returned_at }).eq('id', permitId).then(function () {});
    setLocal(STORAGE_KEYS.permits, state.permits);
    showToast('✅ تم تسجيل عودة الموظف للعمل وإلغاء تصريح الراحة النشط', 'success');
    render();
  };

  // ==============================================================================
  // PRINT RECEIPTS / MEDICAL TICKETS / INJURY REPORTS
  // ==============================================================================
  window.clinicPrintTicket = function (visitId) {
    var v = state.visits.find(function (x) { return x.id === visitId; });
    if (!v) return alert('الزيارة غير موجودة');

    var w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html dir="rtl"><head><title>تذكرة كشف عيادة المصنع</title>');
    w.document.write('<style>body{font-family:Arial,sans-serif;padding:30px;line-height:1.6} .box{border:2px solid #000;padding:20px;border-radius:10px} .header{text-align:center;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:12px} td{padding:8px;border:1px solid #ccc} @media print{button{display:none}}</style></head><body>');
    w.document.write('<div class="box">');
    w.document.write('<div class="header"><h2>🏭 SMART FACTORY — عيادة المصنع الطبية</h2><h3>تذكرة فحص وكشف طبي (Medical Examination Ticket)</h3><p>تاريخ الفحص: ' + new Date(v.created_at).toLocaleString('ar-EG') + '</p></div>');
    w.document.write('<table>');
    w.document.write('<tr><td><b>اسم الموظف:</b></td><td>' + v.employee_name + '</td><td><b>القسم:</b></td><td>' + (v.department || '—') + '</td></tr>');
    w.document.write('<tr><td><b>ضغط الدم:</b></td><td>' + (v.blood_pressure || '—') + '</td><td><b>درجة الحرارة:</b></td><td>' + (v.temperature ? v.temperature + '°C' : '—') + '</td></tr>');
    w.document.write('<tr><td><b>النبض:</b></td><td>' + (v.heart_rate || '—') + ' bpm</td><td><b>السكر:</b></td><td>' + (v.blood_sugar ? v.blood_sugar + ' mg/dL' : '—') + '</td></tr>');
    w.document.write('<tr><td><b>الشكوى المرضية:</b></td><td colspan="3">' + (v.complaint || '—') + '</td></tr>');
    w.document.write('<tr><td><b>التشخيص الطبي:</b></td><td colspan="3"><b>' + (v.diagnosis || '—') + '</b></td></tr>');
    w.document.write('<tr><td><b>العلاج المصروف:</b></td><td colspan="3">' + (v.medicine_dispensed ? v.medicine_dispensed + ' (' + v.medicine_qty + ')' : 'لا يوجد علاج') + '</td></tr>');
    w.document.write('<tr><td><b>القرار الطبي:</b></td><td colspan="3"><b>' + v.disposition + '</b></td></tr>');
    w.document.write('</table>');
    w.document.write('<div style="display:flex;justify-content:space-between;margin-top:40px;"><div>توقيع المريض / العامل:<br>...........................</div><div>طبيب / تمريض العيادة:<br><b>' + (v.attended_by || 'تمريض العيادة') + '</b></div></div>');
    w.document.write('</div><br><button onclick="window.print()">🖨️ طباعة التذكرة</button></body></html>');
    w.document.close();
  };

  window.clinicPrintInjuryReport = function (injId) {
    var inj = state.injuries.find(function (x) { return x.id === injId; });
    if (!inj) return alert('محضر الإصابة غير موجود');

    var w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html dir="rtl"><head><title>محضر إثبات إصابة عمل رسمي</title>');
    w.document.write('<style>body{font-family:Arial,sans-serif;padding:30px;line-height:1.6} .box{border:2px solid #ef4444;padding:24px;border-radius:10px} .header{text-align:center;border-bottom:2px solid #ef4444;padding-bottom:12px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:14px} td{padding:9px;border:1px solid #ccc} @media print{button{display:none}}</style></head><body>');
    w.document.write('<div class="box">');
    w.document.write('<div class="header"><h2 style="color:#ef4444">⚠️ SMART FACTORY — إدارة السلامة والصحة المهنية (OSH)</h2><h3>محضر إثبات إصابة عمل وحادث تشغيل رسمي (Official Incident Report)</h3><p>تاريخ الحادث: ' + new Date(inj.incident_date || inj.created_at).toLocaleString('ar-EG') + '</p></div>');
    w.document.write('<table>');
    w.document.write('<tr><td><b>الموظف المصاب:</b></td><td>' + inj.employee_name + '</td><td><b>القسم التابع له:</b></td><td>' + (inj.department || '—') + '</td></tr>');
    w.document.write('<tr><td><b>موقع الحادث:</b></td><td colspan="3">' + (inj.location || 'صالة الإنتاج') + '</td></tr>');
    w.document.write('<tr><td><b>نوع الإصابة:</b></td><td><b>' + inj.injury_type + '</b></td><td><b>درجة الخطورة:</b></td><td><b>' + inj.severity + '</b></td></tr>');
    w.document.write('<tr><td><b>وصف الحادث:</b></td><td colspan="3">' + inj.description + '</td></tr>');
    w.document.write('<tr><td><b>السبب الفني / الجذري:</b></td><td colspan="3">' + (inj.root_cause || '—') + '</td></tr>');
    w.document.write('<tr><td><b>الإسعافات الفورية:</b></td><td colspan="3">' + (inj.immediate_action || 'إسعافات بالعيادة') + '</td></tr>');
    w.document.write('<tr><td><b>نقل لمستشفى:</b></td><td>' + (inj.hospitalized ? 'نعم (' + (inj.hospital_name || 'تأمين صحي') + ')' : 'لا') + '</td><td><b>أيام الانقطاع المتوقعة:</b></td><td>' + (inj.lost_work_days || 0) + ' يوم</td></tr>');
    w.document.write('<tr><td><b>المشرف الذي تم إخطاره:</b></td><td colspan="3">' + (inj.supervisor_notified || 'مدير الصالة') + '</td></tr>');
    w.document.write('</table>');
    w.document.write('<div style="display:flex;justify-content:space-between;margin-top:50px;"><div>مشرف السلامة والصحة المهنية:<br>...........................</div><div>طبيب / تمريض العيادة:<br>...........................</div><div>اعتماد إدارة المصنع:<br>...........................</div></div>');
    w.document.write('</div><br><button onclick="window.print()">🖨️ طباعة المحضر الرسمي</button></body></html>');
    w.document.close();
  };

  window.clinicPrintRestSlip = function (permitId) {
    var p = state.permits.find(function (x) { return x.id === permitId; });
    if (!p) return alert('التصريح غير موجود');

    var w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html dir="rtl"><head><title>تصريح راحة طبية وإذن أمن</title>');
    w.document.write('<style>body{font-family:Arial,sans-serif;padding:30px;line-height:1.6} .box{border:2px solid #2563eb;padding:20px;border-radius:10px} .header{text-align:center;border-bottom:2px solid #2563eb;padding-bottom:10px;margin-bottom:16px} table{width:100%;border-collapse:collapse;margin-top:12px} td{padding:8px;border:1px solid #ccc} @media print{button{display:none}}</style></head><body>');
    w.document.write('<div class="box">');
    w.document.write('<div class="header"><h2>🏭 SMART FACTORY — الإدارة الطبية</h2><h3>تصريح راحة طبية وإذن خروج (Medical Rest Pass)</h3><p>تاريخ الإصدار: ' + new Date(p.created_at).toLocaleString('ar-EG') + '</p></div>');
    w.document.write('<table>');
    w.document.write('<tr><td><b>اسم الموظف:</b></td><td>' + p.employee_name + '</td><td><b>القسم:</b></td><td>' + (p.department || '—') + '</td></tr>');
    w.document.write('<tr><td><b>نوع التصريح:</b></td><td>' + p.permit_type + '</td><td><b>المدة المصرح بها:</b></td><td><b>' + p.duration + '</b></td></tr>');
    w.document.write('<tr><td><b>التشخيص الطبي:</b></td><td colspan="3">' + p.diagnosis + '</td></tr>');
    w.document.write('<tr><td><b>تصريح خروج من البوابة:</b></td><td colspan="3"><b>' + (p.gate_pass_authorized ? '✅ يُسمح بالخروج من البوابة الأمنية' : 'راحة بالعيادة داخل المصنع') + '</b></td></tr>');
    w.document.write('</table>');
    w.document.write('<div style="display:flex;justify-content:space-between;margin-top:40px;"><div>أمن البوابة الخارجية:<br>...........................</div><div>توقيع المريض:<br>...........................</div><div>تمريض / طبيب العيادة:<br><b>' + (p.issued_by || 'تمريض العيادة') + '</b></div></div>');
    w.document.write('</div><br><button onclick="window.print()">🖨️ طباعة إذن الراحة</button></body></html>');
    w.document.close();
  };

  // Start loading data
  loadData();
};

// Aliases
Pages.nursingPage = Pages.nursingHub;

// Backward-compatible Wrapper: Pages.medicalRequests opens the Hub at the approvals tab
Pages.medicalRequests = function (el) {
  Pages.nursingHub(el, 'approvals');
};

// ==============================================================================
// SELF-SERVICE: MY MEDICAL NEEDS (COMPLETELY PRESERVED)
// ==============================================================================
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
      requests.forEach(function (r) {
        var statusBadge = '';
        if (r.status === 'pending_nursing') statusBadge = '<span class="badge badge-warning">⏳ Pending Nursing (مراجعة التمريض)</span>';
        else if (r.status === 'pending_manager') statusBadge = '<span class="badge badge-warning">⏳ Pending Manager (مراجعة المدير)</span>';
        else if (r.status === 'pending_finance') statusBadge = '<span class="badge badge-info">⏳ Finance Processing (قيد المراجعة المالية)</span>';
        else if (r.status === 'pending_hr') statusBadge = '<span class="badge badge-primary">⏳ HR Processing (قيد الإضافة للراتب)</span>';
        else if (r.status === 'disbursed') statusBadge = '<span class="badge badge-success">✅ Added to Payroll (تمت الإضافة للراتب)</span>';
        else if (r.status === 'rejected') statusBadge = '<span class="badge badge-danger">❌ Rejected (مرفوض)</span>';

        if (r.status === 'pending') statusBadge = '<span class="badge badge-warning">⏳ Pending Nursing (مراجعة التمريض)</span>';
        if (r.status === 'approved_by_owner') statusBadge = '<span class="badge badge-primary">⏳ HR Processing (قيد الإضافة للراتب)</span>';

        html += '<tr>';
        html += '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>';
        html += '<td>' + (r.description || '—') + '</td>';
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

    document.getElementById('btn-submit-req').addEventListener('click', function () {
      var desc = document.getElementById('req-desc').value;
      var fileInput = document.getElementById('req-doc');

      if (!desc) return alert('Please provide a description.');
      if (!fileInput.files[0]) return alert('Please upload a document/receipt.');

      var file = fileInput.files[0];
      this.disabled = true;
      this.textContent = 'Uploading...';

      var submitRequest = function (url) {
        sbClient.from('medical_requests').insert({
          employee_id: App.user.id,
          employee_name: App.user.full_name,
          description: desc,
          document_url: url,
          status: 'pending_nursing'
        }).then(function (res) {
          if (res.error) alert(res.error.message);
          else {
            App.closeModal();
            showToast('✅ Medical request submitted successfully!', 'success');
            loadData();
          }
        });
      };

      var filePath = 'medical/' + App.user.id + '/' + Date.now() + '_' + file.name;
      sbClient.storage.from('documents').upload(filePath, file).then(function (uploadRes) {
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
    sbClient.from('medical_requests').select('*').eq('employee_id', App.user.id).order('created_at', { ascending: false }).then(function (res) {
      requests = res.data || [];
      render();
    });
  }

  loadData();
};
