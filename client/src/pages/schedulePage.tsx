import { useEffect, useState, useRef } from "react"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core"
import { useSchedule } from "@/features/schedule/useSchedule"
import * as api from "@/features/schedule/api"
import { useTutorial } from "@/features/schedule/useTutorial"
import type { SectionDragData, InstructorDropData, PanelDropData, Term } from "@/features/schedule/types"
import { useAuth } from "@/lib/AuthContext"
import Toolbar from "@/components/schedule/Toolbar"
import CoursesPanel from "@/components/schedule/CoursesPanel"
import ScheduleTable from "@/components/schedule/ScheduleTable"
import PropertiesDialog from "@/components/schedule/PropertiesDialog"
import SavedSchedulesDialog from "@/components/schedule/SavedSchedulesDialog"
import MigrationDialog from "@/components/schedule/MigrationDialog"
import UserManagementDialog from "@/components/schedule/UserManagementDialog"
import AccountDialog from "@/components/schedule/AccountDialog"
import { Toaster } from "@/components/ui/sonner"

export default function SchedulePage() {
  const { isAdmin: admin, role, logout, fetchSession, userId, name: userName, email: userEmail } = useAuth()
  const {
    years, yearId, courses, courseRules,
    instructors, instructorRules, users,
    schedules, schedule, assignments, violations,
    saving, loading, error,
    assign, unassign, undo, redo,
    createInstructor, updateInstructor, addNote, dropInstructor, updateInstructorRule,
    createCourse, updateCourse, dropCourse, updateCourseRule,
    createUserAccount, updateUserAccount, setTemporaryPassword, deleteUserAccount,
    addSchedule, copySchedule, deleteSavedSchedule, switchSchedule, renameSchedule,
    changeYear, migrateYear,
    exportCSV, refresh,
    creditsPerCourse,
    validationMode, setValidationMode, validateNow, validationStale
  } = useSchedule()

  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [snapshotsOpen, setSnapshotsOpen] = useState(false)
  const [migrationOpen, setMigrationOpen] = useState(false)
  const [tutorialActive, setTutorialActive] = useState(false)
  const [usersOpen, setUsersOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [dragging, setDragging] = useState<SectionDragData | null>(null)
  const [overValid, setOverValid] = useState(false)
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null)
  const [propertiesMode, setPropertiesMode] = useState<"instructors" | "courses">("instructors")
  const [propertiesAdd, setPropertiesAdd] = useState(false) // flag to tell properties tab to make a new course/instructor on open
  const shiftHeldRef = useRef(false)
  const [previewTarget, setPreviewTarget] = useState<{ instructorId: string; term: Term } | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { shiftHeldRef.current = e.shiftKey }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [])

  const { startTutorial } = useTutorial({
    role,
    onOpenProperties: () => { setPropertiesMode("instructors"); setPropertiesOpen(true) },
    onCloseProperties: () => setPropertiesOpen(false),
    onOpenSnapshots: () => setSnapshotsOpen(true),
    onCloseSnapshots: () => setSnapshotsOpen(false),
    onOpenUsers: () => setUsersOpen(true),
    onCloseUsers: () => setUsersOpen(false),
    onOpenMigration: () => setMigrationOpen(true),
    onCloseMigration: () => setMigrationOpen(false),
    onTutorialStart: () => setTutorialActive(true),
    onTutorialEnd: () => setTutorialActive(false),
  })

  const tutorialStarted = useRef(false)
  useEffect(() => {
    if (!tutorialStarted.current && !localStorage.getItem("tutorialSeen")) {
      tutorialStarted.current = true
      startTutorial()
    }
  }, [startTutorial])

  useEffect(() => {
    if (!admin) setUsersOpen(false)
  }, [admin])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])


  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(e: DragStartEvent) {
    setDragging(e.active.data.current as SectionDragData)
  }

  function handleDragOver(e: DragOverEvent) {
    const overData = e.over?.data.current as { type?: string; instructorId?: string; term?: Term } | undefined
    const isInstructor = overData?.type === "instructor"
    if (isInstructor && shiftHeldRef.current && validationMode === "auto") {
      setOverValid(false)
      setPreviewTarget({ instructorId: overData.instructorId!, term: overData.term! })
    } else {
      setOverValid(isInstructor)
      setPreviewTarget(null)
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const wasShift = shiftHeldRef.current
    setDragging(null)
    setOverValid(false)
    setPreviewTarget(null)
    if (wasShift) return

    const drag = e.active.data.current as SectionDragData
    if (!e.over) return
    const over = e.over.data.current as InstructorDropData | PanelDropData
    if (over.type === "panel" && drag.assignmentId) { unassign(drag.assignmentId); return }
    if (over.type !== "instructor") return
    const isFullYear = courseRules.find(r => r.course_code === drag.courseCode)?.is_full_year ?? false
    if (isFullYear && drag.source === "chip" && drag.prevTerm !== over.term) {
      const targetAssignment = assignments.find(a => a.course_code === drag.courseCode && a.term === over.term)
      if (targetAssignment) {
        assign(targetAssignment.section_id, drag.courseCode, over.instructorId, over.term, targetAssignment.id)
      } else {
        assign(drag.sectionId, drag.courseCode, over.instructorId, over.term, drag.assignmentId)
      }
      return
    }
    assign(drag.sectionId, drag.courseCode, over.instructorId, over.term, drag.assignmentId)
  }


  const draggingCourse = dragging ? courses.find(c => c.code === dragging.courseCode) : null
  const draggingSection = draggingCourse?.sections.find(s => s.id === dragging?.sectionId)
  const draggingRule = dragging ? courseRules.find(r => r.course_code === dragging.courseCode) : null
  const draggingViolation = dragging ? (() => {
    const vs = violations.filter(v => v.type === "Course" && v.offending_id === dragging.courseCode && (v.id.includes(dragging.sectionId) || v.code === "FULLYEAR_HALF_OPEN" || v.code === "CROSS_TERM_DUPLICATE"))
    if (vs.some(v => v.degree === "Error")) return "bg-red-400"
    if (vs.some(v => v.degree === "Warning")) return "bg-orange-400"
    if (vs.some(v => v.degree === "Info")) return "bg-blue-400"
    return "bg-green-500"
  })() : "bg-gray-400"

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>

  return (
    <div className="flex flex-col h-screen">
      <Toaster position="top-center" />
      <Toolbar
        years={years}
        yearId={yearId}
        schedule={schedule}
        saving={saving}
        role={role}
        userName={userName}
        onChangeYear={changeYear}
        onOpenProperties={() => { setPropertiesMode("instructors"); setPropertiesOpen(true) }}
        onOpenUsers={() => setUsersOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenSnapshots={() => setSnapshotsOpen(true)}
        onExportCSV={exportCSV}
        onStartTutorial={startTutorial}
        onOpenMigration={() => setMigrationOpen(true)}
        onLogout={logout}
        isAdmin={admin}
        validationMode={validationMode}
        setValidationMode={setValidationMode}
        validateNow={validateNow}
        validationStale={validationStale}
      />

      {admin ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 overflow-hidden">
            <CoursesPanel
              courses={courses}
              courseRules={courseRules}
              assignments={assignments}
              onAddCourse={() => { setPropertiesMode("courses"); setPropertiesAdd(true); setPropertiesOpen(true) }}
              isAdmin={admin}
              highlightedSectionId={highlightedSectionId}
              onHighlight={setHighlightedSectionId}
            />
            <ScheduleTable
              instructors={instructors}
              instructorRules={instructorRules}
              courses={courses}
              courseRules={courseRules}
              assignments={assignments}
              violations={violations}
              onAddInstructor={() => { setPropertiesMode("instructors"); setPropertiesAdd(true); setPropertiesOpen(true) }}
              isAdmin={admin}
              highlightedSectionId={highlightedSectionId}
              onHighlight={setHighlightedSectionId}
              onAddNote={addNote}
              userName={userName}
              previewTarget={previewTarget}
              dragging={dragging}
            />
          </div>
          <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
            {dragging && draggingSection ? (
              <span className={`${dragging.source === "chip" ? draggingViolation : overValid ? "bg-green-500" : "bg-gray-400"} text-white px-2 py-1 rounded text-sm cursor-grab select-none ${draggingRule?.is_external ? "outline-dashed outline-2 outline-offset-1 outline-blue-500" : ""}`}>
                {dragging.courseCode}{draggingRule?.is_full_year ? (dragging.prevTerm === "Fall" ? "A" : "B") : ""}-{draggingSection.number}
              </span>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <CoursesPanel
            courses={courses}
            courseRules={courseRules}
            assignments={assignments}
            onAddCourse={() => { setPropertiesMode("courses"); setPropertiesOpen(true) }}
            isAdmin={admin}
            highlightedSectionId={highlightedSectionId}
            onHighlight={setHighlightedSectionId}
          />
          <ScheduleTable
            instructors={instructors}
            instructorRules={instructorRules}
            courses={courses}
            courseRules={courseRules}
            assignments={assignments}
            violations={violations}
            onAddInstructor={() => { setPropertiesMode("instructors"); setPropertiesOpen(true) }}
            isAdmin={admin}
            highlightedSectionId={highlightedSectionId}
            onHighlight={setHighlightedSectionId}
            onAddNote={addNote}
            userName={userName}
            previewTarget={previewTarget}
            dragging={dragging}
          />
        </div>
      )}

      <PropertiesDialog
        open={propertiesOpen}
        defaultMode={propertiesMode}
        contextAdd={propertiesAdd}
        onClose={() => {setPropertiesOpen(false); setPropertiesAdd(false)}}
        instructors={instructors}
        instructorRules={instructorRules}
        courses={courses}
        courseRules={courseRules}
        assignments={assignments}
        onCreateInstructor={createInstructor}
        onUpdateInstructor={updateInstructor}
        onDropInstructor={dropInstructor}
        onUpdateInstructorRule={updateInstructorRule}
        onCreateCourse={createCourse}
        onUpdateCourse={updateCourse}
        onDropCourse={dropCourse}
        onUpdateCourseRule={updateCourseRule}
        creditsPerCourse={creditsPerCourse}
        userName={userName ?? "Unknown"}
      />

      <SavedSchedulesDialog
        open={snapshotsOpen}
        onClose={() => setSnapshotsOpen(false)}
        activeSchedule={schedule}
        schedules={schedules}
        courses={courses}
        courseRules={courseRules}
        onAddSchedule={addSchedule}
        onCopySchedule={copySchedule}
        onDeleteSavedSchedule={deleteSavedSchedule}
        onSwitchSchedule={switchSchedule}
        onRenameSchedule={renameSchedule}
        isAdmin={admin}
      />

      <MigrationDialog
        open={migrationOpen}
        onClose={() => setMigrationOpen(false)}        
        loadedYearId={yearId}
        years={years}        
        activeSchedule={schedule}
        schedules={schedules}
        onMigrateYear={migrateYear}
        onOpenProperties={() => {setPropertiesMode("instructors"); setPropertiesOpen(true) }}
        skipYearCheck={tutorialActive}
      />

      <UserManagementDialog
        open={usersOpen}
        onClose={() => setUsersOpen(false)}
        currentUserId={userId}
        users={users}
        onCreateUser={createUserAccount}
        onUpdateOwnAccount={async ({ name, email, currentPassword, newPassword }) => {
          const changedPassword = Boolean(newPassword)
          const currentUser = users.find((u) => u.id === userId)
          const profileChanged =
            name !== (currentUser?.name ?? userName ?? "") ||
            email !== (currentUser?.email ?? userEmail ?? "")
          await api.updateAccount({ name, email })
          if (changedPassword) {
            await api.changePassword(currentPassword, newPassword!)
          }
          const ok = await fetchSession()
          if (!ok) await logout()
          if (profileChanged) {
            await refresh()
          }
        }}
        onUpdateUser={async (userId, updates) => {
          await updateUserAccount(userId, updates)
          const ok = await fetchSession()
          if (!ok) await logout()
        }}
        onSetTemporaryPassword={setTemporaryPassword}
        onDeleteUser={async (userId) => {
          await deleteUserAccount(userId)
          const ok = await fetchSession()
          if (!ok) await logout()
        }}
      />

      <AccountDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        name={userName ?? ""}
        email={userEmail ?? ""}
        onSave={async ({ name, email, currentPassword, newPassword }) => {
          const changedPassword = Boolean(newPassword)
          const profileChanged =
            name !== (userName ?? "") ||
            email !== (userEmail ?? "")
          await api.updateAccount({ name, email })
          if (changedPassword) {
            await api.changePassword(currentPassword, newPassword!)
          }
          const ok = await fetchSession()
          if (!ok) await logout()
          if (profileChanged) {
            await refresh()
          }
        }}
      />
    </div>
  )
}
