import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Register } from './pages/auth/Register';
import { Login } from './pages/auth/Login';
import { Verify2FA } from './pages/auth/Verify2FA';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ComposeMessage } from './pages/dashboard/ComposeMessage';
import { Inbox } from './pages/dashboard/Inbox';
import { Settings } from './pages/dashboard/Settings';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer theme="dark" position="top-right" />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Inbox />} />
          <Route path="compose" element={<ComposeMessage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;