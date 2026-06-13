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
    if (status === 'Pending Sales Review') color = '#64748b';
    if (status === 'New Request' || status === 'Under Planning Review') color = '#3b82f6';
    if (status === 'Waiting Customer Approval') color = '#f59e0b';
    if (status === 'Customer Approved') color = '#22c55e';
    if (status === 'Rejected By Customer' || status === 'Quality Rejected') color = '#ef4444';
    if (status === 'Production Started' || status === 'Under Quality Inspection') color = '#8b5cf6';
    if (status === 'Production Completed' || status === 'Quality Accepted' || status === 'Ready For Delivery') color = '#10b981';
    if (status === 'Delivered') color = '#14b8a6';
    return '<span style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:0.75rem;background:'+color+'20;color:'+color+';font-weight:bold">' + status + '</span>';
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
    var html = '<div class="header-banner"><div><h1>إدارة المبيعات (Sales)</h1><p>إنشاء ومتابعة طلبات العملاء</p></div><button class="btn btn-primary" onclick="window.newSalesOrder()">' + icon('plus') + ' إنشاء طلب عميل جديد</button></div>';
    html += '<div id="sales-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    SalesWorkflow.loadOrders(function(orders) {
      if (orders.length === 0) {
        document.getElementById('sales-content').innerHTML = '<div class="empty-state">لا يوجد طلبات حالياً</div>';
        return;
      }
      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>اسم العميل</th><th>المنتج المطلوب</th><th>الكمية المطلوبة</th><th>الكمية المتاحة</th><th>تاريخ التسليم المطلوب</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';
      orders.forEach(function(o) {
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong>' + o.customer_name + '</strong></td>';
        tHtml += '<td>' + o.product_name + '</td>';
        tHtml += '<td>' + o.quantity_requested + '</td>';
        tHtml += '<td>' + (o.quantity_available !== null ? '<span style="color:var(--accent-primary);font-weight:bold">' + o.quantity_available + '</span>' : '-') + '</td>';
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        
        var actions = '';
        if (o.status === 'Pending Sales Review') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesSendToPlanning(\''+o.id+'\')">إرسال للتخطيط</button>';
        } else if (o.status === 'Waiting Customer Approval') {
          actions += '<button class="btn btn-sm btn-success" onclick="window.salesApprove(\''+o.id+'\')" style="margin-bottom:4px">موافقة العميل</button><br>';
          actions += '<button class="btn btn-sm btn-danger" onclick="window.salesReject(\''+o.id+'\')">رفض العميل</button>';
        } else if (o.status === 'Ready For Delivery' || o.status === 'Ready For Customer Delivery') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.salesDeliver(\''+o.id+'\')">تأكيد الاستلام والتسليم</button>';
        } else {
          actions += '-';
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
      if(res.error) {
        btn.disabled = false; btn.innerHTML = 'حفظ وإرسال للتخطيط';
        return alert(res.error.message);
      }
      App.closeModal();
      render();
    });
  };

  window.salesSendToPlanning = function(id) {
    if(!confirm('هل تريد تأكيد إرسال هذا الطلب إلى قسم التخطيط (Planning) لمراجعته؟')) return;
    SalesWorkflow.updateStatus(id, 'New Request', {}, render);
  };

  window.salesApprove = function(id) {
    if(!confirm('تأكيد موافقة العميل على الكمية المتاحة؟')) return;
    SalesWorkflow.updateStatus(id, 'Customer Approved', {}, render);
  };

  window.salesReject = function(id) {
    var reason = prompt('يرجى إدخال سبب رفض العميل:');
    if(!reason) return;
    SalesWorkflow.updateStatus(id, 'Rejected By Customer', { rejection_reason: reason }, render);
  };

  window.salesDeliver = function(id) {
    var notes = prompt('الكمية المسلمة وملاحظات التسليم (اختياري):');
    SalesWorkflow.updateStatus(id, 'Delivered', { delivery_date_actual: new Date().toISOString().split('T')[0], rejection_reason: notes }, render);
  };

  render();
};
