import { BookOpen } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <BookOpen size={48} className="logo-icon" />
        </div>
        <h1 className="loading-title">FetenaHub</h1>
        <p className="loading-subtitle">Exam Sharing Platform</p>
        <div className="loading-spinner-container">
          <div className="spinner" />
        </div>
      </div>
    </div>
  );
}
