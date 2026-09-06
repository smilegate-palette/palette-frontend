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
    UploadPage.tsx          # 프로젝트 업로드 폼 (/project/upload)
    AboutPalettePage.tsx
    OffTheRecordPage.tsx
    LoginPage.tsx
    SignupPage.tsx
    SocialCallbackPage.tsx  # 소셜로그인 콜백(/auth/callback/:provider)
    AdminPage.tsx           # 관리자 승인/반려 (/admin)
    NotFoundPage.tsx
  components/
    layout/               # Header, Layout(Outlet)
    home/                  # HeroSlider, CurationRow
    project/               # CommentSection
    common/                # ProjectCard(홈), ProjectGridCard(목록)
  lib/
    api/                   # auth.ts, projects.ts, comments.ts, admin.ts, client.ts
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
- **소셜로그인(카카오/네이버) 프론트 구조**: 로그인 버튼, 리다이렉트, 콜백 페이지까지 스캐폴딩 완료. 카카오/네이버 client id는 `.env.local`에 등록 완료. 콜백 엔드포인트(`POST /api/{provider}/callback`)까지 실제 스펙대로 맞춰서 연동해뒀습니다 - 실제 로그인까지 되는지는 카카오/네이버 개발자센터 앱 등록(콜백 URL 포함)이 끝나야 테스트 가능해요
- **실제 백엔드 연동**: PROJECT 목록 조회(`GET /api/project`)가 mock이 아닌 실제 배포 서버(`129.225.197.4:8080`)를 호출. 응답 snake_case → camelCase 매핑(`mapProjectResponse`) 적용
- **검색/필터**: 연도·프로그램·형태·검색어·정렬 구현 (지역 필터는 요청에 따라 제거 - 지역 정보는 프로젝트 상세 페이지에서만 노출)
- **"응원해요" 좋아요 실제 연동, 프로젝트 설명 더보기/접기, 반응형 그리드**: 좋아요는 `POST/DELETE /api/project/{project_id}/like/{user_id}` 연동 완료 (다만 조회 API가 없어서 liked 표시는 로컬 세션 기준 - 위 TODO 참고)
- **관리자 페이지 1차 구현(`/admin`, `AdminPage.tsx`)**: 백엔드에 새로 생긴 admin-controller 연동. 승인 대기중인 프로젝트 목록을 보여주고, "승인"/"반려"(사유 입력) 처리 가능. 로그인 상태면 헤더에 "관리자" 링크가 보임
  - **로그인 응답에 role(USER/ADMIN) 정보가 없어서, 프론트에서 관리자인지 미리 구분할 방법이 없습니다.** 그래서 지금은 로그인만 되어 있으면 누구나 "관리자" 링크가 보이고, 실제 데이터는 백엔드가 401/403을 주는지에 의존해서 걸러집니다. role 정보가 응답에 추가되면 링크 노출도 그걸로 제어하는 게 안전해요
  - 큐레이션 순서 변경(`GET/POST /api/admin/{user_id}/curation`)은 드래그 앤 드롭 등 별도 UI가 필요해서 이번 1차 구현에는 빠졌습니다 - 승인/반려부터 먼저 만들었어요
  - 반려 사유는 기획 문서의 "부적절한 컨텐츠/정보 부족/기타" 선택지가 아직 확정 전이라 우선 자유 입력으로 구현
  - 대시보드 응답(`GET /api/admin/{user_id}`)도 제네릭 object라 실제 필드명은 추정치입니다 - 실제 데이터로 확인 필요
- **프로젝트 상세 조회, 댓글 조회/등록 실제 연동 완료**: `GET /api/project/{project_id}`, `GET /api/comment/{project_id}`, `POST /api/comment/{project_id}/{user_id}` 연동. 댓글 등록은 API 구조상 로그인이 필요해서, 비로그인 상태에서는 댓글 입력창 대신 로그인 유도 문구가 보이도록 처리 (아래 TODO 참고)
- **모바일 반응형(2026.08 Figma 모바일 시안 기준, node 52:3/52:324/52:384/52:645)**: HOME, PROJECT 목록, PROJECT 상세, 헤더까지 Tailwind `md:` 브레이크포인트로 대응 완료
  - 헤더: 모바일에서 햄버거 버튼 → 전체화면 메뉴(로그인 유도문구/닫기 + 세로 nav)로 전환, 데스크탑은 기존 가로 nav 유지
  - PROJECT 목록 카드 그리드: 모바일 2열 / 데스크탑 4열 (예전엔 모바일이 1열이었는데 실제 Figma 모바일 시안은 2열이라 수정)
  - HOME 히어로 캐러셀: 모바일에서는 좌우 카드를 숨기고 메인 카드만 보이는 단순화된 형태로 구현 (Figma는 좌우 카드가 살짝 겹쳐 보이는 구조인데, 폭이 좁아 완전히 동일하게 구현하려면 추가 작업 필요 - 아래 TODO 참고)
  - 검색창+정렬 드롭다운, 필터 칩, 카드 텍스트 등 전반적인 폰트/패딩 크기를 모바일 기준으로 축소
- **PROJECT 상세 페이지 Figma 정밀 반영(node 12:333 데스크탑 / 52:645 모바일)**: 메타 정보를 팀(노랑)/기관(빨강)/형태(청록)/참여자(초록) 색상 범례로 표시, 프로그램·연도·지역 pill 칩 추가
- **PROJECT 업로드 폼 신규 구현(node 60:2 데스크탑 / 63:343 모바일, `UploadPage.tsx`)**: 기본 정보/참여자 정보/프로젝트 설명/미디어 업로드/완료 5개 섹션을 한 페이지 스크롤 폼으로 구현, 상단 스텝 인디케이터는 장식용. 유형/참여자는 태그 입력(엔터로 추가). PROJECT 목록의 "+ 프로젝트 올리기" 버튼이 이 페이지로 연결되도록 수정, 비로그인 상태로 들어오면 로그인 유도 화면 표시
  - 미디어 업로드는 Figma엔 영상 URL/파일 업로드/웹 링크가 동시에 나열돼 있지만, 실제로 값이 하나만 저장되는 필드(`media_url`)라 탭처럼 하나만 선택하는 방식으로 구현했습니다
  - ~~유형(형태) 태그는 Figma대로 자유 입력~~ → 2026.09.06 백엔드 `category`가 고정 enum(GAME/AI/VIDEO...)이라 처음 설계대로 드롭다운 단일 선택으로 변경. 참여자는 여전히 자유 태그 입력(엔터로 추가) 방식 유지
- **초광폭 화면(풀스크린) 대응(node 89:2/90:272/90:500/91:583)**: 처음엔 Tailwind 기본 `2xl:`(1536px~)을 썼는데, 히어로 카드 확대 크기(640/540px)가 그 폭에서는 화면보다 넓어져서 페이지가 가로로 밀리는 버그가 있었어요. `tailwind.config.ts`에 커스텀 브레이크포인트 `3xl`(2000px~)을 추가해서 그 이상에서만 확장되도록 수정했습니다.
  - HOME 주제별 큐레이션: 5열 → 3xl 이상에서 7열로 확장
  - PROJECT 목록 카드 그리드: 4열 → 3xl 이상에서 6열로 확장
  - PROJECT 상세 페이지: **가운데 정렬된 좁은 컬럼(`max-w-4xl`)으로 만들었던 걸 제거하고, 다른 페이지들처럼 좌우 여백만 있는 꽉 찬 레이아웃으로 수정했습니다.** 풀스크린 시안을 보니 상세 페이지도 목록/홈처럼 화면을 꽉 채우는 구조였어요 (이전 구현이 실제 시안과 달랐던 부분)
  - HOME 히어로 캐러셀: 3xl 이상에서 카드 크기를 키움(중앙 360×640, 좌우 304×540, 시안 실측값). 다만 좌우 카드가 화면 밖으로 살짝 걸쳐 보이는 연출까지는 구현하지 않음(기존에 안내드린 모바일 캐러셀 단순화와 동일한 이유). 혹시 몰라 이 섹션엔 `overflow-x-hidden`을 걸어서, 크기 계산이 또 안 맞아도 페이지 전체가 밀리지 않고 이 영역 안에서만 잘리도록 안전장치를 추가함
  - ~~로그인 응답에 user_id가 없어서 등록 API를 정확한 값으로 호출할 방법이 없던 문제~~ → 백엔드에서 user_id를 내려주기 시작해서 해결. 로그인/소셜로그인 시 세션에 user_id를 같이 저장하고, `createProject`가 실제 user_id로 `POST /api/project/{user_id}`를 호출하도록 반영했습니다

## 아직 mock인 부분

백엔드에 아직 해당 엔드포인트가 없어서, `VITE_USE_MOCK` 값과 무관하게 코드에서 자동으로 mock을 사용하도록 처리해뒀습니다 (`src/lib/api/*.ts`에 각각 표시):

- 홈 큐레이션 (`GET /api`를 시도는 하지만 실제 데이터 형태 미확인)

~~프로젝트 상세 조회, 댓글 조회/등록, 좋아요~~ → 엔드포인트 추가되어 실제 연동으로 전환 완료 (아래 참고)

엔드포인트가 추가되면 해당 함수의 mock 우선 로직만 지우면 바로 실제 연동으로 전환됩니다.

## 백엔드 확인 필요 (TODO)

- [ ] **`GET /api/project`가 비로그인 상태에서 401이 나는 게 의도한 정책인지** - 원래 HOME/PROJECT 목록은 비로그인도 봐야 하는 공개 화면이라 확인 필요
- [x] ~~소셜로그인 엔드포인트 정확한 스펙~~ → 2026.09.06 실제 배포 Swagger 재확인해서 `POST /api/{provider}/callback`(컨트롤러 base path 없이 바로)로 수정 완료
- [x] ~~`ProjectRequest.partipants` 필드 오타~~ → 2026.09.06 백엔드에서 `participants`로 수정 확인, 프론트도 같이 반영 완료
- [ ] `ProjectRequest.category`가 단일 값인데 기획은 다중 선택 - 확인 필요. 우선 프론트는 백엔드 스펙(단일 enum)에 맞춰 업로드 폼을 드롭다운 단일 선택으로 만들어뒀어요
- [ ] 로그인 응답에 `password` 필드 노출 - 보안 이슈 (프론트에서는 저장 안 하고 버림)
- [x] ~~로그인 응답에 `user_id` 없음~~ → 2026.08.11 백엔드에서 로그인 응답에 `user_id` 추가해주셔서 반영 완료. `POST /api/project/{user_id}`에 실제 user_id를 사용하도록 고쳤어요. **다만 필드명이 정확히 `user_id`가 맞는지는 확인 못 해서, 다르면 `src/lib/api/auth.ts`의 `login`/`socialLogin` 매핑만 고치면 돼요**
- [ ] `GET /api/project` 쿼리 파라미터(연도/형태/검색어/정렬) 아직 없음
- [x] ~~상세 조회, 댓글, 관리자 엔드포인트 아직 Swagger에 없음~~ → 전부 추가되어 반영 완료
- [ ] **댓글 등록(`POST /api/comment/{project_id}/{user_id}`)이 user_id를 경로에 요구해서, 로그인한 사용자만 댓글을 쓸 수 있는 구조예요.** 이전에 기획 문서 기준으로 "비회원도 댓글 작성 가능"으로 만들어뒀었는데 실제 API랑 안 맞아서, 일단 로그인 안 하면 댓글 입력창 자체를 숨기고 로그인 링크를 보여주도록 바꿨어요. 비회원 댓글이 꼭 필요하면 백엔드에 그것도 지원해달라고 해야 할 것 같아요
- [ ] 프로젝트 상세/댓글 조회 응답 스키마가 Swagger에 제네릭 `object`로만 나와 있어서 실제 필드명을 추정해서 매핑해뒀음(`mapProjectResponse`/`mapCommentResponse`) - 실제 데이터 들어오면 재확인 필요
- [x] ~~"응원해요" 좋아요 API 스펙~~ → 2026.09.06 확인 및 연동 완료: `POST/DELETE /api/project/{project_id}/like/{user_id}` 호출하도록 `LikeButton` 수정. **다만 서버에 "내가 이미 눌렀는지" 조회하는 API가 없어서, liked(★/☆) 상태는 이번 방문에서 누른 것만 기억하는 로컬 상태입니다 - 새로고침하면 눌렀던 기록은 사라져요 (카운트 자체는 매번 서버 값 기준).** 비로그인 상태에서 누르면 로그인 페이지로 이동
- [ ] 댓글 이모티콘 API 스펙 (P1)
- [x] ~~관리자(admin) API~~ → 승인/반려/상세는 반영 완료 (위 "완성된 것" 참고), 큐레이션 순서 변경은 아직 미착수
- [ ] **로그인 응답에 role(USER/ADMIN) 정보 없음** - 관리자 페이지 접근 제어를 프론트에서 못 하고 있어요 (자세한 내용은 위 "완성된 것"의 관리자 페이지 항목 참고)
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
- [ ] **모바일 PROJECT 목록 시안(node 52:384)에는 지역 필터가 그대로 있는데, 데스크탑 필터에서는 이미 지역을 삭제하기로 결정해서 모바일도 똑같이 지역 필터 없이 구현했습니다.** 혹시 모바일만 지역 필터를 유지해야 하는 거면 알려주세요 (+ 이번에 확인한 풀스크린 PROJECT 목록 시안(node 90:272)에도 지역 필터 칩이 그대로 있어서, 데스크탑 쪽도 다시 한번 확인 부탁드려요)
- [ ] 풀스크린 PROJECT 목록 시안(node 90:272)에는 형태(GAME/AI/VIDEO...) 필터 칩 줄이 안 보여요 - 이미 구현해둔 형태 필터를 빼야 하는 건지, 이 시안에서만 누락된 건지 확인 필요
- [ ] HOME 히어로 캐러셀 모바일 버전은 좌우 카드를 완전히 숨기는 단순화된 형태로 구현했어요. Figma처럼 좌우 카드가 살짝 겹쳐 보이는 것까지 픽셀 단위로 맞추려면 추가 작업이 필요합니다 - 필요하면 말씀해주세요
- [ ] 업로드 폼 미디어 업로드 영역: Figma는 영상 URL/파일 업로드/웹 링크가 동시에 나열된 모양인데, 실제로는 하나만 선택하는 탭 형태로 구현했습니다 (위 "완성된 것" 참고)
- [ ] 업로드 폼 리치 텍스트 에디터는 아직 일반 textarea로만 구현 (Quill.js/TipTap 선택 대기 중)

## 기능 우선순위 (구축 기획(안) 기준)

- P0(1차 필수): HOME, PROJECT 목록/상세, 업로드폼, 로그인/마이페이지 기본, 관리자 승인/반려/비공개, 기본 댓글
- P1(가능하면 포함): 좋아요, 댓글 이모티콘, 이메일 알림, 관리자 직접 수정, HOME 큐레이션/배너 관리
- P2(1차 이후): 대댓글, 댓글 카테고리, 큐레이션/통계 고도화, 운영 자동화
