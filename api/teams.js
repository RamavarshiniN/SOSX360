import { teams, isAdmin, TEAM_CATS, body, send, wrap } from './_lib.js';
import crypto from 'node:crypto';

// GET  /api/teams -> list response teams (public, for the map)
// POST /api/teams -> admin: create {name, cat, lat, lng}
export default wrap(async (req, res) => {
  if (req.method === 'GET') return send(res, 200, await teams.list());
  if (req.method === 'POST') {
    if (!isAdmin(req)) return send(res, 401, { error: 'Admin login required' });
    const b = await body(req), name = String(b.name || '').trim().slice(0, 60);
    if (name.length < 2) return send(res, 400, { error: 'Name required' });
    if (!TEAM_CATS.includes(b.cat)) return send(res, 400, { error: 'Invalid category' });
    if (typeof b.lat !== 'number' || typeof b.lng !== 'number') return send(res, 400, { error: 'Location required' });
    const id = /^TM-\d{3,6}$/.test(b.id || '') ? b.id : 'TM-' + (100 + crypto.randomInt(900));
    if (await teams.get(id)) return send(res, 200, await teams.get(id));
    return send(res, 201, await teams.insert({ id, name, cat: b.cat, lat: b.lat, lng: b.lng, status: 'Available', incident: '' }));
  }
  send(res, 405, { error: 'Method not allowed' });
});
