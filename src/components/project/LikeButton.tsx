import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { likeProject, unlikeProject } from "@/lib/api/projects";
import { USE_MOCK } from "@/lib/api/client";

// "응원해요" 좋아요 버튼.
// 2026.09.06 백엔드에 좋아요 API(POST/DELETE /api/project/{project_id}/like/{user_id})가 생겨서 실제 연동함.
// ⚠️ 서버에 "내가 이미 눌렀는지" 조회하는 API가 없어서, liked 상태는 이번에 누른 것만 기억하는
// 로컬 상태입니다 - 새로고침하면 눌렀던 기록은 초기화돼요 (카운트는 initialCount로 매번 새로 받음).
// 좋아요도 user_id가 있어야 호출 가능한 구조라, 비로그인 상태에서 누르면 로그인 페이지로 보냅니다.
export default function LikeButton({
  projectId,
  initialCount,
}: {
  projectId: string;
  initialCount: number;
}) {
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  const toggleLike = async () => {
    if (!isLoggedIn || !userId) {
      navigate("/login");
      return;
    }
    if (pending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    if (USE_MOCK) return; // mock 모드에서는 API 호출 없이 로컬 토글만

    setPending(true);
    try {
      if (nextLiked) {
        await likeProject(projectId, userId);
      } else {
        await unlikeProject(projectId, userId);
      }
    } catch {
      // 실패하면 누르기 전 상태로 되돌림
      setLiked(!nextLiked);
      setCount((prev) => (nextLiked ? prev - 1 : prev + 1));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={pending}
      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
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
