import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  projectId: "wealth-cap-auth-xyz",
  appId: "1:181842643760:web:4ae2fa516eba81f32c56f5",
  storageBucket: "wealth-cap-auth-xyz.firebasestorage.app",
  apiKey: "AIzaSyDty49cwrgR0fgIUvyWlzGocC5MUCWkPTY",
  authDomain: "wealth-cap-auth-xyz.firebaseapp.com",
  messagingSenderId: "181842643760",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
