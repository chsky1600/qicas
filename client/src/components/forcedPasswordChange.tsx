import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import * as api from "@/features/schedule/api"

function PasswordField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  const [show, setShow] = useState(false)
  const moveCaretToEnd = (input: HTMLInputElement) => {
    const end = input.value.length
    requestAnimationFrame(() => input.setSelectionRange(end, end))
  }

  return (
    <label className="grid gap-1 text-sm text-left">
      <span className="font-medium text-gray-800">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            moveCaretToEnd(e.target)
          }}
          onMouseUp={(e) => {
            e.preventDefault()
            moveCaretToEnd(e.currentTarget)
          }}
          className="w-full rounded border border-gray-300 px-3 py-2 pr-10"
          placeholder={placeholder}
          type={show ? "text" : "password"}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  )
}

export default function ForcedPasswordChange() {
  const { authenticated, mustChangePassword, logout, name, setSessionDirect } = useAuth()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!authenticated || !mustChangePassword) return null

  async function handleSubmit() {
    setError(null)

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match")
      return
    }

    setSaving(true)
    try {
      const { session } = await api.changePassword(undefined, newPassword)
      setSessionDirect(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change password")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-900">Set a New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            {name ? `${name}, y` : "Y"}our account was given a temporary password. You must set a new password before continuing.
          </p>
        </div>

        <div className="grid gap-4">
          <PasswordField
            label="New Password"
            value={newPassword}
            placeholder="At least 8 characters"
            onChange={setNewPassword}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            placeholder="Re-enter new password"
            onChange={setConfirmPassword}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Set New Password"}
          </button>
          <button
            onClick={logout}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
