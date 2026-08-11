import { Link } from "react-router-dom";
import { Project } from "@/lib/types/project";

// 홈 가로 스크롤 + 프로젝트 목록 그리드에서 공통으로 쓰는 기본 썸네일 카드
// 규격(1:1 vs 3:4)은 디자인 기획 미확정 - 임시로 4:3 사용
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/project/${project.id}`} className="group w-56 shrink-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-palette-placeholder transition-transform group-hover:scale-[1.02]">
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
          {project.year}
        </span>
      </div>
      <p className="mt-2 text-xs text-palette-muted">{project.types.join(", ")}</p>
      <p className="text-sm font-semibold">{project.title}</p>
    </Link>
  );
}
