import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { getOAuthLoginUrl, OAuthProvider } from "@/lib/auth/oauth";

const SOCIAL_BUTTONS: { provider: OAuthProvider; label: string }[] = [
  { provider: "kakao", label: "카카오로 로그인" },
  { provider: "naver", label: "네이버로 로그인" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: applySession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSocialLogin = (provider: OAuthProvider) => {
    try {
      window.location.href = getOAuthLoginUrl(provider);
    } catch {
      setError(`${provider} 로그인은 아직 준비 중이에요.`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      applySession(result.accesstoken, result.email, result.userId, result.role);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("아이디 또는 비밀번호가 맞지 않습니다");
      } else {
        setError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold">로그인</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          required
          className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-palette-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {/* 소셜로그인: 백엔드가 code -> accesstoken 교환 엔드포인트를 아직 안 만들어서
          지금 누르면 에러 문구가 뜨는 게 정상. 엔드포인트 준비되면 바로 동작함 (README 참고) */}
      <div className="mt-4 flex flex-col gap-2">
        {SOCIAL_BUTTONS.map(({ provider, label }) => (
          <button
            key={provider}
            type="button"
            onClick={() => handleSocialLogin(provider)}
            className="rounded-xl border border-palette-border bg-white px-4 py-3 text-sm font-medium text-black hover:border-palette-accent"
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-palette-muted">
        계정이 없으신가요?{" "}
        <Link to="/signup" className="font-semibold text-palette-accent">
          회원가입
        </Link>
      </p>
    </div>
  );
}
