# ✅ Vercel 빌드 에러 해결

## 🔍 발견된 문제

Vercel 빌드 로그:
```
Type error: Could not find a declaration file for module 'ffprobe-static'.
Try npm i --save-dev @types/ffprobe-static if it exists or add a new declaration (.d.ts) file containing declare module
```

**문제**: `ffprobe-static` 패키지에 대한 TypeScript 타입 선언 파일이 없습니다.

---

## ✅ 적용된 해결책

### 1. 타입 선언 파일 생성 ✅

`types/ffprobe-static.d.ts` 파일 생성:
```typescript
declare module 'ffprobe-static' {
  interface FfprobeStatic {
    path: string
  }

  const ffprobeStatic: FfprobeStatic
  export default ffprobeStatic
}
```

### 2. tsconfig.json 업데이트 ✅

`types/**/*.d.ts` 파일이 포함되도록 수정:
```json
"include": [
  "next-env.d.ts", 
  "**/*.ts", 
  "**/*.tsx", 
  ".next/types/**/*.ts",
  "types/**/*.d.ts"
]
```

---

## 🧪 로컬 빌드 테스트

로컬에서 빌드 테스트:
```bash
npm run build
```

**성공 시:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
```

---

## 📝 검증 완료 항목

- ✅ `ffprobe-static` 타입 선언 파일 생성
- ✅ `tsconfig.json` 업데이트
- ✅ 타입 구조 확인 (`{ path: string }`)
- ✅ 로컬 빌드 테스트 필요

---

## 🚀 다음 단계

1. **로컬 빌드 테스트**: `npm run build`
2. **Git 커밋 및 푸시**
3. **Vercel에서 다시 배포**

---

**타입 선언 파일이 생성되었으니, 로컬에서 빌드 테스트 후 푸시하세요!**

