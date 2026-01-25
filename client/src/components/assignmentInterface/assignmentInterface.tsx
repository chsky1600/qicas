import Toolbar from './toolbar';
import './assignmentInterface.css';

export default function AssignmentInterface() {
  return (
    <div className="assignment-interface">
      {/* Use the Toolbar component */}
      <Toolbar />

      {/* Main content area - courses left, instructors right */}
      <div className="main-content">
        {/* Left panel - courses */}
        <div className="courses-panel">
          <h2>Courses</h2>
          {/* Course list will go here */}
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
