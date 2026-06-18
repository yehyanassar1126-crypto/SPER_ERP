import re

with open("js/app.js", "r", encoding="utf-8") as f:
    content = f.read()

# ---- 1. Fix all old qr-checkin references pointing to scan-checkin ----
content = content.replace("navigate(\\'qr-checkin\\')", "navigate(\\'scan-checkin\\')")
content = content.replace('navigate("qr-checkin")', 'navigate("scan-checkin")')
content = content.replace("navigate('qr-checkin')", "navigate('scan-checkin')")

# ---- 2. Fix the hrDashboard check-in button (line 910 area) ----
# Already handled by replace above

# ---- 3. Inject personal HR section AFTER the hrDashboard renders (before the closing }); of the promise) ----
# We look for the spot right before `el.innerHTML = html;` in hrDashboard
# Then after setting el.innerHTML we load personal data

personal_section = r"""
    // ===== PERSONAL HR SECTION =====
    // Fetch HR's own personal data and append below the admin dashboard
    (function loadHrPersonalSection() {
      var user = App.user;
      if (!user) return;
      
      var currentMonth = new Date().toISOString().substring(0, 7);
      var monthStart = currentMonth + '-01';
      var d2 = new Date();
      var lastDay2 = new Date(d2.getFullYear(), d2.getMonth() + 1, 0).getDate();
      var monthEnd = currentMonth + '-' + lastDay2;
      var dayOfMonth2 = d2.getDate();
      
      Promise.all([
        sbClient.from('attendance').select('*').eq('employee_id', user.id).eq('date', todayStr()).limit(1).single(),
        sbClient.from('attendance').select('id, date, delay_minutes').eq('employee_id', user.id).gte('date', monthStart).lte('date', monthEnd),
        sbClient.from('salary_adjustments').select('*').eq('employee_id', user.id).eq('status', 'approved').eq('month', currentMonth),
        sbClient.from('payroll').select('net_salary, month').eq('employee_id', user.id).order('month', { ascending: false }).limit(1).single()
      ]).then(function(res) {
        var todayAtt = res[0].data || null;
        var monthAtts = res[1].data || [];
        var adjustments = res[2].data || [];
        var latestPay = res[3].data || null;
        
        var baseSalary = user.base_salary || 0;
        var dailyRate = Math.round(baseSalary / 30);
        
        // Build earned so far
        var earnedSoFar = 0;
        var totalLateDeduction = 0;
        var totalBonuses = 0;
        var totalPenalties = 0;
        var attMap = {};
        
        monthAtts.forEach(function(att) {
          var dm = att.delay_minutes || 0;
          var lateDed = 0;
          if (dm > 360) lateDed = dailyRate;
          else if (dm > 120) lateDed = dailyRate * 0.5;
          else if (dm > 15) lateDed = dailyRate * 0.25;
          lateDed = Math.round(lateDed);
          var dayNet = Math.max(0, dailyRate - lateDed);
          earnedSoFar += dayNet;
          totalLateDeduction += lateDed;
          attMap[att.date] = { lateDed: lateDed, dayNet: dayNet };
        });
        
        // Count fridays
        var firstActiveDay = dayOfMonth2;
        if (monthAtts.length > 0) {
          monthAtts.forEach(function(att) {
            var dayNum = parseInt(att.date.split('-')[2], 10);
            if (dayNum < firstActiveDay) firstActiveDay = dayNum;
          });
        }
        var fridaysPassed = 0;
        for (var fd = 1; fd <= dayOfMonth2; fd++) {
          if (new Date(d2.getFullYear(), d2.getMonth(), fd).getDay() === 5) {
            if (fd >= firstActiveDay) { fridaysPassed++; earnedSoFar += dailyRate; }
          }
        }
        var daysWorked = monthAtts.length + fridaysPassed;
        
        adjustments.forEach(function(adj) {
          if (adj.type === 'bonus') totalBonuses += (adj.amount || 0);
          else totalPenalties += (adj.amount || 0);
        });
        
        var netAccumulated = earnedSoFar + totalBonuses - totalPenalties;
        var salaryPct = baseSalary > 0 ? Math.min(100, Math.round((earnedSoFar / baseSalary) * 100)) : 0;
        
        // Today check-in status
        var todayStatus = todayAtt ? (todayAtt.check_out ? '✅ مكتمل' : '🔵 مسجل حضور') : '⏳ لم يسجل بعد';
        var todayColor = todayAtt ? (todayAtt.check_out ? '#22c55e' : '#3b82f6') : '#f59e0b';
        
        var ph = '';
        
        // Section Header
        ph += '<div style="margin-top:36px;padding:0 0 16px;border-bottom:2px solid var(--border-color);display:flex;align-items:center;gap:12px;direction:rtl">';
        ph += '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#06b6d4);display:flex;align-items:center;justify-content:center">' + icon('user', 20) + '</div>';
        ph += '<div><h3 style="margin:0;font-size:1.15rem;font-weight:800">بياناتي الشخصية (HR Profile)</h3>';
        ph += '<p style="margin:0;font-size:0.8rem;color:var(--text-muted)">حضورك، مرتبك، وتأخيراتك — ' + user.full_name + '</p></div>';
        ph += '<div style="margin-right:auto;display:flex;gap:8px">';
        ph += '<button class="btn btn-sm btn-primary" onclick="App.navigate(\'scan-checkin\')">' + icon('logIn', 14) + ' حضور</button>';
        ph += '<button class="btn btn-sm btn-outline" onclick="App.navigate(\'scan-checkout\')">' + icon('logOut', 14) + ' انصراف</button>';
        ph += '</div></div>';
        
        // Today card + Salary card
        ph += '<div class="grid-2" style="margin-top:20px;margin-bottom:20px">';
        
        // Today attendance card
        ph += '<div class="card"><div class="card-header"><div><h3>حضور اليوم</h3><p>' + formatDate(new Date()) + '</p></div></div>';
        ph += '<div class="card-body">';
        if (todayAtt) {
          ph += '<div style="display:flex;flex-direction:column;gap:14px;direction:rtl">';
          ph += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted);font-size:0.82rem">وقت الحضور</span><span style="font-weight:600;color:#22c55e">' + formatTime(todayAtt.check_in) + '</span></div>';
          ph += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted);font-size:0.82rem">وقت الانصراف</span><span style="font-weight:600">' + (todayAtt.check_out ? formatTime(todayAtt.check_out) : '—') + '</span></div>';
          ph += '<div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted);font-size:0.82rem">ساعات العمل</span><span style="font-weight:600">' + (todayAtt.working_hours || 0) + 'h</span></div>';
          if (todayAtt.delay_minutes > 0) {
            ph += '<div style="display:flex;justify-content:space-between;padding:10px;background:rgba(245,158,11,0.08);border-radius:8px"><span style="color:#f59e0b;font-size:0.82rem">⚠️ تأخير</span><span style="font-weight:700;color:#f59e0b">' + formatDelay(todayAtt.delay_minutes) + '</span></div>';
          } else {
            ph += '<div style="padding:10px;background:rgba(34,197,94,0.08);border-radius:8px;text-align:center;color:#22c55e;font-weight:700">✅ في الميعاد</div>';
          }
          ph += '</div>';
        } else {
          ph += '<div style="text-align:center;padding:30px;color:var(--text-muted)">';
          ph += '<p style="margin-bottom:16px">لم تسجل حضورك اليوم</p>';
          ph += '<button class="btn btn-primary" onclick="App.navigate(\'scan-checkin\')">' + icon('logIn', 14) + ' سجّل حضورك الآن</button>';
          ph += '</div>';
        }
        ph += '</div></div>';
        
        // Salary accumulation card
        ph += '<div class="card"><div class="card-header"><div><h3>مرتبك التراكمي هذا الشهر</h3><p>يوم ' + dayOfMonth2 + ' — ' + daysWorked + ' يوم عمل</p></div></div>';
        ph += '<div class="card-body" style="direction:rtl">';
        ph += '<div style="text-align:center;margin-bottom:16px">';
        ph += '<div style="font-size:1.8rem;font-weight:900;color:var(--accent-primary)">EGP ' + earnedSoFar.toLocaleString() + '</div>';
        ph += '<div style="font-size:0.75rem;color:var(--text-muted)">من أصل ' + baseSalary.toLocaleString() + ' ج.م</div>';
        ph += '</div>';
        // Progress bar
        ph += '<div style="width:100%;height:10px;background:var(--bg-secondary);border-radius:5px;overflow:hidden;margin-bottom:8px">';
        ph += '<div style="width:' + salaryPct + '%;height:100%;background:linear-gradient(90deg,#6366f1,#06b6d4);border-radius:5px;transition:width 0.6s"></div>';
        ph += '</div>';
        ph += '<div style="text-align:center;font-size:0.75rem;color:var(--accent-primary);font-weight:700;margin-bottom:16px">' + salaryPct + '% من المرتب الكامل</div>';
        // Mini breakdown
        ph += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
        ph += '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;border-right:3px solid #06b6d4"><div style="font-size:0.68rem;color:var(--text-muted)">اليومية</div><div style="font-weight:800;color:#06b6d4">' + dailyRate.toLocaleString() + ' ج.م</div></div>';
        if (totalBonuses > 0) ph += '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;border-right:3px solid #22c55e"><div style="font-size:0.68rem;color:var(--text-muted)">مكافآت</div><div style="font-weight:800;color:#22c55e">+' + totalBonuses.toLocaleString() + '</div></div>';
        if (totalPenalties > 0) ph += '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;border-right:3px solid #ef4444"><div style="font-size:0.68rem;color:var(--text-muted)">جزاءات</div><div style="font-weight:800;color:#ef4444">-' + totalPenalties.toLocaleString() + '</div></div>';
        if (totalLateDeduction > 0) ph += '<div style="padding:10px;background:var(--bg-secondary);border-radius:8px;border-right:3px solid #f59e0b"><div style="font-size:0.68rem;color:var(--text-muted)">خصم تأخيرات</div><div style="font-weight:800;color:#f59e0b">' + totalLateDeduction.toLocaleString() + '</div></div>';
        ph += '</div>';
        if (latestPay) ph += '<div style="margin-top:12px;padding:10px;background:rgba(99,102,241,0.08);border-radius:8px;text-align:center;font-size:0.8rem;color:var(--text-muted)">آخر راتب مسلّم: <strong style="color:var(--text-primary)">' + latestPay.net_salary.toLocaleString() + ' ج.م (' + latestPay.month + ')</strong></div>';
        ph += '</div></div>';
        
        ph += '</div>'; // end grid-2
        
        // Quick links
        ph += '<div style="display:flex;flex-wrap:wrap;gap:10px;direction:rtl;margin-top:4px">';
        ph += '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'my-attendance\')">' + icon('calendarCheck', 14) + ' سجل حضوري</button>';
        ph += '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'my-leaves\')">' + icon('calendarDays', 14) + ' طلبات إجازتي</button>';
        ph += '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'my-salary\')">' + icon('dollarSign', 14) + ' كشف راتبي</button>';
        ph += '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'my-delays\')">' + icon('alertTriangle', 14) + ' تأخيراتي</button>';
        ph += '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'my-missions\')">' + icon('briefcase', 14) + ' مأمورياتي</button>';
        ph += '</div>';
        
        // Append to el
        var personalDiv = document.createElement('div');
        personalDiv.id = 'hr-personal-inline';
        personalDiv.innerHTML = ph;
        el.appendChild(personalDiv);
      });
    })();
"""

# Find the end of hrDashboard's promise .then and inject after el.innerHTML = html;
# The pattern to find is the el.innerHTML = html; inside hrDashboard (not empDashboard)
# hrDashboard sets el.innerHTML = html on line ~973 then closes with }); on ~989
old_pattern = "    el.innerHTML = html;\n\n    setTimeout(function () {"

new_pattern = "    el.innerHTML = html;\n" + personal_section + "\n    setTimeout(function () {"

# Only replace the FIRST occurrence (inside hrDashboard, before empDashboard)
content = content.replace(old_pattern, new_pattern, 1)

with open("js/app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Done! patched hrDashboard with personal section and fixed qr-checkin refs")
