// =============================================
// ERP Equipment & Maintenance Companies Module
// =============================================
var ERPEquipment = {

  renderEquipment: function() {
    var html = '<div class="page-header"><h2>🏗️ Equipment Management (إدارة المعدات)</h2>';
    html += '<button class="btn btn-primary" onclick="ERPEquipment.addEquipment()">+ معدة جديدة</button></div>';
    html += '<div class="stats-grid" id="equip-stats"></div>';
    html += '<div id="equip-list"><div class="loading">جاري التحميل...</div></div>';
    document.getElementById('page-content').innerHTML = html;
    ERPEquipment.loadEquipment();
  },

  loadEquipment: function() {
    sbClient.from('equipment').select('*, equipment_categories(name,name_ar)').order('created_at',{ascending:false}).then(function(r) {
      var items = r.data || [];
      var avail=0,rented=0,maint=0;
      items.forEach(function(e){if(e.status==='available')avail++;else if(e.status==='rented')rented++;else if(e.status==='maintenance')maint++;});
      document.getElementById('equip-stats').innerHTML =
        '<div class="stat-card"><div class="stat-value">'+items.length+'</div><div class="stat-label">إجمالي المعدات</div></div>'+
        '<div class="stat-card" style="border-color:#10b981"><div class="stat-value" style="color:#10b981">'+avail+'</div><div class="stat-label">متاحة</div></div>'+
        '<div class="stat-card" style="border-color:#f59e0b"><div class="stat-value" style="color:#f59e0b">'+rented+'</div><div class="stat-label">مؤجرة</div></div>'+
        '<div class="stat-card" style="border-color:#ef4444"><div class="stat-value" style="color:#ef4444">'+maint+'</div><div class="stat-label">صيانة</div></div>';
      if(!items.length){document.getElementById('equip-list').innerHTML='<div class="empty-state">لا توجد معدات</div>';return;}
      var html='<table class="data-table"><thead><tr><th>الكود</th><th>الاسم</th><th>التصنيف</th><th>الموقع</th><th>الحالة</th><th>إيجار شهري</th><th>إجراءات</th></tr></thead><tbody>';
      items.forEach(function(e){
        var badge=e.status==='available'?'success':e.status==='rented'?'warning':'danger';
        html+='<tr><td>'+(e.code||'-')+'</td><td>'+e.name+(e.name_ar?' ('+e.name_ar+')':'')+'</td>';
        html+='<td>'+(e.equipment_categories?e.equipment_categories.name:'-')+'</td><td>'+(e.location||'-')+'</td>';
        html+='<td><span class="badge badge-'+badge+'">'+e.status+'</span></td><td>'+(e.monthly_rate||0)+' EGP</td>';
        html+='<td><button class="btn btn-xs btn-outline" onclick="ERPEquipment.rentEquipment(\''+e.id+'\')">تأجير</button></td></tr>';
      });
      html+='</tbody></table>';
      document.getElementById('equip-list').innerHTML=html;
    });
  },

  addEquipment: function() {
    sbClient.from('equipment_categories').select('*').then(function(r) {
      var cats = (r.data||[]).map(function(c){return '<option value="'+c.id+'">'+c.name+(c.name_ar?' - '+c.name_ar:'')+'</option>';}).join('');
      showModal('إضافة معدة جديدة',
        '<div class="form-row"><div class="form-group" style="flex:1"><label>الاسم EN</label><input class="form-input" id="eq-name"></div>'+
        '<div class="form-group" style="flex:1"><label>الاسم AR</label><input class="form-input" id="eq-name-ar"></div></div>'+
        '<div class="form-row"><div class="form-group" style="flex:1"><label>الكود</label><input class="form-input" id="eq-code"></div>'+
        '<div class="form-group" style="flex:1"><label>التصنيف</label><select class="form-input" id="eq-cat">'+cats+'</select></div></div>'+
        '<div class="form-row"><div class="form-group" style="flex:1"><label>الموقع</label><input class="form-input" id="eq-loc"></div>'+
        '<div class="form-group" style="flex:1"><label>الرقم التسلسلي</label><input class="form-input" id="eq-serial"></div></div>'+
        '<div class="form-row"><div class="form-group" style="flex:1"><label>إيجار يومي</label><input type="number" class="form-input" id="eq-daily" value="0"></div>'+
        '<div class="form-group" style="flex:1"><label>إيجار أسبوعي</label><input type="number" class="form-input" id="eq-weekly" value="0"></div>'+
        '<div class="form-group" style="flex:1"><label>إيجار شهري</label><input type="number" class="form-input" id="eq-monthly" value="0"></div></div>'+
        '<button class="btn btn-primary" onclick="ERPEquipment.saveEquipment()">حفظ</button>');
    });
  },

  saveEquipment: function() {
    var d={name:document.getElementById('eq-name').value,name_ar:document.getElementById('eq-name-ar').value,
      code:document.getElementById('eq-code').value,category_id:document.getElementById('eq-cat').value,
      location:document.getElementById('eq-loc').value,serial_number:document.getElementById('eq-serial').value,
      daily_rate:parseFloat(document.getElementById('eq-daily').value)||0,
      weekly_rate:parseFloat(document.getElementById('eq-weekly').value)||0,
      monthly_rate:parseFloat(document.getElementById('eq-monthly').value)||0,
      created_by:App.user?App.user.id:null};
    if(!d.name){showToast('أدخل اسم المعدة','error');return;}
    sbClient.from('equipment').insert(d).then(function(r){
      if(r.error){showToast('خطأ: '+r.error.message,'error');return;}
      closeModal();showToast('تمت الإضافة ✅','success');ERPEquipment.loadEquipment();
    });
  },

  rentEquipment: function(eqId) {
    showModal('تأجير معدة',
      '<div class="form-row"><div class="form-group" style="flex:1"><label>تاريخ البداية</label><input type="date" class="form-input" id="rent-start"></div>'+
      '<div class="form-group" style="flex:1"><label>تاريخ النهاية</label><input type="date" class="form-input" id="rent-end"></div></div>'+
      '<div class="form-group"><label>نوع الإيجار</label><select class="form-input" id="rent-type"><option value="daily">يومي</option><option value="weekly">أسبوعي</option><option value="monthly" selected>شهري</option></select></div>'+
      '<div class="form-group"><label>المبلغ</label><input type="number" class="form-input" id="rent-amount" value="0"></div>'+
      '<div class="form-group"><label>ملاحظات</label><textarea class="form-input" id="rent-notes"></textarea></div>'+
      '<button class="btn btn-primary" onclick="ERPEquipment.saveRental(\''+eqId+'\')">تأجير</button>');
  },

  saveRental: function(eqId) {
    var d={equipment_id:eqId,start_date:document.getElementById('rent-start').value,
      end_date:document.getElementById('rent-end').value,rate_type:document.getElementById('rent-type').value,
      rate_amount:parseFloat(document.getElementById('rent-amount').value)||0,
      rental_number:'RNT-'+Date.now(),status:'active',notes:document.getElementById('rent-notes').value,
      created_by:App.user?App.user.id:null};
    sbClient.from('equipment_rentals').insert(d).then(function(r){
      if(r.error){showToast('خطأ: '+r.error.message,'error');return;}
      sbClient.from('equipment').update({status:'rented'}).eq('id',eqId).then(function(){
        closeModal();showToast('تم التأجير ✅','success');ERPEquipment.loadEquipment();
      });
    });
  },

  // ===== MAINTENANCE COMPANIES =====
  renderMaintCompanies: function() {
    var html='<div class="page-header"><h2>🏢 Maintenance Companies (شركات الصيانة)</h2>';
    html+='<button class="btn btn-primary" onclick="ERPEquipment.addMaintCompany()">+ شركة جديدة</button></div>';
    html+='<div id="maint-list"><div class="loading">جاري التحميل...</div></div>';
    document.getElementById('page-content').innerHTML=html;
    ERPEquipment.loadMaintCompanies();
  },

  loadMaintCompanies: function() {
    sbClient.from('maintenance_companies').select('*').order('created_at',{ascending:false}).then(function(r){
      var items=r.data||[];
      if(!items.length){document.getElementById('maint-list').innerHTML='<div class="empty-state">لا توجد شركات صيانة</div>';return;}
      var html='<table class="data-table"><thead><tr><th>الشركة</th><th>المسئول</th><th>الهاتف</th><th>التقييم</th><th>الزيارات</th><th>إجمالي الصرف</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';
      items.forEach(function(c){
        var stars='⭐'.repeat(Math.round(c.rating||0));
        html+='<tr><td>'+c.name+(c.name_ar?' ('+c.name_ar+')':'')+'</td><td>'+(c.contact_person||'-')+'</td><td>'+(c.phone||'-')+'</td>';
        html+='<td>'+stars+' ('+(c.rating||0)+')</td><td>'+(c.total_visits||0)+'</td><td>'+(c.total_spending||0)+' EGP</td>';
        html+='<td><span class="badge badge-'+(c.status==='active'?'success':'danger')+'">'+c.status+'</span></td>';
        html+='<td><button class="btn btn-xs btn-outline" onclick="ERPEquipment.addVisit(\''+c.id+'\')">زيارة</button></td></tr>';
      });
      html+='</tbody></table>';
      document.getElementById('maint-list').innerHTML=html;
    });
  },

  addMaintCompany: function() {
    showModal('إضافة شركة صيانة',
      '<div class="form-row"><div class="form-group" style="flex:1"><label>الاسم EN</label><input class="form-input" id="mc-name"></div>'+
      '<div class="form-group" style="flex:1"><label>الاسم AR</label><input class="form-input" id="mc-name-ar"></div></div>'+
      '<div class="form-row"><div class="form-group" style="flex:1"><label>المسئول</label><input class="form-input" id="mc-contact"></div>'+
      '<div class="form-group" style="flex:1"><label>الهاتف</label><input class="form-input" id="mc-phone"></div></div>'+
      '<div class="form-group"><label>الخدمات</label><textarea class="form-input" id="mc-services" placeholder="صيانة كهربائية، ميكانيكية..."></textarea></div>'+
      '<button class="btn btn-primary" onclick="ERPEquipment.saveMaintCompany()">حفظ</button>');
  },

  saveMaintCompany: function() {
    var d={name:document.getElementById('mc-name').value,name_ar:document.getElementById('mc-name-ar').value,
      contact_person:document.getElementById('mc-contact').value,phone:document.getElementById('mc-phone').value,
      services:document.getElementById('mc-services').value,created_by:App.user?App.user.id:null};
    if(!d.name){showToast('أدخل اسم الشركة','error');return;}
    sbClient.from('maintenance_companies').insert(d).then(function(r){
      if(r.error){showToast('خطأ: '+r.error.message,'error');return;}
      closeModal();showToast('تمت الإضافة ✅','success');ERPEquipment.loadMaintCompanies();
    });
  },

  addVisit: function(companyId) {
    showModal('تسجيل زيارة صيانة',
      '<div class="form-group"><label>تاريخ الزيارة</label><input type="date" class="form-input" id="mv-date" value="'+new Date().toISOString().split('T')[0]+'"></div>'+
      '<div class="form-group"><label>المشكلة</label><textarea class="form-input" id="mv-problem"></textarea></div>'+
      '<div class="form-group"><label>العمل المنفذ</label><textarea class="form-input" id="mv-work"></textarea></div>'+
      '<div class="form-row"><div class="form-group" style="flex:1"><label>تكلفة العمالة</label><input type="number" class="form-input" id="mv-labor" value="0"></div>'+
      '<div class="form-group" style="flex:1"><label>تكلفة القطع</label><input type="number" class="form-input" id="mv-parts" value="0"></div></div>'+
      '<button class="btn btn-primary" onclick="ERPEquipment.saveVisit(\''+companyId+'\')">حفظ</button>');
  },

  saveVisit: function(companyId) {
    var labor=parseFloat(document.getElementById('mv-labor').value)||0;
    var parts=parseFloat(document.getElementById('mv-parts').value)||0;
    var d={company_id:companyId,visit_number:'VIS-'+Date.now(),visit_date:document.getElementById('mv-date').value,
      problem_description:document.getElementById('mv-problem').value,work_description:document.getElementById('mv-work').value,
      labor_cost:labor,parts_cost:parts,total_cost:labor+parts,status:'completed',created_by:App.user?App.user.id:null};
    sbClient.from('maintenance_visits').insert(d).then(function(r){
      if(r.error){showToast('خطأ: '+r.error.message,'error');return;}
      // Update company totals
      sbClient.from('maintenance_companies').select('total_visits,total_spending').eq('id',companyId).single().then(function(c){
        if(c.data) sbClient.from('maintenance_companies').update({
          total_visits:(c.data.total_visits||0)+1, total_spending:(c.data.total_spending||0)+d.total_cost
        }).eq('id',companyId).then(function(){});
      });
      closeModal();showToast('تم تسجيل الزيارة ✅','success');ERPEquipment.loadMaintCompanies();
    });
  }
};

if (typeof window !== 'undefined') window.ERPEquipment = ERPEquipment;
