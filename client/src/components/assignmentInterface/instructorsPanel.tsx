import type { Instructor, InstructorState, /*Section, SectionState*/ } from "@/features/assignment/assignment.types"
// TODO learn how to import sectionState

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  //TableFooter
} from "@/components/ui/table"

function InstructorsPanel(instructorState : InstructorState)  {
  //TODO functionality to sort instructors, separate into distinct instructors
  const instructorsList: Instructor[] = instructorState.allIds.map(id => instructorState.byId[id])  

  return (
    <div className="instructors-panel">

      <h2>Instructors</h2>
      <Table>
        {/*<TableCaption>A list of your recent invoices.</TableCaption>*/}
        <TableHeader >
          <TableRow>
            <TableHead className="text-center text-base">Name</TableHead>
            <TableHead className="text-center text-base">Workload</TableHead>
            <TableHead className="text-center text-base">Fall</TableHead>
            <TableHead className="text-center text-base">Winter</TableHead>
            {/*<span className="sm:hidden">Cap.</span>*/}
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructorsList.map((instructor) => (
            <TableRow key={instructor.id}>
              <TableCell className="text-center font-medium">{instructor.positon.short + " " + instructor.name}</TableCell>              
              <TableCell className="text-center">{(instructor.fall_assigned.length + instructor.wint_assigned.length) + "/" + instructor.workload_total}</TableCell>
              <TableCell className="text-center">Course placeholder(1)</TableCell>
              <TableCell className="text-center">Course placeholder(2)</TableCell>
              {/*TODO: dropdown menuing */}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/*
      <ul>
        {sectionsList?.map((section) => (
          <Course {...section}/>
        ))}
      </ul>
      */}

    </div>
  )
}

export default InstructorsPanel