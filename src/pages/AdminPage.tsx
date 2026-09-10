import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getAdminDashboard,
  approveProject,
  rejectProject,
  updateAdminProject,
  getCuration,
  saveCurationOrder,
  CurationSection,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { Project, ProjectType, PROJECT_TYPES } from "@/lib/types/project";

// 관리자 페이지. Figma 관리자 시안(데스크탑 node 92:2 / 모바일 99:540 / 풀스크린 99:386) 기준으로
// 상단 통계 카드 + 승인 대기 프로젝트 테이블(승인/반려/수정) + 최근 댓글 + HOME 큐레이션 순서로 구성.
//
// ⚠️ 로그인 응답에 role(USER/ADMIN) 정보가 없어서 프론트에서 "이 사람이 관리자인지"를 미리
// 판단할 방법이 없습니다. 로그인만 되어 있으면 접근은 가능하고, 실제 데이터는 백엔드가 401/403을
// 돌려주는지에 의존해서 걸러집니다. role 정보가 응답에 추가되면 접근 제어를 그걸로 바꿔야 해요.
//
// ⚠️ Figma 시안에는 있지만 이번에 못 만든/못 살린 부분들 (매칭되는 API가 없어서):
//   - "최근 댓글" 테이블: 여러 프로젝트를 가로지르는 전체 댓글 목록 API가 없음 (프로젝트별 조회만 가능) → 준비중 안내만 표시
//   - 댓글 "비공개" 토글: 댓글 숨김 처리 API 없음 → 버튼 자체를 안 만듦
//   - "스토리 업로드" 탭: STORY(off the record) 관리용 API가 아직 없음 → 준비중 안내만 표시
//   - 승인 대기 목록의 체크박스 "전체 선택": 일괄 승인/반려 API가 없어서 뺐음 (한 건씩만 가능)
//   - 프로젝트 수정 폼의 "썸네일 이미지 업로드", "추가 필드": 저장할 백엔드 필드/엔드포인트가 없어서
//     화면엔 두되 실제로 전송되지는 않음 (제목/유형/설명만 실제로 저장됩니다)
//   - HOME 큐레이션 순서는 Figma엔 드래그 앤 드롭인데, 별도 라이브러리 없이 구현하려고 ▲▼ 버튼으로 단순화함

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

export default function AdminPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userId, role } = useAuth();
  const isAdmin = role === "ADMIN";
  const [projects, setProjects] = useState<Project[] | null>(null); // null = 로딩중
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [editing, setEditing] = useState<Project | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<ProjectType | "">("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [sections, setSections] = useState<CurationSection[] | null>(null);
  const [curationError, setCurationError] = useState<string | null>(null);
  const [savingSectionId, setSavingSectionId] = useState<number | null>(null);

  const load = async (uid: string) => {
    setError(null);
    try {
      const dashboard = await getAdminDashboard(uid);
      setProjects(
        dashboard.pendingProjects.length > 0 ? dashboard.pendingProjects : dashboard.allProjects
      );
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError("관리자 권한이 없어요. (일반 계정은 이 페이지를 이용할 수 없어요)");
      } else {
        setError("데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      }
      setProjects([]);
    }
  };

  const loadCuration = async (uid: string) => {
    setCurationError(null);
    try {
      const data = await getCuration(uid);
      setSections(data);
    } catch {
      setCurationError("큐레이션 정보를 불러오지 못했어요.");
      setSections([]);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isAdmin || !userId) return;
    load(userId);
    loadCuration(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isAdmin, userId]);

  const pendingCount = projects?.filter((p) => (p.status ?? "PENDING") === "PENDING").length ?? 0;
  const totalCount = projects?.length ?? 0;

  const handleApprove = async (project: Project) => {
    if (!userId) return;
    setActioningId(project.id);
    try {
      await approveProject(userId, project.id);
      await load(userId);
    } catch {
      setError("승인 처리에 실패했어요.");
    } finally {
      setActioningId(null);
    }
  };

  const startReject = (project: Project) => {
    setRejectingId(project.id);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!userId || !rejectingId || !rejectReason.trim()) return;
    setActioningId(rejectingId);
    try {
      await rejectProject(userId, rejectingId, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      await load(userId);
    } catch {
      setError("반려 처리에 실패했어요.");
    } finally {
      setActioningId(null);
    }
  };

  const startEdit = (project: Project) => {
    setEditing(project);
    setEditTitle(project.title);
    setEditCategory(project.types[0] ?? "");
    setEditDescription(project.description ?? "");
    setEditError(null);
  };

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
      });
      setEditing(null);
      await load(userId);
    } catch {
      setEditError("수정에 실패했어요.");
    } finally {
      setActioningId(null);
    }
  };

  const moveProject = (section: CurationSection, index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= section.projectIds.length) return;
    const nextIds = [...section.projectIds];
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    setSections((prev) =>
      (prev ?? []).map((s) =>
        s.sectionId === section.sectionId ? { ...s, projectIds: nextIds } : s
      )
    );
  };

  const saveSection = async (section: CurationSection) => {
    if (!userId) return;
    setSavingSectionId(section.sectionId);
    try {
      await saveCurationOrder(userId, section.sectionId, section.projectIds);
    } catch {
      setCurationError("큐레이션 순서 저장에 실패했어요.");
    } finally {
      setSavingSectionId(null);
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
                ? `${pendingCount}건`
                : card.key === "total"
                ? `${totalCount}건`
                : "-"}
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
                      {project.team ?? project.organization ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-palette-muted md:px-4">
                      {project.createdAt ? project.createdAt.slice(5, 10) : "-"}
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
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-strong md:p-6">
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
            {/* Figma엔 썸네일 업로드/추가 필드도 있는데, 저장할 백엔드 필드가 없어서
                화면만 두고 실제 저장은 안 됩니다. */}
            <div className="mt-3 md:mt-4">
              <p className="mb-1.5 text-xs text-palette-muted md:text-base">
                썸네일 이미지 (준비중 - 아직 저장 안 됨)
              </p>
              <button
                type="button"
                disabled
                className="rounded-lg bg-palette-placeholder px-4 py-2 text-xs text-white/70"
              >
                이미지 업로드
              </button>
            </div>
            <div className="mt-3 md:mt-4">
              <Field label="추가 필드 (준비중 - 아직 저장 안 됨)">
                <input
                  disabled
                  placeholder="'팀원 정보', '프로젝트 URL' 등의 추가 입력 필드"
                  className={`${inputClass} opacity-60`}
                />
              </Field>
            </div>

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

      {/* 최근 댓글 - 전체 댓글 조회 API가 없어서 준비중 안내만 표시 */}
      <section id="comment-management" className="mb-10 scroll-mt-20 md:mb-16">
        <h2 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">최근 댓글</h2>
        <div className="rounded-xl bg-palette-section p-4 text-sm text-palette-muted md:p-6">
          프로젝트 전체를 가로지르는 댓글 목록 API가 아직 없어서 준비중이에요. (지금은 프로젝트별
          상세 페이지에서만 댓글을 볼 수 있어요)
        </div>
      </section>

      {/* HOME 큐레이션 설정 */}
      <section id="curation-settings" className="mb-10 scroll-mt-20 md:mb-16">
        <h2 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">HOME 큐레이션 설정</h2>
        <p className="mb-3 text-xs text-palette-muted md:text-sm">
          섹션 순서 (▲▼ 버튼으로 조정 - Figma는 드래그 방식이지만 별도 라이브러리 없이 간단하게
          구현했어요)
        </p>
        {curationError && <p className="mb-3 text-sm text-red-500">{curationError}</p>}
        {sections === null ? (
          <p className="text-sm text-palette-muted">불러오는 중...</p>
        ) : sections.length === 0 ? (
          !curationError && (
            <p className="text-sm text-palette-muted">큐레이션 섹션이 없어요.</p>
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {sections.map((section) => (
              <li
                key={section.sectionId}
                className="rounded-xl bg-palette-section px-4 py-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold md:text-base">{section.title || `섹션 ${section.sectionId}`}</p>
                  <button
                    onClick={() => saveSection(section)}
                    disabled={savingSectionId === section.sectionId}
                    className="rounded-lg bg-[#1ba2ea] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {section.projectIds.map((pid, i) => (
                    <li
                      key={`${section.sectionId}-${pid}`}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs md:text-sm"
                    >
                      <span>project_id: {pid}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveProject(section, i, -1)}
                          disabled={i === 0}
                          className="px-2 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveProject(section, i, 1)}
                          disabled={i === section.projectIds.length - 1}
                          className="px-2 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 스토리 업로드 - STORY(off the record) 관리 API가 없어서 준비중 안내만 표시 */}
      <section id="story-upload" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold md:mb-4 md:text-2xl">스토리 업로드</h2>
        <div className="rounded-xl bg-palette-section p-4 text-sm text-palette-muted md:p-6">
          off the record STORY 콘텐츠를 관리자가 직접 올리는 기능은 아직 백엔드 API가 없어서
          준비중이에요.
        </div>
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
