// =============================================
// ERP Push Notifications + Facebook Lead Integration
// =============================================

var ERPNotifications = {

  // Browser Push Permission
  requestPermission: function() {
    if (!('Notification' in window)) { showToast('المتصفح لا يدعم الإشعارات','error'); return; }
    Notification.requestPermission().then(function(perm) {
      if (perm === 'granted') {
        showToast('تم تفعيل الإشعارات ✅','success');
        ERPNotifications.saveToken();
      }
    });
  },

  saveToken: function() {
    if (!App.user) return;
    sbClient.from('users').update({ push_token: 'browser_' + navigator.userAgent.substring(0,50) })
      .eq('id', App.user.id).then(function(){});
  },

  // Send browser notification
  send: function(title, body, pageId) {
    if (Notification.permission === 'granted') {
      var n = new Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%236366f1"/><text x="50" y="72" font-size="60" text-anchor="middle" fill="white">🏭</text></svg>',
        badge: '🏭',
        tag: pageId || 'erp-notification'
      });
      n.onclick = function() { window.focus(); if (pageId) App.navigate(pageId); n.close(); };
      setTimeout(function() { n.close(); }, 8000);
    }
  },

  // Poll for new notifications
  startPolling: function() {
    if (!App.user) return;
    setInterval(function() {
      sbClient.from('notifications').select('*')
        .eq('user_id', App.user.id).eq('is_read', false).eq('push_sent', false)
        .order('created_at', { ascending: false }).limit(5)
        .then(function(r) {
          (r.data || []).forEach(function(n) {
            ERPNotifications.send(n.title || 'إشعار جديد', n.message || '', n.link_page);
            sbClient.from('notifications').update({ push_sent: true }).eq('id', n.id).then(function(){});
          });
        });
    }, 30000); // every 30 seconds
  },

  // Realtime subscription
  subscribeRealtime: function() {
    if (!App.user || !sbClient.channel) return;
    try {
      sbClient.channel('notifications-' + App.user.id)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: 'user_id=eq.' + App.user.id
        }, function(payload) {
          var n = payload.new;
          ERPNotifications.send(n.title || 'إشعار جديد', n.message || '', n.link_page);
          // Update badge
          var badge = document.querySelector('.notif-badge');
          if (badge) { var c = parseInt(badge.textContent||'0'); badge.textContent = c + 1; badge.style.display = 'flex'; }
        })
        .subscribe();
    } catch(e) { console.log('Realtime not available:', e); }
  },

  // Render notification settings page
  renderSettings: function() {
    var perm = ('Notification' in window) ? Notification.permission : 'unsupported';
    var statusMap = { granted: '✅ مفعّل', denied: '❌ مرفوض', default: '⏳ لم يتم التفعيل', unsupported: '⚠️ غير مدعوم' };
    
    var css = '<style>.tswitch { position: relative; display: inline-block; width: 44px; height: 24px; } .tswitch input { opacity: 0; width: 0; height: 0; } .tslider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; } .tslider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; } input:checked + .tslider { background-color: #10b981; } input:checked + .tslider:before { transform: translateX(20px); }</style>';
    
    var html = css + '<div class="page-header"><h2>🔔 Notification Settings (إعدادات الإشعارات)</h2></div>';
    html += '<div class="card" style="max-width:600px"><div class="card-body">';
    html += '<div class="form-group"><label>حالة الإشعارات</label><p style="font-size:18px">'+statusMap[perm]+'</p></div>';
    if (perm !== 'granted') {
      html += '<button class="btn btn-primary" onclick="ERPNotifications.requestPermission()">🔔 تفعيل الإشعارات</button>';
    }
    html += '<hr style="margin:20px 0"><h4>قنوات الإشعارات</h4>';
    var channels = [
      { id: 'hr', label: 'الموارد البشرية', desc: 'إجازات، حضور، رواتب' },
      { id: 'production', label: 'الإنتاج', desc: 'أوامر إنتاج، مراحل، جودة' },
      { id: 'finance', label: 'المالية', desc: 'مشتريات، تسويات، تحويلات' },
      { id: 'maintenance', label: 'الصيانة', desc: 'طلبات صيانة، زيارات' },
      { id: 'system', label: 'النظام', desc: 'تحديثات، أمان، تنبيهات' },
    ];
    channels.forEach(function(ch) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border-color)">';
      html += '<div><strong>'+ch.label+'</strong><br><small class="text-muted">'+ch.desc+'</small></div>';
      html += '<label class="tswitch"><input type="checkbox" checked id="ch-'+ch.id+'"><span class="tslider"></span></label>';
      html += '</div>';
    });
    html += '</div></div>';
    document.getElementById('page-content').innerHTML = html;
  }
};

// =============================================
// Facebook / Meta Lead Integration
// =============================================
var ERPFacebookLeads = {

  render: function() {
    var html = '<div class="page-header"><h2>📘 Facebook Lead Integration</h2>';
    html += '<button class="btn btn-primary" onclick="ERPFacebookLeads.syncLeads()">🔄 Sync Leads</button></div>';

    html += '<div class="card" style="margin-bottom:20px"><div class="card-body">';
    html += '<h4>⚙️ إعداد Meta API</h4>';
    html += '<div class="form-group"><label>Page Access Token</label>';
    html += '<input class="form-input" id="fb-token" placeholder="EAA..." value="'+(localStorage.getItem('fb_token')||'')+'"></div>';
    html += '<div class="form-group"><label>Page ID</label>';
    html += '<input class="form-input" id="fb-page-id" placeholder="123456789" value="'+(localStorage.getItem('fb_page_id')||'')+'"></div>';
    html += '<button class="btn btn-outline" onclick="ERPFacebookLeads.saveConfig()">💾 حفظ الإعداد</button>';
    html += '</div></div>';

    html += '<div id="fb-leads-list"><div class="empty-state">اضغط "Sync Leads" لجلب العملاء المحتملين</div></div>';
    document.getElementById('page-content').innerHTML = html;
    ERPFacebookLeads.loadLocal();
  },

  saveConfig: function() {
    localStorage.setItem('fb_token', document.getElementById('fb-token').value);
    localStorage.setItem('fb_page_id', document.getElementById('fb-page-id').value);
    showToast('تم حفظ إعدادات Meta API ✅','success');
  },

  syncLeads: function() {
    var token = localStorage.getItem('fb_token');
    var pageId = localStorage.getItem('fb_page_id');
    if (!token || !pageId) { showToast('أدخل Page Access Token و Page ID أولاً','error'); return; }

    var el = document.getElementById('fb-leads-list');
    el.innerHTML = '<div class="loading">جاري جلب العملاء من Facebook...</div>';

    // Fetch leads from Meta Graph API
    fetch('https://graph.facebook.com/v18.0/'+pageId+'/leadgen_forms?access_token='+token)
      .then(function(r) { return r.json(); })
      .then(function(forms) {
        if (forms.error) { el.innerHTML = '<div class="empty-state">خطأ: '+forms.error.message+'</div>'; return; }
        var formIds = (forms.data||[]).map(function(f){ return f.id; });
        if (!formIds.length) { el.innerHTML = '<div class="empty-state">لا توجد نماذج Lead Ads</div>'; return; }

        // Fetch leads from first form
        fetch('https://graph.facebook.com/v18.0/'+formIds[0]+'/leads?access_token='+token)
          .then(function(r) { return r.json(); })
          .then(function(leads) {
            var items = leads.data || [];
            if (!items.length) { el.innerHTML = '<div class="empty-state">لا توجد عملاء محتملين جدد</div>'; return; }

            // Save to clients table
            var saved = 0;
            items.forEach(function(lead) {
              var fields = {};
              (lead.field_data||[]).forEach(function(f) { fields[f.name] = f.values[0]; });
              sbClient.from('clients').upsert({
                name: fields.full_name || fields.first_name || 'Facebook Lead',
                email: fields.email || '',
                phone: fields.phone_number || '',
                source: 'facebook',
                notes: 'Lead ID: '+lead.id+' | Form: '+formIds[0]
              }, { onConflict: 'email' }).then(function() { saved++; });
            });

            // Display leads
            var html = '<h4 style="margin-bottom:12px">📋 '+items.length+' عميل محتمل من Facebook</h4>';
            html += '<table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>التاريخ</th><th>الحالة</th></tr></thead><tbody>';
            items.forEach(function(lead) {
              var fields = {};
              (lead.field_data||[]).forEach(function(f) { fields[f.name] = f.values[0]; });
              html += '<tr><td>'+(fields.full_name||fields.first_name||'—')+'</td>';
              html += '<td>'+(fields.email||'—')+'</td>';
              html += '<td>'+(fields.phone_number||'—')+'</td>';
              html += '<td>'+new Date(lead.created_time).toLocaleDateString('ar-EG')+'</td>';
              html += '<td><span class="badge badge-success">تم الحفظ</span></td></tr>';
            });
            html += '</tbody></table>';
            el.innerHTML = html;
            showToast('تم جلب وحفظ '+items.length+' عميل ✅','success');

            // Save locally for offline access
            localStorage.setItem('fb_leads_cache', JSON.stringify(items));
          });
      })
      .catch(function(e) {
        el.innerHTML = '<div class="empty-state">خطأ في الاتصال: '+e.message+'</div>';
      });
  },

  loadLocal: function() {
    var cached = localStorage.getItem('fb_leads_cache');
    if (!cached) return;
    var items = JSON.parse(cached);
    var el = document.getElementById('fb-leads-list');
    var html = '<h4 style="margin-bottom:12px">📋 '+items.length+' عميل محتمل (محفوظ محلياً)</h4>';
    html += '<table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>الهاتف</th><th>التاريخ</th></tr></thead><tbody>';
    items.forEach(function(lead) {
      var fields = {};
      (lead.field_data||[]).forEach(function(f) { fields[f.name] = f.values[0]; });
      html += '<tr><td>'+(fields.full_name||'—')+'</td><td>'+(fields.email||'—')+'</td>';
      html += '<td>'+(fields.phone_number||'—')+'</td><td>'+new Date(lead.created_time).toLocaleDateString('ar-EG')+'</td></tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }
};

// =============================================
// Supabase Storage Bucket Auto-Setup
// =============================================
var ERPStorageSetup = {
  ensureBucket: function() {
    sbClient.storage.listBuckets().then(function(r) {
      var buckets = (r.data||[]).map(function(b){ return b.name; });
      if (buckets.indexOf('attachments') === -1) {
        sbClient.storage.createBucket('attachments', { public: true }).then(function(r2) {
          if (!r2.error) console.log('✅ Storage bucket "attachments" created');
          else console.log('Storage bucket error:', r2.error.message);
        });
      }
    });
  }
};

// Auto-init
if (typeof window !== 'undefined') {
  window.ERPNotifications = ERPNotifications;
  window.ERPFacebookLeads = ERPFacebookLeads;
  window.ERPStorageSetup = ERPStorageSetup;

  // Auto-setup on load
  setTimeout(function() {
    if (typeof sbClient !== 'undefined') {
      ERPStorageSetup.ensureBucket();
      if (typeof App !== 'undefined' && App.user) {
        ERPNotifications.requestPermission();
        ERPNotifications.startPolling();
        ERPNotifications.subscribeRealtime();
      }
    }
  }, 3000);
}
