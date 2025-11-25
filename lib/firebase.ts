import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// 환경 변수 확인 - 빌드 시점에도 안전하게 처리
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 빌드 시점에는 초기화하지 않음
let app: ReturnType<typeof initializeApp> | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

// 클라이언트 사이드에서만 초기화
if (typeof window !== "undefined") {
  // 모든 필수 환경 변수가 있을 때만 초기화
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  ) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      _db = getFirestore(app);
      _auth = getAuth(app);
      _storage = getStorage(app);
      _googleProvider = new GoogleAuthProvider();
    } catch (error) {
      console.error("Firebase 초기화 오류:", error);
    }
  }
}

// 타입 단언을 사용하여 export (클라이언트 사이드에서만 사용)
export const db = _db as Firestore;
export const auth = _auth as Auth;
export const storage = _storage as FirebaseStorage;
export const googleProvider = _googleProvider as GoogleAuthProvider;
