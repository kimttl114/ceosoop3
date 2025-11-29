# ✅ 올바른 Vertex AI 역할 선택 가이드

## 🔍 중요 사항

현재 선택된 역할이 올바른지 확인하세요.

## ✅ 권장 역할

### 1. Vertex AI User (가장 권장)

- **역할 이름**: `Vertex AI User`
- **역할 ID**: `roles/aiplatform.user`
- **검색 방법**: 
  - 드롭다운에서 `Vertex AI User` 검색
  - 또는 `aiplatform.user` 검색

**특징:**
- ✅ 모든 Vertex AI 기능 사용 가능
- ✅ Gemini 모델 호출 가능
- ✅ 모델 목록 조회 가능
- ✅ 안정적이고 권장되는 역할

### 2. 대안 역할 (선택사항)

만약 `Vertex AI User`를 찾을 수 없으면:

- **역할 이름**: `Vertex AI Service Agent`
- **역할 ID**: `roles/aiplatform.serviceAgent`
- **검색**: `Vertex AI Service Agent` 또는 `aiplatform.serviceAgent`

## ❌ 피해야 할 역할

### Vertex AI Platform Express 사용자(베타)

- 이 역할은 **베타 버전**이며 권장되지 않습니다
- 일부 기능이 제한될 수 있습니다
- 안정성이 보장되지 않습니다

## 📝 올바른 역할 추가 방법

### Google Cloud Console IAM 페이지에서:

1. **검색**: `Vertex AI User` (또는 `aiplatform.user`)
2. **선택**: "Vertex AI User" 역할 선택
3. **저장**: "저장" 버튼 클릭

### 빠른 검색 키워드:

- `Vertex AI User` ← **이것을 선택하세요**
- `aiplatform.user` ← 역할 ID

## 🔍 역할 확인 방법

역할을 추가한 후, 테이블에서 확인:

| 주 구성원 | 역할 |
|---------|------|
| `vertex-express@ceo-blaind.iam.gserviceaccount.com` | **Vertex AI User** ← 이것이 보여야 함 |

## ✅ 다음 단계

역할을 올바르게 추가한 후:

1. **1-2분 대기** (변경 사항 반영 시간)
2. **테스트 실행**:
   ```bash
   node test-vertex-ai-detailed.js
   ```
3. **성공 여부 확인**

---

**현재 선택된 역할이 "Vertex AI Platform Express 사용자(베타)"라면, "Vertex AI User"로 변경하세요!**



