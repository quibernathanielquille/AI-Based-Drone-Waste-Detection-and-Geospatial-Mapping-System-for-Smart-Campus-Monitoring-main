import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import PublicRoute from './pages/PublicRoute';
import Intro from './pages/Intro';
import About from './pages/About';
import RequireIntro from './pages/RequireIntro';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import WasteDetections from './pages/WasteDetections';
import MapPage from './pages/MapPage';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicRoute><Intro /></PublicRoute>} />
          <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
          <Route path="/login" element={<RequireIntro><Login /></RequireIntro>} />
          <Route path="/register" element={<RequireIntro><Register /></RequireIntro>} />
          <Route path="/forgot-password" element={<RequireIntro><ForgotPassword /></RequireIntro>} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="waste-detections" element={<WasteDetections />} />
            <Route path="map" element={<MapPage />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
