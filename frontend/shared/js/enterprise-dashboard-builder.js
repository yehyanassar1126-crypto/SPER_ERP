(function() {
    'use strict';

    // ==========================================
    // 1. Dashboard Builder
    // ==========================================
    Pages.dashboardBuilder = function(container) {
        if (!PermissionGuard.canView('dashboard-builder')) {
            container.innerHTML = '<div class="alert alert-danger">' + (typeof I18nEngine !== 'undefined' ? I18nEngine.t('access_denied') : 'Access Denied') + '</div>';
            return;
        }

        SecurityHelpers.logActivity('dashboard_builder', 'view', 'page', null);

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('dashboard_builder') : 'Dashboard Builder'}</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" id="btn-create-dashboard">
                        <i class="fas fa-plus"></i> ${typeof I18nEngine !== 'undefined' ? I18nEngine.t('create_dashboard') : 'Create Dashboard'}
                    </button>
                    <button class="btn btn-secondary" id="btn-my-dashboards">
                        <i class="fas fa-list"></i> ${typeof I18nEngine !== 'undefined' ? I18nEngine.t('my_dashboards') : 'My Dashboards'}
                    </button>
                </div>
            </div>
            
            <div id="dashboard-view-area" class="dashboard-grid" style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 15px; margin-top: 20px;">
                <!-- Widgets will be rendered here -->
            </div>
            
            <div id="dashboard-list-area" style="display: none; margin-top: 20px;">
                <div class="card">
                    <div class="card-header">
                        <h3>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('saved_dashboards') : 'Saved Dashboards'}</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table data-table" id="dashboards-table">
                                <thead>
                                    <tr>
                                        <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('name') : 'Name'}</th>
                                        <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('is_default') : 'Is Default'}</th>
                                        <th>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('actions') : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        let currentDashboardId = null;
        let isEditMode = false;

        document.getElementById('btn-create-dashboard').addEventListener('click', showCreateDashboardModal);
        document.getElementById('btn-my-dashboards').addEventListener('click', toggleView);

        function toggleView() {
            const listArea = document.getElementById('dashboard-list-area');
            const viewArea = document.getElementById('dashboard-view-area');
            if (listArea.style.display === 'none') {
                listArea.style.display = 'block';
                viewArea.style.display = 'none';
                loadDashboardsList();
            } else {
                listArea.style.display = 'none';
                viewArea.style.display = 'grid';
            }
        }

        async function loadDashboardsList() {
            try {
                const { data, error } = await window.sbClient
                    .from('custom_dashboards')
                    .select('*')
                    .eq('created_by', App.user.id);
                
                if (error && error.code !== '42P01') throw error;
                
                const tbody = document.querySelector('#dashboards-table tbody');
                tbody.innerHTML = '';
                
                if (data && data.length > 0) {
                    data.forEach(dash => {
                        tbody.innerHTML += `
                            <tr>
                                <td>${dash.name}</td>
                                <td>${dash.is_default ? 'Yes' : 'No'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="window.viewDashboard('${dash.id}')">View</button>
                                    <button class="btn btn-sm btn-secondary" onclick="window.editDashboard('${dash.id}')">Edit</button>
                                    <button class="btn btn-sm btn-danger" onclick="window.deleteDashboard('${dash.id}')">Delete</button>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    tbody.innerHTML = `<tr><td colspan="3">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('no_records_found') : 'No records found'}</td></tr>`;
                }
            } catch (err) {
                console.error(err);
            }
        }

        function showCreateDashboardModal() {
            const body = `
                <div class="form-row">
                    <div class="form-field">
                        <label>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('dashboard_name') : 'Dashboard Name'}</label>
                        <input type="text" id="dash-name" class="form-input" required>
                    </div>
                </div>
            `;
            const footer = `<button class="btn btn-primary" id="save-new-dashboard">${typeof I18nEngine !== 'undefined' ? I18nEngine.t('save') : 'Save'}</button>`;
            
            App.showModal(typeof I18nEngine !== 'undefined' ? I18nEngine.t('create_dashboard') : 'Create Dashboard', body, footer);
            
            document.getElementById('save-new-dashboard').addEventListener('click', async () => {
                const name = document.getElementById('dash-name').value;
                if (!name) return;
                
                try {
                    // Just simulation, logic to insert into DB
                    App.showModal(false);
                    showToast('Dashboard created', 'success');
                    // Setup edit mode
                    isEditMode = true;
                    document.getElementById('dashboard-view-area').innerHTML = `
                        <div style="grid-column: span 12; padding: 20px; text-align: center; border: 2px dashed #ccc;">
                            <button class="btn btn-primary" onclick="window.addWidget()">+ Add Widget</button>
                        </div>
                    `;
                } catch (err) {
                    showToast(err.message, 'error');
                }
            });
        }
        
        window.addWidget = function() {
            const body = `
                <div class="form-row">
                    <div class="form-field">
                        <label>Widget Type</label>
                        <select id="widget-type" class="form-input">
                            <option value="stat">Stat Card</option>
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="gauge">Gauge</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>Data Source</label>
                        <select id="widget-source" class="form-input">
                            <option value="sales_orders">Sales Orders</option>
                            <option value="production_orders">Production Orders</option>
                            <option value="attendance">Attendance</option>
                        </select>
                    </div>
                </div>
            `;
            const footer = `<button class="btn btn-primary" onclick="window.saveWidget()">Add</button>`;
            App.showModal('Add Widget', body, footer);
        };

        window.saveWidget = function() {
            App.showModal(false);
            showToast('Widget added', 'success');
            // Render mock widget
            const grid = document.getElementById('dashboard-view-area');
            const widgetHtml = `
                <div class="card" style="grid-column: span 4;">
                    <div class="card-header">
                        <h3>Mock Widget</h3>
                    </div>
                    <div class="card-body" style="height: 200px; display: flex; align-items: center; justify-content: center;">
                        <h2>123</h2>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', widgetHtml);
        };
    };

    // ==========================================
    // 2. Report Builder
    // ==========================================
    Pages.reportBuilder = function(container) {
        if (!PermissionGuard.canView('report-builder')) {
            container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${typeof I18nEngine !== 'undefined' ? I18nEngine.t('report_builder') : 'Report Builder'}</h2>
                <button class="btn btn-primary" id="btn-new-report">New Report</button>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <div class="card-body">
                    <div class="form-row">
                        <div class="form-field">
                            <label>Data Source</label>
                            <select id="report-source" class="form-input">
                                <option value="production_orders">Production Orders</option>
                                <option value="sales_orders">Sales Orders</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Columns</label>
                            <div>
                                <label><input type="checkbox" value="id"> ID</label>
                                <label><input type="checkbox" value="status"> Status</label>
                                <label><input type="checkbox" value="created_at"> Date</label>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-success" id="btn-preview">Preview Report</button>
                </div>
            </div>
            
            <div id="report-preview" style="margin-top: 20px; display: none;">
                <div class="card">
                    <div class="card-header"><h3>Preview</h3></div>
                    <div class="card-body">
                        <table class="table data-table">
                            <thead><tr><th>ID</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody><tr><td>1</td><td>Completed</td><td>2023-10-01</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-preview').addEventListener('click', () => {
            document.getElementById('report-preview').style.display = 'block';
        });
    };

    // ==========================================
    // 3. Shop Floor Display
    // ==========================================
    Pages.shopFloor = function(container) {
        if (!PermissionGuard.canView('shop-floor')) {
            container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
            return;
        }

        container.innerHTML = `
            <div style="background-color: #111; color: #fff; padding: 20px; min-height: 100vh;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h1 style="font-size: 3rem; margin: 0; color: #00ff00;">LINE 1 STATUS</h1>
                    <div style="font-size: 2rem;" id="shop-clock">12:00:00</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Prod Order Info -->
                    <div style="background: #222; padding: 20px; border-radius: 10px; border-left: 10px solid #00ff00;">
                        <h2 style="font-size: 2rem; color: #aaa;">Current Product</h2>
                        <div style="font-size: 4rem; font-weight: bold;">Widget A-X</div>
                        <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                            <div>
                                <div style="font-size: 1.5rem; color: #aaa;">Target</div>
                                <div style="font-size: 3rem;">5000</div>
                            </div>
                            <div>
                                <div style="font-size: 1.5rem; color: #aaa;">Actual</div>
                                <div style="font-size: 3rem; color: #00ff00;">2341</div>
                            </div>
                        </div>
                        <div style="width: 100%; height: 40px; background: #333; margin-top: 20px; border-radius: 20px; overflow: hidden;">
                            <div style="width: 46%; height: 100%; background: #00ff00;"></div>
                        </div>
                    </div>
                    
                    <!-- Andon Board -->
                    <div style="background: #222; padding: 20px; border-radius: 10px; text-align: center;">
                        <h2 style="font-size: 2rem; color: #aaa;">System Status</h2>
                        <div style="width: 200px; height: 200px; border-radius: 50%; background: #00ff00; margin: 20px auto; box-shadow: 0 0 50px #00ff00;"></div>
                        <div style="font-size: 3rem; font-weight: bold; color: #00ff00;">RUNNING NORMAL</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px;">
                    <div style="background: #222; padding: 20px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; color: #aaa;">OEE</div>
                        <div style="font-size: 4rem; color: #ffff00;">85%</div>
                    </div>
                    <div style="background: #222; padding: 20px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; color: #aaa;">Quality Rate</div>
                        <div style="font-size: 4rem; color: #00ff00;">99.2%</div>
                    </div>
                    <div style="background: #222; padding: 20px; border-radius: 10px; text-align: center;">
                        <div style="font-size: 1.5rem; color: #aaa;">Scrap Count</div>
                        <div style="font-size: 4rem; color: #ff0000;">14</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; display: flex; gap: 10px;">
                    <button style="flex: 1; padding: 20px; font-size: 1.5rem; background: #cc0000; color: white; border: none; border-radius: 10px;">RAISE ANDON ALARM</button>
                    <button style="flex: 1; padding: 20px; font-size: 1.5rem; background: #ffaa00; color: black; border: none; border-radius: 10px;">REPORT MATERIAL SHORTAGE</button>
                </div>
            </div>
        `;

        setInterval(() => {
            const clock = document.getElementById('shop-clock');
            if (clock) clock.innerText = new Date().toLocaleTimeString();
        }, 1000);
    };

})();
