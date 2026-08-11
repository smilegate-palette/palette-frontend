import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

// Figma(node 8:63 등) 실제 시안 기준: 상단 GNB 배경 #fffced(크림),
// 활성 메뉴는 노란색(#ffd400) + 굵게 + 밑줄바, 로고는 실제 이미지 사용
const NAV_ITEMS = [
  { label: "HOME", href: "/" },
  { label: "PROJECT", href: "/project" },
  { label: "ABOUT PALETTE", href: "/about-palette" },
  { label: "off the record", href: "/off-the-record" },
];

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const { isLoggedIn, email, logout } = useAuth();

  const handleAuthClick = () => {
    if (isLoggedIn) {
      logout();
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-palette-header px-6 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="block h-[36px] w-[75px]">
          {/* Figma 로고 이미지(public/logo.png)를 export해서 넣어주시면 자동으로 교체돼요.
              파일이 없으면 텍스트 로고로 대체됩니다. */}
          {logoError ? (
            <span className="text-lg font-bold tracking-tight">PALETTE</span>
          ) : (
            <img
              src="/logo.png"
              alt="PALETTE"
              className="h-full w-full object-contain"
              onError={() => setLogoError(true)}
            />
          )}
        </Link>

        <nav className="flex items-center gap-8 text-base">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative pb-1 ${
                  active ? "font-bold text-palette-accent" : "font-medium text-black"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-palette-accent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* 자체 JWT 로그인 연결 완료. 소셜로그인(카카오/네이버/구글)은 백엔드에 아직 엔드포인트 없음 */}
        <div className="flex items-center gap-3">
          {isLoggedIn && email && (
            <span className="hidden text-sm text-palette-muted sm:inline">{email}</span>
          )}
          <button
            onClick={handleAuthClick}
            className="rounded-lg bg-palette-accent px-5 py-3 text-sm font-semibold text-white"
          >
            {isLoggedIn ? "로그아웃" : "로그인"}
          </button>
        </div>
      </div>
    </header>
  );
}
