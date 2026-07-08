import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import PostCard from '../components/PostCard'

const SIZE = 12

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const sentinelRef = useRef(null)
  const stateRef = useRef({ page: 1, loading: false, hasMore: true })

  const fetchNext = async () => {
    const { page, loading, hasMore } = stateRef.current
    if (loading || !hasMore) return

    stateRef.current.loading = true
    setLoading(true)

    try {
      const { data } = await api.get(`/posts?page=${page}&size=${SIZE}`)
      const items = data.items ?? []
      const newHasMore = page * SIZE < (data.total ?? 0)

      setPosts((prev) => (page === 1 ? items : [...prev, ...items]))
      setHasMore(newHasMore)

      stateRef.current.page = page + 1
      stateRef.current.hasMore = newHasMore
    } catch {
      setError('글을 불러오지 못했습니다.')
    } finally {
      stateRef.current.loading = false
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNext()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNext()
      },
      { threshold: 0.1 },
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="text-sm text-gray-400">아직 작성된 글이 없습니다.</p>
      )}
      {posts.length > 0 && (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
      {loading && (
        <p className="mt-6 text-center text-sm text-gray-400">불러오는 중...</p>
      )}
      <div ref={sentinelRef} className="h-1" />
    </main>
  )
}
