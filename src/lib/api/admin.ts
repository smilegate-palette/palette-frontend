import { apiFetch } from "./client";
import { mapProjectResponse } from "./projects";
import { Project } from "@/lib/types/project";
import { Comment } from "@/lib/types/comment";

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
  comments: Comment[];
  stories: AdminStory[];
  curation: CurationSection[];
  totalCount?: number;
  stats?: AdminStats;
}

export interface AdminStats {
  pendingApproval: number;
  todayComments: number;
  totalProjects: number;
  totalStories: number;
}

export interface AdminStory {
  id: string;
  title: string;
  username?: string;
  createdAt?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function extractArray(raw: unknown, keys: string[]): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  const object = asRecord(raw);
  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key] as Record<string, unknown>[];
  }
  return [];
}

function extractProjectArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate =
      obj.projects ?? obj.project ?? obj.pendingProjects ?? obj.pending_projects ?? obj.items ?? obj.content;
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }
  return [];
}

export async function getAdminDashboard(userId: string): Promise<AdminDashboard> {
  const raw = await apiFetch<Record<string, unknown> | Record<string, unknown>[]>(
    `/api/admin/${encodeURIComponent(userId)}`
  );
  const object = asRecord(raw);
  const pendingProjects = extractArray(object.pendingProjects ?? object.pending_projects, ["items", "content"]);
  const list = (pendingProjects.length > 0 ? pendingProjects : extractProjectArray(raw)).map(mapProjectResponse);
  const comments = extractArray(
    object.recentComments ?? object.recent_comments ?? object.comments,
    ["items", "content"]
  ).map((comment) => ({
    id: String(comment.id ?? comment.comment_id ?? ""),
    projectId: String(comment.project_id ?? comment.projectId ?? ""),
    authorId: String(comment.user_id ?? comment.userId ?? comment.author_id ?? "") || undefined,
    authorName: String(comment.nickname ?? comment.author_name ?? comment.authorName ?? "익명"),
    projectTitle: (comment.project_title ?? comment.projectTitle) as string | undefined,
    content: String(comment.content ?? ""),
    createdAt: String(comment.created_at ?? comment.createdAt ?? comment.createdDate ?? ""),
  }));
  const stories = extractArray(
    object.stories ?? object.storyUploads ?? object.story_uploads,
    ["items", "content"]
  ).map((story) => ({
    id: String(story.id ?? story.story_id ?? ""),
    title: String(story.story_title ?? story.title ?? ""),
    username: (story.story_username ?? story.username) as string | undefined,
    createdAt: (story.created_at ?? story.createdAt) as string | undefined,
  }));
  const curation = extractSections(
    object.curationSections ??
      object.curation ??
      object.homeCuration ??
      object.home_curation ??
      object.curationSettings ??
      []
  );
  const statsObject = asRecord(object.stats);
  return {
    pendingProjects: list.filter((p) => (p.status ?? "PENDING") === "PENDING"),
    allProjects: list,
    comments,
    stories,
    curation,
    totalCount: Number(statsObject.totalProjects ?? object.totalCount ?? object.total_count ?? list.length),
    stats: {
      pendingApproval: Number(statsObject.pendingApproval ?? list.length),
      todayComments: Number(statsObject.todayComments ?? 0),
      totalProjects: Number(statsObject.totalProjects ?? list.length),
      totalStories: Number(statsObject.totalStories ?? stories.length),
    },
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
  await apiFetch<void>(
    `/api/admin/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/approve`
  );
}

export async function rejectProject(
  userId: string,
  projectId: string,
  rejectReason: string
): Promise<void> {
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/${encodeURIComponent(projectId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ reject_reason: rejectReason }),
  });
}

export async function getAdminComments(
  userId: string,
  projectIdsByTitle: Map<string, string> = new Map()
): Promise<Comment[]> {
  const raw = await apiFetch<unknown>(`/api/admin/${encodeURIComponent(userId)}/comment/`);
  return extractArray(raw, ["comments", "items", "content"]).map((comment) => ({
    id: String(comment.id ?? comment.comment_id ?? ""),
    projectId: String(
      comment.project_id ??
        comment.projectId ??
        projectIdsByTitle.get(String(comment.project_title ?? "")) ??
        ""
    ),
    authorId: String(comment.user_id ?? comment.userId ?? comment.author_id ?? "") || undefined,
    authorName: String(comment.nickname ?? comment.author_name ?? comment.authorName ?? "익명"),
    projectTitle: (comment.project_title ?? comment.projectTitle) as string | undefined,
    content: String(comment.content ?? ""),
    createdAt: String(comment.created_at ?? comment.createdAt ?? comment.createdDate ?? ""),
  }));
}

export async function deleteAdminComment(
  userId: string,
  projectId: string,
  commentId: string
): Promise<void> {
  await apiFetch<void>(
    `/api/comment/${encodeURIComponent(projectId)}/${encodeURIComponent(userId)}/${encodeURIComponent(commentId)}`,
    { method: "DELETE" }
  );
}

// 관리자 프로젝트 직접 수정. Figma 관리자 시안(node 92:2)엔 프로젝트명/유형/설명/썸네일/추가 필드까지
// 있는데, 썸네일 업로드·추가 필드는 이걸 저장할 백엔드 필드/엔드포인트가 없어서 화면만 만들고
// 실제로 저장은 안 되게 해뒀습니다 (AdminPage 참고). 여기선 실제로 보낼 수 있는 필드만 받습니다.
export async function updateAdminProject(
  userId: string,
  projectId: string,
  payload: { title: string; category: string; description: string }
): Promise<void> {
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      project_title: payload.title,
      category: payload.category,
      description: payload.description,
    }),
  });
}

// HOME 큐레이션 섹션 순서 관리. 응답 스키마가 Swagger에 제네릭 object라 실제 필드명은 추정치입니다 -
// 실제 데이터로 확인 전까지는 화면에 아무것도 안 뜰 수 있어요.
export interface CurationSection {
  sectionId: number;
  title: string;
  projectIds: number[];
  projectTitles: Record<string, string>;
}

function extractSections(raw: unknown): CurationSection[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
    ? (raw as Record<string, unknown>).sections ?? (raw as Record<string, unknown>).curations
    : [];
  if (!Array.isArray(list)) return [];
  return (list as Record<string, unknown>[]).map((s) => {
    const sectionProjects = Array.isArray(s.sectionProjects)
      ? s.sectionProjects.map(asRecord)
      : [];
    const projectTitles = Object.fromEntries(
      sectionProjects.map((project) => [
        String(project.projectId ?? ""),
        String(project.projectTitle ?? ""),
      ])
    );
    return {
      sectionId: Number(s.section_id ?? s.sectionId ?? 0),
      title: (s.title as string) ?? (s.name as string) ?? "",
      projectIds: (
        (s.project_ids ?? s.projectIds ?? sectionProjects.map((project) => project.projectId)) as
          (number | string)[]
      ).map(Number),
      projectTitles,
    };
  });
}

export async function getCuration(userId: string): Promise<CurationSection[]> {
  const raw = await apiFetch<unknown>(`/api/admin/${encodeURIComponent(userId)}/curation`);
  return extractSections(raw);
}

export async function saveCurationOrder(
  userId: string,
  sectionId: number,
  projectIds: number[]
): Promise<void> {
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/curation`, {
    method: "POST",
    body: JSON.stringify({ section_id: sectionId, projectIds }),
  });
}
