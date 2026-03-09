import type {
  Assignment, 
  Course, 
  Section, 
  Instructor, 
  CourseRule, 
  InstructorRule, 
  Note,
  Violation,
  ViolationDegree
} from "../../../../src/types";

// ----------------- Violation Types ------------------------

// returns coresponding tailwind background color class depending on provided ViolationDegree
export const getDegreeColor = (degree: ViolationDegree) => {
  switch(degree) {
    case null:
      return "bg-green-500";
    case "Info":
      return "bg-blue-400";
    case "Warning":
      return "bg-yellow-400";
    case "Error":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

//--------------------Section-UI--------------------------------


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

export type SectionId = string;

export interface courseUI {
  id: string,
  course: Course,
  courseRule: CourseRule,
}

export interface SectionUI {
  id: SectionId,
  course: Course,
  section: Section,
  courseRule: CourseRule | undefined, // a course may have no rule attached to it
  assignment: Assignment | null, 
  dropped: boolean,
  in_violation: Violation | null,  // null implies not in violation of any rules
}

/**
 * Returns the id of the frontend section object, which is the concatination of the
 * course code of the backend course object, and the id of the backend section object
 * 
 * @param sectionUI - the UI section object which contains these values
 * @returns concatinated id
 */
export const getSectionID = (sectionUI:SectionUI): SectionId => {
  return sectionUI.course.code + sectionUI.section.id
}

/**
 * Returns the id of the backend section object, aka SectionUI.section.id, NOT SectionUI.id
 * 
 * @param sectionUI - the UI section object which contains these values
 */
export const getBSectionID = (sectionUI:SectionUI): SectionId => {
  return sectionUI.section.id
}

/**
 * Returns the id of the backend course object, aka SectionUI.course.id, NOT SectionUI.id
 * 
 * @param sectionUI - the UI section object which contains these values
 */
export const getCourseID = (sectionUI:SectionUI): SectionId => {
  return sectionUI.course.id
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

export const getSectionViolationDegree = (sectionUI:SectionUI): string | null => {
  return sectionUI.in_violation?.degree ?? null
}

export const getSectionWorkloadFulfillment = (sectionUI:SectionUI) => {
  if (!sectionUI.courseRule){
    return -1 //this is an error
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

export const getSectionAssignedId = (sectionUI:SectionUI) => {
  return sectionUI.assignment?.id ?? null
}

export const getSectionAssignedTo = (sectionUI:SectionUI) => {
  return sectionUI.assignment?.instructor_id ?? null
}

export enum SectionAvailability {
  F = "Fall",
  W = "Winter",
  FandW = "Full Year",
  ForW = "Fall/Wint.",
}


//--------------------Instructor-UI--------------------------------

export type InstructorId = string;

export interface InstructorState {
  byId: Record<InstructorId, InstructorUI>;
  allIds: InstructorId[];
}

export const instructorStateEmpty: InstructorState = {
  byId: {},
  allIds: [],
};


export interface InstructorUI {
  id: InstructorId,
  instructor: Instructor,
  instructorRule: InstructorRule | undefined,  // an instructor may have no rule attached to it
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

// return the completed total workload
export const getInstructorWorkloadTotal = (instructorUI:InstructorUI): number => {
  return getInstructorWorkload(instructorUI) + getInstructorWorkloadDelta(instructorUI)
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

// Snapshot Types
export interface Snapshot {
  id: string,
  name: string,
  date: string // "YYYY-MM-DD",
  sectionState: SectionState,
  instructorState: InstructorState,
}

/* Mock Data --- IGNORE ---


// Snapshot Types
export interface Snapshot {
  id: string,
  name: string,
  date: string // "YYYY-MM-DD",
  sectionState: SectionState,
  instructorState: InstructorState,
}

/* Mock Data --- IGNORE ---

export const sectionStateMock: SectionState = {
  byId: {
    "0": {
      id: "0",
      name: "intro to french (1)",
      dept: "FREN",
      code: "101",
      year_introduced: "xx",
      section_num: 1,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
    "1": {
      id: "1",
      name: "intro to french (2)",
      dept: "FREN",
      code: "102",
      year_introduced: "xx",
      section_num: 2,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: ViolationDegree.I,
    },
    "2": {
      id: "2",
      name: "intro to french (3)",
      dept: "FREN",
      code: "103",
      year_introduced: "xx",
      section_num: 3,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: ViolationDegree.W,
    },
    "3": {
      id: "3",
      name: "intro to french (4)",
      dept: "FREN",
      code: "104",
      year_introduced: "xx",
      section_num: 4,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
    "4": {
      id: "4",
      name: "intro to french (5)",
      dept: "FREN",
      code: "105",
      year_introduced: "xx",
      section_num: 5,
      workload: 1,
      availability: SectionAvailability.FandW,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
  },
  allIds: ["0", "1", "2", "3", "4"],
};

export const instructorStateMock: InstructorState = {
  byId: {
    "0": {
      id: "0",
      name: "John Robbin",
      position: {short: "Prof.", long: "Professor"},
      email: "jr@queensu.ca",
      workload_total: 4,
      modifier: 0,
      notes: "",
      fall_assigned: new Set<string>(["0", "1", "2", "3","4"]),
      wint_assigned: new Set<string>(["4"]),
      dropped: false,
      violations: {
        details_col_violations: [
          {msg: "This instructor has exceeded their workload", degree: ViolationDegree.W},
        ],
        fall_col_violations: [
          {msg: "test Info message, tied to section id '1'", degree: ViolationDegree.I},
          {msg: "test warning message, tied to section id '2'", degree: ViolationDegree.W},
        ],
        wint_col_violations: [
        ],
      }
    },
    "1": {
      id: "1",
      name: "Erin Erika",
      position: {short: "T.F.", long: "Teaching Fellow"},
      email: "ee@queensu.ca",
      workload_total: 2,
      modifier: 0,
      notes: "",
      fall_assigned: new Set<string>(),
      wint_assigned: new Set<string>(),
      dropped: false,
      violations: {
        details_col_violations: [
        ],
        fall_col_violations: [
        ],
        wint_col_violations: [
          //{msg: "test10", degree: ViolationDegree.I},
        ],
      }
    },
  },
  allIds: ["0", "1"],
};
*/