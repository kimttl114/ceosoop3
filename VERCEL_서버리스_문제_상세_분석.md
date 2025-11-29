# 🔍 Vercel 서버리스 환경 문제 상세 분석

## 📊 로컬 vs Vercel 환경 차이

### 로컬 환경 (Windows) - ✅ 작동함
- **OS**: Windows
- **플랫폼**: `win32`
- **임시 디렉토리**: `C:\Users\...\AppData\Local\Temp`
- **파일 시스템**: 전체 읽기/쓰기 가능
- **FFmpeg 경로**: `node_modules/ffmpeg-static/ffmpeg.exe` (Windows 바이너리)
- **FFprobe 경로**: `node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe`
- **바이너리 크기**: ~80MB, ~60MB
- **실행 권한**: 모든 권한
- **메모리/시간**: 제한 없음

### Vercel 서버리스 환경 (Linux) - ❌ 작동 안함

#### 1. 플랫폼 차이 ⚠️⚠️⚠️⚠️
- **OS**: Linux (Amazon Linux 2)
- **플랫폼**: `linux`
- **문제**: Windows `.exe` 바이너리는 Linux에서 실행 불가
- **해결**: Linux 바이너리 필요 (`ffmpeg`, `ffprobe` - 확장자 없음)

#### 2. 파일 시스템 제약 ⚠️⚠️⚠️
- **코드 위치**: `/var/task` (읽기 전용)
- **쓰기 가능**: `/tmp`만 (512MB 제한)
- **문제**: 임시 파일을 `/tmp` 외부에 생성하면 실패

#### 3. 바이너리 파일 크기 제한 ⚠️⚠️⚠️
- **FFmpeg**: ~80MB
- **FFprobe**: ~60MB
- **총**: ~140MB
- **문제**: Vercel 배포 크기 제한 초과 가능
- **문제**: `node_modules`의 큰 파일이 번들에서 제외될 수 있음

#### 4. 실행 시간 제한 ⚠️
- **기본**: 10초
- **최대**: 60초 (설정됨: `maxDuration = 60`)
- **문제**: FFmpeg 처리가 오래 걸리면 타임아웃

#### 5. 메모리 제한 ⚠️
- **기본**: 1024MB (1GB)
- **문제**: 오디오 파일 처리 시 메모리 부족 가능

---

## 🔍 주요 문제 원인

### 문제 1: 플랫폼 차이 (가능성 매우 높음) ⚠️⚠️⚠️⚠️

**로컬 (Windows):**
```
C:\...\node_modules\ffmpeg-static\ffmpeg.exe
C:\...\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe
```

**Vercel (Linux):**
```
/var/task/node_modules/ffmpeg-static/ffmpeg  (Linux 바이너리)
/var/task/node_modules/ffprobe-static/bin/linux/x64/ffprobe
```

**문제:**
1. Windows 바이너리는 Linux에서 실행 불가
2. Linux 바이너리가 배포에 포함되지 않을 수 있음
3. 바이너리 파일 크기가 너무 커서 배포에서 제외될 수 있음

---

### 문제 2: 임시 디렉토리 경로 문제 ⚠️⚠️⚠️

**현재 코드:**
```typescript
const workDir = tmpdir()  // 로컬: Windows temp, Vercel: /tmp
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

### 문제 3: 바이너리 실행 권한 ⚠️⚠️⚠️

**문제:**
- Lambda 환경에서는 바이너리 파일에 실행 권한이 없을 수 있음
- chmod 실행 불가

**해결:**
```typescript
if (isVercel && ffmpegPath) {
  fs.chmodSync(ffmpegPath, 0o755)  // 실행 권한 부여
}
```

---

### 문제 4: 바이너리 파일 배포 제외 ⚠️⚠️⚠️⚠️

**문제:**
- Vercel은 `node_modules`의 큰 파일을 배포에서 제외할 수 있음
- FFmpeg/FFprobe 바이너리 (각각 ~80MB, ~60MB)가 제외될 수 있음

**확인 방법:**
- Vercel 빌드 로그에서 `node_modules` 크기 확인
- 배포 후 실제 파일 존재 여부 확인

---

### 문제 5: `/tmp` 디렉토리 용량 제한 ⚠️⚠️

**문제:**
- Lambda `/tmp` 디렉토리는 512MB 제한
- 임시 오디오 파일들이 용량 초과 가능

---

## 🛠️ 적용된 해결책

### 1. Vercel 환경 감지 및 /tmp 사용 ✅
```typescript
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
const workDir = isVercel ? '/tmp' : tmpdir()
```

### 2. 플랫폼별 바이너리 경로 우선순위 ✅
- Linux 환경에서 Linux 바이너리 먼저 확인
- 플랫폼에 맞는 경로 우선 사용

### 3. 실행 권한 설정 추가 ✅
- Vercel 환경에서 chmod 시도

---

## 🔍 확인해야 할 사항

### 1. Vercel 함수 로그 확인

다음 로그 확인:
```
[FFmpeg] 환경 정보:
  플랫폼: linux
  Vercel: 예
  작업 디렉토리: /tmp
[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 - /var/task/node_modules/.../linux/x64/ffmpeg
```

### 2. 바이너리 파일 존재 확인

빌드 후 실제 파일이 존재하는지 확인:
```
/var/task/node_modules/ffmpeg-static/bin/linux/x64/ffmpeg
/var/task/node_modules/ffprobe-static/bin/linux/x64/ffprobe
```

### 3. 에러 메시지 확인

다음과 같은 에러가 발생할 수 있음:
- `ENOENT` - 파일을 찾을 수 없음
- `EACCES` - 실행 권한 없음
- `ENOSPC` - 디스크 공간 부족

---

## 🚨 근본적인 문제: 서버리스 환경 제약

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

**다음 단계**: Vercel 함수 로그를 확인하여 정확한 원인 파악

