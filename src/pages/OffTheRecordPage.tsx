// 팔레트 관련 STORY 콘텐츠 아카이빙 - 클릭 시 희망스튜디오 사이트로 이동
// TODO: 실제 스토리 목록 API/CMS 연동 전까지 mock 사용
const mockStories = Array.from({ length: 8 }).map((_, i) => ({
  id: `story-${i + 1}`,
  title: `스토리 콘텐츠 제목 ${i + 1}`,
  date: "2026.0" + ((i % 9) + 1) + ".01",
  thumbnailUrl: `https://placehold.co/400x300?text=Story+${i + 1}`,
  externalUrl: "https://www.hopestudio.or.kr", // TODO: 실제 희망스튜디오 STORY 링크로 교체
}));

export default function OffTheRecordPage() {
  return (
    <div className="px-6 py-8">
      <section className="mb-8 rounded-lg bg-palette-section px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">off the record</h1>
        <p className="mt-2 text-sm text-palette-muted">
          크리에이터들의 생생한 창작 현장
        </p>
      </section>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {mockStories.map((story) => (
          <a
            key={story.id}
            href={story.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-palette-placeholder">
              <img
                src={story.thumbnailUrl}
                alt={story.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-2 text-sm font-semibold">{story.title}</p>
            <p className="text-xs text-palette-muted">희망스튜디오 | {story.date}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
