import type {
  Schedule, 
  Course, 
  Instructor, 
  CourseRule, 
  InstructorRule
} from "../../../../src/types";

import type { 
  SectionState,
  InstructorState,
  InstructorUI,
  SectionUI 
} from "./assignment.types";

import { 
  getSectionID 
} from "./assignment.types";

//------------------MAPPER----------------------
/**
 * Converts raw backend data from 5 endpoints into the normalised frontend state
 * shapes (SectionState and InstructorState) that the rest of the app consumes.
 *
 * High-level steps:
 *  0. create new Section and Instructor States
 *  1. Insert each Instructor into the instructor state
 *  2. Assign each Instructor rule with its coresponding Instructor. 
 *     Assignments are preformed in O(1) using instructor.id lookup
 *  3. For each course, insert each section into the instructor state
 *     Also build a map between courses and sections for O(n) lookup
 *  4. Assign each course rule with its coresponding section. 
 *     use the map constructed in step 3 for quick assignment
 *  5. Assign each assignment to its coresponding section and instructor
 */
export function mapScheduletoState(schedule: Schedule, instructors: Instructor[], instructorRules: InstructorRule[], courses: Course[], courseRules: CourseRule[]){
  
  // Step 0: create new Section and Instructor States
  const newSectionState: SectionState = {
    byId: {},
    allIds: [],
    courseToSection: {},
  }

  const newInstructorState: InstructorState = {
    byId: {},
    allIds: [],
  }; 

  // Step 1: Insert each Instructor into the instructor state
  instructors.forEach((instructor) => {
    // craft instructor
    const newInstructor: InstructorUI = {
      id: instructor.id,
      instructor:instructor,
      instructorRule: undefined,
      assigned: [],
      fall_assigned: new Set<string>(),
      wint_assigned: new Set<string>(),
      violations: {
        details_col_violations: [],
        fall_col_violations: [],
        wint_col_violations: [],
      },
      dropped: false //TODO determine how this should be mapped
    }
    // Add to state
    newInstructorState.byId[newInstructor.id] = newInstructor
    newInstructorState.allIds.push(newInstructor.id)
  })

  // Step 2: Align each Instructor rule with its coresponding Instructor 
  instructorRules.forEach((instructorRule) => {
    // attempt to add each instructor rule to its corresponding instructor in the state
    try{
      newInstructorState.byId[instructorRule.instructor_id].instructorRule = instructorRule
    }
    catch (error){
      //TODO error processing
      console.log(`ERROR: Instructor rule ${instructorRule.id} is tied to instructor ${instructorRule.instructor_id} which is not mapped.`)
      console.log(`ERROR: ${error}`)
    }
  })

  // Step 3: Insert each Course & Section into the section state
  courses.forEach((course) => {    
    if (course.sections.length == 0){
      course.sections = [{id:"section1",number:1}]
    }

    course.sections.forEach((section) => { 
      const newSection: SectionUI = {
        id: "", // placeholder
        course: course,
        section: section,
        courseRule: undefined,
        assignment: null, // initially unnassigned
        dropped: false, 
        in_violation: null,
      }      

      // populate id
      newSection.id = getSectionID(newSection)

      // Add to state
      newSectionState.byId[newSection.id] = newSection
      newSectionState.allIds.push(newSection.id)
      // add to Course -> section mapper
      if (!newSectionState.courseToSection[course.code]) {
        newSectionState.courseToSection[course.code] = new Set<string>();
      }
      newSectionState.courseToSection[course.code].add(newSection.id)
    })
  })

  // Step 4: Align each Course rule with its coresponding section
  // uses the constructed courseToSection map to find each section tied to a course
  courseRules.forEach((courseRule) => {
    // attempt to add each instructor rule to its corresponding instructor in the state

    const sectionIDs = newSectionState.courseToSection[courseRule.course_code]

    // attempt to add each course rule to a corresponding section in the state
    sectionIDs.forEach((sectionID) => {
      try{
        newSectionState.byId[sectionID].courseRule = courseRule
      }
      catch (error){
        //TODO error processing
        console.log(`ERROR: Course rule ${courseRule.id} is tied to course ${courseRule.course_code} and section ${sectionID} which is not mapped.`)
        console.log(`ERROR: ${error}`)
      }
    })
  })

  // if schedule undefined, assignments is null
  const assignments = schedule?.assignments ?? []

  //Step 5: Insert each Assignment into its coresponding 
  assignments.forEach((assignment) => {
    // attempt to add each instructor rule to its corresponding instructor in the state
    const sectionID = assignment.course_code + assignment.section_id

    try{
      newSectionState.byId[sectionID].assignment = assignment
      newInstructorState.byId[assignment.instructor_id].assigned.push(assignment)
      if (assignment.term == "Fall"){
        newInstructorState.byId[assignment.instructor_id].fall_assigned.add(sectionID)
      }
      if (assignment.term == "Winter"){
        newInstructorState.byId[assignment.instructor_id].wint_assigned.add(sectionID)
      }
    }
    catch (error){
      //TODO error processing
      console.log(`ERROR: Assignment ${assignment.id} is tied to an instructor ${assignment.instructor_id} or course+section ${sectionID} which is not mapped.`)
      console.log(`ERROR: ${error}`)
    }    
  })

  return {
    sectionState: newSectionState,
    instructorState: newInstructorState
  }
}