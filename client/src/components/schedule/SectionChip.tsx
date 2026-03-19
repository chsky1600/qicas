import { useDraggable } from "@dnd-kit/core"
import type { Term, ViolationDegree, SectionDragData } from "@/features/schedule/types"

const CHIP_COLORS = [
  "bg-rose-400", "bg-blue-500", "bg-amber-500", "bg-green-600",
  "bg-purple-500", "bg-teal-500", "bg-orange-500", "bg-indigo-500",
]
function courseColor(code: string) {
  let h = 0
  for (const c of code) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length]
}
const VIOLATION_COLOR: Record<ViolationDegree, string> = {
  Error: "bg-red-500", Warning: "bg-orange-400", Info: "bg-blue-400",
}

interface Props {
  courseCode: string
  sectionId: string
  sectionNum: number
  isFullYear: boolean
  assignmentId: string
  prevInstructorId: string
  prevTerm: Term
  inViolation: ViolationDegree | null
}

export default function SectionChip({
  courseCode, sectionId, sectionNum, isFullYear,
  assignmentId, prevInstructorId, prevTerm, inViolation,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chip-${sectionId}-${prevTerm}`,
    data: {
      type: "section", source: "chip",
      sectionId, courseCode, assignmentId, prevInstructorId, prevTerm,
    } satisfies SectionDragData,
  })

  const suffix = isFullYear ? (prevTerm === "Fall" ? "A" : "B") : ""
  const color = inViolation ? VIOLATION_COLOR[inViolation] : courseColor(courseCode)

  return (
    <span
      ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, transform: undefined }}
      className={`${color} text-white px-2 py-1 rounded text-sm cursor-grab select-none`}
    >
      {courseCode}{suffix}-{sectionNum}
    </span>
  )
}
