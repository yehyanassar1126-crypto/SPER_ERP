// =============================================
// I18n — loads lang/ar.json + lang/en.json (both), resolves the base path
// from THIS script's own URL (so it works from any screen), and always
// reads the active language from localStorage('lang') so a language switch
// never needs a page reload.
// =============================================
(function () {
  var scriptSrc = (document.currentScript && document.currentScript.src) || '';
  // .../shared/js/core/i18n.js  ->  .../shared/lang/
  var LANG_BASE = scriptSrc ? new URL('../../lang/', scriptSrc).href : '../../shared/lang/';

  function activeLang() {
    var l = localStorage.getItem('lang') || localStorage.getItem('erp_lang') || 'ar';
    return l === 'en' ? 'en' : 'ar';
  }

  function loadOne(lang) {
    return fetch(LANG_BASE + lang + '.json?v=' + Date.now())
      .then(function (r) { if (!r.ok) throw new Error(lang + '.json HTTP ' + r.status); return r.json(); })
      .catch(function (e) { console.error('[I18n] failed to load ' + lang + '.json', e); return {}; });
  }

  window.I18n = {
    currentLang: activeLang(),
    all: { ar: {}, en: {} },
    loaded: false,

    // current-language dictionary (kept for backward compatibility with I18nEngine.t)
    get translations() { return this.all[activeLang()] || {}; },

    init: function (callback) {
      var self = this;
      Promise.all([loadOne('ar'), loadOne('en')]).then(function (res) {
        self.all.ar = res[0]; self.all.en = res[1]; self.loaded = true;
        self.setLanguage(activeLang(), callback);
      });
    },

    setLanguage: function (lang, callback) {
      lang = lang === 'en' ? 'en' : 'ar';
      this.currentLang = lang;
      localStorage.setItem('lang', lang);
      localStorage.setItem('erp_lang', lang);
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      this.translateDOM();
      if (callback) callback();
    },

    t: function (key) {
      var d = this.all[activeLang()] || {};
      if (d[key] !== undefined) return d[key];
      var other = this.all[activeLang() === 'ar' ? 'en' : 'ar'] || {};
      if (other[key] !== undefined && activeLang() === 'en') return other[key];
      return key;
    },

    translateDOM: function () {
      var els = document.querySelectorAll('[data-i18n]');
      for (var i = 0; i < els.length; i++) els[i].innerText = this.t(els[i].getAttribute('data-i18n'));
    }
  };
})();
