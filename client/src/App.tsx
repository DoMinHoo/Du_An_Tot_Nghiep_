import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './Components/Layout/MainLayout';
import Home from './Pages/Home';
import About from './Pages/About';
import ProductDetail from './Pages/ProductDetail';
import CategoryPage from './Pages/CategoryPage';
import Register from './Pages/Register/register';
import Login from './Pages/Login/login';
import SetUser from './SetUser';
import CartPage from './Pages/cart';
import BannerSlider from './Pages/Banner';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<> <BannerSlider /> <Home /> </>} />
        <Route path="about" element={<About />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/categories/:slug" element={<> <BannerSlider /> <CategoryPage /> </>} />
        <Route path="/categories" element={<> <BannerSlider /> <CategoryPage /> </>} />

        {/* <Route path="/checkout" element={<CheckoutPage />} /> */}
      </Route>
      <Route path="/signin" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/set-user" element={<SetUser />} />
    </Routes>
  );
}

export default App;
