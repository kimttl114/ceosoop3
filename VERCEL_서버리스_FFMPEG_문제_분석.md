# 🔍 Vercel 서버리스 환경에서 FFmpeg 문제 상세 분석

## 📊 로컬 vs Vercel 환경 차이

### 로컬 환경 (정상 작동)
- ✅ 전체 파일 시스템 접근 가능
- ✅ `tmpdir()` 사용 가능 (Windows: `C:\Users\...\AppData\Local\Temp`)
- ✅ FFmpeg/FFprobe 바이너리 직접 실행 가능
- ✅ 실행 시간 제한 없음
- ✅ 충분한 메모리/CPU

### Vercel 서버리스 환경 (문제 발생 가능)

#### 1. 파일 시스템 제약 ⚠️⚠️⚠️
- ❌ **읽기 전용 파일 시스템** (`/var/task`는 읽기 전용)
- ✅ **`/tmp` 디렉토리만 쓰기 가능** (512MB 제한)
- ❌ 임시 파일 생성 위치 제한

#### 2. 바이너리 실행 제약 ⚠️⚠️⚠️
- ❌ **Lambda는 일부 바이너리 실행 제한**
- ❌ FFmpeg/FFprobe 바이너리 크기 문제 (각각 ~80MB, ~60MB)
- ❌ 실행 권한 문제 가능

#### 3. 실행 시간 제한 ⚠️⚠️
- ✅ `maxDuration = 60` 설정됨 (60초)
- ❌ FFmpeg 처리 시간이 길면 타임아웃 가능

#### 4. 메모리 제한 ⚠️
- 기본 1024MB (1GB)
- 오디오 파일 처리 시 메모리 부족 가능

---

## 🔍 주요 문제 원인 분석

### 문제 1: tmpdir() 경로 문제 (가능성 높음) ⚠️⚠️⚠️

**로컬:**
```typescript
const workDir = tmpdir()  // Windows: C:\Users\...\AppData\Local\Temp
```

**Vercel:**
```typescript
const workDir = tmpdir()  // Lambda: /tmp
```

**문제:**
- `tmpdir()`가 Lambda에서 `/tmp`를 반환하는지 확인 필요
- Lambda는 `/tmp`만 쓰기 가능

**해결:**
```typescript
// Vercel/Lambda 환경 감지
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
const workDir = isVercel ? '/tmp' : tmpdir()
```

---

### 문제 2: FFmpeg/FFprobe 바이너리 경로 문제 (가능성 매우 높음) ⚠️⚠️⚠️⚠️

**로컬:**
```
C:\Users\...\node_modules\ffmpeg-static\ffmpeg.exe
C:\Users\...\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe
```

**Vercel (Linux):**
```
/var/task/node_modules/ffmpeg-static/ffmpeg  (Linux 바이너리)
/var/task/node_modules/ffprobe-static/bin/linux/x64/ffprobe
```

**문제:**
1. Vercel은 **Linux 환경**이므로 Windows 바이너리는 작동하지 않음
2. Linux 바이너리가 배포에 포함되는지 확인 필요
3. 바이너리 파일 크기가 너무 커서 배포에서 제외될 수 있음

**확인 방법:**
```typescript
// Vercel 환경 감지
console.log('Platform:', process.platform)
console.log('FFmpeg path:', ffmpegPath)
console.log('FFprobe path:', ffprobePath)
console.log('Files exist:', fs.existsSync(ffmpegPath), fs.existsSync(ffprobePath))
```

---

### 문제 3: 바이너리 실행 권한 (가능성 높음) ⚠️⚠️⚠️

**문제:**
- Lambda에서는 바이너리 파일에 실행 권한이 없을 수 있음
- chmod 실행 불가

**해결:**
- 바이너리 파일에 실행 권한 설정 필요
- 또는 다른 방법 사용

---

### 문제 4: 임시 파일 시스템 제한 ⚠️⚠️

**문제:**
- Lambda `/tmp` 디렉토리는 512MB 제한
- 오디오 파일들이 `/tmp`를 가득 채울 수 있음
- 파일 정리가 제대로 되지 않으면 디스크 공간 부족

---

### 문제 5: 실행 시간/메모리 제한 ⚠️

**문제:**
- FFmpeg 처리가 오래 걸리면 타임아웃
- 메모리 부족 가능

---

## 🔍 확인해야 할 사항

### 1. Vercel 함수 로그 확인

Vercel 대시보드 → Functions → `/api/generate-audio` → Logs 확인:

**확인할 로그:**
```
[FFmpeg] ✅ FFmpeg 경로 설정 완료: ...
[FFmpeg] ✅ FFprobe 경로 설정 완료: ...
[BGM 믹싱] 시작: ...
[BGM 믹싱] FFmpeg 실행 시작
```

**에러 로그:**
```
[BGM 믹싱] ❌ FFmpeg 에러: ...
[BGM 믹싱] ❌ 전체 실패: ...
```

### 2. 플랫폼 확인

Vercel은 **Linux** 환경이므로:
- Windows `.exe` 바이너리는 작동하지 않음
- Linux 바이너리가 필요함

### 3. 바이너리 파일 크기

- FFmpeg: ~80MB
- FFprobe: ~60MB
- 총 ~140MB

Vercel 배포 크기 제한 확인 필요

---

## 🛠️ 해결 방법

### 해결책 1: Lambda/Linux 환경 감지 및 경로 수정

```typescript
// Lambda 환경 감지
const isLambda = process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL === '1'
const workDir = isLambda ? '/tmp' : tmpdir()

// Linux 바이너리 경로 확인
const platform = process.platform
const isLinux = platform === 'linux'
```

### 해결책 2: 바이너리 파일 존재 확인 강화

```typescript
// Vercel 환경에서 실제 경로 확인
if (isLambda) {
  console.log('[Vercel] Platform:', platform)
  console.log('[Vercel] FFmpeg path:', ffmpegPath)
  console.log('[Vercel] File exists:', fs.existsSync(ffmpegPath))
}
```

### 해결책 3: 대안 접근 방법

1. **외부 FFmpeg API 사용** (예: AWS MediaConvert, Cloudinary)
2. **별도 서버 사용** (FFmpeg 전용 서버)
3. **클라이언트 사이드 처리** (제한적)

---

**다음 단계**: Vercel 함수 로그를 확인하여 정확한 원인 파악

