// =============================================
// ERP Manufacturing Module - BOM + Stages
// =============================================
var ERPManufacturing = {

  renderBOM: function() {
    var html = '<div class="page-header"><h2>📋 Bill of Materials (مكونات المنتج)</h2>';
    html += '<button class="btn btn-primary" onclick="ERPManufacturing.addBOM()">+ إضافة BOM جديد</button></div>';
    html += '<div id="bom-list" class="grid-cards"><div class="loading">جاري التحميل...</div></div>';
    document.getElementById('page-content').innerHTML = html;
    ERPManufacturing.loadBOMs();
  },

  loadBOMs: function() {
    sbClient.from('bom').select('*, products(name)').order('created_at',{ascending:false}).then(function(r) {
      if (r.error) { document.getElementById('bom-list').innerHTML = '<p class="text-muted">خطأ: '+r.error.message+'</p>'; return; }
      var items = r.data || [];
      if (!items.length) { document.getElementById('bom-list').innerHTML = '<div class="empty-state">لا توجد BOMs بعد</div>'; return; }
      var html = '<table class="data-table"><thead><tr><th>المنتج</th><th>الاسم</th><th>الإصدار</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';
      items.forEach(function(b) {
        html += '<tr><td>'+(b.products?b.products.name:'-')+'</td><td>'+b.name+'</td><td>v'+b.version+'</td>';
        html += '<td><span class="badge badge-'+(b.status==='active'?'success':'secondary')+'">'+b.status+'</span></td>';
        html += '<td><button class="btn btn-xs btn-outline" onclick="ERPManufacturing.viewBOM(\''+b.id+'\')">عرض</button> ';
        html += '<button class="btn btn-xs btn-danger" onclick="ERPManufacturing.deleteBOM(\''+b.id+'\')">حذف</button></td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('bom-list').innerHTML = html;
    });
  },

  addBOM: function() {
    sbClient.from('products').select('id,name').then(function(r) {
      var products = r.data || [];
      var opts = products.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('');
      showModal('إضافة BOM جديد', '<div class="form-group"><label>المنتج</label><select class="form-input" id="bom-product">'+opts+'</select></div>' +
        '<div class="form-group"><label>اسم الـ BOM</label><input class="form-input" id="bom-name" placeholder="مثال: BOM رئيسي"></div>' +
        '<div class="form-group"><label>ملاحظات</label><textarea class="form-input" id="bom-notes"></textarea></div>' +
        '<button class="btn btn-primary" onclick="ERPManufacturing.saveBOM()">حفظ</button>');
    });
  },

  saveBOM: function() {
    var data = { product_id: document.getElementById('bom-product').value, name: document.getElementById('bom-name').value,
      notes: document.getElementById('bom-notes').value, created_by: App.user ? App.user.id : null };
    if (!data.name) { showToast('أدخل اسم الـ BOM','error'); return; }
    sbClient.from('bom').insert(data).select().then(function(r) {
      if (r.error) { showToast('خطأ: '+r.error.message,'error'); return; }
      closeModal(); showToast('تم إنشاء BOM بنجاح ✅','success'); ERPManufacturing.loadBOMs();
    });
  },

  viewBOM: function(id) {
    sbClient.from('bom').select('*, products(name)').eq('id',id).single().then(function(r) {
      if (r.error) return;
      var b = r.data;
      var html = '<div class="page-header"><h2>📋 '+b.name+' <small>('+(b.products?b.products.name:'')+')</small></h2>';
      html += '<button class="btn btn-primary" onclick="ERPManufacturing.addBOMItem(\''+id+'\')">+ إضافة خامة</button>';
      html += '<button class="btn btn-outline" onclick="ERPManufacturing.renderBOM()" style="margin-right:8px">رجوع</button></div>';
      html += '<div id="bom-items-list"><div class="loading">جاري التحميل...</div></div>';
      document.getElementById('page-content').innerHTML = html;
      ERPManufacturing.loadBOMItems(id);
    });
  },

  loadBOMItems: function(bomId) {
    sbClient.from('bom_items').select('*').eq('bom_id',bomId).order('sort_order').then(function(r) {
      var items = r.data || [];
      if (!items.length) { document.getElementById('bom-items-list').innerHTML = '<div class="empty-state">لا توجد خامات. أضف خامات للـ BOM.</div>'; return; }
      var total = 0;
      var html = '<table class="data-table"><thead><tr><th>#</th><th>الخامة</th><th>الكمية</th><th>الوحدة</th><th>نسبة الهالك %</th><th>تكلفة/وحدة</th><th>الإجمالي</th><th>إجراءات</th></tr></thead><tbody>';
      items.forEach(function(it,i) {
        var cost = it.quantity * it.cost_per_unit;
        total += cost;
        html += '<tr><td>'+(i+1)+'</td><td>'+it.material_name+(it.material_name_ar?' ('+it.material_name_ar+')':'')+'</td>';
        html += '<td>'+it.quantity+'</td><td>'+it.unit+'</td><td>'+it.waste_percent+'%</td>';
        html += '<td>'+it.cost_per_unit+'</td><td>'+cost.toFixed(2)+'</td>';
        html += '<td><button class="btn btn-xs btn-danger" onclick="ERPManufacturing.deleteBOMItem(\''+it.id+'\',\''+it.bom_id+'\')">حذف</button></td></tr>';
      });
      html += '</tbody><tfoot><tr><td colspan="6"><strong>إجمالي تكلفة المكونات</strong></td><td><strong>'+total.toFixed(2)+' EGP</strong></td><td></td></tr></tfoot></table>';
      document.getElementById('bom-items-list').innerHTML = html;
    });
  },

  addBOMItem: function(bomId) {
    showModal('إضافة خامة', '<div class="form-group"><label>اسم الخامة (EN)</label><input class="form-input" id="bi-name"></div>' +
      '<div class="form-group"><label>اسم الخامة (AR)</label><input class="form-input" id="bi-name-ar"></div>' +
      '<div class="form-row"><div class="form-group" style="flex:1"><label>الكمية</label><input type="number" class="form-input" id="bi-qty" value="0"></div>' +
      '<div class="form-group" style="flex:1"><label>الوحدة</label><select class="form-input" id="bi-unit"><option>KG</option><option>Liter</option><option>Piece</option><option>Meter</option><option>Box</option></select></div></div>' +
      '<div class="form-row"><div class="form-group" style="flex:1"><label>هالك %</label><input type="number" class="form-input" id="bi-waste" value="0"></div>' +
      '<div class="form-group" style="flex:1"><label>تكلفة/وحدة</label><input type="number" class="form-input" id="bi-cost" value="0"></div></div>' +
      '<button class="btn btn-primary" onclick="ERPManufacturing.saveBOMItem(\''+bomId+'\')">حفظ</button>');
  },

  saveBOMItem: function(bomId) {
    var data = { bom_id: bomId, material_name: document.getElementById('bi-name').value,
      material_name_ar: document.getElementById('bi-name-ar').value,
      quantity: parseFloat(document.getElementById('bi-qty').value)||0,
      unit: document.getElementById('bi-unit').value,
      waste_percent: parseFloat(document.getElementById('bi-waste').value)||0,
      cost_per_unit: parseFloat(document.getElementById('bi-cost').value)||0 };
    if (!data.material_name) { showToast('أدخل اسم الخامة','error'); return; }
    sbClient.from('bom_items').insert(data).then(function(r) {
      if (r.error) { showToast('خطأ: '+r.error.message,'error'); return; }
      closeModal(); showToast('تمت الإضافة ✅','success'); ERPManufacturing.loadBOMItems(bomId);
    });
  },

  deleteBOM: function(id) { if(confirm('حذف الـ BOM؟')) sbClient.from('bom').delete().eq('id',id).then(function(){ERPManufacturing.loadBOMs();}); },
  deleteBOMItem: function(id,bomId) { if(confirm('حذف الخامة؟')) sbClient.from('bom_items').delete().eq('id',id).then(function(){ERPManufacturing.loadBOMItems(bomId);}); },

  // ===== PRODUCTION STAGES =====
  renderStages: function(orderId) {
    sbClient.from('production_stage_logs').select('*').eq('production_order_id',orderId).order('created_at').then(function(r) {
      var logs = r.data || [];
      var html = '<div class="timeline">';
      logs.forEach(function(s) {
        var icon = s.status==='completed'?'✅':s.status==='in_progress'?'🔄':s.status==='failed'?'❌':'⏳';
        html += '<div class="timeline-item"><div class="timeline-icon">'+icon+'</div><div class="timeline-content">';
        html += '<h4>'+s.stage_name+'</h4><p>الحالة: '+s.status+'</p>';
        if(s.quantity_in) html += '<p>دخول: '+s.quantity_in+' | خروج: '+(s.quantity_out||0)+' | هالك: '+(s.waste_quantity||0)+'</p>';
        if(s.started_at) html += '<p>بدأ: '+new Date(s.started_at).toLocaleString('ar-EG')+'</p>';
        html += '</div></div>';
      });
      html += '</div>';
      return html;
    });
  },

  initStagesForOrder: function(orderId) {
    sbClient.from('production_stage_templates').select('*').eq('status','active').order('sort_order').then(function(r) {
      var templates = r.data || [];
      var logs = templates.map(function(t) {
        return { production_order_id: orderId, stage_template_id: t.id, stage_name: t.name, status: 'pending' };
      });
      sbClient.from('production_stage_logs').insert(logs).then(function(r2) {
        if (r2.error) console.error(r2.error); else showToast('تم تهيئة مراحل الإنتاج ✅','success');
      });
    });
  }
};

if (typeof window !== 'undefined') window.ERPManufacturing = ERPManufacturing;
