import type { UseAssignmentResult } from "@/features/assignment/useAssignment"
import CoursesPanel from "./coursesPanel";
import InstructorsPanel from "./instructorsPanel";
import Toolbar from './toolbar';
import './assignmentInterface.css';
import { useState } from "react";
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import AssignedChip from "./assignedChip";

import {
  DndContext,
  DragOverlay
} from "@dnd-kit/core"

import type {
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core"
import type { SectionAvailability } from "@/features/assignment/assignment.types";

export default function AssignmentInterface({
  sectionState,
  instructorState,
  loading,
  error,
  refresh,
  updateSection,
  updateInstructor,
  makeAssignment,
  removeAssignment,
  loadState,
  dropInstructor,
  saveCourseSections,
  addSection,
  removeSection,
}: UseAssignmentResult) {
  const [heldSection, setHeldSection] = useState<number | string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    console.log(`INFO: holding section id (${event.active.id})`)
    const sectionDrag = event.active.data.current

    // if drop is not an instructor or drag is not a section, to not continue
    if (sectionDrag?.type !== "section"){
      console.log(`WARN: ${event.active.id} is not a section`)
      return
    }

    setHeldSection(sectionDrag.sectionId);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setHeldSection(null);
    const {active, over} = event
    
    //TODO - remove for more robust testing
    console.log(`INFO: dropping section id (${active.id})`)    
    console.log(`INFO: onto instructor id (${over?.id})`)

    const sectionDrag = active.data.current
    const dropLocation = over?.data.current

    // if drop is not an instructor or drag is not a section, to not continue
    if (sectionDrag?.type !== "section"){
      console.log(`WARN: ${active.id} is not a section`)
      return
    }
    
    // drop location is an instructor, make new assignment
    if (dropLocation?.type == "instructor"){
      makeAssignment(sectionDrag.sectionId, dropLocation.instructorId, dropLocation.term, sectionDrag.prevInstructorId, sectionDrag.prevTerm)
      return
    }
    // drop location is the instructor panel and the drag did not originate from the panel, remove assignment
    // second statement prevents user from unassigning by picking up course from courses panel, then dropping back into courses panel
    else if (dropLocation?.type == "panel"){
      if (sectionDrag?.source != "panel"){
        removeAssignment(sectionDrag.sectionId, sectionDrag.prevInstructorId, sectionDrag.prevTerm)
        return
      }
      console.log(`INFO: ${over?.id} originated from panel, and will not be removed by being draged to it`)
    }
    // drop location not recognised, ignore
    else {
      console.log(`WARN: ${over?.id} is not an viable drop location`)
    }
  }
 
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar 
        sectionState={sectionState} 
        instructorState={instructorState}
        updateSection={updateSection}
        updateInstructor={updateInstructor}
        loadState={loadState}
        dropInstructor={dropInstructor}
        saveCourseSections={saveCourseSections}
        addSection={addSection}
        removeSection={removeSection}
      />

      {/* Main content area - courses left, instructors right */}
      <div className="main-content">


        <DndContext
          modifiers={[snapCenterToCursor]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left panel - courses */}
          <CoursesPanel {...sectionState}/>

          {/* Right panel - instructors */}        
          <InstructorsPanel instructorState={instructorState} sectionState={sectionState}/>

          <DragOverlay dropAnimation={null}>
            {heldSection ? (
              <AssignedChip key={heldSection} {...sectionState.byId[heldSection]} prevInstructorId={null} prevTerm={sectionState.byId[heldSection]?.availability as SectionAvailability}/>
            ): null}
          </DragOverlay>        
        </DndContext>
      </div>
    </div>
  );
}