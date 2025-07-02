# CivicBridgePulse Kenya

CivicBridgePulse Kenya (CBP) is a full-stack Progressive Web App that connects **citizens** with their elected **representatives** for transparent governance.  
Citizens can report issues, follow policies, join polls, converse directly with reps and view upcoming civic events. Representatives manage citizen feedback, publish policy documents and schedule town-halls – all in real-time, even when offline.

---

## Features

### Citizens
* Report local issues (with status tracking)
* View county-specific policy documents & summaries (EN / SW)
* Participate in polls & forums
* Direct messaging with representatives (delivery / read receipts)
* Receive push-style toasts for new replies, events & policy updates
* Offline usage – report issues / send messages / view cached data

### Representatives
* Dashboard with live stats (issues, policies, polls, events)
* Upload policy PDFs/DOCX – auto summary + Swahili translation
* Manage polls and analyse results
* Schedule civic events (town-halls etc.) – works offline
* Real-time notifications when citizens comment on policies
* Performance analytics & citizen feedback ratings

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, React-Router v6 |
|             | Axios, Socket.IO-client, react-i18next |
|             | idb-keyval + custom Service-Worker (PWA/offline) |
| **Backend** | Node.js (ESM), Express 4, Socket.IO, Sequelize 6 |
|             | PostgreSQL, Multer, pdfjs-dist, mammoth |
|             | JWT auth (jsonwebtoken), bcryptjs |
|             | Swagger-UI, Nodemailer, @vitalets/google-translate-api |
| **Testing** | Jest, React Testing Library, Supertest, Playwright |

---

## Local Setup

### 1. Prerequisites
* Node ≥ 18
* PostgreSQL (running & accessible)

### 2. Clone & install
```bash
# root
git clone https://github.com/jmukamani/civicbridgepulse.git
cd civicbridgepulse

# install root dev deps (Playwright etc.)
npm i

# server
cd server
npm i
cp env.example .env   # edit DB creds, JWT_SECRET, CLIENT_URL, etc.

# client
cd ../client
npm i
```

### 3. Database
```bash
# create db & import schema
createdb civicbrigepulse
psql civicbridgepulse < ../database/schema.sql
```

### 4. Development scripts
```bash
# terminal 1 – backend
cd server
npm run dev          # nodemon on :5000

# terminal 2 – frontend
cd client
npm run dev          # Vite on :5173
```
Open http://localhost:5173

---

## Environment Variables (server/.env)
```
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/cbp
JWT_SECRET=supersecret
CLIENT_URL=http://localhost:5173
EMAIL_USER=...
EMAIL_PASS=...
```

---

## Offline Support
* Service-Worker caches static assets & API GET responses.
* `idb-keyval` queue stores POST actions (`issue`, `message`, `event`).
* Background-sync (`cbp-sync`) replays queued actions when connection is restored.

---

## Running Tests
```bash
# backend unit & integration
cd server
npm test

# frontend unit
cd ../client
npm test

# E2E
npm run test:e2e      # Playwright
```

---

## Folder Structure
```
cap/
 ├─ client/             # React PWA
 │   ├─ src/components
 │   ├─ src/pages
 │   ├─ public/sw.js    # service-worker
 │   └─ ...
 ├─ server/             # Express API
 │   ├─ src/models
 │   ├─ src/routes
 │   ├─ uploads/policies
 │   └─ uploads/events
 └─ database/schema.sql
```

---

## Deployment
1. Build frontend: `cd client && npm run build` – outputs to `client/dist`.
2. Serve `dist` via nginx or Express static middleware.
3. Run `node server/src/index.js` (ensure `.env` set + DB).  
   Use pm2 / systemd for process supervision.

---

## License
MIT © CivicBridgePulse Team 