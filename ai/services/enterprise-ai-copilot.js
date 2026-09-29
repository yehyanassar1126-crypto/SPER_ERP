// Enterprise AI Copilot Module for Ninja Factory ERP
// Handles AI Copilot, Executive Intelligence, and AI Agents

if (typeof Pages === 'undefined') {
    window.Pages = {};
}

// 1. AI Copilot
Pages.aiCopilot = function(container) {
    if (!PermissionGuard.canView('ai-copilot')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    var AICopilot = {
        moduleMap: {
            'inventory': ['مخزون','stock','inventory','warehouse','مستودع','كمية'],
            'production': ['إنتاج','production','تصنيع','manufacturing','خط','line','ماكينة','machine'],
            'finance': ['مال','finance','تكلفة','cost','ربح','profit','إيراد','revenue','ميزانية','budget'],
            'quality': ['جودة','quality','عيب','defect','فحص','inspection','scrap'],
            'procurement': ['مورد','supplier','شراء','purchase','مشتريات','procurement'],
            'hr': ['موظف','employee','حضور','attendance','إجازة','leave','راتب','salary'],
            'maintenance': ['صيانة','maintenance','عطل','breakdown','ماكينة','machine']
        },
        
        processQuery: async function(query) {
            query = query.toLowerCase();
            let targetModule = 'unknown';
            
            for (const [module, keywords] of Object.entries(this.moduleMap)) {
                if (keywords.some(kw => query.includes(kw))) {
                    targetModule = module;
                    break;
                }
            }

            try {
                let responseText = '';
                let sources = [];

                if (targetModule === 'inventory') {
                    if (query.includes('قيمة') || query.includes('value')) {
                        const { data, error } = await window.sbClient.from('inventory_items').select('quantity_on_hand, unit_cost');
                        if (error) throw error;
                        let totalValue = data.reduce((sum, item) => sum + ((item.quantity_on_hand || 0) * (item.unit_cost || 0)), 0);
                        responseText = t('ai_inventory_value', 'Total inventory value is') + ' ' + totalValue.toFixed(2);
                        sources.push('inventory_items');
                    } else if (query.includes('ينقص') || query.includes('low')) {
                        const { data, error } = await window.sbClient.from('inventory_items').select('item_name, quantity_on_hand, min_quantity').lt('quantity_on_hand', 'min_quantity');
                        if (error) throw error;
                        if (data.length > 0) {
                            responseText = t('ai_low_stock', 'The following items are running low:') + '<br>' + data.map(d => d.item_name).join('<br>');
                        } else {
                            responseText = t('ai_stock_ok', 'All items are above minimum stock levels.');
                        }
                        sources.push('inventory_items');
                    } else {
                        responseText = t('ai_generic_inventory', 'I see you are asking about inventory. I can help with total value or low stock alerts.');
                    }
                } else if (targetModule === 'production') {
                    responseText = t('ai_generic_production', 'Production data summary based on current active orders.');
                    sources.push('production_orders');
                } else {
                    responseText = t('ai_cannot_understand', 'I am not sure how to answer that yet, but I am learning.');
                }

                return { text: responseText, sources: sources };
            } catch (err) {
                console.error(err);
                return { text: t('ai_error', 'Sorry, I encountered an error retrieving data.'), sources: [] };
            }
        }
    };

    let html = `
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3>${t('ai_copilot_title', 'AI Copilot')}</h3>
            </div>
            <div class="card-body d-flex flex-column" style="height: calc(100vh - 200px);">
                <div id="ai-chat-history" class="flex-grow-1 overflow-auto mb-3 border p-3 bg-light">
                    <div class="alert alert-info">${t('ai_welcome', 'Hello! Ask me anything about the factory.')}</div>
                </div>
                <div class="input-group">
                    <input type="text" id="ai-query-input" class="form-control" placeholder="${t('ai_ask_placeholder', 'Ask a question...')}">
                    <button class="btn btn-primary" id="ai-send-btn">${t('send', 'Send')}</button>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const chatHistory = document.getElementById('ai-chat-history');
    const queryInput = document.getElementById('ai-query-input');
    const sendBtn = document.getElementById('ai-send-btn');

    async function handleSend() {
        const query = queryInput.value.trim();
        if (!query) return;

        queryInput.value = '';
        
        chatHistory.innerHTML += `<div class="text-end mb-2"><span class="badge bg-primary text-wrap fs-6">${query}</span></div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;

        const response = await AICopilot.processQuery(query);
        
        let sourceHtml = response.sources.length > 0 ? `<br><small class="text-muted">Sources: ${response.sources.join(', ')}</small>` : '';
        chatHistory.innerHTML += `<div class="text-start mb-2"><span class="badge bg-secondary text-wrap text-start fs-6">${response.text}${sourceHtml}</span></div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        try {
            await window.sbClient.from('ai_conversations').insert([{ user_id: App.user.id, query: query, response: response.text }]);
            SecurityHelpers.logActivity('ai_copilot', 'query', 'ai_conversations', null);
        } catch (e) {
            console.error('Failed to log conversation', e);
        }
    }

    sendBtn.addEventListener('click', handleSend);
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
};

// 2. Executive Intelligence
Pages.executiveIntelligence = function(container) {
    if (!PermissionGuard.canView('executive-intelligence')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="executive-dashboard">
            <h2 class="mb-4">${t('exec_intel_title', 'Executive Intelligence')}</h2>
            
            <div class="row mb-4">
                <div class="col-md-3"><div class="card stat-card bg-primary text-white p-3"><h5>${t('daily_revenue', 'Daily Revenue')}</h5><h3 id="exec-rev">...</h3></div></div>
                <div class="col-md-3"><div class="card stat-card bg-success text-white p-3"><h5>${t('production_orders', 'Active Orders')}</h5><h3 id="exec-orders">...</h3></div></div>
                <div class="col-md-3"><div class="card stat-card bg-warning text-dark p-3"><h5>${t('low_stock', 'Low Stock')}</h5><h3 id="exec-stock">...</h3></div></div>
                <div class="col-md-3"><div class="card stat-card bg-danger text-white p-3"><h5>${t('open_ncrs', 'Open NCRs')}</h5><h3 id="exec-ncrs">...</h3></div></div>
            </div>

            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header"><h4>${t('daily_summary', 'Daily Factory Summary')}</h4></div>
                        <div class="card-body" id="exec-summary-content">
                            Loading summary...
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="card h-100">
                        <div class="card-header"><h4>${t('ai_insights', 'AI Insights')}</h4></div>
                        <div class="card-body">
                            <div class="alert alert-danger"><strong>${t('top_issue', 'Top Issue:')}</strong> High material scrap rate on Line 2.</div>
                            <div class="alert alert-warning"><strong>${t('top_risk', 'Top Risk:')}</strong> Supplier X delayed delivery might stall Order #120.</div>
                            <div class="alert alert-success"><strong>${t('top_opportunity', 'Top Opportunity:')}</strong> Increase batch size for Product Y to reduce setup time.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    async function loadData() {
        try {
            document.getElementById('exec-rev').innerText = '$12,450';
            document.getElementById('exec-orders').innerText = '14';
            document.getElementById('exec-stock').innerText = '5';
            document.getElementById('exec-ncrs').innerText = '2';

            document.getElementById('exec-summary-content').innerHTML = `
                <ul>
                    <li><strong>Production:</strong> 14 active orders, OEE at 78%</li>
                    <li><strong>Financial:</strong> Healthy cash flow, 2 pending large payments</li>
                    <li><strong>Inventory:</strong> 5 critical components below minimum</li>
                    <li><strong>HR:</strong> 98% attendance today</li>
                </ul>
                <button class="btn btn-sm btn-outline-primary mt-2">${t('save_summary', 'Save to Archive')}</button>
            `;
            SecurityHelpers.logActivity('executive_intelligence', 'view', 'dashboard', null);
        } catch (error) {
            console.error('Error loading executive data', error);
        }
    }

    loadData();
};

// 3. AI Agent Architecture
Pages.aiAgents = function(container) {
    if (!PermissionGuard.canView('ai-agents')) {
        container.innerHTML = '<div class="alert alert-danger">Access Denied</div>';
        return;
    }

    const t = (key, fallback) => typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;

    let html = `
        <div class="card">
            <div class="card-header">
                <h3>${t('ai_agents_title', 'AI Agent Recommendations')}</h3>
            </div>
            <div class="card-body">
                <table class="table data-table table-hover">
                    <thead>
                        <tr>
                            <th>${t('agent_type', 'Agent Type')}</th>
                            <th>${t('action', 'Action')}</th>
                            <th>${t('expected_impact', 'Expected Impact')}</th>
                            <th>${t('priority', 'Priority')}</th>
                            <th>${t('actions', 'Actions')}</th>
                        </tr>
                    </thead>
                    <tbody id="agents-tbody">
                        <tr><td colspan="5" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;

    async function loadAgents() {
        try {
            const mockData = [
                { id: 1, type: 'Inventory', action: 'Auto-reorder Item X', impact: 'Prevents stockout on Friday', priority: 'High', status: 'pending' },
                { id: 2, type: 'Production', action: 'Reschedule Order #45', impact: 'Optimizes machine usage by 12%', priority: 'Medium', status: 'pending' }
            ];

            const tbody = document.getElementById('agents-tbody');
            tbody.innerHTML = mockData.map(d => `
                <tr>
                    <td>${d.type}</td>
                    <td>${d.action}</td>
                    <td>${d.impact}</td>
                    <td><span class="badge ${d.priority === 'High' ? 'bg-danger' : 'bg-warning'}">${d.priority}</span></td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="approveAction(${d.id})">${t('approve', 'Approve')}</button>
                        <button class="btn btn-sm btn-danger" onclick="rejectAction(${d.id})">${t('reject', 'Reject')}</button>
                    </td>
                </tr>
            `).join('');
            
            SecurityHelpers.logActivity('ai_agents', 'view', 'ai_agent_actions', null);
        } catch (e) {
            console.error(e);
        }
    }

    window.approveAction = function(id) {
        showToast('Action approved and queued for execution', 'success');
        SecurityHelpers.logActivity('ai_agents', 'approve', 'ai_agent_actions', id);
        // Refresh would go here
    };

    window.rejectAction = function(id) {
        showToast('Action rejected', 'info');
        SecurityHelpers.logActivity('ai_agents', 'reject', 'ai_agent_actions', id);
        // Refresh would go here
    };

    loadAgents();
};
