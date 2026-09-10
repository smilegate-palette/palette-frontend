export interface Comment {
  id: string;
  projectId: string;
  authorId?: string;
  authorName: string;
  content: string;
  createdAt: string;
  status?: "approved" | "hidden"; // 관리자 댓글 승인/비공개 상태 (/api/admin/status)
}

export interface CreateCommentPayload {
  projectId: string;
  authorName?: string; // 비회원도 댓글 등록 가능 (권한 설정 문서 참고)
  content: string;
}
