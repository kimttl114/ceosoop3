# 🎯 IAM 역할 선택 가이드

## ⚠️ 현재 선택된 역할 확인

스크린샷에서 **"Vertex AI Platform Express 사용자(베타)"** 역할이 선택되어 있는 것을 확인했습니다.

## ✅ 올바른 역할 선택

### 1. 검색창에 입력하세요:

```
Vertex AI User
```

또는

```
aiplatform.user
```

### 2. 선택할 역할:

- ✅ **"Vertex AI User"** (`roles/aiplatform.user`)
- **설명**: "Vertex AI 리소스에 대한 읽기 권한 및 Vertex AI 서비스 사용 권한을 제공합니다."

### 3. 피해야 할 역할:

- ❌ **"Vertex AI Platform Express 사용자(베타)"**
  - 베타 버전이라 불안정할 수 있음
  - 일부 기능 제한 가능

## 📝 단계별 가이드

1. **역할 드롭다운에서 검색**
   - 현재 "Vertex AI Platform Express 사용자(베타)"가 선택되어 있다면
   - 검색창을 클릭하여 내용을 지우고
   - `Vertex AI User` 입력

2. **올바른 역할 선택**
   - 검색 결과에서 **"Vertex AI User"** 선택
   - 역할 ID가 `roles/aiplatform.user`로 표시되는지 확인

3. **저장**
   - "저장" 버튼 클릭

## 🔍 역할 확인

역할을 추가한 후 테이블에서 확인:

| 주 구성원 | 역할 |
|---------|------|
| `vertex-express@ceo-blaind.iam.gserviceaccount.com` | **Vertex AI User** ← 정확한 역할 이름 |

## ✅ 역할 추가 후 테스트

1. **1-2분 대기** (변경 사항 반영)
2. **터미널에서 테스트**:
   ```bash
   node test-vertex-ai-detailed.js
   ```
3. **성공 여부 확인**

---

**핵심**: "Vertex AI Platform Express 사용자(베타)" 대신 **"Vertex AI User"** 역할을 선택하세요!



