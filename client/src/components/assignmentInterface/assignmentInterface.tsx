import type { useAssignmentResult } from "@/features/assignment/useAssignment"
import CoursesPanel from "./coursesPanel";
import InstructorsPanel from "./instructorsPanel";
import Toolbar from './toolbar';
import './assignmentInterface.css';

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
}: useAssignmentResult) {

 
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar />

      {/* Main content area - courses left, instructors right */}
      <div className="main-content">

        {/* Left panel - courses */}
        <CoursesPanel {...sectionState}/>

        {/* Right panel - instructors */}        
        <InstructorsPanel {...instructorState}/>
      </div>
    </div>
  );
}
