# ARCHI

브라우저에서 실행하는 HTML/CSS/JavaScript 기반 게임입니다.

- **바로 플레이:** https://hwanghj09.github.io/ARCHI/
- **저장소:** https://github.com/hwanghj09/ARCHI

## 1. 실행 전 준비

게임을 로컬에서 실행하려면 다음 프로그램이 필요합니다.

| 프로그램 | 용도 | 설치 안내 |
| --- | --- | --- |
| Git | 저장소 다운로드 및 업데이트 | [Git 다운로드](https://git-scm.com/downloads) |
| Python 3 | 로컬 웹 서버 실행 | [Python 다운로드](https://www.python.org/downloads/) |
| 최신 웹 브라우저 | 게임 실행 | Chrome 또는 Edge 권장 |

**게임 플레이에는 Node.js, npm 패키지 설치, 별도 빌드, 데이터베이스, API 키나 `.env` 설정이 필요하지 않습니다.** Node.js와 npm은 아래의 개발·테스트 작업을 할 때만 필요합니다.

설치 후 터미널을 새로 열어 아래 명령으로 확인합니다.

```sh
git --version
```

Windows에서는 PowerShell 또는 명령 프롬프트에서 확인합니다.

```powershell
py -3 --version
```

macOS/Linux에서는 터미널에서 확인합니다.

```sh
python3 --version
```

Windows에서 `py` 명령을 찾지 못하지만 `python --version`이 Python 3 버전을 표시한다면, 이후의 `py -3` 대신 `python`을 사용하면 됩니다. Python 설치 시 PATH 등록 옵션을 선택하고, 설치 후 터미널을 다시 열어 주세요.

## 2. 저장소 받기

프로젝트를 저장할 폴더에서 아래 명령을 순서대로 실행합니다. Windows, macOS, Linux 모두 동일합니다.

```sh
git clone https://github.com/hwanghj09/ARCHI.git
cd ARCHI
```

이미지와 오디오 파일이 포함되어 있어 다운로드에 시간이 걸릴 수 있습니다. clone이 완료된 뒤 다음 단계로 진행하세요.

이후 명령은 모두 **`ARCHI` 폴더 안에서** 실행합니다. 해당 폴더에 `index.html`, `assets/`, `css/`, `js/`, `package.json`이 보이면 올바른 위치입니다.

## 3. 로컬 서버 실행

### Windows

PowerShell 또는 명령 프롬프트에서 실행합니다.

```powershell
py -3 -m http.server 8123 --bind 127.0.0.1
```

`python` 명령을 사용하는 환경이라면 다음과 같이 실행합니다.

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

### macOS / Linux

```sh
python3 -m http.server 8123 --bind 127.0.0.1
```

터미널에 `Serving HTTP on 127.0.0.1 port 8123 ...`과 비슷한 메시지가 나오면 서버가 실행된 상태입니다. 이 터미널은 게임을 하는 동안 열어 두세요. 서버 실행만으로 브라우저가 자동으로 열리지는 않습니다.

### 브라우저에서 게임 열기

브라우저 주소창에 아래 주소를 입력합니다.

**http://127.0.0.1:8123/**

`http://127.0.0.1:8123/index.html`로 접속해도 같습니다. 메인 메뉴가 표시되면 정상적으로 실행된 것입니다. 새 게임을 시작하고, 조작법은 게임의 설정 메뉴에서 확인할 수 있습니다.

`index.html`을 더블클릭하는 `file://` 방식 대신 위의 HTTP 주소로 접속해 주세요. 로컬 웹 서버를 사용하면 브라우저의 로컬 파일 접근 제약을 피하고, 배포 환경과 같은 방식으로 리소스를 불러올 수 있습니다.

참고로 `archi.html`은 게임 세계관의 ARCHI 소개 페이지입니다. 게임 시작 페이지는 `index.html`입니다.

### 종료와 재실행

- **종료:** 서버를 실행한 터미널에서 `Ctrl+C`를 누릅니다.
- **재실행:** 터미널에서 `cd ARCHI`로 프로젝트 폴더에 들어간 뒤, 운영체제에 맞는 서버 명령을 다시 실행하고 같은 주소로 접속합니다. 이미 프로젝트 폴더에 있다면 `cd ARCHI`는 생략합니다.
- **수정 사항 확인:** 파일을 저장하고 브라우저에서 `Ctrl+R` 또는 macOS의 `Cmd+R`로 새로고침합니다. 별도 빌드 과정은 없습니다. 게임 화면의 `F5`는 개발·시연 단축키로 사용됩니다.

## 4. 최신 코드 받기

실행 중인 서버를 `Ctrl+C`로 종료한 뒤, 프로젝트 폴더에서 실행합니다.

```sh
git pull --ff-only
```

완료되면 서버를 다시 실행하고 브라우저를 새로고침합니다. 직접 수정한 파일 때문에 업데이트가 중단되면 변경 내용을 확인해 커밋하거나 보관한 뒤 다시 실행하세요.

## 5. 개발 및 테스트 (선택)

게임 실행만 필요하다면 이 절은 건너뛰어도 됩니다.

### 개발 도구 설치

[Node.js](https://nodejs.org/) 22 또는 24 LTS와 함께 제공되는 npm을 권장합니다. 현재 개발 의존성인 `sharp`는 Node.js **20.9.0 이상**을 요구합니다.

```sh
node --version
npm --version
```

프로젝트 폴더에서 lock 파일에 고정된 의존성을 설치합니다.

```sh
npm ci
```

`playwright`는 브라우저 테스트, `sharp`는 이미지 처리와 관련 테스트에 사용됩니다. 설치 과정의 `prepare` 스크립트는 이 저장소의 Git 훅 경로를 `.githooks`로 설정합니다. 이후 JavaScript 파일이나 `index.html`을 커밋할 때 스크립트 문법 검사가 실행됩니다.

### 스크립트 문법 검사

```sh
npm run test:syntax
```

`index.html`에서 참조하는 스크립트의 파일 존재 여부와 JavaScript 문법을 검사합니다. 이 검사는 Playwright 브라우저 설치 없이 실행할 수 있습니다.

### 브라우저 테스트 준비

브라우저 테스트를 실행하려면 Playwright용 Chromium을 별도로 설치합니다.

```sh
npx playwright install chromium
```

Linux에서 브라우저 실행에 필요한 시스템 라이브러리가 없다면 다음 명령을 사용합니다. 시스템 패키지 설치 과정에서 관리자 권한이 필요할 수 있습니다.

```sh
npx playwright install --with-deps chromium
```

### 테스트 실행

```sh
# 전체 테스트 (테스트 수가 많아 시간이 걸릴 수 있음)
npm test

# 특정 테스트만 실행하는 예시
npm run test:background-power
npm run test:interaction-sprites
npm run test:writing

# 개별 테스트 파일 직접 실행
node tests/main-menu.mjs
```

`npm test`는 `scripts/test.mjs`를 통해 테스트 파일을 순서대로 실행하고, 마지막에 통과한 파일 수를 출력합니다. 테스트 종류에 따라 `.local/`에 스크린샷 등의 결과물이 생성될 수 있습니다.

## 6. 자주 발생하는 문제

| 증상 | 확인 및 해결 방법 |
| --- | --- |
| `git`, `py`, `python3` 명령을 찾을 수 없음 | 해당 프로그램 설치와 PATH 설정을 확인하고 터미널을 다시 엽니다. Windows는 `py -3`, macOS/Linux는 `python3`를 먼저 확인하세요. |
| `Address already in use` 또는 포트 사용 오류 | 기존 서버를 종료하거나 서버 명령의 `8123`을 `8124` 등 다른 포트로 바꿉니다. 접속 주소도 `http://127.0.0.1:8124/`로 바꿔야 합니다. |
| 브라우저에서 연결할 수 없음 | 서버 터미널이 열려 있는지, 서버 오류가 없는지, 주소와 포트가 명령과 같은지 확인합니다. |
| 게임 대신 폴더 목록이 표시되거나 파일 요청이 404로 실패함 | 서버를 종료한 뒤 `index.html`이 있는 `ARCHI` 폴더로 이동해 다시 실행합니다. 게임 파일과 `assets/`, `css/`, `js/` 폴더를 함께 유지하세요. |
| 화면이나 이미지가 최신 코드와 다름 | Windows/Linux는 `Ctrl+Shift+R`, macOS는 `Cmd+Shift+R`로 강력 새로고침합니다. 개발자 도구의 Console과 Network에서 오류 및 404 요청을 확인하세요. |
| 소리가 나오지 않음 | 게임 화면을 클릭하고 게임 설정의 음량과 브라우저 탭 음소거 상태를 확인합니다. 브라우저는 사용자 입력 전의 오디오 재생을 제한할 수 있습니다. |
| 저장한 진행 상황이 보이지 않음 | 같은 브라우저 프로필과 같은 주소·포트로 접속했는지 확인합니다. 저장은 브라우저의 `localStorage`를 사용하므로 `localhost`와 `127.0.0.1`, 서로 다른 포트, 배포 사이트는 저장 공간이 다릅니다. 사이트 데이터를 지우면 저장 내용도 삭제됩니다. |
| `npm start` 또는 `npm run dev`에서 `Missing script` 발생 | 현재 프로젝트에는 두 스크립트가 없습니다. 위의 Python 웹 서버 명령으로 실행하세요. |
| 테스트에서 `Cannot find package` 또는 모듈 관련 오류 발생 | 프로젝트 폴더에서 `npm ci`를 실행했는지 확인합니다. `sharp` 설치 오류는 Node.js 버전도 확인하세요. |
| Playwright에서 `Executable doesn't exist` 발생 | `npm ci` 후 `npx playwright install chromium`을 실행합니다. Linux 시스템 라이브러리 오류는 `--with-deps` 설치 방법을 확인하세요. |

## 7. 주요 파일과 문서

| 경로 | 내용 |
| --- | --- |
| `index.html` | 게임 시작 페이지 |
| `archi.html` | 게임 세계관의 ARCHI 소개 페이지 |
| `js/` | 게임 로직 |
| `css/` | 화면과 UI 스타일 |
| `assets/` | 이미지, 오디오, 외부 라이브러리 등 게임 리소스 |
| `tests/` | 자동화 테스트 |
| `scripts/` | 테스트 실행 및 리소스 작업 스크립트 |
| [개발·시연 단축키](docs/단축키.md) | 개발 도구와 시연용 이동 기능 |

개발·시연 단축키는 진행 상태와 자동 저장을 바꿀 수 있으므로, 일반 플레이와 구분해 사용하세요.
