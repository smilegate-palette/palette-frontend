import { Link } from "react-router-dom";
import { Project } from "@/lib/types/project";
import ProjectCard from "@/components/common/ProjectCard";

// OTT 스타일 주제별 큐레이션 가로 스크롤 (구축 기획(안) 컴포넌트 명세: 섹션당 6개 카드 + '더보기' 링크)
// 좌우 네비게이션 버튼 hover 노출 여부는 디자인 기획 미확정 - 우선 항상 노출
// Figma 풀스크린 시안(node 89:2, 2560px 초광폭 화면)엔 카드가 7개까지 한 줄로 나와서
// 3xl(2000px~, tailwind.config.ts 커스텀 브레이크포인트) 이상에서는 7개, 그 아래는 기존처럼 5개로 표시하도록 함
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-5 3xl:grid-cols-7">
        {projects.slice(0, 7).map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            // 5번째까지는 항상 보이고, 6~7번째는 3xl(초광폭) 이상에서만 렌더링해서
            // 좁은 화면에서 줄이 어중간하게 넘치지 않도록 함
            className={i >= 5 ? "hidden 3xl:block" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
