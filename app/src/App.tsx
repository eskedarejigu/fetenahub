import React, { useState, useEffect } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import ErrorBoundary from '@/components/ErrorBoundary';
import { BottomNav } from '@/components/BottomNav';
import { HomePage } from '@/pages/HomePage';
import { UploadPage } from '@/pages/UploadPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { ExamDetailPage } from '@/pages/ExamDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { LoadingScreen } from '@/components/LoadingScreen';
import './App.css';

export type Page = 'home' | 'search' | 'upload' | 'profile' | 'user-profile' | 'exam-detail';

interface PageState {
  page: Page;
  params?: Record<string, string>;
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageState>({ page: 'home' });
  const [isLoading, setIsLoading] = useState(true);
  const { theme, isReady, showBackButton, hideBackButton } = useTelegram();

  // Apply Telegram theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Handle loading state
  useEffect(() => {
    if (isReady) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  // Handle back button visibility
  useEffect(() => {
    if (currentPage.page === 'home') {
      hideBackButton();
    } else {
      showBackButton(() => navigateBack());
    }
  }, [currentPage, showBackButton, hideBackButton]);

  const navigateTo = (page: Page, params?: Record<string, string>) => {
    setCurrentPage({ page, params });
  };

  const navigateBack = () => {
    if (currentPage.page === 'exam-detail' || currentPage.page === 'user-profile') {
      setCurrentPage({ page: 'home' });
    } else {
      setCurrentPage({ page: 'home' });
    }
  };

  const renderPage = () => {
    switch (currentPage.page) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'search':
        return <SearchPage onNavigate={navigateTo} />;
      case 'upload':
        return <UploadPage onNavigate={navigateTo} />;
      case 'profile':
        return <ProfilePage onNavigate={navigateTo} />;
      case 'user-profile':
        return <UserProfilePage 
          userId={currentPage.params?.userId || ''} 
          onNavigate={navigateTo} 
        />;
      case 'exam-detail':
        return <ExamDetailPage 
          examId={currentPage.params?.examId || ''} 
          onNavigate={navigateTo} 
        />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const showBottomNav = ['home', 'search', 'upload', 'profile'].includes(currentPage.page);

  return (
    <div className="app-container">
      <main className="main-content">
        {renderPage()}
      </main>
      {showBottomNav && (
        <BottomNav 
          currentPage={currentPage.page} 
          onNavigate={navigateTo} 
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      {/* ErrorBoundary prevents a white screen on unexpected runtime errors */}
      <ErrorBoundary>
        <React.Suspense fallback={null}>
          <AppContent />
        </React.Suspense>
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
