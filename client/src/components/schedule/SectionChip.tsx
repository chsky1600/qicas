import { useDraggable } from "@dnd-kit/core"
import type { Term, ViolationDegree, SectionDragData } from "@/features/schedule/types"

const VIOLATION_COLOUR: Record<ViolationDegree, string> = {
  Error: "bg-red-400", Warning: "bg-orange-400", Info: "bg-blue-400",
}

interface Props {
  courseCode: string
  sectionId: string
  sectionNum: number
  isFullYear: boolean
  isExternal: boolean
  assignmentId: string
  prevInstructorId: string
  prevTerm: Term
  inViolation: ViolationDegree | null
  isAdmin: boolean
}

export default function SectionChip({
  courseCode, sectionId, sectionNum, isFullYear, isExternal,
  assignmentId, prevInstructorId, prevTerm, inViolation, isAdmin,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip-${sectionId}-${prevTerm}`,
    data: {
      type: "section", source: "chip",
      sectionId, courseCode, assignmentId, prevInstructorId, prevTerm,
    } satisfies SectionDragData,
  })

  const suffix = isFullYear ? (prevTerm === "Fall" ? "A" : "B") : ""
  const colour = inViolation ? VIOLATION_COLOUR[inViolation] : "bg-green-500"
  // Tailwind decoration for courses paid for externally
  const externalDecoration = isExternal ? "outline-dashed outline-2 outline-offset-1 outline-blue-500" : "text-white"

  return (
    <span
      ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, transform: undefined }}
      className={`${colour} ${externalDecoration} text-white px-2 py-1 rounded text-sm ${isAdmin ? "cursor-grab" : "cursor-default"} select-none`}
    >
      {courseCode}{suffix}-{sectionNum}
    </span>
  )
}
