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
    var html = '<div class="header-banner"><div><h1>إدارة الجودة (Quality Control)</h1><p>فحص المنتجات التامة واعتمادها للتسليم</p></div></div>';
    html += '<div id="quality-content" style="margin-top:20px">Loading...</div>';
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

  render();
};
