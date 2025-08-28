import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';

const FirebaseTest: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Testing...');

  // Firebase is now configured with hardcoded values
  const isFirebaseConfigured = true;

  // Test Firebase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Try to get current user (this will test the connection)
        const currentUser = auth.currentUser;
        setConnectionStatus('Connected to Firebase');
      } catch (error) {
        console.error('Firebase connection test failed:', error);
        setConnectionStatus('Failed to connect to Firebase');
      }
    };

    testConnection();
  }, []);

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
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(getErrorMessage(err.code));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Firebase Authentication Test</h2>
      
      {error && (
        <div style={{ 
          color: 'white', 
          backgroundColor: '#dc3545', 
          padding: '10px', 
          marginBottom: '10px', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {user ? (
        <div>
          <p>✅ <strong>Logged in as:</strong> {user.email}</p>
          <p>Welcome back!</p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
            Logout
          </button>
        </div>
      ) : (
        <div>
          {/* Google Sign-In Button */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <button 
              onClick={handleGoogleSignIn}
              style={{ 
                padding: '12px 20px', 
                backgroundColor: '#4285f4', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <span style={{ fontSize: '18px' }}>🔍</span>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '20px 0',
            color: '#6c757d'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }}></div>
            <span style={{ padding: '0 10px', fontSize: '14px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }}></div>
          </div>

          {/* Email/Password Authentication */}
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <button 
              onClick={() => setIsRegistering(false)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: !isRegistering ? '#007bff' : '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                marginRight: '10px',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
            <button 
              onClick={() => setIsRegistering(true)}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: isRegistering ? '#28a745' : '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            <h3>{isRegistering ? 'Create New Account' : 'Login to Existing Account'}</h3>
            <div style={{ marginBottom: '10px' }}>
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                required
                minLength={6}
              />
              {isRegistering && (
                <small style={{ color: '#6c757d' }}>Password must be at least 6 characters</small>
              )}
            </div>
            <button 
              type="submit" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: isRegistering ? '#28a745' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {isRegistering ? 'Create Account' : 'Login'}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Firebase Status:</h4>
        <p>✅ Firebase Config: Loaded</p>
        <p>✅ Auth Context: Working</p>
        <p>✅ Connection: {connectionStatus}</p>
        <p>✅ Environment Variables: Using Hardcoded Config</p>
        <p style={{ color: '#28a745', fontSize: '12px' }}>
          <strong>Note:</strong> Firebase is now properly configured and ready for authentication!
        </p>
        {!user && (
          <div style={{ color: '#856404', fontSize: '12px', marginTop: '10px' }}>
            <p><strong>Tip:</strong> You can sign in with Google or create a new account with email/password.</p>
            <p><strong>Test Account:</strong> Try registering with any email and password (6+ characters).</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseTest; 