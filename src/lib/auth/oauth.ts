// 소셜로그인(구글/카카오/네이버) 인가 URL 생성 + CSRF 방지용 state 검증.
// 실제 로그인 처리는 백엔드가 함(채흔님이 /api/login과 비슷한 구조로 code -> accesstoken 교환 API를 만들 예정) -
// 프론트는 사용자를 각 제공자 로그인 화면으로 보내고, 돌아왔을 때 code를 백엔드에 넘기는 역할만 함.

export type OAuthProvider = "google" | "kakao" | "naver";

interface OAuthConfig {
  authorizeUrl: string;
  clientId: string | undefined;
  scope?: string;
}

// ⚠️ client_id는 각 제공자 개발자센터(Google Cloud Console / Kakao Developers / Naver Developers)에서
// 앱 등록 후 발급받는 값. .env.local에 채워넣으면 됨 (client_secret과 달리 공개돼도 안전한 값).
const OAUTH_CONFIG: Record<OAuthProvider, OAuthConfig> = {
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    scope: "openid email profile",
  },
  kakao: {
    authorizeUrl: "https://kauth.kakao.com/oauth/authorize",
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
  },
  naver: {
    authorizeUrl: "https://nid.naver.com/oauth2.0/authorize",
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
  },
};

// 이 redirect_uri를 각 제공자 개발자센터의 "등록된 콜백 URL"에도 똑같이 등록해줘야 함.
export function getRedirectUri(provider: OAuthProvider): string {
  return `${window.location.origin}/auth/callback/${provider}`;
}

export function getOAuthLoginUrl(provider: OAuthProvider): string {
  const config = OAUTH_CONFIG[provider];
  if (!config.clientId) {
    throw new Error(
      `${provider} 로그인이 아직 설정되지 않았어요 (.env.local에 client id 필요)`
    );
  }

  // state: 나중에 돌아왔을 때 같은 브라우저에서 시작한 요청이 맞는지 확인하는 CSRF 방지용 랜덤값
  const state = crypto.randomUUID();
  sessionStorage.setItem(`oauth_state_${provider}`, state);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getRedirectUri(provider),
    response_type: "code",
    state,
  });
  if (config.scope) params.set("scope", config.scope);

  return `${config.authorizeUrl}?${params.toString()}`;
}

export function verifyOAuthState(provider: OAuthProvider, state: string | null): boolean {
  const saved = sessionStorage.getItem(`oauth_state_${provider}`);
  sessionStorage.removeItem(`oauth_state_${provider}`);
  return !!state && state === saved;
}
