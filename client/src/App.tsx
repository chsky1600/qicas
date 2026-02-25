import { Routes, Route, Navigate } from 'react-router-dom'
import AssignmentPage from './pages/assignmentPage'
import LoginPage from './pages/loginPage'

function App() {
  return (
    <Routes>
      {/* send home to your real page */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/schedule" element={<AssignmentPage />} />

      {/* optional: 404 */}
      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  )
}

export default App
