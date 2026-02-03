import { useState, useEffect, useCallback } from 'react';
import { Heart, Share2, Flag, ChevronLeft, ChevronRight, Download, User, Building2, Calendar } from 'lucide-react';
import { getExam, likeExam, unlikeExam } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { ReportModal } from '@/components/ReportModal';
import type { Exam } from '@/types';

interface ExamDetailPageProps {
  examId: string;
  onNavigate: (page: 'user-profile', params: { userId: string }) => void;
}

export function ExamDetailPage({ examId, onNavigate }: ExamDetailPageProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  
  const { hapticFeedback, shareUrl, openLink, showAlert } = useTelegram();
  const { user: currentUser } = useAuth();

  const loadExam = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getExam(examId);
      setExam(response.exam);
      setIsLiked(response.exam.is_liked || false);
      setLikesCount(response.exam.likes_count || 0);
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const handleLike = async () => {
    if (likeLoading) return;

    setLikeLoading(true);
    try {
      if (isLiked) {
        await unlikeExam(examId);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likeExam(examId);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        hapticFeedback('success');
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/exam/${examId}`;
    shareUrl(url, `Check out this exam: ${exam?.courses?.name}`);
    hapticFeedback('light');
  };

  const handleDownload = () => {
    if (exam?.files && exam.files[currentPage]) {
      openLink(exam.files[currentPage].file_url);
    }
  };

  const handleUserClick = () => {
    if (exam?.user_id && exam.user_id !== currentUser?.id) {
      onNavigate('user-profile', { userId: exam.user_id });
    }
  };

  const nextPage = () => {
    if (exam?.files && currentPage < exam.files.length - 1) {
      setCurrentPage(prev => prev + 1);
      hapticFeedback('light');
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      hapticFeedback('light');
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'Mid': return 'var(--color-warning)';
      case 'Final': return 'var(--color-danger)';
      case 'Quiz': return 'var(--color-success)';
      default: return 'var(--tg-hint-color)';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="empty-state">
        <p>Exam not found</p>
      </div>
    );
  }

  const hasMultiplePages = exam.files && exam.files.length > 1;

  return (
    <div className="page-container exam-detail-page">
      {/* Header */}
      <header className="exam-detail-header">
        <div className="exam-detail-user" onClick={handleUserClick}>
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
          <span className="exam-detail-username">{exam.users?.username}</span>
        </div>
        <span 
          className="exam-type-badge"
          style={{ backgroundColor: getExamTypeColor(exam.exam_type) }}
        >
          {exam.exam_type}
        </span>
      </header>

      {/* File Viewer */}
      <div className="exam-viewer">
        {exam.files && exam.files.length > 0 ? (
          <>
            <div className="exam-file-container">
              {exam.files[currentPage]?.file_url?.endsWith('.pdf') ? (
                <div className="pdf-viewer">
                  <iframe
                    src={exam.files[currentPage].file_url}
                    width="100%"
                    height="500px"
                    title="PDF Viewer"
                  />
                </div>
              ) : (
                <img 
                  src={exam.files[currentPage]?.file_url} 
                  alt={`Page ${currentPage + 1}`}
                  className="exam-image"
                  loading="lazy"
                />
              )}
            </div>

            {/* Page Navigation */}
            {hasMultiplePages && (
              <div className="page-navigation">
                <button 
                  className="page-nav-btn"
                  onClick={prevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="page-indicator">
                  {currentPage + 1} / {exam.files.length}
                </span>
                <button 
                  className="page-nav-btn"
                  onClick={nextPage}
                  disabled={currentPage >= exam.files.length - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No files available</p>
          </div>
        )}
      </div>

      {/* Exam Info */}
      <div className="exam-info-card">
        <h2 className="exam-info-title">{exam.courses?.name}</h2>
        
        <div className="exam-info-meta">
          <div className="exam-info-item">
            <Building2 size={16} />
            <span>{exam.universities?.name}</span>
          </div>
          <div className="exam-info-item">
            <Calendar size={16} />
            <span>{exam.year}</span>
          </div>
          {exam.teacher_name && (
            <div className="exam-info-item">
              <User size={16} />
              <span>{exam.teacher_name}</span>
            </div>
          )}
        </div>

        <div className="exam-info-date">
          Uploaded on {new Date(exam.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="exam-detail-actions">
        <button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
        >
          <Heart size={24} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>
        
        <button className="action-btn" onClick={handleShare}>
          <Share2 size={24} />
          <span>Share</span>
        </button>
        
        {exam.files && exam.files[currentPage] && (
          <button className="action-btn" onClick={handleDownload}>
            <Download size={24} />
            <span>Download</span>
          </button>
        )}
        
        <button className="action-btn" onClick={() => setShowReportModal(true)}>
          <Flag size={24} />
          <span>Report</span>
        </button>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="exam"
        reportedId={examId}
        onSuccess={() => showAlert('Report submitted successfully')}
      />
    </div>
  );
}
