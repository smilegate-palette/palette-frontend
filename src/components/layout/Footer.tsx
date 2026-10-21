import { useState } from "react";

// Figma 푸터 시안(node 136:944) 기준: 크림색 배경, 좌측 로고 2개, 가운데 카피라이트 + 크레딧, 우측 Family Site 드롭다운.
// - 스마일게이트 로고 이미지 파일이 아직 없어서 임시로 텍스트 워드마크로 표시해요.
//   public/images/smilegate-logo.png 를 넣고 아래 SMILEGATE_LOGO_SRC 를 켜면 이미지로 바뀌어요.
// - 패밀리 사이트 링크 목록은 아직 전달받지 못해서 FAMILY_SITES 가 비어 있어요(비어 있으면 "준비중" 표시).
const FAMILY_SITES: { name: string; url: string }[] = [];

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <footer className="mt-16 bg-palette-header md:mt-24">
      <div className="flex flex-col gap-6 px-4 py-8 md:flex-row md:items-start md:justify-between md:gap-10 md:px-[62px] md:py-12">
        <div className="flex shrink-0 flex-row items-center gap-5 md:flex-col md:items-start md:gap-6">
          {logoFailed ? (
            <span className="text-2xl font-extrabold tracking-tight">Smilegate</span>
          ) : (
            <img
              src="/images/smilegate-logo.png"
              alt="Smilegate"
              className="h-8 w-auto md:h-11"
              onError={() => setLogoFailed(true)}
            />
          )}
          <img src="/logo.png" alt="PALETTE" className="h-12 w-auto md:h-24" />
        </div>

        <div className="flex-1 md:max-w-2xl">
          <p className="text-sm font-medium md:text-2xl">© 2023 Smilegate Foundation. All Rights Reserved.</p>
          <div className="mt-3 text-xs font-medium leading-relaxed md:mt-6 md:text-xl md:leading-[40px]">
            <p>PROJECT CREDITS</p>
            <p>기획 최현주 | 디자인 김향기 | 개발 FE 부수현 | 개발 BE 김채흔</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-palette-accent px-8 py-3 text-base font-semibold text-white md:w-[237px] md:text-2xl"
          >
            Family Site
            <span aria-hidden className={`text-sm transition-transform md:text-2xl ${open ? "" : "rotate-180"}`}>
              ▴
            </span>
          </button>
          {open && (
            <ul className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-[10px] bg-white text-sm shadow-soft md:text-lg">
              {FAMILY_SITES.length === 0 ? (
                <li className="px-4 py-3 text-palette-muted">준비중</li>
              ) : (
                FAMILY_SITES.map((site) => (
                  <li key={site.url}>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 hover:bg-palette-header"
                    >
                      {site.name}
                    </a>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
