import { useState } from "react";

// Figma 푸터 시안 기준 (데스크탑 136:944 / 모바일 138:23 / 풀스크린 138:10):
// 크림색 띠, 왼쪽에 로고 2개(스마일게이트 위, 팔레트 아래), 가운데 카피라이트 + 크레딧, 오른쪽 Family Site 버튼.
// 모바일에서도 세로로 쌓지 않고 같은 가로 배치를 작게 줄여서 보여주는 게 시안이에요.
// Family Site를 누르면 버튼 아래로 흰색 목록이 펼쳐져요(시안엔 "희망스튜디오" 1개).
//
// (2026.11 보정) 시안 푸터 글자/로고는 시안 px 그대로인데, 코드의 상단 바(헤더)는 시안(글자 30px/높이 95px)의 약 0.55배라서
// 푸터만 커 보였어요. 그래서 데스크탑 푸터 크기를 시안의 0.55배로 맞췄어요(헤더와 같은 비율).
// 크기 규칙: 시안은 1440px 화면 기준으로 딱 맞게 그려져 있어서(로고+글+버튼이 거의 한 줄을 꽉 채움),
// 768~1440px 구간에서는 시안 px 값을 화면 폭(vw)에 비례해 줄이고(min(vw, 시안px)),
// 1440px보다 넓은 화면에서는 시안 크기에서 멈춰요. 풀스크린(2000px+)은 풀스크린 시안처럼 다시 비례해서 키워요.
// - 스마일게이트 로고 파일이 아직 없어서 임시로 텍스트 워드마크로 표시해요.
//   public/images/smilegate-logo.png 를 넣으면 이미지로 바뀌어요.
// - 희망스튜디오 링크: 스마일게이트 소셜임팩트 공식 사이트의 Family Site 목록에 있는 주소(https://www.heemangstudio.org)예요. 새 탭으로 열려요.
const FAMILY_SITES: { name: string; url: string }[] = [{ name: "희망스튜디오", url: "https://www.heemangstudio.org" }];

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <footer className="mt-12 bg-palette-header md:mt-24">
      <div className="flex items-start justify-between gap-2 px-[19px] py-5 md:gap-[min(1.54vw,22px)] md:px-[min(2.37vw,34.1px)] md:py-[min(1.81vw,26.4px)] 3xl:gap-[calc(50vw-380px)] 3xl:px-[80px] 3xl:py-[28px]">
        {/* 로고 2개 */}
        <div className="flex shrink-0 flex-col items-start gap-2 md:gap-[min(0.94vw,13.2px)]">
          {logoFailed ? (
            <span className="text-[11px] font-extrabold tracking-tight md:text-[min(1.07vw,15.4px)]">
              Smilegate
            </span>
          ) : (
            <img
              src="/images/smilegate-logo.png"
              alt="Smilegate"
              className="h-[11px] w-auto md:h-[min(1.71vw,24.8px)]"
              onError={() => setLogoFailed(true)}
            />
          )}
          <img
            src="/logo.png"
            alt="PALETTE"
            className="h-[26px] w-auto md:h-[min(3.67vw,52.8px)]"
          />
        </div>

        {/* 카피라이트 + 크레딧 */}
        <div className="min-w-0 flex-1 md:whitespace-nowrap">
          <p className="text-[9px] font-medium leading-tight md:text-[min(1.14vw,16.5px)]">
            © 2026 Smilegate Foundation. All Rights Reserved.
          </p>
          <div className="mt-1 text-[8px] font-medium leading-[11px] md:mt-[min(0.94vw,13.2px)] md:text-[min(1.07vw,15.4px)] md:leading-[min(1.54vw,22px)]">
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
            className="flex items-center justify-between gap-2 whitespace-nowrap rounded-[3px] bg-palette-accent px-[8px] py-[4px] text-[7.6px] font-semibold text-white md:w-[min(9.08vw,130.4px)] md:gap-[min(0.61vw,8.8px)] md:rounded-[6px] md:px-[min(1.32vw,18.7px)] md:py-[min(0.53vw,7.7px)] md:text-[min(1.07vw,15.4px)]"
          >
            Family Site
            <span aria-hidden className={`text-[8px] md:text-[min(1.07vw,15.4px)] ${open ? "" : "rotate-180"}`}>
              ▴
            </span>
          </button>
          {open && (
            <ul className="absolute left-0 right-0 top-full mt-px overflow-hidden rounded-[3px] bg-white text-[7.6px] font-semibold shadow-soft md:mt-1 md:rounded-[6px] md:text-[min(1.07vw,15.4px)]">
              {FAMILY_SITES.map((site) => (
                <li key={site.name}>
                  {site.url ? (
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-[12px] py-[4px] text-center md:px-4 md:py-[min(0.53vw,7.7px)]"
                    >
                      {site.name}
                    </a>
                  ) : (
                    <span className="block px-[12px] py-[4px] text-center md:px-4 md:py-[min(0.53vw,7.7px)]">
                      {site.name}
                    </span>
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
