import type { UseAssignmentResult } from "@/features/assignment/useAssignment"
import CoursesPanel from "./coursesPanel";
import InstructorsPanel from "./instructorsPanel";
import Toolbar from './toolbar';
import './assignmentInterface.css';
import { useState } from "react";
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import {
  DndContext,
  closestCenter,
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
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setHeldSection(null);
    const {active, over} = event

    console.log(active)
    console.log(active.id)
    console.log(over)
    console.log(over?.id)

    /*
    // TODO - assignment functionality
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
    */
  }
 
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar />

      {/* Main content area - courses left, instructors right */}
      <div className="main-content">


        <DndContext
          modifiers={[snapCenterToCursor]}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left panel - courses */}
          <CoursesPanel {...sectionState}/>

          {/* Right panel - instructors */}        
          <InstructorsPanel {...instructorState}/>

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
