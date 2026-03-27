import { useState, useMemo } from "react"
import { X } from "lucide-react"
import type { Schedule, Course, CourseRule } from "@/features/schedule/types"
import { HelpTooltip } from "../ui/help-tooltip.tsx"
import { Dialog, DialogContent } from "@/components/ui/dialog"


interface Props {
  open: boolean
  onClose: () => void
  activeSchedule: Schedule | null
  schedules: Schedule[]
  courses: Course[]
  courseRules: CourseRule[]
  onAddSchedule: () => Promise<Schedule | undefined>
  onCopySchedule: (schedule: Schedule) => Promise<Schedule | undefined>
  onDeleteSavedSchedule: (id: string) => Promise<void>
  onSwitchSchedule: (id: string) => Promise<void>
  onRenameSchedule: (scheduleId: string, newName: string)  => Promise<void>
}

function totalSections(courses: Course[], courseRules: CourseRule[]) {
  return courses
    .filter(c => !courseRules.find(r => r.course_code === c.code)?.dropped)
    .flatMap(c => c.sections).length
}

function assignedCount(schedule: Schedule) {
  return new Set(schedule.assignments.map(a => a.section_id)).size
}

export default function SavedSchedulesDialog({
  open, onClose, activeSchedule, schedules, courses, courseRules,
  onAddSchedule, onCopySchedule, onDeleteSavedSchedule, onSwitchSchedule,
  onRenameSchedule,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [renameId, setRenameId] = useState<string|null>(null)
  const [renameValue, setRenameValue] = useState<string>("")

  const total = totalSections(courses, courseRules)

  const sorted = useMemo(()=> {
    return [...schedules].sort((a, b) => b.date_created.localeCompare(a.date_created))
  }, [schedules])

  async function handleLoad(id: string) {
    await onSwitchSchedule(id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        id="saved-schedules-dialog"
        showCloseButton={false}
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target.closest?.("#driver-popover-content")) e.preventDefault()
        }}
        className="p-0 gap-0 w-[700px] max-h-[70vh] h-auto flex flex-col rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-black rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-semibold text-base">Saved Schedules</h2>
            <HelpTooltip
              title="Saved Schedules"
              description="Save multiple versions of a schedule for the same year. Load one to make it active, copy it as a starting point, rename it, or delete it."
            />
            <button
              id="saved-schedules-add"
              onClick={onAddSchedule}
              className="text-xs bg-white text-black font-semibold px-2 py-1 rounded hover:bg-gray-200"
            >
              Add+
            </button>
          </div>          
          <button id="saved-schedules-dialog-close" onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.map(s => {
            const isActive = s.id === activeSchedule?.id
            const count = isActive ? assignedCount(activeSchedule) : assignedCount(s) // Keeps Active schedule up to date with any assignments
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={s.id} className={`border rounded-lg p-3 ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  {/* Rename Schedule Input: */}
                  {renameId === s.id ?
                    <>
                      <label className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
                      <div className="relative">
                        <input autoFocus type="search" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                        style={{ width: `${Math.max(renameValue.length+8, 20)}ch`}}
                        onBlur={() => setRenameId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameValue && s.name !== renameValue) onRenameSchedule(s.id, renameValue)
                          }
                          if (e.key === "Enter" || e.key == "Escape") setRenameId(null);
                        }}
                        className="p-1.5 pr-20px border border-default-medium text-sm rounded shadow-xs" placeholder="Rename..." required />
                        <button type="button" 
                        onMouseDown={(e) => {e.preventDefault(); 
                          if (renameValue && s.name !== renameValue) onRenameSchedule(s.id, renameValue)
                          setRenameId(null)}}
                        className="absolute end-1.5 bottom-1.5 ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">Confirm</button>
                      </div>
                    </>
                    :
                    <span onDoubleClick={() => {setRenameValue(s.name); setRenameId(s.id)}} className="font-medium text-sm">{s.name}</span>
                  }
                  <div className="flex items-center">              
                    {s.is_rc && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">RC</span>}
                    {isActive && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                    <span className="text-xs text-gray-400 px-1.5">{new Date(s.date_created).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{count}/{total} sections assigned ({pct}%)</span>
                  <div className="flex gap-2">
                  <button
                    onClick={() => {setRenameValue(s.name); setRenameId(s.id)}}
                    className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {onCopySchedule(s)}}
                    className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    Copy
                  </button>
                  {!isActive && (
                    <>                      
                      <button
                        onClick={() => handleLoad(s.id)}
                        className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Do you want to delete "${s.name}"?`))onDeleteSavedSchedule(s.id)
                        }}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
