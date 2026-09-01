# Bilingual System Guide (i18n)

## Overview

The ERP supports **Arabic (RTL)** and **English (LTR)** per user, stored in the database.

## How It Works

```
Login → Load user.preferred_language → I18nEngine.init() → Apply direction → Render UI
```

### Language Storage Priority
1. `users.preferred_language` (Database) — **Primary**
2. `localStorage('lang')` — Fallback
3. Default: `'ar'` (Arabic)

## Switching Language

Users click the language toggle button in the header:
- `عربي` button → switches to Arabic + RTL
- `English` button → switches to English + LTR

The switch:
1. Updates `I18nEngine.currentLang`
2. Saves to `localStorage`
3. Updates `users.preferred_language` in Supabase
4. Applies RTL/LTR direction
5. Reloads the page

## Translation Sources

| Source | File | Keys |
|---|---|---|
| Extended translations | `js/core/i18n-engine.js` | 100+ new keys |
| Arabic dictionary | `js/translations.js` | 700+ existing keys |
| JSON translations | `lang/ar.json`, `lang/en.json` | 130+ keys each |

## Using Translations in Code

```javascript
// Global shorthand
t('monthly_report')  // Returns "تقرير شهري" or "Monthly Report"

// With variables
t('welcome_msg', { name: 'Ahmed' })  // "مرحباً {{name}}" → "مرحباً Ahmed"

// Full API
I18nEngine.t('key')
I18nEngine.formatNumber(15000)     // "١٥٬٠٠٠" or "15,000"
I18nEngine.formatCurrency(5000)    // "ج.م ٥٬٠٠٠" or "EGP 5,000"
I18nEngine.formatDate('2026-09-01') // Locale-aware date
I18nEngine.isRTL()                 // true/false
```

## Adding New Translations

1. Add key to `I18nEngine._extraTranslations.ar` and `.en` in `i18n-engine.js`
2. Or add to `lang/ar.json` and `lang/en.json`

## RTL/LTR Classes

| Language | HTML dir | Body class |
|---|---|---|
| Arabic | `dir="rtl"` | `rtl-layout` |
| English | `dir="ltr"` | `ltr-layout` |
