import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDcBr4QeP6nRDkBMY9nyMj2-ehtHPX5dvU",
  authDomain: "snapstudy-79885.firebaseapp.com",
  projectId: "snapstudy-79885",
  storageBucket: "snapstudy-79885.firebasestorage.app",
  messagingSenderId: "242688572500",
  appId: "1:242688572500:web:9068465c4b4808549101c1",
  measurementId: "G-W1QFMEWMB9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();