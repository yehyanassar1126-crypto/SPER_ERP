import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace CSS Variables
root_vars = """:root {
  --font-family: 'Tajawal', 'IBM Plex Sans Arabic', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Backgrounds */
  --bg-primary: #030303;
  --bg-secondary: #090E17;
  --bg-tertiary: #0E1118;
  --bg-card: rgba(14, 17, 24, 0.75);
  --bg-card-hover: rgba(26, 31, 46, 0.85);
  --bg-input: rgba(3, 3, 3, 0.8);
  --bg-sidebar: #030303;
  
  /* Brand Colors */
  --accent-primary: #FF2E2E; /* Fire Red */
  --accent-primary-hover: #FF6A00; /* Lava Orange */
  --accent-primary-soft: rgba(255, 46, 46, 0.15);
  --accent-secondary: #FFC107; /* Royal Gold */
  
  /* Semantic Colors */
  --accent-success: #00E676;
  --accent-success-hover: #00C853;
  --accent-success-soft: rgba(0, 230, 118, 0.15);
  --accent-warning: #FFC400;
  --accent-warning-hover: #FFAB00;
  --accent-warning-soft: rgba(255, 196, 0, 0.15);
  --accent-danger: #FF1744;
  --accent-danger-hover: #D50000;
  --accent-danger-soft: rgba(255, 23, 68, 0.15);
  --accent-info: #29B6F6;
  --accent-info-soft: rgba(41, 182, 246, 0.15);
  
  /* Typography Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #E0E0E0;
  --text-tertiary: #B0BEC5;
  --text-muted: #78909C;
  
  /* Borders */
  --border-color: #262D3D;
  --border-color-hover: rgba(255, 106, 0, 0.5);
  --border-accent: rgba(255, 193, 7, 0.3);
  
  /* Shadows & Glow */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.6);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.8);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.9);
  --shadow-xl: 0 20px 30px rgba(0, 0, 0, 1);
  --shadow-glow: 0 0 15px rgba(255, 46, 46, 0.5), 0 0 30px rgba(255, 106, 0, 0.3);
  --shadow-glow-success: 0 0 15px rgba(0, 230, 118, 0.5);
  --shadow-glow-warning: 0 0 15px rgba(255, 196, 0, 0.5);
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  
  /* Dimensions */
  --sidebar-width: 280px;
  --header-height: 72px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}"""

content = re.sub(r':root\s*\{.*?\}(?=\n/\* ===== ANIMATIONS)', root_vars, content, flags=re.DOTALL)

# 2. Update Body Background & Watermark
body_css = """body {
  font-family: var(--font-family);
  background: linear-gradient(135deg, #030303, #090E17);
  background-attachment: fixed;
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  height: 100vh;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('../public/logo.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 65%;
  opacity: 0.05;
  filter: blur(2px);
  z-index: 0;
  pointer-events: none;
}"""
content = re.sub(r'body\s*\{.*?\}', body_css, content, flags=re.DOTALL, count=1)

# 3. Transparent App Layout
content = re.sub(
    r'\.app-layout\s*\{.*?\}',
    '.app-layout { display: flex; height: 100vh; overflow: hidden; background: transparent; position: relative; z-index: 1; }',
    content, flags=re.DOTALL
)

# 4. Sidebar styling (Military/Cyber)
content = re.sub(
    r'\.sidebar\s*\{.*?\}',
    '.sidebar { width: var(--sidebar-width); background: rgba(3, 3, 3, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-right: 2px solid var(--border-color); display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; overflow: hidden; box-shadow: 5px 0 20px rgba(0,0,0,0.8); transition: width var(--transition-base); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.sidebar-item\s*\{.*?\}',
    '.sidebar-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); font-size: 0.95rem; font-weight: 600; margin-bottom: 4px; border: 1px solid transparent; background: transparent; width: 100%; text-align: left; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.sidebar-item:hover\s*\{.*?\}',
    '.sidebar-item:hover { background: var(--bg-card-hover); border-color: var(--border-color-hover); color: var(--text-primary); transform: translateX(6px); box-shadow: inset 2px 0 0 var(--accent-primary-hover), var(--shadow-sm); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.sidebar-item\.active\s*\{.*?\}',
    '.sidebar-item.active { background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-hover)); color: #FFF; border-color: transparent; box-shadow: var(--shadow-glow); } .sidebar-item.active .sidebar-item-icon { color: var(--accent-secondary); text-shadow: 0 0 10px var(--accent-secondary); }',
    content, flags=re.DOTALL
)

# 5. Header Styling
content = re.sub(
    r'\.header\s*\{.*?\}',
    '.header { height: var(--header-height); background: rgba(3, 3, 3, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; position: relative; z-index: 40; box-shadow: 0 4px 20px rgba(0,0,0,0.8); }',
    content, flags=re.DOTALL
)

# 6. Card & Dashboard Cards Styling
content = re.sub(
    r'\.card\s*\{.*?\}',
    '.card { background: var(--bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: var(--radius-xl); overflow: hidden; animation: slideUpFade 0.6s ease-out backwards; box-shadow: var(--shadow-lg); transition: all var(--transition-base); margin-bottom: 24px; position: relative; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.card:hover\s*\{.*?\}',
    '.card:hover { box-shadow: var(--shadow-xl), var(--shadow-glow); border-color: var(--border-color-hover); transform: translateY(-4px); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.stat-card\s*\{.*?\}',
    '.stat-card { background: linear-gradient(145deg, var(--bg-card), var(--bg-tertiary)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 24px; transition: all var(--transition-base); position: relative; overflow: hidden; box-shadow: var(--shadow-md); animation: slideUpFade 0.5s ease-out backwards; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.stat-card:hover\s*\{.*?\}',
    '.stat-card:hover { border-color: var(--accent-primary-hover); transform: translateY(-6px) scale(1.02); box-shadow: var(--shadow-xl), var(--shadow-glow); }',
    content, flags=re.DOTALL
)

# 7. Tables
content = re.sub(
    r'\.data-table tbody tr:hover\s*\{.*?\}',
    '.data-table tbody tr:hover { background: rgba(255, 46, 46, 0.08); transform: scale(1.01); box-shadow: inset 0 0 15px rgba(255,46,46,0.2); border-left: 3px solid var(--accent-primary); z-index: 2; position: relative; }',
    content, flags=re.DOTALL
)

# 8. Modals
content = re.sub(
    r'\.modal-content\s*\{.*?\}',
    '.modal-content { background: rgba(14, 17, 24, 0.85); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); border: 1px solid var(--border-color-hover); border-radius: var(--radius-xl); width: 100%; max-width: 500px; position: relative; z-index: 101; display: flex; flex-direction: column; max-height: 90vh; box-shadow: var(--shadow-xl), var(--shadow-glow); animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.modal-backdrop\s*\{.*?\}',
    '.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); z-index: 100; animation: fadeIn 0.3s ease-out; }',
    content, flags=re.DOTALL
)

# 9. Buttons
content = re.sub(
    r'\.btn-primary\s*\{.*?\}',
    '.btn-primary { background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover)); color: white; border: none; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-primary:hover:not\(:disabled\)\s*\{.*?\}',
    '.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, var(--accent-primary-hover), var(--accent-primary)); box-shadow: 0 8px 16px rgba(255,46,46,0.4), var(--shadow-glow); transform: translateY(-3px) scale(1.05); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-secondary\s*\{.*?\}',
    '.btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--accent-primary-soft); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-secondary:hover:not\(:disabled\)\s*\{.*?\}',
    '.btn-secondary:hover:not(:disabled) { background: var(--bg-card-hover); border-color: var(--accent-primary); color: var(--accent-primary-hover); box-shadow: var(--shadow-glow); transform: translateY(-3px) scale(1.05); }',
    content, flags=re.DOTALL
)

# 10. Inputs
content = re.sub(
    r'\.form-input\s*\{.*?\}',
    '.form-input { width: 100%; padding: 12px 16px; background: rgba(3,3,3,0.8); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.95rem; font-weight: 500; transition: all var(--transition-fast); outline: none; box-shadow: inset 0 2px 5px rgba(0,0,0,0.8); backdrop-filter: blur(10px); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.form-input:focus\s*\{.*?\}',
    '.form-input:focus { background: var(--bg-tertiary); border-color: var(--accent-primary-hover); box-shadow: 0 0 0 3px rgba(255,106,0,0.2), var(--shadow-glow); }',
    content, flags=re.DOTALL
)

# 11. Scrollbar update
content = re.sub(
    r'::-webkit-scrollbar-thumb\s*\{.*?\}',
    '::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--accent-primary), var(--accent-primary-hover)); border-radius: var(--radius-full); border: 2px solid var(--bg-primary); }',
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Enterprise Premium CSS Variables Updated')
