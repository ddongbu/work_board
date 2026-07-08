import { useEffect, useReducer, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import CommentSection from '../components/CommentSection'

const initialState = { status: 'loading', post: null }

function reducer(state, action) {
  switch (action.type) {
    case 'success': return { status: 'success', post: action.post }
    case 'error':   return { status: 'error', post: null }
    default:        return state
  }
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const [{ status, post }, dispatch] = useReducer(reducer, initialState)
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then((res) => dispatch({ type: 'success', post: res.data }))
      .catch(() => { dispatch({ type: 'error' }); navigate('/') })
  }, [id])

  useEffect(() => {
    api.get(`/posts/${id}/like`)
      .then((res) => { setLikeCount(res.data.count); setLiked(res.data.liked) })
      .catch(() => {})
  }, [id])

  const handleLike = async () => {
    if (!token) {
      alert('로그인 후 이용할 수 있습니다.')
      return
    }
    if (liking) return
    setLiking(true)
    try {
      const { data } = await api.post(`/posts/${id}/like`)
      setLikeCount(data.count)
      setLiked(data.liked)
    } catch {
      alert('잠시 후 다시 시도해주세요.')
    } finally {
      setLiking(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${id}`)
      navigate('/')
    } catch {
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (status === 'loading') return (
    <div className="flex justify-center pt-32">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  const isOwner = user && user.nickname === post.author_nickname

  return (
    <div className="flex justify-center gap-8 px-4 pt-12 pb-16">

      {/* 좋아요 사이드바 (데스크탑) */}
      <div className="hidden lg:block w-16 shrink-0">
        <div className="sticky top-32 flex flex-col items-center gap-2">
          <button
            onClick={handleLike}
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors ${
              liked
                ? 'border-red-400 text-red-500 bg-red-50'
                : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
            }`}
          >
            <HeartIcon filled={liked} />
          </button>
          <span className="text-sm font-medium text-gray-500">{likeCount}</span>
        </div>
      </div>

      {/* 본문 */}
      <main className="w-full max-w-3xl min-w-0">
        {post.thumbnail_url && (
          <img src={post.thumbnail_url} alt={post.title}
            className="w-full rounded-xl mb-8 object-cover max-h-96" />
        )}

        {/* 제목 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        {/* 메타 + 수정/삭제 */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{post.author_nickname}</span>
            <span className="mx-2">·</span>
            {new Date(post.created_at + 'Z').toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
          {isOwner && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <button
                onClick={() => navigate(`/posts/${id}/edit`)}
                className="hover:text-blue-600 transition-colors"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                className="hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 마크다운 본문 */}
        <article className="prose prose-blue max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>

        {/* 좋아요 (모바일 인라인) */}
        <div className="lg:hidden flex items-center gap-3 mt-10">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm transition-colors ${
              liked
                ? 'border-red-400 text-red-500 bg-red-50'
                : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
            }`}
          >
            <HeartIcon filled={liked} />
            <span>{likeCount}</span>
          </button>
        </div>

        {/* 댓글 */}
        <CommentSection postId={Number(id)} />
      </main>
    </div>
  )
}
