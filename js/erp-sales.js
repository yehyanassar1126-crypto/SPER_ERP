// ===== ERP MODULE: Sales (المبيعات) =====
window.Pages = window.Pages || {};

window.SalesWorkflow = {
  loadOrders: function(callback) {
    sbClient.from('sales_workflow_orders').select('*').order('created_at', {ascending: false}).then(function(res) {
      if (res.error) return alert("Error loading orders: " + res.error.message);
      callback(res.data || []);
    });
  },
  updateStatus: function(id, status, extraFields, callback) {
    var payload = Object.assign({ status: status }, extraFields || {});
    sbClient.from('sales_workflow_orders').update(payload).eq('id', id).then(function(res) {
      if (res.error) return alert("Error updating: " + res.error.message);
      if (callback) callback();
    });
  },
  getStatusBadge: function(status) {
    var color = '#64748b';
    var labels = {
      'Pending Sales Review': { color: '#f59e0b', label: 'بانتظار مراجعة المبيعات' },
      'New Request': { color: '#3b82f6', label: 'طلب جديد' },
      'Under Planning Review': { color: '#3b82f6', label: 'مراجعة التخطيط' },
      'Waiting Customer Approval': { color: '#f59e0b', label: 'انتظار موافقة العميل' },
      'Customer Approved - Partial': { color: '#22c55e', label: 'موافق (جزئي)' },
      'Customer Approved - Full Wait': { color: '#22c55e', label: 'موافق (انتظار كامل)' },
      'Customer Approved': { color: '#22c55e', label: 'معتمد من العميل' },
      'Rejected By Customer': { color: '#ef4444', label: 'مرفوض من العميل' },
      'Raw Material Shortage - Purchase Requested': { color: '#f97316', label: 'نقص خامات - طلب شراء' },
      'Production Started': { color: '#8b5cf6', label: 'الإنتاج جارٍ' },
      'Under Quality Inspection': { color: '#8b5cf6', label: 'فحص الجودة' },
      'Quality Accepted': { color: '#10b981', label: 'اعتمدت الجودة' },
      'Quality Rejected': { color: '#ef4444', label: 'رفضت الجودة' },
      'Production Completed': { color: '#10b981', label: 'اكتمل الإنتاج' },
      'Received by Warehouse': { color: '#10b981', label: 'استلمه المخزن' },
      'Ready For Delivery': { color: '#10b981', label: 'جاهز للتسليم' },
      'Out For Delivery': { color: '#0ea5e9', label: 'خرج للتسليم' },
      'Delivered': { color: '#14b8a6', label: 'تم التسليم' },
    };
    var info = labels[status] || { color: '#64748b', label: status };
    return '<span style="display:inline-block;padding:4px 10px;border-radius:4px;font-size:0.75rem;background:'+info.color+'20;color:'+info.color+';font-weight:bold">' + info.label + '</span>';
  }
};

Pages.sales = function(el) {
  var isOwner = App.isOwner();
  var isSales = App.user && (App.user.department === 'Sales' || App.user.role === 'sales manager');
  var canEdit = isOwner || isSales;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Sales department.</p></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة المبيعات (Sales)</h1><p>إنشاء ومتابعة طلبات العملاء وقرارات التسليم</p></div><button class="btn btn-primary" onclick="window.newSalesOrder()">' + icon('plus') + ' إنشاء طلب عميل جديد</button></div>';
    html += '<div id="sales-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    SalesWorkflow.loadOrders(function(orders) {
      if (orders.length === 0) {
        document.getElementById('sales-content').innerHTML = '<div class="empty-state">لا يوجد طلبات حالياً</div>';
        return;
      }

      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>تاريخ الطلب</th><th>اسم العميل</th><th>المنتج المطلوب</th>'
        + '<th>الكمية المطلوبة</th><th>الكمية المتاحة</th>'
        + '<th>قرار العميل</th><th>تاريخ التسليم المطلوب</th>'
        + '<th>الحالة</th><th>إجراءات</th>'
        + '</tr></thead><tbody>';

      orders.forEach(function(o) {
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong>' + o.customer_name + '</strong></td>';
        tHtml += '<td>' + o.product_name + '</td>';
        tHtml += '<td>' + o.quantity_requested + '</td>';
        tHtml += '<td>' + (o.quantity_available !== null ? '<span style="color:var(--accent-primary);font-weight:bold">' + o.quantity_available + '</span>' : '-') + '</td>';

        // Customer decision column
        var decisionBadge = '-';
        if (o.customer_decision === 'partial') {
          decisionBadge = '<span style="padding:3px 8px;border-radius:4px;background:#22c55e20;color:#22c55e;font-size:0.75rem;font-weight:bold">✅ جزئي + انتظار</span>';
        } else if (o.customer_decision === 'full_wait') {
          decisionBadge = '<span style="padding:3px 8px;border-radius:4px;background:#3b82f620;color:#3b82f6;font-size:0.75rem;font-weight:bold">⏳ انتظار الكمية كاملة</span>';
        }
        tHtml += '<td>' + decisionBadge + '</td>';

        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';

        var actions = '';
        if (o.status === 'Pending Sales Review') {
          actions += '<div style="display:flex;flex-direction:column;gap:4px">';
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesAcceptExternalOrder(\'' + o.id + '\')">✅ قبول</button>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.salesReject(\'' + o.id + '\')">❌ رفض</button>';
          actions += '</div>';
        } else if (o.status === 'Waiting Customer Approval') {
          // Show partial qty info from planning
          var planInfo = o.planning_notes ? '<div style="font-size:0.75rem;color:var(--accent-warning);margin-bottom:6px">📋 ' + o.planning_notes + '</div>' : '';
          actions += planInfo;
          actions += '<div style="display:flex;flex-direction:column;gap:4px">';
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesCustomerPartial(\'' + o.id + '\',' + o.quantity_available + ',' + o.quantity_requested + ')">✅ يقبل الجزئي</button>';
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesCustomerFullWait(\'' + o.id + '\')">⏳ ينتظر الكامل</button>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.salesReject(\'' + o.id + '\')">❌ رفض</button>';
          actions += '</div>';
        } else if (o.status === 'Ready For Delivery' || o.status === 'Ready For Customer Delivery') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesDeliver(\'' + o.id + '\')">🚚 إرسال للتسليم</button>';
        } else if (o.status === 'Delivered') {
          actions += '<span style="color:var(--accent-success);font-weight:bold">✅ تم التسليم</span>';
        } else {
          actions += '<span style="color:var(--text-muted);font-size:0.8rem">-</span>';
        }

        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });

      tHtml += '</tbody></table></div>';
      document.getElementById('sales-content').innerHTML = tHtml;
    });
  }

  window.newSalesOrder = function() {
    var b = '<div class="form-grid">';
    b += '<div class="form-group"><label>اسم العميل *</label><input type="text" id="so-cust" class="form-input"></div>';
    b += '<div class="form-group"><label>المنتج المطلوب *</label><input type="text" id="so-prod" class="form-input"></div>';
    b += '<div class="form-group"><label>الكمية المطلوبة *</label><input type="number" id="so-qty" class="form-input" min="1"></div>';
    b += '<div class="form-group"><label>تاريخ التسليم المطلوب *</label><input type="date" id="so-date" class="form-input"></div>';
    b += '</div>';
    App.showModal('إنشاء طلب عميل جديد', b, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="window.saveSalesOrder()">حفظ وإرسال للتخطيط</button>');
  };

  window.saveSalesOrder = function() {
    var cust = document.getElementById('so-cust').value.trim();
    var prod = document.getElementById('so-prod').value.trim();
    var qty = document.getElementById('so-qty').value;
    var date = document.getElementById('so-date').value;

    if (!cust || !prod || !qty || !date) return alert('يرجى إدخال جميع البيانات');

    var btn = document.querySelector('.modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الإرسال...'; }

    sbClient.from('sales_workflow_orders').insert({
      customer_name: cust,
      product_name: prod,
      quantity_requested: Number(qty),
      delivery_date_requested: date,
      status: 'New Request',
      created_by: App.user.id
    }).then(function(res) {
      if (res.error) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ وإرسال للتخطيط'; }
        return alert(res.error.message);
      }
      App.closeModal();
      render();
      showToast('تم إنشاء الطلب وإرساله للتخطيط', 'success');
    });
  };

  // Customer accepts partial delivery (available now + rest later)
  window.salesCustomerPartial = function(id, availQty, totalQty) {
    var expectedDate = prompt(
      'العميل يقبل استلام ' + availQty + ' الآن والباقي (' + (totalQty - availQty) + ') لاحقاً.\n' +
      'أدخل التاريخ المتوقع لاستكمال الكمية الباقية (YYYY-MM-DD):'
    );
    if (expectedDate === null) return;

    SalesWorkflow.updateStatus(id, 'Customer Approved - Partial', {
      customer_decision: 'partial',
      expected_full_delivery_date: expectedDate || null
    }, function() {
      render();
      showToast('تم حفظ قرار العميل (تسليم جزئي) - بدء الإنتاج للكمية المتاحة', 'success');
    });
  };

  // Customer waits for full quantity
  window.salesCustomerFullWait = function(id) {
    var expectedDate = prompt('العميل ينتظر الكمية كاملة.\nأدخل التاريخ المتوقع للتسليم الكامل (YYYY-MM-DD):');
    if (expectedDate === null) return;

    SalesWorkflow.updateStatus(id, 'Customer Approved - Full Wait', {
      customer_decision: 'full_wait',
      expected_full_delivery_date: expectedDate || null
    }, function() {
      render();
      showToast('تم حفظ قرار العميل (انتظار كامل)', 'success');
    });
  };

  window.salesReject = function(id) {
    var reason = prompt('يرجى إدخال سبب رفض العميل:');
    if (!reason) return;
    SalesWorkflow.updateStatus(id, 'Rejected By Customer', {
      rejection_reason: reason,
      customer_decision: 'rejected'
    }, render);
  };

  window.salesDeliver = function(id) {
    var notes = prompt('ملاحظات إرسال الطلبية للعميل (اختياري):');
    if (notes === null) return;
    SalesWorkflow.updateStatus(id, 'Out For Delivery', {
      delivery_date_actual: new Date().toISOString().split('T')[0],
      rejection_reason: notes
    }, render);
  };

  render();
};
