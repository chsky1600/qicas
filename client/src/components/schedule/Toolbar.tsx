import type { Year, Course, Assignment, Schedule } from "@/features/schedule/types"

function exportCSV(courses: Course[], assignments: Assignment[]) {
  const rows = [["Course", "Section", "Instructor ID", "Term"]]
  for (const a of assignments) {
    const course = courses.find(c => c.code === a.course_code)
    const sec = course?.sections.find(s => s.id === a.section_id)
    rows.push([a.course_code, String(sec?.number ?? ""), a.instructor_id, a.term])
  }
  const csv = rows.map(r => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "schedule.csv"
  a.click()
  URL.revokeObjectURL(url)
}

interface Props {
  years: Year[]
  yearId: string
  courses: Course[]
  assignments: Assignment[]
  schedule: Schedule | null
  onChangeYear: (yearId: string) => void
  onOpenProperties: () => void
  onOpenSnapshots: () => void
}

export default function Toolbar({
  years, yearId, courses, assignments, schedule,
  onChangeYear, onOpenProperties, onOpenSnapshots,
}: Props) {
  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] text-white px-8 py-4 border-b-2 border-[#2c2c2c]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-4xl leading-none">Q</span>
          <span className="text-sm leading-tight tracking-wide">IC<br/>AS</span>
        </div>
        <select
          className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c]"
          value={yearId}
          onChange={e => onChangeYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
        {schedule && <span className="text-gray-400 text-xs">{schedule.name}</span>}
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📖</span>Tutorial
        </button>
        <button onClick={onOpenProperties} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📄</span>Edit Properties
        </button>
        <button onClick={onOpenSnapshots} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📸</span>Saved Schedules
        </button>
        <button onClick={() => exportCSV(courses, assignments)} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📤</span>Export
        </button>
        <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">⚙️</span>Settings
        </button>
      </div>
    </div>
  )
}
