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
    getHomeProjects().then(setFeaturedProjects);
    getProjects().then((res) => setAllProjects(res.projects));
  }, []);

  const workshopProjects = allProjects.filter((p) => p.program === "창의워크숍");
  const youthPartyProjects = allProjects.filter((p) => p.program === "유스파티");

  return (
    <div>
      {/* 히어로 배너: 플랫폼 메인 카피 + 배경 비주얼, CTA 버튼 포함 (구축 기획(안) 컴포넌트 명세 기준) */}
      <section className="flex flex-col items-center gap-3 bg-palette-surface px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-widest text-palette-muted">
          PALETTE YOUTH CREATIVE PLATFORM
        </p>
        <h1 className="text-2xl font-bold">나다운 크리에이터로 자라는 곳</h1>
        <p className="text-sm text-palette-muted">
          지역아동센터 아동·청소년 창작자들의 프로젝트 아카이빙 + 크리에이터 커뮤니티
        </p>
        <Link
          to="/project"
          className="mt-2 rounded-full bg-palette-accent px-5 py-2 text-sm font-semibold text-palette-text"
        >
          프로젝트 탐색하기 →
        </Link>
      </section>

      <HeroSlider projects={featuredProjects} />

      <CurationRow title="창의워크숍 프로젝트" projects={workshopProjects} moreHref="/project" />
      <CurationRow title="유스파티 프로젝트" projects={youthPartyProjects} moreHref="/project" />

      {/* 전체 보기 CTA: 아직 참여 않은 방문자를 PROJECT 목록으로 유도 (컴포넌트 명세 기준) */}
      <div className="flex justify-center px-6 py-10">
        <Link
          to="/project"
          className="rounded-full border border-palette-border bg-palette-surface px-6 py-3 text-sm font-semibold hover:border-palette-accent"
        >
          전체 프로젝트 보러가기
        </Link>
      </div>
    </div>
  );
}
