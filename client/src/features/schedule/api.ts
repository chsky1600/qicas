import type {
  Course, Instructor, Schedule, Assignment,
  InstructorRule, CourseRule, Year, Violation
} from "./types"

const BASE = ""

// ── Helper ──────────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`${options?.method ?? "GET"} ${path} → ${res.status}`)
  if (res.status === 204 || res.status === 201) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return request<void>("/auth", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function changePassword(email: string, current_password: string, new_password: string) {
  return request<void>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ email, current_password, new_password }),
  })
}

// ── Years ─────────────────────────────────────────────────────────────────────

export function getYears() {
  return request<Year[]>("/year")
}

// ── Course rules ──────────────────────────────────────────────────────────────

export function getCourseRules(year: string) {
  return request<CourseRule[]>(`/year/${year}/rules/courses`)
}

export function addCourseRule(year: string, rule: CourseRule) {
  return request<CourseRule>(`/year/${year}/rules/courses`, {
    method: "POST",
    body: JSON.stringify(rule),
  })
}

export function updateCourseRule(year: string, ruleId: string, rule: Partial<CourseRule>) {
  return request<CourseRule>(`/year/${year}/rules/courses/${ruleId}`, {
    method: "PUT",
    body: JSON.stringify(rule),
  })
}

export function deleteCourseRule(year: string, ruleId: string) {
  return request<CourseRule>(`/year/${year}/rules/courses/${ruleId}`, { method: "DELETE" })
}

// ── Instructor rules ──────────────────────────────────────────────────────────

export function getInstructorRules(year: string) {
  return request<InstructorRule[]>(`/year/${year}/rules/instructors`)
}

export function addInstructorRule(year: string, rule: InstructorRule) {
  return request<InstructorRule>(`/year/${year}/rules/instructors`, {
    method: "POST",
    body: JSON.stringify(rule),
  })
}

export function updateInstructorRule(year: string, ruleId: string, rule: Partial<InstructorRule>) {
  return request<InstructorRule>(`/year/${year}/rules/instructors/${ruleId}`, {
    method: "PUT",
    body: JSON.stringify(rule),
  })
}

export function deleteInstructorRule(year: string, ruleId: string) {
  return request<InstructorRule>(`/year/${year}/rules/instructors/${ruleId}`, { method: "DELETE" })
}

// ── Courses ───────────────────────────────────────────────────────────────────

export function getCourses(year: string) {
  return request<Course[]>(`/courses/${year}`)
}

export function createCourse(year: string, course: Course) {
  return request<Course>(`/courses/${year}`, {
    method: "POST",
    body: JSON.stringify({ course }),
  })
}

export function updateCourse(year: string, courseId: string, course: Course) {
  return request<Course>(`/courses/${year}/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify({ course }),
  })
}

// ── Instructors ───────────────────────────────────────────────────────────────

export function getInstructors(year: string) {
  return request<Instructor[]>(`/instructors/${year}`)
}

export function createInstructor(year: string, instructor: Instructor) {
  return request<Instructor>(`/instructors/${year}`, {
    method: "POST",
    body: JSON.stringify({ instructor }),
  })
}

export function updateInstructor(year: string, instructorId: string, instructor: Instructor) {
  return request<Instructor>(`/instructors/${year}/${instructorId}`, {
    method: "PATCH",
    body: JSON.stringify({ instructor }),
  })
}

// ── Schedules ─────────────────────────────────────────────────────────────────

export function getWorkingSchedule() {
  return request<Schedule | null>("/schedule/")
}

export function getSchedules(year: string) {
  return request<Schedule[]>(`/schedule/${year}`)
}

export function setWorkingSchedule(scheduleId: string) {
  return request<Schedule>(`/schedule/active/${scheduleId}`, { method: "PUT" })
}

export function saveSchedule(year: string, schedule: Schedule) {
  return request<void>(`/schedule/${year}`, { 
    method: "PUT",  
    body: JSON.stringify({ schedule: schedule }),
  })
}

export function createSavedSchedule(year: string, schedule: Schedule) {
  return request<Schedule>(`/schedule/${year}`, {
    method: "POST",
    body: JSON.stringify({ schedule }),
  })
}

export function deleteSavedSchedule(scheduleId: string) {
  return request<void>(`/schedule/${scheduleId}`, { method: "DELETE" })
}

export function addAssignment(year: string, scheduleId: string, assignment: Assignment) {
  return request<Assignment>(`/schedule/${year}/${scheduleId}/assignments`, {
    method: "POST",
    body: JSON.stringify({ assignment }),
  })
}

export function removeAssignment(year: string, scheduleId: string, assignmentId: string) {
  return request<void>(`/schedule/${year}/${scheduleId}/assignments/${assignmentId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  })
}

export function validateSchedule(year: string, scheduleId: string) {
  return request<{ validationResult: { violations: Violation[] } }>(
    `/schedule/${year}/${scheduleId}/validate`,
    { method: "POST", body: JSON.stringify({}) }
  )
}
