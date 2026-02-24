import type { Assignment, Schedule } from "../types";

/**
 * Service for managing schedules and assignments.
 */

/**
 * Applies a candidate assignment to a schedule, returning the projected state.
 * Does not persist changes and is used for validation purposes.
 *
 * @param schedule - The current schedule
 * @param candidate - The assignment to apply
 * @returns A new Schedule object with the candidate applied
 */
export function applyCandidate(
  schedule: Schedule,
  candidate: Assignment
): Schedule {
  const existingIndex = schedule.assignments.findIndex(
    (a) => a.id === candidate.id
  );

  const newAssignments =
    existingIndex >= 0
      ? schedule.assignments.map((a, i) =>
          i === existingIndex ? candidate : a
        )
      : [...schedule.assignments, candidate];

  return { ...schedule, assignments: newAssignments };
}

/**
 * Removes an assignment from a schedule, returning the projected state.
 * Does not persist changes and is used for validation purposes.
 *
 * @param schedule - The current schedule
 * @param assignmentId - The ID of the assignment to remove
 * @returns A new Schedule object with the assignment removed
 */
export function removeCandidate(
  schedule: Schedule,
  assignmentId: string
): Schedule {
  return {
    ...schedule,
    assignments: schedule.assignments.filter(a => a.id !== assignmentId),
  };
}
