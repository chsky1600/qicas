import type { UseAssignmentResult } from "@/features/assignment/useAssignment"
import CoursesPanel from "./coursesPanel";
import InstructorsPanel from "./instructorsPanel";
import Toolbar from './toolbar';
import './assignmentInterface.css';
import { useState } from "react";
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import {
  DndContext,
  DragOverlay
} from "@dnd-kit/core"

import type {
  DragEndEvent,
  DragStartEvent,
} from "@dnd-kit/core"

export default function AssignmentInterface({
  sectionState,
  instructorState,
  loading,
  error,
  refresh,
  updateSection,
  updateInstructor,
  makeAssignment,
  removeAssignment
}: UseAssignmentResult) {
  const [heldSection, setHeldSection] = useState<number | string | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    setHeldSection(event.active.id);
    //TODO - remove for more robust testing
    console.log(`INFO: holding section id (${event.active.id})`)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setHeldSection(null);
    const {active, over} = event
    
    //TODO - remove for more robust testing
    console.log(`INFO: dropping section id (${active.id})`)    
    console.log(`INFO: onto instructor id (${over?.id})`)

    const sectionDrag = active.data.current
    const instructorDrop = over?.data.current

    // if drop is not an instructor or drag is not a section, to not continue
    if (instructorDrop?.type !== "instructor" || sectionDrag?.type !== "section"){
      console.log(`WARN: ${active.id} is not a section or ${over?.id} is not an instructor`)
      return
    }
    
    // Call the assignment function with all the neccisary data
    makeAssignment(sectionDrag.sectionId, instructorDrop.instructorId, instructorDrop.term, sectionDrag.prevInstructorId)
  }
 
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar />

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

          <DragOverlay>
            {heldSection ? (
              <span key={heldSection}  className="bg-green-500 text-white px-2 py-1 rounded text-sm content-center">
                {sectionState.byId[heldSection].code}
              </span>
            ): null}
          </DragOverlay>        
        </DndContext>
      </div>
    </div>
  );
}