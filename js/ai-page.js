// ===== AI MIND PAGE RENDERER =====
// Renders the stunning neural-network-themed AI Intelligence page

window.Pages = window.Pages || {};
Pages.aiMind = function (el) {
  var data = { employees: [], attendance: [], leaves: [], payroll: [], overtime: [] };
  var insights = [];
  var riskScores = [];
  var chatMessages = [
    {
      role: 'ai',
      text: "Hello! 🧠 I'm the **AI Mind** of Smart Factory. I've been analyzing your workforce data in real-time.\n\nI can detect patterns, predict risks, and give you smart recommendations. Ask me anything about your team!",
      suggestions: ['Show attendance insights', 'Who is at risk?', 'Department performance', 'Recommend improvements']
    }
  ];

  el.innerHTML = '<div style="padding:60px;text-align:center"><span class="spinner" style="margin-bottom:16px;"></span><p style="color:var(--text-muted)">🧠 AI Mind is booting up... Analyzing workforce data...</p></div>';

  // Load all data
  var myLevel = App.getRoleLevel(App.user ? App.user.role : 'hr');
  var allowedRoles = [];
  if (myLevel >= 6) allowedRoles.push('hr manager', 'hr', 'hall manager', 'department head', 'employee');
  if (myLevel >= 5) allowedRoles.push('hr', 'hall manager', 'department head', 'employee');
  if (myLevel >= 4) allowedRoles.push('hall manager', 'department head', 'employee');
  if (myLevel >= 3) allowedRoles.push('department head', 'employee');
  if (myLevel >= 2) allowedRoles.push('employee');
  allowedRoles = allowedRoles.filter(function (item, pos) { return allowedRoles.indexOf(item) === pos; });

  Promise.all([
    sbClient.from('users').select('*').in('role', allowedRoles),
    sbClient.from('attendance').select('*').order('date', { ascending: false }),
    sbClient.from('leave_requests').select('*'),
    sbClient.from('payroll').select('*'),
    sbClient.from('overtime').select('*')
  ]).then(function (results) {
    data.employees = results[0].data || [];
    data.attendance = results[1].data || [];
    data.leaves = results[2].data || [];
    data.payroll = results[3].data || [];
    data.overtime = results[4].data || [];

    // Run AI analysis
    insights = AIMind.runFullAnalysis(data);
    riskScores = AIMind.generateRiskScores(data.employees, data.attendance, data.leaves, data.payroll);

    renderPage();
  });

  function renderPage() {
    var criticalCount = insights.filter(function (i) { return i.severity === 'critical'; }).length;
    var highCount = insights.filter(function (i) { return i.severity === 'high'; }).length;
    var mediumCount = insights.filter(function (i) { return i.severity === 'medium'; }).length;
    var highRiskEmps = riskScores.filter(function (r) { return r.level === 'critical' || r.level === 'high'; }).length;

    var html = '<div class="ai-mind-container">';

    // Neural Network Canvas
    html += '<canvas class="neural-canvas" id="neural-canvas"></canvas>';

    // Brain Header
    html += '<div class="ai-brain-header">';
    html += '<div class="ai-brain-orb"><span class="ai-brain-orb-inner">🧠</span></div>';
    html += '<div class="ai-brain-info"><h2>AI Intelligence Engine</h2><p>Real-time workforce analysis • Pattern recognition • Predictive insights</p></div>';
    html += '<div class="ai-brain-status"><span class="ai-status-dot"></span> Neural Network Active</div>';
    html += '</div>';

    // Stats Row
    html += '<div class="ai-stats-row">';
    html += '<div class="ai-stat"><div class="ai-stat-icon">🔍</div><div class="ai-stat-value">' + insights.length + '</div><div class="ai-stat-label">Insights Found</div></div>';
    html += '<div class="ai-stat"><div class="ai-stat-icon">⚠️</div><div class="ai-stat-value">' + (criticalCount + highCount) + '</div><div class="ai-stat-label">Critical Alerts</div></div>';
    html += '<div class="ai-stat"><div class="ai-stat-icon">👥</div><div class="ai-stat-value">' + highRiskEmps + '</div><div class="ai-stat-label">At-Risk Employees</div></div>';
    html += '<div class="ai-stat"><div class="ai-stat-icon">📊</div><div class="ai-stat-value">' + data.employees.length + '</div><div class="ai-stat-label">Analyzed Profiles</div></div>';
    html += '</div>';

    // Main Grid: Chat + Insights
    html += '<div class="ai-grid">';

    // === Chat Interface ===
    html += '<div class="ai-chat-card">';
    html += '<div class="ai-chat-header"><div class="ai-chat-header-icon">💬</div><div><h3>Talk to AI Mind</h3><p>Ask questions about your workforce</p></div></div>';
    html += '<div class="ai-chat-messages" id="ai-chat-messages">';
    html += renderChatMessages();
    html += '</div>';
    html += '<div class="ai-chat-input-wrapper">';
    html += '<input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Ask me anything about your workforce..." autocomplete="off">';
    html += '<button class="ai-chat-send" id="ai-chat-send" title="Send">' + icon('send', 18) + '</button>';
    html += '</div></div>';

    // === Insights Panel ===
    html += '<div class="ai-insights-card">';
    html += '<div class="ai-insights-header"><div><h3>🔮 Live Insights</h3><p>' + insights.length + ' patterns detected</p></div>';
    html += '<button class="btn btn-xs btn-outline" id="ai-refresh-btn">' + icon('refreshCw', 12) + ' Rescan</button></div>';
    html += '<div class="ai-insights-body" id="ai-insights-body">';
    if (insights.length === 0) {
      html += '<div class="ai-insights-empty"><div class="ai-insights-empty-icon">✅</div><p>All systems healthy!<br>No anomalies detected.</p></div>';
    } else {
      insights.forEach(function (insight, idx) {
        html += '<div class="ai-insight-item severity-' + insight.severity + '" style="animation-delay:' + (idx * 0.08) + 's">';
        html += '<div class="ai-insight-top">';
        html += '<span class="ai-insight-icon">' + insight.icon + '</span>';
        html += '<span class="ai-insight-title">' + insight.title + '</span>';
        html += '<span class="ai-insight-severity ' + insight.severity + '">' + insight.severity + '</span>';
        html += '</div>';
        html += '<div class="ai-insight-msg">' + insight.message + '</div>';
        html += '</div>';
      });
    }
    html += '</div></div>';

    html += '</div>'; // close ai-grid

    // === Risk Assessment Section ===
    html += '<div class="ai-section-title"><h3>🎯 Employee Risk Assessment</h3></div>';

    if (riskScores.length === 0 || riskScores.every(function(r) { return r.score === 0; })) {
      html += '<div class="card" style="padding:40px;text-align:center;color:var(--text-muted)"><p>✅ No employees with risk factors detected. Excellent!</p></div>';
    } else {
      html += '<div class="ai-risk-grid">';
      var displayedRisks = riskScores.filter(function (r) { return r.score > 0; }).slice(0, 12);
      displayedRisks.forEach(function (risk) {
        html += '<div class="ai-risk-card risk-' + risk.level + '">';
        html += '<div class="ai-risk-top">';
        html += '<div class="ai-risk-avatar" style="background:' + risk.avatar_color + '">' + getInitials(risk.name) + '</div>';
        html += '<div><div class="ai-risk-name">' + risk.name + '</div><div class="ai-risk-dept">' + risk.department + '</div></div>';
        html += '<div class="ai-risk-score-wrapper"><div class="ai-risk-score ' + risk.level + '">' + risk.score + '</div><div class="ai-risk-score-label">Risk</div></div>';
        html += '</div>';
        html += '<div class="ai-risk-bar"><div class="ai-risk-bar-fill ' + risk.level + '" style="width:' + Math.min(risk.score, 100) + '%"></div></div>';
        html += '<div class="ai-risk-factors">';
        risk.factors.forEach(function (f) {
          html += '<div class="ai-risk-factor">' + f + '</div>';
        });
        if (risk.factors.length === 0) {
          html += '<div class="ai-risk-factor" style="color:var(--accent-success)">No significant risk factors</div>';
        }
        html += '</div></div>';
      });
      html += '</div>';
    }

    html += '</div>'; // close ai-mind-container

    el.innerHTML = html;

    // Initialize neural canvas
    initNeuralCanvas();

    // Bind chat events
    bindChatEvents();

    // Bind refresh
    var refreshBtn = document.getElementById('ai-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        insights = AIMind.runFullAnalysis(data);
        riskScores = AIMind.generateRiskScores(data.employees, data.attendance, data.leaves, data.payroll);
        renderPage();
        showToast('🧠 AI Mind rescanned all data!', 'success');
      });
    }
  }

  function renderChatMessages() {
    var html = '';
    chatMessages.forEach(function (msg) {
      var isUser = msg.role === 'user';
      html += '<div class="ai-message ' + (isUser ? 'user' : '') + '">';
      html += '<div class="ai-msg-avatar">' + (isUser ? '👤' : '🧠') + '</div>';
      html += '<div class="ai-msg-bubble">' + formatAIText(msg.text);
      if (msg.suggestions && msg.suggestions.length > 0) {
        html += '<div class="ai-suggestions">';
        msg.suggestions.forEach(function (s) {
          html += '<span class="ai-suggestion-chip" data-suggestion="' + s.replace(/"/g, '&quot;') + '">' + s + '</span>';
        });
        html += '</div>';
      }
      html += '</div></div>';
    });
    return html;
  }

  function formatAIText(text) {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em style="color:var(--text-muted);font-style:italic">$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '<span style="color:var(--accent-primary)">•</span> ');
  }

  function bindChatEvents() {
    var input = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');
    var messagesEl = document.getElementById('ai-chat-messages');

    if (!input || !sendBtn) return;

    function sendMessage(text) {
      if (!text || !text.trim()) return;

      // Add user message
      chatMessages.push({ role: 'user', text: text });

      // Re-render messages + typing indicator
      messagesEl.innerHTML = renderChatMessages();
      messagesEl.innerHTML += '<div class="ai-message" id="ai-typing-indicator"><div class="ai-msg-avatar">🧠</div><div class="ai-msg-bubble"><div class="ai-typing"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div></div></div>';
      messagesEl.scrollTop = messagesEl.scrollHeight;
      input.value = '';

      // Simulate AI thinking
      setTimeout(function () {
        var response = AIMind.processQuery(text, data);
        chatMessages.push({ role: 'ai', text: response.text, suggestions: response.suggestions });

        // Remove typing indicator and re-render
        messagesEl.innerHTML = renderChatMessages();
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Rebind suggestion chips
        bindSuggestionChips();
      }, 800 + Math.random() * 1200);
    }

    sendBtn.addEventListener('click', function () {
      sendMessage(input.value.trim());
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });

    // Bind initial suggestion chips
    bindSuggestionChips();
  }

  function bindSuggestionChips() {
    document.querySelectorAll('.ai-suggestion-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var text = this.getAttribute('data-suggestion');
        var input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = text;
          // Trigger send
          var sendBtn = document.getElementById('ai-chat-send');
          if (sendBtn) sendBtn.click();
        }
      });
    });
  }

  // Neural Network Canvas Animation
  function initNeuralCanvas() {
    var canvas = document.getElementById('neural-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var nodes = [];
    var connections = [];
    var animFrame;
    var mouseX = 0, mouseY = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Create neural nodes
    var nodeCount = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 60);
    for (var i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 2 + Math.random() * 2.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
        color: ['99,102,241', '6,182,212', '168,85,247', '34,197,94'][Math.floor(Math.random() * 4)]
      });
    }

    // Track mouse for interactivity
    canvas.parentElement.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      nodes.forEach(function (node) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        var pulseRadius = node.radius + Math.sin(node.pulse) * 1;
        var alpha = 0.3 + Math.sin(node.pulse) * 0.15;

        // Draw node glow
        var gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, pulseRadius * 4);
        gradient.addColorStop(0, 'rgba(' + node.color + ',' + (alpha * 0.4) + ')');
        gradient.addColorStop(1, 'rgba(' + node.color + ',0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw node core
        ctx.fillStyle = 'rgba(' + node.color + ',' + alpha + ')';
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            var alpha = (1 - dist / 180) * 0.12;
            ctx.strokeStyle = 'rgba(99, 102, 241, ' + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Data pulse effect along connection
            if (Math.random() < 0.001) {
              var pulsePos = Math.random();
              var px = nodes[i].x + (nodes[j].x - nodes[i].x) * pulsePos;
              var py = nodes[i].y + (nodes[j].y - nodes[i].y) * pulsePos;
              ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
              ctx.beginPath();
              ctx.arc(px, py, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Mouse interaction — attract nearby nodes
      nodes.forEach(function (node) {
        var dx = mouseX - node.x;
        var dy = mouseY - node.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          node.vx += (dx / dist) * 0.02;
          node.vy += (dy / dist) * 0.02;
          // Dampen velocity
          node.vx *= 0.99;
          node.vy *= 0.99;
        }
      });

      animFrame = requestAnimationFrame(animate);
    }

    animate();

    // Cleanup on page change
    var observer = new MutationObserver(function () {
      if (!document.getElementById('neural-canvas')) {
        cancelAnimationFrame(animFrame);
        observer.disconnect();
      }
    });
    observer.observe(el, { childList: true });
  }
};
