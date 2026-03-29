import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog"
import { FormRow } from "@/components/ui/form-row"
import { SectionBox } from "@/components/ui/section-box"
import { ModeTogglePill } from "@/components/ui/mode-toggle-pill"
import { IconControlButton } from "@/components/ui/icon-control-button"
import { toast } from "sonner"
import { HelpTooltip } from "../ui/help-tooltip.tsx"
import { X } from "lucide-react"

import type {
  Instructor, InstructorRule, Course, CourseRule,
  InstructorRank, Term, CourseLevel,
  Assignment
} from "@/features/schedule/types"
import { RANK_DISPLAY } from "@/features/schedule/types"

type Mode = "instructors" | "courses"
type Status = "current" | "dropped"

interface Props {
  open: boolean
  defaultMode?: "instructors" | "courses"
  contextAdd: boolean
  onClose: () => void
  instructors: Instructor[]
  instructorRules: InstructorRule[]
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  onCreateInstructor: (instructor: Instructor, rule: InstructorRule) => Promise<void>
  onUpdateInstructor: (instructor: Instructor) => Promise<void>
  onDropInstructor: (id: string, dropped: boolean) => Promise<void>
  onUpdateInstructorRule: (ruleId: string, updates: Partial<InstructorRule>) => Promise<void>
  onCreateCourse: (course: Course, rule: CourseRule) => Promise<void>
  onUpdateCourse: (course: Course) => Promise<void>
  onDropCourse: (code: string, dropped: boolean) => Promise<void>
  onUpdateCourseRule: (ruleId: string, updates: Partial<CourseRule>) => Promise<void>
}

const TERMS: Term[] = ["Fall", "Winter"]
const LEVELS: CourseLevel[] = ["undergrad1", "undergrad2", "undergrad3", "undergrad4", "literature", "graduate"]

function blankInstructor(): Instructor {
  return { id: crypto.randomUUID(), name: "", email: "", workload: 2, rank: "AssistantProfessor", prev_taught: [], notes: [] }
}
function blankInstructorRule(instructorId: string): InstructorRule {
  return { id: crypto.randomUUID(), instructor_id: instructorId, designations: [], workload_delta: 0, courses: [], declined_courses: [], dropped: false }
}
function blankCourse(): Course {
  return { id: crypto.randomUUID(), name: "", code: "", level: "undergrad1", year_introduced: String(new Date().getFullYear()), notes: [], sections: [{ id: crypto.randomUUID(), number: 1, capacity: 30 }], capacity: 30 }
}
function blankCourseRule(courseCode: string): CourseRule {
  return { id: crypto.randomUUID(), course_code: courseCode, terms_offered: ["Fall"], workload_fulfillment: 1, is_full_year: false, sections_available: [], is_external: false, dropped: false }
}

export default function PropertiesDialog({
  open, onClose, defaultMode, contextAdd,
  instructors, instructorRules,
  courses, courseRules,
  assignments,
  onCreateInstructor, onUpdateInstructor, onDropInstructor, onUpdateInstructorRule,
  onCreateCourse, onUpdateCourse, onDropCourse, onUpdateCourseRule,
}: Props) {
  const [mode, setMode] = useState<Mode>("instructors")
  const [status, setStatus] = useState<Status>("current")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isNew, setIsNew] = useState(false)
  const [changeMade, setChangeMade] = useState(false)  

  const [instrEdit, setInstrEdit] = useState<Instructor | null>(null)
  const [instrRuleEdit, setInstrRuleEdit] = useState<InstructorRule | null>(null)
  const [courseEdit, setCourseEdit] = useState<Course | null>(null)
  const [courseRuleEdit, setCourseRuleEdit] = useState<CourseRule | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setMode(defaultMode ?? "instructors") }, [open, defaultMode])

  const instrItems = useMemo(() =>
    instructors.filter(i => {
      const r = instructorRules.find(r => r.instructor_id === i.id)
      return status === "dropped" ? r?.dropped : !r?.dropped
    }).map(i => ({ id: i.id, label: `${RANK_DISPLAY[i.rank]?.short ?? ""} ${i.name}` })),
    [instructors, instructorRules, status]
  )

  const courseItems = useMemo(() =>
    courses.filter(c => {
      const r = courseRules.find(r => r.course_code === c.code)
      return status === "dropped" ? r?.dropped : !r?.dropped
    }).map(c => ({ id: c.id, label: `${c.code} - ${c.name}` })),
    [courses, courseRules, status]
  )

  const items = mode === "instructors" ? instrItems : courseItems

  useEffect(() => {
    if (isNew) return
    if (mode === "instructors") {
      const id = items[selectedIndex]?.id
      const i = instructors.find(x => x.id === id)
      setInstrEdit(i ? { ...i, prev_taught: [...i.prev_taught] } : null)
      setInstrRuleEdit(i ? { ...(instructorRules.find(r => r.instructor_id === i.id) ?? blankInstructorRule(i.id)) } : null)
    } else {
      const id = items[selectedIndex]?.id
      const c = courses.find(x => x.id === id)
      setCourseEdit(c ? { ...c, sections: c.sections.map(s => ({ ...s })) } : null)
      setCourseRuleEdit(c ? { ...(courseRules.find(r => r.course_code === c.code) ?? blankCourseRule(c.code)) } : null)
      setConfirmRemove(null)
    }
  }, [mode, selectedIndex, items, instructors, instructorRules, courses, courseRules, isNew])

  useEffect(() => {
    if (!open || !contextAdd) return
    setStatus("current");
    if (mode === "instructors") handleNewInstructor()      
    else handleNewCourse()
  }, [open, contextAdd])

  function handleNewInstructor() {
    const blank = blankInstructor()
    setIsNew(true)
    setChangeMade(false)
    setInstrEdit(blank)
    setInstrRuleEdit(blankInstructorRule(blank.id))
  }

  function handleNewCourse() {
    const blank = blankCourse()
    setIsNew(true)
    setChangeMade(false)
    setCourseEdit(blank)
    setCourseRuleEdit(blankCourseRule(blank.code))
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (mode === "instructors" && instrEdit && instrRuleEdit) {
        if (isNew) { await onCreateInstructor(instrEdit, instrRuleEdit); setIsNew(false) }
        else { 
          await Promise.all([ onUpdateInstructor(instrEdit), instrRuleEdit.id ? onUpdateInstructorRule(instrRuleEdit.id, instrRuleEdit) : Promise.resolve() ]) 
        }
      } else if (mode === "courses" && courseEdit && courseRuleEdit) {
        // ensure courseRuleEdit and courseEdit align on coursecode
        const rule = { ...courseRuleEdit, course_code: courseEdit.code }
        if (isNew) {
          if (courseEdit.code.trim() === "") toast.warning("All Courses must have a Course Code")
          else { await onCreateCourse(courseEdit, rule); setIsNew(false) }
        }
        else { await Promise.all([ onUpdateCourse(courseEdit), courseRuleEdit.id ? onUpdateCourseRule(courseRuleEdit.id, rule) : Promise.resolve()])}
      }
    } finally {
      setChangeMade(false)
      setSaving(false) 
    }
  }

  async function handleDrop() {
    if (mode === "instructors" && instrEdit) {
      await onDropInstructor(instrEdit.id, true)
      setStatus("dropped"); setSelectedIndex(0); setIsNew(false)
    } else if (mode === "courses" && courseEdit) {
      await onDropCourse(courseEdit.code, true)
      setStatus("dropped"); setSelectedIndex(0); setIsNew(false)
    }
    setChangeMade(false)
  }

  async function handleRenew() {
    if (mode === "instructors" && instrEdit) {
      await onDropInstructor(instrEdit.id, false)
      setStatus("current"); setSelectedIndex(0); setIsNew(false)
    } else if (mode === "courses" && courseEdit) {
      await onDropCourse(courseEdit.code, false)
      setStatus("current"); setSelectedIndex(0); setIsNew(false)
    }
    setChangeMade(false)
  }


  function addPrevTaught(code: string) {
    const course = courses.find(c => c.code === code)
    if (!course || !instrEdit || instrEdit.prev_taught.some(c => c.code === code)) return
    setChangeMade(true)
    setInstrEdit(p => p ? { ...p, prev_taught: [...p.prev_taught, course] } : p)
  }

  function addSection() {
    if (!courseEdit) return
    const maxNum = Math.max(0, ...courseEdit.sections.map(s => s.number))
    setChangeMade(true)
    setCourseEdit(p => p ? { ...p, sections: [...p.sections, { id: crypto.randomUUID(), number: maxNum + 1, capacity: 30 }] } : p)
  }

  function removeSection(secId: string) {
    if (!courseEdit) return
    setChangeMade(true)
    setCourseEdit(p => p ? { ...p, sections: p.sections.filter(s => s.id !== secId) } : p)
    setConfirmRemove(null)
  }

  const isDropped = status === "dropped"

  const rightTitle = useMemo(() => {
    if (isNew) return mode === "instructors" ? "New Instructor" : "New Course"
    const label = items[selectedIndex]?.label ?? ""
    if (mode === "instructors") return label.replace(/^Prof\.\s*/i, "Professor ").trim()
    return label
  }, [isNew, mode, items, selectedIndex])

  const noSelection = !isNew && items.length === 0
  
  // used by both instructor and course properties tabs
  // abstracted here for clarity, and style unity
  function ItemTitleAndButtons() {
    const itemType = mode === "instructors" ? "Instructor" : "Course"
    return (
    <div className="flex items-center gap-6 mb-3">
      <span className="text-2xl font-bold">{rightTitle}</span>
      <span className="flex items-center gap-4">
        {!isNew &&
          (isDropped ? (
            <button onClick={handleRenew} className="bg-blue-800 text-white px-3 py-0.5 rounded-md border border-black font-semibold">Renew {itemType}</button>
          ) : (
            <button onClick={handleDrop} className="bg-gray-800 text-white px-3 py-0.5 rounded-md border border-black font-semibold">Drop {itemType}</button>
          ))
        }
        {changeMade &&
          <button onClick={handleSave} disabled={saving} className="bg-green-700 text-white px-3 py-0.5 rounded-md border border-black font-semibold hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        }
      </span>
    </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent
        id="properties-dialog"
        showCloseButton={false}
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target.closest?.("#driver-popover-content")) e.preventDefault()
        }}
        className="w-[1100px] h-130 p-0 gap-0 border border-black rounded-md"
      >
        {/* Header */}
        <DialogTitle className="relative flex items-center justify-center bg-black text-white p-2 h-fit rounded-t-md">
          <div className="absolute left-2 flex items-center gap-1.5">
            <span className="text-xs opacity-80">Edit Properties</span>
            <HelpTooltip
              title="Edit Properties"
              description="Manage instructors and courses for the year. Switch between the Instructors and Courses tabs using the toggle at the top."
            />
          </div>
          <div id="properties-tab-courses">
          <ModeTogglePill<Mode>
            value={mode}
            onChange={next => { setMode(next); setSelectedIndex(0); setIsNew(false); setChangeMade(false) }}
            options={[
              { value: "instructors", label: "Instructors" },
              { value: "courses", label: "Courses" },
            ]}
            className="!bg-black"
            buttonClassName="!w-[400px]"
          />
          </div>
          <button id="properties-dialog-close" onClick={onClose} className="absolute right-3 text-white hover:opacity-80"><X size={18} /></button>
        </DialogTitle>

        {/* Body */}
        <div className="flex bg-white h-120 rounded">

          {/* Sidebar */}
          <div className="w-80 flex flex-col border-r border-black">

            <div className="flex gap-2 p-2 bg-white">
              <button
                onClick={() => { setStatus("current"); setSelectedIndex(0); setIsNew(false) }}
                className={`flex-1 px-2 py-1 rounded text-sm border ${status === "current" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:border-gray-400"}`}>
                Current
              </button>
              <button
                onClick={() => { setStatus("dropped"); setSelectedIndex(0); setIsNew(false) }}
                className={`flex-1 px-2 py-1 rounded text-sm border ${status === "dropped" ? "bg-gray-800 text-white border-gray-800" : "border-gray-300 hover:border-gray-400"}`}>
                Dropped
              </button>
              {status === "current" ?           
                <button
                  onClick={mode === "instructors" ? handleNewInstructor : handleNewCourse}
                  className={`px-2 py-1 rounded text-white text-sm border bg-gray-800 border-gray-800`}>
                  Add+
                </button> :
                <div
                  onClick={() => toast.warning(`Switch to 'Current' to add ${mode === "instructors" ? "an instructor" : "a course"}`)}
                  className={`px-2 py-1 rounded text-white text-sm border bg-gray-500 border-gray-500 cursor-not-allowed`}>
                  Add+
                </div>
              }
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.map((item, i) => (
                
                <div
                  className={`hover:bg-gray-300 border "border-gray-300" px-3 py-1.5 text-sm`}        
                  onClick={() => { setSelectedIndex(i); setIsNew(false); setChangeMade(false) }}
                >
                  {item.label}
                </div>
              ))}
              {items.length === 0 &&
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm h-full pb-15">
                <p>
                  You have no {status} {mode === "instructors" ? "instructors" : "courses"}.
                </p>
                <p>
                  Please switch to {status === "current" ? "'Dropped'": "'Current'"}
                </p>
              </div>

              }

            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 px-6 py-2 overflow-y-auto">

            {(noSelection && !isNew) ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select an item from the list, or click New to create one.
              </div>
            ) : null}

            {/* Instructor fields */}
            {mode === "instructors" && instrEdit && instrRuleEdit && (
              <>
                <ItemTitleAndButtons/>               

                <div className="flex gap-8 items-center mb-5">
                  <FormRow label="Name">
                    <input className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={instrEdit.name}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrEdit(p => p ? { ...p, name: e.target.value } : p)
                      }}/>
                  </FormRow>
                  <FormRow label="Email">
                    <input className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={instrEdit.email}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrEdit(p => p ? { ...p, email: e.target.value } : p)
                      }} />
                  </FormRow>
                </div>

                <div className="flex items-center gap-10 mb-5">
                  <FormRow label="Position" labelClassName="w-auto">
                    <select className="border border-black rounded-md px-3 py-1 bg-white"
                      value={instrEdit.rank}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrEdit(p => p ? { ...p, rank: e.target.value as InstructorRank } : p)
                        }}>
                      {(Object.keys(RANK_DISPLAY) as InstructorRank[]).map(r => (
                        <option key={r} value={r}>{RANK_DISPLAY[r].long}</option>
                      ))}
                    </select>
                  </FormRow>
                  <FormRow label="Workload" labelClassName="w-auto">
                    <input className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center" type="number"
                      value={instrEdit.workload}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrEdit(p => p ? { ...p, workload: Number(e.target.value) } : p)
                      }} 
                    />
                  </FormRow>
                  <FormRow label="Modifier" labelClassName="w-auto">
                    <input className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center" type="number"
                      value={instrRuleEdit.workload_delta}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrRuleEdit(p => p ? { ...p, workload_delta: Number(e.target.value) } : p)
                      }} 
                    />
                  </FormRow>
                </div>

                <div className="flex gap-8 mb-5">
                  <SectionBox title="Previously Taught" className="w-80"
                    action={
                      <select className="text-xs border border-gray-300 rounded px-1" value=""
                        onChange={e => { if (e.target.value) addPrevTaught(e.target.value) }}>
                        <option value="">+ Add</option>
                        {courses.filter(c => !instrEdit.prev_taught.some(p => p.code === c.code)).map(c => (
                          <option key={c.code} value={c.code}>{c.code}</option>
                        ))}
                      </select>
                    }
                  >
                    <div className="space-y-2 text-sm">
                      {instrEdit.prev_taught.map(c => (
                        <div key={c.code} className="flex items-center justify-between">
                          <span>{c.code} - {c.name}</span>
                          <IconControlButton aria-label={`Remove ${c.code}`}
                            onClick={() => {
                              setChangeMade(true)
                              setInstrEdit(p => p ? { ...p, prev_taught: p.prev_taught.filter(x => x.code !== c.code) } : p)
                            }}>
                            −
                          </IconControlButton>
                        </div>
                      ))}
                    </div>
                  </SectionBox>

                  <SectionBox title="Notes" className="flex-1" bodyClassName="p-0">
                    <textarea className="w-full h-32 p-3 text-sm outline-none resize-none" placeholder="Write here..."
                      value={instrEdit.notes.map(n => n.content).join("\n")}
                      onChange={e => {
                        setChangeMade(true)
                        setInstrEdit(p => p ? { ...p, notes: e.target.value ? [{ content: e.target.value }] : [] } : p)
                      }} />
                  </SectionBox>
                </div>
              </>
            )}

            {/* Course fields */}
            {mode === "courses" && courseEdit && courseRuleEdit && (
              <>
                <ItemTitleAndButtons/>

                <div className="flex gap-8 items-center mb-5">
                  <FormRow label="Name">
                    <input className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                      value={courseEdit.name}
                      onChange={e => {
                        setChangeMade(true)
                        setCourseEdit(p => p ? { ...p, name: e.target.value } : p)
                      }} />
                  </FormRow>
                  <FormRow label="Course Code" labelClassName="w-auto">
                    <input id="course-code-field" className="w-24 border border-black rounded-md px-2 py-1 bg-white text-center focus:outline-none"
                      value={courseEdit.code} readOnly={!isNew}
                      onChange={e => {
                        if (!isNew) return
                        setChangeMade(true)
                        const code = e.target.value.toUpperCase()
                        setCourseEdit(p => p ? { ...p, code } : p)
                        setCourseRuleEdit(p => p ? { ...p, course_code: code } : p)
                      }} />
                  </FormRow>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <FormRow label="Total Cap." labelClassName="w-auto">
                    <input className="w-20 border border-black rounded-md px-2 py-1 bg-[#ececec] text-center text-gray-500 cursor-not-allowed"
                      readOnly value={courseEdit.sections.reduce((s, sec) => s + sec.capacity, 0)} />
                  </FormRow>
                  <FormRow label="Workload" labelClassName="w-auto">
                    <input className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center" type="number" step="0.5"
                      value={courseRuleEdit.workload_fulfillment}
                      onChange={e => {
                        setChangeMade(true)
                        setCourseRuleEdit(p => p ? { ...p, workload_fulfillment: Number(e.target.value) } : p)
                        }} />
                  </FormRow>
                  <FormRow label="Paid By" labelClassName="w-auto">
                    <select className="border border-black rounded-md px-1 py-1 bg-white"
                      value={courseRuleEdit.is_external ? "faculty" : "department"}
                      onChange={e => {
                        setChangeMade(true)
                        setCourseRuleEdit(p => p ? { ...p, is_external: e.target.value === "faculty" } : p)
                      }}>
                      <option value="department">Department (Internal)</option>
                      <option value="faculty">Faculty (External)</option>
                    </select>
                  </FormRow>
                </div>

                <div className="flex items-center gap-4 mb-5 text-sm">
                  <div className="font-semibold">Availability:</div>
                  <label className="flex items-center gap-2">
                    <span>Fall or Winter</span>
                    <input type="radio" checked={!courseRuleEdit.is_full_year && courseRuleEdit.terms_offered.includes("Fall") && courseRuleEdit.terms_offered.includes("Winter")}
                      onChange={() => {
                        setChangeMade(true)
                        setCourseRuleEdit(p => p ? { ...p, is_full_year: false, terms_offered: ["Fall", "Winter"] } : p)
                        }} />
                  </label>
                  {TERMS.map(t => (
                    <label key={t} className="flex items-center gap-2">
                      <span>Only {t}</span>
                      <input type="radio"
                        checked={!courseRuleEdit.is_full_year && courseRuleEdit.terms_offered.length === 1 && courseRuleEdit.terms_offered[0] === t}
                        onChange={() => {
                          setChangeMade(true)
                          setCourseRuleEdit(p => p ? { ...p, is_full_year: false, terms_offered: [t] } : p)
                          }} />
                    </label>
                  ))}
                  <label className="flex items-center gap-2">
                    <span>Fall & Winter (Full year)</span>
                    <input type="radio" checked={courseRuleEdit.is_full_year}
                      onChange={() => {
                        setChangeMade(true)
                        setCourseRuleEdit(p => p ? { ...p, is_full_year: true, terms_offered: ["Fall", "Winter"] } : p)
                        }} />
                  </label>
                </div>

                <SectionBox title="Sections" className="w-full mb-5"
                  action={<IconControlButton aria-label="Add section" onClick={addSection}>+</IconControlButton>}
                >
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 pb-1 border-b border-gray-300">
                      <div className="w-8 text-center">#</div>
                      <div className="w-16 text-center">Capacity</div>
                      <div className="flex-1">Assigned To</div>
                      <div className="w-6"></div>
                    </div>
                    {courseEdit.sections.map(sec => (
                      <div key={sec.id}>
                        <div className="flex items-center gap-4">
                          <div className="w-8 text-center font-medium">{sec.number}</div>
                          <input className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center" type="number"
                            value={sec.capacity}
                            onChange={e => {
                                setChangeMade(true)
                                setCourseEdit(p => p ? { ...p, sections: p.sections.map(s => s.id === sec.id ? { ...s, capacity: Number(e.target.value) } : s) } : p)
                              }} />
                          <div className="flex-1 text-gray-600 text-xs">
                            {(() => {
                              const sectionAssignments = assignments.filter(x => x.section_id === sec.id)
                              if (sectionAssignments.length === 0) return "—"
                              const rule = courseRules.find(r => r.course_code === courseEdit.code)
                              return sectionAssignments.map(a => {
                                const name = instructors.find(i => i.id === a.instructor_id)?.name ?? a.instructor_id
                                return rule?.is_full_year ? `${name} (${a.term === "Fall" ? "A" : "B"})` : name
                              }).join(", ")
                            })()}
                          </div>
                          {courseEdit.sections.length > 1 && (
                            <IconControlButton aria-label={`Remove section ${sec.number}`}
                              onClick={() => {
                                if (confirmRemove === sec.id) removeSection(sec.id)
                                else setConfirmRemove(sec.id)
                              }}>−</IconControlButton>
                          )}
                        </div>
                        {confirmRemove === sec.id && (
                          <div className="mt-1 p-2 bg-yellow-50 border border-yellow-400 rounded text-xs text-yellow-800">
                            Remove section {sec.number}?
                            <div className="flex gap-2 mt-1">
                              <button className="px-2 py-0.5 bg-red-600 text-white rounded text-xs" onClick={() => removeSection(sec.id)}>Confirm</button>
                              <button className="px-2 py-0.5 bg-gray-300 rounded text-xs" onClick={() => setConfirmRemove(null)}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionBox>
              </>
            )}

            {!isNew && items[selectedIndex] && mode === "instructors" && !instrEdit && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select an item from the list, or click New to create one.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
