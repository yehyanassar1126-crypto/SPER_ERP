import os

file_path = "js/app.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replacements
content = content.replace("Math.round(baseSalary / 26)", "Math.round(baseSalary / 30)")
content = content.replace("dailyRate26", "dailyRate30")
content = content.replace("المرتب ÷ 26 يوم = ", "المرتب ÷ 30 يوم = ")
content = content.replace("(baseSal / 26 / 8 / 60)", "(baseSal / 30 / 8 / 60)")
content = content.replace("Math.round(base / 26)", "Math.round(base / 30)")
content = content.replace("(base/26/8)", "(base/30/8)")
content = content.replace("Max 26 Days", "Max 30 Days")
content = content.replace("Math.min(attendedDays + approvedLeaveDays, 26)", "Math.min(attendedDays + approvedLeaveDays, 30)")
content = content.replace("(d / 26)", "(d / 30)")
content = content.replace("÷ 26 days =", "÷ 30 days =")
content = content.replace("baseSalary / 26", "baseSalary / 30")
content = content.replace("icon('users', 26)", "icon('users', 26)") # preserve icon sizes
content = content.replace("icon('package', 26)", "icon('package', 26)")
content = content.replace("icon('shoppingCart', 26)", "icon('shoppingCart', 26)")
content = content.replace("icon('dollarSign', 26)", "icon('dollarSign', 26)")
content = content.replace("icon('monitor', 26)", "icon('monitor', 26)")
content = content.replace("icon('settings', 26)", "icon('settings', 26)")
content = content.replace("icon('shoppingBag', 26)", "icon('shoppingBag', 26)")
content = content.replace("icon('calendar', 26)", "icon('calendar', 26)")
content = content.replace("icon('checkCircle', 26)", "icon('checkCircle', 26)")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated app.js")
