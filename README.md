# IMLab 홈페이지

이화여자대학교 Information Management Lab. 홈페이지 소스입니다. [Astro](https://astro.build/)로 만든 정적 사이트이며, `main` 브랜치에 push하면 GitHub Actions가 빌드해서 GitHub Pages(https://imlab-ewha.github.io)에 배포합니다.

디자인과 데이터는 팀원이 Python으로 만든 시제품(`/home/imlab/imlab-ewha`)에서 가져왔습니다. 처음 옮길 때 153개 페이지 모두 시제품과 글자·링크·화면이 같은지 확인했습니다. 시제품의 상단 "prototype" 안내 띠와 검토용 Review guide 페이지는 옮기지 않았습니다.

## 내용 수정

글과 목록은 모두 `src/content/`에 있습니다. 파일을 고치고 push하면 사이트에 반영됩니다.

| 파일 | 내용 | 비고 |
| --- | --- | --- |
| `people/<id>.yaml` | 구성원 1명당 파일 1개 | 파일 이름이 주소가 됩니다 (`/people/<id>/`). `order`가 작을수록 앞에 나옵니다. |
| `news.yaml` | 소식 | 날짜(`YYYY-MM`) 최신순으로 표시. 같은 달이면 파일 순서대로. |
| `publications.yaml` | 논문·특허·소프트웨어 | 파일 순서대로 표시 |
| `projects.yaml` | 연구 과제 | 파일 순서대로 표시 |
| `research.yaml` | 연구 분야 | `match_pattern`(정규식)으로 관련 과제·논문을 자동 연결 |
| `courses.yaml` | 학기별 강의 | 현재 학기는 빌드 날짜로 자동 판단 (8~2월 가을, 3~7월 봄) |
| `supporters.yaml` | 홈 하단 지원 기관 로고 | |
| `settings.yaml` | 연락처 이메일, 주소, 지도 링크 | |

각 항목에 들어갈 수 있는 값은 `src/content.config.ts`에 정의되어 있습니다. 필수 항목이 빠지거나 값이 틀리면(예: 날짜 형식, category 오타) 빌드가 멈추고 어느 파일이 문제인지 알려 줍니다.

사진과 로고는 `public/assets/images/`에 넣고, YAML에는 `/assets/images/파일이름` 형태로 적습니다.

## 디자인 수정

| 위치 | 내용 |
| --- | --- |
| `src/layouts/DesignedLayout.astro` | 새 디자인 페이지의 공통 틀 (홈, Research Areas, People, 교수 프로필, Publications) |
| `src/layouts/PrototypeLayout.astro` | 아직 시제품 디자인인 페이지의 공통 틀 (졸업생, 학생 프로필, Projects, News & Media, Courses, 404) |
| `src/pages/` | 페이지별 구성. 폴더 구조가 곧 주소입니다. |
| `src/components/` | 여러 페이지에서 쓰는 조각 (구성원 카드, 논문 목록, 푸터 등) |
| `src/lib/site.ts` | 데이터 읽기, 라벨, 문장 나누기 같은 공용 함수 |
| `public/assets/` | CSS, JS, 폰트, 일러스트, 사진 (그대로 복사되어 배포) |

## 내 컴퓨터에서 미리보기

Node.js 24가 필요합니다 (`.nvmrc`). nvm을 쓴다면:

```bash
nvm use            # .nvmrc의 Node 24로 전환
npm install        # 처음 한 번
npm run dev        # http://localhost:4321 에서 미리보기 (저장하면 자동 새로고침)
```

배포 전에 확인할 때:

```bash
npm run build      # dist/ 에 완성된 사이트 생성
npm run check      # 타입 검사
npm run preview    # 빌드 결과 미리보기
```

## 배포

`.github/workflows/deploy.yml`이 `main` 브랜치 push마다 빌드하고 배포합니다. 저장소 Settings → Pages → Build and deployment → Source가 **GitHub Actions**로 설정되어 있어야 합니다.
