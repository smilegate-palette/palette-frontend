import { useEffect, useState } from "react";
import LikeButton from "@/components/project/LikeButton";
import { useParams } from "react-router-dom";
import { getProjectDetail } from "@/lib/api/projects";
import { getComments } from "@/lib/api/comments";
import { Project } from "@/lib/types/project";
import { Comment } from "@/lib/types/comment";
import CommentSection from "@/components/project/CommentSection";
import NotFoundPage from "./NotFoundPage";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | undefined | null>(null); // null = 로딩중
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!id) return;
    getProjectDetail(id).then((data) => {
      setProject(data ?? undefined);
      if (data) getComments(data.id).then(setComments);
    });
  }, [id]);

  if (project === null) {
    return <p className="px-6 py-8 text-sm text-palette-muted">불러오는 중...</p>;
  }
  if (project === undefined) {
    return <NotFoundPage />;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-3 flex gap-2 text-xs">
        <Tag label={project.program} />
        <Tag label={String(project.year)} />
        {project.region && <Tag label={project.region} />}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        {/* "응원해요" 좋아요 기능 - 기획 문서에서 요청됨, API 스펙 미정이라 로컬 state로만 우선 구현 */}
        <LikeButton initialCount={project.likeCount ?? 0} />
      </div>
      <p className="mb-6 text-sm text-palette-muted">
        {[
          project.team,
          project.organization,
          project.types.join(", "),
          project.participants?.join(", "),
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {/* TODO: 미디어 영역 - 컴포넌트 명세 기준 YouTube/Vimeo 임베드, 파일 업로드 영상,
          웹 링크(iframe), 이미지 갤러리(슬라이더)를 업로드 유형에 따라 다르게 렌더링해야 함.
          지금은 이미지 1장만 처리. 업로드 폼 만들 때 같이 확장 필요. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-200">
        <img
          src={project.mediaUrl ?? project.thumbnailUrl}
          alt={project.title}
          className="h-full w-full object-cover"
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-bold">프로젝트 설명</h2>
        <ExpandableDescription text={project.description ?? ""} />
      </section>

      <CommentSection projectId={project.id} initialComments={comments} />
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-palette-border px-3 py-1 text-palette-muted">
      {label}
    </span>
  );
}

// 컴포넌트 명세 기준: 300자 이상이면 접어서 '더보기'로 펼치기
const DESCRIPTION_TRUNCATE_LENGTH = 300;

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESCRIPTION_TRUNCATE_LENGTH;
  const displayText =
    isLong && !expanded ? `${text.slice(0, DESCRIPTION_TRUNCATE_LENGTH)}…` : text;

  return (
    <div>
      <p className="whitespace-pre-line text-sm text-palette-text">{displayText}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-xs font-medium text-palette-muted underline underline-offset-2"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}
