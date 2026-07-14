import re

with open('js/erp-logistics.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace start driver trip btn logic
start_trip_pattern = re.compile(
    r"document\.querySelectorAll\('\.start-driver-trip-btn'\)\.forEach\(btn => \{.*?"
    r"btn\.addEventListener\('click', function\(\) \{.*?"
    r"let mId = this\.getAttribute\('data-id'\);.*?"
    r"alert\('Trip Started! Time and QR location saved\.'\);.*?"
    r"App\.navigate\('logistics'\);.*?"
    r"\}\);.*?"
    r"\}\);.*?"
    r"\}\);", 
    re.DOTALL
)

start_trip_replacement = """document.querySelectorAll('.start-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          
          App.showModal('Scan Factory QR to Start (بداية المشوار)', '<div id="trip-scanner" style="width:100%;max-width:500px;margin:0 auto;"></div>');
          
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
      });"""

content = start_trip_pattern.sub(start_trip_replacement, content)

# Replace end driver trip btn logic
end_trip_pattern = re.compile(
    r"document\.querySelectorAll\('\.end-driver-trip-btn'\)\.forEach\(btn => \{.*?"
    r"btn\.addEventListener\('click', function\(\) \{.*?"
    r"let mId = this\.getAttribute\('data-id'\);.*?"
    r"let startTime = new Date\(this\.getAttribute\('data-start'\)\);.*?"
    r"if \(!confirm\('Are you sure you want to end this trip\? Camera will open for scanning\.'\)\) return;.*?"
    r"let endTime = new Date\(\);.*?"
    r"let diffMs = endTime - startTime;.*?"
    r"let diffHrs = \(diffMs / \(1000 \* 60 \* 60\)\)\.toFixed\(2\);.*?"
    r"sbClient\.from\('logistics_movements'\)\.update\(\{.*?"
    r"status: 'completed',.*?"
    r"end_time: endTime\.toISOString\(\),.*?"
    r"end_image_url: 'scanned_qr_placeholder\.png',.*?"
    r"duration_hours: parseFloat\(diffHrs\).*?"
    r"\}\)\.eq\('id', mId\)\.then\(function\(res\) \{.*?"
    r"alert\('Trip Ended! Duration: ' \+ diffHrs \+ ' hours\.'\);.*?"
    r"if \(App\.user\.driver_type === 'internal'\) \{.*?"
    r"// 1\. Log Attendance automatically for internal drivers \(link trips to attendance\).*?"
    r"let dateStr = startTime\.toISOString\(\)\.split\('T'\)\[0\];.*?"
    r"let timeIn = startTime\.toTimeString\(\)\.split\(' '\)\[0\]\.substring\(0,5\);.*?"
    r"let timeOut = endTime\.toTimeString\(\)\.split\(' '\)\[0\]\.substring\(0,5\);.*?"
    r"sbClient\.from\('hr_attendance'\)\.insert\(\{.*?"
    r"user_id: App\.user\.id,.*?"
    r"employee_name: App\.user\.full_name,.*?"
    r"date: dateStr,.*?"
    r"time_in: timeIn,.*?"
    r"time_out: timeOut,.*?"
    r"total_hours: parseFloat\(diffHrs\),.*?"
    r"status: 'Present'.*?"
    r"\}\)\.then\(function\(\)\{.*?"
    r"// 2\. Overnight Trip Logic \(Vacation Days\).*?"
    r"if \(parseFloat\(diffHrs\) > 8\) \{.*?"
    r"let extraHours = parseFloat\(diffHrs\) - 8;.*?"
    r"let daysEarned = Math\.floor\(extraHours / 8\);.*?"
    r"if \(daysEarned > 0\) \{.*?"
    r"let newBalance = \(App\.user\.annual_leave_balance \|\| 0\) \+ daysEarned;.*?"
    r"sbClient\.from\('users'\)\.update\(\{ annual_leave_balance: newBalance \}\)\.eq\('id', App\.user\.id\)\.then\(function\(\) \{.*?"
    r"alert\('Overnight Trip: You earned ' \+ daysEarned \+ ' day\(s\) of vacation!'\);.*?"
    r"App\.user\.annual_leave_balance = newBalance;.*?"
    r"App\.navigate\('logistics'\);.*?"
    r"\}\);.*?"
    r"return;.*?"
    r"\}\(.*?"
    r"\}\(.*?"
    r"App\.navigate\('logistics'\);.*?"
    r"\}\);.*?"
    r"return;.*?"
    r"\}.*?"
    r"App\.navigate\('logistics'\);.*?"
    r"\}\);.*?"
    r"\}\);.*?"
    r"\}\);", 
    re.DOTALL
)

end_trip_replacement = """document.querySelectorAll('.end-driver-trip-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          let startTime = new Date(this.getAttribute('data-start'));
          
          App.showModal('Scan Factory QR to End (نهاية المشوار)', '<div id="trip-scanner-end" style="width:100%;max-width:500px;margin:0 auto;"></div>');
          
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
      });"""

# This regex might fail if the file content slightly differs, let's just do a string replacement using start/end markers
"""

with open('js/erp-logistics.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Manual replacement by finding exact strings
start_idx = content.find("document.querySelectorAll('.start-driver-trip-btn').forEach(btn => {")
end_idx = content.find("// 5. Trip Cost Workflow Handlers")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + start_trip_replacement + "\n\n      " + end_trip_replacement + "\n\n      " + content[end_idx:]
    with open('js/erp-logistics.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Could not find blocks")
