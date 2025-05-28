import './App.css'
import { Route, Routes } from 'react-router-dom';
import CategoryManager from './pages/category';
import Dashboard from './pages/homeAdmin';
function App() {
  return (
    <>
    <Routes>
      <Route path='admin/cate' element={<CategoryManager/>}/>
      <Route path='admin' element={<Dashboard/>}/>
    </Routes>
    </>
  )
}

export default App
