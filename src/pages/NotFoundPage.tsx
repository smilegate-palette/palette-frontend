import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-lg font-semibold">페이지를 찾을 수 없어요.</p>
      <Link to="/" className="text-sm text-palette-muted underline">
        홈으로 돌아가기
      </Link>
    </div>
  );
}
