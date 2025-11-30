import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAaG6zXQ-RQE2mIx2xfqfdK4qCY1N0Vos",
  authDomain: "frugal-wins.firebaseapp.com",
  projectId: "frugal-wins",
  storageBucket: "frugal-wins.firebasestorage.app",
  messagingSenderId: "222970557247",
  appId: "1:222970557247:web:b042c3e4eebc5bb164598a",
  measurementId: "G-509ED4JP27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

export default app;
