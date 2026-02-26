import type {Schedule, Assignment, Course, Section, Instructor, CourseRule, AssignmentDegree, InstructorRule, Note} from "../../../../src/types";

//--------------------Section-UI--------------------------------

export type SectionId = string;

export interface UI_course {
  id: string,
  course: Course,
  courseRule: CourseRule,
}

export interface SectionUI {
  id: SectionId,
  course: Course,
  section: Section,
  courseRule: CourseRule | undefined, // courseRule is only undefined duing mapping, it should not ever be unassigned during process
  assignment: Assignment | null, 
  dropped: boolean, // confirm w/ backend how dropped will work
  in_violation: Violation | null,
}

export const getSectionID = (sectionUI:SectionUI): SectionId => {
  // TODO: have assignment refernce course ID instead of code
  return sectionUI.course.code + sectionUI.section.id
}

export const getSectionName = (sectionUI:SectionUI): string => {
  return sectionUI.course.name
}

// TODO Request split of Dept and code
export const getSectionCode = (sectionUI:SectionUI): string => {
  return sectionUI.course.code
}

export const getSectionYearIntroduced = (sectionUI:SectionUI): string => {
  return sectionUI.course.year_introduced
}

export const getSectionNum = (sectionUI:SectionUI): number => {
  return sectionUI.section.number
}

export const getSectionWorkloadFulfillment = (sectionUI:SectionUI) => {
  if (!sectionUI.courseRule){
    return -1 //this is an error
  }
  return sectionUI.courseRule?.workload_fulfillment
}

// TODO: verify that this is how we want availability to work
export const getSectionAvailability = (sectionUI:SectionUI) => {
  let terms_offered = []
  if (sectionUI.courseRule){
    terms_offered = sectionUI.courseRule.terms_offered
  }
  else{
    terms_offered = ["Fall"] // this is an error
  }
  
  if (sectionUI.courseRule?.is_full_year) {
    return SectionAvailability.FandW
  }
  if ("Winter" in terms_offered){
    if ("Fall" in terms_offered){
      return SectionAvailability.ForW
    }
    return SectionAvailability.W
  }
  // Presumed defualt
	return SectionAvailability.F
}


export const getSectionCapacity = (sectionUI:SectionUI) => {
  // TODO request capacity info added to DB
  //return sectionUI.section.capacity
  if (sectionUI) return 200
  return 0
}


export const getSectionAssignedTo = (sectionUI:SectionUI) => {
  return sectionUI.assignment?.instructor_id ?? null
}

export interface SectionState {
  byId: Record<SectionId, SectionUI>;
  allIds: SectionId[];
  courseToSection: Record<string, Set<SectionId>>; // way to get the list of constructed sectionId's tied to each courseId
}

export const sectionStateEmpty: SectionState = {
  byId: {},
  allIds: [],
  courseToSection: {},
};

export enum SectionAvailability {
  F = "Fall",
  W = "Winter",
  FandW = "Full Year",
  ForW = "Fall/Wint.",
}


export enum ViolationDegree {
  I = "INFO",
  W = "WARNING",
  E = "ERROR",
}

// returns coresponding tailwind background color class depending on provided ViolationDegree
export const getDegreeColor = (degree: AssignmentDegree) => {
  switch(degree) {
    case "Valid":
      return "bg-green-500";
    case "Info":
      return "bg-yellow-500";
    case "Warning":
      return "bg-orange-500";
    case "Error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export interface Violation {
  msg: string,
  degree: ViolationDegree,
}

//--------------------Instructor-UI--------------------------------

export type InstructorId = string;


export interface InstructorUI {
  id: InstructorId,
  instructor: Instructor,
  instructorRule: InstructorRule | undefined,
  assigned: Assignment[],

  fall_assigned: Set<SectionId>,
  wint_assigned: Set<SectionId>,
  // violations are either in the instructor details column, the fall term column, or the winter term column
  violations: {
    details_col_violations: Violation[],
    fall_col_violations: Violation[],
    wint_col_violations: Violation[],
  }
  dropped: boolean, // confirm w/ backend how dropped will work
}

export const getInstructorID = (instructorUI:InstructorUI): InstructorId => {
    return instructorUI.instructor.id
}

export const getInstructorName = (instructorUI:InstructorUI): string  => {
    return instructorUI.instructor.name
}

const RANK_MAP: Record<string, { short: string; long: string }> = {
  "AssistantProfessor":  { short: "Asst. Prof.", long: "Assistant Professor" },
  "Assistant Professor": { short: "Asst. Prof.", long: "Assistant Professor" },
  "AssociateProfessor":  { short: "Assoc. Prof.", long: "Associate Professor" },
  "Associate Professor": { short: "Assoc. Prof.", long: "Associate Professor" },
  "FullProfessor":       { short: "Prof.", long: "Professor" },
  "Full Professor":      { short: "Prof.", long: "Professor" },
  "ContinuingAdjunct":   { short: "Adj.", long: "Adjunct" },
  "Continuing Adjunct":  { short: "Adj.", long: "Adjunct" },
  "TermAdjunctBasic":    { short: "Adj.", long: "Adjunct" },
  "TermAdjunctSRoR":     { short: "Adj.", long: "Adjunct" },
  "TermAdjunctGRoR":     { short: "Adj.", long: "Adjunct" },
  "TeachingFellow":      { short: "T.F.", long: "Teaching Fellow" },
  "Teaching Fellow":     { short: "T.F.", long: "Teaching Fellow" },
  "ExchangeFellow":      { short: "E.F.", long: "Exchange Fellow" },
  "Exchange Fellow":     { short: "E.F.", long: "Exchange Fellow" },
  "Other":               { short: "Other", long: "Other" },
}

export const getInstructorPosition = (instructorUI:InstructorUI): { short: string; long: string } => {
  return RANK_MAP[instructorUI.instructor.rank]
}

export const getInstructorEmail = (instructorUI:InstructorUI) => {
    return instructorUI.instructor.email
}

export const getInstructorWorkload = (instructorUI:InstructorUI): number => {
  return instructorUI.instructor.workload
}

export const getInstructorWorkloadDelta = (instructorUI:InstructorUI): number => {
  return instructorUI.instructorRule?.workload_delta ?? 0.0 // this is an error, instructorRule must never be undefined outside of mapping
}

export const getInstructorNotes = (instructorUI:InstructorUI): Note[] => {
  return instructorUI.instructor.notes
}

export const populateInstructorAssignments = (instructorUI:InstructorUI): {fall_assigned: Set<SectionId>, wint_assigned: Set<SectionId>} => {
  const fall_assigned = new Set<string>()
  const wint_assigned = new Set<string>()
  
  instructorUI.assigned.forEach(assignment => {
    if(assignment.term == "Fall"){
      fall_assigned.add(assignment.course_code+assignment.section_id)
    }
    if(assignment.term == "Winter"){
      wint_assigned.add(assignment.course_code+assignment.section_id)
    }
  });

  return {fall_assigned, wint_assigned}
}

export interface InstructorState {
  byId: Record<InstructorId, InstructorUI>;
  allIds: InstructorId[];
}

export const instructorStateEmpty: InstructorState = {
  byId: {},
  allIds: [],
};

//------------------MAPPER----------------------


export function mapScheduletoState(schedule: Schedule, instructors: Instructor[], instructorRules: InstructorRule[], courses: Course[], courseRules: CourseRule[]){
  const newSectionState: SectionState = {
    byId: {},
    allIds: [],
    courseToSection: {},
  }

  const newInstructorState: InstructorState = {
    byId: {},
    allIds: [],
  }; 

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
      newSectionState.courseToSection[course.code].add(newSection.id)
    })
  })

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

  const assignments = schedule?.assignments ?? []

  assignments.forEach((assignment) => {
    // attempt to add each instructor rule to its corresponding instructor in the state
    const sectionID = assignment.course_code + assignment.section_id

    try{
      newSectionState.byId[sectionID].assignment = assignment
      newInstructorState.byId[assignment.instructor_id].assigned.push(assignment)
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