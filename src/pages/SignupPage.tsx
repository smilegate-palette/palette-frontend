import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendVerificationCode, signup, verifyCode } from "@/lib/api/auth";

// 실제 Swagger 기준 회원가입은 3단계: 이메일 인증코드 발송 -> 코드 확인 -> 가입.
// (자체 JWT 로그인 방식이라 Supabase Auth SDK 필요 없음 - 그냥 이 3개 엔드포인트만 호출)
type Step = "email" | "verify" | "signup" | "done";

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendVerificationCode(email);
      setStep("verify");
    } catch {
      setError("인증코드 발송에 실패했습니다. 이메일을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyCode(email, code);
      setStep("signup");
    } catch {
      setError("인증코드가 올바르지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({ username, email, password });
      setStep("done");
    } catch {
      setError("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold">회원가입</h1>

      {step === "email" && (
        <form onSubmit={handleSendCode} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-palette-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "발송 중..." : "인증코드 받기"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerify} className="flex flex-col gap-3">
          <p className="text-sm text-palette-muted">{email}로 인증코드를 보냈습니다.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="인증코드"
            required
            className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-palette-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "확인 중..." : "인증코드 확인"}
          </button>
        </form>
      )}

      {step === "signup" && (
        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="닉네임"
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
            {submitting ? "가입 중..." : "가입 완료"}
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm">가입이 완료됐어요. 로그인해주세요!</p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-palette-accent px-6 py-3 text-sm font-semibold text-white"
          >
            로그인하러 가기
          </button>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-6 text-center text-sm text-palette-muted">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="font-semibold text-palette-accent">
            로그인
          </Link>
        </p>
      )}
    </div>
  );
}
