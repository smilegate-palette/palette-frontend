import { apiFetch } from "./client";

// 실제 Swagger(v0, /v3/api-docs) 기준 확인된 인증 관련 엔드포인트:
//   POST /api/login              email/password -> { email, password, accesstoken }
//   POST /api/signup              username/email/password/role -> 가입
//   POST /api/signup/sendcode     email -> 인증코드 발송
//   POST /api/signup/verification email/code -> 인증코드 확인
// ⚠️ /api/login 응답에 password 필드가 그대로 내려옴(보안 이슈, 백엔드에 이미 전달함) - 프론트에서는 절대 저장 안 함.
// ⚠️ role은 "USER"|"ADMIN" enum인데, 일반 회원가입 폼에서는 항상 USER로 고정해서 보냄.
// 2026.08.11 백엔드가 로그인 응답에 user_id를 추가함 (프로젝트 등록 등에 필요했던 값).
// ⚠️ 필드명이 정확히 "user_id"인지는 확인 요청 중 - 다르면 이 매핑만 고치면 됨.

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  email: string;
  accesstoken: string;
  userId?: string;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await apiFetch<{
    email: string;
    password: string;
    accesstoken: string;
    user_id?: string | number;
  }>("/api/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    email: res.email,
    accesstoken: res.accesstoken,
    userId: res.user_id !== undefined ? String(res.user_id) : undefined,
  };
}

export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export async function signup(payload: SignupPayload): Promise<void> {
  await apiFetch("/api/signup", {
    method: "POST",
    body: JSON.stringify({ ...payload, role: "USER" }),
  });
}

export async function sendVerificationCode(email: string): Promise<void> {
  await apiFetch("/api/signup/sendcode", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(email: string, code: string): Promise<void> {
  await apiFetch("/api/signup/verification", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

// 소셜로그인: 채흔님이 만든 콜백 엔드포인트 호출. 구글은 사용 안 하기로 결정해서 카카오/네이버만 지원.
// 2026.09.06 실제 배포된 Swagger로 재확인함: 경로에 별도 컨트롤러 base path 없이
// POST /api/{provider}/callback 그대로였음 (이전에 "{controller-base-path}" placeholder를
// 넣어뒀던 건 잘못된 가정이었음 - 이번에 실제 스펙 보고 바로잡음).
export async function socialLogin(
  provider: "kakao" | "naver",
  code: string,
  state?: string
): Promise<LoginResult> {
  const res = await apiFetch<{ email: string; accesstoken: string; user_id?: string | number }>(
    `/api/${provider}/callback`,
    {
      method: "POST",
      body: JSON.stringify({ code, state }),
    }
  );
  return {
    email: res.email,
    accesstoken: res.accesstoken,
    userId: res.user_id !== undefined ? String(res.user_id) : undefined,
  };
}

