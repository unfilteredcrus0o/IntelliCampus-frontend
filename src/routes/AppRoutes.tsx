import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../features/auth/pages/SignIn";
import SignUp from "../features/auth/pages/SignUp";
import NavTabs from "../componenets/layout/Navbar";
import HomePage from "../componenets/layout/HomePage";
import Roadmap from '../componenets/layout/Roadmap';
import RoadmapDetails from '../componenets/layout/RoadmapDetails';
import NotFound from '../components/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleDashboard from '../components/RoleDashboard';
import RoleProtectedRoute from '../components/RoleProtectedRoute';
import SuperAdminDashboard from '../DashBoard/SuperAdminDashboard';
import ManagerDashboard from '../DashBoard/ManagerDashboard';
import EmployeeDashboard from '../DashBoard/EmployeeDashboard';
import ProfileSettings from '../components/ProfileSettings';
import '../componenets/layout/Navbar.css';

function AppRoutes() {
  return (
    <div>
      <Router>
      <NavTabs />
      <div className="main-content-container">
        <Routes>
          <Route path="/" element={<HomePage/>} />
          <Route path="/login" element={<SignIn/>} />
          <Route path="/signup" element={<SignUp/>} />
          
          {/* Main dashboard route with role-based routing */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          } />
          
          {/* Role-specific dashboard routes */}
          <Route path="/dashboard/employee" element={
            <RoleProtectedRoute allowedRoles={['employee']}>
              <EmployeeDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/dashboard/manager" element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/dashboard/superadmin" element={
            <RoleProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </RoleProtectedRoute>
          } />
          
          {/* Learning routes - accessible to all authenticated users */}
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
          <Route path="/profile-settings" element={
            <ProtectedRoute>
              <ProfileSettings />
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
