import{ 
  type SectionUI, 
  getSectionCode, 
  getSectionNum,
  getDegreeColor,
  getSectionAssignedTo,
  getSectionAssignedId
} from "@/features/assignment/assignment.types"
import { useDraggable } from "@dnd-kit/core"


export default function AssignedChip(section : SectionUI)  {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `section-${section.id}-chip`,    
    data: {
      type: "section",      
      source: "chip",
      sectionId: section.id,
      prevAssignedId: getSectionAssignedId(section),
      prevInstructorId: getSectionAssignedTo(section),
    }
  });

  const style = {
    transform: undefined, //keeps table element in place
    opacity: isDragging ? 0.3 : 1,
  };

  const chipColor = section.in_violation ? getDegreeColor(section.in_violation.degree) : "bg-green-500"

  return (
    <span ref={setNodeRef} style={style} {...listeners} {...attributes} className={`${chipColor} text-white px-2 py-1 rounded text-sm`}>
        {getSectionCode(section)}-{getSectionNum(section)}
    </span>
  )
}