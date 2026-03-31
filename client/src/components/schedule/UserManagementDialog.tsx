import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import type { User, UserRole } from "@/features/schedule/types"
import ConfirmDialog from "../ui/confirm-dialog"

interface Props {
  open: boolean
  onClose: () => void
  currentUserId: string | null
  users: User[]
  onCreateUser: (user: { name: string; email: string; password: string; role: UserRole }) => Promise<void>
  onUpdateUser: (userId: string, updates: { name?: string; email?: string; role?: UserRole }) => Promise<void>
  onUpdateOwnAccount: (updates: {
    name: string
    email: string
    currentPassword?: string
    newPassword?: string
  }) => Promise<void>
  onSetTemporaryPassword: (userId: string, password: string) => Promise<void>
  onDeleteUser: (userId: string) => Promise<void>
}

type Draft = {
  name: string
  email: string
  role: UserRole
  createPassword: string
  createConfirmPassword: string
  selfCurrentPassword: string
  selfNewPassword: string
  selfConfirmPassword: string
  tempPassword: string
  tempConfirmPassword: string
}

const EMPTY_USERS: User[] = []
const SELECTION_STORAGE_KEY = "user-management-selected-id"

const blankDraft = (): Draft => ({
  name: "",
  email: "",
  role: "support",
  createPassword: "",
  createConfirmPassword: "",
  selfCurrentPassword: "",
  selfNewPassword: "",
  selfConfirmPassword: "",
  tempPassword: "",
  tempConfirmPassword: "",
})

function draftFromUser(user: User): Draft {
  return {
    ...blankDraft(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
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

export default function UserManagementDialog({
  open,
  onClose,
  currentUserId,
  users,
  onCreateUser,
  onUpdateUser,
  onUpdateOwnAccount,
  onSetTemporaryPassword,
  onDeleteUser,
}: Props) {
  const safeUsers = Array.isArray(users) ? users : EMPTY_USERS
  const sortedUsers = useMemo(
    () => [...safeUsers].sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email)),
    [safeUsers]
  )

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return sessionStorage.getItem(SELECTION_STORAGE_KEY)
  })
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft>(blankDraft())
  const [createPasswordOpen, setCreatePasswordOpen] = useState(false)
  const [selfPasswordOpen, setSelfPasswordOpen] = useState(false)
  const [tempPasswordOpen, setTempPasswordOpen] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)
  const createPasswordInputRef = useRef<HTMLInputElement | null>(null)
  const selfCurrentPasswordRef = useRef<HTMLInputElement | null>(null)
  const selfNewPasswordRef = useRef<HTMLInputElement | null>(null)
  const tempPasswordRef = useRef<HTMLInputElement | null>(null)
  const demotionConfirmedRef = useRef(false)
  const deleteConfirmedRef = useRef(false)

  useEffect(() => {
    if (!open) return
    if (sortedUsers.length === 0) {
      setIsNew(true)
      setSelectedId(null)
      setDraft(blankDraft())
      return
    }
    if (isNew) return
    if (selectedId && sortedUsers.some((entry) => entry.id === selectedId)) return
    const storedId = typeof window !== "undefined"
      ? sessionStorage.getItem(SELECTION_STORAGE_KEY)
      : null
    if (storedId && sortedUsers.some((entry) => entry.id === storedId)) {
      setSelectedId(storedId)
      return
    }
    setSelectedId(sortedUsers[0]?.id ?? null)
  }, [open, sortedUsers, selectedId, isNew])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!selectedId || isNew) return
    sessionStorage.setItem(SELECTION_STORAGE_KEY, selectedId)
  }, [selectedId, isNew])

  useEffect(() => {
    if (isNew) return
    const user = sortedUsers.find((entry) => entry.id === selectedId)
    if (!user) return
    setDraft(draftFromUser(user))
  }, [selectedId, sortedUsers, isNew])

  useEffect(() => {
    if (!open) return
    setCreatePasswordOpen(false)
    setSelfPasswordOpen(false)
    setTempPasswordOpen(false)
    setPasswordError(null)
    setPasswordSuccess(null)
  }, [open, selectedId, isNew])

  const selectedUser = sortedUsers.find((entry) => entry.id === selectedId) ?? null
  const isSelfSelection = !isNew && selectedUser?.id === currentUserId
  const isDemotion = !isNew && selectedUser?.role === "admin" && draft.role === "support"
  const isSelfDemotion = isDemotion && isSelfSelection

  function focusInputAtEnd(input: HTMLInputElement | null) {
    if (!input) return
    requestAnimationFrame(() => {
      input.focus()
      const end = input.value.length
      input.setSelectionRange(end, end)
    })
  }

  function resetCurrentDraft() {
    if (isNew) {
      setDraft(blankDraft())
      return
    }
    if (selectedUser) {
      setDraft(draftFromUser(selectedUser))
    }
  }

  async function handleSave() {
    setPasswordError(null)
    setPasswordSuccess(null)
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.warning("Name and email are required")
      return
    }

    setSaving(true)
    try {
      if (isNew) {
        if (!draft.createPassword || draft.createPassword.length < 8) {
          setCreatePasswordOpen(true)
          setPasswordError("New users need a password with at least 8 characters")
          focusInputAtEnd(createPasswordInputRef.current)
          return
        }
        if (draft.createPassword !== draft.createConfirmPassword) {
          setCreatePasswordOpen(true)
          setPasswordError("Password confirmation does not match")
          return
        }
        await onCreateUser({
          name: draft.name.trim(),
          email: draft.email.trim(),
          password: draft.createPassword,
          role: draft.role,
        })
        toast.success("User created")
        setIsNew(false)
        setDraft(blankDraft())
        setCreatePasswordOpen(false)
        return
      }

      if (!selectedUser) return

      if (isDemotion && !demotionConfirmedRef.current) {
        setPendingConfirm({
          title: "Demote User",
          message: isSelfDemotion
            ? "Are you sure you want to demote yourself from admin to support? You will lose edit controls immediately after saving."
            : `Are you sure you want to demote ${selectedUser.name} from admin to support?`,
          onConfirm: () => {
            demotionConfirmedRef.current = true
            setPendingConfirm(null)
            handleSave()
          },
        })
        setSaving(false)
        return
      }
      demotionConfirmedRef.current = false

      if (isSelfSelection) {
        const wantsPasswordChange =
          draft.selfCurrentPassword !== "" ||
          draft.selfNewPassword !== "" ||
          draft.selfConfirmPassword !== ""

        if (wantsPasswordChange) {
          if (!draft.selfCurrentPassword) {
            setSelfPasswordOpen(true)
            setPasswordError("Current password is required")
            focusInputAtEnd(selfCurrentPasswordRef.current)
            return
          }
          if (!draft.selfNewPassword || draft.selfNewPassword.length < 8) {
            setSelfPasswordOpen(true)
            setPasswordError("New password must be at least 8 characters")
            focusInputAtEnd(selfNewPasswordRef.current)
            return
          }
          if (draft.selfNewPassword !== draft.selfConfirmPassword) {
            setSelfPasswordOpen(true)
            setPasswordError("Password confirmation does not match")
            return
          }
        }

        try {
          await onUpdateOwnAccount({
            name: draft.name.trim(),
            email: draft.email.trim(),
            currentPassword: wantsPasswordChange ? draft.selfCurrentPassword : undefined,
            newPassword: wantsPasswordChange ? draft.selfNewPassword : undefined,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Account update failed"
          if (wantsPasswordChange) {
            setPasswordError(message)
          }
          throw error
        }

        if (draft.role !== selectedUser.role) {
          await onUpdateUser(selectedUser.id, { role: draft.role })
        }

        if (wantsPasswordChange) {
          setPasswordSuccess("Password updated successfully.")
          setDraft((prev) => ({
            ...prev,
            selfCurrentPassword: "",
            selfNewPassword: "",
            selfConfirmPassword: "",
          }))
          setSelfPasswordOpen(false)
        } else {
          toast.success("Account updated")
        }
        if (isSelfDemotion) {
          window.location.reload()
        }
        return
      }

      const wantsTemporaryPassword =
        draft.tempPassword !== "" || draft.tempConfirmPassword !== ""

      if (wantsTemporaryPassword) {
        if (!draft.tempPassword || draft.tempPassword.length < 8) {
          setTempPasswordOpen(true)
          setPasswordError("Temporary password must be at least 8 characters")
          focusInputAtEnd(tempPasswordRef.current)
          return
        }
        if (draft.tempPassword !== draft.tempConfirmPassword) {
          setTempPasswordOpen(true)
          setPasswordError("Temporary password confirmation does not match")
          return
        }
      }

      await onUpdateUser(selectedUser.id, {
        name: draft.name.trim(),
        email: draft.email.trim(),
        role: draft.role,
      })

      if (wantsTemporaryPassword) {
        await onSetTemporaryPassword(selectedUser.id, draft.tempPassword)
        toast.success("User updated and temporary password set")
      } else {
        toast.success("User updated")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "User action failed"
      const attemptedSelfPasswordChange =
        isSelfSelection &&
        (draft.selfCurrentPassword !== "" ||
          draft.selfNewPassword !== "" ||
          draft.selfConfirmPassword !== "")
      const attemptedTempPassword =
        !isSelfSelection && !isNew &&
        (draft.tempPassword !== "" || draft.tempConfirmPassword !== "")

      if (attemptedSelfPasswordChange || attemptedTempPassword) {
        setPasswordError(message)
      } else {
        toast.error(message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return
    if (!deleteConfirmedRef.current) {
      setPendingConfirm({
        title: "Delete User",
        message: isSelfSelection
          ? `Delete your own account "${selectedUser.name}"? You will be signed out immediately.`
          : `Delete user "${selectedUser.name}"?`,
        onConfirm: () => {
          deleteConfirmedRef.current = true
          setPendingConfirm(null)
          handleDelete()
        },
      })
      return
    }
    deleteConfirmedRef.current = false

    setSaving(true)
    try {
      await onDeleteUser(selectedUser.id)
      toast.success("User removed")
      const remaining = sortedUsers.filter((entry) => entry.id !== selectedUser.id)
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id)
        setIsNew(false)
      } else {
        setSelectedId(null)
        setIsNew(true)
        setDraft(blankDraft())
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent
        id="users-dialog"
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (document.querySelector("#driver-popover-content")) e.preventDefault()
        }}
        className="flex w-[calc(100vw-2rem)] max-w-[980px] h-[calc(100vh-2rem)] max-h-[720px] flex-col p-0 gap-0 overflow-hidden rounded-lg"
      >
        <DialogDescription className="sr-only">
          Create users, update roles, and manage faculty access for the current department.
        </DialogDescription>
        <div id="users-dialog-header" className="flex h-12 items-center justify-between bg-black px-5 text-white">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">User Management</DialogTitle>
            <HelpTooltip
              title="User Management"
              description="Use this panel to create users, update roles, and manage faculty access. Admins can promote, demote, and remove users here, but each faculty must always retain at least one admin."
            />
          </div>
          <button id="users-dialog-close" onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
          <div className="border-b border-gray-300 bg-gray-100 p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Faculty Users</h3>
              <button
                onClick={() => {
                  setIsNew(true)
                  setSelectedId(null)
                  setDraft(blankDraft())
                }}
                className="rounded bg-black px-3 py-1 text-xs font-medium text-white hover:bg-gray-800"
              >
                New User
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 md:max-h-[600px]">
              {sortedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => { setSelectedId(user.id); setIsNew(false) }}
                  className={`w-full rounded border px-3 py-2 text-left transition-colors ${
                    !isNew && selectedId === user.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-gray-900">{user.name}</span>
                    <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      user.role === "admin" ? "bg-black text-white" : "bg-gray-200 text-gray-700"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto bg-white p-4 md:p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {isNew ? "Create User" : isSelfSelection ? "Edit Your Account" : "Edit User"}
              </h3>
            </div>

            <div className="grid max-w-xl gap-4">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="Full name"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Email</span>
                <input
                  value={draft.email}
                  onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                  className="rounded border border-gray-300 px-3 py-2"
                  placeholder="name@queensu.ca"
                  type="email"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span className="font-medium text-gray-800">Role</span>
                <select
                  value={draft.role}
                  onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                  className="rounded border border-gray-300 px-3 py-2"
                >
                  <option value="support">support</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              {isNew && (
                <div className="mt-2 rounded border border-gray-200 p-4">
                  <button
                    type="button"
                    onClick={() => setCreatePasswordOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h4 className="text-sm font-semibold text-gray-900">Set Initial Password</h4>
                    {createPasswordOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {createPasswordOpen && (
                    <div className="mt-3 grid gap-4">
                      <PasswordField
                        label="Password"
                        value={draft.createPassword}
                        placeholder="At least 8 characters"
                        inputRef={createPasswordInputRef}
                        onChange={(value) => {
                          setDraft((prev) => ({ ...prev, createPassword: value }))
                          setPasswordError(null)
                        }}
                      />
                      <PasswordField
                        label="Confirm Password"
                        value={draft.createConfirmPassword}
                        placeholder="Re-enter password"
                        onChange={(value) => {
                          setDraft((prev) => ({ ...prev, createConfirmPassword: value }))
                          setPasswordError(null)
                        }}
                      />
                      {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                      )}
                    </div>
                  )}
                  {!createPasswordOpen && passwordError && (
                    <p className="mt-3 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
              )}

              {isSelfSelection && !isNew && (
                <div className="mt-2 rounded border border-gray-200 p-4">
                  <button
                    type="button"
                    onClick={() => setSelfPasswordOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h4 className="text-sm font-semibold text-gray-900">Change Password</h4>
                    {selfPasswordOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {selfPasswordOpen && (
                    <div className="mt-3 grid gap-4">
                      <PasswordField
                        label="Current Password"
                        value={draft.selfCurrentPassword}
                        placeholder="Required to change password"
                        inputRef={selfCurrentPasswordRef}
                        onChange={(value) => {
                          setDraft((prev) => ({ ...prev, selfCurrentPassword: value }))
                          setPasswordError(null)
                        }}
                      />
                      <PasswordField
                        label="New Password"
                        value={draft.selfNewPassword}
                        placeholder="At least 8 characters"
                        inputRef={selfNewPasswordRef}
                        onChange={(value) => {
                          setDraft((prev) => ({ ...prev, selfNewPassword: value }))
                          setPasswordError(null)
                        }}
                      />
                      <PasswordField
                        label="Confirm New Password"
                        value={draft.selfConfirmPassword}
                        placeholder="Re-enter new password"
                        onChange={(value) => {
                          setDraft((prev) => ({ ...prev, selfConfirmPassword: value }))
                          setPasswordError(null)
                        }}
                      />
                      {passwordError && (
                        <p className="text-sm text-red-600">{passwordError}</p>
                      )}
                    </div>
                  )}
                  {!selfPasswordOpen && passwordError && (
                    <p className="mt-3 text-sm text-red-600">{passwordError}</p>
                  )}
                  {!selfPasswordOpen && passwordSuccess && (
                    <p className="mt-3 text-sm text-green-600">{passwordSuccess}</p>
                  )}
                </div>
              )}

              {!isSelfSelection && !isNew && selectedUser && (
                <div className="mt-2 rounded border border-gray-200 p-4">
                  <button
                    type="button"
                    onClick={() => setTempPasswordOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <h4 className="text-sm font-semibold text-gray-900">Set Temporary Password</h4>
                    {tempPasswordOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {tempPasswordOpen && (
                    <>
                      <p className="mt-3 text-sm text-gray-600">
                        Setting a temporary password immediately replaces the user&apos;s current password and requires them to choose a new one after sign-in.
                      </p>
                      <div className="mt-3 grid gap-4">
                        <PasswordField
                          label="Temporary Password"
                          value={draft.tempPassword}
                          placeholder="At least 8 characters"
                          inputRef={tempPasswordRef}
                          onChange={(value) => {
                            setDraft((prev) => ({ ...prev, tempPassword: value }))
                            setPasswordError(null)
                          }}
                        />
                        <PasswordField
                          label="Confirm Temporary Password"
                          value={draft.tempConfirmPassword}
                          placeholder="Re-enter temporary password"
                          onChange={(value) => {
                            setDraft((prev) => ({ ...prev, tempConfirmPassword: value }))
                            setPasswordError(null)
                          }}
                        />
                        {passwordError && (
                          <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                      </div>
                    </>
                  )}
                  {!tempPasswordOpen && passwordError && (
                    <p className="mt-3 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : isNew ? "Create User" : "Save Changes"}
              </button>

              {!isNew && selectedUser && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSelfSelection ? "Delete Account" : "Delete User"}
                </button>
              )}

              <button
                onClick={resetCurrentDraft}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>

            {isDemotion && (
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                {isSelfDemotion
                  ? "You are about to demote yourself from admin to support. If you save this change, your admin editing controls will disappear immediately."
                  : `${selectedUser?.name} is about to be demoted from admin to support. This change removes their editing access.`}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      {pendingConfirm && (
        <ConfirmDialog
          open={true}
          title={pendingConfirm.title}
          message={pendingConfirm.message}
          confirmLabel="Confirm"
          onConfirm={pendingConfirm.onConfirm}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </Dialog>
  )
}
