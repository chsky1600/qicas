import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { HelpTooltip } from "@/components/ui/help-tooltip"

interface Props {
  open: boolean
  onClose: () => void
  name: string
  email: string
  onSave: (updates: {
    name: string
    email: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<void>
}

function PasswordField({
  label,
  value,
  placeholder,
  inputRef,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  inputRef?: { current: HTMLInputElement | null }
  onChange: (value: string) => void
}) {
  const [show, setShow] = useState(false)
  const moveCaretToEnd = (input: HTMLInputElement) => {
    const end = input.value.length
    requestAnimationFrame(() => input.setSelectionRange(end, end))
  }

  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-gray-800">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
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

export default function AccountDialog({
  open,
  onClose,
  name,
  email,
  onSave,
}: Props) {
  const [draftName, setDraftName] = useState(name)
  const [draftEmail, setDraftEmail] = useState(email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const currentPasswordRef = useRef<HTMLInputElement | null>(null)
  const newPasswordRef = useRef<HTMLInputElement | null>(null)

  function focusInputAtEnd(input: HTMLInputElement | null) {
    if (!input) return
    requestAnimationFrame(() => {
      input.focus()
      const end = input.value.length
      input.setSelectionRange(end, end)
    })
  }

  useEffect(() => {
    if (!open) return
    setDraftName(name)
    setDraftEmail(email)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordOpen(false)
    setPasswordError(null)
    setPasswordSuccess(null)
  }, [open, name, email])

  async function handleSave() {
    setPasswordError(null)
    setPasswordSuccess(null)
    if (!draftName.trim() || !draftEmail.trim()) {
      toast.warning("Name and email are required")
      return
    }

    const wantsPasswordChange =
      currentPassword !== "" ||
      newPassword !== "" ||
      confirmPassword !== ""

    if (wantsPasswordChange) {
      if (!currentPassword) {
        setPasswordOpen(true)
        setPasswordError("Current password is required")
        focusInputAtEnd(currentPasswordRef.current)
        return
      }
      if (!newPassword || newPassword.length < 8) {
        setPasswordOpen(true)
        setPasswordError("New password must be at least 8 characters")
        focusInputAtEnd(newPasswordRef.current)
        return
      }
      if (newPassword !== confirmPassword) {
        setPasswordOpen(true)
        setPasswordError("Password confirmation does not match")
        return
      }
    }

    setSaving(true)
    try {
      await onSave({
        name: draftName.trim(),
        email: draftEmail.trim(),
        currentPassword: wantsPasswordChange ? currentPassword : undefined,
        newPassword: wantsPasswordChange ? newPassword : undefined,
      })
      if (wantsPasswordChange) {
        setPasswordSuccess("Password updated successfully.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setPasswordOpen(false)
      } else {
        toast.success("Account updated")
        onClose()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Account update failed"
      if (wantsPasswordChange) {
        setPasswordError(message)
      } else {
        toast.error(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100vw-2rem)] max-w-[560px] flex-col p-0 gap-0 overflow-hidden rounded-lg"
      >
        <DialogDescription className="sr-only">
          Update your account details and change your password.
        </DialogDescription>
        <div className="flex h-12 items-center justify-between bg-black px-5 text-white">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">Account</DialogTitle>
            <HelpTooltip
              title="Account"
              description="Use this panel to update your own name, email, and password."
            />
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-white p-5">
          <div className="grid gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-gray-800">Name</span>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="Full name"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium text-gray-800">Email</span>
              <input
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
                placeholder="name@queensu.ca"
                type="email"
              />
            </label>

            <div className="mt-2 rounded border border-gray-200 p-4">
              <button
                type="button"
                onClick={() => setPasswordOpen((prev) => !prev)}
                className="flex w-full items-center justify-between text-left"
              >
                <h4 className="text-sm font-semibold text-gray-900">Change Password</h4>
                {passwordOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {passwordOpen && (
                <div className="mt-3 grid gap-4">
                  <PasswordField
                    label="Current Password"
                    value={currentPassword}
                    placeholder="Required to change password"
                    inputRef={currentPasswordRef}
                    onChange={(value) => {
                      setCurrentPassword(value)
                      setPasswordError(null)
                    }}
                  />
                  <PasswordField
                    label="New Password"
                    value={newPassword}
                    placeholder="At least 8 characters"
                    inputRef={newPasswordRef}
                    onChange={(value) => {
                      setNewPassword(value)
                      setPasswordError(null)
                    }}
                  />
                  <PasswordField
                    label="Confirm New Password"
                    value={confirmPassword}
                    placeholder="Re-enter new password"
                    onChange={(value) => {
                      setConfirmPassword(value)
                      setPasswordError(null)
                    }}
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
              )}
              {!passwordOpen && passwordError && (
                <p className="mt-3 text-sm text-red-600">{passwordError}</p>
              )}
              {!passwordOpen && passwordSuccess && (
                <p className="mt-3 text-sm text-green-600">{passwordSuccess}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setDraftName(name)
                setDraftEmail(email)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
                setPasswordError(null)
                setPasswordOpen(false)
              }}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
