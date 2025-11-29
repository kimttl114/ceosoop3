# 🔍 Vercel vs 로컬 환경 상세 분석

## 📊 환경 차이점 비교

### 로컬 환경 (Windows)
- **OS**: Windows 10/11
- **플랫폼**: `win32`
- **임시 디렉토리**: `C:\Users\...\AppData\Local\Temp`
- **파일 시스템**: 전체 접근 가능 (읽기/쓰기)
- **FFmpeg 경로**: `node_modules/ffmpeg-static/ffmpeg.exe`
- **FFprobe 경로**: `node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe`
- **바이너리**: Windows `.exe` 파일
- **실행 권한**: 모든 권한
- **메모리**: 충분
- **실행 시간**: 제한 없음

### Vercel 서버리스 환경 (Linux)
- **OS**: Linux (Amazon Linux 2)
- **플랫폼**: `linux`
- **임시 디렉토리**: `/tmp` (512MB 제한)
- **파일 시스템**: 읽기 전용 (`/var/task`), 쓰기 가능 (`/tmp`만)
- **FFmpeg 경로**: `node_modules/ffmpeg-static/ffmpeg` (Linux 바이너리)
- **FFprobe 경로**: `node_modules/ffprobe-static/bin/linux/x64/ffprobe`
- **바이너리**: Linux 실행 파일 (확장자 없음)
- **실행 권한**: 제한적
- **메모리**: 1024MB (1GB) 기본
- **실행 시간**: 최대 60초 (설정됨)

---

## 🚨 주요 문제 원인

### 문제 1: 플랫폼 차이로 인한 바이너리 불일치 ⚠️⚠️⚠️⚠️

**로컬 (Windows):**
- Windows `.exe` 바이너리 사용
- 경로: `bin/win32/x64/ffprobe.exe`

**Vercel (Linux):**
- Linux 바이너리 필요
- 경로: `bin/linux/x64/ffprobe`
- **문제**: Linux 바이너리가 배포에 포함되지 않을 수 있음

**확인 필요:**
- `ffprobe-static` 패키지가 Linux 바이너리를 포함하는지
- 배포 시 Linux 바이너리가 포함되는지

---

### 문제 2: tmpdir() 경로 차이 ⚠️⚠️⚠️

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
- 다른 경로 사용 시 권한 오류 가능

**해결:**
```typescript
// Lambda 환경 감지 및 /tmp 강제 사용
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME
const workDir = isVercel ? '/tmp' : tmpdir()
```

---

### 문제 3: 바이너리 파일 크기 제한 ⚠️⚠️⚠️

**바이너리 크기:**
- FFmpeg: ~80MB
- FFprobe: ~60MB
- 총: ~140MB

**문제:**
- Vercel은 배포 크기 제한이 있음
- 큰 바이너리 파일이 배포에서 제외될 수 있음
- `node_modules`의 큰 파일이 번들에서 제외될 수 있음

**확인:**
- Vercel 배포 로그에서 바이너리 파일 포함 여부 확인
- 빌드 후 실제 파일 크기 확인

---

### 문제 4: 바이너리 실행 권한 ⚠️⚠️⚠️

**문제:**
- Lambda 환경에서는 바이너리 파일에 실행 권한이 없을 수 있음
- chmod 실행 불가

**해결:**
- 바이너리 파일을 `/tmp`에 복사 후 실행 권한 부여 시도
- 또는 다른 접근 방법 사용

---

### 문제 5: 파일 시스템 접근 제한 ⚠️⚠️

**문제:**
- Lambda는 `/var/task` (코드 위치)는 읽기 전용
- `/tmp`만 쓰기 가능 (512MB 제한)
- 임시 파일 생성 위치 제한

**현재 코드:**
```typescript
const workDir = tmpdir()  // Lambda에서 /tmp 반환하는지 확인 필요
```

---

## 🔍 확인해야 할 사항

### 1. Vercel 함수 로그 확인

Vercel 대시보드 → Functions → `/api/generate-audio` → Logs:

**확인할 로그:**
```
[FFmpeg] 플랫폼: linux
[FFmpeg] FFmpeg 경로: ...
[FFmpeg] 파일 존재: true/false
[BGM 믹싱] 시작: ...
```

### 2. 에러 메시지 확인

다음과 같은 에러가 발생할 수 있음:
- `ENOENT` - 파일을 찾을 수 없음
- `EACCES` - 실행 권한 없음
- `ENOSPC` - 디스크 공간 부족 (/tmp 512MB 제한)
- `ETIMEDOUT` - 타임아웃

---

## 🛠️ 즉시 적용 가능한 해결책

### 해결책 1: Lambda 환경 감지 및 /tmp 강제 사용

```typescript
// Lambda/Vercel 환경 감지
const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV
const workDir = isVercel ? '/tmp' : tmpdir()

console.log('[환경] 플랫폼:', process.platform)
console.log('[환경] Vercel:', isVercel)
console.log('[환경] 작업 디렉토리:', workDir)
```

### 해결책 2: 플랫폼별 바이너리 경로 확인

```typescript
function getFfprobePath(): string | null {
  // ...
  const platform = process.platform
  console.log('[FFprobe] 플랫폼:', platform)
  
  // Linux 바이너리 경로도 확인
  if (platform === 'linux') {
    const linuxPath = path.join(projectRoot, 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x64', 'ffprobe')
    if (fsSync.existsSync(linuxPath)) {
      return linuxPath
    }
  }
  // ...
}
```

### 해결책 3: 실행 권한 설정 시도

```typescript
if (isVercel && ffmpegPath) {
  // 실행 권한 설정 시도
  try {
    await fs.chmod(ffmpegPath, 0o755)  // 실행 권한 부여
    await fs.chmod(ffprobePath, 0o755)
  } catch (err) {
    console.warn('[FFmpeg] chmod 실패 (무시 가능):', err.message)
  }
}
```

---

**다음 단계**: Vercel 함수 로그를 확인하여 정확한 원인 파악

