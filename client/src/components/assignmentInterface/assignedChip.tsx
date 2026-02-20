import type { Section } from "@/features/assignment/assignment.types"
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

  return (
    <span key={section.id} ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-green-500 text-white px-2 py-1 rounded text-sm">
        {section.code}
    </span>
  )
}