/**
 * 초기 슈퍼 관리자 설정 스크립트
 * 
 * 사용 방법:
 * 1. 브라우저에서 관리자 페이지(/admin) 접속
 * 2. 개발자 도구 콘솔 열기 (F12)
 * 3. 이 스크립트를 복사하여 콘솔에 붙여넣기
 * 4. Enter 키 누르기
 */

(async function setupSuperAdmin() {
  try {
    // Firebase 모듈 동적 import
    const { db, auth } = await import('/lib/firebase.js');
    const { doc, setDoc, getDoc } = await import('firebase/firestore');
    
    // 현재 로그인한 사용자 확인
    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ 로그인이 필요합니다. 먼저 로그인해주세요.');
      return;
    }
    
    console.log('✅ 현재 사용자:', user.email);
    
    // 사용자 문서 확인
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('⚠️ 사용자 문서가 없습니다. 생성 중...');
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || '관리자',
        createdAt: new Date(),
      });
    }
    
    // 슈퍼 관리자 권한 부여
    await setDoc(userRef, {
      isAdmin: true,
      adminLevel: 'super',
      adminSince: new Date(),
      permissions: {
        canDeletePosts: true,
        canBanUsers: true,
        canManageSettings: true,
        canManageReports: true,
        canManageComments: true,
      },
    }, { merge: true });
    
    console.log('✅ 슈퍼 관리자 권한이 부여되었습니다!');
    console.log('🔄 페이지를 새로고침하면 관리자 페이지에 접근할 수 있습니다.');
    
    // 자동 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    console.log('\n📝 수동 설정 방법:');
    console.log('1. Firebase Console 접속: https://console.firebase.google.com/');
    console.log('2. 프로젝트 선택');
    console.log('3. Firestore Database → 데이터 탭');
    console.log('4. users 컬렉션에서 본인의 사용자 ID 찾기');
    console.log('5. 문서 편집하여 다음 필드 추가:');
    console.log(JSON.stringify({
      isAdmin: true,
      adminLevel: 'super',
      adminSince: new Date().toISOString(),
      permissions: {
        canDeletePosts: true,
        canBanUsers: true,
        canManageSettings: true,
        canManageReports: true,
        canManageComments: true,
      },
    }, null, 2));
  }
})();

