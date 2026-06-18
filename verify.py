with open("js/app.js", "r", encoding="utf-8") as f:
    content = f.read()

idx = content.find('hr-personal-inline')
print('hr-personal-inline found at:', idx)

count_old = content.count("qr-checkin")
count_scan = content.count("scan-checkin")
print('Remaining qr-checkin refs:', count_old)
print('Total scan-checkin refs:', count_scan)
