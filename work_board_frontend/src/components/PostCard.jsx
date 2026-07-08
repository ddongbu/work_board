import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function PostCard({ post }) {
  const user = useAuthStore((s) => s.user)
  const authorLabel = user?.email ?? 'danny'

  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link
      to={`/posts/${post.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full aspect-video object-cover rounded-2xl"
        />
      ) : (
        <div className="w-full aspect-video bg-gray-100 rounded-2xl" />
      )}

      <div className="flex flex-1 flex-col px-1 pt-4 pb-2">
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
          {post.title}
        </h3>
        {post.summary && (
          <p className="text-sm text-[#636C76] line-clamp-2 leading-relaxed flex-1">
            {post.summary}
          </p>
        )}
        <p className="mt-4 text-xs text-gray-400">{formattedDate} · 댓글 0개</p>
      </div>

      <div className="border-t border-gray-100 mx-1 mt-1" />

      <div className="flex items-center justify-between px-1 py-3">
        <span className="text-xs text-gray-600">
          by <span className="font-medium">{authorLabel}</span>
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          0
        </span>
      </div>
    </Link>
  )
}
