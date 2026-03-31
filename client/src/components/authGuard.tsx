import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/lib/AuthContext"

export function AuthGuard({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (!authenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const { authenticated, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (authenticated) return <Navigate to="/schedule" replace />
  return <>{children}</>
}
