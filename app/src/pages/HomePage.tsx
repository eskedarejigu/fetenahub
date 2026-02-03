import { useState, useEffect, useCallback } from 'react';
import { getExams } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { ExamCard } from '@/components/ExamCard';
import { BookOpen, Filter, Users } from 'lucide-react';
import type { Exam } from '@/types';

interface HomePageProps {
  onNavigate: (page: 'exam-detail' | 'user-profile' | 'search', params?: { examId?: string; userId?: string }) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const { hapticFeedback } = useTelegram();

  const loadExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getExams({ feed_type: feedType });
      setExams(response.exams);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [feedType]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleFeedTypeChange = (type: 'all' | 'following') => {
    hapticFeedback('light');
    setFeedType(type);
  };

  return (
    <div className="page-container home-page">
      {/* Header */}
      <header className="page-header">
        <div className="logo-section">
          <BookOpen size={28} className="logo-icon" />
          <h1 className="page-title">FetenaHub</h1>
        </div>
        <button 
          className="filter-btn"
          onClick={() => onNavigate('search')}
        >
          <Filter size={20} />
        </button>
      </header>

      {/* Feed Toggle */}
      <div className="feed-toggle">
        <button
          className={`feed-toggle-btn ${feedType === 'all' ? 'active' : ''}`}
          onClick={() => handleFeedTypeChange('all')}
        >
          <BookOpen size={16} />
          All Exams
        </button>
        <button
          className={`feed-toggle-btn ${feedType === 'following' ? 'active' : ''}`}
          onClick={() => handleFeedTypeChange('following')}
        >
          <Users size={16} />
          Following
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : exams.length > 0 ? (
        <div className="exams-list">
          {exams.map((exam) => (
            <ExamCard 
              key={exam.id} 
              exam={exam} 
              onNavigate={onNavigate}
              onUpdate={loadExams}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={48} />
          </div>
          <h3 className="empty-state-title">
            {feedType === 'following' ? 'No exams from followed users' : 'No exams yet'}
          </h3>
          <p className="empty-state-description">
            {feedType === 'following' 
              ? 'Follow users to see their uploads here' 
              : 'Be the first to upload an exam!'}
          </p>
        </div>
      )}
    </div>
  );
}
