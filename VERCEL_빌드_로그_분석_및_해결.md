# 🔍 Vercel 빌드 로그 분석 및 해결

## 📊 발견된 문제

### 문제 1: FFmpeg 경로 ⚠️⚠️⚠️

**로그:**
```
[FFmpeg] 방법 1-1: FFmpeg가 문자열 타입입니다: /vercel/path0/.next/server/app/api/generate-audio/ffmpeg
[FFmpeg] ⚠️  방법 1 경로가 존재하지 않음: /vercel/path0/.next/server/app/api/generate-audio/ffmpeg
```

**문제:**
- `ffmpeg-static` 패키지가 잘못된 경로를 반환
- 실제 경로: `/vercel/path0/node_modules/ffmpeg-static/ffmpeg` (Linux)
- `process.cwd()`가 `.next/server/app/api/generate-audio`를 반환

---

### 문제 2: FFprobe 경로 ⚠️⚠️⚠️⚠️

**로그:**
```
[FFmpeg] 방법 1-2: FFprobe 객체에서 path 추출: /vercel/path0/.next/server/app/api/generate-audio/bin/linux/x64/ffprobe
[FFmpeg] ⚠️  방법 1 경로가 존재하지 않음
[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 - /vercel/path0/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe
```

**문제:**
- **Linux 환경인데 Windows `.exe` 바이너리를 찾고 있음!**
- Linux 바이너리를 찾지 못하고 Windows 바이너리를 선택
- 실제 필요한 경로: `/vercel/path0/node_modules/ffprobe-static/bin/linux/x64/ffprobe`

---

## 🔍 근본 원인

### 1. `process.cwd()` 경로 문제

**빌드 시점:**
- `process.cwd()` → `.next/server/app/api/generate-audio`
- 실제 프로젝트 루트 → `/vercel/path0`

**해결:**
- 여러 가능한 루트 경로 시도
- `/var/task`, `/vercel/path0` 등 직접 경로 확인

### 2. 플랫폼별 바이너리 우선순위 문제

**현재:**
- Windows 바이너리 경로가 Linux 바이너리보다 먼저 확인됨

**해결:**
- Linux 환경에서는 Linux 바이너리만 확인
- Windows 바이너리 경로 제외

---

## ✅ 적용된 해결책

### 1. 여러 루트 경로 시도 ✅

```typescript
const possibleRoots = [
  process.cwd(),
  process.cwd().replace(/\.next\/server.*$/, ''),
  process.cwd().replace(/app\/api\/generate-audio.*$/, ''),
  '/var/task', // Lambda 기본 경로
  '/vercel/path0', // Vercel 경로
]
```

### 2. 플랫폼별 바이너리만 확인 ✅

```typescript
if (platform === 'linux') {
  // Linux 환경에서는 Linux 바이너리만 확인 (Windows 바이너리 제외)
  possiblePaths.push(
    path.join(root, 'node_modules', 'ffprobe-static', 'bin', 'linux', 'x64', 'ffprobe'),
  )
}
```

### 3. Windows 바이너리 경로 제외 ✅

- Linux 환경에서 Windows `.exe` 바이너리 경로 확인하지 않음

---

## 🧪 예상 결과

**수정 후 예상 로그:**
```
[FFmpeg] 플랫폼: linux
[FFmpeg] process.cwd(): /vercel/path0/.next/server/app/api/generate-audio
[FFmpeg] ✅ 방법 2 성공: 직접 경로 구성 - /vercel/path0/node_modules/ffmpeg-static/bin/linux/x64/ffmpeg

[FFprobe] 플랫폼: linux
[FFprobe] ✅ 방법 2 성공: 직접 경로 구성 - /vercel/path0/node_modules/ffprobe-static/bin/linux/x64/ffprobe
```

---

**이제 Linux 환경에서 Linux 바이너리만 찾도록 수정되었습니다!**

