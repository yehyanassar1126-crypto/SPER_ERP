// ===== ERP MODULE: Quality (الجودة) =====
window.Pages = window.Pages || {};

Pages.quality = function(el) {
  var isOwner = App.isOwner();
  var isQuality = App.user && (App.user.department === 'Quality' || App.user.role === 'qc inspector' || App.user.role === 'quality manager');
  var canEdit = isOwner || isQuality;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Quality Control department.</p></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة الجودة (Quality Control)</h1><p>فحص المنتجات التامة</p></div></div>';
    html += '<div id="quality-content" style="margin-top:20px;">Loading Products...</div>';
    el.innerHTML = html;

    if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');

    SalesWorkflow.loadOrders(function(orders) {
      // Quality only cares about inspection statuses
      var relevantOrders = orders.filter(function(o) { 
        return o.status === 'Under Quality Inspection' || 
               o.status === 'Quality Accepted' || 
               o.status === 'Quality Rejected' ||
               o.status === 'Ready For Delivery'; 
      });
      
      if (relevantOrders.length === 0) {
        document.getElementById('quality-content').innerHTML = '<div class="empty-state">لا توجد منتجات بانتظار الفحص</div>';
        return;
      }

      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>المنتج للتفتيش</th><th>الكمية المنتجة</th><th>الحالة</th><th>ملاحظات الفحص</th><th>قرار الجودة</th></tr></thead><tbody>';
      relevantOrders.forEach(function(o) {
        var qtyToProduce = o.quantity_available !== null ? o.quantity_available : o.quantity_requested;
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong style="color:var(--accent-primary);font-size:1.1rem">' + o.product_name + '</strong></td>';
        tHtml += '<td><strong style="font-size:1.2rem">' + qtyToProduce + '</strong></td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        tHtml += '<td>' + (o.rejection_reason || '-') + '</td>';
        
        var actions = '';
        if (o.status === 'Under Quality Inspection') {
          actions += '<div style="display:flex;gap:10px">';
          actions += '<button class="btn btn-sm btn-success" onclick="window.qualAccept(\''+o.id+'\')">✅ Accept (مطابق)</button>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.qualReject(\''+o.id+'\')">❌ Not Accept (غير مطابق)</button>';
          actions += '</div>';
        } else {
          actions += '<span style="color:var(--text-muted)">اكتمل الفحص</span>';
        }
        
        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table></div>';
      document.getElementById('quality-content').innerHTML = tHtml;
    });
  }

  window.qualAccept = function(id) {
    if(!confirm('اعتماد المنتج كمطابق للمواصفات وتحويله للتخطيط/التسليم؟')) return;
    SalesWorkflow.updateStatus(id, 'Quality Accepted', { rejection_reason: 'مطابق للمواصفات' }, render);
  };

  window.qualReject = function(id) {
    var reason = prompt('يرجى كتابة سبب عدم المطابقة للإنتاج (سيتم إعادة المنتج للإنتاج للتعديل):');
    if(!reason) return;
    SalesWorkflow.updateStatus(id, 'Quality Rejected', { rejection_reason: reason }, render);
  };

  window.qualSpareCheck = function(id) {
    var body = '<div class="grid-2">';
    body += '<div class="form-field"><label>نسبة العمر التشغيلي (Life Time %) *</label><select id="q-sp-lt" class="form-input"><option value="100">100% (انتهى عمرها بالكامل)</option><option value="75">75% (استهلاك مرتفع)</option><option value="50">50% (استهلاك متوسط)</option><option value="25">25% (تلف مبكر)</option><option value="10">أقل من 25% (عيب/سوء استخدام)</option></select></div>';
    body += '<div class="form-field"><label>نوع التلف *</label><input type="text" id="q-sp-dmg-type" class="form-input" placeholder="كسر، احتراق، تآكل..."></div>';
    body += '</div>';
    
    body += '<div class="grid-2">';
    body += '<div class="form-field"><label>طبيعة التلف *</label><select id="q-sp-nat" class="form-input"><option value="true">تلف طبيعي (Natural Wear)</option><option value="false">سوء استخدام (Misuse)</option></select></div>';
    body += '<div class="form-field"><label>إمكانية الإصلاح *</label><select id="q-sp-rep" class="form-input"><option value="false">لا (إعدام)</option><option value="true">نعم (قابلة للإصلاح)</option></select></div>';
    body += '</div>';

    body += '<div class="form-field"><label>سبب التلف المفصل</label><textarea id="q-sp-reas" class="form-input" rows="2"></textarea></div>';
    body += '<div class="form-field"><label>ملاحظات الجودة</label><textarea id="q-sp-notes" class="form-input" rows="2"></textarea></div>';

    App.showModal('فحص وتقييم قطعة الغيار التالفة', body, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="q-sp-qc-save">حفظ واعتماد التقرير</button>', true);
    
    document.getElementById('q-sp-qc-save').onclick = function() {
      var lt = document.getElementById('q-sp-lt').value;
      var dtype = document.getElementById('q-sp-dmg-type').value;
      var nat = document.getElementById('q-sp-nat').value === 'true';
      var rep = document.getElementById('q-sp-rep').value === 'true';
      var reas = document.getElementById('q-sp-reas').value;
      var notes = document.getElementById('q-sp-notes').value;

      sbClient.from('spare_parts_requests').update({
        status: 'quality_checked',
        quality_checked_at: new Date().toISOString(),
        quality_checked_by: App.user.id,
        life_time_percentage: lt,
        damage_type: dtype,
        is_natural_wear: nat,
        is_repairable: rep,
        damage_reason: reas,
        quality_notes: notes
      }).eq('id', id).then(function(res) {
        if(res.error) return alert(res.error.message);

        // Auto-update life_time_percentage in inventory_items for this item name
        // 1. Get the spare part request to know item_name
        sbClient.from('spare_parts_requests').select('item_name').eq('id', id).single().then(function(spRes) {
          if(spRes.error || !spRes.data) return;
          var itemName = spRes.data.item_name;

          // 2. Fetch all completed quality checks for this item to recalculate average
          sbClient.from('spare_parts_requests')
            .select('life_time_percentage')
            .eq('status', 'quality_checked')
            .ilike('item_name', itemName)
            .then(function(allChecks) {
              if(allChecks.error || !allChecks.data || allChecks.data.length === 0) return;
              var totalLife = allChecks.data.reduce(function(sum, r) { return sum + Number(r.life_time_percentage || 0); }, 0);
              var avgLife = Math.round(totalLife / allChecks.data.length);

              // 3. Update inventory_items where name matches
              sbClient.from('inventory_items')
                .update({ life_time_percentage: avgLife })
                .ilike('name', itemName)
                .then(function() {
                  // Done silently
                });
            });
        });

        App.closeModal(); render(); showToast('تم إضافة فحص الجودة وتحديث نسبة العمر في المخزن', 'success');
      });
    };
  };

  render();
};
