import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { registerAuthHooks } from "@/features/schedule/api"

interface Session {
  faculty_id: string
  role: "admin" | "support"
  exp: number // unix seconds
}

interface AuthContextValue {
  authenticated: boolean
  loading: boolean
  role: "admin" | "support" | null
  isAdmin: boolean
  exp: number | null
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  fetchSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// when less than this much time remains, the next API call triggers a silent refresh
const REFRESH_THRESHOLD_MS = 60 * 60 * 1000 // 60 min, halfway through the 2h token

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionRef = useRef<Session | null>(null)
  const refreshingRef = useRef(false)

  // keep ref in sync with state
  useEffect(() => { sessionRef.current = session }, [session])

  function updateSession(data: Session) {
    setSession(data)
    sessionRef.current = data
  }

  // register API hooks once on mount
  useEffect(() => {
    registerAuthHooks(
      // onActivity: silently refresh if past halfway
      () => {
        const s = sessionRef.current
        if (!s || refreshingRef.current) return
        const remaining = s.exp * 1000 - Date.now()
        if (remaining > REFRESH_THRESHOLD_MS) return

        refreshingRef.current = true
        fetch("/auth/refresh", { method: "POST", credentials: "same-origin" })
          .then(res => res.ok ? res.json() : null)
          .then(data => { if (data) updateSession(data) })
          .catch(() => {})
          .finally(() => { refreshingRef.current = false })
      },
      // on401: session expired, redirect to login
      () => {
        setSession(null)
        sessionRef.current = null
        window.location.href = "/login"
      },
    )
  }, [])

  // fetch session on mount
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const res = await fetch("/auth/me", { credentials: "same-origin", cache: "no-store" })
        if (res.ok && !cancelled) {
          const data: Session = await res.json()
          updateSession(data)
        }
      } catch {}
      if (!cancelled) setLoading(false)
    }

    init()
    return () => { cancelled = true }
  }, [])

  const logout = useCallback(async () => {
    try { await fetch("/auth/logout", { method: "POST", credentials: "same-origin" }) } catch {}
    setSession(null)
    sessionRef.current = null
    navigate("/login", { replace: true })
  }, [navigate])

  // manual refresh, called by SessionWarning "Stay signed in"
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/auth/refresh", { method: "POST", credentials: "same-origin" })
      if (res.ok) {
        const data: Session = await res.json()
        updateSession(data)
        return true
      }
    } catch {}
    return false
  }, [])

  // hydrate session from server, call after POST /auth login
  const fetchSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/auth/me", { credentials: "same-origin", cache: "no-store" })
      if (res.ok) {
        const data: Session = await res.json()
        updateSession(data)
        return true
      }
    } catch {}
    return false
  }, [])

  const value: AuthContextValue = {
    authenticated: session !== null,
    loading,
    role: session?.role ?? null,
    isAdmin: session?.role === "admin",
    exp: session?.exp ?? null,
    logout,
    refreshSession,
    fetchSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
