// ===== ERP MODULE: Production (الإنتاج) =====
window.Pages = window.Pages || {};

Pages.production = function(el) {
  var isOwner = App.isOwner();
  var isProduction = App.user && (App.user.department === 'Production' || App.user.role === 'hall manager');
  var canEdit = isOwner || isProduction;

  if (!canEdit) {
    el.innerHTML = '<div style="padding:60px;text-align:center;color:var(--accent-danger)"><h2>🚫 Access Denied (غير مصرح)</h2><p>This module is restricted to the Production department.</p></div>';
    return;
  }

  var prodOrders = [], matRequests = [], rawItems = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Production...</div>';
    Promise.all([
      sbClient.from('production_orders').select('*').order('created_at',{ascending:false}),
      sbClient.from('material_requests').select('*').order('created_at',{ascending:false}),
      sbClient.from('inventory_items').select('*').eq('warehouse_type','raw').order('name')
    ]).then(function(res) {
      prodOrders = res[0].data || [];
      matRequests = res[1].data || [];
      rawItems = res[2].data || [];
      render();
    });
  }

  function render() {
    var assigned = prodOrders.filter(function(p){return p.status==='approved'});
    var inProd = prodOrders.filter(function(p){return p.status==='in_production'});
    var inQC = prodOrders.filter(function(p){return p.status==='quality_check'});

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#f59e0b','fileText',assigned.length,'Assigned (مطلوب بدء)');
    html += _statCard('#3b82f6','settings',inProd.length,'In Production (جاري)');
    html += _statCard('#8b5cf6','checkCircle',inQC.length,'In Quality Check');
    html += _statCard('#22c55e','package',prodOrders.filter(function(p){return p.status==='completed'}).length,'Completed');
    html += '</div>';

    // Assigned orders needing to start
    if(assigned.length > 0 && canEdit) {
      html += '<div class="card" style="margin-bottom:24px;border:2px solid rgba(245,158,11,0.3)">';
      html += '<div class="card-header"><div><h3>⚠️ Orders Assigned to Production (أوامر إنتاج من التخطيط)</h3>';
      html += '<p>'+assigned.length+' orders waiting to start</p></div></div>';
      html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
      html += '<th>Product</th><th>Qty</th><th>Priority</th><th>Planned By</th><th>Deadline</th><th>Actions</th>';
      html += '</tr></thead><tbody>';
      assigned.forEach(function(p) {
        var prioBadge = p.priority==='high'||p.priority==='urgent'?'danger':'warning';
        html += '<tr><td style="font-weight:600">'+p.product_name+'</td>';
        html += '<td style="font-weight:700">'+p.quantity+'</td>';
        html += '<td><span class="badge badge-'+prioBadge+'">'+p.priority.toUpperCase()+'</span></td>';
        html += '<td>'+(p.planned_by||'-')+'</td>';
        html += '<td>'+(p.end_date?formatDate(p.end_date):'-')+'</td>';
        html += '<td><button class="btn btn-xs btn-primary" onclick="startProduction(\''+p.id+'\')">🏭 Start Production</button></td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    // Active Production
    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>Production Orders (أوامر الإنتاج)</h3>';
    html += '</div>';

    html += '<div class="card" style="margin-bottom:24px"><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Product</th><th>Qty</th><th>Priority</th><th>Status</th><th>Actions</th>';
    html += '</tr></thead><tbody>';

    var relevantOrders = prodOrders.filter(function(p){return p.status!=='pending_planning'&&p.status!=='rejected'});
    if(relevantOrders.length===0) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No production orders</td></tr>';
    } else {
      relevantOrders.forEach(function(p) {
        var sBadge='warning', sText=p.status.replace(/_/g,' ').toUpperCase();
        if(p.status==='approved') sBadge='info';
        if(p.status==='in_production') sBadge='primary';
        if(p.status==='quality_check') sBadge='secondary';
        if(p.status==='completed') sBadge='success';

        html += '<tr><td style="font-weight:600">'+p.product_name+'</td>';
        html += '<td style="font-weight:700">'+p.quantity+'</td>';
        html += '<td><span class="badge badge-'+(p.priority==='high'||p.priority==='urgent'?'danger':'warning')+'">'+p.priority.toUpperCase()+'</span></td>';
        html += '<td><span class="badge badge-'+sBadge+'">'+sText+'</span></td>';
        html += '<td><div style="display:flex;gap:4px;flex-wrap:wrap">';

        if(canEdit && p.status==='in_production') {
          html += '<button class="btn btn-xs btn-outline" onclick="requestMaterialModal(\''+p.id+'\',\''+p.product_name.replace(/'/g,"\\\'")+'\')">📦 Request Materials</button>';
          html += '<button class="btn btn-xs btn-info" onclick="sendToQC(\''+p.id+'\')">🔍 Send to Quality</button>';
        }
        if(p.status==='completed') html += '<span style="color:var(--accent-success);font-size:0.8rem">✅ Done</span>';
        if(p.status==='quality_check') html += '<span style="color:var(--text-muted);font-size:0.8rem">⏳ Waiting QC</span>';
        html += '</div></td></tr>';
      });
    }
    html += '</tbody></table></div></div></div>';

    // Material Requests
    html += '<div class="card"><div class="card-header"><div><h3>📦 Material Requests from Raw Warehouse (طلبات صرف من مخزن الخام)</h3>';
    html += '<p>'+matRequests.length+' requests</p></div></div>';
    html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Material</th><th>Needed</th><th>Issued</th><th>Requested By</th><th>Status</th>';
    html += '</tr></thead><tbody>';
    if(matRequests.length===0) {
      html += '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No material requests</td></tr>';
    } else {
      matRequests.forEach(function(m) {
        var sBadge = m.status==='issued'?'success':(m.status==='approved'?'info':(m.status==='rejected'?'danger':'warning'));
        html += '<tr><td>'+formatDate(m.created_at)+'</td><td style="font-weight:600">'+m.item_name+'</td>';
        html += '<td>'+m.quantity_needed+'</td><td>'+(m.quantity_issued||0)+'</td>';
        html += '<td>'+(m.requested_by||'-')+'</td>';
        html += '<td><span class="badge badge-'+sBadge+'">'+m.status.toUpperCase()+'</span></td></tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.startProduction = function(id) {
    if(!confirm('Start production for this order?')) return;
    sbClient.from('production_orders').update({status:'in_production'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Production started!', 'success');
    });
  };

  window.requestMaterialModal = function(poId, productName) {
    var b = '<p style="direction:rtl;text-align:right;margin-bottom:16px">طلب صرف خامات من <strong>مخزن الخام</strong> لأمر الإنتاج: <strong>'+productName+'</strong></p>';
    b += '<div class="form-field"><label>Material (الخامة) *</label><select id="mr-item" class="form-input"><option value="">-- Select from Raw Warehouse --</option>';
    rawItems.forEach(function(i){ b += '<option value="'+i.id+'|'+i.name+'|'+i.quantity+'">'+i.name+' (Stock: '+i.quantity+')</option>'; });
    b += '</select></div>';
    b += '<div class="form-field"><label>Quantity Needed *</label><input type="number" id="mr-qty" class="form-input" value="1" min="1"></div>';
    b += '<div class="form-field"><label>Notes</label><input type="text" id="mr-notes" class="form-input" placeholder="Optional notes"></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-mr-btn">Submit Request</button>';
    App.showModal('Request Materials (طلب صرف خامات)', b, f);

    document.getElementById('save-mr-btn').addEventListener('click', function() {
      var itemVal = document.getElementById('mr-item').value;
      if(!itemVal) return alert('Select a material');
      var parts = itemVal.split('|');
      var qty = parseInt(document.getElementById('mr-qty').value);
      if(!qty) return alert('Enter quantity');

      sbClient.from('material_requests').insert([{
        production_order_id: poId, item_id: parts[0], item_name: parts[1],
        quantity_needed: qty, requested_by: App.user.full_name,
        status: 'pending', warehouse_type: 'raw',
        notes: document.getElementById('mr-notes').value
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal(); loadData();
        showToast('Material request sent to Raw Warehouse', 'success');
      });
    });
  };

  window.sendToQC = function(id) {
    if(!confirm('Send finished products to Quality Control for inspection?')) return;
    sbClient.from('production_orders').update({status:'quality_check'}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Sent to Quality Control!', 'success');
    });
  };

  loadData();
};
