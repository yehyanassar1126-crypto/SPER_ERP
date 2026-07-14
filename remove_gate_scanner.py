import re

with open('js/erp-logistics.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove lines 40-54 (inclusive), 80-96 (inclusive), and 233-289 (inclusive).
# But wait, if we delete lines, indices shift! Let's nullify them first.

for i in range(39, 54): # 40-54
    lines[i] = ''

for i in range(79, 96): # 80-96
    lines[i] = ''

for i in range(232, 290): # 233-290
    lines[i] = ''

# Make sure we keep "if (App.user.role === 'driver') {" which was line 43
lines[42] = "      if (App.user.role === 'driver') {\n"

with open('js/erp-logistics.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Successfully removed gate scanner code')
