import { teams, isAdmin, TEAM_CATS, body, send, wrap } from '../_lib.js';

// PATCH  /api/teams/:id -> admin: {name, cat, lat, lng, status, incident}
// DELETE /api/teams/:id -> admin
export default wrap(async (req, res) => {
  const id = String(req.query?.id || new URL(req.url, 'http://x').pathname.split('/').pop()).toUpperCase();
  if (!isAdmin(req)) return send(res, 401, { error: 'Admin login required' });
  if (req.method === 'PATCH') {
    const b = await body(req), p = {};
    if (typeof b.name === 'string' && b.name.trim().length >= 2) p.name = b.name.trim().slice(0, 60);
    if (TEAM_CATS.includes(b.cat)) p.cat = b.cat;
    if (typeof b.lat === 'number' && typeof b.lng === 'number') { p.lat = b.lat; p.lng = b.lng; }
    if (b.status === 'Available' || b.status === 'Busy') p.status = b.status;
    if (b.incident !== undefined) p.incident = String(b.incident || '').slice(0, 20);
    if (!Object.keys(p).length) return send(res, 400, { error: 'Nothing to update' });
    const r = await teams.update(id, p);
    return r ? send(res, 200, r) : send(res, 404, { error: 'Not found' });
  }
  if (req.method === 'DELETE') return (await teams.remove(id)) ? send(res, 200, { ok: true }) : send(res, 404, { error: 'Not found' });
  send(res, 405, { error: 'Method not allowed' });
});
