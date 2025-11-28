# FFmpeg 설치 가이드

## 현재 상황
받으신 `ffmpeg-8.0.1.tar` 파일은 소스 코드입니다. Windows에서 사용하려면 빌드된 실행 파일(바이너리)이 필요합니다.

## Windows용 FFmpeg 다운로드 방법

### 방법 1: 공식 빌드 다운로드 (권장)

1. 다음 중 하나의 링크에서 다운로드:
   - **공식 빌드**: https://www.gyan.dev/ffmpeg/builds/
     - `ffmpeg-release-essentials.zip` 다운로드
   - **GitHub 빌드**: https://github.com/BtbN/FFmpeg-Builds/releases
     - `ffmpeg-master-latest-win64-gpl.zip` 다운로드

2. 다운로드한 zip 파일을 프로젝트 폴더에 압축 해제:
   ```
   C:\Users\user\Desktop\ceosoop3\ffmpeg-bin\
   ```

3. 압축 해제 후 구조:
   ```
   ffmpeg-bin/
   └── bin/
       ├── ffmpeg.exe
       ├── ffplay.exe
       └── ffprobe.exe
   ```

### 방법 2: Chocolatey로 설치 (선택사항)

PowerShell 관리자 권한으로 실행:
```powershell
choco install ffmpeg
```

## 확인 방법

다음 명령어로 확인:
```powershell
ffmpeg -version
```

또는 프로젝트 폴더에서:
```powershell
.\ffmpeg-bin\bin\ffmpeg.exe -version
```

## 설정 완료 후

프로젝트를 다시 시작하면 BGM 믹싱 기능을 사용할 수 있습니다.

## 참고

- 소스 코드(`ffmpeg-8.0.1.tar`)는 빌드가 필요하므로 Windows에서는 사용하기 어렵습니다.
- 미리 빌드된 바이너리를 다운로드하는 것이 가장 간단합니다.



