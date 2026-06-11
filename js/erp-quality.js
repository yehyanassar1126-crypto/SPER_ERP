// ===== ERP MODULE: Quality Control (الجودة) =====
window.Pages = window.Pages || {};

Pages.quality = function(el) {
  var isOwner = App.isOwner();
  var isQC = App.user && (App.user.department === 'Quality' || App.user.role === 'qc inspector' || App.user.role === 'quality manager');
  var canEdit = isOwner || isQC;
  var inspections = [], prodOrdersQC = [];

  function loadData() {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading Quality...</div>';
    Promise.all([
      sbClient.from('qc_inspections').select('*').order('inspection_date',{ascending:false}),
      sbClient.from('production_orders').select('*').eq('status','quality_check').order('created_at',{ascending:false})
    ]).then(function(res) {
      inspections = res[0].data || [];
      prodOrdersQC = res[1].data || [];
      render();
    });
  }

  function render() {
    var pendingInsp = inspections.filter(function(i){return i.status==='pending'}).length;
    var passed = inspections.filter(function(i){return i.status==='passed'}).length;
    var failed = inspections.filter(function(i){return i.status==='failed'}).length;

    var html = '<div class="stats-grid" style="margin-bottom:24px">';
    html += _statCard('#f59e0b','alertCircle',pendingInsp + prodOrdersQC.length,'Pending Inspection');
    html += _statCard('#22c55e','checkCircle',passed,'Passed');
    html += _statCard('#ef4444','x',failed,'Failed');
    html += _statCard('#6366f1','clipboard',inspections.length,'Total Inspections');
    html += '</div>';

    // Production orders waiting QC
    if(prodOrdersQC.length > 0) {
      html += '<div class="card" style="margin-bottom:24px;border:2px solid rgba(139,92,246,0.3)">';
      html += '<div class="card-header"><div><h3>🔍 Finished Products Waiting QC (منتجات تامة تنتظر الفحص)</h3>';
      html += '<p>'+prodOrdersQC.length+' products from Production need inspection</p></div></div>';
      html += '<div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
      html += '<th>Product</th><th>Qty</th><th>From Production</th><th>Actions</th>';
      html += '</tr></thead><tbody>';
      prodOrdersQC.forEach(function(p) {
        html += '<tr><td style="font-weight:600">'+p.product_name+'</td>';
        html += '<td style="font-weight:700">'+p.quantity+'</td>';
        html += '<td>'+(p.assigned_to||p.planned_by||'-')+'</td>';
        html += '<td>';
        if(canEdit) {
          html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="inspectFinished(\''+p.id+'\',\''+p.product_name.replace(/'/g,"\\\'")+'\','+p.quantity+',\'passed\')">✅ Pass → مخزن تام</button>';
          html += '<button class="btn btn-xs btn-danger" onclick="inspectFinished(\''+p.id+'\',\''+p.product_name.replace(/'/g,"\\\'")+'\','+p.quantity+',\'failed\')">❌ Fail → Return</button>';
        }
        html += '</td></tr>';
      });
      html += '</tbody></table></div></div></div>';
    }

    // New QC Inspection button
    html += '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<h3>QC Inspection Log (سجل فحص الجودة)</h3>';
    if(canEdit) html += '<button class="btn btn-primary" onclick="newQCInspectionModal()">'+icon('plus')+' New Inspection</button>';
    html += '</div>';

    // Inspection log
    html += '<div class="card"><div class="card-body no-pad"><div class="table-container"><table class="data-table"><thead><tr>';
    html += '<th>Date</th><th>Type</th><th>Item</th><th>Inspector</th><th>Result</th><th>Notes</th>';
    if(canEdit) html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';

    if(inspections.length===0) {
      html += '<tr><td colspan="'+(canEdit?7:6)+'" style="text-align:center;padding:40px;color:var(--text-muted)">No inspections recorded</td></tr>';
    } else {
      inspections.forEach(function(i) {
        var sBadge = i.status==='passed'?'success':(i.status==='failed'?'danger':(i.status==='conditional_approval'?'warning':'secondary'));
        var typeLabel = i.reference_type==='incoming_material'?'📦 Incoming Material':'🏭 Finished Product';
        html += '<tr><td>'+formatDate(i.inspection_date)+'</td>';
        html += '<td>'+typeLabel+'</td>';
        html += '<td style="font-weight:600">'+i.item_name+'</td>';
        html += '<td>'+(i.inspector_name||'-')+'</td>';
        html += '<td><span class="badge badge-'+sBadge+'">'+i.status.replace(/_/g,' ').toUpperCase()+'</span></td>';
        html += '<td style="max-width:200px;white-space:normal;font-size:0.85rem">'+(i.notes||'-')+'</td>';
        if(canEdit) {
          html += '<td>';
          if(i.status==='pending') {
            html += '<button class="btn btn-xs btn-success" style="margin-right:4px" onclick="updateQC(\''+i.id+'\',\'passed\')">Pass</button>';
            html += '<button class="btn btn-xs btn-danger" onclick="updateQC(\''+i.id+'\',\'failed\')">Fail</button>';
          } else {
            html += '<span style="font-size:0.75rem;color:var(--text-muted)">Done</span>';
          }
          html += '</td>';
        }
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    el.innerHTML = html;
  }

  window.inspectFinished = function(poId, productName, qty, result) {
    var action = result==='passed' ? 'PASS this product and move to مخزن تام (Finished Goods)?' : 'FAIL this product and return to Production?';
    if(!confirm(action)) return;

    // Create QC record
    sbClient.from('qc_inspections').insert([{
      reference_type: 'finished_product', reference_id: poId,
      item_name: productName, inspector_name: App.user.full_name,
      status: result, notes: result==='passed'?'Approved - moved to finished goods warehouse':'Failed QC - returned to production'
    }]).then(function(r) {
      if(r.error) return alert(r.error.message);

      if(result==='passed') {
        // Move to finished goods warehouse - add/update inventory
        sbClient.from('inventory_items').select('*').eq('name',productName).eq('warehouse_type','finished').then(function(res) {
          if(res.data && res.data.length > 0) {
            var existing = res.data[0];
            sbClient.from('inventory_items').update({quantity: existing.quantity + qty}).eq('id',existing.id).then(function() {});
          } else {
            sbClient.from('inventory_items').insert([{name:productName, category:'Finished Product', quantity:qty, warehouse_type:'finished', min_quantity:0}]).then(function() {});
          }
        });
        // Mark production order completed
        sbClient.from('production_orders').update({status:'completed'}).eq('id',poId).then(function() {
          loadData(); showToast('✅ Product passed QC → moved to مخزن تام', 'success');
        });
      } else {
        // Return to production
        sbClient.from('production_orders').update({status:'in_production'}).eq('id',poId).then(function() {
          loadData(); showToast('❌ Product failed QC → returned to Production', 'warning');
        });
      }
    });
  };

  window.newQCInspectionModal = function() {
    var b = '<div class="form-field"><label>Inspection Type *</label><select id="qc-type" class="form-input">';
    b += '<option value="incoming_material">📦 Incoming Material (خامات واردة)</option>';
    b += '<option value="finished_product">🏭 Finished Product (منتج تام)</option></select></div>';
    b += '<div class="form-field"><label>Item Name *</label><input type="text" id="qc-item" class="form-input" placeholder="Material or product name"></div>';
    b += '<div class="form-field"><label>Result *</label><select id="qc-result" class="form-input">';
    b += '<option value="pending">Pending</option><option value="passed">Passed ✅</option>';
    b += '<option value="failed">Failed ❌</option><option value="conditional_approval">Conditional ⚠️</option></select></div>';
    b += '<div class="form-field"><label>Notes</label><textarea id="qc-notes" class="form-input" rows="3" placeholder="Inspection details..."></textarea></div>';
    var f = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-qc-btn">Save Inspection</button>';
    App.showModal('New QC Inspection (فحص جودة)', b, f);

    document.getElementById('save-qc-btn').addEventListener('click', function() {
      var item = document.getElementById('qc-item').value;
      if(!item) return alert('Enter item name');
      sbClient.from('qc_inspections').insert([{
        reference_type: document.getElementById('qc-type').value,
        item_name: item, inspector_name: App.user.full_name,
        status: document.getElementById('qc-result').value,
        notes: document.getElementById('qc-notes').value
      }]).then(function(r) {
        if(r.error) return alert(r.error.message);
        App.closeModal(); loadData(); showToast('Inspection recorded', 'success');
      });
    });
  };

  window.updateQC = function(id, status) {
    sbClient.from('qc_inspections').update({status:status}).eq('id',id).then(function(r) {
      if(r.error) return alert(r.error.message);
      loadData(); showToast('Inspection updated to '+status, status==='passed'?'success':'warning');
    });
  };

  loadData();
};
