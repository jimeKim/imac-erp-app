import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">ERP App</h1>
        <p className="mb-8 text-gray-600">Phase 0: 프로젝트 골격 완성</p>
        
        <button
          onClick={() => setCount((count) => count + 1)}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Count: {count}
        </button>
        
        <div className="mt-8 space-y-2 text-sm text-gray-500">
          <p>✅ Git 저장소 초기화</p>
          <p>✅ 폴더 구조 생성</p>
          <p>✅ TypeScript 설정 (strict mode)</p>
          <p>✅ Vite + React 부트스트랩</p>
        </div>
      </div>
    </div>
  )
}

export default App

