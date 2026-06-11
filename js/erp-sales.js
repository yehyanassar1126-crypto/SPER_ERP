// ===== ERP MODULE: Sales (المبيعات) =====
window.Pages = window.Pages || {};

Pages.sales = function(el) {
  var isOwner = App.isOwner();
  var isSales = App.user && (App.user.department === 'Sales' || App.user.role === 'sales manager');
  var canEdit = isOwner || isSales;
  var orders = [], clients = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Sales...</div>';
    Promise.all([
      sbClient.from('sales_orders').select('*').order('created_at', {ascending: false}),
      sbClient.from('clients').select('*').order('company_name')
    ]).then(function(res) {
      orders = res[0].data || [];
      clients = res[1].data || [];
      render();
    });
  }

  function render() {
    var pending = orders.filter(function(o){return o.status==='pending'}).length;
    var inProd = orders.filter(function(o){return o.status==='sent_to_planning'||o.status==='processing'}).length;
    var shipped = orders.filter(function(o){return o.status==='shipped'||o.status==='delivered'}).length;

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#6366f1','fileText',orders.length,'Total Orders');
    html += _statCard('#f59e0b','clock',pending,'Pending');
    html += _statCard('#3b82f6','settings',inProd,'In Production');
    html += _statCard('#22c55e','checkCircle',shipped,'Shipped/Delivered');
    html += '</div>';

    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>Sales Orders (أوامر البيع)</h3>';
    html += '<div>';
    if(canEdit) {
      html += '<button class="btn btn-outline" style="margin-right:8px" onclick="manageClientsModal()">'+icon('users')+' Clients (العملاء)</button>';
      html += '<button class="btn btn-primary" onclick="newSalesOrderModal()">'+icon('plus')+' New Sales Order</button>';
    }
    html += '</div></div>';

    html += '<div class="card"><div class="card-header"><div><h3>Orders Log</h3><p>'+orders.length+' orders</p></div></div><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Order #</th><th>Client</th><th>Items</th><th>Total</th><th>Delivery</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    if(orders.length===0) {
      html += '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">No sales orders yet</td></tr>';
    } else {
      orders.forEach(function(o) {
        var sBadge = 'warning', sText = o.status.replace(/_/g,' ').toUpperCase();
        if(o.status==='sent_to_planning') { sBadge='info'; }
        else if(o.status==='processing') { sBadge='primary'; }
        else if(o.status==='shipped') { sBadge='success'; }
        else if(o.status==='delivered') { sBadge='success'; }
        else if(o.status==='cancelled') { sBadge='danger'; }

        var itemsList = '';
        try { var items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items||[]); itemsList = items.map(function(i){return i.name+' x'+i.qty}).join(', ') || '-'; } catch(e){ itemsList='-'; }

        html += '<tr>';
        html += '<td>'+formatDate(o.created_at)+'</td>';
        html += '<td style="font-weight:700">'+o.order_number+'</td>';
        html += '<td>'+(o.client_name||'-')+'</td>';
        html += '<td style="max-width:200px;white-space:normal;font-size:0.85rem">'+itemsList+'</td>';
        html += '<td style="font-weight:700">EGP '+(o.total_amount||0).toLocaleString()+'</td>';
        html += '<td>'+(o.delivery_date ? formatDate(o.delivery_date) : '-')+'</td>';
        html += '<td><span class="badge badge-'+sBadge+'">'+sText+'</span></td>';
        html += '<td><div style="display:flex;gap:4px;flex-wrap:wrap">';

        if(canEdit && o.status==='pending') {
          html += '<button class="btn btn-xs btn-info" onclick="sendToPlanning(\''+o.id+'\')">📋 Send to Planning</button>';
          html += '<button class="btn btn-xs btn-danger" onclick="cancelSalesOrder(\''+o.id+'\')">Cancel</button>';
        }
        if(canEdit && o.status==='processing') {
          html += '<button class="btn btn-xs btn-success" onclick="markShipped(\''+o.id+'\')">🚚 Mark Shipped</button>';
        }
        if(canEdit && o.status==='shipped') {
          html += '<button class="btn btn-xs btn-success" onclick="markDelivered(\''+o.id+'\')">✅ Delivered</button>';
        }
        if(!canEdit || (o.status!=='pending' && o.status!=='processing' && o.status!=='shipped')) {
          html += '<span style="color:var(--text-muted);font-size:0.75rem">'+sText+'</span>';
        }
        html += '</div></td></tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.newSalesOrderModal = function() {
    var num = 'SO-' + Date.now().toString().slice(-6);
    var b = '<div class="form-row"><div class="form-field"><label>Order # *</label><input type="text" id="so-num" class="form-input" value="'+num+'" readonly></div>';
    b += '<div class="form-field"><label>Client (العميل) *</label><select id="so-client" class="form-input"><option value="">-- Select --</option>';
    clients.forEach(function(c){ b += '<option value="'+c.id+'|'+c.company_name+'">'+c.company_name+'</option>'; });
    b += '</select></div></div>';
    b += '<div class="form-field"><label>Delivery Date (تاريخ التسليم)</label><input type="date" id="so-date" class="form-input"></div>';
    b += '<div id="so-items-list"><div class="form-row" data-item-row><div class="form-field"><label>Product Name *</label><input type="text" class="form-input so-item-name" placeholder="Product name"></div><div class="form-field"><label>Qty *</label><input type="number" class="form-input so-item-qty" value="1" min="1"></div><div class="form-field"><label>Price *</label><input type="number" class="form-input so-item-price" value="0" min="0"></div></div></div>';
    b += '<button class="btn btn-xs btn-outline" style="margin:8px 0" onclick="addSOItemRow()">+ Add Item</button>';
    b += '<div class="form-field"><label>Notes</label><textarea id="so-notes" class="form-input" rows="2"></textarea></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-so-btn">Create Order</button>';
    App.showModal('New Sales Order (أمر بيع جديد)', b, f, true);

    document.getElementById('save-so-btn').addEventListener('click', function() {
      var clientVal = document.getElementById('so-client').value;
      if(!clientVal) return alert('Select a client');
      var clientParts = clientVal.split('|');
      var rows = document.querySelectorAll('[data-item-row]');
      var items = [], total = 0;
      rows.forEach(function(r) {
        var n = r.querySelector('.so-item-name').value;
        var q = parseInt(r.querySelector('.so-item-qty').value)||0;
        var p = parseFloat(r.querySelector('.so-item-price').value)||0;
        if(n && q>0) { items.push({name:n,qty:q,price:p}); total += q*p; }
      });
      if(items.length===0) return alert('Add at least one item');

      sbClient.from('sales_orders').insert([{
        order_number: document.getElementById('so-num').value,
        client_id: clientParts[0], client_name: clientParts[1],
        items: JSON.stringify(items), total_amount: total,
        delivery_date: document.getElementById('so-date').value || null,
        notes: document.getElementById('so-notes').value,
        status: 'pending', created_by: App.user.full_name
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal(); loadData();
        showToast('Sales order created successfully', 'success');
      });
    });
  };

  window.addSOItemRow = function() {
    var div = document.createElement('div');
    div.className = 'form-row'; div.setAttribute('data-item-row','');
    div.innerHTML = '<div class="form-field"><input type="text" class="form-input so-item-name" placeholder="Product name"></div><div class="form-field"><input type="number" class="form-input so-item-qty" value="1" min="1"></div><div class="form-field"><input type="number" class="form-input so-item-price" value="0" min="0"></div>';
    document.getElementById('so-items-list').appendChild(div);
  };

  window.sendToPlanning = function(id) {
    if(!confirm('Send this order to Planning department for production scheduling?')) return;
    sbClient.from('sales_orders').update({status:'sent_to_planning'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Order sent to Planning (التخطيط)', 'success');
    });
  };

  window.cancelSalesOrder = function(id) {
    if(!confirm('Cancel this order?')) return;
    sbClient.from('sales_orders').update({status:'cancelled'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Order cancelled', 'warning');
    });
  };

  window.markShipped = function(id) {
    if(!confirm('Mark as shipped?')) return;
    sbClient.from('sales_orders').update({status:'shipped'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Order shipped!', 'success');
    });
  };

  window.markDelivered = function(id) {
    if(!confirm('Mark as delivered?')) return;
    sbClient.from('sales_orders').update({status:'delivered'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Order delivered!', 'success');
    });
  };

  window.manageClientsModal = function() {
    var b = '<div style="margin-bottom:16px"><button class="btn btn-sm btn-primary" onclick="newClientModal()">'+icon('plus')+' Add Client</button></div>';
    b += '<div style="max-height:400px;overflow:auto"><table class="data-table"><thead><tr><th>Company</th><th>Contact</th><th>Phone</th></tr></thead><tbody>';
    clients.forEach(function(c) {
      b += '<tr><td style="font-weight:600">'+c.company_name+'</td><td>'+(c.contact_person||'-')+'</td><td>'+(c.phone||'-')+'</td></tr>';
    });
    if(clients.length===0) b += '<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text-muted)">No clients</td></tr>';
    b += '</tbody></table></div>';
    App.showModal('Clients (العملاء)', b, '<button class="btn btn-outline" onclick="App.closeModal()">Close</button>', true);
  };

  window.newClientModal = function() {
    App.closeModal();
    var b = '<div class="form-field"><label>Company Name *</label><input type="text" id="cl-name" class="form-input"></div>';
    b += '<div class="form-row"><div class="form-field"><label>Contact Person</label><input type="text" id="cl-contact" class="form-input"></div>';
    b += '<div class="form-field"><label>Phone</label><input type="text" id="cl-phone" class="form-input"></div></div>';
    b += '<div class="form-field"><label>Email</label><input type="email" id="cl-email" class="form-input"></div>';
    b += '<div class="form-field"><label>Address</label><input type="text" id="cl-addr" class="form-input"></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-cl-btn">Save Client</button>';
    App.showModal('Add New Client', b, f);
    document.getElementById('save-cl-btn').addEventListener('click', function() {
      var name = document.getElementById('cl-name').value;
      if(!name) return alert('Company name is required');
      sbClient.from('clients').insert([{
        company_name: name, contact_person: document.getElementById('cl-contact').value,
        phone: document.getElementById('cl-phone').value, email: document.getElementById('cl-email').value,
        address: document.getElementById('cl-addr').value
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal(); loadData(); showToast('Client added', 'success');
      });
    });
  };

  loadData();
};
