import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { ChevronRight, Database, History, LineChart, LogOut, Settings, User, X } from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (destination: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  void activeSection;
  void setActiveSection;

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="User menu"
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900">
          <div className="text-sm font-bold text-slate-100">Account</div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{user?.email || 'Signed in'}</div>
                <div className="text-xs text-slate-400">Active session</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Navigation</div>
            <MenuButton icon={<User className="h-4 w-4" />} label="User Profile" onClick={() => handleMenuAction('profile')} />
            <MenuButton icon={<Database className="h-4 w-4" />} label="My Data & Imports" onClick={() => handleMenuAction('data')} />
            <MenuButton icon={<History className="h-4 w-4" />} label="Optimization History" onClick={() => handleMenuAction('history')} />
            <MenuButton icon={<LineChart className="h-4 w-4" />} label="Performance Analytics" onClick={() => handleMenuAction('analytics')} />
            <MenuButton icon={<Settings className="h-4 w-4" />} label="Settings" onClick={() => handleMenuAction('settings')} />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium">
                <LogOut className="h-4 w-4" />
                Sign out
              </span>
              <ChevronRight className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50 transition-all duration-200"
    >
      <span className="inline-flex items-center gap-2 text-sm font-medium">
        <span className="text-slate-500">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </button>
  );
};

export default UserMenu; 