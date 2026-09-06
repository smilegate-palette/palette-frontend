import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAdminDashboard, approveProject, rejectProject } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { Project } from "@/lib/types/project";

// 관리자 승인/반려 페이지. 2026.09 백엔드에 admin-controller가 추가되면서 신규 구현.
// ⚠️ 로그인 응답에 role(USER/ADMIN) 정보가 없어서 프론트에서 "이 사람이 관리자인지"를 미리
// 판단할 방법이 없습니다. 그래서 이 페이지는 로그인만 되어 있으면 접근은 가능하고, 실제로
// 관리자 권한이 없으면 백엔드가 401/403을 돌려주는 것에 의존해서 에러 메시지를 보여줍니다.
// role 정보가 응답에 추가되면 네비게이션 노출도 그걸로 제어하는 게 좋습니다 - 백엔드 확인 필요.
// ⚠️ 큐레이션 순서 변경(GET/POST /api/admin/{user_id}/curation)은 이번 1차 구현 범위에서 뺐습니다 -
// 드래그 앤 드롭 등 별도 UI가 필요해서 승인/반려 플로우부터 먼저 만들었어요.
export default function AdminPage() {
  const navigate = useNavigate();
  const { isLoggedIn, userId } = useAuth();
  const [projects, setProjects] = useState<Project[] | null>(null); // null = 로딩중
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Project | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    load(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userId]);

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

  const handleReject = async () => {
    if (!userId || !rejectTarget || !rejectReason.trim()) return;
    setActioningId(rejectTarget.id);
    try {
      await rejectProject(userId, rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason("");
      await load(userId);
    } catch {
      setError("반려 처리에 실패했어요.");
    } finally {
      setActioningId(null);
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl font-bold md:text-2xl">관리자 페이지</h1>
      <p className="mb-6 text-xs text-palette-muted md:text-sm">
        승인 대기중인 프로젝트를 검토하고 승인/반려할 수 있어요.
      </p>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {projects === null ? (
        <p className="text-sm text-palette-muted">불러오는 중...</p>
      ) : projects.length === 0 ? (
        !error && <p className="text-sm text-palette-muted">승인 대기중인 프로젝트가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-palette-section px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold md:text-base">{project.title}</p>
                <p className="text-xs text-palette-muted">
                  {project.program} · {project.year} · {project.status ?? "PENDING"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleApprove(project)}
                  disabled={actioningId === project.id}
                  className="rounded-lg bg-palette-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  승인
                </button>
                <button
                  onClick={() => {
                    setRejectTarget(project);
                    setRejectReason("");
                  }}
                  disabled={actioningId === project.id}
                  className="rounded-lg border border-palette-border px-3 py-1.5 text-xs font-medium text-black disabled:opacity-50"
                >
                  반려
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 반려 사유 입력 모달 - 기획 문서에 나온 "부적절한 컨텐츠/정보 부족/기타" 선택지는
          아직 최종 확정이 안 돼서 우선 자유 입력으로 구현 */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            <h2 className="mb-3 text-base font-bold">&quot;{rejectTarget.title}&quot; 반려</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요"
              rows={4}
              className="mb-3 w-full rounded-lg bg-palette-input px-3 py-2 text-sm outline-none placeholder:text-palette-muted"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectTarget(null)}
                className="rounded-lg px-3 py-1.5 text-xs text-palette-muted"
              >
                취소
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actioningId === rejectTarget.id}
                className="rounded-lg bg-palette-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                반려하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
