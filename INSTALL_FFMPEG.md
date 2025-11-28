# FFmpeg 설치 가이드

## FFmpeg가 필요한 이유
BGM과 TTS 음성을 믹싱하려면 FFmpeg가 필요합니다. FFmpeg가 없어도 TTS 음성은 생성할 수 있지만, BGM과 함께 사용하려면 설치가 필요합니다.

## 설치 방법

### 방법 1: 프로젝트 폴더에 설치 (권장)

1. **FFmpeg 다운로드**
   - https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
   - 또는: https://github.com/BtbN/FFmpeg-Builds/releases (Windows용)

2. **압축 해제**
   - 다운로드한 ZIP 파일을 압축 해제
   - `ffmpeg-release-essentials` 폴더의 내용을 프로젝트 폴더에 `ffmpeg-bin` 폴더로 복사
   - 최종 경로: `C:\Users\user\Desktop\ceosoop3\ffmpeg-bin\bin\ffmpeg.exe`

3. **폴더 구조 확인**
   ```
   ceosoop3/
   ├── ffmpeg-bin/
   │   ├── bin/
   │   │   ├── ffmpeg.exe
   │   │   ├── ffplay.exe
   │   │   └── ffprobe.exe
   │   └── ...
   └── ...
   ```

4. **설치 확인**
   ```powershell
   .\ffmpeg-bin\bin\ffmpeg.exe -version
   ```

### 방법 2: 시스템 전체 설치 (선택사항)

1. **FFmpeg 다운로드** (위와 동일)

2. **압축 해제**
   - 원하는 위치에 압축 해제 (예: `C:\ffmpeg`)

3. **환경 변수에 추가**
   - 시스템 환경 변수 `PATH`에 `C:\ffmpeg\bin` 추가
   - Windows 설정 → 시스템 → 고급 시스템 설정 → 환경 변수

4. **설치 확인**
   ```powershell
   ffmpeg -version
   ```

## 설치 후
FFmpeg를 설치한 후에는 애플리케이션을 재시작하면 자동으로 감지됩니다.

## BGM 없이 사용하기
FFmpeg가 없어도 TTS 음성은 생성할 수 있습니다. BGM 없이 사용하려면:
- "배경음악 (BGM)" 드롭다운에서 "배경음악 없음" 선택

