// 팔레트 측에서 콘텐츠(텍스트/이미지) 전달 후 본격 디자인 진행 예정 (후순위 페이지)
// 지금은 킥오프 문서 기준 섹션 구조 + 타이포그래피 스케일만 잡아둔 상태

export default function AboutPalettePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <section className="mb-12 text-center">
        <p className="mb-2 text-xs uppercase tracking-widest text-palette-muted">
          ABOUT PALETTE
        </p>
        <h1 className="text-3xl font-bold leading-snug">
          지역아동센터 아동청소년이
          <br />
          가장 나다운 크리에이터로 자라는 곳,
          <br />
          창의 커뮤니티 PALETTE
        </h1>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold">사업 소개</h2>
        {/* TODO: 팔레트 측 전달 텍스트 + 이미지로 교체 */}
        <p className="text-base leading-relaxed text-palette-muted">
          사업 소개 텍스트가 이 영역에 들어갑니다.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">PROGRAM</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {["창의워크숍", "팔레트 페스타", "유스파티"].map((program) => (
            <div
              key={program}
              className="rounded-lg border border-palette-border p-4"
            >
              <p className="text-sm font-semibold">{program}</p>
              <p className="mt-1 text-xs text-palette-muted">
                프로그램 소개 텍스트
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
