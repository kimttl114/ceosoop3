/**
 * 캐릭터 저장 유틸리티 함수
 * Base64 이미지를 리사이징하고 압축하여 localStorage에 저장합니다.
 * 
 * @param {string} generatedBase64Result - 원본 Base64 이미지 데이터
 * @param {string} characterName - 저장할 캐릭터 이름 (선택사항)
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveCharacter(generatedBase64Result, characterName) {
  try {
    // 1. 이미지를 Image 객체로 로드
    const img = new Image();
    
    // 이미지 로드 Promise
    const imageLoadPromise = new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = generatedBase64Result;
    });
    
    await imageLoadPromise;
    
    // 2. 캔버스 생성 및 리사이징 (512x512)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 가져올 수 없습니다.');
    }
    
    canvas.width = 512;
    canvas.height = 512;
    
    // 이미지를 512x512로 그리기
    ctx.drawImage(img, 0, 0, 512, 512);
    
    // 3. JPEG 포맷으로 압축 (품질 0.7)
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
    
    // 4. localStorage에 안전하게 저장
    try {
      // 기존 캐릭터 목록 가져오기
      const existingCharacters = JSON.parse(
        localStorage.getItem('characters') || '[]'
      );
      
      // 새 캐릭터 데이터 추가
      const newCharacter = {
        name: characterName || `캐릭터_${Date.now()}`,
        image: compressedBase64,
        createdAt: new Date().toISOString(),
      };
      
      existingCharacters.push(newCharacter);
      
      // localStorage에 저장 시도
      localStorage.setItem('characters', JSON.stringify(existingCharacters));
      
      // 저장 성공
      alert('저장 완료!');
      
      return true;
      
    } catch (storageError) {
      // localStorage 용량 초과 오류 처리
      if (
        storageError.name === 'QuotaExceededError' ||
        storageError.code === 22 ||
        storageError.code === 1014 ||
        storageError.message?.includes('quota')
      ) {
        alert('저장 공간이 부족합니다! 갤러리에서 옛날 부캐를 지워주세요.');
      } else {
        console.error('localStorage 저장 오류:', storageError);
        alert('저장 중 오류가 발생했습니다: ' + storageError.message);
      }
      return false;
    }
    
  } catch (error) {
    console.error('캐릭터 저장 오류:', error);
    alert('캐릭터 저장 중 오류가 발생했습니다: ' + (error.message || '알 수 없는 오류'));
    return false;
  }
}

/**
 * 모달을 닫는 헬퍼 함수
 * @param {string} modalId - 모달 요소의 ID
 */
export function closeModal(modalId = 'characterModal') {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

