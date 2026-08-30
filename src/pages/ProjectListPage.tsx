import { useEffect, useMemo, useState } from "react";
import { getProjects } from "@/lib/api/projects";
import { ApiError } from "@/lib/api/client";
import { Link } from "react-router-dom";
import {
  Project,
  ProjectListParams,
  ProjectType,
  PROJECT_TYPES,
  ProgramType,
} from "@/lib/types/project";
import ProjectGridCard from "@/components/common/ProjectGridCard";

// 기획 문서 + Figma(node 8:63) 기준 확정된 필터 체계: 프로그램 / 연도 / 형태 / 지역 / 검색 + 정렬
const YEAR_FILTERS = ["ALL", 2026, 2025, 2024, "~2023"] as const;
const PROGRAM_FILTERS: ProgramType[] = ["창의워크숍", "유스파티"];

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [yearFilter, setYearFilter] = useState<(typeof YEAR_FILTERS)[number]>("ALL");
  const [programFilter, setProgramFilter] = useState<ProgramType | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProjectType | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  const hasActiveFilters = yearFilter !== "ALL" || programFilter || typeFilter || keyword;

  const resetFilters = () => {
    setYearFilter("ALL");
    setProgramFilter(null);
    setTypeFilter(null);
    setKeyword("");
  };

  useEffect(() => {
    const params: ProjectListParams = { sort };
    if (typeof yearFilter === "number") params.year = yearFilter;
    if (programFilter) params.program = programFilter;
    if (typeFilter) params.type = typeFilter;
    // 컴포넌트 명세 기준: 최소 2자 이상 입력 시 검색 실행
    if (keyword.length >= 2) params.keyword = keyword;

    setLoading(true);
    setAuthError(false);
    getProjects(params)
      .then((res) => setProjects(res.projects))
      .catch((err) => {
        // 백엔드가 로그인 여부를 먼저 확인하는 구조라, 비로그인 상태면 401/403이 날 수 있음
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setAuthError(true);
        }
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, [yearFilter, programFilter, typeFilter, keyword, sort]);

  const resultCountLabel = useMemo(
    () => (loading ? "불러오는 중..." : `${projects.length}개의 프로젝트를 찾았습니다`),
    [loading, projects.length]
  );

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-xl font-bold text-black md:text-3xl">프로젝트 목록</h1>
        {/* 프로젝트 등록: 로그인 여부와 무관하게 버튼은 노출하고, 비로그인이면 업로드 페이지에서 로그인 유도 (권한 매트릭스 기준) */}
        <Link
          to="/project/upload"
          className="rounded-lg bg-palette-accent px-3 py-2 text-xs font-semibold text-white shadow-strong md:rounded-xl md:px-6 md:py-3 md:text-base"
        >
          + 프로젝트 올리기
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {YEAR_FILTERS.map((year) => (
          <FilterChip
            key={String(year)}
            label={String(year)}
            active={yearFilter === year}
            onClick={() => setYearFilter(year)}
          />
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {PROGRAM_FILTERS.map((program) => (
          <FilterChip
            key={program}
            label={program}
            active={programFilter === program}
            onClick={() => setProgramFilter(programFilter === program ? null : program)}
          />
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {PROJECT_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={type}
            active={typeFilter === type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
          />
        ))}
      </div>

      {hasActiveFilters && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {keyword && (
            <span className="flex items-center gap-1 rounded-xl bg-palette-highlight px-3 py-1.5 text-sm text-black">
              {keyword}
              <button onClick={() => setKeyword("")} aria-label="검색어 지우기">
                ×
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-palette-muted underline underline-offset-2"
          >
            선택된 필터 초기화
          </button>
        </div>
      )}

      {/* 검색창+정렬: 모바일(Figma node 52:384)에서도 한 줄에 나란히 있어서 min-width를 좁게 잡음 */}
      <div className="mb-4 flex items-center gap-2 md:mb-6 md:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-palette-input px-3 py-2 shadow-soft md:rounded-xl md:px-4 md:py-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="프로젝트명, 참여자명으로 검색"
            className="min-w-0 flex-1 bg-transparent text-xs text-black outline-none placeholder:text-palette-muted md:text-sm"
          />
          <span aria-hidden>🔍</span>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "latest" | "popular")}
          className="shrink-0 rounded-lg bg-palette-input px-2 py-2 text-xs text-black shadow-soft md:rounded-xl md:px-4 md:py-3 md:text-sm"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      <p className="mb-4 text-lg font-semibold text-black">{resultCountLabel}</p>

      {authError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-palette-muted">
            로그인이 필요한 페이지예요. 로그인 후 다시 시도해주세요.
          </p>
          <Link
            to="/login"
            className="rounded-xl bg-palette-accent px-4 py-2 text-sm font-semibold text-white"
          >
            로그인하러 가기
          </Link>
        </div>
      ) : !loading && projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🔍
          </p>
          <p className="text-sm text-palette-muted">
            검색 결과가 없습니다. 다른 키워드를 입력해보세요.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="rounded-xl bg-palette-section px-4 py-2 text-sm"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        // Figma 풀스크린 시안(node 90:272, 2560px)엔 6열로 나와서 3xl(2000px~) 이상에서 6열로 늘림
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4 3xl:grid-cols-6">
          {projects.map((project) => (
            <ProjectGridCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium md:rounded-xl md:px-4 md:py-2 md:text-sm ${
        active ? "bg-palette-accent text-white" : "bg-palette-section text-black"
      }`}
    >
      {label}
    </button>
  );
}
