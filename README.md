# palette-frontend

팔레트 유스 창작 플랫폼(스마일게이트 Hope Creator Alumni 프로토타입) 프론트엔드입니다.

## 기술 스택

- React 18 + TypeScript + Vite
- react-router-dom (클라이언트 사이드 라우팅)
- Tailwind CSS (기획 문서 디자인 컨셉 반영: 배경 밝은 회색 / 카드·검색·댓글 흰색 / 포인트 노란색 / 텍스트 차콜 / 폰트 Pretendard)
- 배포: Naver Cloud Object Storage + CDN, GitHub Actions로 자동 배포 예정 (기획 문서 기준)
- 인증: 희망스튜디오 계정 + 카카오/네이버/구글 소셜로그인 + JWT (프론트 연동 방식은 미정)

## 시작하기

이 저장소는 네트워크 제약이 있는 환경에서 파일 구조만 먼저 만들어둔 상태라
`npm install`을 아직 실행해보지 않았습니다. 로컬에서 아래 순서로 진행해주세요.

```bash
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
    NotFoundPage.tsx
  components/           # 재사용 컴포넌트
    layout/             # Header, Layout(Outlet)
    home/                # HeroSlider, CurationRow
    project/             # CommentSection
    common/              # ProjectCard
  lib/
    api/                 # API 클라이언트 (엔드포인트.csv 기준)
    types/                # 타입 정의
  data/
    mockProjects.ts       # 백엔드 미완성 API용 mock 데이터
```

## 현재 상태 / mock 데이터 안내

백엔드 API 17개 중 **3개만 완료**(프로젝트 목록/상세 조회, 내용 수정)라
나머지 화면은 `src/data/mockProjects.ts` 데이터로 우선 개발되어 있습니다.

`.env.local`의 `VITE_USE_MOCK=false`로 바꾸면 실제 API를 호출합니다
(단, 아래 미해결 항목들 때문에 바로 붙이면 에러날 가능성이 높습니다).

이 프로젝트는 SSR 없이 클라이언트 사이드 렌더링(CSR)만 사용합니다. SEO가 중요해지면
Next.js 등 SSR 프레임워크로 전환을 다시 검토해야 할 수 있어요.

## 기능 우선순위 (구축 기획(안) 기준)

- P0(1차 필수): HOME, PROJECT 목록/상세, 업로드폼, 로그인/마이페이지 기본, 관리자 승인/반려/비공개, 기본 댓글
- P1(가능하면 포함): 좋아요, 댓글 이모티콘, 이메일 알림, 관리자 직접 수정, HOME 큐레이션/배너 관리
- P2(1차 이후): 대댓글, 댓글 카테고리, 큐레이션/통계 고도화, 운영 자동화

## 백엔드/기획 쪽에 확인이 필요한 것들 (TODO)

필터 체계, 사이트맵, 플로우, 권한 매트릭스, 1차 구축 일정은 구축 기획(안) 문서로 확정되어 반영 완료했습니다. 남은 항목:

- [ ] **Swagger API 명세 링크** - 아직 못 받음
- [ ] `/api/project/index` 쿼리 파라미터 스펙 (연도/형태/지역/프로그램/검색어/정렬 파라미터명)
- [ ] `/api/project/detail` 요청 방식 (project_id를 쿼리로 받는지, path param인지)
- [ ] `/api/comment/{comment_id}` - 댓글 "등록"인데 comment_id를 미리 알아야 하는 구조가 부자연스러움
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

색상/폰트/그리드/롤링 타이밍은 구축 기획(안)으로 확정되어 반영했습니다
(배경 `#f5f5f5`, 카드·검색·댓글 흰색, 포인트 노란색 `#ffc700`(정확한 hex 확인 필요), 텍스트 `#1f2124`, 폰트 Pretendard,
그리드 모바일 1열/태블릿 2열/PC 4열, 히어로 롤링 3초+hover 정지). 아직 남은 것:

- [ ] 팔레트 로고의 정확한 노란색 hex 코드
- [ ] 썸네일 카드 규격 (1:1 vs 3:4, 현재 4:3 임시 적용)
- [ ] 히어로 배너 배경 이미지/영상 실제 소스
- [ ] 상세 모달 vs 페이지 방식 (현재는 페이지 방식으로 구현됨)
- [ ] ABOUT PALETTE 타이포그래피 체계 (팔레트 측 콘텐츠 전달 후 후순위)
- [ ] 업로드 폼 리치 텍스트 에디터 선택 (Quill.js vs TipTap)
