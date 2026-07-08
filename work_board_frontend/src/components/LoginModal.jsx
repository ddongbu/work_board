import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function FieldStatus({ checking, available }) {
  if (checking) return <span className="text-xs text-gray-400">확인 중...</span>
  if (available === true) return <span className="text-xs text-blue-600">사용 가능합니다.</span>
  if (available === false) return <span className="text-xs text-red-500">이미 사용 중입니다.</span>
  return null
}

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [emailStatus, setEmailStatus] = useState({ checking: false, available: null })
  const [nicknameStatus, setNicknameStatus] = useState({ checking: false, available: null })
  const login = useAuthStore((s) => s.login)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    getValues,
  } = useForm({
    defaultValues: { email: '', password: '', nickname: '' },
    mode: 'onBlur',
  })

  function switchMode(next) {
    setMode(next)
    setEmailStatus({ checking: false, available: null })
    setNicknameStatus({ checking: false, available: null })
    reset()
  }

  async function checkEmail(val) {
    if (!val || !EMAIL_RE.test(val)) return
    setEmailStatus({ checking: true, available: null })
    try {
      const { data } = await api.get(`/auth/check-email?email=${encodeURIComponent(val)}`)
      setEmailStatus({ checking: false, available: data.available })
      return data.available || '이미 사용 중인 이메일입니다.'
    } catch {
      setEmailStatus({ checking: false, available: null })
    }
  }

  async function checkNickname(val) {
    if (!val || val.trim().length < 2) return
    setNicknameStatus({ checking: true, available: null })
    try {
      const { data } = await api.get(`/auth/check-nickname?nickname=${encodeURIComponent(val.trim())}`)
      setNicknameStatus({ checking: false, available: data.available })
      return data.available || '이미 사용 중인 별명입니다.'
    } catch {
      setNicknameStatus({ checking: false, available: null })
    }
  }

  async function onSubmit(values) {
    if (mode === 'signup') {
      if (emailStatus.available === false) return setError('email', { message: '이미 사용 중인 이메일입니다.' })
      if (nicknameStatus.available === false) return setError('nickname', { message: '이미 사용 중인 별명입니다.' })
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">

          {/* 이메일 */}
          <Controller
            name="email"
            control={control}
            rules={{
              required: '이메일을 입력해주세요.',
              pattern: { value: EMAIL_RE, message: '올바른 이메일 형식이 아닙니다.' },
              validate: mode === 'signup' ? checkEmail : undefined,
            }}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="email"
                  placeholder="이메일"
                  onChange={(e) => {
                    field.onChange(e)
                    setEmailStatus({ checking: false, available: null })
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${
                    errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                    : emailStatus.available ? 'border-blue-400 focus:border-blue-600 focus:ring-blue-300'
                    : 'border-gray-200 focus:border-blue-600 focus:ring-blue-500'
                  }`}
                />
                <div className="mt-1 min-h-[1rem]">
                  {errors.email
                    ? <p className="text-xs text-red-500">{errors.email.message}</p>
                    : mode === 'signup' && <FieldStatus {...emailStatus} />}
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
                minLength: { value: 2, message: '별명은 2자 이상이어야 합니다.' },
                maxLength: { value: 50, message: '50자 이하로 입력해주세요.' },
                validate: checkNickname,
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="text"
                    placeholder="별명 (2~50자)"
                    onChange={(e) => {
                      field.onChange(e)
                      setNicknameStatus({ checking: false, available: null })
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${
                      errors.nickname ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                      : nicknameStatus.available ? 'border-blue-400 focus:border-blue-600 focus:ring-blue-300'
                      : 'border-gray-200 focus:border-blue-600 focus:ring-blue-500'
                    }`}
                  />
                  <div className="mt-1 min-h-[1rem]">
                    {errors.nickname
                      ? <p className="text-xs text-red-500">{errors.nickname.message}</p>
                      : <FieldStatus {...nicknameStatus} />}
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
                minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                validate: (v) => {
                  if (!/[A-Za-z]/.test(v)) return '비밀번호에 영문자를 포함해주세요.'
                  if (!/[0-9]/.test(v)) return '비밀번호에 숫자를 포함해주세요.'
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
                  className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition focus:ring-1 ${
                    errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-300'
                    : 'border-gray-200 focus:border-blue-600 focus:ring-blue-500'
                  }`}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            )}
          />

          {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {isSubmitting
              ? mode === 'login' ? '로그인 중...' : '가입 중...'
              : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

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
  )
}
