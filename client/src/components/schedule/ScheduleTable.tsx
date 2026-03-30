import { useState } from "react"
import InstructorRow from "./InstructorRow.tsx"
import InstructorFilters from "./InstructorFilters.tsx"
import type { SortBy } from "./InstructorFilters.tsx"
import { HelpTooltip } from "../ui/help-tooltip.tsx"
import type {
  Instructor, InstructorRule, Course, CourseRule,
  Assignment, Violation, InstructorRank
} from "@/features/schedule/types"

interface Props {
  instructors: Instructor[]
  instructorRules: InstructorRule[]
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  violations: Violation[]
  onAddInstructor: () => void
  isAdmin: boolean
  highlightedSectionId: string | null
  onHighlight: (sectionId: string | null) => void
}

export default function ScheduleTable({
  instructors, instructorRules, courses, courseRules,
  assignments, violations, onAddInstructor, isAdmin,
  highlightedSectionId, onHighlight,
}: Props) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>(null)
  const [rankFilter, setRankFilter] = useState<Set<InstructorRank>>(new Set())

  const activeInstructors = instructors.filter(i => {
    const rule = instructorRules.find(r => r.instructor_id === i.id)
    return !rule?.dropped
  })

  let rows = activeInstructors.map(instructor => {
    const rule = instructorRules.find(r => r.instructor_id === instructor.id)
    const baseWorkload = instructor.workload + (rule?.workload_delta ?? 0)
    const assignedWorkload = assignments
      .filter(a => a.instructor_id === instructor.id)
      .reduce((sum, a) => {
        const cr = courseRules.find(r => r.course_code === a.course_code)
        return sum + (cr?.workload_fulfillment ?? 0)
      }, 0)
    const fulfillmentPct = baseWorkload > 0 ? assignedWorkload / baseWorkload : 0
    return { instructor, rule, baseWorkload, assignedWorkload, fulfillmentPct }
  })
  .filter(r => r.instructor.name.toLowerCase().includes(search.toLowerCase()))
  .filter(r => rankFilter.size === 0 || rankFilter.has(r.instructor.rank))

  if (sortBy === "name-asc") rows = rows.sort((a, b) => a.instructor.name.localeCompare(b.instructor.name))
  else if (sortBy === "name-desc") rows = rows.sort((a, b) => b.instructor.name.localeCompare(a.instructor.name))
  else if (sortBy === "workload-desc") rows = rows.sort((a, b) => b.assignedWorkload - a.assignedWorkload)
  else if (sortBy === "workload-asc") rows = rows.sort((a, b) => a.assignedWorkload - b.assignedWorkload)
  else if (sortBy === "fulfillment-desc") rows = rows.sort((a, b) => b.fulfillmentPct - a.fulfillmentPct)
  else if (sortBy === "fulfillment-asc") rows = rows.sort((a, b) => a.fulfillmentPct - b.fulfillmentPct)

  const scheduleViolations = violations.filter(v => v.type === "Schedule")

  return (
    <div id="schedule-table" className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-left select-none">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-72 bg-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  Instructor
                  <HelpTooltip
                    title="Schedule Table"
                    description={isAdmin
                      ? "Each row is an instructor. Drop chips in Fall or Winter to assign. Drag a chip back to the Courses panel to unassign, or to another row to reassign."
                      : "Each row is an instructor with their Fall and Winter course assignments."}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <InstructorFilters
                    onChange={(s, sort, rank) => {
                      setSearch(s)
                      setSortBy(sort)
                      setRankFilter(rank)
                    }}
                  />
                  {isAdmin && (
                    <button onClick={onAddInstructor} className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 font-normal">
                      Add +
                    </button>
                  )}
                </div>
              </div>
            </th>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-48 bg-orange-100 text-center">Fall</th>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-48 bg-cyan-100 text-center">Winter</th>
          </tr>
          {scheduleViolations.length > 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <ul className="space-y-0.5">
                  {scheduleViolations.map(v => (
                    <li key={v.id} className={`text-xs flex gap-2 ${v.degree === "Error" ? "text-red-600" : "text-orange-500"}`}>
                      <span className="font-semibold">[{v.degree}]</span>
                      <span>{v.message}</span>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map(({ instructor, rule }) => (
            <InstructorRow
              key={instructor.id}
              instructor={instructor}
              rule={rule}
              courses={courses}
              courseRules={courseRules}
              assignments={assignments}
              violations={violations}
              isAdmin={isAdmin}
              highlightedSectionId={highlightedSectionId}
              onHighlight={onHighlight}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
