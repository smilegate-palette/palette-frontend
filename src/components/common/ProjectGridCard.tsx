import { Link } from "react-router-dom";
import { Project } from "@/lib/types/project";

// PROJECT 목록 그리드 전용 카드 (Figma node 8:63 실제 시안 기준)
// 홈 큐레이션 카드(ProjectCard, 이미지 위 흰 글씨 오버레이)와 달리
// 카드 배경(#f7f7f7) 안에 이미지 + 검정 텍스트가 아래쪽에 나열되는 구조
export default function ProjectGridCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/project/${project.id}`}
      className="block overflow-hidden rounded-2xl bg-palette-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-palette-placeholder">
        <img
          src={project.thumbnailUrl}
          alt={project.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-black">{project.year}</p>
        <p className="mt-1 text-sm text-black">{project.types.join(", ")}</p>
        <p className="mt-1 text-lg font-semibold text-black">{project.title}</p>
      </div>
    </Link>
  );
}
