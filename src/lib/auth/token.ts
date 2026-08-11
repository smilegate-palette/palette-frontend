// 로그인 세션(JWT accesstoken) 저장/조회 담당. localStorage 사용 - 새로고침해도 로그인 유지.
const TOKEN_KEY = "palette_access_token";
const EMAIL_KEY = "palette_user_email";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

export function setSession(token: string, email: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}
