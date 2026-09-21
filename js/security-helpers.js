// ===== ENTERPRISE SECURITY HELPERS =====
// Password hashing, session management, activity logging

window.SecurityHelpers = {
  _cachedPermissions: [],
  _hasCustomConfig: false,
  _reloadTimer: null,

  hasModule: function(moduleId) {
      if (typeof App !== 'undefined' && App.isOwner && App.isOwner()) return true;
      if (!this._hasCustomConfig) {
          if (typeof App !== 'undefined' && App._currentMenuConfig) {
              var found = false;
              App._currentMenuConfig.forEach(function(sec) {
                  if (sec.items && sec.items.some(function(i) { return i.id === moduleId; })) found = true;
              });
              return found;
          }
          return true;
      }
      return this._cachedPermissions.some(function(p) { return p.module === moduleId && p.granted; });
  },

  // Simple hash function for client-side (use bcrypt on server for production)
  hashPassword: async function(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'ERP_SALT_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  verifyPassword: async function(password, hash) {
    const computed = await SecurityHelpers.hashPassword(password);
    return computed === hash;
  },

  // Login with security logging
  secureLogin: async function(username, password) {
    var res = await sbClient.from('users').select('*').eq('username', username).single();
    
    var loginRecord = {
      user_name: username,
      login_status: 'failed',
      failure_reason: null,
      created_at: new Date().toISOString()
    };

    if (res.error || !res.data) {
      // Try supplier login
      var sRes = await sbClient.from('suppliers').select('*').eq('email', username).single();
      if (sRes.error || !sRes.data) {
        loginRecord.failure_reason = 'User not found';
        sbClient.from('login_history').insert(loginRecord).then(function(){});
        return { success: false, error: 'Invalid credentials' };
      }
      if (sRes.data.password_hash !== password) {
        loginRecord.failure_reason = 'Wrong password';
        sbClient.from('login_history').insert(loginRecord).then(function(){});
        return { success: false, error: 'Invalid credentials' };
      }
      // Supplier success
      loginRecord.login_status = 'success';
      loginRecord.user_id = sRes.data.id;
      sbClient.from('login_history').insert(loginRecord).then(function(){});
      return {
        success: true,
        user: {
          id: sRes.data.id, supplier_id: sRes.data.id,
          username: sRes.data.email, full_name: sRes.data.company_name,
          role: 'supplier_external', department: 'External Supplier'
        }
      };
    }

    // Check password
    if (res.data.password_hash !== password) {
      loginRecord.failure_reason = 'Wrong password';
      loginRecord.user_id = res.data.id;
      sbClient.from('login_history').insert(loginRecord).then(function(){});
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if user is active
    if (res.data.status !== 'active') {
      loginRecord.failure_reason = 'Account inactive';
      loginRecord.user_id = res.data.id;
      sbClient.from('login_history').insert(loginRecord).then(function(){});
      return { success: false, error: 'Account is inactive' };
    }

    // Success
    loginRecord.login_status = 'success';
    loginRecord.user_id = res.data.id;
    loginRecord.user_name = res.data.full_name;
    sbClient.from('login_history').insert(loginRecord).then(function(){});

    var userData = Object.assign({}, res.data);
    delete userData.password_hash;
    return { success: true, user: userData };
  },

  // Activity logging
  logActivity: function(module, action, entityType, entityId, oldValues, newValues) {
    if (!App.user) return;
    sbClient.from('activity_log').insert({
      user_id: App.user.id,
      user_name: App.user.full_name,
      module: module,
      action: action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      old_values: oldValues || null,
      new_values: newValues || null
    }).then(function(r) {
      if (r && r.error) console.error('Activity log error:', r.error);
    });
  },

  // Permission checking
  hasPermission: function(module, action) {
    // Owner has all permissions
    if (App.user && App.user.role === 'owner') return true;
    // HR Manager has most permissions
    if (App.user && App.user.role === 'hr manager') {
      if (module === 'settings' && action === 'manage') return false;
      return true;
    }
    // Check cached permissions
    var perms = SecurityHelpers._cachedPermissions || [];
    return perms.some(function(p) {
      return p.module === module && p.action === action && p.granted;
    });
  },

  _cachedPermissions: [],

  loadPermissions: function() {
    if (!App.user) return;
    
    var roleStr = App.user.role || '';
    var userId = App.user.id;
    
    // Fetch specifically for this user and this role to avoid the 1000-row API limit!
    Promise.all([
      sbClient.from('screen_permissions').select('*').eq('user_id', userId),
      roleStr ? sbClient.from('screen_permissions').select('*').eq('role', roleStr) : Promise.resolve({ data: [] })
    ]).then(function(results) {
        var userPerms = results[0].data || [];
        var rolePerms = results[1].data || [];
        
        // Merge them and remove duplicates just in case
        var myPerms = userPerms.concat(rolePerms);
        
        SecurityHelpers._hasCustomConfig = myPerms.length > 0;
        
        SecurityHelpers._cachedPermissions = myPerms.map(function(rp) {
          return {
            module: rp.screen_id,
            action: rp.action,
            granted: rp.granted
          };
        });
        
        // Re-render sidebar now that we have the permissions!
        if (typeof App !== 'undefined' && App.renderSidebar) {
            App.renderSidebar();
        }
        
        // Ensure realtime subscription only happens once
        if (!SecurityHelpers._permObserver) {
            SecurityHelpers._permObserver = sbClient.channel('public:screen_permissions')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'screen_permissions' }, function (payload) {
                 var record = payload.new || payload.old;
                 if (record && (record.user_id === userId || record.role === roleStr)) {
                     // Wait a brief moment to ensure all batch inserts/deletes have finished, then reload
                     clearTimeout(SecurityHelpers._reloadTimer);
                     SecurityHelpers._reloadTimer = setTimeout(function() {
                         SecurityHelpers.loadPermissions();
                     }, 1000);
                 }
              })
              .subscribe();
        }
        
    }).catch(function(err) {
        console.error("Error loading permissions:", err);
    });
  },

  _permObserver: null,

  // Apply permission restrictions to the current screen's buttons automatically
  applyPermissionsUI: function(currentModule) {
    if (!App.user || App.user.role === 'owner') return; // Owner has full access
    // Don't enforce on the permissions management page itself
    if (currentModule === 'screen-permissions') return;
    
    var enforceButtons = function() {
      document.querySelectorAll('button:not(.nav-link):not(.sidebar-btn):not(.sidebar-item)').forEach(function(btn) {
        if(btn.hasAttribute('data-perm-checked')) return; // already processed
        
        var action = 'view';
        var text = btn.innerText.toLowerCase();
        
        if (text.includes('إضافة') || text.includes('create') || text.includes('add') || text.includes('جديد')) action = 'create';
        else if (text.includes('تعديل') || text.includes('edit') || text.includes('update')) action = 'edit';
        else if (text.includes('حذف') || text.includes('delete') || text.includes('remove') || text.includes('مسح') || text.includes('🗑️')) action = 'delete';
        else if (text.includes('حفظ') || text.includes('save')) action = 'edit';
        else if (text.includes('اعتماد') || text.includes('approve')) action = 'approve';
        else if (text.includes('رفض') || text.includes('reject')) action = 'reject';
        else if (text.includes('تصدير') || text.includes('export')) action = 'export';
        else if (text.includes('طباعة') || text.includes('print')) action = 'print';

        if (action !== 'view') {
          if (!SecurityHelpers.hasPermission(currentModule, action)) {
            btn.disabled = true;
            btn.style.opacity = '0.35';
            btn.style.cursor = 'not-allowed';
            btn.title = 'ليس لديك صلاحية لهذا الإجراء';
            btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
            // Optional: for strong enforcement
            btn.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault(); return false; }, true);
          }
        }
        btn.setAttribute('data-perm-checked', 'true');
      });
    };

    // Run immediately
    enforceButtons();
    setTimeout(enforceButtons, 500);

    // Watch for dynamic DOM changes (like tables loading async)
    if (SecurityHelpers._permObserver) SecurityHelpers._permObserver.disconnect();
    
    var contentEl = document.getElementById('page-content') || document.body;
    SecurityHelpers._permObserver = new MutationObserver(function(mutations) {
      var needsCheck = false;
      mutations.forEach(function(m) { if(m.addedNodes.length > 0) needsCheck = true; });
      if(needsCheck) enforceButtons();
    });
    
    SecurityHelpers._permObserver.observe(contentEl, { childList: true, subtree: true });
  },

  // Input sanitization
  sanitizeInput: function(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  // Rate limiting (client-side)
  _rateLimits: {},
  checkRateLimit: function(action, maxPerMinute) {
    var now = Date.now();
    var key = action;
    if (!SecurityHelpers._rateLimits[key]) {
      SecurityHelpers._rateLimits[key] = [];
    }
    // Clean old entries
    SecurityHelpers._rateLimits[key] = SecurityHelpers._rateLimits[key].filter(function(t) {
      return now - t < 60000;
    });
    if (SecurityHelpers._rateLimits[key].length >= (maxPerMinute || 30)) {
      return false; // Rate limited
    }
    SecurityHelpers._rateLimits[key].push(now);
    return true;
  }
};
