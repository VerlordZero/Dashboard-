// Shared Cloudinary logic used by the local helper and the Netlify function.
// The API secret is passed in by the caller and never leaves the server.
module.exports = function makeCloudinary({ cloud, key, secret, api = 'https://api.cloudinary.com' }) {
  const base = `${api}/v1_1/${cloud}`;
  const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const call = async (p, init = {}) => {
    const r = await fetch(base + p, { ...init, headers: { Authorization: auth, 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error?.message || 'Cloudinary HTTP ' + r.status); return j;
  };
  const search = body => call('/resources/search', { method: 'POST', body: JSON.stringify(body) });

  // params: URLSearchParams. Returns a plain object, or throws (error.status optional).
  return async function handle(params, method, body) {
    const action = params.get('action') || 'usage';
    if (action === 'usage') {
      const [u, v, i] = await Promise.all([call('/usage'), search({ expression: 'resource_type:video', max_results: 1 }), search({ expression: 'resource_type:image', max_results: 1 })]);
      return { plan: u.plan, storageBytes: u.storage?.usage ?? 0, credits: u.credits || null, videos: v.total_count, images: i.total_count, lastUpdated: u.last_updated };
    }
    if (action === 'list') {
      const t = params.get('type'), cursor = params.get('cursor');
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
  };
};
