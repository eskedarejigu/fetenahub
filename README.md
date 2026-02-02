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

### 4. Frontend Deployment (Vercel)
- Sign up for Vercel.
- Connect the frontend folder.
- Update `BACKEND_URL` in `script.js` with your Railway URL.
- Deploy.

### 5. Update URLs
- In `script.js`, replace `BACKEND_URL` with your Railway app URL.
- In Telegram, set the mini-app URL to your Vercel URL.