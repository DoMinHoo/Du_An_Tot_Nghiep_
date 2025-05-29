import './App.css'
import { Route, Routes } from 'react-router-dom';
import CategoryManager from './pages/category';
import Dashboard from './pages/homeAdmin';
import CategoryTrash from './pages/categoryTrash';
import ReviewManager from './pages/reviewManager';
function App() {
  return (
    <>
    <Routes>
      <Route path='admin/cate' element={<CategoryManager/>}/>
      <Route path='admin' element={<Dashboard/>}/>
      <Route path='admin/categoryTrash' element={<CategoryTrash/>}/>
      <Route path='admin/review' element={<ReviewManager/>}/>
    </Routes>
    </>
  )
}

export default App
