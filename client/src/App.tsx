import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4">
        <h1 className="text-3xl font-bold text-center">Nội thất cao cấp</h1>
      </div>
    </>
  )
}

export default App
