window.Pages = window.Pages || {};
window.ERPLogistics = {
  renderLogistics: function(el) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Logistics...</p></div>';
    
    // Fetch Drivers, Movements, and Gate Logs
    let driverQuery = sbClient.from('logistics_drivers').select('*').order('created_at', { ascending: false });
    let moveQuery = sbClient.from('logistics_movements').select('*').order('created_at', { ascending: false });
    let gateQuery = sbClient.from('logistics_gate_logs').select('*').order('scan_time', { ascending: false }).limit(20);
    
    if (App.user.role === 'driver') {
      driverQuery = driverQuery.eq('id', App.user.id);
      moveQuery = moveQuery.eq('driver_id', App.user.id);
      gateQuery = gateQuery.eq('driver_id', App.user.id);
    } else if (App.user.role !== 'owner' && App.user.role !== 'hr manager' && App.user.role !== 'logistics manager' && App.user.department !== 'Logistics') {
      driverQuery = driverQuery.eq('employee_id', App.user.id);
      moveQuery = moveQuery.eq('employee_id', App.user.id);
      gateQuery = gateQuery.eq('driver_id', App.user.id);
    }
    
    Promise.all([driverQuery, moveQuery, gateQuery]).then(function(results) {
      let driverRes = results[0];
      let moveRes = results[1];
      let gateRes = results[2];
      
      if (driverRes.error || moveRes.error) {
        el.innerHTML = '<div class="alert" style="background:#fef2f2;color:#ef4444;padding:20px;border-radius:8px">Please run fix_logistics_table.sql in your Supabase SQL Editor first.</div>';
        return;
      }
      
      let drivers = driverRes.data || [];
      let movements = moveRes.data || [];
      let gateLogs = (gateRes && gateRes.data) ? gateRes.data : [];
      
      let html = '<div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">';
      html += '<div><h2 style="font-size:1.8rem; font-weight:700; margin-bottom:4px;">Transportation & Logistics (الحركة والنقل)</h2>';
      html += '<p style="color:var(--text-muted)">Manage drivers, vehicles, gate logs, and destinations</p></div>';
      html += '</div>';

      if (App.user.role === 'driver') {
        // Driver Dashboard Monthly Stats
        let totalTrips = movements.length;
        let totalHrs = 0;
        let totalKm = 0;
        movements.forEach(m => {
           if (m.duration_hours) totalHrs += parseFloat(m.duration_hours);
           if (m.odometer_end && m.odometer_start) totalKm += (m.odometer_end - m.odometer_start);
        });
        
        let statBox = (color, iconName, val, label) => `
          <div style="background:var(--bg-secondary); padding:16px; border-radius:8px; border:1px solid var(--border-color); display:flex; align-items:center; gap:16px;">
             <div style="width:48px;height:48px;border-radius:12px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;">${icon(iconName, 24)}</div>
             <div><div style="font-size:1.5rem;font-weight:700;color:var(--text-primary);line-height:1">${val}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${label}</div></div>
          </div>
        `;
        
        html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:24px; border:1px solid var(--border-color); margin-bottom: 32px;">';
        html += '<h3 style="font-size:1.3rem; font-weight:700; margin-bottom:16px;">Monthly Overview (ملخص مشاوير الشهر)</h3>';
        html += '<div class="grid-3" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">';
        html += statBox('#6366f1', 'mapPin', totalTrips, 'Total Trips');
        html += statBox('#16a34a', 'clock', totalHrs.toFixed(2) + ' Hrs', 'Total Driving Hours');
        html += statBox('#f59e0b', 'truck', totalKm + ' km', 'Total Distance');
        html += '</div></div>';
      }
      
      // ==========================================
      // DRIVERS SECTION
      // ==========================================
      if (App.user.role !== 'driver' && (App.user.role === 'owner' || App.user.department === 'Logistics' || App.user.role === 'logistics manager')) {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; margin-top:24px;">';
        html += '<h3 style="font-size:1.3rem; font-weight:700;">Registered Drivers (السائقين المسجلين)</h3>';
        html += '<button class="btn btn-primary btn-sm" id="new-driver-btn">' + icon('plus', 16) + ' Add Driver</button>';
        html += '</div>';
        
        html += '<div class="grid-4" style="gap:16px; display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); margin-bottom: 32px;">';
        if (drivers.length === 0) {
          html += '<div style="grid-column:1/-1; padding:20px; background:var(--bg-card); border-radius:var(--radius-md); text-align:center; color:var(--text-muted); border:1px dashed var(--border-color)">No drivers registered yet.</div>';
        } else {
          drivers.forEach(function(d) {
            let dTypeBadge = d.driver_type === 'external' ? '<span class="badge badge-warning">External</span>' : '<span class="badge badge-info">Internal</span>';
            html += '<div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; align-items:center; gap:12px;">';
            html += '<div style="width:40px; height:40px; border-radius:50%; background:rgba(99,102,241,0.1); color:#6366f1; display:flex; align-items:center; justify-content:center;">' + icon('user', 20) + '</div>';
            html += '<div><div style="font-weight:600">' + d.driver_name + ' ' + dTypeBadge + '</div><div style="font-size:0.85rem; color:var(--text-muted)">Car: <span style="color:#6366f1;font-weight:600">' + d.car_number + '</span></div></div>';
            html += '</div>';
          });
        }
        html += '</div>';
      }
      
      // ==========================================
      // MOVEMENTS SECTION
      // ==========================================
      html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; margin-top:32px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700;">Trip Destinations (حركة السيارات)</h3>';
      if (drivers.length > 0 && (App.user.role === 'owner' || App.user.department === 'Logistics' || App.user.role === 'logistics manager')) {
        html += '<button class="btn btn-secondary btn-sm" id="new-movement-btn">' + icon('mapPin', 16) + ' Assign Destination</button>';
      }
      html += '</div>';
      
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:20px; border:1px solid var(--border-color);">';
      html += '<div class="table-responsive" style="overflow-x:auto; width:100%;"><table class="table" style="width:100%; min-width:700px; border-collapse:collapse;">';
      html += '<thead><tr style="text-align:left; border-bottom:1px solid var(--border-color);">';
      html += '<th style="padding:12px">Date / Time</th>';
      html += '<th style="padding:12px">Driver & Vehicle</th>';
      html += '<th style="padding:12px">Destination (الوجهة)</th>';
      html += '<th style="padding:12px">Odometers & Distance</th>';
      html += '<th style="padding:12px">Action</th>';
      html += '</tr></thead><tbody>';
      
      if (movements.length === 0) {
        html += '<tr><td colspan="5" style="padding:24px; text-align:center; color:var(--text-muted)">No trips recorded.</td></tr>';
      } else {
        movements.forEach(function(m) {
          html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)">';
          
          let timesHtml = '<div style="font-size:0.8rem">Assigned: ' + new Date(m.created_at).toLocaleString() + '</div>';
          if (m.start_time) timesHtml += '<div style="font-size:0.8rem; color:#f59e0b">Started: ' + new Date(m.start_time).toLocaleString() + '</div>';
          if (m.end_time) timesHtml += '<div style="font-size:0.8rem; color:#16a34a">Ended: ' + new Date(m.end_time).toLocaleString() + '</div>';
          if (m.duration_hours) timesHtml += '<div style="font-size:0.8rem; font-weight:bold; color:#6366f1">Duration: ' + m.duration_hours + ' hrs</div>';
          
          html += '<td style="padding:12px">' + timesHtml + '</td>';
          html += '<td style="padding:12px"><div style="font-weight:600">' + m.driver_name + '</div><div style="font-size:0.8rem; color:var(--text-muted)">' + m.car_number + '</div></td>';
          html += '<td style="padding:12px"><span style="background:rgba(34,197,94,0.1); color:#16a34a; padding:4px 8px; border-radius:4px; font-weight:600">' + (m.destination || 'N/A') + '</span></td>';
          
          let distStr = (m.odometer_end && m.odometer_start) ? (m.odometer_end - m.odometer_start) + ' km' : 'N/A';
          html += '<td style="padding:12px"><div style="font-size:0.85rem">Start: ' + (m.odometer_start||'--') + '<br>End: ' + (m.odometer_end||'--') + '<br><strong style="color:#6366f1">Dist: ' + distStr + '</strong></div>';
          
          if (App.user.role !== 'driver') {
            if (!m.odometer_start) {
               html += '<div style="margin-top:4px"><button class="btn btn-outline btn-xs set-odo-btn" data-type="start" data-id="'+m.id+'">Set Start Odo</button></div>';
            } else if (!m.odometer_end && m.status !== 'new') {
               html += '<div style="margin-top:4px"><button class="btn btn-outline btn-xs set-odo-btn" data-type="end" data-id="'+m.id+'" data-start="'+m.odometer_start+'">Set End Odo</button></div>';
            }
          }
          html += '</td>';
          
          html += '<td style="padding:12px">';
          let mStatus = m.status || 'new';
          
          if (App.user.role === 'driver') {
            if (mStatus === 'new') {
               html += '<button class="btn btn-primary btn-sm start-driver-trip-btn" data-id="'+m.id+'">' + icon('play', 14) + ' Start Trip</button>';
            } else if (mStatus === 'in_progress') {
               html += '<button class="btn btn-warning btn-sm end-driver-trip-btn" data-id="'+m.id+'" data-start="'+m.start_time+'">' + icon('square', 14) + ' End Trip</button>';
            } else {
               html += '<span class="badge badge-success">Completed</span>';
            }
          } else {
            let sBadge = mStatus === 'new' ? '<span class="badge badge-info">New</span>' : (mStatus === 'in_progress' ? '<span class="badge badge-warning">In Progress</span>' : '<span class="badge badge-success">Completed</span>');
            html += '<div style="margin-bottom:8px">' + sBadge;
            if (App.user.role !== 'driver' && mStatus === 'new') {
               html += '<button class="btn btn-sm" style="margin-left: 8px; color: #ef4444; background: none; border: 1px solid #ef4444; padding: 2px 8px; font-size: 0.75rem; cursor: pointer;" onclick="deleteLogisticsTrip(\''+m.id+'\')">Delete (حذف)</button>';
            }
            html += '</div>';
          }
          
          // Cost Workflow (Only for external drivers, or managers dealing with costs)
          let showCost = false;
          if (App.user.role === 'driver' && App.user.driver_type === 'external') showCost = true;
          if (App.user.role !== 'driver') showCost = true; // Managers can see it (if pending/paid)
          
          if (showCost) {
            let costStat = m.cost_status || 'pending';
            html += '<div style="margin-top:12px; border-top:1px dashed #eee; padding-top:8px;">';
            if (costStat === 'pending') {
              if (App.user.role === 'driver' && App.user.driver_type === 'external') {
                html += '<button class="btn btn-secondary btn-sm add-cost-btn" data-id="'+m.id+'">Add Trip Cost</button>';
              } else {
                html += '<span style="color:var(--text-muted); font-size:0.75rem;">Waiting for Driver Cost</span>';
              }
            } else if (costStat === 'pending_approval') {
              if ((App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'owner') && App.user.role !== 'driver') {
                 html += '<div style="margin-bottom:4px; font-size:0.85rem">Cost: <strong>'+m.trip_cost+' EGP</strong></div>';
                 html += '<button class="btn btn-warning btn-sm approve-cost-btn" data-id="'+m.id+'">Approve Cost</button>';
              } else {
                 html += '<div style="font-size:0.85rem">Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#f59e0b; font-size:0.75rem">(Pending Approval)</span></div>';
              }
            } else if (costStat === 'pending_payment') {
              if (App.user.department === 'Finance' || App.user.role === 'owner' || App.user.role === 'hr manager') {
                 html += '<div style="margin-bottom:4px; font-size:0.85rem">Cost: <strong>'+m.trip_cost+' EGP</strong></div>';
                 html += '<button class="btn btn-success btn-sm pay-cost-btn" data-id="'+m.id+'">Mark as Paid</button>';
              } else {
                 html += '<div style="font-size:0.85rem">Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#3b82f6; font-size:0.75rem">(Pending Payment)</span></div>';
              }
            } else if (costStat === 'paid') {
               html += '<div style="font-size:0.85rem">Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#16a34a; font-weight:bold; font-size:0.75rem">(Paid)</span></div>';
            }
            html += '</div>';
          }
          
          html += '</td></tr>';
        });
      }
      html += '</tbody></table></div></div>';
      
      el.innerHTML = html;
      
      // ==========================================
      // EVENTS
      // ==========================================

      let newDriverBtn = document.getElementById('new-driver-btn');
      if (newDriverBtn) {
        newDriverBtn.addEventListener('click', function() {
          let formHtml = '<div class="form-group"><label class="form-label">Driver Name (اسم السائق)</label><input type="text" class="form-input" id="driver-name" required></div>';
          formHtml += '<div class="form-group"><label class="form-label">Phone Number (رقم الهاتف) - Use as Login</label><input type="text" class="form-input" id="driver-phone" placeholder="e.g. 01012345678" required></div>';
          formHtml += '<div class="form-group"><label class="form-label">Vehicle Number (رقم العربية)</label><input type="text" class="form-input" id="car-number" required></div>';
          
          let footerHtml = '<button class="btn btn-outline" id="cancel-driver">Cancel</button><button class="btn btn-primary" id="save-driver">Save & Create Account</button>';
          App.showModal('Register New Driver', formHtml, footerHtml);
          
          document.getElementById('cancel-driver').addEventListener('click', App.closeModal);
          document.getElementById('save-driver').addEventListener('click', function() {
            let dName = document.getElementById('driver-name').value.trim();
            let dPhone = document.getElementById('driver-phone').value.trim();
            let cNum = document.getElementById('car-number').value.trim();
            if (!dName || !cNum || !dPhone) { alert('Please enter Name, Phone, and Car number.'); return; }
            
            let btn = this;
            btn.disabled = true;
            btn.innerHTML = 'Creating Account...';
            
            // 1. Create User Account in users table
            sbClient.from('users').insert({
              employee_id: 'DRV-' + Date.now().toString().slice(-6),
              email: dPhone + '@erp.com',
              username: dPhone,
              full_name: dName,
              password_hash: '123456', // Default password
              role: 'driver',
              department: 'Logistics',
              status: 'active'
            }).select().single().then(function(uRes) {
              if (uRes.error) {
                alert('Failed to create user account. Maybe phone already exists?');
                btn.disabled = false; btn.innerHTML = 'Save & Create Account';
                return;
              }
              
              let newUserId = uRes.data.id;
              
              // 2. Insert into logistics_drivers
              sbClient.from('logistics_drivers').insert({ 
                id: newUserId, 
                employee_id: App.user.id, 
                driver_name: dName, 
                car_number: cNum 
              }).then(function() {
                
                // 3. Add to Drivers & Logistics Chat Group
                sbClient.from('chat_channels').select('*').eq('name', 'Drivers & Logistics').single().then(function(chRes) {
                  if (chRes.data) {
                    let members = chRes.data.members || [];
                    if (!members.includes(newUserId)) members.push(newUserId);
                    if (!members.includes(App.user.id)) members.push(App.user.id);
                    sbClient.from('chat_channels').update({ members: members }).eq('id', chRes.data.id).then(function() {
                      App.closeModal(); App.navigate('logistics'); showToast('Driver added & Group Updated', 'success');
                    });
                  } else {
                    sbClient.from('chat_channels').insert({
                      name: 'Drivers & Logistics',
                      channel_type: 'department',
                      members: [App.user.id, newUserId]
                    }).then(function() {
                      App.closeModal(); App.navigate('logistics'); showToast('Driver added & Group Created', 'success');
                    });
                  }
                });
              });
            });
          });
        });
      }
      
      // 3. New Movement / Assign Destination
      let newMovementBtn = document.getElementById('new-movement-btn');
      if (newMovementBtn) {
        newMovementBtn.addEventListener('click', function() {
          let driverOpts = drivers.map(function(d) {
            return `<option value="${d.id}" data-name="${d.driver_name}" data-car="${d.car_number}">${d.driver_name} - ${d.car_number}</option>`;
          }).join('');
          
          let formHtml = '<div class="form-group"><label class="form-label">Select Driver (اختر السائق)</label><select class="form-input" id="select-driver">' + driverOpts + '</select></div>';
          formHtml += '<div class="form-group"><label class="form-label">Destination / Task (الوجهة / المهمة)</label><input type="text" class="form-input" id="movement-destination" required></div>';
          formHtml += '<div class="form-group"><label class="form-label">Odometer Start (قراءة العداد قبل المشوار - اختياري الان)</label><input type="number" class="form-input" id="odometer-start" placeholder="e.g. 15000"></div>';
          
          let footerHtml = '<button class="btn btn-outline" id="cancel-movement">Cancel</button><button class="btn btn-primary" id="save-movement">Assign</button>';
          App.showModal('Assign Destination to Driver', formHtml, footerHtml);
          
          document.getElementById('cancel-movement').addEventListener('click', App.closeModal);
          document.getElementById('save-movement').addEventListener('click', function() {
            let selectEl = document.getElementById('select-driver');
            let selOpt = selectEl.options[selectEl.selectedIndex];
            let dId = selectEl.value;
            let dName = selOpt.getAttribute('data-name');
            let cNum = selOpt.getAttribute('data-car');
            let dest = document.getElementById('movement-destination').value.trim();
            let odometerStart = document.getElementById('odometer-start').value.trim();
            
            if (!dest) { alert('Please enter destination.'); return; }
            
            let btn = this;
            btn.disabled = true;
            btn.innerHTML = 'Saving...';
            
            let insertData = {
              employee_id: App.user.id,
              employee_name: App.user.full_name,
              driver_id: dId,
              driver_name: dName,
              car_number: cNum,
              destination: dest,
              status: 'new'
            };
            if (odometerStart) {
              insertData.odometer_start = parseFloat(odometerStart);
            }
            
            sbClient.from('logistics_movements').insert(insertData).then(function(res) {
              if (res.error) {
                alert('Database error: Please run fix_logistics_table.sql in Supabase SQL editor.');
                btn.disabled = false; btn.innerHTML = 'Assign'; return;
              }
              App.closeModal(); App.navigate('logistics');
            });
          });
        });
      }

      // 4. Odometer Input (For Managers)
      document.querySelectorAll('.set-odo-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let type = this.getAttribute('data-type');
          let startVal = this.getAttribute('data-start') || 0;
          
          let title = type === 'start' ? 'Set Start Odometer' : 'Set End Odometer';
          let formHtml = '';
          if (type === 'end') formHtml += `<div style="margin-bottom:12px; padding:8px; background:#f3f4f6; border-radius:4px; font-weight:600;">Odometer Start: ${startVal}</div>`;
          formHtml += `<div class="form-group"><label class="form-label">${title} (قراءة العداد)</label><input type="number" class="form-input" id="odometer-val" placeholder="e.g. 15200" required></div>`;
          
          let footerHtml = '<button class="btn btn-outline" onclick="App.closeModal()">Cancel</button><button class="btn btn-primary" id="save-odo">Save</button>';
          App.showModal(title, formHtml, footerHtml);
          
          document.getElementById('save-odo').addEventListener('click', function() {
            let val = parseFloat(document.getElementById('odometer-val').value);
            if (isNaN(val)) { alert('Please enter a valid number.'); return; }
            if (type === 'end' && val < parseFloat(startVal)) { alert('End odometer must be greater than start odometer.'); return; }
            
            let updateData = {};
            if (type === 'start') {
              updateData.odometer_start = val;
            } else {
              updateData.odometer_end = val;
              updateData.distance_covered = val - parseFloat(startVal);
            }
            
            this.disabled = true; this.innerHTML = 'Saving...';
            sbClient.from('logistics_movements').update(updateData).eq('id', mId).then(function(res) {
              App.closeModal(); App.navigate('logistics');
            });
          });
        });
      });

      // Driver Trip Actions
      document.querySelectorAll('.start-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          if (!confirm('Are you sure you want to start this trip? Camera will open for scanning.')) return;
          
          // Normally we open QR scanner here. We will just simulate it or call startGateScanner logic.
          // Since it's requested to capture start time and image (via QR), we'll update DB.
          let startTime = new Date().toISOString();
          sbClient.from('logistics_movements').update({
             status: 'in_progress',
             start_time: startTime,
             start_image_url: 'scanned_qr_placeholder.png'
          }).eq('id', mId).then(function(res) {
             alert('Trip Started! Time and QR location saved.');
             App.navigate('logistics');
          });
        });
      });
      
      document.querySelectorAll('.end-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let startTime = new Date(this.getAttribute('data-start'));
          if (!confirm('Are you sure you want to end this trip? Camera will open for scanning.')) return;
          
          let endTime = new Date();
          let diffMs = endTime - startTime;
          let diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
          
          sbClient.from('logistics_movements').update({
             status: 'completed',
             end_time: endTime.toISOString(),
             end_image_url: 'scanned_qr_placeholder.png',
             duration_hours: parseFloat(diffHrs)
          }).eq('id', mId).then(function(res) {
             alert('Trip Ended! Duration: ' + diffHrs + ' hours.');
             if (App.user.driver_type === 'internal') {
                // 1. Log Attendance automatically for internal drivers (link trips to attendance)
                let dateStr = startTime.toISOString().split('T')[0];
                let timeIn = startTime.toTimeString().split(' ')[0].substring(0,5);
                let timeOut = endTime.toTimeString().split(' ')[0].substring(0,5);
                
                sbClient.from('hr_attendance').insert({
                   user_id: App.user.id,
                   employee_name: App.user.full_name,
                   date: dateStr,
                   time_in: timeIn,
                   time_out: timeOut,
                   total_hours: parseFloat(diffHrs),
                   status: 'Present'
                }).then(function(){
                   // 2. Overnight Trip Logic (Vacation Days)
                   if (parseFloat(diffHrs) > 8) {
                      let extraHours = parseFloat(diffHrs) - 8;
                      let daysEarned = Math.floor(extraHours / 8);
                      if (daysEarned > 0) {
                         let newBalance = (App.user.annual_leave_balance || 0) + daysEarned;
                         sbClient.from('users').update({ annual_leave_balance: newBalance }).eq('id', App.user.id).then(function() {
                            alert('Overnight Trip: You earned ' + daysEarned + ' day(s) of vacation!');
                            App.user.annual_leave_balance = newBalance;
                            App.navigate('logistics');
                         });
                         return;
                      }
                   }
                   App.navigate('logistics');
                });
                return;
             }
             App.navigate('logistics');
          });
        });
      });

      // 5. Trip Cost Workflow Handlers
      let addCostBtns = document.querySelectorAll('.add-cost-btn');
      addCostBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let formHtml = '<div class="form-group"><label class="form-label">Trip Cost (تكلفة المشوار)</label><input type="number" class="form-input" id="trip-cost-val" placeholder="e.g. 50" required></div>';
          
          let footerHtml = '<button class="btn btn-outline" id="cancel-cost">Cancel</button><button class="btn btn-primary" id="save-cost">Submit Cost</button>';
          App.showModal('Add Trip Cost (إضافة تكلفة)', formHtml, footerHtml);
          
          document.getElementById('cancel-cost').addEventListener('click', App.closeModal);
          document.getElementById('save-cost').addEventListener('click', function() {
            let costVal = parseFloat(document.getElementById('trip-cost-val').value);
            if (isNaN(costVal) || costVal < 0) {
              alert('Please enter a valid cost.');
              return;
            }
            
            let sBtn = this;
            sBtn.disabled = true;
            sBtn.innerHTML = 'Saving...';
            
            sbClient.from('logistics_movements').update({
              trip_cost: costVal,
              cost_status: 'pending_approval'
            }).eq('id', mId).then(function(res) {
              
              // Notify Logistics Manager
              sbClient.from('users').select('id').in('role', ['logistics manager', 'owner']).then(function(uRes) {
                 if (uRes.data) {
                    uRes.data.forEach(function(mgr) {
                       App.addNotification({
                         user_id: mgr.id,
                         title: 'Trip Cost Approval Required',
                         message: 'Driver ' + App.user.full_name + ' has submitted a trip cost of ' + costVal + ' EGP for approval.',
                         type: 'info'
                       });
                    });
                 }
              });

              App.closeModal();
              App.navigate('logistics');
              showToast('Cost submitted for approval', 'success');
            });
          });
        });
      });

      let approveCostBtns = document.querySelectorAll('.approve-cost-btn');
      approveCostBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          if (confirm('Are you sure you want to approve this trip cost?')) {
            sbClient.from('logistics_movements').update({
              cost_status: 'pending_payment'
            }).eq('id', mId).then(function(res) {
              App.navigate('logistics');
              showToast('Cost approved, waiting for payment', 'success');
            });
          }
        });
      });

      let payCostBtns = document.querySelectorAll('.pay-cost-btn');
      payCostBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          if (confirm('Confirm marking this trip cost as PAID?')) {
            sbClient.from('logistics_movements').update({
              cost_status: 'paid'
            }).eq('id', mId).then(function(res) {
              App.navigate('logistics');
              showToast('Cost marked as Paid', 'success');
            });
          }
        });
      });

    });
  }
};

Pages['logistics'] = ERPLogistics.renderLogistics;

window.deleteLogisticsTrip = function(tripId) {
  if (!confirm('Are you sure you want to delete this trip? (هل أنت متأكد من حذف هذا المشوار؟)')) return;
  sbClient.from('logistics_movements').delete().eq('id', tripId).then(function(res) {
    if(res.error) {
      alert('Error deleting trip: ' + res.error.message);
    } else {
      App.navigate('logistics');
    }
  });
};
