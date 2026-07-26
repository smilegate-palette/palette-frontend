# palette-frontend

팔레트 유스 창작 플랫폼(스마일게이트 Hope Creator Alumni 프로토타입) 프론트엔드

## 기술 스택

- React 18 + TypeScript + Vite
- react-router-dom (클라이언트 사이드 라우팅)
- Tailwind CSS (기획 문서 디자인 컨셉 반영: 배경 밝은 회색 / 카드·검색·댓글 흰색 / 포인트 노란색 / 텍스트 차콜 / 폰트 Pretendard)
- 배포: Naver Cloud Object Storage + CDN, GitHub Actions로 자동 배포 예정
- 인증: 희망스튜디오 계정 + 카카오/네이버/구글 소셜로그인 + JWT (프론트 연동 방식은 미정)

## 시작하기

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
