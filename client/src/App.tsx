import React from "react";
import {
  Routes,
  Route
} from "react-router-dom";
import MainLayout from "./Components/Layout/MainLayout";
import Home from "./Pages/Home";
import About from "./Pages/About";

function App() {
  return (

    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>

  );
}

export default App;