// ===== ERP MODULE: Production (الإنتاج) =====
window.Pages = window.Pages || {};

Pages.production = function(el) {
  var isOwner = App.isOwner();
  var isProduction = App.user && (App.user.department === 'Production' || App.user.role === 'hall manager');
  var canEdit = isOwner || isProduction;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Production department.</p></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة الإنتاج (Production)</h1><p>أوامر التشغيل ومتابعة التصنيع</p></div></div>';
    html += '<div id="production-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');

    SalesWorkflow.loadOrders(function(orders) {
      // Production only cares about active production statuses
      var relevantOrders = orders.filter(function(o) { 
        return o.status === 'Production Started' || 
               o.status === 'Production Completed' ||
               o.status === 'Quality Rejected' || 
               o.status === 'Under Quality Inspection'; 
      });
      
      if (relevantOrders.length === 0) {
        document.getElementById('production-content').innerHTML = '<div class="empty-state">لا يوجد أوامر إنتاج مفتوحة</div>';
        return;
      }

      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>تاريخ الطلب</th><th>المنتج المطلوب تصنيعه</th><th>الكمية المعتمدة للإنتاج</th><th>تاريخ التسليم</th><th>الحالة</th><th>ملاحظات/سبب الرفض</th><th>إجراءات الإنتاج</th></tr></thead><tbody>';
      relevantOrders.forEach(function(o) {
        var qtyToProduce = o.quantity_available !== null ? o.quantity_available : o.quantity_requested;
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong style="color:var(--accent-primary);font-size:1.1rem">' + o.product_name + '</strong></td>';
        tHtml += '<td><strong style="font-size:1.2rem">' + qtyToProduce + '</strong></td>';
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        tHtml += '<td>' + (o.rejection_reason ? '<span style="color:var(--accent-danger)">'+o.rejection_reason+'</span>' : '-') + '</td>';
        
        var actions = '';
        if (o.status === 'Production Started' || o.status === 'Quality Rejected') {
          actions += '<button class="btn btn-sm btn-success" onclick="window.prodComplete(\''+o.id+'\')">اكتمل الإنتاج (تحويل للجودة)</button>';
        } else {
          actions += '<span style="color:var(--text-muted)">تم تحويله للفحص</span>';
        }
        
        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table></div>';
      document.getElementById('production-content').innerHTML = tHtml;
    });
  }

  window.prodComplete = function(id) {
    if(!confirm('تأكيد انتهاء مرحلة التصنيع وتحويل المنتج إلى قسم الجودة (Quality)؟')) return;
    SalesWorkflow.updateStatus(id, 'Under Quality Inspection', {}, render);
  };

  render();
};
