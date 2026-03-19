import { useDroppable } from "@dnd-kit/core"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CourseRow from "./CourseRow"
import type { Course, CourseRule, Assignment } from "@/features/schedule/types"

interface Props {
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
}

export default function CoursesPanel({ courses, courseRules, assignments }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: "panel" })

  const activeCourses = courses.filter(c => {
    const rule = courseRules.find(r => r.course_code === c.code)
    return !rule?.dropped
  })

  return (
    <div
      ref={setNodeRef}
      className={`w-85 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden ${isOver ? "bg-blue-50" : "bg-white"}`}
    >
      <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm text-gray-700">
        Courses
      </div>
      <div className="overflow-y-auto flex-1">
        <Table className="[&_th]:px-3 [&_td]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-center">Code</TableHead>
              <TableHead className="text-xs text-center">Section</TableHead>
              <TableHead className="text-xs text-center">Term</TableHead>
              <TableHead className="text-xs text-center">Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCourses.map(course => {
              const rule = courseRules.find(r => r.course_code === course.code)
              return course.sections.map(section => (
                <CourseRow
                  key={section.id}
                  course={course}
                  section={section}
                  rule={rule}
                  assignments={assignments}
                />
              ))
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
