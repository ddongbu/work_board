import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then((res) => setPost(res.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${id}`)
      navigate('/')
    } catch {
      alert('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  if (loading) return (
    <div className="flex justify-center pt-32">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return null

  return (
    <main className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt={post.title}
          className="w-full rounded-xl mb-8 object-cover max-h-96" />
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
      <p className="text-sm text-gray-400 mb-10">
        {new Date(post.created_at).toLocaleDateString('ko-KR', {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </p>
      <article className="prose prose-green max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </article>
      {isLoggedIn && (
        <div className="mt-12 flex gap-3">
          <button onClick={handleDelete}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-500 text-sm hover:bg-red-50">
            삭제
          </button>
        </div>
      )}
    </main>
  )
}
