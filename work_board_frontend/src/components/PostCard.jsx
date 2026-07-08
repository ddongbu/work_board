import { Link } from 'react-router-dom'

export default function PostCard({ post }) {
  const formattedDate = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Link
      to={`/posts/${post.id}`}
      className="flex flex-col overflow-hidden rounded-lg border border-[#D0D7DE] bg-white hover:border-[#0969DA] transition-colors"
    >
      {post.thumbnail_url ? (
        <img
          src={post.thumbnail_url}
          alt={post.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="h-40 w-full bg-[#F6F8FA]" />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-semibold text-[#1F2328] line-clamp-2 leading-snug">
          {post.title}
        </h3>
        {post.summary && (
          <p className="text-xs text-[#636C76] line-clamp-2 leading-relaxed">
            {post.summary}
          </p>
        )}
        <p className="mt-auto text-xs text-[#636C76]">{formattedDate}</p>
      </div>
    </Link>
  )
}
