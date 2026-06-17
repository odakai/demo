/* ─── ReadMeter · Core Module ─── */
(function() {

// ── JSONBin Config ──
const BIN_ID  = '6a31a311da38895dfecbcb23';
const BIN_KEY = '$2a$10$rOImdj/5l8IYAvRjrjGDZ.GOEJedCtHTQ8tZfcyZs9.DOI.z1LfCO';
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

// ── Language Strings ──
const STRINGS = {
  tr: {
    brand: 'ReadMeter',
    parentLink: 'Ebeveyn Paneli',
    childLink:  'Okuma Ekranı',
    langTr: 'TR', langEn: 'EN',
    sessionSettings: 'Oturum Ayarları',
    sessionDuration: 'Oturum Süresi (dakika)',
    saveSettings: 'Kaydet',
    settingsSaved: 'Ayarlar kaydedildi',
    reports: 'Raporlar',
    noReports: 'Henüz tamamlanan oturum yok.',
    overallScore: 'Genel Skor',
    attentionMap: 'Dikkat Haritası',
    qaReview: 'Soru & Cevap Özeti',
    correct: 'Doğru',
    wrong: 'Yanlış',
    skipped: 'Geçildi',
    focusGood: 'İyi odaklandı',
    focusMed:  'Orta dikkat',
    focusLow:  'Dikkat dağınık',
    aiProvider: 'AI Sağlayıcı',
    apiKey: 'API Anahtarı',
    saveSecret: 'Kaydet',
    secretSaved: 'API bilgileri kaydedildi',
    deleteReport: 'Sil',
    reportDeleted: 'Rapor silindi',
    sessionDate: 'Tarih',
    duration: 'Süre',
    minutes: 'dakika',
    analysisTitle: 'Analiz',
    loadingReports: 'Raporlar yükleniyor…',
    readingSession: 'Okuma Oturumu',
    sessionLength: 'Oturum uzunluğu',
    startReading: 'Okumaya Başla',
    timeLeft: 'Kalan Süre',
    readAloudPrompt: '🔔 Şimdi sesli oku!',
    readAloudListening: '🎙️ Dinleniyor…',
    readAloudDone: '✅ Tamamlandı, okumaya devam et.',
    sessionOver: 'Oturum Bitti!',
    generatingQuestions: 'Sorular hazırlanıyor…',
    questionOf: function(n,t){ return 'Soru ' + n + ' / ' + t; },
    submitAnswers: 'Cevapları Gönder',
    analyzing: 'Analiz yapılıyor…',
    analysisDone: 'Analiz tamamlandı! Ebeveyn panelinden raporu görebilirsin.',
    errorNoAI: 'AI yapılandırması eksik. Ebeveyn panelinden ayarlanmalı.',
    errorSpeech: 'Mikrofon erişimi sağlanamadı.',
    readAloudSecs: 'saniye',
    tapToAnswer: 'Cevabını yaz…',
    next: 'Sonraki',
    submit: 'Gönder',
    retry: 'Tekrar Dene',
    preparing: 'Hazırlanıyor…',
  },
  en: {
    brand: 'ReadMeter',
    parentLink: 'Parent Panel',
    childLink:  'Reading Screen',
    langTr: 'TR', langEn: 'EN',
    sessionSettings: 'Session Settings',
    sessionDuration: 'Session Duration (minutes)',
    saveSettings: 'Save',
    settingsSaved: 'Settings saved',
    reports: 'Reports',
    noReports: 'No completed sessions yet.',
    overallScore: 'Overall Score',
    attentionMap: 'Attention Map',
    qaReview: 'Q&A Summary',
    correct: 'Correct',
    wrong: 'Wrong',
    skipped: 'Skipped',
    focusGood: 'Well focused',
    focusMed:  'Moderate attention',
    focusLow:  'Distracted',
    aiProvider: 'AI Provider',
    apiKey: 'API Key',
    saveSecret: 'Save',
    secretSaved: 'API credentials saved',
    deleteReport: 'Delete',
    reportDeleted: 'Report deleted',
    sessionDate: 'Date',
    duration: 'Duration',
    minutes: 'minutes',
    analysisTitle: 'Analysis',
    loadingReports: 'Loading reports…',
    readingSession: 'Reading Session',
    sessionLength: 'Session length',
    startReading: 'Start Reading',
    timeLeft: 'Time Left',
    readAloudPrompt: '🔔 Read aloud now!',
    readAloudListening: '🎙️ Listening…',
    readAloudDone: '✅ Done, continue reading.',
    sessionOver: 'Session Over!',
    generatingQuestions: 'Generating questions…',
    questionOf: function(n,t){ return 'Question ' + n + ' / ' + t; },
    submitAnswers: 'Submit Answers',
    analyzing: 'Analysing…',
    analysisDone: 'Analysis complete! Check the parent panel for the report.',
    errorNoAI: 'AI not configured. Set it up from the parent panel.',
    errorSpeech: 'Could not access microphone.',
    readAloudSecs: 'seconds',
    tapToAnswer: 'Type your answer here…',
    next: 'Next',
    submit: 'Submit',
    retry: 'Retry',
    preparing: 'Preparing…',
  }
};

// ── Language Manager ──
const Lang = (function() {
  let current = localStorage.getItem('rm_lang') || 'tr';

  function get() { return current; }

  function set(lang) {
    current = lang;
    localStorage.setItem('rm_lang', lang);
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    applyStrings();
  }

  function t(key) {
    var args = Array.prototype.slice.call(arguments, 1);
    var val = STRINGS[current][key];
    return typeof val === 'function' ? val.apply(null, args) : (val !== undefined ? val : key);
  }

  function applyStrings() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.dataset.i18n;
      var s = STRINGS[current][key];
      if (s !== undefined && typeof s !== 'function') el.textContent = s;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el) {
      var key = el.dataset.i18nPh;
      var s = STRINGS[current][key];
      if (s !== undefined) el.placeholder = s;
    });
  }

  function init() {
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.lang === current);
      b.addEventListener('click', function() { set(b.dataset.lang); });
    });
    applyStrings();
  }

  return { get: get, set: set, t: t, init: init, applyStrings: applyStrings };
})();

// ── Toast ──
function showToast(msg, type) {
  type = type || '';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3500);
}

// ── JSONBin API ──
const DB = {
  read: async function() {
    const res = await fetch(BIN_URL + '/latest', {
      headers: { 'X-Master-Key': BIN_KEY }
    });
    if (!res.ok) {
      if (res.status === 404) {
        return { sessions: [], settings: { sessionDuration: 20, aiProvider: 'openai', apiKey: '' } };
      }
      throw new Error('DB read failed (' + res.status + ')');
    }
    const json = await res.json();
    const record = json.record || {};
    if (!record.sessions) record.sessions = [];
    if (!record.settings) record.settings = { sessionDuration: 20, aiProvider: 'openai', apiKey: '' };
    return record;
  },

  write: async function(data) {
    const res = await fetch(BIN_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': BIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('DB write failed');
    return res.json();
  }
};

// ── AI Caller ──
async function callAI(prompt) {
  const data = await DB.read();
  const settings = data.settings || {};
  const aiProvider = settings.aiProvider;
  const apiKey = settings.apiKey;
  if (!apiKey) throw new Error('no_api_key');

  if (aiProvider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    if (!res.ok) throw new Error('OpenAI error: ' + res.status);
    const j = await res.json();
    return j.choices[0].message.content;
  }

  if (aiProvider === 'gemini') {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    if (!res.ok) throw new Error('Gemini error: ' + res.status);
    const j = await res.json();
    return j.candidates[0].content.parts[0].text;
  }

  throw new Error('Bilinmeyen AI sağlayıcı. OpenAI veya Gemini seçin.');
}

// ── Tek global nesne olarak dışa aç ──
window.RM = {
  Lang:      Lang,
  DB:        DB,
  callAI:    callAI,
  showToast: showToast,
  STRINGS:   STRINGS
};

})(); // IIFE sonu — hiçbir şey global scope'a sızamaz
