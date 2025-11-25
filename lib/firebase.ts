import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Next.js 중복 초기화 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore는 절대 undefined가 아님 - 타입 명시
export const db: Firestore = getFirestore(app);

// Auth, Storage, GoogleProvider도 export
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
