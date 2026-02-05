# FetenaHub - Exam Sharing Platform

A Telegram Mini App for sharing and discovering exam papers. Built with React + TypeScript + Flask + Supabase.

## Features

- **Auto Authentication**: Silent login via Telegram WebApp
- **Exam Upload**: Upload PDFs and images with metadata
- **Exam Discovery**: Browse, search, and filter exams
- **Social Features**: Follow users, like exams, share content
- **Reporting**: Report inappropriate content
- **Theme Sync**: Dark/Light mode matches Telegram

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python Flask (Vercel Serverless)
- **Database**: Supabase (PostgreSQL + Storage)
- **Hosting**: Vercel

## Project Structure

```
/
├── app/                    # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # API & Supabase clients
│   │   └── types/          # TypeScript types
│   └── dist/               # Build output
├── api/                    # Flask Backend
│   ├── index.py            # Main API routes
│   └── requirements.txt    # Python dependencies
└── vercel.json             # Vercel configuration
```

## Database Schema

### Tables

- **users**: User profiles linked to Telegram IDs
- **universities**: List of universities
- **courses**: List of courses
- **exams**: Exam metadata
- **exam_files**: Files associated with exams
- **follows**: User follow relationships
- **exam_likes**: Exam likes
- **reports**: Content reports

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the following SQL to create tables:

```sql
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
  exam_type TEXT NOT NULL,
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
  report_type TEXT NOT NULL,
  reported_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Create a storage bucket called `exams` with public access

### 2. Telegram Bot Setup

1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Enable WebApp for your bot:
   ```
   /setdomain
   ```
   Then provide your domain
3. Get your bot token

### 3. Environment Variables

Create a `.env` file in the root:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Telegram
BOT_TOKEN=your_bot_token
```

### 4. Local Development

**Frontend:**
```bash
cd app
npm install
npm run dev
```

**Backend:**
```bash
cd api
pip install -r requirements.txt
python index.py
```

### 5. Deployment to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `BOT_TOKEN`

## API Endpoints

### Auth
- `POST /api/auth/verify` - Verify Telegram auth

### Users
- `GET /api/user/profile` - Get current user profile
- `GET /api/user/profile/:id` - Get user profile by ID
- `PUT /api/user/profile` - Update profile

### Follows
- `POST /api/follow/:id` - Follow user
- `DELETE /api/follow/:id` - Unfollow user

### Universities
- `GET /api/universities` - List universities
- `POST /api/universities` - Create university

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course

### Exams
- `GET /api/exams` - List exams (with filters)
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create exam
- `POST /api/exams/:id/like` - Like exam
- `DELETE /api/exams/:id/like` - Unlike exam

### Upload
- `POST /api/upload/url` - Get signed upload URL
- `POST /api/upload/confirm` - Confirm upload

### Reports
- `POST /api/reports` - Create report

## Security

- All API requests require Telegram `initData` in `X-Telegram-Auth` header
- File uploads use signed URLs with time-limited tokens
- Reports auto-hide content after threshold

## License

MIT
