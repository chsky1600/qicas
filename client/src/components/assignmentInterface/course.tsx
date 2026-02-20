import type { Section } from "@/features/assignment/assignment.types"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { useDraggable } from "@dnd-kit/core"


export default function Course(section : Section)  {
  const {attributes, listeners, setNodeRef, isDragging} = useDraggable({
    id: `section-${section.id}-row`,     
    data: {
      type: "section",
      source: "panel",
      sectionId: section.id,
      prevInstructorId: section.assigned_to,
    }
  });

  const style = {
    transform: undefined, //keeps table element in place
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} {...listeners} {...attributes} key={section.id}>
      <TableCell className="text-center font-medium">{section.code}</TableCell>              
      <TableCell className="text-center">{section.section_num}</TableCell>
      <TableCell className="text-center">{section.availability}</TableCell>
      <TableCell className="text-center">{section.capacity}</TableCell>
      {/*TODO: dropdown menuing */}
    </TableRow>
  )
}