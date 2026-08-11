import { mockComments } from "@/data/mockProjects";
import { Comment, CreateCommentPayload } from "@/lib/types/comment";

// GET /api/comment, POST /api/comment/{comment_id} 등 - 2026.08.11 재확인한 실제 Swagger(v0)에도
// 댓글 엔드포인트가 여전히 하나도 없음. USE_MOCK 값과 무관하게 mock 사용.
// TODO: 백엔드에 엔드포인트 생기면 아래 mock 우선 로직 지우고 apiFetch 쪽으로 전환.

export async function getComments(projectId: string): Promise<Comment[]> {
  return mockComments.filter((c) => c.projectId === projectId);
}

export async function createComment(
  payload: CreateCommentPayload
): Promise<Comment> {
  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    projectId: payload.projectId,
    authorName: payload.authorName ?? "익명",
    content: payload.content,
    createdAt: new Date().toISOString(),
    status: "approved",
  };
  mockComments.push(newComment);
  return newComment;
}
