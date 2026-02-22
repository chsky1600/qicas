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
  }

  // Schedule-wide checks
  violations.push(...checkScheduleRules(ctx, schedule));

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

  // --- DUPLICATE ASSIGNMENT (Error) --- check first
  // An instructor was assigned to this course's section twice (same section, same term).
  const duplicate = projected.assignments.find(
    a =>
      a.id !== candidate.id &&
      a.instructor_id === candidate.instructor_id &&
      a.section_id === candidate.section_id &&
      a.course_code === candidate.course_code &&
      a.term === candidate.term
  );
  if (duplicate) {
    violations.push({
      id: `v-duplicate-${candidate.id}`,
      type: "Course",
      offending_id: candidate.course_code,
      code: "DUPLICATE_ASSIGNMENT",
      message: `Instructor ${candidate.instructor_id} is assigned to ${candidate.course_code} section ${candidate.section_id} in ${candidate.term} more than once.`,
      degree: "Error",
    });
    return violations;
  }

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

  // --- FULLYEAR_HALF_OPEN (Info) ---
  // For a full-year course, one term has not yet been assigned,
  // or its two halves are assigned to different instructors.
  if (rule && rule.is_full_year) {
    const fallAssignment = projected.assignments.find(
      a => a.course_code === candidate.course_code && a.term === "Fall"
    );
    const winterAssignment = projected.assignments.find(
      a => a.course_code === candidate.course_code && a.term === "Winter"
    );

    // Only for the case when one half is missing, i.e., XOR
    const oneHalfMissing =
      (fallAssignment && !winterAssignment) || (!fallAssignment && winterAssignment); 

    if (oneHalfMissing) {
      violations.push({
        id: `v-fullyear-half-${candidate.course_code}`,
        type: "Course",
        offending_id: candidate.course_code,
        code: "FULLYEAR_HALF_OPEN",
        message: `Full-year course ${candidate.course_code} is only assigned in ${fallAssignment ? "Fall" : "Winter"}, missing the other term.`,
        degree: "Info",
      });
    } else if (fallAssignment && winterAssignment && fallAssignment.instructor_id !== winterAssignment.instructor_id) {
      violations.push({
        id: `v-fullyear-half-${candidate.course_code}`,
        type: "Course",
        offending_id: candidate.course_code,
        code: "FULLYEAR_HALF_OPEN",
        message: `Full-year course ${candidate.course_code} has different instructors in Fall (${fallAssignment.instructor_id}) and Winter (${winterAssignment.instructor_id}).`,
        degree: "Info",
      });
    }
  }

  // --- TERM_NOT_OFFERED (Warning) ---
  // Assigned course term does not exist in the course's terms_offered.
  if (rule && !rule.terms_offered.includes(candidate.term)) {
    violations.push({
      id: `v-term-not-offered-${candidate.id}`,
      type: "Course",
      offending_id: candidate.course_code,
      code: "TERM_NOT_OFFERED",
      message: `${candidate.course_code} is assigned in ${candidate.term}, but is only offered in ${rule.terms_offered.join(", ")}.`,
      degree: "Warning",
    });
  }

  // --- RANK_MISMATCH (Warning) ---
  // Course section assigned to an instructor whose rank is not eligible for that course level.
  const course = ctx.courses.find(c => c.code === candidate.course_code);
  const instructor = ctx.instructors.find(i => i.id === candidate.instructor_id);
  if (course && instructor) {
    const eligible = RANK_ELIGIBILITY[course.level as CourseLevel];
    if (eligible && !eligible.includes(instructor.rank)) {
      violations.push({
        id: `v-rank-mismatch-${candidate.id}`,
        type: "Course",
        offending_id: candidate.course_code,
        code: "RANK_MISMATCH",
        message: `${instructor.name} (${instructor.rank}) is not eligible to teach ${candidate.course_code} (${course.level}).`,
        degree: "Warning",
      });
    }
  }

  // --- SECTION_OVERASSIGNED (Error) ---
  // More instructors assigned to a section (same term) than CO_TEACHING_LIMIT.
  const sectionCount = projected.assignments.filter(
    a =>
      a.course_code === candidate.course_code &&
      a.section_id === candidate.section_id &&
      a.term === candidate.term
  ).length;
  if (sectionCount > CO_TEACHING_LIMIT) {
    violations.push({
      id: `v-section-overassigned-${candidate.course_code}-${candidate.section_id}-${candidate.term}`,
      type: "Course",
      offending_id: candidate.course_code,
      code: "SECTION_OVERASSIGNED",
      message: `${candidate.course_code} section ${candidate.section_id} in ${candidate.term} has ${sectionCount} instructors assigned, exceeding the co-teaching limit of ${CO_TEACHING_LIMIT}.`,
      degree: "Error",
    });
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
  const violations: Violation[] = [];
  const instructor = ctx.instructors.find(i => i.id === candidate.instructor_id);
  if (!instructor) return violations;

  // --- FIRST_TIME_TEACHING (Info) ---
  // An instructor is assigned to a course not in their prev_taught.
  const hasTaught = instructor.prev_taught.some(c => c.code === candidate.course_code);
  if (!hasTaught) {
    violations.push({
      id: `v-first-time-${candidate.id}`,
      type: "Instructor",
      offending_id: candidate.instructor_id,
      code: "FIRST_TIME_TEACHING",
      message: `${instructor.name} has not previously taught ${candidate.course_code}.`,
      degree: "Info",
    });
  }

  return violations;
}

/**
 * Checks schedule-wide rules. Called once from validateSchedule, not per-candidate.
 * Contains rules that require full schedule context (e.g., SECTION_UNASSIGNED, SW_IMBALANCE).
 *
 * @param ctx - Academic year constraints
 * @param schedule - The full schedule
 * @returns Array of schedule-related violations (may be empty)
 */
export function checkScheduleRules(
  ctx: AcademicYear,
  schedule: Schedule
): Violation[] {
  const violations: Violation[] = [];

  // --- SECTION_UNASSIGNED (Error) ---
  // All instructors are at or above their workload target and an internal
  // (in-faculty) section remains unassigned.
  const allAtCapacity = ctx.instructors.every(instructor => {
    const rule = ctx.instructor_rules.find(r => r.instructor_id === instructor.id);
    const delta = rule?.workload_delta ?? 0;
    const target = instructor.workload + delta;

    const assignedWorkload = schedule.assignments
      .filter(a => a.instructor_id === instructor.id)
      .reduce((sum, a) => {
        const cr = ctx.course_rules.find(r => r.course_code === a.course_code);
        return sum + (cr?.workload_fulfillment ?? 1);
      }, 0);

    return assignedWorkload >= target;
  });

  if (allAtCapacity) {
    for (const cr of ctx.course_rules) {
      if (cr.is_external) continue;

      for (const term of cr.terms_offered) {
        for (const sectionId of cr.sections_available) {
          const assigned = schedule.assignments.some(
            a => a.course_code === cr.course_code && a.section_id === sectionId && a.term === term
          );
          if (!assigned) {
            violations.push({
              id: `v-section-unassigned-${cr.course_code}-${sectionId}-${term}`,
              type: "Schedule",
              offending_id: cr.course_code,
              code: "SECTION_UNASSIGNED",
              message: `${cr.course_code} section ${sectionId} in ${term} is unassigned and all instructors are at capacity.`,
              degree: "Error",
            });
          }
        }
      }
    }
  }

  // TODO: SW_IMBALANCE

  return violations;
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
