import { 
  getSectionCode,
  getSectionNum,
  getSectionCapacity,
  getSectionAssignedTo, type SectionUI, 
  getSectionAvailability} from "@/features/assignment/assignment.types"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { useDraggable } from "@dnd-kit/core"


export default function Course(section : SectionUI)  {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `section-${section.id}-row`,     
    data: {
      type: "section",
      source: "panel",
      sectionId: section.id,
      prevInstructorId: getSectionAssignedTo(section),
    }
  });

  const style = {
    transform: undefined, //keeps table element in place
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TableCell key="course_code_column" className="text-center font-medium">{getSectionCode(section)}</TableCell>              
      <TableCell key="section_column" className="text-center">{getSectionNum(section)}</TableCell>
      <TableCell key="avail_column" className="text-center">{getSectionAvailability(section)}</TableCell>
      <TableCell key="capacity_column" className="text-center">{getSectionCapacity(section)}</TableCell>
      {/*TODO: dropdown menuing */}
    </TableRow>
  )
}