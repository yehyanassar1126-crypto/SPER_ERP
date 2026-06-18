// ===== HELPER FUNCTIONS =====
function formatDate(date) {
  if (!date) return '—';
  var d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatTime(date) {
  if (!date) return '—';
  var d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateTime(date) {
  if (!date) return '—';
  var d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2);
}

function calculateInsuranceDuration(startDate) {
  if (!startDate) return { years: 0, months: 0, days: 0, totalDays: 0 };
  var start = new Date(startDate);
  var now = new Date();
  var totalDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (totalDays < 0) totalDays = 0; // Prevent negative durations for future dates
  var years = Math.floor(totalDays / 365);
  var months = Math.floor((totalDays % 365) / 30);
  var days = totalDays % 30;
  return { years: years, months: months, days: days, totalDays: totalDays };
}

function exportToExcel(data, filename) {
  if (!data || !data.length) return;
  
  if (typeof XLSX === 'undefined') {
    alert('Excel library not loaded');
    return;
  }
  
  var worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set RTL direction for the worksheet
  worksheet['!dir'] = 'rtl';
  
  var workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  
  // Write to Excel file
  XLSX.writeFile(workbook, filename + '_' + new Date().toISOString().split('T')[0] + '.xlsx');
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Toast notification system
var toastContainer = null;
function showToast(message, type) {
  type = type || 'info';
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

function formatDelay(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) return 'On time';
  var h = Math.floor(totalMinutes / 60);
  var m = Math.floor(totalMinutes % 60);
  var parts = [];
  if (h > 0) parts.push(h + 'h');
  if (m > 0) parts.push(m + 'm');
  if (parts.length === 0) return 'On time';
  return parts.join(' ');
}

// ----- HR APPROVAL RULES -----
function canApprove(requesterId, requesterRole) {
  if (!App.user) return false;
  if (App.user.id === requesterId) return false; // No user can approve own requests
  
  var myRole = App.user.role ? App.user.role.toLowerCase() : '';
  var reqRole = requesterRole ? requesterRole.toLowerCase() : 'employee';
  
  if (myRole === 'owner') return true; // Owner can approve anything (except their own, handled above)
  
  if (reqRole === 'hr manager') {
    return myRole === 'owner'; // HR Manager approved ONLY by Owner
  }
  
  if (reqRole === 'hr') {
    return myRole === 'hr manager' || myRole === 'owner'; // HR approved by HR Manager or Owner
  }
  
  // For other employees, HR, HR Manager, or Owner can approve
  return myRole === 'hr' || myRole === 'hr manager' || myRole === 'owner';
}
