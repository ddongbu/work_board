import { useEffect, useReducer, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const initialState = {
  title: '',
  content: '',
  thumbnailUrl: '',
  uploading: false,
  submitting: false,
  loading: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'setField':      return { ...state, [action.field]: action.value }
    case 'setUploading':  return { ...state, uploading: action.value }
    case 'setSubmitting': return { ...state, submitting: action.value }
    case 'setLoading':    return { ...state, loading: action.value }
    default:              return state
  }
}

// 업로드 전 클라이언트 사이드 이미지 압축 (최대 1200px, JPEG 80%)
async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })), 'image/jpeg', quality)
    }
    img.src = objectUrl
  })
}

export default function PostWrite() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const [state, dispatch] = useReducer(reducer, initialState)
  const { title, content, thumbnailUrl, uploading, submitting, loading } = state
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    dispatch({ type: 'setLoading', value: true })
    api.get(`/posts/${id}`)
      .then((res) => {
        dispatch({ type: 'setField', field: 'title', value: res.data.title })
        dispatch({ type: 'setField', field: 'content', value: res.data.content })
        dispatch({ type: 'setField', field: 'thumbnailUrl', value: res.data.thumbnail_url || '' })
      })
      .catch(() => navigate('/'))
      .finally(() => dispatch({ type: 'setLoading', value: false }))
  }, [id])

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 gap-4 px-4">
        <p className="text-gray-500">로그인이 필요합니다.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline text-sm">홈으로</button>
      </div>
    )
  }

  if (loading) return (
    <div className="flex justify-center pt-32">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // 이미지 파일을 S3에 업로드하고 커서 위치에 마크다운 삽입
  const insertImageFromFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    dispatch({ type: 'setUploading', value: true })
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const imageMarkdown = `\n![image](${res.data.url})\n`

      // textarea의 현재 커서 위치에 삽입
      const textarea = document.querySelector('.w-md-editor-text-input')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const current = textarea.value
        dispatch({ type: 'setField', field: 'content', value: current.slice(0, start) + imageMarkdown + current.slice(end) })
        // 삽입 후 커서를 이미지 마크다운 끝으로 이동
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length
          textarea.focus()
        }, 50)
      } else {
        dispatch({ type: 'setField', field: 'content', value: content + imageMarkdown })
      }
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      dispatch({ type: 'setUploading', value: false })
    }
  }

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    dispatch({ type: 'setUploading', value: true })
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      dispatch({ type: 'setField', field: 'thumbnailUrl', value: res.data.url })
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      dispatch({ type: 'setUploading', value: false })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    insertImageFromFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    // relatedTarget이 드롭존 내부이면 무시
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragging(false)
  }

  // 클립보드 이미지 붙여넣기 (Ctrl+V)
  const handlePaste = (e) => {
    const file = e.clipboardData?.files[0]
    if (file?.type.startsWith('image/')) {
      e.preventDefault()
      insertImageFromFile(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    dispatch({ type: 'setSubmitting', value: true })
    try {
      const payload = { title, content, thumbnail_url: thumbnailUrl || null, is_published: true }
      if (isEdit) {
        await api.put(`/posts/${id}`, payload)
        navigate(`/posts/${id}`)
      } else {
        const res = await api.post('/posts', payload)
        navigate(`/posts/${res.data.id}`)
      }
    } catch {
      alert(isEdit ? '수정에 실패했습니다. 다시 시도해주세요.' : '글 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      dispatch({ type: 'setSubmitting', value: false })
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 pt-10 pb-16">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => dispatch({ type: 'setField', field: 'title', value: e.target.value })}
          className="w-full text-2xl sm:text-3xl font-bold border-none outline-none placeholder-gray-300 py-4"
          required
        />
        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            {uploading ? '업로드 중...' : '썸네일 추가'}
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
          </label>
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="썸네일 미리보기" className="h-10 w-16 object-cover rounded" />
          )}
        </div>

        {/* 에디터 드롭존 */}
        <div
          data-color-mode="light"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onPaste={handlePaste}
          className={`relative rounded-lg transition-all ${isDragging ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-blue-50/80 border-2 border-dashed border-blue-400 pointer-events-none">
              <p className="text-blue-600 font-medium text-sm">이미지를 놓으면 본문에 삽입됩니다</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 pointer-events-none">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                업로드 중...
              </div>
            </div>
          )}
          <MDEditor
            value={content}
            onChange={(val) => dispatch({ type: 'setField', field: 'content', value: val ?? '' })}
            height={500}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate(isEdit ? `/posts/${id}` : '/')}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
            {submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정 완료' : '출간하기')}
          </button>
        </div>
      </form>
    </main>
  )
}
