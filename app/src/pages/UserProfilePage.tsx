import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserCheck, FileText, Flag } from 'lucide-react';
import { getUserProfile, followUser, unfollowUser, getExams } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { ExamCard } from '@/components/ExamCard';
import { ReportModal } from '@/components/ReportModal';
import type { User, Exam } from '@/types';

interface UserProfilePageProps {
  userId: string;
  onNavigate: (page: 'exam-detail' | 'user-profile', params: { examId?: string; userId?: string }) => void;
}

export function UserProfilePage({ userId, onNavigate }: UserProfilePageProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const { hapticFeedback, showAlert, showConfirm } = useTelegram();
  const { user: currentUser } = useAuth();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, examsRes] = await Promise.all([
        getUserProfile(userId),
        getExams({ user_id: userId }),
      ]);
      setProfile(profileRes.user);
      setIsFollowing(profileRes.user.is_following || false);
      setExams(examsRes.exams);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFollow = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const confirmed = await showConfirm('Unfollow this user?');
        if (confirmed) {
          await unfollowUser(userId);
          setIsFollowing(false);
          hapticFeedback('light');
        }
      } else {
        await followUser(userId);
        setIsFollowing(true);
        hapticFeedback('success');
      }
      loadProfile();
    } catch (error) {
      showAlert('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <p>User not found</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="page-container profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.username}
              className="avatar avatar-lg"
            />
          ) : (
            <div className="avatar avatar-lg avatar-placeholder">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-info">
          <h1 className="profile-username">{profile.username}</h1>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{exams.length}</span>
            <span className="stat-label">Uploads</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile.followers_count || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat">
            <span className="stat-value">{profile.following_count || 0}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Actions */}
        {!isOwnProfile && (
          <div className="profile-actions">
            <button
              className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} btn-block`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={16} /> Following
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Follow
                </>
              )}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleReport}
            >
              <Flag size={14} /> Report
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="profile-content">
        <h2 className="section-title">
          <FileText size={18} /> Uploads
        </h2>
        
        {exams.length > 0 ? (
          <div className="exams-list">
            {exams.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No uploads yet</h3>
            <p className="empty-state-description">
              This user hasn't uploaded any exams
            </p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportType="user"
        reportedId={userId}
        onSuccess={() => showAlert('Report submitted successfully')}
      />
    </div>
  );
}
