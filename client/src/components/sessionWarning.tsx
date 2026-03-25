import { useEffect, useState, useRef, useCallback } from "react"

const WARNING_BEFORE_MS = 5 * 60 * 1000 // 5 minutes before expiry
const POLL_INTERVAL_MS = 3000 // check for token changes every 3s

function getTokenExpiry(): number | null {
  const match = document.cookie
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith("token="))
  if (!match) return null

  const token = match.split("=")[1]
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export default function SessionWarning() {
  const [visible, setVisible] = useState(false)
  const [remaining, setRemaining] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const trackedExpiryRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  const scheduleWarning = useCallback((expiry: number) => {
    clearTimers()
    setVisible(false)
    trackedExpiryRef.current = expiry

    const now = Date.now()
    const msUntilWarning = expiry - now - WARNING_BEFORE_MS

    if (msUntilWarning <= 0) {
      setVisible(true)
      startCountdown(expiry)
      return
    }

    timerRef.current = setTimeout(() => {
      setVisible(true)
      startCountdown(expiry)
    }, msUntilWarning)
  }, [clearTimers])

  function startCountdown(expiry: number) {
    function update() {
      const left = Math.max(0, expiry - Date.now())
      const mins = Math.floor(left / 60000)
      const secs = Math.floor((left % 60000) / 1000)
      setRemaining(`${mins}:${secs.toString().padStart(2, "0")}`)

      if (left <= 0) {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        window.location.href = "/login"
      }
    }
    update()
    countdownRef.current = setInterval(update, 1000)
  }

  // Poll for token changes so we detect login/refresh without a page reload
  useEffect(() => {
    const poll = setInterval(() => {
      const expiry = getTokenExpiry()
      if (expiry && expiry !== trackedExpiryRef.current) {
        scheduleWarning(expiry)
      }
      if (!expiry && trackedExpiryRef.current) {
        clearTimers()
        setVisible(false)
        trackedExpiryRef.current = null
      }
    }, POLL_INTERVAL_MS)

    // Check immediately on mount
    const expiry = getTokenExpiry()
    if (expiry) scheduleWarning(expiry)

    return () => {
      clearInterval(poll)
      clearTimers()
    }
  }, [scheduleWarning, clearTimers])

  async function handleExtend() {
    try {
      const res = await fetch("/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      })
      if (res.ok) {
        // Give the browser a tick to process the Set-Cookie header
        await new Promise(r => setTimeout(r, 100))
        clearTimers()
        setVisible(false)
        const expiry = getTokenExpiry()
        if (expiry) {
          scheduleWarning(expiry)
        }
        return
      }
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      window.location.href = "/login"
    } catch {
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      window.location.href = "/login"
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
            onClick={() => {
              document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
              window.location.href = "/login"
            }}
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
