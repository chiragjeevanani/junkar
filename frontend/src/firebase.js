import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

let messaging = null;
let analytics = null;

// Initialize Firebase services safely
if (typeof window !== 'undefined') {
  // Initialize Analytics safely
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase analytics is not available in this environment:', error);
  }

  // Initialize Messaging safely
  // Note: we check isSupported() asynchronously in the service, 
  // but here we just try to get it if possible, or leave as null.
  try {
    // Only attempt to get messaging if the browser supports service workers
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.warn('Firebase Messaging could not be initialized:', error);
  }
}

export { messaging, getToken, onMessage, analytics };
