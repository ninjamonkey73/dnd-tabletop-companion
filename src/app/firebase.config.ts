// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: 'AIzaSyC6kCcDWxrJxZxfJSoFB_N6dh4XTZl6Q6U',
  authDomain: 'dnd-tabletop-companion.firebaseapp.com',
  projectId: 'dnd-tabletop-companion',
  storageBucket: 'dnd-tabletop-companion.firebasestorage.app',
  messagingSenderId: '132354741438',
  appId: '1:132354741438:web:71371ee460ce7ac2cc7aef',
  measurementId: 'G-628N3GE7W5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
