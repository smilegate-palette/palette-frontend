import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // 기획 문서(디자인 컨셉) 기준: 스토브/넷플릭스 스타일, 배경은 밝은 회색,
      // 댓글·검색창은 흰색으로 구분, 포인트 컬러는 팔레트 로고의 노란색, 텍스트는 진한 차콜.
      // TODO: accent 정확한 hex는 로고 원본 파일 받으면 교체
      colors: {
        palette: {
          bg: "#f5f5f5", // 페이지 배경 (밝은 회색)
          surface: "#ffffff", // 댓글/검색창/카드 등 배경과 구분되는 흰색
          border: "#e5e7eb",
          text: "#1f2124", // 진한 차콜/블랙
          muted: "#6b7280",
          accent: "#ffc700", // 팔레트 로고 포인트 컬러 (노란색, 정확한 hex 확인 필요)
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
    },
  },
  plugins: [],
};

export default config;
