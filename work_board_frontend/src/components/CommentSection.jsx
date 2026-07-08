import { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function Avatar({ nickname }) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-400', 'bg-pink-500', 'bg-teal-500']
  const color = colors[nickname.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold shrink-0`}>
      {nickname[0].toUpperCase()}
    </div>
  )
}

function CommentItem({ comment, postId, onDeleted, currentNickname }) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const token = useAuthStore((s) => s.token)

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/posts/${postId}/comments`, { content: replyText, parent_id: comment.id })
      setReplyText('')
      setShowReplyForm(false)
      setShowReplies(true)
      onDeleted()
    } catch {
      alert('답글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${postId}/comments/${comment.id}`)
      onDeleted()
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <div className="flex gap-3">
        <Avatar nickname={comment.author_nickname} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{comment.author_nickname}</span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {currentNickname === comment.author_nickname && (
              <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400 ml-auto">삭제</button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>

          <div className="flex items-center gap-4 mt-2">
            {token && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <span>＋</span> 답글 달기
              </button>
            )}
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{showReplies ? '▲' : '＋'}</span> {comment.replies.length}개의 답글
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-3 flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 작성하세요"
                rows={2}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={submitReply}
                  disabled={submitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '...' : '작성'}
                </button>
                <button
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {showReplies && comment.replies?.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar nickname={reply.author_nickname} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">{reply.author_nickname}</span>
                      <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
                      {currentNickname === reply.author_nickname && (
                        <button
                          onClick={async () => {
                            if (!confirm('답글을 삭제하시겠습니까?')) return
                            try {
                              await api.delete(`/posts/${postId}/comments/${reply.id}`)
                              onDeleted()
                            } catch { alert('삭제에 실패했습니다.') }
                          }}
                          className="text-xs text-gray-300 hover:text-red-400 ml-auto"
                        >삭제</button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  const load = async () => {
    try {
      const { data } = await api.get(`/posts/${postId}/comments`)
      setComments(data)
    } catch { /* silent */ }
  }

  useEffect(() => { load() }, [postId])

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/posts/${postId}/comments`, { content: text })
      setText('')
      await load()
    } catch {
      alert('댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-lg font-bold text-gray-900 mb-6">{totalCount}개의 댓글</h2>

      {token ? (
        <div className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 작성하세요"
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-400 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={submit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '작성 중...' : '댓글 작성'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-8">로그인 후 댓글을 작성할 수 있습니다.</p>
      )}

      <div>
        {comments.length === 0
          ? <p className="text-sm text-gray-400 py-8 text-center">아직 댓글이 없습니다.</p>
          : comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={postId}
                onDeleted={load}
                currentNickname={user?.nickname}
              />
            ))
        }
      </div>
    </section>
  )
}
