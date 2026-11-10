# SOSX360 – Emergency Response & Disaster Management Platform

Frontend: `index.html` (HTML/CSS/vanilla JS, Leaflet map, Tamil/Hindi/English, voice input, offline outbox + service worker)
Backend: Vercel serverless functions in `/api` (Node 18+, no npm deps) + Supabase Postgres (`sosx_incidents` table)

## Round 2 features
- **Intelligent prioritisation**: every open incident gets a priority score = severity weight (10/25/45/70) + people affected (up to 20) + time waiting (up to 25) + category risk (3-9). Queues are ranked by it; resolved incidents drop to the bottom.
- **Response team management** (Teams page): name/ID, response category (Fire, Medical, Rescue, Police, Flood), current location (geocoded), availability, assigned incident.
- **Location-based assignment**: Haversine distance from each available team to the incident; the nearest team of the best-suited type is suggested (e.g. Road Accident → Medical, Police, Rescue). One click assigns it, or pick another from the ranked list.
- **Tracking**: Reported → Assigned → In Progress → Resolved. Assigning marks the team Busy; resolving or deleting frees it automatically.
- **Route visualisation**: team markers on both maps; assigned team → incident drawn as a real road route (OSRM) with km + minutes, falling back to a straight line with ETA offline.
- **Analytics dashboard**: total, critical, available teams, busy teams, assigned, resolved, incidents by category, plus a performance panel (unassigned incidents, critical coverage, team utilisation, average wait, average team distance, severity mix).

## Setup (5 steps)
1. Supabase → SQL Editor → run `schema.sql`, then `schema-round2.sql` (incidents, teams, sample data).
2. Supabase → Project Settings → API: copy **Project URL** and the **service_role** key (secret, never put it in index.html).
3. Push this folder to GitHub, import it in Vercel (Framework preset: Other).
4. Vercel → Project → Settings → Environment Variables:
   - `SUPABASE_URL` = project URL
   - `SUPABASE_SERVICE_KEY` = service_role key
   - `ADMIN_PASSWORD` = your admin password
   - `TOKEN_SECRET` = any long random string
5. Redeploy. Open `/api/incidents` – you should see JSON.

## API
| Method | Path | Who | What |
|---|---|---|---|
| GET | /api/incidents | public (contact hidden) / admin | list |
| POST | /api/incidents | public | create; server validates + computes severity |
| GET | /api/incidents/:id | public | track one report |
| PATCH | /api/incidents/:id | admin (status), public (lat/lng once) | update |
| DELETE | /api/incidents/:id | admin | delete |
| GET | /api/teams | public | list response teams |
| POST | /api/teams | admin | add a team |
| PATCH | /api/teams/:id | admin | availability / assigned incident / location |
| DELETE | /api/teams/:id | admin | remove a team |
| POST | /api/login | – | `{password}` → signed token (12h) |
| GET | /api/stats | public | dashboard counts |

## Viva notes
- **Where is data stored?** Supabase Postgres, via server-only API. Browser keeps a cache + offline outbox; queued reports sync when back online.
- **Security:** service key only on server; row-level security on; admin token is HMAC-SHA256 signed with expiry; contact details only returned to admins; server recomputes severity so clients can't fake "Low".
- **Offline:** reports made offline are queued in localStorage and sent automatically (idempotent by reference ID).
