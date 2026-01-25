import type { useAssignmentResult } from "@/features/assignment/useAssignment"
import Course from "./course"
import Toolbar from './toolbar';
import './assignmentInterface.css';

function AssignmentInterface({
  sectionState,
  instructorState,
  loading,
  error,
  refresh,
  updateSection,
  updateInstructor,
  updateAssignment
}: useAssignmentResult) {

  //TODO functionality to sort sections
  const sectionsList = sectionState?.allIds.map(id => sectionState.byId[id])  
 
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar />

      {/* Main content area - courses left, instructors right */}
      <div className="main-content">
        {/* Left panel - courses */}
        <div className="courses-panel">
          <h2>Courses</h2>
          {/* Course list will go here 
          <ul>
            {sectionsList?.map((section) => (
              <Course {...section}/>
            ))}
          </ul>
          */}
        </div>

        {/* Right panel - instructors */}
        <div className="instructors-panel">
          <h2>Instructors</h2>
          {/* Instructor grid will go here */}
        </div>
      </div>
    </div>
  );
}
