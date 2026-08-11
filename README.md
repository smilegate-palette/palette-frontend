# palette-frontend

팔레트 유스 창작 플랫폼(스마일게이트 Hope Creator Alumni 프로토타입) 프론트엔드입니다.

## 기술 스택

- React 18 + TypeScript + Vite
- react-router-dom (클라이언트 사이드 라우팅)
- Tailwind CSS (2026.08 Figma 실제 시안 기준 확정: 배경 흰색 / 히어로·비활성칩 회색(#ececec) / 카드 #f7f7f7 / 포인트 노란색 #ffd400 / 텍스트 순검정 / 폰트 Pretendard)
- 배포: Naver Cloud Object Storage + CDN, GitHub Actions로 자동 배포 예정 (기획 문서 기준)
- 인증: 자체 JWT 로그인/회원가입 연동 완료(`/api/login`, `/api/signup` 등). 로그인 성공 시 받은 accesstoken을 localStorage에 저장하고, 이후 모든 API 요청에 `Authorization: Bearer` 헤더로 자동 첨부. 카카오/네이버/구글 소셜로그인은 백엔드에 엔드포인트가 아직 없어서 미연동

## 시작하기

```bash
git clone https://github.com/suhyeonboo/palette-frontend.git
cd palette-frontend
npm install
cp .env.example .env.local
npm run dev
```

## 폴더 구조

```
src/
  main.tsx            # 앱 엔트리 (BrowserRouter)
  App.tsx             # 라우트 정의
  pages/               # 화면 단위 컴포넌트
    HomePage.tsx
    ProjectListPage.tsx
    ProjectDetailPage.tsx
    AboutPalettePage.tsx
    OffTheRecordPage.tsx
    LoginPage.tsx
    SignupPage.tsx
    NotFoundPage.tsx
  components/           # 재사용 컴포넌트
    layout/             # Header, Layout(Outlet)
    home/                # HeroSlider, CurationRow
    project/             # CommentSection
    common/              # ProjectCard, ProjectGridCard
  lib/
    api/                 # API 클라이언트 (auth.ts, projects.ts, comments.ts, client.ts)
    auth/                 # 로그인 세션 저장(token.ts) + AuthContext
    types/                # 타입 정의
  data/
    mockProjects.ts       # 백엔드 미완성 API용 mock 데이터
```

## 현재 상태 / mock 데이터 안내

**2026.08.11부터 실제 배포 서버(`http://129.225.197.4:8080`)에 연결해서 실행 중입니다.**
`.env.local`이 `VITE_USE_MOCK=false`로 설정되어 있어서, 프로젝트 목록(HOME/PROJECT)은 실제 API를 호출합니다.
다만 상세 조회·댓글·좋아요·홈 큐레이션은 백엔드에 아직 해당 엔드포인트가 없어서, `VITE_USE_MOCK` 값과 무관하게
코드에서 자동으로 mock 데이터를 씁니다 (`src/lib/api/*.ts`에 각각 표시해둠). 엔드포인트가 추가되면 하나씩 실제 연동으로 전환하면 됩니다.

실제 API 응답 필드는 snake_case(`project_title`, `program_name`, `like_count` 등)라
`src/lib/api/projects.ts`의 `mapProjectResponse`에서 camelCase로 변환합니다. 다만 지금은 등록된 프로젝트가
없어서(업로드 폼이 아직 없음) 실제 응답 예시로 검증은 못 했고, 등록용 스키마 필드명 기준으로 추정 매핑해둔
상태입니다 - 실제 데이터 들어오면 꼭 다시 확인해주세요.

이 프로젝트는 SSR 없이 클라이언트 사이드 렌더링(CSR)만 사용합니다. SEO가 중요해지면
Next.js 등 SSR 프레임워크로 전환을 다시 검토해야 할 수 있어요.

## 기능 우선순위 (구축 기획(안) 기준)

- P0(1차 필수): HOME, PROJECT 목록/상세, 업로드폼, 로그인/마이페이지 기본, 관리자 승인/반려/비공개, 기본 댓글
- P1(가능하면 포함): 좋아요, 댓글 이모티콘, 이메일 알림, 관리자 직접 수정, HOME 큐레이션/배너 관리
- P2(1차 이후): 대댓글, 댓글 카테고리, 큐레이션/통계 고도화, 운영 자동화

## 백엔드/기획 쪽에 확인이 필요한 것들 (TODO)

필터 체계, 사이트맵, 플로우, 권한 매트릭스, 1차 구축 일정은 구축 기획(안) 문서로 확정되어 반영 완료했습니다.
2026.08 배포된 실제 Swagger(`http://129.225.197.4:8080/v3/api-docs`)도 확인했습니다 - `/api/project/index` → `/api/project`로 실제 경로 수정 반영함. 남은 항목:

- [ ] **어떤 엔드포인트가 로그인(JWT) 필요한지 명확히 정리 부탁드려요** - `GET /api/project`(프로젝트 목록, 비로그인 방문자도 봐야 하는 공개 화면)에서 로그인 여부를 확인하는 것 같은 동작이 있어서 로그인/인증 헤더 붙이는 작업을 먼저 했어요. 근데 원래 기획상 HOME/PROJECT 목록은 비로그인도 볼 수 있어야 하는 화면이라, 목록 조회까지 로그인이 필수인 게 의도한 정책인지 확인 필요합니다
- [ ] `ProjectRequest.partipants` 필드 오타 (participants여야 함)
- [ ] `ProjectRequest.category`가 단일 값인데 기획은 다중 선택 - 확인 필요
- [ ] 로그인 응답에 `password` 필드가 노출됨 - 보안 이슈 (프론트에서 로그인 연동은 완료했고, 응답의 password 값은 저장하지 않고 버리도록 처리해뒀습니다)
- [ ] 로그인 응답에 `user_id`가 없음 - 프로젝트 등록 시 필요한데 어디서 받는지 확인 필요
- [ ] `GET /api/project` 쿼리 파라미터(연도/형태/지역/검색어/정렬) 아직 없음
- [ ] 상세 조회, 댓글, 관리자 엔드포인트 아직 Swagger에 없음
- [ ] `GET /api`(operationId: `home`)가 홈 큐레이션용이 맞는지 확인 필요 - 예전엔 `/api/home/project`로 알고 있었는데 실제 스펙엔 이 경로만 있어서 일단 이걸로 연결해뒀음
- [ ] 소셜로그인(카카오/네이버/구글) 엔드포인트 아직 안 보임, 이메일/비밀번호 자체 JWT만 확인됨
- [ ] URL 오타: `/api/project/{proejct_id}`, `/api/{user_id)/login`
- [ ] "응원해요" 좋아요, 댓글 이모티콘 API 스펙 (P1)
- [ ] DB 스키마 (dbdiagram.io) 실제 테이블/컬럼 구조
- [ ] 미디어 업로드 처리 방식 (YouTube/Vimeo 임베드, 파일 업로드 100MB 이하, 웹 링크 iframe - 저장/허용 도메인 정책)
- [ ] 로그인 정책: 희망스튜디오 계정 + 카카오/네이버/구글, 프론트 필요 값(client id, redirect uri 등)
- [ ] DB가 Supabase(CI/CD 문서)인지 Naver Cloud PostgreSQL(구축 기획안)인지 최신 기준 확인
- [ ] 저장소 주소 확정 (`github.com/ChaeheunKim/smilegate`를 그대로 쓸지)
- [ ] 형태 필터 라벨이 문서 내에서 영어(GAME/AI/VIDEO..., mockup 기준)와 한글(게임/AI/영상..., 텍스트 설명 기준)로 갈려 있음 - 우선 mockup 기준 영어로 구현
- [ ] 히어로 롤링 개수: 킥오프 문서(11개 전체 순환) vs 구축 기획안(3~5개) 불일치

## 디자인 관련 미확정 항목

**2026.08 Figma 실제 파일(권한 확인 완료, node 3:3 HOME / node 8:63 PROJECT 목록) 기준으로 색상 재확인 완료했습니다.**
이전에 문서 텍스트 설명만 보고 추정했던 값들이 실제와 달라서 아래처럼 정정했습니다:

| 항목 | 이전 추정값 | 실제 Figma 값 |
| --- | --- | --- |
| 페이지 배경 | 밝은 회색 `#f5f5f5` | **흰색** `#ffffff` (회색은 히어로 배너 등 일부 블록에만 사용, `#ececec`) |
| 포인트 노란색 | `#ffc700` (미확인) | **`#ffd400`** (확인 완료) |
| 텍스트 | `#1f2124` | **순검정** `#000000` |
| 보조 텍스트 | `#6b7280` | **`#707070`** |
| GNB 헤더 배경 | (미정) | **`#fffced`** (크림색) |
| 카드 배경 | 흰색 | **`#f7f7f7`** |
| 검색창/드롭다운 배경 | 흰색 | **`#f9f9f9`** |

또한 PROJECT 목록 카드가 HOME 큐레이션 카드와 시각적으로 다른 패턴이라는 걸 확인해서
`ProjectGridCard.tsx`를 새로 만들었습니다 (HOME은 이미지 위 흰 글씨 오버레이, PROJECT 목록은 카드 배경 위 이미지+검정 텍스트).
필터 칩도 테두리 없는 solid 스타일로 수정했습니다.

**로고 이미지 관련 안내**: Figma에서 로고 PNG 에셋 자체는 제가 있는 환경(샌드박스)의 네트워크 제한 때문에 다운로드하지 못했습니다.
`Header.tsx`는 `public/logo.png`를 불러오도록 만들어뒀고, 파일이 없으면 "PALETTE" 텍스트로 대체 표시됩니다.
수현님이 Figma에서 로고 레이어 선택 → Export → PNG로 내보내서 `palette-frontend/public/logo.png`에 넣어주시면 자동으로 반영돼요.

아직 남은 것:

- [ ] 썸네일 카드 규격 (1:1 vs 3:4, 현재 4:3 임시 적용)
- [ ] 히어로 배너 배경 이미지/영상 실제 소스
- [ ] 상세 모달 vs 페이지 방식 (현재는 페이지 방식으로 구현됨)
- [ ] ABOUT PALETTE 타이포그래피 체계 (팔레트 측 콘텐츠 전달 후 후순위)
- [ ] 업로드 폼 리치 텍스트 에디터 선택 (Quill.js vs TipTap)
- [ ] PROJECT 상세 페이지(node 12:333)는 아직 픽셀 단위로 검증 안 함 - 현재는 목록 페이지 스타일과 일관되게 추정 구현
