import { useDraggable } from "@dnd-kit/core"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Course, Section, CourseRule, Assignment, SectionDragData } from "@/features/schedule/types"

function getAvailability(rule?: CourseRule): string {
  if (!rule) return "—"
  if (rule.is_full_year) return "Full Year"
  if (rule.terms_offered.includes("Fall") && rule.terms_offered.includes("Winter")) return "Fall/Wint."
  return rule.terms_offered[0] ?? "—"
}

interface Props {
  course: Course
  section: Section
  rule: CourseRule | undefined
  assignments: Assignment[]
}

export default function CourseRow({ course, section, rule, assignments }: Props) {
  const assignment = assignments.find(a => a.section_id === section.id)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `panel-${section.id}`,
    data: {
      type: "section", source: "panel",
      sectionId: section.id,
      courseCode: course.code,
      assignmentId:null,
      prevInstructorId: assignment?.instructor_id ?? null,
      prevTerm: assignment?.term ?? null,
    } satisfies SectionDragData,
  })

  return (
    <TableRow
      ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, transform: undefined, cursor: "grab" }}
    >
      <TableCell className="text-center">
        <span className="bg-grey-100 rounded-full px-2 py-0.5 text-xs font-medium">{course.code}</span>
      </TableCell>
      <TableCell className="text-center text-sm">{section.number}</TableCell>
      <TableCell className="text-center text-sm">{getAvailability(rule)}</TableCell>
      <TableCell className="text-center text-sm">{section.capacity}</TableCell>
    </TableRow>
  )
}
