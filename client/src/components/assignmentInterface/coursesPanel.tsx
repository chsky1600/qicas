import type { Section, SectionState } from "@/features/assignment/assignment.types"
import Course from "./course"

import {
  Table,
  TableBody,
  //TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  //TableFooter
} from "@/components/ui/table"

function CoursesPanel(sectionState : SectionState)  {
  //TODO functionality to sort sections, separate into distinct sections
  const sectionsList: Section[] = sectionState.allIds.map(id => sectionState.byId[id])  

  return (
    <div className="courses-panel">

      <h2>Courses</h2>
      <Table>
        {/*<TableCaption>A list of your recent invoices.</TableCaption>*/}
        <TableHeader >
          <TableRow>
            <TableHead className="text-center text-xs">Course Code</TableHead>
            <TableHead className="text-center text-xs">Section #</TableHead>
            <TableHead className="text-center text-xs">Availability</TableHead>
            <TableHead className="text-center text-xs">Capacity</TableHead>
            {/*<span className="sm:hidden">Cap.</span>*/}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sectionsList.map((section) => (
            <Course {...section}/>
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

export default CoursesPanel