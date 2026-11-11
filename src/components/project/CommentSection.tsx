import { useState } from "react";
import { Comment } from "@/lib/types/comment";
import { createComment } from "@/lib/api/comments";
import { useAuth } from "@/lib/auth/AuthContext";

// 2026.10 기획/백엔드 답변 반영: 비회원도 로그인 없이 닉네임만 입력해 댓글 작성 가능
// (로그인 안 했으면 user_id를 "null"로 보내고, 서버가 임의 값으로 저장).
// 댓글 삭제 권한은 관리자 전용이라 일반 화면에는 수정/삭제 버튼이 없고, 관리자 페이지에서만 삭제해요.
// TODO: 이모티콘 반응 기능 추가 예정(기획 답변상 가능) - 아직 미구현
// TODO: 대댓글/댓글 카테고리는 P2(1차 이후) 우선순위라 이번 스프린트 범위 아님
export default function CommentSection({
  projectId,
  initialComments,
}: {
  projectId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { email } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // 닉네임 입력칸이 없어져서: 로그인했으면 이메일 앞부분, 비회원이면 비워서 보냄(서버가 임의 이름 부여, 확인 필요)
      const newComment = await createComment({
        projectId,
        authorName: email ? email.split("@")[0] : undefined,
        content,
      });
      setComments((prev) => [...prev, newComment]);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 등록에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="mb-3 text-base font-bold md:mb-4 md:text-2xl">댓글 {comments.length}개</h2>

        {/* Figma(2026.11) 댓글 입력은 닉네임 칸 없이 입력창 1개 + 등록 버튼 */}
        <div className="mb-4 flex gap-2 md:mb-6 md:gap-3">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSubmit();
            }}
            placeholder="댓글을 입력하세요"
            className="min-w-0 flex-1 rounded-xl bg-palette-input px-4 py-2 text-sm text-black shadow-soft outline-none placeholder:text-palette-muted md:px-7 md:py-3 md:text-xl"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="shrink-0 rounded-xl bg-palette-accent px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50 md:px-8 md:py-3 md:text-xl"
          >
            등록
          </button>
        </div>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-palette-muted">
          첫 댓글을 남겨보세요 :)
        </p>
      ) : (
        <ul className="space-y-3 md:space-y-5">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-palette-border pb-3 md:pb-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold md:text-lg">{comment.authorName}</p>
              </div>
              <p className="text-sm text-palette-muted md:text-base">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
