import crypto from 'node:crypto';

export const CATS = { fire: 'Fire Emergency', road: 'Road Accident', medical: 'Medical Emergency', flood: 'Flood', collapse: 'Building Collapse', other: 'Other Emergencies' };
const BASE = { fire: 3, collapse: 3, medical: 2, road: 2, flood: 2, other: 1 };
const KW = ['trapped', 'explosion', 'unconscious', 'fatal', 'dead', 'bleeding', 'spreading', 'collapsed', 'children', 'gas leak', 'not breathing'];
export const STAT = ['Reported', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
export const TEAM_CATS = ['fire', 'medical', 'rescue', 'police', 'flood'];

// Same rules as classify() in index.html, so the server is the source of truth.
export function classify(c, n, t) {
  let s = BASE[c] ?? 1; const why = [CATS[c]]; n = +n || 0;
  s += n >= 50 ? 5 : n >= 20 ? 4 : n >= 10 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0;
  if (n) why.push(n + ' affected');
  const low = (t || '').toLowerCase(), hit = KW.find(k => low.includes(k));
  if (hit) { s += 2; why.push('"' + hit + '" mentioned'); }
  return { sev: s >= 6 ? 'Critical' : s >= 4 ? 'High' : s >= 3 ? 'Medium' : 'Low', why: why.join(' · ') };
}

// ---- Supabase REST (no npm deps) ----
async function sb(path, opts = {}) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw Object.assign(new Error('Database not configured'), { status: 500 });
  const r = await fetch(url + '/rest/v1/' + path, {
    ...opts,
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opts.headers || {}) }
  });
  const txt = await r.text();
  if (!r.ok) throw Object.assign(new Error('DB error: ' + txt), { status: r.status === 409 ? 409 : 502 });
  return txt ? JSON.parse(txt) : null;
}
const enc = encodeURIComponent;
const table = name => ({
  list: () => sb(name + '?select=*&order=' + (name === 'sosx_teams' ? 'id' : 'at.desc')),
  get: async id => (await sb(name + '?select=*&id=eq.' + enc(id)))[0] || null,
  insert: row => sb(name, { method: 'POST', body: JSON.stringify(row) }).then(a => a[0]),
  update: (id, patch) => sb(name + '?id=eq.' + enc(id), { method: 'PATCH', body: JSON.stringify(patch) }).then(a => a[0] || null),
  remove: id => sb(name + '?id=eq.' + enc(id), { method: 'DELETE' }).then(a => a.length > 0)
});
export const db = table('sosx_incidents');
export const teams = table('sosx_teams');

// DB column "descr" <-> frontend field "desc"
export const toClient = (r, admin) => r && ({
  id: r.id, title: r.title, cat: r.cat, desc: r.descr, loc: r.loc, ppl: r.ppl, sev: r.sev, why: r.why,
  status: r.status, team: r.team || '', at: Number(r.at), lat: r.lat ?? undefined, lng: r.lng ?? undefined,
  contact: admin ? (r.contact || '') : ''   // contact details are admin-only
});

// ---- auth: HMAC-signed token, 12h expiry ----
const secret = () => process.env.TOKEN_SECRET || process.env.ADMIN_PASSWORD || 'dev-secret';
const sign = p => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
export function makeToken() { const p = Buffer.from(JSON.stringify({ r: 'admin', exp: Date.now() + 12 * 3600e3 })).toString('base64url'); return p + '.' + sign(p); }
export function isAdmin(req) {
  const t = (req.headers.authorization || '').replace(/^Bearer /, ''), [p, s] = t.split('.');
  if (!p || !s) return false;
  const a = Buffer.from(sign(p)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(p, 'base64url')).exp > Date.now(); } catch { return false; }
}
export function safeEqual(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }

// ---- helpers ----
export async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  let d = ''; for await (const c of req) d += c; try { return JSON.parse(d || '{}'); } catch { return {}; }
}
export function send(res, code, data) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); }
export function wrap(fn) { return async (req, res) => { try { await fn(req, res); } catch (e) { send(res, e.status || 500, { error: e.message }); } }; }
const str = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
const num = v => (typeof v === 'number' && isFinite(v) ? v : null);

export function validate(b) {
  const e = {}, row = {
    title: str(b.title, 90), cat: str(b.cat, 20), descr: str(b.desc, 600), loc: str(b.loc, 120),
    ppl: Number(b.ppl), contact: str(b.contact, 80)
  };
  if (!CATS[row.cat]) e.cat = 'Invalid category';
  if (row.title.length < 4) e.title = 'Title too short';
  if (row.descr.length < 10) e.desc = 'Description too short';
  if (row.loc.length < 3) e.loc = 'Location required';
  if (!Number.isInteger(row.ppl) || row.ppl < 0 || row.ppl > 100000) e.ppl = 'People must be a whole number';
  if (Object.keys(e).length) return { errors: e };
  const id = /^INC-\d{4,6}$/.test(b.id || '') ? b.id : 'INC-' + (1000 + crypto.randomInt(9000));
  const at = num(b.at) && b.at <= Date.now() + 60000 ? Math.round(b.at) : Date.now();
  const { sev, why } = classify(row.cat, row.ppl, row.title + ' ' + row.descr);
  return { row: { id, ...row, sev, why, status: 'Reported', at, lat: num(b.lat), lng: num(b.lng) } };
}
