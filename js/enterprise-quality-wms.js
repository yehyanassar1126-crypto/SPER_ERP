// js/enterprise-quality-wms.js

(function() {
    // Shared translation helper
    function t(key) {
        return typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : key;
    }

    // --- 1. Advanced Quality Screen ---
    Pages.advancedQuality = async function(container) {
        if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('advanced-quality')) {
            container.innerHTML = `<div class="error-state">${t('access_denied')}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${t('advanced_quality')}</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" id="btn-new-ncr"><i class="fas fa-plus"></i> ${t('new_ncr')}</button>
                    <button class="btn btn-primary" id="btn-new-capa"><i class="fas fa-plus"></i> ${t('new_capa')}</button>
                </div>
            </div>
            
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" data-target="ncr-tab">${t('ncr_management')}</button>
                    <button class="tab-btn" data-target="capa-tab">${t('capa_management')}</button>
                    <button class="tab-btn" data-target="q-analytics-tab">${t('quality_analytics')}</button>
                </div>
                
                <div class="tab-content active" id="ncr-tab">
                    <div class="card">
                        <div class="card-header">
                            <h3>${t('ncr_list')}</h3>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="data-table" id="ncr-table">
                                    <thead>
                                        <tr>
                                            <th>${t('ncr_number')}</th>
                                            <th>${t('title')}</th>
                                            <th>${t('severity')}</th>
                                            <th>${t('product')}</th>
                                            <th>${t('status')}</th>
                                            <th>${t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody id="ncr-tbody">
                                        <!-- NCR data will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="capa-tab">
                    <div class="card">
                        <div class="card-header">
                            <h3>${t('capa_list')}</h3>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="data-table" id="capa-table">
                                    <thead>
                                        <tr>
                                            <th>${t('capa_id')}</th>
                                            <th>${t('related_ncr')}</th>
                                            <th>${t('responsible')}</th>
                                            <th>${t('target_date')}</th>
                                            <th>${t('status')}</th>
                                            <th>${t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody id="capa-tbody">
                                        <!-- CAPA data will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="q-analytics-tab">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3 id="stat-defect-rate">0%</h3>
                            <p>${t('avg_defect_rate')}</p>
                        </div>
                        <div class="stat-card">
                            <h3 id="stat-scrap-rate">0%</h3>
                            <p>${t('avg_scrap_rate')}</p>
                        </div>
                    </div>
                    <div class="charts-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                        <div class="card">
                            <div class="card-header"><h3>${t('defect_by_product')}</h3></div>
                            <div class="card-body"><canvas id="defectProductChart"></canvas></div>
                        </div>
                        <div class="card">
                            <div class="card-header"><h3>${t('top_defect_types')}</h3></div>
                            <div class="card-body"><canvas id="topDefectsChart"></canvas></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab logic
        const tabBtns = container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
                
                if(e.target.dataset.target === 'q-analytics-tab') {
                    loadQualityAnalytics();
                }
            });
        });

        document.getElementById('btn-new-ncr').addEventListener('click', () => openNcrModal());
        document.getElementById('btn-new-capa').addEventListener('click', () => openCapaModal());

        loadNcrData();
        loadCapaData();

        async function loadNcrData() {
            try {
                if(!window.sbClient) return;
                const { data, error } = await window.sbClient.from('quality_ncrs').select('*').order('created_at', { ascending: false });
                if (error) {
                    if (error.code === '42P01') {
                        // Table doesn't exist yet, ignore gracefully
                        console.warn('quality_ncrs table does not exist');
                        return;
                    }
                    throw error;
                }
                const tbody = document.getElementById('ncr-tbody');
                tbody.innerHTML = '';
                if(data) {
                    data.forEach(ncr => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${ncr.ncr_number || '-'}</td>
                            <td>${ncr.title || '-'}</td>
                            <td><span class="badge badge-${ncr.severity}">${ncr.severity || '-'}</span></td>
                            <td>${ncr.product_id || '-'}</td>
                            <td><span class="badge badge-${ncr.status}">${ncr.status || '-'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="window.editNcr('${ncr.id}')">${t('edit')}</button>
                                <button class="btn btn-sm btn-warning" onclick="window.openRcaModal('${ncr.id}')">${t('rca')}</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function loadCapaData() {
            try {
                if(!window.sbClient) return;
                const { data, error } = await window.sbClient.from('quality_capas').select('*').order('created_at', { ascending: false });
                if (error && error.code !== '42P01') throw error;
                const tbody = document.getElementById('capa-tbody');
                tbody.innerHTML = '';
                if(data) {
                    data.forEach(capa => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${capa.capa_number || '-'}</td>
                            <td>${capa.ncr_id || '-'}</td>
                            <td>${capa.responsible_id || '-'}</td>
                            <td>${capa.target_date || '-'}</td>
                            <td><span class="badge badge-${capa.status}">${capa.status || '-'}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="window.editCapa('${capa.id}')">${t('edit')}</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }

        async function loadQualityAnalytics() {
            // Mock data for charts since we might not have actual data yet
            if(typeof window.Chart !== 'undefined') {
                const defectCtx = document.getElementById('defectProductChart');
                if(defectCtx && !defectCtx.chart) {
                    defectCtx.chart = new Chart(defectCtx, {
                        type: 'bar',
                        data: {
                            labels: ['Prod A', 'Prod B', 'Prod C'],
                            datasets: [{
                                label: t('defect_rate'),
                                data: [2.5, 1.2, 3.8],
                                backgroundColor: '#4a90e2'
                            }]
                        }
                    });
                }
                const topCtx = document.getElementById('topDefectsChart');
                if(topCtx && !topCtx.chart) {
                    topCtx.chart = new Chart(topCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Scratch', 'Dent', 'Misaligned'],
                            datasets: [{
                                data: [45, 30, 25],
                                backgroundColor: ['#e74c3c', '#f1c40f', '#3498db']
                            }]
                        }
                    });
                }
            }
        }

        function openNcrModal(id = null) {
            const isEdit = !!id;
            const title = isEdit ? t('edit_ncr') : t('new_ncr');
            const bodyHtml = `
                <form id="ncr-form">
                    <div class="form-row">
                        <div class="form-field">
                            <label>${t('title')}</label>
                            <input type="text" class="form-input" id="ncr-title" required>
                        </div>
                        <div class="form-field">
                            <label>${t('severity')}</label>
                            <select class="form-input" id="ncr-severity">
                                <option value="low">${t('low')}</option>
                                <option value="medium">${t('medium')}</option>
                                <option value="high">${t('high')}</option>
                                <option value="critical">${t('critical')}</option>
                            </select>
                        </div>
                    </div>
                    <!-- more fields... -->
                </form>
            `;
            const footerHtml = `<button class="btn btn-primary" id="btn-save-ncr">${t('save')}</button>`;
            
            App.showModal(title, bodyHtml, footerHtml);
            
            document.getElementById('btn-save-ncr').addEventListener('click', async () => {
                if(typeof showToast !== 'undefined') showToast(t('saved_successfully'), 'success');
                if(typeof SecurityHelpers !== 'undefined') SecurityHelpers.logActivity('advanced_quality', 'create_ncr', 'ncr', 'new');
                App.hideModal();
                loadNcrData();
            });
        }
        
        window.editNcr = openNcrModal;

        window.openRcaModal = function(id) {
            const bodyHtml = `
                <div class="rca-container">
                    <h4>5-Why Analysis</h4>
                    <div class="form-field"><label>Why 1?</label><input type="text" class="form-input"></div>
                    <div class="form-field"><label>Why 2?</label><input type="text" class="form-input"></div>
                    <div class="form-field"><label>Why 3?</label><input type="text" class="form-input"></div>
                    <div class="form-field"><label>Why 4?</label><input type="text" class="form-input"></div>
                    <div class="form-field"><label>Why 5 (Root Cause)?</label><input type="text" class="form-input"></div>
                    
                    <h4 style="margin-top:20px;">Fishbone (Ishikawa)</h4>
                    <div class="form-row">
                        <div class="form-field"><label>Man</label><input type="text" class="form-input"></div>
                        <div class="form-field"><label>Machine</label><input type="text" class="form-input"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-field"><label>Material</label><input type="text" class="form-input"></div>
                        <div class="form-field"><label>Method</label><input type="text" class="form-input"></div>
                    </div>
                    <div class="form-row">
                        <div class="form-field"><label>Measurement</label><input type="text" class="form-input"></div>
                        <div class="form-field"><label>Environment</label><input type="text" class="form-input"></div>
                    </div>
                </div>
            `;
            App.showModal('Root Cause Analysis', bodyHtml, `<button class="btn btn-primary" onclick="App.hideModal(); if(typeof showToast !== 'undefined') showToast('${t('saved_successfully')}', 'success');">${t('save')}</button>`, true);
        };

        function openCapaModal(id = null) {
            // Placeholder implementation
            App.showModal(t('new_capa'), '<p>CAPA Form placeholder</p>', '<button class="btn btn-primary" onclick="App.hideModal()">Save</button>');
        }
        window.editCapa = openCapaModal;
    };


    // --- 2. WMS Management Screen ---
    Pages.wmsManagement = async function(container) {
        if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('wms-management')) {
            container.innerHTML = `<div class="error-state">${t('access_denied')}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${t('wms_management')}</h2>
            </div>
            
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" data-target="zones-tab">${t('zones_and_bins')}</button>
                    <button class="tab-btn" data-target="locations-tab">${t('stock_locations')}</button>
                    <button class="tab-btn" data-target="wms-ops-tab">${t('operations')}</button>
                    <button class="tab-btn" data-target="cycle-count-tab">${t('cycle_counting')}</button>
                    <button class="tab-btn" data-target="wms-analytics-tab">${t('analytics')}</button>
                </div>
                
                <div class="tab-content active" id="zones-tab">
                    <button class="btn btn-primary mb-3" id="btn-new-zone"><i class="fas fa-plus"></i> ${t('add_zone')}</button>
                    <div class="card">
                        <div class="card-body">
                            <p>Zones & Bins Configuration</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="locations-tab">
                    <div class="card">
                        <div class="card-body">
                            <p>Stock Locations with FIFO/FEFO tracking</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="wms-ops-tab">
                    <div class="card">
                        <div class="card-body">
                            <p>WMS Operations: Receiving, Putaway, Picking, Packing, Transfer</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="cycle-count-tab">
                    <div class="card">
                        <div class="card-body">
                            <p>Cycle Counting & Variance Analysis</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="wms-analytics-tab">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>95%</h3>
                            <p>${t('stock_accuracy')}</p>
                        </div>
                        <div class="stat-card">
                            <h3>12</h3>
                            <p>${t('dead_stock_items')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const tabBtns = container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
            });
        });

        document.getElementById('btn-new-zone').addEventListener('click', () => {
            App.showModal('New Zone', '<p>Zone Form</p>', '<button class="btn btn-primary" onclick="App.hideModal()">Save</button>');
        });
    };


    // --- 3. Advanced Maintenance Screen ---
    Pages.advancedMaintenance = async function(container) {
        if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('advanced-maintenance')) {
            container.innerHTML = `<div class="error-state">${t('access_denied')}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="page-header">
                <h2>${t('advanced_maintenance')}</h2>
            </div>
            
            <div class="tabs-container">
                <div class="tabs-header">
                    <button class="tab-btn active" data-target="pm-tab">${t('preventive_maintenance')}</button>
                    <button class="tab-btn" data-target="wo-tab">${t('work_orders')}</button>
                    <button class="tab-btn" data-target="metrics-tab">${t('machine_metrics')}</button>
                    <button class="tab-btn" data-target="spare-parts-tab">${t('spare_parts')}</button>
                </div>
                
                <div class="tab-content active" id="pm-tab">
                    <button class="btn btn-primary mb-3" id="btn-new-pm"><i class="fas fa-plus"></i> ${t('schedule_pm')}</button>
                    <div class="card">
                        <div class="card-body">
                            <p>Preventive Maintenance Schedules</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="wo-tab">
                    <button class="btn btn-primary mb-3" id="btn-new-wo"><i class="fas fa-plus"></i> ${t('create_wo')}</button>
                    <div class="card">
                        <div class="card-body">
                            <p>Work Orders Management</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="metrics-tab">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>450h</h3>
                            <p>MTBF</p>
                        </div>
                        <div class="stat-card">
                            <h3>2.5h</h3>
                            <p>MTTR</p>
                        </div>
                    </div>
                </div>

                <div class="tab-content" id="spare-parts-tab">
                    <div class="card">
                        <div class="card-body">
                            <p>Spare Parts Planning & Usage History</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const tabBtns = container.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                container.querySelector('#' + e.target.dataset.target).classList.add('active');
            });
        });
        
        document.getElementById('btn-new-pm').addEventListener('click', () => {
            App.showModal('Schedule PM', '<p>PM Form</p>', '<button class="btn btn-primary" onclick="App.hideModal()">Save</button>');
        });
        document.getElementById('btn-new-wo').addEventListener('click', () => {
            App.showModal('Create Work Order', '<p>WO Form</p>', '<button class="btn btn-primary" onclick="App.hideModal()">Save</button>');
        });
    };

})();
