// ===== ENTERPRISE FINANCIAL REPORTS =====
window.Pages = window.Pages || {};

// ==========================================
// FINANCIAL REPORTS HUB
// ==========================================
Pages.financialReports = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';

  Promise.all([
    sbClient.from('general_ledger').select('*').order('transaction_date', {ascending: false}),
    sbClient.from('finance_invoices').select('*'),
    sbClient.from('payroll').select('*'),
    sbClient.from('finance_fixed_assets').select('*'),
    sbClient.from('finance_safes').select('*'),
    sbClient.from('finance_bank_accounts').select('*'),
    sbClient.from('finance_checks').select('*')
  ]).then(function(results) {
    var ledger = results[0].data || [];
    var invoices = results[1].data || [];
    var payroll = results[2].data || [];
    var assets = results[3].data || [];
    var safes = results[4].data || [];
    var banks = results[5].data || [];
    var checks = results[6].data || [];

    // Calculate totals
    var totalRevenue = ledger.filter(function(l) { return l.account_type === 'revenue'; }).reduce(function(s,l) { return s + (parseFloat(l.credit) || 0); }, 0);
    var totalExpenses = ledger.filter(function(l) { return l.account_type === 'expense'; }).reduce(function(s,l) { return s + (parseFloat(l.debit) || 0); }, 0);
    var totalAssets = ledger.filter(function(l) { return l.account_type === 'asset'; }).reduce(function(s,l) { return s + (parseFloat(l.debit) || 0) - (parseFloat(l.credit) || 0); }, 0);
    var totalLiabilities = ledger.filter(function(l) { return l.account_type === 'liability'; }).reduce(function(s,l) { return s + (parseFloat(l.credit) || 0) - (parseFloat(l.debit) || 0); }, 0);
    var totalEquity = ledger.filter(function(l) { return l.account_type === 'equity'; }).reduce(function(s,l) { return s + (parseFloat(l.credit) || 0) - (parseFloat(l.debit) || 0); }, 0);
    var netProfit = totalRevenue - totalExpenses;
    var safeBalance = safes.reduce(function(s,f) { return s + (parseFloat(f.balance) || 0); }, 0);
    var bankBalance = banks.reduce(function(s,b) { return s + (parseFloat(b.balance) || 0); }, 0);
    var pendingChecks = checks.filter(function(c) { return c.status === 'pending' || c.status === 'under_collection'; });
    var pendingCheckAmount = pendingChecks.reduce(function(s,c) { return s + (parseFloat(c.amount) || 0); }, 0);
    var totalPayroll = payroll.reduce(function(s,p) { return s + (parseFloat(p.net_salary) || 0); }, 0);
    var assetValue = assets.reduce(function(s,a) { return s + (parseFloat(a.current_value) || 0); }, 0);

    var html = '';
    // Header
    html += '<div style="background:linear-gradient(135deg,#0f172a,#1e40af);border-radius:16px;padding:32px;color:white;margin-bottom:24px">';
    html += '<h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;color:white">📊 Financial Reports Center</h1>';
    html += '<p style="opacity:0.8">Comprehensive financial overview and reporting</p></div>';

    // Key Financial KPIs
    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _finCard('💰', 'Total Revenue', totalRevenue, '#22c55e');
    html += _finCard('📉', 'Total Expenses', totalExpenses, '#ef4444');
    html += _finCard('📊', 'Net Profit', netProfit, netProfit >= 0 ? '#22c55e' : '#ef4444');
    html += _finCard('🏦', 'Cash + Bank', safeBalance + bankBalance, '#6366f1');
    html += '</div>';

    html += '<div class="stats-grid" style="margin-bottom:24px">';
    html += _finCard('📋', 'Pending Checks', pendingCheckAmount, '#f59e0b');
    html += _finCard('💼', 'Total Payroll', totalPayroll, '#8b5cf6');
    html += _finCard('🏗️', 'Fixed Assets', assetValue, '#06b6d4');
    html += _finCard('📄', 'Invoices', invoices.length, '#ec4899');
    html += '</div>';

    // Report Tabs
    html += '<div style="display:flex;gap:8px;margin-bottom:20px">';
    html += '<button class="btn btn-sm btn-outline" id="tab-pl" style="border-color:var(--accent-primary);color:var(--accent-primary)">Profit & Loss (أرباح وخسائر)</button>';
    html += '<button class="btn btn-sm btn-ghost" id="tab-bs">Balance Sheet (الميزانية)</button>';
    html += '<button class="btn btn-sm btn-ghost" id="tab-cf">Cash Flow (التدفقات النقدية)</button>';
    html += '<button class="btn btn-sm btn-ghost" id="tab-gl">General Ledger</button>';
    html += '</div>';

    // === P&L ===
    html += '<div id="view-pl">';
    html += '<div class="card"><div class="card-header"><div><h3>📊 Profit & Loss Statement (قائمة الأرباح والخسائر)</h3>';
    html += '<p>Period: All Time</p></div>';
    html += '<button class="btn btn-sm btn-outline" onclick="DataExport.toPDF([{Item:\'Revenue\',Amount:' + totalRevenue + '},{Item:\'Expenses\',Amount:' + totalExpenses + '},{Item:\'Net Profit\',Amount:' + netProfit + '}],\'Profit & Loss Statement\',\'PnL\')">📄 Export PDF</button>';
    html += '</div><div class="card-body">';
    html += '<table class="data-table"><tbody>';
    html += '<tr style="background:rgba(34,197,94,0.05)"><td style="font-weight:700;font-size:1.1rem" colspan="2">Revenue (الإيرادات)</td></tr>';
    
    var revenueAccounts = {};
    ledger.filter(function(l) { return l.account_type === 'revenue'; }).forEach(function(l) {
      if (!revenueAccounts[l.account_name]) revenueAccounts[l.account_name] = 0;
      revenueAccounts[l.account_name] += (parseFloat(l.credit) || 0);
    });
    Object.keys(revenueAccounts).forEach(function(acc) {
      html += '<tr><td style="padding-left:32px">' + acc + '</td><td style="text-align:right;font-weight:600;color:var(--accent-success)">' + revenueAccounts[acc].toLocaleString() + ' EGP</td></tr>';
    });
    html += '<tr style="border-top:2px solid var(--border-color)"><td style="font-weight:700">Total Revenue</td><td style="text-align:right;font-weight:800;color:var(--accent-success);font-size:1.1rem">' + totalRevenue.toLocaleString() + ' EGP</td></tr>';

    html += '<tr style="background:rgba(239,68,68,0.05)"><td style="font-weight:700;font-size:1.1rem" colspan="2">Expenses (المصروفات)</td></tr>';
    var expenseAccounts = {};
    ledger.filter(function(l) { return l.account_type === 'expense'; }).forEach(function(l) {
      if (!expenseAccounts[l.account_name]) expenseAccounts[l.account_name] = 0;
      expenseAccounts[l.account_name] += (parseFloat(l.debit) || 0);
    });
    Object.keys(expenseAccounts).forEach(function(acc) {
      html += '<tr><td style="padding-left:32px">' + acc + '</td><td style="text-align:right;font-weight:600;color:var(--accent-danger)">' + expenseAccounts[acc].toLocaleString() + ' EGP</td></tr>';
    });
    html += '<tr style="border-top:2px solid var(--border-color)"><td style="font-weight:700">Total Expenses</td><td style="text-align:right;font-weight:800;color:var(--accent-danger);font-size:1.1rem">' + totalExpenses.toLocaleString() + ' EGP</td></tr>';

    html += '<tr style="background:rgba(99,102,241,0.08);border-top:3px double var(--border-color)"><td style="font-weight:800;font-size:1.2rem">Net Profit (صافي الربح)</td>';
    html += '<td style="text-align:right;font-weight:800;font-size:1.3rem;color:' + (netProfit >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)') + '">' + netProfit.toLocaleString() + ' EGP</td></tr>';
    html += '</tbody></table></div></div></div>';

    // === Balance Sheet ===
    html += '<div id="view-bs" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>📋 Balance Sheet (الميزانية العمومية)</h3></div></div><div class="card-body">';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">';
    html += '<div><h4 style="color:var(--accent-success);margin-bottom:12px;border-bottom:2px solid var(--accent-success);padding-bottom:8px">Assets (الأصول)</h4>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    html += _bsRow('Cash (النقدية)', safeBalance);
    html += _bsRow('Bank (البنك)', bankBalance);
    html += _bsRow('Checks Under Collection', pendingCheckAmount);
    html += _bsRow('Fixed Assets (أصول ثابتة)', assetValue);
    html += _bsRow('Other Assets', Math.max(0, totalAssets - safeBalance - bankBalance - assetValue));
    html += '<div style="border-top:2px solid var(--accent-success);padding-top:8px;display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem"><span>Total Assets</span><span style="color:var(--accent-success)">' + (safeBalance + bankBalance + pendingCheckAmount + assetValue).toLocaleString() + ' EGP</span></div>';
    html += '</div></div>';
    
    html += '<div><h4 style="color:var(--accent-danger);margin-bottom:12px;border-bottom:2px solid var(--accent-danger);padding-bottom:8px">Liabilities & Equity (الخصوم وحقوق الملكية)</h4>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    html += _bsRow('Accounts Payable (دائنون)', totalLiabilities);
    html += _bsRow('Salaries Payable', totalPayroll);
    html += _bsRow('Owner Equity (رأس المال)', totalEquity);
    html += _bsRow('Retained Earnings', netProfit);
    html += '<div style="border-top:2px solid var(--accent-danger);padding-top:8px;display:flex;justify-content:space-between;font-weight:800;font-size:1.1rem"><span>Total L&E</span><span style="color:var(--accent-danger)">' + (totalLiabilities + totalPayroll + totalEquity + netProfit).toLocaleString() + ' EGP</span></div>';
    html += '</div></div></div></div></div></div>';

    // === Cash Flow ===
    html += '<div id="view-cf" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>💰 Cash Flow Statement (التدفقات النقدية)</h3></div></div><div class="card-body">';
    html += '<table class="data-table"><tbody>';
    html += '<tr style="background:rgba(34,197,94,0.05)"><td style="font-weight:700" colspan="2">Cash from Operations</td></tr>';
    html += '<tr><td style="padding-left:24px">Revenue Collected</td><td style="text-align:right;color:var(--accent-success)">+' + totalRevenue.toLocaleString() + '</td></tr>';
    html += '<tr><td style="padding-left:24px">Expenses Paid</td><td style="text-align:right;color:var(--accent-danger)">-' + totalExpenses.toLocaleString() + '</td></tr>';
    html += '<tr><td style="padding-left:24px">Salaries Paid</td><td style="text-align:right;color:var(--accent-danger)">-' + totalPayroll.toLocaleString() + '</td></tr>';
    html += '<tr style="font-weight:700;border-top:1px solid var(--border-color)"><td>Net Cash from Operations</td><td style="text-align:right">' + (totalRevenue - totalExpenses - totalPayroll).toLocaleString() + ' EGP</td></tr>';
    html += '<tr style="background:rgba(99,102,241,0.05)"><td style="font-weight:700" colspan="2">Cash from Investing</td></tr>';
    html += '<tr><td style="padding-left:24px">Fixed Assets Purchased</td><td style="text-align:right;color:var(--accent-danger)">-' + assetValue.toLocaleString() + '</td></tr>';
    html += '<tr style="background:rgba(245,158,11,0.05);border-top:2px solid var(--border-color)"><td style="font-weight:800;font-size:1.1rem">Ending Cash Balance</td><td style="text-align:right;font-weight:800;font-size:1.2rem;color:var(--accent-primary)">' + (safeBalance + bankBalance).toLocaleString() + ' EGP</td></tr>';
    html += '</tbody></table></div></div></div>';

    // === General Ledger ===
    html += '<div id="view-gl" style="display:none">';
    html += '<div class="card"><div class="card-header"><div><h3>📒 General Ledger (دفتر الأستاذ)</h3><p>' + ledger.length + ' entries</p></div>';
    html += '<button class="btn btn-sm btn-outline" onclick="exportLedger()">📥 Export Excel</button></div><div class="card-body no-pad">';
    html += '<table class="data-table"><thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Description</th><th>Debit</th><th>Credit</th></tr></thead><tbody>';
    ledger.slice(0, 100).forEach(function(l) {
      html += '<tr><td>' + formatDate(l.transaction_date) + '</td><td style="font-weight:600">' + l.account_name + '</td>';
      html += '<td><span class="badge badge-info">' + (l.account_type || '-') + '</span></td>';
      html += '<td>' + (l.description || '-') + '</td>';
      html += '<td style="color:var(--accent-danger);font-weight:600">' + (parseFloat(l.debit) > 0 ? parseFloat(l.debit).toLocaleString() : '-') + '</td>';
      html += '<td style="color:var(--accent-success);font-weight:600">' + (parseFloat(l.credit) > 0 ? parseFloat(l.credit).toLocaleString() : '-') + '</td></tr>';
    });
    html += '</tbody></table></div></div></div>';

    el.innerHTML = html;

    // Tab switching
    var tabs = ['pl','bs','cf','gl'];
    tabs.forEach(function(t) {
      var btn = document.getElementById('tab-' + t);
      if (btn) btn.addEventListener('click', function() {
        tabs.forEach(function(x) {
          var b = document.getElementById('tab-' + x);
          var v = document.getElementById('view-' + x);
          if (b) { b.className = 'btn btn-sm btn-ghost'; b.style.borderColor = 'transparent'; b.style.color = 'inherit'; }
          if (v) v.style.display = 'none';
        });
        this.className = 'btn btn-sm btn-outline';
        this.style.borderColor = 'var(--accent-primary)';
        this.style.color = 'var(--accent-primary)';
        document.getElementById('view-' + t).style.display = 'block';
      });
    });

    window.exportLedger = function() {
      DataExport.toExcel(ledger, 'General_Ledger', 'Ledger');
    };
  });

  function _finCard(emoji, label, value, color) {
    return '<div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:20px;border-left:4px solid ' + color + '">' +
      '<div style="font-size:1.5rem;margin-bottom:8px">' + emoji + '</div>' +
      '<div style="font-size:1.4rem;font-weight:800">' + (typeof value === 'number' ? value.toLocaleString() + ' EGP' : value) + '</div>' +
      '<div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase;margin-top:4px">' + label + '</div></div>';
  }

  function _bsRow(label, amount) {
    return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--border-color)"><span>' + label + '</span><span style="font-weight:600">' + (amount || 0).toLocaleString() + ' EGP</span></div>';
  }
};
