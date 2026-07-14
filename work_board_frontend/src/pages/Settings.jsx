import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { uploadImage, updateProfile, changePassword, deleteAccount } from '../services/api'

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [editingNickname, setEditingNickname] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileSaving(true)
    setProfileMsg('')
    try {
      const res = await uploadImage(file, 'profiles')
      const url = res.data.url
      await updateProfile(user?.nickname ?? '', url)
      updateUser({ profile_image_url: url })
      setProfileMsg('프로필 사진이 변경되었습니다.')
    } catch {
      setProfileMsg('업로드에 실패했습니다.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleImageRemove() {
    setProfileSaving(true)
    setProfileMsg('')
    try {
      await updateProfile(user?.nickname ?? '', null)
      updateUser({ profile_image_url: null })
      setProfileMsg('프로필 사진이 제거되었습니다.')
    } catch {
      setProfileMsg('처리에 실패했습니다.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleNicknameSave() {
    if (!nickname.trim() || nickname === user?.nickname) {
      setEditingNickname(false)
      return
    }
    setProfileSaving(true)
    setProfileMsg('')
    try {
      await updateProfile(nickname.trim(), user?.profile_image_url ?? null)
      updateUser({ nickname: nickname.trim() })
      setEditingNickname(false)
      setProfileMsg('닉네임이 변경되었습니다.')
    } catch (err) {
      setProfileMsg(err.response?.data?.detail ?? '저장에 실패했습니다.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPw !== confirmPw) {
      setPwMsg('새 비밀번호가 일치하지 않습니다.')
      return
    }
    setPwSaving(true)
    setPwMsg('')
    try {
      await changePassword(currentPw, newPw)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPwMsg('비밀번호가 변경되었습니다.')
    } catch (err) {
      setPwMsg(err.response?.data?.detail ?? '변경에 실패했습니다.')
    } finally {
      setPwSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      navigate('/')
    } catch {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">설정</h1>

      {/* 프로필 사진 */}
      <section className="flex flex-col items-center pb-8 mb-8 border-b border-gray-200">
        <div className="relative mb-4">
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt="프로필"
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold"
              style={{ backgroundColor: `hsl(${(user?.nickname?.charCodeAt(0) ?? 0) * 37 % 360}, 60%, 50%)` }}
            >
              {user?.nickname?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={profileSaving}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mb-2"
        >
          이미지 업로드
        </button>
        {user?.profile_image_url && (
          <button
            onClick={handleImageRemove}
            disabled={profileSaving}
            className="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
          >
            이미지 제거
          </button>
        )}
        {profileMsg && <p className="mt-2 text-sm text-gray-500">{profileMsg}</p>}
      </section>

      {/* 닉네임 */}
      <section className="flex items-center justify-between py-5 border-b border-gray-200">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">닉네임</p>
          {editingNickname ? (
            <div className="flex items-center gap-2">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                className="border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                autoFocus
              />
              <button
                onClick={handleNicknameSave}
                disabled={profileSaving}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => { setNickname(user?.nickname ?? ''); setEditingNickname(false) }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                취소
              </button>
            </div>
          ) : (
            <p className="text-gray-900">{user?.nickname}</p>
          )}
        </div>
        {!editingNickname && (
          <button
            onClick={() => setEditingNickname(true)}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            수정
          </button>
        )}
      </section>

      {/* 이메일 */}
      <section className="flex items-center justify-between py-5 border-b border-gray-200">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">이메일</p>
          <p className="text-gray-900">{user?.email}</p>
        </div>
      </section>

      {/* 비밀번호 변경 */}
      <section className="py-5 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-500 mb-3">비밀번호 변경</p>
        <form onSubmit={handlePasswordChange} className="space-y-2 max-w-sm">
          <input
            type="password"
            placeholder="현재 비밀번호"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="password"
            placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {pwMsg && (
            <p className={`text-sm ${pwMsg.includes('되었습니다') ? 'text-green-600' : 'text-red-500'}`}>
              {pwMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pwSaving ? '변경 중...' : '변경'}
          </button>
        </form>
      </section>

      {/* 회원 탈퇴 */}
      <section className="py-5">
        <p className="text-sm font-medium text-gray-500 mb-1">회원 탈퇴</p>
        <p className="text-xs text-gray-400 mb-3">탈퇴 시 작성한 게시글과 댓글이 모두 삭제됩니다.</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
        >
          회원 탈퇴
        </button>
      </section>

      {/* 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-6">
              탈퇴 시 작성한 모든 게시글과 댓글이 삭제되며 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
