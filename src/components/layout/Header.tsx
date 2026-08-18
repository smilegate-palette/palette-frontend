import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

// Figma(node 8:63 데스크탑 / 52:324 모바일 메뉴) 실제 시안 기준: 상단 GNB 배경 #fffced(크림),
// 활성 메뉴는 노란색(#ffd400) + 굵게 + 밑줄바, 로고는 실제 이미지 사용.
// 모바일(md 미만)은 햄버거 버튼으로 전체화면 메뉴를 열고, 데스크탑은 가로 내비게이션 유지.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, email, logout } = useAuth();

  const handleAuthClick = () => {
    setMenuOpen(false);
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
    <header className="sticky top-0 z-50 bg-palette-header px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        {/* 모바일 전용 햄버거 버튼 (Figma node 52:3 기준) */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴 열기"
          className="text-2xl leading-none text-black md:hidden"
        >
          ☰
        </button>

        <Link to="/" className="block h-[28px] w-[58px] md:h-[36px] md:w-[75px]">
          {/* Figma 로고 이미지(public/logo.png)를 export해서 넣어주시면 자동으로 교체돼요.
              파일이 없으면 텍스트 로고로 대체됩니다. */}
          {logoError ? (
            <span className="text-base font-bold tracking-tight md:text-lg">PALETTE</span>
          ) : (
            <img
              src="/logo.png"
              alt="PALETTE"
              className="h-full w-full object-contain"
              onError={() => setLogoError(true)}
            />
          )}
        </Link>

        {/* 데스크탑 전용 가로 내비게이션 - 모바일에서는 햄버거 메뉴로 대체 */}
        <nav className="hidden items-center gap-8 text-base md:flex">
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

        {/* 자체 JWT 로그인 연결 완료. 소셜로그인(카카오/네이버)은 백엔드에 아직 엔드포인트 없음 (구글은 미사용) */}
        <div className="flex items-center gap-3">
          {isLoggedIn && email && (
            <span className="hidden text-sm text-palette-muted sm:inline">{email}</span>
          )}
          <button
            onClick={handleAuthClick}
            className="rounded-lg bg-palette-accent px-4 py-2 text-xs font-semibold text-white md:px-5 md:py-3 md:text-sm"
          >
            {isLoggedIn ? "로그아웃" : "로그인"}
          </button>
        </div>
      </div>

      {/* 모바일 전체화면 메뉴 (Figma node 52:324 기준: 상단 로그인 유도문구/닫기 + 세로 nav 목록) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex items-center justify-between bg-palette-header px-4 py-4">
            {isLoggedIn ? (
              <span className="text-base font-semibold text-black">{email}</span>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="text-base font-semibold text-black"
              >
                로그인을 해주세요 &gt;
              </button>
            )}
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="메뉴 닫기"
              className="text-2xl leading-none text-palette-accent"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`border-b border-palette-border px-4 py-4 text-base ${
                    active ? "font-bold text-palette-accent" : "font-medium text-black"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isLoggedIn && (
              <button
                onClick={handleAuthClick}
                className="border-b border-palette-border px-4 py-4 text-left text-base font-medium text-black"
              >
                로그아웃
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
