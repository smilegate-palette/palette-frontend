import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Project } from "@/lib/types/project";

interface HeroSliderProps {
  // ⚠️ 킥오프 문서는 "2026년 11개 기관 프로젝트가 모두 순환"이라고 했는데,
  // 구축 기획(안) 컴포넌트 명세에는 "추천 프로젝트 3~5개 자동 롤링"으로 되어 있어 서로 다름 - 기획 확인 필요.
  // 일단 컴포넌트는 개수 상관없이 동작하도록 구현.
  projects: Project[];
  intervalMs?: number; // 구축 기획(안) 컴포넌트 명세 기준 3초
}

export default function HeroSlider({ projects, intervalMs = 3000 }: HeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false); // hover 시 자동 롤링 정지 (컴포넌트 명세 기준)

  useEffect(() => {
    if (projects.length === 0 || paused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % projects.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [projects.length, intervalMs, paused]);

  if (projects.length === 0) return null;

  const getSlideAt = (offset: number) =>
    projects[(activeIndex + offset + projects.length) % projects.length];

  const visibleCount = Math.min(5, projects.length);
  const firstOffset = -Math.floor((visibleCount - 1) / 2);
  const visibleOffsets = Array.from(
    { length: visibleCount },
    (_, index) => firstOffset + index
  );

  return (
    <section
      // overflow-x-hidden: 양 끝의 카드가 화면 밖으로 살짝 걸쳐 보이도록(시안) 넘치는 부분은 잘라냄
      className="overflow-x-hidden px-0 py-6 md:py-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 프로젝트 수와 최대 5개 중 작은 수만 표시하며, 모바일(sm 미만)은 가운데 카드만 보여요. */}
      <div className="relative flex items-center justify-center gap-3 md:gap-[min(1.4vw,48px)]">
        {visibleOffsets.map((offset) => (
          <SlideCard
            key={offset}
            project={getSlideAt(offset)}
            size={offset === 0 ? "large" : "small"}
            className={
              offset === 0 ? undefined : Math.abs(offset) === 1 ? "hidden sm:block" : "hidden md:block"
            }
          />
        ))}

        <button
          aria-label="이전 프로젝트"
          onClick={() => setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length)}
          className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-card sm:left-[calc(50%-150px)] md:left-[calc(50%-230px)] 3xl:left-[calc(50%-350px)]"
        >
          ‹
        </button>
        <button
          aria-label="다음 프로젝트"
          onClick={() => setActiveIndex((prev) => (prev + 1) % projects.length)}
          className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-card sm:right-[calc(50%-150px)] md:right-[calc(50%-230px)] 3xl:right-[calc(50%-350px)]"
        >
          ›
        </button>
      </div>

      {/* 인디케이터: 점 형태 (임시) */}
      <div className="mt-4 flex justify-center gap-2">
        {projects.map((p, i) => (
          <button
            key={p.id}
            aria-label={`${i + 1}번째 슬라이드로 이동`}
            onClick={() => setActiveIndex(i)}
            className={`h-2 w-2 rounded-full ${
              i === activeIndex ? "bg-palette-accent" : "bg-palette-border"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function SlideCard({
  project,
  size,
  className = "",
}: {
  project: Project;
  size: "small" | "large";
  className?: string;
}) {
  // Figma 풀스크린 시안(node 89:2, 2560px)에서는 중앙 카드 360×640, 좌우 카드 304×540으로
  // 크기 차이가 크지 않아서 3xl(2000px, tailwind.config.ts에 추가한 커스텀 브레이크포인트)
  // 이상에서 좀 더 크게 키웠습니다. 처음엔 기본 제공 2xl(1536px)을 썼는데, 그 폭에서는
  // 카드 3개 합친 폭이 화면보다 넓어져서 가로 스크롤이 생기는 버그가 있어서 2000px로 올렸습니다.
  // (좌우 카드가 화면 밖으로 살짝 걸쳐 보이는 연출까지는 구현 안 함 - 기존에 안내드린 단순화와 동일)
  const dimensions =
    size === "large"
      ? "h-44 w-[260px] md:h-72 md:w-[420px] 3xl:h-[360px] 3xl:w-[640px]"
      : "h-40 w-56 md:h-60 md:w-72 3xl:h-[304px] 3xl:w-[540px]";
  return (
    <Link
      to={`/project/${project.id}`}
      className={`relative ${dimensions} shrink-0 overflow-hidden rounded-lg bg-palette-placeholder shadow-card ${className}`}
    >
      <img
        src={project.thumbnailUrl}
        alt={project.title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <p className="text-xs uppercase opacity-80">{project.types.join(", ")}</p>
        <p className="font-semibold">{project.title}</p>
      </div>
    </Link>
  );
}
