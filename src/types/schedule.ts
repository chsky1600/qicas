import type { AssignmentDegree, Term } from "./enums";

export interface Assignment {
  /** Unique identifier for this assignment */
  id: string;
  /** Validation degree (computed, not persisted) */
  degree: AssignmentDegree;
  /** Reference to the instructor being assigned */
  instructor_id: string;
  /** Reference to the section being assigned */
  section_id: string;
  /** Course code for the assigned course */
  course_code: string;
  /** Academic term for the assignment */
  term: Term;
}

export interface Schedule {
  /** Unique identifier for the schedule */
  id: string;
  /** Display name for the schedule */
  name: string;
  /** Reference to the assignment's schedule's year  */
  year_id: string;
  /** When the schedule was created */
  date_created: Date;
  /** Whether this is a release candidate */
  is_rc: boolean;
  /** All assignments within this schedule */
  assignments: Assignment[];
}
