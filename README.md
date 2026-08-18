# palette-frontend

팔레트 유스 창작 플랫폼(스마일게이트 Hope Creator Alumni 프로토타입) 프론트엔드

## 기술 스택

- React 18 + TypeScript + Vite
- react-router-dom (클라이언트 사이드 라우팅, SSR 없음 - CSR만 사용)
- Tailwind CSS (2026.08 Figma 실제 시안 기준 색상/그림자 확정)
- 배포: Naver Cloud Object Storage + CDN, GitHub Actions로 자동 배포 예정 (기획 문서 기준, 아직 설정 전)
- 인증: 자체 JWT (`/api/login`, `/api/signup` 등 연동 완료)

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
  main.tsx              # 앱 엔트리 (BrowserRouter + AuthProvider)
  App.tsx                # 라우트 정의
  pages/
    HomePage.tsx
    ProjectListPage.tsx
    ProjectDetailPage.tsx
    AboutPalettePage.tsx
    OffTheRecordPage.tsx
    LoginPage.tsx
    SignupPage.tsx
    SocialCallbackPage.tsx  # 소셜로그인 콜백(/auth/callback/:provider)
    NotFoundPage.tsx
  components/
    layout/               # Header, Layout(Outlet)
    home/                  # HeroSlider, CurationRow
    project/               # CommentSection
    common/                # ProjectCard(홈), ProjectGridCard(목록)
  lib/
    api/                   # auth.ts, projects.ts, comments.ts, client.ts
    auth/                   # token.ts(세션 저장), AuthContext.tsx, oauth.ts(소셜로그인 URL)
    types/                  # 타입 정의
  data/
    mockProjects.ts         # 백엔드 미완성 API용 mock 데이터
```

## 완성된 것

- **화면 4개 뼈대**: HOME / PROJECT 목록·상세 / ABOUT PALETTE / off the record
- **Figma 실제 디자인 반영**: 색상 토큰(배경 흰색, 포인트 노란색 `#ffd400`, 카드 `#f7f7f7` 등 `tailwind.config.ts` 참고), 그림자(`shadow-soft`/`shadow-strong`/`shadow-card`), 카드 간격(20px), PROJECT 목록 전용 카드 스타일(`ProjectGridCard`)
- **로고**: Figma에서 받은 이미지를 흰 배경 투명 처리해서 `public/logo.png`로 적용, 헤더에서 자동 로드
- **로그인/회원가입(자체 JWT)**: `/api/login`, `/api/signup`(+이메일 인증코드) 연동 완료. 로그인 시 토큰을 localStorage에 저장하고 이후 모든 API 요청에 자동으로 `Authorization: Bearer` 첨부. 401 시 자동 로그아웃 처리
- **소셜로그인(카카오/네이버) 프론트 구조**: 로그인 버튼, 리다이렉트, 콜백 페이지까지 스캐폴딩 완료. 카카오/네이버 client id는 `.env.local`에 등록 완료. 백엔드 교환 엔드포인트만 완성되면 바로 동작 (아래 TODO 참고). 
- **실제 백엔드 연동**: PROJECT 목록 조회(`GET /api/project`)가 mock이 아닌 실제 배포 서버(`129.225.197.4:8080`)를 호출. 응답 snake_case → camelCase 매핑(`mapProjectResponse`) 적용
- **검색/필터**: 연도·프로그램·형태·검색어·정렬 구현 (지역 필터는 요청에 따라 제거 - 지역 정보는 프로젝트 상세 페이지에서만 노출)
- **댓글, "응원해요" 좋아요, 프로젝트 설명 더보기/접기, 반응형 그리드**: 기본 UI/동작 구현 (백엔드 엔드포인트 없어서 현재는 mock으로 동작)

## 아직 mock인 부분

백엔드에 아직 해당 엔드포인트가 없어서, `VITE_USE_MOCK` 값과 무관하게 코드에서 자동으로 mock을 사용하도록 처리해뒀습니다 (`src/lib/api/*.ts`에 각각 표시):

- 프로젝트 상세 조회
- 댓글 조회/등록
- 좋아요
- 홈 큐레이션 (`GET /api`를 시도는 하지만 실제 데이터 형태 미확인)

엔드포인트가 추가되면 해당 함수의 mock 우선 로직만 지우면 바로 실제 연동으로 전환됩니다.

## 백엔드 확인 필요 (TODO)

- [ ] **`GET /api/project`가 비로그인 상태에서 401이 나는 게 의도한 정책인지** - 원래 HOME/PROJECT 목록은 비로그인도 봐야 하는 공개 화면이라 확인 필요
- [ ] **소셜로그인 엔드포인트 정확한 스펙** - 지금은 `POST /api/login/{provider}`에 `{ code, redirectUri }`로 가정해서 만들어둠
- [ ] `ProjectRequest.partipants` 필드 오타 (participants여야 함)
- [ ] `ProjectRequest.category`가 단일 값인데 기획은 다중 선택 - 확인 필요
- [ ] 로그인 응답에 `password` 필드 노출 - 보안 이슈 (프론트에서는 저장 안 하고 버림)
- [ ] 로그인 응답에 `user_id` 없음 - 프로젝트 등록 시 필요
- [ ] `GET /api/project` 쿼리 파라미터(연도/형태/검색어/정렬) 아직 없음
- [ ] 상세 조회, 댓글, 관리자 엔드포인트 아직 Swagger에 없음
- [ ] "응원해요" 좋아요, 댓글 이모티콘 API 스펙 (P1)
- [ ] DB 스키마(dbdiagram.io) 실제 테이블/컬럼 구조
- [ ] 미디어 업로드 처리 방식 (YouTube/Vimeo 임베드, 파일 업로드, 웹 링크 iframe)
- [ ] DB가 Supabase인지 Naver Cloud PostgreSQL인지 최신 기준 확인
- [ ] 형태 필터 라벨 영어(GAME/AI...) vs 한글(게임/AI...) - 우선 영어로 구현
- [ ] 히어로 롤링 개수: 킥오프 문서(11개 전체 순환) vs 구축 기획안(3~5개) 불일치

## 디자인 관련 남은 것

- [ ] 썸네일 카드 규격 (1:1 vs 3:4, 현재 4:3 임시 적용)
- [ ] 히어로 배너 배경 이미지/영상 실제 소스 (Figma에도 아직 회색 placeholder만 있음)
- [ ] ABOUT PALETTE 타이포그래피 체계 (팔레트 측 콘텐츠 전달 후 후순위)
- [ ] 업로드 폼 리치 텍스트 에디터 선택 (Quill.js vs TipTap)
- [ ] PROJECT 상세 페이지(node 12:333)는 아직 픽셀 단위로 검증 안 함

## 기능 우선순위 (구축 기획(안) 기준)

- P0(1차 필수): HOME, PROJECT 목록/상세, 업로드폼, 로그인/마이페이지 기본, 관리자 승인/반려/비공개, 기본 댓글
- P1(가능하면 포함): 좋아요, 댓글 이모티콘, 이메일 알림, 관리자 직접 수정, HOME 큐레이션/배너 관리
- P2(1차 이후): 대댓글, 댓글 카테고리, 큐레이션/통계 고도화, 운영 자동화
