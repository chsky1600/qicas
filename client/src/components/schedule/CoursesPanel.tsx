import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CourseRow from "./CourseRow"
import type { Course, CourseRule, Assignment } from "@/features/schedule/types"

interface Props {
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  onAddCourse: () => void
}

export default function CoursesPanel({ courses, courseRules, assignments, onAddCourse }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "panel", data: { type: "panel" } })
  const [search, setSearch] = useState("")
  const [showUnassigned, setShowUnassigned] = useState(true)
  const [showAssigned, setShowAssigned] = useState(true)

  const rows = courses
    .filter(c => !courseRules.find(r => r.course_code === c.code)?.dropped)
    .sort((a, b) => a.code.localeCompare(b.code))
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

  const unassigned = rows.filter(r => !r.assigned)
  const assigned = rows.filter(r => r.assigned)

  return (
    <div
      ref={setNodeRef}
      className={`w-85 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden ${isOver ? "bg-blue-50" : "bg-white"}`}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-700">Courses</span>
        <button onClick={onAddCourse} className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700">
          Add +
        </button>
      </div>

      <div className="px-3 py-2 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
        />
      </div>

      <div className="overflow-y-auto flex-1">
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
                <div                  
                  className="w-full flex items-center focus:outline-none justify-between text-xs text-gray-500 font-semibold"
                >
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
                    <div
                      className="w-full flex items-center justify-between text-xs text-gray-500 font-semibold"
                    >
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
