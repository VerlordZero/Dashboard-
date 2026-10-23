// Local helper for the admin console: lists, counts and deletes Cloudinary files.
// Keeps your API secret on your own computer. Run:  node server/cloudinary-server.js
// Needs Node 18 or newer. No packages to install.
const http = require('http'), fs = require('fs'), path = require('path');

// Read settings from environment variables or from server/.env (see .env.example).
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) {}
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'e956iksj';
const KEY = process.env.CLOUDINARY_API_KEY, SECRET = process.env.CLOUDINARY_API_SECRET;
const PORT = +process.env.PORT || 8787;
const API = process.env.CLOUDINARY_API_BASE || 'https://api.cloudinary.com';
if (!KEY || !SECRET) {
  console.error('Missing CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET.\nCopy server/.env.example to server/.env and fill in your values.');
  process.exit(1);
}
const base = `${API}/v1_1/${CLOUD}`;
const auth = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');
const call = async (p, init = {}) => {
  const r = await fetch(base + p, { ...init, headers: { Authorization: auth, 'Content-Type': 'application/json' } });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error?.message || 'Cloudinary HTTP ' + r.status); return j;
};
const search = body => call('/resources/search', { method: 'POST', body: JSON.stringify(body) });

async function handle(url, method, body) {
  const action = url.searchParams.get('action') || 'usage';
  if (action === 'usage') {
    const [u, v, i] = await Promise.all([call('/usage'), search({ expression: 'resource_type:video', max_results: 1 }), search({ expression: 'resource_type:image', max_results: 1 })]);
    return { plan: u.plan, storageBytes: u.storage?.usage ?? 0, credits: u.credits || null, videos: v.total_count, images: i.total_count, lastUpdated: u.last_updated };
  }
  if (action === 'list') {
    const t = url.searchParams.get('type'), cursor = url.searchParams.get('cursor');
    const expression = t === 'image' || t === 'video' ? `resource_type:${t}` : 'resource_type:image OR resource_type:video';
    const j = await search({ expression, sort_by: [{ created_at: 'desc' }], max_results: 30, ...(cursor ? { next_cursor: cursor } : {}) });
    return {
      total: j.total_count, nextCursor: j.next_cursor || null,
      items: j.resources.map(r => ({
        publicId: r.public_id, type: r.resource_type, url: r.secure_url, bytes: r.bytes, createdAt: Date.parse(r.created_at),
        thumb: r.resource_type === 'video' ? r.secure_url.replace(/\.[a-z0-9]+$/i, '.jpg') : r.secure_url.replace('/upload/', '/upload/c_fill,w_400,h_300,q_auto/')
      }))
    };
  }
  if (action === 'delete' && method === 'POST') {
    const groups = {}; let deleted = 0;
    for (const it of (body.items || []).slice(0, 100)) (groups[it.type === 'video' ? 'video' : 'image'] ||= []).push(it.publicId);
    for (const [type, ids] of Object.entries(groups)) {
      const q = new URLSearchParams(); ids.forEach(id => q.append('public_ids[]', id)); q.set('invalidate', 'true');
      const j = await call(`/resources/${type}/upload?${q}`, { method: 'DELETE' });
      deleted += Object.values(j.deleted || {}).filter(v => v === 'deleted').length;
    }
    return { deleted };
  }
  throw Object.assign(new Error('Unknown action'), { status: 400 });
}

// Only pages opened from this computer (file:// or localhost) may call the helper.
const allowed = o => !o || o === 'null' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
http.createServer(async (req, res) => {
  const origin = req.headers.origin, send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (!allowed(origin)) { res.writeHead(403); return res.end('{"error":"Origin not allowed"}'); }
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  let raw = ''; for await (const c of req) raw += c;
  try { send(200, await handle(new URL(req.url, 'http://x'), req.method, raw ? JSON.parse(raw) : {})); }
  catch (e) { send(e.status || 500, { error: e.message }); }
}).listen(PORT, '127.0.0.1', () => console.log(`Cloudinary helper running on http://localhost:${PORT} (cloud: ${CLOUD})`));
