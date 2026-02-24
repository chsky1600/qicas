import type { Instructor as InstructorType, InstructorState, SectionState} from "@/features/assignment/assignment.types"
// TODO learn how to import sectionState

import Instructor from "./instructor"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  //TableFooter
} from "@/components/ui/table"

interface InstructorsPanelProps {
  instructorState: InstructorState;
  sectionState: SectionState;
}

function InstructorsPanel({instructorState, sectionState}: InstructorsPanelProps)  {
  //TODO functionality to sort instructors, separate into distinct instructors
  const instructorsList: InstructorType[] = instructorState.allIds.map(id => instructorState.byId[id]) 

  return (
    <div className="flex-1 bg-white p-4 overflow-y-auto">

      <h2>Instructors</h2>
      <Table>
        {/*<TableCaption>A list of your recent invoices.</TableCaption>*/}
        <TableHeader >
          <TableRow>
            <TableHead className="text-center text-base w-120">Instructor</TableHead>
            <TableHead className="text-center text-base bg-orange-100 w-200">Fall</TableHead>
            <TableHead className="text-center text-base bg-cyan-100 w-200">Winter</TableHead>
            {/*<span className="sm:hidden">Cap.</span>*/}
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructorsList.map((instructor) => (
            <Instructor
              key={instructor.id}
              instructor={instructor}
              sectionState={sectionState}
            />
          ))}
        </TableBody>
      </Table>

    </div>
  )
}

export default InstructorsPanel