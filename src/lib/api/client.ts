// 엔드포인트 문서(API.pdf, 엔드포인트.csv) 기준 공통 fetch 래퍼입니다.
// base URL은 .env.local의 VITE_API_BASE_URL로 주입합니다. (Vite는 import.meta.env 사용)

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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      // TODO: JWT 로그인 방식 확정되면 Authorization: Bearer 토큰 주입 로직 추가
    },
  });

  if (!res.ok) {
    let body: Partial<ApiErrorBody> | undefined;
    try {
      body = await res.json();
    } catch {
      // 응답 바디가 JSON이 아닐 수 있음
    }
    throw new ApiError(res.status, body);
  }

  // 200 성공 응답 바디가 없는 케이스(204 등) 대비
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
