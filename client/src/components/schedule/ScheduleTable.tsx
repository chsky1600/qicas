import InstructorRow from "./InstructorRow.tsx"
import type {
  Instructor, InstructorRule, Course, CourseRule,
  Assignment, Violation
} from "@/features/schedule/types"

interface Props {
  instructors: Instructor[]
  instructorRules: InstructorRule[]
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  violations: Violation[]
}

export default function ScheduleTable({
  instructors, instructorRules, courses, courseRules,
  assignments, violations,
}: Props) {
  const activeInstructors = instructors.filter(i => {
    const rule = instructorRules.find(r => r.instructor_id === i.id)
    return !rule?.dropped
  })

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-48 bg-gray-100">Instructor</th>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-96 bg-orange-100 text-center">Fall</th>
            <th className="px-3 py-3 text-sm font-semibold text-gray-700 w-96 bg-cyan-100 text-center">Winter</th>
          </tr>
        </thead>
        <tbody>
          {activeInstructors.map(instructor => (
            <InstructorRow
              key={instructor.id}
              instructor={instructor}
              rule={instructorRules.find(r => r.instructor_id === instructor.id)}
              courses={courses}
              courseRules={courseRules}
              assignments={assignments}
              violations={violations}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
