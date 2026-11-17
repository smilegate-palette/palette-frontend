import { useEffect, useState } from "react";
import { AdminStory, getOffTheRecordStories } from "@/lib/api/admin";

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

  useEffect(() => {
    getOffTheRecordStories()
      .then((list) => setStories(sortNewestFirst(list)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-8">
      <section className="mb-8 rounded-lg bg-palette-section px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">off the record</h1>
        <p className="mt-2 text-sm text-palette-muted">
          팔레트 아이들의 생생한 창작 현장
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-palette-muted">스토리를 불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-500">스토리를 불러오지 못했어요.</p>
      ) : stories.length === 0 ? (
        <p className="text-sm text-palette-muted">등록된 스토리가 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
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
                  <div className="relative aspect-[748/638] overflow-hidden rounded-lg bg-palette-placeholder">
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
                {date && <p className="mt-2 text-xs text-palette-muted">{date}</p>}
                <Wrapper className={`block text-sm font-semibold ${date ? "mt-0.5" : "mt-2"} ${link ? "hover:underline" : ""}`}>
                  {story.title}
                </Wrapper>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
