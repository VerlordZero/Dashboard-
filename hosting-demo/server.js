// Demo: drag-and-drop website hosting through the Netlify API.
// Run:  node hosting-demo/server.js   then open http://localhost:8790
// Needs Node 18+. No packages. The token is read from NETLIFY_TOKEN or typed once at start. It is never saved to a file.
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), readline = require('readline');

const API = process.env.NETLIFY_API_BASE || 'https://api.netlify.com/api/v1';
const PORT = +process.env.PORT || 8790;
let TOKEN = process.env.NETLIFY_TOKEN || '';

const ALLOWED = new Set(['.html', '.css', '.js', '.json', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.mp4', '.webm', '.xml']);
const MAX_TOTAL = 15 * 1024 * 1024, MAX_FILES = 100;

async function nl(p, opt = {}) {
  const r = await fetch(API + p, { ...opt, headers: { Authorization: 'Bearer ' + TOKEN, ...(opt.headers || {}) } });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; }
  if (!r.ok) throw Object.assign(new Error(r.status === 401 ? 'Netlify rejected the token (wrong, expired or deleted).' : (typeof j === 'object' ? (j.message || j.error || JSON.stringify(j)) : String(t).slice(0, 200))), { status: r.status });
  return j;
}
const json = (o, h = {}) => ({ headers: { 'Content-Type': 'application/json', ...h }, body: JSON.stringify(o) });

function check(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('No files received.');
  if (files.length > MAX_FILES) throw new Error(`Too many files (limit ${MAX_FILES}).`);
  let total = 0;
  for (const f of files) {
    if (!/^\/[A-Za-z0-9._\-\/]+$/.test(f.path) || f.path.includes('..') || f.path.includes('//')) throw new Error(`Bad file name: ${f.path}`);
    if (!ALLOWED.has(path.extname(f.path).toLowerCase())) throw new Error(`File type not allowed: ${f.path}`);
    total += Buffer.byteLength(f.content, 'base64');
  }
  if (total > MAX_TOTAL) throw new Error('Total size is over 15 MB.');
  if (!files.some(f => f.path === '/index.html')) throw new Error('The site needs an index.html at its top level.');
}

async function deploy(siteId, files) {
  check(files);
  if (!siteId) siteId = (await nl('/sites', { method: 'POST', ...json({ name: 'demo-' + crypto.randomBytes(4).toString('hex') }) })).id;
  const digest = {}, bufs = {};
  for (const f of files) { const b = Buffer.from(f.content, 'base64'); bufs[f.path] = b; digest[f.path] = crypto.createHash('sha1').update(b).digest('hex'); }
  const d = await nl(`/sites/${siteId}/deploys`, { method: 'POST', ...json({ files: digest }) });
  const need = new Set(d.required || []);
  for (const [p, b] of Object.entries(bufs)) {
    if (need.has(digest[p])) await nl(`/deploys/${d.id}/files${p.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: b });
  }
  for (let i = 0; i < 40; i++) {                         // wait until Netlify says the deploy is live
    const s = await nl(`/deploys/${d.id}`);
    if (s.state === 'ready') { const site = await nl(`/sites/${siteId}`); return { siteId, deployId: d.id, url: site.ssl_url || site.url }; }
    if (s.state === 'error') throw new Error('Netlify could not publish this deploy: ' + (s.error_message || 'unknown error'));
    await new Promise(r => setTimeout(r, 1500));
  }
  throw new Error('Netlify is taking too long. Check the site in your Netlify dashboard.');
}

const sameOrigin = o => !o || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const server = http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (!sameOrigin(req.headers.origin)) return send(403, { error: 'Origin not allowed' });
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res); }
  if (req.method !== 'POST') { res.writeHead(404); return res.end(); }
  let raw = ''; for await (const c of req) { raw += c; if (raw.length > 30e6) return send(413, { error: 'Upload too large.' }); }
  try {
    const body = JSON.parse(raw || '{}');
    if (url.pathname === '/api/deploy') return send(200, await deploy(body.siteId, body.files));
    if (url.pathname === '/api/delete' && /^[A-Za-z0-9-]+$/.test(body.siteId || '')) { await nl(`/sites/${body.siteId}`, { method: 'DELETE' }); return send(200, { deleted: true }); }
    send(404, { error: 'Unknown call' });
  } catch (e) { send(e.status && e.status < 500 ? 400 : 500, { error: e.message }); }
});

(async () => {
  if (!TOKEN) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    TOKEN = await new Promise(r => { rl.question('Paste your Netlify token (not saved): ', a => { rl.close(); r(a.trim()); }); });
  }
  if (!TOKEN) { console.error('A token is required.'); process.exit(1); }
  server.listen(PORT, '127.0.0.1', () => console.log(`Hosting demo running on http://localhost:${PORT}`));
})();
