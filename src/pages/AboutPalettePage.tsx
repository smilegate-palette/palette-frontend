import { useEffect, useRef, useState } from "react";

// Figma 실제 시안 반영 (node 109:2, "ABOUT PALETTE", 1440px 데스크탑 전용 - 모바일/풀스크린 시안은 아직 안 나왔어요).
// 구조: 히어로(소개 문구 + 일러스트) + "팔레트가 만드는 창의환경" 4개 카테고리 탭 섹션.
// 시안엔 카테고리 4개(창의 콘텐츠/커뮤니티/조력자/파트너십)를 각각 클릭했을 때의 상태가
// 프레임 5장(선택 안 함 1장 + 카테고리별 선택 상태 4장)으로 따로따로 그려져 있는데,
// 실제로는 "탭 4개 중 하나를 클릭하면 그 아래에 상세 목록이 나타나는" 인터랙션 하나로 합쳐지는 구조라
// 코드에서는 activeCategory state 하나로 그 5장을 전부 표현했어요.
//
// ⚠️ 히어로 섹션의 일러스트(돌봄/학습활동/문화체험 등을 원형으로 배치한 그림)는
// 팔레트 자체 제작 일러스트라서 코드로 재현하지 않고 실제 이미지 파일이 필요해요.
// Figma에서 내보낸 이미지 URL이 7일 후 만료되는 임시 링크라 이 세션에서 바로 저장은 못 했어요 -
// public/images/about-hero.png 자리에 그 이미지 파일만 넣어주시면 바로 반영돼요 (아래 <img> 참고).

interface CategoryDetail {
  role?: string; // 있으면 title 위에 작은 글씨로 표시 (예: "청년 창작 멘토" + "Hope Creator")
  title: string;
  image?: string; // 항목 사진 (public/images/about/)
  description: string;
}

interface Category {
  key: string;
  label: string;
  summary: string;
  color: string; // 강조 테두리/포인트 컬러
  bg: string; // 선택됐을 때 카드 배경
  icon: string; // 실제 시안엔 커스텀 일러스트 아이콘인데, 프로젝트에서 이미 쓰고 있는 이모지 방식으로 대체
  details: CategoryDetail[];
}

const CATEGORIES: Category[] = [
  {
    key: "content",
    label: "창의 콘텐츠",
    summary: "관심사를 발견하고 창작으로 표현하는 경험",
    color: "#ffd400",
    bg: "#fffced",
    icon: "/images/about/icon-projects.png",
    details: [
      {
        title: "Experience",
        image: "/images/about/experience.png",
        description: "다양한 창작 활동을 경험하며 자신의 관심사를 탐색합니다",
      },
      {
        title: "Self-project",
        image: "/images/about/self-project.png",
        description: "또래 창작자들과 팀을 이루어 각자의 관심사를 담은 프로젝트를 기획하고 실행합니다",
      },
      {
        title: "Motivation & Culture",
        image: "/images/about/motivation-culture.png",
        description:
          "프로젝트를 다른 기관 창작자들과 공유하고 피드백을 나누며, 함께 성장하는 창작 문화를 만들어갑니다",
      },
    ],
  },
  {
    key: "community",
    label: "커뮤니티",
    summary: "또래 창작자와 함께 만나고 성장하는 관계",
    color: "#ff3c00",
    bg: "#fff6f3",
    icon: "👥",
    details: [
      {
        title: "Open Studio",
        image: "/images/about/open-studio.png",
        description:
          "서로 다른 프로젝트를 진행하는 창작자들이 만나 각자의 프로토타입을 소개하고, 또래 창작자 관점에서 피드백을 나눕니다",
      },
      {
        title: "Palette Festa",
        image: "/images/about/palette-festa.png",
        description: "완성된 프로젝트를 전시하고 발표하며, 유저와 직접 교류합니다",
      },
    ],
  },
  {
    key: "helper",
    label: "조력자",
    summary: "탐색과 창작의 과정을 함께하는 멘토·교사·전문가",
    color: "#20b958",
    bg: "#f5fff9",
    icon: "🧑‍🏫",
    details: [
      {
        role: "청년 창작 멘토",
        title: "Hope Creator",
        image: "/images/about/hope-creator.png",
        description: "지역 청년이 아이들의 멘토가 되어 관심사 탐색과 창작의 전 과정을 조력합니다",
      },
      {
        role: "기관 돌봄 교사",
        title: "Palette Bridge",
        image: "/images/about/palette-bridge.png",
        description: "창의 창작 활동을 위한 현장을 조성하고 아이들을 지원합니다",
      },
      {
        role: "전문가 창작 멘토",
        title: "Palette Meister",
        image: "/images/about/palette-meister.png",
        description: "전문가가 가진 경험과 역량을 기반으로 창작 멘토링을 지원합니다",
      },
    ],
  },
  {
    key: "partnership",
    label: "파트너십",
    summary: "창의 환경 조성에 대한 공감을 기반으로 함께 참여하는 파트너",
    color: "#1ba2ea",
    bg: "#ecf9ff",
    icon: "🤝",
    details: [
      {
        title: "방과 후 돌봄시설",
        image: "/images/about/partner-care.png",
        description: "기관 현장에서 지속 가능한 창의환경을 직접 조성합니다",
      },
      {
        title: "공공·기업",
        image: "/images/about/partner-public.png",
        description: "더 많은 지역의 아이들이 창의 환경을 경험할 수 있도록 확산에 동행합니다",
      },
    ],
  },
];

// ---- 2026.10 시안 추가분: 팔레트 프로그램 / IMPACT / 성장 지표 + 후기 ----
// 디자이너 메모: "모든 수치/참여자 후기는 관리자 페이지에서 수정 가능하도록 개발 필요".
// 백엔드 API가 아직 없어서 아래 상수에 고정값으로 넣어뒀고, API 생기면 이 상수만 fetch 결과로 교체하면 돼요.
// 사진/아이콘은 public/images/about/ 에 있어요(디자인팀 전달 파일).

interface Program {
  name: string;
  image: string;
  period: string;
  subtitle: string;
  description: string;
}

const PROGRAMS: Program[] = [
  {
    name: "아하! 팔레트",
    image: "/images/about/program-aha.png",
    period: "4-8주",
    subtitle: "어린이 AI & Hands-On 창의 프로그램",
    description:
      "모바일 창의학습 App. '아하오호'의 AI 가이드에 따라 아동의 흥미를 탐색하고 창의 활동을 경험합니다.",
  },
  {
    name: "드림 온 페스타",
    image: "/images/about/program-dream-on.png",
    period: "4시간",
    subtitle: "원데이 청소년 창의 ·창작 페스티벌",
    description:
      "청소년 대상의 원데이 창의 워크숍. 대화형/생성형 AI를 활용해 나만의 콘텐츠를 완성합니다.",
  },
  {
    // 시안에 설명이 "아하! 팔레트"와 동일하게 복붙돼 있어서(디자이너 확인 필요) 일단 시안 그대로 넣었어요.
    name: "팔레트 플레이어",
    image: "/images/about/program-player.png",
    period: "6주",
    subtitle: "어린이 AI & Hands-On 창의 프로그램",
    description:
      "모바일 창의학습 App. '아하오호'의 AI 가이드에 따라 아동의 흥미를 탐색하고 창의 활동을 경험합니다.",
  },
  {
    name: "팔레트 창의워크숍",
    image: "/images/about/program-workshop.png",
    period: "6개월",
    subtitle: "청소년 AI 기반 자율 창작 프로그램",
    description:
      "청년 멘토 Hope Creator와 기관 또래들이 한 팀이 되어 관심사가 반영된 창작 프로젝트를 만들고 공유합니다.",
  },
  {
    name: "드림 부스터 캠프",
    image: "/images/about/program-booster.png",
    period: "2-5일",
    subtitle: "청소년 디지털 ·AI 창작 캠프",
    description:
      "멘토와 청소년들이 함께 관심사 기반의 창작 프로젝트를 단기간에 완성하는 몰입형 창작 캠프입니다.",
  },
];

// 2026.10 IMPACT 개편 시안 반영: 큰 카드 2개 + 작은 지표 4개 + 색 카드 성장 지표. 숫자는 화면에 보일 때 카운트업.
const BIG_STATS = [
  { label: "참여 아동", value: 14230, unit: "명", note: "(연 인원)", icon: "/images/about/icon-children.png", bg: "linear-gradient(135deg,#ffc58f,#ff9f6b)", border: "#ff9f6b" },
  { label: "창작 프로젝트", value: 219, unit: "개", note: "", icon: "🎨", bg: "#fff1c4", border: "#ffd400" },
];

const SMALL_STATS = [
  { icon: "/images/about/icon-regions.png", value: 15, unit: "개 지역", label: "확산 지역" },
  { icon: "/images/about/icon-institutions.png", value: 128, unit: "개", label: "참여 기관 수" },
  { icon: "/images/about/icon-supporters.png", value: 5334, unit: "명", label: "참여 조력자(연 인원)" },
  { icon: "/images/about/icon-time.png", value: 46781, unit: "h", label: "참여 시간" },
];

const CHILD_GROWTH = [
  { icon: "/images/about/icon-confidence.png", label: "자신감", value: 4.85, bg: "#e6f6e6" },
  { icon: "/images/about/icon-expression.png", label: "자기표현력", value: 4.74, bg: "#fff1c4" },
  { icon: "/images/about/icon-collaboration.png", label: "협업 역량", value: 4.62, bg: "#efe6fb" },
];

const MENTOR_GROWTH = [
  { icon: "🧠", label: "문제해결역량", value: 4.85, bg: "#e6f6e6" },
  { icon: "💬", label: "소통·협업역량", value: 4.85, bg: "#fff1c4" },
  { icon: "🌟", label: "리더십", value: 4.8, bg: "#efe6fb" },
];

// 경로(/images/...)면 이미지로, 아니면 이모지 텍스트로 표시
function Icon({ src, className }: { src: string; className: string }) {
  return src.startsWith("/") ? (
    <img src={src} alt="" className={className} />
  ) : (
    <span aria-hidden className={className}>
      {src}
    </span>
  );
}

// 화면에 보이면 0에서 목표값까지 올라가는 숫자. "움직임 줄이기" 설정이면 애니메이션 없이 바로 표시.
function CountUp({ value, decimals = 0, duration = 1400 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const startAt = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - startAt) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const text = display.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span ref={ref}>{text}</span>;
}

const CHILD_REVIEWS = [
  {
    text: "제가 학교에서 혼자 그림을 그릴 땐 그냥 낙서 같았어요. 하지만 이번에는 친구들과 함께 만화를 만들면서 진짜 작가가 된 기분이었어요. 전시를 통해 사람들에게 보여주는 것도 처음이라 떨렸지만, 다들 관심을 가져주셔서 뿌듯했어요. 이번 팔레트를 통해 팀워크도 배우고 창작의 즐거움도 알게 되었어요.",
    author: "(시흥)푸른지역아동센터 참여 아동",
  },
  {
    text: "이번에 작품을 만들면서 영상 편집을 처음 배웠어요. 처음엔 낯설었지만, 직접 결과물을 보니까 너무 뿌듯했어요. 특히 친구들이 제 작품을 보고 칭찬해줄 때 정말 기분이 좋았어요! 이제 다른 창작 프로젝트에도 도전해 보고 싶어요.",
    author: "(성남)도담분당동지역아동센터 참여 아동",
  },
];

const MENTOR_REVIEWS = [
  {
    text: "처음에는 자신을 표현하는 것에 낯설어하던 아이들이 점차 친구들과 소통하며 아이디어를 확장해 나가고 긴 시간에 걸쳐 하나의 작품을 완성해냈습니다. 특히 팔레트 페스타에서 다른 팀의 창작물을 직접 체험해보며 다음에는 무엇을 만들어볼지 이야기하며 기대감을 보이는 등 창작에 깊이 몰입한 모습을 보며 멘토로서 큰 보람을 느꼈습니다.",
    author: "Hope Creator 6기 참여 멘토",
  },
];

function GrowthRow({ items }: { items: { icon: string; label: string; value: number; bg: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:gap-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl p-3 md:rounded-2xl md:p-6" style={{ backgroundColor: item.bg }}>
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs font-bold md:text-xl">{item.label}</p>
            <Icon src={item.icon} className="h-8 w-8 object-contain text-base md:h-16 md:w-16 md:text-3xl" />
          </div>
          <p className="mt-2 text-right md:mt-4">
            <span className="text-2xl font-extrabold md:text-6xl">
              <CountUp value={item.value} decimals={2} />
            </span>
            <span className="ml-1 text-xs font-bold md:text-2xl">점</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ text, author }: { text: string; author: string }) {
  return (
    <div className="rounded-2xl bg-[#fffced] p-4 md:p-8">
      <div className="flex gap-2 md:gap-4">
        <span className="text-3xl font-black leading-none text-[#ffd400] md:text-6xl">“</span>
        <p className="flex-1 pt-1 text-sm font-semibold leading-relaxed md:pt-3 md:text-xl md:leading-[1.7]">{text}</p>
        <span className="self-end text-3xl font-black leading-none text-[#ffd400] md:text-6xl">”</span>
      </div>
      <p className="mt-3 text-right text-xs text-palette-muted md:mt-4 md:text-lg">– {author}</p>
    </div>
  );
}

export default function AboutPalettePage() {
  // null = 시안 기본 상태(카드 4개만 보이고 아무것도 펼쳐지지 않은 상태)
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeCategory = CATEGORIES.find((c) => c.key === activeKey) ?? null;
  // public/images/about-hero.png 파일이 아직 없어서 로드 실패하면 안내 문구만 보여줌
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  return (
    <div className="px-4 py-6 md:px-6 md:py-10">
      {/* 히어로 */}
      <section className="mx-auto mb-14 max-w-[1290px] md:mb-20 3xl:max-w-[1800px]">
        {/* Figma(node 109:2): 제목+소개글은 가운데 정렬이 아니라 왼쪽 정렬이고, 소개글은 PC에서 정해진 3줄로 끊겨 있어요.
            1280px 이상에서는 그 3줄 그대로(줄바꿈 없이) 보여주고, 그보다 좁으면 자연스럽게 줄바꿈돼요. */}
        <h1 className="mb-3 text-xl font-bold leading-snug md:mb-5 md:text-3xl xl:text-[2.5vw]">
          나의 색깔을 찾아가는 창의 커뮤니티 팔레트
        </h1>
        <div className="text-sm font-medium leading-relaxed text-palette-text md:text-lg xl:whitespace-nowrap xl:text-[1.94vw] xl:leading-[1.6]">
          <p>팔레트는 미래세대가 관심사 기반의 AI 디지털 창작 경험을 통해 미래역량을 키워갈 수 있도록 돕는 창의 커뮤니티입니다.</p>
          <p>2019년부터 시작된 팔레트는 '방과 후 돌봄시설'에 창의환경을 조성하여 아이들이 자신만의 색깔을 발견하고</p>
          <p>관심사에서 출발한 프로젝트를 만들어가며 자기주도성, 협업능력, 문제해결능력을 기를 수 있도록 지원하고 있습니다.</p>
        </div>

        {/* 실제 팔레트 자체 제작 일러스트 필요 - public/images/about-hero.png 만 넣어주시면 바로 나와요. */}
        <div className="mx-auto mt-8 flex aspect-square w-full max-w-md items-center justify-center rounded-full bg-palette-section text-sm text-palette-muted md:mt-10">
          {heroImageFailed ? (
            <span>일러스트 이미지 준비중</span>
          ) : (
            <img
              src="/images/about-hero.png"
              alt="팔레트가 만드는 창의환경 일러스트"
              className="h-full w-full rounded-full object-cover"
              onError={() => setHeroImageFailed(true)}
            />
          )}
        </div>
      </section>

      {/* 팔레트가 만드는 창의환경 - 카테고리 4개 탭 + 클릭 시 하단에 상세 목록 등장 */}
      <section className="mx-auto max-w-[1290px] 3xl:max-w-[1800px]">
        <h2 className="mb-6 text-lg font-bold md:mb-8 md:text-2xl">팔레트가 만드는 창의환경</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {CATEGORIES.map((category) => {
            const isActive = category.key === activeKey;
            return (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveKey(isActive ? null : category.key)}
                className="rounded-2xl bg-white p-4 text-left transition-colors md:rounded-3xl md:p-6"
                style={{
                  boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)",
                  border: isActive ? `4px solid ${category.color}` : "4px solid transparent",
                  backgroundColor: isActive ? category.bg : "#ffffff",
                }}
              >
                <p className="text-2xl md:text-3xl">{category.icon}</p>
                <p className="mt-2 text-base font-semibold md:mt-3 md:text-2xl">{category.label}</p>
                <p className="mt-1 text-xs text-palette-muted md:text-base">{category.summary}</p>
              </button>
            );
          })}
        </div>

        {activeCategory && (
          <div
            className="mt-4 rounded-2xl bg-white p-5 md:mt-6 md:rounded-[20px] md:p-8"
            style={{ boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)" }}
          >
            <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {activeCategory.details.map((detail, i) => (
                <li key={detail.title} className="flex flex-col items-center gap-1.5 text-center">
                  {detail.image && (
                    <img src={detail.image} alt={detail.title} className="mb-2 aspect-[3/2] w-full rounded-xl object-cover" />
                  )}
                  <span
                    className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: activeCategory.color }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {detail.role && (
                    <p className="text-xs font-medium text-palette-muted md:text-sm">{detail.role}</p>
                  )}
                  <p className={detail.role ? "text-lg font-extrabold md:text-2xl" : "text-base font-semibold md:text-lg"}>
                    {detail.title}
                  </p>
                  <p className="text-xs leading-relaxed text-palette-muted md:text-sm">
                    {detail.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 팔레트 프로그램 */}
      <section className="mx-auto mt-14 max-w-[1290px] 3xl:max-w-[1800px] md:mt-20">
        <h2 className="mb-6 text-lg font-bold md:mb-8 md:text-2xl">팔레트 프로그램</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
          {PROGRAMS.map((program) => (
            <li
              key={program.name}
              className="relative overflow-hidden rounded-2xl bg-white"
              style={{ boxShadow: "0px 4px 10px 0px rgba(0,0,0,0.25)" }}
            >
              <img src={program.image} alt={program.name} className="aspect-[16/9] w-full object-cover" />
              <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold md:text-sm">
                {program.period}
              </span>
              <div className="p-4 md:p-5">
                <p className="text-base font-bold md:text-xl">{program.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-palette-muted md:text-sm">
                  {program.subtitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-palette-muted md:text-sm">
                  {program.description}
                </p>
                {/* 두 버튼 모두 이동할 대상(프로그램별 프로젝트/스토리 필터)이 아직 정해지지 않아서 연결 전이에요 */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-[#ececec] px-3 py-1.5 text-xs font-semibold opacity-70"
                  >
                    Story 보기
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-[#ffd400] px-3 py-1.5 text-xs font-semibold opacity-70"
                  >
                    창작 프로젝트 보기
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* IMPACT - "팔레트가 함께 만든 변화" (2026.10 시안) */}
      <section className="mx-auto mt-14 max-w-[1290px] 3xl:max-w-[1800px] md:mt-20">
        <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-3xl">IMPACT</h2>
        <h3 className="mb-3 text-base font-bold md:mb-5 md:text-2xl">팔레트가 함께 만든 변화</h3>

        <div className="grid grid-cols-5 gap-3 md:gap-6">
          {BIG_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`rounded-2xl p-4 md:rounded-3xl md:p-8 ${i === 0 ? "col-span-3" : "col-span-2"}`}
              style={{ background: stat.bg, border: `2px solid ${stat.border}` }}
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-bold md:text-2xl">{stat.label}</p>
                <Icon src={stat.icon} className="h-10 w-10 object-contain text-2xl md:h-24 md:w-24 md:text-5xl" />
              </div>
              <p className="mt-2 md:mt-6">
                <span className="text-3xl font-extrabold md:text-7xl 3xl:text-8xl">
                  <CountUp value={stat.value} />
                </span>
                <span className="ml-1 text-sm font-bold md:text-3xl">{stat.unit}</span>
                {stat.note && <span className="ml-1 text-[10px] text-palette-muted md:text-base">{stat.note}</span>}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-y-6 border-y border-palette-border py-6 md:mt-10 md:grid-cols-4 md:py-10">
          {SMALL_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center text-center ${i > 0 ? "md:border-l md:border-palette-border" : ""}`}
            >
              <Icon src={stat.icon} className="h-14 w-14 object-contain text-4xl md:h-24 md:w-24 md:text-6xl" />
              <p className="mt-2 md:mt-3">
                <span className="text-2xl font-extrabold md:text-5xl">
                  <CountUp value={stat.value} />
                </span>
                <span className="ml-1 text-xs font-bold md:text-xl">{stat.unit}</span>
              </p>
              <p className="mt-1 text-[11px] text-palette-muted md:text-base">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 mt-12 flex flex-wrap items-baseline gap-2 md:mb-6 md:mt-16">
          <h3 className="text-base font-bold md:text-2xl">[참여 아동・청소년의 성장]</h3>
          <span className="text-xs text-palette-muted md:text-sm">*5점 만점</span>
        </div>
        <GrowthRow items={CHILD_GROWTH} />
        <div className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-6">
          {CHILD_REVIEWS.map((r) => (
            <ReviewCard key={r.author} {...r} />
          ))}
        </div>

        <div className="mb-4 mt-12 flex flex-wrap items-baseline gap-2 md:mb-6 md:mt-16">
          <h3 className="text-base font-bold md:text-2xl">[청년 멘토(Hope Creator)의 성장]</h3>
          <span className="text-xs text-palette-muted md:text-sm">*5점 만점</span>
        </div>
        <GrowthRow items={MENTOR_GROWTH} />
        <div className="mt-6 flex flex-col gap-4 md:mt-8 md:gap-6">
          {MENTOR_REVIEWS.map((r) => (
            <ReviewCard key={r.author} {...r} />
          ))}
        </div>
      </section>
    </div>
  );
}
