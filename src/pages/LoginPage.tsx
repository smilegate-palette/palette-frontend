import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: applySession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      applySession(result.accesstoken, result.email);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
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

      {/* TODO: 카카오/네이버/구글 소셜로그인 - 백엔드에 아직 해당 엔드포인트 없음 (README 참고) */}

      <p className="mt-6 text-center text-sm text-palette-muted">
        계정이 없으신가요?{" "}
        <Link to="/signup" className="font-semibold text-palette-accent">
          회원가입
        </Link>
      </p>
    </div>
  );
}
