import { apiFetch, USE_MOCK } from "./client";
import { mockProjects } from "@/data/mockProjects";
import { Project, ProjectListParams, ProjectListResponse } from "@/lib/types/project";

// 진행도 Yes (완료): GET /api/project/index, GET /api/project/detail, PATCH /api/project/{project_id}
// 나머지 프로젝트 API(등록/삭제)는 진행도 No -> mock으로 우선 대응

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

  // TODO: 실제 쿼리 파라미터 스펙이 엔드포인트 문서에는 없음.
  // 기획 문서에 "API 명세: Swagger로 FE/BE/기획 공유" 언급이 있으니 Swagger 링크 받으면 이 부분 교체.
  const query = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {})
  ).toString();

  return apiFetch<ProjectListResponse>(`/api/project/index${query ? `?${query}` : ""}`);
}

export async function getProjectDetail(id: string): Promise<Project | undefined> {
  if (USE_MOCK) {
    return mockProjects.find((p) => p.id === id);
  }

  // TODO: 상세 조회 API가 project_id를 쿼리로 받는지 path param으로 받는지 문서에 명시 안 됨(진행도는 Yes지만 스펙 확인 필요)
  return apiFetch<Project>(`/api/project/detail?project_id=${id}`);
}

export async function getHomeProjects(): Promise<Project[]> {
  // GET /api/home/project - 진행도 No, mock 사용
  if (USE_MOCK) {
    return mockProjects.filter((p) => p.isFeatured);
  }
  return apiFetch<Project[]>(`/api/home/project`);
}
