import { Routes, Route, Navigate } from 'react-router-dom'
import AssignmentPage from './pages/assignmentPage'

function App() {
  return (
    <Routes>
      {/* send home to your real page */}
      <Route path="/" element={<Navigate to="/schedule" replace />} />

      <Route path="/login" element={<div>Login</div>} />
      <Route path="/schedule" element={<AssignmentPage />} />

      {/* optional: 404 */}
      <Route path="*" element={<div>Not found</div>} />
    </Routes>
  )
}

export default App
