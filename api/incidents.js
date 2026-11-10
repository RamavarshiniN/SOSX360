import { db, toClient, isAdmin, validate, body, send, wrap } from './_lib.js';

// GET  /api/incidents  -> list (contact hidden unless admin)
// POST /api/incidents  -> create a report (public); severity computed on the server
export default wrap(async (req, res) => {
  const admin = isAdmin(req);
  if (req.method === 'GET') return send(res, 200, (await db.list()).map(r => toClient(r, admin)));
  if (req.method === 'POST') {
    const v = validate(await body(req));
    if (v.errors) return send(res, 400, { errors: v.errors });
    if (await db.get(v.row.id)) return send(res, 200, toClient(await db.get(v.row.id), admin)); // offline retry: idempotent
    return send(res, 201, toClient(await db.insert(v.row), admin));
  }
  res.setHeader('Allow', 'GET, POST'); send(res, 405, { error: 'Method not allowed' });
});
