
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Panel from "./pages/index";
import Deliveries from "./pages/store_deliveries";
import EditStore from "./pages/edit_store";
import React from "react";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Panel />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/edit-store" element={<EditStore />} />
      </Routes>
    </Router>
  );
};

export default App;