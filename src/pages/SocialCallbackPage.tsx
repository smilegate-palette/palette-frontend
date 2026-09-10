import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { socialLogin } from "@/lib/api/auth";
import { verifyOAuthState, OAuthProvider } from "@/lib/auth/oauth";
import { useAuth } from "@/lib/auth/AuthContext";

// 카카오/네이버 로그인 화면에서 돌아오는 콜백 페이지.
// URL 예: /auth/callback/kakao?code=...&state=...
export default function SocialCallbackPage() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: applySession } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isValidProvider = (p?: string): p is OAuthProvider =>
      p === "kakao" || p === "naver";

    if (!isValidProvider(provider)) {
      setError("알 수 없는 로그인 방식이에요.");
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const providerError = searchParams.get("error");

    if (providerError) {
      setError("로그인이 취소됐어요.");
      return;
    }
    if (!code || !verifyOAuthState(provider, state)) {
      setError("로그인 요청이 올바르지 않아요. 다시 시도해주세요.");
      return;
    }

    socialLogin(provider, code, state ?? undefined)
      .then((res) => {
        applySession(res.accesstoken, res.email, res.userId, res.role);
        navigate("/");
      })
      .catch(() => setError("소셜 로그인에 실패했어요. 잠시 후 다시 시도해주세요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      {error ? (
        <>
          <p className="mb-4 text-sm text-red-500">{error}</p>
          <Link to="/login" className="font-semibold text-palette-accent">
            로그인 페이지로 돌아가기
          </Link>
        </>
      ) : (
        <p className="text-sm text-palette-muted">로그인 처리 중...</p>
      )}
    </div>
  );
}
