import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase/config';
import UserMenu from './UserMenu';
import './UserMenu.css';

interface LandingPageProps {
  onLoginSuccess: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'Google sign-in popup was blocked. Please allow popups for this site.';
      default:
        return errorCode;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getErrorMessage(err.code));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsRegistering(false);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err.code));
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(getErrorMessage(err.code));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUserMenuAction = (action: string) => {
    switch (action) {
      case 'profile':
        // TODO: Navigate to user profile
        console.log('Navigate to user profile');
        break;
      case 'data':
        // TODO: Navigate to data management
        console.log('Navigate to data management');
        break;
      case 'saved':
        // TODO: Navigate to saved runs
        console.log('Navigate to saved optimization runs');
        break;
      case 'history':
        // TODO: Navigate to history
        console.log('Navigate to optimization history');
        break;
      case 'analytics':
        // TODO: Navigate to analytics
        console.log('Navigate to performance analytics');
        break;
      case 'settings':
        // TODO: Navigate to settings
        console.log('Navigate to settings');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <h1>🚛 BinPacker</h1>
        <p>Advanced 3D Bin Packing Optimization Algorithm</p>
        <p className="subtitle">Optimize your truck loading with our intelligent packing algorithm</p>
        
        {/* User Status Section */}
        {user && (
          <div className="user-status-section">
            <p>✅ Logged in as: <strong>{user.email}</strong></p>
            <div className="user-actions">
              <button 
                onClick={onLoginSuccess}
                className="cta-button"
              >
                Access BinPacker Algorithm
              </button>
              <button 
                onClick={() => setIsUserMenuOpen(true)}
                className="menu-button-small"
              >
                ☰ Menu
              </button>
              <button 
                onClick={handleLogout}
                className="logout-button-small"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* Features Section - Always Visible */}
        <div className="features">
          <div className="feature">
            <span>📦</span>
            <h3>Smart Packing</h3>
            <p>Intelligent 3D optimization algorithm</p>
          </div>
          <div className="feature">
            <span>📊</span>
            <h3>Real-time Analysis</h3>
            <p>Live optimization results and statistics</p>
          </div>
          <div className="feature">
            <span>🎯</span>
            <h3>Maximum Efficiency</h3>
            <p>Optimize space utilization and weight distribution</p>
          </div>
        </div>

        {/* Login Section - Only show if not logged in */}
        {!user && (
          <div className="cta-section">
            <button 
              onClick={() => setShowLoginForm(true)}
              className="cta-button"
            >
              Login to Access
            </button>
          </div>
        )}

        {/* Login Form - Only show if not logged in and form is active */}
        {!user && showLoginForm && (
          <div className="login-section">
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="google-signin">
              <button 
                onClick={handleGoogleSignIn}
                className="google-button"
              >
                <span>🔍</span>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="divider">
              <span>or</span>
            </div>

            {/* Email/Password Authentication */}
            <div className="auth-tabs">
              <button 
                onClick={() => setIsRegistering(false)}
                className={`tab ${!isRegistering ? 'active' : ''}`}
              >
                Login
              </button>
              <button 
                onClick={() => setIsRegistering(true)}
                className={`tab ${isRegistering ? 'active' : ''}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="auth-form">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {isRegistering && (
                  <small>Password must be at least 6 characters</small>
                )}
              </div>
              <button type="submit" className="submit-button">
                {isRegistering ? 'Create Account' : 'Login'}
              </button>
            </form>

            <button 
              onClick={() => setShowLoginForm(false)}
              className="back-button"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </div>

      {/* User Menu Component */}
      <UserMenu 
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        onNavigate={handleUserMenuAction}
      />
    </div>
  );
};

export default LandingPage; 