/*
import { sectionStateMock, instructorStateMock } from "./assignment.types";

export function fetchAssignment(faculty_id, academic_year_id, Schedule_id) {
  // TODO :
  // API function to set instructors
  // mapper function to mapp api: API needs a construction algorithm which converts the database into usable
  // frontend structure

  
  return {
    sectionState: sectionStateMock,
    instructorState: instructorStateMock
  }
}
*/

import type {
  SectionState, InstructorState, Section, Instructor, SectionAvailability
} from "./assignment.types";
// Mock data is imported for testing frontend without backend, remove when backend is running
//import { sectionStateMock, instructorStateMock } from "./assignment.types";
import { SectionAvailability as SA } from "./assignment.types"

// ─── Backend response shapes ──────────────────────────────────────────────────
// These match what the API actually returns (minimal subset we need)

interface BSection { id: string; number: number }
interface BNote { content: string }
interface BCourse {
  id: string; name: string; code: string; year_introduced: string;
  sections: BSection[]; notes: BNote[];
}
interface BInstructor {
  id: string; name: string; workload: number; email: string;
  rank: string; notes: BNote[];
}
interface BAssignment {
  instructor_id: string; section_id: string; course_code: string; term: "Fall" | "Winter";
}
interface BSchedule { id: string; assignments: BAssignment[] }
interface BCourseRule {
  course_code: string; terms_offered: ("Fall" | "Winter")[];
  workload_fulfillment: number; is_full_year: boolean;
}
interface BInstructorRule { id: string; instructor_id: string; workload_delta: number; dropped: boolean }

// ─── Mapping helpers ──────────────────────────────────────────────────────────

// "CISC101" → { dept: "CISC", code: "101" }
function parseCourseCode(raw: string): { dept: string; code: string } {
  const match = raw.match(/^([A-Za-z]+)\s*(\d+.*)$/)
  if (match) return { dept: match[1].toUpperCase(), code: match[2] }
  return { dept: raw, code: "" }
}

// Map backend rank (camelCase or space format) → frontend position {short, long}
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

// Map CourseRule → SectionAvailability enum
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

// ─── Core mapper ──────────────────────────────────────────────────────────────

function mapToFrontendState(
  courses: BCourse[],
  instructors: BInstructor[],
  schedules: BSchedule[],
  courseRules: BCourseRule[],
  instructorRules: BInstructorRule[]
): { sectionState: SectionState; instructorState: InstructorState } {

  // Index rules for O(1) lookup
  const ruleByCode = new Map(courseRules.map(r => [r.course_code, r]))
  const ruleByInstructor = new Map(instructorRules.map(r => [r.instructor_id, r]))

  const allAssignments: BAssignment[] = (schedules[0]?.assignments ?? [])

  // section_id → instructor_id (first assignment wins for assigned_to)
  const sectionAssignedTo = new Map<string, string>()
  // instructor_id → { fall: Set, wint: Set }
  const instructorSets = new Map<string, { fall: Set<string>; wint: Set<string> }>()

  for (const a of allAssignments) {
    if (!sectionAssignedTo.has(a.section_id)) {
      sectionAssignedTo.set(a.section_id, a.instructor_id)
    }
    if (!instructorSets.has(a.instructor_id)) {
      instructorSets.set(a.instructor_id, { fall: new Set(), wint: new Set() })
    }
    const sets = instructorSets.get(a.instructor_id)!
    if (a.term === "Fall") sets.fall.add(a.section_id)
    else sets.wint.add(a.section_id)
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  const sectionById: Record<string, Section> = {}
  const sectionAllIds: string[] = []

  for (const course of courses) {
    const { dept, code } = parseCourseCode(course.code)
    const rule = ruleByCode.get(course.code)

    for (const sec of course.sections) {
      sectionById[sec.id] = {
        id: sec.id,
        name: course.name,
        dept,
        code,
        year_introduced: course.year_introduced,
        section_num: sec.number,
        workload: rule?.workload_fulfillment ?? 1,
        availability: mapAvailability(rule),
        capacity: 0,  // not in backend yet
        assigned_to: sectionAssignedTo.get(sec.id) ?? null,
        dropped: false,
        in_violation: null,
      }
      sectionAllIds.push(sec.id)
    }
  }

  // ── Instructors ───────────────────────────────────────────────────────────
  const instructorById: Record<string, Instructor> = {}
  const instructorAllIds: string[] = []

  for (const inst of instructors) {
    const rule = ruleByInstructor.get(inst.id)
    const sets = instructorSets.get(inst.id) ?? { fall: new Set<string>(), wint: new Set<string>() }

    instructorById[inst.id] = {
      id: inst.id,
      name: inst.name,
      position: RANK_MAP[inst.rank] ?? { short: "Other", long: inst.rank },
      email: inst.email,
      workload_total: inst.workload,
      modifier: rule?.workload_delta ?? 0,
      notes: inst.notes.map(n => n.content).join('\n'),
      fall_assigned: sets.fall,
      wint_assigned: sets.wint,
      dropped: rule?.dropped ?? false,
      rule_id: rule?.id ?? null,
      violations: { details_col_violations: [], fall_col_violations: [], wint_col_violations: [] },
    }
    instructorAllIds.push(inst.id)
  }

  return {
    sectionState: { byId: sectionById, allIds: sectionAllIds },
    instructorState: { byId: instructorById, allIds: instructorAllIds },
  }
}

// ─── API call ─────────────────────────────────────────────────────────────────

// Change this to "http://localhost:PORT" if the backend runs on a different port
const API_BASE = ""

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
  const first = schedules[0] ?? null
  const activeSchedule = first ? {
    id: first.id, name: first.name, year_id: first.year_id,
    date_created: first.date_created, is_rc: first.is_rc ?? false,
  } : null
  return { sectionState, instructorState, activeSchedule }
}

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
    for (const sectionId of instructor.fall_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: sectionId, course_code: `${section.dept}${section.code}`, term: "Fall" })
    }
    for (const sectionId of instructor.wint_assigned) {
      const section = sectionState.byId[sectionId]
      if (!section) continue
      assignments.push({ id: crypto.randomUUID(), instructor_id: instructorId, section_id: sectionId, course_code: `${section.dept}${section.code}`, term: "Winter" })
    }
  }
  await fetch(`${API_BASE}/schedule/${year}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule: { ...activeSchedule, assignments } }),
    signal,
  })
}

export async function saveDropped(year: string, rule_id: string, dropped: boolean): Promise<void> {
  await fetch(`${API_BASE}/year/${year}/rules/instructors/${rule_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dropped }),
  })
}


// ─── Mock fallback (keep while backend is not running) ────────────────────────
/*
export function fetchAssignmentMock(): { sectionState: SectionState; instructorState: InstructorState } {
  return { sectionState: sectionStateMock, instructorState: instructorStateMock }
}
*/