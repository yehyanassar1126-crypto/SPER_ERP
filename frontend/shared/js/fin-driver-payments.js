window.Pages = window.Pages || {};

Pages.driverPayments = function(el) {
  el.innerHTML = '<div style="padding:40px;text-align:center"><span class="spinner"></span><p>Loading Driver Payments...</p></div>';

  sbClient.from('logistics_movements')
    .select('*')
    .in('cost_status', ['pending_payment', 'paid'])
    .order('created_at', { ascending: false })
    .then(function(res) {
      if (res.error) {
        el.innerHTML = '<div class="alert alert-danger">Error loading data: ' + res.error.message + '</div>';
        return;
      }
      
      let trips = res.data || [];
      let pendingTrips = trips.filter(t => t.cost_status === 'pending_payment');
      let paidTrips = trips.filter(t => t.cost_status === 'paid');

      let html = '<div class="module-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">';
      html += '<div><h2 style="font-size:1.8rem; font-weight:700; margin-bottom:4px;">Driver Trip Payments (حسابات السائقين)</h2>';
      html += '<p style="color:var(--text-muted)">Manage and settle payments for external drivers after logistics approval.</p></div>';
      html += '</div>';

      // Pending Payments Section
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:24px; border:1px solid var(--border-color); margin-bottom: 32px;">';
      html += '<h3 style="font-size:1.3rem; font-weight:700; margin-bottom:16px; color:#f59e0b;">Pending Payments (بانتظار الصرف) - ' + pendingTrips.length + '</h3>';
      
      if (pendingTrips.length === 0) {
        html += '<div style="padding:24px; text-align:center; color:var(--text-muted); background:var(--bg-secondary); border-radius:8px;">No pending payments. All caught up!</div>';
      } else {
        html += '<div class="table-responsive" style="overflow-x:auto; width:100%;"><table class="table" style="width:100%; min-width:600px; border-collapse:collapse;">';
        html += '<thead><tr style="text-align:left; border-bottom:1px solid var(--border-color);">';
        html += '<th style="padding:12px">Date</th>';
        html += '<th style="padding:12px">Driver</th>';
        html += '<th style="padding:12px">Destination</th>';
        html += '<th style="padding:12px">Cost (EGP)</th>';
        html += '<th style="padding:12px">Action</th>';
        html += '</tr></thead><tbody>';
        
        pendingTrips.forEach(function(m) {
          html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)">';
          html += '<td style="padding:12px">' + new Date(m.created_at).toLocaleString() + '</td>';
          html += '<td style="padding:12px"><div style="font-weight:600">' + m.driver_name + '</div></td>';
          html += '<td style="padding:12px">' + (m.destination || 'N/A') + '</td>';
          html += '<td style="padding:12px"><strong style="color:#f59e0b; font-size:1.1rem;">' + m.trip_cost + ' EGP</strong></td>';
          html += '<td style="padding:12px"><button class="btn btn-success btn-sm mark-paid-btn" data-id="' + m.id + '">Pay Now (تم الصرف)</button></td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';

      // Paid Trips Section
      html += '<div class="card" style="background:var(--bg-card); border-radius:var(--radius-lg); padding:24px; border:1px solid var(--border-color);">';
      html += '<h3 style="font-size:1.3rem; font-weight:700; margin-bottom:16px; color:#16a34a;">Recent Payments (المدفوعات السابقة)</h3>';
      
      if (paidTrips.length === 0) {
        html += '<div style="padding:24px; text-align:center; color:var(--text-muted); background:var(--bg-secondary); border-radius:8px;">No payment history.</div>';
      } else {
        html += '<div class="table-responsive" style="overflow-x:auto; width:100%;"><table class="table" style="width:100%; min-width:600px; border-collapse:collapse;">';
        html += '<thead><tr style="text-align:left; border-bottom:1px solid var(--border-color);">';
        html += '<th style="padding:12px">Date Paid</th>';
        html += '<th style="padding:12px">Driver</th>';
        html += '<th style="padding:12px">Destination</th>';
        html += '<th style="padding:12px">Cost (EGP)</th>';
        html += '<th style="padding:12px">Status</th>';
        html += '</tr></thead><tbody>';
        
        paidTrips.forEach(function(m) {
          html += '<tr style="border-bottom:1px solid rgba(0,0,0,0.05)">';
          html += '<td style="padding:12px">' + new Date(m.created_at).toLocaleString() + '</td>';
          html += '<td style="padding:12px"><div style="font-weight:600">' + m.driver_name + '</div></td>';
          html += '<td style="padding:12px">' + (m.destination || 'N/A') + '</td>';
          html += '<td style="padding:12px"><strong>' + m.trip_cost + ' EGP</strong></td>';
          html += '<td style="padding:12px"><span class="badge badge-success">Paid</span></td>';
          html += '</tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';

      el.innerHTML = html;

      // Event Listeners
      document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          let mId = this.getAttribute('data-id');
          if (!confirm('Are you sure you have paid this driver? This action cannot be undone.')) return;
          
          let targetBtn = this;
          targetBtn.disabled = true;
          targetBtn.innerHTML = 'Processing...';
          
          let m = trips.find(t => t.id === mId);
          if(!m) return;
          
          let cost = parseFloat(m.trip_cost);
          
          // Deduct from Main Safe (or first available)
          sbClient.from('finance_safes').select('*').order('created_at').limit(1).single().then(function(resSafe) {
             let safe = resSafe.data;
             if (!safe || safe.balance < cost) {
                alert('❌ عذراً، رصيد الخزينة لا يكفي لإتمام عملية الصرف!');
                targetBtn.disabled = false;
                targetBtn.innerHTML = 'Pay Now (تم الصرف)';
                return;
             }
             
             // Deduct from safe
             sbClient.from('finance_safes').update({ balance: Number(safe.balance) - cost }).eq('id', safe.id).then(function(updSafe) {
                if (updSafe.error) {
                    alert('Error deducting from safe: ' + updSafe.error.message);
                    targetBtn.disabled = false;
                    targetBtn.innerHTML = 'Pay Now (تم الصرف)';
                    return;
                }
                
                // Add transaction
                sbClient.from('finance_treasury_tx').insert({
                   type: 'external_driver', method: 'cash', amount: cost,
                   description: 'صرف حساب سائق خارجي: ' + m.driver_name + (m.destination ? ' (' + m.destination + ')' : ''),
                   status: 'cleared', settlement_status: 'settled',
                   amount_spent: cost, amount_returned: 0,
                   created_by: App.user.id, created_by_name: App.user.full_name
                }).then(function(insTx) {
                   if (insTx.error) {
                      alert('Error recording transaction: ' + insTx.error.message);
                      return;
                   }
                   
                   // Finally mark as paid
                   sbClient.from('logistics_movements').update({ cost_status: 'paid' }).eq('id', mId).then(function(updRes) {
                     if (updRes.error) {
                       alert('Error marking as paid: ' + updRes.error.message);
                       return;
                     }
                     showToast('Payment successful & deducted from safe!', 'success');
                     Pages.driverPayments(el); 
                   });
                });
             });
          });
        });
      });
    });
};
