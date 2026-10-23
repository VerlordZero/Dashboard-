// Netlify Function: serves the Media library and usage numbers to the admin console.
// Set these in Netlify > Site configuration > Environment variables:
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, ADMIN_CODE
const makeCloudinary = require('../../server/core.js');

exports.handler = async event => {
  const reply = (statusCode, obj) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret, ADMIN_CODE: code, CLOUDINARY_API_BASE: api } = process.env;
  if (!cloud || !key || !secret) return reply(500, { error: 'Cloudinary settings are missing in Netlify environment variables.' });
  if (code && event.headers['x-admin-code'] !== code) return reply(401, { error: 'Wrong or missing access code. Enter it in Settings, Integrations.' });
  try {
    const handle = makeCloudinary({ cloud, key, secret, ...(api ? { api } : {}) });
    return reply(200, await handle(new URLSearchParams(event.queryStringParameters || {}), event.httpMethod, event.body ? JSON.parse(event.body) : {}));
  } catch (e) { return reply(e.status || 500, { error: e.message }); }
};
