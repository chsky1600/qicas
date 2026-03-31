import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "@/lib/AuthContext"

const WARNING_BEFORE_MS = 5 * 60 * 1000 // show modal 5 minutes before expiry

export default function SessionWarning() {
  const { exp, authenticated, logout, refreshSession } = useAuth()
  const [visible, setVisible] = useState(false)
  const [remaining, setRemaining] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const startCountdown = useCallback((expiresAtMs: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current)

    function update() {
      const left = Math.max(0, expiresAtMs - Date.now())
      const mins = Math.floor(left / 60000)
      const secs = Math.floor((left % 60000) / 1000)
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`)

      if (left <= 0) {
        logout()
      }
    }
    update()
    countdownRef.current = setInterval(update, 1000)
  }, [logout])

  // Schedule the warning modal whenever exp changes
  useEffect(() => {
    clearTimers()
    setVisible(false)

    if (!authenticated || !exp) return

    const expiresAtMs = exp * 1000
    const now = Date.now()
    const msUntilWarning = expiresAtMs - now - WARNING_BEFORE_MS

    if (msUntilWarning <= 0) {
      setVisible(true)
      startCountdown(expiresAtMs)
      return
    }

    timerRef.current = setTimeout(() => {
      setVisible(true)
      startCountdown(expiresAtMs)
    }, msUntilWarning)

    return clearTimers
  }, [exp, authenticated, clearTimers, startCountdown])

  async function handleExtend() {
    const ok = await refreshSession()
    if (ok) {
      clearTimers()
      setVisible(false)
      // New exp from context will trigger the useEffect to reschedule
    } else {
      logout()
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4 animate-[fadeSlide_0.3s_ease-out_both]">
        <h2 className="text-lg font-semibold text-foreground">Session Expiring</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your session will expire in{" "}
          <span className="font-semibold text-foreground">{remaining}</span>.
          <br />
          Would you like to stay signed in?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExtend}
            style={{
              flex: 1,
              backgroundColor: "#f3f4f6",
              color: "#1f2937",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              outline: "none",
              boxShadow: "none",
            }}
          >
            Stay signed in
          </button>
          <button
            onClick={logout}
            style={{
              flex: 1,
              backgroundColor: "#002452",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              outline: "none",
              boxShadow: "none",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
