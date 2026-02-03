import type { Section } from "@/features/assignment/assignment.types"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"


export default function Course(section : Section)  {

  return (
    <TableRow key={section.id}>
      <TableCell className="text-center font-medium">{section.code}</TableCell>              
      <TableCell className="text-center">{section.section_num}</TableCell>
      <TableCell className="text-center">{section.availability}</TableCell>
      <TableCell className="text-center">{section.capacity}</TableCell>
      {/*TODO: dropdown menuing */}
    </TableRow>
  )
}