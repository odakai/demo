/* ─── ODAK-AI · Core Module ─── */
(function () {

const STRINGS = {
  tr: {
    brand: 'ODAK-AI',
    logout: 'Çıkış Yap',
    settings: 'Ayarlar',
    saveSettings: 'Kaydet',
    settingsSaved: 'Ayarlar kaydedildi',
    errorGeneral: 'Bir hata oluştu: ',
    errorNoAI: 'AI yapılandırması eksik. Ayarlardan API anahtarı girin.',
    loading: 'Yükleniyor…',
    cancel: 'İptal',
    close: 'Kapat',
    confirm: 'Onayla',
    delete: 'Sil',
    edit: 'Düzenle',
    save: 'Kaydet',
    back: 'Geri',
    next: 'İleri',
    submit: 'Gönder',
    langTr: 'TR', langEn: 'EN',
  },
  en: {
    brand: 'ODAK-AI',
    logout: 'Log Out',
    settings: 'Settings',
    saveSettings: 'Save',
    settingsSaved: 'Settings saved',
    errorGeneral: 'An error occurred: ',
    errorNoAI: 'AI not configured. Enter an API key in Settings.',
    loading: 'Loading…',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    langTr: 'TR', langEn: 'EN',
  }
};

// ── Language Manager ──
const Lang = (function () {
  let current = localStorage.getItem('odak_lang') || 'tr';

  function get() { return current; }

  function set(lang) {
    current = lang;
    localStorage.setItem('odak_lang', lang);
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
  }

  function t(strings, key) {
    const val = (strings[current] || strings['tr'])[key];
    return val !== undefined ? val : key;
  }

  function init() {
    document.documentElement.lang = current;
    document.querySelectorAll('.lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === current);
      b.addEventListener('click', () => {
        set(b.dataset.lang);
        document.documentElement.lang = b.dataset.lang;
        // Sadece bu sayfadaki dinleyicileri tetikle
        window.dispatchEvent(new CustomEvent('odak:lang:change', { detail: b.dataset.lang }));
      });
    });
  }

  return { get, set, t, init };
})();

// ── Toast ──
function showToast(msg, type = '') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3800);
}

// ── Theme Manager ──
const Theme = {
  themes: ['default', 'light', 'forest', 'sunset'],
  labels: { default: 'Gece Mavisi', light: 'Açık', forest: 'Orman', sunset: 'Gün Batımı' },
  current() { return localStorage.getItem('odak_theme') || 'default'; },
  isDark() { const t = this.current(); return t === 'default' || t === 'forest' || t === 'sunset'; },
  apply(name) {
    if (name === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem('odak_theme', name);
    this._updateToggleIcon();
  },
  toggle() {
    const next = this.isDark() ? 'light' : 'default';
    this.apply(next);
  },
  _updateToggleIcon() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = this.isDark() ? '☀️' : '🌙';
      btn.title = this.isDark() ? 'Açık temaya geç' : 'Koyu temaya geç';
    });
  },
  init() {
    this.apply(this.current());
    // Toggle butonlarına click ekle
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', () => this.toggle());
    });
  }
};

// ── AI Caller ──
async function callAI(prompt, settings) {
  const { aiProvider, apiKey } = settings || {};
  if (!apiKey) throw new Error('no_api_key');

  if (aiProvider === 'openai' || !aiProvider) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 })
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    return (await res.json()).choices[0].message.content;
  }

  if (aiProvider === 'gemini') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    return (await res.json()).candidates[0].content.parts[0].text;
  }

  throw new Error('Bilinmeyen AI sağlayıcı');
}

// ── Wait for Firebase ──
function waitForFirebase() {
  return new Promise(resolve => {
    if (window.OdakFirebase) return resolve(window.OdakFirebase);
    window.addEventListener('odak:firebase:ready', () => resolve(window.OdakFirebase), { once: true });
  });
}

// ── Require Auth (redirect if not logged in) ──
async function requireAuth(redirectTo = '/auth/') {
  const fb = await waitForFirebase();
  return new Promise(resolve => {
    fb.Auth.onAuthChange(user => {
      if (!user) { window.location.href = redirectTo; }
      else resolve(user);
    });
  });
}

// ── 6-digit code generator ──
function generateChildCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

window.OdakApp = { Lang, showToast, Theme, callAI, waitForFirebase, requireAuth, generateChildCode, STRINGS };
window.dispatchEvent(new Event('odak:app:ready'));

})();
