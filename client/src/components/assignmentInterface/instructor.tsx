import { type Instructor as InstructorType, type SectionState, SectionAvailability } from "@/features/assignment/assignment.types"
import { TableCell, TableRow } from "@/components/ui/table"
import { useDroppable } from "@dnd-kit/core";
import AssignedChip from "./assignedChip"

interface InstructorProps {
  instructor: InstructorType;
  sectionState: SectionState;
}

export default function Instructor({ instructor, sectionState }: InstructorProps) {

  const {isOver: isOverFall, setNodeRef: setNodeRefFall} = useDroppable({
    id: `instructor-${instructor.id}-F`,
    data: {
      type: "instructor",
      instructorId: instructor.id,
      term: SectionAvailability.F,
    }
  })

  const {isOver: isOverWint, setNodeRef: setNodeRefWint} = useDroppable({
    id: `instuctor-${instructor.id}-W`,
    data: {
      type: "instructor",
      instructorId: instructor.id,
      term: SectionAvailability.W,
    }
  })

  const styleFall = {
    opacity: isOverFall ? 0.5 : 1,
  }

  const styleWint = {
    opacity: isOverWint ? 0.5 : 1,
  }


  return (
    <TableRow key={instructor.id}>
      <TableCell className="text-center font-medium">
        {instructor.position.short + " " + instructor.name}
      </TableCell>
      <TableCell className="text-center w-12">
        {(instructor.fall_assigned.size + instructor.wint_assigned.size) + "/" + instructor.workload_total}
      </TableCell>

      {/* Fall Term */}
      <TableCell ref={setNodeRefFall} style={styleFall}  className="text-center bg-orange-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from(instructor.fall_assigned).map((sectionId) => {
            const section = sectionState.byId[sectionId];
            return section ? (
              <AssignedChip {...section}/>
            ) : null;
          })}
        </div>
      </TableCell>

      {/* Winter Term */}
      <TableCell ref={setNodeRefWint} style={styleWint} className="text-center bg-cyan-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from(instructor.wint_assigned).map((sectionId) => {
            const section = sectionState.byId[sectionId];
            return section ? (
              <AssignedChip {...section}/>
            ) : null;
          })}
        </div>
      </TableCell>
    </TableRow>
  )
}
