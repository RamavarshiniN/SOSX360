# 🚨 SOSX360

> **Multilingual, voice-enabled emergency reporting with automatic severity rating, intelligent prioritisation and nearest-team dispatch, all shown on one live command dashboard.**

![HTML5](https://img.shields.io/badge/frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-E34F26.svg)
![Leaflet](https://img.shields.io/badge/maps-Leaflet%201.9.4-199900.svg)
![Node](https://img.shields.io/badge/API-Node.js%2018%20Serverless-339933.svg)
![Supabase](https://img.shields.io/badge/database-Supabase%20Postgres-3ECF8E.svg)
![Vercel](https://img.shields.io/badge/hosting-Vercel-000000.svg)
![Languages](https://img.shields.io/badge/languages-English%20%7C%20Tamil%20%7C%20Hindi-E11D2E.svg)

**Live demo:** https://sosx360-mauve.vercel.app · Built for **Code Clash 2026**, Emergency Response & Disaster Management track (Rounds 1 and 2).

---

## 📌 Problem Statement

During road accidents, fires, floods and building collapses, reports reach responders from many sources at once. Coordination breaks down in three places:

1. **No single view.** Reports are scattered, so responders cannot see every incident on one live map or dashboard.
2. **No objective priority.** A five-person fire and a fifty-person flood look the same in a call log. Responders have to judge urgency by hand, often while under stress.
3. **Slow, manual dispatch.** Finding the closest *suitable* team (ambulance, fire unit or rescue) means phone calls and guesswork, which costs minutes that matter.
4. **Language and literacy barriers.** Many citizens in Tamil Nadu are more comfortable in Tamil or Hindi than English, and typing a long form during an emergency is hard.

**SOSX360** gives citizens a 30-second report form they can fill in by typing or by voice, in English, Tamil or Hindi. Every report is rated for severity and ranked by priority automatically. Administrators then see the nearest suitable response team with its distance, road route and ETA, and can assign it with one click.

---

## 🚀 Features

### Round 1: Reporting & Monitoring
| Feature | How it works | Where |
|---|---|---|
| **Emergency reporting form** | Title, description, category, location, people affected and optional contact, with field-level validation | Report page |
| **6 emergency categories** | Fire, Road Accident, Medical, Flood, Building Collapse, Other | Report page |
| **Automatic severity (Low → Critical)** | Rule-based score from category, people affected and danger keywords, with a **live preview** that explains the reason as you type | Report page |
| **Reference ID & public tracking** | Each report gets an `INC-xxxx` ID. Anyone can check its status and assigned team | Track page |
| **Live incident map** | Typed locations are geocoded automatically. Markers are coloured by severity, Critical markers are larger and Resolved ones fade | Home + Live Map |
| **Admin dashboard & management** | Totals, critical, pending, resolved and by-category counts. Admins can filter, open, update status or delete (with confirmation) | Dashboard + Incidents |

### Round 2: Intelligent Coordination
| Feature | How it works | Where |
|---|---|---|
| **1. Intelligent prioritisation** | Priority score = severity + people affected + time waiting + category risk. The score is shown on every row and queues are ranked by it | Dashboard, Incidents |
| **2. Response team management** | Teams have a name/ID, type (Fire, Medical, Rescue, Police, Flood), geocoded location, Available/Busy status and assigned incident | Teams page |
| **3. Location-based assignment** | Haversine distance to every available team, filtered by suitability. One click assigns the best-fit team, or you can pick from a list ranked by distance | Incident detail |
| **4. Assignment tracking** | Reported → Assigned → In Progress → Resolved. Assigning marks the team Busy, and resolving or deleting frees it automatically | Incident detail |
| **5. Route visualisation** | Team markers on both maps. The real **road route** from team to incident is drawn with km and minutes, or a dashed line with an ETA when offline | Live Map |
| **6. Analytics dashboard** | Total, critical, available teams, busy teams, assigned and resolved counts, plus a performance panel: unassigned incidents, critical coverage, team utilisation, average wait, average distance and severity mix | Dashboard |

### Beyond the brief
| Feature | Why it matters |
|---|---|
| 🌐 **English, Tamil and Hindi** | The whole interface switches language instantly, including new Round 2 labels |
| 🎤 **Voice reporting** | Speak the emergency. The description is filled in, the category is guessed and "12 people" is detected from speech |
| 🔊 **Read-aloud confirmation** | The reference ID and severity are spoken back in the chosen language |
| 📴 **Offline-first** | Reports and status changes made offline are queued and sent automatically when the connection returns. The service worker caches the app shell |
| 🆘 **Safety-first UI** | 112 / 100 / 101 / 102 / 108 helplines are always visible, with a clear notice that the platform does not replace emergency calls |

---

## 🏗️ Tech Stack

### Frontend
| Component | Version | Role | Why |
|---|---|---|---|
| **HTML5 / CSS3 / Vanilla JavaScript** | — | Single-page app with hash routing | No build step, loads instantly and runs from a single file even offline |
| **Leaflet.js** | `1.9.4` | Interactive maps | Lightweight, open source, no API key needed |
| **Esri World Street Map** | — | Map tiles | Free tiles with street names and no key |
| **OpenStreetMap Nominatim** | — | Geocoding | Turns "Anna Salai, Chennai" into coordinates |
| **OSRM** | — | Road routing | Real driving route, distance and duration between team and incident |
| **Web Speech API** | Browser | Voice input and read-aloud | Recognition and speech in `en-IN`, `ta-IN` and `hi-IN` |
| **Service Worker + localStorage** | Browser | Offline cache and outbox | Keeps reporting working when the network drops |

### Backend & Data
| Component | Version | Role | Why |
|---|---|---|---|
| **Node.js serverless functions** | `18+` | REST API in `/api` | Deploys with the frontend on Vercel, with no server to manage and no npm dependencies |
| **Supabase (PostgreSQL)** | — | Persistent shared storage | Real SQL tables with check constraints and row-level security |
| **HMAC-SHA256 signed tokens** | Node `crypto` | Admin authentication | Stateless 12-hour session tokens with timing-safe comparison |
| **Vercel** | — | Hosting + CI/CD | Every push to `main` redeploys automatically |

---

## 📂 Project Structure

```
SOSX360/
├── index.html              # Entire frontend: UI, i18n, voice, maps, prioritisation, assignment, analytics
├── sw.js                   # Service worker: caches the app shell, never caches /api
├── offline.html            # Fallback page when nothing is cached
├── manifest.json           # Installable web-app manifest
├── api/
│   ├── _lib.js             # Shared: Supabase REST client, severity rules, validation, auth tokens
│   ├── incidents.js        # GET list · POST create (server recomputes severity)
│   ├── incidents/[id].js   # GET track · PATCH status/team/location · DELETE
│   ├── teams.js            # GET list · POST create team
│   ├── teams/[id].js       # PATCH availability/assignment/location · DELETE
│   ├── stats.js            # GET analytics counts
│   └── login.js            # POST admin login → signed token
├── schema.sql              # Round 1 table + sample incidents
├── schema-round2.sql       # Round 2: teams table, Assigned status, sample teams
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- A **Supabase** account (free tier is enough)
- A **Vercel** account linked to GitHub
- Optional for local runs: **Python 3** or any static file server

### Step 1: Create the database
Supabase → SQL Editor → run **`schema.sql`**, then **`schema-round2.sql`**. This creates `sosx_incidents` and `sosx_teams` with 5 sample incidents and 7 response teams in Chennai.

### Step 2: Deploy on Vercel
Import this repository in Vercel (Framework preset: **Other**) and add these environment variables:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<Supabase secret / service_role key>
ADMIN_PASSWORD=<admin login password>
TOKEN_SECRET=<any long random string>
```

Deploy. `https://<your-app>.vercel.app/api/incidents` should now return JSON.

### Step 3 (optional): Run locally without a backend
```bash
python -m http.server 8080
```
Open `http://localhost:8080`. With no API available the app runs in **local demo mode**: data is kept in the browser and the demo admin passcode is accepted.

---

## 🧠 How It Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. REPORT   Citizen types or speaks (EN / TA / HI)                        │
│             → live severity preview → validated → INC-ID issued           │
├──────────────────────────────────────────────────────────────────────────┤
│ 2. STORE    Browser outbox → POST /api/incidents                          │
│             → server re-validates + recomputes severity → Supabase        │
│             (offline? queued in localStorage, retried every 15 s)         │
├──────────────────────────────────────────────────────────────────────────┤
│ 3. LOCATE   Location text → Nominatim geocode → lat/lng saved             │
├──────────────────────────────────────────────────────────────────────────┤
│ 4. RANK     Priority score = severity + people + waiting time + category │
├──────────────────────────────────────────────────────────────────────────┤
│ 5. DISPATCH Haversine distance to available teams × suitability          │
│             → best-fit team → Assigned (team Busy) → OSRM road route      │
├──────────────────────────────────────────────────────────────────────────┤
│ 6. TRACK    In Progress → Resolved (team freed) · analytics update live   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Severity classification
| Input | Points |
|---|---|
| Category base | Fire, Collapse = 3 · Medical, Road, Flood = 2 · Other = 1 |
| People affected | 1+ → +1 · 5+ → +2 · 10+ → +3 · 20+ → +4 · 50+ → +5 |
| Danger keyword (trapped, explosion, unconscious, bleeding, spreading, not breathing, gas leak…) | +2 |
| **Result** | **≥6 Critical · ≥4 High · ≥3 Medium · else Low** |

Example: a fire with 12 people and "trapped" in the description scores 3 + 3 + 2 = 8, which is **Critical**. The same rules run on both the client (for the live preview) and the server, which is the source of truth, so a modified browser cannot downgrade a report.

### Priority score (Round 2)
```
priority = severityWeight (Low 10 · Medium 25 · High 45 · Critical 70)
         + min(20, people × 0.4)
         + min(25, minutesWaiting / 6)
         + categoryBase × 3
```
Resolved incidents score 0. Because waiting time is part of the score, an old Medium incident gradually rises in the queue instead of being starved by newer reports.

### Nearest suitable team
Each incident category maps to the team types that can handle it, best first:

| Incident | Suitable teams |
|---|---|
| Fire | Fire → Rescue |
| Medical | Medical |
| Road Accident | Medical → Police → Rescue |
| Flood | Flood Response → Rescue |
| Building Collapse | Rescue → Fire → Medical |
| Other | Rescue → Police |

The distance from the incident to every **available** team is computed with the **Haversine formula**:

$$d = 2R \cdot \arcsin\sqrt{\sin^2\tfrac{\Delta\varphi}{2} + \cos\varphi_1\cos\varphi_2\sin^2\tfrac{\Delta\lambda}{2}}, \quad R = 6371\text{ km}$$

The recommended team is the **closest one of the most suitable type**, unless a lower-ranked suitable team is more than 2.5× closer. For example, police 0.5 km away beats an ambulance 11 km away for a road accident. The admin can always override from the ranked list.

---

## 🔌 API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/incidents` | Public (contact hidden) / Admin | List incidents |
| `POST` | `/api/incidents` | Public | Create a report; server validates and computes severity; idempotent by ID |
| `GET` | `/api/incidents/:id` | Public | Track one report |
| `PATCH` | `/api/incidents/:id` | Admin (`status`, `team`) · Public (`lat`/`lng` once) | Update |
| `DELETE` | `/api/incidents/:id` | Admin | Delete a test or duplicate report |
| `GET` | `/api/teams` | Public | List response teams |
| `POST` | `/api/teams` | Admin | Add a team |
| `PATCH` | `/api/teams/:id` | Admin | Availability / assigned incident / location |
| `DELETE` | `/api/teams/:id` | Admin | Remove a team |
| `GET` | `/api/stats` | Public | Analytics counts |
| `POST` | `/api/login` | — | `{ "password": "…" }` → `{ "token": "…" }` |

Example:
```bash
curl -X POST https://sosx360-mauve.vercel.app/api/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Fire in apartment","cat":"fire","desc":"Smoke on 3rd floor, people trapped","loc":"Guindy, Chennai","ppl":12}'
```
```json
{ "id": "INC-4821", "sev": "Critical", "why": "Fire Emergency · 12 affected · \"trapped\" mentioned", "status": "Reported", "...": "..." }
```

---

## 🔒 Security & Data Integrity

- **Secrets stay on the server.** The database key lives only in Vercel environment variables and is never sent to the browser.
- **Row-level security** is enabled on both tables, so the public Supabase key can read or write nothing.
- **Admin tokens** are HMAC-SHA256 signed with a 12-hour expiry and checked with a timing-safe comparison.
- **Least exposure.** Reporter contact details are returned only to logged-in admins.
- **Server-side validation** covers field lengths, the category whitelist, whole-number people counts, status whitelist and coordinate ranges.
- **XSS-safe rendering.** All user text is escaped before it reaches the page.
- **Idempotent writes.** Offline retries never create duplicate incidents.

---

## 📈 Scalability & Feasibility

- **Zero-ops deployment.** Static frontend plus serverless functions scale automatically on Vercel, with no servers to patch.
- **Free-tier friendly.** It runs entirely on the free plans of Supabase and Vercel, with no paid map or routing keys.
- **Swappable services.** Geocoding and routing use open services that can be replaced with self-hosted Nominatim or OSRM for production volumes.
- **Works on low-end phones.** There's no framework download; the full app is a single ~75 KB HTML file plus the map library.

### Known limitations (honest scope)
- Updates appear on refresh and on a 15-second sync loop, not over WebSockets.
- Geocoding accuracy depends on how specific the location text is.
- Voice input needs a browser with the Web Speech API (Chrome or Edge).
- Public OSRM and Nominatim servers are rate-limited, which is fine for a demo; production should self-host them.

---

## 🌟 What Makes SOSX360 Different

| Capability | SOSX360 | Typical hackathon CRUD app | Phone / WhatsApp reporting |
|---|---|---|---|
| Explainable auto-severity | ✅ Live, with reasons | ⚠️ Manual dropdown | ❌ |
| Priority that ages with waiting time | ✅ | ❌ | ❌ |
| Nearest *suitable* team, not just nearest | ✅ Type-aware + distance | ❌ | ❌ |
| Real road route + ETA | ✅ OSRM | ❌ | ❌ |
| Tamil / Hindi + voice reporting | ✅ | ❌ | ✅ Voice only |
| Works offline, syncs later | ✅ | ❌ | ⚠️ |

---

## ⚠️ Disclaimer

SOSX360 is a **coordination and visualisation prototype** built for a hackathon. It is **not** a certified emergency dispatch system and does not replace calling **112** (Police 100 · Fire 101 · Ambulance 102 / 108). Sample incidents and teams are fictional demo data.

---

## 🧩 Team

Built by **Ramavarshini N** and team for Code Clash 2026.
