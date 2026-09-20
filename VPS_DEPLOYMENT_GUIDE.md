# VPS DEPLOYMENT GUIDE: TASWEQ UI & BACKEND

This guide provides a foolproof, step-by-step procedure to deploy the Tasweq project to an Ubuntu VPS.

## ⚠️ CRITICAL PRE-FLIGHT CHECK
If you are using a VPS with less than 4GB of RAM, you MUST enable swap space, or the `pnpm install` and `vite build` steps will likely fail with an "Out of Memory" or "Killed" error.

---

## 🟢 PHASE 1: SYSTEM PREPARATION
Run these commands as a user with sudo privileges.

1. **Update System & Install Build Tools**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential curl git python3
   ```

2. **Configure Swap Space (Crucial for small VPS)**:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

3. **Install Node.js & pnpm**:
   ```bash
   # Install Node.js (LTS)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Enable pnpm
   sudo corepack enable
   sudo corepack prepare pnpm@latest --activate
   ```

---

## 🔵 PHASE 2: CODE & ENVIRONMENT
1. **Clone the Repository**:
   ```bash
   git clone <your-repo-url> tasweq
   cd tasweq
   ```

2. **Create the `.env` File**:
   Create a `.env` file in the root directory. **Double-check these values**:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[dbname]
   PORT=5000
   DEPLOYMENT_PROFILE=production
   NODE_ENV=production
   MOCK_AUTH_ENABLED=false
   PUBLIC_TEST_MODE_ENABLED=false
   ```
   *Note: Use the Supabase "Transaction" connection string for the app, but ensure the "Session" string is used if you run migrations manually.*

3. **Install Dependencies**:
   ```bash
   pnpm install --frozen-lockfile
   ```

---

## 🟡 PHASE 3: BUILD & DATABASE INITIALIZATION
1. **Build the Monorepo**:
   ```bash
   pnpm run build
   ```

2. **Initialize Database (The "First Boot")**:
   The API server runs migrations and seeds the admin user on startup. Run it manually once to verify:
   ```bash
   # Run the built server
   NODE_ENV=production DEPLOYMENT_PROFILE=production pnpm --filter @workspace/api-server run start
   ```
   **Look for these logs**:
   - `Database migrations applied`
   - `Seed data initialized`
   - `Server listening on port 5000`
   
   *Press `Ctrl+C` once you see these logs.*

---

## 🔴 PHASE 4: PRODUCTION ORCHESTRATION
1. **Backend (PM2)**:
   ```bash
   sudo npm install -g pm2
   pm2 start artifacts/api-server/dist/index.mjs --name "api-server"
   pm2 save
   pm2 startup
   ```

2. **Frontend (Nginx)**:
   Since the UI is a static build, serve it via Nginx.
   ```bash
   sudo apt install -y nginx
   ```
   Configure Nginx to:
   - Serve files from `artifacts/tasweqet-ui/dist` on port 80.
   - Proxy `/api` requests to `http://localhost:5000`.

3. **Firewall Setup**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

---

## 📝 DEPLOYMENT TRACE (For future Agents)
If you are an agent resuming this deployment, check this state machine:
- [ ] `SYS_PREP`: OS tools and Node/pnpm installed.
- [ ] `SWAP_ENABLED`: Swap file active.
- [ ] `REPO_CLONED`: Code present on disk.
- [ ] `ENV_CONFIGURED`: `.env` matches Supabase settings.
- [ ] `DEPS_INSTALLED`: `pnpm install` completed.
- [ ] `BUILD_COMPLETE`: `pnpm run build` successful.
- [ ] `DB_MIGRATED`: Server started once and applied migrations.
- [ ] `API_RUNNING`: PM2 managing `api-server`.
- [ ] `UI_SERVING`: Nginx serving the `dist` folder.
