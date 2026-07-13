// ===== ENTERPRISE COLLABORATION: Chat, Calendar, Data Export =====
window.Pages = window.Pages || {};

// ==========================================
// INTERNAL CHAT
// ==========================================
Pages.internalChat = function(el) {
  var userId = App.user.id;
  var channels = [];
  var activeChannel = null;
  var messages = [];

  var allUsers = {}; // cache: id -> name

  function loadChannels() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    // Load users first to resolve names
    sbClient.from('users').select('id,full_name').eq('status','active').then(function(uRes) {
      (uRes.data || []).forEach(function(u) { allUsers[u.id] = u.full_name; });
      sbClient.from('chat_channels').select('*').order('created_at', {ascending: false}).then(function(res) {
        var myChannels = (res.data || []).filter(function(ch) {
          return ch.members && ch.members.indexOf(userId) !== -1;
        });

        // De-duplicate direct chats: keep only the first (newest) per person
        var seen = {};
        var duplicateIds = [];
        channels = [];
        myChannels.forEach(function(ch) {
          if (ch.channel_type === 'direct' && ch.members && ch.members.length === 2) {
            var otherId = ch.members.find(function(m) { return m !== userId; }) || '';
            if (seen[otherId]) {
              duplicateIds.push(ch.id); // mark for deletion
              return;
            }
            seen[otherId] = true;
          }
          channels.push(ch);
        });

        // Auto-delete duplicates from DB
        if (duplicateIds.length > 0) {
          duplicateIds.forEach(function(did) {
            sbClient.from('chat_channels').delete().eq('id', did).then(function() {});
          });
        }

        render();
        ensureDeptGroup();
      });
    });
  }

  function getChannelName(ch) {
    if (ch.channel_type === 'group' || ch.channel_type === 'department') return ch.name || 'Group Chat';
    // For direct: show the OTHER person's name
    if (ch.members && ch.members.length >= 2) {
      var otherId = ch.members.find(function(m) { return m !== userId; });
      if (otherId && allUsers[otherId]) return allUsers[otherId];
    }
    return ch.name || 'Chat';
  }

  function loadMessages(channelId) {
    activeChannel = channelId;
    sbClient.from('chat_messages').select('*').eq('channel_id', channelId).order('created_at', {ascending: true}).limit(100).then(function(res) {
      messages = res.data || [];
      render();
      // Scroll to bottom
      setTimeout(function() {
        var msgBox = document.getElementById('chat-messages');
        if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
      }, 100);
    });
  }

  function render() {
    var html = '<div style="display:grid;grid-template-columns:280px 1fr;gap:0;height:calc(100vh - 160px);border:1px solid var(--border-color);border-radius:var(--radius-lg);overflow:hidden">';
    
    // Left: Channel List
    html += '<div style="background:var(--bg-tertiary);border-right:1px solid var(--border-color);display:flex;flex-direction:column">';
    html += '<div style="padding:16px;border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center">';
    html += '<h3 style="margin:0;font-size:1rem">💬 Messages</h3>';
    html += '<button class="btn btn-xs btn-primary" onclick="newChatModal()">+ New</button></div>';
    html += '<div style="overflow-y:auto;flex:1">';
    
    if (channels.length === 0) {
      html += '<div style="padding:30px;text-align:center;color:var(--text-muted);font-size:0.85rem">No conversations yet</div>';
    } else {
      channels.forEach(function(ch) {
        var isActive = activeChannel === ch.id;
        var name = getChannelName(ch);
        var emoji = ch.channel_type === 'department' ? '🏢 ' : ch.channel_type === 'group' ? '👥 ' : '💬 ';
        var subLabel = ch.channel_type === 'department' ? 'Department Group' : ch.channel_type === 'direct' ? 'Direct Message' : 'Group';
        html += '<div onclick="loadChatChannel(\'' + ch.id + '\')" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border-color);background:' + (isActive ? 'var(--bg-card)' : 'transparent') + ';border-left:3px solid ' + (isActive ? 'var(--accent-primary)' : 'transparent') + '">';
        html += '<div style="font-weight:600;font-size:0.9rem">' + emoji + name + '</div>';
        html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">' + subLabel + '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';

    // Right: Messages
    html += '<div style="display:flex;flex-direction:column;background:var(--bg-card)">';
    if (!activeChannel) {
      html += '<div style="flex:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted)">';
      html += '<div style="text-align:center"><div style="font-size:3rem;margin-bottom:12px">💬</div><p>Select a conversation to start chatting</p></div></div>';
    } else {
      var ch = channels.find(function(c) { return c.id === activeChannel; });
      html += '<div style="padding:12px 16px;border-bottom:1px solid var(--border-color);font-weight:700">' + (ch ? getChannelName(ch) : 'Chat') + '</div>';
      html += '<div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px">';
      
      if (messages.length === 0) {
        html += '<div style="text-align:center;color:var(--text-muted);padding:40px">No messages yet. Say hi! 👋</div>';
      } else {
        messages.forEach(function(m) {
          var isMine = m.sender_id === userId;
          html += '<div style="display:flex;justify-content:' + (isMine ? 'flex-end' : 'flex-start') + '">';
          html += '<div style="max-width:70%;padding:10px 14px;border-radius:12px;background:' + (isMine ? 'var(--accent-primary)' : 'var(--bg-tertiary)') + ';color:' + (isMine ? '#fff' : 'var(--text-primary)') + '">';
          if (!isMine) html += '<div style="font-size:0.7rem;font-weight:700;margin-bottom:4px;opacity:0.7">' + (m.sender_name || 'User') + '</div>';
          html += '<div style="font-size:0.9rem">' + m.message + '</div>';
          html += '<div style="font-size:0.65rem;margin-top:4px;opacity:0.6;text-align:right">' + new Date(m.created_at).toLocaleTimeString('en', {hour:'2-digit',minute:'2-digit'}) + '</div>';
          html += '</div></div>';
        });
      }
      html += '</div>';

      // Input
      html += '<div style="padding:12px;border-top:1px solid var(--border-color);display:flex;gap:8px">';
      html += '<input type="text" id="chat-input" class="form-input" placeholder="Type a message..." style="flex:1" onkeydown="if(event.key===\'Enter\')sendChatMessage()">';
      html += '<button class="btn btn-primary" onclick="sendChatMessage()">Send</button></div>';
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  window.loadChatChannel = function(id) { loadMessages(id); };

  window.sendChatMessage = function() {
    var input = document.getElementById('chat-input');
    if (!input || !input.value.trim() || !activeChannel) return;
    var msg = input.value.trim();
    input.value = '';
    sbClient.from('chat_messages').insert({
      channel_id: activeChannel, sender_id: userId,
      sender_name: App.user.full_name, message: msg
    }).then(function(r) {
      if (r.error) { alert(r.error.message); return; }
      loadMessages(activeChannel);
    });
  };

  // Auto-create department group if not exists
  function ensureDeptGroup() {
    var dept = App.user.department;
    if (!dept) return;
    var exists = channels.find(function(ch) {
      return ch.channel_type === 'department' && ch.name === dept + ' Team';
    });
    if (!exists) {
      // Get all dept members
      sbClient.from('users').select('id').eq('department', dept).eq('status','active').then(function(res) {
        var memberIds = (res.data || []).map(function(u) { return u.id; });
        if (memberIds.length < 2) return;
        sbClient.from('chat_channels').insert({
          name: dept + ' Team', channel_type: 'department',
          members: memberIds, created_by: userId
        }).then(function() {});
      });
    }
  }

  window.newChatModal = function() {
    sbClient.from('users').select('id,full_name,role,department').eq('status','active').then(function(res) {
      var allEmps = (res.data || []).filter(function(e) { return e.id !== userId; });
      var myDept = App.user.department;

      // Categorize contacts
      var managers = allEmps.filter(function(e) {
        return e.department === myDept && e.role && (e.role.indexOf('manager') !== -1 || e.role === 'owner');
      });
      var hrTeam = allEmps.filter(function(e) {
        return e.role === 'hr' || e.role === 'hr manager';
      });
      var colleagues = allEmps.filter(function(e) {
        return e.department === myDept && (!e.role || (e.role.indexOf('manager') === -1 && e.role !== 'owner'));
      });
      // Remove duplicates (HR who are also in same dept)
      var hrIds = hrTeam.map(function(h) { return h.id; });
      colleagues = colleagues.filter(function(c) { return hrIds.indexOf(c.id) === -1; });

      var body = '<div class="form-field"><label>Chat Type</label><select id="chat-type" class="form-input"><option value="direct">Direct Message (رسالة مباشرة)</option><option value="group">Group Chat (مجموعة)</option></select></div>';
      body += '<div class="form-field"><label>Group Name (للمجموعات فقط)</label><input type="text" id="chat-name" class="form-input" placeholder="اسم المجموعة"></div>';
      body += '<div class="form-field"><label>Select Members (اختر)</label><div style="max-height:280px;overflow-y:auto;border:1px solid var(--border-color);border-radius:8px;padding:8px">';

      // Manager section
      if (managers.length > 0) {
        body += '<div style="font-weight:700;font-size:0.8rem;color:var(--accent-primary);padding:6px 0;border-bottom:1px solid var(--border-color);margin-bottom:4px">👔 My Manager (مديري)</div>';
        managers.forEach(function(e) {
          body += '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;padding-left:8px;cursor:pointer"><input type="checkbox" class="chat-member" value="' + e.id + '"> ' + e.full_name + ' <span style="font-size:0.7rem;color:var(--text-muted)">(' + (e.role || '') + ')</span></label>';
        });
      }

      // HR section
      if (hrTeam.length > 0) {
        body += '<div style="font-weight:700;font-size:0.8rem;color:#22c55e;padding:6px 0;border-bottom:1px solid var(--border-color);margin:8px 0 4px">🏢 HR Team (الموارد البشرية)</div>';
        hrTeam.forEach(function(e) {
          body += '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;padding-left:8px;cursor:pointer"><input type="checkbox" class="chat-member" value="' + e.id + '"> ' + e.full_name + '</label>';
        });
      }

      // Colleagues section
      if (colleagues.length > 0) {
        body += '<div style="font-weight:700;font-size:0.8rem;color:#f59e0b;padding:6px 0;border-bottom:1px solid var(--border-color);margin:8px 0 4px">👥 Colleagues (زملائي - ' + myDept + ')</div>';
        colleagues.forEach(function(e) {
          body += '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;padding-left:8px;cursor:pointer"><input type="checkbox" class="chat-member" value="' + e.id + '"> ' + e.full_name + '</label>';
        });
      }

      body += '</div></div>';
      var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="create-chat-btn">Start Chat</button>';
      App.showModal('New Conversation (محادثة جديدة)', body, footer);

      document.getElementById('create-chat-btn').addEventListener('click', function() {
        var type = document.getElementById('chat-type').value;
        var name = document.getElementById('chat-name').value;
        var members = [userId];
        document.querySelectorAll('.chat-member:checked').forEach(function(cb) { members.push(cb.value); });
        if (members.length < 2) { alert('اختر شخص واحد على الأقل'); return; }

        // Prevent duplicate direct chats
        if (type === 'direct' && members.length === 2) {
          var targetId = members.find(function(m) { return m !== userId; });
          var existing = channels.find(function(ch) {
            return ch.channel_type === 'direct' && ch.members &&
              ch.members.indexOf(userId) !== -1 && ch.members.indexOf(targetId) !== -1;
          });
          if (existing) {
            App.closeModal();
            loadMessages(existing.id);
            showToast('الشات موجود بالفعل - تم فتحه', 'info');
            return;
          }
        }

        sbClient.from('chat_channels').insert({
          name: name || null,
          channel_type: type, members: members, created_by: userId
        }).then(function(r) {
          if (r.error) { alert(r.error.message); return; }
          App.closeModal(); loadChannels();
          showToast('تم إنشاء المحادثة', 'success');
        });
      });
    });
  };

  loadChannels();
};

// ==========================================
// CALENDAR
// ==========================================
Pages.calendar = function(el) {
  var currentMonth = new Date().getMonth();
  var currentYear = new Date().getFullYear();
  var events = [];

  function loadEvents() {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span></div>';
    var startDate = new Date(currentYear, currentMonth, 1).toISOString();
    var endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString();
    sbClient.from('calendar_events').select('*').gte('start_time', startDate).lte('start_time', endDate).order('start_time').then(function(res) {
      events = res.data || [];
      render();
    });
  }

  function render() {
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var html = '<div class="toolbar" style="display:flex;justify-content:space-between;margin-bottom:24px">';
    html += '<div style="display:flex;align-items:center;gap:12px">';
    html += '<button class="btn btn-sm btn-outline" onclick="calNavMonth(-1)">' + icon('chevronLeft') + '</button>';
    html += '<h2 style="margin:0;min-width:200px;text-align:center">' + monthNames[currentMonth] + ' ' + currentYear + '</h2>';
    html += '<button class="btn btn-sm btn-outline" onclick="calNavMonth(1)">' + icon('chevronRight') + '</button>';
    html += '</div>';
    html += '<button class="btn btn-primary" onclick="newEventModal()">' + icon('plus') + ' New Event</button></div>';

    // Calendar Grid
    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    html += '<div class="card"><div class="card-body" style="padding:0">';
    html += '<div style="display:grid;grid-template-columns:repeat(7,1fr)">';
    dayNames.forEach(function(d) {
      html += '<div style="padding:10px;text-align:center;font-weight:700;font-size:0.8rem;color:var(--text-muted);border-bottom:1px solid var(--border-color)">' + d + '</div>';
    });

    // Empty cells before first day
    for (var i = 0; i < firstDay; i++) {
      html += '<div style="padding:8px;min-height:80px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color);background:var(--bg-tertiary)"></div>';
    }

    var today = new Date();
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      var dayEvents = events.filter(function(e) { return new Date(e.start_time).getDate() === d; });
      
      html += '<div style="padding:8px;min-height:80px;border-bottom:1px solid var(--border-color);border-right:1px solid var(--border-color);' + (isToday ? 'background:rgba(99,102,241,0.08)' : '') + '">';
      html += '<div style="font-weight:' + (isToday ? '800' : '600') + ';font-size:0.85rem;margin-bottom:4px;color:' + (isToday ? 'var(--accent-primary)' : 'var(--text-primary)') + '">' + d + '</div>';
      dayEvents.slice(0, 3).forEach(function(ev) {
        var colors = {meeting:'#6366f1',deadline:'#ef4444',holiday:'#22c55e',reminder:'#f59e0b',other:'#8b5cf6'};
        html += '<div style="font-size:0.7rem;padding:2px 4px;border-radius:3px;margin-bottom:2px;background:' + (colors[ev.event_type] || '#6366f1') + '20;color:' + (colors[ev.event_type] || '#6366f1') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" title="' + ev.title + '">' + ev.title + '</div>';
      });
      if (dayEvents.length > 3) html += '<div style="font-size:0.65rem;color:var(--text-muted)">+' + (dayEvents.length - 3) + ' more</div>';
      html += '</div>';
    }
    html += '</div></div></div>';

    // Upcoming Events List
    html += '<div class="card" style="margin-top:20px"><div class="card-header"><div><h3>📅 Events This Month</h3><p>' + events.length + ' events</p></div></div><div class="card-body no-pad">';
    if (events.length === 0) {
      html += '<div style="padding:30px;text-align:center;color:var(--text-muted)">No events this month</div>';
    } else {
      html += '<table class="data-table"><thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Time</th></tr></thead><tbody>';
      events.forEach(function(ev) {
        var badge = ev.event_type === 'meeting' ? 'info' : ev.event_type === 'deadline' ? 'danger' : ev.event_type === 'holiday' ? 'success' : 'warning';
        html += '<tr><td>' + formatDate(ev.start_time) + '</td><td style="font-weight:600">' + ev.title + '</td>';
        html += '<td><span class="badge badge-' + badge + '">' + ev.event_type + '</span></td>';
        html += '<td>' + (ev.all_day ? 'All Day' : new Date(ev.start_time).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})) + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';
    el.innerHTML = html;
  }

  window.calNavMonth = function(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    loadEvents();
  };

  window.newEventModal = function() {
    var body = '<div class="form-field"><label>Title *</label><input type="text" id="ev-title" class="form-input"></div>';
    body += '<div class="form-row"><div class="form-field"><label>Type</label><select id="ev-type" class="form-input"><option value="meeting">Meeting</option><option value="deadline">Deadline</option><option value="holiday">Holiday</option><option value="reminder">Reminder</option><option value="other">Other</option></select></div>';
    body += '<div class="form-field"><label>All Day?</label><select id="ev-allday" class="form-input"><option value="0">No</option><option value="1">Yes</option></select></div></div>';
    body += '<div class="form-row"><div class="form-field"><label>Start</label><input type="datetime-local" id="ev-start" class="form-input"></div>';
    body += '<div class="form-field"><label>End</label><input type="datetime-local" id="ev-end" class="form-input"></div></div>';
    body += '<div class="form-field"><label>Description</label><textarea id="ev-desc" class="form-input" rows="2"></textarea></div>';
    var footer = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-ev-btn">Save Event</button>';
    App.showModal('New Event', body, footer);

    document.getElementById('save-ev-btn').addEventListener('click', function() {
      var title = document.getElementById('ev-title').value;
      if (!title) { alert('Title required'); return; }
      sbClient.from('calendar_events').insert({
        title: title, event_type: document.getElementById('ev-type').value,
        start_time: document.getElementById('ev-start').value || new Date().toISOString(),
        end_time: document.getElementById('ev-end').value || null,
        all_day: document.getElementById('ev-allday').value === '1',
        description: document.getElementById('ev-desc').value,
        organizer_id: App.user.id
      }).then(function(r) {
        if (r.error) { alert(r.error.message); return; }
        App.closeModal(); loadEvents();
        showToast('Event created', 'success');
      });
    });
  };

  loadEvents();
};

// ==========================================
// DATA EXPORT UTILITIES
// ==========================================
window.DataExport = {
  // Export to CSV
  toCSV: function(data, filename) {
    if (!data || data.length === 0) { alert('No data to export'); return; }
    var headers = Object.keys(data[0]);
    var csv = headers.join(',') + '\n';
    data.forEach(function(row) {
      csv += headers.map(function(h) {
        var val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        return '"' + val.replace(/"/g, '""') + '"';
      }).join(',') + '\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (filename || 'export') + '.csv';
    link.click();
    showToast('CSV exported successfully', 'success');
  },

  // Export to Excel using SheetJS
  toExcel: function(data, filename, sheetName) {
    if (!data || data.length === 0) { alert('No data to export'); return; }
    if (typeof XLSX === 'undefined') { alert('Excel library not loaded'); return; }
    var ws = XLSX.utils.json_to_sheet(data);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName || 'Sheet1');
    XLSX.writeFile(wb, (filename || 'export') + '.xlsx');
    showToast('Excel exported successfully', 'success');
  },

  // Export to PDF (simple table)
  toPDF: function(data, title, filename) {
    if (!data || data.length === 0) { alert('No data to export'); return; }
    var headers = Object.keys(data[0]);
    var printWin = window.open('', '_blank');
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + title + '</title>';
    html += '<style>body{font-family:Arial,sans-serif;padding:20px;direction:ltr}h1{color:#1e293b;border-bottom:2px solid #6366f1;padding-bottom:10px}';
    html += 'table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#6366f1;color:white;padding:10px;text-align:left;font-size:0.85rem}';
    html += 'td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:0.8rem}tr:nth-child(even){background:#f8fafc}';
    html += '.footer{margin-top:30px;text-align:center;color:#94a3b8;font-size:0.75rem}@media print{.no-print{display:none}}</style></head><body>';
    html += '<h1>' + title + '</h1>';
    html += '<p style="color:#64748b">Generated: ' + new Date().toLocaleString() + ' | Total Records: ' + data.length + '</p>';
    html += '<table><thead><tr>';
    headers.forEach(function(h) { html += '<th>' + h.replace(/_/g, ' ').toUpperCase() + '</th>'; });
    html += '</tr></thead><tbody>';
    data.forEach(function(row) {
      html += '<tr>';
      headers.forEach(function(h) { html += '<td>' + (row[h] !== null && row[h] !== undefined ? row[h] : '-') + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '<div class="footer">Smart Factory ERP System</div>';
    html += '<script>window.onload=function(){window.print();}</script></body></html>';
    printWin.document.write(html);
    printWin.document.close();
    showToast('PDF print dialog opened', 'success');
  },

  // Import from Excel
  fromExcel: function(file, callback) {
    if (typeof XLSX === 'undefined') { alert('Excel library not loaded'); return; }
    var reader = new FileReader();
    reader.onload = function(e) {
      var workbook = XLSX.read(e.target.result, { type: 'binary' });
      var sheetName = workbook.SheetNames[0];
      var data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      callback(data);
    };
    reader.readAsBinaryString(file);
  }
};
