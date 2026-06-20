/* ─── ODAK-AI · Firebase Module (REST API) ─── */
(function () {

const CONFIG = {
  apiKey:    "AIzaSyAa45zU_aIbhdbeDxLhyozDn8vdHy8eaxs",
  authDomain:"odak-ai-6ab3e.firebaseapp.com",
  projectId: "odak-ai-6ab3e",
  appId:     "1:344460023439:web:b77a83bb56d0be0b4342fa"
};

const FB_VER  = "10.12.2";
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;
const FS_URL  = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents`;

// ── Firestore REST helpers ──
// Firestore REST formatına çevir
function toFS(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number')  return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === 'string')  return { stringValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFS) } };
  if (typeof val === 'object')  return { mapValue: { fields: objToFS(val) } };
  return { stringValue: String(val) };
}

function objToFS(obj) {
  const fields = {};
  for (const k in obj) fields[k] = toFS(obj[k]);
  return fields;
}

// Firestore REST formatından JS'e çevir
function fromFS(val) {
  if (!val) return null;
  if ('nullValue'    in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue'  in val) return val.doubleValue;
  if ('stringValue'  in val) return val.stringValue;
  if ('arrayValue'   in val) return (val.arrayValue.values || []).map(fromFS);
  if ('mapValue'     in val) return fromFSFields(val.mapValue.fields || {});
  return null;
}

function fromFSFields(fields) {
  const obj = {};
  for (const k in fields) obj[k] = fromFS(fields[k]);
  return obj;
}

// REST GET
async function fsGet(path, token) {
  const res = await fetch(`${FS_URL}/${path}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET ${res.status}: ${await res.text()}`);
  const doc = await res.json();
  return doc.fields ? fromFSFields(doc.fields) : null;
}

// REST SET (create or overwrite)
async function fsSet(path, data, token) {
  const fields = objToFS(data);
  const res = await fetch(`${FS_URL}/${path}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`Firestore SET ${res.status}: ${await res.text()}`);
  return res.json();
}

// REST UPDATE (merge — sadece belirtilen alanları güncelle)
async function fsUpdate(path, data, token) {
  const fields   = objToFS(data);
  const fieldMask = Object.keys(fields).join(',');
  const res = await fetch(`${FS_URL}/${path}?updateMask.fieldPaths=${encodeURIComponent(fieldMask)}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) throw new Error(`Firestore UPDATE ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Firebase Auth (sadece SDK Auth kullanıyoruz, Firestore REST) ──
async function loadFirebase() {
  const { initializeApp } = await import(`${FB_BASE}/firebase-app.js`);
  const {
    getAuth, signInWithPopup, GoogleAuthProvider,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, setPersistence,
    browserLocalPersistence, RecaptchaVerifier, signInWithPhoneNumber,
    getIdToken
  } = await import(`${FB_BASE}/firebase-auth.js`);

  const app  = initializeApp(CONFIG);
  const auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);

  // Her istek için güncel token al
  async function getToken() {
    const user = auth.currentUser;
    if (!user) throw new Error('Giriş yapılmamış');
    return getIdToken(user, false);
  }

  // Varsayılan parent dokümanı
  function defaultParent(user, extra) {
    return {
      uid:         user.uid,
      email:       user.email || '',
      displayName: user.displayName || '',
      children:    [],
      settings:    { sessionDuration: 20, aiProvider: 'openai', apiKey: '' },
      sessions:    [],
      createdAt:   new Date().toISOString(),
      ...(extra || {})
    };
  }

  async function ensureUserDoc(user, displayName) {
    const token   = await getToken();
    const existing = await fsGet(`parents/${user.uid}`, token);
    if (!existing) {
      await fsSet(`parents/${user.uid}`, defaultParent(user, { displayName: displayName || user.displayName || '' }), token);
    }
  }

  // ── Auth ──
  const Auth = {
    async loginWithGoogle() {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureUserDoc(result.user);
      return result.user;
    },
    async loginWithEmail(email, password) {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(result.user);
      return result.user;
    },
    async registerWithEmail(email, password, displayName) {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(result.user, displayName);
      return result.user;
    },
    async logout() { await signOut(auth); },
    onAuthChange(cb) { onAuthStateChanged(auth, cb); },
    currentUser()   { return auth.currentUser; },
    setupRecaptcha(elementId) {
      return new RecaptchaVerifier(auth, elementId, { size: 'invisible' });
    },
    async sendPhoneOTP(phone, recaptcha) {
      return signInWithPhoneNumber(auth, phone, recaptcha);
    }
  };

  // ── DB ──
  const DB = {
    async getParent(uid) {
      const token = await getToken();
      const data  = await fsGet(`parents/${uid}`, token);
      if (!data) {
        // Yoksa oluştur
        const fresh = defaultParent(auth.currentUser || { uid, email: '', displayName: '' });
        await fsSet(`parents/${uid}`, fresh, token);
        return fresh;
      }
      if (!Array.isArray(data.children)) data.children = [];
      if (!Array.isArray(data.sessions)) data.sessions = [];
      if (!data.settings) data.settings = { sessionDuration: 20, aiProvider: 'openai', apiKey: '' };
      return data;
    },

    async updateParent(uid, data) {
      const token   = await getToken();
      const existing = await fsGet(`parents/${uid}`, token);
      if (!existing) {
        // Yoksa set
        const fresh = { ...defaultParent(auth.currentUser || { uid, email:'', displayName:'' }), ...data };
        await fsSet(`parents/${uid}`, fresh, token);
      } else {
        await fsUpdate(`parents/${uid}`, data, token);
      }
    },

    async addChild(uid, child) {
      const token  = await getToken();
      const parent = await DB.getParent(uid);
      const updated = [...(parent.children || []), child];
      await fsUpdate(`parents/${uid}`, { children: updated }, token);
      return updated;
    },

    async registerChildCode(code, parentUid, childId, childName) {
      const token = await getToken();
      await fsSet(`childCodes/${code}`, {
        parentUid, childId, childName,
        createdAt: new Date().toISOString()
      }, token);
    },

    async getParentByChildCode(code) {
      const token    = await getToken();
      const codeData = await fsGet(`childCodes/${code}`, token);
      if (!codeData) return null;
      const { parentUid, childId, childName } = codeData;
      const parentData = await DB.getParent(parentUid);
      return { parentUid, childId, childName, parentData };
    },

    async saveChildSession(code, session) {
      const token  = await getToken();
      const info   = await DB.getParentByChildCode(code);
      if (!info) throw new Error('Geçersiz kod');
      const parent   = await DB.getParent(info.parentUid);
      const sessions = [...(parent.sessions || []), {
        ...session,
        childId:   info.childId,
        childName: info.childName
      }];
      await fsUpdate(`parents/${info.parentUid}`, { sessions }, token);
    }
  };

  window.OdakFirebase = { Auth, DB };
  window.dispatchEvent(new Event('odak:firebase:ready'));
}

loadFirebase().catch(e => console.error('Firebase yüklenemedi:', e));

})();
