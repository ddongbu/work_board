import { Link } from 'react-router-dom'

function stripMarkdown(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/[*_`~>]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
}

export default function PostCard({ post }) {
  const authorLabel = post.author_nickname || 'unknown'
  const authorInitial = authorLabel[0].toUpperCase()

  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const preview = stripMarkdown(post.content ?? '').slice(0, 150)

  return (
    <Link
      to={`/posts/${post.id}`}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-200"
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="w-full aspect-video object-cover"
        />
      ) : (
        <div className="w-full aspect-video bg-gray-200" />
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1">
          {preview}
        </p>
        <p className="mt-4 text-xs text-gray-400">{formattedDate} · 댓글 0개</p>
      </div>

      <div className="border-t border-gray-100" />

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {authorInitial}
          </div>
          <span className="text-xs text-gray-600">
            by <span className="font-medium">{authorLabel}</span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          0
        </span>
      </div>
    </Link>
  )
}
