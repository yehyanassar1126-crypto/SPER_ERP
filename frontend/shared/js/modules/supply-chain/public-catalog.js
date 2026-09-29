let allProductsData = [];
let currentFilter = 'all';
let loggedInClient = null;

document.addEventListener('DOMContentLoaded', function() {
  // Check if client is logged in
  var stored = localStorage.getItem('catalog_client');
  if (stored) {
    try { loggedInClient = JSON.parse(stored); } catch(e) {}
  }

  // Update header if logged in
  updateAuthUI();

  // Check URL params (returning from auth page with product request)
  var urlParams = new URLSearchParams(window.location.search);
  var returnedProductId = urlParams.get('product_id');
  var returnedProductName = urlParams.get('product_name');
  var returnedIsWarehouse = urlParams.get('is_warehouse') === 'true';
  var returnedAction = urlParams.get('action');

  loadCatalog(function() {
    // After products load, auto-open modal if returning from auth
    if (loggedInClient && returnedAction === 'request' && returnedProductName) {
      openModal(returnedProductId || '', decodeURIComponent(returnedProductName), returnedIsWarehouse);
    }
  });
});

function updateAuthUI() {
  var authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (loggedInClient) {
    authArea.innerHTML = `
      <span style="color:var(--primary); font-weight:700; margin-left:15px;">
        <i class="fa-solid fa-circle-check"></i> أهلاً، ${loggedInClient.contact_person || loggedInClient.company_name}
      </span>
      <button class="btn btn-outline" onclick="logoutClient()" style="padding:8px 16px; font-size:0.85rem;">
        <i class="fa-solid fa-right-from-bracket"></i> خروج
      </button>
    `;
  } else {
    authArea.innerHTML = `
      <button class="btn btn-outline" onclick="window.location.href='../../../../screens/customer-auth/customer_auth.html'" style="padding:8px 16px; font-size:0.85rem;">
        <i class="fa-solid fa-user"></i> تسجيل الدخول
      </button>
    `;
  }
}

window.logoutClient = function() {
  localStorage.removeItem('catalog_client');
  loggedInClient = null;
  updateAuthUI();
  Swal.fire({
    icon: 'info',
    title: 'تم تسجيل الخروج',
    text: 'تم تسجيل خروجك بنجاح.',
    timer: 1500,
    showConfirmButton: false,
    background: '#111827',
    color: '#fff'
  });
}

function loadCatalog(callback) {
  var grid = document.getElementById('catalog-grid');

  sbClient.from('products')
    .select('id, name_ar, name_en, description_ar, is_featured, product_categories(name_ar), product_images(image_url, is_main), current_stock')
    .eq('is_public', true)
    .eq('status', 'active')
    .then(function(res) {
      if (res.error) {
        grid.innerHTML = '<div style="color:var(--danger); text-align:center; padding: 20px; grid-column: 1 / -1; font-size: 1.2rem;"><i class="fa-solid fa-triangle-exclamation"></i> حدث خطأ أثناء جلب المنتجات: ' + res.error.message + '</div>';
        return;
      }
      
      var data = res.data || [];
      
      // Fetch inventory to show live stock
      sbClient.from('inventory_items').select('id, name, quantity').eq('warehouse_type', 'finished').then(function(invRes) {
        var invData = invRes.data || [];
        var renderedItemNames = new Set();
        var combinedProducts = [];

        // 1. Process Catalog Products
        data.forEach(function(p) {
          var nameAr = p.name_ar ? p.name_ar.trim().toLowerCase() : '';
          var nameEn = p.name_en ? p.name_en.trim().toLowerCase() : '';
          
          if (nameAr) renderedItemNames.add(nameAr);
          if (nameEn) renderedItemNames.add(nameEn);

          var img = 'https://placehold.co/600x400/0b0f19/00f2fe?text=صورة+المنتج';
          if (p.product_images && p.product_images.length > 0) {
            var mainImage = p.product_images.find(i => i.is_main);
            if (mainImage) img = mainImage.image_url;
            else img = p.product_images[0].image_url;
          }

          var catName = p.product_categories ? p.product_categories.name_ar : 'منتج عام';
          
          var stockItem = invData.find(function(i) { 
            var invN = i.name ? i.name.trim().toLowerCase() : '';
            return invN === nameAr || invN === nameEn; 
          });
          var stockQty = stockItem ? stockItem.quantity : (p.current_stock || 0);

          combinedProducts.push({
            id: p.id,
            name: p.name_ar,
            desc: p.description_ar || 'لا يوجد وصف متاح لهذا المنتج حالياً.',
            img: img,
            category: catName,
            stock: stockQty,
            isFeatured: p.is_featured,
            isWarehouse: false
          });
        });

        // 2. Add Warehouse Items not in Catalog
        invData.forEach(function(inv) {
          var invName = inv.name ? inv.name.trim().toLowerCase() : '';
          if (invName && !renderedItemNames.has(invName)) {
            combinedProducts.push({
              id: inv.id,
              name: inv.name,
              desc: 'هذا المنتج متوفر مباشرة من المخزن التام وجاهز للتوريد السريع.',
              img: 'https://placehold.co/600x400/0b0f19/4facfe?text=مخزن+تام',
              category: 'منتجات المخزن',
              stock: inv.quantity,
              isFeatured: false,
              isWarehouse: true
            });
          }
        });

        allProductsData = combinedProducts;
        extractCategories(allProductsData);
        renderProducts(allProductsData);
        
        if (callback) callback();
      });
    });
}

function extractCategories(products) {
  const cats = new Set();
  products.forEach(p => cats.add(p.category));
  
  const filterContainer = document.getElementById('categoryFilters');
  let html = `
    <button class="filter-btn active" onclick="setFilter('all', this)">الكل</button>
    <button class="filter-btn" onclick="setFilter('featured', this)">🔥 المميزة</button>
  `;
  
  cats.forEach(cat => {
    html += `<button class="filter-btn" onclick="setFilter('${cat}', this)">${cat}</button>`;
  });
  
  filterContainer.innerHTML = html;
}

window.setFilter = function(filterVal, btnElement) {
  currentFilter = filterVal;
  
  // Update active class
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  
  filterProducts();
}

window.filterProducts = function() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  
  const filtered = allProductsData.filter(p => {
    const matchText = p.name.toLowerCase().includes(query) || 
                      p.category.toLowerCase().includes(query) || 
                      p.desc.toLowerCase().includes(query);
    
    let matchCat = true;
    if (currentFilter === 'featured') {
      matchCat = p.isFeatured;
    } else if (currentFilter !== 'all') {
      matchCat = (p.category === currentFilter);
    }
    
    return matchText && matchCat;
  });
  
  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('catalog-grid');
  
  if (products.length === 0) {
    grid.innerHTML = '<div style="text-align:center; padding: 60px; grid-column: 1 / -1; color: var(--text-muted); font-size: 1.2rem;"><i class="fa-solid fa-box-open" style="font-size: 4rem; margin-bottom:20px; display:block; color:var(--text-muted)"></i> لا توجد منتجات تطابق بحثك حالياً.</div>';
    return;
  }

  let html = '';
  products.forEach(p => {
    html += `<div class="product-card">`;
    if (p.isFeatured) {
      html += `<div class="badge-featured">🔥 الأفضل مبيعاً</div>`;
    }
    html += `
      <div class="product-image-container">
        <img src="${p.img}" alt="${p.name}" class="product-image" loading="lazy">
      </div>
      <div class="product-content">
        <span class="category-badge">${p.category}</span>
        <h3 class="product-title">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        
        <div class="stock-info">
    `;
    
    if (p.stock > 0) {
      html += `<i class="fa-solid fa-box-check stock-available"></i> <span class="stock-available">متاح الآن: <strong>${p.stock}</strong> وحدة</span>`;
    } else {
      html += `<i class="fa-solid fa-clock stock-out"></i> <span class="stock-out">نفذت الكمية (متاح للطلب المسبق)</span>`;
    }
    
    html += `
        </div>
        <button class="btn btn-primary" onclick="requestProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.isWarehouse})">
          <i class="fa-solid fa-cart-shopping"></i> طلب المنتج
        </button>
      </div>
    </div>`;
  });
  
  grid.innerHTML = html;
}

// ===== Request Product (Auth Gate) =====
window.requestProduct = function(id, name, isWarehouse) {
  // Check if logged in
  if (!loggedInClient) {
    // Redirect to auth page with product info
    var authUrl = 'customer_auth.html?action=request&product_id=' + id + 
                  '&product_name=' + encodeURIComponent(name) + 
                  '&is_warehouse=' + isWarehouse;
    window.location.href = authUrl;
    return;
  }
  
  // Client is logged in → open modal directly
  openModal(id, name, isWarehouse);
}

window.openModal = function(id, name, isWarehouse) {
  document.getElementById('req-product-id').value = id || '';
  document.getElementById('req-product-name').value = name || '';
  document.getElementById('req-is-warehouse').value = isWarehouse ? 'true' : 'false';
  document.getElementById('selected-product-name').innerHTML = '<i class="fa-solid fa-tag"></i> المنتج المطلوب: ' + name;
  
  // Auto-fill from logged in client
  if (loggedInClient) {
    document.getElementById('req-company').value = loggedInClient.company_name || '';
    document.getElementById('req-person').value = loggedInClient.contact_person || '';
    document.getElementById('req-phone').value = loggedInClient.phone || '';
    
    // Show logged-in info
    var clientInfoEl = document.getElementById('client-info');
    if (clientInfoEl) {
      clientInfoEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> مسجل كـ: <strong>' + (loggedInClient.contact_person || loggedInClient.company_name) + '</strong>';
      clientInfoEl.style.display = 'block';
    }
  }
  
  const modal = document.getElementById('reg-modal');
  modal.classList.add('active');
}

window.closeModal = function() {
  const modal = document.getElementById('reg-modal');
  modal.classList.remove('active');
}

window.submitRequest = function() {
  var productId = document.getElementById('req-product-id').value;
  var productName = document.getElementById('req-product-name').value;
  var isWarehouse = document.getElementById('req-is-warehouse').value === 'true';
  
  var company = document.getElementById('req-company').value.trim();
  var person = document.getElementById('req-person').value.trim();
  var phone = document.getElementById('req-phone').value.trim();
  var qty = document.getElementById('req-qty').value;
  var userNotes = document.getElementById('req-notes').value.trim();

  if (!company || !person || !phone || !qty) {
    Swal.fire({
      icon: 'warning',
      title: 'بيانات ناقصة',
      text: 'برجاء إدخال جميع الحقول الإجبارية (الشركة، المسئول، الهاتف، الكمية)',
      confirmButtonColor: '#00f2fe',
      background: '#111827',
      color: '#fff'
    });
    return;
  }

  var btn = document.getElementById('submitBtn');
  var originalHtml = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإرسال...';
  btn.disabled = true;

  // Formatting Notes field
  let finalNotes = userNotes;
  if (isWarehouse) {
    finalNotes = `[طلب من المخزن التام مباشرة - الصنف: ${productName}] - ` + finalNotes;
  }
  if (loggedInClient) {
    finalNotes = `[عميل مسجل: ${loggedInClient.username}] - ` + (finalNotes || '');
  }

  let insertData = {
    company_name: company,
    contact_person: person,
    phone: phone,
    requested_quantity: Number(qty),
    notes: finalNotes || null,
    status: 'pending'
  };

  // Only assign requested_product_id if it looks like a UUID
  if (productId && productId.length > 30 && productId.includes('-')) { 
    insertData.requested_product_id = productId;
  }

  sbClient.from('customer_registration_requests').insert(insertData).then(function(res) {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res.error) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ في الإرسال',
        text: res.error.message,
        confirmButtonColor: '#ef4444',
        background: '#111827',
        color: '#fff'
      });
      return;
    }
    
    Swal.fire({
      icon: 'success',
      title: 'تم استلام طلبك!',
      text: 'تم إرسال طلبك بنجاح، سيقوم فريق المبيعات بالتواصل معك في أقرب وقت.',
      confirmButtonColor: '#10b981',
      background: '#111827',
      color: '#fff'
    }).then(() => {
      closeModal();
      document.getElementById('req-qty').value = '';
      document.getElementById('req-notes').value = '';
    });
  });
}
