window.ERPSuppliers = {
  renderAdmin: function() {
    var isAllowed = App.isOwner() || (App.user && (App.user.role === 'hr manager' || App.user.department === 'Finance' || App.user.department === 'Sales'));
    if (!isAllowed) {
      document.getElementById('page-content').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-danger)"><h3>🚫 Access Denied</h3><p>This module is restricted to HR, Finance, Sales, and Owner.</p></div>';
      return;
    }
    var html = '<div class="header-banner"><div><h1>إدارة الموردين</h1><p>إدارة بيانات الموردين وأوامر الشراء والحسابات</p></div>';
    if (isAllowed) {
      html += '<button class="btn btn-primary" onclick="ERPSuppliers.addSupplier()">' + icon('plus') + ' إضافة مورد جديد</button>';
    }
    html += '</div>';

    html += '<div class="stats-grid" id="supplier-stats">Loading...</div>';
    
    html += '<div class="card" style="margin-top:20px"><div class="card-header"><h3>قائمة الموردين</h3></div>';
    html += '<div class="card-body" id="suppliers-list">Loading...</div></div>';
    
    document.getElementById('page-content').innerHTML = html;
    this.loadSuppliers();
  },

  loadSuppliers: function() {
    sbClient.from('suppliers').select('*').order('created_at', {ascending: false}).then(function(res) {
      if (res.error) {
        document.getElementById('suppliers-list').innerHTML = '<div class="empty-state">Error loading suppliers</div>';
        return;
      }
      var suppliers = res.data || [];
      
      sbClient.from('supplier_transactions').select('*').then(function(tRes) {
        var tx = tRes.data || [];
        sbClient.from('supplier_orders').select('*').then(function(oRes) {
          var orders = oRes.data || [];
          
          document.getElementById('supplier-stats').innerHTML = 
            '<div class="stat-card" style="--stat-color:#6366f1"><div class="stat-card-value">' + suppliers.length + '</div><div class="stat-card-label">إجمالي الموردين</div></div>' +
            '<div class="stat-card" style="--stat-color:#22c55e"><div class="stat-card-value">' + orders.length + '</div><div class="stat-card-label">أوامر الشراء</div></div>';

          if (suppliers.length === 0) {
            document.getElementById('suppliers-list').innerHTML = '<div class="empty-state">لا يوجد موردين حالياً. قم بإضافة مورد جديد.</div>';
            return;
          }

          var listHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>الشركة</th><th>جهة الاتصال</th><th>الهاتف</th><th>الإيميل</th><th>أوامر الشراء</th><th>الإجراءات</th></tr></thead><tbody>';
          
          suppliers.forEach(function(s) {
            var sOrders = orders.filter(function(o) { return o.supplier_id === s.id; });
            listHtml += '<tr>';
            listHtml += '<td><strong>' + s.company_name + '</strong></td>';
            listHtml += '<td>' + (s.contact_person || 'N/A') + '</td>';
            listHtml += '<td><span dir="ltr">' + (s.phone || 'N/A') + '</span></td>';
            listHtml += '<td>' + s.email + '</td>';
            listHtml += '<td><span class="badge" style="background:var(--bg-secondary);color:var(--text-primary)">' + sOrders.length + ' أوامر</span></td>';
            listHtml += '<td><div style="display:flex;gap:4px">';
            listHtml += '<button class="btn btn-sm btn-ghost" onclick="ERPSuppliers.viewSupplier(\'' + s.id + '\')">' + icon('eye', 16) + ' التفاصيل</button>';
            listHtml += '</div></td>';
            listHtml += '</tr>';
          });
          
          listHtml += '</tbody></table></div>';
          document.getElementById('suppliers-list').innerHTML = listHtml;
        });
      });
    });
  },

  addSupplier: function() {
    var html = '<div class="form-grid">';
    html += '<div class="form-group"><label class="form-label">اسم الشركة الموردة *</label><input type="text" id="sup-company" class="form-input"></div>';
    html += '<div class="form-group"><label class="form-label">اسم المستخدم (لتسجيل الدخول) *</label><input type="text" id="sup-email" class="form-input"></div>';
    html += '<div class="form-group"><label class="form-label">كلمة المرور (للبوابة) *</label><input type="text" id="sup-password" class="form-input"></div>';
    html += '<div class="form-group"><label class="form-label">رقم الهاتف</label><input type="text" id="sup-phone" class="form-input"></div>';
    html += '<div class="form-group"><label class="form-label">اسم جهة الاتصال</label><input type="text" id="sup-contact" class="form-input"></div>';
    html += '</div>';

    var footerHtml = '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" id="save-new-supplier">حفظ وإضافة</button>';

    App.showModal('إضافة مورد جديد', html, footerHtml);

    document.getElementById('save-new-supplier').addEventListener('click', function() {
        var comp = document.getElementById('sup-company').value.trim();
        var email = document.getElementById('sup-email').value.trim();
        var pass = document.getElementById('sup-password').value.trim();
        var phone = document.getElementById('sup-phone').value.trim();
        var contact = document.getElementById('sup-contact').value.trim();

        if (!comp || !email || !pass) return alert('يرجى ملء البيانات المطلوبة: اسم الشركة، اسم المستخدم، وكلمة المرور');

        var btn = this;
        var oldTxt = btn.innerHTML;
        btn.innerHTML = 'جاري الحفظ...'; btn.disabled = true;

        sbClient.from('suppliers').insert({
          company_name: comp, email: email, password_hash: pass,
          phone: phone, contact_person: contact
        }).then(function(res) {
          btn.innerHTML = oldTxt; btn.disabled = false;
          if (res.error) {
            alert('حدث خطأ: ' + res.error.message);
          } else {
            App.closeModal();
            ERPSuppliers.loadSuppliers();
          }
        });
    });
  },

  viewSupplier: function(id) {
    App.showModal('تفاصيل المورد', '<div style="padding:20px;text-align:center">جاري التحميل...</div>');
    
    Promise.all([
      sbClient.from('suppliers').select('*').eq('id', id).single(),
      sbClient.from('supplier_orders').select('*').eq('supplier_id', id).order('created_at', {ascending: false}),
      sbClient.from('supplier_transactions').select('*').eq('supplier_id', id).order('transaction_date', {ascending: false})
    ]).then(function(results) {
      if (results[0].error || !results[0].data) {
        document.querySelector('#app-modal .modal-body').innerHTML = '<div style="color:red">Error loading supplier: ' + (results[0].error ? results[0].error.message : 'Not found') + '</div>';
        return;
      }
      if (results[1].error) console.error("Supplier Orders Error:", results[1].error);
      if (results[2].error) console.error("Supplier Txs Error:", results[2].error);

      var s = results[0].data;
      var orders = results[1].data || [];
      var txs = results[2].data || [];

      // Calculate balance (orders total - transactions paid)
      var totalOrdered = orders.reduce(function(sum, o) { return sum + (o.status !== 'cancelled' ? Number(o.total_amount || 0) : 0); }, 0);
      var totalPaid = txs.reduce(function(sum, t) { return sum + Number(t.amount || 0); }, 0);
      var balance = totalOrdered - totalPaid;

      var html = '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px">';
      html += '<div style="flex:1;background:var(--bg-secondary);padding:15px;border-radius:var(--radius-md)">';
      html += '<h3 style="margin:0 0 10px;font-size:1.1rem">' + s.company_name + '</h3>';
      html += '<p style="margin:0 0 5px;font-size:0.85rem">اسم المستخدم: ' + s.email + '</p>';
      html += '<p style="margin:0 0 5px;font-size:0.85rem">الهاتف: <span dir="ltr">' + (s.phone||'N/A') + '</span></p>';
      html += '<p style="margin:0;font-size:0.85rem">كلمة المرور المسجلة: <code>' + s.password_hash + '</code></p>';
      html += '</div>';
      
      html += '<div style="width:200px;background:' + (balance > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)') + ';padding:15px;border-radius:var(--radius-md);text-align:center;display:flex;flex-direction:column;justify-content:center">';
      html += '<div style="font-size:0.8rem;color:var(--text-secondary)">رصيد مستحق للمورد</div>';
      html += '<div style="font-size:1.5rem;font-weight:900;color:' + (balance > 0 ? '#ef4444' : '#22c55e') + '">' + balance.toLocaleString() + ' ج.م</div>';
      html += '</div></div>';

      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
      html += '<h4 style="margin:0">أوامر الشراء (POs)</h4>';
      html += '<button class="btn btn-sm btn-primary" onclick="ERPSuppliers.addPO(\'' + id + '\')">' + icon('plus') + ' إضافة PO</button>';
      html += '</div>';

      if (orders.length === 0) {
        html += '<p style="font-size:0.85rem;color:var(--text-muted)">لا توجد أوامر شراء.</p>';
      } else {
        html += '<div style="max-height:150px;overflow-y:auto;margin-bottom:20px;border:1px solid var(--border-color);border-radius:4px">';
        html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem">';
        html += '<thead><tr style="background:var(--bg-secondary)"><th style="padding:6px">التاريخ</th><th style="padding:6px">التفاصيل</th><th style="padding:6px">القيمة</th><th style="padding:6px">الحالة</th></tr></thead><tbody>';
        orders.forEach(function(o) {
          html += '<tr style="border-top:1px solid var(--border-color)">';
          html += '<td style="padding:6px">' + formatDate(o.created_at) + '</td>';
          html += '<td style="padding:6px">' + o.order_details + '</td>';
          html += '<td style="padding:6px;font-weight:700">' + Number(o.total_amount).toLocaleString() + '</td>';
          html += '<td style="padding:6px">' + o.status + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }

      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
      html += '<h4 style="margin:0">الدفعات المالية والشيكات</h4>';
      html += '<button class="btn btn-sm btn-primary" onclick="ERPSuppliers.addPayment(\'' + id + '\')">' + icon('plus') + ' تسجيل دفعة</button>';
      html += '</div>';

      if (txs.length === 0) {
        html += '<p style="font-size:0.85rem;color:var(--text-muted)">لا توجد معاملات مادية.</p>';
      } else {
        html += '<div style="max-height:150px;overflow-y:auto;border:1px solid var(--border-color);border-radius:4px">';
        html += '<table style="width:100%;border-collapse:collapse;font-size:0.8rem">';
        html += '<thead><tr style="background:var(--bg-secondary)"><th style="padding:6px">التاريخ</th><th style="padding:6px">القيمة</th><th style="padding:6px">الطريقة</th><th style="padding:6px">حالة الشيك</th></tr></thead><tbody>';
        txs.forEach(function(t) {
          html += '<tr style="border-top:1px solid var(--border-color)">';
          html += '<td style="padding:6px">' + (t.transaction_date || formatDate(t.created_at)) + '</td>';
          html += '<td style="padding:6px;font-weight:700;color:var(--accent-primary)">' + Number(t.amount).toLocaleString() + '</td>';
          html += '<td style="padding:6px">' + (t.payment_method === 'check' ? 'شيك بنكي' : t.payment_method === 'cash' ? 'كاش' : 'تحويل بنكي') + '</td>';
          html += '<td style="padding:6px">' + (t.payment_method === 'check' ? t.check_status : '-') + '</td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }

      document.querySelector('#app-modal .modal-body').innerHTML = html;
      document.querySelector('#app-modal .modal-footer').innerHTML = '<button class="btn btn-secondary" onclick="App.closeModal()">إغلاق</button>';
    }).catch(function(err) {
      document.querySelector('#app-modal .modal-body').innerHTML = '<div style="color:red">Network or DB Error: ' + err.message + '</div>';
    });
  },

  addPO: function(supplierId) {
    var p = prompt("أدخل تفاصيل طلب الشراء (PO):");
    if (!p) return;
    var amt = prompt("أدخل إجمالي القيمة (بالجنيه):");
    if (!amt || isNaN(amt)) return alert('قيمة غير صحيحة');
    
    sbClient.from('supplier_orders').insert({
      supplier_id: supplierId,
      order_details: p,
      total_amount: Number(amt),
      status: 'pending'
    }).then(function(res) {
      if (!res.error) ERPSuppliers.viewSupplier(supplierId);
    });
  },

  addPayment: function(supplierId) {
    var amt = prompt("أدخل قيمة الدفعة (بالجنيه):");
    if (!amt || isNaN(amt)) return;
    var method = prompt("طريقة الدفع: cash | check | bank_transfer", "cash");
    if (!method) return;
    
    sbClient.from('supplier_transactions').insert({
      supplier_id: supplierId,
      amount: Number(amt),
      payment_method: method,
      transaction_date: new Date().toISOString().split('T')[0],
      check_status: method === 'check' ? 'pending' : 'N/A'
    }).then(function(res) {
      if (!res.error) ERPSuppliers.viewSupplier(supplierId);
    });
  },

  // ==================================
  // EXTERNAL SUPPLIER PORTAL
  // ==================================
  renderExternalPortal: function() {
    var supplierId = App.user.supplier_id; // Added during login
    
    var html = '<div class="header-banner" style="background:linear-gradient(135deg, #1e293b, #0f172a)"><div><h1>بوابة الموردين</h1><p>مرحباً بك، ' + App.user.full_name + '</p></div></div>';
    
    html += '<div class="stats-grid" id="sup-ext-stats" style="margin-top:-20px">Loading...</div>';
    
    html += '<div class="grid-2" style="margin-top:20px">';
    html += '<div class="card"><div class="card-header"><h3>أوامر الشراء الحالية والسابقة</h3></div><div class="card-body" id="sup-ext-orders">Loading...</div></div>';
    html += '<div class="card"><div class="card-header"><h3>كشف حساب مالي (الدفعات)</h3></div><div class="card-body" id="sup-ext-txs">Loading...</div></div>';
    html += '</div>';

    document.getElementById('page-content').innerHTML = html;
    
    Promise.all([
      sbClient.from('supplier_orders').select('*').eq('supplier_id', supplierId).order('created_at', {ascending: false}),
      sbClient.from('supplier_transactions').select('*').eq('supplier_id', supplierId).order('transaction_date', {ascending: false})
    ]).then(function(results) {
      var orders = results[0].data || [];
      var txs = results[1].data || [];

      var totalOrdered = orders.reduce(function(sum, o) { return sum + (o.status !== 'cancelled' ? Number(o.total_amount || 0) : 0); }, 0);
      var totalPaid = txs.reduce(function(sum, t) { return sum + Number(t.amount || 0); }, 0);
      var balance = totalOrdered - totalPaid;

      document.getElementById('sup-ext-stats').innerHTML = 
        '<div class="stat-card" style="--stat-color:#6366f1"><div class="stat-card-value">' + orders.length + '</div><div class="stat-card-label">عدد الطلبات</div></div>' +
        '<div class="stat-card" style="--stat-color:#ef4444"><div class="stat-card-value">' + totalOrdered.toLocaleString() + '</div><div class="stat-card-label">إجمالي التوريدات (ج.م)</div></div>' +
        '<div class="stat-card" style="--stat-color:#22c55e"><div class="stat-card-value">' + totalPaid.toLocaleString() + '</div><div class="stat-card-label">إجمالي المستلم (ج.م)</div></div>' +
        '<div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-card-value">' + balance.toLocaleString() + '</div><div class="stat-card-label">الرصيد المتبقي لك (ج.م)</div></div>';

      // Render Orders
      if (orders.length === 0) {
        document.getElementById('sup-ext-orders').innerHTML = '<div class="empty-state">لا يوجد طلبات شراء.</div>';
      } else {
        var oHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>التفاصيل</th><th>القيمة</th><th>الحالة</th></tr></thead><tbody>';
        orders.forEach(function(o) {
          oHtml += '<tr><td>' + formatDate(o.created_at) + '</td><td>' + o.order_details + '</td><td><strong>' + Number(o.total_amount).toLocaleString() + '</strong></td><td><span class="badge">' + o.status + '</span></td></tr>';
        });
        oHtml += '</tbody></table></div>';
        document.getElementById('sup-ext-orders').innerHTML = oHtml;
      }

      // Render TXs
      if (txs.length === 0) {
        document.getElementById('sup-ext-txs').innerHTML = '<div class="empty-state">لا يوجد معاملات مادية بعد.</div>';
      } else {
        var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th><th>المبلغ</th><th>طريقة الدفع</th><th>تفاصيل</th></tr></thead><tbody>';
        txs.forEach(function(t) {
          tHtml += '<tr><td>' + (t.transaction_date || formatDate(t.created_at)) + '</td><td style="color:var(--accent-primary);font-weight:700">' + Number(t.amount).toLocaleString() + '</td><td>' + t.payment_method + '</td><td>' + (t.payment_method === 'check' ? 'حالة الشيك: ' + t.check_status : '-') + '</td></tr>';
        });
        tHtml += '</tbody></table></div>';
        document.getElementById('sup-ext-txs').innerHTML = tHtml;
      }
    });
  },

  acceptDelivery: function(id) {
    if(!confirm('هل أنت متأكد من استلامك لهذه الطلبية كاملة بشكل صحيح؟')) return;
    sbClient.from('sales_workflow_orders').update({ status: 'Delivered' }).eq('id', id).then(function(res) {
      if (res.error) return alert("حدث خطأ: " + res.error.message);
      Pages['supplier-portal'](document.getElementById('page-content'));
    });
  },

  customerSendRequest: function() {
    var customerName = App.user.full_name;

    var b = '<div class="form-grid">';
    b += '<div class="form-group"><label>المنتج المطلوب *</label><input type="text" id="cust-req-prod" class="form-input"></div>';
    b += '<div class="form-group"><label>الكمية المطلوبة *</label><input type="number" id="cust-req-qty" class="form-input" min="1"></div>';
    b += '<div class="form-group"><label>تاريخ التسليم المطلوب *</label><input type="date" id="cust-req-date" class="form-input"></div>';
    b += '</div>';

    App.showModal('إرسال طلب شراء جديد', b, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="ERPSuppliers.saveCustomerRequest()">إرسال الطلب</button>');
  },

  saveCustomerRequest: function() {
    var prod = document.getElementById('cust-req-prod').value.trim();
    var qty = document.getElementById('cust-req-qty').value;
    var date = document.getElementById('cust-req-date').value;

    if (!prod || !qty || !date) return alert('يرجى ملء جميع الحقول المطلوبة.');

    var btn = document.querySelector('.modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الإرسال...'; }

    sbClient.from('sales_workflow_orders').insert({
      customer_name: App.user.full_name,
      product_name: prod,
      quantity_requested: Number(qty),
      delivery_date_requested: date,
      status: 'Pending Sales Review',
      created_by: App.user.id
    }).then(function(res) {
      if (res.error) {
        btn.disabled = false; btn.innerHTML = 'إرسال الطلب';
        return alert('حدث خطأ أثناء الإرسال: ' + res.error.message);
      }
      App.closeModal();
      alert('تم إرسال الطلب بنجاح. سنقوم بمراجعته والرد عليك قريباً.');
      Pages['supplier-portal'](document.getElementById('page-content'));
    });
  }
};

window.Pages = window.Pages || {};
Pages['supplier-portal'] = function(el) {
  var isSupplier = App.user && App.user.role === 'supplier_external';
  var isAuthInternal = App.isOwner() || (App.user && (App.user.department === 'Sales' || App.user.department === 'Finance'));
  
  if (!isSupplier && !isAuthInternal) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied</h2></div>';
    return;
  }

  var supplierId = isSupplier ? App.user.supplier_id : null;
  var customerName = isSupplier ? App.user.full_name : null;
  
  var title = isSupplier ? 'بوابة العملاء - ' + customerName : 'بوابة العملاء (إدارة المشتريات والطلبات)';
  var html = '<div class="header-banner" style="background:linear-gradient(135deg, #1e293b, #0f172a)"><div><h1>' + title + '</h1><p>' + (isSupplier ? 'مرحباً بك، تابع طلباتك وحساباتك هنا' : 'عرض كافة طلبات ومعاملات العملاء') + '</p></div></div>';
  
  html += '<div class="stats-grid" id="sup-ext-stats" style="margin-top:-20px">Loading...</div>';
  
  html += '<div class="grid-2" style="margin-top:20px">';
  var ordersHeader = '<h3>أوامر البيع / طلباتك</h3>';
  if (isSupplier) {
    ordersHeader += '<button class="btn btn-sm btn-primary" onclick="ERPSuppliers.customerSendRequest()">' + icon('plus') + ' طلب شراء جديد</button>';
  }
  
  html += '<div class="card" style="grid-column: span 2;"><div class="card-header" style="display:flex;justify-content:space-between;align-items:center">' + ordersHeader + '</div><div class="card-body" id="sup-ext-orders">Loading...</div></div>';
  html += '<div class="card" style="grid-column: span 2;"><div class="card-header"><h3>كشف حساب مالي (المدفوعات)</h3></div><div class="card-body" id="sup-ext-txs">Loading...</div></div>';
  html += '</div>';

  el.innerHTML = html;
  
  var pOrders = isSupplier 
    ? sbClient.from('sales_workflow_orders').select('*').eq('customer_name', customerName).order('created_at', {ascending: false})
    : sbClient.from('sales_workflow_orders').select('*').order('created_at', {ascending: false});
    
  var pTxs = supplierId
    ? sbClient.from('supplier_transactions').select('*').eq('supplier_id', supplierId).order('transaction_date', {ascending: false})
    : sbClient.from('supplier_transactions').select('*, suppliers(company_name)').order('transaction_date', {ascending: false});

  Promise.all([pOrders, pTxs]).then(function(results) {
    var orders = results[0].data || [];
    var txs = results[1].data || [];

    document.getElementById('sup-ext-stats').innerHTML = 
      '<div class="stat-card" style="--stat-color:#6366f1"><div class="stat-card-value">' + orders.length + '</div><div class="stat-card-label">إجمالي الطلبات</div></div>' +
      '<div class="stat-card" style="--stat-color:#22c55e"><div class="stat-card-value">' + orders.filter(o => o.status === 'Delivered').length + '</div><div class="stat-card-label">طلبات تم استلامها</div></div>' +
      '<div class="stat-card" style="--stat-color:#f59e0b"><div class="stat-card-value">' + txs.length + '</div><div class="stat-card-label">عدد الدفعات المسددة</div></div>';

    // Render Orders
    if (orders.length === 0) {
      document.getElementById('sup-ext-orders').innerHTML = '<div class="empty-state">لا يوجد طلبات شراء.</div>';
    } else {
      var oHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>تاريخ الطلب</th>' + (!isSupplier ? '<th>العميل</th>' : '') + '<th>المنتج المطلوب</th><th>الكمية المطلوبة</th><th>الكمية المتاحة/المعتمدة</th><th>تاريخ التسليم</th><th>الحالة</th><th>ملاحظات</th>' + (isSupplier ? '<th>إجراءات العميل</th>' : '') + '</tr></thead><tbody>';
      orders.forEach(function(o) {
        oHtml += '<tr>';
        oHtml += '<td>' + formatDate(o.created_at) + '</td>';
        if (!isSupplier) oHtml += '<td>' + o.customer_name + '</td>';
        oHtml += '<td><strong>' + o.product_name + '</strong></td>';
        oHtml += '<td>' + o.quantity_requested + '</td>';
        oHtml += '<td>' + (o.quantity_available !== null ? '<span style="color:var(--accent-primary)">' + o.quantity_available + '</span>' : '-') + '</td>';
        oHtml += '<td>' + (o.delivery_date_requested || '-') + '</td>';
        oHtml += '<td>' + (window.SalesWorkflow ? window.SalesWorkflow.getStatusBadge(o.status) : '<span class="badge">' + o.status + '</span>') + '</td>';
        oHtml += '<td>' + (o.rejection_reason || '-') + '</td>';
        if (isSupplier) {
          var acts = '';
          if (o.status === 'Out For Delivery') {
            acts = '<button class="btn btn-sm btn-success" onclick="ERPSuppliers.acceptDelivery(\''+o.id+'\')">تأكيد الاستلام ✅</button>';
          } else {
            acts = '-';
          }
          oHtml += '<td>' + acts + '</td>';
        }
        oHtml += '</tr>';
      });
      oHtml += '</tbody></table></div>';
      document.getElementById('sup-ext-orders').innerHTML = oHtml;
    }

    // Render TXs
    if (txs.length === 0) {
      document.getElementById('sup-ext-txs').innerHTML = '<div class="empty-state">لا يوجد معاملات مادية بعد.</div>';
    } else {
      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr><th>التاريخ</th>' + (!isSupplier ? '<th>المورد</th>' : '') + '<th>المبلغ</th><th>طريقة الدفع</th><th>تفاصيل</th></tr></thead><tbody>';
      txs.forEach(function(t) {
        var compName = t.suppliers ? t.suppliers.company_name : '-';
        tHtml += '<tr><td>' + (t.transaction_date || formatDate(t.created_at)) + '</td>' + (!isSupplier ? '<td>' + compName + '</td>' : '') + '<td style="color:var(--accent-primary);font-weight:700">' + Number(t.amount).toLocaleString() + '</td><td>' + t.payment_method + '</td><td>' + (t.payment_method === 'check' ? 'حالة الشيك: ' + t.check_status : '-') + '</td></tr>';
      });
      tHtml += '</tbody></table></div>';
      document.getElementById('sup-ext-txs').innerHTML = tHtml;
    }
  }).catch(function(err) {
    document.getElementById('sup-ext-orders').innerHTML = '<div style="color:red">Error: ' + err.message + '</div>';
    document.getElementById('sup-ext-txs').innerHTML = '';
  });
};
