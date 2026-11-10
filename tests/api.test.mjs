// Run: npm test   (Node 18+, no dependencies)
// Exercises every API handler against an in-memory fake of the Supabase REST API.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'http://fake.supabase';
process.env.SUPABASE_SERVICE_KEY = 'sb_secret_test';
process.env.ADMIN_PASSWORD = 'test-pass';
process.env.TOKEN_SECRET = 'test-secret';

// ---- fake Supabase (PostgREST subset: select, eq filter, insert, patch, delete) ----
let db;
const headersSeen = [];
globalThis.fetch = async (url, opts = {}) => {
  const u = new URL(url), table = u.pathname.split('/').pop(), m = opts.method || 'GET';
  headersSeen.push(opts.headers);
  const id = (u.searchParams.get('id') || '').replace(/^eq\./, '');
  const rows = db[table];
  let out;
  if (m === 'GET') out = rows.filter(r => !id || r.id === id);
  else if (m === 'POST') { const r = JSON.parse(opts.body); rows.push(r); out = [r]; }
  else if (m === 'PATCH') { out = rows.filter(r => r.id === id); out.forEach(r => Object.assign(r, JSON.parse(opts.body))); }
  else { out = rows.filter(r => r.id === id); db[table] = rows.filter(r => r.id !== id); }
  return { ok: true, status: 200, text: async () => JSON.stringify(out) };
};

const lib = await import('../api/_lib.js');
const incidents = (await import('../api/incidents.js')).default;
const incident = (await import('../api/incidents/[id].js')).default;
const teams = (await import('../api/teams.js')).default;
const team = (await import('../api/teams/[id].js')).default;
const login = (await import('../api/login.js')).default;
const stats = (await import('../api/stats.js')).default;

function call(handler, method, { body, token, id } = {}) {
  return new Promise(resolve => {
    const res = { statusCode: 200, setHeader() {}, end(d) { resolve({ status: this.statusCode, body: JSON.parse(d) }); } };
    handler({ method, body, query: id ? { id } : {}, url: '/api/x/' + (id || ''), headers: token ? { authorization: 'Bearer ' + token } : {} }, res);
  });
}
const report = (o = {}) => ({ title: 'Godown fire', cat: 'fire', desc: 'Fire spreading, workers trapped inside', loc: 'Guindy, Chennai', ppl: 12, contact: '98400 11111', lat: 13.0067, lng: 80.2206, ...o });
async function adminToken() { return (await call(login, 'POST', { body: { password: 'test-pass' } })).body.token; }

beforeEach(() => {
  db = {
    sosx_incidents: [],
    sosx_teams: [{ id: 'TM-102', name: 'Fire Unit Guindy', cat: 'fire', lat: 13.0067, lng: 80.2206, status: 'Available', incident: '' }]
  };
});

// ---------- severity rules ----------
test('severity: fire + 12 people + "trapped" is Critical', () => {
  assert.equal(lib.classify('fire', 12, 'people trapped').sev, 'Critical');
});
test('severity: other + 0 people is Low', () => {
  assert.equal(lib.classify('other', 0, 'small crack').sev, 'Low');
});
test('severity: flood + 10 people is High', () => {
  assert.equal(lib.classify('flood', 10, 'water rising').sev, 'High');
});
test('severity: explanation lists the reasons', () => {
  const why = lib.classify('fire', 12, 'trapped').why;
  assert.match(why, /Fire Emergency/); assert.match(why, /12 affected/); assert.match(why, /trapped/);
});

// ---------- reporting ----------
test('POST creates a report and the server computes severity', async () => {
  const r = await call(incidents, 'POST', { body: report({ sev: 'Low' }) });
  assert.equal(r.status, 201);
  assert.equal(r.body.sev, 'Critical', 'client-sent severity must be ignored');
  assert.match(r.body.id, /^INC-\d{4}$/);
  assert.equal(r.body.status, 'Reported');
});
test('POST keeps geocoded coordinates', async () => {
  const r = await call(incidents, 'POST', { body: report() });
  assert.equal(r.body.lat, 13.0067);
});
test('POST is idempotent for offline retries with the same ID', async () => {
  await call(incidents, 'POST', { body: report({ id: 'INC-5555' }) });
  const again = await call(incidents, 'POST', { body: report({ id: 'INC-5555' }) });
  assert.equal(again.status, 200);
  assert.equal(db.sosx_incidents.length, 1);
});
for (const [name, bad] of [
  ['empty body', {}],
  ['unknown category', report({ cat: 'alien' })],
  ['short title', report({ title: 'ab' })],
  ['short description', report({ desc: 'short' })],
  ['negative people', report({ ppl: -1 })],
  ['fractional people', report({ ppl: 2.5 })]
]) test('POST rejects ' + name, async () => {
  assert.equal((await call(incidents, 'POST', { body: bad })).status, 400);
});

// ---------- privacy ----------
test('contact details are hidden from the public and shown to admins', async () => {
  await call(incidents, 'POST', { body: report() });
  assert.equal((await call(incidents, 'GET')).body[0].contact, '');
  assert.equal((await call(incidents, 'GET', { token: await adminToken() })).body[0].contact, '98400 11111');
});

// ---------- auth ----------
test('login rejects a wrong password and accepts the right one', async () => {
  assert.equal((await call(login, 'POST', { body: { password: 'nope' } })).status, 401);
  assert.ok(await adminToken());
});
test('forged and tampered tokens are rejected', async () => {
  const good = await adminToken();
  const [p] = good.split('.');
  for (const t of ['abc.def', p + '.AAAA', good + 'x']) {
    assert.equal((await call(incident, 'DELETE', { id: 'INC-1001', token: t })).status, 401, t);
  }
});
test('admin-only actions need a token', async () => {
  await call(incidents, 'POST', { body: report({ id: 'INC-1234' }) });
  assert.equal((await call(incident, 'PATCH', { id: 'INC-1234', body: { status: 'Resolved' } })).status, 401);
  assert.equal((await call(incident, 'DELETE', { id: 'INC-1234' })).status, 401);
  assert.equal((await call(team, 'PATCH', { id: 'TM-102', body: { status: 'Busy' } })).status, 401);
  assert.equal((await call(teams, 'POST', { body: { name: 'X', cat: 'fire', lat: 1, lng: 1 } })).status, 401);
});

// ---------- Round 2: assignment lifecycle ----------
test('assign → in progress → resolve updates incident and team', async () => {
  const tok = await adminToken();
  await call(incidents, 'POST', { body: report({ id: 'INC-2001' }) });
  assert.equal((await call(incident, 'PATCH', { id: 'INC-2001', token: tok, body: { status: 'Assigned', team: 'TM-102' } })).body.team, 'TM-102');
  await call(team, 'PATCH', { id: 'TM-102', token: tok, body: { status: 'Busy', incident: 'INC-2001' } });
  assert.equal((await call(incident, 'PATCH', { id: 'INC-2001', token: tok, body: { status: 'In Progress' } })).body.status, 'In Progress');
  await call(incident, 'PATCH', { id: 'INC-2001', token: tok, body: { status: 'Resolved', team: '' } });
  await call(team, 'PATCH', { id: 'TM-102', token: tok, body: { status: 'Available', incident: '' } });
  const s = (await call(stats, 'GET')).body;
  assert.equal(s.resolved, 1); assert.equal(s.availableTeams, 1); assert.equal(s.busyTeams, 0);
});
test('invalid status and invalid IDs are rejected', async () => {
  const tok = await adminToken();
  await call(incidents, 'POST', { body: report({ id: 'INC-3001' }) });
  assert.equal((await call(incident, 'PATCH', { id: 'INC-3001', token: tok, body: { status: 'Teleported' } })).status, 400);
  assert.equal((await call(incident, 'GET', { id: "INC-1' or 1=1--" })).status, 404);
  assert.equal((await call(team, 'PATCH', { id: 'DROP TABLE', token: tok, body: { status: 'Busy' } })).status, 404);
});
test('public can set coordinates once, but cannot move a located incident', async () => {
  await call(incidents, 'POST', { body: report({ id: 'INC-4001', lat: undefined, lng: undefined }) });
  assert.equal((await call(incident, 'PATCH', { id: 'INC-4001', body: { lat: 13.05, lng: 80.25 } })).body.lat, 13.05);
  assert.equal((await call(incident, 'PATCH', { id: 'INC-4001', body: { lat: 1, lng: 1 } })).status, 400);
});
test('team creation validates category and location', async () => {
  const tok = await adminToken();
  assert.equal((await call(teams, 'POST', { token: tok, body: { name: 'Rescue Adyar', cat: 'rescue', lat: 13.0, lng: 80.25 } })).status, 201);
  assert.equal((await call(teams, 'POST', { token: tok, body: { name: 'Bad', cat: 'pizza', lat: 13, lng: 80 } })).status, 400);
});

// ---------- Supabase key handling ----------
test('new sb_secret_ keys are sent only as apikey, never as a Bearer JWT', async () => {
  headersSeen.length = 0; await call(stats, 'GET');
  assert.ok(headersSeen.length > 0);
  for (const h of headersSeen) { assert.equal(h.apikey, 'sb_secret_test'); assert.equal(h.Authorization, undefined); }
});
