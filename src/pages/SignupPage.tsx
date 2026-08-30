import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendVerificationCode, signup, verifyCode } from "@/lib/api/auth";

// 실제 Swagger 기준 회원가입(POST /api/signup)은 username/email/password를 한 번에 받습니다.
// 이메일 인증은 별도 엔드포인트(sendcode/verification)라, 한 화면에서
// "인증코드 받기" 버튼으로 코드 발송 -> 코드 입력창+"인증" 버튼이 나타나서 확인 -> 인증 완료 후 가입하기,
// 흐름으로 구현했습니다.
export default function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setCodeError("이메일을 먼저 입력해주세요.");
      return;
    }
    setCodeError(null);
    setSendingCode(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      setVerified(false);
      setCode("");
    } catch {
      setCodeError("인증코드 발송에 실패했습니다. 이메일을 확인해주세요.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      setVerifyError("인증코드를 입력해주세요.");
      return;
    }
    setVerifyError(null);
    setVerifying(true);
    try {
      await verifyCode(email, code);
      setVerified(true);
    } catch {
      setVerifyError("인증코드가 올바르지 않습니다.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!verified) {
      setSignupError("이메일 인증을 먼저 완료해주세요.");
      return;
    }
    if (!username.trim() || !password.trim()) {
      setSignupError("닉네임과 비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await signup({ username, email, password });
      setDone(true);
    } catch {
      setSignupError("회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm">가입이 완료됐어요. 로그인해주세요!</p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-xl bg-palette-accent px-6 py-3 text-sm font-semibold text-white"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold">회원가입</h1>

      <form onSubmit={handleSignup} className="flex flex-col gap-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="닉네임"
          required
          className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
        />

        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              // 이메일을 바꾸면 이전 인증 상태는 무효화
              if (codeSent || verified) {
                setCodeSent(false);
                setVerified(false);
                setCode("");
              }
            }}
            placeholder="이메일"
            required
            disabled={verified}
            className="min-w-0 flex-1 rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode || verified}
            className="shrink-0 rounded-xl bg-palette-muted px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
          >
            {verified ? "인증완료" : sendingCode ? "발송 중..." : codeSent ? "재발송" : "인증코드 받기"}
          </button>
        </div>
        {codeError && <p className="text-sm text-red-500">{codeError}</p>}

        {codeSent && !verified && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-palette-muted">{email}로 인증코드를 보냈어요.</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="인증코드"
                className="min-w-0 flex-1 rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="shrink-0 rounded-xl bg-palette-accent px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                {verifying ? "확인 중..." : "인증"}
              </button>
            </div>
            {verifyError && <p className="text-sm text-red-500">{verifyError}</p>}
          </div>
        )}
        {verified && <p className="text-xs font-medium text-palette-accent">이메일 인증이 완료됐어요.</p>}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          required
          className="rounded-xl bg-palette-input px-4 py-3 text-sm text-black outline-none placeholder:text-palette-muted"
        />

        {signupError && <p className="text-sm text-red-500">{signupError}</p>}

        <button
          type="submit"
          disabled={submitting || !verified}
          className="mt-2 rounded-xl bg-palette-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-palette-muted">
        이미 계정이 있으신가요?{" "}
        <Link to="/login" className="font-semibold text-palette-accent">
          로그인
        </Link>
      </p>
    </div>
  );
}
