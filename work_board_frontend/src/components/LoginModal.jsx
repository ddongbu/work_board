import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function GithubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [emailStatus, setEmailStatus] = useState(null)
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
        className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 왼쪽 패널 — 모바일에서 hidden */}
        <div className="hidden sm:flex w-2/5 bg-gray-100 flex-col items-center justify-center px-8 py-12 gap-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'login' ? '환영합니다!' : '함께해요!'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {mode === 'login'
                ? '로그인하고 다양한\n기술 글을 살펴보세요.'
                : '지금 가입하고\n여러분의 이야기를 남겨보세요.'}
            </p>
          </div>
        </div>

        {/* 오른쪽 패널 — 폼 */}
        <div className="flex-1 px-8 py-10 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h3>

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
              <p className="text-xs text-red-500 mt-1">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-md bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting
                ? mode === 'login' ? '로그인 중...' : '가입 중...'
                : mode === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          {/* 소셜 로그인 구분선 */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* 소셜 버튼 */}
          <div className="flex flex-col gap-2">
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <GithubIcon />
              GitHub으로 계속
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <GoogleIcon />
              Google로 계속
            </button>
            <button className="flex items-center justify-center gap-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <FacebookIcon />
              Facebook으로 계속
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
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
    </div>
  )
}
