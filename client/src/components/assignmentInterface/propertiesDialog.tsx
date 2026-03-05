import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { SectionState, InstructorState, Section, Instructor } from "@/features/assignment/assignment.types"
import { SectionAvailability } from "@/features/assignment/assignment.types"
import { IconControlButton } from "@/components/ui/icon-control-button"
import { FormRow } from "@/components/ui/form-row"
import { SectionBox } from "@/components/ui/section-box"
import { SidebarListItem } from "@/components/ui/sidebar-list-item"
import { ModeTogglePill } from "@/components/ui/mode-toggle-pill"

// ─── Constants ────────────────────────────────────────────────────────────────

// Available instructor position options. "short" is stored in the data type;
// "long" is the human-readable label shown in the dropdown.
const POSITIONS = [
  { short: "Asst. Prof.", long: "Assistant Professor" },
  { short: "Assoc. Prof.", long: "Associate Professor" },
  { short: "Prof.", long: "Professor" },
  { short: "Adj.", long: "Adjunct" },
  { short: "T.A.", long: "TA" },
]

// Course availability options mapped to the SectionAvailability enum values.
const AVAILABILITY_OPTIONS = [
  { value: SectionAvailability.ForW, label: "Fall or Winter" },
  { value: SectionAvailability.F,    label: "Only Fall" },
  { value: SectionAvailability.W,    label: "Only Winter" },
  { value: SectionAvailability.FandW, label: "Fall & Winter (Full year)" },
]

// ─── Types ────────────────────────────────────────────────────────────────────

// Which panel the user is currently viewing
type Mode = "instructors" | "courses"

// Which tab is active in the sidebar (current vs. dropped instructors/courses)
type Status = "current" | "dropped"

interface PropertiesDialogProps {
  isOpen: boolean
  onClose: () => void
  sectionState: SectionState
  instructorState: InstructorState
  // Callbacks that bubble the saved data back up to useAssignment
  onUpdateInstructor: (updated: Instructor) => void
  onUpdateSection: (updated: Section) => void
  onDropInstructor: (instructorId: string, dropped: boolean) => void
  onSaveCourseSections: (courseId: string, sections: Array<{ id: string; capacity: number }>) => Promise<void>
  onAddSection: (courseId: string, course_code: string, courseName: string, year_introduced: string, workload: number, availability: SectionAvailability) => Promise<void>
  onRemoveSection: (sectionId: string) => Promise<void>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertiesDialog({
  isOpen,
  onClose,
  sectionState,
  instructorState,
  onUpdateInstructor,
  onUpdateSection,
  onDropInstructor,
  onSaveCourseSections,
  onAddSection,
  onRemoveSection,
}: PropertiesDialogProps) {

  // ── Navigation state ──────────────────────────────────────────────────────

  // Which panel (Instructors / Courses) is active
  const [mode, setMode] = React.useState<Mode>("instructors")

  // Which tab (Current / Dropped) is active in the sidebar
  const [status, setStatus] = React.useState<Status>("current")

  // Index of the currently-highlighted sidebar item
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  // ── Edit state ────────────────────────────────────────────────────────────

  // Local working copy of the selected instructor. We keep this as a copy so
  // edits don't mutate the parent state until the user clicks "Save Changes".
  const [instructorEdit, setInstructorEdit] = React.useState<Instructor | null>(null)

  // Local working copy of the selected course.
  const [sectionEdit, setSectionEdit] = React.useState<Section | null>(null)

  // Tracks edited capacities per section (keyed by section ID) before Save is clicked
  const [sectionCapacities, setSectionCapacities] = React.useState<Record<string, number>>({})
  // Holds the section pending removal confirmation (null = no prompt showing)
  const [confirmRemove, setConfirmRemove] = React.useState<{ sectionId: string; instructorName: string } | null>(null)


  // ── Derived values ────────────────────────────────────────────────────────

  // Build the sidebar list labels from whichever mode is active
  const items = React.useMemo(() => {
    if (mode === "instructors") {
      return instructorState.allIds
      .filter((id) => {
        const dropped = instructorState.byId[id].dropped
        return status === "dropped" ? dropped : !dropped
      })
      .map((id) => {
        const instructor = instructorState.byId[id]
        return { id, label: `${instructor.position.short} ${instructor.name}` }
      })
    }
    const seen = new Set<string>()
    return sectionState.allIds
      .filter((id) => {
        const dropped = sectionState.byId[id].dropped
        return status === "dropped" ? dropped : !dropped
      })
      .filter((id) => {
        const code = sectionState.byId[id].course_code
        if (seen.has(code)) return false
        seen.add(code)
        return true
      })
      .map((id) => {
        const section = sectionState.byId[id]
        return { id, label: `${section.course_code} - ${section.name}` }
      })
  }, [mode, status, sectionState, instructorState])

  const selectedLabel = items[selectedIndex]?.label ?? ""

  // True when the sidebar status tab is set to "Dropped"
  const isDropped = status === "dropped"

  // True when this is a newly-created entry (label contains "new")
  const isNew = selectedLabel.toLowerCase().includes("new")

  // Format the right-panel heading: expand "Prof." abbreviation for instructors
  const rightTitle = React.useMemo(() => {
    if (!selectedLabel) return ""
    if (mode === "instructors") return selectedLabel.replace(/^Prof\.\s*/i, "Professor ").trim()
    return selectedLabel
  }, [mode, selectedLabel])

  // ── Initialise / sync edit state ──────────────────────────────────────────

  // Whenever the user switches mode or selects a different sidebar item we
  // re-populate the local edit state from the canonical parent state.
  React.useEffect(() => {
    if (mode === "instructors") {
      const id = items[selectedIndex]?.id
      const instructor = id ? instructorState.byId[id] : null
      // Spread into a new object so edits don't mutate the original
      setInstructorEdit(instructor ? { ...instructor } : null)
    } else {
      const id = items[selectedIndex]?.id
      const section = id ? sectionState.byId[id] : null
      setSectionEdit(section ? { ...section } : null)
      setConfirmRemove(null)  // Close any open delete confirmation when switching sections
      if (section) {
        const caps: Record<string, number> = {}
        sectionState.allIds
          .map((secId) => sectionState.byId[secId])
          .filter(s => s.course_code === section.course_code)
          .forEach((s) => caps[s.id] = s.capacity)
        setSectionCapacities(caps)
      } else {
        setSectionCapacities({})
      }
    }
  }, [mode, selectedIndex, instructorState, sectionState, items])

  // ── Save, Drop, Renew ─────────────────────────────────────────────────────

  // Push the local edit copy back up to the parent state via the callback props
  const handleSave = () => {
    if (mode === "instructors" && instructorEdit) {
      onUpdateInstructor(instructorEdit)
    } else if (mode === "courses" && sectionEdit) {
      onUpdateSection(sectionEdit)
      const changed = sectionState.allIds
        .map((id) => sectionState.byId[id])
        .filter(s => s.course_code === sectionEdit.course_code)
        .filter(s => sectionCapacities[s.id] !== undefined && sectionCapacities[s.id] !== s.capacity)
        .map(s => ({ id: s.id, capacity: sectionCapacities[s.id] }))
      if (changed.length > 0) {
        onSaveCourseSections(sectionEdit.course_id, changed)
      }
    }
  }

  // When dropping or renewing, we want to update the "dropped" status in the parent state
  const setDroppedFromSelected = (nextDropped: boolean) => {
    if (mode === "instructors" && instructorEdit) {
      // When Dropping an instructor
      if (nextDropped) {
        // If dropping, also clear all assignments by setting assigned sections to empty sets
        const allAssigned = new Set([...instructorEdit.fall_assigned, ...instructorEdit.wint_assigned])
        allAssigned.forEach((sectionId) => {
          const section = sectionState.byId[sectionId]
          if (section) {
            onUpdateSection({ ...section, assigned_to: null })
          }
        })
        // Clear both fall and winter assigned sets
        const updated = { ...instructorEdit, dropped: true, fall_assigned: new Set<string>(), wint_assigned: new Set<string>() }
        onUpdateInstructor(updated)
      } // When Renewing an instructor
      else {
        const updated = { ...instructorEdit, dropped: false }
        onUpdateInstructor(updated)
      }
      onDropInstructor(instructorEdit.id, nextDropped)
    } else if (mode === "courses" && sectionEdit) {
      const updated = { ...sectionEdit, dropped: nextDropped }
      onUpdateSection(updated)
    }
    setSelectedIndex(0)
  }
  const handleDrop = () => setDroppedFromSelected(true)
  const handleRenew = () => setDroppedFromSelected(false)

  // ── Styling helpers ───────────────────────────────────────────────────────

  // Returns the CSS class string for a sidebar status tab button.
  // Active tab gets a lighter gray (matching sidebar bg) so it visually
  // "connects" to the content below it, like a browser tab.
  const statusTabClass = (tab: Status) =>
    `flex-1 py-2 font-semibold transition-all cursor-pointer !rounded-t-lg !rounded-b-none ${
        status === tab
        ? "!bg-[#bfbfbf] text-black"
        : "!bg-[#3a3a3a] text-white hover:!bg-[#4a4a4a]"
    }`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[1100px] h-[620px] p-0 gap-0 overflow-hidden border border-black rounded-md bg-[#f4f4f4]"
      >
        {/* ── Header bar ─────────────────────────────────────────────────── */}
        <div className="relative flex items-center justify-center bg-black text-white h-13 px-4">
          <div className="absolute left-2 text-xs opacity-80">Edit Properties</div>

          {/* Toggle between Instructors and Courses panels */}
          <ModeTogglePill<Mode>
            value={mode}
            onChange={(next) => {
              setMode(next)
              setSelectedIndex(0)  // Reset selection when switching panels
            }}
            options={[
              { value: "instructors", label: "Instructors" },
              { value: "courses",     label: "Courses" },
            ]}
            className="!bg-black"
            buttonClassName="!w-[400px]"
          />

          <button onClick={onClose} className="absolute right-3 text-lg leading-none hover:opacity-80">
            ×
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex h-[calc(620px-44px)] bg-[#f4f4f4]">

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="w-80 bg-[#bfbfbf] flex flex-col border-r border-black">

            {/* Current / Dropped tabs */}
            <div className="flex text-sm bg-black px-1 pt-1 gap-0.5">
              <button
                type="button"
                onClick={() => { setStatus("current"); setSelectedIndex(0) }}
                className={statusTabClass("current")}
              >
                Current
              </button>
              <button
                type="button"
                onClick={() => { setStatus("dropped"); setSelectedIndex(0) }}
                className={statusTabClass("dropped")}
              >
                Dropped
              </button>
            </div>

            {/* Scrollable list of instructors or courses */}
            <div className="flex-1 overflow-y-auto py-2">
              {items.map((item, i) => (
                <SidebarListItem
                  key={item.id}
                  active={i === selectedIndex}
                  onClick={() => setSelectedIndex(i)}
                  type="button"
                >
                  {item.label}
                </SidebarListItem>
              ))}
            </div>

            {/* Button to add a new entry */}
            <div className="p-4 flex justify-center">
              <button className="px-10 py-2 rounded-md bg-[#6e6e6e] text-white font-semibold border border-black hover:opacity-90">
                New {mode === "instructors" ? "Instructor" : "Course"}
              </button>
            </div>
          </div>

          {/* ── Right panel ──────────────────────────────────────────────── */}
          {/* Each time the selected item changes, the right panel re-renders
              with fresh controlled input values sourced from edit state. */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="text-2xl font-bold mb-5">{rightTitle}</div>

            {/* ── Instructor fields ─────────────────────────────────────── */}
            {mode === "instructors" && instructorEdit ? (
              <>
                {/* Row 1: Name + Email */}
                <div className="flex gap-8 items-center mb-5">
                  <FormRow label="Name">
                    <input
                      className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={instructorEdit.name}
                      onChange={(e) => setInstructorEdit({ ...instructorEdit, name: e.target.value })}
                    />
                  </FormRow>

                  <FormRow label="Email">
                    <input
                      className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={instructorEdit.email}
                      onChange={(e) => setInstructorEdit({ ...instructorEdit, email: e.target.value })}
                    />
                  </FormRow>
                </div>

                {/* Row 2: Position + Workload + Modifier */}
                <div className="flex items-center gap-10 mb-5">
                  <FormRow label="Position" labelClassName="w-auto">
                    {/* Dropdown values come from the POSITIONS constant */}
                    <select
                      className="border border-black rounded-md px-3 py-1 bg-white"
                      value={instructorEdit.position.short}
                      onChange={(e) => {
                        const match = POSITIONS.find(p => p.short === e.target.value)
                        if (match) setInstructorEdit({ ...instructorEdit, position: match })
                      }}
                    >
                      {POSITIONS.map((p) => (
                        <option key={p.short} value={p.short}>{p.long}</option>
                      ))}
                    </select>
                  </FormRow>

                  <FormRow label="Workload" labelClassName="w-auto">
                    <input
                      className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center"
                      type="number"
                      value={instructorEdit.workload_total}
                      onChange={(e) => setInstructorEdit({ ...instructorEdit, workload_total: Number(e.target.value) })}
                    />
                  </FormRow>

                  <FormRow label="Modifier" labelClassName="w-auto">
                    <input
                      className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center"
                      type="number"
                      value={instructorEdit.modifier}
                      onChange={(e) => setInstructorEdit({ ...instructorEdit, modifier: Number(e.target.value) })}
                    />
                  </FormRow>
                </div>

                {/* Row 3: Previously Taught + Notes */}
                <div className="flex gap-8 mb-5">
                  <SectionBox
                    title="Previously Taught"
                    className="w-80"
                    action={<IconControlButton aria-label="Add previously taught">+</IconControlButton>}
                  >
                    {/* TODO: wire up previously-taught list to data */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Fren 201 - More French</span>
                        <IconControlButton aria-label="Remove Fren 201">−</IconControlButton>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Fren 404 - Literature</span>
                        <IconControlButton aria-label="Remove Fren 404">−</IconControlButton>
                      </div>
                    </div>
                  </SectionBox>

                  {/* Free-text notes field */}
                  <SectionBox title="Notes" className="flex-1" bodyClassName="p-0">
                    <textarea
                      className="w-full h-32 p-3 text-sm outline-none resize-none"
                      placeholder="Write here..."
                      value={instructorEdit.notes}
                      onChange={(e) => setInstructorEdit({ ...instructorEdit, notes: e.target.value })}
                    />
                  </SectionBox>
                </div>

                {/* Row 4: Action buttons (status change + save) */}
                <div className="flex items-center gap-4">
                  {isDropped ? (
                    <button
                    onClick={handleRenew} 
                    className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Instructor
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Instructor
                    </button>
                  ) : (
                    <button 
                    onClick={handleDrop}
                    className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Drop Instructor
                    </button>
                  )}

                  {/* Save commits the local edit copy back to parent state */}
                  <button
                    onClick={handleSave}
                    className="bg-green-700 text-white px-6 py-2 rounded-md border border-black font-semibold hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : null}

            {/* ── Course fields ─────────────────────────────────────────── */}
            {mode === "courses" && sectionEdit ? (
              <>
                {/* Row 1: Name */}
                <div className="flex gap-8 items-center mb-5">
                  <FormRow label="Name">
                    <input
                      className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={sectionEdit.name}
                      onChange={(e) => setSectionEdit({ ...sectionEdit, name: e.target.value })}
                    />
                  </FormRow>
                </div>

                {/* Row 2: Course Code / Capacity / Workload */}
                <div className="flex items-center gap-6 mb-4">
                  <FormRow label="Course Code" labelClassName="w-auto">
                    <input
                      className="w-24 border border-black rounded-md px-2 py-1 bg-white text-center focus:outline-none"
                      value={sectionEdit.course_code}
                      readOnly
                    />
                  </FormRow>

                  <FormRow label="Total Cap." labelClassName="w-auto">
                    <input
                      className="w-20 border border-black rounded-md px-2 py-1 bg-[#ececec] text-center text-gray-500 cursor-not-allowed"
                      type="number"
                      value={sectionState.allIds.map(id => sectionState.byId[id]).filter(s => s.course_code === sectionEdit.course_code).reduce((sum, s) => sum + (sectionCapacities[s.id] ?? s.capacity), 0)}
                      readOnly
                    />
                  </FormRow>

                  {/* Workload is how many "credits" this course counts toward an instructor's load */}
                  <FormRow label="Workload" labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      type="number"
                      step="0.5"
                      value={sectionEdit.workload}
                      onChange={(e) => setSectionEdit({ ...sectionEdit, workload: Number(e.target.value) })}
                    />
                  </FormRow>
                </div>

                {/* Row 3: Availability (radio group) */}
                <div className="flex items-center gap-4 mb-5 text-sm">
                  <div className="font-semibold">Availability:</div>
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      <input
                        type="radio"
                        name="availability"
                        checked={sectionEdit.availability === opt.value}
                        onChange={() => setSectionEdit({ ...sectionEdit, availability: opt.value })}
                      />
                    </label>
                  ))}
                </div>

                {/* Row 4: Section capacity breakdown */}
                {(() => {
                  const courseSections = sectionState.allIds
                    .map(id => sectionState.byId[id])
                    .filter(s => s.course_code === sectionEdit.course_code)
                    .sort((a, b) => a.section_num - b.section_num)
                  return (
                    <div className="mb-5">

                      <SectionBox
                        title="Sections"
                        className="w-full mb-2"
                        action={
                          <IconControlButton
                            aria-label="Add section"
                            onClick={() => onAddSection(sectionEdit.course_id, sectionEdit.course_code, sectionEdit.name, sectionEdit.year_introduced, sectionEdit.workload, sectionEdit.availability)}
                          >+</IconControlButton>
                        }
                      >
                        <div className="space-y-3 text-sm">
                            {/* Column headers */}
                            <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-500 pb-1 border-b border-gray-300">
                              <div className="w-8 text-center">#</div>
                              <div className="w-16 text-center">Capacity</div>
                              <div className="flex-1">Assigned To</div>
                              <div className="w-6"></div>
                            </div>
                          {courseSections.map(s => {
                            const instructor = s.assigned_to ? instructorState.byId[s.assigned_to] : null
                            const instructorName = instructor ? `${instructor.position.short} ${instructor.name}` : "—"
                            return (
                              <div key={s.id}>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="w-8 text-center font-medium">{s.section_num}</div>
                                  <input
                                    className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                                    type="number"
                                    value={sectionCapacities[s.id] ?? s.capacity}
                                    onChange={(e) => setSectionCapacities(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                                  />
                                  <div className="flex-1 text-gray-600 text-xs">{instructorName}</div>
                                  <IconControlButton
                                    aria-label={`Remove section ${s.section_num}`}
                                    onClick={() => {
                                      if (instructor) {
                                        setConfirmRemove({ sectionId: s.id, instructorName })
                                      } else {
                                        onRemoveSection(s.id)
                                      }
                                    }}
                                  >−</IconControlButton>
                                </div>
                                {/* Inline confirmation prompt for assigned sections */}
                                {confirmRemove?.sectionId === s.id && (
                                  <div className="mt-1 p-2 bg-yellow-50 border border-yellow-400 rounded text-xs text-yellow-800">
                                    Section {s.section_num} is assigned to {confirmRemove.instructorName}. Removing it will clear this assignment.
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        className="px-2 py-0.5 bg-red-600 text-white rounded text-xs"
                                        onClick={() => { onRemoveSection(s.id); setConfirmRemove(null) }}
                                      >Confirm</button>
                                      <button
                                        className="px-2 py-0.5 bg-gray-300 rounded text-xs"
                                        onClick={() => setConfirmRemove(null)}
                                      >Cancel</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </SectionBox>
                    </div>
                  )
                })()}


                {/* Row 5: Action buttons (status change + save) */}
                <div className="flex items-center gap-4">
                  {isDropped ? (
                    <button 
                      onClick={handleRenew}
                      className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Course
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Course
                    </button>
                  ) : (
                    <button 
                      onClick={handleDrop}
                      className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Drop Course
                    </button>
                  )}

                  {/* Save commits the local edit copy back to parent state */}
                  <button
                    onClick={handleSave}
                    className="bg-green-700 text-white px-6 py-2 rounded-md border border-black font-semibold hover:opacity-90"
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
