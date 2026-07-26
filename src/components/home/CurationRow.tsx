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
    <section className="px-6 py-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        {moreHref && (
          <Link to={moreHref} className="text-xs text-palette-muted hover:text-palette-text">
            더보기 →
          </Link>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {projects.slice(0, 6).map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
