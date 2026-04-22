import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <section className="mb-16">
        <h1 className="mb-4 text-4xl font-bold text-[#1F2328]">안녕하세요 👋</h1>
        <p className="mb-6 text-lg leading-relaxed text-[#636C76]">
          개발하며 배운 것들을 기록하는 공간입니다.
          <br />
          글과 프로젝트를 통해 생각을 정리합니다.
        </p>
        <div className="flex gap-3">
          <Link
            to="/posts"
            className="rounded-md bg-[#1F2328] px-4 py-2 text-sm font-medium text-white hover:bg-[#32383F] transition-colors"
          >
            글 읽기
          </Link>
          <Link
            to="/portfolio"
            className="rounded-md border border-[#D0D7DE] bg-[#F6F8FA] px-4 py-2 text-sm font-medium text-[#1F2328] hover:bg-[#EAEEF2] transition-colors"
          >
            포트폴리오 보기
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1F2328]">최근 글</h2>
        <div className="divide-y divide-[#D0D7DE] rounded-md border border-[#D0D7DE]">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F6F8FA] transition-colors"
            >
              <span className="text-sm text-[#1F2328]">{post.title}</span>
              <span className="text-xs text-[#636C76]">{post.date}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

const recentPosts = [
  { id: 1, title: 'FastAPI로 REST API 만들기', date: '2024.04.20' },
  { id: 2, title: 'React + Vite 프로젝트 세팅', date: '2024.04.15' },
  { id: 3, title: 'PostgreSQL 기본 사용법', date: '2024.04.10' },
]
