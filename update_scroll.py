import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Scrollbar styling
content = re.sub(
    r'::-webkit-scrollbar-thumb\s*\{.*?\}',
    '::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--accent-primary), var(--accent-primary-hover)); border-radius: var(--radius-full); }',
    content, flags=re.DOTALL
)
content = re.sub(
    r'::-webkit-scrollbar-thumb:hover\s*\{.*?\}',
    '::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, var(--accent-primary-hover), var(--accent-secondary)); }',
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Scrollbar Updated')
