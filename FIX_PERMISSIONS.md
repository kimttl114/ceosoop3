# 🔧 Vertex AI 권한 문제 해결 가이드

## 🔍 발견된 문제

### 진단 결과:
- ✅ **Access Token 획득**: 성공 (인증 자체는 작동함)
- ❌ **404 Not Found**: 모델 접근 불가
- ❌ **403 Permission Denied**: `aiplatform.models.list` 권한 없음

### 근본 원인:
서비스 계정 `vertex-express@ceo-blaind.iam.gserviceaccount.com`에 **Vertex AI 사용 권한이 없습니다**.

에러 메시지:
```
Permission 'aiplatform.models.list' denied on resource 
'//aiplatform.googleapis.com/projects/ceo-blaind/locations/us-central1'
```

## ✅ 해결 방법

### 1단계: IAM 및 관리자 페이지 접속

링크: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind

### 2단계: 서비스 계정 찾기

1. 페이지 상단 검색창에 입력: `vertex-express@ceo-blaind.iam.gserviceaccount.com`
2. 또는 목록에서 `vertex-express` 검색

### 3단계: 역할 추가

1. 해당 서비스 계정의 **"편집" (연필 아이콘)** 클릭
2. **"역할 추가"** 또는 **"Add Role"** 클릭
3. 검색창에 `Vertex AI` 입력
4. 다음 역할 중 하나 선택:
   - **"Vertex AI User"** (`roles/aiplatform.user`) - **권장**
   - 또는 **"Vertex AI Service Agent"** (`roles/aiplatform.serviceAgent`)
5. **"저장"** 클릭

### 4단계: 변경 사항 적용 대기

- IAM 역할 변경은 보통 **즉시 적용**됩니다
- 가끔 1-2분 정도 걸릴 수 있습니다

### 5단계: 테스트

역할 추가 후 다음 명령어로 다시 테스트:

```bash
node test-vertex-ai-detailed.js
```

성공하면:
- ✅ Access Token 획득 성공
- ✅ 200 OK 응답
- ✅ 모델 응답 받음

## 📋 필요한 최소 권한

서비스 계정에 다음 역할 중 하나가 필요합니다:

1. **`roles/aiplatform.user`** (Vertex AI User) - **권장**
   - Vertex AI 리소스 읽기/사용 권한
   - 모델 호출, 예측, 생성 등

2. **`roles/aiplatform.serviceAgent`** (Vertex AI Service Agent)
   - 더 넓은 권한 (일반적으로 필요 없음)

## 🔍 현재 상태 확인

### 서비스 계정에 부여된 역할 확인:

링크: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind

`vertex-express@ceo-blaind.iam.gserviceaccount.com`의 **"역할"** 컬럼에서 확인할 수 있습니다.

### 필요한 역할이 보이지 않으면:

1. **"편집"** 클릭
2. **"역할 추가"** 클릭
3. `Vertex AI User` 검색 후 추가

## ⚠️ 주의사항

- **프로젝트 소유자** 권한이 있어야 IAM 역할을 추가할 수 있습니다
- 역할 추가 후 변경 사항이 반영되는 데 몇 분 걸릴 수 있습니다
- 역할이 추가된 후에도 여전히 실패하면:
  1. Vertex AI API 활성화 상태 확인
  2. 청구 계정 연결 확인
  3. 프로젝트에 Vertex AI 접근 제한이 있는지 확인

## 📝 체크리스트

- [ ] IAM 및 관리자 페이지 접속
- [ ] `vertex-express@ceo-blaind.iam.gserviceaccount.com` 서비스 계정 찾기
- [ ] "Vertex AI User" 역할 추가
- [ ] 변경 사항 저장
- [ ] 1-2분 대기
- [ ] `node test-vertex-ai-detailed.js` 재실행
- [ ] 성공 여부 확인

## 🚀 빠른 링크

- **IAM 역할 관리**: https://console.cloud.google.com/iam-admin/iam?project=ceo-blaind
- **서비스 계정 직접 링크**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=ceo-blaind
- **Vertex AI API 상태**: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=ceo-blaind

---

**중요**: 역할을 추가한 후 테스트해보시고, 여전히 실패하면 알려주세요.



