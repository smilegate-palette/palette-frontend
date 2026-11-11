import { useState } from "react";

// Figma 푸터 시안 기준 (데스크탑 136:944 / 모바일 138:23 / 풀스크린 138:10):
// 크림색 띠, 왼쪽에 로고 2개(스마일게이트 위, 팔레트 아래), 가운데 카피라이트 + 크레딧, 오른쪽 Family Site 버튼.
// 모바일에서도 세로로 쌓지 않고 같은 가로 배치를 작게 줄여서 보여주는 게 시안이에요.
// Family Site를 누르면 버튼 아래로 흰색 목록이 펼쳐져요(시안엔 "희망스튜디오" 1개).
// - 스마일게이트 로고 파일이 아직 없어서 임시로 텍스트 워드마크로 표시해요.
//   public/images/smilegate-logo.png 를 넣으면 이미지로 바뀌어요.
// - 희망스튜디오 링크 주소를 아직 전달받지 못해서 url을 비워뒀어요(비어 있으면 클릭해도 이동 안 함).
const FAMILY_SITES: { name: string; url: string }[] = [{ name: "희망스튜디오", url: "" }];

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <footer className="mt-12 bg-palette-header md:mt-24">
      <div className="flex items-start justify-between gap-2 px-[19px] py-5 md:gap-10 md:px-[62px] md:py-12 3xl:px-[133px] 3xl:py-[4vw]">
        {/* 로고 2개 */}
        <div className="flex shrink-0 flex-col items-start gap-2 md:gap-6 3xl:gap-[2vw]">
          {logoFailed ? (
            <span className="text-[11px] font-extrabold tracking-tight md:text-[28px] 3xl:text-[2.2vw]">Smilegate</span>
          ) : (
            <img
              src="/images/smilegate-logo.png"
              alt="Smilegate"
              className="h-[11px] w-auto md:h-[45px] 3xl:h-[2.7vw]"
              onError={() => setLogoFailed(true)}
            />
          )}
          <img
            src="/logo.png"
            alt="PALETTE"
            className="h-[26px] w-auto md:h-24 3xl:h-[6.7vw]"
          />
        </div>

        {/* 카피라이트 + 크레딧 */}
        <div className="min-w-0 flex-1 xl:whitespace-nowrap">
          <p className="text-[9px] font-medium leading-tight md:text-[22px] xl:text-[30px] 3xl:text-[1.95vw]">
            © 2023 Smilegate Foundation. All Rights Reserved.
          </p>
          <div className="mt-1 text-[8px] font-medium leading-[11px] md:mt-6 md:text-[20px] md:leading-[32px] xl:text-[28px] xl:leading-[40px] 3xl:text-[1.76vw] 3xl:leading-[2.8vw]">
            <p>PROJECT CREDITS</p>
            <p>기획 최현주 | 디자인 김향기 | 개발 FE 부수현 | 개발 BE 김채흔</p>
          </div>
        </div>

        {/* Family Site */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="flex min-w-[64px] items-center justify-between gap-2 whitespace-nowrap rounded-[3px] bg-palette-accent px-[8px] py-[4px] text-[7.6px] font-semibold text-white md:min-w-[237px] md:gap-4 md:rounded-[10px] md:px-[34px] md:py-[14px] md:text-[28px] 3xl:w-[16.5vw] 3xl:rounded-[0.7vw] 3xl:px-[2.8vw] 3xl:py-[1vw] 3xl:text-[1.95vw]"
          >
            Family Site
            <span aria-hidden className={`text-[8px] md:text-[28px] 3xl:text-[2.2vw] ${open ? "" : "rotate-180"}`}>
              ▴
            </span>
          </button>
          {open && (
            <ul className="absolute left-0 right-0 top-full mt-px overflow-hidden rounded-[3px] bg-white text-[7.6px] font-semibold shadow-soft md:mt-1 md:rounded-[10px] md:text-[28px] 3xl:text-[1.95vw]">
              {FAMILY_SITES.map((site) => (
                <li key={site.name}>
                  {site.url ? (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-[12px] py-[4px] text-center md:px-4 md:py-[14px]"
                    >
                      {site.name}
                    </a>
                  ) : (
                    <span className="block px-[12px] py-[4px] text-center md:px-4 md:py-[14px]">{site.name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
