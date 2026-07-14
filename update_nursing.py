import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """    // Spare Parts Module
    html += '<div onclick="App.navigate(\\'erp-spare-parts\\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\\'translateY(-5px)\\'; this.style.borderColor=\\'#10b981\\'; this.style.boxShadow=\\'0 12px 30px rgba(16,185,129,0.15)\\'" onmouseout="this.style.transform=\\'none\\'; this.style.borderColor=\\'var(--border-color)\\'; this.style.boxShadow=\\'none\\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(16,185,129,0.1); color: #10b981; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('settings', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Spare Parts (قطع الغيار)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Spare parts inventory tracking, consumption, and requests.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(16,185,129,0.1); color: #10b981; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';

    // Nursing Module
    html += '<div onclick="App.navigate(\\'nursing-medical-approvals\\')" style="background: var(--bg-card); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform=\\'translateY(-5px)\\'; this.style.borderColor=\\'#f43f5e\\'; this.style.boxShadow=\\'0 12px 30px rgba(244,63,94,0.15)\\'" onmouseout="this.style.transform=\\'none\\'; this.style.borderColor=\\'var(--border-color)\\'; this.style.boxShadow=\\'none\\'">';
    html += '<div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(244,63,94,0.1); color: #f43f5e; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">' + icon('heart', 26) + '</div>';
    html += '<h3 style="margin-bottom: 10px; font-size: 1.2rem;">Nursing (التمريض)</h3>';
    html += '<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">Employee health records, medical checkups, sick leaves, and clinic visits.</p>';
    html += '<div><span style="padding: 6px 12px; border-radius: 20px; background: rgba(244,63,94,0.1); color: #f43f5e; font-size: 0.8rem; font-weight: 700;">Active</span></div>';
    html += '</div>';"""

content = re.sub(r'    // Spare Parts Module\n.*?html \+= \'</div>\';', replacement, content, flags=re.DOTALL)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully')
