import { useDraggable } from "@dnd-kit/core"
import { TableCell, TableRow } from "@/components/ui/table"
import type { Course, Section, CourseRule, Assignment, SectionDragData } from "@/features/schedule/types"

function getAvailability(rule?: CourseRule): string {
  if (!rule) return "—"
  if (rule.is_full_year) return "Full Year"
  if (rule.terms_offered.includes("Fall") && rule.terms_offered.includes("Winter")) return "Fall/Wint."
  return rule.terms_offered[0] ?? "—"
}

function getWorkload(rule?: CourseRule): string {
  if (!rule || rule.workload_fulfillment == null) return "—"
  return rule.workload_fulfillment.toString()
}

interface Props {
  course: Course
  section: Section
  rule: CourseRule | undefined
  assignments: Assignment[]
  isAdmin: boolean
  highlighted: boolean
  onHighlight: (sectionId: string | null) => void
}

export default function CourseRow({ course, section, rule, assignments, isAdmin, highlighted, onHighlight }: Props) {
  const assignment = assignments.find(a => a.section_id === section.id)

  // Tailwind decoration for courses paid for externally
  const externalDecoration = rule?.is_external ? "underline decoration-dashed decoration-blue-500 underline-offset-1.5 decoration-2" : ""

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

  const chipName = course.code + "-" + section.number

  return (
    <TableRow
      ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, transform: undefined, cursor: isAdmin ? "grab" : "default" }}
      className={highlighted ? "bg-yellow-100" : ""}
      onMouseEnter={() => onHighlight(section.id)}
      onMouseLeave={() => onHighlight(null)}
    >
      <TableCell className="text-center">
        
        <span className={`bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm ${externalDecoration}`}>
          {chipName}
        </span>
      </TableCell>
      <TableCell className="text-center text-sm">{getAvailability(rule)}</TableCell>
      <TableCell className="text-center text-sm">{getWorkload(rule)}</TableCell>
      <TableCell className="text-center text-sm">{section.capacity}</TableCell>
    </TableRow>
  )
}
