import type { 
  SectionState, 
  InstructorState, 
  //SectionUI, 
  //InstructorUI, 
  //SectionAvailability 
} from "./assignment.types";

import {mapScheduletoState} from "./assignment.mapper";
//import { SectionAvailability as SA } from "./assignment.types"


// ─── Backend Response Shapes ──────────────────────────────────────────────────
// These interfaces describe the raw JSON shapes returned by the backend API.
// renamed to B{type} to reduce confusion with 
// API should be the only file which imports these types

import type {
  //Schedule as BSchedule, 
  //Assignment as BAssignment, 
  //Course as BCourse, 
  //Section as BSection, 
  //Instructor as BInstructor, 
  //CourseRule as BCourseRule,
  //InstructorRule as BInstructorRule, 
  //Note as BNote,
  Violation as BViolation
} from "../../../../src/types";



// ─── API Calls ────────────────────────────────────────────────────────────────

// Base URL for all API requests. Empty string means same origin (works via Vite proxy in dev).
// Change to "http://localhost:PORT" if the backend runs on a different origin.
const API_BASE = ""

/**
 * Fetches all data needed to populate the assignment interface for the given schedule/academic year.
 * Fires 5 requests in parallel, then passes the results through mapToFrontendState.
 *
 * Returns:
 *  - sectionState: all sections for the year, normalised
 *  - instructorState: all instructors for the year, normalised
 *  - activeSchedule: metadata for the first (active) schedule, or null if none exists
 */
export async function fetchAssignment(year: string): Promise<{
  sectionState: SectionState;
  instructorState: InstructorState;
  activeSchedule: { id: string; name: string; year_id: string; date_created: string; is_rc: boolean } | null;
}> {
  const [courses, instructors, schedules, courseRules, instructorRules] = await Promise.all([
    fetch(`${API_BASE}/courses/${year}`).then(r => r.json()),
    fetch(`${API_BASE}/instructors/${year}`).then(r => r.json()),
    fetch(`${API_BASE}/schedule/${year}`).then(r => r.json()),
    fetch(`${API_BASE}/year/${year}/rules/courses`).then(r => r.json()),
    fetch(`${API_BASE}/year/${year}/rules/instructors`).then(r => r.json()),
  ])

  const { sectionState, instructorState } = mapScheduletoState(schedules[0] ?? undefined, instructors, instructorRules, courses, courseRules)

  // The first schedule in the list is treated as the active working schedule
  const first = schedules[0] ?? null
  const activeSchedule = first ? {
    id: first.id, name: first.name, year_id: first.year_id,
    date_created: first.date_created, is_rc: first.is_rc ?? false,
  } : null

  return { sectionState, instructorState, activeSchedule }
}

/**
 * Serialises the current frontend state back into the backend schedule format and
 * sends it to the backend via PUT /schedule/:year.
 *
 * The backend expects a flat list of assignment objects — one per instructor-section-term
 * combination. Full-year sections (FandW) will appear twice: once for Fall, once for Winter.
 *
 * An AbortSignal can be passed to cancel an in-flight request (used by the auto-save debouncer).
 */
export async function saveScheduleToBackend(
  year: string,
  activeSchedule: { id: string; name: string; year_id: string; date_created: string; is_rc: boolean },
  sectionState: SectionState,
  instructorState: InstructorState,
  signal?: AbortSignal
): Promise<void> {
  const assignments = []

  for (const instructorId of instructorState.allIds) {
    const instructor = instructorState.byId[instructorId]

    // Build one assignment entry per fall-assigned section
    for (const sectionId of instructor.fall_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: sectionId, course_code: section.course_code, term: "Fall" })
    }

    // Build one assignment entry per winter-assigned section
    for (const sectionId of instructor.wint_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: sectionId, course_code: section.course_code, term: "Winter" })
    }
  }

  await fetch(`${API_BASE}/schedule/${year}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule: { ...activeSchedule, assignments } }),
    signal,
  })
}

/**
 * Persists an instructor's dropped status to the backend.
 * The instructor rule (identified by rule_id) is updated via PUT.
 * `dropped: true` hides the instructor from the active assignment view.
 */
export async function saveDropped(year: string, rule_id: string, dropped: boolean): Promise<void> {
  await fetch(`${API_BASE}/year/${year}/rules/instructors/${rule_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dropped }),
  })
}

// ─── Violations ───────────────────────────────────────────────────────────────

/**
 * Triggers a full schedule validation on the backend and returns the list of violations.
 * Sends an empty POST body, which tells the backend to validate the entire saved schedule
 * (as opposed to validating a single candidate assignment).
 *
 * Returns an empty array on any network or HTTP error so the UI degrades gracefully.
 */
export async function fetchViolations(year: string, schedule_id: string): Promise<BViolation[]> {
  const res = await fetch(`${API_BASE}/schedule/${year}/${schedule_id}/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) return []
  const data: { validationResult: { violations: BViolation[] } } = await res.json()
  return data.validationResult.violations ?? []
}
