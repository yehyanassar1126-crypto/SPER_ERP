(function() {
    'use strict';

    // =========================================================================
    // Advanced Pricing Management (screen-id: 'pricing-management')
    // =========================================================================
    Pages.pricingManagement = function(container) {
        if (!PermissionGuard.canView('pricing-management')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }
        
        SecurityHelpers.logActivity('Enterprise', 'View', 'PricingManagement', null);
        
        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('pricing_management') : 'Advanced Pricing'}</h2>
            </div>
            <div class="tabs">
                <button class="tab-btn active" data-target="price-lists-tab">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('price_lists') : 'Price Lists'}</button>
                <button class="tab-btn" data-target="customer-prices-tab">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('customer_special_prices') : 'Customer Prices'}</button>
                <button class="tab-btn" data-target="qty-breaks-tab">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('quantity_breaks') : 'Quantity Breaks'}</button>
                <button class="tab-btn" data-target="price-compare-tab">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('price_comparison') : 'Price Comparison'}</button>
                <button class="tab-btn" data-target="margin-calc-tab">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('profit_calculator') : 'Profit Calculator'}</button>
            </div>
            
            <div class="tab-content active" id="price-lists-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('price_lists') : 'Price Lists'}</h3>
                        <button class="btn btn-primary btn-sm" id="btn-add-price-list">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('add_new') : 'Add New'}</button>
                    </div>
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('name') : 'Name'}</th>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('type') : 'Type'}</th>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('currency') : 'Currency'}</th>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('valid_from') : 'Valid From'}</th>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('valid_to') : 'Valid To'}</th>
                                    <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('actions') : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody id="price-lists-tbody">
                                <tr><td colspan="6" class="text-center">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('loading') : 'Loading...'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="customer-prices-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('customer_special_prices') : 'Customer Special Prices'}</h3>
                    </div>
                    <div class="card-body">
                         <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Product</th>
                                    <th>Special Price</th>
                                    <th>Discount %</th>
                                    <th>Validity</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="5" class="text-center">No records</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="qty-breaks-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('quantity_breaks') : 'Quantity Breaks'}</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>From Qty</th>
                                    <th>To Qty</th>
                                    <th>Discount / Price</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="4" class="text-center">No records</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="price-compare-tab">
                 <div class="card">
                    <div class="card-header">
                        <h3>Price Comparison</h3>
                    </div>
                    <div class="card-body">
                        <p>Select multiple price lists to compare product prices side-by-side.</p>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="margin-calc-tab">
                 <div class="card">
                    <div class="card-header">
                        <h3>Profit Margin Calculator</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-row">
                            <div class="form-field">
                                <label>Cost Price</label>
                                <input type="number" id="calc-cost" class="form-input" value="0">
                            </div>
                            <div class="form-field">
                                <label>Target Margin (%)</label>
                                <input type="number" id="calc-margin" class="form-input" value="20">
                            </div>
                        </div>
                        <div class="form-row mt-3">
                            <div class="form-field">
                                <label>Selling Price</label>
                                <input type="number" id="calc-selling" class="form-input" readonly>
                            </div>
                            <div class="form-field">
                                <label>Profit Amount</label>
                                <input type="number" id="calc-profit" class="form-input" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab logic
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
            });
        });

        // Calculator Logic
        const costInput = container.querySelector('#calc-cost');
        const marginInput = container.querySelector('#calc-margin');
        const sellingInput = container.querySelector('#calc-selling');
        const profitInput = container.querySelector('#calc-profit');

        const calculateMargin = () => {
            const cost = parseFloat(costInput.value) || 0;
            const margin = parseFloat(marginInput.value) || 0;
            if(margin >= 100) {
                sellingInput.value = 'N/A';
                profitInput.value = 'N/A';
                return;
            }
            const selling = cost / (1 - (margin / 100));
            const profit = selling - cost;
            sellingInput.value = selling.toFixed(2);
            profitInput.value = profit.toFixed(2);
        };
        costInput.addEventListener('input', calculateMargin);
        marginInput.addEventListener('input', calculateMargin);
        calculateMargin();
        
        loadPriceLists();

        async function loadPriceLists() {
            const tbody = container.querySelector('#price-lists-tbody');
            if(!window.sbClient) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Supabase client not found</td></tr>';
                return;
            }
            try {
                const { data, error } = await window.sbClient.from('price_lists').select('*').order('created_at', { ascending: false }).limit(10);
                if (error) throw error;
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No price lists found.</td></tr>';
                    return;
                }
                tbody.innerHTML = data.map(pl => `
                    <tr>
                        <td>${pl.name}</td>
                        <td>${pl.type}</td>
                        <td>${pl.currency}</td>
                        <td>${pl.valid_from || '-'}</td>
                        <td>${pl.valid_to || '-'}</td>
                        <td><button class="btn btn-sm btn-primary">Edit</button></td>
                    </tr>
                `).join('');
            } catch (err) {
                console.warn("Table might not exist yet, ignoring error", err);
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No records (table might be missing)</td></tr>';
            }
        }
    };

    // =========================================================================
    // Credit Management (screen-id: 'credit-management')
    // =========================================================================
    Pages.creditManagement = function(container) {
        if (!PermissionGuard.canView('credit-management')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('credit_management') : 'Credit Management'}</h2>
            </div>
            <div class="tabs">
                <button class="tab-btn active" data-target="credit-overview-tab">Customer Credit Overview</button>
                <button class="tab-btn" data-target="collection-tab">Collection Follow-ups</button>
                <button class="tab-btn" data-target="aging-tab">Aging Summary</button>
                <button class="tab-btn" data-target="risk-report-tab">Credit Risk Report</button>
            </div>
            
            <div class="tab-content active" id="credit-overview-tab">
                <div class="stats-grid mb-4" id="credit-cards-container">
                    <!-- Cards will be populated here -->
                    <div class="stat-card" style="border-left: 4px solid green;">
                        <h4>Client A</h4>
                        <p>Limit: $10,000</p>
                        <p>Balance: $2,000</p>
                        <p>Available: $8,000</p>
                        <span class="badge badge-success">OK (Risk A)</span>
                    </div>
                    <div class="stat-card" style="border-left: 4px solid orange;">
                        <h4>Client B</h4>
                        <p>Limit: $5,000</p>
                        <p>Balance: $4,500</p>
                        <p>Available: $500</p>
                        <span class="badge badge-warning">>90% Used (Risk C)</span>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="collection-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>Collection Follow-ups</h3>
                        <button class="btn btn-primary btn-sm">Add Follow-up</button>
                    </div>
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Invoice</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Next Action</th>
                                </tr>
                            </thead>
                            <tbody><tr><td colspan="6" class="text-center">No follow-ups</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="aging-tab">
                 <div class="card mb-4">
                    <div class="card-header">
                        <h3>Aging Distribution</h3>
                    </div>
                    <div class="card-body" style="height: 300px; display: flex; justify-content: center;">
                        <canvas id="agingChart"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Current</th>
                                    <th>1-30 Days</th>
                                    <th>31-60 Days</th>
                                    <th>61-90 Days</th>
                                    <th>90+ Days</th>
                                    <th>Total Due</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Client A</td>
                                    <td>$1,000</td>
                                    <td>$500</td>
                                    <td>$0</td>
                                    <td>$0</td>
                                    <td>$0</td>
                                    <td>$1,500</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="risk-report-tab">
                 <div class="card">
                    <div class="card-header">
                        <h3>Credit Risk Ranking</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Client</th>
                                    <th>Overdue Amount</th>
                                    <th>Avg Payment Days</th>
                                    <th>Utilization %</th>
                                    <th>Risk Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>1</td><td>Client C</td><td>$5,000</td><td>45 days</td><td>95%</td><td>D (High)</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Tab logic
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
                
                if(e.target.dataset.target === 'aging-tab') {
                    initAgingChart();
                }
            });
        });

        function initAgingChart() {
            if(window.Chart && !window.agingChartInstance) {
                const ctx = container.querySelector('#agingChart').getContext('2d');
                window.agingChartInstance = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
                        datasets: [{
                            data: [5000, 2000, 1000, 500, 200],
                            backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
        }
    };

    // =========================================================================
    // Returns / RMA (screen-id: 'rma-management')
    // =========================================================================
    Pages.rmaManagement = function(container) {
        if (!PermissionGuard.canView('rma-management')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>RMA & Returns Management</h2>
            </div>
            <div class="tabs">
                <button class="tab-btn active" data-target="rma-list-tab">RMA List</button>
                <button class="tab-btn" data-target="rma-analytics-tab">RMA Analytics</button>
            </div>
            
            <div class="tab-content active" id="rma-list-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>Returns</h3>
                        <button class="btn btn-primary btn-sm" id="btn-create-rma">Create RMA</button>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid mb-4">
                            <div class="stat-card"><h4>Requested</h4><h2>5</h2></div>
                            <div class="stat-card"><h4>Approved</h4><h2>2</h2></div>
                            <div class="stat-card"><h4>Inspecting</h4><h2>1</h2></div>
                            <div class="stat-card"><h4>Resolved</h4><h2>12</h2></div>
                        </div>
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>RMA #</th>
                                    <th>Type</th>
                                    <th>Entity</th>
                                    <th>Date</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>RMA-001</td>
                                    <td>Customer</td>
                                    <td>Client A</td>
                                    <td>2024-05-10</td>
                                    <td>$150.00</td>
                                    <td><span class="badge badge-warning">Requested</span></td>
                                    <td><button class="btn btn-sm btn-primary">View</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="rma-analytics-tab">
                 <div class="card">
                    <div class="card-header">
                        <h3>Return Reasons</h3>
                    </div>
                    <div class="card-body" style="height: 300px; display: flex; justify-content: center;">
                        <canvas id="rmaChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Tab logic
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
                
                if(e.target.dataset.target === 'rma-analytics-tab') {
                    initRMAChart();
                }
            });
        });

        container.querySelector('#btn-create-rma').addEventListener('click', () => {
            const bodyHtml = `
                <div class="form-row">
                    <div class="form-field">
                        <label>Type</label>
                        <select class="form-input"><option>Customer Return</option><option>Supplier Return</option></select>
                    </div>
                    <div class="form-field">
                        <label>Entity (Client/Supplier)</label>
                        <input type="text" class="form-input">
                    </div>
                </div>
                <div class="form-row mt-3">
                    <div class="form-field">
                        <label>Original Order</label>
                        <input type="text" class="form-input">
                    </div>
                </div>
                <div class="mt-3">
                    <h5>Items</h5>
                    <table class="data-table w-100">
                        <thead><tr><th>Product</th><th>Qty</th><th>Reason</th><th>Condition</th></tr></thead>
                        <tbody><tr><td>Product X</td><td>1</td><td><input type="text" class="form-input"></td><td><select class="form-input"><option>Damaged</option><option>Unopened</option></select></td></tr></tbody>
                    </table>
                </div>
            `;
            App.showModal('Create New RMA', bodyHtml, `<button class="btn btn-success" onclick="App.hideModal(); showToast('RMA Created', 'success')">Submit</button>`, true);
        });

        function initRMAChart() {
            if(window.Chart && !window.rmaChartInstance) {
                const ctx = container.querySelector('#rmaChart').getContext('2d');
                window.rmaChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Defective', 'Wrong Item', 'Not Needed', 'Damaged in Transit'],
                        datasets: [{
                            data: [40, 20, 15, 25],
                            backgroundColor: ['#dc3545', '#ffc107', '#17a2b8', '#fd7e14']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
        }
    };

})();
