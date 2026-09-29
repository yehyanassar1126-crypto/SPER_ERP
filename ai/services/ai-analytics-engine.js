// =============================================
// AI ANALYTICS ENGINE — Comprehensive Analysis
// Extends AIBrain with employee, attendance, login, department analytics
// =============================================
window.AIAnalyticsEngine = {

  /**
   * Run comprehensive analysis for a date range
   * @param {Date} fromDate
   * @param {Date} toDate
   * @param {function} cb - callback(analysisResult)
   */
  analyze: function(fromDate, toDate, cb) {
    var from = fromDate.toISOString().slice(0,10);
    var to = toDate.toISOString().slice(0,10);
    var data = {};
    var pending = 8;
    function done(){ pending--; if(pending<=0) AIAnalyticsEngine._processAll(data, fromDate, toDate, cb); }

    sbClient.from('users').select('*').then(function(r){ data.employees = r.data||[]; done(); });
    sbClient.from('attendance').select('*').gte('date',from).lte('date',to).then(function(r){ data.attendance = r.data||[]; done(); });
    sbClient.from('leave_requests').select('*').gte('created_at',from+'T00:00:00').lte('created_at',to+'T23:59:59').then(function(r){ data.leaves = r.data||[]; done(); });
    sbClient.from('payroll').select('*').then(function(r){ data.payroll = r.data||[]; done(); });
    sbClient.from('overtime').select('*').gte('date',from).lte('date',to).then(function(r){ data.overtime = r.data||[]; done(); });
    sbClient.from('login_history').select('*').gte('created_at',from+'T00:00:00').lte('created_at',to+'T23:59:59').then(function(r){ data.logins = r.data||[]; done(); });
    sbClient.from('activity_log').select('*').gte('created_at',from+'T00:00:00').lte('created_at',to+'T23:59:59').then(function(r){ data.activities = r.data||[]; done(); });
    sbClient.from('loans').select('*').then(function(r){ data.loans = r.data||[]; done(); });
  },

  _processAll: function(data, fromDate, toDate, cb) {
    var result = {
      period: { from: fromDate.toISOString().slice(0,10), to: toDate.toISOString().slice(0,10) },
      employee: AIAnalyticsEngine._employeeAnalysis(data, fromDate, toDate),
      attendance: AIAnalyticsEngine._attendanceAnalysis(data, fromDate, toDate),
      login: AIAnalyticsEngine._loginAnalysis(data),
      department: AIAnalyticsEngine._departmentAnalysis(data, fromDate, toDate),
      financial: AIAnalyticsEngine._financialSummary(data, fromDate, toDate),
      recommendations: [],
      anomalies: [],
      timestamp: new Date().toISOString()
    };

    // Generate recommendations
    result.recommendations = AIAnalyticsEngine._generateRecommendations(result);
    result.anomalies = AIAnalyticsEngine._detectAnomalies(result);
    result.executive_summary = AIAnalyticsEngine._buildSummary(result);

    if(cb) cb(result);
  },

  // ========== EMPLOYEE MOVEMENT ANALYSIS ==========
  _employeeAnalysis: function(data, fromDate, toDate) {
    var emps = data.employees || [];
    var active = emps.filter(function(e){ return e.status==='active'; });
    var inactive = emps.filter(function(e){ return e.status!=='active'; });
    var newHires = emps.filter(function(e){
      if(!e.created_at) return false;
      var d = new Date(e.created_at);
      return d >= fromDate && d <= toDate;
    });
    var departed = emps.filter(function(e){
      return e.status==='resigned' || e.status==='terminated' || e.status==='inactive';
    });
    var deptCount = {};
    active.forEach(function(e){
      var dept = e.department || 'Other';
      deptCount[dept] = (deptCount[dept]||0) + 1;
    });

    var totalSalary = active.reduce(function(s,e){ return s + (parseFloat(e.base_salary)||0); }, 0);

    return {
      total: emps.length,
      active: active.length,
      inactive: inactive.length,
      newHires: newHires.length,
      newHiresList: newHires.map(function(e){ return {name:e.full_name, dept:e.department, date:e.created_at}; }),
      departed: departed.length,
      turnoverRate: active.length > 0 ? Math.round((departed.length / active.length) * 100) : 0,
      byDepartment: deptCount,
      totalSalaryCost: totalSalary,
      avgSalary: active.length > 0 ? Math.round(totalSalary / active.length) : 0,
      netGrowth: newHires.length - departed.length
    };
  },

  // ========== ATTENDANCE ANALYSIS ==========
  _attendanceAnalysis: function(data, fromDate, toDate) {
    var att = data.attendance || [];
    var active = (data.employees||[]).filter(function(e){ return e.status==='active' && e.role!=='owner'; });
    var totalRecords = att.length;
    var present = att.filter(function(a){ return a.status==='present' || a.status==='checked_in' || a.status==='checked_out'; });
    var late = att.filter(function(a){ return (a.delay_minutes||0) > 0; });
    var absent = att.filter(function(a){ return a.status==='absent'; });
    var totalDelay = att.reduce(function(s,a){ return s + (a.delay_minutes||0); }, 0);

    // Worst late employees
    var empDelay = {};
    late.forEach(function(a){
      var eid = a.employee_id;
      if(!empDelay[eid]) empDelay[eid] = {id:eid, name:a.employee_name||eid, count:0, totalMin:0};
      empDelay[eid].count++;
      empDelay[eid].totalMin += (a.delay_minutes||0);
    });
    var worstLate = Object.values(empDelay).sort(function(a,b){ return b.count - a.count; }).slice(0,10);

    // Daily pattern
    var dayMap = {};
    att.forEach(function(a){
      if(!a.date) return;
      var day = new Date(a.date).toLocaleDateString('en-US',{weekday:'long'});
      if(!dayMap[day]) dayMap[day] = {present:0, late:0, absent:0};
      if(a.status==='present'||a.status==='checked_in'||a.status==='checked_out') dayMap[day].present++;
      if((a.delay_minutes||0)>0) dayMap[day].late++;
      if(a.status==='absent') dayMap[day].absent++;
    });

    var workingDays = new Set(att.map(function(a){ return a.date; })).size;

    return {
      totalRecords: totalRecords,
      presentCount: present.length,
      lateCount: late.length,
      absentCount: absent.length,
      attendanceRate: totalRecords > 0 ? Math.round((present.length / totalRecords) * 100) : 0,
      lateRate: totalRecords > 0 ? Math.round((late.length / totalRecords) * 100) : 0,
      absenceRate: totalRecords > 0 ? Math.round((absent.length / totalRecords) * 100) : 0,
      totalDelayMinutes: totalDelay,
      avgDelayPerLate: late.length > 0 ? Math.round(totalDelay / late.length) : 0,
      workingDays: workingDays,
      worstLateEmployees: worstLate,
      dailyPattern: dayMap
    };
  },

  // ========== LOGIN & ACTIVITY ANALYSIS ==========
  _loginAnalysis: function(data) {
    var logins = data.logins || [];
    var activities = data.activities || [];
    var success = logins.filter(function(l){ return l.login_status==='success'; });
    var failed = logins.filter(function(l){ return l.login_status!=='success'; });

    // Most active users
    var userLogins = {};
    success.forEach(function(l){
      var name = l.user_name || 'Unknown';
      userLogins[name] = (userLogins[name]||0) + 1;
    });
    var topUsers = Object.entries(userLogins).sort(function(a,b){ return b[1]-a[1]; }).slice(0,10)
      .map(function(e){ return {name:e[0], count:e[1]}; });

    // Most used screens
    var screenUsage = {};
    activities.forEach(function(a){
      var mod = a.module || 'unknown';
      screenUsage[mod] = (screenUsage[mod]||0) + 1;
    });
    var topScreens = Object.entries(screenUsage).sort(function(a,b){ return b[1]-a[1]; }).slice(0,10)
      .map(function(e){ return {screen:e[0], count:e[1]}; });

    // Hourly distribution
    var hourly = {};
    success.forEach(function(l){
      if(!l.created_at) return;
      var h = new Date(l.created_at).getHours();
      hourly[h] = (hourly[h]||0) + 1;
    });

    return {
      totalLogins: logins.length,
      successLogins: success.length,
      failedLogins: failed.length,
      uniqueUsers: Object.keys(userLogins).length,
      topActiveUsers: topUsers,
      topScreens: topScreens,
      hourlyDistribution: hourly,
      totalActivities: activities.length
    };
  },

  // ========== DEPARTMENT ANALYSIS ==========
  _departmentAnalysis: function(data, fromDate, toDate) {
    var emps = (data.employees||[]).filter(function(e){ return e.status==='active' && e.role!=='owner'; });
    var att = data.attendance || [];
    var depts = {};

    emps.forEach(function(e){
      var dept = e.department || 'Other';
      if(!depts[dept]) depts[dept] = {name:dept, employees:0, totalSalary:0, presentDays:0, lateDays:0, absentDays:0, totalDelay:0, leaves:0, overtimeHours:0};
      depts[dept].employees++;
      depts[dept].totalSalary += (parseFloat(e.base_salary)||0);
    });

    att.forEach(function(a){
      var emp = emps.find(function(e){ return e.id===a.employee_id; });
      if(!emp) return;
      var dept = emp.department || 'Other';
      if(!depts[dept]) return;
      if(a.status==='present'||a.status==='checked_in'||a.status==='checked_out') depts[dept].presentDays++;
      if((a.delay_minutes||0)>0) { depts[dept].lateDays++; depts[dept].totalDelay += (a.delay_minutes||0); }
      if(a.status==='absent') depts[dept].absentDays++;
    });

    (data.leaves||[]).forEach(function(l){
      var emp = emps.find(function(e){ return e.id===l.employee_id; });
      if(!emp) return;
      var dept = emp.department || 'Other';
      if(depts[dept]) depts[dept].leaves++;
    });

    (data.overtime||[]).forEach(function(o){
      if(o.status!=='approved') return;
      var emp = emps.find(function(e){ return e.id===o.employee_id; });
      if(!emp) return;
      var dept = emp.department || 'Other';
      if(depts[dept]) depts[dept].overtimeHours += (o.hours||0);
    });

    // Calculate scores
    var results = Object.values(depts).map(function(d){
      var total = d.presentDays + d.absentDays;
      d.attendanceRate = total > 0 ? Math.round((d.presentDays / total) * 100) : 0;
      d.lateRate = total > 0 ? Math.round((d.lateDays / total) * 100) : 0;
      d.avgSalary = d.employees > 0 ? Math.round(d.totalSalary / d.employees) : 0;
      d.score = Math.max(0, 100 - (d.lateRate * 0.5) - ((100 - d.attendanceRate) * 0.3));
      return d;
    });

    results.sort(function(a,b){ return b.score - a.score; });
    return results;
  },

  // ========== FINANCIAL SUMMARY ==========
  _financialSummary: function(data, fromDate, toDate) {
    var payroll = data.payroll || [];
    var loans = data.loans || [];
    var from = fromDate.toISOString().slice(0,7);
    var to = toDate.toISOString().slice(0,7);

    var totalPaid = 0;
    payroll.forEach(function(p){
      if(p.month && p.month >= from && p.month <= to) totalPaid += (p.net_salary||0);
    });

    var activeLoans = loans.filter(function(l){ return l.status==='active'; });
    var totalLoanBalance = activeLoans.reduce(function(s,l){ return s + (parseFloat(l.remaining_amount)||0); }, 0);

    return {
      totalPayroll: totalPaid,
      activeLoansCount: activeLoans.length,
      totalLoanBalance: totalLoanBalance
    };
  },

  // ========== RECOMMENDATIONS ==========
  _generateRecommendations: function(result) {
    var recs = [];
    var att = result.attendance;
    var emp = result.employee;
    var dept = result.department;

    if(att.lateRate > 15) recs.push({priority:'high', ar:'معدل التأخير مرتفع ('+att.lateRate+'%). يُنصح بتطبيق نظام حوافز الحضور المبكر.', en:'High late rate ('+att.lateRate+'%). Consider implementing an early attendance incentive program.'});
    if(att.absenceRate > 10) recs.push({priority:'high', ar:'معدل الغياب مرتفع ('+att.absenceRate+'%). يُنصح بمراجعة سياسات الإجازات.', en:'High absence rate ('+att.absenceRate+'%). Review leave policies.'});
    if(emp.turnoverRate > 20) recs.push({priority:'critical', ar:'معدل دوران الموظفين مرتفع جداً ('+emp.turnoverRate+'%). يجب اتخاذ إجراءات فورية للاحتفاظ بالكوادر.', en:'Very high turnover rate ('+emp.turnoverRate+'%). Immediate retention measures needed.'});
    if(att.avgDelayPerLate > 30) recs.push({priority:'medium', ar:'متوسط التأخير مرتفع ('+att.avgDelayPerLate+' دقيقة). يُنصح بمراجعة مواعيد الورديات.', en:'High average delay ('+att.avgDelayPerLate+' min). Review shift schedules.'});

    // Department-specific
    if(dept && dept.length > 0) {
      var worst = dept[dept.length - 1];
      if(worst && worst.score < 60) recs.push({priority:'high', ar:'قسم '+worst.name+' يحتاج اهتمام عاجل (نقاط الأداء: '+Math.round(worst.score)+'/100).', en:'Department '+worst.name+' needs urgent attention (score: '+Math.round(worst.score)+'/100).'});
    }

    if(recs.length === 0) recs.push({priority:'info', ar:'أداء النظام مستقر. لا توجد مشاكل حرجة حالياً.', en:'System performance is stable. No critical issues at this time.'});

    return recs;
  },

  // ========== ANOMALY DETECTION ==========
  _detectAnomalies: function(result) {
    var anomalies = [];
    var att = result.attendance;

    if(att.worstLateEmployees && att.worstLateEmployees.length > 0) {
      var worst = att.worstLateEmployees[0];
      if(worst.count >= 10) anomalies.push({type:'pattern', ar:'الموظف '+worst.name+' تأخر '+worst.count+' مرة في الفترة المحددة.', en:'Employee '+worst.name+' was late '+worst.count+' times in this period.'});
    }

    var login = result.login;
    if(login.failedLogins > login.successLogins * 0.1) anomalies.push({type:'security', ar:'عدد كبير من محاولات تسجيل الدخول الفاشلة ('+login.failedLogins+').', en:'High number of failed login attempts ('+login.failedLogins+').'});

    return anomalies;
  },

  // ========== EXECUTIVE SUMMARY ==========
  _buildSummary: function(result) {
    var emp = result.employee;
    var att = result.attendance;
    var login = result.login;
    var fin = result.financial;

    return {
      ar: 'خلال الفترة من ' + result.period.from + ' إلى ' + result.period.to + ':\n' +
        '• إجمالي الموظفين النشطين: ' + emp.active + ' | جدد: ' + emp.newHires + ' | مغادرين: ' + emp.departed + '\n' +
        '• معدل الحضور: ' + att.attendanceRate + '% | التأخير: ' + att.lateRate + '% | الغياب: ' + att.absenceRate + '%\n' +
        '• تسجيلات الدخول: ' + login.totalLogins + ' | مستخدمين نشطين: ' + login.uniqueUsers + '\n' +
        '• إجمالي الرواتب: ' + (fin.totalPayroll||0).toLocaleString() + ' ج.م',
      en: 'For the period ' + result.period.from + ' to ' + result.period.to + ':\n' +
        '• Active Employees: ' + emp.active + ' | New: ' + emp.newHires + ' | Departed: ' + emp.departed + '\n' +
        '• Attendance: ' + att.attendanceRate + '% | Late: ' + att.lateRate + '% | Absent: ' + att.absenceRate + '%\n' +
        '• Logins: ' + login.totalLogins + ' | Active Users: ' + login.uniqueUsers + '\n' +
        '• Total Payroll: EGP ' + (fin.totalPayroll||0).toLocaleString()
    };
  }
};
