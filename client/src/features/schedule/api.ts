import type {
  Course, Instructor, Schedule, Assignment,
  InstructorRule, CourseRule, Year, Violation, Faculty, User, UserRole
} from "./types"

const BASE = ""

// auth hooks registered by AuthContext at mount
let _onActivity: (() => void) | null = null
let _on401: (() => void) | null = null

export function registerAuthHooks(onActivity: () => void, on401: () => void) {
  _onActivity = onActivity
  _on401 = on401
}

// ── Helper ──────────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  })
  if (res.status === 401) {
    _on401?.()
    throw new Error("Session expired")
  }
  _onActivity?.()
  if (!res.ok) {
    let detail = ""
    const contentType = res.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      try {
        const data = await res.json() as { error?: string; message?: string }
        detail = data.error ?? data.message ?? ""
      } catch {}
    }
    throw new Error(detail || `${options?.method ?? "GET"} ${path} → ${res.status}`)
  }
  
  // these responses have no body
  if (res.status === 204 || res.status === 205) return undefined as T

  // if no content-type to return, dont return
  const contentType = res.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) return undefined as T

  // process body as text, only if it exists parse to object
  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return request<void>("/auth", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function changePassword(current_password: string | undefined, new_password: string) {
  return request<void>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ current_password, new_password }),
  })
}

export function updateAccount(updates: { name?: string; email?: string }) {
  return request<User>("/auth/account", {
    method: "PUT",
    body: JSON.stringify(updates),
  })
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function getUsers() {
  return request<User[]>("/users")
}

export function createUser(user: {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  must_change_password?: boolean
}) {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify({ ...user, user_role: user.role, must_change_password: user.must_change_password ?? false }),
  })
}

export function updateUser(userId: string, updates: {
  name?: string
  email?: string
  password?: string
  role?: UserRole
  must_change_password?: boolean
}) {
  return request<User>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify({ ...updates, user_role: updates.role, must_change_password: updates.must_change_password }),
  })
}

export function deleteUser(userId: string) {
  return request<User>(`/users/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  })
}

// ── Years ─────────────────────────────────────────────────────────────────────

export function getYears() {
  return request<Year[]>("/year")
}

export function getCreditsPerCourse() {
  return request<{ credits_per_course: number }>("/faculty/credits")
}

export function migrateToNextYear(source_year_id: string, new_year_id: string, year_name: string, schedule_ids: string[]){
  return request<Faculty>("/faculty/migrate", {
    method: "POST",
    body: JSON.stringify({
      source_year_id: source_year_id, 
      new_year_id: new_year_id, 
      year_name: year_name, 
      schedule_ids: schedule_ids
    }),
  })
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

export function renameSchedule(year: string, scheduleId: string, schedule_name: string) {
  return request<void>(`/schedule/${year}/rename`, {
    method: "PUT",
    body: JSON.stringify({ schedule_id: scheduleId, schedule_name: schedule_name }),
  })
}

export function setIsRCSchedule(year: string, scheduleId: string, is_rc: boolean) {
  return request<void>(`/schedule/${year}/isrc`, {
    method: "PUT",
    body: JSON.stringify({ schedule_id: scheduleId, is_rc: is_rc }),
  })
}

export function getScheduleVersion(year: string, scheduleId: string) {
  return request<{ version: number }>(`/schedule/${year}/${scheduleId}/version`)
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
