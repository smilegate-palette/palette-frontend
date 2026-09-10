// 기획 문서(구축 기획안) 기준으로 확정된 타입입니다.
// 필터 체계: 프로그램(창의워크숍/유스파티) + 연도 + 형태 + 지역(특별시·광역시 외에는 '권역 시' 형태, 예: 전북 전주)
//            + 검색(프로젝트명/센터명/창작자명/설명)
// ⚠️ 실제 DB 스키마(dbdiagram.io) 확인 후 필드명/타입을 다시 맞춰야 합니다.
// ⚠️ 형태는 다중 선택 가능 + 태그 인풋 방식으로 입력받기로 결정됨 (업로드 폼 기준) -> 프로젝트당 여러 개일 수 있음, 목록 필터는 우선 단일 선택으로 구현
// ⚠️ 형태 라벨: HOME/PROJECT 화면 mockup에는 영어(GAME/AI/VIDEO...)로 표시되는데,
//    검색 필터 설명 텍스트에는 한글(게임/AI/영상...)로 되어 있어 문서 내에서도 표기가 갈립니다.
//    실제 화면 캡처 2곳에 다 영어로 나와서 우선 영어를 채택 - 최종 확인 필요.

export type ProgramType = "창의워크숍" | "유스파티";

export const PROJECT_TYPES = [
  "GAME",
  "AI",
  "VIDEO",
  "ART",
  "STORY",
  "METAVERSE",
  "CAMPAIGN",
  "BRANDING",
  "HANDMADE",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

// 2026.09 백엔드 ProjectRequest.status 기준 (관리자 승인/반려/비공개 플로우용)
export const PROJECT_STATUSES = ["PENDING", "APPROVED", "REJECTED", "HIDDEN"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  id: string;
  ownerId?: string;
  title: string; // 프로젝트 이름
  program: ProgramType; // 대분류: 창의워크숍 / 유스파티
  types: ProjectType[]; // 형태 (다중 선택 가능)
  year: number;
  region?: string; // 예: '경기 성남' (권역 + 시)
  organization?: string; // 소속 지역아동센터명 (기관명)
  team?: string; // 팀 이름
  participants?: string[]; // 참여자 이름 목록
  thumbnailUrl: string; // 카드용 썸네일
  mediaUrl?: string; // 상세 화면에 노출되는 영상/웹 화면 URL
  description?: string;
  likeCount?: number; // "응원해요" 좋아요 수 - 신규 기능, API 스펙 미정
  isFeatured?: boolean; // 홈 히어로 슬라이더 노출 여부 (2026년 11개 기관 프로젝트)
  curationTags?: string[]; // 홈 주제별 큐레이션 세션 매칭용 태그
  createdAt?: string;
  status?: ProjectStatus; // 관리자 승인/반려/비공개 상태
  rejectReason?: string;
}

export interface ProjectListParams {
  program?: ProgramType;
  year?: number;
  region?: string;
  type?: ProjectType;
  keyword?: string; // 프로젝트명, 센터명, 창작자명, 설명 검색
  sort?: "latest" | "popular"; // 컴포넌트 명세 기준: 최신순/인기순 드롭다운
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
}
