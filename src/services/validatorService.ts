import type {
  AcademicYear,
  Assignment,
  Schedule,
  ValidationResult,
  Violation,
  ViolationDegree,
} from "../types";
import type { CourseLevel, InstructorRank } from "../types/enums";
import { getYearConstraints } from "./yearService";
import { applyCandidate } from "./scheduleService";

/**
 * Service for validating assignments against academic year rules.
 * Violations are computed on-demand and never persisted.
 */

const CO_TEACHING_LIMIT = 2;

const RANK_ELIGIBILITY: Record<CourseLevel, InstructorRank[]> = {
  undergrad1: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
    "TermAdjunctGRoR", "TermAdjunctSRoR", "TermAdjunctBasic",
    "TeachingFellow", "ExchangeFellow", "Other",
  ],
  undergrad2: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
    "TermAdjunctGRoR", "TermAdjunctSRoR", "TermAdjunctBasic",
    "TeachingFellow", "ExchangeFellow", "Other",
  ],
  undergrad3: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
    "TermAdjunctGRoR", "TermAdjunctSRoR", "TermAdjunctBasic",
    "ExchangeFellow", "Other",
  ],
  undergrad4: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
    "TermAdjunctGRoR", "TermAdjunctSRoR", "TermAdjunctBasic",
    "ExchangeFellow", "Other",
  ],
  literature: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
    "TermAdjunctGRoR", "TermAdjunctSRoR", "TermAdjunctBasic",
    "ExchangeFellow", "Other",
  ],
  graduate: [
    "FullProfessor", "AssociateProfessor", "AssistantProfessor",
    "ContinuingAdjunct",
  ],
};

/**
 * Validates a candidate assignment against all rules for the schedule's academic year.
 *
 * @param schedule - The current schedule
 * @param candidate - The assignment to validate
 * @returns ValidationResult with overall degree and list of violations
 */
export async function validateAssignment(
  schedule: Schedule,
  candidate: Assignment
): Promise<ValidationResult> {

  const ctx = await getYearConstraints(schedule.year_id); 
  const projected = applyCandidate(schedule, candidate);

  const violations: Violation[] = [
    ...checkCourseRules(ctx, projected, candidate),
    ...checkInstructorRules(ctx, projected, candidate),
    ...checkAssignmentRules(ctx, projected, candidate),
  ];

  const degree =
    violations.length === 0 ? "Valid" : worstDegree(violations);

  return { degree, violations };
}

/**
 * Checks course-level rules (e.g., max sections, term availability, conflicts).
 *
 * @param ctx - Academic year constraints
 * @param projected - Schedule with candidate applied
 * @param candidate - The assignment being validated
 * @returns Array of course-related violations (may be empty)
 */
export function checkCourseRules(
  ctx: AcademicYear,
  projected: Schedule,
  candidate: Assignment
): Violation[] {
  // TODO: Implement course rule checks
  // - Verify course is offered in candidate.term (terms_offered)
  // - Check section availability (sections_available)
  // - Check for course conflict groups
  return [];
}

/**
 * Checks instructor-level rules (e.g., workload limits, course restrictions).
 *
 * @param ctx - Academic year constraints
 * @param projected - Schedule with candidate applied
 * @param candidate - The assignment being validated
 * @returns Array of instructor-related violations (may be empty)
 */
export function checkInstructorRules(
  ctx: AcademicYear,
  projected: Schedule,
  candidate: Assignment
): Violation[] {
  // TODO: Implement instructor rule checks
  // - Check workload limits (base + workload_delta)
  // - Verify instructor is allowed to teach this course
  // - Check for designation-based restrictions
  return [];
}

/**
 * Checks assignment-level rules (e.g., scheduling conflicts, duplicates).
 *
 * @param ctx - Academic year constraints
 * @param projected - Schedule with candidate applied
 * @param candidate - The assignment being validated
 * @returns Array of assignment-related violations (may be empty)
 */
export function checkAssignmentRules(
  ctx: AcademicYear,
  projected: Schedule,
  candidate: Assignment
): Violation[] {
  // TODO: Implement assignment rule checks
  // - Check for duplicate assignments  --> composite_id --> 
  // code_insturctor1_section_term
  // code_insturctor2_section_term
  // - Verify section is not already assigned
  return [];
}

/**
 * Determines the most severe violation degree from a list of violations.
 *
 * @param violations - Array of violations to evaluate
 * @returns The highest severity degree (Error > Warning > Info)
 */
export function worstDegree(violations: Violation[]): ViolationDegree {
  const priority: Record<ViolationDegree, number> = {
    Error: 3,
    Warning: 2,
    Info: 1,
  };

  let worst: ViolationDegree = "Info";

  for (const v of violations) {
    if (priority[v.degree] > priority[worst]) {
      worst = v.degree;
    }
  }

  return worst;
}
