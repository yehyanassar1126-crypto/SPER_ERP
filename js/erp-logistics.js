window.Pages = window.Pages || {};
window.ERPLogistics = {
  renderLogistics: function(el) {
    el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Logistics...</p></div>';
    
    // Fetch Drivers, Movements, and Gate Logs
    let driverQuery = sbClient.from('logistics_drivers').select('*').order('created_at', { ascending: false });
    let moveQuery = sbClient.from('logistics_movements').select('*').order('created_at', { ascending: false });
    let gateQuery = sbClient.from('logistics_gate_logs').select('*').order('scan_time', { ascending: false }).limit(20);
    
    if (App.user.role !== 'owner' && App.user.role !== 'hr manager' && App.user.role !== 'logistics manager') {
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

      // ==========================================
      // DRIVER GATE SCANNER (For Drivers)
      // ==========================================
      if (App.user.role === 'driver') {
        html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:24px; border:1px solid var(--border-color); margin-bottom: 32px;">';
        html += '<h3 style="font-size:1.3rem; font-weight:700; margin-bottom:16px;">Gate In/Out Scanner (تسجيل الخروج والدخول من المصنع)</h3>';
        html += '<p style="color:var(--text-muted); margin-bottom: 16px;">Scan the main factory QR code to register your Gate Out and Gate In.</p>';
        html += '<div style="display:flex; gap:16px;">';
        html += '<button class="btn btn-primary" id="gate-out-btn">' + icon('arrowUpRight', 16) + ' Scan GATE OUT (خروج)</button>';
        html += '<button class="btn btn-secondary" id="gate-in-btn">' + icon('arrowDownLeft', 16) + ' Scan GATE IN (دخول)</button>';
        html += '</div>';
        html += '<div id="gate-scanner-container" style="margin-top:20px; width:100%; max-width:400px; display:none;"></div>';
        
        if (gateLogs.length > 0) {
          html += '<h4 style="margin-top:24px; font-weight:600;">Recent Gate Logs</h4>';
          html += '<table class="table" style="width:100%; margin-top:8px;"><thead><tr style="text-align:left; border-bottom:1px solid #eee;"><th>Time</th><th>Driver</th><th>Action</th></tr></thead><tbody>';
          gateLogs.forEach(log => {
            let color = log.scan_type === 'Gate In' ? '#16a34a' : '#ef4444';
            html += `<tr>
              <td style="padding:8px">${new Date(log.scan_time).toLocaleString()}</td>
              <td style="padding:8px">${log.driver_name}</td>
              <td style="padding:8px"><span style="color:${color}; font-weight:600;">${log.scan_type}</span></td>
            </tr>`;
          });
          html += '</tbody></table>';
        }
        
        html += '</div>';
      }
      // ==========================================
      // DRIVERS SECTION
      // ==========================================
      if (App.user.role === 'owner' || App.user.department === 'Logistics' || App.user.role === 'logistics manager') {
        html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; margin-top:24px;">';
        html += '<h3 style="font-size:1.3rem; font-weight:700;">Registered Drivers (السائقين المسجلين)</h3>';
        html += '<button class="btn btn-primary btn-sm" id="new-driver-btn">' + icon('plus', 16) + ' Add Driver</button>';
        html += '</div>';
        
        html += '<div class="grid-4" style="gap:16px; display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); margin-bottom: 32px;">';
        if (drivers.length === 0) {
          html += '<div style="grid-column:1/-1; padding:20px; background:var(--bg-card); border-radius:var(--radius-md); text-align:center; color:var(--text-muted); border:1px dashed var(--border-color)">No drivers registered yet.</div>';
        } else {
          drivers.forEach(function(d) {
            html += '<div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; align-items:center; gap:12px;">';
            html += '<div style="width:40px; height:40px; border-radius:50%; background:rgba(99,102,241,0.1); color:#6366f1; display:flex; align-items:center; justify-content:center;">' + icon('user', 20) + '</div>';
            html += '<div><div style="font-weight:600">' + d.driver_name + '</div><div style="font-size:0.85rem; color:var(--text-muted)">Car: <span style="color:#6366f1;font-weight:600">' + d.car_number + '</span></div></div>';
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
      html += '<div class="table-responsive"><table class="table" style="width:100%; border-collapse:collapse;">';
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
          html += '<td style="padding:12px">' + new Date(m.created_at).toLocaleString() + '</td>';
          html += '<td style="padding:12px"><div style="font-weight:600">' + m.driver_name + '</div><div style="font-size:0.8rem; color:var(--text-muted)">' + m.car_number + '</div></td>';
          html += '<td style="padding:12px"><span style="background:rgba(34,197,94,0.1); color:#16a34a; padding:4px 8px; border-radius:4px; font-weight:600">' + (m.destination || 'N/A') + '</span></td>';
          
          let distStr = (m.odometer_end && m.odometer_start) ? (m.odometer_end - m.odometer_start) + ' km' : 'N/A';
          html += '<td style="padding:12px"><div style="font-size:0.85rem">Start: ' + (m.odometer_start||'--') + '<br>End: ' + (m.odometer_end||'--') + '<br><strong style="color:#6366f1">Dist: ' + distStr + '</strong></div></td>';
          
          html += '<td style="padding:12px">';
          if (!m.odometer_end && (App.user.role === 'owner' || App.user.department === 'Logistics' || App.user.role === 'logistics manager')) {
            html += '<button class="btn btn-outline btn-sm end-trip-btn" data-id="'+m.id+'" data-start="'+m.odometer_start+'">End Trip</button>';
          } else if (m.odometer_end) {
            html += '<div style="margin-bottom:8px;"><span style="color:#16a34a; font-weight:600;">Completed</span></div>';
            
            let costStat = m.cost_status || 'pending';
            if (costStat === 'pending') {
              if (App.user.role === 'driver') {
                html += '<button class="btn btn-primary btn-sm add-cost-btn" data-id="'+m.id+'">Add Trip Cost</button>';
              } else {
                html += '<span style="color:var(--text-muted); font-size:0.8rem;">Waiting for Driver Cost</span>';
              }
            } else if (costStat === 'pending_approval') {
              if (App.user.department === 'Logistics' || App.user.role === 'logistics manager' || App.user.role === 'owner') {
                 html += '<div style="margin-bottom:4px;">Cost: <strong>'+m.trip_cost+' EGP</strong></div>';
                 html += '<button class="btn btn-warning btn-sm approve-cost-btn" data-id="'+m.id+'">Approve Cost</button>';
              } else {
                 html += '<div>Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#f59e0b; font-size:0.8rem">(Pending Approval)</span></div>';
              }
            } else if (costStat === 'pending_payment') {
              if (App.user.department === 'Finance' || App.user.role === 'owner' || App.user.role === 'hr manager') {
                 html += '<div style="margin-bottom:4px;">Cost: <strong>'+m.trip_cost+' EGP</strong></div>';
                 html += '<button class="btn btn-success btn-sm pay-cost-btn" data-id="'+m.id+'">Mark as Paid</button>';
              } else {
                 html += '<div>Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#3b82f6; font-size:0.8rem">(Pending Payment)</span></div>';
              }
            } else if (costStat === 'paid') {
               html += '<div>Cost: <strong>'+m.trip_cost+' EGP</strong> <br><span style="color:#16a34a; font-weight:bold; font-size:0.8rem">(Paid)</span></div>';
            }
          }
          html += '</td>';
          
          html += '</tr>';
        });
      }
      html += '</tbody></table></div></div>';
      
      el.innerHTML = html;
      
      // ==========================================
      // EVENTS
      // ==========================================

      // 1. Gate In/Out Scanner
      function startGateScanner(scanType) {
        let container = document.getElementById('gate-scanner-container');
        if (!container) return;
        container.style.display = 'block';
        container.innerHTML = 'Starting camera...';
        
        if (typeof Html5Qrcode === 'undefined') {
          container.innerHTML = '<div style="color:red">QR Library not loaded. Check internet connection.</div>';
          return;
        }
        
        var html5QrCode = new Html5Qrcode("gate-scanner-container");
        html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            function(decodedText) {
                html5QrCode.stop().then(function() {
                    container.style.display = 'none';
                    try {
                        var data = JSON.parse(decodedText);
                        if(data.hr_id === 'qr-station') {
                            sbClient.from('logistics_gate_logs').insert({
                                driver_id: App.user.id, // Auth User ID
                                driver_name: App.user.full_name,
                                scan_type: scanType
                            }).then(function(res) {
                                if (res.error) {
                                    alert('Error saving log.');
                                    return;
                                }
                                alert('Success! ' + scanType + ' registered.');
                                App.navigate('logistics');
                            });
                        } else {
                            alert('Invalid QR code.');
                        }
                    } catch(e) {
                        alert('Invalid QR code format.');
                    }
                });
            },
            function(errorMessage) {
                // Ignore background scanning errors
            }
        ).catch(function(err) {
            container.innerHTML = '<div style="color:red">Failed to start camera: ' + err + '</div>';
        });
      }

      let gateOutBtn = document.getElementById('gate-out-btn');
      if (gateOutBtn) {
          gateOutBtn.addEventListener('click', function() { startGateScanner('Gate Out'); });
      }
      let gateInBtn = document.getElementById('gate-in-btn');
      if (gateInBtn) {
          gateInBtn.addEventListener('click', function() { startGateScanner('Gate In'); });
      }      // 2. New Driver
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
          formHtml += '<div class="form-group"><label class="form-label">Odometer Start (قراءة العداد قبل المشوار)</label><input type="number" class="form-input" id="odometer-start" placeholder="e.g. 15000" required></div>';
          
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
            
            if (!dest || !odometerStart) { alert('Please enter destination and odometer reading.'); return; }
            
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
              odometer_start: parseFloat(odometerStart)
            };
            
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

      // 4. End Trip
      let endTripBtns = document.querySelectorAll('.end-trip-btn');
      endTripBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let startOdo = parseFloat(this.getAttribute('data-start'));
          
          let formHtml = `<div style="margin-bottom:12px; padding:12px; background:#f3f4f6; border-radius:8px; font-weight:600;">Odometer Start: ${startOdo}</div>`;
          formHtml += '<div class="form-group"><label class="form-label">Odometer End (قراءة العداد بعد المشوار)</label><input type="number" class="form-input" id="odometer-end-val" placeholder="e.g. 15200" required></div>';
          
          let footerHtml = '<button class="btn btn-outline" id="cancel-end">Cancel</button><button class="btn btn-primary" id="save-end">Complete Trip</button>';
          App.showModal('Complete Trip (إغلاق المشوار)', formHtml, footerHtml);
          
          document.getElementById('cancel-end').addEventListener('click', App.closeModal);
          document.getElementById('save-end').addEventListener('click', function() {
            let endVal = parseFloat(document.getElementById('odometer-end-val').value);
            if (isNaN(endVal) || endVal < startOdo) {
              alert('Please enter a valid ending odometer reading that is greater than or equal to the start reading.');
              return;
            }
            
            let dist = endVal - startOdo;
            let sBtn = this;
            sBtn.disabled = true;
            sBtn.innerHTML = 'Saving...';
            
            sbClient.from('logistics_movements').update({
              odometer_end: endVal,
              distance_covered: dist
            }).eq('id', mId).then(function(res) {
              App.closeModal();
              App.navigate('logistics');
            });
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
