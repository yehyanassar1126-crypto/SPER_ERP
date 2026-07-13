// ===== ENTERPRISE SECURITY HELPERS =====
// Password hashing, session management, activity logging

window.SecurityHelpers = {

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
    sbClient.from('role_permissions')
      .select('*, permissions(*)')
      .eq('role', App.user.role)
      .eq('granted', true)
      .then(function(res) {
        if (res.data) {
          SecurityHelpers._cachedPermissions = res.data.map(function(rp) {
            return {
              module: rp.permissions.module,
              action: rp.permissions.action,
              granted: rp.granted
            };
          });
        }
      });
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
