import { useEffect, useState } from "react";
import { AdminStory, getOffTheRecordStories } from "@/lib/api/admin";

export default function OffTheRecordPage() {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getOffTheRecordStories()
      .then(setStories)
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
          {stories.map((story) => (
            <article key={story.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-palette-placeholder">
                {story.thumbnailUrl && (
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <p className="mt-2 text-sm font-semibold">{story.title}</p>
              <p className="text-xs text-palette-muted">{story.username ?? "Off the record"}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
