import { FormEvent, KeyboardEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth/AuthContext";
import { createProject } from "@/lib/api/projects";
import { ProgramType, ProjectType, PROJECT_TYPES } from "@/lib/types/project";

// Figma(node 60:2 데스크탑 / 63:343 모바일 "PROJECT 업로드 폼") 기준.
// 5단계(기본 정보/참여자 정보/프로젝트 설명/미디어 업로드/완료)가 실제로는 한 페이지에
// 세로로 쭉 이어진 스크롤 폼이라 그대로 한 페이지 컴포넌트로 구현했습니다.
// 상단 스텝 인디케이터는 장식용(현재는 스크롤 위치에 따라 활성화되지 않는 정적 표시)입니다.

const PROGRAM_OPTIONS: ProgramType[] = ["창의워크숍", "유스파티"];
const STEPS = ["기본 정보", "참여자 정보", "프로젝트 설명", "미디어 업로드", "완료"];
type MediaType = "video" | "file" | "link";

export default function UploadPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const [program, setProgram] = useState<ProgramType | "">("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState("");
  // 2026.09.06 백엔드 category가 고정 enum이라, Figma 시안의 자유 태그 입력 대신
  // 처음 설계했던 enum 기반 드롭다운 단일 선택으로 되돌림 (PROJECT_TYPES 참고)
  const [category, setCategory] = useState<ProjectType | "">("");
  const [region, setRegion] = useState("");
  const [organization, setOrganization] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [webLink, setWebLink] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="mb-4 text-sm text-palette-muted">로그인 후 프로젝트를 올릴 수 있어요.</p>
        <button
          onClick={() => navigate("/login")}
          className="rounded-xl bg-palette-accent px-6 py-3 text-sm font-semibold text-white"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  const addTag = (
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    setValue: (v: string) => void,
    list: string[],
    setList: (v: string[]) => void
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
    setValue("");
  };

  const handleThumbnailChange = (file: File | undefined) => {
    if (!file) return;
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!program || !title.trim() || !category || description.trim().length < 50) {
      setError("필수 항목을 확인해주세요. (프로젝트명, 프로그램, 유형, 50자 이상 프로젝트 설명은 꼭 입력해야 해요)");
      return;
    }

    setSubmitting(true);
    try {
      await createProject({
        program,
        year,
        title,
        category,
        region: region || undefined,
        organization: organization || undefined,
        participants,
        description,
        mediaUrl: mediaType === "video" ? videoUrl : mediaType === "link" ? webLink : undefined,
      });
      navigate("/project");
    } catch (err) {
      // 2026.08.11 백엔드가 로그인 응답에 user_id를 내려주기 시작해서 실제 등록 연동이 가능해짐.
      // user_id를 못 찾은 경우엔 createProject가 안내 메시지가 담긴 Error를 던짐 - 그대로 보여줌.
      setError(
        err instanceof Error
          ? err.message
          : "업로드에 실패했어요. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-8">
      {/* 상단 스텝 인디케이터 (장식용) */}
      <div className="mb-6 flex items-center justify-between md:mb-10">
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white md:size-8 md:text-sm ${
                  i === 0 ? "bg-palette-accent" : "bg-palette-placeholder"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[9px] md:text-sm ${
                  i === 0 ? "font-bold text-palette-accent" : "text-palette-placeholder"
                }`}
              >
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-1 h-px flex-1 bg-palette-border md:mx-2" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 md:gap-12">
        {/* 1. 기본 정보 */}
        <section>
          <SectionHeading n={1} title="기본 정보" active />
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Field label="프로그램">
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value as ProgramType)}
                className={inputClass}
              >
                <option value="">창의워크숍 / 유스파티</option>
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="연도">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="프로젝트명 입력">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="프로젝트명 입력"
                className={inputClass}
              />
            </Field>
            <Field label="유형">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectType)}
                className={inputClass}
              >
                <option value="">유형 선택</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        {/* 2. 참여자 정보 */}
        <section>
          <SectionHeading n={2} title="참여자 정보" />
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <Field label="지역">
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="권역과 시 필수 기입(예, 경기 성남)"
                className={inputClass}
              />
            </Field>
            <Field label="소속 기관명">
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="기관명 입력"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="mt-3 md:mt-4">
            <Field label="참여자 이름">
              <input
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) =>
                  addTag(e, participantInput, setParticipantInput, participants, setParticipants)
                }
                placeholder="참여자 이름 입력 후 엔터"
                className={inputClass}
              />
            </Field>
          </div>
          <TagList
            items={participants}
            onRemove={(i) => setParticipants(participants.filter((_, idx) => idx !== i))}
          />
        </section>

        {/* 3. 프로젝트 설명 */}
        <section>
          <SectionHeading n={3} title="프로젝트 설명" />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="프로젝트 설명 입력 (50자 이상)"
            rows={5}
            className={`${inputClass} h-auto resize-none`}
          />
        </section>

        {/* 4. 미디어 업로드 */}
        <section>
          <SectionHeading n={4} title="미디어 업로드" />
          {/* Figma 시안엔 세 방식이 동시에 다 보이는데, 실제로는 값이 하나만 저장되는 필드(media_url)라
              탭처럼 하나만 선택해서 입력하는 방식으로 구현했습니다. */}
          <div className="mb-3 flex gap-2">
            {(
              [
                ["video", "영상 URL"],
                ["file", "파일 업로드"],
                ["link", "웹 링크"],
              ] as [MediaType, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMediaType(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium md:rounded-xl md:px-4 md:py-2 md:text-sm ${
                  mediaType === value
                    ? "bg-palette-muted text-white"
                    : "bg-palette-placeholder text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mediaType === "video" && (
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="영상 URL 입력 (YouTube, Vimeo 등)"
              className={inputClass}
            />
          )}
          {mediaType === "link" && (
            <input
              value={webLink}
              onChange={(e) => setWebLink(e.target.value)}
              placeholder="웹 링크 입력"
              className={inputClass}
            />
          )}
          {mediaType === "file" && (
            <label className={`${inputClass} flex cursor-pointer items-center justify-between`}>
              <span className={mediaFile ? "text-black" : "text-palette-muted"}>
                {mediaFile ? mediaFile.name : "파일 업로드 (100MB 이하)"}
              </span>
              <span aria-hidden>📎</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}

          <div className="mt-4 md:mt-6">
            <p className="mb-2 text-xs text-palette-muted md:text-sm">썸네일 이미지(16:9)</p>
            <label className="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-palette-placeholder text-sm text-white/70 md:rounded-2xl">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="썸네일 미리보기" className="h-full w-full object-cover" />
              ) : (
                "클릭해서 썸네일 이미지 선택"
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleThumbnailChange(e.target.files?.[0])}
              />
            </label>
          </div>
        </section>

        {/* 5. 완료 */}
        <section className="flex flex-col items-center gap-4 text-center">
          <SectionHeading n={5} title="완료" />
          <p className="text-sm text-palette-muted md:text-base">
            작성하신 내용을 다시 한번 확인한 후 하단의 [업로드] 버튼을 눌러주세요.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-palette-accent px-8 py-3 text-base font-semibold text-white shadow-strong disabled:opacity-50"
          >
            {submitting ? "업로드 중..." : "업로드"}
          </button>
        </section>
      </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg bg-palette-section px-3 py-2.5 text-sm text-black outline-none placeholder:text-palette-muted md:rounded-xl md:px-4 md:py-3";

function SectionHeading({ n, title, active }: { n: number; title: string; active?: boolean }) {
  return (
    <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white md:size-9 md:text-base ${
          active ? "bg-palette-accent" : "bg-palette-placeholder"
        }`}
      >
        {n}
      </span>
      <h2 className={`text-base font-bold md:text-2xl ${active ? "text-palette-accent" : "text-black"}`}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-palette-muted md:text-base">{label}</p>
      {children}
    </div>
  );
}

function TagList({ items, onRemove }: { items: string[]; onRemove: (i: number) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 md:mt-3 md:gap-2">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className="flex items-center gap-1 rounded-lg bg-palette-muted px-2.5 py-1 text-xs text-white md:rounded-xl md:px-3 md:py-1.5 md:text-sm"
        >
          {item}
          <button type="button" onClick={() => onRemove(i)} aria-label={`${item} 삭제`}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
