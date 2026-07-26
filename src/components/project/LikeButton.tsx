import { useState } from "react";

// "응원해요" 좋아요 버튼 - 기획 문서에서 추가 요청된 기능.
// TODO: 백엔드 API 스펙(엔드포인트, 중복 클릭 방지 방식 등) 미정 -> 지금은 로컬 state만 사용
export default function LikeButton({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setCount((prev) => (liked ? prev - 1 : prev + 1));
  };

  return (
    <button
      onClick={toggleLike}
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium ${
        liked
          ? "border-palette-accent bg-palette-accent text-palette-text"
          : "border-palette-border text-palette-muted"
      }`}
    >
      <span aria-hidden>{liked ? "★" : "☆"}</span>
      응원해요 {count}
    </button>
  );
}
