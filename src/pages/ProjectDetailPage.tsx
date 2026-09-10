import { useEffect, useState } from "react";
import LikeButton from "@/components/project/LikeButton";
import { useNavigate, useParams } from "react-router-dom";
import { deleteProject, getProjectDetail, updateProject } from "@/lib/api/projects";
import { getComments } from "@/lib/api/comments";
import { ApiError } from "@/lib/api/client";
import { Project } from "@/lib/types/project";
import { Comment } from "@/lib/types/comment";
import CommentSection from "@/components/project/CommentSection";
import NotFoundPage from "./NotFoundPage";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [project, setProject] = useState<Project | undefined | null>(null); // null = 로딩중
  const [comments, setComments] = useState<Comment[]>([]);
  // PROJECT 목록처럼 비로그인 상태에서 401/403이 날 수 있어서 별도로 구분해서 안내
  const [authError, setAuthError] = useState(false);

  const isOwner = Boolean(project?.ownerId && project.ownerId === userId);

  const handleEdit = async () => {
    if (!project) return;
    const title = window.prompt("프로젝트명을 수정해주세요.", project.title)?.trim();
    if (!title) return;
    const description = window.prompt("프로젝트 설명을 수정해주세요.", project.description ?? "")?.trim();
    if (!description) return;
    try {
      await updateProject(project.id, { title, description });
      setProject({ ...project, title, description });
    } catch (err) {
      setAuthError(false);
      window.alert(err instanceof Error ? err.message : "프로젝트 수정에 실패했어요.");
    }
  };

  const handleDelete = async () => {
    if (!project || !window.confirm("프로젝트를 삭제할까요?")) return;
    try {
      await deleteProject(project.id);
      navigate("/project");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "프로젝트 삭제에 실패했어요.");
    }
  };

  useEffect(() => {
    if (!id) return;
    setProject(null);
    setAuthError(false);
    getProjectDetail(id)
      .then((data) => {
        setProject(data ?? undefined);
        if (data) getComments(data.id).then(setComments).catch(() => setComments([]));
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setAuthError(true);
        }
        setProject(undefined);
      });
  }, [id]);

  if (project === null) {
    return <p className="px-6 py-8 text-sm text-palette-muted">불러오는 중...</p>;
  }
  if (authError) {
    return (
      <p className="px-6 py-8 text-sm text-palette-muted">
        로그인 후 이용할 수 있는 페이지예요. 로그인하고 다시 시도해주세요.
      </p>
    );
  }
  if (project === undefined) {
    return <NotFoundPage />;
  }

  // Figma(node 12:333 데스크탑 / 52:645 모바일) 기준 색상 범례: 팀=노랑, 기관=빨강, 형태=청록, 참여자=초록
  const metaLegend = [
    { label: project.team, color: "bg-palette-accent" },
    { label: project.organization, color: "bg-[#ff3c00]" },
    { label: project.types.join(", "), color: "bg-[#1bdbea]" },
    { label: project.participants?.join(", "), color: "bg-[#3ddc84]" },
  ].filter((item): item is { label: string; color: string } => Boolean(item.label));

  // Figma 풀스크린 시안(node 90:500)을 보니 상세 페이지도 다른 페이지들처럼
  // 가운데 정렬된 좁은 컬럼이 아니라 좌우 여백만 있고 화면 끝까지 꽉 채우는 레이아웃이라
  // (이전엔 max-w-4xl로 좁게 구현했었는데) 목록/홈 페이지와 동일한 패딩 방식으로 맞췄습니다.
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-3 flex flex-wrap gap-2">
        <MetaChip label={project.program} />
        <MetaChip label={String(project.year)} />
        {project.region && <MetaChip label={project.region} />}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold md:text-3xl">{project.title}</h1>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button
                onClick={handleEdit}
                className="rounded-lg border border-palette-border px-2.5 py-1.5 text-xs text-palette-muted"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500"
              >
                삭제
              </button>
            </>
          )}
          <LikeButton projectId={project.id} initialCount={project.likeCount ?? 0} />
        </div>
      </div>

      {metaLegend.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 md:mb-6">
          {metaLegend.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-palette-muted md:text-base">
              <span className={`size-2.5 shrink-0 md:size-4 ${item.color}`} aria-hidden />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {/* TODO: 미디어 영역 - 컴포넌트 명세 기준 YouTube/Vimeo 임베드, 파일 업로드 영상,
          웹 링크(iframe), 이미지 갤러리(슬라이더)를 업로드 유형에 따라 다르게 렌더링해야 함.
          지금은 이미지 1장만 처리. 업로드 폼 만들 때 같이 확장 필요. */}
      <div className="relative mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-palette-placeholder md:rounded-2xl">
        <img
          src={project.thumbnailUrl || project.mediaUrl}
          alt={project.title}
          className="h-full w-full object-cover"
        />
      </div>

      <section className="mt-6 md:mt-10">
        <h2 className="mb-2 text-base font-bold md:mb-3 md:text-2xl">프로젝트 설명</h2>
        <ExpandableDescription text={project.description ?? ""} />
      </section>

      <CommentSection projectId={project.id} initialComments={comments} />
    </div>
  );
}

// 필터 칩과 동일한 스타일(#ececec pill) - Figma 상세 페이지에서도 목록 필터와 같은 톤 사용
function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-palette-section px-3 py-1.5 text-xs text-palette-muted md:px-4 md:py-2 md:text-base">
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
      <p className="whitespace-pre-line text-sm text-palette-text md:text-lg">{displayText}</p>
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
