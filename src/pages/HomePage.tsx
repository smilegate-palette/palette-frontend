import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "@/components/home/HeroSlider";
import CurationRow from "@/components/home/CurationRow";
import { getPublicBanners, getPublicHomeSettings, CurationSection, Banner } from "@/lib/api/admin";
import { Project } from "@/lib/types/project";

function getSectionProjects(section: CurationSection): Project[] {
  return section.projectIds
    .map((projectId): Project | null => {
      const title = section.projectTitles[String(projectId)] ?? "";
      const thumbnailUrl = section.thumbnailUrls[String(projectId)] ?? "";
      if (!title && !thumbnailUrl) return null;
      return {
        id: String(projectId),
        title,
        thumbnailUrl,
        program: "기타",
        types: [],
        year: new Date().getFullYear(),
      } satisfies Project;
    })
    .filter((project): project is Project => project !== null);
}

export default function HomePage() {
  const [homeBanners, setHomeBanners] = useState<Banner[]>([]);
  const [curationSections, setCurationSections] = useState<CurationSection[]>([]);

  useEffect(() => {
    getPublicBanners("HOME")
      .then(setHomeBanners)
      .catch(() => setHomeBanners([]));
    getPublicHomeSettings()
      .then(setCurationSections)
      .catch(() => setCurationSections([]));
  }, []);

  const homeBanner = homeBanners.find((banner) => banner.size === "PC")?.imageUrl
    ?? homeBanners[0]?.imageUrl
    ?? "";
  const fullscreenBanner = homeBanners.find((banner) => banner.size === "PC_FULLSCREEN")?.imageUrl ?? homeBanner;
  const mobileBanner = homeBanners.find((banner) => banner.size === "MOBILE")?.imageUrl ?? homeBanner;

  const featuredProjects = Array.from(
    new Map(
      curationSections
        .filter((section) => section.active && section.sectionType === "BOTTOM_CURATION")
        .flatMap(getSectionProjects)
        .map((project) => [project.id, project] as const)
    ).values()
  );

  return (
    <div>
      {/* 히어로 배너: Figma node 3:3(데스크탑)/52:3(모바일) 기준 (좌측 정렬, 배경 #ececec) */}
      <section
        className={homeBanner
          ? "relative h-[53.8vw] min-h-[260px] w-full overflow-hidden bg-palette-section md:h-[31.25vw] md:min-h-[420px]"
          : "relative flex min-h-[260px] flex-col gap-3 overflow-hidden bg-palette-section px-4 py-10 md:min-h-[420px] md:gap-4 md:px-6 md:py-24"}
      >
        {homeBanner && (
          <picture className="absolute inset-0">
            <source media="(max-width: 767px)" srcSet={mobileBanner} />
            <source media="(min-width: 2000px)" srcSet={fullscreenBanner} />
            <img src={homeBanner} alt="" className="h-full w-full object-cover" />
          </picture>
        )}
        {homeBanner && <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />}

        <div className={homeBanner
          ? "absolute inset-0 z-10 flex flex-col justify-center gap-3 px-4 text-white md:gap-4 md:px-[5.14vw]"
          : "flex flex-col gap-3 md:gap-4"}>
          <p className={`text-xs font-medium uppercase tracking-widest md:text-sm ${homeBanner ? "text-white/90" : "text-palette-muted"}`}>
            PALETTE YOUTH CREATIVE PLATFORM
          </p>
          <h1 className="text-xl font-bold md:text-4xl">나다운 크리에이터로 자라는 곳</h1>
          <p className="max-w-xl text-sm md:text-base">
            지역아동센터 아동·청소년 창작자들의 프로젝트 아카이빙 + 크리에이터 커뮤니티
          </p>
          <div className="mt-2 flex items-center gap-3 md:gap-4">
            <Link
              to="/project"
              className="rounded-lg bg-palette-accent px-4 py-2.5 text-sm font-semibold text-white shadow-card md:rounded-xl md:px-6 md:py-3 md:text-base"
            >
              프로젝트 탐색하기 →
            </Link>
            <span className={`text-xs md:text-sm ${homeBanner ? "text-white/90" : "text-palette-muted"}`}>
              또는 ↓ 스크롤
            </span>
          </div>
        </div>
      </section>

      <HeroSlider projects={featuredProjects} />

      {curationSections
        .filter((section) => section.active && section.sectionType === "PROJECT_LIST")
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((section) => {
          const projects = getSectionProjects(section);

          return (
            <CurationRow
              key={section.sectionId}
              title={section.title}
              projects={projects}
              moreHref={section.sectionType === "PROJECT_LIST" ? "/project" : undefined}
            />
          );
        })}

      {/* 전체 보기 CTA: 아직 참여 않은 방문자를 PROJECT 목록으로 유도 (컴포넌트 명세 기준) */}
      <div className="flex justify-center px-4 py-8 md:px-6 md:py-10">
        <Link
          to="/project"
          className="rounded-full border border-palette-border bg-white px-5 py-2.5 text-xs font-semibold hover:border-palette-accent md:px-6 md:py-3 md:text-sm"
        >
          전체 프로젝트 보러가기
        </Link>
      </div>
    </div>
  );
}
