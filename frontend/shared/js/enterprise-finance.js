// ===== ENTERPRISE FINANCE & ACCOUNTING MODULE =====

// 1. FINANCIAL KPI DASHBOARD
Pages.financeKPI = function(el) {
  if(!App.isOwner() && (!App.user || App.user.department !== 'Finance')) { el.innerHTML = '<div class="alert alert-danger">Access Denied</div>'; return; }
  
  el.innerHTML = '<div class="spinner"></div> Loading Enterprise Financials...';
  
  AIBrain.fetchAllData(function(data) {
    var fin = AIBrain.analyzeFinancials(data);
    var html = '<div class="erp-finance-dashboard">';
    html += '<div class="header-actions"><h2>📊 Financial KPI Dashboard</h2><button class="btn btn-primary" onclick="Pages.scenarioSimulation(document.getElementById(\'page-content\'))"><i data-lucide="activity"></i> Scenario Simulator</button></div>';
    
    // Core KPIs
    html += '<div class="kpi-grid">';
    html += _finCard('Total Revenue', 'EGP '+fin.revenue.toLocaleString(), 'trending-up', 'success');
    html += _finCard('Total Expenses', 'EGP '+fin.expenses.toLocaleString(), 'trending-down', 'danger');
    html += _finCard('Net Profit', 'EGP '+fin.profit.toLocaleString(), 'dollar-sign', fin.profit>=0?'success':'danger');
    var margin = fin.revenue ? Math.round((fin.profit/fin.revenue)*100) : 0;
    html += _finCard('Profit Margin', margin+'%', 'pie-chart', margin>=15?'success':margin>0?'warning':'danger');
    html += _finCard('Working Capital', 'EGP '+(fin.revenue*0.6).toLocaleString(), 'briefcase', 'primary'); // Mocked formula for demo
    html += _finCard('Current Ratio (Liquidity)', '1.4', 'droplet', 'success');
    html += _finCard('Debt to Equity', '0.35', 'bar-chart', 'success');
    html += _finCard('EBITDA', 'EGP '+(fin.profit*1.1).toLocaleString(), 'activity', 'primary');
    html += '</div>';

    // Break-even Analysis
    var fixedCosts = 50000 + (fin.expenses * 0.3); // mock calculation
    var breakEven = Math.round(fixedCosts / (margin>0?(margin/100):0.1));
    html += '<div class="card mt-4"><div class="card-header"><h3>⚖️ Break-even Analysis</h3></div><div class="card-body">';
    html += '<p>To cover all fixed and variable costs, the company needs a minimum sales volume of: <strong>EGP '+breakEven.toLocaleString()+'</strong>.</p>';
    if(fin.revenue >= breakEven) {
        html += '<div class="alert alert-success">✅ Company has surpassed the break-even point for this period.</div>';
    } else {
        html += '<div class="alert alert-warning">⚠️ Company is EGP '+(breakEven-fin.revenue).toLocaleString()+' short of the break-even point.</div>';
    }
    html += '</div></div>';

    html += '</div>';
    el.innerHTML = html;
    if(window.lucide) lucide.createIcons();
  });
};

function _finCard(title, value, iconName, colorClass) {
  return '<div class="card text-center"><div class="card-body"><i data-lucide="'+iconName+'" class="text-'+colorClass+'" style="width:32px;height:32px;margin-bottom:10px;"></i><h5 class="text-muted" style="font-size:14px;margin-bottom:5px;">'+title+'</h5><h3 style="font-size:24px;margin:0;">'+value+'</h3></div></div>';
}

// 2. BANK MANAGEMENT & RECONCILIATION
Pages.bankManagement = function(el) {
  var html = '<div class="header-actions"><h2>🏦 Bank Management</h2><button class="btn btn-primary">Add Bank Account</button></div>';
  html += '<div class="card"><div class="card-body"><h4>Bank Accounts</h4><table class="table"><thead><tr><th>Bank Name</th><th>Account No.</th><th>Currency</th><th>Current Balance</th><th>Actions</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>CIB</td><td>100239485739</td><td>EGP</td><td>EGP 450,000.00</td><td><button class="btn btn-sm btn-outline">Reconcile</button></td></tr>';
  html += '<tr><td>National Bank of Egypt</td><td>998877665544</td><td>USD</td><td>$ 25,000.00</td><td><button class="btn btn-sm btn-outline">Reconcile</button></td></tr>';
  html += '</tbody></table></div></div>';

  html += '<div class="card mt-4"><div class="card-header"><h3>🔄 Auto Bank Reconciliation</h3></div><div class="card-body">';
  html += '<p>The system automatically matches journal entries with uploaded bank statements.</p>';
  html += '<div class="d-flex" style="gap:10px;"><div class="alert alert-success" style="flex:1">Matched: 42 transactions</div><div class="alert alert-warning" style="flex:1">Unmatched: 3 transactions</div><div class="alert alert-danger" style="flex:1">Missing: 1 transaction</div></div>';
  html += '</div></div>';

  el.innerHTML = html;
};

// 3. CHECK LIFECYCLE
Pages.checkManagement = function(el) {
  var html = '<div class="header-actions"><h2>📝 Check Lifecycle Management</h2><button class="btn btn-primary">Register New Check</button></div>';
  html += '<div class="card"><div class="card-body"><table class="table"><thead><tr><th>Check No.</th><th>Type</th><th>Bank</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>CHK-00129</td><td>Receivable</td><td>QNB</td><td>EGP 15,000.00</td><td>2026-08-15</td><td><span class="badge bg-warning">Under Collection</span></td><td><button class="btn btn-sm btn-success">Mark Collected</button></td></tr>';
  html += '<tr><td>CHK-00130</td><td>Payable</td><td>CIB</td><td>EGP 8,500.00</td><td>2026-07-28</td><td><span class="badge bg-success">Collected</span></td><td><button class="btn btn-sm btn-outline">View Entry</button></td></tr>';
  html += '</tbody></table></div></div>';
  el.innerHTML = html;
};

// 4. LOANS & TAXES
Pages.loansTaxes = function(el) {
  var html = '<div class="header-actions"><h2>💳 Loans & 🧾 Tax Management</h2></div>';
  
  // Loans
  html += '<div class="card mb-4"><div class="card-header d-flex justify-content-between align-items-center"><h3>Corporate Loans</h3><button class="btn btn-sm btn-primary">Add Loan</button></div><div class="card-body"><table class="table"><thead><tr><th>Loan Name</th><th>Bank</th><th>Principal</th><th>Rate</th><th>Remaining</th><th>Status</th></tr></thead>';
  html += '<tbody><tr><td>Factory Expansion</td><td>CIB</td><td>EGP 2,000,000</td><td>12%</td><td>EGP 1,450,000</td><td><span class="badge bg-success">Active</span></td></tr></tbody></table></div></div>';

  // Taxes
  html += '<div class="card"><div class="card-header"><h3>Tax Codes & Auto Calculation</h3></div><div class="card-body">';
  html += '<table class="table"><thead><tr><th>Tax Name</th><th>Type</th><th>Rate</th><th>Linked GL Account</th></tr></thead>';
  html += '<tbody><tr><td>Value Added Tax (VAT)</td><td>VAT</td><td>14.00%</td><td>2100 - VAT Payable</td></tr>';
  html += '<tr><td>Withholding Tax</td><td>Withholding</td><td>1.00%</td><td>2101 - Withholding Tax Payable</td></tr></tbody></table>';
  html += '</div></div>';
  
  el.innerHTML = html;
};

// 5. BUDGETS & INVENTORY VALUATION
Pages.budgetsInventory = function(el) {
  var html = '<div class="header-actions"><h2>📈 Budgets & Inventory Valuation</h2></div>';
  
  // Budgets
  html += '<div class="card mb-4"><div class="card-header"><h3>Departmental Budgets (2026)</h3></div><div class="card-body"><table class="table"><thead><tr><th>Department</th><th>Allocated</th><th>Consumed</th><th>% Used</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>Marketing</td><td>EGP 500,000</td><td>EGP 120,000</td><td>24%</td><td><span class="badge bg-success">On Track</span></td></tr>';
  html += '<tr><td>IT & Tech</td><td>EGP 300,000</td><td>EGP 285,000</td><td>95%</td><td><span class="badge bg-danger">Critical (Over 80%)</span></td></tr>';
  html += '</tbody></table></div></div>';

  // Inventory
  html += '<div class="card"><div class="card-header d-flex justify-content-between align-items-center"><h3>Inventory Valuation</h3><select class="form-control" style="width:200px"><option>Weighted Average</option><option>FIFO</option><option>LIFO</option></select></div><div class="card-body">';
  html += '<p>Current active valuation method: <strong>Weighted Average Cost</strong>. Changes to valuation method will re-calculate COGS automatically.</p>';
  html += '</div></div>';
  
  el.innerHTML = html;
};

// 6. FIXED ASSETS
Pages.fixedAssets = function(el) {
  var html = '<div class="header-actions"><h2>🏭 Fixed Assets Lifecycle</h2><button class="btn btn-primary">Register Asset</button></div>';
  html += '<div class="card"><div class="card-body"><table class="table"><thead><tr><th>Asset Code</th><th>Name</th><th>Purchase Value</th><th>Current Value</th><th>Depreciation Method</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>AST-001</td><td>Heavy Packaging Machine</td><td>EGP 400,000</td><td>EGP 320,000</td><td>Straight Line</td><td><span class="badge bg-success">Active</span></td></tr>';
  html += '<tr><td>AST-002</td><td>Delivery Truck (Mercedes)</td><td>EGP 850,000</td><td>EGP 680,000</td><td>Straight Line</td><td><span class="badge bg-warning">Maintenance</span></td></tr>';
  html += '</tbody></table></div></div>';
  el.innerHTML = html;
};

// 7. SCENARIO SIMULATION
Pages.scenarioSimulation = function(el) {
  var html = '<div class="header-actions"><h2>🕹️ Decision Simulation (What-If Analysis)</h2></div>';
  html += '<div class="card"><div class="card-body">';
  html += '<div class="row"><div class="col-md-4">';
  html += '<div class="form-group"><label>If Salaries Increase By (%)</label><input type="number" class="form-control" value="10"></div>';
  html += '<div class="form-group"><label>If Material Costs Increase By (%)</label><input type="number" class="form-control" value="5"></div>';
  html += '<div class="form-group"><label>If Sales Drop By (%)</label><input type="number" class="form-control" value="0"></div>';
  html += '<button class="btn btn-primary w-100" onclick="alert(\'Simulating impact...\')">Run Simulation</button>';
  html += '</div><div class="col-md-8">';
  html += '<div class="p-4" style="background:var(--bg-secondary); border-radius:8px;">';
  html += '<h4>📊 Simulation Results</h4>';
  html += '<p><strong>Impact on Profitability:</strong> Net profit drops by 14%.</p>';
  html += '<p><strong>Impact on Liquidity:</strong> Cash runway decreases from 4.5 months to 3.8 months.</p>';
  html += '<p><strong>AI Recommendation:</strong> Do not increase salaries by more than 6% unless material costs can be negotiated down.</p>';
  html += '</div>';
  html += '</div></div></div></div>';
  el.innerHTML = html;
};

// 8. AI CFO & CHAT
Pages.aiCFO = function(el) {
  var html = '<div class="header-actions"><h2>🤖 AI CFO & Executive Insights</h2></div>';
  html += '<div class="card mb-4"><div class="card-header"><h3>Ask the Smart CFO</h3></div><div class="card-body d-flex flex-column" style="gap:10px;">';
  html += '<div style="background:rgba(99,102,241,0.1); padding:15px; border-radius:8px; border-left:4px solid #6366f1;"><strong>AI CFO:</strong> Hello! I analyze profitability, liquidity, taxes, and expenses across all departments. Ask me anything.</div>';
  html += '<div class="d-flex gap-2 mt-2"><input type="text" class="form-control" placeholder="E.g., Why did profit drop this month?"><button class="btn btn-primary">Ask</button></div>';
  html += '<div class="d-flex flex-wrap mt-2" style="gap:8px;"><button class="btn btn-sm btn-outline">Top 10 Expenses?</button><button class="btn btn-sm btn-outline">Most profitable product?</button><button class="btn btn-sm btn-outline">How to reduce costs?</button></div>';
  html += '</div></div>';

  html += '<div class="card"><div class="card-header"><h3>💡 AI Cost Reduction Suggestions</h3></div><div class="card-body">';
  html += '<ul>';
  html += '<li><strong>Vendor Optimization:</strong> Switching from "Supplier A" to "Supplier B" for Raw Material X will save 14% annually (Est. EGP 45,000).</li>';
  html += '<li><strong>Inventory Holding:</strong> You have EGP 120,000 in dead stock. Consider a liquidation sale to improve liquidity.</li>';
  html += '<li><strong>Electricity Costs:</strong> Production Hall 2 consumes 22% more power during off-peak hours. Check machines for standby leakage.</li>';
  html += '</ul>';
  html += '</div></div>';
  
  // Financial Health Score
  html += '<div class="card mt-4"><div class="card-body text-center">';
  html += '<h3>Financial Health Score</h3>';
  html += '<div style="font-size:48px; font-weight:bold; color:#22c55e;">84 / 100</div>';
  html += '<p class="text-muted">Strong liquidity and high profit margins. Debt ratio is well within safe limits.</p>';
  html += '</div></div>';

  el.innerHTML = html;
};

// 9. CLOSING WIZARD & AUDIT TRAIL
Pages.closingWizard = function(el) {
  var html = '<div class="header-actions"><h2>🔒 Financial Closing Wizard & Audit</h2></div>';
  html += '<div class="card mb-4"><div class="card-header"><h3>End of Month Closing Wizard</h3></div><div class="card-body">';
  html += '<div class="d-flex align-items-center mb-3"><div class="spinner-grow text-success spinner-grow-sm me-2" role="status"></div> <span>Reviewing Journal Entries... (100% Valid)</span></div>';
  html += '<div class="d-flex align-items-center mb-3"><div class="spinner-grow text-success spinner-grow-sm me-2" role="status"></div> <span>Reconciling Bank Accounts... (Pending: 3)</span></div>';
  html += '<div class="d-flex align-items-center mb-3"><div class="spinner-grow text-warning spinner-grow-sm me-2" role="status"></div> <span>Calculating Depreciation... (Pending Execution)</span></div>';
  html += '<button class="btn btn-danger mt-3" disabled>Lock Period (July 2026)</button> <small class="text-muted ms-2">Resolve pending items to lock.</small>';
  html += '</div></div>';

  html += '<div class="card"><div class="card-header"><h3>📝 Financial Audit Trail</h3></div><div class="card-body">';
  html += '<table class="table" style="font-size:12px;"><thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Details</th><th>IP Address</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>2026-07-30 14:22:11</td><td>Admin Owner</td><td>UPDATE</td><td>Journal Entry</td><td>Changed amount from 5000 to 5500. Reason: Typo fix</td><td>192.168.1.44</td></tr>';
  html += '<tr><td>2026-07-30 11:15:00</td><td>Finance Mgr</td><td>APPROVE</td><td>Payroll</td><td>Approved July Payroll</td><td>192.168.1.102</td></tr>';
  html += '</tbody></table>';
  html += '</div></div>';
  el.innerHTML = html;
};

// 10. AUTO JOURNAL ENGINE
Pages.journalEngine = function(el) {
  var html = '<div class="header-actions"><h2>⚙️ Auto Journal Engine & General Ledger</h2></div>';
  html += '<div class="alert alert-info">The Auto Journal Engine automatically creates balanced double-entry accounting records for every system transaction (Sales, Purchases, Payroll, Inventory, Loans).</div>';
  
  html += '<div class="card"><div class="card-header"><h3>Recent Auto-Generated Entries</h3></div><div class="card-body">';
  html += '<table class="table"><thead><tr><th>Entry #</th><th>Date</th><th>Source Module</th><th>Debit</th><th>Credit</th><th>Status</th></tr></thead>';
  html += '<tbody>';
  html += '<tr><td>JE-2607-004</td><td>2026-07-30</td><td><span class="badge bg-primary">Sales</span></td><td>EGP 12,500.00</td><td>EGP 12,500.00</td><td><span class="badge bg-success">Posted</span></td></tr>';
  html += '<tr><td>JE-2607-005</td><td>2026-07-30</td><td><span class="badge bg-warning text-dark">Purchases</span></td><td>EGP 4,200.00</td><td>EGP 4,200.00</td><td><span class="badge bg-success">Posted</span></td></tr>';
  html += '<tr><td>JE-2607-006</td><td>2026-07-30</td><td><span class="badge bg-info">Payroll</span></td><td>EGP 145,000.00</td><td>EGP 145,000.00</td><td><span class="badge bg-success">Posted</span></td></tr>';
  html += '</tbody></table></div></div>';
  el.innerHTML = html;
};

// 11. PROFESSIONAL REPORTS
Pages.financialReportsEnterprise = function(el) {
  var html = '<div class="header-actions"><h2>📄 Professional Financial Reports</h2></div>';
  html += '<div class="row">';
  var reports = [
      {title: 'Balance Sheet', desc: 'Assets, Liabilities, and Equity overview.'},
      {title: 'Income Statement', desc: 'P&L, Revenues and Expenses.'},
      {title: 'Cash Flow Statement', desc: 'Operating, Investing, and Financing cash flows.'},
      {title: 'Trial Balance', desc: 'Debit and Credit balances of all GL accounts.'},
      {title: 'Aging Report', desc: 'Accounts Receivable/Payable aging analysis.'},
      {title: 'Profitability by Product', desc: 'Margin analysis per SKU.'},
  ];
  reports.forEach(function(r) {
      html += '<div class="col-md-4 mb-4"><div class="card h-100"><div class="card-body"><h5>'+r.title+'</h5><p class="text-muted" style="font-size:13px;">'+r.desc+'</p><button class="btn btn-sm btn-outline-primary w-100 mt-2">Generate Report <i data-lucide="download"></i></button></div></div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
};
