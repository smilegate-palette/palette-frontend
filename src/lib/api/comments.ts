import { apiFetch, USE_MOCK } from "./client";
import { mockComments } from "@/data/mockProjects";
import { Comment, CreateCommentPayload } from "@/lib/types/comment";

// GET /api/comment, POST /api/comment/{comment_id} 등 모두 진행도 No -> mock 우선

export async function getComments(projectId: string): Promise<Comment[]> {
  if (USE_MOCK) {
    return mockComments.filter((c) => c.projectId === projectId);
  }
  return apiFetch<Comment[]>(`/api/comment?project_id=${projectId}`);
}

export async function createComment(
  payload: CreateCommentPayload
): Promise<Comment> {
  if (USE_MOCK) {
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

  // TODO: 엔드포인트 문서상 POST /api/comment/{comment_id} 로 되어 있는데,
  // '등록' 액션에 comment_id를 미리 알아야 하는 구조가 이상함 - 백엔드 확인 필요
  // (보통 등록은 POST /api/comment 또는 POST /api/project/{project_id}/comment 형태가 자연스러움)
  return apiFetch<Comment>(`/api/comment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
