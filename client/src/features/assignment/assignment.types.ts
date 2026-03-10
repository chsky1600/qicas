import type {
  Assignment, 
  Course, 
  Section, 
  Instructor, 
  CourseRule, 
  InstructorRule, 
  Note,
  Violation,
  ViolationDegree,
  InstructorRank
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
 * Returns an updated version of the passed sSctionUI object.
 * Will preform this update: section.root.sub = value
 * 
 * @param section - SectionUI object to be updated
 * @param root - top level property of SectionUI, eg course, section, courseRule...
 * @param sub - sub level property of SectionUI, eg name...
 * @param value - value to be set
 * @returns 
 */
export function deepUpdateSection<K extends keyof SectionUI, S extends keyof NonNullable<SectionUI[K]>>(
  section: SectionUI,
  root: K,
  sub: S,
  value: NonNullable<SectionUI[K]>[S]
) {
  if (typeof section[root] !== "object" || !section[root]) {
    return section
  }
  return {
    ...section,
    [root]: {
      ...section[root],
      [sub]: value
    }
  }   
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

/**
 * Returns updated version of passed SectionUI object with modified name
 * 
 * @param sectionUI 
 * @param newName
 * @returns sectionUI, where sectionUI.course.name = newName
 */
export const setSectionName = (sectionUI:SectionUI, newName: string) => {
  if (!sectionUI) return null
  return deepUpdateSection(sectionUI, 'course', 'name', newName)
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


/**
 * Returns the individual capacity of the section, sectionUI.section.capacity
 * 
 * @param sectionUI - the UI section object which contains these values
 */
export const getSectionCapacity = (sectionUI:SectionUI) => {
  return sectionUI.section.capacity
}

/**
 * Returns the total capacity of the course, eg the sum of the capacities of all the sections
 * sectionUI.course.capacity
 * 
 * @param sectionUI - the UI section object which contains these values
 */
export const getSectionTotalCapacity = (sectionUI:SectionUI) => {
  return sectionUI.course.capacity
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

/**
 * Returns an updated version of the passed instructorUI object.
 * Will preform this update: instructor.root.sub = value
 * 
 * @param instructor - InstructorUI object to be updated
 * @param root - top level property of InstructorUI, eg instructor, instructorRule, violations...
 * @param sub - sub level property of InstructorUI, eg name, email, total workload, fall_col_violations...
 * @param value - value to be set
 * @returns 
 */
export function deepUpdateInstructor<K extends keyof InstructorUI, S extends keyof NonNullable<InstructorUI[K]>>(
  instructor: InstructorUI,
  root: K,
  sub: S,
  value: NonNullable<InstructorUI[K]>[S]
) {
  if (typeof instructor[root] !== "object" || !instructor[root]) {
    return instructor
  }
  return {
    ...instructor,
    [root]: {
      ...instructor[root],
      [sub]: value
    }
  }   
}

/**
 * Returns an updated version of the passed instructorUI object.
 * Will preform this update: instructor.root.sub = value
 * 
 * @param instructor - InstructorUI object to be updated
 * @param root - top level property of InstructorUI, eg fall_assigned, dropped...
 * @param value - value to be set
 * @returns 
 */
export function shallowUpdateInstructor<K extends keyof InstructorUI>(
  instructor: InstructorUI,
  root: K,
  value: InstructorUI[K]
) {
  return {
    ...instructor,
    [root]: value
  }   
}

export const getInstructorID = (instructorUI:InstructorUI): InstructorId => {
    return instructorUI.instructor.id
}

export const getInstructorName = (instructorUI:InstructorUI): string  => {
    return instructorUI.instructor.name
}

/**
 * Returns updated version of passed instructorUI object with modified name
 * 
 * @param instructorUI 
 * @param newName
 * @returns instructorUI, where instructorUI.instructor.name = newName
 */
export const setInstructorName = (instructorUI:InstructorUI, newName:string)  => {
  if (!instructorUI) return null
  return deepUpdateInstructor(instructorUI, 'instructor', 'name', newName)
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

/**
 * Returns updated version of passed instructorUI object with modified email
 * 
 * @param instructorUI 
 * @param newEmail 
 * @returns instructorUI, where instructorUI.instructor.email = newEmail
 */
export const setInstructorPosition = (instructorUI:InstructorUI, newRank:InstructorRank)  => {
  if (!instructorUI) return null
  return deepUpdateInstructor(instructorUI, 'instructor', 'rank', newRank)
}

export const getInstructorEmail = (instructorUI:InstructorUI) => {
    return instructorUI.instructor.email
}

/**
 * Returns updated version of passed instructorUI object with modified email
 * 
 * @param instructorUI 
 * @param newEmail 
 * @returns instructorUI, where instructorUI.instructor.email = newEmail
 */
export const setInstructorEmail = (instructorUI:InstructorUI, newEmail:string)  => {
  if (!instructorUI) return null
  return deepUpdateInstructor(instructorUI, 'instructor', 'email', newEmail)
}

export const getInstructorWorkload = (instructorUI:InstructorUI): number => {
  return instructorUI.instructor.workload
}

/**
 * Returns updated version of passed instructorUI object with modified email
 * 
 * @param instructorUI 
 * @param newWorkload
 * @returns instructorUI, where instructorUI.instructor.email = newEmail
 */
export const setInstructorWorkload = (instructorUI:InstructorUI, newWorkload:number)  => {
  if (!instructorUI) return null
  return deepUpdateInstructor(instructorUI, 'instructor', 'workload', newWorkload)
}

export const getInstructorWorkloadDelta = (instructorUI:InstructorUI): number => {
  return instructorUI.instructorRule?.workload_delta ?? 0.0 // this is an error, instructorRule must never be undefined outside of mapping
}

/**
 * Returns updated version of passed instructorUI object with modified email
 * 
 * @param instructorUI 
 * @param newWorkloadDelta
 * @returns instructorUI, where instructorUI.instructor.email = newEmail
 */
export const setInstructorWorkloadDelta = (instructorUI:InstructorUI, newWorkloadDelta:number)  => {
  if (!instructorUI) return null
  if (!instructorUI.instructorRule) return instructorUI
  return deepUpdateInstructor(instructorUI, 'instructorRule', 'workload_delta', newWorkloadDelta)
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