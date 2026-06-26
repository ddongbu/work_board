import { useEffect, useState } from 'react'
import api from '../services/api'
import PostCard from '../components/PostCard'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/posts?page=1&size=12')
      .then(({ data }) => setPosts(data.items))
      .catch(() => setError('글을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <section className="mb-12">
        <h1 className="mb-3 text-4xl font-bold text-[#1F2328]">안녕하세요 👋</h1>
        <p className="text-lg leading-relaxed text-[#636C76]">
          개발하며 배운 것들을 기록하는 공간입니다.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#1F2328]">최근 글</h2>
        {loading && (
          <p className="text-sm text-[#636C76]">불러오는 중...</p>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && posts.length === 0 && (
          <p className="text-sm text-[#636C76]">아직 작성된 글이 없습니다.</p>
        )}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
