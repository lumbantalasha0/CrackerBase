// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqi6wtgNyDeB0coatsYmF5JJ2_MFotgoU",
  authDomain: "crackerbase-7ae1f.firebaseapp.com",
  projectId: "crackerbase-7ae1f",
  storageBucket: "crackerbase-7ae1f.firebasestorage.app",
  messagingSenderId: "81487619533",
  appId: "1:81487619533:web:1c4bd9f391d22555d0d084",
  measurementId: "G-8L6F5TF9BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
