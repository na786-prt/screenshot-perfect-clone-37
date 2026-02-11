import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

export function Layout({ children, hideBottomNav }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {user && !hideBottomNav && <BottomNav />}
    </div>
  );
}
