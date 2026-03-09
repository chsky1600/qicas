import { 
  type SectionState, 
  type InstructorState,
  type InstructorUI,
  type SectionUI,
  getSectionCode, 
  getBSectionID
} from "./assignment.types";

import {mapScheduletoState, mapInstructor, mapSection} from "./assignment.mapper";
//import { SectionAvailability as SA } from "./assignment.types"


// ─── Backend Response Shapes ──────────────────────────────────────────────────
// These interfaces describe the raw JSON shapes returned by the backend API.
// renamed to B{type} to reduce confusion with 
// API should be the only file which imports these types

import type {
  Assignment as BAssignment,
  Violation as BViolation,
  Term as BTerm,
  InstructorRule as BInstructorRule,
  CourseRule as BCourseRule,
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
export async function fetchAllAssignmentData(year: string): Promise<{
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
 * Fetches all data needed to populate one instructor in the assignment interface for the given schedule/academic year.
 * Uses mapper to convert that fetched data into a sectionUI object
 * 
 * Returns:
 *  - instructor: the requested InstructorUI object, normalised
 */
export async function fetchSectionData(year: string, courseId: string, courseCode: string, bSectionId: string): Promise<SectionUI | null> {
  const [course, assignments, courseRules] = await Promise.all([
    fetch(`${API_BASE}/courses/${year}/${courseId}`).then(r => r.json()),
    fetch(`${API_BASE}/courses/${year}/${courseCode}/assignments`).then(r => r.json()),
    fetch(`${API_BASE}/year/${year}/rules/courses`).then(r => r.json()),
  ])

  // TODO: request courseRule Endpoint for finding by instructorID
  const courseRule = courseRules.find(
    (i: BCourseRule) => i.course_code === courseCode
  );

  const assignment = assignments.find(
    (i: BAssignment) => i.section_id === bSectionId
  );

  return mapSection(course, bSectionId, assignment, courseRule)
}

/**
 * Fetches all data needed to populate one instructor in the assignment interface for the given schedule/academic year.
 *
 * Returns:
 *  - instructor: the requested Instructor, normalised
 */
export async function fetchInstructorData(year: string, instructorId: string): Promise<InstructorUI | null> {
  const [instructor, assignments, instructorRules] = await Promise.all([
    fetch(`${API_BASE}/instructors/${year}/${instructorId}`).then(r => r.json()),
    fetch(`${API_BASE}/instructors/${year}/${instructorId}/assignments`).then(r => r.json()),
    fetch(`${API_BASE}/year/${year}/rules/instructors`).then(r => r.json()),
  ])

  const formatedAssignments : BAssignment[] = assignments.map(a => a.assignment)

  // TODO: request instructorRule Endpoint for finding by instructorID
  const instructorRule = instructorRules.find(
    (i: BInstructorRule) => i.instructor_id === instructorId
  );
  
  return mapInstructor(instructor, formatedAssignments, instructorRule)
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
  const assignments: BAssignment[] = []

  for (const instructorId of instructorState.allIds) {
    const instructor = instructorState.byId[instructorId]

    // Build one assignment entry per fall-assigned section
    for (const sectionId of instructor.fall_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: getBSectionID(section), course_code: getSectionCode(section), term: "Fall" })
    }

    // Build one assignment entry per winter-assigned section
    for (const sectionId of instructor.wint_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: getBSectionID(section), course_code: getSectionCode(section), term: "Winter" })
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
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({}),
  })
  if (!res.ok) return []
  const data: { validationResult: { violations: BViolation[] } } = await res.json()
  return data.validationResult.violations ?? []
}

export async function addAssignment(year: string, schedule_id: string, instructor_id: string, bsection_id: string , course_code: string, term: BTerm): Promise<BAssignment | null> {
  const newAssignment: BAssignment = {
    id: crypto.randomUUID(), // needs to be replaced with Wholly unique UUID generation
    instructor_id: instructor_id,
    section_id: bsection_id,
    course_code: course_code,
    term: term
  }

  const res = await fetch(`${API_BASE}/schedule/${year}/${schedule_id}/assignments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assignment: newAssignment
    }),    
  })

  if (!res.ok) return null
  const data: BAssignment = await res.json()
  return data
}

export async function removeAssignment(year: string, schedule_id: string,  assignment_id: string) {
  const res = await fetch(`${API_BASE}/schedule/${year}/${schedule_id}/assignments/${assignment_id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),    
  })

  if (!res.ok) return null
  return true
}

// TODO - request ability to remove all assignments matching coursecode and sectionId
export async function removeAllAssignmentsForSection(year: string, schedule_id: string, bsection_id: string, course_code: string,): Promise<Set<string>> {
  const affectedInstructors = new Set<string>() // set prevents duplicate instructors being added
  const  assignmentsToCourse : BAssignment[] = await fetch(`${API_BASE}/courses/${year}/${course_code}/assignments`).then(r => r.json())
  if (!assignmentsToCourse) return affectedInstructors

  const assignmentsToSection = assignmentsToCourse.filter(
    (i: BAssignment) => i.section_id === bsection_id
  ); 

  assignmentsToSection.forEach(async (assignment) =>  {
    const result = await removeAssignment(year, schedule_id,  assignment.id)
    if (!result) console.log(`warn - assignment ${assignment.id} not removed`)
    else affectedInstructors.add(assignment.instructor_id) 
  })

  return affectedInstructors
}
// ─── Course Management ──────────────────────────────────────────────

/**
 * Persists updated section capacities for a course.
 * GETs full course first to preserve fields not in frontend state (level, notes),
 * then PATCHes with new capacities. Backend recalculates course.capacity as the sum.
 */
export async function saveCourseSections(
  year: string,
  course_id: string,
  updatedSections: Array<{ id: string; capacity: number }>
): Promise<void> {
  const course = await fetch(`${API_BASE}/courses/${year}/${course_id}`).then(r => r.json())
  if (!course) return
  const sectionMap = new Map(updatedSections.map(s => [s.id, s.capacity]))
  const updatedCourse = {
    ...course,
    sections: course.sections.map((s: { id: string; capacity: number }) => ({
      ...s,
      capacity: sectionMap.has(s.id) ? sectionMap.get(s.id) : s.capacity,
    }))
  }
  await fetch(`${API_BASE}/courses/${year}/${course_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: updatedCourse }),
  })
}

/**
 * Adds a new section to a course. GETs the full course, appends a new section
 * with the next section number and capacity 0, then PATCHes.
 * Returns the new section's ID so the caller can add it to frontend state.
 */
export async function addCourseSection(
  year: string,
  course_id: string
): Promise<{ id: string; number: number } | null> {
  const course = await fetch(`${API_BASE}/courses/${year}/${course_id}`).then(r => r.json())
  if (!course) return null
  const maxNum = course.sections.reduce((max: number, s: { number: number }) => Math.max(max, s.number), 0)
  const newSection = { id: crypto.randomUUID(), number: maxNum + 1, capacity: 0 }
  const updatedCourse = { ...course, sections: [...course.sections, newSection] }
  await fetch(`${API_BASE}/courses/${year}/${course_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: updatedCourse }),
  })
  return { id: newSection.id, number: newSection.number }
}

/**
 * Removes a section from a course. GETs the full course, filters out the section,
 * then PATCHes. The caller is responsible for clearing any assignments first.
 */
export async function removeCourseSection(
  year: string,
  course_id: string,
  section_id: string
): Promise<void> {
  const course = await fetch(`${API_BASE}/courses/${year}/${course_id}`).then(r => r.json())
  if (!course) return
  const updatedCourse = {
    ...course,
    sections: course.sections.filter((s: { id: string }) => s.id !== section_id)
  }
  await fetch(`${API_BASE}/courses/${year}/${course_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: updatedCourse }),
  })
}

