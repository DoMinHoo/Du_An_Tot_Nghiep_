import { createBrowserRouter, Navigate, Outlet, type RouteObject } from "react-router-dom";
import Authenticated from "../components/Layout/authenticate";
import MainLayout from "../components/Layout/mainLayoutAdmin";
import ListCategory from "../pages/Categories/listCategory";
import DashboardPage from "../pages/Dashboard/dashboard";
import LoginAdmin from "../pages/Login/loginAdmin";
import ListOrder from "../pages/Orders/listOrder";
import AddProductPage from "../pages/Products/createProducts";
import ListProduct from "../pages/Products/listProduct";
import EditProductPage from "../pages/Products/updateProduct";
import RegisterAdmin from "../pages/Registers/registerAdmin";
import ListUser from "../pages/Users/listUser";

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
            element:<AddProductPage/>
          },
          {
            path: "edit/:id",
            element:<EditProductPage/>
          }
        ]
      },
      {
        path: "categories",
        children: [
          {
            index: true,
            element: <ListCategory/>
          },
          {
            path: "create",
          }
        ]
      },
      {
        path: "orders",
        element: <ListOrder/>
      },
      {
        path: "users",
        element: <ListUser/>
      }
    ],
  },
  {
    path: "signin",
    element: <RegisterAdmin/>
  },
  {
    path: "login",
    element: <LoginAdmin/>
  },
  {
    path: "*",
    element: <h1>404 Not Found</h1>,
  },
];
export const router = createBrowserRouter(routes);

export default routes;
