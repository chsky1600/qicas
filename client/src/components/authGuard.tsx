import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

function hasToken(): boolean {
  return document.cookie.split(";").some(c => c.trim().startsWith("token="))
}

export function AuthGuard({ children }: { children: ReactNode }) {
  if (!hasToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export function GuestGuard({ children }: { children: ReactNode }) {
  if (hasToken()) {
    return <Navigate to="/schedule" replace />
  }
  return <>{children}</>
}
