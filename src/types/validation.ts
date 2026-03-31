export type ViolationType = "Course" | "Instructor" | "Schedule";

export type ViolationDegree = "Info" | "Warning" | "Error";

export interface Violation {
  /** Unique identifier for this violation instance */
  id: string;
  /** Category of the validation rule that was broken */
  type: ViolationType;
  /** ID of the entity (course, instructor, or assignment) that caused the violation */
  offending_id: string;
  /** Short code identifying the specific rule (e.g., "MAX_LOAD_EXCEEDED") */
  code: string;
  /** Human-readable description of the violation */
  message: string;
  /** Severity level of the violation */
  degree: ViolationDegree;
}

export interface ValidationResult {
  /** Overall degree for the candidate assignment */
  degree: "Valid" | ViolationDegree;
  /** List of violations (empty if schedule valid) */
  violations: Violation[];
}
