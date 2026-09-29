// Enterprise Advanced Modules for Ninja Factory ERP

if (typeof Pages === 'undefined') {
    window.Pages = {};
}

// 1. Advanced Finance
Pages.advancedFinance = function(container) {
    if (!PermissionGuard.canView('advanced-finance')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card mb-4">
            <div class="card-header"><h3>${t('adv_finance_title', 'Advanced Finance Dashboard')}</h3></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">${t('ar_aging', 'AR Aging Report')}</div>
                            <div class="card-body">
                                <canvas id="arAgingChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header">${t('ap_aging', 'AP Aging Report')}</div>
                            <div class="card-body">
                                <canvas id="apAgingChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Load Charts
    setTimeout(() => {
        if (typeof Chart !== 'undefined') {
            new Chart(document.getElementById('arAgingChart'), {
                type: 'bar',
                data: {
                    labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
                    datasets: [{ label: 'Accounts Receivable', data: [5000, 2000, 1500, 500, 200], backgroundColor: '#36a2eb' }]
                }
            });

            new Chart(document.getElementById('apAgingChart'), {
                type: 'bar',
                data: {
                    labels: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
                    datasets: [{ label: 'Accounts Payable', data: [4000, 1500, 1000, 300, 100], backgroundColor: '#ff6384' }]
                }
            });
        }
    }, 100);
    
    SecurityHelpers.logActivity('advanced_finance', 'view', 'dashboard', null);
};

// 2. Advanced HR
Pages.advancedHR = function(container) {
    if (!PermissionGuard.canView('advanced-hr')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card mb-4">
            <div class="card-header"><h3>${t('adv_hr_title', 'Advanced HR - Skills Matrix')}</h3></div>
            <div class="card-body">
                <table class="table data-table table-bordered">
                    <thead>
                        <tr>
                            <th>${t('employee', 'Employee')}</th>
                            <th>${t('machining', 'Machining')}</th>
                            <th>${t('assembly', 'Assembly')}</th>
                            <th>${t('qc', 'Quality Control')}</th>
                            <th>${t('safety', 'Safety Protocol')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Ahmed</td><td class="bg-success text-white text-center">5</td><td class="bg-warning text-dark text-center">3</td><td class="bg-light text-center">1</td><td class="bg-success text-white text-center">5</td></tr>
                        <tr><td>Sara</td><td class="bg-light text-center">1</td><td class="bg-success text-white text-center">5</td><td class="bg-success text-white text-center">4</td><td class="bg-warning text-dark text-center">3</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
    SecurityHelpers.logActivity('advanced_hr', 'view', 'dashboard', null);
};

// 3. Workflow Engine
Pages.workflowEngine = function(container) {
    if (!PermissionGuard.canView('workflow-engine')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>${t('workflow_engine', 'Workflow Engine')}</h3>
                <button class="btn btn-primary" onclick="showToast('Create workflow modal opening...', 'info')">${t('new_workflow', 'New Workflow')}</button>
            </div>
            <div class="card-body">
                <table class="table data-table">
                    <thead>
                        <tr>
                            <th>${t('name', 'Name')}</th>
                            <th>${t('module', 'Module')}</th>
                            <th>${t('trigger', 'Trigger')}</th>
                            <th>${t('status', 'Status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>PO Approval</td><td>Procurement</td><td>PO Created > $5000</td><td><span class="badge bg-success">Active</span></td></tr>
                        <tr><td>Leave Request</td><td>HR</td><td>Leave Application</td><td><span class="badge bg-success">Active</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
    SecurityHelpers.logActivity('workflow_engine', 'view', 'workflow_definitions', null);
};

// 4. Sustainability Tracking
Pages.sustainability = function(container) {
    if (!PermissionGuard.canView('sustainability')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card">
            <div class="card-header"><h3>${t('sustainability', 'Sustainability Tracking')}</h3></div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-3">
                        <div class="card p-3 mb-3 bg-light">
                            <h5>Energy Consumption</h5>
                            <h2>450 kWh</h2>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card p-3 mb-3 bg-light">
                            <h5>Waste / Recycled</h5>
                            <h2>120kg / 80kg</h2>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card p-3 mb-3 bg-light">
                            <h5>CO2 Emissions</h5>
                            <h2>2.5 tons</h2>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary mt-3" onclick="showToast('Input form modal opening...', 'info')">${t('log_metrics', 'Log New Metrics')}</button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    SecurityHelpers.logActivity('sustainability', 'view', 'dashboard', null);
};

// 5. Integration Hub
Pages.integrationHub = function(container) {
    if (!PermissionGuard.canView('integration-hub')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>${t('integration_hub', 'Integration Hub')}</h3>
                <button class="btn btn-primary" onclick="showToast('API Key generation...', 'success')">${t('generate_key', 'Generate API Key')}</button>
            </div>
            <div class="card-body">
                <h4>${t('active_keys', 'Active API Keys')}</h4>
                <ul class="list-group mb-4">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Prod-API-Key-1 <button class="btn btn-sm btn-danger">${t('revoke', 'Revoke')}</button>
                    </li>
                </ul>
                
                <h4>${t('recent_webhooks', 'Recent Webhooks')}</h4>
                <table class="table table-sm">
                    <thead><tr><th>Time</th><th>Event</th><th>Endpoint</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>10:45 AM</td><td>order.created</td><td>https://partner.com/hook</td><td><span class="badge bg-success">200 OK</span></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;
    SecurityHelpers.logActivity('integration_hub', 'view', 'dashboard', null);
};
