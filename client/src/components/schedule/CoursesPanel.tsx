import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CourseRow from "./CourseRow"
import CourseFilters from "./CourseFilters"
import type { CourseSortBy } from "./CourseFilters"
import type { Course, CourseRule, Assignment } from "@/features/schedule/types"
import { HelpTooltip } from "../ui/help-tooltip"

function getAvailability(rule?: CourseRule): string {
  if (!rule) return "—"
  if (rule.is_full_year) return "Full Year"
  if (rule.terms_offered.includes("Fall") && rule.terms_offered.includes("Winter")) return "Fall/Wint."
  return rule.terms_offered[0] ?? "—"
}

interface Props {
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  onAddCourse: () => void
  isAdmin: boolean
}

export default function CoursesPanel({ courses, courseRules, assignments, onAddCourse, isAdmin }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "panel", data: { type: "panel" } })
  const [search, setSearch] = useState("")
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [showAssigned, setShowAssigned] = useState(true)
  const [sortBy, setSortBy] = useState<CourseSortBy>("code-asc")
  const [availFilter, setAvailFilter] = useState<Set<string>>(new Set())

  let rows = courses
    .filter(c => !courseRules.find(r => r.course_code === c.code)?.dropped)
    .flatMap(course => {
      const rule = courseRules.find(r => r.course_code === course.code)
      return [...course.sections]
        .sort((a, b) => a.number - b.number)
        .map(section => ({
          course, section, rule,
          assigned: assignments.some(a => a.section_id === section.id),
        }))
    })
    .filter(r => r.course.code.toLowerCase().includes(search.toLowerCase()))
    .filter(r => availFilter.size === 0 || availFilter.has(getAvailability(r.rule)))

  if (sortBy === "code-asc") rows = rows.sort((a, b) => a.course.code.localeCompare(b.course.code))
  else if (sortBy === "code-desc") rows = rows.sort((a, b) => b.course.code.localeCompare(a.course.code))
  else if (sortBy === "cap-asc") rows = rows.sort((a, b) => a.section.capacity - b.section.capacity)
  else if (sortBy === "cap-desc") rows = rows.sort((a, b) => b.section.capacity - a.section.capacity)

  const unassigned = rows.filter(r => !r.assigned)
  const assigned = rows.filter(r => r.assigned)

  return (
    <div
      id="courses-panel"
      ref={setNodeRef}
      className={`w-85 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden ${isOver ? "bg-blue-50" : "bg-white"}`}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-gray-700">Courses</span>
          <HelpTooltip
            title="Courses Panel"
            description="Lists all active courses for the year. Drag a chip onto an instructor's Fall or Winter cell to assign it. Drag it back here to unassign."
          />
        </div>
        {isAdmin && (
          <button id="courses-panel-add" onClick={onAddCourse} className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700">
            Add +
          </button>
        )}
      </div>

      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2">
        <input
          id="courses-panel-search"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
        />
        <CourseFilters
          onChange={(sort, avail) => {
            setSortBy(sort)
            setAvailFilter(avail)
          }}
        />
      </div>

      <div id="courses-panel-list" className="overflow-y-auto flex-1">
        <Table className="[&_th]:px-3 [&_td]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-center">Course Code</TableHead>
              <TableHead className="text-xs text-center">Section #</TableHead>
              <TableHead className="text-xs text-center">Availability</TableHead>
              <TableHead className="text-xs text-center">Cap.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableCell onClick={() => setShowUnassigned(v => !v)} colSpan={4} className="py-1 px-3">
                <div className="w-full flex items-center focus:outline-none justify-between text-xs text-gray-500 font-semibold">
                  <span>Unassigned Courses ({unassigned.length})</span>
                  <span>{showUnassigned ? "▲" : "▼"}</span>
                </div>
              </TableCell>
            </TableRow>
            {showUnassigned && unassigned.map(({ course, section, rule }) => (
              <CourseRow key={section.id} course={course} section={section} rule={rule} assignments={assignments} />
            ))}

            {assigned.length > 0 && (
              <>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableCell onClick={() => setShowAssigned(v => !v)} colSpan={4} className="py-1 px-3">
                    <div className="w-full flex items-center justify-between text-xs text-gray-500 font-semibold">
                      <span>Assigned Courses ({assigned.length})</span>
                      <span>{showAssigned ? "▲" : "▼"}</span>
                    </div>
                  </TableCell>
                </TableRow>
                {showAssigned && assigned.map(({ course, section, rule }) => (
                  <CourseRow key={section.id} course={course} section={section} rule={rule} assignments={assignments} />
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
