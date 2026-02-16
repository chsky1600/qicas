import type {
  AcademicYear,
  Assignment,
  Schedule,
  ValidationResult,
  Violation,
  ViolationDegree,
} from "../types";
import type { CourseLevel, InstructorRank, Term } from "../types/enums";
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
    ...checkScheduleRules(ctx, projected, candidate),
  ];

  const degree =
    violations.length === 0 ? "Valid" : worstDegree(violations);

  return { degree, violations };
}

/**
 * Validates an entire schedule against all rules for its academic year.
 * Used after assignment removals or when loading a schedule to recompute all violations.
 *
 * @param schedule - The full schedule to validate
 * @returns ValidationResult with overall degree and list of violations
 */
export async function validateSchedule(
  schedule: Schedule
): Promise<ValidationResult> {
  const ctx = await getYearConstraints(schedule.year_id);

  const violations: Violation[] = [];
  for (const assignment of schedule.assignments) {
    violations.push(...checkCourseRules(ctx, schedule, assignment));
    violations.push(...checkInstructorRules(ctx, schedule, assignment));
    violations.push(...checkScheduleRules(ctx, schedule, assignment));
  }

  const deduped = dedupeViolations(violations);
  const degree =
    deduped.length === 0 ? "Valid" : worstDegree(deduped);

  return { degree, violations: deduped };
}

/**
 * Removes duplicate violations by ID. Schedule-wide checks may produce
 * the same violation from both sides of a pair (e.g., CROSS_TERM_DUPLICATE
 * fires for both the Fall and Winter assignment).
 */
function dedupeViolations(violations: Violation[]): Violation[] {
  const seen = new Set<string>();
  return violations.filter(v => {
    if (seen.has(v.id)) return false;
    seen.add(v.id);
    return true;
  });
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
  const violations: Violation[] = [];
  const rule = ctx.course_rules.find(r => r.course_code === candidate.course_code);

  // --- CROSS_TERM_DUPLICATE (Info) ---
  // An instructor is assigned to the same course in both terms and the course is not full-year.
  if (rule && !rule.is_full_year) {
    const otherTerm: Term = candidate.term === "Fall" ? "Winter" : "Fall";
    const duplicate = projected.assignments.find(
      a =>
        a.id !== candidate.id &&
        a.instructor_id === candidate.instructor_id &&
        a.course_code === candidate.course_code &&
        a.term === otherTerm
    );
    if (duplicate) {
      violations.push({
        id: `v-cross-term-${candidate.id}`,
        type: "Course",
        offending_id: candidate.course_code,
        code: "CROSS_TERM_DUPLICATE",
        message: `Instructor ${candidate.instructor_id} is assigned to ${candidate.course_code} in both Fall and Winter, but this course is not full-year.`,
        degree: "Info",
      });
    }
  }

  return violations;
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
 * Checks schedule-level rules (e.g., section-workload imbalance).
 *
 * @param ctx - Academic year constraints
 * @param projected - Schedule with candidate applied
 * @param candidate - The assignment being validated
 * @returns Array of schedule-related violations (may be empty)
 */
export function checkScheduleRules(
  ctx: AcademicYear,
  projected: Schedule,
  candidate: Assignment
): Violation[] {
  // TODO: Implement schedule rule checks
  // - SW_IMBALANCE: total sections ≠ total instructor workload
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
