
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import getAuth
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3Izvy3_vS0BqK8itmaitNOgFyndcVkp4",
  authDomain: "bdff-5c959.firebaseapp.com",
  projectId: "bdff-5c959",
  storageBucket: "bdff-5c959.firebasestorage.app",
  messagingSenderId: "242835205202",
  appId: "1:242835205202:web:df2df3e5c2f995e6e2838b",
  measurementId: "G-2FGEXT9Z3L"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Auth

// Initialize Firebase Analytics if supported
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, app, auth, analytics }; // Export auth
