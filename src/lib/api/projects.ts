import { apiFetch, USE_MOCK } from "./client";
import { mockProjects } from "@/data/mockProjects";
import { Project, ProjectListParams, ProjectListResponse } from "@/lib/types/project";
import { getStoredEmail } from "@/lib/auth/token";

// 2026.08.11 배포된 실제 Swagger(v0, /v3/api-docs) 재확인 기준 엔드포인트:
//   GET    /api/project                        목록 조회 (엔드포인트.csv엔 /api/project/index였는데 실제론 /index 없음)
//   GET    /api                                 operationId: "home" - 이전엔 /api/home/project로 잘못 알고 있었는데
//                                                 실제 Swagger엔 이 경로로만 있음. 홈 큐레이션용이 맞는지는 실제 데이터로 확인 필요
//   POST   /api/project/{user_id}               프로젝트 등록
//   PATCH  /api/project/{user_id}/{project_id}  프로젝트 수정
//   DELETE /api/project/{user_id}/{project_id}  프로젝트 삭제
// ⚠️ 상세 조회(/api/project/detail)는 CSV엔 "진행도 Yes"라고 되어 있었는데 실제 Swagger엔 여전히 없음 -> mock 유지
// ⚠️ 댓글/관리자 엔드포인트도 이 Swagger에 아직 하나도 없음 -> mock 유지
// ⚠️ GET /api/project는 쿼리 파라미터가 스펙에 전혀 정의되어 있지 않음 -> 필터/정렬은 서버가 무시할 가능성 높음
// ⚠️ 응답 스키마가 비어있어(등록된 프로젝트가 아직 없어서로 추정) 실제 필드를 100% 확정 못함.
//    아래 매핑은 등록용 ProjectRequest 스키마(snake_case: project_title, program_name, partipants(오타),
//    media_url, like_count, category 등) 기준 추정치입니다 - 실제 데이터 들어오면 꼭 재확인해주세요.
function mapProjectResponse(raw: Record<string, unknown>): Project {
  return {
    id: String(raw.id ?? raw.project_id ?? ""),
    title: (raw.project_title as string) ?? "",
    program: (raw.program_name as Project["program"]) ?? "창의워크숍",
    types: raw.category ? [raw.category as Project["types"][number]] : [],
    year: (raw.year as number) ?? new Date().getFullYear(),
    region: raw.region as string | undefined,
    organization: raw.organization as string | undefined,
    team: raw.team as string | undefined,
    // 스펙엔 partipants(오타)로 되어 있음 - 백엔드가 고치면 이 줄도 같이 고쳐야 함
    participants: (raw.partipants as string[]) ?? (raw.participants as string[]) ?? [],
    thumbnailUrl: (raw.thumbnail_url as string) ?? (raw.media_url as string) ?? "",
    mediaUrl: raw.media_url as string | undefined,
    description: raw.description as string | undefined,
    likeCount: (raw.like_count as number) ?? 0,
    isFeatured: (raw.is_featured as boolean) ?? false,
    curationTags: (raw.curation_tags as string[]) ?? [],
    createdAt: raw.created_at as string | undefined,
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
  // TODO: 2026.08.11 재확인한 실제 Swagger(v0)에도 상세 조회 엔드포인트가 여전히 없음.
  // USE_MOCK 값과 무관하게 mock 사용 - 백엔드에 엔드포인트 추가되면 이 조건 지우고 실제 연동.
  return mockProjects.find((p) => p.id === id);
}

export interface CreateProjectPayload {
  program: Project["program"];
  year: number;
  title: string;
  types: string[]; // 업로드 폼은 자유 태그 입력 - 아래에서 category 매핑 시 주의
  region?: string;
  organization?: string;
  participants?: string[];
  description: string;
  mediaUrl?: string;
}

export async function createProject(payload: CreateProjectPayload): Promise<void> {
  // ⚠️ 로그인 응답(UserLoginResponse)에 user_id가 내려오지 않아서, 등록 엔드포인트
  //    POST /api/project/{user_id}에 넣을 진짜 user_id를 만들 방법이 없습니다.
  //    백엔드에서 user_id를 내려주기 전까진 이메일을 placeholder로 넣어서 요청을 보내고,
  //    (십중팔구 서버가 거부하거나 엉뚱한 값으로 처리할 거예요) 실패 시 UploadPage에서
  //    안내 메시지를 보여줍니다. user_id가 내려오게 되면 이 부분만 고치면 됩니다.
  const placeholderUserId = getStoredEmail() ?? "unknown";

  // ⚠️ 백엔드 ProjectRequest.category는 단일 enum(GAME/AI/VIDEO...)인데, 업로드 폼은
  //    자유 태그 입력(예: "게임", "유니티")이라 값 형태가 안 맞을 수 있습니다.
  //    우선 첫 번째 태그만 category로 보냅니다 - 실제 값 검증은 백엔드 확인 필요.
  const body = {
    project_title: payload.title,
    program_name: payload.program,
    year: payload.year,
    region: payload.region,
    partipants: payload.participants ?? [], // 스펙 오타(participants) 그대로 맞춤
    description: payload.description,
    category: payload.types[0],
    media_url: payload.mediaUrl,
  };

  if (USE_MOCK) {
    // mock 모드에서는 실제 등록 없이 성공한 것처럼 처리 (개발 중 폼 확인용)
    return;
  }

  await apiFetch<void>(`/api/project/${encodeURIComponent(placeholderUserId)}`, {
    method: "POST",
    body: JSON.stringify(body),
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
