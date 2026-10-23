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
let KEY = process.env.CLOUDINARY_API_KEY, SECRET = process.env.CLOUDINARY_API_SECRET;
const PORT = +process.env.PORT || 8787;
const API = process.env.CLOUDINARY_API_BASE || 'https://api.cloudinary.com';
let handleRequest = null; // built once the key and secret are known

// Only pages opened from this computer (file:// or localhost) may call the helper.
const allowed = o => !o || o === 'null' || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin, send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (!allowed(origin)) { res.writeHead(403); return res.end('{"error":"Origin not allowed"}'); }
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  let raw = ''; for await (const c of req) raw += c;
  try { send(200, await handleRequest(new URL(req.url, 'http://x').searchParams, req.method, raw ? JSON.parse(raw) : {})); }
  catch (e) { send(e.status || 500, { error: e.message }); }
});


// First run: ask for the key and secret once and save them in server/.env on this computer.
async function ask() {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  const q = t => new Promise(r => rl.question(t, r));
  console.log('First run. Your Cloudinary key and secret will be saved only in server/.env on this computer.');
  KEY = (await q('Cloudinary API key: ')).trim(); SECRET = (await q('Cloudinary API secret: ')).trim(); rl.close();
  if (KEY && SECRET) fs.writeFileSync(path.join(__dirname, '.env'), `CLOUDINARY_CLOUD_NAME=${CLOUD}\nCLOUDINARY_API_KEY=${KEY}\nCLOUDINARY_API_SECRET=${SECRET}\n`);
}
(async () => {
  if (!KEY || !SECRET) await ask();
  if (!KEY || !SECRET) { console.error('Key and secret are required.'); process.exit(1); }
  handleRequest = require('./core')({ cloud: CLOUD, key: KEY, secret: SECRET, api: API });
  server.listen(PORT, '127.0.0.1', () => console.log(`Cloudinary helper running on http://localhost:${PORT} (cloud: ${CLOUD}). Keep this window open.`));
})();
