import { apiFetch } from "./client";
import { mapProjectResponse } from "./projects";
import { Project } from "@/lib/types/project";

// 2026.09 배포된 실제 Swagger(admin-controller) 기준 엔드포인트:
//   GET  /api/admin/{user_id}                              관리자 대시보드(추정) - operationId: Adminpage
//   GET  /api/admin/{user_id}/{project_id}                 관리자용 프로젝트 상세
//   PATCH /api/admin/{user_id}/{project_id}                 관리자 프로젝트 직접 수정
//   GET  /api/admin/{user_id}/{project_id}/approve          승인 (GET인 게 특이하지만 스펙 그대로 따름)
//   POST /api/admin/{user_id}/{project_id}/reject           반려 - body: { reject_reason }
//   GET  /api/admin/{user_id}/curation                       큐레이션 순서 조회
//   POST /api/admin/{user_id}/curation                       큐레이션 순서 저장 - body: { section_id, projectIds }
// ⚠️ 이 엔드포인트들은 전부 응답 스키마가 Swagger에 제네릭 object로만 나와 있어서 실제 필드명은 추정치입니다.
// ⚠️ 훨씬 더 중요한 문제: 로그인 응답(UserLoginResponse)에 role(USER/ADMIN) 정보가 없어서,
//    프론트에서는 "지금 로그인한 사람이 관리자인지" 미리 판단할 방법이 없습니다.
//    그래서 관리자 페이지는 일단 로그인만 되어 있으면 접근은 가능하게 해두고, 실제 데이터 조회는
//    백엔드가 401/403을 돌려주는지에 의존합니다(권한 없으면 에러 메시지 표시). role 정보가 응답에
//    추가되면 네비게이션 노출 여부도 그걸로 제어할 수 있어요 - 백엔드 확인 필요.

export interface AdminDashboard {
  pendingProjects: Project[];
  allProjects: Project[];
  totalCount?: number;
}

function extractProjectArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.projects ?? obj.pendingProjects ?? obj.pending_projects ?? obj.items ?? obj.content;
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }
  return [];
}

export async function getAdminDashboard(userId: string): Promise<AdminDashboard> {
  const raw = await apiFetch<Record<string, unknown> | Record<string, unknown>[]>(
    `/api/admin/${encodeURIComponent(userId)}`
  );
  const list = extractProjectArray(raw).map(mapProjectResponse);
  return {
    pendingProjects: list.filter((p) => (p.status ?? "PENDING") === "PENDING"),
    allProjects: list,
    totalCount: Array.isArray(raw) ? raw.length : undefined,
  };
}

export async function getAdminProjectDetail(
  userId: string,
  projectId: string
): Promise<Project | undefined> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/admin/${encodeURIComponent(userId)}/${projectId}`
  );
  return raw ? mapProjectResponse(raw) : undefined;
}

export async function approveProject(userId: string, projectId: string): Promise<void> {
  // 스펙상 GET 요청임 (승인처럼 상태를 바꾸는 동작인데 GET인 게 특이함 - 백엔드 스펙 그대로 따름)
  await apiFetch<void>(
    `/api/admin/${encodeURIComponent(userId)}/${projectId}/approve`
  );
}

export async function rejectProject(
  userId: string,
  projectId: string,
  rejectReason: string
): Promise<void> {
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/${projectId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reject_reason: rejectReason }),
  });
}
