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
    var html = '<div class="header-banner"><div><h1>إدارة التخطيط (Planning)</h1><p>مراجعة المخزون، أوامر الإنتاج، والتسليم</p></div></div>';
    html += '<div id="planning-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');

    SalesWorkflow.loadOrders(function(orders) {
      if (orders.length === 0) {
        document.getElementById('planning-content').innerHTML = '<div class="empty-state">لا يوجد طلبات حالياً</div>';
        return;
      }
      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>العميل</th><th>المنتج</th><th>الكمية المطلوبة</th><th>الكمية المتاحة</th><th>ميعاد التسليم</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';
      orders.forEach(function(o) {
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td>' + o.customer_name + '</td>';
        tHtml += '<td><strong>' + o.product_name + '</strong></td>';
        tHtml += '<td>' + o.quantity_requested + '</td>';
        tHtml += '<td>' + (o.quantity_available !== null ? o.quantity_available : '-') + '</td>';
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        
        var actions = '';
        if (o.status === 'New Request') {
          actions += '<button class="btn btn-sm btn-primary" onclick="window.planReview(\''+o.id+'\', '+o.quantity_requested+')">مراجعة المخزون وتحديد المتاح</button>';
        } else if (o.status === 'Customer Approved') {
          actions += '<button class="btn btn-sm btn-warning" onclick="window.planStartProd(\''+o.id+'\')">إصدار أمر للإنتاج</button>';
        } else if (o.status === 'Quality Accepted') {
          actions += '<button class="btn btn-sm btn-success" onclick="window.planReadyDeliv(\''+o.id+'\')">إبلاغ المبيعات (جاهز للتسليم)</button>';
        } else {
          actions += '-';
        }
        
        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table></div>';
      document.getElementById('planning-content').innerHTML = tHtml;
    });
  }

  window.planReview = function(id, reqQty) {
    var avail = prompt('الكمية المطلوبة هي ('+reqQty+').\nأدخل الكمية المتاحة/الممكن إنتاجها بناءً على المخزون:', reqQty);
    if (avail === null || isNaN(avail) || avail === '') return;
    
    var availNum = Number(avail);
    if (availNum >= reqQty) {
      // If sufficient, bypass customer wait and issue production immediately
      SalesWorkflow.updateStatus(id, 'Production Started', { quantity_available: availNum }, render);
    } else {
      // If insufficient, send back to sales for customer approval
      alert('الكمية المتاحة أقل من المطلوبة. سيتم إرسالها للمبيعات لأخذ موافقة العميل.');
      SalesWorkflow.updateStatus(id, 'Waiting Customer Approval', { quantity_available: availNum }, render);
    }
  };

  window.planStartProd = function(id) {
    if(!confirm('إصدار أمر إنتاج نهائي لهذا الطلب؟')) return;
    SalesWorkflow.updateStatus(id, 'Production Started', {}, render);
  };

  window.planReadyDeliv = function(id) {
    if(!confirm('تأكيد أن الطلب جاهز بالكامل وإرسال إشعار للمبيعات؟')) return;
    SalesWorkflow.updateStatus(id, 'Ready For Delivery', {}, render);
  };

  render();
};
