import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/loginPage'
import SchedulePage from './pages/schedulePage'

import { AuthGuard, GuestGuard } from './components/authGuard'
import SessionWarning from './components/sessionWarning'


function App() {
  return (
    <>
      <SessionWarning />
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
    </>
  )
}

export default App
