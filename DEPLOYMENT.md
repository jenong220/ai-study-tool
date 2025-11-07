# 🚀 Deployment Guide: Study Tool to Vercel & Render

**Stack:** React + Vite + Node.js + Express + Prisma + PostgreSQL  
**Hosting:** Vercel (Frontend) + Render (Backend)

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub account created
- [ ] Vercel account created (sign up with GitHub)
- [ ] Render account created (sign up with GitHub)
- [ ] Anthropic API key ready
- [ ] Code committed to Git (but NOT the `.env` file!)

---

## 🗂️ Project Structure

```
Study Tool/
├── client/          # React + Vite app
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/          # Node.js + Express API
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── render-build.sh
└── .gitignore
```

---

## Part 1: Prepare Your Backend for Deployment

### ✅ Step 1: Prisma Schema Updated

The Prisma schema has been updated from SQLite to PostgreSQL:
- ✅ `server/src/prisma/schema.prisma` - Changed to `provider = "postgresql"`

### ✅ Step 2: Backend Configuration Updated

- ✅ `server/src/server.ts` - Updated CORS and PORT configuration
- ✅ `server/package.json` - Added deployment scripts
- ✅ `server/render-build.sh` - Created build script

### Step 3: Push Code to GitHub

```bash
# From your project root
git add .
git commit -m "Prepare for deployment - PostgreSQL migration"
git push origin main
```

---

## Part 2: Deploy Backend to Render

### Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name:** `study-tool-db`
   - **Database:** `study_tool_db`
   - **User:** `study_tool_user`
   - **Region:** Choose closest to your users
   - **Plan:** Free
4. Click **"Create Database"**
5. ⚠️ **IMPORTANT:** Copy the **Internal Database URL** (looks like `postgresql://...`)

### Step 2: Create Web Service on Render

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

   **Basic Settings:**
   - **Name:** `study-tool-backend`
   - **Region:** Same as your database
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   
   **Build & Deploy:**
   - **Build Command:** `./render-build.sh`
   - **Start Command:** `npm start`
   
   **Plan:** Free

4. Click **"Advanced"** and add Environment Variables:

   ```
   DATABASE_URL=<paste your Internal Database URL from Step 1>
   ANTHROPIC_API_KEY=<your Anthropic API key>
   NODE_ENV=production
   JWT_SECRET=<generate a random secret>
   FRONTEND_URL=<we'll update this after deploying frontend>
   PORT=10000
   ```

   **How to generate JWT_SECRET in terminal:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. Click **"Create Web Service"**

### Step 3: Wait for Deployment

- Render will build and deploy your backend (takes 2-5 minutes)
- Watch the logs for any errors
- Once deployed, you'll see: **"Your service is live 🎉"**
- Copy your backend URL (looks like: `https://study-tool-backend.onrender.com`)

### Step 4: Test Your Backend

Open in browser: `https://your-backend-url.onrender.com/api/health`

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:

   **Framework Preset:** Vite
   
   **Root Directory:** `client`
   
   **Build Command:** `npm run build`
   
   **Output Directory:** `dist`
   
   **Install Command:** `npm install`

5. Click **"Environment Variables"** and add:

   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

   Replace `your-backend-url.onrender.com` with your actual Render backend URL.

6. Click **"Deploy"**

### Step 2: Wait for Deployment

- Vercel builds and deploys (takes 1-3 minutes)
- Once done, you'll get a URL like: `https://your-app-frontend.vercel.app`

---

## Part 4: Final Configuration

### Step 1: Update Backend CORS

Go back to Render dashboard:

1. Open your backend web service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL` to your Vercel URL:

   ```
   FRONTEND_URL=https://your-app-frontend.vercel.app
   ```

4. Click **"Save Changes"** (this will redeploy your backend)

### Step 2: Run Database Migrations

1. Go to Render dashboard → your web service
2. Click **"Shell"** tab (on the left)
3. Run:

   ```bash
   cd server
   npx prisma migrate deploy
   ```

Or if starting fresh, generate initial migration locally first:

```bash
cd server
npx prisma migrate dev --name init
git add .
git commit -m "Add initial migration"
git push origin main
```

---

## 📝 Environment Variables Summary

### Backend (Render):

```
DATABASE_URL=<from Render PostgreSQL - Internal URL>
ANTHROPIC_API_KEY=<your API key>
NODE_ENV=production
JWT_SECRET=<random 64-character string>
FRONTEND_URL=<your Vercel URL>
PORT=10000
```

### Frontend (Vercel):

```
VITE_API_URL=<your Render backend URL>/api
```

**Note:** Make sure to include `/api` at the end of the backend URL for the frontend!

---

## 🐛 Troubleshooting

### Backend Won't Start

**Check Render Logs:**
- Dashboard → Your Service → **"Logs"** tab
- Common issues:
  - Missing environment variables
  - Database connection failed
  - Build command failed

### Frontend Can't Connect to Backend

**Check:**
1. Is `VITE_API_URL` set correctly in Vercel? (Should end with `/api`)
2. Is CORS configured properly on backend?
3. Open browser DevTools → Network tab → Check API calls

### Database Connection Issues

**Check DATABASE_URL:**
- Use **Internal Database URL** from Render (starts with `postgresql://`)
- Don't use External URL for Render web services

### Prisma Client Not Generated

**Solution in Render:**
- The `postinstall` script should run automatically: `"postinstall": "prisma generate"`
- Or it's included in `render-build.sh`

---

## 🔄 Redeployment Workflow

### When you make code changes:

**Backend:**
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render auto-deploys from GitHub
```

**Frontend:**
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys from GitHub
```

---

## ✅ Deployment Complete!

Your app is now live:
- **Frontend:** `https://your-app-frontend.vercel.app`
- **Backend:** `https://your-backend-url.onrender.com`

### Next Steps:

- [ ] Test all functionality
- [ ] Set up monitoring
- [ ] Configure custom domain (optional)
- [ ] Consider upgrading to paid plans for better performance

---

**Happy Deploying! 🎉**

