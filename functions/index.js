const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();

const SECRET = defineSecret('CLOUDINARY_API_SECRET');
const CLOUD = defineString('CLOUDINARY_CLOUD_NAME');
const KEY = defineString('CLOUDINARY_API_KEY');

// One endpoint for the admin console: ?action=usage | list | delete.
// The API secret stays on the server and only signed-in admins can call it.
exports.cloudinaryApi = onRequest({ secrets: [SECRET], cors: true }, async (req, res) => {
  try { await admin.auth().verifyIdToken((req.get('Authorization') || '').replace('Bearer ', '')); }
  catch (e) { return res.status(401).json({ error: 'Sign in required' }); }
  const base = `https://api.cloudinary.com/v1_1/${CLOUD.value()}`;
  const auth = 'Basic ' + Buffer.from(`${KEY.value()}:${SECRET.value()}`).toString('base64');
  const call = async (path, init = {}) => {
    const r = await fetch(base + path, { ...init, headers: { Authorization: auth, 'Content-Type': 'application/json' } });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Cloudinary HTTP ' + r.status); return j;
  };
  const search = body => call('/resources/search', { method: 'POST', body: JSON.stringify(body) });
  try {
    const action = req.query.action || 'usage';
    if (action === 'usage') {
      const [u, v, i] = await Promise.all([call('/usage'), search({ expression: 'resource_type:video', max_results: 1 }), search({ expression: 'resource_type:image', max_results: 1 })]);
      return res.json({ plan: u.plan, storageBytes: u.storage?.usage ?? 0, credits: u.credits || null, videos: v.total_count, images: i.total_count, lastUpdated: u.last_updated });
    }
    if (action === 'list') {
      const t = req.query.type;
      const expression = t === 'image' || t === 'video' ? `resource_type:${t}` : 'resource_type:image OR resource_type:video';
      const j = await search({ expression, sort_by: [{ created_at: 'desc' }], max_results: 30, ...(req.query.cursor ? { next_cursor: req.query.cursor } : {}) });
      const items = j.resources.map(r => ({
        publicId: r.public_id, type: r.resource_type, url: r.secure_url, bytes: r.bytes, createdAt: Date.parse(r.created_at),
        thumb: r.resource_type === 'video' ? r.secure_url.replace(/\.[a-z0-9]+$/i, '.jpg') : r.secure_url.replace('/upload/', '/upload/c_fill,w_400,h_300,q_auto/')
      }));
      return res.json({ items, total: j.total_count, nextCursor: j.next_cursor || null });
    }
    if (action === 'delete' && req.method === 'POST') {
      const groups = {};
      for (const it of (req.body.items || []).slice(0, 100)) (groups[it.type === 'video' ? 'video' : 'image'] ||= []).push(it.publicId);
      let deleted = 0;
      for (const [type, ids] of Object.entries(groups)) {
        const q = new URLSearchParams(); ids.forEach(id => q.append('public_ids[]', id)); q.set('invalidate', 'true');
        const j = await call(`/resources/${type}/upload?${q}`, { method: 'DELETE' });
        deleted += Object.values(j.deleted || {}).filter(v => v === 'deleted').length;
      }
      return res.json({ deleted });
    }
    res.status(400).json({ error: 'Unknown action' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
