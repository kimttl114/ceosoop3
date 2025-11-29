# 🔍 Vercel 서버에서 BGM 믹싱 실패 원인 및 해결책

## 📊 문제 요약

**로컬 (Windows)**: ✅ BGM 믹싱 성공
**Vercel (Linux 서버리스)**: ❌ BGM 믹싱 실패

---

## 🔍 주요 원인 분석

### 1. 플랫폼 차이 (가능성 매우 높음) ⚠️⚠️⚠️⚠️

**로컬:**
- OS: Windows
- 바이너리: `ffmpeg.exe`, `ffprobe.exe` (Windows)
- 경로: `bin/win32/x64/ffprobe.exe`

**Vercel:**
- OS: Linux (Amazon Linux 2)
- 바이너리: `ffmpeg`, `ffprobe` (Linux, 확장자 없음)
- 경로: `bin/linux/x64/ffprobe`

**문제:**
- Windows `.exe` 바이너리는 Linux에서 실행 불가
- Linux 바이너리가 배포에 포함되지 않을 수 있음

---

### 2. 임시 디렉토리 경로 차이 ⚠️⚠️⚠️

**로컬:**
```typescript
const workDir = tmpdir()  // C:\Users\...\AppData\Local\Temp
```

**Vercel:**
```typescript
const workDir = tmpdir()  // /tmp (Lambda 기본값)
```

**문제:**
- Lambda는 `/tmp`만 쓰기 가능
- 다른 경로 사용 시 권한 오류

**해결:**
```typescript
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
const workDir = isVercel ? '/tmp' : tmpdir()
```

---

### 3. 바이너리 파일 크기 제한 ⚠️⚠️⚠️

**바이너리 크기:**
- FFmpeg: ~80MB
- FFprobe: ~60MB
- 총: ~140MB

**문제:**
- Vercel 배포 크기 제한
- `node_modules`의 큰 파일이 배포에서 제외될 수 있음

---

### 4. 실행 권한 문제 ⚠️⚠️

**문제:**
- Lambda 환경에서 바이너리 파일에 실행 권한이 없을 수 있음

**해결:**
```typescript
if (isVercel && ffmpegPath) {
  fs.chmodSync(ffmpegPath, 0o755)  // 실행 권한 부여
}
```

---

### 5. 파일 시스템 제약 ⚠️⚠️

**문제:**
- Lambda는 `/var/task` (코드 위치)는 읽기 전용
- `/tmp`만 쓰기 가능 (512MB 제한)

---

## ✅ 적용된 해결책

### 1. Vercel 환경 감지 및 /tmp 사용 ✅

```typescript
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
const workDir = isVercel ? '/tmp' : tmpdir()
```

### 2. 플랫폼별 바이너리 경로 우선순위 ✅

- Linux 환경에서 Linux 바이너리 먼저 확인
- 플랫폼에 맞는 경로 우선 사용

### 3. 실행 권한 설정 추가 ✅

```typescript
if (isVercel && initialFfmpegPath) {
  fs.chmodSync(initialFfmpegPath, 0o755)
}
```

### 4. 상세한 로깅 추가 ✅

- 플랫폼 정보 출력
- 환경 정보 출력
- 경로 확인 로그

---

## 🔍 확인해야 할 사항

### 1. Vercel 함수 로그 확인

Vercel 대시보드 → Functions → `/api/generate-audio` → Logs:

**확인할 로그:**
```
[FFmpeg] 환경 정보:
  플랫폼: linux
  Vercel: 예
  작업 디렉토리: /tmp
[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 - /var/task/node_modules/.../linux/x64/ffmpeg
```

**에러 로그:**
- `ENOENT` - 파일을 찾을 수 없음
- `EACCES` - 실행 권한 없음
- `ENOSPC` - 디스크 공간 부족

### 2. 바이너리 파일 존재 확인

배포 후 실제 파일이 존재하는지 확인:
```
/var/task/node_modules/ffmpeg-static/bin/linux/x64/ffmpeg
/var/task/node_modules/ffprobe-static/bin/linux/x64/ffprobe
```

---

## 🚨 근본적인 문제

**Vercel 서버리스 환경에서는 FFmpeg 사용이 매우 어렵습니다:**

1. **바이너리 파일 크기**: ~140MB는 배포 크기 제한에 걸릴 수 있음
2. **실행 권한**: Lambda 환경에서 바이너리 실행 제한
3. **리소스 제약**: 메모리/시간 제한
4. **파일 시스템**: 읽기 전용 파일 시스템

---

## 💡 대안 접근 방법

### 방법 1: 외부 FFmpeg API 사용 (권장)

- **Cloudinary**: 오디오/비디오 처리 API
- **AWS MediaConvert**: 전문적인 미디어 처리
- **Uploadcare**: 파일 변환 API

### 방법 2: 별도 서버 사용

- FFmpeg 전용 서버 구축
- Docker 컨테이너로 배포

### 방법 3: 클라이언트 사이드 처리 (제한적)

- Web Audio API 사용
- 제한적이지만 간단한 믹싱 가능

---

## 📝 다음 단계

1. **코드 수정 적용**: Vercel 환경 대응 코드 적용 완료
2. **Git 커밋 및 푸시**: 변경사항 배포
3. **Vercel 함수 로그 확인**: 실제 오류 메시지 확인
4. **대안 검토**: 서버리스 환경 제약으로 인해 외부 API 사용 검토

---

**현재 수정사항 적용 완료. Vercel 함수 로그를 확인하여 정확한 원인 파악 필요!**

