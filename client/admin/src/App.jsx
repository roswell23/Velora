import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppLayout from "./layouts/AppLayout.jsx";
import StaffLoginPage from "./features/auth/StaffLoginPage.jsx";
import DashboardOverview from "./features/admin/DashboardOverview.jsx";
import DepartmentDashboard from "./features/admin/DepartmentDashboard.jsx";
import { useAuth } from "./hooks/useAuth.jsx";

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <div>
        <span>VÉLORA · OPERATIONS</span>
        <p>403</p>
        <h1>This area is reserved for another team.</h1>
        <a href="/">Return to your workspace</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<StaffLoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected ERP layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleLanding />} />
            <Route
              path="dashboard/*"
              element={
                <ProtectedRoute allowedRoles={["ADMIN", "SALES", "INVENTORY", "FINANCE"]}>
                  <DashboardOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="sales/*"
              element={
                <ProtectedRoute allowedRoles={["SALES", "ADMIN"]}>
                  <DepartmentDashboard department="sales" />
                </ProtectedRoute>
              }
            />
            <Route
              path="inventory/*"
              element={
                <ProtectedRoute allowedRoles={["INVENTORY", "ADMIN"]}>
                  <DepartmentDashboard department="inventory" />
                </ProtectedRoute>
              }
            />
            <Route
              path="finance/*"
              element={
                <ProtectedRoute allowedRoles={["FINANCE", "ADMIN"]}>
                  <DepartmentDashboard department="finance" />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/*"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <DepartmentDashboard department="admin" />
                </ProtectedRoute>
              }
            />
            <Route
              path="catalog/*"
              element={
                <ProtectedRoute allowedRoles={["SALES", "INVENTORY", "FINANCE", "ADMIN"]}>
                  <DepartmentDashboard department="catalog" />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<RoleLanding />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
