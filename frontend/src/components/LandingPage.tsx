import React, { useCallback } from 'react';
import Header from './frontGoogle/Header';
import Hero from './frontGoogle/Hero';
import Features from './frontGoogle/Features';
import ValueProps from './frontGoogle/ValueProps';
import AuthSection from './frontGoogle/AuthSection';
import Footer from './frontGoogle/Footer';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const { user } = useAuth();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Keep silent on landing; AuthSection surfaces errors for auth actions.
      console.error('Logout failed:', e);
    }
  }, []);

  return (
    <div className="bg-slate-900 min-h-screen overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10" />
      <div className="relative z-10">
        <Header
          scrollTo={scrollTo}
          isLoggedIn={!!user}
          onLoginClick={() => scrollTo('auth')}
          onLogoutClick={handleLogout}
        />
        <main>
          <Hero scrollTo={scrollTo} isLoggedIn={!!user} onAccessAccount={onLoginSuccess} />
          <Features />
          <ValueProps />
          <AuthSection onLoginSuccess={onLoginSuccess} />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage; 