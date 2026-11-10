import { db, toClient, isAdmin, STAT, body, send, wrap } from '../_lib.js';

// GET    /api/incidents/:id  -> public tracking (no contact)
// PATCH  /api/incidents/:id  -> admin: {status, team}; anyone: {lat,lng} only if not set yet (geocode result)
// DELETE /api/incidents/:id  -> admin
export default wrap(async (req, res) => {
  const id = String(req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop()).toUpperCase();
  const admin = isAdmin(req);
  if (req.method === 'GET') { const r = await db.get(id); return r ? send(res, 200, toClient(r, admin)) : send(res, 404, { error: 'Not found' }); }
  if (req.method === 'PATCH') {
    const b = await body(req), patch = {};
    if (b.status !== undefined) {
      if (!admin) return send(res, 401, { error: 'Admin login required' });
      if (!STAT.includes(b.status)) return send(res, 400, { error: 'Invalid status' });
      patch.status = b.status;
    }
    if (b.team !== undefined) {
      if (!admin) return send(res, 401, { error: 'Admin login required' });
      patch.team = String(b.team || '').slice(0, 20);
    }
    if (typeof b.lat === 'number' && typeof b.lng === 'number' && Math.abs(b.lat) <= 90 && Math.abs(b.lng) <= 180) {
      const cur = await db.get(id);
      if (cur && (admin || cur.lat == null)) { patch.lat = b.lat; patch.lng = b.lng; }
    }
    if (!Object.keys(patch).length) return send(res, 400, { error: 'Nothing to update' });
    const r = await db.update(id, patch);
    return r ? send(res, 200, toClient(r, admin)) : send(res, 404, { error: 'Not found' });
  }
  if (req.method === 'DELETE') {
    if (!admin) return send(res, 401, { error: 'Admin login required' });
    return (await db.remove(id)) ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Not found' });
  }
  res.setHeader('Allow', 'GET, PATCH, DELETE'); send(res, 405, { error: 'Method not allowed' });
});
