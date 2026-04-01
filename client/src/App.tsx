import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/loginPage'
import SchedulePage from './pages/schedulePage'
import { AuthGuard, GuestGuard } from './components/authGuard'
import SessionWarning from './components/sessionWarning'
import { AuthProvider, useAuth } from './lib/AuthContext'
import ForcedPasswordChange from './components/forcedPasswordChange'

function AppRoutes() {
  const { authenticated, mustChangePassword } = useAuth()
  if (authenticated && mustChangePassword) return null

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/schedule" replace />} />

      <Route path="/login" element={
        <GuestGuard>
          <LoginPage />
        </GuestGuard>
      } />
      <Route path="/schedule" element={
        <AuthGuard>
          <SchedulePage />
        </AuthGuard>
      } />

      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <SessionWarning />
      <ForcedPasswordChange />
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
