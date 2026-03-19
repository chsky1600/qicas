import { Routes, Route, Navigate } from 'react-router-dom'
import AssignmentPage from './pages/assignmentPage'
import LoginPage from './pages/loginPage'
import SchedulePage from './pages/schedulePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const loggedIn = localStorage.getItem("loggedIn") === "true"
  return loggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      {/* send home to your real page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/assignments" element={<ProtectedRoute><AssignmentPage /></ProtectedRoute>} />

      {/* optional: 404 */}
      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  )
}

export default App
