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
      'Pending Payment': { color: '#f59e0b', label: 'بانتظار الدفع (حسابات)' },
      'Paid - Awaiting Pickup': { color: '#3b82f6', label: 'تم الدفع (بانتظار الاستلام)' },
      'Out For Delivery': { color: '#0ea5e9', label: 'خرج للتسليم' },
      'Delivered': { color: '#14b8a6', label: 'تم التسليم' },
    };
    var info = labels[status] || { color: '#64748b', label: status };
    return '<span style="display:inline-block;padding:4px 10px;border-radius:4px;font-size:0.75rem;background:'+info.color+'20;color:'+info.color+';font-weight:bold">' + info.label + '</span>';
  }
};

Pages.sales = function(el) {
  var isOwner = App.isOwner();
  var userDept = (App.user && App.user.department ? App.user.department.trim().toLowerCase() : '');
  var userRole = (App.user && App.user.role ? App.user.role.trim().toLowerCase() : '');

  // If customer lands on Sales screen, seamlessly delegate to customer portal
  if (App.user && (userRole === 'supplier_external' || userRole === 'customer' || userRole === 'client')) {
    if (Pages['supplier-portal']) return Pages['supplier-portal'](el);
  }

  var isSales = userDept === 'sales' || userDept === 'المبيعات' || userRole.includes('sales') || userRole.includes('مبيعات');
  var isPlanning = userDept === 'planning' || userDept === 'التخطيط' || userRole.includes('planning') || userRole.includes('تخطيط');
  var isMgmt = isOwner || userRole === 'ceo' || userRole === 'gm' || userRole === 'manager' || userRole.includes('admin');
  var canEdit = isOwner || isSales || isPlanning || isMgmt || (typeof SecurityHelpers !== 'undefined' && SecurityHelpers.hasPermission('erp-sales', 'view'));

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
        + '<th>الكمية</th><th>السعر الإجمالي</th><th>المدفوع</th><th>المتبقي</th>'
        + '<th>طريقة السداد</th>'
        + '<th>تاريخ التسليم</th>'
        + '<th>الحالة</th><th>إجراءات</th>'
        + '</tr></thead><tbody>';

      orders.forEach(function(o) {
        var totalAmt = o.total_amount || 0;
        var paidAmt = o.paid_amount || 0;
        var remainingAmt = o.remaining_amount || totalAmt;
        var payMethodMap = { 'cash': 'نقدي', 'check': 'شيك', 'bank': 'تحويل بنكي', 'credit': 'آجل' };
        var pm = o.payment_method ? payMethodMap[o.payment_method] || o.payment_method : '-';

        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong>' + o.customer_name + '</strong></td>';
        tHtml += '<td>' + o.product_name + '</td>';
        tHtml += '<td>مطلوب: ' + o.quantity_requested + '<br>متاح: ' + (o.quantity_available !== null ? '<span style="color:var(--accent-primary);font-weight:bold">' + o.quantity_available + '</span>' : '-') + '</td>';
        tHtml += '<td><strong style="color:var(--accent-primary)">EGP ' + totalAmt + '</strong></td>';
        tHtml += '<td><strong style="color:var(--accent-success)">EGP ' + paidAmt + '</strong></td>';
        tHtml += '<td><strong style="color:var(--accent-danger)">EGP ' + remainingAmt + '</strong></td>';
        tHtml += '<td><span class="badge badge-info">' + pm + '</span></td>';

        // Customer decision column removed to save space, integrated into actions/status if needed
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';

        var actions = '';
        if (o.status === 'Pending Sales Review') {
          actions += '<div style="display:flex;flex-direction:column;gap:4px">';
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesAcceptExternalOrder(\'' + o.id + '\')">✅ قبول وإرسال للتخطيط</button>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.salesRejectExternalOrder(\'' + o.id + '\')">❌ رفض الطلب</button>';
          actions += '</div>';
        } else if (o.status === 'New Request') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesSendToPlanning(\'' + o.id + '\')">📤 إرسال للتخطيط</button>';
        } else if (o.status === 'Under Planning Review') {
          actions += '<span style="color:var(--accent-primary);font-size:0.8rem">⏳ قيد المراجعة في التخطيط</span>';
        } else if (o.status === 'Waiting Customer Approval' || o.status === 'Raw Material Shortage - Purchase Requested') {
          // Show partial qty info from planning
          var planInfo = o.planning_notes ? '<div style="font-size:0.75rem;color:var(--accent-warning);margin-bottom:6px">📋 ' + o.planning_notes + '</div>' : '';
          actions += planInfo;
          actions += '<div style="display:flex;flex-direction:column;gap:4px">';
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesCustomerPartial(\'' + o.id + '\',' + o.quantity_available + ',' + o.quantity_requested + ')">✅ قبول الجزئي</button>';
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesCustomerFullWait(\'' + o.id + '\')">⏳ انتظار الكامل</button>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.salesReject(\'' + o.id + '\')">❌ رفض</button>';
          actions += '</div>';
        } else if (o.status === 'Customer Approved' || o.status === 'Customer Approved - Partial' || o.status === 'Customer Approved - Full Wait') {
          actions += '<span style="color:var(--accent-success);font-size:0.8rem">✅ معتمد - بانتظار أمر الإنتاج</span>';
        } else if (o.status === 'Production Started') {
          actions += '<span style="color:var(--accent-primary);font-size:0.8rem">⚙️ قيد الإنتاج والمتابعة</span>';
        } else if (o.status === 'Ready For Delivery' || o.status === 'Ready For Customer Delivery' || o.status === 'Received by Warehouse') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesTransferToFinance(\'' + o.id + '\')">💳 تحويل للحسابات (للدفع)</button>';
        } else if (o.status === 'Pending Payment') {
          actions += '<div style="display:flex;flex-direction:column;gap:4px">';
          actions += '<span style="color:var(--accent-warning);font-size:0.8rem">⏳ بانتظار الدفع في الحسابات</span>';
          actions += '<button class="btn btn-sm btn-outline" style="border-color:var(--accent-primary);color:var(--accent-primary)" onclick="window.salesEditPrice(\'' + o.id + '\', ' + (o.total_amount || 0) + ', ' + (o.paid_amount || 0) + ')">✏️ تعديل المبلغ / السعر</button>';
          actions += '</div>';
        } else if (o.status === 'Paid - Awaiting Pickup') {
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesDeliver(\'' + o.id + '\')">📦 تسليم للعميل (تم الدفع)</button>';
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
    b += '<div class="form-group"><label>سعر الوحدة (EGP) *</label><input type="number" id="so-price" class="form-input" min="0"></div>';
    b += '<div class="form-group"><label>طريقة السداد *</label><select id="so-paymethod" class="form-input"><option value="cash">نقدي (Cash)</option><option value="check">شيك (Cheque)</option><option value="bank">تحويل بنكي (Bank Transfer)</option><option value="credit">آجل (Credit)</option></select></div>';
    b += '<div class="form-group"><label>تاريخ الاستحقاق / الدفع (Due Date)</label><input type="date" id="so-due" class="form-input"></div>';
    b += '<div class="form-group" style="grid-column: span 2;"><label>تاريخ التسليم المطلوب للعميل *</label><input type="date" id="so-date" class="form-input"></div>';
    b += '</div>';
    App.showModal('إنشاء فاتورة / طلب مبيعات', b, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="window.saveSalesOrder()">حفظ وإرسال للتخطيط</button>');
  };

  window.saveSalesOrder = function() {
    var cust = document.getElementById('so-cust').value.trim();
    var prod = document.getElementById('so-prod').value.trim();
    var qty = document.getElementById('so-qty').value;
    var price = document.getElementById('so-price').value;
    var paymethod = document.getElementById('so-paymethod').value;
    var duedate = document.getElementById('so-due').value;
    var date = document.getElementById('so-date').value;

    if (!cust || !prod || !qty || !price || !date) return alert('يرجى إدخال جميع البيانات الأساسية والمالية');

    var totalAmt = Number(qty) * Number(price);

    var btn = document.querySelector('.modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الإرسال...'; }

    sbClient.from('sales_workflow_orders').insert({
      customer_name: cust,
      product_name: prod,
      quantity_requested: Number(qty),
      delivery_date_requested: date,
      status: 'Under Planning Review',
      total_amount: totalAmt,
      paid_amount: 0,
      remaining_amount: totalAmt,
      payment_method: paymethod,
      due_date: duedate || null,
      payment_status: 'unpaid',
      created_by: App.user.id
    }).then(function(res) {
      if (res.error) {
        if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ وإرسال للتخطيط'; }
        return alert(res.error.message);
      }
      App.closeModal();
      render();
      showToast('تم إنشاء الطلب وإرساله للتخطيط بنجاح', 'success');
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

  window.salesAcceptExternalOrder = function(id) {
    if (!confirm('هل توافق على هذا الطلب ليتم إرساله مباشرة إلى التخطيط؟')) return;
    SalesWorkflow.updateStatus(id, 'Under Planning Review', {}, function() {
      render();
      showToast('تم قبول الطلب وإرساله لإدارة التخطيط بنجاح', 'success');
    });
  };

  window.salesSendToPlanning = function(id) {
    if (!confirm('تأكيد إرسال الطلب إلى إدارة التخطيط لمراجعة المخزون؟')) return;
    SalesWorkflow.updateStatus(id, 'Under Planning Review', {}, function() {
      render();
      showToast('تم إرسال الطلب للتخطيط بنجاح', 'success');
    });
  };

  window.salesRejectExternalOrder = function(id) {
    var reason = prompt('يرجى إدخال سبب رفض الطلب (ستظهر للعميل):');
    if (reason === null) return;
    SalesWorkflow.updateStatus(id, 'Rejected By Customer', {
      rejection_reason: reason,
      customer_decision: 'rejected_by_sales'
    }, render);
  };

  window.salesTransferToFinance = function(id) {
    if (!confirm('تأكيد تبليغ العميل وتحويل الأوردر للحسابات للدفع؟')) return;
    SalesWorkflow.updateStatus(id, 'Pending Payment', {}, render);
  };

  window.salesEditPrice = function(id, currentAmt, paidAmt) {
    var newAmt = prompt("المبلغ الإجمالي الجديد للفاتورة:", currentAmt);
    if (!newAmt || isNaN(newAmt)) return;
    newAmt = Number(newAmt);
    if (newAmt < paidAmt) return alert("خطأ: المبلغ الإجمالي الجديد أقل من المبلغ المدفوع بالفعل (" + paidAmt + ")");

    var payMethod = prompt("طريقة السداد (نقدي cash / شيك check / بنك bank / آجل credit):", "cash");
    if (!payMethod) return;

    sbClient.from('sales_workflow_orders').update({
      total_amount: newAmt,
      remaining_amount: newAmt - paidAmt,
      payment_method: payMethod,
      payment_status: paidAmt >= newAmt ? 'paid' : (paidAmt > 0 ? 'partial' : 'unpaid')
    }).eq('id', id).then(function(res) {
      if (res.error) return alert("خطأ: " + res.error.message);
      showToast('تم تعديل المبلغ وطريقة السداد بنجاح', 'success');
      render();
    });
  };

  render();
};
