import type { Assignment, Course, Section, Instructor, CourseRule, AssignmentDegree, InstructorRule, Note} from "../../../../src/types";

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
  courseRule: CourseRule,
  assignment: Assignment | null, 
  dropped: boolean, // confirm w/ backend how dropped will work
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
  return sectionUI.courseRule.workload_fulfillment
}

// TODO: verify that this is how we want availability to work
export const getSectionAvailability = (sectionUI:SectionUI) => {
  if (sectionUI.courseRule.is_full_year) {
    return SectionAvailability.FandW
  }
  if ("W" in sectionUI.courseRule.terms_offered){
    if ("F" in sectionUI.courseRule.terms_offered){
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

export const getSectionInViolation = (sectionUI:SectionUI) => {
    if(sectionUI.assignment){
        if (sectionUI.assignment.degree == "Valid") return null
        return sectionUI.assignment.degree
    }
    return null
}


export interface SectionState {
  byId: Record<SectionId, SectionUI>;
  allIds: SectionId[];
}

export const sectionStateEmpty: SectionState = {
  byId: {},
  allIds: [],
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
  instructorRule: InstructorRule,
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
  return instructorUI.instructorRule.workload_delta
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
