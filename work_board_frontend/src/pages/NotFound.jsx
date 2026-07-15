import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <p className="text-8xl font-bold text-blue-600 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-gray-500 mb-8">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        홈으로 돌아가기
      </button>
    </div>
  )
}
