// =============================================
// AI REPORT GENERATOR — Monthly/Semi/Annual/Custom
// Generates and stores reports in ai_reports table
// =============================================
window.AIReportGenerator = {

  /**
   * Generate a monthly report
   * @param {number} year
   * @param {number} month - 1-12
   * @param {function} cb
   */
  generateMonthly: function(year, month, cb) {
    var from = new Date(year, month - 1, 1);
    var to = new Date(year, month, 0); // last day
    var monthNames = ['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var monthNamesEn = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar' ? 'تقرير شهر ' + monthNames[month] + ' ' + year : monthNamesEn[month] + ' ' + year + ' Report';
    var period = monthNamesEn[month].toLowerCase() + '-' + year;

    AIAnalyticsEngine.analyze(from, to, function(analysis) {
      var record = {
        report_type: 'monthly',
        period: period,
        title: title,
        content: analysis,
        summary: (analysis.executive_summary && analysis.executive_summary[lang]) || '',
        generated_by: App.user.id,
        generated_by_name: App.user.full_name,
        report_year: year,
        report_month: month,
        from_date: from.toISOString().slice(0,10),
        to_date: to.toISOString().slice(0,10),
        language: lang,
        status: 'generated'
      };

      sbClient.from('ai_reports').upsert(record, {onConflict:'report_type,period,report_year'}).then(function(res) {
        if(res.error) { console.error('Report save error:', res.error); if(cb) cb(null, res.error); return; }
        if(cb) cb(record);
      });
    });
  },

  /**
   * Generate a semiannual report
   * @param {number} year
   * @param {number} half - 1 (Jan-Jun) or 2 (Jul-Dec)
   * @param {function} cb
   */
  generateSemiannual: function(year, half, cb) {
    var from = half === 1 ? new Date(year, 0, 1) : new Date(year, 6, 1);
    var to = half === 1 ? new Date(year, 5, 30) : new Date(year, 11, 31);
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar'
      ? 'تقرير النصف ' + (half === 1 ? 'الأول' : 'الثاني') + ' ' + year
      : (half === 1 ? 'First' : 'Second') + ' Half ' + year + ' Report';
    var period = 'h' + half + '-' + year;

    AIAnalyticsEngine.analyze(from, to, function(analysis) {
      var record = {
        report_type: 'semiannual', period: period, title: title, content: analysis,
        summary: (analysis.executive_summary && analysis.executive_summary[lang]) || '',
        generated_by: App.user.id, generated_by_name: App.user.full_name,
        report_year: year, report_half: half,
        from_date: from.toISOString().slice(0,10), to_date: to.toISOString().slice(0,10),
        language: lang, status: 'generated'
      };
      sbClient.from('ai_reports').upsert(record, {onConflict:'report_type,period,report_year'}).then(function(res) {
        if(res.error) { if(cb) cb(null, res.error); return; }
        if(cb) cb(record);
      });
    });
  },

  /**
   * Generate annual report
   */
  generateAnnual: function(year, cb) {
    var from = new Date(year, 0, 1);
    var to = new Date(year, 11, 31);
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar' ? 'التقرير السنوي ' + year : 'Annual Report ' + year;

    AIAnalyticsEngine.analyze(from, to, function(analysis) {
      var record = {
        report_type: 'annual', period: 'annual-' + year, title: title, content: analysis,
        summary: (analysis.executive_summary && analysis.executive_summary[lang]) || '',
        generated_by: App.user.id, generated_by_name: App.user.full_name,
        report_year: year,
        from_date: from.toISOString().slice(0,10), to_date: to.toISOString().slice(0,10),
        language: lang, status: 'generated'
      };
      sbClient.from('ai_reports').upsert(record, {onConflict:'report_type,period,report_year'}).then(function(res) {
        if(res.error) { if(cb) cb(null, res.error); return; }
        if(cb) cb(record);
      });
    });
  },

  /**
   * Generate custom range report
   */
  generateCustom: function(fromDate, toDate, cb) {
    var lang = (App.user && App.user.preferred_language === 'en') ? 'en' : 'ar';
    var title = lang === 'ar'
      ? 'تقرير مخصص: ' + fromDate.toISOString().slice(0,10) + ' إلى ' + toDate.toISOString().slice(0,10)
      : 'Custom Report: ' + fromDate.toISOString().slice(0,10) + ' to ' + toDate.toISOString().slice(0,10);
    var period = 'custom-' + Date.now();

    AIAnalyticsEngine.analyze(fromDate, toDate, function(analysis) {
      var record = {
        report_type: 'custom', period: period, title: title, content: analysis,
        summary: (analysis.executive_summary && analysis.executive_summary[lang]) || '',
        generated_by: App.user.id, generated_by_name: App.user.full_name,
        report_year: fromDate.getFullYear(),
        from_date: fromDate.toISOString().slice(0,10), to_date: toDate.toISOString().slice(0,10),
        language: lang, status: 'generated'
      };
      sbClient.from('ai_reports').insert(record).then(function(res) {
        if(res.error) { if(cb) cb(null, res.error); return; }
        if(cb) cb(record);
      });
    });
  },

  /**
   * Check and auto-generate missing reports on owner login
   */
  autoGenerate: function() {
    if(!App.user || !App.isOwner()) return;
    var now = new Date();
    var lastMonth = now.getMonth(); // 0-indexed, so this IS last month if today is start of new month
    var lastMonthYear = now.getFullYear();
    if(lastMonth === 0) { lastMonth = 12; lastMonthYear--; }

    // Check if last month's report exists
    var monthNames = ['','january','february','march','april','may','june','july','august','september','october','november','december'];
    var period = monthNames[lastMonth] + '-' + lastMonthYear;

    sbClient.from('ai_reports').select('id').eq('report_type','monthly').eq('period',period).then(function(res) {
      if(!res.data || res.data.length === 0) {
        console.log('[AIReports] Auto-generating monthly report for', period);
        AIReportGenerator.generateMonthly(lastMonthYear, lastMonth, function(r) {
          if(r) console.log('[AIReports] Monthly report auto-generated');
        });
      }
    });
  },

  /**
   * Fetch report history
   */
  getHistory: function(cb) {
    sbClient.from('ai_reports').select('id,report_type,period,title,report_year,report_month,report_half,from_date,to_date,status,language,generated_by_name,created_at')
      .order('created_at', {ascending: false}).limit(50)
      .then(function(res) { if(cb) cb(res.data || []); });
  }
};
