# 자동 배포 안내

## 현재 상황

Vercel CLI로 배포를 시도했지만, 파일 크기 제한(2GB) 때문에 실패했습니다.
이는 `node_modules` 폴더가 포함되어 있기 때문입니다.

## 해결 방법

### 방법 1: Git 사용 (추천) ⭐

Vercel은 Git 저장소와 연동하면 자동으로 `node_modules`를 제외합니다.

1. **Git 설치**
   - https://git-scm.com/download/win 에서 Git 다운로드
   - 설치 후 터미널 재시작

2. **Git 저장소 초기화**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **GitHub에 푸시**
   ```bash
   # GitHub에서 새 저장소 생성 후
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

4. **Vercel 웹사이트에서 배포**
   - https://vercel.com 접속
   - GitHub 저장소 연결
   - 자동 배포 완료!

### 방법 2: Vercel 웹사이트에서 직접 배포

1. **코드 압축**
   - `node_modules` 폴더 제외하고 압축
   - 또는 GitHub에 푸시 후 Vercel에서 import

2. **Vercel 대시보드**
   - https://vercel.com 접속
   - "Add New Project"
   - GitHub 저장소 선택 또는 직접 업로드

## 빠른 해결책

가장 빠른 방법은 **GitHub에 코드를 푸시**하고 **Vercel 웹사이트에서 배포**하는 것입니다.

1. GitHub 계정이 있다면:
   - 새 저장소 생성
   - 코드 업로드
   - Vercel에서 import

2. GitHub 계정이 없다면:
   - 무료로 가입 (https://github.com)
   - 위 과정 진행

## 다음 단계

Git을 설치하시거나 GitHub에 코드를 업로드하시면, 제가 배포를 완료해드릴 수 있습니다!

