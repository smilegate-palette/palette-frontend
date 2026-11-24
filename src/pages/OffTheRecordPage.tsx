import { useEffect, useState } from "react";
import { AdminStory, getOffTheRecordStories, getPublicBanners } from "@/lib/api/admin";

// 디자인 담당(김하영) 요청 반영:
// - 항목: 제목 / 업로드 일자 / 썸네일 / 링크(썸네일·제목 클릭 시 새 창으로 이동)
// - 최신 일자 순으로 나열
// - 썸네일 크기가 제각각이라 페이지에서는 같은 비율(대부분 748*638)로 잘라서(object-cover) 보여줘요
// 링크 필드는 백엔드에 아직 없어서, 값이 내려오면 자동으로 클릭 가능해져요.
function toTime(story: AdminStory): number {
  const t = story.createdAt ? Date.parse(story.createdAt) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function sortNewestFirst(list: AdminStory[]): AdminStory[] {
  // 날짜가 있으면 날짜 내림차순, 같거나 없으면 id가 큰(나중에 올린) 것 먼저
  return [...list].sort((a, b) => {
    const diff = toTime(b) - toTime(a);
    if (diff !== 0) return diff;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

export default function OffTheRecordPage() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    getPublicBanners("OFF_THE_RECORD")
      .then((list) => {
        setBannerUrl(list[0]?.imageUrl ?? "");
        setBannerFailed(false);
      })
      .catch(() => setBannerFailed(true));
  }, []);

  useEffect(() => {
    getOffTheRecordStories()
      .then((list) => setStories(sortNewestFirst(list)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* 상단 배너 (Figma 157:32 / 159:433 / 159:166): 회색(#d9d9d9) 큰 띠 위에 흰색 문구. 높이는 화면 폭 비례(1440 기준 450px).
          배너 이미지는 아직 전달 전이라 회색 띠로 두었고, public/images/off-the-record-banner.png 를 넣으면 이미지로 바뀌어요. */}
      <section className="relative h-[53.8vw] w-full overflow-hidden bg-[#d9d9d9] md:h-[31.25vw]">
        {!bannerFailed && bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setBannerFailed(true)}
          />
        )}
        <h1
          className="absolute bottom-[10px] left-[19px] font-bold text-white md:bottom-[3.2vw] md:left-[5.14vw]"
          style={{ fontSize: "clamp(18px, 2.5vw, 64px)", textShadow: "0px 4px 10px rgba(0,0,0,0.25)" }}
        >
          크리에이터들의 생생한 창작 현장
        </h1>
      </section>

      <div className="px-5 pb-10 pt-[18px] md:px-[5.14vw] md:pt-[2.8vw]">
        {loading ? (
          <p className="text-sm text-palette-muted">스토리를 불러오는 중...</p>
        ) : error ? (
          <p className="text-sm text-red-500">스토리를 불러오지 못했어요.</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-palette-muted">등록된 스토리가 없어요.</p>
        ) : (
          // 시안: 모바일 2열 / 데스크탑·풀스크린 4열, 카드 이미지 비율 310:215
          <div className="grid grid-cols-2 gap-x-[14.5px] gap-y-[12px] md:grid-cols-4 md:gap-x-[1.25vw] md:gap-y-[2.1vw]">
            {stories.map((story) => {
              const date = formatDate(story.createdAt);
              const link = story.link?.trim();
              const Wrapper = ({ children, className }: { children: React.ReactNode; className?: string }) =>
                link ? (
                  <a href={link} target="_blank" rel="noopener noreferrer" className={className}>
                    {children}
                  </a>
                ) : (
                  <div className={className}>{children}</div>
                );
              return (
                <article key={story.id} className="group">
                  <Wrapper className="block">
                    <div
                      className="relative aspect-[310/215] overflow-hidden rounded-[7px] bg-[#d9d9d9] md:rounded-[15px]"
                      style={{ boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.25)" }}
                    >
                      {story.thumbnailUrl && (
                        <img
                          src={story.thumbnailUrl}
                          alt={story.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      )}
                    </div>
                  </Wrapper>
                  <div className="px-[7%] pt-1.5 md:pt-[0.7vw]">
                    <Wrapper
                      className={`block text-[11px] font-semibold leading-tight text-black md:text-[max(12px,1.39vw)] ${link ? "hover:underline" : ""}`}
                    >
                      {story.title}
                    </Wrapper>
                    {date && (
                      <p className="mt-0.5 text-[7.5px] font-medium text-black md:text-[max(9px,0.97vw)]">{date}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}