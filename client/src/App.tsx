import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './Components/Layout/MainLayout';
import Home from './Pages/Home';

import ProductDetail from './Pages/ProductDetail';
import CategoryPage from './Pages/CategoryPage';
import Register from './Pages/Register/register';
import Login from './Pages/Login/login';
import SetUser from './SetUser';
import CartPage from './Pages/Cart/CartPage';
import CheckoutPage from './Pages/CheckoutPage';
import BannerSlider from './Pages/Banner';
import OrderHistoryPage from './Pages/OrderHistoryPage';

import CheckPayment from './Pages/CheckPayment';

import UserAccount from './Pages/account';
import ThankYouPage from './Pages/ThankYouPage';
import ReturnVnpayPage from './Pages/ReturnVnpayPage';
import ContactPage from './Pages/Contact';
import AboutPage from './Pages/About';




function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route
          index
          element={
            <>
              {' '}
              <BannerSlider /> <Home />{' '}
            </>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/categories/:slug"
          element={
            <>
              {' '}
              <BannerSlider /> <CategoryPage />{' '}
            </>
          }
        />
        <Route
          path="/categories"
          element={
            <>
              {' '}
              <BannerSlider /> <CategoryPage />{' '}
            </>
          }
        />

        <Route path="/checkout" element={<CheckoutPage />} />

        <Route path="/order-history" element={<OrderHistoryPage />} />
        <Route path="/check-payment" element={<CheckPayment />} />

        <Route path='/thank-you' element={<ThankYouPage />} />
        <Route path="/account" element={<UserAccount />} />
        <Route path="/contact" element={<ContactPage />} />

      </Route>
      <Route path="/signin" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/set-user" element={<SetUser />} />
      <Route path="/vnpay/result" element={<ReturnVnpayPage />} />

    </Routes>
  );
}

export default App;
