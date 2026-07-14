import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Update login background glow to match the Fire theme
content = re.sub(
    r'\.login-bg\s*\{.*?\}',
    '.login-bg { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(circle at 10% 20%, rgba(255, 59, 48, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255, 106, 0, 0.15) 0%, transparent 40%); background-color: var(--bg-primary); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'\.login-bg::before\s*\{.*?\}',
    ".login-bg::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 59, 48, 0.1), transparent 70%); top: -200px; right: -100px; animation: float 10s ease-in-out infinite; }",
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Login background updated')
