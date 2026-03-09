import type { SectionUI, SectionState } from "@/features/assignment/assignment.types"
import Course from "./course"
import { useDroppable } from "@dnd-kit/core";

import {
  Table,
  TableBody,
  //TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  //TableFooter
} from "@/components/ui/table"

function CoursesPanel(sectionState : SectionState)  {
  //TODO functionality to sort sections, separate into distinct sections
  const sectionsList: SectionUI[] = sectionState.allIds
    .map(id => sectionState.byId[id])
    .filter(section => !section.dropped) // only show sections that are not dropped
    

  // section panel is receptical for unassigning sections
  // when section dragged here, the section is unassigned
  const {isOver: isOverFall, setNodeRef: setNodeRefFall} = useDroppable({
      id: `section-panel`,
      data: {
        type: "panel",
      }
    })
  
  const styleReturn = {
    opacity: isOverFall ? 0.5 : 1,
  }

  return (
    <div className="courses-panel" ref={setNodeRefFall} style={styleReturn}>

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
            <Course key={section.id+"_in_panel"} {...section}/>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default CoursesPanel