import type { Instructor } from "@/features/assignment/assignment.types"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"


export default function InstructorRow(instructor : Instructor)  {

  return (
    <TableRow key={instructor.id}>
      <TableCell className="text-center font-medium">{instructor.positon.short + " " + instructor.name}</TableCell>              
      <TableCell className="text-center">{(instructor.fall_assigned.length + instructor.wint_assigned.length) + "/" + instructor.workload_total}</TableCell>
      <TableCell className="text-center">Course placeholder(1)</TableCell>
      <TableCell className="text-center">Course placeholder(2)</TableCell>
      {/*TODO: dropdown menuing */}
    </TableRow>
  )
}