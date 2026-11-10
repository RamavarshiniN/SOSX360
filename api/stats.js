import { db, teams, CATS, send, wrap } from './_lib.js';

// GET /api/stats -> analytics dashboard counts
export default wrap(async (req, res) => {
  const [a, t] = await Promise.all([db.list(), teams.list()]), byCategory = {};
  Object.keys(CATS).forEach(k => byCategory[k] = a.filter(i => i.cat === k).length);
  send(res, 200, {
    total: a.length,
    critical: a.filter(i => i.sev === 'Critical' && i.status !== 'Resolved').length,
    availableTeams: t.filter(x => x.status === 'Available').length,
    busyTeams: t.filter(x => x.status === 'Busy').length,
    assigned: a.filter(i => i.status === 'Assigned' || i.status === 'In Progress').length,
    resolved: a.filter(i => i.status === 'Resolved').length,
    byCategory
  });
});
