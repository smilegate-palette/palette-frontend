import { Link } from "react-router-dom";
import { Project } from "@/lib/types/project";
import ProjectCard from "@/components/common/ProjectCard";

// OTT 스타일 주제별 큐레이션 가로 스크롤 (구축 기획(안) 컴포넌트 명세: 섹션당 6개 카드 + '더보기' 링크)
// 좌우 네비게이션 버튼 hover 노출 여부는 디자인 기획 미확정 - 우선 항상 노출
export default function CurationRow({
  title,
  projects,
  moreHref,
}: {
  title: string;
  projects: Project[];
  moreHref?: string;
}) {
  if (projects.length === 0) return null;

  return (
    <section className="px-4 py-4 md:px-6 md:py-6">
      <div className="mb-2 flex items-center justify-between md:mb-3">
        <h2 className="text-sm font-bold md:text-base">{title}</h2>
        {moreHref && (
          <Link to={moreHref} className="text-xs text-palette-muted hover:text-palette-text">
            더보기 →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
        {projects.slice(0, 5).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
