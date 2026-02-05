// Database Types for FetenaHub

export interface User {
  id: string;
  created_at: string;
  telegram_id: string;
  username: string;
  bio: string;
  avatar_url: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface University {
  id: string;
  created_at: string;
  name: string;
}

export interface Course {
  id: string;
  created_at: string;
  name: string;
}

export interface Exam {
  id: string;
  created_at: string;
  user_id: string;
  university_id: string;
  course_id: string;
  year: number;
  exam_type: 'Mid' | 'Final' | 'Quiz' | 'Other';
  teacher_name?: string;
  is_hidden?: boolean;
  // Joined data
  users?: User;
  universities?: University;
  courses?: Course;
  files?: ExamFile[];
  is_liked?: boolean;
  likes_count?: number;
}

export interface ExamFile {
  id: string;
  created_at: string;
  exam_id: string;
  file_url: string;
  page_order: number;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ExamLike {
  id: string;
  exam_id: string;
  user_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: 'exam' | 'user';
  reported_id: string;
  reason: 'wrong_content' | 'spam' | 'copyright' | 'other';
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UploadFile {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  url?: string;
}

export type Theme = 'light' | 'dark';
