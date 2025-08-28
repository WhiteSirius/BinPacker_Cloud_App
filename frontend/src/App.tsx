import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import BinPackerAlgorithm from './components/BinPackerAlgorithm';
import './App.css';

// Main App Content Component
const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'algorithm'>('landing');

  const handleLoginSuccess = () => {
    setCurrentPage('algorithm');
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
  };

  const handleLogout = () => {
    setCurrentPage('landing');
  };

  // Show landing page if user is not logged in OR if they want to go back to landing page
  if (!user || currentPage === 'landing') {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is logged in and wants to see algorithm page
  return (
    <BinPackerAlgorithm 
      onBackToHome={handleBackToHome}
      onLogout={handleLogout}
    />
  );
};

// Main App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App; 