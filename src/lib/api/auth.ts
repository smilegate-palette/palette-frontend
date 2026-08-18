import { apiFetch } from "./client";

// 실제 Swagger(v0, /v3/api-docs) 기준 확인된 인증 관련 엔드포인트:
//   POST /api/login              email/password -> { email, password, accesstoken }
//   POST /api/signup              username/email/password/role -> 가입
//   POST /api/signup/sendcode     email -> 인증코드 발송
//   POST /api/signup/verification email/code -> 인증코드 확인
// ⚠️ /api/login 응답에 password 필드가 그대로 내려옴(보안 이슈, 백엔드에 이미 전달함) - 프론트에서는 절대 저장 안 함.
// ⚠️ role은 "USER"|"ADMIN" enum인데, 일반 회원가입 폼에서는 항상 USER로 고정해서 보냄.

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  email: string;
  accesstoken: string;
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const res = await apiFetch<{ email: string; password: string; accesstoken: string }>(
    "/api/login",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  return { email: res.email, accesstoken: res.accesstoken };
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

// 소셜로그인: 채흔님이 만들 예정인, /api/login과 비슷한 구조의 엔드포인트를 호출.
// 구글은 사용 안 하기로 결정해서 카카오/네이버만 지원.
// TODO: 정확한 경로/요청 필드명은 아직 미확정 - 일단 /api/login/{provider}에
// { code, redirectUri }를 보내는 걸로 가정해뒀음. 실제 API 스펙 나오면 이 함수만 고치면 됨.
export async function socialLogin(
  provider: "kakao" | "naver",
  code: string,
  redirectUri: string
): Promise<LoginResult> {
  const res = await apiFetch<{ email: string; accesstoken: string }>(
    `/api/login/${provider}`,
    {
      method: "POST",
      body: JSON.stringify({ code, redirectUri }),
    }
  );
  return res;
}
