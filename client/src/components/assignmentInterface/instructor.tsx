import type { Instructor as InstructorType, SectionState } from "@/features/assignment/assignment.types"
import { TableCell, TableRow } from "@/components/ui/table"

interface InstructorProps {
  instructor: InstructorType;
  sectionState: SectionState;
}

export default function Instructor({ instructor, sectionState }: InstructorProps) {
  return (
    <TableRow key={instructor.id}>
      <TableCell className="text-center font-medium">
        {instructor.position.short + " " + instructor.name}
      </TableCell>
      <TableCell className="text-center w-12">
        {(instructor.fall_assigned.length + instructor.wint_assigned.length) + "/" + instructor.workload_total}
      </TableCell>
      <TableCell className="text-center bg-orange-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {instructor.fall_assigned.map((sectionId) => {
            const section = sectionState.byId[sectionId];
            return section ? (
              <span key={sectionId} className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                {section.dept} {section.code}
              </span>
            ) : null;
          })}
        </div>
      </TableCell>
      <TableCell className="text-center bg-cyan-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {instructor.wint_assigned.map((sectionId) => {
            const section = sectionState.byId[sectionId];
            return section ? (
              <span key={sectionId} className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                {section.dept} {section.code}
              </span>
            ) : null;
          })}
        </div>
      </TableCell>
    </TableRow>
  )
}
