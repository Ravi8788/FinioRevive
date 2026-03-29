import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SocietiesPage from './pages/SocietiesPage';
import MembersPage from './pages/MembersPage';
import CallsPage from './pages/CallsPage';
import NoticesPage from './pages/NoticesPage';
import PaymentsPage from './pages/PaymentsPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={(
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<ProtectedRoute page="dashboard"><DashboardPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute page="users"><UsersPage /></ProtectedRoute>} />
        <Route path="/societies" element={<ProtectedRoute page="societies"><SocietiesPage /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute page="members"><MembersPage /></ProtectedRoute>} />
        <Route path="/calls" element={<ProtectedRoute page="calls"><CallsPage /></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute page="notices"><NoticesPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute page="payments"><PaymentsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
