// 로그인 세션(JWT accesstoken) 저장/조회 담당. localStorage 사용 - 새로고침해도 로그인 유지.
const TOKEN_KEY = "palette_access_token";
const EMAIL_KEY = "palette_user_email";
const USERNAME_KEY = "palette_username";
const USER_ID_KEY = "palette_user_id";
const ROLE_KEY = "palette_user_role";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function getUsernameFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), (char) => char.charCodeAt(0));
    const claims = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const username = claims.username ?? claims.user_name ?? claims.nickname ?? claims.preferred_username;
    return typeof username === "string" && username.trim() ? username.trim() : null;
  } catch {
    return null;
  }
}

// 2026.08.11 백엔드가 로그인 응답에 user_id를 내려주기 시작해서 추가함.
// 프로젝트 등록(POST /api/project/{user_id}) 등에 사용.
export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function getStoredRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function setSession(token: string, email: string, userId?: string, role?: string, username?: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
  const displayName = username?.trim() || getUsernameFromToken(token);
  if (displayName) {
    localStorage.setItem(USERNAME_KEY, displayName);
  } else {
    localStorage.removeItem(USERNAME_KEY);
  }
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  } else {
    localStorage.removeItem(ROLE_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(ROLE_KEY);
}
