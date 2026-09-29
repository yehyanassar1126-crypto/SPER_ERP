// =============================================
// AI REPORT DASHBOARD — Visual Report Interface
// =============================================
window.Pages = window.Pages || {};

Pages.aiReports = function(el) {
  var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
  var isOwner = App.isOwner();

  // Check permission
  if (!isOwner && !PermissionGuard.canView('ai-reports')) {
    PermissionGuard.renderAccessDenied(el);
    return;
  }

  var html = '';
  // Hero Header
  html += '<div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);border-radius:16px;padding:32px;color:white;margin-bottom:24px;position:relative;overflow:hidden">';
  html += '<div style="position:relative;z-index:2"><h1 style="font-size:1.8rem;font-weight:800;margin-bottom:8px;color:white">' + (lang==='ar' ? '📊 تقارير الذكاء الاصطناعي' : '📊 AI Intelligence Reports') + '</h1>';
  html += '<p style="opacity:0.8;font-size:1rem">' + (lang==='ar' ? 'تحليل شامل للأداء المؤسسي مع توصيات ذكية' : 'Comprehensive performance analysis with AI recommendations') + '</p></div>';
  html += '<div style="position:absolute;right:20px;top:10px;font-size:100px;opacity:0.05">🧠</div></div>';

  // Generate Report Controls
  html += '<div class="card" style="margin-bottom:24px"><div class="card-header"><div><h3>' + (lang==='ar' ? '🔄 إنشاء تقرير جديد' : '🔄 Generate New Report') + '</h3></div></div>';
  html += '<div class="card-body"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">';

  // Monthly
  html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:20px;text-align:center;border:1px solid var(--border-color)">';
  html += '<div style="font-size:2rem;margin-bottom:8px">📅</div>';
  html += '<h4 style="margin-bottom:8px">' + t('monthly_report') + '</h4>';
  html += '<select id="rpt-month" class="form-input" style="margin-bottom:8px">';
  var now = new Date();
  for(var m=now.getMonth();m>=1;m--) {
    var mNames = lang==='ar' ? ['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'] : ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    html += '<option value="'+m+'">'+mNames[m]+' '+now.getFullYear()+'</option>';
  }
  html += '</select>';
  html += '<button class="btn btn-primary btn-block" id="gen-monthly">' + t('generate_report') + '</button></div>';

  // Semiannual
  html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:20px;text-align:center;border:1px solid var(--border-color)">';
  html += '<div style="font-size:2rem;margin-bottom:8px">📊</div>';
  html += '<h4 style="margin-bottom:8px">' + t('semiannual_report') + '</h4>';
  html += '<select id="rpt-half" class="form-input" style="margin-bottom:8px">';
  html += '<option value="1">' + (lang==='ar' ? 'النصف الأول' : 'First Half') + ' ' + now.getFullYear() + '</option>';
  html += '<option value="2">' + (lang==='ar' ? 'النصف الثاني' : 'Second Half') + ' ' + now.getFullYear() + '</option></select>';
  html += '<button class="btn btn-primary btn-block" id="gen-semi">' + t('generate_report') + '</button></div>';

  // Annual
  html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:20px;text-align:center;border:1px solid var(--border-color)">';
  html += '<div style="font-size:2rem;margin-bottom:8px">📈</div>';
  html += '<h4 style="margin-bottom:8px">' + t('annual_report') + '</h4>';
  html += '<select id="rpt-year" class="form-input" style="margin-bottom:8px">';
  html += '<option value="'+now.getFullYear()+'">'+now.getFullYear()+'</option>';
  html += '<option value="'+(now.getFullYear()-1)+'">'+(now.getFullYear()-1)+'</option></select>';
  html += '<button class="btn btn-primary btn-block" id="gen-annual">' + t('generate_report') + '</button></div>';

  // Custom
  html += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:20px;text-align:center;border:1px solid var(--border-color)">';
  html += '<div style="font-size:2rem;margin-bottom:8px">🎯</div>';
  html += '<h4 style="margin-bottom:8px">' + t('custom_report') + '</h4>';
  html += '<input type="date" id="rpt-from" class="form-input" style="margin-bottom:4px">';
  html += '<input type="date" id="rpt-to" class="form-input" style="margin-bottom:8px">';
  html += '<button class="btn btn-primary btn-block" id="gen-custom">' + t('generate_report') + '</button></div>';

  html += '</div></div></div>';

  // Report History
  html += '<div class="card" id="report-history-card"><div class="card-header"><div><h3>' + t('report_history') + '</h3></div></div>';
  html += '<div class="card-body" id="report-history-body"><div style="text-align:center;padding:40px"><span class="spinner"></span></div></div></div>';

  // Report Viewer
  html += '<div id="report-viewer" style="display:none"></div>';

  el.innerHTML = html;

  // Load history
  _loadHistory();

  // Bind events
  document.getElementById('gen-monthly').addEventListener('click', function(){
    this.disabled = true; this.textContent = t('generating_report');
    var month = parseInt(document.getElementById('rpt-month').value);
    AIReportGenerator.generateMonthly(now.getFullYear(), month, function(r,err){
      if(err) { showToast('Error: '+err.message, 'error'); return; }
      showToast(t('report_generated'), 'success');
      _loadHistory();
      if(r) _showReport(r.content, r.title);
      document.getElementById('gen-monthly').disabled = false;
      document.getElementById('gen-monthly').textContent = t('generate_report');
    });
  });

  document.getElementById('gen-semi').addEventListener('click', function(){
    this.disabled = true; this.textContent = t('generating_report');
    var half = parseInt(document.getElementById('rpt-half').value);
    AIReportGenerator.generateSemiannual(now.getFullYear(), half, function(r,err){
      if(err) { showToast('Error: '+err.message, 'error'); return; }
      showToast(t('report_generated'), 'success');
      _loadHistory();
      if(r) _showReport(r.content, r.title);
      document.getElementById('gen-semi').disabled = false;
      document.getElementById('gen-semi').textContent = t('generate_report');
    });
  });

  document.getElementById('gen-annual').addEventListener('click', function(){
    this.disabled = true; this.textContent = t('generating_report');
    var year = parseInt(document.getElementById('rpt-year').value);
    AIReportGenerator.generateAnnual(year, function(r,err){
      if(err) { showToast('Error: '+err.message, 'error'); return; }
      showToast(t('report_generated'), 'success');
      _loadHistory();
      if(r) _showReport(r.content, r.title);
      document.getElementById('gen-annual').disabled = false;
      document.getElementById('gen-annual').textContent = t('generate_report');
    });
  });

  document.getElementById('gen-custom').addEventListener('click', function(){
    var f = document.getElementById('rpt-from').value;
    var t2 = document.getElementById('rpt-to').value;
    if(!f || !t2) { showToast(lang==='ar'?'اختر التاريخ':'Select dates','warning'); return; }
    this.disabled = true; this.textContent = t('generating_report');
    AIReportGenerator.generateCustom(new Date(f), new Date(t2), function(r,err){
      if(err) { showToast('Error: '+err.message, 'error'); return; }
      showToast(t('report_generated'), 'success');
      _loadHistory();
      if(r) _showReport(r.content, r.title);
      document.getElementById('gen-custom').disabled = false;
      document.getElementById('gen-custom').textContent = t('generate_report');
    });
  });

  function _loadHistory() {
    AIReportGenerator.getHistory(function(reports) {
      var body = document.getElementById('report-history-body');
      if(!body) return;
      if(reports.length === 0) { body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">'+t('no_reports')+'</div>'; return; }

      var h = '<table class="data-table"><thead><tr><th>'+(lang==='ar'?'التقرير':'Report')+'</th><th>'+(lang==='ar'?'النوع':'Type')+'</th><th>'+(lang==='ar'?'الفترة':'Period')+'</th><th>'+(lang==='ar'?'بواسطة':'By')+'</th><th>'+(lang==='ar'?'التاريخ':'Date')+'</th><th>'+(lang==='ar'?'إجراء':'Action')+'</th></tr></thead><tbody>';
      reports.forEach(function(r) {
        var typeBadge = r.report_type==='monthly'?'info':r.report_type==='semiannual'?'warning':r.report_type==='annual'?'success':'secondary';
        h += '<tr><td style="font-weight:600">'+r.title+'</td>';
        h += '<td><span class="badge badge-'+typeBadge+'">'+r.report_type+'</span></td>';
        h += '<td>'+r.period+'</td>';
        h += '<td>'+(r.generated_by_name||'-')+'</td>';
        h += '<td style="white-space:nowrap">'+(typeof formatDateTime==='function'?formatDateTime(r.created_at):r.created_at)+'</td>';
        h += '<td><button class="btn btn-xs btn-primary view-rpt-btn" data-id="'+r.id+'">'+(lang==='ar'?'عرض':'View')+'</button></td></tr>';
      });
      h += '</tbody></table>';
      body.innerHTML = h;

      document.querySelectorAll('.view-rpt-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var rid = this.getAttribute('data-id');
          sbClient.from('ai_reports').select('*').eq('id', rid).single().then(function(res) {
            if(res.data) _showReport(res.data.content, res.data.title);
          });
        });
      });
    });
  }

  function _showReport(content, title) {
    var viewer = document.getElementById('report-viewer');
    if(!viewer || !content) return;
    viewer.style.display = 'block';
    viewer.scrollIntoView({behavior:'smooth'});

    var c = content;
    var emp = c.employee || {};
    var att = c.attendance || {};
    var login = c.login || {};
    var fin = c.financial || {};
    var depts = c.department || [];
    var recs = c.recommendations || [];
    var anom = c.anomalies || [];
    var summary = c.executive_summary || {};

    var h = '<div class="card" style="margin-top:24px"><div class="card-header" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px 12px 0 0"><div><h3 style="color:white">📄 '+title+'</h3></div>';
    h += '<button class="btn btn-sm btn-outline" style="color:white;border-color:rgba(255,255,255,0.3)" onclick="window.print()">🖨️ '+(lang==='ar'?'طباعة':'Print')+'</button></div>';

    // Executive Summary
    h += '<div class="card-body">';
    h += '<div style="background:var(--bg-tertiary);border-radius:12px;padding:20px;margin-bottom:24px;border-left:4px solid #6366f1">';
    h += '<h4 style="margin-bottom:8px">'+t('executive_summary')+'</h4>';
    h += '<pre style="white-space:pre-wrap;font-family:inherit;margin:0;color:var(--text-secondary)">'+(summary[lang]||summary.ar||JSON.stringify(summary))+'</pre></div>';

    // KPI Cards
    h += '<div class="stats-grid" style="margin-bottom:24px">';
    h += _kpi('👥', t('active_employees'), emp.active||0, '#6366f1');
    h += _kpi('🆕', t('new_employees'), emp.newHires||0, '#22c55e');
    h += _kpi('🚪', t('employees_left'), emp.departed||0, '#ef4444');
    h += _kpi('🔄', t('turnover_rate'), (emp.turnoverRate||0)+'%', '#f59e0b');
    h += '</div>';

    h += '<div class="stats-grid" style="margin-bottom:24px">';
    h += _kpi('✅', t('attendance_rate'), (att.attendanceRate||0)+'%', '#22c55e');
    h += _kpi('⏰', t('late_rate'), (att.lateRate||0)+'%', '#f59e0b');
    h += _kpi('❌', t('absence_rate'), (att.absenceRate||0)+'%', '#ef4444');
    h += _kpi('💰', t('total_salary_cost'), (emp.totalSalaryCost||0).toLocaleString(), '#8b5cf6');
    h += '</div>';

    h += '<div class="stats-grid" style="margin-bottom:24px">';
    h += _kpi('🔐', t('login_count'), login.totalLogins||0, '#06b6d4');
    h += _kpi('👤', t('most_active_users'), login.uniqueUsers||0, '#ec4899');
    h += _kpi('⌛', t('overtime_hours'), (att.totalDelayMinutes||0)+' min', '#14b8a6');
    h += _kpi('🏦', t('active_loans'), (fin.activeLoansCount||0), '#a855f7');
    h += '</div>';

    // Department Table
    if(depts.length > 0) {
      h += '<h4 style="margin-bottom:12px">'+t('dept_analysis')+'</h4>';
      h += '<table class="data-table" style="margin-bottom:24px"><thead><tr><th>'+(lang==='ar'?'القسم':'Dept')+'</th><th>'+(lang==='ar'?'الموظفين':'Emp')+'</th><th>'+(lang==='ar'?'الحضور':'Att%')+'</th><th>'+(lang==='ar'?'التأخير':'Late%')+'</th><th>'+(lang==='ar'?'النقاط':'Score')+'</th></tr></thead><tbody>';
      depts.forEach(function(d){
        var scoreColor = d.score>=80?'var(--accent-success)':d.score>=60?'var(--accent-warning)':'var(--accent-danger)';
        h += '<tr><td style="font-weight:600">'+d.name+'</td><td>'+d.employees+'</td><td>'+d.attendanceRate+'%</td><td>'+d.lateRate+'%</td><td style="color:'+scoreColor+';font-weight:700">'+Math.round(d.score)+'</td></tr>';
      });
      h += '</tbody></table>';
    }

    // Recommendations
    if(recs.length > 0) {
      h += '<h4 style="margin-bottom:12px">'+t('recommendations')+'</h4>';
      recs.forEach(function(r){
        var color = r.priority==='critical'?'#ef4444':r.priority==='high'?'#f59e0b':'#22c55e';
        h += '<div style="padding:12px 16px;margin-bottom:8px;border-radius:8px;border-left:4px solid '+color+';background:var(--bg-tertiary)">'+(r[lang]||r.ar||r.en)+'</div>';
      });
    }

    // Anomalies
    if(anom.length > 0) {
      h += '<h4 style="margin:16px 0 12px">'+t('anomalies')+'</h4>';
      anom.forEach(function(a){
        h += '<div style="padding:12px 16px;margin-bottom:8px;border-radius:8px;border-left:4px solid #ef4444;background:var(--bg-tertiary)">⚠️ '+(a[lang]||a.ar||a.en)+'</div>';
      });
    }

    h += '</div></div>';
    viewer.innerHTML = h;
  }

  function _kpi(emoji, label, value, color) {
    return '<div style="background:var(--bg-card);border-radius:12px;padding:16px;border-left:4px solid '+color+'">' +
      '<div style="font-size:1.3rem;margin-bottom:6px">'+emoji+'</div>' +
      '<div style="font-size:1.4rem;font-weight:800">'+value+'</div>' +
      '<div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase">'+label+'</div></div>';
  }
};
