import { useEffect, useState, useRef } from "react"
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { useSchedule } from "@/features/schedule/useSchedule"
import { useTutorial } from "@/features/schedule/useTutorial"
import type { SectionDragData, InstructorDropData, PanelDropData } from "@/features/schedule/types"
import Toolbar from "@/components/schedule/Toolbar"
import CoursesPanel from "@/components/schedule/CoursesPanel"
import ScheduleTable from "@/components/schedule/ScheduleTable"
import PropertiesDialog from "@/components/schedule/PropertiesDialog"
import SavedSchedulesDialog from "@/components/schedule/SavedSchedulesDialog"
import SectionChip from "@/components/schedule/SectionChip"
import { Toaster } from "@/components/ui/sonner"

export default function SchedulePage() {
  const {
    years, yearId, courses, courseRules,
    instructors, instructorRules,
    schedules, schedule, assignments, violations,
    saving, loading, error,
    assign, unassign,
    createInstructor, updateInstructor, dropInstructor, updateInstructorRule,
    createCourse, updateCourse, dropCourse, updateCourseRule,
    addSchedule, copySchedule, deleteSavedSchedule, switchSchedule, renameSchedule,
    changeYear,
    exportCSV
  } = useSchedule()

  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [snapshotsOpen, setSnapshotsOpen] = useState(false)
  const [dragging, setDragging] = useState<SectionDragData | null>(null)
  const [propertiesMode, setPropertiesMode] = useState<"instructors" | "courses">("instructors")
  const { startTutorial } = useTutorial({
    courses, courseRules,
    instructors, instructorRules,
    schedule, schedules,
    onOpenProperties: () => { setPropertiesMode("instructors"); setPropertiesOpen(true) },
    onCloseProperties: () => setPropertiesOpen(false),
    onOpenSnapshots: () => setSnapshotsOpen(true),
    onCloseSnapshots: () => setSnapshotsOpen(false),
  })

  const tutorialStarted = useRef(false)
  useEffect(() => {
    if (!tutorialStarted.current && !localStorage.getItem("tutorialSeen")) {
      tutorialStarted.current = true
      startTutorial()
    }
  }, [startTutorial])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragStart(e: DragStartEvent) {
    setDragging(e.active.data.current as SectionDragData)
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragging(null)
    const drag = e.active.data.current as SectionDragData
    if (!e.over) return

    const over = e.over.data.current as InstructorDropData | PanelDropData

    if (over.type === "panel" && drag.assignmentId) {
      unassign(drag.assignmentId)
      return
    }

    if (over.type !== "instructor") return

    const isFullYear = courseRules.find(r => r.course_code === drag.courseCode)?.is_full_year ?? false

    // Full year: Fall chip must stay in Fall, Winter chip must stay in Winter.
    // If user drags across terms, redirect to the chip that belongs in the target term.
    if (isFullYear && drag.source === "chip" && drag.prevTerm !== over.term) {
      const targetAssignment = assignments.find(
        a => a.course_code === drag.courseCode && a.term === over.term
      )
      if (targetAssignment) {
        // Move the chip that actually belongs in that term
        assign(targetAssignment.section_id, drag.courseCode, over.instructorId, over.term, targetAssignment.id)
      } else {
        // No chip in target term yet — move the dragged chip there (change its term)
        assign(drag.sectionId, drag.courseCode, over.instructorId, over.term, drag.assignmentId)
      }
      return
    }

    assign(drag.sectionId, drag.courseCode, over.instructorId, over.term, drag.assignmentId)
  }


  const draggingCourse = dragging ? courses.find(c => c.code === dragging.courseCode) : null
  const draggingSection = draggingCourse?.sections.find(s => s.id === dragging?.sectionId)
  const draggingRule = dragging ? courseRules.find(r => r.course_code === dragging.courseCode) : null

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  if (error) return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toaster />
      <Toolbar
        years={years}
        yearId={yearId}
        schedule={schedule}
        saving={saving}
        onChangeYear={changeYear}
        onOpenProperties={() => { setPropertiesMode("instructors"); setPropertiesOpen(true) }}
        onOpenSnapshots={() => setSnapshotsOpen(true)}
        onExportCSV={exportCSV}
        onStartTutorial={startTutorial}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <CoursesPanel
            courses={courses}
            courseRules={courseRules}
            assignments={assignments}
            onAdd={() => { setPropertiesMode("courses"); setPropertiesOpen(true) }}
          />
          <ScheduleTable
            instructors={instructors}
            instructorRules={instructorRules}
            courses={courses}
            courseRules={courseRules}
            assignments={assignments}
            violations={violations}
          />
        </div>
        <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null}>
          {dragging && draggingSection ? (
            <SectionChip
              courseCode={dragging.courseCode}
              sectionId={dragging.sectionId}
              sectionNum={draggingSection.number}
              isFullYear={draggingRule?.is_full_year ?? false}
              isExternal={draggingRule?.is_external ?? false}
              assignmentId={dragging.assignmentId ?? ""}
              prevInstructorId={dragging.prevInstructorId ?? ""}
              prevTerm={dragging.prevTerm ?? "Fall"}
              inViolation={null}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <PropertiesDialog
        open={propertiesOpen}
        defaultMode={propertiesMode}
        onClose={() => setPropertiesOpen(false)}
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
      />
    </div>
  )
}
