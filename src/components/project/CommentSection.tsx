import { useState } from "react";
import { Comment } from "@/lib/types/comment";
import { createComment } from "@/lib/api/comments";

// 비회원도 댓글 등록 가능, 닉네임 입력 필요 (권한 매트릭스 + 컴포넌트 명세 기준)
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
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || !nickname.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await createComment({
        projectId,
        authorName: nickname,
        content,
      });
      setComments((prev) => [...prev, newComment]);
      setContent("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-base font-bold">댓글 {comments.length}개</h2>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="닉네임"
          className="rounded-xl bg-palette-input px-4 py-2 text-sm text-black outline-none placeholder:text-palette-muted sm:w-32"
        />
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="flex-1 rounded-xl bg-palette-input px-4 py-2 text-sm text-black outline-none placeholder:text-palette-muted"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim() || !nickname.trim()}
          className="rounded-xl bg-palette-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          등록
        </button>
      </div>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-palette-muted">
          첫 댓글을 남겨보세요 :)
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="border-b border-palette-border pb-3">
              <p className="text-sm font-semibold">{comment.authorName}</p>
              <p className="text-sm text-palette-muted">{comment.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
