export type UserRole = "guest" | "member" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  provider?: "naver" | "kakao" | "hope-studio"; // OAuth 소셜로그인(구글 미사용) - 희망스튜디오 계정 연동 방식 TODO 확인
}
