(function() {
    'use strict';

    // =========================================================================
    // E-Invoice System (screen-id: 'einvoice-system')
    // =========================================================================
    Pages.einvoiceSystem = function(container) {
        if (!PermissionGuard.canView('einvoice-system')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }
        
        SecurityHelpers.logActivity('Enterprise', 'View', 'EInvoiceSystem', null);

        container.innerHTML = `
            <div class="page-header">
                <h2>E-Invoice System (ETA)</h2>
            </div>
            <div class="tabs">
                <button class="tab-btn active" data-target="einv-config-tab">Configuration</button>
                <button class="tab-btn" data-target="einv-issue-tab">Issue E-Invoice</button>
                <button class="tab-btn" data-target="einv-register-tab">E-Invoice Register</button>
                <button class="tab-btn" data-target="einv-tax-tab">Tax Report</button>
            </div>
            
            <div class="tab-content active" id="einv-config-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>ETA Credentials Setup</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-row">
                            <div class="form-field">
                                <label>Company Tax ID</label>
                                <input type="text" class="form-input" placeholder="e.g. 123-456-789">
                            </div>
                            <div class="form-field">
                                <label>Branch ID</label>
                                <input type="text" class="form-input" value="0">
                            </div>
                            <div class="form-field">
                                <label>Activity Code</label>
                                <input type="text" class="form-input" placeholder="e.g. 4620">
                            </div>
                        </div>
                        <div class="form-row mt-3">
                            <div class="form-field">
                                <label>Client ID</label>
                                <input type="text" class="form-input">
                            </div>
                            <div class="form-field">
                                <label>Client Secret</label>
                                <input type="password" class="form-input">
                            </div>
                        </div>
                        <div class="form-row mt-3">
                            <div class="form-field">
                                <label>Environment</label>
                                <select class="form-input">
                                    <option value="test">Testing (Pre-production)</option>
                                    <option value="prod">Production</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button class="btn btn-success" onclick="showToast('Settings saved successfully', 'success')">Save Configuration</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="einv-issue-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>Issue New E-Invoice</h3>
                    </div>
                    <div class="card-body">
                         <div class="form-row">
                            <div class="form-field">
                                <label>Load from Sales Order / Invoice ID</label>
                                <div style="display:flex; gap:10px;">
                                    <input type="text" class="form-input" placeholder="Enter ID">
                                    <button class="btn btn-primary">Load</button>
                                </div>
                            </div>
                        </div>
                        <hr>
                        <table class="data-table w-100 mt-3">
                            <thead>
                                <tr>
                                    <th>Code (EGS/GPC)</th>
                                    <th>Name</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Tax (14%)</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><input type="text" class="form-input" value="EG-123456789-123"></td>
                                    <td>Sample Product</td>
                                    <td>2</td>
                                    <td>100.00</td>
                                    <td>28.00</td>
                                    <td>228.00</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="mt-4" style="text-align:right;">
                            <p><strong>Subtotal:</strong> 200.00</p>
                            <p><strong>Total Tax:</strong> 28.00</p>
                            <p><strong>Net Total:</strong> 228.00</p>
                            <button class="btn btn-warning">Preview</button>
                            <button class="btn btn-success" onclick="showToast('Submitted to ETA', 'success')">Submit to ETA</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="einv-register-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>E-Invoice Register</h3>
                    </div>
                    <div class="card-body">
                        <table class="data-table w-100">
                            <thead>
                                <tr>
                                    <th>Internal ID</th>
                                    <th>UUID (ETA)</th>
                                    <th>Client</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>INV-001</td>
                                    <td><small>e123-4567-890a-bcde</small></td>
                                    <td>Client A</td>
                                    <td>2024-05-15</td>
                                    <td>$228.00</td>
                                    <td><span class="badge badge-success">Valid</span></td>
                                </tr>
                                <tr>
                                    <td>INV-002</td>
                                    <td>-</td>
                                    <td>Client B</td>
                                    <td>2024-05-16</td>
                                    <td>$500.00</td>
                                    <td><span class="badge badge-warning">Submitted</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="tab-content" id="einv-tax-tab">
                <div class="card">
                    <div class="card-header">
                        <h3>VAT Summary Report</h3>
                        <select class="form-input" style="width:200px;"><option>Q2 2024</option></select>
                    </div>
                    <div class="card-body">
                         <div class="stats-grid mb-4">
                            <div class="stat-card"><h4>Output VAT (Sales)</h4><h2>$14,000</h2></div>
                            <div class="stat-card"><h4>Input VAT (Purchases)</h4><h2>$9,500</h2></div>
                            <div class="stat-card" style="border-left: 4px solid blue;"><h4>Net VAT Payable</h4><h2>$4,500</h2></div>
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
    };

    // =========================================================================
    // Print Templates (screen-id: 'print-templates')
    // =========================================================================
    Pages.printTemplates = function(container) {
        if (!PermissionGuard.canView('print-templates')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>Print Templates Editor</h2>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>Template Designer</h3>
                    <select class="form-input" style="width:250px;">
                        <option>Invoice Template</option>
                        <option>Sales Order (Bilingual)</option>
                        <option>Delivery Note</option>
                        <option>Payment Voucher</option>
                    </select>
                </div>
                <div class="card-body" style="display:flex; gap:20px;">
                    <div style="flex:1;">
                        <h4>Settings</h4>
                        <div class="form-field mt-3">
                            <label>Company Name</label>
                            <input type="text" class="form-input" value="Ninja Factory ERP">
                        </div>
                        <div class="form-field mt-3">
                            <label>Logo URL</label>
                            <input type="text" class="form-input" value="/assets/logo.png">
                        </div>
                        <div class="form-field mt-3">
                            <label>Language</label>
                            <select class="form-input"><option>Arabic</option><option>English</option><option>Bilingual</option></select>
                        </div>
                        <div class="form-row mt-3">
                            <label><input type="checkbox" checked> Show QR Code</label>
                            <label><input type="checkbox" checked> Show Barcode</label>
                        </div>
                        <button class="btn btn-success mt-4">Save Template</button>
                    </div>
                    
                    <div style="flex:2; border: 1px solid #ccc; padding: 20px; background: #fff; color: #000;">
                        <!-- Print Preview Area -->
                        <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #333; padding-bottom: 10px;">
                            <div>
                                <h2>INVOICE</h2>
                                <p>Ninja Factory ERP</p>
                            </div>
                            <div style="text-align:right;">
                                <div style="width:80px; height:80px; background:#ddd; display:inline-block; margin-bottom:5px;">QR</div>
                                <p>INV-2024-001</p>
                                <p>Date: 2024-05-15</p>
                            </div>
                        </div>
                        <div class="mt-4">
                            <table style="width:100%; border-collapse:collapse; text-align:left;">
                                <tr style="background:#f4f4f4; border-bottom:1px solid #ccc;">
                                    <th style="padding:8px;">Item</th>
                                    <th style="padding:8px;">Qty</th>
                                    <th style="padding:8px;">Price</th>
                                    <th style="padding:8px;">Total</th>
                                </tr>
                                <tr>
                                    <td style="padding:8px; border-bottom:1px solid #eee;">Sample Item</td>
                                    <td style="padding:8px; border-bottom:1px solid #eee;">1</td>
                                    <td style="padding:8px; border-bottom:1px solid #eee;">$100.00</td>
                                    <td style="padding:8px; border-bottom:1px solid #eee;">$100.00</td>
                                </tr>
                            </table>
                        </div>
                        <div class="mt-4" style="text-align:right;">
                            <h3>Total: $100.00</h3>
                        </div>
                        <button class="btn btn-primary mt-4" onclick="window.print()">Print Document</button>
                    </div>
                </div>
            </div>
        `;
    };

    // =========================================================================
    // Demand Forecasting (screen-id: 'demand-forecasting')
    // =========================================================================
    Pages.demandForecasting = function(container) {
        if (!PermissionGuard.canView('demand-forecasting')) {
            container.innerHTML = `<div class="error-msg">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied'}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>Demand Forecasting</h2>
            </div>
            
            <div class="card mb-4">
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-field">
                            <label>Product</label>
                            <select class="form-input"><option>Raw Material A</option><option>Finished Good B</option></select>
                        </div>
                        <div class="form-field">
                            <label>Forecast Method</label>
                            <select class="form-input" id="forecast-method">
                                <option value="sma">Simple Moving Average (3M)</option>
                                <option value="exp">Exponential Smoothing</option>
                                <option value="linear">Linear Trend</option>
                            </select>
                        </div>
                        <div class="form-field" style="display:flex; align-items:flex-end;">
                            <button class="btn btn-primary" id="btn-generate-forecast">Generate Forecast</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>Forecast Chart</h3>
                </div>
                <div class="card-body">
                    <div style="height: 400px; display: flex; justify-content: center;">
                        <canvas id="forecastChart"></canvas>
                    </div>
                    <div class="mt-4 text-center">
                        <button class="btn btn-success">Save to Demand Forecasts</button>
                        <button class="btn btn-warning">Link to MRP</button>
                    </div>
                </div>
            </div>
        `;

        let forecastChart = null;

        container.querySelector('#btn-generate-forecast').addEventListener('click', () => {
            const method = container.querySelector('#forecast-method').value;
            generateForecast(method);
        });

        function generateForecast(method) {
            if(!window.Chart) {
                showToast('Chart.js not loaded', 'error');
                return;
            }

            // Dummy historical data (12 months)
            const historical = [120, 130, 125, 140, 135, 150, 145, 160, 155, 170, 165, 180];
            const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan (F)', 'Feb (F)', 'Mar (F)'];
            let forecast = new Array(12).fill(null);
            
            if(method === 'sma') {
                // SMA 3 months
                const last3Avg = (historical[9] + historical[10] + historical[11]) / 3;
                forecast.push(last3Avg, last3Avg, last3Avg);
            } else if (method === 'linear') {
                // Simple naive linear trend
                const diff = historical[11] - historical[10];
                forecast.push(historical[11] + diff, historical[11] + diff*2, historical[11] + diff*3);
            } else {
                forecast.push(185, 190, 195);
            }

            const ctx = container.querySelector('#forecastChart').getContext('2d');
            
            if(forecastChart) {
                forecastChart.destroy();
            }

            forecastChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Historical Data',
                            data: historical.concat([null, null, null]),
                            borderColor: '#007bff',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.1
                        },
                        {
                            label: 'Forecast',
                            data: forecast,
                            borderColor: '#28a745',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        // Init with default
        generateForecast('sma');
    };

})();
