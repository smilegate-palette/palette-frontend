import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { likeProject, unlikeProject } from "@/lib/api/projects";
import { USE_MOCK } from "@/lib/api/client";

// "응원해요" 좋아요 버튼.
// 2026.09.06 백엔드에 좋아요 API(POST/DELETE /api/project/{project_id}/like/{user_id})가 생겨서 실제 연동함.
// ⚠️ 서버에 "내가 이미 눌렀는지" 조회하는 API가 없어서, liked 상태는 이번에 누른 것만 기억하는
// 로컬 상태입니다 - 새로고침하면 눌렀던 기록은 초기화돼요 (카운트는 initialCount로 매번 새로 받음).
// 2026.10 백엔드 답변: 비회원도 user_id 자리에 null을 보내면 좋아요 가능(서버가 임의 값으로 저장).
// 다만 비회원은 누가 눌렀는지 서버가 구분 못 해서 취소(DELETE)를 할 수 없으므로,
// 비회원은 한 번 누르면 취소 불가 + 같은 브라우저에서 같은 프로젝트에 중복으로 못 누르게 localStorage에 기록해요.
export default function LikeButton({
  projectId,
  initialCount,
}: {
  projectId: string;
  initialCount: number;
}) {
  const { userId } = useAuth();
  const isGuest = !userId;
  const guestKey = `palette_guest_liked_${projectId}`;
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(() => {
    try {
      return !userId && localStorage.getItem(guestKey) === "1";
    } catch {
      return false;
    }
  });
  const [pending, setPending] = useState(false);

  const toggleLike = async () => {
    if (pending) return;
    if (isGuest && liked) return; // 비회원은 취소 불가

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    if (USE_MOCK) return; // mock 모드에서는 API 호출 없이 로컬 토글만

    setPending(true);
    try {
      if (nextLiked) {
        await likeProject(projectId, userId ?? "null");
        if (isGuest) {
          try {
            localStorage.setItem(guestKey, "1");
          } catch {
            /* 저장 실패는 무시 */
          }
        }
      } else {
        if (userId) await unlikeProject(projectId, userId);
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
      disabled={pending || (isGuest && liked)}
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
