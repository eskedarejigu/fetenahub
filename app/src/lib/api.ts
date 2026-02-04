import type { 
  User, University, Course, Exam, Report
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || '';

// Get Telegram initData for authentication
const getInitData = (): string => {
  if (window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData;
  }
  return '';
};

// Base fetch with auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const initData = getInitData();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Auth': initData,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// ============== AUTH API ==============

export const verifyAuth = async (): Promise<{ user: User; success: boolean }> => {
  return fetchWithAuth('/api/auth/verify', { method: 'POST' });
};

// ============== USER API ==============

export const getProfile = async (): Promise<{ user: User }> => {
  return fetchWithAuth('/api/user/profile');
};

export const getUserProfile = async (userId: string): Promise<{ user: User }> => {
  return fetchWithAuth(`/api/user/profile/${userId}`);
};

export const updateProfile = async (updates: Partial<User>): Promise<{ user: User; success: boolean }> => {
  return fetchWithAuth('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

// ============== FOLLOW API ==============

export const followUser = async (userId: string): Promise<{ success: boolean }> => {
  return fetchWithAuth(`/api/follow/${userId}`, { method: 'POST' });
};

export const unfollowUser = async (userId: string): Promise<{ success: boolean }> => {
  return fetchWithAuth(`/api/follow/${userId}`, { method: 'DELETE' });
};

// ============== UNIVERSITY API ==============

export const getUniversities = async (): Promise<{ universities: University[] }> => {
  return fetchWithAuth('/api/universities');
};

export const createUniversity = async (name: string): Promise<{ university: University; success: boolean }> => {
  return fetchWithAuth('/api/universities', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

// ============== COURSE API ==============

export const getCourses = async (): Promise<{ courses: Course[] }> => {
  return fetchWithAuth('/api/courses');
};

export const createCourse = async (name: string): Promise<{ course: Course; success: boolean }> => {
  return fetchWithAuth('/api/courses', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
};

// ============== EXAM API ==============

interface ExamFilters {
  university_id?: string;
  course_id?: string;
  year?: number;
  search?: string;
  user_id?: string;
  feed_type?: 'all' | 'following';
}

export const getExams = async (filters: ExamFilters = {}): Promise<{ exams: Exam[] }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  return fetchWithAuth(`/api/exams?${params.toString()}`);
};

export const getExam = async (examId: string): Promise<{ exam: Exam }> => {
  return fetchWithAuth(`/api/exams/${examId}`);
};

export const createExam = async (examData: {
  university_id: string;
  course_id: string;
  year: number;
  exam_type: string;
  teacher_name?: string;
  files: string[];
}): Promise<{ exam: Exam; success: boolean }> => {
  return fetchWithAuth('/api/exams', {
    method: 'POST',
    body: JSON.stringify(examData),
  });
};

export const likeExam = async (examId: string): Promise<{ success: boolean }> => {
  return fetchWithAuth(`/api/exams/${examId}/like`, { method: 'POST' });
};

export const unlikeExam = async (examId: string): Promise<{ success: boolean }> => {
  return fetchWithAuth(`/api/exams/${examId}/like`, { method: 'DELETE' });
};

// ============== UPLOAD API ==============

export const getUploadUrl = async (filename: string, contentType: string): Promise<{
  signed_url: string;
  path: string;
  token: string;
}> => {
  return fetchWithAuth('/api/upload/url', {
    method: 'POST',
    body: JSON.stringify({ filename, content_type: contentType }),
  });
};

export const confirmUpload = async (path: string): Promise<{ url: string }> => {
  return fetchWithAuth('/api/upload/confirm', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
};

// ============== REPORT API ==============

export const createReport = async (reportData: {
  report_type: 'exam' | 'user';
  reported_id: string;
  reason: 'wrong_content' | 'spam' | 'copyright' | 'other';
}): Promise<{ report: Report; success: boolean }> => {
  return fetchWithAuth('/api/reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
};

// ============== HEALTH CHECK ==============

export const healthCheck = async (): Promise<{ status: string }> => {
  return fetchWithAuth('/api/health');
};
