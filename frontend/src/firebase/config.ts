import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Debug: Log environment variables
console.log('Environment variables check:');
console.log('REACT_APP_FIREBASE_API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY);
console.log('REACT_APP_FIREBASE_AUTH_DOMAIN:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
console.log('REACT_APP_FIREBASE_PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID);

// Use environment variables if available, otherwise use hardcoded values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyBDjeKBxHhGg6CDla38uegZhsNJHDDFe7c',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'binpacker-auth-system.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'binpacker-auth-system',
  storageBucket: (process.env.REACT_APP_FIREBASE_PROJECT_ID || 'binpacker-auth-system') + '.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:abcdef123456'
};

console.log('Using Firebase config:', firebaseConfig);

// Validate the current domain against authorized domains
const currentDomain = window.location.hostname;
console.log('Current domain:', currentDomain);
console.log('Firebase auth domain:', firebaseConfig.authDomain);

// Only initialize Firebase if we have proper config
let app;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('Firebase initialized successfully');
  
  // Check if current domain is authorized
  if (currentDomain !== firebaseConfig.authDomain && 
      !currentDomain.includes('localhost') && 
      !currentDomain.includes('127.0.0.1')) {
    console.warn(`⚠️ Current domain (${currentDomain}) may not be authorized in Firebase.`);
    console.warn('Please add this domain to Firebase Console > Authentication > Settings > Authorized domains');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Create a mock auth object for development
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    }
  } as Auth;
}

export { auth };
