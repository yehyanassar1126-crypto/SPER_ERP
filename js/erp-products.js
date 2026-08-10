// ===== ERP MODULE: Products & Catalog System =====
window.Pages = window.Pages || {};

window.Pages.productsCatalog = function(el) {
  var isOwner = App.isOwner();
  var canEdit = isOwner || (App.user && App.user.department === 'Sales');
  var isWarehouse = App.user && App.user.department === 'Warehouse';
  var hasAccess = canEdit || isWarehouse;

  if (!hasAccess) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>إدارة المنتجات (Products & Catalog)</h1><p>إدارة الكتالوج العام وإضافة المنتجات للموقع</p></div>';
    if (canEdit) {
      html += '<div style="display:flex;gap:10px;"><button class="btn btn-outline" onclick="window.viewPublicCatalog()" style="background:white;color:#1e293b">' + icon('externalLink') + ' عرض الكتالوج العام</button>';
      html += '<button class="btn btn-primary" onclick="window.newProductForm()">' + icon('plus') + ' إضافة منتج جديد</button></div>';
    }
    html += '</div>';

    html += '<div id="products-content" style="margin-top:20px">جاري تحميل المنتجات...</div>';
    el.innerHTML = html;
    loadProducts();
  }

  function loadProducts() {
    sbClient.from('products').select('*, product_categories(name_ar, name_en), product_images(image_url, is_main)').order('created_at', {ascending: false}).then(function(res) {
      if (res.error) return document.getElementById('products-content').innerHTML = '<div class="alert alert-danger">خطأ: ' + res.error.message + '</div>';
      var data = res.data || [];
      
      if (data.length === 0) {
        document.getElementById('products-content').innerHTML = '<div class="empty-state">لا يوجد منتجات حالياً. أضف منتجاً جديداً للبدء.</div>';
        return;
      }

      var tableHtml = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>المنتج</th>'
        + '<th>الكود</th>'
        + '<th>التصنيف</th>'
        + '<th>المخزون (Warehouse)</th>'
        + '<th>سعر البيع (EGP)</th>'
        + '<th>حالة النشر (Public)</th>'
        + (canEdit ? '<th>إجراءات</th>' : '')
        + '</tr></thead><tbody>';

      data.forEach(function(p) {
        var mainImage = (p.product_images && p.product_images.length > 0) ? p.product_images[0].image_url : 'https://placehold.co/100x100?text=No+Image';
        var catName = p.product_categories ? p.product_categories.name_ar : '-';
        
        tableHtml += '<tr>';
        tableHtml += '<td><div style="display:flex;align-items:center;gap:12px;"><img src="' + mainImage + '" style="width:40px;height:40px;border-radius:6px;object-fit:cover;"><div><strong>' + p.name_ar + '</strong><br><small style="color:#64748b">' + p.name_en + '</small></div></div></td>';
        tableHtml += '<td>' + (p.code || '-') + '</td>';
        tableHtml += '<td>' + catName + '</td>';
        tableHtml += '<td><strong>' + (p.current_stock || 0) + '</strong> <span style="font-size:0.8rem;color:#64748b">' + p.unit + '</span></td>';
        tableHtml += '<td>' + (canEdit ? '<strong style="color:var(--accent-success)">' + (p.selling_price || 0) + '</strong>' : '<span style="color:#cbd5e1">مخفي</span>') + '</td>';
        
        var pubBadge = p.is_public 
            ? '<span class="badge badge-success">🌐 منشور للعامة</span>' 
            : '<span class="badge badge-warning">🔒 داخلي فقط</span>';
        tableHtml += '<td>' + pubBadge + '</td>';

        if (canEdit) {
          tableHtml += '<td><div style="display:flex;gap:4px">';
          tableHtml += '<button class="btn btn-sm btn-outline" onclick="window.toggleProductPublic(\'' + p.id + '\', ' + p.is_public + ')">' + (p.is_public ? 'إخفاء' : 'نشر للعامة') + '</button>';
          tableHtml += '</div></td>';
        }
        tableHtml += '</tr>';
      });

      tableHtml += '</tbody></table></div>';
      document.getElementById('products-content').innerHTML = tableHtml;
    });
  }

  window.toggleProductPublic = function(id, currentStatus) {
    var newStatus = !currentStatus;
    sbClient.from('products').update({is_public: newStatus}).eq('id', id).then(function(res) {
      if (res.error) return alert("خطأ: " + res.error.message);
      showToast('تم تحديث حالة المنتج بنجاح', 'success');
      loadProducts();
    });
  };

  window.viewPublicCatalog = function() {
    window.open('/public_catalog.html', '_blank');
  };

  window.newProductForm = function() {
    var html = '<div class="form-grid">';
    html += '<div class="form-group"><label>اسم المنتج (عربي) *</label><input type="text" id="p-name-ar" class="form-input"></div>';
    html += '<div class="form-group"><label>اسم المنتج (إنجليزي) *</label><input type="text" id="p-name-en" class="form-input"></div>';
    html += '<div class="form-group"><label>كود المنتج</label><input type="text" id="p-code" class="form-input"></div>';
    html += '<div class="form-group"><label>الوحدة (مثال: طن، قطعة)</label><input type="text" id="p-unit" class="form-input" value="Piece"></div>';
    html += '<div class="form-group"><label>سعر البيع (EGP)</label><input type="number" id="p-price" class="form-input" min="0"></div>';
    html += '<div class="form-group"><label>تنشره في الموقع العام؟</label><select id="p-public" class="form-input"><option value="true">نعم، منشور للعامة</option><option value="false">لا، داخلي فقط</option></select></div>';
    html += '<div class="form-group" style="grid-column: span 2;"><label>صورة المنتج (ارفع من جهازك)</label><input type="file" id="p-image" class="form-input" accept="image/*"></div>';
    html += '</div>';
    App.showModal('إضافة منتج جديد', html, '<button class="btn btn-outline" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="window.saveNewProduct()">حفظ المنتج</button>');
  };

  window.saveNewProduct = function() {
    var nameAr = document.getElementById('p-name-ar').value.trim();
    var nameEn = document.getElementById('p-name-en').value.trim();
    var code = document.getElementById('p-code').value.trim();
    var unit = document.getElementById('p-unit').value.trim();
    var price = document.getElementById('p-price').value;
    var isPub = document.getElementById('p-public').value === 'true';
    var imgInput = document.getElementById('p-image');

    if(!nameAr || !nameEn) return alert('يرجى إدخال اسم المنتج');

    var btn = document.querySelector('.modal-footer .btn-primary');
    if (btn) { btn.disabled = true; btn.innerHTML = 'جاري الحفظ...'; }

    var slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random()*1000);

    var processSave = function(base64Image) {
      sbClient.from('products').insert({
        name_ar: nameAr,
        name_en: nameEn,
        slug: slug,
        code: code,
        unit: unit,
        selling_price: price || 0,
        is_public: isPub,
        created_by: App.user.id
      }).select().then(function(res) {
        if (res.error) {
           if (btn) { btn.disabled = false; btn.innerHTML = 'حفظ المنتج'; }
           return alert("خطأ: " + res.error.message);
        }
        var newProduct = res.data[0];
        if (base64Image) {
          sbClient.from('product_images').insert({
            product_id: newProduct.id,
            image_url: base64Image,
            is_main: true
          }).then(function() {
            App.closeModal();
            showToast('تم إضافة المنتج بنجاح', 'success');
            loadProducts();
          });
        } else {
          App.closeModal();
          showToast('تم إضافة المنتج بنجاح', 'success');
          loadProducts();
        }
      });
    };

    if (imgInput.files && imgInput.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        processSave(e.target.result);
      };
      reader.readAsDataURL(imgInput.files[0]);
    } else {
      processSave('');
    }
  };

  render();
};

window.Pages.customerRequests = function(el) {
  var isOwner = App.isOwner();
  var isSales = App.user && (App.user.department === 'Sales' || App.user.role === 'sales manager');

  if (!isSales && !isOwner) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied</h2></div>';
    return;
  }

  function render() {
    var html = '<div class="header-banner"><div><h1>طلبات تسجيل العملاء (Customer Requests)</h1><p>مراجعة طلبات التسجيل الواردة من الكتالوج العام للموافقة عليها</p></div></div>';
    html += '<div id="requests-content" style="margin-top:20px">جاري التحميل...</div>';
    el.innerHTML = html;
    loadRequests();
  }

  function loadRequests() {
    sbClient.from('customer_registration_requests').select('*, products(name_ar)').order('created_at', {ascending: false}).then(function(res) {
      if (res.error) return document.getElementById('requests-content').innerHTML = '<div class="alert alert-danger">' + res.error.message + '</div>';
      var data = res.data || [];
      if (data.length === 0) {
        document.getElementById('requests-content').innerHTML = '<div class="empty-state">لا يوجد طلبات تسجيل حالياً.</div>';
        return;
      }
      var tHtml = '<div class="table-responsive"><table class="data-table"><thead><tr>'
        + '<th>التاريخ</th>'
        + '<th>اسم الشركة</th>'
        + '<th>الشخص المسئول</th>'
        + '<th>التواصل</th>'
        + '<th>المنتج المطلوب</th>'
        + '<th>الحالة</th>'
        + '<th>إجراءات</th>'
        + '</tr></thead><tbody>';

      data.forEach(function(r) {
        var prodName = r.products ? r.products.name_ar : '-';
        tHtml += '<tr>';
        tHtml += '<td>' + formatDateTime(r.created_at) + '</td>';
        tHtml += '<td><strong>' + r.company_name + '</strong></td>';
        tHtml += '<td>' + r.contact_person + '</td>';
        tHtml += '<td>📞 ' + r.phone + (r.email ? '<br>📧 ' + r.email : '') + '</td>';
        tHtml += '<td>' + prodName + ' (' + (r.requested_quantity || '-') + ')</td>';
        
        var badge = '';
        if (r.status === 'pending') badge = '<span class="badge badge-warning">⏳ بانتظار الموافقة</span>';
        else if (r.status === 'approved') badge = '<span class="badge badge-success">✅ معتمد (عميل نشط)</span>';
        else badge = '<span class="badge badge-danger">❌ مرفوض</span>';
        
        tHtml += '<td>' + badge + '</td>';
        tHtml += '<td>';
        if (r.status === 'pending') {
          tHtml += '<div style="display:flex;gap:4px">';
          tHtml += '<button class="btn btn-sm btn-success" onclick="window.approveCustomerRequest(\'' + r.id + '\', \'' + r.company_name + '\')">✅ اعتماد وتفعيل (Approve)</button>';
          tHtml += '<button class="btn btn-sm btn-danger" onclick="window.rejectCustomerRequest(\'' + r.id + '\')">❌ رفض</button>';
          tHtml += '</div>';
        }
        tHtml += '</td>';
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table></div>';
      document.getElementById('requests-content').innerHTML = tHtml;
    });
  }

  window.approveCustomerRequest = function(id, companyName) {
    if (!confirm('هل أنت متأكد من اعتماد [' + companyName + '] كعميل رسمي؟\nبمجرد الموافقة، سيصبح العميل Active في النظام.')) return;
    
    // 1. Update Request Status
    sbClient.from('customer_registration_requests').update({status: 'approved'}).eq('id', id).then(function(res) {
      if (res.error) return alert("خطأ: " + res.error.message);
      showToast('تم تفعيل العميل بنجاح. هو الآن Customer رسمي.', 'success');
      loadRequests();
    });
  };

  window.rejectCustomerRequest = function(id) {
    if (!confirm('تأكيد رفض طلب التسجيل؟')) return;
    sbClient.from('customer_registration_requests').update({status: 'rejected'}).eq('id', id).then(function(res) {
      if (res.error) return alert("خطأ: " + res.error.message);
      loadRequests();
    });
  };

  render();
};
