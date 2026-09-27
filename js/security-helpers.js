// ===== ENTERPRISE SECURITY HELPERS =====
// Centralized authorization, password hashing, session management, activity logging & API Guard

window.SecurityHelpers = {
  _cachedPermissions: [],
  _userPerms: [],
  _rolePerms: [],
  _hasCustomConfig: false,
  _reloadTimer: null,
  _apiGuardInstalled: false,

  hasModule: function(moduleId) {
    if (typeof App !== 'undefined' && App.isOwner && App.isOwner()) return true;
    return SecurityHelpers.hasPermission(moduleId, 'view');
  },

  // Simple hash function for client-side
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

  // Permission checking - Centralized ACL Hierarchy (User Override > Role Default)
  hasPermission: function(module, action) {
    if (!App.user) return false;
    // Owner has all permissions
    if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;

    action = (action || 'view').toLowerCase();

    // Self-service screens: all authenticated users can view and create their own records
    var selfServiceScreens = [
      'dashboard', 'hr-personal', 'my-attendance', 'scan-checkin', 'scan-checkout',
      'my-leaves', 'my-salary', 'my-overtime', 'my-loans', 'my-medical',
      'my-delays', 'my-missions', 'my-expenses', 'complaints',
      'announcements', 'internal-chat', 'shift-swap', 'calendar', 'task-management'
    ];

    if (selfServiceScreens.indexOf(module) !== -1) {
      if (action === 'view' || action === 'create') return true;
    }

    // 1. Check USER-SPECIFIC override first (highest precedence)
    if (SecurityHelpers._userPerms && SecurityHelpers._userPerms.length > 0) {
      var uMatch = SecurityHelpers._userPerms.find(function(p) {
        return p.screen_id === module && p.action.toLowerCase() === action;
      });
      if (uMatch !== undefined) {
        return uMatch.granted === true;
      }
    }

    // 2. Check ROLE-SPECIFIC default
    if (SecurityHelpers._rolePerms && SecurityHelpers._rolePerms.length > 0) {
      var rMatch = SecurityHelpers._rolePerms.find(function(p) {
        return p.screen_id === module && p.action.toLowerCase() === action;
      });
      if (rMatch !== undefined) {
        return rMatch.granted === true;
      }
    }

    // 3. If custom permissions exist for this user or role, but this action wasn't granted:
    if (SecurityHelpers._hasCustomConfig) {
      return false;
    }

    // 4. Fallback legacy logic for initial setup when no custom permissions in DB
    var roleClean = (App.user.role || '').toLowerCase();
    if (['hr manager', 'hr'].indexOf(roleClean) !== -1) {
      if (['system-settings', 'owner-dashboard', 'ceo-dashboard', 'ai-ceo-dashboard'].indexOf(module) !== -1) return false;
      return true;
    }
    if (['hall manager', 'department head', 'manager', 'supervisor', 'procurement manager', 'warehouse manager', 'planning manager', 'sales manager'].indexOf(roleClean) !== -1) {
      if (['system-settings', 'owner-dashboard', 'ceo-dashboard', 'ai-ceo-dashboard', 'screen-permissions'].indexOf(module) !== -1) return false;
      if (action === 'view' || action === 'create' || action === 'approve' || action === 'reject') return true;
    }
    if (['driver'].indexOf(roleClean) !== -1) {
      if (module === 'logistics' && (action === 'view' || action === 'create')) return true;
      return false;
    }
    if (['nursing management', 'nurse', 'nursing manager', 'doctor'].indexOf(roleClean) !== -1) {
      if (['nursing-page', 'nursing-medical-approvals'].indexOf(module) !== -1) return true;
      return false;
    }
    if (['spare parts inspector'].indexOf(roleClean) !== -1) {
      if (['spare-parts', 'erp-equipment'].indexOf(module) !== -1) return true;
      return false;
    }
    if (['procurement specialist'].indexOf(roleClean) !== -1) {
      if (['purchase-requests', 'erp-suppliers'].indexOf(module) !== -1) return true;
      return false;
    }

    // Standard employee fallback: restricted strictly to self-service screens
    return false;
  },

  loadPermissions: function() {
    if (!App.user) return;
    
    var roleStr = (App.user.role || '').trim().toLowerCase();
    var userId = App.user.id;
    
    Promise.all([
      sbClient.from('screen_permissions').select('*').eq('user_id', userId),
      roleStr ? sbClient.from('screen_permissions').select('*').eq('role', roleStr) : Promise.resolve({ data: [] })
    ]).then(function(results) {
      var userPerms = results[0].data || [];
      var rolePerms = results[1].data || [];
      
      SecurityHelpers._userPerms = userPerms;
      SecurityHelpers._rolePerms = rolePerms;
      SecurityHelpers._hasCustomConfig = (userPerms.length > 0 || rolePerms.length > 0);

      // Build cached array for fast lookups
      var resolved = [];
      // Start with role perms
      rolePerms.forEach(function(rp) {
        if (rp.screen_id !== 'SYSTEM_CONFIG') {
          resolved.push({ module: rp.screen_id, action: rp.action, granted: rp.granted });
        }
      });
      // User perms override role perms
      userPerms.forEach(function(up) {
        if (up.screen_id !== 'SYSTEM_CONFIG') {
          var idx = resolved.findIndex(function(x){ return x.module === up.screen_id && x.action === up.action; });
          if (idx !== -1) {
            resolved[idx].granted = up.granted;
          } else {
            resolved.push({ module: up.screen_id, action: up.action, granted: up.granted });
          }
        }
      });

      SecurityHelpers._cachedPermissions = resolved;

      // Install API Guard to intercept write attempts at the network/client layer
      SecurityHelpers.installApiGuard();

      // Re-render sidebar to reflect updated permissions
      if (typeof App !== 'undefined' && App.renderSidebar) {
        App.renderSidebar();
      }

      // Realtime listener for permission changes
      if (!SecurityHelpers._permObserver && typeof sbClient !== 'undefined' && sbClient.channel) {
        SecurityHelpers._permObserver = sbClient.channel('public:screen_permissions')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'screen_permissions' }, function (payload) {
            var record = payload.new || payload.old;
            if (record && (record.user_id === userId || (record.role && record.role.toLowerCase() === roleStr))) {
              clearTimeout(SecurityHelpers._reloadTimer);
              SecurityHelpers._reloadTimer = setTimeout(function() {
                SecurityHelpers.loadPermissions();
              }, 800);
            }
          })
          .subscribe();
      }
    }).catch(function(err) {
      console.error("[Security] Error loading permissions:", err);
    });
  },

  // API Guard - intercepts programmatic and DevTools database write attempts
  installApiGuard: function() {
    if (SecurityHelpers._apiGuardInstalled) return;
    if (typeof sbClient === 'undefined' || !sbClient || !sbClient.from) return;

    var originalFrom = sbClient.from.bind(sbClient);
    var tableScreenMap = {
      'attendance': 'attendance',
      'leave_requests': 'leaves',
      'absence_requests': 'absence-leave',
      'salary_adjustments': 'hr-adjustments',
      'payroll': 'payroll',
      'overtime': 'overtime',
      'loans': 'loans',
      'expenses': 'expenses',
      'complaints': 'complaints',
      'medical_requests': 'medical-requests',
      'inventory_items': 'inventory',
      'inventory_transactions': 'inventory',
      'purchase_requests': 'purchase-requests',
      'purchase_orders': 'purchase-requests',
      'suppliers': 'erp-suppliers',
      'sales_orders': 'erp-sales',
      'sales_workflow_orders': 'erp-sales',
      'production_orders': 'erp-production',
      'production_batches': 'erp-production',
      'production_bom': 'erp-bom',
      'bom_items': 'erp-bom',
      'qc_inspections': 'erp-quality',
      'maintenance_requests': 'erp-maintenance',
      'maintenance_schedules': 'erp-maintenance',
      'equipment': 'erp-equipment',
      'fleet_vehicles': 'erp-fleet',
      'fleet_trips': 'erp-fleet',
      'logistics_movements': 'logistics',
      'legal_issues': 'legal-affairs',
      'it_tickets': 'it-tickets',
      'price_lists': 'pricing-management',
      'contracts': 'contract-management',
      'einvoices': 'einvoice-system',
      'users': 'employees'
    };

    sbClient.from = function(tableName) {
      var builder = originalFrom(tableName);

      var originalInsert = builder.insert ? builder.insert.bind(builder) : null;
      var originalUpdate = builder.update ? builder.update.bind(builder) : null;
      var originalDelete = builder.delete ? builder.delete.bind(builder) : null;
      var originalUpsert = builder.upsert ? builder.upsert.bind(builder) : null;

      function checkPerm(action) {
        if (!App || !App.user) return true;
        if (App.user.role && App.user.role.toLowerCase() === 'owner') return true;
        // Logging tables always permitted
        if (['audit_log', 'login_history', 'activity_log', 'notifications', 'chat_attachments'].indexOf(tableName) !== -1) return true;

        var screenId = tableScreenMap[tableName];
        if (!screenId) return true;

        if (!SecurityHelpers.hasPermission(screenId, action)) {
          console.warn('[Security Guard] Blocked unauthorized ' + action.toUpperCase() + ' on ' + tableName);
          if (typeof showToast === 'function') {
            showToast('⚠️ تم حظر العملية: ليس لديك صلاحية ' + action + ' على شاشة ' + screenId, 'error');
          }
          // Log violation to audit log
          originalFrom('audit_log').insert({
            action: 'UNAUTHORIZED_API_ATTEMPT',
            user_name: App.user.full_name || App.user.username,
            user_id: App.user.id,
            details: 'Blocked ' + action.toUpperCase() + ' on table ' + tableName + ' (Screen: ' + screenId + ')'
          }).then(function(){});
          return false;
        }
        return true;
      }

      if (originalInsert) {
        builder.insert = function() {
          if (!checkPerm('create')) {
            return Promise.resolve({ data: null, error: { message: 'Security Denied: Insufficient CREATE permissions for this resource.' } });
          }
          return originalInsert.apply(builder, arguments);
        };
      }

      if (originalUpdate) {
        builder.update = function() {
          if (!checkPerm('edit')) {
            return Promise.resolve({ data: null, error: { message: 'Security Denied: Insufficient EDIT permissions for this resource.' } });
          }
          return originalUpdate.apply(builder, arguments);
        };
      }

      if (originalUpsert) {
        builder.upsert = function() {
          if (!checkPerm('edit') && !checkPerm('create')) {
            return Promise.resolve({ data: null, error: { message: 'Security Denied: Insufficient EDIT/CREATE permissions for this resource.' } });
          }
          return originalUpsert.apply(builder, arguments);
        };
      }

      if (originalDelete) {
        builder.delete = function() {
          if (!checkPerm('delete')) {
            return Promise.resolve({ data: null, error: { message: 'Security Denied: Insufficient DELETE permissions for this resource.' } });
          }
          return originalDelete.apply(builder, arguments);
        };
      }

      return builder;
    };

    SecurityHelpers._apiGuardInstalled = true;
    console.log('🛡️ API Security Guard installed successfully');
  },

  // Apply permission restrictions to the current screen's buttons automatically
  applyPermissionsUI: function(currentModule) {
    if (SecurityHelpers._uiObserver) {
      SecurityHelpers._uiObserver.disconnect();
      SecurityHelpers._uiObserver = null;
    }
    if (!App.user || (App.user.role && App.user.role.toLowerCase() === 'owner')) return;
    if (currentModule === 'screen-permissions') return;
    
    var enforceButtons = function() {
      document.querySelectorAll('button:not(.nav-link):not(.sidebar-btn):not(.sidebar-item):not([data-perm-checked])').forEach(function(btn) {
        var action = 'view';
        var text = (btn.innerText || '').toLowerCase();
        
        if (text.match(/إضافة|create|add|جديد|new|post/)) action = 'create';
        else if (text.match(/تعديل|edit|update|حفظ|save/)) action = 'edit';
        else if (text.match(/حذف|delete|remove|مسح|🗑/)) action = 'delete';
        else if (text.match(/اعتماد|approve|موافقة/)) action = 'approve';
        else if (text.match(/رفض|reject/)) action = 'reject';
        else if (text.match(/تصدير|export|download/)) action = 'export';
        else if (text.match(/طباعة|print/)) action = 'print';

        if (action !== 'view') {
          if (!SecurityHelpers.hasPermission(currentModule, action)) {
            btn.disabled = true;
            btn.style.opacity = '0.35';
            btn.style.cursor = 'not-allowed';
            btn.title = 'ليس لديك صلاحية لهذا الإجراء (صلاحية ' + action + ' غير ممنوحة)';
            btn.onclick = function(e) { e.preventDefault(); e.stopPropagation(); return false; };
            btn.addEventListener('click', function(e){ e.stopImmediatePropagation(); e.preventDefault(); return false; }, true);
          }
        }
        btn.setAttribute('data-perm-checked', 'true');
      });
    };

    enforceButtons();
    setTimeout(enforceButtons, 500);

    var contentEl = document.getElementById('page-content') || document.body;
    SecurityHelpers._uiObserver = new MutationObserver(function(mutations) {
      var needsCheck = false;
      mutations.forEach(function(m) { if(m.addedNodes.length > 0) needsCheck = true; });
      if(needsCheck) enforceButtons();
    });
    
    SecurityHelpers._uiObserver.observe(contentEl, { childList: true, subtree: true });
  },

  sanitizeInput: function(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  _rateLimits: {},
  checkRateLimit: function(action, maxPerMinute) {
    var now = Date.now();
    var key = action;
    if (!SecurityHelpers._rateLimits[key]) {
      SecurityHelpers._rateLimits[key] = [];
    }
    SecurityHelpers._rateLimits[key] = SecurityHelpers._rateLimits[key].filter(function(t) {
      return now - t < 60000;
    });
    if (SecurityHelpers._rateLimits[key].length >= (maxPerMinute || 30)) {
      return false;
    }
    SecurityHelpers._rateLimits[key].push(now);
    return true;
  }
};
