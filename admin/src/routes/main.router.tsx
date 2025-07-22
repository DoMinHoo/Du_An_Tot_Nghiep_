import {
  createBrowserRouter,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import MainLayout from '../components/Layout/mainLayoutAdmin';

import CategoryManager from '../pages/Categories/category';
import ReviewManager from '../pages/Comment&Review/reviewManager';
import LoginAdmin from '../pages/Login/loginAdmin';
import ListOrder from '../pages/Orders/listOrder';
import CreateProducts from '../pages/Products/createProducts';
import ListProduct from '../pages/Products/listProduct';
import UpdateProduct from '../pages/Products/updateProduct';
import RegisterAdmin from '../pages/Registers/registerAdmin';
import UserDetail from '../pages/Users/detailUser';
import ListUser from '../pages/Users/listUser';

import OrderDetail from '../pages/Orders/orderDetail';

import BannerList from '../pages/Banners/BannerList';
import CollectionPage from '../pages/Banners/CollectionPage';
import CreateBanner from '../pages/Banners/CreateBaner';
import EditBanner from '../pages/Banners/EditBanner';

import AddCategory from '../pages/Categories/addCategory';
import EditCategory from '../pages/Categories/editCategory';
import CreateProductVariationPage from '../pages/Products/ProductVariants/CreateVariantProduct';
import UpdateProductVariationPage from '../pages/Products/ProductVariants/EditVariantProduct';
import ProductVariationList from '../pages/Products/ProductVariants/ListVariantProduct';
import MaterialAdmin from '../pages/Materials/MaterialsAdmin';

import ListPromotion from '../pages/Promotions/listPromotion';
import UpdatePromotion from '../pages/Promotions/updatePromotion';
import CreatePromotion from '../pages/Promotions/createPromotion';
import Dashboard from '../pages/Dashboard/dashboard';
import RestoreVariationList from '../pages/Products/ProductVariants/RestoreVariationList';
import PostList from '../pages/Post/PostList';
import PostForm from '../pages/Post/PostForm';
import EditPost from '../pages/Post/EditPost';
import RestoreProduct from '../pages/Products/RestoreProduct';

const routes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      // <Authenticated fallback={<Navigate to="/signin" replace />}>
      <MainLayout>
        <Outlet />
      </MainLayout>
      // {/* </Authenticated> */}
    ),
    children: [
      {
        index: true,
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'products',
        children: [
          {
            index: true,
            element: <ListProduct />,
          },
          {
            path: 'create',
            element: <CreateProducts />,
          },
          {
            path: 'edit/:id',
            element: <UpdateProduct />,
          },
          {
            path: 'variants/:id',
            element: <ProductVariationList />,
          },
          {
            path: 'variants/:id/create',
            element: <CreateProductVariationPage />,
          },
          {
            path: 'variants/:id/edit/:variationId',
            element: <UpdateProductVariationPage />,
          },
          {
            path: 'variants/:id/deleted',
            element: <RestoreVariationList />,
          },
          {
            path: 'restore',
            element: <RestoreProduct />,
          },
        ],
      },
      {
        path: 'categories',
        children: [
          {
            index: true,
            element: <CategoryManager />,
          },
          {
            path: 'create',
            element: <AddCategory />,
          },
          {
            path: 'edit/:id',
            element: <EditCategory />,
          },
        ],
      },
      {
        path: 'comment&review',
        children: [
          {
            index: true,
            element: <ReviewManager />,
          },
          {
            path: 'create',
          },
        ],
      },
      {
        path: 'orders',
        children: [
          {
            index: true,
            element: <ListOrder />,
          },
          {
            path: ':id',
            element: <OrderDetail />,
          },
        ],
      },
      {
        path: 'users',
        children: [
          {
            index: true,
            element: <ListUser />,
          },
          {
            path: ':id',
            element: <UserDetail />,
          },
        ],
      },
      {
        path: 'promotions',
        children: [
          {
            index: true,
            element: <ListPromotion />,
          },
          {
            path: 'edit/:id',
            element: <UpdatePromotion />,
          },
          {
            path: 'create',
            element: <CreatePromotion />,
          },
        ],
      },
      {
        path: 'banners',
        children: [
          {
            index: true,
            element: <BannerList />,
          },
          {
            path: 'collections/:slug',
            element: <CollectionPage />,
          },
          {
            path: 'create',
            element: <CreateBanner />,
          },
          {
            path: 'edit/:id',
            element: <EditBanner />,
          },
        ],
      },
      {
        path: 'materials',
        children: [
          {
            index: true,
            element: <MaterialAdmin />,
          },
        ],
      },
      {
        path: 'posts',
        children: [
          {
            index: true,
            element: <PostList />,
          },
          {
            path: 'create',
            element: <PostForm />,
          },
          {
            path: 'edit/:id',
            element: <EditPost />,
          },
        ],
      },
    ],
  },
  {
    path: 'signin',
    element: <RegisterAdmin />,
  },
  {
    path: 'login',
    element: <LoginAdmin />,
  },
  {
    path: '*',
    element: <h1>404 Not Found</h1>,
  },
];
export const router = createBrowserRouter(routes);

export default routes;
