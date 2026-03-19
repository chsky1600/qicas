import { useState } from "react"
import { X } from "lucide-react"
import type { Schedule, Course, CourseRule } from "@/features/schedule/types"

interface Props {
  open: boolean
  onClose: () => void
  schedules: Schedule[]
  activeScheduleId: string | null
  courses: Course[]
  courseRules: CourseRule[]
  onCreateSavedSchedule: () => Promise<Schedule | undefined>
  onDeleteSavedSchedule: (id: string) => Promise<void>
  onSwitchSchedule: (id: string) => Promise<void>
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
  open, onClose, schedules, activeScheduleId, courses, courseRules,
  onCreateSavedSchedule, onDeleteSavedSchedule, onSwitchSchedule,
}: Props) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const total = totalSections(courses, courseRules)
  const sorted = [...schedules].sort((a, b) => b.date_created.localeCompare(a.date_created))

  async function handleCreate() {
    setLoading(true)
    await onCreateSavedSchedule()
    setLoading(false)
  }

  async function handleLoad(id: string) {
    await onSwitchSchedule(id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-black rounded-t-lg">
          <h2 className="text-white font-semibold text-base">Saved Schedules</h2>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sorted.map(s => {
            const count = assignedCount(s)
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const isActive = s.id === activeScheduleId
            return (
              <div key={s.id} className={`border rounded-lg p-3 ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm">{s.name}</span>
                    {s.is_rc && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">RC</span>}
                    {isActive && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(s.date_created).toLocaleDateString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{count}/{total} sections assigned ({pct}%)</span>
                  {!isActive && (
                    <div className="flex gap-2">
                    <button
                      onClick={() => onDeleteSavedSchedule(s.id)}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleLoad(s.id)}
                      className="text-xs bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                    >
                      Load
                    </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t">
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded font-medium text-sm hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save Current Schedule"}
          </button>
        </div>
      </div>
    </div>
  )
}
