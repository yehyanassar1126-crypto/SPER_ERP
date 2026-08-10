document.addEventListener('DOMContentLoaded', function() {
  loadCatalog();
});

function loadCatalog() {
  var grid = document.getElementById('catalog-grid');
  var loading = document.getElementById('loading');

  // We fetch from the 'public_catalog_products' view, or directly from products where is_public=true
  sbClient.from('products')
    .select('id, name_ar, name_en, description_ar, is_featured, product_categories(name_ar), product_images(image_url, is_main)')
    .eq('is_public', true)
    .eq('status', 'active')
    .then(function(res) {
      loading.style.display = 'none';
      if (res.error) {
        grid.innerHTML = '<div style="color:red; text-align:center; padding: 20px;">حدث خطأ أثناء جلب المنتجات: ' + res.error.message + '</div>';
        return;
      }
      
      var data = res.data || [];
      if (data.length === 0) {
        grid.innerHTML = '<div style="text-align:center; padding: 20px; grid-column: 1 / -1;">لا يوجد منتجات متاحة للعرض حالياً.</div>';
        return;
      }

      // Fetch inventory to show live stock (Only Finished Goods)
      sbClient.from('inventory_items').select('name, quantity').eq('warehouse_type', 'finished').then(function(invRes) {
        var invData = invRes.data || [];

        var html = '';
        var renderedItemNames = new Set();

        data.forEach(function(p) {
          var nameAr = p.name_ar ? p.name_ar.trim().toLowerCase() : '';
          var nameEn = p.name_en ? p.name_en.trim().toLowerCase() : '';
          
          if (nameAr) renderedItemNames.add(nameAr);
          if (nameEn) renderedItemNames.add(nameEn);

          var img = 'https://placehold.co/400x250?text=No+Image';
          if (p.product_images && p.product_images.length > 0) {
            var mainImage = p.product_images.find(i => i.is_main);
            if (mainImage) img = mainImage.image_url;
            else img = p.product_images[0].image_url;
          }

          var catName = p.product_categories ? p.product_categories.name_ar : 'منتج';
          
          // Match stock exactly from finished goods
          var stockItem = invData.find(function(i) { 
            var invN = i.name ? i.name.trim().toLowerCase() : '';
            return invN === nameAr || invN === nameEn; 
          });
          var stockQty = stockItem ? stockItem.quantity : (p.current_stock || 0);

          html += '<div class="product-card">';
          if (p.is_featured) {
            html += '<div style="position:absolute; top:10px; right:10px; background:var(--success); color:white; padding:4px 10px; border-radius:4px; font-size:0.8rem; font-weight:bold; z-index:10;">🔥 مميز</div>';
          }
          html += '<img src="' + img + '" alt="' + p.name_ar + '" class="product-image">';
          html += '<div class="product-content">';
          html += '<span class="category-badge">' + catName + '</span>';
          html += '<h3 class="product-title">' + p.name_ar + '</h3>';
          html += '<p class="product-desc">' + (p.description_ar || 'لا يوجد وصف متاح لهذا المنتج.') + '</p>';
          
          html += '<div style="margin-bottom:15px; font-size:0.9rem; color:#64748b;">';
          if (stockQty > 0) {
             html += '📦 الكمية المتاحة: <strong style="color:var(--success)">' + stockQty + '</strong> وحدة';
          } else {
             html += '⚠️ <span style="color:var(--accent-danger)">الكمية نفذت (متاح للطلب المسبق)</span>';
          }
          html += '</div>';
          
          html += '<div class="product-actions">';
          html += '<button class="btn btn-primary" onclick="openModal(\'' + p.id + '\', \'' + p.name_ar.replace(/'/g, "\\'") + '\')">طلب المنتج</button>';
          html += '</div></div></div>';
        });

        grid.innerHTML = html;
      });
    });
}

function openModal(productId, productName) {
  window.location.href = 'customer_auth.html?action=request&product_id=' + productId + '&product_name=' + encodeURIComponent(productName);
}

function closeModal() {
  document.getElementById('reg-modal').style.display = 'none';
}

function submitRequest() {
  var productId = document.getElementById('req-product-id').value;
  var company = document.getElementById('req-company').value.trim();
  var person = document.getElementById('req-person').value.trim();
  var phone = document.getElementById('req-phone').value.trim();
  var email = document.getElementById('req-email').value.trim();
  var qty = document.getElementById('req-qty').value;

  if (!company || !person || !phone) {
    alert('برجاء إدخال الحقول الإجبارية (الشركة، المسئول، رقم الهاتف)');
    return;
  }

  var btn = document.querySelector('.modal .btn-primary');
  var originalText = btn.innerText;
  btn.innerText = 'جاري الإرسال...';
  btn.disabled = true;

  sbClient.from('customer_registration_requests').insert({
    requested_product_id: productId,
    company_name: company,
    contact_person: person,
    phone: phone,
    email: email || null,
    requested_quantity: qty ? Number(qty) : null,
    status: 'pending'
  }).then(function(res) {
    btn.innerText = originalText;
    btn.disabled = false;
    
    if (res.error) {
      alert('حدث خطأ: ' + res.error.message);
      return;
    }
    
    alert('✅ تم إرسال طلبك بنجاح! سيتم مراجعة الطلب من قبل قسم المبيعات وسنتواصل معك قريباً.');
    closeModal();
    // clear fields
    document.getElementById('req-company').value = '';
    document.getElementById('req-person').value = '';
    document.getElementById('req-phone').value = '';
    document.getElementById('req-email').value = '';
    document.getElementById('req-qty').value = '';
  });
}
