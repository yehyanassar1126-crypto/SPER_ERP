// ===== AI ERP BRAIN - Enterprise Intelligence Engine =====
// Central AI that connects ALL departments and provides cross-module analysis

var AIBrain = {
  cache: {},
  lastAnalysis: null,

  // ========== DATA FETCHERS ==========
  fetchAllData: function(cb) {
    var data = { employees:[], attendance:[], leaves:[], payroll:[], overtime:[], inventory:[], sales:[], purchases:[], suppliers:[], maintenance:[], production:[], quality:[], expenses:[], loans:[] };
    var pending = 14;
    function done(){ pending--; if(pending<=0) cb(data); }
    
    sbClient.from('users').select('*').then(function(r){ data.employees = r.data||[]; done(); });
    sbClient.from('attendance').select('*').order('date',{ascending:false}).limit(500).then(function(r){ data.attendance = r.data||[]; done(); });
    sbClient.from('leave_requests').select('*').then(function(r){ data.leaves = r.data||[]; done(); });
    sbClient.from('payroll').select('*').then(function(r){ data.payroll = r.data||[]; done(); });
    sbClient.from('overtime').select('*').then(function(r){ data.overtime = r.data||[]; done(); });
    sbClient.from('inventory_items').select('*').then(function(r){ data.inventory = r.data||[]; done(); });
    sbClient.from('sales_orders').select('*').then(function(r){ data.sales = r.data||[]; done(); });
    sbClient.from('purchase_requests').select('*').then(function(r){ data.purchases = r.data||[]; done(); });
    sbClient.from('suppliers').select('*').then(function(r){ data.suppliers = r.data||[]; done(); });
    sbClient.from('maintenance_requests').select('*').then(function(r){ data.maintenance = r.data||[]; done(); });
    sbClient.from('production_orders').select('*').then(function(r){ data.production = r.data||[]; done(); });
    sbClient.from('qc_inspections').select('*').then(function(r){ data.quality = r.data||[]; done(); }).catch(function(){ data.quality = []; done(); });
    sbClient.from('expenses').select('*').then(function(r){ data.expenses = r.data||[]; done(); });
    sbClient.from('loans').select('*').then(function(r){ data.loans = r.data||[]; done(); });
  },

  // ========== AI FINANCIAL ANALYST ==========
  analyzeFinancials: function(data) {
    var results = { revenue:0, expenses:0, profit:0, trends:[], alerts:[], costByDept:{} };
    var now = new Date();
    var thisMonth = now.getFullYear()+'-'+(now.getMonth()+1<10?'0':'')+(now.getMonth()+1);
    var lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1);
    var lastMonthKey = lastMonth.getFullYear()+'-'+(lastMonth.getMonth()+1<10?'0':'')+(lastMonth.getMonth()+1);

    // Revenue from sales
    (data.sales||[]).forEach(function(s){
      if(s.created_at && s.created_at.substring(0,7)===thisMonth) results.revenue += (s.total_amount||0);
    });
    
    // Expenses from payroll + expenses
    var payrollCost = 0;
    (data.payroll||[]).forEach(function(p){
      if(p.month && p.month.substring(0,7)===thisMonth) payrollCost += (p.net_salary||0);
    });
    results.costByDept['HR/Payroll'] = payrollCost;
    
    (data.expenses||[]).forEach(function(e){
      if(e.created_at && e.created_at.substring(0,7)===thisMonth) {
        results.expenses += (e.amount||0);
        var dept = e.department || 'General';
        results.costByDept[dept] = (results.costByDept[dept]||0) + (e.amount||0);
      }
    });
    results.expenses += payrollCost;
    results.profit = results.revenue - results.expenses;

    // Compare with last month
    var lastRevenue = 0, lastExpenses = 0;
    (data.sales||[]).forEach(function(s){ if(s.created_at && s.created_at.substring(0,7)===lastMonthKey) lastRevenue += (s.total_amount||0); });
    (data.payroll||[]).forEach(function(p){ if(p.month && p.month.substring(0,7)===lastMonthKey) lastExpenses += (p.net_salary||0); });
    
    if(lastRevenue > 0) {
      var revenueChange = Math.round(((results.revenue - lastRevenue)/lastRevenue)*100);
      results.trends.push({ metric:'Revenue', change:revenueChange, direction: revenueChange>=0?'up':'down' });
    }
    if(lastExpenses > 0) {
      var expenseChange = Math.round(((results.expenses - lastExpenses)/lastExpenses)*100);
      results.trends.push({ metric:'Expenses', change:expenseChange, direction: expenseChange>=0?'up':'down' });
    }

    // Alerts
    if(results.profit < 0) results.alerts.push({ severity:'critical', msg:'Net loss detected this month: EGP '+Math.abs(results.profit).toLocaleString() });
    if(results.expenses > results.revenue * 1.2) results.alerts.push({ severity:'high', msg:'Expenses exceed revenue by more than 20%' });

    return results;
  },

  // ========== AI PROCUREMENT MANAGER ==========
  analyzeSuppliers: function(data) {
    var results = { best:null, fastest:null, cheapest:null, mostDelayed:null, priceIncreased:[], rankings:[] };
    var supplierStats = {};
    
    (data.purchases||[]).forEach(function(p){
      var sid = p.supplier_id || p.supplier_name;
      if(!sid) return;
      if(!supplierStats[sid]) supplierStats[sid] = { name:p.supplier_name||sid, orders:0, totalAmount:0, delivered:0, delayed:0, avgDays:0, totalDays:0 };
      supplierStats[sid].orders++;
      supplierStats[sid].totalAmount += (p.total_amount||0);
      if(p.status==='delivered' || p.status==='completed') {
        supplierStats[sid].delivered++;
        if(p.created_at && p.delivered_at) {
          var days = Math.ceil((new Date(p.delivered_at)-new Date(p.created_at))/86400000);
          supplierStats[sid].totalDays += days;
        }
      }
      if(p.status==='delayed' || p.is_delayed) supplierStats[sid].delayed++;
    });

    var ranked = Object.values(supplierStats).sort(function(a,b){ return b.orders - a.orders; });
    results.rankings = ranked;
    if(ranked.length > 0) {
      results.best = ranked[0];
      var bySpeed = ranked.filter(function(s){return s.delivered>0;}).sort(function(a,b){ return (a.totalDays/a.delivered)-(b.totalDays/b.delivered); });
      if(bySpeed.length) results.fastest = bySpeed[0];
      var byCost = ranked.sort(function(a,b){ return (a.totalAmount/a.orders)-(b.totalAmount/b.orders); });
      results.cheapest = byCost[0];
      var byDelay = ranked.filter(function(s){return s.delayed>0;}).sort(function(a,b){ return b.delayed-a.delayed; });
      if(byDelay.length) results.mostDelayed = byDelay[0];
    }
    return results;
  },

  // ========== AI WAREHOUSE MANAGER ==========
  analyzeWarehouse: function(data) {
    var results = { lowStock:[], deadStock:[], highConsumption:[], reorderNeeded:[], alerts:[] };
    
    (data.inventory||[]).forEach(function(item){
      var qty = item.quantity || item.current_quantity || 0;
      var reorder = item.reorder_level || item.min_quantity || 10;
      var name = item.item_name || item.name || 'Unknown';
      
      if(qty <= reorder) {
        results.reorderNeeded.push({ name:name, qty:qty, reorder:reorder });
        results.alerts.push({ severity: qty===0?'critical':'high', msg: name+' needs reorder (Current: '+qty+', Min: '+reorder+')' });
      }
      if(qty <= 5 && qty > 0) results.lowStock.push({ name:name, qty:qty });
      if(qty === 0) results.deadStock.push({ name:name });
    });

    results.lowStock.sort(function(a,b){ return a.qty-b.qty; });
    return results;
  },

  // ========== AI HR MANAGER ==========
  analyzeHR: function(data) {
    var results = { atRisk:[], topPerformers:[], lowPerformers:[], rewardEligible:[], highAbsence:[], alerts:[] };
    var now = new Date();
    var thirtyDaysAgo = new Date(now.getTime()-30*86400000);

    (data.employees||[]).forEach(function(emp){
      if(emp.role==='owner') return;
      var empAtt = (data.attendance||[]).filter(function(a){ return a.employee_id===emp.id && new Date(a.date)>=thirtyDaysAgo; });
      var lateCount = empAtt.filter(function(a){ return a.delay_minutes>0; }).length;
      var totalDelay = empAtt.reduce(function(s,a){ return s+(a.delay_minutes||0); },0);
      var empLeaves = (data.leaves||[]).filter(function(l){ return l.employee_id===emp.id && new Date(l.created_at)>=thirtyDaysAgo; });
      var empOT = (data.overtime||[]).filter(function(o){ return o.employee_id===emp.id && o.status==='approved'; });
      var otHours = empOT.reduce(function(s,o){ return s+(o.hours||0); },0);
      
      // Risk score
      var risk = 0;
      if(lateCount>=8) risk+=30; else if(lateCount>=5) risk+=20;
      if(empAtt.length<15) risk+=20;
      if(empLeaves.length>=3) risk+=15;
      if(totalDelay>120) risk+=15;

      var profile = { name:emp.full_name, dept:emp.department, risk:risk, lateCount:lateCount, attendance:empAtt.length, otHours:otHours, leaves:empLeaves.length };
      
      if(risk>=40) results.atRisk.push(profile);
      if(lateCount===0 && empAtt.length>=20) results.topPerformers.push(profile);
      if(lateCount>=8) results.lowPerformers.push(profile);
      if(lateCount===0 && empAtt.length>=22 && otHours>=10) results.rewardEligible.push(profile);
      if(empAtt.length<10) results.highAbsence.push(profile);
    });

    results.atRisk.sort(function(a,b){ return b.risk-a.risk; });
    if(results.atRisk.length>0) results.alerts.push({ severity:'high', msg:results.atRisk.length+' employees at risk of resignation' });
    return results;
  },

  // ========== AI PRODUCTION ANALYST ==========
  analyzeProduction: function(data) {
    var results = { efficiency:0, totalOrders:0, completed:0, delayed:0, downtime:0, alerts:[] };
    
    (data.production||[]).forEach(function(p){
      results.totalOrders++;
      if(p.status==='completed'||p.status==='done') results.completed++;
      if(p.status==='delayed'||p.is_delayed) results.delayed++;
    });
    
    results.efficiency = results.totalOrders>0 ? Math.round((results.completed/results.totalOrders)*100) : 0;
    if(results.efficiency<70) results.alerts.push({ severity:'high', msg:'Production efficiency below 70% ('+results.efficiency+'%)' });
    if(results.delayed>3) results.alerts.push({ severity:'medium', msg:results.delayed+' delayed production orders' });
    return results;
  },

  // ========== AI MAINTENANCE PREDICTOR ==========
  analyzeMaintenance: function(data) {
    var results = { pending:0, overdue:0, upcoming:[], costEstimate:0, alerts:[] };
    var now = new Date();
    
    (data.maintenance||[]).forEach(function(m){
      if(m.status==='pending'||m.status==='open') results.pending++;
      if(m.due_date && new Date(m.due_date)<now && m.status!=='completed') {
        results.overdue++;
        results.alerts.push({ severity:'high', msg:'Overdue maintenance: '+(m.title||m.description||'Request #'+m.id) });
      }
      results.costEstimate += (m.estimated_cost||m.cost||0);
    });
    return results;
  },

  // ========== AI QUALITY CONTROL ==========
  analyzeQuality: function(data) {
    var results = { passRate:0, failReasons:{}, alerts:[] };
    var passed=0, failed=0;
    
    (data.quality||[]).forEach(function(q){
      if(q.result==='pass'||q.status==='approved') passed++;
      else if(q.result==='fail'||q.status==='rejected') {
        failed++;
        var reason = q.failure_reason||q.notes||'Unknown';
        results.failReasons[reason] = (results.failReasons[reason]||0)+1;
      }
    });
    
    var total = passed+failed;
    results.passRate = total>0 ? Math.round((passed/total)*100) : 100;
    if(results.passRate<90) results.alerts.push({ severity:'high', msg:'Quality pass rate below 90% ('+results.passRate+'%)' });
    return results;
  },

  // ========== AI SALES MANAGER ==========  
  analyzeSales: function(data) {
    var results = { topProducts:{}, topClients:{}, trends:[], alerts:[] };
    
    (data.sales||[]).forEach(function(s){
      var client = s.customer_name||s.client_name||'Unknown';
      results.topClients[client] = (results.topClients[client]||0) + (s.total_amount||0);
    });
    return results;
  },

  // ========== AI FRAUD DETECTION ==========
  detectFraud: function(data) {
    var alerts = [];
    
    // Duplicate invoice detection
    var invoiceMap = {};
    (data.purchases||[]).forEach(function(p){
      var key = (p.supplier_name||'')+'_'+(p.total_amount||0)+'_'+(p.created_at?p.created_at.substring(0,10):'');
      if(invoiceMap[key]) {
        alerts.push({ type:'duplicate_invoice', severity:'critical', msg:'Possible duplicate invoice: '+p.supplier_name+' - EGP '+(p.total_amount||0), items:[invoiceMap[key], p] });
      }
      invoiceMap[key] = p;
    });

    // Unusual salary spikes
    var salaryByEmp = {};
    (data.payroll||[]).forEach(function(p){
      if(!salaryByEmp[p.employee_id]) salaryByEmp[p.employee_id] = [];
      salaryByEmp[p.employee_id].push(p);
    });
    Object.keys(salaryByEmp).forEach(function(eid){
      var records = salaryByEmp[eid].sort(function(a,b){ return new Date(a.month)-new Date(b.month); });
      if(records.length>=2) {
        var last = records[records.length-1];
        var prev = records[records.length-2];
        if(last.net_salary > prev.net_salary * 1.5 && prev.net_salary > 1000) {
          alerts.push({ type:'salary_spike', severity:'high', msg:'Unusual salary increase for '+(last.employee_name||eid)+': EGP '+prev.net_salary+' → '+last.net_salary });
        }
      }
    });

    return alerts;
  },

  // ========== AI CASH FLOW FORECAST ==========
  forecastCashFlow: function(data) {
    var forecasts = [];
    var now = new Date();
    var monthlyRevenue = 0, monthlyExpenses = 0;
    var thisMonth = now.toISOString().substring(0,7);
    
    (data.sales||[]).forEach(function(s){ if(s.created_at && s.created_at.substring(0,7)===thisMonth) monthlyRevenue += (s.total_amount||0); });
    (data.payroll||[]).forEach(function(p){ if(p.month && p.month.substring(0,7)===thisMonth) monthlyExpenses += (p.net_salary||0); });
    (data.expenses||[]).forEach(function(e){ if(e.created_at && e.created_at.substring(0,7)===thisMonth) monthlyExpenses += (e.amount||0); });
    
    var dailyRevenue = monthlyRevenue / Math.max(now.getDate(), 1);
    var dailyExpense = monthlyExpenses / Math.max(now.getDate(), 1);
    var dailyNet = dailyRevenue - dailyExpense;
    var currentBalance = monthlyRevenue - monthlyExpenses;

    [7,15,30,60,90].forEach(function(days){
      forecasts.push({ days:days, projected: Math.round(currentBalance + (dailyNet*days)), revenue: Math.round(dailyRevenue*days), expenses: Math.round(dailyExpense*days) });
    });
    return forecasts;
  },

  // ========== FULL ANALYSIS ==========
  runFullAnalysis: function(cb) {
    AIBrain.fetchAllData(function(data){
      var analysis = {
        financial: AIBrain.analyzeFinancials(data),
        suppliers: AIBrain.analyzeSuppliers(data),
        warehouse: AIBrain.analyzeWarehouse(data),
        hr: AIBrain.analyzeHR(data),
        production: AIBrain.analyzeProduction(data),
        maintenance: AIBrain.analyzeMaintenance(data),
        quality: AIBrain.analyzeQuality(data),
        sales: AIBrain.analyzeSales(data),
        fraud: AIBrain.detectFraud(data),
        cashFlow: AIBrain.forecastCashFlow(data),
        timestamp: new Date().toISOString(),
        raw: data
      };
      AIBrain.lastAnalysis = analysis;
      AIBrain.cache = data;
      if(cb) cb(analysis);
    });
  }
};
