import { makeToken, safeEqual, body, send, wrap } from './_lib.js';

// POST /api/login {password} -> {token}
export default wrap(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return send(res, 500, { error: 'ADMIN_PASSWORD not set' });
  const { password } = await body(req);
  if (!safeEqual(password || '', pw)) return send(res, 401, { error: 'Incorrect password' });
  send(res, 200, { token: makeToken() });
});
