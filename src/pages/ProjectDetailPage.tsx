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
  const { userId, role } = useAuth();
  const [project, setProject] = useState<Project | undefined | null>(null); // null = 로딩중
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  // PROJECT 목록처럼 비로그인 상태에서 401/403이 날 수 있어서 별도로 구분해서 안내
  const [authError, setAuthError] = useState(false);

  const isOwner = Boolean(project?.ownerId && project.ownerId === userId);
  const isAdmin = role === "ADMIN";

  const startEditingDescription = () => {
    if (!project) return;
    setDescriptionDraft(project.description ?? "");
    setEditError(null);
    setEditingDescription(true);
  };

  const saveDescription = async () => {
    if (!project) return;
    if (!descriptionDraft.trim()) {
      setEditError("프로젝트 설명을 입력해주세요.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateProject(project.id, {
        title: project.title,
        description: descriptionDraft,
      });
      setProject({ ...project, description: descriptionDraft });
      setEditingDescription(false);
      setEditError(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "프로젝트 수정에 실패했어요.");
    } finally {
      setSavingEdit(false);
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

  // Figma(2026.11) 시안: 색 네모 범례 대신 이모티콘(👥 팀 / 📍 기관 / 🎨 유형 / 👶 아이들)을 쓰고,
  // 팀·기관·유형은 글자 길이와 상관없이 항상 같은 간격(gap)으로 이어 붙이며, 참여 아이들은 10명이 넘을 수 있어서 다음 줄에 둬요.
  const metaItems = [
    { emoji: "👥", label: project.team },
    { emoji: "📍", label: project.organization },
    { emoji: "🎨", label: project.types.join(", ") },
  ].filter((item) => Boolean(item.label));
  const participantsLabel = project.participants?.filter(Boolean).join(", ");

  // Figma 풀스크린 시안(node 90:500)을 보니 상세 페이지도 다른 페이지들처럼
  // 가운데 정렬된 좁은 컬럼이 아니라 좌우 여백만 있고 화면 끝까지 꽉 채우는 레이아웃이라
  // (이전엔 max-w-4xl로 좁게 구현했었는데) 목록/홈 페이지와 동일한 패딩 방식으로 맞췄습니다.
  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-3 flex flex-wrap gap-2">
        <MetaChip label={String(project.year)} />
        <MetaChip label={project.program} />
        {project.region && <MetaChip label={project.region} />}
      </div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold md:text-3xl">{project.title}</h1>
        <div className="flex items-center gap-2">
          {(isOwner || isAdmin) && (
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-500"
            >
              삭제
            </button>
          )}
          <LikeButton projectId={project.id} initialCount={project.likeCount ?? 0} />
        </div>
      </div>

      {(metaItems.length > 0 || participantsLabel) && (
        <div className="mb-4 flex flex-col gap-1.5 md:mb-6 md:gap-3">
          {metaItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              {metaItems.map((item) => (
                <span key={item.emoji} className="flex items-center gap-1.5 text-xs text-palette-muted md:text-xl">
                  <span aria-hidden>{item.emoji}</span>
                  {item.label}
                </span>
              ))}
            </div>
          )}
          {participantsLabel && (
            <span className="flex items-start gap-1.5 text-xs text-palette-muted md:text-xl">
              <span aria-hidden>👶</span>
              {participantsLabel}
            </span>
          )}
        </div>
      )}

      <div className="relative mx-auto aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-palette-placeholder md:rounded-2xl">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white">
            {project.title}
          </div>
        )}
      </div>

      {project.mediaUrl && (
        <ProjectMediaLink mediaUrl={project.mediaUrl} projectTitle={project.title} />
      )}

      <section className="mt-6 md:mt-10">
        <div className="mb-2 flex items-center justify-between gap-3 md:mb-3">
          <h2 className="text-base font-bold md:text-2xl">프로젝트 설명</h2>
          {isOwner && !editingDescription && (
            <button
              type="button"
              onClick={startEditingDescription}
              className="rounded-lg border border-palette-border px-2.5 py-1.5 text-xs text-palette-muted"
            >
              설명 수정
            </button>
          )}
        </div>
        {editingDescription ? (
          <div>
            <textarea
              autoFocus
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              rows={7}
              className="w-full resize-y rounded-lg bg-palette-section px-3 py-2.5 text-sm text-palette-text outline-none focus:ring-2 focus:ring-palette-accent md:px-4 md:py-3 md:text-lg"
            />
            {editError && <p className="mt-2 text-sm text-red-500">{editError}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={saveDescription}
                disabled={savingEdit}
                className="rounded-lg bg-palette-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingEdit ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingDescription(false);
                  setEditError(null);
                }}
                disabled={savingEdit}
                className="rounded-lg border border-palette-border px-4 py-2 text-sm font-semibold text-palette-muted disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <ExpandableDescription text={project.description ?? ""} />
        )}
      </section>

      <CommentSection projectId={project.id} initialComments={comments} />
    </div>
  );
}

function ProjectMediaLink({ mediaUrl, projectTitle }: { mediaUrl: string; projectTitle: string }) {
  const isDataUrl = /^data:[^,]*,/i.test(mediaUrl);
  const safeWebUrl = isDataUrl ? undefined : getSafeWebUrl(mediaUrl);
  if (!isDataUrl && !safeWebUrl) return null;

  const downloadName = `${projectTitle.replace(/[\\/:*?"<>|]/g, "_")}-첨부파일`;
  return (
    <div className="mx-auto mt-4 w-full max-w-5xl">
      {isDataUrl ? (
        <a
          href={mediaUrl}
          download={downloadName}
          className="inline-flex rounded-lg bg-palette-accent px-4 py-2.5 text-sm font-semibold text-white"
        >
          첨부파일 다운로드
        </a>
      ) : (
        <a
          href={safeWebUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg bg-palette-accent px-4 py-2.5 text-sm font-semibold text-white"
        >
          프로젝트 링크 열기
        </a>
      )}
    </div>
  );
}

function getSafeWebUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
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
