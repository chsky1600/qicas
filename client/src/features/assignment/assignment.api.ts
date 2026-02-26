import type { SectionState, InstructorState, SectionUI, InstructorUI, SectionAvailability } from "./assignment.mapper";
import {mapScheduletoState} from "./assignment.mapper";
import { SectionAvailability as SA } from "./assignment.types"


// ─── Backend Response Shapes ──────────────────────────────────────────────────
// These interfaces describe the raw JSON shapes returned by the backend API.
// renamed to B{type} to reduce confusion with 
// API should be the only file which imports these types
import type {
  Schedule as BSchedule, 
  Assignment as BAssignment, 
  Course as BCourse, 
  Section as BSection, 
  Instructor as BInstructor, 
  CourseRule as BCourseRule,
  InstructorRule as BInstructorRule, 
  Note as BNote,
  Violation as BViolation
} from "../../../../src/types";


// ─── Mapping Helpers ──────────────────────────────────────────────────────────

// Converts a backend rank string (which may be camelCase or space-separated)
// into the frontend position object { short, long } used for display.
// Falls back to { short: "Other", long: <raw rank> } if the rank is unrecognised.
const RANK_MAP: Record<string, { short: string; long: string }> = {
  "AssistantProfessor":  { short: "Asst. Prof.", long: "Assistant Professor" },
  "Assistant Professor": { short: "Asst. Prof.", long: "Assistant Professor" },
  "AssociateProfessor":  { short: "Assoc. Prof.", long: "Associate Professor" },
  "Associate Professor": { short: "Assoc. Prof.", long: "Associate Professor" },
  "FullProfessor":       { short: "Prof.", long: "Professor" },
  "Full Professor":      { short: "Prof.", long: "Professor" },
  "ContinuingAdjunct":   { short: "Adj.", long: "Adjunct" },
  "Continuing Adjunct":  { short: "Adj.", long: "Adjunct" },
  "TermAdjunctBasic":    { short: "Adj.", long: "Adjunct" },
  "TermAdjunctSRoR":     { short: "Adj.", long: "Adjunct" },
  "TermAdjunctGRoR":     { short: "Adj.", long: "Adjunct" },
  "TeachingFellow":      { short: "T.F.", long: "Teaching Fellow" },
  "Teaching Fellow":     { short: "T.F.", long: "Teaching Fellow" },
  "ExchangeFellow":      { short: "E.F.", long: "Exchange Fellow" },
  "Exchange Fellow":     { short: "E.F.", long: "Exchange Fellow" },
  "Other":               { short: "Other", long: "Other" },
}

/**
 * Converts a BCourseRule into the frontend SectionAvailability enum value.
 *
 * Priority order:
 *  1. is_full_year → FandW  (course runs in both terms, same instructor both terms)
 *  2. Fall + Winter in terms_offered → ForW  (course runs in one term, either fall or winter)
 *  3. Only Fall → F
 *  4. Only Winter → W
 *  5. No rule / no terms → ForW (safe default)
 */
function mapAvailability(rule: BCourseRule | undefined): SectionAvailability {
  if (!rule) return SA.ForW
  if (rule.is_full_year) return SA.FandW
  const hasFall = rule.terms_offered.includes("Fall")
  const hasWint = rule.terms_offered.includes("Winter")
  if (hasFall && hasWint) return SA.ForW
  if (hasFall) return SA.F
  if (hasWint) return SA.W
  return SA.ForW
}


// ─── Core Mapper ──────────────────────────────────────────────────────────────

/**
 * Converts raw backend data from 5 endpoints into the normalised frontend state
 * shapes (SectionState and InstructorState) that the rest of the app consumes.
 *
 * High-level steps:
 *  1. Index course rules by course_code and instructor rules by instructor_id
 *     for O(1) lookup during the mapping loops.
 *  2. Walk the active schedule's assignment list to pre-build two lookup structures:
 *     - sectionAssignedTo: section_id → instructor_id
 *     - instructorSets: instructor_id → { fall: Set<section_id>, wint: Set<section_id> }
 *  3. Build the normalised SectionState by iterating every course and its sections.
 *     Each section gets its rule data (availability, workload) and its assignment status.
 *  4. Build the normalised InstructorState by iterating every instructor.
 *     Each instructor gets their rule data (workload modifier, dropped status) and
 *     the pre-built fall/winter assignment sets.
 */
function mapToFrontendState(
  courses: BCourse[],
  instructors: BInstructor[],
  schedules: BSchedule[],
  courseRules: BCourseRule[],
  instructorRules: BInstructorRule[]
): { sectionState: SectionState; instructorState: InstructorState } {

  // ── Step 1: Index rules for fast lookup ───────────────────────────────────

  // course_code (e.g. "CISC101") → BCourseRule
  const ruleByCode = new Map(courseRules.map(r => [r.course_code, r]))

  // instructor_id → BInstructorRule
  const ruleByInstructor = new Map(instructorRules.map(r => [r.instructor_id, r]))


  // ── Step 2: Pre-process the active schedule's assignments ─────────────────
  // Only the first schedule is used as the active working schedule.
  // If no schedules exist yet, allAssignments will be empty and all sections
  // will be unassigned.

  const allAssignments: BAssignment[] = (schedules[0]?.assignments ?? [])

  // Maps each section to the instructor it is assigned to.
  // Only the first assignment for a given section is recorded (duplicates ignored).
  const sectionAssignedTo = new Map<string, string>()

  // Maps each instructor to their sets of assigned section IDs, split by term.
  // Sets are used so membership checks and removals are O(1).
  const instructorSets = new Map<string, { fall: Set<string>; wint: Set<string> }>()

  for (const a of allAssignments) {
    // Track which instructor a section is assigned to (first assignment wins)
    if (!sectionAssignedTo.has(a.section_id)) {
      sectionAssignedTo.set(a.section_id, a.instructor_id)
    }

    // Ensure the instructor has an entry in the sets map, then add the section
    if (!instructorSets.has(a.instructor_id)) {
      instructorSets.set(a.instructor_id, { fall: new Set(), wint: new Set() })
    }
    const sets = instructorSets.get(a.instructor_id)!
    if (a.term === "Fall") sets.fall.add(a.section_id)
    else sets.wint.add(a.section_id)
  }


  // ── Step 3: Build SectionState ────────────────────────────────────────────
  // Each BCourse can have multiple BSection entries (e.g. CISC101 section 1 and section 2).
  // Each section gets its own entry in sectionById, keyed by section ID.

  const sectionById: Record<string, Section> = {}
  const sectionAllIds: string[] = []

  for (const course of courses) {
    // Look up the course rule by course_code — provides availability and workload
    const rule = ruleByCode.get(course.code)

    for (const sec of course.sections) {
      sectionById[sec.id] = {
        id: sec.id,
        name: course.name,
        course_code: course.code,           // e.g. "CISC101"
        year_introduced: course.year_introduced,
        section_num: sec.number,
        workload: rule?.workload_fulfillment ?? 1,   // defaults to 1 if no rule
        availability: mapAvailability(rule),          // defaults to ForW if no rule
        capacity: 0,                        // not in backend yet
        assigned_to: sectionAssignedTo.get(sec.id) ?? null,  // null = unassigned
        dropped: false,                     // frontend-only field, always starts false
        in_violation: null,                 // populated later by applyViolations
      }
      sectionAllIds.push(sec.id)
    }
  }


  // ── Step 4: Build InstructorState ─────────────────────────────────────────

  const instructorById: Record<string, Instructor> = {}
  const instructorAllIds: string[] = []

  for (const inst of instructors) {
    // Look up the instructor rule — provides workload modifier and dropped status
    const rule = ruleByInstructor.get(inst.id)

    // If this instructor had no assignments in the schedule, default to empty sets
    const sets = instructorSets.get(inst.id) ?? { fall: new Set<string>(), wint: new Set<string>() }

    instructorById[inst.id] = {
      id: inst.id,
      name: inst.name,
      position: RANK_MAP[inst.rank] ?? { short: "Other", long: inst.rank },  // rank → display label
      email: inst.email,
      workload_total: inst.workload,
      modifier: rule?.workload_delta ?? 0,          // adjusts effective workload capacity
      notes: inst.notes.map(n => n.content).join('\n'),  // flatten note objects to a string
      fall_assigned: sets.fall,                     // Set of section IDs assigned in Fall
      wint_assigned: sets.wint,                     // Set of section IDs assigned in Winter
      dropped: rule?.dropped ?? false,              // dropped instructors are hidden from the main view
      rule_id: rule?.id ?? null,                    // needed to persist dropped changes back to backend
      violations: { details_col_violations: [], fall_col_violations: [], wint_col_violations: [] },  // populated later by applyViolations
    }
    instructorAllIds.push(inst.id)
  }

  return {
    sectionState: { byId: sectionById, allIds: sectionAllIds },
    instructorState: { byId: instructorById, allIds: instructorAllIds },
  }
}


// ─── API Calls ────────────────────────────────────────────────────────────────

// Base URL for all API requests. Empty string means same origin (works via Vite proxy in dev).
// Change to "http://localhost:PORT" if the backend runs on a different origin.
const API_BASE = ""

/**
 * Fetches all data needed to populate the assignment interface for the given academic year.
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

  const { sectionState, instructorState } = mapToFrontendState(courses, instructors, schedules, courseRules, instructorRules)

  // The first schedule in the list is treated as the active working schedule
  const first = schedules[0] ?? null
  const activeSchedule = first ? {
    id: first.id, name: first.name, year_id: first.year_id,
    date_created: first.date_created, is_rc: first.is_rc ?? false,
  } : null

  return { sectionState, instructorState, activeSchedule }
}

/**
 * Fetches all data needed to populate the assignment interface for the given schedule/academic year.
 * Fires 5 requests in parallel, then passes the results through mapToFrontendState.
 *
 * Returns:
 *  - sectionState: all sections for the year, normalised
 *  - instructorState: all instructors for the year, normalised
 *  - activeSchedule: metadata for the first (active) schedule, or null if none exists
 */
export async function fetchSchedule(year: string): Promise<{
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
