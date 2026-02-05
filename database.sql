-- FetenaHub Database Schema
-- Run this in Supabase SQL Editor

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

-- Enable Row Level Security (optional, for production)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies (customize as needed)
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read all exams" ON exams FOR SELECT USING (true);
CREATE POLICY "Users can create own exams" ON exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exams" ON exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exams" ON exams FOR DELETE USING (auth.uid() = user_id);
