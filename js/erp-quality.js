// ===== ERP MODULE: Quality Control (الجودة) =====
// Responsibilities: Inspect incoming RAW MATERIALS + inspect FINISHED GOODS only.
// Spare parts inspection is FULLY handled by Spare Parts Inspector (Engineering dept).
window.Pages = window.Pages || {};

Pages.quality = function(el) {
  var isOwner = App.isOwner();
  var isQuality = App.user && (App.user.department === 'Quality' || App.user.role === 'qc inspector' || App.user.role === 'quality manager');
  var canEdit = isOwner || isQuality;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Quality Control department.</p></div>';
    return;
  }

  var currentTab = 'raw_materials';

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة الجودة (Quality Control)</h1>'
      + '<p>فحص المواد الخام الواردة • فحص المنتجات التامة</p></div></div>';

    // Tab switcher
    html += '<div class="tabs-container" style="margin:20px 0">';
    html += '<button class="tab-btn ' + (currentTab === 'raw_materials' ? 'active' : '') + '" onclick="window.qcSwitchTab(\'raw_materials\')">'
      + '📦 فحص المواد الخام الواردة</button>';
    html += '<button class="tab-btn ' + (currentTab === 'finished_goods' ? 'active' : '') + '" onclick="window.qcSwitchTab(\'finished_goods\')">'
      + '🏭 فحص المنتجات التامة</button>';
    html += '</div>';

    html += '<div id="quality-content" style="margin-top:16px">Loading...</div>';
    el.innerHTML = html;

    window.qcSwitchTab = function(tab) {
      currentTab = tab;
      render();
    };

    if (currentTab === 'raw_materials') {
      renderRawMaterialsQC();
    } else {
      renderFinishedGoodsQC();
    }
  }

  // ===== TAB 1: Raw Materials Incoming Inspection =====
  function renderRawMaterialsQC() {
    sbClient.from('raw_material_receipts')
      .select('*')
      .order('received_at', { ascending: false })
      .then(function(res) {
        if (res.error) {
          document.getElementById('quality-content').innerHTML =
            '<div class="empty-state" style="color:var(--accent-danger)">خطأ في تحميل البيانات: ' + res.error.message + '</div>';
          return;
        }

        var items = res.data || [];
        var pending = items.filter(function(i) { return i.status === 'pending_qc'; });
        var done = items.filter(function(i) { return i.status !== 'pending_qc'; });

        var html = '';

        // Pending inspection
        html += '<div class="card" style="margin-bottom:20px"><div class="card-header">'
          + '<h3>⏳ مواد خام بانتظار الفحص (' + pending.length + ')</h3></div>';
        html += '<div class="card-body">';

        if (pending.length === 0) {
          html += '<div class="empty-state">لا توجد مواد خام بانتظار الفحص</div>';
        } else {
          html += '<div class="table-responsive"><table class="data-table"><thead><tr>'
            + '<th>اسم المادة</th><th>المورد</th><th>الكمية المستلمة</th><th>تاريخ الاستلام</th><th>إجراء الفحص</th>'
            + '</tr></thead><tbody>';
          pending.forEach(function(item) {
            html += '<tr>';
            html += '<td><strong>' + item.item_name + '</strong></td>';
            html += '<td>' + (item.supplier_name || '-') + '</td>';
            html += '<td>' + item.quantity_received + ' ' + (item.unit || '') + '</td>';
            html += '<td>' + formatDate(item.received_at) + '</td>';
            html += '<td><button class="btn btn-sm btn-primary" onclick="window.qcInspectRawMaterial(\'' + item.id + '\',\'' + item.item_name + '\',' + item.quantity_received + ')">🔬 فحص</button></td>';
            html += '</tr>';
          });
          html += '</tbody></table></div>';
        }
        html += '</div></div>';

        // Done inspections
        if (done.length > 0) {
          html += '<div class="card"><div class="card-header"><h3>✅ سجل فحوصات المواد الخام</h3></div>';
          html += '<div class="card-body"><div class="table-responsive"><table class="data-table"><thead><tr>'
            + '<th>اسم المادة</th><th>المورد</th><th>الكمية المستلمة</th><th>الكمية المقبولة</th>'
            + '<th>نتيجة الفحص</th><th>المفتش</th><th>تاريخ الفحص</th>'
            + '</tr></thead><tbody>';
          done.forEach(function(item) {
            var statusColor = item.status === 'passed' ? '#22c55e' : (item.status === 'conditional' ? '#f59e0b' : '#ef4444');
            var statusLabel = item.status === 'passed' ? '✅ مقبول' : (item.status === 'conditional' ? '⚠️ مقبول بشروط' : '❌ مرفوض');
            html += '<tr>';
            html += '<td><strong>' + item.item_name + '</strong></td>';
            html += '<td>' + (item.supplier_name || '-') + '</td>';
            html += '<td>' + item.quantity_received + '</td>';
            html += '<td style="color:' + statusColor + ';font-weight:bold">' + (item.quantity_accepted || 0) + '</td>';
            html += '<td><span style="padding:3px 8px;border-radius:4px;background:' + statusColor + '20;color:' + statusColor + ';font-weight:bold">' + statusLabel + '</span></td>';
            html += '<td>' + (item.qc_inspector || '-') + '</td>';
            html += '<td>' + (item.qc_date ? formatDate(item.qc_date) : '-') + '</td>';
            html += '</tr>';
          });
          html += '</tbody></table></div></div></div>';
        }

        document.getElementById('quality-content').innerHTML = html;
      });
  }

  // ===== TAB 2: Finished Goods QC =====
  function renderFinishedGoodsQC() {
    if (!window.SalesWorkflow) {
      document.getElementById('quality-content').innerHTML = '<div class="empty-state">SalesWorkflow module not loaded</div>';
      return;
    }

    SalesWorkflow.loadOrders(function(orders) {
      var relevantOrders = orders.filter(function(o) {
        return o.status === 'Under Quality Inspection' ||
               o.status === 'Quality Accepted' ||
               o.status === 'Quality Rejected';
      });

      if (relevantOrders.length === 0) {
        document.getElementById('quality-content').innerHTML = '<div class="empty-state">لا توجد منتجات بانتظار الفحص</div>';
        return;
      }

      var html = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>تاريخ الطلب</th><th>المنتج</th><th>الكمية</th>'
        + '<th>الحالة</th><th>ملاحظات</th><th>قرار الجودة</th>'
        + '</tr></thead><tbody>';

      relevantOrders.forEach(function(o) {
        var qty = o.quantity_available !== null ? o.quantity_available : o.quantity_requested;
        html += '<tr>';
        html += '<td>' + formatDate(o.created_at) + '</td>';
        html += '<td><strong style="color:var(--accent-primary)">' + o.product_name + '</strong></td>';
        html += '<td><strong>' + qty + '</strong></td>';
        html += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        html += '<td>' + (o.rejection_reason || '-') + '</td>';

        var actions = '';
        if (o.status === 'Under Quality Inspection') {
          actions = '<div style="display:flex;gap:8px;flex-wrap:wrap">'
            + '<button class="btn btn-sm btn-success" onclick="window.qualAccept(\'' + o.id + '\')">✅ مطابق (Accept)</button>'
            + '<button class="btn btn-sm btn-warning" onclick="window.qualConditional(\'' + o.id + '\')">⚠️ مقبول بشروط</button>'
            + '<button class="btn btn-sm btn-danger" onclick="window.qualReject(\'' + o.id + '\')">❌ غير مطابق (Reject)</button>'
            + '</div>';
        } else {
          actions = '<span style="color:var(--text-muted)">اكتمل الفحص</span>';
        }

        html += '<td>' + actions + '</td>';
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      document.getElementById('quality-content').innerHTML = html;
    });
  }

  // ===== ACTIONS: Raw Material Inspection =====
  window.qcInspectRawMaterial = function(id, itemName, totalQty) {
    var body = '<div style="margin-bottom:12px;padding:10px;background:var(--bg-secondary);border-radius:8px">'
      + '<strong>المادة: ' + itemName + '</strong><br>'
      + '<span style="color:var(--text-muted)">الكمية المستلمة: ' + totalQty + '</span>'
      + '</div>';

    body += '<div class="form-field"><label>نتيجة الفحص *</label>'
      + '<select id="qc-rm-result" class="form-input" onchange="window.toggleRmFields()">'
      + '<option value="passed">✅ مقبول — إضافة للمخزن</option>'
      + '<option value="conditional">⚠️ مقبول بشروط — إضافة جزئية</option>'
      + '<option value="failed">❌ مرفوض — إرجاع للمورد</option>'
      + '</select></div>';

    body += '<div class="form-field" id="qc-rm-accepted-container"><label>الكمية المقبولة *</label>'
      + '<input type="number" id="qc-rm-accepted" class="form-input" value="' + totalQty + '" max="' + totalQty + '" min="0"></div>';

    body += '<div class="form-field" id="qc-rm-rejection-container" style="display:none">'
      + '<label>سبب الرفض *</label>'
      + '<textarea id="qc-rm-rejection" class="form-input" rows="2"></textarea></div>';

    body += '<div class="form-field"><label>ملاحظات الفحص</label>'
      + '<textarea id="qc-rm-notes" class="form-input" rows="2"></textarea></div>';

    window.toggleRmFields = function() {
      var result = document.getElementById('qc-rm-result').value;
      document.getElementById('qc-rm-accepted-container').style.display = result === 'failed' ? 'none' : 'block';
      document.getElementById('qc-rm-rejection-container').style.display = result === 'failed' ? 'block' : 'none';
      if (result === 'failed') document.getElementById('qc-rm-accepted').value = 0;
    };

    App.showModal('فحص المادة الخام الواردة', body,
      '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button>'
      + '<button class="btn btn-primary" id="qc-rm-save">حفظ نتيجة الفحص</button>');

    document.getElementById('qc-rm-save').onclick = function() {
      var result = document.getElementById('qc-rm-result').value;
      var accepted = Number(document.getElementById('qc-rm-accepted').value) || 0;
      var notes = document.getElementById('qc-rm-notes').value;
      var rejection = document.getElementById('qc-rm-rejection') ? document.getElementById('qc-rm-rejection').value : '';

      if (result !== 'failed' && accepted <= 0) return alert('يرجى إدخال الكمية المقبولة');
      if (result === 'failed' && !rejection) return alert('يرجى كتابة سبب الرفض');

      var btn = document.getElementById('qc-rm-save');
      btn.disabled = true; btn.innerHTML = 'جاري الحفظ...';

      sbClient.from('raw_material_receipts').update({
        status: result,
        qc_result: result,
        qc_notes: notes,
        qc_inspector: App.user.full_name,
        qc_date: new Date().toISOString(),
        quantity_accepted: accepted,
        rejection_reason: rejection || null
      }).eq('id', id).then(function(res) {
        if (res.error) { btn.disabled = false; btn.innerHTML = 'حفظ نتيجة الفحص'; return alert(res.error.message); }

        // If passed or conditional — add accepted quantity to inventory
        if (result !== 'failed' && accepted > 0) {
          // Try to find existing item in inventory
          sbClient.from('inventory_items').select('id, quantity').ilike('name', itemName).then(function(invRes) {
            if (invRes.data && invRes.data.length > 0) {
              // Update existing
              var item = invRes.data[0];
              sbClient.from('inventory_items').update({ quantity: (item.quantity || 0) + accepted }).eq('id', item.id).then(function() {});
            } else {
              // Create new inventory entry
              sbClient.from('inventory_items').insert({
                name: itemName,
                category: 'Raw Material',
                quantity: accepted,
                min_quantity: 5,
                warehouse_type: 'raw'
              }).then(function() {});
            }
          });
        }

        App.closeModal();
        render();
        var msg = result === 'passed' ? 'تم القبول وإضافة ' + accepted + ' للمخزن ✅'
          : result === 'conditional' ? 'مقبول بشروط — تمت إضافة ' + accepted + ' للمخزن ⚠️'
          : 'تم تسجيل الرفض وإنشاء محضر إرجاع للمورد ❌';
        showToast(msg, result === 'failed' ? 'error' : 'success');
      });
    };
  };

  // ===== ACTIONS: Finished Goods QC =====
  window.qualAccept = function(id) {
    var notes = prompt('ملاحظات الفحص (اختياري):');
    if (notes === null) return;
    // Accept: move to finished goods inventory + notify warehouse
    SalesWorkflow.updateStatus(id, 'Quality Accepted', {
      rejection_reason: 'مطابق للمواصفات' + (notes ? ' — ' + notes : '')
    }, function() {
      // Add to finished goods inventory
      sbClient.from('sales_workflow_orders').select('product_name, quantity_available').eq('id', id).single().then(function(r) {
        if (!r.error && r.data) {
          var qty = r.data.quantity_available || 0;
          sbClient.from('inventory_items').select('id, quantity').ilike('name', r.data.product_name).then(function(inv) {
            if (inv.data && inv.data.length > 0) {
              sbClient.from('inventory_items').update({ quantity: (inv.data[0].quantity || 0) + qty }).eq('id', inv.data[0].id).then(function() {});
            } else {
              sbClient.from('inventory_items').insert({
                name: r.data.product_name,
                category: 'Finished Good',
                quantity: qty,
                min_quantity: 0,
                warehouse_type: 'finished'
              }).then(function() {});
            }
          });
        }
      });
      render();
      showToast('تم اعتماد الجودة وإضافة المنتج لمخزون المنتج التام ✅', 'success');
    });
  };

  window.qualConditional = function(id) {
    var reason = prompt('اكتب الشروط المطلوبة للقبول:');
    if (!reason) return;
    SalesWorkflow.updateStatus(id, 'Quality Accepted', {
      rejection_reason: 'مقبول بشروط: ' + reason
    }, function() {
      render();
      showToast('تم القبول بشروط', 'warning');
    });
  };

  window.qualReject = function(id) {
    var reason = prompt('يرجى كتابة سبب عدم المطابقة (سيتم إرجاع المنتج للإنتاج):');
    if (!reason) return;
    SalesWorkflow.updateStatus(id, 'Quality Rejected', { rejection_reason: reason }, function() {
      render();
      showToast('تم رفض المنتج وإعادته للإنتاج ❌', 'error');
    });
  };

  render();
};
