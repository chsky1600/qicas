import { Course } from "./course";
import type { Term } from "./enums";
import { Instructor } from "./instructor";
import { Schedule } from "./schedule";

export interface InstructorRule {
  /** Unique identifier for this rule */
  id: string;
  /** Reference to the instructor this rule applies to */
  instructor_id: string;
  /** Special designations affecting the instructor */
  designations: string[];
  /** Adjustment to base workload (positive or negative) */
  workload_delta: number;
  /** Specific courses this instructor is assigned/restricted to */
  courses: string[];
}

export interface CourseRule {
  /** Unique identifier for this rule */
  id: string;
  /** Course code this rule applies to */
  course_code: string;
  /** Terms when this course can be offered */
  terms_offered: Term[];
  /** How much workload this course fulfills */
  workload_fulfillment: number;
  /** Whether this course spans both Fall and Winter */
  is_full_year: boolean;
  /** Section numbers available for this course */
  sections_available: string[];
}

export interface AcademicYear {
  /** Unique identifier for this academic year */
  id: string;
  /** Display name (e.g., "2024-2025") */
  name: string;
  /** Schedule IDs associated with this year */
  schedules: Schedule[];
  /** Courses available this year */
  courses: Course[];
  /** Instructor IDs available this year */
  instructors: Instructor[];
  /** Instructor-specific rules for this year */
  instructor_rules: InstructorRule[];
  /** Course-specific rules for this year */
  course_rules: CourseRule[];
}
