import { Home, Search, PlusCircle, User } from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import type { Page } from '@/App';

type NavPage = 'home' | 'search' | 'upload' | 'profile';

interface BottomNavProps {
  currentPage: Page;
  onNavigate: (page: NavPage) => void;
}

const navItems: { id: NavPage; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'upload', icon: PlusCircle, label: 'Upload' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { hapticFeedback } = useTelegram();

  const handleClick = (page: NavPage) => {
    hapticFeedback('light');
    onNavigate(page);
  };

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(item.id)}
          >
            <Icon className="nav-icon" size={24} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
