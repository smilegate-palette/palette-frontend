import { Project, PROJECT_TYPES, ProgramType } from "@/lib/types/project";
import { Comment } from "@/lib/types/comment";

// 백엔드 API 17개 중 3개(프로젝트 목록/상세/수정)만 진행 완료 상태라
// 나머지 화면은 아래 mock 데이터로 우선 개발합니다.
// 실제 API 연동 시 src/lib/api 쪽 USE_MOCK 플래그만 끄면 됩니다.

export const mockPrograms: ProgramType[] = ["창의워크숍", "유스파티"];

// 기획 문서 기준 지역 예시 (특별시/광역시 외에는 '권역 시' 형태로 기입)
export const mockRegions = ["서울", "전북 전주", "강원 강릉", "경기 성남", "경기 하남"];

export const mockProjects: Project[] = Array.from({ length: 12 }).map(
  (_, i) => {
    const year = [2026, 2025, 2024, 2023][i % 4];
    const program = mockPrograms[i % mockPrograms.length];
    const type = PROJECT_TYPES[i % PROJECT_TYPES.length];
    return {
      id: `project-${i + 1}`,
      title: `프로젝트 이름 ${i + 1}`,
      program,
      types: [type],
      year,
      region: mockRegions[i % mockRegions.length],
      organization: "도담분당동지역아동센터",
      team: `팀 ${i + 1}`,
      participants: ["김oo", "박oo", "윤oo"],
      thumbnailUrl: `https://placehold.co/600x400?text=Project+${i + 1}`,
      mediaUrl: `https://placehold.co/1200x675?text=Project+${i + 1}+Media`,
      description:
        "프로젝트에 대한 설명 하단 기재. 실제 데이터는 백엔드 연동 후 교체됩니다.",
      likeCount: (i * 7) % 42,
      isFeatured: i < 11, // 2026년 대표 프로젝트 11개 롤링 슬라이더용
      curationTags: i % 2 === 0 ? ["창의워크숍 하이라이트"] : ["유스파티 하이라이트"],
      createdAt: new Date(2026, 0, i + 1).toISOString(),
    };
  }
);

export const mockComments: Comment[] = [
  {
    id: "comment-1",
    projectId: "project-1",
    authorName: "이름1",
    content: "댓글 내용 예시입니다.",
    createdAt: new Date().toISOString(),
    status: "approved",
  },
  {
    id: "comment-2",
    projectId: "project-1",
    authorName: "이름2",
    content: "댓글 내용 예시입니다.",
    createdAt: new Date().toISOString(),
    status: "approved",
  },
];
