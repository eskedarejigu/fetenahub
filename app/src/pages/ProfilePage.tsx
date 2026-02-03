import { useState, useEffect, useCallback } from 'react';
import { FileText, Heart, Edit2, Check, X } from 'lucide-react';
import { getProfile, updateProfile, getExams } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuth } from '@/hooks/useAuth';
import { ExamCard } from '@/components/ExamCard';
import type { User, Exam } from '@/types';

interface ProfilePageProps {
  onNavigate: (page: 'exam-detail' | 'user-profile', params: { examId?: string; userId?: string }) => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [profile, setProfile] = useState<User | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [activeTab, setActiveTab] = useState<'uploads' | 'likes'>('uploads');
  
  const { hapticFeedback, showAlert } = useTelegram();
  const { user: currentUser, refreshUser } = useAuth();

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, examsRes] = await Promise.all([
        getProfile(),
        getExams({ user_id: currentUser?.id }),
      ]);
      setProfile(profileRes.user);
      setExams(examsRes.exams);
      setEditUsername(profileRes.user.username);
      setEditBio(profileRes.user.bio || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        username: editUsername,
        bio: editBio,
      });
      hapticFeedback('success');
      setIsEditing(false);
      refreshUser();
      loadProfile();
    } catch (error) {
      showAlert('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUsername(profile?.username || '');
    setEditBio(profile?.bio || '');
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
        <p>Failed to load profile</p>
      </div>
    );
  }

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
          {isEditing ? (
            <div className="profile-edit-form">
              <input
                type="text"
                className="form-input"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Username"
              />
              <textarea
                className="form-textarea"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Bio"
                rows={2}
              />
              <div className="edit-actions">
                <button className="btn btn-sm btn-primary" onClick={handleSaveProfile}>
                  <Check size={16} /> Save
                </button>
                <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="profile-name-row">
                <h1 className="profile-username">{profile.username}</h1>
                <button 
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={14} />
                </button>
              </div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            </>
          )}
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
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'uploads' ? 'active' : ''}`}
          onClick={() => setActiveTab('uploads')}
        >
          <FileText size={16} />
          My Uploads
        </button>
        <button
          className={`profile-tab ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          <Heart size={16} />
          Liked
        </button>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === 'uploads' ? (
          exams.length > 0 ? (
            <div className="exams-list">
              {exams.map((exam) => (
                <ExamCard 
                  key={exam.id} 
                  exam={exam} 
                  onNavigate={onNavigate}
                  onUpdate={loadProfile}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No uploads yet</h3>
              <p className="empty-state-description">
                Upload your first exam to share with others
              </p>
            </div>
          )
        ) : (
          <div className="empty-state">
            <Heart size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">No liked exams</h3>
            <p className="empty-state-description">
              Exams you like will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
