import { apiFetch } from "./client";
import { mapProjectResponse, uploadProjectThumbnail, validateThumbnailFile } from "./projects";
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
  thumbnailUrl?: string;
  createdAt?: string;
  link?: string; // 썸네일/제목 클릭 시 새 창으로 열 주소 (백엔드 링크 필드가 생기면 채워짐)
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
  ).map(mapAdminStory);
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

function mapAdminStory(story: Record<string, unknown>): AdminStory {
  return {
    id: String(story.id ?? story.story_id ?? ""),
    title: String(story.story_title ?? story.title ?? ""),
    username: (story.story_username ?? story.username) as string | undefined,
    thumbnailUrl: (story.thumbnail_url ?? story.thumbnailUrl) as string | undefined,
    createdAt: (story.story_date ?? story.storyDate ?? story.created_at ?? story.createdAt ?? story.upload_date ?? story.uploadDate) as string | undefined,
    // 링크 필드명은 백엔드가 아직 확정 전이라 흔한 이름들을 모두 받아요
    link: (story.story_link ?? story.link ?? story.story_url ?? story.url ?? story.storyLink) as string | undefined,
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
  const raw = await apiFetch<unknown>(`/api/admin/${encodeURIComponent(userId)}/comment`);
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

// 관리자 프로젝트 직접 수정.
export async function updateAdminProject(
  userId: string,
  projectId: string,
  payload: {
    title: string;
    category: string;
    description: string;
    organization: string;
    participants: string[];
    mediaUrl: string;
    thumbnailFile?: File | null;
  }
): Promise<void> {
  const thumbnailUrl = payload.thumbnailFile
    ? await uploadProjectThumbnail(payload.thumbnailFile)
    : undefined;
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({
      project_title: payload.title,
      category: payload.category,
      description: payload.description,
      organization: payload.organization,
      participants: payload.participants,
      media_url: payload.mediaUrl,
      thumbnail_url: thumbnailUrl,
    }),
  });
}

// HOME 큐레이션 섹션 순서 관리. 응답 스키마가 Swagger에 제네릭 object라 실제 필드명은 추정치입니다 -
// 실제 데이터로 확인 전까지는 화면에 아무것도 안 뜰 수 있어요.
export type CurationType = "BOTTOM_CURATION" | "PROJECT_LIST";

export interface CurationSection {
  sectionId: number;
  title: string;
  displayOrder: number;
  sectionType: CurationType;
  active: boolean;
  projectIds: number[];
  projectTitles: Record<string, string>;
  thumbnailUrls: Record<string, string>;
}

function extractSections(raw: unknown): CurationSection[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? (raw as Record<string, unknown>).sections ?? (raw as Record<string, unknown>).curationSections
      : [];
  if (!Array.isArray(list)) return [];

  return list.map(asRecord).map((section) => {
    const rawProjects = Array.isArray(section.sectionProjects)
      ? section.sectionProjects.map(asRecord)
      : [];
    const projectTitles: Record<string, string> = {};
    const thumbnailUrls: Record<string, string> = {};
    const projectIds = rawProjects
      .map((project) => {
        const id = Number(project.projectId);
        if (!Number.isSafeInteger(id) || id <= 0) return null;
        projectTitles[String(id)] = String(project.projectTitle ?? "");
        thumbnailUrls[String(id)] = String(project.thumbnailUrl ?? project.thumbnail_url ?? "");
        return id;
      })
      .filter((id): id is number => id !== null)
      .sort((a, b) => {
        const pa = rawProjects.find((project) => Number(project.projectId) === a);
        const pb = rawProjects.find((project) => Number(project.projectId) === b);
        return Number(pa?.displayOrder ?? 0) - Number(pb?.displayOrder ?? 0);
      });

    return {
      sectionId: Number(section.sectionId ?? section.section_id ?? 0),
      title: String(section.title ?? ""),
      displayOrder: Number(section.displayOrder ?? section.display_order ?? 0),
      sectionType: section.sectionType === "PROJECT_LIST" ? "PROJECT_LIST" : "BOTTOM_CURATION",
      active: section.active !== false,
      projectIds,
      projectTitles,
      thumbnailUrls,
    };
  });
}

export async function getCuration(userId: string): Promise<CurationSection[]> {
  const raw = await apiFetch<unknown>(`/api/admin/${encodeURIComponent(userId)}/curation`);
  return extractSections(raw);
}

export async function saveCurationSection(
  userId: string,
  payload: {
    sectionId?: number;
    title: string;
    displayOrder: number;
    sectionType: CurationType;
    active: boolean;
    projectIds: number[];
  }
): Promise<CurationSection[]> {
  const isUpdate = Number.isSafeInteger(payload.sectionId) && Number(payload.sectionId) > 0;
  const body = {
    section_id: isUpdate ? payload.sectionId : null,
    title: payload.title,
    displayOrder: payload.displayOrder,
    sectionType: payload.sectionType,
    active: payload.active,
    projectIds: payload.projectIds,
  };
  const raw = await apiFetch<unknown>(
    isUpdate
      ? `/api/admin/${encodeURIComponent(userId)}/curation/section/${payload.sectionId}`
      : `/api/admin/${encodeURIComponent(userId)}/curation/section`,
    { method: isUpdate ? "PUT" : "POST", body: JSON.stringify(body) }
  );
  return extractSections(raw);
}

export async function deleteCurationSection(userId: string, sectionId: number): Promise<void> {
  await apiFetch<void>(
    `/api/admin/${encodeURIComponent(userId)}/curation/section/${encodeURIComponent(String(sectionId))}`,
    { method: "DELETE" }
  );
}

export interface PublicHomeSettings {
  curationSections: CurationSection[];
}

export async function getPublicHomeSettings(): Promise<CurationSection[]> {
  const raw = await apiFetch<Record<string, unknown>>("/api/home");
  return extractSections(raw.curationSections ?? raw.curation_sections ?? raw);
}

export type BannerPage = "HOME" | "OFF_THE_RECORD";

export interface Banner {
  bannerId: number;
  imageUrl: string;
  displayOrder: number;
  active: boolean;
  bannerPage: BannerPage;
}

function mapBanner(raw: Record<string, unknown>): Banner {
  const page = String(raw.bannerPage ?? raw.banner_page ?? "HOME").toUpperCase();
  return {
    bannerId: Number(raw.bannerId ?? raw.banner_id ?? raw.id ?? 0),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? ""),
    displayOrder: Number(raw.displayOrder ?? raw.display_order ?? 0),
    active: raw.active !== false,
    bannerPage: page === "OFF_THE_RECORD" || page === "STORY" ? "OFF_THE_RECORD" : "HOME",
  };
}

export async function getAdminBanners(userId: string, page: BannerPage): Promise<Banner[]> {
  const raw = await apiFetch<unknown>(
    `/api/admin/${encodeURIComponent(userId)}/banner?page=${encodeURIComponent(page)}`
  );
  return extractArray(raw, ["banners", "items", "content"]).map(mapBanner);
}

export async function uploadAdminBanner(userId: string, page: BannerPage, file: File): Promise<Banner> {
  const validationError = validateThumbnailFile(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append("file", file);
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/admin/${encodeURIComponent(userId)}/banner/${encodeURIComponent(page)}/image`,
    { method: "POST", body: formData }
  );
  return mapBanner(raw);
}

export async function updateAdminBanner(userId: string, page: BannerPage, file: File): Promise<Banner> {
  const validationError = validateThumbnailFile(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append("file", file);
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/admin/${encodeURIComponent(userId)}/banner/${encodeURIComponent(page)}/image`,
    { method: "PUT", body: formData }
  );
  return mapBanner(raw);
}

export async function deleteAdminBanner(userId: string, page: BannerPage): Promise<void> {
  await apiFetch<void>(
    `/api/admin/${encodeURIComponent(userId)}/banner/${encodeURIComponent(page)}`,
    { method: "DELETE" }
  );
}

export async function getPublicBanners(page: BannerPage): Promise<Banner[]> {
  const raw = await apiFetch<unknown>(`/api/banner?page=${encodeURIComponent(page)}`);
  return extractArray(raw, ["banners", "items", "content"])
    .map(mapBanner)
    .filter((banner) => banner.active && banner.imageUrl);
}

export async function getStories(): Promise<AdminStory[]> {
  const raw = await apiFetch<unknown>("/api/admin/story");
  return extractArray(raw, []).map(mapAdminStory);
}

export async function getOffTheRecordStories(): Promise<AdminStory[]> {
  const raw = await apiFetch<unknown>("/api/story");
  return extractArray(raw, []).map(mapAdminStory);
}

export async function createStory(
  userId: string,
  payload: { title: string; username?: string; thumbnailUrl?: string; link?: string; date?: string }
): Promise<AdminStory> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/admin/story/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify({
      story_title: payload.title,
      thumbnail_url: payload.thumbnailUrl,
      ...(payload.link ? { link: payload.link } : {}),
      ...(payload.date ? { created_at: `${payload.date}T00:00:00` } : {}),
    }),
  });
  return mapAdminStory(raw);
}

export async function updateStory(
  userId: string,
  storyId: string,
  payload: { title: string; username?: string; thumbnailUrl?: string; link?: string; date?: string }
): Promise<AdminStory> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/api/admin/story/${encodeURIComponent(userId)}/${encodeURIComponent(storyId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        story_title: payload.title,
        thumbnail_url: payload.thumbnailUrl,
        ...(payload.link ? { link: payload.link } : {}),
        ...(payload.date ? { created_at: `${payload.date}T00:00:00` } : {}),
      }),
    }
  );
  return mapAdminStory(raw);
}

export async function deleteStory(userId: string, storyId: string): Promise<void> {
  await apiFetch<void>(
    `/api/admin/story/${encodeURIComponent(userId)}/${encodeURIComponent(storyId)}`,
    { method: "DELETE" }
  );
}

export async function saveCurationOrder(userId: string, projectIds: number[]): Promise<void> {
  await apiFetch<void>(`/api/admin/${encodeURIComponent(userId)}/curation`, {
    method: "POST",
    body: JSON.stringify({ section_id: 1, projectIds }),
  });
}
