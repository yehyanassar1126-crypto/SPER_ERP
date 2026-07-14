const fs = require('fs');
let content = fs.readFileSync('js/erp-logistics.js', 'utf8');

content = content.replace(
/document\.querySelectorAll\('\.start-driver-trip-btn'\)\.forEach\(btn => \{[\s\S]*?alert\('Trip Started! Time and QR location saved\.'\);\s*App\.navigate\('logistics'\);\s*\}\);\s*\}\);\s*\}\);/,
`document.querySelectorAll('.start-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          
          App.showModal('Scan Factory QR to Start (بداية المشوار)', '<div id="trip-scanner" style="width:100%;max-width:500px;margin:0 auto;"></div><p style="text-align:center;color:#666;margin-top:10px;">You can also upload a photo of the QR code if your camera fails.</p>');
          
          if (typeof Html5QrcodeScanner === 'undefined') {
              document.getElementById('trip-scanner').innerHTML = '<div style="color:red;padding:20px;">QR Library not loaded.</div>';
              return;
          }
          
          var html5QrcodeScanner = new Html5QrcodeScanner("trip-scanner", { fps: 10, qrbox: {width: 250, height: 250} }, false);
          html5QrcodeScanner.render(function(decodedText) {
              html5QrcodeScanner.clear();
              App.closeModal();
              
              let startTime = new Date().toISOString();
              sbClient.from('logistics_movements').update({
                 status: 'in_progress',
                 start_time: startTime,
                 start_image_url: 'scanned_qr_placeholder.png'
              }).eq('id', mId).then(function(res) {
                 showToast('Trip Started! Time and QR location saved.', 'success');
                 App.navigate('logistics');
              });
          }, function(error) {});
        });
      });`
);

content = content.replace(
/document\.querySelectorAll\('\.end-driver-trip-btn'\)\.forEach\(btn => \{[\s\S]*?alert\('Trip Ended! Duration: ' \+ diffHrs \+ ' hours\.'\);[\s\S]*?App\.navigate\('logistics'\);\s*\}\);\s*\}\);\s*\}\);/,
`document.querySelectorAll('.end-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let startTime = new Date(this.getAttribute('data-start'));
          
          App.showModal('Scan Factory QR to End (نهاية المشوار)', '<div id="trip-scanner-end" style="width:100%;max-width:500px;margin:0 auto;"></div><p style="text-align:center;color:#666;margin-top:10px;">You can also upload a photo of the QR code if your camera fails.</p>');
          
          if (typeof Html5QrcodeScanner === 'undefined') {
              document.getElementById('trip-scanner-end').innerHTML = '<div style="color:red;padding:20px;">QR Library not loaded.</div>';
              return;
          }
          
          var html5QrcodeScanner = new Html5QrcodeScanner("trip-scanner-end", { fps: 10, qrbox: {width: 250, height: 250} }, false);
          html5QrcodeScanner.render(function(decodedText) {
              html5QrcodeScanner.clear();
              App.closeModal();
              
              let endTime = new Date();
              let diffMs = endTime - startTime;
              let diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
              
              sbClient.from('logistics_movements').update({
                 status: 'completed',
                 end_time: endTime.toISOString(),
                 end_image_url: 'scanned_qr_placeholder.png',
                 duration_hours: parseFloat(diffHrs)
              }).eq('id', mId).then(function(res) {
                 showToast('Trip Ended! Duration: ' + diffHrs + ' hours.', 'success');
                 if (App.user.driver_type === 'internal') {
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
                       if (parseFloat(diffHrs) > 8) {
                          let extraHours = parseFloat(diffHrs) - 8;
                          let daysEarned = Math.floor(extraHours / 8);
                          if (daysEarned > 0) {
                             let newBalance = (App.user.annual_leave_balance || 0) + daysEarned;
                             sbClient.from('users').update({ annual_leave_balance: newBalance }).eq('id', App.user.id).then(function() {
                                showToast('Overnight Trip: You earned ' + daysEarned + ' day(s) of vacation!', 'info');
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
          }, function(error) {});
        });
      });`
);

fs.writeFileSync('js/erp-logistics.js', content, 'utf8');
console.log('Replaced successfully');
