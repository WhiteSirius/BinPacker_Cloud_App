import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleIcon } from './Icons';
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

interface AuthSectionProps {
  onLoginSuccess: () => void;
}

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

const AuthSection: React.FC<AuthSectionProps> = ({ onLoginSuccess }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(getErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <section id="auth" className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome Back!</h2>
          <p className="text-slate-300 mb-2">Signed in as:</p>
          <p className="text-cyan-400 font-semibold text-lg mb-8">{user.email}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onLoginSuccess}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 glow-shadow"
            >
              Access BinPacker Algorithm
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-4 rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Log Out
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="auth" className="py-20 bg-slate-900/70">
      <div className="container mx-auto px-6">
        <div className="max-w-md mx-auto bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl shadow-cyan-900/20">
          <h2 className="text-2xl font-bold text-center text-white mb-2">{isLogin ? 'Log In' : 'Create Account'}</h2>
          <p className="text-center text-slate-400 mb-6">to access the platform.</p>

          {error && (
            <p className="bg-red-500/20 border border-red-500 text-red-400 text-sm rounded-md p-3 mb-4 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-300 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <div className="flex items-center my-4">
            <hr className="flex-grow border-slate-600" />
            <span className="mx-4 text-slate-500">OR</span>
            <hr className="flex-grow border-slate-600" />
          </div>

          <form onSubmit={handleEmailPasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-slate-300 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-slate-300 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                minLength={6}
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-cyan-800 disabled:cursor-not-allowed glow-shadow"
            >
              {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-cyan-400 hover:text-cyan-300 font-semibold ml-2"
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default AuthSection;





