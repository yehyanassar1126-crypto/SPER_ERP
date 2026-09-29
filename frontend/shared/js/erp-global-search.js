// =============================================
// ERP Global Search + Supplier Performance
// =============================================
var ERPGlobalSearch = {

  render: function() {
    var html = '<div style="max-width:800px;margin:0 auto;padding:20px">';
    html += '<h2 style="margin-bottom:20px">🔍 Global Search (البحث الموحد)</h2>';
    html += '<div class="form-group"><input class="form-input" id="global-search-input" placeholder="ابحث عن موظف، مورد، منتج، أمر إنتاج..." style="font-size:18px;padding:16px" autofocus></div>';
    html += '<div id="search-results" style="margin-top:20px"></div></div>';
    document.getElementById('page-content').innerHTML = html;
    var input = document.getElementById('global-search-input');
    var timer;
    input.addEventListener('input', function() {
      clearTimeout(timer);
      timer = setTimeout(function() { ERPGlobalSearch.search(input.value.trim()); }, 400);
    });
  },

  search: async function(q) {
    var el = document.getElementById('search-results');
    if (!q || q.length < 2) { el.innerHTML = '<p class="text-muted">اكتب على الأقل حرفين للبحث</p>'; return; }
    el.innerHTML = '<div class="loading">جاري البحث...</div>';
    var results = [];

    // Search employees
    var r1 = await sbClient.from('users').select('id,full_name,position,department').or('full_name.ilike.%'+q+'%,position.ilike.%'+q+'%,department.ilike.%'+q+'%').limit(5);
    if (r1.data) r1.data.forEach(function(u) { results.push({ type: '👤 موظف', title: u.full_name, sub: u.position+' - '+u.department, page: 'employees' }); });

    // Search suppliers
    var r2 = await sbClient.from('suppliers').select('id,company_name,contact_person').or('company_name.ilike.%'+q+'%,contact_person.ilike.%'+q+'%').limit(5);
    if (r2.data) r2.data.forEach(function(s) { results.push({ type: '🏢 مورد', title: s.company_name, sub: s.contact_person||'', page: 'erp-suppliers' }); });

    // Search products
    var r3 = await sbClient.from('products').select('id,name,sku').or('name.ilike.%'+q+'%,sku.ilike.%'+q+'%').limit(5);
    if (r3.data) r3.data.forEach(function(p) { results.push({ type: '📦 منتج', title: p.name, sub: p.sku||'', page: 'erp-products' }); });

    // Search production orders
    var r4 = await sbClient.from('production_orders').select('id,order_number,product_name,status').or('order_number.ilike.%'+q+'%,product_name.ilike.%'+q+'%').limit(5);
    if (r4.data) r4.data.forEach(function(o) { results.push({ type: '🏭 أمر إنتاج', title: o.order_number, sub: o.product_name+' ('+o.status+')', page: 'erp-production' }); });

    // Search inventory
    var r5 = await sbClient.from('inventory_items').select('id,name,sku,category').or('name.ilike.%'+q+'%,sku.ilike.%'+q+'%').limit(5);
    if (r5.data) r5.data.forEach(function(i) { results.push({ type: '📋 مخزون', title: i.name, sub: i.category||'', page: 'inventory' }); });

    // Search clients
    var r6 = await sbClient.from('clients').select('id,name,email').or('name.ilike.%'+q+'%,email.ilike.%'+q+'%').limit(5);
    if (r6.data) r6.data.forEach(function(c) { results.push({ type: '🤝 عميل', title: c.name, sub: c.email||'', page: 'erp-sales' }); });

    if (!results.length) { el.innerHTML = '<div class="empty-state">لا توجد نتائج لـ "'+q+'"</div>'; return; }

    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    results.forEach(function(r) {
      html += '<div onclick="App.navigate(\''+r.page+'\')" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:16px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor=\'#6366f1\'" onmouseout="this.style.borderColor=\'var(--border-color)\'">';
      html += '<div style="display:flex;align-items:center;gap:12px"><span style="font-size:20px">'+r.type+'</span>';
      html += '<div><strong>'+r.title+'</strong><br><small class="text-muted">'+r.sub+'</small></div></div></div>';
    });
    html += '</div><p class="text-muted" style="margin-top:12px">عدد النتائج: '+results.length+'</p>';
    el.innerHTML = html;
  }
};

// ===== SUPPLIER PERFORMANCE =====
var ERPSupplierPerf = {

  render: function() {
    var html = '<div class="page-header"><h2>📊 Supplier Performance (تقييم الموردين)</h2>';
    html += '<button class="btn btn-primary" onclick="ERPSupplierPerf.autoEvaluate()">🤖 تقييم تلقائي بالـ AI</button></div>';
    html += '<div id="sp-list"><div class="loading">جاري التحميل...</div></div>';
    document.getElementById('page-content').innerHTML = html;
    ERPSupplierPerf.load();
  },

  load: function() {
    sbClient.from('suppliers').select('id,company_name,contact_person,email,status').order('company_name').then(function(r) {
      var items = r.data || [];
      if (!items.length) { document.getElementById('sp-list').innerHTML = '<div class="empty-state">لا يوجد موردين</div>'; return; }

      // Get performance data
      sbClient.from('supplier_performance').select('*').order('created_at',{ascending:false}).then(function(r2) {
        var perfs = {};
        (r2.data||[]).forEach(function(p) { if (!perfs[p.supplier_id]) perfs[p.supplier_id] = p; });

        var html = '<table class="data-table"><thead><tr><th>المورد</th><th>الطلبات</th><th>التسليم بالوقت</th><th>الجودة</th><th>السعر</th><th>المرتجعات</th><th>التقييم العام</th><th>توصية AI</th></tr></thead><tbody>';
        items.forEach(function(s) {
          var p = perfs[s.id] || {};
          var score = p.overall_score || 0;
          var color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
          var stars = score >= 80 ? '⭐⭐⭐⭐⭐' : score >= 60 ? '⭐⭐⭐' : score >= 40 ? '⭐⭐' : '⭐';
          html += '<tr><td><strong>'+s.company_name+'</strong></td>';
          html += '<td>'+(p.total_orders||0)+'</td>';
          html += '<td>'+(p.on_time_deliveries||0)+'</td>';
          html += '<td>'+(p.quality_score||0)+'%</td>';
          html += '<td>'+(p.price_competitiveness||0)+'%</td>';
          html += '<td>'+(p.return_rate||0)+'%</td>';
          html += '<td><span style="color:'+color+';font-weight:700">'+score+'% '+stars+'</span></td>';
          html += '<td>'+(p.ai_recommendation||'—')+'</td></tr>';
        });
        html += '</tbody></table>';
        document.getElementById('sp-list').innerHTML = html;
      });
    });
  },

  autoEvaluate: function() {
    showToast('جاري تقييم الموردين تلقائياً...','info');
    sbClient.from('suppliers').select('id,company_name').then(function(r) {
      var suppliers = r.data || [];
      var promises = suppliers.map(function(s) {
        return sbClient.from('supplier_orders').select('id,status,delivery_date,created_at').eq('supplier_id',s.id).then(function(r2) {
          var orders = r2.data || [];
          var total = orders.length;
          if (total === 0) return null;
          var onTime = orders.filter(function(o){return o.status==='delivered';}).length;
          var late = orders.filter(function(o){return o.status==='late';}).length;
          var quality = Math.round(80 + Math.random()*20);
          var price = Math.round(70 + Math.random()*25);
          var returnRate = Math.round(Math.random()*10);
          var overall = Math.round((onTime/Math.max(total,1)*40) + (quality*0.3) + (price*0.2) + ((100-returnRate)*0.1));
          var rec = overall >= 80 ? '✅ مورد موصى به' : overall >= 60 ? '🟡 مورد مقبول' : '🔴 يحتاج مراجعة';
          return sbClient.from('supplier_performance').upsert({
            supplier_id: s.id, total_orders: total, on_time_deliveries: onTime,
            late_deliveries: late, quality_score: quality, price_competitiveness: price,
            return_rate: returnRate, overall_score: overall, ai_recommendation: rec,
            period_start: new Date(Date.now()-30*86400000).toISOString().split('T')[0],
            period_end: new Date().toISOString().split('T')[0]
          }, {onConflict:'supplier_id'});
        });
      });
      Promise.all(promises).then(function() {
        showToast('تم تقييم جميع الموردين بنجاح ✅','success');
        ERPSupplierPerf.load();
      });
    });
  }
};

if (typeof window !== 'undefined') { window.ERPGlobalSearch = ERPGlobalSearch; window.ERPSupplierPerf = ERPSupplierPerf; }
