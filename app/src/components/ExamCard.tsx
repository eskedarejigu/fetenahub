import { useState } from 'react';
import { Heart, Share2, FileText, Calendar, Building2, User } from 'lucide-react';
import { likeExam, unlikeExam } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import type { Exam } from '@/types';

interface ExamCardProps {
  exam: Exam;
  onNavigate: (page: 'exam-detail' | 'user-profile', params: { examId?: string; userId?: string }) => void;
  onUpdate?: () => void;
}

export function ExamCard({ exam, onNavigate, onUpdate }: ExamCardProps) {
  const [isLiked, setIsLiked] = useState(exam.is_liked || false);
  const [likesCount, setLikesCount] = useState(exam.likes_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  const { hapticFeedback, shareUrl } = useTelegram();
  const { user: currentUser } = useAuth();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        await unlikeExam(exam.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likeExam(exam.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        hapticFeedback('success');
      }
      onUpdate?.();
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/exam/${exam.id}`;
    shareUrl(url, `Check out this exam: ${exam.courses?.name}`);
    hapticFeedback('light');
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (exam.user_id && exam.user_id !== currentUser?.id) {
      onNavigate('user-profile', { userId: exam.user_id });
    }
  };

  const handleCardClick = () => {
    onNavigate('exam-detail', { examId: exam.id });
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'Mid': return 'var(--color-warning)';
      case 'Final': return 'var(--color-danger)';
      case 'Quiz': return 'var(--color-success)';
      default: return 'var(--tg-hint-color)';
    }
  };

  return (
    <div className="exam-card" onClick={handleCardClick}>
      {/* Header */}
      <div className="exam-card-header">
        <div className="exam-card-user" onClick={handleUserClick}>
          {exam.users?.avatar_url ? (
            <img 
              src={exam.users.avatar_url} 
              alt={exam.users.username}
              className="avatar avatar-sm"
            />
          ) : (
            <div className="avatar avatar-sm avatar-placeholder">
              {exam.users?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <span className="exam-card-username">{exam.users?.username}</span>
        </div>
        <span 
          className="exam-type-badge"
          style={{ backgroundColor: getExamTypeColor(exam.exam_type) }}
        >
          {exam.exam_type}
        </span>
      </div>

      {/* Content */}
      <div className="exam-card-content">
        <h3 className="exam-card-title">{exam.courses?.name}</h3>
        
        <div className="exam-card-meta">
          <div className="exam-card-meta-item">
            <Building2 size={14} />
            <span>{exam.universities?.name}</span>
          </div>
          <div className="exam-card-meta-item">
            <Calendar size={14} />
            <span>{exam.year}</span>
          </div>
          {exam.teacher_name && (
            <div className="exam-card-meta-item">
              <User size={14} />
              <span>{exam.teacher_name}</span>
            </div>
          )}
        </div>

        {/* File Preview */}
        {exam.files && exam.files.length > 0 && (
          <div className="exam-card-files">
            <div className="file-indicator">
              <FileText size={16} />
              <span>{exam.files.length} file{exam.files.length > 1 ? 's' : ''}</span>
            </div>
            {exam.files[0]?.file_url && (
              <img 
                src={exam.files[0].file_url} 
                alt="Exam preview"
                className="exam-card-preview"
                loading="lazy"
              />
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="exam-card-actions">
        <button 
          className={`exam-action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLoading}
        >
          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>
        <button 
          className="exam-action-btn"
          onClick={handleShare}
        >
          <Share2 size={20} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
