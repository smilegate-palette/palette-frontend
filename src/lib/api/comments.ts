import { apiFetch, USE_MOCK } from "./client";
import { mockComments } from "@/data/mockProjects";
import { Comment, CreateCommentPayload } from "@/lib/types/comment";
import { getStoredUserId } from "@/lib/auth/token";

// 2026.08 Swagger에 확인된 댓글 엔드포인트:
//   GET    /api/comment/{project_id}                       댓글 목록 조회
//   POST   /api/comment/{project_id}/{user_id}              댓글 등록 - body: { content, nickname }
//   PATCH  /api/comment/{project_id}/{user_id}/{comment_id} 댓글 수정 (아직 미사용)
//   DELETE /api/comment/{project_id}/{user_id}/{comment_id} 댓글 삭제 (아직 미사용)
// ⚠️ 등록 경로에 user_id가 필요해서, 이전에 "비회원도 댓글 작성 가능"으로 가정했던 것과 달리
//    실제로는 로그인한 사용자만 댓글을 작성할 수 있는 구조입니다. nickname은 계정과 별개로
//    댓글에 표시할 이름을 입력받는 필드로 보고 그대로 뒀습니다 (CommentSection에서 로그인 여부로 폼을 가림).
// ⚠️ 응답 스키마가 Swagger에 제네릭 object로만 나와 있어 정확한 필드명은 추정치입니다.
//    실제 데이터 확인되면 아래 mapCommentResponse만 고치면 됩니다.

function mapCommentResponse(raw: Record<string, unknown>, projectId: string): Comment {
  return {
    id: String(raw.id ?? raw.comment_id ?? `comment-${Date.now()}`),
    projectId,
    authorId: String(
      raw.user_id ??
        raw.userId ??
        raw.author_id ??
        raw.authorId ??
        (raw.user as Record<string, unknown> | undefined)?.id ??
        ""
    ) || undefined,
    authorName: (raw.nickname as string) ?? (raw.author_name as string) ?? "익명",
    content: (raw.content as string) ?? "",
    createdAt: (raw.created_at as string) ?? new Date().toISOString(),
  };
}

export async function getComments(projectId: string): Promise<Comment[]> {
  if (USE_MOCK) {
    return mockComments.filter((c) => c.projectId === projectId);
  }
  const raw = await apiFetch<Record<string, unknown>[] | Record<string, unknown>>(
    `/api/comment/${projectId}`
  );
  const list = Array.isArray(raw) ? raw : (raw as { comments?: unknown[] })?.comments ?? [];
  return (list as Record<string, unknown>[]).map((c) => mapCommentResponse(c, projectId));
}

export async function createComment(
  payload: CreateCommentPayload
): Promise<Comment> {
  if (USE_MOCK) {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      projectId: payload.projectId,
      authorName: payload.authorName ?? "익명",
      authorId: getStoredUserId() ?? undefined,
      content: payload.content,
      createdAt: new Date().toISOString(),
      status: "approved",
    };
    mockComments.push(newComment);
    return newComment;
  }

  const userId = getStoredUserId();
  if (!userId) {
    // 실제 API는 로그인한 사용자만 댓글을 작성할 수 있음 (경로에 user_id 필요)
    throw new Error("로그인 후 댓글을 작성할 수 있어요.");
  }

  const raw = await apiFetch<Record<string, unknown> | undefined>(
    `/api/comment/${payload.projectId}/${encodeURIComponent(userId)}`,
    {
      method: "POST",
      body: JSON.stringify({ content: payload.content, nickname: payload.authorName }),
    }
  );
  const mapped = mapCommentResponse(raw ?? {}, payload.projectId);
  // 서버 응답이 비어있는 케이스(제네릭 object라 확실치 않음) 대비, 방금 입력한 내용으로 보완
  return {
    ...mapped,
    authorName: mapped.authorName !== "익명" ? mapped.authorName : payload.authorName ?? "익명",
    content: mapped.content || payload.content,
  };
}

export async function updateComment(
  projectId: string,
  commentId: string,
  content: string
): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("로그인 후 댓글을 수정할 수 있어요.");

  if (USE_MOCK) {
    const comment = mockComments.find((item) => item.id === commentId);
    if (comment) comment.content = content;
    return;
  }

  await apiFetch<void>(
    `/api/comment/${encodeURIComponent(projectId)}/${encodeURIComponent(userId)}/${encodeURIComponent(commentId)}`,
    { method: "PATCH", body: JSON.stringify({ content }) }
  );
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) throw new Error("로그인 후 댓글을 삭제할 수 있어요.");

  if (USE_MOCK) {
    const index = mockComments.findIndex((item) => item.id === commentId);
    if (index >= 0) mockComments.splice(index, 1);
    return;
  }

  await apiFetch<void>(
    `/api/comment/${encodeURIComponent(projectId)}/${encodeURIComponent(userId)}/${encodeURIComponent(commentId)}`,
    { method: "DELETE" }
  );
}
