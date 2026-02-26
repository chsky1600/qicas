import type { Section } from "@/features/assignment/assignment.types"
import { getDegreeColor } from "@/features/assignment/assignment.types"
import { useDraggable } from "@dnd-kit/core"


export default function AssignedChip(section : Section)  {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `section-${section.id}-chip`,    
    data: {
      type: "section",      
      source: "chip",
      sectionId: section.id,
      prevInstructorId: section.assigned_to,
    }
  });

  const style = {
    transform: undefined, //keeps table element in place
    opacity: isDragging ? 0.3 : 1,
  };

  const chipColor = section.in_violation ? getDegreeColor(section.in_violation) : "bg-green-500"

  return (
    <span ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${chipColor} text-white px-2 py-1 rounded text-sm`}>
        {section.course_code}
    </span>
  )
}