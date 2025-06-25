import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'antd/dist/reset.css';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'moment/locale/vi'; // Sử dụng ngôn ngữ tiếng Việt cho moment

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
