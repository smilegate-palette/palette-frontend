import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getAdminDashboard,
  getAdminProjectDetail,
  getAdminComments,
  deleteAdminComment,
  approveProject,
  rejectProject,
  updateAdminProject,
  createStory,
  updateStory,
  deleteStory,
  getStories,
  getAdminBanners,
  uploadAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  BannerPage,
  Banner,
  CurationSection,
  AdminStory,
  AdminStats,
  getCuration,
  saveCurationSection,
  deleteCurationSection,
} from "@/lib/api/admin";
import { getProjectsFromApi, uploadProjectThumbnail, validateThumbnailFile } from "@/lib/api/projects";
import { Comment } from "@/lib/types/comment";
import { ApiError } from "@/lib/api/client";
import { Project, ProjectType, PROJECT_TYPES } from "@/lib/types/project";

// 관리자 페이지. Figma 관리자 시안(데스크탑 node 92:2 / 모바일 99:540 / 풀스크린 99:386) 기준으로
// 상단 통계 카드 + 승인 대기 프로젝트 테이블(승인/반려/수정) + 최근 댓글 + HOME 큐레이션 순서로 구성.
//
// 관리자 API 응답의 프로젝트, 댓글, 스토리, HOME 큐레이션을 한 화면에서 관리합니다.

const STAT_CARDS: {
  key: "pending" | "total" | "comments" | "stories";
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "pending", label: "승인대기", icon: "⏳", color: "#ff3c00" },
  { key: "total", label: "총 프로젝트", icon: "☑️", color: "#1bdbea" },
  { key: "comments", label: "오늘 댓글", icon: "💬", color: "#7d57e6" },
  { key: "stories", label: "스토리", icon: "📖", color: "#20b958" },
];

// 기획 시트 #7: 캐러셀 큐레이션 3개 → 10개로 확대 (일단 10개로 지정)
const MAX_CURATION = 10;

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, userId, role } = useAuth();
  const isAdmin = role === "ADMIN";
  const [projects, setProjects] = useState<Project[] | null>(null); // null = 로딩중
  const [totalProjectCount, setTotalProjectCount] = useState(0);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyUsername, setStoryUsername] = useState("");
  const [storyLink, setStoryLink] = useState("");
  const [storyDate, setStoryDate] = useState("");
  const [storyThumbnailFile, setStoryThumbnailFile] = useState<File | null>(null);
  const [storyThumbnailPreview, setStoryThumbnailPreview] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [savingStory, setSavingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [editing, setEditing] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ProjectType | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editOrganization, setEditOrganization] = useState("");
  const [editParticipants, setEditParticipants] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState("");
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [sections, setSections] = useState<CurationSection[] | null>(null);
  const [curationProjects, setCurationProjects] = useState<{ id: number; title: string }[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [showCurationList, setShowCurationList] = useState(false);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [savingCuration, setSavingCuration] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<number | null>(null);
  const commentSectionRef = useRef<HTMLElement | null>(null);

  const [bannerPage, setBannerPage] = useState<BannerPage>("HOME");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const [selectedCurationId, setSelectedCurationId] = useState<number | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState("");
  const [sectionDisplayOrderDraft, setSectionDisplayOrderDraft] = useState(1);
  const [sectionActiveDraft, setSectionActiveDraft] = useState(true);
  const [deletingCurationId, setDeletingCurationId] = useState<number | null>(null);
  const [curationProjectSearch, setCurationProjectSearch] = useState("");
  const selectedCurationType = sections?.find((section) => section.sectionId === selectedCurationId)?.sectionType;

  const load = async (uid: string) => {
    setError(null);
    try {
      const [dashboardResult, storiesResult, projectListResult, curationResult] = await Promise.allSettled([
        getAdminDashboard(uid),
        getStories(),
        getProjectsFromApi(),
        getCuration(uid),
      ]);
      if (dashboardResult.status === "rejected") throw dashboardResult.reason;
      const dashboard = dashboardResult.value;
      setProjects(dashboard.pendingProjects);
      setTotalProjectCount(dashboard.totalCount ?? dashboard.allProjects.length);
      setStories(dashboard.stories);
      setStats(dashboard.stats ?? null);
      const loadedSections = curationResult.status === "fulfilled"
        ? curationResult.value
        : dashboard.curation;
      setSections(loadedSections);
      const firstSection = [...loadedSections].sort((a, b) => a.displayOrder - b.displayOrder)[0];
      if (firstSection) {
        selectCurationSection(firstSection);
      } else {
        beginNewCuration();
      }
      setCurationError(null);
      setComments(null);
      if (storiesResult.status === "fulfilled") {
        setStories(storiesResult.value);
        setStoryError(null);
      } else {
        setStories([]);
        setStoryError("스토리 목록을 불러오지 못했어요.");
      }
      if (projectListResult.status === "fulfilled") {
        setAvailableProjects(projectListResult.value.projects);
      } else {
        setAvailableProjects([]);
        setCurationError("전체 프로젝트 목록을 불러오지 못했어요.");
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError("관리자 권한이 없어요. (일반 계정은 이 페이지를 이용할 수 없어요)");
      } else {
        setError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      }
      setProjects([]);
      setComments(null);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || !userId) return;
    load(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, userId]);

  useEffect(() => {
    const section = commentSectionRef.current;
    if (!section || !userId || !isAdmin || comments !== null) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const projectIdsByTitle = new Map<string, string>();
      sections?.forEach((currentSection) => {
        Object.entries(currentSection.projectTitles).forEach(([projectId, title]) => {
          projectIdsByTitle.set(title, projectId);
        });
      });
      getAdminComments(userId, projectIdsByTitle)
        .then(setComments)
        .catch(() => {
          setComments([]);
          setError("댓글 목록을 불러오지 못했어요.");
        });
      observer.disconnect();
    }, { threshold: 0.1 });
    observer.observe(section);
    return () => observer.disconnect();
  }, [comments, isAdmin, sections, userId]);

  const pendingCount = projects?.filter((p) => (p.status ?? "PENDING") === "PENDING").length ?? 0;
  const totalCount = totalProjectCount;

  const handleApprove = async (project: Project) => {
    if (!userId) return;
    setActioningId(project.id);
    setActionMessage(null);
    try {
      await approveProject(userId, project.id);
      setError(null);
      setActionMessage("승인되었습니다.");
    } catch {
      setError("승인 처리에 실패했어요.");
    } finally {
      setActioningId(null);
    }
    if (userId) await load(userId);
  };

  const startReject = (project: Project) => {
    setRejectingId(project.id);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!userId || !rejectingId || !rejectReason.trim()) return;
    setActioningId(rejectingId);
    setActionMessage(null);
    try {
      await rejectProject(userId, rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      setActionMessage("반려되었습니다.");
      await load(userId);
    } catch {
      setError("반려 처리에 실패했어요.");
    } finally {
      setActioningId(null);
    }
  };

  const startEdit = async (project: Project) => {
    setEditing(project);
    setEditTitle(project.title);
    setEditCategory(project.types[0] ?? "");
    setEditDescription(project.description ?? "");
    setEditOrganization(project.organization ?? "");
    setEditParticipants(project.participants?.join(", ") ?? "");
    setEditMediaUrl(project.mediaUrl ?? "");
    setEditThumbnailFile(null);
    setEditThumbnailPreview(project.thumbnailUrl ?? "");
    setEditError(null);

    if (!userId) return;
    try {
      const details = await getAdminProjectDetail(userId, project.id);
      if (!details) return;
      setEditing((current) => current?.id === project.id ? details : current);
      setEditTitle(details.title || project.title);
      setEditCategory(details.types[0] ?? project.types[0] ?? "");
      setEditDescription(details.description ?? project.description ?? "");
      setEditOrganization(details.organization ?? project.organization ?? "");
      setEditParticipants(details.participants?.join(", ") ?? project.participants?.join(", ") ?? "");
      setEditMediaUrl(details.mediaUrl ?? project.mediaUrl ?? "");
      setEditThumbnailPreview(details.thumbnailUrl || project.thumbnailUrl || "");
    } catch {
      setEditError("프로젝트 상세 정보를 불러오지 못했어요.");
    }
  };

  // 프로젝트 상세 화면의 관리자 '수정' 버튼(/admin?edit=프로젝트ID)으로 들어오면 해당 프로젝트 수정 폼을 바로 열어요
  const editParam = searchParams.get("edit");
  useEffect(() => {
    if (!editParam || !userId) return;
    const target = [...(projects ?? []), ...availableProjects].find((p) => String(p.id) === editParam);
    if (!target) return;
    setSearchParams({}, { replace: true });
    startEdit(target);
    window.setTimeout(() => document.getElementById("project-edit")?.scrollIntoView({ behavior: "smooth" }), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam, userId, projects, availableProjects]);

  const submitEdit = async () => {
    if (!userId || !editing) return;
    if (!editTitle.trim() || !editCategory) {
      setEditError("프로젝트명과 유형은 꼭 입력해주세요.");
      return;
    }
    setActioningId(editing.id);
    try {
      await updateAdminProject(userId, editing.id, {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        organization: editOrganization,
        participants: editParticipants.split(",").map((name) => name.trim()).filter(Boolean),
        mediaUrl: editMediaUrl,
        thumbnailFile: editThumbnailFile,
      });
      setEditing(null);
      await load(userId);
    } catch {
      setEditError("수정에 실패했어요.");
    } finally {
      setActioningId(null);
    }
  };

  const moveCurationProject = (targetProjectId: number) => {
    if (draggedProjectId === null || draggedProjectId === targetProjectId) return;
    setCurationProjects((current) => {
      const fromIndex = current.findIndex((project) => project.id === draggedProjectId);
      const toIndex = current.findIndex((project) => project.id === targetProjectId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const toggleCurationProject = (project: Project) => {
    const projectId = Number(project.id);
    if (!Number.isSafeInteger(projectId) || projectId <= 0) return;

    const isSelected = curationProjects.some((item) => item.id === projectId);
    if (isSelected) {
      setCurationProjects((current) => current.filter((item) => item.id !== projectId));
      setCurationError(null);
      return;
    }
    if (curationProjects.length >= MAX_CURATION) {
      setCurationError(`큐레이션 프로젝트는 최대 ${MAX_CURATION}개까지 선택할 수 있어요.`);
      return;
    }
    setCurationProjects((current) => [...current, { id: projectId, title: project.title }]);
    setCurationError(null);
  };

  const selectCurationSection = (section: CurationSection) => {
    setSelectedCurationId(section.sectionId);
    setSectionTitleDraft(section.title);
    setSectionDisplayOrderDraft(section.displayOrder);
    setSectionActiveDraft(section.active);
    setCurationProjects(section.projectIds.map((id) => ({
      id,
      title: section.projectTitles[String(id)] ?? "",
    })));
    setCurationError(null);
  };

  const beginNewCuration = () => {
    setSelectedCurationId(null);
    setSectionTitleDraft("");
    setSectionDisplayOrderDraft((sections?.length ?? 0) + 1);
    setSectionActiveDraft(true);
    setCurationProjects([]);
    setCurationError(null);
  };

  const saveCuration = async () => {
    if (!userId || savingCuration) return;
    const title = sectionTitleDraft.trim();
    if (!title) {
      setCurationError("큐레이션 이름을 입력해주세요.");
      return;
    }
    if (!Number.isSafeInteger(sectionDisplayOrderDraft) || sectionDisplayOrderDraft < 1) {
      setCurationError("노출 순서는 1 이상의 정수로 입력해주세요.");
      return;
    }

    setSavingCuration(true);
    setCurationError(null);
    try {
      const updated = await saveCurationSection(userId, {
        sectionId: selectedCurationId ?? undefined,
        title,
        displayOrder: sectionDisplayOrderDraft,
        sectionType: selectedCurationType ?? "PROJECT_LIST",
        active: sectionActiveDraft,
        projectIds: curationProjects.map((project) => project.id),
      });
      setSections(updated);
      const saved = updated.find((section) =>
        selectedCurationId ? section.sectionId === selectedCurationId : section.title === title
      );
      if (saved) selectCurationSection(saved);
      setActionMessage(selectedCurationId ? "큐레이션이 수정됐어요." : "큐레이션이 생성됐어요.");
    } catch {
      setCurationError("큐레이션 저장에 실패했어요.");
    } finally {
      setSavingCuration(false);
    }
  };

  const removeCuration = async (sectionId: number) => {
    if (!userId || savingCuration) return;
    if (!window.confirm("이 큐레이션 섹션을 삭제할까요?")) return;

    setDeletingCurationId(sectionId);
    setSavingCuration(true);
    try {
      await deleteCurationSection(userId, sectionId);
      const updated = await getCuration(userId);
      setSections(updated);
      if (updated[0]) selectCurationSection(updated[0]); else beginNewCuration();
      setActionMessage("큐레이션이 삭제됐어요.");
    } catch {
      setCurationError("큐레이션 삭제에 실패했어요.");
    } finally {
      setDeletingCurationId(null);
      setSavingCuration(false);
    }
  };

  const resetStoryForm = () => {
    setEditingStoryId(null);
    setStoryTitle("");
    setStoryUsername("");
    setStoryLink("");
    setStoryDate("");
    setStoryThumbnailFile(null);
    setStoryThumbnailPreview("");
    setStoryError(null);
  };

  const editStory = (story: AdminStory) => {
    setEditingStoryId(story.id);
    setStoryTitle(story.title);
    setStoryUsername(story.username ?? "");
    setStoryLink(story.link ?? "");
    setStoryDate(story.createdAt ? story.createdAt.slice(0, 10) : "");
    setStoryThumbnailFile(null);
    setStoryThumbnailPreview(story.thumbnailUrl ?? "");
    setStoryError(null);
  };

  const submitStory = async () => {
    if (!userId || !storyTitle.trim()) {
      setStoryError("스토리 제목을 입력해주세요.");
      return;
    }
    setSavingStory(true);
    setStoryError(null);
    try {
      const thumbnailUrl = storyThumbnailFile
        ? await uploadProjectThumbnail(storyThumbnailFile)
        : storyThumbnailPreview || undefined;
      const payload = {
        title: storyTitle.trim(),
        username: storyUsername.trim() || undefined, // 등록자(기업) 이름은 화면에 노출하지 않아 입력칸을 뺐어요(기획 시트 #16)
        thumbnailUrl,
        link: storyLink.trim() || undefined,
        date: storyDate || undefined,
      };
      if (editingStoryId) {
        await updateStory(userId, editingStoryId, payload);
      } else {
        await createStory(userId, payload);
      }
      setStories(await getStories());
      resetStoryForm();
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : "스토리 저장에 실패했어요.");
    } finally {
      setSavingStory(false);
    }
  };

  const removeStory = async (story: AdminStory) => {
    if (!userId || !window.confirm(`"${story.title}" 스토리를 삭제할까요?`)) return;
    try {
      await deleteStory(userId, story.id);
      setStories((current) => current.filter((item) => item.id !== story.id));
      if (editingStoryId === story.id) resetStoryForm();
    } catch {
      setStoryError("스토리 삭제에 실패했어요.");
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || !userId) return;

    let cancelled = false;
    getAdminBanners(userId, bannerPage)
      .then((list) => {
        if (cancelled) return;
        setBanners(list);
        const current = list[0];
        setBannerPreview(current?.imageUrl ?? "");
        setBannerFile(null);
        setBannerError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setBanners([]);
        setBannerPreview("");
        setBannerError("배너를 불러오지 못했어요.");
      });

    return () => { cancelled = true; };
  }, [bannerPage, isAdmin, isLoggedIn, userId]);

  const selectBannerFile = (file: File | undefined) => {
    if (!file) return;
    const validationError = validateThumbnailFile(file);
    if (validationError) {
      setBannerError(validationError);
      return;
    }
    setBannerError(null);
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const submitBanner = async () => {
    if (!userId) return;
    if (!bannerFile) {
      setBannerError("배너 이미지를 선택해주세요.");
      return;
    }

    setSavingBanner(true);
    setBannerError(null);
    try {
      const saved = banners.length > 0
        ? await updateAdminBanner(userId, bannerPage, bannerFile)
        : await uploadAdminBanner(userId, bannerPage, bannerFile);
      setBanners([saved]);
      setBannerPreview(saved.imageUrl);
      setBannerFile(null);
      setActionMessage("배너가 저장됐어요.");
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "배너 저장에 실패했어요.");
    } finally {
      setSavingBanner(false);
    }
  };

  const removeBanner = async () => {
    if (!userId || banners.length === 0) return;
    if (!window.confirm("현재 배너 이미지를 삭제할까요?")) return;

    setSavingBanner(true);
    setBannerError(null);
    try {
      await deleteAdminBanner(userId, bannerPage);
      setBanners([]);
      setBannerPreview("");
      setBannerFile(null);
      setActionMessage("배너가 삭제됐어요.");
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : "배너 삭제에 실패했어요.");
    } finally {
      setSavingBanner(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="mb-4 text-sm text-palette-muted">로그인 후 이용할 수 있는 페이지예요.</p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-xl bg-palette-accent px-6 py-3 text-sm font-semibold text-white"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="text-sm text-palette-muted">관리자만 이용할 수 있는 페이지예요.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4 md:mb-10 md:gap-8">
        <span className="rounded-lg bg-palette-accent px-4 py-2 text-sm font-semibold text-white md:px-5 md:py-3 md:text-base">
          ADMIN
        </span>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-black md:gap-8 md:text-lg">
          <a href="#project-management">프로젝트 관리</a>
          <a href="#comment-management">댓글 관리</a>
          <a href="#curation-settings">큐레이션 설정</a>
          <a href="#story-upload">스토리 업로드</a>
        </nav>
      </div>

      {/* 통계 카드 - "오늘 댓글"/"스토리"는 이걸 계산할 API가 없어서 "-"로 표시 */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:mb-12 md:grid-cols-4 md:gap-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl bg-white p-4 shadow-strong md:rounded-3xl md:p-6"
            style={{ boxShadow: `0 4px 4px 0 rgba(0,0,0,0.25)`, border: `2px solid ${card.color}` }}
          >
            <p className="text-xl md:text-3xl">{card.icon}</p>
            <p className="mt-1 text-xs text-black md:text-base">{card.label}</p>
            <p className="mt-1 text-lg font-bold md:text-2xl" style={{ color: card.color }}>
              {card.key === "pending"
                ? `${stats?.pendingApproval ?? pendingCount}건`
                : card.key === "total"
                ? `${totalCount}건`
                : card.key === "comments"
                ? `${stats?.todayComments ?? comments?.length ?? 0}건`
                : `${stats?.totalStories ?? stories.length}건`}
            </p>
          </div>
        ))}
      </div>

      {/* 승인 대기 프로젝트 */}
      <section id="project-management" className="mb-10 scroll-mt-20 md:mb-16">
        <div className="mb-3 flex items-center gap-3 md:mb-4">
          <h2 className="text-lg font-bold md:text-2xl">승인 대기 프로젝트</h2>
          <span className="rounded-full bg-palette-header px-3 py-1 text-xs font-semibold text-palette-accent md:text-sm">
            {pendingCount}건 대기 중
          </span>
        </div>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        {actionMessage && (
          <p role="status" className="mb-3 text-sm font-medium text-[#16833b]">
            {actionMessage}
          </p>
        )}

        {projects === null ? (
          <p className="text-sm text-palette-muted">불러오는 중...</p>
        ) : projects.length === 0 ? (
          !error && <p className="text-sm text-palette-muted">승인 대기중인 프로젝트가 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-black">
            <table className="w-full min-w-[640px] text-left text-sm md:text-base">
              <thead className="bg-palette-section text-xs text-black md:text-sm">
                <tr>
                  <th className="px-3 py-3 font-semibold md:px-4">프로젝트명</th>
                  <th className="px-3 py-3 font-semibold md:px-4">제출자</th>
                  <th className="px-3 py-3 font-semibold md:px-4">제출일</th>
                  <th className="px-3 py-3 font-semibold md:px-4">유형</th>
                  <th className="px-3 py-3 font-semibold md:px-4">액션</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-t border-palette-border">
                    <td className="px-3 py-3 font-medium md:px-4">{project.title}</td>
                    <td className="px-3 py-3 text-palette-muted md:px-4">
                      {project.ownerName ?? project.team ?? project.organization ?? project.ownerId ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-palette-muted md:px-4">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-palette-muted md:px-4">
                      {project.types[0] ?? "-"}
                    </td>
                    <td className="px-3 py-3 md:px-4">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => handleApprove(project)}
                          disabled={actioningId === project.id}
                          className="rounded-full bg-[#20b958] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => startReject(project)}
                          disabled={actioningId === project.id}
                          className="rounded-full border-2 border-[#ff3c00] px-3 py-1 text-xs font-semibold text-[#ff3c00] disabled:opacity-50"
                        >
                          반려
                        </button>
                        <button
                          onClick={() => startEdit(project)}
                          disabled={actioningId === project.id}
                          className="rounded-full border-2 border-[#1ba2ea] px-3 py-1 text-xs font-semibold text-[#1ba2ea] disabled:opacity-50"
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 반려 사유 입력 - Figma 시안대로 테이블 아래 공용 입력창 */}
        {rejectingId && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl bg-palette-section p-3 sm:flex-row md:p-4">
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유 입력"
              className="min-w-0 flex-1 rounded-lg bg-white px-3 py-2 text-sm outline-none placeholder:text-palette-muted"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim() || actioningId === rejectingId}
                className="rounded-lg bg-[#ff3c00] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                반려하기
              </button>
              <button
                onClick={() => setRejectingId(null)}
                className="rounded-lg px-4 py-2 text-xs text-palette-muted"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 프로젝트 상세 수정 폼 */}
        {editing && (
          <div id="project-edit" className="mt-4 rounded-2xl bg-white p-4 shadow-strong md:p-6">
            <h3 className="mb-4 text-base font-bold md:text-xl">
              프로젝트 상세 수정 : {editing.title}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <Field label="프로젝트명">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="유형">
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as ProjectType)}
                  className={inputClass}
                >
                  <option value="">유형 선택</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-3 md:mt-4">
              <Field label="설명">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className={`${inputClass} h-auto resize-none`}
                />
              </Field>
            </div>
            <div className="mt-3 md:mt-4">
              <Field label="소속 기관명">
                <input
                  value={editOrganization}
                  onChange={(e) => setEditOrganization(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              <Field label="참여자 이름 (쉼표로 구분)">
                <input
                  value={editParticipants}
                  onChange={(e) => setEditParticipants(e.target.value)}
                  placeholder="참여자 1, 참여자 2"
                  className={inputClass}
                />
              </Field>
              <Field label="프로젝트 URL">
                <input
                  type="url"
                  value={editMediaUrl}
                  onChange={(e) => setEditMediaUrl(e.target.value)}
                  placeholder="https://"
                  className={inputClass}
                />
              </Field>
              <Field label="썸네일 이미지 (10MB 이하, PNG/JPEG/WEBP/GIF)">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (!file) return;
                    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type.toLowerCase())) {
                      setEditError("PNG, JPEG, WEBP, GIF 이미지만 업로드할 수 있어요.");
                      e.target.value = "";
                      return;
                    }
                    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
                      setEditError("썸네일은 10MB 이하의 파일만 업로드할 수 있어요.");
                      e.target.value = "";
                      return;
                    }
                    setEditThumbnailFile(file);
                    setEditThumbnailPreview(URL.createObjectURL(file));
                    setEditError(null);
                  }}
                  className={inputClass}
                />
              </Field>
            </div>
            {editThumbnailPreview && (
              <img
                src={editThumbnailPreview}
                alt="썸네일 미리보기"
                className="mt-3 h-32 w-48 rounded-lg object-cover"
              />
            )}

            {editError && <p className="mt-3 text-sm text-red-500">{editError}</p>}

            <div className="mt-4 flex gap-2 md:mt-6">
              <button
                onClick={submitEdit}
                disabled={actioningId === editing.id}
                className="rounded-xl bg-[#20b958] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                수정 완료
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl bg-palette-muted px-6 py-2.5 text-sm font-semibold text-white"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 전체 댓글 관리 */}
      <section ref={commentSectionRef} id="comment-management" className="mb-10 scroll-mt-20 md:mb-16">
        <h2 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">최근 댓글</h2>
        {comments === null ? <p className="text-sm text-palette-muted">불러오는 중...</p> : comments.length === 0 ? (
          <p className="text-sm text-palette-muted">댓글이 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-palette-border bg-white">
            <table className="w-full min-w-[680px] table-fixed text-left text-xs md:text-sm">
              <thead className="bg-palette-section text-palette-text">
                <tr>
                  <th className="w-[31%] px-3 py-2.5 font-semibold md:px-4">댓글 내용</th>
                  <th className="w-[15%] px-3 py-2.5 font-semibold md:px-4">작성자</th>
                  <th className="w-[24%] px-3 py-2.5 font-semibold md:px-4">프로젝트명</th>
                  <th className="w-[15%] px-3 py-2.5 font-semibold md:px-4">작성일</th>
                  <th className="w-[15%] px-3 py-2.5 text-center font-semibold md:px-4">관리</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment) => (
                  <tr key={comment.id} className="border-t border-palette-border">
                    <td className="truncate px-3 py-3 md:px-4">{comment.content}</td>
                    <td className="truncate px-3 py-3 md:px-4">{comment.authorName}</td>
                    <td className="truncate px-3 py-3 md:px-4">{comment.projectTitle ?? "-"}</td>
                    <td className="px-3 py-3 text-palette-muted md:px-4">{formatDate(comment.createdAt)}</td>
                    <td className="px-3 py-3 text-center md:px-4">
                      <button
                        onClick={async () => {
                          if (!userId || !window.confirm("댓글을 삭제할까요?")) return;
                          try {
                            await deleteAdminComment(userId, comment.projectId, comment.id);
                            setComments((prev) => (prev ?? []).filter((item) => item.id !== comment.id));
                            window.alert("댓글이 삭제됐어요.");
                          } catch {
                            setError("댓글 삭제에 실패했어요.");
                          }
                        }}
                        className="rounded-full border border-palette-border px-2.5 py-1 text-[11px] text-palette-muted hover:border-palette-accent hover:text-palette-accent"
                      >
                        비공개
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 큐레이션 섹션 관리 */}
      <section id="curation-settings" className="mb-10 scroll-mt-20 md:mb-16">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold md:text-2xl">HOME 큐레이션 설정</h2>
          <button
            type="button"
            onClick={beginNewCuration}
            className="rounded-md border border-palette-border bg-white px-3 py-2 text-xs font-semibold hover:border-palette-accent md:text-sm"
          >
            새 큐레이션
          </button>
        </div>

        {curationError && <p className="mb-3 text-sm text-red-500">{curationError}</p>}

        {sections === null ? (
          <p className="mb-4 text-sm text-palette-muted">큐레이션 목록을 불러오는 중...</p>
        ) : sections.length === 0 ? (
          <p className="mb-4 text-sm text-palette-muted">등록된 큐레이션이 없어요.</p>
        ) : (
          <div className="mb-4 flex flex-wrap gap-2">
            {[...sections].sort((a, b) => a.displayOrder - b.displayOrder).map((section) => (
              <button
                key={section.sectionId}
                type="button"
                onClick={() => selectCurationSection(section)}
                className={`border px-3 py-2 text-xs font-semibold md:text-sm ${selectedCurationId === section.sectionId ? "border-palette-accent bg-palette-header text-palette-accent" : "border-palette-border bg-white"}`}
              >
                {section.title}
                {!section.active && <span className="ml-2 text-palette-muted">(비활성)</span>}
              </button>
            ))}
          </div>
        )}

        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_140px] md:items-end">
          <Field label="큐레이션 이름">
            <input
              value={sectionTitleDraft}
              onChange={(event) => setSectionTitleDraft(event.target.value)}
              placeholder="예: 창의워크숍 프로젝트"
              className={inputClass}
            />
          </Field>
          <Field label="노출 순서">
            <input
              type="number"
              min={1}
              value={sectionDisplayOrderDraft}
              onChange={(event) => setSectionDisplayOrderDraft(Math.max(1, Number(event.target.value) || 1))}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sectionActiveDraft}
              onChange={(event) => setSectionActiveDraft(event.target.checked)}
              className="size-4 accent-palette-accent"
            />
            홈에 노출
          </label>
          {selectedCurationId !== null && (
            <button
              type="button"
              onClick={() => removeCuration(selectedCurationId)}
              disabled={savingCuration || selectedCurationType === "BOTTOM_CURATION"}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
            >
              {deletingCurationId === selectedCurationId ? "삭제 중..." : "큐레이션 삭제"}
            </button>
          )}
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-strong md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowCurationList((open) => !open)}
              className="rounded-md border border-palette-border px-3 py-2 text-xs font-semibold md:text-sm"
            >
              {showCurationList ? "프로젝트 선택 닫기" : "프로젝트 선택"}
            </button>
            <span className="text-xs text-palette-muted">{curationProjects.length} / {MAX_CURATION}</span>
          </div>

          {showCurationList && (
            <>
              <input
                value={curationProjectSearch}
                onChange={(event) => setCurationProjectSearch(event.target.value)}
                placeholder="프로젝트명 또는 기관명 검색"
                className={`${inputClass} mb-3`}
              />
              {availableProjects.length === 0 ? (
                <p className="text-sm text-palette-muted">선택할 프로젝트가 없어요.</p>
              ) : (
                <ul className="max-h-80 divide-y divide-palette-border overflow-y-auto">
                  {availableProjects
                    .filter((project) => {
                      const keyword = curationProjectSearch.trim().toLowerCase();
                      return !keyword
                        || project.title.toLowerCase().includes(keyword)
                        || project.organization?.toLowerCase().includes(keyword);
                    })
                    .map((project) => {
                      const projectId = Number(project.id);
                      const selected = curationProjects.some((item) => item.id === projectId);
                      return (
                        <li key={project.id}>
                          <label className="flex min-h-11 items-center gap-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!selected && curationProjects.length >= MAX_CURATION}
                              onChange={() => toggleCurationProject(project)}
                              className="size-4 accent-palette-accent"
                            />
                            <span className="min-w-0 flex-1 truncate">{project.title}</span>
                            {project.organization && <span className="text-xs text-palette-muted">{project.organization}</span>}
                          </label>
                        </li>
                      );
                    })}
                </ul>
              )}
            </>
          )}

          {curationProjects.length === 0 ? (
            <p className="text-sm text-palette-muted">선택된 프로젝트가 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {curationProjects.map((project) => (
                <li
                  key={project.id}
                  draggable
                  onDragStart={() => setDraggedProjectId(project.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveCurationProject(project.id)}
                  onDragEnd={() => setDraggedProjectId(null)}
                  className={`flex min-h-10 items-center gap-2 rounded-lg bg-[#ededed] px-3 py-1.5 text-sm md:px-4 md:py-2 ${draggedProjectId === project.id ? "opacity-50" : ""}`}
                >
                  <span aria-hidden="true" className="cursor-grab">⠿</span>
                  <span className="truncate">{project.title || `project_id: ${project.id}`}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={saveCuration}
            disabled={savingCuration}
            className="mt-4 rounded-md bg-[#1ba2ea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingCuration ? "저장 중..." : selectedCurationId ? "큐레이션 수정" : "큐레이션 생성"}
          </button>
        </div>
      </section>

      {/* 배너 설정 */}
      <section className="mb-8 rounded-xl bg-white p-4 shadow-strong md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold md:text-lg">배너 설정</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBannerPage("HOME")}
              className={`px-3 py-2 text-xs font-semibold md:text-sm ${bannerPage === "HOME" ? "bg-palette-accent text-white" : "border border-palette-border bg-white"}`}
            >
              HOME
            </button>
            <button
              type="button"
              onClick={() => setBannerPage("OFF_THE_RECORD")}
              className={`px-3 py-2 text-xs font-semibold md:text-sm ${bannerPage === "OFF_THE_RECORD" ? "bg-palette-accent text-white" : "border border-palette-border bg-white"}`}
            >
              OFF THE RECORD
            </button>
          </div>
        </div>

        {bannerError && <p className="mb-3 text-sm text-red-500">{bannerError}</p>}

        <Field label="배너 이미지 (10MB 이하, PNG/JPEG/WEBP/GIF)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => selectBannerFile(event.target.files?.[0])}
            className={inputClass}
          />
        </Field>

        {bannerPreview && (
          <img
            src={bannerPreview}
            alt="배너 미리보기"
            className="mt-3 h-40 w-full rounded-lg object-cover md:h-64"
          />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={submitBanner}
            disabled={savingBanner || !bannerFile}
            className="rounded-md bg-[#1ba2ea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingBanner ? "저장 중..." : banners.length > 0 ? "이미지 수정" : "이미지 업로드"}
          </button>
          {banners.length > 0 && (
            <button
              type="button"
              onClick={removeBanner}
              disabled={savingBanner}
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              배너 삭제
            </button>
          )}
        </div>
      </section>

      {/* 스토리 업로드 */}
      <section id="story-upload" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">스토리 업로드</h2>
        <div className="mb-4 rounded-xl bg-white p-4 shadow-strong md:p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="스토리 제목">
              <input value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} className={inputClass} />
            </Field>
            <Field label="등록일자 (비우면 올린 날짜로 들어가요)">
              <input type="date" value={storyDate} onChange={(e) => setStoryDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="링크 (선택, 썸네일/제목 클릭 시 새 창으로 열려요)">
              <input
                value={storyLink}
                onChange={(e) => setStoryLink(e.target.value)}
                placeholder="https://"
                className={inputClass}
              />
            </Field>
            <Field label="썸네일 (10MB 이하, PNG/JPEG/WEBP/GIF)">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (!file) return;
                  const validationError = validateThumbnailFile(file);
                  if (validationError) {
                    setStoryError(validationError);
                    e.target.value = "";
                    return;
                  }
                  setStoryThumbnailFile(file);
                  setStoryThumbnailPreview(URL.createObjectURL(file));
                  setStoryError(null);
                }}
                className={inputClass}
              />
            </Field>
          </div>
          {storyThumbnailPreview && (
            <img src={storyThumbnailPreview} alt="스토리 썸네일 미리보기" className="mt-3 h-32 w-48 rounded-lg object-cover" />
          )}
          {storyError && <p className="mt-3 text-sm text-red-500">{storyError}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={submitStory}
              disabled={savingStory}
              className="rounded-xl bg-[#20b958] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingStory ? "저장 중..." : editingStoryId ? "수정 완료" : "스토리 업로드"}
            </button>
            {editingStoryId && (
              <button type="button" onClick={resetStoryForm} className="rounded-xl bg-palette-muted px-5 py-2.5 text-sm font-semibold text-white">
                취소
              </button>
            )}
          </div>
        </div>
        {stories.length === 0 ? <p className="text-sm text-palette-muted">업로드된 스토리가 없어요.</p> : (
          <ul className="grid gap-2 md:grid-cols-2">
            {stories.map((story) => (
              <li key={story.id} className="flex items-center gap-3 rounded-xl bg-palette-section p-4">
                {story.thumbnailUrl && <img src={story.thumbnailUrl} alt="" className="size-16 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{story.title || "제목 없음"}</p>
                  <p className="mt-1 text-xs text-palette-muted">{story.username ?? "-"} · {formatDate(story.createdAt)}</p>
                </div>
                <button type="button" onClick={() => editStory(story)} className="rounded-lg border px-3 py-1.5 text-xs">수정</button>
                <button type="button" onClick={() => removeStory(story)} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600">삭제</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg bg-palette-section px-3 py-2.5 text-sm text-black outline-none placeholder:text-palette-muted md:rounded-xl md:px-4 md:py-3";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-palette-muted md:text-base">{label}</p>
      {children}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) return `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일`;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}
