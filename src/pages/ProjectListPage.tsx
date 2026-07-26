import { useEffect, useMemo, useState } from "react";
import { getProjects } from "@/lib/api/projects";
import {
  Project,
  ProjectListParams,
  ProjectType,
  PROJECT_TYPES,
  ProgramType,
} from "@/lib/types/project";
import { mockRegions } from "@/data/mockProjects";
import ProjectCard from "@/components/common/ProjectCard";

// 기획 문서 기준 확정된 필터 체계: 프로그램 / 연도 / 형태 / 지역 / 검색 + 정렬(최신순/인기순)
const YEAR_FILTERS = ["ALL", 2026, 2025, 2024, "~2023"] as const;
const PROGRAM_FILTERS: ProgramType[] = ["창의워크숍", "유스파티"];

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<(typeof YEAR_FILTERS)[number]>("ALL");
  const [programFilter, setProgramFilter] = useState<ProgramType | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProjectType | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  const hasActiveFilters =
    yearFilter !== "ALL" || programFilter || typeFilter || regionFilter || keyword;

  const resetFilters = () => {
    setYearFilter("ALL");
    setProgramFilter(null);
    setTypeFilter(null);
    setRegionFilter(null);
    setKeyword("");
  };

  useEffect(() => {
    const params: ProjectListParams = { sort };
    if (typeof yearFilter === "number") params.year = yearFilter;
    if (programFilter) params.program = programFilter;
    if (typeFilter) params.type = typeFilter;
    if (regionFilter) params.region = regionFilter;
    // 컴포넌트 명세 기준: 최소 2자 이상 입력 시 검색 실행
    if (keyword.length >= 2) params.keyword = keyword;

    setLoading(true);
    getProjects(params)
      .then((res) => setProjects(res.projects))
      .finally(() => setLoading(false));
  }, [yearFilter, programFilter, typeFilter, regionFilter, keyword, sort]);

  const resultCountLabel = useMemo(
    () => (loading ? "불러오는 중..." : `${projects.length}개의 프로젝트를 찾았습니다`),
    [loading, projects.length]
  );

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">프로젝트 목록</h1>
        {/* 프로젝트 등록: 회원 로그인 시에만 노출 (권한 매트릭스 기준) - 로그인 미구현이라 우선 항상 노출 */}
        <button className="rounded-full bg-palette-accent px-4 py-2 text-sm font-semibold text-palette-text">
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

      {/* 지역 목록은 실제 프로젝트 데이터 기준으로 채워지는 게 맞음 - 지금은 mock 지역으로 임시 구성 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {mockRegions.map((region) => (
          <FilterChip
            key={region}
            label={region}
            active={regionFilter === region}
            onClick={() => setRegionFilter(regionFilter === region ? null : region)}
          />
        ))}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-palette-muted underline underline-offset-2"
          >
            선택된 필터 초기화
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full border border-palette-border bg-palette-surface px-4 py-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="프로젝트명, 참여자명으로 검색"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <span aria-hidden>🔍</span>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "latest" | "popular")}
          className="rounded-full border border-palette-border bg-palette-surface px-3 py-2 text-sm"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </select>
      </div>

      <p className="mb-4 text-sm text-palette-muted">{resultCountLabel}</p>

      {!loading && projects.length === 0 ? (
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
              className="rounded-full border border-palette-border px-4 py-2 text-sm"
            >
              필터 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
      className={`rounded-full border px-4 py-1.5 text-sm ${
        active
          ? "border-palette-accent bg-palette-accent text-palette-text"
          : "border-palette-border bg-palette-surface text-palette-muted"
      }`}
    >
      {label}
    </button>
  );
}
