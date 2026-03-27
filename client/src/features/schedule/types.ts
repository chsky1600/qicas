// ── Backend types (mirror the API exactly) ────────────────────────────────────

export type Term = "Fall" | "Winter"

export type ViolationDegree = "Info" | "Warning" | "Error"

export type CourseLevel =
  | "undergrad1" | "undergrad2" | "undergrad3" | "undergrad4"
  | "literature" | "graduate"

export type InstructorRank =
  | "AssistantProfessor" | "AssociateProfessor" | "FullProfessor"
  | "ContinuingAdjunct" | "TermAdjunctBasic" | "TermAdjunctSRoR"
  | "TermAdjunctGRoR" | "TeachingFellow" | "ExchangeFellow" | "Other"

export interface Section {
  id: string
  number: number
  capacity: number
}

export interface Course {
  id: string
  name: string
  code: string
  level: CourseLevel
  year_introduced: string
  notes: { content: string }[]
  sections: Section[]
  capacity: number
}

export interface Instructor {
  id: string
  name: string
  workload: number
  email: string
  rank: InstructorRank
  prev_taught: Course[]
  notes: { content: string, created_by?: string, date_created?: string }[]
}

export interface Assignment {
  id: string
  instructor_id: string
  section_id: string
  course_code: string
  term: Term
}

export interface Schedule {
  id: string
  name: string
  year_id: string
  date_created: string
  is_rc: boolean
  assignments: Assignment[]
}

export interface CourseRule {
  id: string
  course_code: string
  terms_offered: Term[]
  workload_fulfillment: number
  is_full_year: boolean
  sections_available: string[]
  is_external: boolean
  dropped: boolean
}

export interface InstructorRule {
  id: string
  instructor_id: string
  designations: string[]
  workload_delta: number
  courses: string[]
  declined_courses: string[]
  dropped: boolean
}

export interface Year {
  id: string
  name: string
  start_year: number
}

export interface Violation {
  id: string
  type: "Course" | "Instructor" | "Schedule"
  offending_id: string
  code: string
  message: string
  degree: ViolationDegree
}

export interface Faculty {
  /** Unique identifier for this faculty */
  id: string;
  /** Display name of the faculty */
  name: string;
  /** Academic years managed by this faculty */
  academic_years: Year[];
}

// ── Drag-drop UI types (frontend only) ───────────────────────────────────────

export interface SectionDragData {
  type: "section"
  source: "chip" | "panel"
  sectionId: string
  courseCode: string
  assignmentId: string | null
  prevInstructorId: string | null
  prevTerm: Term | null
}

export interface InstructorDropData {
  type: "instructor"
  instructorId: string
  term: Term
}

export interface PanelDropData {
  type: "panel"
}


// ── Display constants ─────────────────────────────────────────────────────────

export const RANK_DISPLAY: Record<InstructorRank, { short: string; long: string }> = {
  FullProfessor:      { short: "Prof.",        long: "Professor" },
  AssociateProfessor: { short: "Assoc. Prof.", long: "Associate Professor" },
  AssistantProfessor: { short: "Asst. Prof.",  long: "Assistant Professor" },
  ContinuingAdjunct:  { short: "Cont. Adj.",   long: "Continuing Adjunct" },
  TermAdjunctBasic:   { short: "Adj.",         long: "Term Adjunct" },
  TermAdjunctSRoR:    { short: "Adj. SRoR",    long: "Term Adjunct SRoR" },
  TermAdjunctGRoR:    { short: "Adj. GRoR",    long: "Term Adjunct GRoR" },
  TeachingFellow:     { short: "T.F.",         long: "Teaching Fellow" },
  ExchangeFellow:     { short: "E.F.",         long: "Exchange Fellow" },
  Other:              { short: "Other",        long: "Other" },
}
