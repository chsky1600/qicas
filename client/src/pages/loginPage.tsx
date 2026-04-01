import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import { Button } from "@/components/ui/button"
import queensLogo from "@/assets/queens_logo_blue.png"
import deptArt from "@/assets/dept_of_french studies1.png"

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring focus-visible:shadow-md"

export default function LoginPage() {
  const navigate = useNavigate()
  const { setSessionDirect } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/french/icas/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Invalid credentials")
        return
      }

      const session = await res.json()
      setSessionDirect(session)
      navigate("/schedule", { replace: true })
    } catch {
      setError("Unable to reach server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#c5d1e3] via-[#e0e0e0] to-[#d4c9bc] px-4">
      {/* Square card */}
      <div
        className="flex rounded-xl shadow-lg animate-[fadeSlide_0.5s_ease-out_both] overflow-hidden"
        style={{ width: "min(90vw, 1000px)", height: "min(75vh, 560px)" }}
      >
        {/* Navy branding panel */}
        <div className="flex w-[35%] shrink-0 flex-col items-center justify-center gap-6 bg-[#002452] p-6 overflow-visible">
          <img
            src={queensLogo}
            alt="Queen's University"
            className="w-full max-w-[200px] object-contain scale-140 translate-y-4"
          />
          <img
            src={deptArt}
            alt="Department illustration"
            className="w-[260%] max-w-none object-contain opacity-90 translate-x-[25%]"
          />
        </div>

        {/* Login form panel */}
        <div className="relative flex flex-1 items-center justify-center p-8">
          {/* White gradient layer — above background/spillover, below frost card */}
          <div className="absolute inset-0 bg-gradient-to-bl from-white/90 via-white/50 to-transparent" />
          <div className="relative z-10 w-full max-w-sm space-y-6">
            {/* Header */}
            <div className="text-center space-y-1 animate-[fadeSlide_0.5s_ease-out_0.1s_both]">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                ICAS
              </h1>
              <p className="text-xs text-muted-foreground tracking-wide">
                Instructor-Course Assignment Scheduler
              </p>
            </div>

            {/* Form card */}
            <div
              className="rounded-xl bg-white/50 backdrop-blur-xl backdrop-saturate-150 backdrop-brightness-110 border border-white/40 p-5 shadow-lg space-y-5 animate-[fadeSlide_0.5s_ease-out_0.2s_both]"
              style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.08)" }}
            >
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground" style={{ textShadow: "0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,255,255,0.6)" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="you@queensu.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-medium text-foreground" style={{ textShadow: "0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,255,255,0.6)" }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass + " pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      style={{ background: "none", border: "none", padding: "4px", borderRadius: 0, boxShadow: "none" }}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive animate-[shake_0.3s_ease-in-out]" role="alert" style={{ textShadow: "0 0 12px rgba(255,255,255,1), 0 0 24px rgba(255,255,255,0.6)" }}>
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-10 transition-all duration-200 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm disabled:opacity-40 disabled:pointer-events-none"
                  style={{ borderColor: "transparent" }}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </div>

            <p className="text-center text-xs text-muted-foreground animate-[fadeSlide_0.5s_ease-out_0.35s_both]">
              Queen's University &middot; Department of French Studies
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
