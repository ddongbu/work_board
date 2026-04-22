import { Link } from 'react-router-dom'

const posts = [
  { id: 1, title: 'FastAPI로 REST API 만들기', date: '2024.04.20', tags: ['Python', 'FastAPI'] },
  { id: 2, title: 'React + Vite 프로젝트 세팅', date: '2024.04.15', tags: ['React', 'Vite'] },
  { id: 3, title: 'PostgreSQL 기본 사용법', date: '2024.04.10', tags: ['DB', 'PostgreSQL'] },
  { id: 4, title: 'Docker Compose로 개발 환경 구성', date: '2024.04.01', tags: ['Docker'] },
]

export default function Posts() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-bold text-[#1F2328]">글목록</h1>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/posts/${post.id}`}
            className="flex items-center justify-between rounded-md border border-[#D0D7DE] bg-white px-5 py-4 hover:bg-[#F6F8FA] transition-colors"
          >
            <div>
              <p className="mb-1 text-sm font-medium text-[#1F2328]">{post.title}</p>
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#DDF4FF] px-2 py-0.5 text-xs font-medium text-[#0550AE]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <span className="shrink-0 text-xs text-[#636C76]">{post.date}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}
