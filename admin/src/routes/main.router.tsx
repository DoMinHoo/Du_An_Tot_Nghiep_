import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router-dom";
import Authenticated from "../components/Layout/authenticate";
import MainLayout from "../components/Layout/mainLayoutAdmin";
import ListCategory from "../pages/Categories/listCategory";
import DashboardPage from "../pages/Dashboard/dashboard";

import CreateProducts from "../pages/Products/createProducts";
import ListProduct from "../pages/Products/listProduct";
import UpdateProduct from "../pages/Products/updateProduct";
import ListOrder from "../pages/Orders/listOrder";
import ListUser from "../pages/Users/listUser";
import RegisterAdmin from "../pages/Registers/registerAdmin";
import LoginAdmin from "../pages/Login/loginAdmin";
import ReviewManager from "../pages/Comment&Review/reviewManager";
import CategoryManager from "../pages/Categories/category";
import UserDetail from "../pages/Users/detailUser";

import OrderDetail from "../pages/Orders/orderDetail";
import ListVariant from "../pages/Products/ProductVariants/ListVariantProduct";
import CreateVariant from "../pages/Products/ProductVariants/CreateVariantProduct";
import EditVariant from "../pages/Products/ProductVariants/EditVariantProduct";




const routes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <Authenticated fallback={<Navigate to="/signin" replace />}>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </Authenticated>
    ),
    children: [
      {
        index: true,
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "products",
        children: [
          {
            index: true,
            element: <ListProduct />,
          },
          {
            path: "create",
            element: <CreateProducts />
          },
          {
            path: "edit/:id",
            element: <UpdateProduct />
          },
          {
            path: "variants/:id",
            element: <ListVariant />
          },
          {
            path: "variants/create",
            element: <CreateVariant />
          },
          {
            path: "variants/edit/:variantId",
            element: <EditVariant />
          }

        ]
      },
      {
        path: "categories",
        children: [
          {
            index: true,
            element: <CategoryManager />
          },
          {
            path: "create",
          }
        ]
      },
      {
        path: "comment&review",
        children: [
          {
            index: true,
            element: <ReviewManager />
          },
          {
            path: "create",
          }
        ]
      },
      {
        path: "orders",
        children: [
          {
            index: true,
            element: <ListOrder />
          },
          {
            path: ":id",
            element: <OrderDetail />
          }
        ]
      },
      {

        path: "users",
        children: [
          {
            index: true,
            element: <ListUser />
          },
          {
            path: ":id",
            element: <UserDetail/>
          }
        ]
      },
    ],
  },
  {
    path: "signin",
    element: <RegisterAdmin />
  },
  {
    path: "login",
    element: <LoginAdmin />
  },
  {
    path: "*",
    element: <h1>404 Not Found</h1>,
  },
];
export const router = createBrowserRouter(routes);

export default routes;
