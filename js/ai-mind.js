// ===== AI MIND - HR INTELLIGENCE ENGINE =====
// A neural-network inspired AI that analyzes HR data patterns,
// detects anomalies, predicts risks, and provides smart recommendations.

var AIMind = {
  isThinking: false,
  conversationHistory: [],
  insights: [],
  neuralNodes: [],
  pulseInterval: null,

  // ========== CORE ANALYSIS ENGINE ==========

  // Analyze attendance patterns and detect anomalies
  analyzeAttendance: function (attendance, employees) {
    var insights = [];
    var now = new Date();
    var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group attendance by employee
    var byEmployee = {};
    attendance.forEach(function (a) {
      if (!byEmployee[a.employee_name]) byEmployee[a.employee_name] = [];
      byEmployee[a.employee_name].push(a);
    });

    // Detect chronic lateness
    Object.keys(byEmployee).forEach(function (name) {
      var records = byEmployee[name];
      var recentRecords = records.filter(function (r) { return new Date(r.date) >= thirtyDaysAgo; });
      var lateCount = recentRecords.filter(function (r) { return r.delay_minutes > 0; }).length;
      var totalDelay = recentRecords.reduce(function (s, r) { return s + (r.delay_minutes || 0); }, 0);
      var avgDelay = recentRecords.length ? Math.round(totalDelay / recentRecords.length) : 0;

      if (lateCount >= 5) {
        insights.push({
          type: 'warning',
          category: 'attendance',
          icon: '⏰',
          title: 'Chronic Lateness Detected',
          message: name + ' has been late ' + lateCount + ' times in the last 30 days (avg ' + avgDelay + ' min). Consider a private conversation.',
          severity: lateCount >= 10 ? 'critical' : 'high',
          employee: name,
          metric: lateCount
        });
      }

      // Detect attendance drops (sudden absence pattern)
      if (recentRecords.length < 15 && records.length > 20) {
        insights.push({
          type: 'alert',
          category: 'attendance',
          icon: '📉',
          title: 'Attendance Drop',
          message: name + ' attended only ' + recentRecords.length + ' days in the last 30 days. This may indicate disengagement or personal issues.',
          severity: 'medium',
          employee: name,
          metric: recentRecords.length
        });
      }
    });

    // Department-level analysis
    var deptStats = {};
    attendance.filter(function (a) { return new Date(a.date) >= thirtyDaysAgo; }).forEach(function (a) {
      if (!deptStats[a.department]) deptStats[a.department] = { total: 0, late: 0, totalDelay: 0 };
      deptStats[a.department].total++;
      if (a.delay_minutes > 0) {
        deptStats[a.department].late++;
        deptStats[a.department].totalDelay += a.delay_minutes;
      }
    });

    Object.keys(deptStats).forEach(function (dept) {
      var stats = deptStats[dept];
      var lateRate = stats.total ? Math.round((stats.late / stats.total) * 100) : 0;
      if (lateRate > 30) {
        insights.push({
          type: 'insight',
          category: 'department',
          icon: '🏢',
          title: 'Department Lateness Alert',
          message: dept + ' department has a ' + lateRate + '% lateness rate this month. Average delay: ' + Math.round(stats.totalDelay / stats.late) + ' min. Consider reviewing shift timings.',
          severity: 'high',
          metric: lateRate
        });
      }
    });

    return insights;
  },

  // Analyze leave patterns
  analyzeLeaves: function (leaves, employees) {
    var insights = [];
    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();

    // Detect leave clustering (many employees requesting leave at the same time)
    var monthlyLeaves = {};
    leaves.forEach(function (l) {
      var key = l.start_date ? l.start_date.substring(0, 7) : '';
      if (!monthlyLeaves[key]) monthlyLeaves[key] = [];
      monthlyLeaves[key].push(l);
    });

    Object.keys(monthlyLeaves).forEach(function (month) {
      if (monthlyLeaves[month].length > 5) {
        insights.push({
          type: 'insight',
          category: 'leaves',
          icon: '📅',
          title: 'Leave Cluster Detected',
          message: monthlyLeaves[month].length + ' leave requests in ' + month + '. This may impact productivity. Plan workforce accordingly.',
          severity: 'medium',
          metric: monthlyLeaves[month].length
        });
      }
    });

    // Detect employees with too many pending requests
    var pendingByEmployee = {};
    leaves.filter(function (l) { return l.status === 'pending'; }).forEach(function (l) {
      pendingByEmployee[l.employee_name] = (pendingByEmployee[l.employee_name] || 0) + 1;
    });

    Object.keys(pendingByEmployee).forEach(function (name) {
      if (pendingByEmployee[name] >= 3) {
        insights.push({
          type: 'warning',
          category: 'leaves',
          icon: '⚡',
          title: 'Multiple Pending Requests',
          message: name + ' has ' + pendingByEmployee[name] + ' pending leave requests. Quick decisions needed to avoid employee frustration.',
          severity: 'medium',
          employee: name,
          metric: pendingByEmployee[name]
        });
      }
    });

    return insights;
  },

  // Analyze payroll and detect anomalies
  analyzePayroll: function (payroll, employees) {
    var insights = [];

    // Detect salary outliers within departments
    var deptSalaries = {};
    payroll.forEach(function (p) {
      if (!deptSalaries[p.department]) deptSalaries[p.department] = [];
      deptSalaries[p.department].push({ name: p.employee_name, salary: p.net_salary });
    });

    Object.keys(deptSalaries).forEach(function (dept) {
      var salaries = deptSalaries[dept].map(function (s) { return s.salary; });
      if (salaries.length < 2) return;
      var avg = salaries.reduce(function (s, v) { return s + v; }, 0) / salaries.length;
      var stdDev = Math.sqrt(salaries.reduce(function (s, v) { return s + Math.pow(v - avg, 2); }, 0) / salaries.length);

      deptSalaries[dept].forEach(function (entry) {
        if (Math.abs(entry.salary - avg) > 2 * stdDev && stdDev > 500) {
          insights.push({
            type: entry.salary > avg ? 'insight' : 'warning',
            category: 'payroll',
            icon: '💰',
            title: 'Salary Outlier Detected',
            message: entry.name + ' in ' + dept + ' has a net salary (EGP ' + entry.salary.toLocaleString() + ') that is ' + (entry.salary > avg ? 'significantly above' : 'significantly below') + ' the department average (EGP ' + Math.round(avg).toLocaleString() + ').',
            severity: 'medium',
            employee: entry.name,
            metric: entry.salary
          });
        }
      });
    });

    // Detect unpaid salaries
    var processingCount = payroll.filter(function (p) { return p.status === 'processing'; }).length;
    if (processingCount > 3) {
      insights.push({
        type: 'alert',
        category: 'payroll',
        icon: '⏳',
        title: 'Unpaid Salaries Alert',
        message: processingCount + ' salaries are still in "processing" status. Delayed payments may cause employee dissatisfaction.',
        severity: 'critical',
        metric: processingCount
      });
    }

    return insights;
  },

  // Analyze overtime patterns
  analyzeOvertime: function (overtime) {
    var insights = [];

    var byEmployee = {};
    overtime.filter(function (o) { return o.status === 'approved'; }).forEach(function (o) {
      if (!byEmployee[o.employee_name]) byEmployee[o.employee_name] = { hours: 0, count: 0 };
      byEmployee[o.employee_name].hours += o.hours;
      byEmployee[o.employee_name].count++;
    });

    Object.keys(byEmployee).forEach(function (name) {
      if (byEmployee[name].hours > 40) {
        insights.push({
          type: 'warning',
          category: 'overtime',
          icon: '🔥',
          title: 'Excessive Overtime',
          message: name + ' has worked ' + byEmployee[name].hours + ' overtime hours (across ' + byEmployee[name].count + ' sessions). Risk of burnout. Consider workload redistribution.',
          severity: 'high',
          employee: name,
          metric: byEmployee[name].hours
        });
      }
    });

    return insights;
  },

  // Generate employee risk scores
  generateRiskScores: function (employees, attendance, leaves, payroll) {
    var scores = [];
    var now = new Date();
    var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    employees.forEach(function (emp) {
      var riskScore = 0;
      var factors = [];

      // Attendance risk
      var empAttendance = attendance.filter(function (a) { return a.employee_name === emp.full_name && new Date(a.date) >= thirtyDaysAgo; });
      var lateCount = empAttendance.filter(function (a) { return a.delay_minutes > 0; }).length;
      if (lateCount >= 5) { riskScore += 25; factors.push('Frequent lateness (' + lateCount + 'x)'); }
      if (empAttendance.length < 15) { riskScore += 20; factors.push('Low attendance (' + empAttendance.length + ' days)'); }

      // Leave risk
      var empLeaves = leaves.filter(function (l) { return l.employee_name === emp.full_name; });
      var recentLeaves = empLeaves.filter(function (l) { return new Date(l.created_at) >= thirtyDaysAgo; });
      if (recentLeaves.length >= 3) { riskScore += 15; factors.push('Excessive leave requests (' + recentLeaves.length + ')'); }

      // Insurance risk
      if (!emp.insurance_active) { riskScore += 10; factors.push('No insurance'); }

      // Document risk
      if (!emp.documents_complete) { riskScore += 10; factors.push('Incomplete documents'); }

      var riskLevel = riskScore >= 50 ? 'critical' : riskScore >= 30 ? 'high' : riskScore >= 15 ? 'medium' : 'low';

      scores.push({
        name: emp.full_name,
        department: emp.department,
        score: riskScore,
        level: riskLevel,
        factors: factors,
        avatar_color: emp.avatar_color || '#6366f1'
      });
    });

    return scores.sort(function (a, b) { return b.score - a.score; });
  },

  // Smart conversational responses
  processQuery: function (query, data) {
    var q = query.toLowerCase().trim();
    var response = { text: '', type: 'normal', suggestions: [] };

    // Greetings
    if (q.match(/^(hi|hello|hey|مرحبا|اهلا|سلام)/)) {
      response.text = "Hello! 👋 I'm the AI Mind of Smart Factory HR. I can analyze attendance patterns, detect risks, predict trends, and answer questions about your workforce. What would you like to know?";
      response.suggestions = ['Show me attendance insights', 'Who is at risk?', 'Department performance', 'Payroll anomalies'];
      return response;
    }

    // Attendance queries
    if (q.match(/(attendance|حضور|late|تأخير|absent|غياب)/)) {
      var totalRecords = data.attendance.length;
      var lateRecords = data.attendance.filter(function (a) { return a.delay_minutes > 0; });
      var lateRate = totalRecords ? Math.round((lateRecords.length / totalRecords) * 100) : 0;
      var avgDelay = lateRecords.length ? Math.round(lateRecords.reduce(function (s, a) { return s + a.delay_minutes; }, 0) / lateRecords.length) : 0;

      response.text = "📊 **Attendance Analysis**\n\n";
      response.text += "• Total records analyzed: **" + totalRecords + "**\n";
      response.text += "• Lateness rate: **" + lateRate + "%**\n";
      response.text += "• Average delay: **" + avgDelay + " minutes**\n";
      response.text += "• Late instances: **" + lateRecords.length + "** records\n\n";

      if (lateRate > 20) {
        response.text += "⚠️ The lateness rate is above 20%. I recommend reviewing shift schedules or implementing early-arrival incentives.";
        response.type = 'warning';
      } else {
        response.text += "✅ Attendance patterns look healthy. Keep monitoring for any sudden changes.";
        response.type = 'success';
      }
      response.suggestions = ['Show top late employees', 'Department breakdown', 'Risk assessment'];
      return response;
    }

    // Risk queries
    if (q.match(/(risk|خطر|problem|مشكل|issue|concern)/)) {
      var risks = AIMind.generateRiskScores(data.employees, data.attendance, data.leaves, data.payroll);
      var highRisk = risks.filter(function (r) { return r.level === 'critical' || r.level === 'high'; });

      response.text = "🔍 **Employee Risk Assessment**\n\n";
      if (highRisk.length === 0) {
        response.text += "✅ No high-risk employees detected. All metrics look stable!\n\n";
        response.type = 'success';
      } else {
        response.text += "⚠️ Found **" + highRisk.length + "** employees with elevated risk:\n\n";
        highRisk.slice(0, 5).forEach(function (r) {
          response.text += "• **" + r.name + "** (" + r.department + ") — Score: " + r.score + "/100\n";
          response.text += "  _Factors: " + r.factors.join(', ') + "_\n\n";
        });
        response.type = 'warning';
      }
      response.suggestions = ['Show all risks', 'Attendance trends', 'Suggest actions'];
      return response;
    }

    // Department queries
    if (q.match(/(department|قسم|team|فريق|performance|أداء)/)) {
      var deptInfo = {};
      data.employees.forEach(function (e) {
        if (!deptInfo[e.department]) deptInfo[e.department] = { count: 0, totalSalary: 0 };
        deptInfo[e.department].count++;
        deptInfo[e.department].totalSalary += (e.base_salary || 0);
      });

      response.text = "🏢 **Department Overview**\n\n";
      Object.keys(deptInfo).forEach(function (dept) {
        var info = deptInfo[dept];
        var avgSalary = Math.round(info.totalSalary / info.count);
        response.text += "**" + dept + "**\n";
        response.text += "  • Employees: " + info.count + "\n";
        response.text += "  • Avg Salary: EGP " + avgSalary.toLocaleString() + "\n\n";
      });
      response.suggestions = ['Best performing dept', 'Attendance by dept', 'Staffing recommendations'];
      return response;
    }

    // Payroll queries
    if (q.match(/(payroll|salary|راتب|رواتب|pay|مال|money)/)) {
      var totalPayroll = data.payroll.reduce(function (s, p) { return s + (p.net_salary || 0); }, 0);
      var avgSalary = data.payroll.length ? Math.round(totalPayroll / data.payroll.length) : 0;
      var pending = data.payroll.filter(function (p) { return p.status === 'processing'; }).length;

      response.text = "💰 **Payroll Intelligence**\n\n";
      response.text += "• Total payroll processed: **EGP " + totalPayroll.toLocaleString() + "**\n";
      response.text += "• Average salary: **EGP " + avgSalary.toLocaleString() + "**\n";
      response.text += "• Records: **" + data.payroll.length + "**\n";
      response.text += "• Pending payments: **" + pending + "**\n\n";

      if (pending > 0) {
        response.text += "⚡ There are " + pending + " salaries still in processing. Prioritize these to maintain employee satisfaction.";
        response.type = 'warning';
      }
      response.suggestions = ['Salary distribution', 'Overtime costs', 'Top earners'];
      return response;
    }

    // Employee count queries
    if (q.match(/(how many|عدد|count|employee|موظف)/)) {
      response.text = "👥 **Workforce Summary**\n\n";
      response.text += "• Total employees: **" + data.employees.length + "**\n";
      var byDept = {};
      data.employees.forEach(function (e) { byDept[e.department] = (byDept[e.department] || 0) + 1; });
      Object.keys(byDept).forEach(function (d) {
        response.text += "• " + d + ": **" + byDept[d] + "** employees\n";
      });
      response.suggestions = ['Department details', 'New hires', 'Employee risks'];
      return response;
    }

    // Suggestion/recommendation queries
    if (q.match(/(suggest|recommend|اقتراح|نصيحة|advice|improve|تحسين)/)) {
      response.text = "💡 **AI Recommendations**\n\n";
      var recommendations = [];

      var lateCount = data.attendance.filter(function (a) { return a.delay_minutes > 0; }).length;
      var totalAtt = data.attendance.length;
      if (totalAtt && (lateCount / totalAtt) > 0.15) {
        recommendations.push("🕐 Implement a flexible check-in window (e.g., 15-min grace period) to reduce recorded lateness while maintaining accountability.");
      }

      var noInsurance = data.employees.filter(function (e) { return !e.insurance_active; }).length;
      if (noInsurance > 0) {
        recommendations.push("🛡️ " + noInsurance + " employees lack insurance. Consider enrolling them to improve retention and compliance.");
      }

      var incompleteDocs = data.employees.filter(function (e) { return !e.documents_complete; }).length;
      if (incompleteDocs > 0) {
        recommendations.push("📋 " + incompleteDocs + " employees have incomplete documents. Set a deadline for submission.");
      }

      var pendingLeaves = data.leaves.filter(function (l) { return l.status === 'pending'; }).length;
      if (pendingLeaves > 3) {
        recommendations.push("📅 " + pendingLeaves + " leave requests are pending. Quick processing improves employee trust.");
      }

      if (recommendations.length === 0) {
        recommendations.push("✅ Your HR operations are running smoothly! Keep monitoring the analytics dashboard for any emerging patterns.");
      }

      recommendations.forEach(function (r, i) {
        response.text += (i + 1) + ". " + r + "\n\n";
      });
      response.type = 'success';
      response.suggestions = ['Implement suggestion #1', 'Risk report', 'Department analysis'];
      return response;
    }

    // Fallback / generic
    response.text = "🧠 I understand you're asking about **\"" + query + "\"**. Here are some things I can help with:\n\n";
    response.text += "• 📊 **Attendance Analysis** — patterns, lateness, absences\n";
    response.text += "• 🔍 **Risk Assessment** — employee risk scoring\n";
    response.text += "• 🏢 **Department Performance** — team comparisons\n";
    response.text += "• 💰 **Payroll Intelligence** — salary analytics\n";
    response.text += "• 💡 **Recommendations** — AI-powered suggestions\n\n";
    response.text += "Try asking me something specific!";
    response.suggestions = ['Show attendance insights', 'Who is at risk?', 'Recommend improvements', 'Payroll overview'];
    return response;
  },

  // Generate all insights at once
  runFullAnalysis: function (data) {
    var allInsights = [];
    allInsights = allInsights.concat(AIMind.analyzeAttendance(data.attendance, data.employees));
    allInsights = allInsights.concat(AIMind.analyzeLeaves(data.leaves, data.employees));
    allInsights = allInsights.concat(AIMind.analyzePayroll(data.payroll, data.employees));
    allInsights = allInsights.concat(AIMind.analyzeOvertime(data.overtime));

    // Sort by severity
    var severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allInsights.sort(function (a, b) { return (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3); });

    return allInsights;
  }
};
