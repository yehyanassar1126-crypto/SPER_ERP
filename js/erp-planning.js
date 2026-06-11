// ===== ERP MODULE: Planning (التخطيط) =====
window.Pages = window.Pages || {};

Pages.planning = function(el) {
  var isOwner = App.isOwner();
  var isPlanning = App.user && (App.user.department === 'Planning' || App.user.role === 'planning manager');
  var canEdit = isOwner || isPlanning;
  var salesOrders = [], prodOrders = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Planning...</div>';
    Promise.all([
      sbClient.from('sales_orders').select('*').eq('status','sent_to_planning').order('created_at',{ascending:false}),
      sbClient.from('production_orders').select('*').order('created_at',{ascending:false})
    ]).then(function(res) {
      salesOrders = res[0].data || [];
      prodOrders = res[1].data || [];
      render();
    });
  }

  function render() {
    var pendingSO = salesOrders.length;
    var activePO = prodOrders.filter(function(p){return p.status==='approved'||p.status==='in_production'}).length;
    var completedPO = prodOrders.filter(function(p){return p.status==='completed'}).length;

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#f59e0b','fileText',pendingSO,'Incoming Sales Orders');
    html += _statCard('#3b82f6','settings',activePO,'Active Production');
    html += _statCard('#22c55e','checkCircle',completedPO,'Completed');
    html += _statCard('#6366f1','package',prodOrders.length,'Total Plans');
    html += '</div>';

    // Incoming Sales Orders needing planning
    if(pendingSO > 0 && canEdit) {
      html += '<div class="card" style="margin-bottom:24px;border:2px solid rgba(245,158,11,0.3)">';
      html += '<div class="card-header"><div><h3>⚠️ Incoming Sales Orders (أوامر بيع واردة من المبيعات)</h3>';
      html += '<p>'+pendingSO+' orders need production planning</p></div></div>';
      html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
      html += '<th>Date</th><th>Order #</th><th>Client</th><th>Items</th><th>Total</th><th>Delivery Date</th><th>Action</th>';
      html += '</tr></thead><tbody>';
      salesOrders.forEach(function(o) {
        var itemsList = '-';
        try { var items = typeof o.items==='string'?JSON.parse(o.items):(o.items||[]); itemsList=items.map(function(i){return i.name+' x'+i.qty}).join(', '); } catch(e){}
        html += '<tr><td>'+formatDate(o.created_at)+'</td><td style="font-weight:700">'+o.order_number+'</td>';
        html += '<td>'+(o.client_name||'-')+'</td><td style="font-size:0.85rem">'+itemsList+'</td>';
        html += '<td style="font-weight:700">EGP '+(o.total_amount||0).toLocaleString()+'</td>';
        html += '<td>'+(o.delivery_date?formatDate(o.delivery_date):'-')+'</td>';
        html += '<td><button class="btn btn-xs btn-primary" onclick="createProductionPlan(\''+o.id+'\',\''+o.order_number+'\')">📋 Create Production Plan</button></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    // Production Plans
    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>Production Plans (خطط الإنتاج)</h3>';
    if(canEdit) html += '<button class="btn btn-primary" onclick="newProductionPlanModal()">'+icon('plus')+' Manual Plan</button>';
    html += '</div>';

    html += '<div class="card"><div class="card-header"><div><h3>All Production Orders</h3><p>'+prodOrders.length+' plans</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Product</th><th>Qty</th><th>Priority</th><th>Assigned To</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    if(prodOrders.length===0) {
      html += '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No production plans</td></tr>';
    } else {
      prodOrders.forEach(function(p) {
        var sBadge='warning', sText=p.status.replace(/_/g,' ').toUpperCase();
        if(p.status==='approved') sBadge='info';
        if(p.status==='in_production') sBadge='primary';
        if(p.status==='quality_check') sBadge='secondary';
        if(p.status==='completed') sBadge='success';
        if(p.status==='rejected') sBadge='danger';

        var prioBadge = p.priority==='high'?'danger':(p.priority==='urgent'?'danger':(p.priority==='medium'?'warning':'secondary'));

        html += '<tr><td>'+formatDate(p.created_at)+'</td>';
        html += '<td style="font-weight:600">'+p.product_name+'</td>';
        html += '<td style="font-weight:700">'+p.quantity+'</td>';
        html += '<td><span class="badge badge-'+prioBadge+'">'+p.priority.toUpperCase()+'</span></td>';
        html += '<td>'+(p.assigned_to||'Not Assigned')+'</td>';
        html += '<td><span class="badge badge-'+sBadge+'">'+sText+'</span></td>';
        html += '<td><div style="display:flex;gap:4px;flex-wrap:wrap">';

        if(canEdit && p.status==='pending_planning') {
          html += '<button class="btn btn-xs btn-success" onclick="approveProdOrder(\''+p.id+'\')">✅ Approve & Send to Production</button>';
          html += '<button class="btn btn-xs btn-danger" onclick="rejectProdOrder(\''+p.id+'\')">❌ Reject</button>';
        } else {
          html += '<span style="font-size:0.75rem;color:var(--text-muted)">'+sText+'</span>';
        }
        html += '</div></td></tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.createProductionPlan = function(soId, soNum) {
    var so = salesOrders.find(function(o){return o.id===soId});
    if(!so) return;
    var items = [];
    try { items = typeof so.items==='string'?JSON.parse(so.items):(so.items||[]); } catch(e){}

    var b = '<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px;direction:rtl;text-align:right">';
    b += '<strong>Sales Order: '+soNum+'</strong><br>Client: '+(so.client_name||'-');
    b += '<br>Items: '+items.map(function(i){return i.name+' x'+i.qty}).join(', ');
    b += '</div>';
    b += '<div class="form-field"><label>Product Name *</label><input type="text" id="pp-product" class="form-input" value="'+(items.length>0?items[0].name:'')+'"></div>';
    b += '<div class="form-row"><div class="form-field"><label>Quantity *</label><input type="number" id="pp-qty" class="form-input" value="'+(items.length>0?items[0].qty:1)+'"></div>';
    b += '<div class="form-field"><label>Priority *</label><select id="pp-prio" class="form-input"><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></div></div>';
    b += '<div class="form-row"><div class="form-field"><label>Start Date</label><input type="date" id="pp-start" class="form-input"></div>';
    b += '<div class="form-field"><label>End Date</label><input type="date" id="pp-end" class="form-input" value="'+(so.delivery_date||'')+'"></div></div>';
    b += '<div class="form-field"><label>Assign To (Production)</label><input type="text" id="pp-assign" class="form-input" placeholder="Hall Manager name"></div>';
    b += '<div class="form-field"><label>Notes</label><textarea id="pp-notes" class="form-input" rows="2"></textarea></div>';

    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-pp-btn">Create Plan & Send to Production</button>';
    App.showModal('Create Production Plan from SO: '+soNum, b, f, true);

    document.getElementById('save-pp-btn').addEventListener('click', function() {
      var product = document.getElementById('pp-product').value;
      var qty = parseInt(document.getElementById('pp-qty').value);
      if(!product||!qty) return alert('Fill product and quantity');

      sbClient.from('production_orders').insert([{
        sales_order_id: soId, product_name: product, quantity: qty,
        planned_by: App.user.full_name, assigned_to: document.getElementById('pp-assign').value||null,
        priority: document.getElementById('pp-prio').value,
        start_date: document.getElementById('pp-start').value||null,
        end_date: document.getElementById('pp-end').value||null,
        notes: document.getElementById('pp-notes').value, status: 'pending_planning'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        // Update sales order status
        sbClient.from('sales_orders').update({status:'processing'}).eq('id',soId).then(function() {
          App.closeModal(); loadData();
          showToast('Production plan created & sent!', 'success');
        });
      });
    });
  };

  window.newProductionPlanModal = function() {
    var b = '<div class="form-field"><label>Product Name *</label><input type="text" id="pp-product" class="form-input"></div>';
    b += '<div class="form-row"><div class="form-field"><label>Quantity *</label><input type="number" id="pp-qty" class="form-input" value="1"></div>';
    b += '<div class="form-field"><label>Priority</label><select id="pp-prio" class="form-input"><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></div></div>';
    b += '<div class="form-field"><label>Assign To</label><input type="text" id="pp-assign" class="form-input" placeholder="Hall Manager name"></div>';
    b += '<div class="form-row"><div class="form-field"><label>Start</label><input type="date" id="pp-start" class="form-input"></div>';
    b += '<div class="form-field"><label>End</label><input type="date" id="pp-end" class="form-input"></div></div>';
    b += '<div class="form-field"><label>Notes</label><textarea id="pp-notes" class="form-input" rows="2"></textarea></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-pp-btn">Create Plan</button>';
    App.showModal('Manual Production Plan', b, f);

    document.getElementById('save-pp-btn').addEventListener('click', function() {
      var product = document.getElementById('pp-product').value;
      var qty = parseInt(document.getElementById('pp-qty').value);
      if(!product||!qty) return alert('Fill product and quantity');
      sbClient.from('production_orders').insert([{
        product_name: product, quantity: qty, planned_by: App.user.full_name,
        assigned_to: document.getElementById('pp-assign').value||null,
        priority: document.getElementById('pp-prio').value,
        start_date: document.getElementById('pp-start').value||null,
        end_date: document.getElementById('pp-end').value||null,
        notes: document.getElementById('pp-notes').value, status: 'pending_planning'
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal(); loadData(); showToast('Plan created', 'success');
      });
    });
  };

  window.approveProdOrder = function(id) {
    if(!confirm('Approve and send to Production department?')) return;
    sbClient.from('production_orders').update({status:'approved'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Sent to Production!', 'success');
    });
  };

  window.rejectProdOrder = function(id) {
    if(!confirm('Reject this plan?')) return;
    sbClient.from('production_orders').update({status:'rejected'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Plan rejected', 'warning');
    });
  };

  loadData();
};
