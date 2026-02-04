# FetenaHub Deployment Guide

## Prerequisites

1. [Vercel Account](https://vercel.com)
2. [Supabase Account](https://supabase.com)
3. [Telegram Bot](https://t.me/botfather)

## Step 1: Supabase Setup

### Create Tables

Go to your Supabase SQL Editor and run:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  bio TEXT,
  avatar_url TEXT
);

-- Universities table
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL
);

-- Exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  course_id UUID REFERENCES courses(id),
  year INTEGER NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('Mid', 'Final', 'Quiz', 'Other')),
  teacher_name TEXT,
  is_hidden BOOLEAN DEFAULT FALSE
);

-- Exam files table
CREATE TABLE exam_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  page_order INTEGER DEFAULT 0
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Exam likes table
CREATE TABLE exam_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, user_id)
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('exam', 'user')),
  reported_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('wrong_content', 'spam', 'copyright', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_university_id ON exams(university_id);
CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exam_files_exam_id ON exam_files(exam_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_exam_likes_exam_id ON exam_likes(exam_id);
CREATE INDEX idx_exam_likes_user_id ON exam_likes(user_id);
CREATE INDEX idx_reports_reported_id ON reports(reported_id);
```

### Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New Bucket"
3. Name: `exams`
4. Check "Public bucket"
5. Click "Save"

### Get Supabase Credentials

1. Go to Project Settings > API
2. Copy:
   - Project URL (SUPABASE_URL)
   - anon/public key (SUPABASE_KEY)

## Step 2: Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather)
2. Create new bot: `/newbot`
3. Follow instructions to get bot token
4. Set up WebApp:
   ```
   /setdomain
   ```
   - Select your bot
   - Enter your domain (e.g., `fetenahub.vercel.app`)

## Step 3: Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option 2: Git Integration

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard
3. Configure build settings:
   - Framework Preset: Other
   - Build Command: `cd app && npm run build`
   - Output Directory: `app/dist`
4. Add environment variables (see below)
5. Deploy

## Step 4: Environment Variables

Add these in Vercel Dashboard > Project Settings > Environment Variables:

```
SUPABASE_URL=https://qbodxizbkfnsaiuznsxf.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib2R4aXpia2Zuc2FpdXpuc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDg0NzUsImV4cCI6MjA4MjY4NDQ3NX0.xGsFBBbAUD5gdiYbiYLrvPu3p0lVn6tKdGCtGhZD7CM
BOT_TOKEN=your_bot_token_here
```

## Step 5: Configure Telegram WebApp

1. Create a WebApp URL:
   ```
   https://t.me/your_bot_username/app
   ```
   Or use inline button with `web_app` type.

2. Test the Mini App by opening it in Telegram.

## Troubleshooting

### CORS Issues

If you get CORS errors, make sure your Supabase project allows requests from your Vercel domain:
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel domain to "Redirect URLs"

### Authentication Not Working

1. Verify BOT_TOKEN is correct
2. Check that initData is being sent in headers
3. Ensure you're testing inside Telegram (not browser)

### File Upload Failing

1. Check that `exams` bucket exists and is public
2. Verify SUPABASE_KEY has storage permissions
3. Check browser console for errors

## Local Development

### Frontend
```bash
cd app
npm install
npm run dev
```

### Backend
```bash
cd api
pip install -r requirements.txt
python index.py
```

### Environment Variables for Local Dev

Create `app/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:5000
```

Create `.env` in root:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
BOT_TOKEN=your_bot_token
```

## Security Considerations

1. **Never commit `.env` files** with real credentials
2. **Use strong bot token** from BotFather
3. **Enable RLS (Row Level Security)** in Supabase for production
4. **Set up CORS** properly in Supabase
5. **Validate all inputs** on backend

## Support

For issues or questions, please open an issue on GitHub.
