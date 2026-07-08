import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [emailStatus, setEmailStatus] = useState(null)   // null | 'checking' | 'ok' | 'taken'
  const [nicknameStatus, setNicknameStatus] = useState(null)
  const login = useAuthStore((s) => s.login)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    setError,
    clearErrors,
    reset,
  } = useForm({
    defaultValues: { email: '', password: '', nickname: '' },
    mode: 'onTouched',
  })

  function switchMode(next) {
    setMode(next)
    setEmailStatus(null)
    setNicknameStatus(null)
    reset()
  }

  async function handleEmailBlur(val, field) {
    field.onBlur()
    if (!val || !EMAIL_RE.test(val)) return
    setEmailStatus('checking')
    try {
      const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(val)}`)
      setEmailStatus(data.available ? 'ok' : 'taken')
      if (!data.available) setError('email', { message: '이미 사용 중인 이메일입니다.' })
      else clearErrors('email')
    } catch {
      setEmailStatus(null)
    }
  }

  async function handleNicknameBlur(val, field) {
    field.onBlur()
    const trimmed = val?.trim()
    if (!trimmed || trimmed.length < 2) return
    setNicknameStatus('checking')
    try {
      const { data } = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`)
      setNicknameStatus(data.available ? 'ok' : 'taken')
      if (!data.available) setError('nickname', { message: '이미 사용 중인 별명입니다.' })
      else clearErrors('nickname')
    } catch {
      setNicknameStatus(null)
    }
  }

  async function onSubmit(values) {
    if (mode === 'signup') {
      if (emailStatus === 'taken') return setError('email', { message: '이미 사용 중인 이메일입니다.' })
      if (nicknameStatus === 'taken') return setError('nickname', { message: '이미 사용 중인 별명입니다.' })
    }
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = mode === 'signup'
        ? { email: values.email, password: values.password, nickname: values.nickname.trim() }
        : { email: values.email, password: values.password }
      const { data } = await api.post(endpoint, payload)
      const userInfo = mode === 'signup'
        ? { email: values.email, nickname: values.nickname.trim() }
        : await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.data)
      login(data.access_token, userInfo)
      onClose()
    } catch (err) {
      const msg = err.response?.data?.detail
      setError('root', {
        message: typeof msg === 'string' ? msg
          : mode === 'login' ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '회원가입에 실패했습니다. 다시 시도해주세요.',
      })
    }
  }

  function fieldClass(name, status) {
    const hasError = touchedFields[name] && errors[name]
    const isOk = status === 'ok'
    if (hasError) return 'border-red-400 focus:border-red-400 focus:ring-red-200'
    if (isOk) return 'border-blue-400 focus:border-blue-500 focus:ring-blue-200'
    return 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
  }

  function StatusMsg({ name, status }) {
    if (status === 'checking') return <p className="text-xs text-gray-400">확인 중...</p>
    if (touchedFields[name] && errors[name]) return <p className="text-xs text-red-500">{errors[name].message}</p>
    if (status === 'ok') return <p className="text-xs text-blue-600">사용 가능합니다.</p>
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">

          {/* 이메일 */}
          <Controller
            name="email"
            control={control}
            rules={{
              required: '이메일을 입력해주세요.',
              pattern: { value: EMAIL_RE, message: '올바른 이메일 형식이 아닙니다.' },
            }}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="email"
                  placeholder="이메일"
                  onBlur={(e) =>
                    mode === 'signup'
                      ? handleEmailBlur(e.target.value, field)
                      : field.onBlur()
                  }
                  onChange={(e) => { field.onChange(e); setEmailStatus(null); clearErrors('email') }}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('email', emailStatus)}`}
                />
                <div className="mt-0.5 h-4">
                  <StatusMsg name="email" status={emailStatus} />
                </div>
              </div>
            )}
          />

          {/* 별명 (회원가입만) */}
          {mode === 'signup' && (
            <Controller
              name="nickname"
              control={control}
              rules={{
                required: '별명을 입력해주세요.',
                minLength: { value: 2, message: '2자 이상 입력해주세요.' },
                maxLength: { value: 50, message: '50자 이하로 입력해주세요.' },
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="text"
                    placeholder="별명 (2~50자)"
                    onBlur={(e) => handleNicknameBlur(e.target.value, field)}
                    onChange={(e) => { field.onChange(e); setNicknameStatus(null); clearErrors('nickname') }}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('nickname', nicknameStatus)}`}
                  />
                  <div className="mt-0.5 h-4">
                    <StatusMsg name="nickname" status={nicknameStatus} />
                  </div>
                </div>
              )}
            />
          )}

          {/* 비밀번호 */}
          <Controller
            name="password"
            control={control}
            rules={{
              required: '비밀번호를 입력해주세요.',
              ...(mode === 'signup' && {
                minLength: { value: 8, message: '8자 이상 입력해주세요.' },
                validate: (v) => {
                  if (!/[A-Za-z]/.test(v)) return '영문자를 포함해주세요.'
                  if (!/[0-9]/.test(v)) return '숫자를 포함해주세요.'
                  return true
                },
              }),
            }}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="password"
                  placeholder={mode === 'signup' ? '비밀번호 (8자 이상, 영문+숫자)' : '비밀번호'}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${fieldClass('password', null)}`}
                />
                <div className="mt-0.5 h-4">
                  {touchedFields.password && errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>
              </div>
            )}
          />

          {errors.root && (
            <p className="text-xs text-red-500">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting
              ? mode === 'login' ? '로그인 중...' : '가입 중...'
              : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <p className="mt-3 text-center text-xs text-gray-500">
          {mode === 'login' ? (
            <>
              아직 회원이 아니신가요?{' '}
              <button type="button" onClick={() => switchMode('signup')} className="text-blue-600 hover:underline">
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button type="button" onClick={() => switchMode('login')} className="text-blue-600 hover:underline">
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
