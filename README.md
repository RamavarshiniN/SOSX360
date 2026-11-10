# SOSX360 — Emergency Response & Disaster Management Platform

**One report. Faster response.**

SOSX360 is a web-based emergency incident reporting and monitoring platform developed for **Code Clash 2026 – Round 1**. It provides a centralized interface for reporting emergencies, viewing incident activity, tracking submitted reports, and monitoring incident locations.

> **Live application:** [https://sosx360-1-b7yirm0px-kcryptex.vercel.app/](https://sosx360-1-b7yirm0px-kcryptex.vercel.app/)

> **Safety notice:** SOSX360 is a coordination and demonstration platform. It is not an official emergency dispatch service and is not connected to India's emergency number 112. If you are in immediate danger, call **112** directly.

---

## Overview

During emergencies such as fires, road accidents, medical incidents, floods, and building collapses, information can arrive from multiple sources. SOSX360 aims to bring incident reports into one place so that authorized personnel can review, prioritize, and monitor them.

The interface uses a dark emergency-command design with high-visibility red alerts, incident summary cards, reporting forms, tracking, and a map view.

## Key features

- **Emergency reporting:** Submit an incident with a title, description, category, location, and number of people affected.
- **Emergency categories:** Fire Emergency, Road Accident, Medical Emergency, Flood, Building Collapse, and Other Emergencies.
- **Severity preview/classification:** Incidents are assessed using a severity classification workflow with Low, Medium, High, and Critical levels.
- **Incident tracking:** Look up a submitted report using its reference details, where configured.
- **Emergency dashboard:** View incident totals, active incidents, critical incidents, and resolved incidents.
- **Live map view:** Visualize incident locations on a map, with markers to help understand the geographic distribution of reports.
- **Administrative access:** A dedicated admin login and incident-management area for authorized users.
- **Responsive interface:** Designed to be usable on desktop and mobile screens.

Feature availability can depend on the configured backend, database credentials, and deployment environment. Do not treat a visual demo or seeded sample record as a verified real-world emergency.

## Application preview

Open the live application:

**[Launch SOSX360](https://sosx360-1-b7yirm0px-kcryptex.vercel.app/)**

Main navigation:
- Home
- Report
- Track
- Live Map
- Admin Login

## Technology

The application project is built around:

- **Next.js 14** — React web framework
- **React 18** — UI components
- **TypeScript** — type-safe application code
- **Supabase** — PostgreSQL database and authentication integration
- **Leaflet / OpenStreetMap-compatible map tiles** — incident map visualization
- **Vercel** — deployment and hosting

The exact availability of backend-dependent features requires valid Supabase project configuration.


Made to support faster reporting, clearer incident visibility, and more coordinated emergency response.
