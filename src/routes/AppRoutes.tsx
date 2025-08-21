import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../features/auth/pages/SignIn";
import SignUp from "../features/auth/pages/SignUp";
import NavTabs from "../componenets/layout/Navbar";
import HomePage from "../componenets/layout/HomePage";
import Roadmap from '../componenets/layout/Roadmap';
import RoadmapDetails from '../componenets/layout/RoadmapDetails';
import Dashboard from '../DashBoard/Dashboard';
import NotFound from '../components/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

function AppRoutes() {
  return (
    <div>
      <Router>
      <NavTabs />
      <div>
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/login" element={<SignIn/>} />
          <Route path="/signup" element={<SignUp/>} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/roadmap" element={
            <ProtectedRoute>
              <Roadmap />
            </ProtectedRoute>
          } />
          <Route path="/roadmap/:roadmapId" element={
            <ProtectedRoute>
              <RoadmapDetails />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
    </div>
  )
}

export default AppRoutes
