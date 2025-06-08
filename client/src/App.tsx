
import React from "react";
import {
  Routes,
  Route
} from "react-router-dom";
import MainLayout from "./Components/Layout/MainLayout";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Categories from "./Pages/CategoryPage";
import CategoryPage from "./Pages/CategoryPage";


import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './Components/Layout/MainLayout';
import Home from './Pages/Home';
import About from './Pages/About';
import ProductDetail from './Pages/ProductDetail';



function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />

        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/categories" element={<CategoryPage />} />

        <Route path="/products/:id" element={<ProductDetail />} />

      </Route>
    </Routes>
  );
}

export default App;
