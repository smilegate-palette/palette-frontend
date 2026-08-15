import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 2026.08 Figma 파일(실제 시안, node 3:3 / 8:63)에서 직접 추출한 정확한 값입니다.
      // 이전엔 텍스트 설명만 보고 추정치를 썼는데, 실제 색상은 이쪽이 맞습니다.
      colors: {
        palette: {
          bg: "#ffffff", // 페이지 기본 배경 (흰색 - 이전에 회색으로 잘못 넣었던 것 수정)
          header: "#fffced", // 상단 GNB 배경 (크림색)
          section: "#ececec", // 히어로 배너, 비활성 필터 칩 등 큰 회색 블록
          card: "#f7f7f7", // 프로젝트 카드 바탕
          input: "#f9f9f9", // 검색창/정렬 드롭다운 배경
          placeholder: "#d9d9d9", // 썸네일/이미지 로딩 전 placeholder
          highlight: "#fff1ad", // 선택된 검색어 태그 배경
          border: "#e5e7eb",
          text: "#000000", // 순검정
          muted: "#707070",
          accent: "#ffd400", // 포인트 노란색
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      // Figma 실제 시안에서 확인된 그림자 값 (2026.08, node 3:3 / 8:63)
      boxShadow: {
        soft: "0px 4px 10px 0px rgba(0,0,0,0.1)", // 검색창, 정렬 드롭다운
        strong: "0px 4px 10px 0px rgba(0,0,0,0.2)", // "+ 프로젝트 올리기" 버튼
        card: "0px 4px 4px 0px rgba(0,0,0,0.25)", // 히어로 슬라이더 이미지 박스, HOME CTA 버튼
      },
    },
  },
  plugins: [],
};

export default config;
