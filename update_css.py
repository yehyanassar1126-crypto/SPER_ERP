import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the entire :root block
root_replacement = """:root {
  --font-family: 'Tajawal', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Backgrounds */
  --bg-primary: #05070D;
  --bg-secondary: #0A0F1F;
  --bg-tertiary: #111827;
  --bg-card: rgba(10, 15, 31, 0.65);
  --bg-card-hover: rgba(17, 24, 39, 0.85);
  --bg-input: rgba(5, 7, 13, 0.8);
  --bg-sidebar: #05070D;
  
  /* Brand Colors */
  --accent-primary: #FF3B30;
  --accent-primary-hover: #FF6A00;
  --accent-primary-soft: rgba(255, 59, 48, 0.15);
  --accent-secondary: #FFD700;
  
  /* Semantic Colors */
  --accent-success: #00E676;
  --accent-success-hover: #00C853;
  --accent-success-soft: rgba(0, 230, 118, 0.15);
  --accent-warning: #FFC107;
  --accent-warning-hover: #FFA000;
  --accent-warning-soft: rgba(255, 193, 7, 0.15);
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
  --border-color: rgba(255, 59, 48, 0.2);
  --border-color-hover: rgba(255, 106, 0, 0.5);
  --border-accent: rgba(255, 215, 0, 0.3);
  
  /* Soft Shadows & Neon Glow */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.8);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.9);
  --shadow-glow: 0 0 15px rgba(255, 59, 48, 0.5), 0 0 30px rgba(255, 106, 0, 0.2);
  --shadow-glow-success: 0 0 15px rgba(0, 230, 118, 0.4);
  
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
content = re.sub(r':root\s*\{.*?(?=\n\})\}', root_replacement, content, flags=re.DOTALL)

# 2. Update Card styles for Glassmorphism
content = re.sub(
    r'\.card\s*\{.*?\}',
    '.card { background: var(--bg-card); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: var(--radius-xl); overflow: hidden; animation: slideUpFade 0.6s ease-out backwards; box-shadow: var(--shadow-lg); transition: all var(--transition-base); margin-bottom: 24px; position: relative; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.card:hover\s*\{.*?\}',
    '.card:hover { box-shadow: var(--shadow-xl), var(--shadow-glow); border-color: var(--border-color-hover); transform: translateY(-2px); }',
    content, flags=re.DOTALL
)

# 3. Update Stat Cards
content = re.sub(
    r'\.stat-card\s*\{.*?\}',
    '.stat-card { background: linear-gradient(145deg, var(--bg-card), var(--bg-secondary)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: 24px; transition: all var(--transition-base); position: relative; overflow: hidden; box-shadow: var(--shadow-md); animation: slideUpFade 0.5s ease-out backwards; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.stat-card:hover\s*\{.*?\}',
    '.stat-card:hover { border-color: var(--accent-primary); transform: translateY(-6px) scale(1.02); box-shadow: var(--shadow-xl), var(--shadow-glow); }',
    content, flags=re.DOTALL
)

# 4. Buttons Gradient & Glow
content = re.sub(
    r'\.btn-primary\s*\{.*?\}',
    '.btn-primary { background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover)); color: white; border: none; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-primary:hover:not\(:disabled\)\s*\{.*?\}',
    '.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, var(--accent-primary-hover), var(--accent-primary)); box-shadow: 0 8px 16px rgba(255,59,48,0.3), var(--shadow-glow); transform: translateY(-2px) scale(1.05); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-success\s*\{.*?\}',
    '.btn-success { background: linear-gradient(135deg, var(--accent-success), #00BFA5); color: white; border: none; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-success:hover:not\(:disabled\)\s*\{.*?\}',
    '.btn-success:hover:not(:disabled) { box-shadow: 0 8px 16px rgba(0,230,118,0.3), var(--shadow-glow-success); transform: translateY(-2px) scale(1.05); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-secondary\s*\{.*?\}',
    '.btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.btn-secondary:hover:not\(:disabled\)\s*\{.*?\}',
    '.btn-secondary:hover:not(:disabled) { background: var(--bg-secondary); border-color: var(--accent-primary); color: var(--accent-primary); box-shadow: var(--shadow-glow); transform: translateY(-2px) scale(1.05); }',
    content, flags=re.DOTALL
)

# 5. Sidebar styling
content = re.sub(
    r'\.sidebar-item\s*\{.*?\}',
    '.sidebar-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: var(--radius-md); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); font-size: 0.95rem; font-weight: 600; margin-bottom: 4px; border: 1px solid transparent; background: transparent; width: 100%; text-align: left; }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.sidebar-item:hover\s*\{.*?\}',
    '.sidebar-item:hover { background: var(--bg-secondary); border-color: var(--border-color); color: var(--accent-primary-hover); transform: translateX(6px); box-shadow: var(--shadow-glow); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.sidebar-item\.active\s*\{.*?\}',
    '.sidebar-item.active { background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-hover)); color: white; border-color: transparent; box-shadow: var(--shadow-glow); }',
    content, flags=re.DOTALL
)

# 6. Header
content = re.sub(
    r'\.header\s*\{.*?\}',
    '.header { height: var(--header-height); background: rgba(5, 7, 13, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; position: relative; z-index: 40; box-shadow: var(--shadow-sm); }',
    content, flags=re.DOTALL
)

# 7. Tables (Zebra + Hover Glow)
content = re.sub(
    r'\.data-table tbody tr:hover\s*\{.*?\}',
    '.data-table tbody tr:hover { background: rgba(255, 59, 48, 0.05); transform: scale(1.01); box-shadow: inset 0 0 10px rgba(255,59,48,0.2); border-left: 3px solid var(--accent-primary); z-index: 2; position: relative; }',
    content, flags=re.DOTALL
)

# 8. Modals / Dialogs Glassmorphism
content = re.sub(
    r'\.modal-content\s*\{.*?\}',
    '.modal-content { background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: var(--radius-xl); width: 100%; max-width: 500px; position: relative; z-index: 101; display: flex; flex-direction: column; max-height: 90vh; box-shadow: var(--shadow-xl), var(--shadow-glow); animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }',
    content, flags=re.DOTALL
)

# 9. Inputs
content = re.sub(
    r'\.form-input\s*\{.*?\}',
    '.form-input { width: 100%; padding: 12px 16px; background: rgba(5,7,13,0.8); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.95rem; font-weight: 500; transition: all var(--transition-fast); outline: none; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.form-input:focus\s*\{.*?\}',
    '.form-input:focus { background: var(--bg-secondary); border-color: var(--accent-primary); box-shadow: 0 0 0 3px rgba(255,59,48,0.2), var(--shadow-glow); }',
    content, flags=re.DOTALL
)


with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('CSS Updated to Fire Cyber Luxury Theme')
