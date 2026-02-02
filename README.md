# ExamHub Telegram Mini-App

## Setup Instructions

### 1. Supabase Setup
- Create a new project in Supabase.
- Create a table `exams`:
  ```sql
  CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    university TEXT NOT NULL,
    year TEXT NOT NULL,
    subject TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW()
  );
  ```
- Create a storage bucket named `exam-files` with public access.

### 2. Telegram Bot
- Create a bot via @BotFather and get the token.
- Set up the mini-app: In BotFather, use `/setmenubutton` and provide your Vercel URL.

### 3. Backend Deployment (Railway)
- Sign up for Railway.
- Connect your GitHub repo.
- Set environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TELEGRAM_BOT_TOKEN`.
- Deploy.
  
Railway-specific quick steps:

1. Push the `backend/` folder to a GitHub repository (or push the whole project).

2. In Railway, create a new project and "Deploy from GitHub". Choose the repo and the `backend` folder if prompted.

3. In the Railway project settings, add the following environment variables (copy exact names):
  - `SUPABASE_URL` (e.g. https://qbodxizbkfnsaiuznsxf.supabase.co)
  - `SUPABASE_ANON_KEY` (your Supabase anon/public key)
  - `TELEGRAM_BOT_TOKEN` (your bot token)

4. Railway will detect Python via `requirements.txt`. The provided `Procfile` starts the app using Gunicorn.

5. After deploy, Railway provides a URL (e.g., `https://your-app.up.railway.app`). Use that URL in `frontend/script.js` as `BACKEND_URL` and redeploy frontend.

Push commands (run from repo root):
```bash
git add .
git commit -m "Prepare backend for Railway deployment"
git push origin main
```

If you prefer, I can prepare a separate `backend` branch or help format a minimal GitHub repo for deployment.

### 4. Frontend Deployment (Vercel)
- Sign up for Vercel.
- Connect the frontend folder.
- Update `BACKEND_URL` in `script.js` with your Railway URL.
- Deploy.

### 5. Update URLs
- In `script.js`, replace `BACKEND_URL` with your Railway app URL.
- In Telegram, set the mini-app URL to your Vercel URL.