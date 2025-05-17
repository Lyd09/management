// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAP1ij1ynHcJ41U4DAzBGmSEU1gXwMbym4",
  authDomain: "bd---ff.firebaseapp.com",
  projectId: "bd---ff",
  storageBucket: "bd---ff.firebasestorage.app",
  messagingSenderId: "20488418198",
  appId: "1:20488418198:web:9bb0b8202582d7f07a63b7",
  measurementId: "G-N0QB6WRF46"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { db, app };
