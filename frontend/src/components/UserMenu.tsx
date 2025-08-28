import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (destination: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleMenuAction = (action: string) => {
    if (onNavigate) {
      onNavigate(action);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='user-menu-overlay' onClick={onClose}>
      <div className='user-menu' onClick={(e) => e.stopPropagation()}>
        <div className='user-menu-header'>
          <div className='user-menu-title'>
            <span className='user-icon'>👤</span>
            <h3>User Menu</h3>
          </div>
          <button className='close-btn' onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        
        <div className='user-menu-content'>
          <div className='user-info'>
            <div className='user-avatar'>
              <span className='avatar-icon'>👤</span>
            </div>
            <div className='user-details'>
              <p className='user-email'><strong>{user?.email}</strong></p>
              <p className='user-status'>✅ Active Session</p>
            </div>
          </div>
          
          <div className='menu-actions'>
            <div className='menu-section'>
              <h4 className='section-title'>📊 Data Management</h4>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('profile')}
                onMouseEnter={() => setActiveSection('profile')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>👤</span>
                <span className='btn-text'>User Profile</span>
                <span className='btn-arrow'>→</span>
              </button>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('data')}
                onMouseEnter={() => setActiveSection('data')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>📁</span>
                <span className='btn-text'>My Data & Imports</span>
                <span className='btn-arrow'>→</span>
              </button>
            </div>

            <div className='menu-section'>
              <h4 className='section-title'>💾 Optimization</h4>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('saved')}
                onMouseEnter={() => setActiveSection('saved')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>💾</span>
                <span className='btn-text'>Saved Optimization Runs</span>
                <span className='btn-arrow'>→</span>
              </button>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('history')}
                onMouseEnter={() => setActiveSection('history')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>📈</span>
                <span className='btn-text'>Optimization History</span>
                <span className='btn-arrow'>→</span>
              </button>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('analytics')}
                onMouseEnter={() => setActiveSection('analytics')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>📊</span>
                <span className='btn-text'>Performance Analytics</span>
                <span className='btn-arrow'>→</span>
              </button>
            </div>

            <div className='menu-section'>
              <h4 className='section-title'>⚙️ Settings</h4>
              <button 
                className='menu-btn' 
                onClick={() => handleMenuAction('settings')}
                onMouseEnter={() => setActiveSection('settings')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>⚙️</span>
                <span className='btn-text'>Settings & Preferences</span>
                <span className='btn-arrow'>→</span>
              </button>
            </div>

            <div className='menu-section signout-section'>
              <button 
                className='menu-btn signout-btn' 
                onClick={handleSignOut}
                onMouseEnter={() => setActiveSection('signout')}
                onMouseLeave={() => setActiveSection(null)}
              >
                <span className='btn-icon'>🚪</span>
                <span className='btn-text'>Sign Out</span>
                <span className='btn-arrow'>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserMenu; 