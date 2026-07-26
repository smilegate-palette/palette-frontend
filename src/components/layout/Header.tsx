import { Link } from "react-router-dom";

// HOME/PROJECT 와이어프레임 기준 상단 네비게이션
// PALETTE 로고 영역: 텍스트/로고이미지/풀네임 중 무엇을 쓸지 미정 (디자인 기획 문서 참고)
const NAV_ITEMS = [
  { label: "HOME", href: "/" },
  { label: "PROJECT", href: "/project" },
  { label: "ABOUT PALETTE", href: "/about-palette" },
  { label: "off the record", href: "/off-the-record" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-palette-border bg-palette-surface px-6 py-4">
      <Link to="/" className="text-lg font-bold tracking-tight">
        PALETTE
      </Link>

      <nav className="flex items-center gap-6 text-sm font-medium">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} to={item.href} className="hover:text-palette-muted">
            {item.label}
          </Link>
        ))}
      </nav>

      {/* TODO: OAuth 소셜로그인(네이버/구글) + JWT 로그인 플로우 연결 */}
      <button className="rounded-full bg-palette-accent px-4 py-2 text-sm font-semibold text-palette-text">
        로그인
      </button>
    </header>
  );
}
