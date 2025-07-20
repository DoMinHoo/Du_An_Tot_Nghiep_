import { Route, Routes } from 'react-router-dom';
import MainLayout from './Components/Layout/MainLayout';
import Home from './Pages/Home';

import BannerSlider from './Pages/Banner';
import CartPage from './Pages/Cart/CartPage';
import CategoryPage from './Pages/CategoryPage';
import CheckoutPage from './Pages/CheckoutPage';
import Login from './Pages/Login/login';
import OrderHistoryPage from './Pages/OrderHistoryPage';
import ProductDetail from './Pages/ProductDetail';
import Register from './Pages/Register/register';
import SetUser from './SetUser';

import CheckPayment from './Pages/CheckPayment';

import AboutPage from './Pages/About';
import UserAccount from './Pages/account';
import ContactPage from './Pages/Contact';

import ReturnVnpayPage from './Pages/ReturnVnpayPage';
import SalePage from './Pages/Sale';
import ThankYouPage from './Pages/ThankYouPage';

import NewsDetailPage from './Pages/NewsDetailPage';
import NewsPage from './Pages/NewsPage';
import SearchPage from './Pages/SearchPage';
import ProductsPage from './Pages/ProductPage';





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
        <Route path="/search" element={<SearchPage />} />

        <Route path="/products" element={<ProductsPage />} />

        <Route path='/thank-you' element={<ThankYouPage />} />
        <Route path="/account" element={<UserAccount />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/sales" element={<SalePage />} />


        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />

      </Route>

      <Route path="/signin" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/set-user" element={<SetUser />} />
      <Route path="/vnpay/result" element={<ReturnVnpayPage />} />

    </Routes>
  );
}

export default App;
