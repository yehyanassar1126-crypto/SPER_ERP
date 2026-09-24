(function() {
    'use strict';

    // ==========================================
    // 4. Contract Management
    // ==========================================
    Pages.contractManagement = function(container) {
        if (!PermissionGuard.canView('contract-management')) {
            container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('contract_management') : 'Contract Management'}</h2>
                <button class="btn btn-primary" onclick="window.createContract()">
                    <i class="fas fa-plus"></i> ${typeof I18nEngine !== 'undefined' ? I18nEngine.t('create_contract') : 'Create Contract'}
                </button>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-title">Active Contracts</div>
                    <div class="stat-value">24</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Total Value</div>
                    <div class="stat-value">$1.2M</div>
                </div>
                <div class="stat-card" style="border-left: 4px solid red;">
                    <div class="stat-title">Expiring < 30 Days</div>
                    <div class="stat-value" style="color: red;">3</div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>Contracts List</h3>
                </div>
                <div class="card-body">
                    <table class="table data-table">
                        <thead>
                            <tr>
                                <th>Number</th>
                                <th>Type</th>
                                <th>Entity</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>CTR-2023-001</td>
                                <td>Sales</td>
                                <td>Acme Corp</td>
                                <td>2024-12-31</td>
                                <td><span class="badge badge-success">Active</span></td>
                                <td><button class="btn btn-sm btn-secondary">View</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        window.createContract = function() {
            const body = `
                <div class="form-row">
                    <div class="form-field">
                        <label>Contract Number</label>
                        <input type="text" class="form-input">
                    </div>
                    <div class="form-field">
                        <label>Type</label>
                        <select class="form-input">
                            <option>Sales</option>
                            <option>Purchase</option>
                            <option>Service</option>
                        </select>
                    </div>
                </div>
            `;
            const footer = `<button class="btn btn-primary">Save Contract</button>`;
            App.showModal('Create Contract', body, footer, true);
        };
    };

    // ==========================================
    // 5. Production Kanban
    // ==========================================
    Pages.productionKanban = function(container) {
        if (!PermissionGuard.canView('production-kanban')) {
            container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('production_kanban') : 'Production Kanban'}</h2>
            </div>
            
            <div style="display: flex; gap: 15px; overflow-x: auto; padding-bottom: 20px; height: calc(100vh - 200px);">
                <!-- Column 1 -->
                <div style="flex: 0 0 300px; background: var(--bg-color-alt); border-radius: 8px; display: flex; flex-direction: column;">
                    <div style="padding: 10px; font-weight: bold; border-bottom: 2px solid #ccc; display: flex; justify-content: space-between;">
                        Planned <span class="badge">3</span>
                    </div>
                    <div style="padding: 10px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                        <div class="card" style="margin: 0; border-left: 4px solid #3498db;">
                            <div style="padding: 10px;">
                                <div style="font-weight: bold;">PO-1001</div>
                                <div style="font-size: 0.9em; color: var(--text-muted);">Widget A</div>
                                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                                    <span class="badge">Qty: 500</span>
                                    <button class="btn btn-sm btn-secondary">→</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Column 2 -->
                <div style="flex: 0 0 300px; background: var(--bg-color-alt); border-radius: 8px; display: flex; flex-direction: column;">
                    <div style="padding: 10px; font-weight: bold; border-bottom: 2px solid #f39c12; display: flex; justify-content: space-between;">
                        In Progress <span class="badge">1</span>
                    </div>
                    <div style="padding: 10px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                         <div class="card" style="margin: 0; border-left: 4px solid #e74c3c;">
                            <div style="padding: 10px;">
                                <div style="font-weight: bold; display: flex; justify-content: space-between;">
                                    PO-1002 <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                                </div>
                                <div style="font-size: 0.9em; color: var(--text-muted);">Widget B</div>
                                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                                    <button class="btn btn-sm btn-secondary">←</button>
                                    <span class="badge">Line 1</span>
                                    <button class="btn btn-sm btn-secondary">→</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Column 3 -->
                <div style="flex: 0 0 300px; background: var(--bg-color-alt); border-radius: 8px; display: flex; flex-direction: column;">
                    <div style="padding: 10px; font-weight: bold; border-bottom: 2px solid #2ecc71; display: flex; justify-content: space-between;">
                        Completed <span class="badge">5</span>
                    </div>
                    <div style="padding: 10px; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                         <!-- Cards here -->
                    </div>
                </div>
            </div>
        `;
    };

    // ==========================================
    // 6. Balanced Scorecard
    // ==========================================
    Pages.balancedScorecard = function(container) {
        if (!PermissionGuard.canView('balanced-scorecard')) {
            container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('balanced_scorecard') : 'Balanced Scorecard'}</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Financial -->
                <div class="card">
                    <div class="card-header" style="background: rgba(46, 204, 113, 0.1); border-left: 4px solid #2ecc71;">
                        <h3><i class="fas fa-dollar-sign"></i> Financial</h3>
                    </div>
                    <div class="card-body">
                        <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="stat-card">
                                <div class="stat-title">Revenue Growth</div>
                                <div class="stat-value text-success">+15% <i class="fas fa-arrow-up text-sm"></i></div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Profit Margin</div>
                                <div class="stat-value">22%</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Customer -->
                <div class="card">
                    <div class="card-header" style="background: rgba(52, 152, 219, 0.1); border-left: 4px solid #3498db;">
                        <h3><i class="fas fa-users"></i> Customer</h3>
                    </div>
                    <div class="card-body">
                         <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="stat-card">
                                <div class="stat-title">Satisfaction</div>
                                <div class="stat-value text-success">94%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">On-Time Delivery</div>
                                <div class="stat-value text-warning">88% <i class="fas fa-arrow-down text-sm"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Internal Process -->
                <div class="card">
                    <div class="card-header" style="background: rgba(155, 89, 182, 0.1); border-left: 4px solid #9b59b6;">
                        <h3><i class="fas fa-cogs"></i> Internal Process</h3>
                    </div>
                    <div class="card-body">
                         <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="stat-card">
                                <div class="stat-title">OEE</div>
                                <div class="stat-value text-success">85%</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Defect Rate</div>
                                <div class="stat-value text-success">1.2% <i class="fas fa-arrow-down text-sm"></i></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Learning & Growth -->
                <div class="card">
                    <div class="card-header" style="background: rgba(241, 196, 15, 0.1); border-left: 4px solid #f1c40f;">
                        <h3><i class="fas fa-graduation-cap"></i> Learning & Growth</h3>
                    </div>
                    <div class="card-body">
                         <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                            <div class="stat-card">
                                <div class="stat-title">Training Hours</div>
                                <div class="stat-value">120h</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-title">Skill Coverage</div>
                                <div class="stat-value">75%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

})();
