// ===== AI CEO Dashboard + Executive Analytics =====
Pages.aiCeoDashboard = function(el) {
  if(!App.isOwner()) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Owner access only.</div>'; return; }
  
  el.innerHTML = '<div style="padding:40px;text-align:center"><div class="spinner"></div><p style="margin-top:16px;color:var(--text-muted)">🧠 AI is analyzing all departments...</p></div>';
  
  AIBrain.runFullAnalysis(function(a) {
    var fin = a.financial, hr = a.hr, wh = a.warehouse, prod = a.production, qual = a.quality, fraud = a.fraud, cf = a.cashFlow;
    var allAlerts = [].concat(fin.alerts||[], hr.alerts||[], wh.alerts||[], prod.alerts||[], qual.alerts||[]);
    
    var html = '<div class="ai-ceo-wrap">';
    
    // Smart Notifications Bar
    if(allAlerts.length > 0) {
      html += '<div class="ai-alerts-bar">';
      html += '<h3>🔔 Smart Notifications ('+allAlerts.length+')</h3>';
      allAlerts.forEach(function(al){
        var color = al.severity==='critical'?'#ef4444':al.severity==='high'?'#f59e0b':'#3b82f6';
        html += '<div class="ai-alert-item" style="border-left:4px solid '+color+'"><span class="ai-alert-badge" style="background:'+color+'">'+al.severity.toUpperCase()+'</span> '+al.msg+'</div>';
      });
      html += '</div>';
    }

    // KPI Cards Row
    html += '<div class="ai-kpi-grid">';
    html += _aiKpi('💰','Revenue','EGP '+fin.revenue.toLocaleString(),'#22c55e');
    html += _aiKpi('📊','Expenses','EGP '+fin.expenses.toLocaleString(),'#ef4444');
    html += _aiKpi('📈','Profit','EGP '+fin.profit.toLocaleString(), fin.profit>=0?'#22c55e':'#ef4444');
    html += _aiKpi('👥','Employees', (a.raw.employees||[]).length,'#6366f1');
    html += _aiKpi('📦','Inventory Items', (a.raw.inventory||[]).length,'#f59e0b');
    html += _aiKpi('⚙️','Production Efficiency', prod.efficiency+'%','#8b5cf6');
    html += _aiKpi('✅','Quality Pass Rate', qual.passRate+'%','#22c55e');
    html += _aiKpi('🔧','Pending Maintenance', a.maintenance.pending,'#f97316');
    html += '</div>';

    // Fraud Detection
    if(fraud.length > 0) {
      html += '<div class="ai-section ai-fraud"><h3>🚨 AI Fraud Detection ('+fraud.length+' alerts)</h3>';
      fraud.forEach(function(f){
        html += '<div class="ai-fraud-item"><span style="color:#ef4444;font-weight:700">'+f.type.replace(/_/g,' ').toUpperCase()+'</span><p>'+f.msg+'</p></div>';
      });
      html += '</div>';
    }

    // Cash Flow Forecast
    html += '<div class="ai-section"><h3>💵 AI Cash Flow Forecast</h3><div class="ai-cashflow-grid">';
    cf.forEach(function(f){
      var color = f.projected>=0?'#22c55e':'#ef4444';
      html += '<div class="ai-cf-card"><div class="ai-cf-days">'+f.days+' Days</div><div class="ai-cf-amount" style="color:'+color+'">EGP '+f.projected.toLocaleString()+'</div><div class="ai-cf-detail">Revenue: '+f.revenue.toLocaleString()+' | Expenses: '+f.expenses.toLocaleString()+'</div></div>';
    });
    html += '</div></div>';

    // HR Insights
    html += '<div class="ai-section"><h3>👥 AI HR Insights</h3><div class="ai-hr-grid">';
    html += '<div class="ai-hr-card"><h4>⚠️ At Risk ('+hr.atRisk.length+')</h4>';
    hr.atRisk.slice(0,5).forEach(function(e){ html += '<div class="ai-hr-row"><span>'+e.name+'</span><span class="ai-risk-badge">Risk: '+e.risk+'%</span></div>'; });
    html += '</div>';
    html += '<div class="ai-hr-card"><h4>⭐ Top Performers ('+hr.topPerformers.length+')</h4>';
    hr.topPerformers.slice(0,5).forEach(function(e){ html += '<div class="ai-hr-row"><span>'+e.name+'</span><span style="color:#22c55e">Perfect</span></div>'; });
    html += '</div>';
    html += '<div class="ai-hr-card"><h4>🏆 Reward Eligible ('+hr.rewardEligible.length+')</h4>';
    hr.rewardEligible.slice(0,5).forEach(function(e){ html += '<div class="ai-hr-row"><span>'+e.name+'</span><span style="color:#f59e0b">'+e.otHours+'h OT</span></div>'; });
    html += '</div>';
    html += '</div></div>';

    // Warehouse Alerts
    if(wh.reorderNeeded.length > 0) {
      html += '<div class="ai-section"><h3>📦 AI Warehouse Alerts ('+wh.reorderNeeded.length+' items need reorder)</h3><div class="ai-table-wrap"><table class="data-table"><thead><tr><th>Item</th><th>Current</th><th>Min Level</th><th>Status</th></tr></thead><tbody>';
      wh.reorderNeeded.slice(0,10).forEach(function(item){
        var status = item.qty===0?'<span style="color:#ef4444;font-weight:700">OUT OF STOCK</span>':'<span style="color:#f59e0b;font-weight:700">LOW</span>';
        html += '<tr><td>'+item.name+'</td><td>'+item.qty+'</td><td>'+item.reorder+'</td><td>'+status+'</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    // Supplier Rankings
    var supRank = a.suppliers.rankings||[];
    if(supRank.length > 0) {
      html += '<div class="ai-section"><h3>🏪 AI Supplier Rankings</h3><div class="ai-table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Supplier</th><th>Orders</th><th>Total Amount</th><th>Delayed</th></tr></thead><tbody>';
      supRank.slice(0,8).forEach(function(s,i){
        html += '<tr><td>'+(i+1)+'</td><td>'+s.name+'</td><td>'+s.orders+'</td><td>EGP '+(s.totalAmount||0).toLocaleString()+'</td><td style="color:'+(s.delayed>0?'#ef4444':'#22c55e')+'">'+s.delayed+'</td></tr>';
      });
      html += '</tbody></table></div></div>';
    }

    // Department Cost Breakdown
    html += '<div class="ai-section"><h3>🏢 Department Cost Analysis</h3><div class="ai-cost-grid">';
    Object.keys(fin.costByDept).forEach(function(dept){
      html += '<div class="ai-cost-card"><span>'+dept+'</span><strong>EGP '+fin.costByDept[dept].toLocaleString()+'</strong></div>';
    });
    html += '</div></div>';

    html += '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px">🧠 Analysis completed at '+new Date().toLocaleString('ar-EG')+' | Powered by AI ERP Brain</div>';
    html += '</div>';
    el.innerHTML = html;
  });
};

function _aiKpi(icon,label,value,color) {
  return '<div class="ai-kpi-card"><div class="ai-kpi-icon" style="background:'+color+'20;color:'+color+'">'+icon+'</div><div class="ai-kpi-info"><span class="ai-kpi-value">'+value+'</span><span class="ai-kpi-label">'+label+'</span></div></div>';
}
