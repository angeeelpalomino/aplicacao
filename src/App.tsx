
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Panel from "./pages/index";
import Deliveries from "./pages/store_deliveries";
import React from "react";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Panel />} />
        <Route path="/deliveries" element={<Deliveries />} />
      </Routes>
    </Router>
  );
};

export default App;