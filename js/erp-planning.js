// ===== ERP MODULE: Planning (التخطيط) =====
window.Pages = window.Pages || {};

Pages.planning = function(el) {
  var isOwner = App.isOwner();
  var isPlanning = App.user && (App.user.department === 'Planning' || App.user.role === 'planning manager');
  var canEdit = isOwner || isPlanning;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Planning department.</p></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة التخطيط (Planning)</h1><p>مراجعة المخزون، نقص الخامات، أوامر الإنتاج</p></div></div>';
    html += '<div id="planning-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');

    Promise.all([
      sbClient.from('sales_workflow_orders').select('*').order('created_at', { ascending: false }),
      sbClient.from('inventory_items').select('id, name, quantity, category').in('category', ['Raw Material', 'Supplies', 'Chemicals'])
    ]).then(function(results) {
      var orders = results[0].data || [];
      var rawStock = results[1].data || [];

      if (orders.length === 0) {
        document.getElementById('planning-content').innerHTML = '<div class="empty-state">لا يوجد طلبات حالياً</div>';
        return;
      }

      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>تاريخ الطلب</th><th>العميل</th><th>المنتج</th>'
        + '<th>الكمية المطلوبة</th><th>الكمية المتاحة</th>'
        + '<th>ميعاد التسليم</th><th>الحالة</th><th>إجراءات</th>'
        + '</tr></thead><tbody>';

      orders.forEach(function(o) {
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td>' + o.customer_name + '</td>';
        tHtml += '<td><strong>' + o.product_name + '</strong></td>';
        tHtml += '<td>' + o.quantity_requested + '</td>';
        tHtml += '<td>' + (o.quantity_available !== null ? '<strong style="color:var(--accent-primary)">' + o.quantity_available + '</strong>' : '-') + '</td>';
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';

        var actions = '';
        if (o.status === 'New Request') {
          actions = '<button class="btn btn-sm btn-primary" onclick="window.planReview(\'' + o.id + '\',' + o.quantity_requested + ',\'' + o.product_name + '\')">🔍 مراجعة المخزون</button>';
        } else if (o.status === 'Customer Approved' || o.status === 'Customer Approved - Partial' || o.status === 'Customer Approved - Full Wait') {
          actions = '<button class="btn btn-sm btn-warning" onclick="window.planStartProd(\'' + o.id + '\')">⚙️ إصدار أمر إنتاج</button>';
        } else if (o.status === 'Received by Warehouse') {
          actions = '<button class="btn btn-sm btn-success" onclick="window.planReadyDeliv(\'' + o.id + '\')">📦 إبلاغ المبيعات (جاهز)</button>';
        } else if (o.status === 'Raw Material Shortage - Purchase Requested') {
          actions = '<span style="color:var(--accent-warning);font-size:0.8rem">⏳ انتظار وصول الخامات</span>';
        } else {
          actions = '<span style="color:var(--text-muted);font-size:0.8rem">-</span>';
        }

        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });

      tHtml += '</tbody></table></div>';
      document.getElementById('planning-content').innerHTML = tHtml;
    });
  }

  // Review inventory and decide: enough / partial / need purchase
  window.planReview = function(id, reqQty, productName) {
    // Show dialog with raw material stock info
    sbClient.from('inventory_items')
      .select('id, name, quantity, category')
      .in('category', ['Raw Material', 'Supplies', 'Chemicals'])
      .order('name')
      .then(function(res) {
        var stock = res.data || [];
        var stockInfo = stock.length > 0
          ? stock.map(function(s) { return s.name + ': ' + s.quantity; }).join('\n')
          : 'لا توجد بيانات خامات في المخزن';

        var avail = prompt(
          '📦 المنتج: ' + productName + '\n' +
          '📋 الكمية المطلوبة: ' + reqQty + '\n\n' +
          '📊 مخزون الخامات الحالي:\n' + stockInfo + '\n\n' +
          'أدخل الكمية المتاحة للإنتاج الآن:',
          reqQty
        );

        if (avail === null || isNaN(avail) || avail === '') return;
        var availNum = Number(avail);

        if (availNum >= reqQty) {
          // Sufficient — go straight to production
          SalesWorkflow.updateStatus(id, 'Production Started', { quantity_available: availNum }, function() {
            render();
            showToast('الخامات كافية — تم إصدار أمر الإنتاج مباشرة', 'success');
          });
        } else {
          // Insufficient — notify sales with available qty & ask about purchase request
          var planNotes = 'الكمية المتاحة حالياً: ' + availNum + ' من أصل ' + reqQty;
          var expectedDate = prompt(
            '⚠️ الخامات غير كافية!\n' +
            'الكمية المتاحة: ' + availNum + ' من ' + reqQty + '\n\n' +
            'سيتم إشعار المبيعات وإنشاء طلب شراء للباقي.\n' +
            'أدخل التاريخ المتوقع لوصول الخامات (YYYY-MM-DD):',
            new Date().toISOString().split('T')[0]
          );
          if (expectedDate === null) return;

          planNotes += ' | التاريخ المتوقع للتوريد: ' + expectedDate;

          // Update order: notify sales + create purchase request
          SalesWorkflow.updateStatus(id, 'Waiting Customer Approval', {
            quantity_available: availNum,
            planning_notes: planNotes,
            expected_full_delivery_date: expectedDate
          }, function() {
            // Also create a purchase request for the shortage
            sbClient.from('purchase_requests').insert({
              item_name: 'خامات إنتاج: ' + productName,
              requested_quantity: reqQty - availNum,
              status: 'pending',
              requested_by: App.user.full_name + ' (Planning)',
              description: 'نقص خامات لأمر بيع — الكمية الناقصة: ' + (reqQty - availNum),
              delivery_date: expectedDate
            }).then(function(pr) {
              SalesWorkflow.updateStatus(id, 'Raw Material Shortage - Purchase Requested', {}, function() {});
              render();
              showToast('تم إشعار المبيعات وإنشاء طلب شراء للكمية الناقصة', 'warning');
            });
          });
        }
      });
  };

  window.planStartProd = function(id) {
    if (!confirm('إصدار أمر إنتاج نهائي لهذا الطلب؟')) return;
    SalesWorkflow.updateStatus(id, 'Production Started', {}, function() {
      render();
      showToast('تم إصدار أمر الإنتاج', 'success');
    });
  };

  window.planReadyDeliv = function(id) {
    if (!confirm('تأكيد أن الطلب جاهز وإرسال إشعار للمبيعات؟')) return;
    SalesWorkflow.updateStatus(id, 'Ready For Delivery', {}, function() {
      render();
      showToast('تم إشعار المبيعات بجاهزية الطلب', 'success');
    });
  };

  render();
};
