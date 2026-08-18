import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroSlider from "@/components/home/HeroSlider";
import CurationRow from "@/components/home/CurationRow";
import { getHomeProjects, getProjects } from "@/lib/api/projects";
import { Project } from "@/lib/types/project";

export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    // 비로그인 상태에서 401/403이 나도 홈 화면 자체는 깨지지 않게 조용히 무시하고 빈 목록으로 둠
    // (로그인 요구 안내는 PROJECT 목록 페이지 쪽에서 명확히 보여줌)
    getHomeProjects()
      .then(setFeaturedProjects)
      .catch(() => setFeaturedProjects([]));
    getProjects()
      .then((res) => setAllProjects(res.projects))
      .catch(() => setAllProjects([]));
  }, []);

  const workshopProjects = allProjects.filter((p) => p.program === "창의워크숍");
  const youthPartyProjects = allProjects.filter((p) => p.program === "유스파티");

  return (
    <div>
      {/* 히어로 배너: Figma node 3:3(데스크탑)/52:3(모바일) 기준 (좌측 정렬, 배경 #ececec) */}
      <section className="flex flex-col gap-3 bg-palette-section px-4 py-10 md:gap-4 md:px-6 md:py-24">
        <p className="text-xs font-medium uppercase tracking-widest text-palette-muted md:text-sm">
          PALETTE YOUTH CREATIVE PLATFORM
        </p>
        <h1 className="text-xl font-bold md:text-4xl">나다운 크리에이터로 자라는 곳</h1>
        <p className="text-sm text-black md:text-base">
          지역아동센터 아동·청소년 창작자들의 프로젝트 아카이빙 + 크리에이터 커뮤니티
        </p>
        <div className="mt-2 flex items-center gap-3 md:gap-4">
          <Link
            to="/project"
            className="rounded-lg bg-palette-accent px-4 py-2.5 text-sm font-semibold text-white shadow-card md:rounded-xl md:px-6 md:py-3 md:text-base"
          >
            프로젝트 탐색하기 →
          </Link>
          <span className="text-xs text-palette-muted md:text-sm">또는 ↓ 스크롤</span>
        </div>
      </section>

      <HeroSlider projects={featuredProjects} />

      <CurationRow title="창의워크숍 프로젝트" projects={workshopProjects} moreHref="/project" />
      <CurationRow title="유스파티 프로젝트" projects={youthPartyProjects} moreHref="/project" />

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
