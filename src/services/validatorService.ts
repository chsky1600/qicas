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

// workload credit for a single assignment
// full-year courses split their workload_fulfillment across both term assignments
function assignmentCredit(ctx: AcademicYear, courseCode: string): number {
  const cr = ctx.course_rules.find(r => r.course_code === courseCode)
  if (!cr) return 1
  return cr.is_full_year ? cr.workload_fulfillment / cr.terms_offered.length : cr.workload_fulfillment
}

// resolve raw IDs to human-readable labels for violation messages
function instructorName(ctx: AcademicYear, id: string): string {
  return ctx.instructors.find(i => i.id === id)?.name ?? id
}
function sectionLabel(ctx: AcademicYear, courseCode: string, sectionId: string): string {
  const course = ctx.courses.find(c => c.code === courseCode)
  const section = course?.sections.find(s => s.id === sectionId)
  return section ? `section ${section.number}` : `section ${sectionId}`
}

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
      id: `v-duplicate-${candidate.course_code}-${candidate.section_id}-${candidate.term}`,
      type: "Course",
      offending_id: candidate.course_code,
      code: "DUPLICATE_ASSIGNMENT",
      message: `${instructorName(ctx, candidate.instructor_id)} is assigned to ${candidate.course_code} ${sectionLabel(ctx, candidate.course_code, candidate.section_id)} in ${candidate.term} more than once.`,
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
        id: `v-cross-term-${candidate.instructor_id}-${candidate.course_code}`,
        type: "Course",
        offending_id: candidate.course_code,
        code: "CROSS_TERM_DUPLICATE",
        message: `${instructorName(ctx, candidate.instructor_id)} is assigned to ${candidate.course_code} in both Fall and Winter, but this course is not full-year.`,
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
        message: `Full-year course ${candidate.course_code} has different instructors in Fall (${instructorName(ctx, fallAssignment.instructor_id)}) and Winter (${instructorName(ctx, winterAssignment.instructor_id)}).`,
        degree: "Info",
      });
    }
  }

  // --- TERM_NOT_OFFERED (Warning) ---
  // Assigned course term does not exist in the course's terms_offered.
  if (rule && !rule.terms_offered.includes(candidate.term)) {
    violations.push({
      id: `v-term-not-offered-${candidate.course_code}-${candidate.section_id}-${candidate.term}`,
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
        id: `v-rank-mismatch-${candidate.instructor_id}-${candidate.course_code}-${candidate.section_id}`,
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
      message: `${candidate.course_code} ${sectionLabel(ctx, candidate.course_code, candidate.section_id)} in ${candidate.term} has ${sectionCount} instructors assigned, exceeding the co-teaching limit of ${CO_TEACHING_LIMIT}.`,
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
      id: `v-first-time-${candidate.instructor_id}-${candidate.course_code}`,
      type: "Instructor",
      offending_id: candidate.instructor_id,
      code: "FIRST_TIME_TEACHING",
      message: `${instructor.name} has not previously taught ${candidate.course_code}.`,
      degree: "Info",
    });
  }

  // --- UNEVEN_YEAR (Info) ---
  // An instructor has a gap of 2+ between sections taught in Fall vs. Winter.
  const fallCount = projected.assignments.filter(
    a => a.instructor_id === candidate.instructor_id && a.term === "Fall"
  ).length;
  const winterCount = projected.assignments.filter(
    a => a.instructor_id === candidate.instructor_id && a.term === "Winter"
  ).length;
  if (Math.abs(fallCount - winterCount) >= 2) {
    violations.push({
      id: `v-uneven-year-${candidate.instructor_id}`,
      type: "Instructor",
      offending_id: candidate.instructor_id,
      code: "UNEVEN_YEAR",
      message: `${instructor.name} has ${fallCount} sections in Fall and ${winterCount} in Winter (gap of ${Math.abs(fallCount - winterCount)}).`,
      degree: "Info",
    });
  }

  // --- TADJ_UNASSIGNED (Warning) ---
  // A (S/G)RoR adjunct has not yet been assigned all of their designated courses.
  const iRule = ctx.instructor_rules.find(r => r.instructor_id === candidate.instructor_id);
  if (
    iRule &&
    (instructor.rank === "TermAdjunctSRoR" || instructor.rank === "TermAdjunctGRoR") &&
    iRule.courses.length > 0
  ) {
    const assignedCodes = projected.assignments
      .filter(a => a.instructor_id === candidate.instructor_id)
      .map(a => a.course_code);
    const missing = iRule.courses.filter(c => !assignedCodes.includes(c) && !iRule.declined_courses.includes(c));
    if (missing.length > 0) {
      violations.push({
        id: `v-tadj-unassigned-${candidate.instructor_id}`,
        type: "Instructor",
        offending_id: candidate.instructor_id,
        code: "TADJ_UNASSIGNED",
        message: `${instructor.name} (${instructor.rank}) has not been assigned designated course(s): ${missing.join(", ")}.`,
        degree: "Warning",
      });
    }
  }

  // --- TADJ_CONFLICT (Warning) ---
  // A course a (S/G)RoR has rights to was assigned to a TermAdjunctBasic
  // without the (S/G)RoR declining that course.
  if (instructor.rank === "TermAdjunctBasic") {
    for (const rule of ctx.instructor_rules) {
      const ruleInstructor = ctx.instructors.find(i => i.id === rule.instructor_id);
      if (
        ruleInstructor &&
        (ruleInstructor.rank === "TermAdjunctSRoR" || ruleInstructor.rank === "TermAdjunctGRoR") &&
        rule.courses.includes(candidate.course_code) &&
        !rule.declined_courses.includes(candidate.course_code)
      ) {
        violations.push({
          id: `v-tadj-conflict-${candidate.instructor_id}-${rule.instructor_id}-${candidate.course_code}`,
          type: "Instructor",
          offending_id: candidate.instructor_id,
          code: "TADJ_CONFLICT",
          message: `${candidate.course_code} is assigned to ${instructor.name} (TermAdjunctBasic), but ${ruleInstructor.name} (${ruleInstructor.rank}) has rights to this course and has not declined.`,
          degree: "Warning",
        });
      }
    }
  }

  // --- EF_WORKLOAD (Warning) ---
  // An ExchangeFellow has not been assigned exactly 1 section in Fall and exactly 1 in Winter.
  if (instructor.rank === "ExchangeFellow") {
    const efFall = projected.assignments.filter(
      a => a.instructor_id === candidate.instructor_id && a.term === "Fall"
    ).length;
    const efWinter = projected.assignments.filter(
      a => a.instructor_id === candidate.instructor_id && a.term === "Winter"
    ).length;
    if (efFall !== 1 || efWinter !== 1) {
      violations.push({
        id: `v-ef-workload-${candidate.instructor_id}`,
        type: "Instructor",
        offending_id: candidate.instructor_id,
        code: "EF_WORKLOAD",
        message: `${instructor.name} (ExchangeFellow) has ${efFall} Fall and ${efWinter} Winter sections, expected exactly 1 each.`,
        degree: "Warning",
      });
    }
  }

  // --- WORKLOAD_EXCEEDED (Warning) ---
  // An instructor's assigned workload exceeds their target (workload + workload_delta).
  const delta = iRule?.workload_delta ?? 0;
  const target = instructor.workload + delta;
  const assignedWorkload = projected.assignments
    .filter(a => a.instructor_id === candidate.instructor_id)
    .reduce((sum, a) => sum + assignmentCredit(ctx, a.course_code), 0);
  if (assignedWorkload > target) {
    violations.push({
      id: `v-workload-exceeded-${candidate.instructor_id}`,
      type: "Instructor",
      offending_id: candidate.instructor_id,
      code: "WORKLOAD_EXCEEDED",
      message: `${instructor.name} has assigned workload of ${assignedWorkload}, exceeding target of ${target}.`,
      degree: "Warning",
    });
  }

  // --- OUT_OF_WHEELHOUSE (Warning) ---
  // An instructor is only assigned courses they have never taught before.
  const instructorAssignments = projected.assignments.filter(
    a => a.instructor_id === candidate.instructor_id
  );
  if (instructorAssignments.length > 0) {
    const allNew = instructorAssignments.every(
      a => !instructor.prev_taught.some(c => c.code === a.course_code)
    );
    if (allNew) {
      violations.push({
        id: `v-out-of-wheelhouse-${candidate.instructor_id}`,
        type: "Instructor",
        offending_id: candidate.instructor_id,
        code: "OUT_OF_WHEELHOUSE",
        message: `${instructor.name} is only assigned courses they have never taught before.`,
        degree: "Warning",
      });
    }
  }

  // --- INSUFFICIENT_WORKLOAD (Error) ---
  // An instructor's assigned workload is below their required workload
  // and no unassigned internal courses remain to fill it.
  if (assignedWorkload < target) {
    const hasUnassignedSections = ctx.course_rules.some(cr => {
      if (cr.is_external) return false;
      return cr.terms_offered.some(term =>
        cr.sections_available.some(sectionId =>
          !projected.assignments.some(
            a => a.course_code === cr.course_code && a.section_id === sectionId && a.term === term
          )
        )
      );
    });
    if (!hasUnassignedSections) {
      violations.push({
        id: `v-insufficient-workload-${candidate.instructor_id}`,
        type: "Instructor",
        offending_id: candidate.instructor_id,
        code: "INSUFFICIENT_WORKLOAD",
        message: `${instructor.name} has assigned workload of ${assignedWorkload}, below target of ${target}, and no unassigned sections remain.`,
        degree: "Error",
      });
    }
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
    if (rule?.dropped) return true; // dropped instructors don't count
    const delta = rule?.workload_delta ?? 0;
    const target = instructor.workload + delta;

    const assignedWorkload = schedule.assignments
      .filter(a => a.instructor_id === instructor.id)
      .reduce((sum, a) => sum + assignmentCredit(ctx, a.course_code), 0);

    return assignedWorkload >= target;
  });

  if (allAtCapacity) {
    for (const cr of ctx.course_rules) {
      if (cr.is_external || cr.dropped) continue;
      const course = ctx.courses.find(c => c.code === cr.course_code);
      if (!course) continue;

      for (const term of cr.terms_offered) {
        for (const sec of course.sections) {
          const assigned = schedule.assignments.some(
            a => a.course_code === cr.course_code && a.section_id === sec.id && a.term === term
          );
          if (!assigned) {
            violations.push({
              id: `v-section-unassigned-${cr.course_code}-${sec.id}-${term}`,
              type: "Schedule",
              offending_id: cr.course_code,
              code: "SECTION_UNASSIGNED",
              message: `${cr.course_code} section ${sec.number} in ${term} is unassigned and all instructors are at capacity.`,
              degree: "Error",
            });
          }
        }
      }
    }
  }

  // --- SW_IMBALANCE (Warning) ---
  // Total available internal section credits != total instructor workload across the schedule.
  const totalSections = ctx.course_rules
    .filter(cr => !cr.dropped)
    .reduce((sum, cr) => {
      const course = ctx.courses.find(c => c.code === cr.course_code)
      const sectionCount = course?.sections.length ?? 0
      return sum + cr.workload_fulfillment * sectionCount 
    }, 0);

  const totalWorkload = ctx.instructors.reduce((sum, instructor) => {
    const rule = ctx.instructor_rules.find(r => r.instructor_id === instructor.id);
    if (rule?.dropped) return sum;
    const delta = rule?.workload_delta ?? 0;
    return sum + instructor.workload + delta;
  }, 0);

  if (totalSections !== totalWorkload) {
    violations.push({
      id: `v-sw-imbalance`,
      type: "Schedule",
      offending_id: "schedule",
      code: "SW_IMBALANCE",
      message: `Schedule has ${totalSections} section credits available but a total instructor workload capacity of ${totalWorkload}. Adjust workloads or courses to balance.`,
      degree: "Warning",
    });
  }

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
