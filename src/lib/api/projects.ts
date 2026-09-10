import { apiFetch, ApiError, USE_MOCK } from "./client";
import { mockProjects } from "@/data/mockProjects";
import { Project, ProjectListParams, ProjectListResponse } from "@/lib/types/project";
import { getStoredUserId } from "@/lib/auth/token";

// 2026.09.06 실제 배포된 Swagger(v0, /v3/api-docs) 재확인 기준 엔드포인트 (project-controller):
//   GET    /api/project                          목록 조회
//   GET    /api/project/{project_id}              상세 조회
//   GET    /api                                   operationId: "home" - 홈 큐레이션용으로 추정 (실제 데이터 형태 미확인)
//   POST   /api/project/{user_id}                 프로젝트 등록
//   PATCH  /api/project/{user_id}/{project_id}    프로젝트 수정
//   DELETE /api/project/{user_id}/{project_id}    프로젝트 삭제
//   POST   /api/project/{project_id}/like/{user_id}    좋아요 등록 (신규)
//   DELETE /api/project/{project_id}/like/{user_id}    좋아요 취소 (신규)
// admin-controller(신규, 아직 프론트 미구현): 승인/반려/큐레이션 순서 변경 등 - 필요해지면 별도로 작업
// ⚠️ GET /api/project는 쿼리 파라미터가 스펙에 전혀 정의되어 있지 않음 -> 필터/정렬은 서버가 무시할 가능성 높음
// ⚠️ 목록/상세 응답 스키마가 제네릭 object라 실제 필드를 100% 확정 못함.
//    아래 매핑은 등록용 ProjectRequest 스키마(snake_case: project_title, program_name, participants,
//    media_url, category 등, 단 likeCount만 예외적으로 camelCase) 기준 추정치입니다 - 실제 데이터 들어오면 꼭 재확인해주세요.
// [x] partipants 오타 -> participants로 수정 확인함 (2026.09.06)
export function mapProjectResponse(raw: Record<string, unknown>): Project {
  // 목록/상세 API의 응답 DTO 이름이 배포 버전에 따라 camelCase 또는 snake_case일 수 있다.
  // 이미지가 없는 것처럼 보이지 않도록 알려진 이미지 필드를 모두 수용한다.
  const thumbnailUrl =
    (raw.thumbnail_url as string) ??
    (raw.thumbnailUrl as string) ??
    (raw.thumbnail as string) ??
    (raw.image_url as string) ??
    (raw.imageUrl as string) ??
    (raw.image as string) ??
    (raw.media_url as string) ??
    "";

  return {
    id: String(raw.id ?? raw.project_id ?? raw.projectId ?? raw.projectID ?? ""),
    title: (raw.project_title as string) ?? "",
    program: (raw.program_name as Project["program"]) ?? "창의워크숍",
    types: raw.category ? [raw.category as Project["types"][number]] : [],
    year: (raw.year as number) ?? new Date().getFullYear(),
    region: raw.region as string | undefined,
    organization: raw.organization as string | undefined,
    team: raw.team as string | undefined,
    participants: (raw.participants as string[]) ?? [],
    thumbnailUrl,
    mediaUrl: raw.media_url as string | undefined,
    description: raw.description as string | undefined,
    // ProjectRequest 스키마엔 likeCount(camelCase)로 되어 있는데 다른 필드는 전부 snake_case라
    // 예외적인 케이스로 보임 - 혹시 몰라 like_count도 같이 확인함
    likeCount: (raw.likeCount as number) ?? (raw.like_count as number) ?? 0,
    isFeatured: (raw.is_featured as boolean) ?? false,
    curationTags: (raw.curation_tags as string[]) ?? [],
    createdAt: raw.created_at as string | undefined,
    status: raw.status as Project["status"],
    rejectReason: raw.reject_reason as string | undefined,
  };
}

export async function getProjects(
  params: ProjectListParams = {}
): Promise<ProjectListResponse> {
  if (USE_MOCK) {
    let list = [...mockProjects];
    if (params.program) list = list.filter((p) => p.program === params.program);
    if (params.year) list = list.filter((p) => p.year === params.year);
    if (params.region) list = list.filter((p) => p.region === params.region);
    if (params.type) list = list.filter((p) => p.types.includes(params.type!));
    if (params.keyword) {
      // 검색 대상: 프로젝트명, 센터명(기관명), 창작자명(참여자), 설명
      // (문서 내 두 군데 스펙이 조금씩 달라서 합집합으로 구현)
      const kw = params.keyword.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.organization?.toLowerCase().includes(kw) ||
          p.description?.toLowerCase().includes(kw) ||
          p.participants?.some((name) => name.toLowerCase().includes(kw))
      );
    }

    if (params.sort === "popular") {
      list = [...list].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }

    return { projects: list, total: list.length };
  }

  // 서버가 쿼리 파라미터를 받아주는지 아직 불확실하지만 일단 보내봄(무시해도 에러는 안 남).
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {})
  ).toString();

  const raw = await apiFetch<Record<string, unknown>[] | Record<string, unknown>>(
    `/api/project${query ? `?${query}` : ""}`
  );
  const list = Array.isArray(raw) ? raw : (raw as { projects?: unknown[] })?.projects ?? [];
  const projects = (list as Record<string, unknown>[]).map(mapProjectResponse);
  return { projects, total: projects.length };
}

export async function getProjectDetail(id: string): Promise<Project | undefined> {
  // 2026.08 Swagger에 GET /api/project/{project_id}(operationId: GetProjectDetail) 추가됨.
  // 응답 스키마가 제네릭 object라 정확한 필드명은 미확정 - 목록 조회와 같은 ProjectRequest 기반
  // snake_case로 가정하고 mapProjectResponse를 그대로 재사용함. 실제 데이터 보고 다르면 고쳐야 함.
  try {
    const raw = await apiFetch<Record<string, unknown>[] | Record<string, unknown>>(
      `/api/project/${id}`
    );
    const detail = Array.isArray(raw) ? raw[0] : raw;
    return detail ? mapProjectResponse(detail) : undefined;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export interface CreateProjectPayload {
  program: Project["program"];
  year: number;
  title: string;
  // 2026.09.06 백엔드 category가 고정 enum이라, 업로드 폼도 자유 태그 입력 대신
  // PROJECT_TYPES 기반 드롭다운 단일 선택으로 되돌림 (Figma는 자유 태그였지만 값 형태를 맞추기 위한 결정)
  category: Project["types"][number] | "";
  region?: string;
  organization?: string;
  participants?: string[];
  description: string;
  mediaUrl?: string;
  /** 서버가 별도 파일 업로드 API를 제공하지 않는 현재 계약에서는 data URL로 전송한다. */
  thumbnailUrl?: string;
}

export async function createProject(payload: CreateProjectPayload): Promise<void> {
  // 2026.08.11 백엔드가 로그인 응답에 user_id를 내려주기 시작해서, 등록 엔드포인트
  // POST /api/project/{user_id}에 실제 user_id를 쓰도록 수정함 (이전엔 이메일을 임시로 넣었었음).
  const userId = getStoredUserId();

  const body = {
    project_title: payload.title,
    program_name: payload.program,
    year: payload.year,
    region: payload.region,
    participants: payload.participants ?? [], // 2026.09.06 백엔드가 오타(partipants) 고쳐줘서 같이 수정함
    description: payload.description,
    category: payload.category || undefined,
    media_url: payload.mediaUrl,
    thumbnail_url: payload.thumbnailUrl,
  };

  if (USE_MOCK) {
    // mock 모드에서는 실제 등록 없이 성공한 것처럼 처리 (개발 중 폼 확인용)
    return;
  }

  if (!userId) {
    // 로그인은 되어 있는데 user_id가 없는 경우 - user_id가 추가되기 전에 로그인했던 세션이라
    // localStorage에 저장이 안 된 상태일 수 있음. 재로그인하면 해결됨.
    throw new Error(
      "사용자 정보를 찾을 수 없어요. 로그아웃 후 다시 로그인해주세요."
    );
  }

  await apiFetch<void>(`/api/project/${encodeURIComponent(userId)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// 2026.09.06 신규: "응원해요" 좋아요 등록/취소. 서버에 "내가 이미 눌렀는지" 조회하는 API가
// 없어서, 프론트에서는 이번 세션에 누른 것만 기억하는 로컬 상태로 liked 여부를 관리함 (LikeButton 참고).
export async function likeProject(projectId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/project/${projectId}/like/${encodeURIComponent(userId)}`, {
    method: "POST",
  });
}

export async function unlikeProject(projectId: string, userId: string): Promise<void> {
  await apiFetch<void>(`/api/project/${projectId}/like/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export async function getHomeProjects(): Promise<Project[]> {
  if (USE_MOCK) {
    return mockProjects.filter((p) => p.isFeatured);
  }
  // 2026.08.11 재확인: /api/home/project가 아니라 GET /api (operationId: "home")가 실제 경로였음.
  // 홈 큐레이션 데이터가 맞는지는 실제 응답 받아봐야 확실함 - 형태가 다르면 다시 고쳐야 할 수 있음.
  const raw = await apiFetch<Record<string, unknown>[] | Record<string, unknown>>(`/api`);
  const list = Array.isArray(raw) ? raw : [];
  return (list as Record<string, unknown>[]).map(mapProjectResponse);
}
