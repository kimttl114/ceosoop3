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

// Firebase 인스턴스
let app: ReturnType<typeof initializeApp> | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

// Firebase 초기화 함수
const initFirebase = () => {
  // 서버 사이드에서는 초기화하지 않음
  if (typeof window === "undefined") {
    return false;
  }

  // 이미 초기화되어 있으면 성공
  if (app && _auth && _db && _storage) {
    return true;
  }

  // 모든 필수 환경 변수가 있는지 확인
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId ||
    !firebaseConfig.storageBucket ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId
  ) {
    console.warn("Firebase 환경 변수가 설정되지 않았습니다.");
    return false;
  }

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    _db = getFirestore(app);
    _auth = getAuth(app);
    _storage = getStorage(app);
    _googleProvider = new GoogleAuthProvider();
    return true;
  } catch (error) {
    console.error("Firebase 초기화 오류:", error);
    return false;
  }
};

// 클라이언트 사이드에서 자동 초기화 시도
if (typeof window !== "undefined") {
  initFirebase();
}

// Getter 함수들 - 필요할 때 초기화 시도
const getAuthInstance = (): Auth | null => {
  if (!_auth && typeof window !== "undefined") {
    initFirebase();
  }
  return _auth;
};

const getGoogleProvider = (): GoogleAuthProvider | null => {
  if (!_googleProvider && typeof window !== "undefined") {
    initFirebase();
  }
  return _googleProvider;
};

const getDb = (): Firestore | null => {
  if (!_db && typeof window !== "undefined") {
    initFirebase();
  }
  return _db;
};

const getStorageInstance = (): FirebaseStorage | null => {
  if (!_storage && typeof window !== "undefined") {
    const initialized = initFirebase();
    // Storage가 초기화되지 않았으면 다시 시도
    if (!_storage && initialized) {
      try {
        _storage = getStorage(app!);
      } catch (error) {
        console.error("Storage 인스턴스 생성 실패:", error);
      }
    }
  }
  return _storage;
};

// 초기화 확인 및 강제 초기화 함수
export const ensureFirebaseInitialized = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return initFirebase();
};

// Export - 타입 단언 사용 (클라이언트 사이드에서만 사용)
// 실제로는 null일 수 있으므로 사용하는 쪽에서 null 체크 필요
// 런타임에 다시 가져오는 함수도 제공
export const db = getDb() as Firestore;
export const auth = getAuthInstance() as Auth;
export const storage = getStorageInstance() as FirebaseStorage;
export const googleProvider = getGoogleProvider() as GoogleAuthProvider;

// 런타임에 Firebase 인스턴스를 다시 가져오는 함수들 (내부 함수와 충돌 방지)
export const getDbRuntime = (): Firestore | null => {
  if (typeof window === 'undefined') return null;
  return getDb();
};
export const getAuthRuntime = (): Auth | null => {
  if (typeof window === 'undefined') return null;
  return getAuthInstance();
};
export const getStorageRuntime = (): FirebaseStorage | null => {
  if (typeof window === 'undefined') return null;
  return getStorageInstance();
};
