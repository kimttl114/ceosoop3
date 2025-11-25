/**
 * Firebase 연결 및 데이터 저장 테스트 유틸리티
 */

import { auth, db } from '@/lib/firebase'
import { collection, addDoc, getDoc, doc, setDoc } from 'firebase/firestore'

/**
 * Firebase 연결 상태 확인
 */
export function checkFirebaseConnection() {
  console.log('=== Firebase 연결 상태 확인 ===')
  console.log('auth:', auth ? '✅ 연결됨' : '❌ 연결 안됨')
  console.log('db:', db ? '✅ 연결됨' : '❌ 연결 안됨')
  
  if (auth?.currentUser) {
    console.log('현재 로그인 사용자:', auth.currentUser.email)
    console.log('사용자 UID:', auth.currentUser.uid)
  } else {
    console.log('현재 로그인 사용자: 없음')
  }
  
  return {
    auth: !!auth,
    db: !!db,
    user: auth?.currentUser,
  }
}

/**
 * 테스트 데이터 저장 (posts 컬렉션)
 */
export async function testSavePost() {
  if (!db || !auth?.currentUser) {
    console.error('❌ Firebase 또는 사용자가 연결되지 않았습니다.')
    return false
  }

  try {
    const testPost = {
      title: '테스트 글',
      content: '이것은 Firebase 연결 테스트용 글입니다.',
      category: '잡담',
      businessType: '기타',
      author: '테스트 사용자',
      uid: auth.currentUser.uid,
      timestamp: new Date(),
      likes: 0,
      comments: 0,
    }

    const docRef = await addDoc(collection(db, 'posts'), testPost)
    console.log('✅ 테스트 글 저장 성공! 문서 ID:', docRef.id)
    return true
  } catch (error: any) {
    console.error('❌ 테스트 글 저장 실패:', error.message)
    return false
  }
}

/**
 * 테스트 데이터 저장 (users 컬렉션)
 */
export async function testSaveUser() {
  if (!db || !auth?.currentUser) {
    console.error('❌ Firebase 또는 사용자가 연결되지 않았습니다.')
    return false
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid)
    await setDoc(
      userRef,
      {
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        testData: 'Firebase 연결 테스트',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    console.log('✅ 테스트 사용자 데이터 저장 성공!')
    return true
  } catch (error: any) {
    console.error('❌ 테스트 사용자 데이터 저장 실패:', error.message)
    return false
  }
}

/**
 * 저장된 데이터 읽기 테스트
 */
export async function testReadData() {
  if (!db || !auth?.currentUser) {
    console.error('❌ Firebase 또는 사용자가 연결되지 않았습니다.')
    return false
  }

  try {
    // users 컬렉션 읽기
    const userRef = doc(db, 'users', auth.currentUser.uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      console.log('✅ 사용자 데이터 읽기 성공:', userSnap.data())
    } else {
      console.log('⚠️ 사용자 데이터가 없습니다.')
    }
    
    return true
  } catch (error: any) {
    console.error('❌ 데이터 읽기 실패:', error.message)
    return false
  }
}

/**
 * 전체 테스트 실행
 */
export async function runAllTests() {
  console.log('\n🧪 Firebase 연결 및 데이터 저장 테스트 시작...\n')
  
  // 1. 연결 상태 확인
  const connectionStatus = checkFirebaseConnection()
  
  if (!connectionStatus.auth || !connectionStatus.db) {
    console.error('\n❌ Firebase가 제대로 초기화되지 않았습니다.')
    return
  }
  
  if (!connectionStatus.user) {
    console.error('\n❌ 로그인이 필요합니다.')
    return
  }
  
  console.log('\n--- 테스트 시작 ---\n')
  
  // 2. 사용자 데이터 저장 테스트
  console.log('1. 사용자 데이터 저장 테스트...')
  await testSaveUser()
  
  // 3. 데이터 읽기 테스트
  console.log('\n2. 데이터 읽기 테스트...')
  await testReadData()
  
  // 4. 글 저장 테스트
  console.log('\n3. 글 저장 테스트...')
  await testSavePost()
  
  console.log('\n✅ 모든 테스트 완료!\n')
}

