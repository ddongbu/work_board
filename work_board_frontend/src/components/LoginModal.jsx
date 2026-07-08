import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function LoginModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const login = useAuthStore((s) => s.login)

  const { control, handleSubmit, formState: { errors, isSubmitting }, setError, reset } = useForm({
    defaultValues: { email: '', password: '', nickname: '' },
  })

  function switchMode(next) {
    setMode(next)
    reset()
  }

  async function onSubmit(values) {
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = mode === 'signup'
        ? { email: values.email, password: values.password, nickname: values.nickname }
        : { email: values.email, password: values.password }
      const { data } = await api.post(endpoint, payload)
      const userInfo = mode === 'signup'
        ? { email: values.email, nickname: values.nickname }
        : await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } }).then(r => r.data)
      login(data.access_token, userInfo)
      onClose()
    } catch {
      setError('root', {
        message: mode === 'login'
          ? '아이디 또는 비밀번호가 올바르지 않습니다.'
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
          <Controller
            name="email"
            control={control}
            rules={{
              required: '이메일을 입력해주세요.',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아닙니다.' },
            }}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="email"
                  placeholder="이메일"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
            )}
          />
          {mode === 'signup' && (
            <Controller
              name="nickname"
              control={control}
              rules={{ required: '별명을 입력해주세요.', maxLength: { value: 50, message: '50자 이하로 입력해주세요.' } }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="text"
                    placeholder="별명"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  {errors.nickname && <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>}
                </div>
              )}
            />
          )}
          <Controller
            name="password"
            control={control}
            rules={{ required: '비밀번호를 입력해주세요.' }}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="password"
                  placeholder="비밀번호"
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
            )}
          />
          {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
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
              <button type="button" onClick={() => switchMode('signup')} className="text-green-500 hover:underline">
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{' '}
              <button type="button" onClick={() => switchMode('login')} className="text-green-500 hover:underline">
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
