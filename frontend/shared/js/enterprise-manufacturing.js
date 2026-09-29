(function() {
  'use strict';

  // Helper to translate
  function t(key, fallback) {
    return typeof I18nEngine !== 'undefined' ? I18nEngine.t(key) : fallback;
  }

  // Common UI components and styles
  const styles = `
    <style>
      .manufacturing-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
      .stat-card { background: var(--bg-surface, #2d3748); padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-color, #4299e1); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .stat-title { font-size: 0.9em; color: var(--text-muted, #a0aec0); margin-bottom: 5px; }
      .stat-value { font-size: 1.5em; font-weight: bold; color: var(--text-color, #fff); }
      .form-section { background: var(--bg-surface, #2d3748); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      .form-section h3 { margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid var(--border-color, #4a5568); padding-bottom: 10px; }
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
      .form-group { display: flex; flex-direction: column; }
      .form-group label { margin-bottom: 5px; font-size: 0.9em; color: var(--text-muted, #a0aec0); }
      .form-group input, .form-group select, .form-group textarea { padding: 8px; border: 1px solid var(--border-color, #4a5568); border-radius: 4px; background: var(--bg-input, #1a202c); color: var(--text-color, #fff); }
      
      .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
      .btn-primary { background: var(--primary-color, #3182ce); color: white; }
      .btn-primary:hover { background: #2b6cb0; }
      .btn-success { background: #38a169; color: white; }
      .btn-danger { background: #e53e3e; color: white; }
      .btn-warning { background: #d69e2e; color: white; }
      .btn-sm { padding: 4px 8px; font-size: 0.8em; }
      
      .chart-container { background: var(--bg-surface, #2d3748); padding: 15px; border-radius: 8px; min-height: 300px; margin-bottom: 20px; }
      
      .ai-insights { background: linear-gradient(135deg, #2c1e4a 0%, #1a202c 100%); border: 1px solid #6b46c1; padding: 20px; border-radius: 8px; margin-top: 20px; }
      .insight-item { padding: 10px; border-left: 3px solid #9f7aea; background: rgba(159, 122, 234, 0.1); margin-bottom: 10px; border-radius: 0 4px 4px 0; }
      
      .gantt-container { overflow-x: auto; background: var(--bg-surface, #2d3748); padding: 15px; border-radius: 8px; }
      .gantt-row { display: flex; align-items: center; margin-bottom: 10px; }
      .gantt-machine { width: 120px; font-weight: bold; padding-right: 15px; }
      .gantt-timeline { flex: 1; display: flex; background: var(--bg-input, #1a202c); height: 40px; border-radius: 4px; position: relative; }
      .gantt-job { position: absolute; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-radius: 4px; cursor: move; border: 1px solid rgba(255,255,255,0.2); }
      
      .table-responsive { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color, #4a5568); }
      .data-table th { background: rgba(0,0,0,0.1); font-weight: bold; }
      
      .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
      .status-critical { background: rgba(229, 62, 62, 0.2); color: #fc8181; }
      .status-warning { background: rgba(214, 158, 46, 0.2); color: #f6e05e; }
      .status-ok { background: rgba(56, 161, 105, 0.2); color: #68d391; }
      
      .rtl { direction: rtl; }
      .rtl .stat-card { border-left: none; border-right: 4px solid var(--primary-color, #4299e1); }
      .rtl .insight-item { border-left: none; border-right: 3px solid #9f7aea; border-radius: 4px 0 0 4px; }
      .rtl .gantt-machine { padding-right: 0; padding-left: 15px; }
      .rtl .data-table th, .rtl .data-table td { text-align: right; }
    </style>
  `;

  // --- 1. Production Analysis Screen ---
  Pages.productionAnalysis = function(container) {
    if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('production-analysis')) {
      container.innerHTML = '<div class="access-denied"><h2>' + t('access_denied', 'Access Denied') + '</h2></div>';
      return;
    }

    const isRtl = document.documentElement.dir === 'rtl';

    container.innerHTML = styles + `
      <div class="manufacturing-container ${isRtl ? 'rtl' : ''}">
        <div class="manufacturing-header">
          <h2>${t('production_analysis', 'Production Analysis')}</h2>
          <button class="btn btn-primary" id="btnHistory"><i class="fas fa-history"></i> ${t('view_history', 'View History')}</button>
        </div>

        <form id="productionForm">
          <!-- Operational Data -->
          <div class="form-section">
            <h3><i class="fas fa-cogs"></i> ${t('operational_data', 'Operational Data')}</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>${t('production_order', 'Production Order')}</label>
                <input type="text" id="pa_order" required>
              </div>
              <div class="form-group">
                <label>${t('product', 'Product')}</label>
                <input type="text" id="pa_product" required>
              </div>
              <div class="form-group">
                <label>${t('date', 'Date')}</label>
                <input type="date" id="pa_date" value="${new Date().toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label>${t('shift', 'Shift')}</label>
                <select id="pa_shift">
                  <option value="Morning">${t('morning', 'Morning (06:00 - 14:00)')}</option>
                  <option value="Evening">${t('evening', 'Evening (14:00 - 22:00)')}</option>
                  <option value="Night">${t('night', 'Night (22:00 - 06:00)')}</option>
                </select>
              </div>
              <div class="form-group">
                <label>${t('machine', 'Machine')}</label>
                <input type="text" id="pa_machine" required>
              </div>
              <div class="form-group">
                <label>${t('production_line', 'Production Line')}</label>
                <input type="text" id="pa_line" required>
              </div>
              <div class="form-group">
                <label>${t('operators', 'Operators')}</label>
                <input type="text" id="pa_operators" placeholder="${t('comma_separated', 'Comma separated')}">
              </div>
            </div>
          </div>

          <div class="analysis-grid">
            <!-- Quantities -->
            <div class="form-section">
              <h3><i class="fas fa-boxes"></i> ${t('quantities', 'Quantities')}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>${t('target_qty', 'Target Quantity')}</label>
                  <input type="number" id="pa_target_qty" min="0" required>
                </div>
                <div class="form-group">
                  <label>${t('actual_qty', 'Actual Quantity')}</label>
                  <input type="number" id="pa_actual_qty" min="0" required>
                </div>
                <div class="form-group">
                  <label>${t('scrap_qty', 'Scrap')}</label>
                  <input type="number" id="pa_scrap" min="0" value="0">
                </div>
                <div class="form-group">
                  <label>${t('rework_qty', 'Rework')}</label>
                  <input type="number" id="pa_rework" min="0" value="0">
                </div>
                <div class="form-group">
                  <label>${t('defective_qty', 'Defective')}</label>
                  <input type="number" id="pa_defective" min="0" value="0">
                </div>
                <div class="form-group">
                  <label>${t('waste_qty', 'Waste')}</label>
                  <input type="number" id="pa_waste" min="0" value="0">
                </div>
              </div>
            </div>

            <!-- Time & Materials -->
            <div class="form-section">
              <h3><i class="fas fa-clock"></i> ${t('time_materials', 'Time & Materials')}</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>${t('planned_time', 'Planned Prod Time (mins)')}</label>
                  <input type="number" id="pa_planned_time" min="0" required>
                </div>
                <div class="form-group">
                  <label>${t('actual_time', 'Actual Prod Time (mins)')}</label>
                  <input type="number" id="pa_actual_time" min="0" required>
                </div>
                <div class="form-group">
                  <label>${t('downtime_mins', 'Downtime (mins)')}</label>
                  <input type="number" id="pa_downtime" min="0" value="0">
                </div>
                <div class="form-group">
                  <label>${t('downtime_reason', 'Downtime Reason')}</label>
                  <select id="pa_downtime_reason">
                    <option value="">${t('none', 'None')}</option>
                    <option value="maintenance">${t('maintenance', 'Maintenance')}</option>
                    <option value="setup">${t('setup', 'Setup/Changeover')}</option>
                    <option value="material_shortage">${t('material_shortage', 'Material Shortage')}</option>
                    <option value="breakdown">${t('breakdown', 'Machine Breakdown')}</option>
                    <option value="other">${t('other', 'Other')}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>${t('expected_material', 'Expected Material (kg/units)')}</label>
                  <input type="number" id="pa_exp_mat" min="0">
                </div>
                <div class="form-group">
                  <label>${t('actual_material', 'Actual Material (kg/units)')}</label>
                  <input type="number" id="pa_act_mat" min="0">
                </div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label>${t('notes', 'Notes')}</label>
            <textarea id="pa_notes" rows="3"></textarea>
          </div>

          <button type="submit" class="btn btn-success btn-lg" style="width: 100%; padding: 15px; font-size: 1.1em;">
            <i class="fas fa-chart-line"></i> ${t('analyze_production', 'Analyze Production')}
          </button>
        </form>

        <!-- Results Section (Hidden initially) -->
        <div id="resultsSection" style="display: none; margin-top: 30px;">
          <h3 style="border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">${t('analysis_results', 'Analysis Results')}</h3>
          
          <div class="stats-grid" id="oeeStats"></div>
          
          <div class="analysis-grid">
            <div class="chart-container">
              <canvas id="oeeChart"></canvas>
            </div>
            <div class="chart-container">
              <canvas id="targetVsActualChart"></canvas>
            </div>
          </div>

          <div class="ai-insights" id="aiInsights">
            <!-- AI Insights will be injected here -->
          </div>
        </div>
      </div>
    `;

    bindProductionAnalysisEvents();
  };

  function bindProductionAnalysisEvents() {
    const form = document.getElementById('productionForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Collect Data
      const data = {
        targetQty: parseFloat(document.getElementById('pa_target_qty').value) || 0,
        actualQty: parseFloat(document.getElementById('pa_actual_qty').value) || 0,
        scrap: parseFloat(document.getElementById('pa_scrap').value) || 0,
        rework: parseFloat(document.getElementById('pa_rework').value) || 0,
        defective: parseFloat(document.getElementById('pa_defective').value) || 0,
        plannedTime: parseFloat(document.getElementById('pa_planned_time').value) || 0,
        actualTime: parseFloat(document.getElementById('pa_actual_time').value) || 0,
        downtime: parseFloat(document.getElementById('pa_downtime').value) || 0,
        expMat: parseFloat(document.getElementById('pa_exp_mat').value) || 0,
        actMat: parseFloat(document.getElementById('pa_act_mat').value) || 0,
        downtimeReason: document.getElementById('pa_downtime_reason').value,
        machine: document.getElementById('pa_machine').value
      };

      // Calculate OEE
      // Availability = (Actual Production Time - Downtime) / Planned Production Time × 100
      let availability = 0;
      if (data.plannedTime > 0) {
        availability = ((data.actualTime - data.downtime) / data.plannedTime) * 100;
      }

      // Performance = (Actual Quantity / Target Quantity) × 100
      let performance = 0;
      if (data.targetQty > 0) {
        performance = (data.actualQty / data.targetQty) * 100;
      }

      // Quality = ((Actual Quantity - Scrap - Defective) / Actual Quantity) × 100
      let quality = 0;
      if (data.actualQty > 0) {
        quality = ((data.actualQty - data.scrap - data.defective) / data.actualQty) * 100;
      }

      // Cap at 100%
      availability = Math.min(Math.max(availability, 0), 100);
      performance = Math.min(Math.max(performance, 0), 100);
      quality = Math.min(Math.max(quality, 0), 100);

      const oee = (availability * performance * quality) / 10000;

      // Variance
      const qtyVariance = data.actualQty - data.targetQty;
      const matVariance = data.actMat - data.expMat;

      renderResults(data, availability, performance, quality, oee, qtyVariance, matVariance);
      generateAIInsights(data, availability, performance, quality, oee);
      
      if (typeof SecurityHelpers !== 'undefined') {
        SecurityHelpers.logActivity('Manufacturing', 'Analysis Generated', 'Production', document.getElementById('pa_order').value);
      }
      if (typeof window.showToast === 'function') {
        window.showToast(t('analysis_complete', 'Analysis complete'), 'success');
      }
    });
  }

  function renderResults(data, avail, perf, qual, oee, qtyVar, matVar) {
    document.getElementById('resultsSection').style.display = 'block';

    // Stats
    const statsHtml = `
      <div class="stat-card" style="border-color: ${oee >= 85 ? '#38a169' : oee >= 60 ? '#d69e2e' : '#e53e3e'}">
        <div class="stat-title">${t('oee', 'OEE')}</div>
        <div class="stat-value">${oee.toFixed(2)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">${t('availability', 'Availability')}</div>
        <div class="stat-value">${avail.toFixed(2)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">${t('performance', 'Performance')}</div>
        <div class="stat-value">${perf.toFixed(2)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">${t('quality', 'Quality')}</div>
        <div class="stat-value">${qual.toFixed(2)}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">${t('qty_variance', 'Qty Variance')}</div>
        <div class="stat-value" style="color: ${qtyVar >= 0 ? '#68d391' : '#fc8181'}">${qtyVar > 0 ? '+' : ''}${qtyVar}</div>
      </div>
    `;
    document.getElementById('oeeStats').innerHTML = statsHtml;

    // Charts
    if (window.Chart) {
      // Destroy existing charts if any
      if (window.oeeChartInstance) window.oeeChartInstance.destroy();
      if (window.targetChartInstance) window.targetChartInstance.destroy();

      const ctxOee = document.getElementById('oeeChart').getContext('2d');
      window.oeeChartInstance = new Chart(ctxOee, {
        type: 'bar',
        data: {
          labels: ['Availability', 'Performance', 'Quality', 'OEE'],
          datasets: [{
            label: 'Percentage (%)',
            data: [avail, perf, qual, oee],
            backgroundColor: [
              'rgba(66, 153, 225, 0.7)',
              'rgba(236, 201, 75, 0.7)',
              'rgba(72, 187, 120, 0.7)',
              oee >= 85 ? 'rgba(72, 187, 120, 0.9)' : 'rgba(245, 101, 101, 0.9)'
            ],
            borderColor: [
              'rgb(66, 153, 225)',
              'rgb(236, 201, 75)',
              'rgb(72, 187, 120)',
              oee >= 85 ? 'rgb(72, 187, 120)' : 'rgb(245, 101, 101)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, max: 100 } },
          plugins: { title: { display: true, text: 'OEE Breakdown', color: '#fff' }, legend: { display: false } }
        }
      });

      const ctxTarget = document.getElementById('targetVsActualChart').getContext('2d');
      window.targetChartInstance = new Chart(ctxTarget, {
        type: 'doughnut',
        data: {
          labels: ['Good Output', 'Scrap', 'Defective', 'Shortfall'],
          datasets: [{
            data: [
              data.actualQty - data.scrap - data.defective, 
              data.scrap, 
              data.defective,
              Math.max(0, data.targetQty - data.actualQty)
            ],
            backgroundColor: ['#48bb78', '#ecc94b', '#f56565', '#a0aec0']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { title: { display: true, text: 'Production Yield', color: '#fff' } }
        }
      });
    }

    // Scroll to results
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  }

  function generateAIInsights(data, avail, perf, qual, oee) {
    const container = document.getElementById('aiInsights');
    let insights = `<h4><i class="fas fa-robot"></i> ${t('ai_production_analysis', 'AI Production Analysis')}</h4>`;
    let items = [];

    // Rule-based insights pretending to be AI
    if (oee >= 85) {
      items.push(`<div class="insight-item"><strong style="color: #68d391;">Excellent Performance:</strong> Machine ${data.machine} is running efficiently. OEE is world-class (>85%). Consider standardizing current settings for future runs.</div>`);
    } else {
      items.push(`<div class="insight-item"><strong style="color: #f6e05e;">Suboptimal OEE Detected:</strong> Current OEE is ${oee.toFixed(1)}%. Target should be >85%.</div>`);
    }

    // Bottleneck identification
    const factors = [
      { name: 'Availability', value: avail },
      { name: 'Performance', value: perf },
      { name: 'Quality', value: qual }
    ];
    factors.sort((a, b) => a.value - b.value);
    
    const worstFactor = factors[0];
    if (worstFactor.value < 90) {
      items.push(`<div class="insight-item"><strong style="color: #fc8181;">Root Cause identified:</strong> Primary bottleneck is <strong>${worstFactor.name}</strong> (${worstFactor.value.toFixed(1)}%).</div>`);
      
      if (worstFactor.name === 'Availability') {
        items.push(`<div class="insight-item"><strong>Recommended Action:</strong> High downtime (${data.downtime} mins) recorded. Prioritize preventative maintenance. Reason: ${data.downtimeReason || 'Unknown'}. <em>Priority: High</em></div>`);
      } else if (worstFactor.name === 'Performance') {
        items.push(`<div class="insight-item"><strong>Recommended Action:</strong> Machine running slower than planned. Check machine speed settings, operator training, or minor stoppages. <em>Priority: Medium</em></div>`);
      } else if (worstFactor.name === 'Quality') {
        items.push(`<div class="insight-item"><strong>Recommended Action:</strong> High defect/scrap rate. Inspect raw materials, recalibrate machine ${data.machine}, or review QA checkpoints. <em>Priority: Critical</em></div>`);
      }
    }

    // Material usage
    if (data.expMat > 0 && data.actMat > 0) {
      const matDiff = ((data.actMat - data.expMat) / data.expMat) * 100;
      if (matDiff > 5) {
        items.push(`<div class="insight-item"><strong style="color: #fc8181;">Material Overconsumption:</strong> Consumed ${matDiff.toFixed(1)}% more material than expected. Check for machine leaks, calibration issues, or excessive waste.</div>`);
      } else if (matDiff < -5) {
        items.push(`<div class="insight-item"><strong style="color: #f6e05e;">Material Underconsumption:</strong> Consumed ${Math.abs(matDiff).toFixed(1)}% less material. Verify product integrity and BOM specifications.</div>`);
      }
    }

    if (items.length === 0) {
      items.push(`<div class="insight-item">Production is within expected normal parameters. No critical anomalies detected.</div>`);
    }

    container.innerHTML = insights + items.join('');
  }


  // --- 3. OEE Dashboard Screen ---
  Pages.oeeDashboard = function(container) {
    if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('oee-dashboard')) {
      container.innerHTML = '<div class="access-denied"><h2>' + t('access_denied', 'Access Denied') + '</h2></div>';
      return;
    }

    container.innerHTML = styles + `
      <div class="manufacturing-container">
        <div class="manufacturing-header">
          <h2>${t('oee_dashboard', 'Global OEE Dashboard')}</h2>
          <div>
            <select id="oeeFilterLine" class="btn" style="background: var(--bg-input); border: 1px solid var(--border-color); color: white; margin-right: 10px;">
              <option value="all">All Lines</option>
              <option value="line1">Line 1 (Assembly)</option>
              <option value="line2">Line 2 (Packaging)</option>
            </select>
            <select id="oeeFilterTime" class="btn" style="background: var(--bg-input); border: 1px solid var(--border-color); color: white;">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">Factory Average OEE</div>
            <div class="stat-value" style="color: #ecc94b;">76.4%</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Top Performing Line</div>
            <div class="stat-value" style="color: #68d391;">Line 2 (82.1%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Bottom Performing Machine</div>
            <div class="stat-value" style="color: #fc8181;">CNC-04 (61.2%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Total Downtime (hrs)</div>
            <div class="stat-value">14.5</div>
          </div>
        </div>

        <div class="analysis-grid">
          <div class="chart-container">
            <canvas id="trendChart"></canvas>
          </div>
          <div class="chart-container">
            <canvas id="machineCompareChart"></canvas>
          </div>
        </div>
        
        <div class="form-section">
          <h3>Recent Alerts & Insights</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 10px; border-bottom: 1px solid var(--border-color);"><span class="status-badge status-critical">Critical</span> CNC-04 experiencing repetitive micro-stops. Check spindle vibration.</li>
            <li style="padding: 10px; border-bottom: 1px solid var(--border-color);"><span class="status-badge status-warning">Warning</span> Line 1 performance dropped 5% compared to yesterday.</li>
            <li style="padding: 10px;"><span class="status-badge status-ok">Info</span> Maintenance completed on Press-02. Availability expected to rise.</li>
          </ul>
        </div>
      </div>
    `;

    setTimeout(renderOeeCharts, 100);
  };

  function renderOeeCharts() {
    if (!window.Chart) return;
    
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          { label: 'OEE %', data: [72, 75, 74, 78, 81, 76, 76.4], borderColor: '#48bb78', tension: 0.3, fill: false },
          { label: 'Target', data: [80, 80, 80, 80, 80, 80, 80], borderColor: '#a0aec0', borderDash: [5, 5], fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'OEE Trend (7 Days)', color: '#fff' } }, scales: { y: { min: 50, max: 100 } } }
    });

    const ctxCompare = document.getElementById('machineCompareChart').getContext('2d');
    new Chart(ctxCompare, {
      type: 'bar',
      data: {
        labels: ['CNC-01', 'CNC-02', 'CNC-03', 'CNC-04', 'Press-01', 'Press-02'],
        datasets: [{
          label: 'OEE %',
          data: [85, 82, 78, 61.2, 75, 88],
          backgroundColor: ['#48bb78', '#48bb78', '#ecc94b', '#fc8181', '#ecc94b', '#48bb78']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Machine Comparison', color: '#fff' } } }
    });
  }


  // --- 4. MRP Screen ---
  Pages.mrpPlanning = function(container) {
    if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('mrp-planning')) {
      container.innerHTML = '<div class="access-denied"><h2>' + t('access_denied', 'Access Denied') + '</h2></div>';
      return;
    }

    container.innerHTML = styles + `
      <div class="manufacturing-container">
        <div class="manufacturing-header">
          <h2>${t('mrp_planning', 'Material Requirements Planning (MRP)')}</h2>
          <button class="btn btn-primary" id="runMrpBtn"><i class="fas fa-play"></i> Run MRP Calculation</button>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">Critical Shortages</div>
            <div class="stat-value" style="color: #fc8181;">3 Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Below Safety Stock</div>
            <div class="stat-value" style="color: #d69e2e;">8 Items</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Suggested POs</div>
            <div class="stat-value">5 Orders</div>
          </div>
        </div>

        <div class="form-section">
          <h3>Material Shortage Analysis</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Description</th>
                  <th>Current Stock</th>
                  <th>Required (Next 7 Days)</th>
                  <th>Safety Stock</th>
                  <th>Status</th>
                  <th>Suggested Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>RMW-001</td>
                  <td>Aluminum Sheet 2mm</td>
                  <td>150 kg</td>
                  <td>450 kg</td>
                  <td>200 kg</td>
                  <td><span class="status-badge status-critical">Critical Shortage</span></td>
                  <td><button class="btn btn-sm btn-primary">Create PO (300kg)</button></td>
                </tr>
                <tr>
                  <td>CMP-042</td>
                  <td>Microcontroller V2</td>
                  <td>45 pcs</td>
                  <td>30 pcs</td>
                  <td>50 pcs</td>
                  <td><span class="status-badge status-warning">Below Safety</span></td>
                  <td><button class="btn btn-sm btn-primary">Create PO (50pcs)</button></td>
                </tr>
                <tr>
                  <td>PKG-100</td>
                  <td>Cardboard Box L</td>
                  <td>1200 pcs</td>
                  <td>500 pcs</td>
                  <td>300 pcs</td>
                  <td><span class="status-badge status-ok">Sufficient</span></td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="ai-insights">
          <h4><i class="fas fa-brain"></i> MRP AI Predictions</h4>
          <div class="insight-item"><strong>Trend Alert:</strong> Consumption of "Aluminum Sheet 2mm" has increased by 15% over the last 3 weeks. Consider adjusting safety stock levels or negotiating bulk discounts.</div>
          <div class="insight-item"><strong>Lead Time Risk:</strong> Supplier for "Microcontroller V2" historically delays deliveries by 3-5 days in this season. Order suggested 1 week earlier than standard lead time.</div>
        </div>
      </div>
    `;

    const runBtn = document.getElementById('runMrpBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        if (typeof window.showToast === 'function') window.showToast('MRP Calculation running in background...', 'info');
        setTimeout(() => {
          if (typeof window.showToast === 'function') window.showToast('MRP Calculation complete.', 'success');
        }, 1500);
      });
    }
  };


  // --- 5. APS Screen ---
  Pages.apsScheduling = function(container) {
    if (typeof PermissionGuard !== 'undefined' && !PermissionGuard.canView('aps-scheduling')) {
      container.innerHTML = '<div class="access-denied"><h2>' + t('access_denied', 'Access Denied') + '</h2></div>';
      return;
    }

    container.innerHTML = styles + `
      <div class="manufacturing-container">
        <div class="manufacturing-header">
          <h2>${t('aps_scheduling', 'Advanced Planning & Scheduling (APS)')}</h2>
          <div>
            <button class="btn btn-warning"><i class="fas fa-magic"></i> Auto-Optimize</button>
            <button class="btn btn-success"><i class="fas fa-save"></i> Save Schedule</button>
          </div>
        </div>

        <div class="form-section">
          <h3>Production Schedule (Gantt)</h3>
          
          <div style="display: flex; margin-bottom: 10px; color: var(--text-muted); font-size: 0.8em; padding-left: 135px;">
            <div style="flex: 1;">08:00</div>
            <div style="flex: 1;">10:00</div>
            <div style="flex: 1;">12:00</div>
            <div style="flex: 1;">14:00</div>
            <div style="flex: 1;">16:00</div>
            <div style="flex: 1;">18:00</div>
          </div>

          <div class="gantt-container">
            <!-- Machine 1 -->
            <div class="gantt-row">
              <div class="gantt-machine">CNC-01 <br><small style="color:#68d391">90% Load</small></div>
              <div class="gantt-timeline">
                <div class="gantt-job" style="left: 0%; width: 25%; background: #3182ce;" title="PO-1001">PO-1001</div>
                <div class="gantt-job" style="left: 26%; width: 40%; background: #dd6b20;" title="PO-1002">PO-1002</div>
                <div class="gantt-job" style="left: 70%; width: 20%; background: #805ad5;" title="PO-1005">PO-1005</div>
              </div>
            </div>
            
            <!-- Machine 2 -->
            <div class="gantt-row">
              <div class="gantt-machine">CNC-02 <br><small style="color:#fc8181">110% Load</small> <i class="fas fa-exclamation-triangle" style="color: #fc8181;" title="Bottleneck"></i></div>
              <div class="gantt-timeline">
                <div class="gantt-job" style="left: 5%; width: 50%; background: #3182ce;" title="PO-1003">PO-1003</div>
                <div class="gantt-job" style="left: 56%; width: 45%; background: #e53e3e;" title="PO-1004 (Overdue)">PO-1004</div>
              </div>
            </div>

            <!-- Machine 3 -->
            <div class="gantt-row">
              <div class="gantt-machine">Press-01 <br><small style="color:#ecc94b">40% Load</small></div>
              <div class="gantt-timeline">
                <div class="gantt-job" style="left: 10%; width: 30%; background: #38a169;" title="PO-0998">PO-0998</div>
              </div>
            </div>
          </div>
        </div>

        <div class="analysis-grid">
          <div class="form-section">
            <h3>Unscheduled Work Orders</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 10px; border: 1px solid var(--border-color); margin-bottom: 5px; border-radius: 4px; background: var(--bg-input); cursor: move;">
                <strong>PO-1006</strong> - 500 units (Due: Tomorrow)
              </li>
              <li style="padding: 10px; border: 1px solid var(--border-color); margin-bottom: 5px; border-radius: 4px; background: var(--bg-input); cursor: move;">
                <strong>PO-1007</strong> - 200 units (Due: Next Week)
              </li>
            </ul>
          </div>
          
          <div class="ai-insights" style="margin-top: 0;">
            <h4><i class="fas fa-lightbulb"></i> APS Suggestions</h4>
            <div class="insight-item"><strong>Bottleneck Detected:</strong> CNC-02 is overloaded (110%). <strong>Suggestion:</strong> Move PO-1004 to CNC-01 (has 10% available capacity) or schedule overtime.</div>
            <div class="insight-item"><strong>Setup Optimization:</strong> PO-1001 and PO-1005 on CNC-01 use the same tooling. Sequence them consecutively to save 45 mins of changeover time.</div>
          </div>
        </div>
      </div>
    `;
  };

})();
