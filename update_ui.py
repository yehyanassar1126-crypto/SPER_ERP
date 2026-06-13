import os

# 1. Update logo in app.js
app_js_path = "js/app.js"
with open(app_js_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Replace sidebar logo
old_logo = "'<div class=\"sidebar-header\"><div class=\"sidebar-logo\">' + icon('factory', 20) + '</div><div class=\"sidebar-brand\"><h2>Smart Factory</h2><p>HR Management</p></div></div>';"
new_logo = """'<div class="sidebar-header"><div class="sidebar-logo" style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:#fff;display:flex;align-items:center;justify-content:center;padding:2px;"><img src="public/logo.png" onerror="this.style.display=\\\'none\\\'; this.parentNode.innerHTML=icon(\\\'factory\\\', 24);" alt="Logo" style="max-width:100%;max-height:100%;object-fit:contain;"></div><div class="sidebar-brand"><h2>Ninja Factory</h2><p>HR & ERP</p></div></div>';"""

app_js = app_js.replace(old_logo, new_logo)
app_js = app_js.replace("Smart Factory", "Ninja Factory")

with open(app_js_path, "w", encoding="utf-8") as f:
    f.write(app_js)

print("app.js updated.")
