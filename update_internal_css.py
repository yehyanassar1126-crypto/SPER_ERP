import re

with open('css/styles.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure page-content is transparent so the body background shows through
content = re.sub(
    r'\.page-content\s*\{.*?\}',
    '.page-content { flex: 1; padding: 32px; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; position: relative; z-index: 10; background: transparent; }',
    content, flags=re.DOTALL
)

# Main Content transparent
content = re.sub(
    r'\.main-content\s*\{.*?\}',
    '.main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: transparent; }',
    content, flags=re.DOTALL
)

# Ensure data-table backgrounds are transparent or glass
content = re.sub(
    r'\.data-table\s*\{.*?\}',
    '.data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 16px; background: rgba(14, 17, 24, 0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--border-color); }',
    content, flags=re.DOTALL
)

content = re.sub(
    r'\.data-table th\s*\{.*?\}',
    '.data-table th { background: rgba(0,0,0,0.8); color: var(--text-secondary); font-weight: 700; padding: 16px; text-align: left; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color); white-space: nowrap; backdrop-filter: blur(5px); }',
    content, flags=re.DOTALL
)

content = re.sub(
    r'\.data-table td\s*\{.*?\}',
    '.data-table td { padding: 16px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); font-size: 0.95rem; background: transparent; transition: background var(--transition-fast); }',
    content, flags=re.DOTALL
)

# Pagination styling
content = re.sub(
    r'\.pagination-btn\s*\{.*?\}',
    '.pagination-btn { padding: 8px 16px; background: rgba(3,3,3,0.8); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); backdrop-filter: blur(5px); } .pagination-btn:hover:not(:disabled) { background: linear-gradient(135deg, var(--accent-primary), var(--accent-primary-hover)); border-color: transparent; box-shadow: var(--shadow-glow); }',
    content, flags=re.DOTALL
)

with open('css/styles.css', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated internal page layouts')
