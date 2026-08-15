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
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">프로젝트 목록</h1>
        {/* 프로젝트 등록: 회원 로그인 시에만 노출 (권한 매트릭스 기준) - 로그인 미구현이라 우선 항상 노출 */}
        <button className="rounded-xl bg-palette-accent px-6 py-3 text-base font-semibold text-white shadow-strong">
          + 프로젝트 올리기
        </button>
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl bg-palette-input px-4 py-3 shadow-soft">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="프로젝트명, 참여자명으로 검색"
            className="flex-1 bg-transparent text-sm text-black outline-none placeholder:text-palette-muted"
          />
          <span aria-hidden>🔍</span>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "latest" | "popular")}
          className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black shadow-soft"
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        active ? "bg-palette-accent text-white" : "bg-palette-section text-black"
      }`}
    >
      {label}
    </button>
  );
}
