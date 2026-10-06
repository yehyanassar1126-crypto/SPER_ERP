window.I18n = {
  currentLang: localStorage.getItem('erp_lang') || 'ar',
  translations: {},

  init: function(callback) {
    this.setLanguage(this.currentLang, callback);
  },

  setLanguage: function(lang, callback) {
    this.currentLang = lang;
    localStorage.setItem('erp_lang', lang);
    
    // Set document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    fetch('../../shared/lang/' + lang + '.json')
      .then(response => response.json())
      .then(data => {
        this.translations = data;
        
        // Update any data-i18n elements
        this.translateDOM();
        
        if (callback) callback();
      })
      .catch(error => {
        console.error('Error loading language file:', error);
        if (callback) callback();
      });
  },

  t: function(key) {
    return this.translations[key] || key;
  },
  
  translateDOM: function() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var key = elements[i].getAttribute('data-i18n');
      elements[i].innerText = this.t(key);
    }
  }
};
