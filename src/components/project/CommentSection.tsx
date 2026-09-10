import { useState } from "react";
import { Link } from "react-router-dom";
import { Comment } from "@/lib/types/comment";
import { createComment, deleteComment, updateComment } from "@/lib/api/comments";
import { useAuth } from "@/lib/auth/AuthContext";

// ⚠️ 2026.08 실제 댓글 등록 API(POST /api/comment/{project_id}/{user_id})를 보니
// 경로에 user_id가 필요해서, 이전에 "비회원도 댓글 등록 가능"으로 가정했던 것과 달리
// 실제로는 로그인한 사용자만 댓글을 작성할 수 있어요. 그래서 로그인 여부로 폼을 가렸습니다.
// nickname(닉네임)은 계정과 별개로 댓글에 표시할 이름을 받는 필드라 그대로 남겨뒀어요.
// TODO: 이모티콘 반응 기능 추가 예정(기획 답변상 가능) - 아직 미구현
// TODO: 대댓글/댓글 카테고리는 P2(1차 이후) 우선순위라 이번 스프린트 범위 아님
export default function CommentSection({
  projectId,
  initialComments,
}: {
  projectId: string;
  initialComments: Comment[];
}) {
  const { isLoggedIn, userId } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const handleSubmit = async () => {
    if (!content.trim() || !nickname.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await createComment({
        projectId,
        authorName: nickname,
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

  const handleEdit = async (comment: Comment) => {
    if (!editingContent.trim()) return;
    try {
      await updateComment(projectId, comment.id, editingContent.trim());
      setComments((prev) =>
        prev.map((item) =>
          item.id === comment.id ? { ...item, content: editingContent.trim() } : item
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 수정에 실패했어요.");
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    try {
      await deleteComment(projectId, comment.id);
      setComments((prev) => prev.filter((item) => item.id !== comment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "댓글 삭제에 실패했어요.");
    }
  };

  return (
    <section className="mt-8 md:mt-12">
      <h2 className="mb-3 text-base font-bold md:mb-4 md:text-2xl">댓글 {comments.length}개</h2>

      {isLoggedIn ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row md:mb-6">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="rounded-xl bg-palette-input px-4 py-2 text-sm text-black outline-none placeholder:text-palette-muted sm:w-32 md:py-3"
          />
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            className="flex-1 rounded-xl bg-palette-input px-4 py-2 text-sm text-black shadow-soft outline-none placeholder:text-palette-muted md:py-3"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !nickname.trim()}
            className="rounded-xl bg-palette-accent px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50 md:py-3"
          >
            등록
          </button>
        </div>
      ) : (
        <p className="mb-4 text-sm text-palette-muted md:mb-6">
          <Link to="/login" className="font-semibold text-palette-accent">
            로그인
          </Link>{" "}
          후 댓글을 작성할 수 있어요.
        </p>
      )}
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
                {comment.authorId && comment.authorId === userId && (
                  <div className="flex shrink-0 gap-2 text-xs text-palette-muted">
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditingContent(comment.content);
                      }}
                    >
                      수정
                    </button>
                    <button onClick={() => handleDelete(comment)}>삭제</button>
                  </div>
                )}
              </div>
              {editingId === comment.id ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg bg-palette-input px-3 py-2 text-sm text-black outline-none"
                  />
                  <button
                    onClick={() => handleEdit(comment)}
                    className="shrink-0 rounded-lg bg-palette-accent px-3 py-2 text-xs font-semibold text-white"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="shrink-0 rounded-lg border border-palette-border px-3 py-2 text-xs"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <p className="text-sm text-palette-muted md:text-base">{comment.content}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
