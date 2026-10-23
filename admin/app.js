import { firebaseConfig } from './firebase-config.js';

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DEMO = new URLSearchParams(location.search).has('demo') || location.protocol === 'file:';
const CUR = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'AED ' };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const MAX_IMG = 5 * 1024 * 1024, MAX_VID = 100 * 1024 * 1024, MAX_GALLERY = 5;
const money = n => (CUR[state.settings.currency] || '₹') + Number(n || 0).toLocaleString('en-IN');
const fmtDate = t => t ? new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtBytes = b => b >= 1e9 ? (b / 1e9).toFixed(2) + ' GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + ' MB' : (b / 1e3).toFixed(0) + ' KB';
const mb = b => (b / 1048576).toFixed(0);
const safeName = n => n.toLowerCase().replace(/[^a-z0-9.]+/g, '-').slice(-40);

function toast(msg, bad) {
  const t = document.createElement('div');
  t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  $('#toasts').append(t); setTimeout(() => t.remove(), 3600);
}
function overlay(html) {
  const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = html; document.body.append(o); return o;
}
function confirmBox(title, text, okLabel) {
  return new Promise(res => {
    const o = overlay(`<div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p style="color:var(--mute)">${esc(text)}</p>
      <div class="acts"><button class="btn" id="c-no">Cancel</button><button class="btn btn-primary" id="c-ok" style="background:var(--bad);border-color:var(--bad)">${esc(okLabel)}</button></div></div>`);
    $('#c-no', o).onclick = () => { o.remove(); res(false); };
    $('#c-ok', o).onclick = () => { o.remove(); res(true); };
  });
}
function progressBox(label) {
  const o = overlay(`<div class="modal"><h3>${esc(label)}</h3><div class="prog"><i id="pb" style="width:0%"></i></div><p id="pt" style="color:var(--mute);font-size:13px">Starting…</p></div>`);
  return { set(p, t) { $('#pb', o).style.width = p + '%'; if (t) $('#pt', o).textContent = t; }, close() { o.remove(); } };
}

const ICON = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>'
};
const ic = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ================= backends ================= */
async function firebaseBackend() {
  const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const [{ initializeApp }, A, F, St] = await Promise.all(
    ['app', 'auth', 'firestore', 'storage'].map(m => import(`${base}firebase-${m}.js`)));
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app), db = F.getFirestore(app), st = St.getStorage(app);
  import(`${base}firebase-analytics.js`).then(m => m.isSupported().then(ok => ok && m.getAnalytics(app))).catch(() => {});
  return {
    onAuth: cb => A.onAuthStateChanged(auth, u => cb(u ? { email: u.email } : null)),
    signIn: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    signOut: () => A.signOut(auth),
    newId: () => F.doc(F.collection(db, 'products')).id,
    listProducts: async () => (await F.getDocs(F.collection(db, 'products'))).docs.map(d => ({ ...d.data(), id: d.id })),
    saveProduct: p => F.setDoc(F.doc(db, 'products', p.id), p),
    deleteProduct: id => F.deleteDoc(F.doc(db, 'products', id)),
    getSettings: async () => { const s = await F.getDoc(F.doc(db, 'settings', 'company')); return s.exists() ? s.data() : {}; },
    saveSettings: o => F.setDoc(F.doc(db, 'settings', 'company'), o),
    upload: (path, file, onP) => new Promise((res, rej) => {
      const r = St.ref(st, path), t = St.uploadBytesResumable(r, file, { contentType: file.type });
      t.on('state_changed', s => onP(s.bytesTransferred, s.totalBytes), rej, async () => res({ url: await St.getDownloadURL(r), path }));
    }),
    removeFile: path => St.deleteObject(St.ref(st, path)).catch(() => {}),
    getToken: () => auth.currentUser.getIdToken(),
    ping: async () => { const r = F.doc(db, 'settings', '_ping'); await F.setDoc(r, { t: Date.now() }); const s = await F.getDoc(r); await F.deleteDoc(r); if (!s.exists()) throw new Error('Wrote a document but could not read it back'); },
    pingStorage: async () => { const r = St.ref(st, '_ping/test.png'); await St.uploadBytes(r, await (await fetch(PNG)).blob(), { contentType: 'image/png' }); await St.getDownloadURL(r); await St.deleteObject(r); },
    stats: async () => {
      let files = 0, size = 0; const CAP = 300;
      const walk = async r => { const l = await St.list(r, { maxResults: 1000 }); for (const i of l.items) { if (files >= CAP) return; files++; try { size += (await St.getMetadata(i)).size; } catch (e) {} } for (const q of l.prefixes) await walk(q); };
      await walk(St.ref(st));
      const c = await F.getCountFromServer(F.collection(db, 'products'));
      return { products: c.data().count, files, size, capped: files >= CAP };
    }
  };
}

function demoBackend() {
  // In-memory only: used with ?demo to preview the screens without touching Firebase.
  let products = [
    { id: 'd1', name: 'StockPilot Inventory', category: 'Software', status: 'published', shortDescription: 'Stock, purchase and sales tracking for small businesses.', description: '', thumbnail: null, mainImage: null, gallery: [], video: null, createdAt: Date.now() - 6e8, updatedAt: Date.now() - 2e8,
      plans: [{ id: 'p1', name: 'Basic', users: 5, originalPrice: 799, sellingPrice: 599, extraUserPrice: 120 }, { id: 'p2', name: 'Standard', users: 30, originalPrice: 2499, sellingPrice: 1999, extraUserPrice: 90 }, { id: 'p3', name: 'ULTRA', users: 100, originalPrice: 999, sellingPrice: 999 - 100, extraUserPrice: 60 }] },
    { id: 'd2', name: 'LeadLoop CRM', category: 'Software', status: 'draft', shortDescription: 'Pipeline and follow-up reminders for sales teams.', description: '', thumbnail: null, mainImage: null, gallery: [], video: null, createdAt: Date.now() - 3e8, updatedAt: Date.now() - 1e8,
      plans: [{ id: 'p1', name: 'Basic', users: 5, originalPrice: 999, sellingPrice: 799, extraUserPrice: 150 }] }
  ];
  let settings = { companyName: 'Demo Company', supportEmail: '', website: '', currency: 'INR' };
  let cb = () => {};
  return {
    onAuth: c => { cb = c; setTimeout(() => cb({ email: 'demo@example.com' }), 0); return () => {}; },
    signIn: async () => cb({ email: 'demo@example.com' }), signOut: async () => cb(null),
    newId: () => 'p' + Math.random().toString(36).slice(2, 10),
    listProducts: async () => products.map(p => ({ ...p })),
    saveProduct: async p => { products = products.filter(x => x.id !== p.id).concat([{ ...p }]); },
    deleteProduct: async id => { products = products.filter(x => x.id !== id); },
    getSettings: async () => ({ ...settings }), saveSettings: async o => { settings = { ...o }; },
    upload: async (path, file, onP) => { onP(file.size / 2, file.size); await new Promise(r => setTimeout(r, 150)); onP(file.size, file.size); return { url: URL.createObjectURL(file), path }; },
    removeFile: async () => {},
    getToken: async () => 'demo', ping: async () => {}, pingStorage: async () => {},
    stats: async () => ({ products: products.length, files: 0, size: 0, demo: true })
  };
}

/* ================= state ================= */
const state = { user: null, settings: { currency: 'INR' }, products: [], loaded: false, error: '', q: '', status: 'all', menu: false };
state.media = { type: 'all', items: [], cursor: null, total: 0, loading: false, loaded: false, err: '', sel: new Set() };
let B = null, F = null, L = null; // backend, product form, logo form

/* ---- Cloudinary (unsigned uploads from the browser, usage via a Cloud Function) ---- */
const cloudOn = () => !!(state.settings.cloudName && state.settings.uploadPreset);
function cloudUpload(file, folder, onP) {
  return new Promise((res, rej) => {
    const x = new XMLHttpRequest();
    x.open('POST', `https://api.cloudinary.com/v1_1/${encodeURIComponent(state.settings.cloudName.trim())}/auto/upload`);
    x.upload.onprogress = e => e.lengthComputable && onP(e.loaded, e.total);
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch (e) {}
      x.status >= 200 && x.status < 300 ? res({ url: j.secure_url, path: '', publicId: j.public_id, provider: 'cloudinary' }) : rej(new Error('Cloudinary: ' + (j.error?.message || 'HTTP ' + x.status))); };
    x.onerror = () => rej(new Error('Cloudinary: network error. Check the cloud name.'));
    const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', state.settings.uploadPreset.trim()); fd.append('folder', folder); x.send(fd);
  });
}
const uploadAny = (path, file, onP) => cloudOn() ? cloudUpload(file, path.split('/').slice(0, -1).join('/'), onP) : B.upload(path, file, onP);
async function cloudApi(action, params = {}, body) {
  const base = (state.settings.usageUrl || '').trim();
  if (!base) throw new Error('Function URL not set. Deploy the function and paste its URL in Settings, Integrations.');
  const url = base + (base.includes('?') ? '&' : '?') + new URLSearchParams({ action, ...params });
  const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + await B.getToken(), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status); return j;
}
async function fetchCloudUsage() {
  if (!(state.settings.usageUrl || '').trim() && DEMO) return { sample: true, storageBytes: 2.4e9, credits: { usage: 12.4, limit: 25, used_percent: 49.6 }, videos: 18, images: 342 };
  return cloudApi('usage');
}
/* ---- media library ---- */
const svgThumb = i => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="hsl(${i * 47 % 360} 40% 58%)"/><text x="200" y="160" font-size="28" font-family="sans-serif" fill="#fff" text-anchor="middle">Sample ${i + 1}</text></svg>`);
let demoMedia = Array.from({ length: 14 }, (_, i) => { const v = i % 4 === 3; return { publicId: `sample/${v ? 'clip' : 'image'}-${i + 1}`, type: v ? 'video' : 'image', url: svgThumb(i), thumb: svgThumb(i), bytes: (v ? 18e6 : 2.1e5) + i * 37000, createdAt: Date.now() - i * 864e5, sample: true }; });
const demoOn = () => DEMO && !(state.settings.usageUrl || '').trim();
const mkey = m => m.type + ':' + m.publicId;
function mediaUse() {
  const map = new Map(), add = (m, name) => { if (m?.publicId) map.set(m.publicId, [...(map.get(m.publicId) || []), name]); };
  state.products.forEach(p => [p.thumbnail, p.mainImage, p.video, ...(p.gallery || [])].forEach(m => add(m, p.name)));
  if (state.settings.logoPublicId) map.set(state.settings.logoPublicId, ['Company logo']);
  return map;
}
async function loadMedia(reset) {
  const m = state.media; if (m.loading) return; m.loading = true; m.err = '';
  if (reset) { m.items = []; m.cursor = null; m.sel.clear(); }
  render();
  try {
    let r;
    if (demoOn()) { const list = demoMedia.filter(x => m.type === 'all' || x.type === m.type); r = { items: list, total: list.length, nextCursor: null }; }
    else r = await cloudApi('list', { type: m.type, ...(m.cursor ? { cursor: m.cursor } : {}) });
    m.items.push(...r.items); m.cursor = r.nextCursor; m.total = r.total; m.loaded = true;
  } catch (e) { m.err = e.message; m.loaded = true; }
  m.loading = false; render();
}
async function deleteMedia(keys) {
  const m = state.media, items = m.items.filter(x => keys.includes(mkey(x)));
  if (!items.length) return;
  const use = mediaUse(), inUse = items.filter(x => use.has(x.publicId)).length;
  const ok = await confirmBox(`Delete ${items.length} file${items.length > 1 ? 's' : ''}`, `This permanently removes ${items.length > 1 ? 'them' : 'it'} from Cloudinary.` + (inUse ? ` ${inUse} ${inUse > 1 ? 'are' : 'is'} used by a product or the logo, which will then show a broken image.` : ''), 'Delete');
  if (!ok) return;
  try {
    if (demoOn()) demoMedia = demoMedia.filter(x => !keys.includes(mkey(x)));
    else await cloudApi('delete', {}, { items: items.map(x => ({ publicId: x.publicId, type: x.type })) });
    m.items = m.items.filter(x => !keys.includes(mkey(x))); m.total = Math.max(0, m.total - items.length); keys.forEach(k => m.sel.delete(k));
    state.usage = null; toast(`Deleted ${items.length} file${items.length > 1 ? 's' : ''}`); render();
  } catch (e) { toast('Delete failed: ' + e.message, true); }
}
function viewMedia() {
  const m = state.media, use = mediaUse();
  const chips = [['all', 'All'], ['image', 'Images'], ['video', 'Videos']].map(([k, l]) => `<button class="chip" data-a="mtype" data-t="${k}" aria-pressed="${m.type === k}">${l}</button>`).join('');
  const tiles = m.items.map(x => { const k = mkey(x), u = use.get(x.publicId), name = x.publicId.split('/').pop();
    return `<div class="card mtile"><label class="mchk"><input type="checkbox" data-a="msel" data-id="${esc(k)}" ${m.sel.has(k) ? 'checked' : ''} aria-label="Select ${esc(name)}"></label>
      <button class="mthumb" data-a="mview" data-id="${esc(k)}" aria-label="Preview ${esc(name)}"><img src="${esc(x.thumb)}" alt="" loading="lazy">${x.type === 'video' ? '<span class="mplay">Video</span>' : ''}</button>
      <div class="minfo"><b title="${esc(x.publicId)}">${esc(name)}</b><span>${fmtBytes(x.bytes)} · ${fmtDate(x.createdAt)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:6px">${u ? `<span class="pill p-good" title="${esc(u.join(', '))}">In use</span>` : '<span class="pill p-mute">Unused</span>'}<button class="btn btn-sm btn-danger" data-a="mdel1" data-id="${esc(k)}">Delete</button></div></div></div>`; }).join('');
  const n = m.sel.size;
  return `<div class="page-head"><div><h1>Media library</h1><p>Everything stored in Cloudinary. Preview or delete files.</p></div>
    <div class="toolbar"><button class="btn" data-a="mall">${n === m.items.length && n ? 'Clear selection' : 'Select all loaded'}</button><button class="btn btn-danger" data-a="mdeln" ${n ? '' : 'disabled'}>Delete selected${n ? ' (' + n + ')' : ''}</button></div></div>
  ${demoOn() ? '<div class="banner info">Sample files. Connect Cloudinary in Settings, Integrations to see your real library.</div>' : ''}
  ${m.err ? `<div class="banner warn">${esc(m.err)}</div>` : ''}
  <div class="toolbar">${chips}<span style="color:var(--mute);margin-left:auto">${m.loaded ? m.total + ' file' + (m.total === 1 ? '' : 's') : ''}</span></div>
  ${m.items.length ? `<div class="mgrid">${tiles}</div>` : `<div class="card empty"><b>${m.loading ? 'Loading…' : 'No files'}</b>${m.loading ? '' : 'Nothing found for this filter.'}</div>`}
  ${m.cursor ? `<div style="text-align:center"><button class="btn" data-a="mmore" ${m.loading ? 'disabled' : ''}>${m.loading ? 'Loading…' : 'Load more'}</button></div>` : ''}`;
}
function previewMedia(k) {
  const x = state.media.items.find(i => mkey(i) === k); if (!x) return;
  const o = overlay(`<div class="modal" style="max-width:760px"><div style="display:flex;justify-content:space-between;gap:12px"><h3 style="overflow-wrap:anywhere">${esc(x.publicId)}</h3><button class="btn btn-sm" id="pv-x">Close</button></div>
    ${x.type === 'video' && !x.sample ? `<video src="${esc(x.url)}" controls autoplay style="width:100%;max-height:60vh;background:#000;border-radius:8px"></video>` : `<img src="${esc(x.url)}" alt="" style="width:100%;max-height:60vh;object-fit:contain;background:var(--raise);border-radius:8px">`}
    <p style="color:var(--mute);font-size:12px;overflow-wrap:anywhere">${fmtBytes(x.bytes)} · ${fmtDate(x.createdAt)}<br>${esc(x.url.startsWith('data:') ? 'Sample file' : x.url)}</p></div>`);
  o.onclick = e => { if (e.target === o || e.target.id === 'pv-x') o.remove(); };
}
async function loadUsage() {
  if (state.usageBusy) return; state.usageBusy = true; state.usage = { loading: true };
  const [c, f] = await Promise.allSettled([fetchCloudUsage(), B.stats()]);
  state.usage = { cloud: c.status === 'fulfilled' ? c.value : null, cloudErr: c.status === 'rejected' ? c.reason.message : '', fb: f.status === 'fulfilled' ? f.value : null, fbErr: f.status === 'rejected' ? (f.reason.code || f.reason.message) : '', at: Date.now() };
  state.usageBusy = false; if (routeKey() === 'dashboard') render();
}
function usageCard() {
  const u = state.usage; if (!u) return '';
  const head = `<div class="card-h"><div><h2>Storage and usage</h2><p>${u.at ? 'Updated ' + new Date(u.at).toLocaleTimeString('en-IN') : 'Loading…'}</p></div><button class="btn btn-sm" data-a="usage">Refresh</button></div>`;
  if (u.loading) return `<div class="card">${head}<div class="empty">Loading usage…</div></div>`;
  const kv = (l, v) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line)"><span style="color:var(--mute)">${l}</span><b class="mono">${v}</b></div>`;
  const c = u.cloud, cr = c?.credits, pct = cr && cr.limit ? Math.min(100, cr.usage / cr.limit * 100) : cr?.used_percent;
  const cloud = u.cloudErr ? `<div class="banner warn">${esc(u.cloudErr)}</div>` : `${c.sample ? '<div class="banner info">Sample numbers. Connect Cloudinary to see real usage.</div>' : ''}
    ${kv('Storage used', fmtBytes(c.storageBytes))}${cr ? kv('Credits used', `${(+cr.usage).toFixed(1)}${cr.limit ? ' of ' + cr.limit : ''}`) : ''}
    ${pct != null ? `<div class="prog" style="margin:4px 0 8px"><i style="width:${pct}%"></i></div>${kv('Left', cr.limit ? (cr.limit - cr.usage).toFixed(1) + ' credits' : (100 - pct).toFixed(0) + '%')}` : ''}${kv('Videos', c.videos)}${kv('Images', c.images)}`;
  const fb = u.fbErr ? `<div class="banner warn">${esc(u.fbErr)}</div>` : `${u.fb.demo ? '<div class="banner info">Demo mode: Firebase not connected.</div>' : ''}${kv('Products in Firestore', u.fb.products)}${kv('Files in Firebase Storage', u.fb.files + (u.fb.capped ? '+' : ''))}${kv('Firebase Storage size', fmtBytes(u.fb.size))}
    <p style="color:var(--mute);font-size:12px;margin-top:8px">Plan quotas are shown in the Firebase console, Usage and billing.</p>`;
  return `<div class="card">${head}<div class="card-b grid2"><div><h3 style="font-size:14px;margin-bottom:6px">Cloudinary</h3>${cloud}</div><div><h3 style="font-size:14px;margin-bottom:6px">Firebase</h3>${fb}</div></div></div>`;
}

/* ================= shell ================= */
const NAV = [
  { group: 'Overview', items: [{ key: 'dashboard', label: 'Dashboard', icon: 'home', href: '#/dashboard' }] },
  { group: 'Catalog', items: [{ key: 'media', label: 'Media library', icon: 'img', href: '#/media' }, { key: 'products', label: 'Products', icon: 'box', href: '#/products', subs: [['All products', '#/products', 'products'], ['Add product', '#/products/new', 'products/new']] }] },
  { group: 'Configuration', items: [{ key: 'settings', label: 'Settings', icon: 'gear', href: '#/settings/branding', subs: [['Branding', '#/settings/branding', 'settings/branding'], ['Company', '#/settings/company', 'settings/company'], ['Integrations', '#/settings/integrations', 'settings/integrations']] }] }
];
const routeParts = () => { const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); return p.length ? p : ['dashboard']; };
const routeKey = () => { const [a, b] = routeParts(); return a === 'settings' ? 'settings/' + (b || 'branding') : a === 'products' && b === 'new' ? 'products/new' : a === 'products' && b === 'edit' ? 'products/edit' : a; };

function sidebar() {
  const key = routeKey(), top = key.split('/')[0], s = state.settings;
  const logo = s.logoUrl ? `<img src="${esc(s.logoUrl)}" alt="">` : esc((s.companyName || 'C')[0].toUpperCase());
  return `<aside class="side ${state.menu ? 'open' : ''}" id="side">
    <div class="brand"><div class="brand-logo">${logo}</div><div><b>${esc(s.companyName || 'Your company')}</b><span>Admin console</span></div></div>
    <nav class="nav" aria-label="Main">${NAV.map(g => `<div class="nav-group">${g.group}</div>${g.items.map(i => `
      <a href="${i.href}" class="${top === i.key && !i.subs ? 'on' : ''}" ${top === i.key && !i.subs ? 'aria-current="page"' : ''}>${ic(i.icon)}${i.label}</a>
      ${(i.subs || []).map(([l, h, k]) => `<a href="${h}" class="sub ${key === k || (k === 'products' && key === 'products/edit') ? 'on' : ''}">${l}</a>`).join('')}`).join('')}`).join('')}</nav>
    <div class="side-foot">${DEMO ? 'Demo mode: changes are not saved' : 'Connected to Firebase'}</div></aside>`;
}
const CRUMB = { media: ['Catalog', 'Media library'], dashboard: ['Dashboard'], products: ['Products', 'All products'], 'products/new': ['Products', 'Add product'], 'products/edit': ['Products', 'Edit product'], 'settings/branding': ['Settings', 'Branding'], 'settings/company': ['Settings', 'Company'], 'settings/integrations': ['Settings', 'Integrations'] };

function shell(view) {
  const c = CRUMB[routeKey()] || ['Dashboard'], u = state.user.email || '';
  return `<div class="app">${sidebar()}<div class="main">
    <header class="top"><div class="crumbs"><button class="btn btn-sm menu-btn" data-a="menu" aria-label="Open menu">${ic('menu')}</button>${c.map((x, i) => i === c.length - 1 ? `<b>${x}</b>` : `<span>${x}</span><span>/</span>`).join('')}</div>
      <div class="user"><span style="color:var(--mute);font-size:13px">${esc(u)}</span><div class="avatar">${esc((u[0] || 'A').toUpperCase())}</div><button class="btn btn-sm" data-a="logout">Sign out</button></div></header>
    <main class="view" id="view">${DEMO ? '<div class="banner warn"><div><b>Demo mode.</b> Nothing is saved to Firebase. Open this page from http://localhost or your Firebase Hosting address, then sign in, to save real data.</div></div>' : ''}${view}</main></div></div>`;
}

function loginView(err) {
  return `<div class="login"><form class="card" id="login" novalidate>
    <div><h1>Sign in</h1><p style="color:var(--mute)">Use the admin account created in Firebase Authentication.</p></div>
    ${err ? `<div class="banner bad">${esc(err)}</div>` : ''}
    <div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="username" required></div>
    <div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password" required></div>
    <button class="btn btn-primary" style="min-height:44px" type="submit">Sign in</button></form></div>`;
}

/* ================= views ================= */
const lowest = p => (p.plans || []).reduce((m, x) => Math.min(m, +x.sellingPrice), Infinity);
const statusPill = s => `<span class="pill ${s === 'published' ? 'p-good' : 'p-mute'}">${s === 'published' ? 'Published' : 'Draft'}</span>`;
const thumbHtml = p => p.thumbnail?.url ? `<img class="thumb" src="${esc(p.thumbnail.url)}" alt="">` : `<div class="thumb">${ic('img')}</div>`;

function viewDashboard() {
  const ps = state.products, pub = ps.filter(p => p.status === 'published').length, plans = ps.reduce((a, p) => a + (p.plans || []).length, 0), s = state.settings;
  const checks = [
    [!DEMO && !state.error, 'Firebase connected', 'Products and settings are saved to your Firebase project.'],
    [!!s.companyName, 'Company name set', 'Shown in the sidebar and later in your shop.'],
    [!!s.logoUrl, 'Logo uploaded', 'Upload it under Settings, Branding.'],
    [ps.length > 0, 'First product created', 'Add a product with at least one plan.'],
    [pub > 0, 'First product published', 'Set the status to Published to show it in the shop.']
  ];
  const recent = [...ps].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5);
  return `<div class="page-head"><div><h1>Dashboard</h1><p>Overview of your catalog and setup.</p></div><a class="btn btn-primary" href="#/products/new">${ic('plus')}Add product</a></div>
  <div class="kpis">${[['Products', ps.length, 'in your catalog'], ['Published', pub, 'visible in shop'], ['Drafts', ps.length - pub, 'not yet visible'], ['Plans', plans, 'across all products']]
    .map(k => `<div class="card kpi"><div class="l">${k[0]}</div><div class="v mono">${k[1]}</div><div class="s">${k[2]}</div></div>`).join('')}</div>
  ${usageCard()}
  <div class="form-layout">
    <div class="card"><div class="card-h"><h2>Recently updated</h2><a class="btn btn-sm" href="#/products">View all</a></div>
      ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Product</th><th>Status</th><th class="r">From</th><th>Updated</th></tr></thead><tbody>${recent.map(p => `<tr><td><a href="#/products/edit/${p.id}" class="cell" style="text-decoration:none;color:inherit">${thumbHtml(p)}<div><b>${esc(p.name)}</b><span>${esc(p.category)}</span></div></a></td><td>${statusPill(p.status)}</td><td class="r mono">${isFinite(lowest(p)) ? money(lowest(p)) : '—'}</td><td>${fmtDate(p.updatedAt)}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty"><b>No products yet</b>Create your first product to see it here.</div>`}</div>
    <div class="card"><div class="card-h"><h2>Setup checklist</h2><span class="mono" style="color:var(--mute)">${checks.filter(c => c[0]).length}/${checks.length}</span></div>
      <div class="card-b">${checks.map(c => `<div class="check"><span class="dot ${c[0] ? 'ok' : ''}">${c[0] ? ic('check', '') : ''}</span><div><b style="font-weight:600">${c[1]}</b><div style="color:var(--mute);font-size:12px">${c[2]}</div></div></div>`).join('')}</div></div>
  </div>`;
}

function productRows() {
  const q = state.q.toLowerCase();
  const list = state.products.filter(p => (state.status === 'all' || p.status === state.status) && (!q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  if (!list.length) return `<tr><td colspan="6"><div class="empty"><b>${state.products.length ? 'No matching products' : 'No products yet'}</b>${state.products.length ? 'Try a different search or filter.' : 'Click Add product to create one.'}</div></td></tr>`;
  return list.map(p => `<tr><td><div class="cell">${thumbHtml(p)}<div style="min-width:0"><b>${esc(p.name)}</b><span>${esc(p.shortDescription || '').slice(0, 60)}</span></div></div></td>
    <td>${esc(p.category)}</td><td>${statusPill(p.status)}</td><td class="mono">${(p.plans || []).length}</td>
    <td class="r mono">${isFinite(lowest(p)) ? money(lowest(p)) : '—'}</td>
    <td class="r" style="white-space:nowrap"><a class="btn btn-sm" href="#/products/edit/${p.id}">Edit</a> <button class="btn btn-sm btn-danger" data-a="del" data-id="${p.id}">Delete</button></td></tr>`).join('');
}
function viewProducts() {
  return `<div class="page-head"><div><h1>Products</h1><p>Software products and services with their plans and media.</p></div><a class="btn btn-primary" href="#/products/new">${ic('plus')}Add product</a></div>
  <div class="card"><div class="card-h"><div class="toolbar"><input type="search" id="q" placeholder="Search products" value="${esc(state.q)}" style="width:240px" aria-label="Search products">
    <select id="st" aria-label="Filter by status" style="width:150px"><option value="all">All statuses</option><option value="published" ${state.status === 'published' ? 'selected' : ''}>Published</option><option value="draft" ${state.status === 'draft' ? 'selected' : ''}>Draft</option></select></div>
    <span style="color:var(--mute)">${state.products.length} total</span></div>
    <div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Status</th><th>Plans</th><th class="r">Lowest price</th><th class="r">Actions</th></tr></thead><tbody id="tbody">${productRows()}</tbody></table></div></div>`;
}

/* ---- product form ---- */
const blankPlan = () => ({ id: 'pl' + Math.random().toString(36).slice(2, 8), name: '', users: 5, originalPrice: '', sellingPrice: '', extraUserPrice: '' });
function initForm() {
  const [, mode, id] = routeParts();
  if (mode === 'edit') {
    const p = state.products.find(x => x.id === id);
    if (!p) return F = { missing: true, key: location.hash };
    F = { key: location.hash, id: p.id, isNew: false, removed: [], data: JSON.parse(JSON.stringify(p)), createdAt: p.createdAt };
    F.data.gallery = F.data.gallery || []; F.data.plans = F.data.plans || [];
  } else {
    F = { key: location.hash, id: B.newId(), isNew: true, removed: [], data: { name: '', category: 'Software', status: 'draft', shortDescription: '', description: '', thumbnail: null, mainImage: null, gallery: [], video: null, plans: [blankPlan()] } };
  }
}
function discHtml(p) {
  const o = +p.originalPrice, s = +p.sellingPrice;
  if (o > 0 && s >= 0 && p.sellingPrice !== '' && s < o) return `<div class="disc" id="disc-${p.id}">Save ${money(o - s)} (${Math.round((o - s) / o * 100)}% off)</div>`;
  return `<div class="disc none" id="disc-${p.id}">No discount</div>`;
}
function planCard(p, i) {
  const f = (k, label, type, extra = '', cls = '') => `<div class="field ${cls}"><label for="${k}-${p.id}">${label}</label><input id="${k}-${p.id}" type="${type}" ${extra} value="${esc(p[k])}" data-p="${i}" data-k="${k}"></div>`;
  return `<div class="plan"><div class="plan-h"><b>Plan ${i + 1}</b>${F.data.plans.length > 1 ? `<button class="btn btn-sm btn-danger" data-a="rmplan" data-i="${i}">Remove</button>` : ''}</div>
    <div class="plan-grid">${f('name', 'Plan name', 'text', 'placeholder="e.g. ULTRA"', 'w2')}${f('users', 'Users included', 'number', 'min="1" inputmode="numeric"', 'w2')}${f('extraUserPrice', 'Extra user price', 'number', 'min="0" inputmode="numeric" placeholder="per user, month"', 'w2')}
      ${f('originalPrice', 'Original price', 'number', 'min="0" inputmode="numeric" placeholder="1999"', 'w2')}${f('sellingPrice', 'Selling price', 'number', 'min="0" inputmode="numeric" placeholder="999"', 'w2')}
      <div class="field w2"><label>Discount</label>${discHtml(p)}</div></div></div>`;
}
function dropzone(slot, label, hint, accept, multiple) {
  return `<label class="drop" data-slot="${slot}">${ic('upload')}<b style="color:var(--fg);font-weight:600">${label}</b><span style="font-size:12px">${hint}</span><input type="file" accept="${accept}" ${multiple ? 'multiple' : ''} data-slot="${slot}"></label>`;
}
function mediaItem(item, slot, idx, tag, contain) {
  const isVid = slot === 'video';
  return `<div class="media ${contain ? 'contain' : ''}">${isVid ? `<video src="${esc(item.url)}" controls muted preload="metadata"></video>` : `<img src="${esc(item.url)}" alt="">`}
    ${item.file ? `<span class="tag">Not uploaded yet</span>` : tag ? `<span class="tag">${tag}</span>` : ''}
    <button type="button" class="x" data-a="rmmedia" data-slot="${slot}" data-i="${idx}" aria-label="Remove">${ic('x', '')}</button></div>`;
}
function viewForm() {
  if (F.missing) return `<div class="empty card"><b>Product not found</b><a class="btn" href="#/products" style="margin-top:12px">Back to products</a></div>`;
  const d = F.data, ph = 'JPG, PNG or WebP, up to 5 MB';
  return `<div class="page-head"><div><h1>${F.isNew ? 'Add product' : 'Edit product'}</h1><p>${F.isNew ? 'Create a product, add plans and upload its media.' : esc(d.name)}</p></div></div>
  <div id="errs"></div>
  <form id="pform" novalidate><div class="form-layout">
    <div class="stack">
      <div class="card"><div class="card-h"><h2>Basic details</h2></div><div class="card-b" style="display:flex;flex-direction:column;gap:16px">
        <div class="field"><label for="f-name">Product name</label><input id="f-name" type="text" data-f="name" value="${esc(d.name)}" placeholder="e.g. StockPilot Inventory"></div>
        <div class="field"><label for="f-short">Short description</label><input id="f-short" type="text" data-f="shortDescription" value="${esc(d.shortDescription)}" maxlength="140" placeholder="One line shown on product cards"></div>
        <div class="field"><label for="f-desc">Full description</label><textarea id="f-desc" data-f="description" rows="5">${esc(d.description)}</textarea></div></div></div>
      <div class="card"><div class="card-h"><div><h2>Plans and pricing</h2><p>Each plan has its own price, discount and extra user price. Prices in ${esc(state.settings.currency || 'INR')}.</p></div>
        <button type="button" class="btn btn-sm" data-a="addplan">${ic('plus')}Add plan</button></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:14px">${d.plans.map(planCard).join('')}</div></div>
      <div class="card"><div class="card-h"><div><h2>Media</h2><p>Thumbnail for lists, main image for the product page, up to ${MAX_GALLERY} gallery images and one video.</p></div></div>
        <div class="card-b" style="display:flex;flex-direction:column;gap:20px">
          <div class="grid2"><div class="field"><span class="lbl">Thumbnail</span>${d.thumbnail ? mediaItem(d.thumbnail, 'thumbnail', 0) : dropzone('thumbnail', 'Upload thumbnail', 'Square works best. ' + ph, 'image/*')}</div>
            <div class="field"><span class="lbl">Main image</span>${d.mainImage ? mediaItem(d.mainImage, 'mainImage', 0) : dropzone('mainImage', 'Upload main image', 'Wide image. ' + ph, 'image/*')}</div></div>
          <div class="field"><span class="lbl">Gallery (${d.gallery.length} of ${MAX_GALLERY})</span><div class="gallery">${d.gallery.map((g, i) => mediaItem(g, 'gallery', i)).join('')}${d.gallery.length < MAX_GALLERY ? dropzone('gallery', 'Add images', ph, 'image/*', true) : ''}</div></div>
          <div class="field"><span class="lbl">Video (optional)</span>${d.video ? `<div style="max-width:360px">${mediaItem(d.video, 'video', 0)}</div>` : dropzone('video', 'Upload video', 'MP4 or WebM, up to 100 MB', 'video/*')}</div></div></div>
    </div>
    <div class="stack" style="position:sticky;top:80px">
      <div class="card"><div class="card-h"><h2>Publishing</h2></div><div class="card-b" style="display:flex;flex-direction:column;gap:16px">
        <div class="field"><label for="f-status">Status</label><select id="f-status" data-f="status"><option value="draft" ${d.status === 'draft' ? 'selected' : ''}>Draft</option><option value="published" ${d.status === 'published' ? 'selected' : ''}>Published</option></select><small>Only published products appear in the shop.</small></div>
        <div class="field"><label for="f-cat">Category</label><select id="f-cat" data-f="category">${['Software', 'Graphic design', 'Video editing', 'Motion graphics'].map(c => `<option ${d.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <button class="btn btn-primary" style="min-height:42px" type="submit">${F.isNew ? 'Create product' : 'Save changes'}</button>
        <a class="btn" href="#/products">Cancel</a></div></div>
    </div></div></form>`;
}

/* ---- settings ---- */
function viewBranding() {
  if (!L) L = { item: state.settings.logoUrl ? { url: state.settings.logoUrl, path: state.settings.logoPath } : null, removed: [] };
  return `<div class="page-head"><div><h1>Branding</h1><p>Upload your logo. It is stored in Firebase Storage and the link is saved in Firestore.</p></div></div>
  <div class="card" style="max-width:760px"><div class="card-h"><h2>Company logo</h2></div><div class="card-b"><div class="row">
    <div class="logo-prev">${L.item ? `<img src="${esc(L.item.url)}" alt="Current logo">` : 'No logo yet'}</div>
    <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:12px">
      ${dropzone('logo', L.item ? 'Replace logo' : 'Upload logo', 'PNG, SVG or JPG, up to 5 MB. Transparent background looks best.', 'image/*')}
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-a="savelogo" ${L.item?.file || L.removedFlag ? '' : 'disabled'}>Save logo</button>
        ${L.item ? '<button class="btn btn-danger" data-a="rmlogo">Remove logo</button>' : ''}</div>
      ${L.item?.file ? '<small style="color:var(--warn)">New logo selected. Click Save logo to upload it.</small>' : ''}</div></div></div></div>`;
}
function viewCompany() {
  const s = state.settings;
  return `<div class="page-head"><div><h1>Company</h1><p>Basic business details used across the console and shop.</p></div></div>
  <form class="card" id="cform" style="max-width:760px" novalidate><div class="card-h"><h2>Company profile</h2></div><div class="card-b" style="display:flex;flex-direction:column;gap:16px">
    <div class="field"><label for="c-name">Company name</label><input id="c-name" type="text" value="${esc(s.companyName)}"></div>
    <div class="grid2"><div class="field"><label for="c-mail">Support email</label><input id="c-mail" type="email" value="${esc(s.supportEmail)}"></div>
      <div class="field"><label for="c-web">Website</label><input id="c-web" type="text" value="${esc(s.website)}" placeholder="https://"></div></div>
    <div class="field" style="max-width:240px"><label for="c-cur">Currency</label><select id="c-cur">${Object.keys(CUR).map(c => `<option ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    <div><button class="btn btn-primary" type="submit">Save company</button></div></div></form>`;
}

function viewIntegrations() {
  const s = state.settings;
  return `<div class="page-head"><div><h1>Integrations</h1><p>Connect Cloudinary for media and check that everything works.</p></div></div>
  <form class="card" id="iform" style="max-width:760px" novalidate><div class="card-h"><div><h2>Cloudinary</h2><p>When set, product media and the logo upload to Cloudinary. Otherwise they go to Firebase Storage.</p></div></div><div class="card-b" style="display:flex;flex-direction:column;gap:16px">
    <div class="grid2"><div class="field"><label for="i-cloud">Cloud name</label><input id="i-cloud" type="text" value="${esc(s.cloudName)}" autocomplete="off"><small>Cloudinary dashboard, top left.</small></div>
      <div class="field"><label for="i-preset">Unsigned upload preset</label><input id="i-preset" type="text" value="${esc(s.uploadPreset)}" autocomplete="off"><small>Settings, Upload, Add upload preset, Signing mode: Unsigned.</small></div></div>
    <div class="field"><label for="i-usage">Cloudinary function URL</label><input id="i-usage" type="text" value="${esc(s.usageUrl)}" placeholder="https://cloudinaryapi-xxxx.a.run.app" autocomplete="off"><small>Printed by <span class="mono">firebase deploy</span> for the cloudinaryApi function. It powers usage numbers and the Media library. Never put the API secret in this page.</small></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" type="submit">Save</button><button class="btn" type="button" data-a="tests">Run connection tests</button></div></div></form>
  <div class="card" style="max-width:760px"><div class="card-h"><h2>Test results</h2></div><div class="card-b" id="tests"><span style="color:var(--mute)">Save your settings, then run the tests.</span></div></div>`;
}
async function runTests() {
  const out = $('#tests'), rows = [];
  const show = () => out.innerHTML = rows.map(r => `<div class="check"><span class="dot ${r[1] === true ? 'ok' : r[1] === false ? 'no' : ''}">${r[1] === true ? ic('check', '') : r[1] === false ? ic('x', '') : ''}</span><div><b style="font-weight:600">${esc(r[0])}</b><div style="color:var(--mute);font-size:12px;overflow-wrap:anywhere">${esc(r[2])}</div></div></div>`).join('');
  const step = async (name, fn) => { rows.push([name, null, 'Testing…']); show(); try { rows[rows.length - 1] = [name, true, await fn()]; } catch (e) { rows[rows.length - 1] = [name, false, e.code || e.message || String(e)]; } show(); };
  const file = new File([await (await fetch(PNG)).blob()], 'ping.png', { type: 'image/png' });
  await step('Firestore write and read', async () => { await B.ping(); return DEMO ? 'Demo mode: Firebase was not contacted' : 'Wrote and read back a test document'; });
  await step('Firebase Storage upload', async () => { await B.pingStorage(); return DEMO ? 'Demo mode: Firebase was not contacted' : 'Uploaded and deleted a test image'; });
  await step('Cloudinary upload', async () => { if (!cloudOn()) throw new Error('Enter cloud name and upload preset, then save.'); const r = await cloudUpload(file, '_tests', () => {}); return 'Uploaded: ' + r.url; });
  await step('Cloudinary usage', async () => { const u = await fetchCloudUsage(); return `${u.sample ? 'Sample data. ' : ''}Storage ${fmtBytes(u.storageBytes)}, ${u.videos} videos, ${u.images} images`; });
}

/* ================= render ================= */
function render() {
  const root = $('#root');
  if (!state.user) { root.innerHTML = loginView(render.err); $('#login').onsubmit = onLogin; return; }
  const key = routeKey(); let view;
  if (!state.loaded) view = `<div class="empty"><b>Loading…</b></div>`;
  else {
    if (key !== 'products/new' && key !== 'products/edit') F = null;
    if (!key.startsWith('settings/branding')) L = null;
    const err = state.error ? `<div class="banner bad"><div><b>Could not reach Firebase.</b> ${esc(state.error)}<br>Check that Authentication, Firestore and Storage are enabled and the rules in this repo are deployed.</div></div>` : '';
    if (key === 'products/new' || key === 'products/edit') { if (!F || F.key !== location.hash) initForm(); view = viewForm(); }
    else view = err + ({ dashboard: viewDashboard, products: viewProducts, 'settings/branding': viewBranding, 'settings/company': viewCompany, 'settings/integrations': viewIntegrations, media: viewMedia }[key] || viewDashboard)();
  }
  if (key === 'dashboard' && state.loaded && !state.usage) setTimeout(loadUsage, 0);
  if (key === 'media' && state.loaded && !state.media.loaded && !state.media.loading) setTimeout(() => loadMedia(true), 0);
  const y = window.scrollY; root.innerHTML = shell(view); window.scrollTo(0, y);
}

/* ================= actions ================= */
async function loadAll() {
  try { [state.settings, state.products] = await Promise.all([B.getSettings().then(s => ({ currency: 'INR', ...s })), B.listProducts()]); state.error = ''; }
  catch (e) { state.error = e.message || String(e); }
  state.loaded = true; render();
}
async function onLogin(e) {
  e.preventDefault();
  try { await B.signIn($('#em').value.trim(), $('#pw').value); }
  catch (er) { render.err = /invalid|wrong|user-not-found|credential/i.test(er.code + er.message) ? 'Email or password is incorrect.' : (er.message || 'Sign in failed.'); render(); }
}

function pickFiles(slot, files) {
  files = [...files]; if (!files.length) return;
  const isVid = slot === 'video', max = isVid ? MAX_VID : MAX_IMG, ok = [];
  for (const f of files) {
    if (!f.type.startsWith(isVid ? 'video/' : 'image/')) { toast(`${f.name} is not a ${isVid ? 'video' : 'image'}.`, true); continue; }
    if (f.size > max) { toast(`${f.name} is over ${mb(max)} MB.`, true); continue; }
    ok.push({ url: URL.createObjectURL(f), file: f });
  }
  if (!ok.length) return;
  if (slot === 'logo') { L.item = ok[0]; L.removedFlag = false; return render(); }
  const d = F.data;
  if (slot === 'gallery') {
    const room = MAX_GALLERY - d.gallery.length; if (ok.length > room) toast(`Only ${MAX_GALLERY} gallery images allowed. Extra files skipped.`, true);
    d.gallery.push(...ok.slice(0, room));
  } else d[slot] = ok[0];
  render();
}
function dropItem(item) { if (item?.path) F.removed.push(item.path); if (item?.file) URL.revokeObjectURL(item.url); }

function validateForm() {
  const d = F.data, errs = [];
  if (!d.name.trim()) errs.push('Product name is required.');
  if (!d.plans.length) errs.push('Add at least one plan.');
  d.plans.forEach((p, i) => {
    const n = `Plan ${i + 1}`;
    if (!String(p.name).trim()) errs.push(`${n}: enter a plan name.`);
    if (p.sellingPrice === '' || +p.sellingPrice < 0) errs.push(`${n}: enter a selling price.`);
    if (p.originalPrice !== '' && +p.sellingPrice > +p.originalPrice) errs.push(`${n}: selling price cannot be higher than the original price.`);
    if (!(+p.users >= 1)) errs.push(`${n}: users included must be at least 1.`);
  });
  return errs;
}

async function runUploads(jobs, title) {
  const total = jobs.reduce((a, j) => a + j.file.size, 0) || 1, done = new Map(), box = progressBox(title);
  const upd = () => { const v = [...done.values()].reduce((a, b) => a + b, 0); box.set(Math.min(100, v / total * 100), `${mb(v) || '0'} of ${mb(total) || '0'} MB uploaded`); };
  try {
    return await Promise.all(jobs.map(async (j, i) => {
      const r = await uploadAny(j.path, j.file, loaded => { done.set(i, loaded); upd(); });
      done.set(i, j.file.size); upd(); return r;
    }));
  } finally { box.close(); }
}

async function saveProduct() {
  const errs = validateForm(), box = $('#errs');
  if (errs.length) { box.innerHTML = `<div class="banner bad"><div><b>Fix these before saving:</b><ul>${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div></div>`; window.scrollTo(0, 0); return; }
  box.innerHTML = '';
  const d = F.data, now = Date.now(), jobs = [], tag = () => `${now}-${jobs.length}`;
  const queue = (item, folder) => { if (item?.file) { const j = { item, file: item.file, path: `products/${F.id}/${folder}-${tag()}-${safeName(item.file.name)}` }; jobs.push(j); } };
  queue(d.thumbnail, 'thumbnail'); queue(d.mainImage, 'main'); d.gallery.forEach(g => queue(g, 'gallery')); queue(d.video, 'video');
  try {
    const res = jobs.length ? await runUploads(jobs, 'Uploading media') : [];
    jobs.forEach((j, i) => { Object.assign(j.item, res[i]); delete j.item.file; });
    const clean = m => m ? { url: m.url, path: m.path || '', publicId: m.publicId || '', provider: m.provider || 'firebase' } : null;
    const num = v => v === '' || v == null ? 0 : +v;
    const doc = {
      id: F.id, name: d.name.trim(), category: d.category, status: d.status, shortDescription: d.shortDescription.trim(), description: d.description.trim(),
      thumbnail: clean(d.thumbnail), mainImage: clean(d.mainImage), gallery: d.gallery.map(clean), video: clean(d.video),
      plans: d.plans.map(p => ({ id: p.id, name: String(p.name).trim(), users: num(p.users), originalPrice: p.originalPrice === '' ? num(p.sellingPrice) : num(p.originalPrice), sellingPrice: num(p.sellingPrice), extraUserPrice: num(p.extraUserPrice) })),
      createdAt: F.createdAt || now, updatedAt: now
    };
    await B.saveProduct(doc);
    F.removed.forEach(p => B.removeFile(p));
    state.products = state.products.filter(p => p.id !== doc.id).concat([doc]);
    toast(F.isNew ? 'Product created' : 'Changes saved'); F = null; location.hash = '#/products';
  } catch (e) { toast('Save failed: ' + (e.code || e.message), true); render(); }
}

async function saveLogo() {
  try {
    const s = { ...state.settings };
    if (L.item?.file) {
      const f = L.item.file, [r] = await runUploads([{ file: f, path: `branding/logo-${Date.now()}-${safeName(f.name)}` }], 'Uploading logo');
      if (s.logoPath) B.removeFile(s.logoPath);
      s.logoUrl = r.url; s.logoPath = r.path || ''; s.logoPublicId = r.publicId || '';
    } else if (L.removedFlag) { if (s.logoPath) B.removeFile(s.logoPath); s.logoUrl = ''; s.logoPath = ''; }
    await B.saveSettings(s); state.settings = s; L = null; toast('Logo saved'); render();
  } catch (e) { toast('Logo save failed: ' + (e.code || e.message), true); }
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a;
  if (a === 'menu') { state.menu = !state.menu; $('#side').classList.toggle('open', state.menu); }
  else if (a === 'logout') { B.signOut(); state.loaded = false; }
  else if (a === 'addplan') { F.data.plans.push(blankPlan()); render(); }
  else if (a === 'rmplan') { F.data.plans.splice(+b.dataset.i, 1); render(); }
  else if (a === 'rmmedia') {
    const { slot, i } = b.dataset;
    if (slot === 'gallery') dropItem(F.data.gallery.splice(+i, 1)[0]); else { dropItem(F.data[slot]); F.data[slot] = null; }
    render();
  }
  else if (a === 'del') {
    const p = state.products.find(x => x.id === b.dataset.id);
    if (!await confirmBox('Delete product', `"${p.name}" and its uploaded media will be permanently deleted.`, 'Delete')) return;
    try {
      await B.deleteProduct(p.id);
      [p.thumbnail, p.mainImage, p.video, ...(p.gallery || [])].forEach(m => m?.path && B.removeFile(m.path));
      state.products = state.products.filter(x => x.id !== p.id); toast('Product deleted'); render();
    } catch (er) { toast('Delete failed: ' + (er.code || er.message), true); }
  }
  else if (a === 'savelogo') saveLogo();
  else if (a === 'mtype') { state.media.type = b.dataset.t; loadMedia(true); }
  else if (a === 'mmore') loadMedia(false);
  else if (a === 'msel') { const m = state.media; m.sel.has(b.dataset.id) ? m.sel.delete(b.dataset.id) : m.sel.add(b.dataset.id); render(); }
  else if (a === 'mall') { const m = state.media; if (m.sel.size === m.items.length) m.sel.clear(); else m.items.forEach(x => m.sel.add(mkey(x))); render(); }
  else if (a === 'mview') previewMedia(b.dataset.id);
  else if (a === 'mdel1') deleteMedia([b.dataset.id]);
  else if (a === 'mdeln') deleteMedia([...state.media.sel]);
  else if (a === 'usage') { state.usage = null; loadUsage(); render(); }
  else if (a === 'tests') runTests(b);
  else if (a === 'rmlogo') { if (L.item?.path) { /* removed on save */ } L.item = null; L.removedFlag = true; render(); }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'pform') { e.preventDefault(); saveProduct(); }
  if (e.target.id === 'iform') {
    e.preventDefault();
    const s = { ...state.settings, cloudName: $('#i-cloud').value.trim(), uploadPreset: $('#i-preset').value.trim(), usageUrl: $('#i-usage').value.trim() };
    B.saveSettings(s).then(() => { state.settings = s; state.usage = null; toast('Integrations saved'); }).catch(er => toast('Save failed: ' + (er.code || er.message), true));
  }
  if (e.target.id === 'cform') {
    e.preventDefault();
    const s = { ...state.settings, companyName: $('#c-name').value.trim(), supportEmail: $('#c-mail').value.trim(), website: $('#c-web').value.trim(), currency: $('#c-cur').value };
    B.saveSettings(s).then(() => { state.settings = s; toast('Company saved'); render(); }).catch(er => toast('Save failed: ' + (er.code || er.message), true));
  }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { state.q = t.value; $('#tbody').innerHTML = productRows(); }
  else if (F && t.dataset.f) F.data[t.dataset.f] = t.value;
  else if (F && t.dataset.p !== undefined) {
    const p = F.data.plans[+t.dataset.p]; p[t.dataset.k] = t.value;
    if (t.dataset.k === 'originalPrice' || t.dataset.k === 'sellingPrice') $('#disc-' + p.id).outerHTML = discHtml(p);
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'st') { state.status = t.value; $('#tbody').innerHTML = productRows(); }
  else if (F && t.dataset.f) F.data[t.dataset.f] = t.value;
  else if (t.type === 'file' && t.dataset.slot) { pickFiles(t.dataset.slot, t.files); t.value = ''; }
});
['dragover', 'dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
  const z = e.target.closest('.drop'); if (!z) return;
  e.preventDefault(); z.classList.toggle('over', ev === 'dragover');
  if (ev === 'drop') pickFiles(z.dataset.slot, e.dataTransfer.files);
}));
window.addEventListener('hashchange', () => { state.menu = false; window.scrollTo(0, 0); render(); });

/* ================= boot ================= */
(async function boot() {
  $('#root').innerHTML = '<div class="empty" style="padding-top:20vh"><b>Loading…</b></div>';
  try { B = DEMO ? demoBackend() : await firebaseBackend(); }
  catch (e) { $('#root').innerHTML = `<div class="empty" style="padding-top:20vh"><b>Could not load Firebase</b>${esc(e.message)}<br>Open this page over http(s), for example with Firebase Hosting, and check your connection.</div>`; return; }
  B.onAuth(async u => {
    const was = state.user; state.user = u; render.err = '';
    if (u && !was) { state.loaded = false; render(); await loadAll(); }
    else render();
  });
})();
