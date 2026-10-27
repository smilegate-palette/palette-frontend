// 엔드포인트 문서(API.pdf, 엔드포인트.csv) 기준 공통 fetch 래퍼입니다.
// base URL은 .env.local의 VITE_API_BASE_URL로 주입합니다. (Vite는 import.meta.env 사용)

import { getToken, clearSession } from "@/lib/auth/token";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// 백엔드 진행도가 낮아(17개 중 14개 미완성) 목업으로 개발 중입니다.
// 실제 서버 붙일 때 .env.local에서 VITE_USE_MOCK=false로 바꾸세요.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";

export interface ApiErrorBody {
  code: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, body?: Partial<ApiErrorBody>) {
    super(body?.message ?? `API Error (${status})`);
    this.status = status;
    this.code = body?.code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // 로그인 되어 있으면 모든 요청에 Authorization: Bearer 토큰을 자동으로 붙임.
  // (로그인 자체 요청인 /api/login, /api/signup 계열은 어차피 로그인 전이라 토큰이 없어서 안 붙음)
  const token = getToken();
  const isGet = (options.method ?? "GET").toUpperCase() === "GET";

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // 오래됐거나 서버가 거절하는 토큰이 남아 있으면 로그인 안 한 사람도 볼 수 있는 목록/상세 조회까지 실패할 수 있음.
  // (사람마다 "목록이 보이는 사람/안 보이는 사람"이 갈리던 원인 후보) -> 조회(GET)는 토큰을 지우고 토큰 없이 한 번 더 시도함.
  if (token && isGet && (res.status === 401 || res.status === 403)) {
    clearSession();
    const { Authorization: _drop, ...rest } = (options.headers ?? {}) as Record<string, string>;
    void _drop;
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...rest },
    });
  }

  if (!res.ok) {
    let body: Partial<ApiErrorBody> | undefined;
    try {
      body = await res.json();
    } catch {
      // 응답 바디가 JSON이 아닐 수 있음
    }
    // 토큰이 만료/무효면 세션을 지워서 다음 요청부턴 비로그인 상태로 처리
    if (res.status === 401) clearSession();
    throw new ApiError(res.status, body);
  }

  // 200 성공 응답 바디가 없는 케이스(204 등) 대비
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
