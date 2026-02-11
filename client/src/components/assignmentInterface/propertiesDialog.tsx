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
  onUpdateInstructor: (id: string, updated: Instructor) => void
  onUpdateSection: (id: string, updated: Section) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertiesDialog({
  isOpen,
  onClose,
  sectionState,
  instructorState,
  onUpdateInstructor,
  onUpdateSection,
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

  // ── Initialise / sync edit state ──────────────────────────────────────────

  // Whenever the user switches mode or selects a different sidebar item we
  // re-populate the local edit state from the canonical parent state.
  React.useEffect(() => {
    if (mode === "instructors") {
      const id = instructorState.allIds[selectedIndex]
      const instructor = id ? instructorState.byId[id] : null
      // Spread into a new object so edits don't mutate the original
      setInstructorEdit(instructor ? { ...instructor } : null)
    } else {
      const id = sectionState.allIds[selectedIndex]
      const section = id ? sectionState.byId[id] : null
      setSectionEdit(section ? { ...section } : null)
    }
  }, [mode, selectedIndex, instructorState, sectionState])

  // ── Derived values ────────────────────────────────────────────────────────

  // Build the sidebar list labels from whichever mode is active
  const items = React.useMemo(() => {
    if (mode === "instructors") {
      return instructorState.allIds.map((id) => {
        const instructor = instructorState.byId[id]
        return `${instructor.position.short} ${instructor.name}`
      })
    }
    return sectionState.allIds.map((id) => {
      const section = sectionState.byId[id]
      return `${section.dept} ${section.code} - ${section.name}`
    })
  }, [mode, sectionState, instructorState])

  const selectedLabel = items[selectedIndex] ?? ""

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

  // ── Save ──────────────────────────────────────────────────────────────────

  // Push the local edit copy back up to the parent state via the callback props
  const handleSave = () => {
    if (mode === "instructors" && instructorEdit) {
      onUpdateInstructor(instructorEdit.id, instructorEdit)
    } else if (mode === "courses" && sectionEdit) {
      onUpdateSection(sectionEdit.id, sectionEdit)
    }
  }

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
              {items.map((label, i) => (
                <SidebarListItem
                  key={`${label}-${i}`}
                  active={i === selectedIndex}
                  onClick={() => setSelectedIndex(i)}
                  type="button"
                >
                  {label}
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
                    <button className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Instructor
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Instructor
                    </button>
                  ) : (
                    <button className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
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

                {/* Row 2: Dept / Code / Capacity / Workload */}
                <div className="flex items-center gap-6 mb-4">
                  <FormRow label="Dept." labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      value={sectionEdit.dept}
                      onChange={(e) => setSectionEdit({ ...sectionEdit, dept: e.target.value })}
                    />
                  </FormRow>

                  <FormRow label="Code" labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      value={sectionEdit.code}
                      onChange={(e) => setSectionEdit({ ...sectionEdit, code: e.target.value })}
                    />
                  </FormRow>

                  <FormRow label="Total Cap." labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      type="number"
                      value={sectionEdit.capacity}
                      onChange={(e) => setSectionEdit({ ...sectionEdit, capacity: Number(e.target.value) })}
                    />
                  </FormRow>

                  {/* Workload is how many "credits" this course counts toward an instructor's load */}
                  <FormRow label="Workload" labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      type="number"
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
                <SectionBox
                  title="Section"
                  className="w-[360px] mb-5"
                  action={<IconControlButton aria-label="Add section">+</IconControlButton>}
                >
                  {/* TODO: wire up per-section capacity list to data */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="w-12 text-center">1</div>
                      <input
                        className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                        defaultValue="125"
                      />
                      <IconControlButton aria-label="Remove section 1">−</IconControlButton>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-12 text-center">2</div>
                      <input
                        className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                        defaultValue="125"
                      />
                      <IconControlButton aria-label="Remove section 2">−</IconControlButton>
                    </div>
                  </div>
                </SectionBox>

                {/* Row 5: Action buttons (status change + save) */}
                <div className="flex items-center gap-4">
                  {isDropped ? (
                    <button className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Course
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Course
                    </button>
                  ) : (
                    <button className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
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
