import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../features/auth/pages/SignIn";
import SignUp from "../features/auth/pages/SignUp";
import NavTabs from "../componenets/layout/Navbar";
import HomePage from "../componenets/layout/HomePage";

function AppRoutes() {
  return (
    <div>
      <Router>
      <NavTabs />
      <div style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/login" element={<SignIn/>} />
          <Route path="/signup" element={<SignUp/>} />
        </Routes>
      </div>
    </Router>
    </div>
  )
}

export default AppRoutes
