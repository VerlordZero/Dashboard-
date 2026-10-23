const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');
admin.initializeApp();

const SECRET = defineSecret('CLOUDINARY_API_SECRET');
const CLOUD = defineString('CLOUDINARY_CLOUD_NAME');
const KEY = defineString('CLOUDINARY_API_KEY');

// Returns Cloudinary storage, credits and media counts to signed-in admins.
// The API secret stays here on the server and never reaches the browser.
exports.cloudinaryUsage = onRequest({ secrets: [SECRET], cors: true }, async (req, res) => {
  try { await admin.auth().verifyIdToken((req.get('Authorization') || '').replace('Bearer ', '')); }
  catch (e) { return res.status(401).json({ error: 'Sign in required' }); }
  const base = `https://api.cloudinary.com/v1_1/${CLOUD.value()}`;
  const auth = 'Basic ' + Buffer.from(`${KEY.value()}:${SECRET.value()}`).toString('base64');
  const call = async (path, init = {}) => {
    const r = await fetch(base + path, { ...init, headers: { Authorization: auth, 'Content-Type': 'application/json' } });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'Cloudinary HTTP ' + r.status); return j;
  };
  const count = type => call('/resources/search', { method: 'POST', body: JSON.stringify({ expression: `resource_type:${type}`, max_results: 1 }) }).then(j => j.total_count);
  try {
    const [u, videos, images] = await Promise.all([call('/usage'), count('video'), count('image')]);
    res.json({ plan: u.plan, storageBytes: u.storage?.usage ?? 0, credits: u.credits || null, videos, images, lastUpdated: u.last_updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
