import type { Instructor, InstructorState, /*Section, SectionState*/ } from "@/features/assignment/assignment.types"
// TODO learn how to import sectionState
import InstructorRow from "./instructor"

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
            <InstructorRow {...instructor}/>
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