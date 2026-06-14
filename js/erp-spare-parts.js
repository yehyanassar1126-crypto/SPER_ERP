window.Pages = window.Pages || {};

Pages.spareParts = function(el) {
  var isOwner = App.isOwner();
  var isHR = App.isHR();
  var isManager = App.isManager();
  
  var isSparePartsInspector = App.user && App.user.role === 'spare parts inspector' && App.user.department === 'Engineering';
  var isWarehouse = App.user && App.user.department === 'Warehouse';
  var isMaintenance = App.user && App.user.department === 'Maintenance';
  var isLogistics = App.user && App.user.department === 'Logistics';

  var canRequest = true; // Any employee could potentially request, but mostly Maintenance/Logistics
  var canApprove = isManager || isOwner || isHR || isWarehouse;
  var canIssue = isWarehouse || isOwner;
  var canCheckQuality = isSparePartsInspector || isOwner;

  var requests = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px; text-align:center; color:var(--text-muted)">Loading Spare Parts Data...</div>';
    sbClient.from('spare_parts_requests').select('*').order('created_at', {ascending: false}).then(function(res) {
      if (res.error && res.error.message.includes('relation "spare_parts_requests" does not exist')) {
        renderSetup();
        return;
      }
      if (res.error) {
        return alert(res.error.message);
      }
      requests = res.data || [];
      render();
    });
  }

  function renderSetup() {
    var html = '<div style="padding:40px; text-align:center;"><h2>⚠️ جدول دورة قطع الغيار غير موجود</h2>';
    html += '<p>قم بتشغيل ملف <b>setup_spare_parts.sql</b> في قاعدة البيانات أو اتصل بالدعم الفني.</p>';
    html += '<button class="btn btn-primary" onclick="window.Pages.spareParts(document.getElementById(\'page-content\'))" style="margin-top:20px">تحديث الصفحة بعد الإضافة</button></div>';
    el.innerHTML = html;
  }

  function render() {
    var html = '<div class="toolbar" style="display:flex; justify-content:space-between; margin-bottom: 24px;">';
    html += '<h3>Spare Parts Lifecycle (دورة قطع الغيار)</h3>';
    html += '<div style="display:flex; gap:10px">';
    html += '<button class="btn btn-outline" id="tab-reqs" style="border-color:var(--accent-primary);color:var(--accent-primary)">🔄 طلبات ومتابعة القطع</button>';
    if (isOwner || isManager || isHR || isSparePartsInspector) {
      html += '<button class="btn btn-ghost" id="tab-reports">📊 تقارير الاستهلاك والفحص</button>';
    }
    html += '<button class="btn btn-primary" onclick="window.spNewRequest()">' + icon('plus') + ' طلب قطعة غيار</button>';
    html += '</div></div>';

    // ---- TAB 1: Requests & Workflow ----
    html += '<div id="view-reqs">';
    html += '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>الموظف/القسم</th><th>المعدة/السيارة</th><th>القطعة المطلوبة</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>';
    
    if (requests.length === 0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:20px">لا توجد طلبات.</td></tr>';
    }

    requests.forEach(function(req) {
      // Filter visibility based on role if needed. Let's allow view of own requests, or department's, or all if mgr/warehouse/quality
      if (!isOwner && !isHR && !isWarehouse && !isSparePartsInspector && !isManager) {
        if (req.requested_by !== App.user.id) return; // Regular employee sees only theirs
      }

      var statusColor = 'secondary';
      var statusText = 'Pending Approval';
      if (req.status === 'pending_approval') { statusColor = 'warning'; statusText = 'في انتظار الاعتماد'; }
      if (req.status === 'approved') { statusColor = 'info'; statusText = 'معتمد (في انتظار الصرف)'; }
      if (req.status === 'issued') { statusColor = 'primary'; statusText = 'تم الصرف (في انتظار التالف)'; }
      if (req.status === 'damaged_returned') { statusColor = 'secondary'; statusText = 'تم تسليم التالف (في انتظار الفحص)'; }
      if (req.status === 'quality_checked') { statusColor = 'success'; statusText = 'تم الفحص والاغلاق'; }

      html += '<tr>';
      html += '<td>' + formatDate(req.created_at) + '</td>';
      html += '<td>' + req.requested_by_name + '<br><small>' + (req.department || '') + '</small></td>';
      html += '<td style="font-weight:600">' + (req.machine_or_vehicle || '-') + '</td>';
      html += '<td>' + req.item_name + ' <small>(الكمية: ' + req.requested_quantity + ')</small></td>';
      html += '<td><span class="badge badge-' + statusColor + '">' + statusText + '</span></td>';
      
      html += '<td>';
      if (req.status === 'pending_approval' && canApprove) {
        html += '<button class="btn btn-sm btn-success" onclick="window.spUpdateStatus(\'' + req.id + '\', \'approved\')">اعتماد</button>';
      } else if (req.status === 'approved' && canIssue) {
        html += '<button class="btn btn-sm btn-info" onclick="window.spIssuePart(\'' + req.id + '\')">صرف القطعة الجديدة</button>';
      } else if (req.status === 'issued' && canIssue) {
        html += '<button class="btn btn-sm btn-warning" onclick="window.spReceiveDamaged(\'' + req.id + '\')">استلام التالف</button>';
      } else if (req.status === 'damaged_returned' && canCheckQuality) {
        html += '<button class="btn btn-sm btn-primary" onclick="window.spQualityCheck(\'' + req.id + '\')">فحص القطعة</button>';
      } else if (req.status === 'quality_checked') {
        html += '<button class="btn btn-sm btn-ghost" onclick="window.spViewDetails(\'' + req.id + '\')">عرض التفاصيل</button>';
      } else {
        html += '<span style="color:var(--text-muted);font-size:0.8rem">جاري المتابعة...</span>';
      }
      html += '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div></div>';

    // ---- TAB 2: Reports ----
    if (isOwner || isManager || isHR || isSparePartsInspector) {
      html += '<div id="view-reports" style="display:none">';
      html += renderReports();
      html += '</div>';
    }

    el.innerHTML = html;

    // Tab Logic
    var tabReqs = document.getElementById('tab-reqs');
    var tabReports = document.getElementById('tab-reports');
    if (tabReqs && tabReports) {
      tabReqs.addEventListener('click', function() {
        tabReqs.className = 'btn btn-outline'; tabReqs.style.borderColor = 'var(--accent-primary)'; tabReqs.style.color = 'var(--accent-primary)';
        tabReports.className = 'btn btn-ghost'; tabReports.style.borderColor = 'transparent'; tabReports.style.color = 'inherit';
        document.getElementById('view-reqs').style.display = 'block';
        document.getElementById('view-reports').style.display = 'none';
      });
      tabReports.addEventListener('click', function() {
        tabReports.className = 'btn btn-outline'; tabReports.style.borderColor = 'var(--accent-primary)'; tabReports.style.color = 'var(--accent-primary)';
        tabReqs.className = 'btn btn-ghost'; tabReqs.style.borderColor = 'transparent'; tabReqs.style.color = 'inherit';
        document.getElementById('view-reports').style.display = 'block';
        document.getElementById('view-reqs').style.display = 'none';
      });
    }
  }

  function renderReports() {
    var completedReqs = requests.filter(function(r) { return r.status === 'quality_checked'; });
    
    // Calculate stats
    var stats = {
      avgLifeTime: 0,
      misuseCount: 0,
      repairableCount: 0,
      byDepartment: {},
      byItem: {}
    };

    if (completedReqs.length > 0) {
      var totalLifeTime = 0;
      completedReqs.forEach(function(r) {
        totalLifeTime += Number(r.life_time_percentage || 0);
        if (r.is_natural_wear === false) stats.misuseCount++;
        if (r.is_repairable === true) stats.repairableCount++;
        
        if (!stats.byDepartment[r.department]) stats.byDepartment[r.department] = 0;
        stats.byDepartment[r.department]++;
        
        if (!stats.byItem[r.item_name]) stats.byItem[r.item_name] = { count: 0, life: 0 };
        stats.byItem[r.item_name].count++;
        stats.byItem[r.item_name].life += Number(r.life_time_percentage || 0);
      });
      stats.avgLifeTime = Math.round(totalLifeTime / completedReqs.length);
    }

    var html = '<div class="grid-3" style="margin-bottom:20px">';
    html += '<div class="card"><div class="card-body"><h4>إجمالي القطع المستبدلة</h4><h2 style="color:var(--accent-primary)">' + completedReqs.length + '</h2></div></div>';
    html += '<div class="card"><div class="card-body"><h4>متوسط العمر التشغيلي</h4><h2 style="color:' + (stats.avgLifeTime >= 75 ? 'var(--accent-success)' : 'var(--accent-warning)') + '">' + stats.avgLifeTime + '%</h2></div></div>';
    html += '<div class="card"><div class="card-body"><h4>حالات سوء الاستخدام</h4><h2 style="color:var(--accent-danger)">' + stats.misuseCount + '</h2></div></div>';
    html += '</div>';

    html += '<div class="grid-2" style="margin-bottom:20px">';
    // Items Analysis
    html += '<div class="card"><div class="card-header"><h3>أكثر القطع استبدالاً</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>القطعة</th><th>العدد</th><th>متوسط العمر</th></tr></thead><tbody>';
    var topItems = Object.keys(stats.byItem).map(function(k) { return { name: k, count: stats.byItem[k].count, avg: Math.round(stats.byItem[k].life / stats.byItem[k].count) }; }).sort(function(a,b) { return b.count - a.count; });
    topItems.slice(0, 5).forEach(function(ti) {
      html += '<tr><td>' + ti.name + '</td><td>' + ti.count + '</td><td>' + ti.avg + '%</td></tr>';
    });
    if(topItems.length === 0) html += '<tr><td colspan="3" style="text-align:center">لا يوجد بيانات</td></tr>';
    html += '</tbody></table></div></div>';

    // Departments
    html += '<div class="card"><div class="card-header"><h3>الاستبدال حسب الأقسام</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>القسم</th><th>إجمالي القطع</th></tr></thead><tbody>';
    var topDepts = Object.keys(stats.byDepartment).map(function(k) { return { name: k, count: stats.byDepartment[k] }; }).sort(function(a,b) { return b.count - a.count; });
    topDepts.forEach(function(td) {
      html += '<tr><td>' + (td.name || 'غير محدد') + '</td><td>' + td.count + '</td></tr>';
    });
    if(topDepts.length === 0) html += '<tr><td colspan="2" style="text-align:center">لا يوجد بيانات</td></tr>';
    html += '</tbody></table></div></div>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><h3>سجل الفحص التفصيلي</h3></div><div class="card-body no-pad"><table class="data-table"><thead><tr><th>القطعة</th><th>المعدة/السيارة</th><th>تاريخ الفحص</th><th>العمر %</th><th>طبيعي/سوء استخدام</th><th>قابلة للإصلاح</th><th>سبب التلف</th></tr></thead><tbody>';
    completedReqs.forEach(function(r) {
      html += '<tr>';
      html += '<td>' + r.item_name + '</td>';
      html += '<td>' + (r.machine_or_vehicle || '-') + '</td>';
      html += '<td>' + formatDate(r.quality_checked_at) + '</td>';
      var lifeColor = r.life_time_percentage >= 75 ? 'success' : (r.life_time_percentage >= 50 ? 'warning' : 'danger');
      html += '<td><span style="color:var(--accent-' + lifeColor + ');font-weight:bold">' + r.life_time_percentage + '%</span></td>';
      html += '<td>' + (r.is_natural_wear ? '<span class="badge badge-success">طبيعي</span>' : '<span class="badge badge-danger">سوء استخدام</span>') + '</td>';
      html += '<td>' + (r.is_repairable ? 'نعم' : 'لا') + '</td>';
      html += '<td>' + (r.damage_reason || '-') + '</td>';
      html += '</tr>';
    });
    if(completedReqs.length === 0) html += '<tr><td colspan="7" style="text-align:center">لا يوجد سجلات.</td></tr>';
    html += '</tbody></table></div></div>';

    return html;
  }

  // --- ACTIONS ---

  window.spNewRequest = function() {
    var body = '<div class="form-field"><label>القطعة المطلوبة *</label><input type="text" id="sp-item" class="form-input"></div>';
    body += '<div class="form-field"><label>المعدة أو السيارة *</label><input type="text" id="sp-mach" class="form-input" placeholder="مثال: سيارة ربع نقل أ ب ج 123"></div>';
    body += '<div class="form-field"><label>الكمية *</label><input type="number" id="sp-qty" class="form-input" value="1" min="1"></div>';
    
    App.showModal('طلب قطعة غيار من المخزن', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="sp-save">إرسال الطلب</button>');
    document.getElementById('sp-save').onclick = function() {
      var item = document.getElementById('sp-item').value;
      var mach = document.getElementById('sp-mach').value;
      var qty = document.getElementById('sp-qty').value;
      if (!item || !mach) return alert('الرجاء إدخال اسم القطعة والمعدة/السيارة');

      sbClient.from('spare_parts_requests').insert({
        requested_by_name: App.user.full_name,
        department: App.user.department,
        machine_or_vehicle: mach,
        item_name: item,
        requested_quantity: qty,
        status: 'pending_approval'
      }).then(function(res) {
        if(res.error) return alert(res.error.message);
        App.closeModal(); loadData(); showToast('تم إرسال الطلب بنجاح', 'success');
      });
    };
  };

  window.spUpdateStatus = function(id, status) {
    if(!confirm('تأكيد الموافقة على طلب القطعة؟')) return;
    sbClient.from('spare_parts_requests').update({status: status}).eq('id', id).then(function(res) {
      if(res.error) return alert(res.error.message); loadData(); showToast('تم الاعتماد', 'success');
    });
  };

  window.spIssuePart = function(id) {
    var body = '<div class="form-field"><label>رقم تسلسل القطعة الجديدة (المنصرفة) *</label><input type="text" id="sp-new-num" class="form-input"></div>';
    body += '<p style="color:var(--accent-warning);font-size:0.9rem">لن يتم إغلاق العملية إلا بعد استلام القطعة التالفة القديمة.</p>';
    App.showModal('صرف القطعة الجديدة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-info" id="sp-issue-save">صرف القطعة</button>');
    
    document.getElementById('sp-issue-save').onclick = function() {
      var newNum = document.getElementById('sp-new-num').value;
      if (!newNum) return alert('أدخل رقم القطعة الجديدة');

      sbClient.from('spare_parts_requests').update({
        status: 'issued',
        new_part_number: newNum,
        issued_at: new Date().toISOString()
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);
        App.closeModal(); loadData(); showToast('تم صرف القطعة من المخزن', 'success');
      });
    };
  };

  window.spReceiveDamaged = function(id) {
    var body = '<div class="form-field"><label>رقم القطعة التالفة (المرتجعة) *</label><input type="text" id="sp-old-num" class="form-input"></div>';
    App.showModal('استلام القطعة التالفة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-warning" id="sp-rec-save">تأكيد الاستلام</button>');
    
    document.getElementById('sp-rec-save').onclick = function() {
      var oldNum = document.getElementById('sp-old-num').value;
      if (!oldNum) return alert('أدخل رقم القطعة التالفة');

      sbClient.from('spare_parts_requests').update({
        status: 'damaged_returned',
        old_part_number: oldNum,
        returned_at: new Date().toISOString()
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);
        App.closeModal(); loadData(); showToast('تم استلام القطعة التالفة وسيتم تحويلها للجودة', 'success');
      });
    };
  };

  window.spQualityCheck = function(id) {
    var body = '<div class="grid-2">';
    body += '<div class="form-field"><label>نسبة العمر التشغيلي (Life Time %) *</label><select id="sp-lt" class="form-input"><option value="100">100% (انتهى عمرها بالكامل)</option><option value="75">75% (استهلاك مرتفع)</option><option value="50">50% (استهلاك متوسط)</option><option value="25">25% (تلف مبكر)</option><option value="10">أقل من 25% (عيب/سوء استخدام)</option></select></div>';
    body += '<div class="form-field"><label>نوع التلف *</label><input type="text" id="sp-dmg-type" class="form-input" placeholder="كسر، احتراق، تآكل..."></div>';
    body += '</div>';
    
    body += '<div class="grid-2">';
    body += '<div class="form-field"><label>طبيعة التلف *</label><select id="sp-nat" class="form-input"><option value="true">تلف طبيعي (Natural Wear)</option><option value="false">سوء استخدام (Misuse)</option></select></div>';
    body += '<div class="form-field"><label>إمكانية الإصلاح *</label><select id="sp-rep" class="form-input"><option value="false">لا (إعدام)</option><option value="true">نعم (قابلة للإصلاح)</option></select></div>';
    body += '</div>';

    body += '<div class="form-field"><label>سبب التلف المفصل</label><textarea id="sp-reas" class="form-input" rows="2"></textarea></div>';
    body += '<div class="form-field"><label>الملاحظات الفنية</label><textarea id="sp-notes" class="form-input" rows="2"></textarea></div>';

    App.showModal('فحص القطعة التالفة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="sp-qc-save">حفظ تقرير الفحص وإغلاق العملية</button>', true);
    
    document.getElementById('sp-qc-save').onclick = function() {
      var lt = document.getElementById('sp-lt').value;
      var dtype = document.getElementById('sp-dmg-type').value;
      var nat = document.getElementById('sp-nat').value === 'true';
      var rep = document.getElementById('sp-rep').value === 'true';
      var reas = document.getElementById('sp-reas').value;
      var notes = document.getElementById('sp-notes').value;

      sbClient.from('spare_parts_requests').update({
        status: 'quality_checked',
        quality_checked_at: new Date().toISOString(),
        life_time_percentage: lt,
        damage_type: dtype,
        is_natural_wear: nat,
        is_repairable: rep,
        damage_reason: reas,
        quality_notes: notes
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);
        
        sbClient.from('spare_parts_requests').select('item_name').eq('id', id).single().then(function(spRes) {
          if(spRes.error || !spRes.data) return;
          var itemName = spRes.data.item_name;
          sbClient.from('spare_parts_requests').select('life_time_percentage').eq('status', 'quality_checked').ilike('item_name', itemName).then(function(allChecks) {
            if(allChecks.error || !allChecks.data || allChecks.data.length === 0) return;
            var totalLife = allChecks.data.reduce(function(sum, r) { return sum + Number(r.life_time_percentage || 0); }, 0);
            var avgLife = Math.round(totalLife / allChecks.data.length);
            sbClient.from('inventory_items').update({ life_time_percentage: avgLife }).ilike('name', itemName).then(function() {});
          });
        });

        App.closeModal(); loadData(); showToast('تم إغلاق العملية واعتماد التقرير الفني', 'success');
      });
    };
  };

  window.spViewDetails = function(id) {
    var req = requests.find(function(r) { return r.id === id; });
    if (!req) return;

    var body = '<div style="line-height:1.8; direction:rtl">';
    body += '<div class="grid-2" style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px">';
    body += '<div><b>الموظف:</b> ' + req.requested_by_name + '</div>';
    body += '<div><b>المعدة/السيارة:</b> ' + (req.machine_or_vehicle || '-') + '</div>';
    body += '<div><b>القطعة:</b> ' + req.item_name + '</div>';
    body += '<div><b>رقم القطعة الجديدة:</b> ' + (req.new_part_number || '-') + '</div>';
    body += '<div><b>رقم التالف:</b> ' + (req.old_part_number || '-') + '</div>';
    body += '</div>';

    body += '<h4 style="color:var(--accent-primary)">تقرير الفحص الفني</h4>';
    body += '<div class="grid-2">';
    body += '<div><b>العمر التشغيلي:</b> ' + (req.life_time_percentage || 0) + '%</div>';
    body += '<div><b>طبيعة التلف:</b> ' + (req.is_natural_wear ? '<span style="color:var(--accent-success)">طبيعي</span>' : '<span style="color:var(--accent-danger)">سوء استخدام</span>') + '</div>';
    body += '<div><b>قابل للإصلاح:</b> ' + (req.is_repairable ? 'نعم' : 'لا') + '</div>';
    body += '<div><b>نوع التلف:</b> ' + (req.damage_type || '-') + '</div>';
    body += '<div style="grid-column: span 2"><b>سبب التلف:</b> ' + (req.damage_reason || '-') + '</div>';
    body += '<div style="grid-column: span 2"><b>الملاحظات الفنية:</b> ' + (req.quality_notes || '-') + '</div>';
    body += '</div>';

    body += '</div>';

    App.showModal('تفاصيل عملية الاستبدال', body, '<button class="btn btn-outline" onclick="App.closeModal()">إغلاق</button>');
  };

  loadData();
};
