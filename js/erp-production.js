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
    var html = '<div class="header-banner"><div><h1>إدارة الإنتاج (Production)</h1><p>أوامر التشغيل — المنتج تحت الفحص — نتائج الجودة</p></div></div>';
    html += '<div id="production-content" style="margin-top:20px">Loading...</div>';
    el.innerHTML = html;

    if (!window.SalesWorkflow) return alert('SalesWorkflow module missing!');

    SalesWorkflow.loadOrders(function(orders) {
      var relevantOrders = orders.filter(function(o) {
        return o.status === 'Production Started' ||
               o.status === 'Under Quality Inspection' ||
               o.status === 'Quality Rejected' ||
               o.status === 'Production Completed';
      });

      if (relevantOrders.length === 0) {
        document.getElementById('production-content').innerHTML = '<div class="empty-state">لا يوجد أوامر إنتاج مفتوحة</div>';
        return;
      }

      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>تاريخ الطلب</th><th>المنتج</th><th>الكمية</th>'
        + '<th>تاريخ التسليم</th><th>الحالة</th><th>ملاحظات الجودة</th><th>إجراءات</th>'
        + '</tr></thead><tbody>';

      relevantOrders.forEach(function(o) {
        var qty = o.quantity_available !== null ? o.quantity_available : o.quantity_requested;
        tHtml += '<tr>';
        tHtml += '<td>' + formatDate(o.created_at) + '</td>';
        tHtml += '<td><strong style="color:var(--accent-primary)">' + o.product_name + '</strong></td>';
        tHtml += '<td><strong>' + qty + '</strong></td>';
        tHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        tHtml += '<td>' + SalesWorkflow.getStatusBadge(o.status) + '</td>';
        tHtml += '<td>' + (o.rejection_reason ? '<span style="color:var(--accent-danger)">' + o.rejection_reason + '</span>' : '-') + '</td>';

        var actions = '';
        if (o.status === 'Production Started') {
          actions = '<button class="btn btn-sm btn-success" onclick="window.prodComplete(\'' + o.id + '\')">'
            + '✅ انتهى الإنتاج (إرسال للجودة)</button>';
        } else if (o.status === 'Quality Rejected') {
          actions = '<div style="display:flex;flex-direction:column;gap:4px">'
            + '<button class="btn btn-sm btn-warning" onclick="window.prodRework(\'' + o.id + '\')">🔄 إعادة تشغيل</button>'
            + '<button class="btn btn-sm btn-danger" onclick="window.prodScrap(\'' + o.id + '\')">🗑️ إهلاك (Scrap)</button>'
            + '</div>';
        } else if (o.status === 'Under Quality Inspection') {
          actions = '<span style="color:var(--text-muted);font-size:0.8rem">⏳ بانتظار قرار الجودة</span>';
        } else {
          actions = '<span style="color:var(--accent-success)">✅ مكتمل</span>';
        }

        tHtml += '<td>' + actions + '</td>';
        tHtml += '</tr>';
      });

      tHtml += '</tbody></table></div>';
      document.getElementById('production-content').innerHTML = tHtml;
    });
  }

  // Production done — send to Quality for inspection
  window.prodComplete = function(id) {
    var qty = prompt('أدخل الكمية المنتجة فعلياً:');
    if (qty === null || isNaN(qty) || qty === '') return;
    if (!confirm('تأكيد انتهاء التصنيع وتحويل المنتج لقسم الجودة للفحص النهائي؟')) return;
    SalesWorkflow.updateStatus(id, 'Under Quality Inspection', {
      quantity_available: Number(qty),
      rejection_reason: null
    }, function() {
      render();
      showToast('تم تسجيل المنتج كـ "تحت الفحص" وإرساله للجودة', 'success');
    });
  };

  // Quality rejected — rework
  window.prodRework = function(id) {
    if (!confirm('إعادة الكمية للإنتاج (Rework) للتصحيح؟')) return;
    SalesWorkflow.updateStatus(id, 'Production Started', { rejection_reason: 'إعادة تشغيل بعد رفض الجودة' }, function() {
      render();
      showToast('تم إعادة الكمية للإنتاج', 'warning');
    });
  };

  // Quality rejected — scrap
  window.prodScrap = function(id) {
    if (!confirm('تأكيد إهلاك (Scrap) الكمية المرفوضة؟ هذا الإجراء لا يمكن التراجع عنه.')) return;
    SalesWorkflow.updateStatus(id, 'Production Completed', { rejection_reason: 'هالك — قرار إعدام من الجودة' }, function() {
      render();
      showToast('تم تسجيل الكمية كهالك', 'error');
    });
  };

  render();
};
