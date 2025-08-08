import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'


const queryClient = new QueryClient()


import { io } from 'socket.io-client';

const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
const userId = user?._id;

// Khởi tạo socket toàn cục
const socket = io('http://localhost:5000');
if (userId) {
  socket.emit('join-room', userId); // Tham gia room socket riêng
}
 
// Gắn socket vào window để dùng toàn cục
window.socket = socket;
createRoot(document.getElementById('root')!).render(

  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>


)
