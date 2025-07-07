# CivicBridgePulse Kenya

Deployed application link: https://cap-app-civicbridge.azurewebsites.net/

CivicBridgePulse Kenya (CBP) is a full-stack Progressive Web App that connects **citizens** with their elected **representatives** for transparent governance.  
Citizens can report issues, follow policies, join polls, converse directly with reps and view upcoming civic events. Representatives manage citizen feedback, publish policy documents and schedule town-halls – all in real-time, even when offline.

---

## Table of Contents
1. Features
2. Architecture / Tech-stack
3. Quick Start (local dev)
4. Environment Variables
5. Docker & Azure Deployment
6. Offline-first details
7. Testing
8. Useful npm scripts

---

## 1  Features
### Citizens
* Report local issues (with status tracking)
* View policy documents & summaries
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

## 2  Architecture / Tech-stack
| Layer          | Tech |
| -------------- | ---- |
| Front-end      | React 18, Vite, Tailwind CSS, React-Router v6 |
|                | Socket.IO-client, Axios, idb-keyval |
| PWA            | Custom Service-Worker (Workbox) – runtime caching + BG Sync |
| Back-end API   | Node 18 (ESM), Express 4, Socket.IO 4 |
| Database       | PostgreSQL 14, Sequelize 6 |
| Misc           | Swagger-UI, Nodemailer, pdfjs-dist, mammoth, Google-Translate-API |
| Tests          | Jest, RTL, Supertest, Playwright |
| CI/CD          | GitHub Actions ➜ Docker ➜ Azure Container Registry ➜ App Service |

---

## 3  Quick Start (local dev)
### 3.1  Prerequisites
* Node ≥ 18 & npm
* PostgreSQL ≥ 13 (running locally)
* **Optional:** Docker if you prefer containers

### 3.2  Clone & install
```bash
# clone
git clone https://github.com/<your-fork>/civicbridgepulse.git
cd civicbridgepulse

# install workspace tools (Playwright etc.)
npm i

# server deps
cd server && npm i && cp env.example .env
# edit .env → DB creds, JWT_SECRET, CLIENT_URL, SMTP …

# client deps
cd ../client && npm i
```

### 3.3  Database
```bash
createdb civicbridgepulse
psql civicbridgepulse < ../database/schema.sql
```

### 3.4  Run
```bash
# terminal 1 – API
cd server && npm run dev        # -> http://localhost:5000

# terminal 2 – PWA
cd client && npm run dev        # -> http://localhost:5173
```
Open http://localhost:5173 in your browser.

---

## 4  Environment Variables (`server/.env`)
| Key            | Description                            |
| -------------- | -------------------------------------- |
| PORT           | Express port (default 5000)            |
| DATABASE_URL   | Postgres connection string             |
| JWT_SECRET     | Long random string (token signing)     |
| CLIENT_URL     | Front-end origin (http://localhost:5173)|
| EMAIL_HOST/…   | SMTP credentials (optional)            |

Example:
```env
DATABASE_URL=postgres://cbp:cbp@localhost:5432/cbp
JWT_SECRET=ba90c109894c4…40
CLIENT_URL=http://localhost:5173
```

---

## 5  Docker & Azure Deployment
### 5.1  One-shot build (local)
```bash
docker build -t cbp:latest .
```
The multi-stage Dockerfile builds the React front-end, bundles it into
`server/public`, installs server deps, then starts `node src/index.js` on
port 4000.

### 5.2  Push to Azure & deploy (CLI)
```bash
RG=cap-rg
ACR=capregistry
APP=cap-app-civicbridge

az group create -n $RG -l westeurope
az acr create -g $RG -n $ACR --sku Basic --admin-enabled true
az acr login -n $ACR

docker tag cbp:latest $ACR.azurecr.io/cbp:v1
docker push $ACR.azurecr.io/cbp:v1

az appservice plan create -g $RG -n cap-plan --is-linux --sku B1
az webapp create -g $RG -p cap-plan -n $APP \
  --deployment-container-image-name $ACR.azurecr.io/cbp:v1 \
  --registry-login-server $ACR.azurecr.io \
  --registry-username $(az acr credential show -n $ACR --query username -o tsv) \
  --registry-password $(az acr credential show -n $ACR --query passwords[0].value -o tsv)
```
Visit **https://$APP.azurewebsites.net** – the app is live (see the public
instance at https://cap-app-civicbridge.azurewebsites.net).

### 5.3  GitHub Actions
`.github/workflows/deploy.yml` automatically:
1. Builds Docker image on every push to `main`.
2. Pushes to ACR.
3. Deploys image to the Web App using the publish-profile secret.
Add these repo secrets:
* `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` (from ACR)
* `AZURE_WEBAPP_PUBLISH_PROFILE` (download from App Service → *Get publish profile*)

---

## 6  Offline-first Details
* **Service-Worker** (`client/src/sw.js`)
  * Precaches Vite assets.
  * `NetworkFirst` caches `/api/**` GETs (metadata, comments) for 24 h.
  * `CacheFirst` caches `/uploads/policies/**` plus any other file in
    `/uploads/` (PDF, DOCX, images) for 1 year.
* **Prefetch logic** – When the policy list loads online, it pre-adds each
  PDF and its metadata to the caches so the viewer works offline.
* **Background Sync** – Failed POSTs (issues, messages, etc.) are stored in
  IndexedDB (`idb-keyval`) and replayed when connectivity returns.

---

## 7  Testing
```bash
# backend
cd server && npm test            # Jest + Supertest

# front-end unit
cd ../client && npm test         # RTL / Jest

# end-to-end
npm run test:e2e                 # Playwright
```

---

## 8  npm scripts (root)
| Script | Description |
| ------ | ----------- |
| `npm run dev` (client/server) | Development servers with HMR & nodemon |
| `npm run build` (client)      | Production React build (PWA) |
| `npm run lint`                | ESLint check |
| `npm run test` / `test:e2e`   | Unit & Playwright tests |

---

## License
MIT © CivicBridgePulse Team 