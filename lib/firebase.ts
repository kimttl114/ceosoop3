// Firebase 클라이언트 SDK 설정

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDVyl3_A2blEvHzr2u7H_J4Yo358dxfQdk",
  authDomain: "ceo-blaind.firebaseapp.com",
  projectId: "ceo-blaind",
  storageBucket: "ceo-blaind.firebasestorage.app",
  messagingSenderId: "21504735562",
  appId: "1:21504735562:web:4aee8d977cca6ce938a9b3",
  measurementId: "G-CM2RZZQZ26"
}

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined
let googleProvider: GoogleAuthProvider | undefined

// Firebase 초기화 함수
function initializeFirebase() {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 초기화하지 않음
    return
  }

  try {
    // 이미 초기화되어 있으면 재사용
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log('Firebase 초기화 완료')
    } else {
      app = getApps()[0]
      console.log('Firebase 앱 재사용')
    }
    
    if (app) {
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
      googleProvider = new GoogleAuthProvider()
      console.log('Firebase Auth, Firestore, Storage, GoogleAuthProvider 초기화 완료')
    }
  } catch (error) {
    console.error('Firebase 초기화 오류:', error)
  }
}

// 클라이언트 사이드에서만 초기화 실행
if (typeof window !== 'undefined') {
  initializeFirebase()
}

// Firebase에 인증 정보 업데이트하는 함수
export async function updateUserVerification(userId: string, verificationData: {
  businessNumber: string
  representativeName: string
  openingDate: string
}) {
  if (typeof window === 'undefined') {
    throw new Error('이 함수는 클라이언트 사이드에서만 사용할 수 있습니다.')
  }

  if (!db) {
    throw new Error('Firebase가 초기화되지 않았습니다.')
  }

  const { doc, updateDoc } = await import('firebase/firestore')
  
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      businessInfo: {
        businessNumber: verificationData.businessNumber,
        representativeName: verificationData.representativeName,
        openingDate: verificationData.openingDate,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Firebase 업데이트 오류:', error)
    throw error
  }
}

// Firebase 초기화 상태 확인 함수
export function isFirebaseInitialized(): boolean {
  if (typeof window === 'undefined') return false
  return !!(app && auth && db && storage && googleProvider)
}

// Firebase 재초기화 함수 (필요시 사용)
export function reinitializeFirebase() {
  if (typeof window !== 'undefined') {
    initializeFirebase()
  }
}

// 클라이언트 사이드에서만 사용 가능한 값들을 export
// 서버 사이드에서는 undefined일 수 있으므로 사용 전 체크 필요
export { app, auth, db, storage, googleProvider }

