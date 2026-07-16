import { useState, useEffect } from 'react'
import api, { updateComment } from '../services/api'
import { useAuthStore } from '../store/authStore'
import UserAvatar from './UserAvatar'

function formatDate(dateStr) {
  const date = new Date(dateStr + 'Z')
  const diff = Math.floor((Date.now() - date) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function useCommentEdit(commentId, postId, onSuccess) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const startEdit = (currentContent) => {
    setEditText(currentContent)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditText('')
  }

  const saveEdit = async () => {
    if (!editText.trim()) return
    setSubmitting(true)
    try {
      await updateComment(postId, commentId, editText)
      setIsEditing(false)
      onSuccess()
    } catch {
      alert('수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return { isEditing, editText, setEditText, submitting, startEdit, cancelEdit, saveEdit }
}

function CommentEditForm({ value, onChange, onSave, onCancel, submitting, rows = 3 }) {
  return (
    <div className="mt-1">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 resize-none"
      />
      <div className="flex gap-2 mt-1.5 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={submitting || !value.trim()}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '...' : '저장'}
        </button>
      </div>
    </div>
  )
}

function ReplyItem({ reply, postId, onRefresh, currentNickname }) {
  const { isEditing, editText, setEditText, submitting, startEdit, cancelEdit, saveEdit } =
    useCommentEdit(reply.id, postId, onRefresh)

  const handleDelete = async () => {
    if (!confirm('답글을 삭제하시겠습니까?')) return
    try {
      await api.delete(`/posts/${postId}/comments/${reply.id}`)
      onRefresh()
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="flex gap-3">
      <UserAvatar nickname={reply.author_nickname} className="w-9 h-9 text-sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-800">{reply.author_nickname}</span>
          <span className="text-xs text-gray-400">{formatDate(reply.created_at)}</span>
          {currentNickname === reply.author_nickname && (
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => startEdit(reply.content)} className="text-xs text-gray-300 hover:text-blue-400">수정</button>
              <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400">삭제</button>
            </div>
          )}
        </div>
        {isEditing ? (
          <CommentEditForm
            value={editText}
            onChange={setEditText}
            onSave={saveEdit}
            onCancel={cancelEdit}
            submitting={submitting}
            rows={2}
          />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, postId, onRefresh, currentNickname }) {
  const [showReplies, setShowReplies] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const token = useAuthStore((s) => s.token)
  const { isEditing, editText, setEditText, submitting: editSubmitting, startEdit, cancelEdit, saveEdit } =
    useCommentEdit(comment.id, postId, onRefresh)

  const submitReply = async () => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/posts/${postId}/comments`, { content: replyText, parent_id: comment.id })
      setReplyText('')
      setShowReplyForm(false)
      setShowReplies(true)
      onRefresh()
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
      onRefresh()
    } catch {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="py-5 border-b border-gray-100 last:border-0">
      <div className="flex gap-3">
        <UserAvatar nickname={comment.author_nickname} className="w-9 h-9 text-sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{comment.author_nickname}</span>
            <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
            {currentNickname === comment.author_nickname && (
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => startEdit(comment.content)} className="text-xs text-gray-300 hover:text-blue-400">수정</button>
                <button onClick={handleDelete} className="text-xs text-gray-300 hover:text-red-400">삭제</button>
              </div>
            )}
          </div>

          {isEditing ? (
            <CommentEditForm
              value={editText}
              onChange={setEditText}
              onSave={saveEdit}
              onCancel={cancelEdit}
              submitting={editSubmitting}
            />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          )}

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
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  postId={postId}
                  onRefresh={onRefresh}
                  currentNickname={currentNickname}
                />
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

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/posts/${postId}/comments`)
      setComments(data)
    } catch { /* silent */ }
  }

  useEffect(() => { loadComments() }, [postId])

  const submit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
      await api.post(`/posts/${postId}/comments`, { content: text })
      setText('')
      await loadComments()
    } catch {
      alert('댓글 작성에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-16">
      <h2 className="text-lg font-bold text-gray-900 mb-6">{comments.length}개의 댓글</h2>

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
              onRefresh={loadComments}
              currentNickname={user?.nickname}
            />
          ))
        }
      </div>
    </section>
  )
}
