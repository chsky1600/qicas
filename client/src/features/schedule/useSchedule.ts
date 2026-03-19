import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import * as api from "./api"
import type {
  Year, Course, Instructor, Schedule, Assignment,
  InstructorRule, CourseRule, Violation, Term
} from "./types"

export interface UseScheduleResult {
  // Raw data — components derive what they need
  years: Year[]
  yearId: string
  courses: Course[]
  courseRules: CourseRule[]
  instructors: Instructor[]
  instructorRules: InstructorRule[]
  schedules: Schedule[]
  schedule: Schedule | null
  assignments: Assignment[]
  violations: Violation[]
  loading: boolean
  error: string | null
  // Actions
  assign: (sectionId: string, courseCode: string, instructorId: string, term: Term, prevAssignmentId: string | null) => Promise<void>
  unassign: (assignmentId: string) => Promise<void>
  createInstructor: (instructor: Instructor, rule: InstructorRule) => Promise<void>
  updateInstructor: (instructor: Instructor) => Promise<void>
  dropInstructor: (instructorId: string, dropped: boolean) => Promise<void>
  createCourse: (course: Course, rule: CourseRule) => Promise<void>
  updateCourse: (course: Course) => Promise<void>
  dropCourse: (courseCode: string, dropped: boolean) => Promise<void>
  createSavedSchedule: () => Promise<Schedule | undefined>
  deleteSavedSchedule: (scheduleId: string) => Promise<void>
  switchSchedule: (scheduleId: string) => Promise<void>
  changeYear: (yearId: string) => Promise<void>
  refresh: () => Promise<void>
  updateInstructorRule: (ruleId: string, updates: Partial<InstructorRule>) => Promise<void>
  updateCourseRule: (ruleId: string, updates: Partial<CourseRule>) => Promise<void>

}

export function useSchedule(): UseScheduleResult {
  const [years, setYears] = useState<Year[]>([])
  const [yearId, setYearId] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [courseRules, setCourseRules] = useState<CourseRule[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [instructorRules, setInstructorRules] = useState<InstructorRule[]>([])
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Refs so async callbacks always read latest values
  const scheduleRef = useRef(schedule)
  const yearIdRef = useRef(yearId)
  const instructorRulesRef = useRef(instructorRules)
  const courseRulesRef = useRef(courseRules)
  useEffect(() => { scheduleRef.current = schedule }, [schedule])
  useEffect(() => { yearIdRef.current = yearId }, [yearId])
  useEffect(() => { instructorRulesRef.current = instructorRules }, [instructorRules])
  useEffect(() => { courseRulesRef.current = courseRules }, [courseRules])

  const assignments = useMemo(() => schedule?.assignments ?? [], [schedule])

  // ── Validation ──────────────────────────────────────────────────────────────

  const revalidateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const revalidate = useCallback(async () => {
    const sched = scheduleRef.current
    const yr = yearIdRef.current
    if (!sched || !yr) return
    try {
      const result = await api.validateSchedule(yr, sched.id)
      setViolations(result.validationResult.violations)
    } catch (e) {
      console.error("Validation failed", e)
    }
  }, [])

  const triggerRevalidate = useCallback(() => {
    if (revalidateTimeout.current) clearTimeout(revalidateTimeout.current)
    revalidateTimeout.current = setTimeout(revalidate, 500)
  }, [revalidate])

  // ── Load year data ──────────────────────────────────────────────────────────

  const loadYear = useCallback(async (yr: string, workingSchedule: Schedule | null) => {
    const [coursesData, courseRulesData, instructorsData, instructorRulesData, schedulesData] =
      await Promise.all([
        api.getCourses(yr),
        api.getCourseRules(yr),
        api.getInstructors(yr),
        api.getInstructorRules(yr),
        api.getSchedules(yr),
      ])

    setCourses(coursesData)
    setCourseRules(courseRulesData)
    setInstructors(instructorsData)
    setInstructorRules(instructorRulesData)
    setSchedules(schedulesData)
    setSchedule(workingSchedule)
    scheduleRef.current = workingSchedule

    if (workingSchedule) {
      const result = await api.validateSchedule(yr, workingSchedule.id)
      setViolations(result.validationResult.violations)
    } else {
        setViolations([])
    }
  }, [])

  // ── Initial load ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [yearsData, workingSchedule] = await Promise.all([
        api.getYears(),
        api.getWorkingSchedule(),
      ])

      setYears(yearsData)

      const activeYearId = workingSchedule?.year_id ?? yearsData[0]?.id ?? ""
      setYearId(activeYearId)
      yearIdRef.current = activeYearId

      if (activeYearId) {
        let resolvedSchedule = workingSchedule
        if (!resolvedSchedule) {
            const schedulesData = await api.getSchedules(activeYearId)
            resolvedSchedule = schedulesData[0]
                ? await api.setWorkingSchedule(schedulesData[0].id)
                : null
        }
        await loadYear(activeYearId, resolvedSchedule)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [loadYear])

  useEffect(() => { load() }, [load])

  // ── Assignment actions ──────────────────────────────────────────────────────

  const assign = useCallback(async (
    sectionId: string,
    courseCode: string,
    instructorId: string,
    term: Term,
    prevAssignmentId: string | null
  ) => {
    const sched = scheduleRef.current
    const yr = yearIdRef.current
    if (!sched || !yr) return

    const isFullYear = courseRulesRef.current.find(r => r.course_code === courseCode)?.is_full_year ?? false

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      instructor_id: instructorId,
      section_id: sectionId,
      course_code: courseCode,
      term,
    }

    // Collect all assignments that must be removed
    const toRemove = sched.assignments.filter(a => {
      if (a.id === prevAssignmentId) return true
      if (isFullYear) return a.section_id === sectionId && a.term === term // one per term slot
      return a.section_id === sectionId // non-full year: only one chip ever
    })

    setSchedule(prev => {
      if (!prev) return prev
      const removeIds = new Set(toRemove.map(a => a.id))
      const filtered = prev.assignments.filter(a => !removeIds.has(a.id))
      return { ...prev, assignments: [...filtered, newAssignment] }
    })

    try {
      await Promise.all(toRemove.map(a => api.removeAssignment(yr, sched.id, a.id)))
      await api.addAssignment(yr, sched.id, newAssignment)
      triggerRevalidate()
    } catch (e) {
      console.error("Assignment failed", e)
      load()
    }
  }, [load, triggerRevalidate])

  const unassign = useCallback(async (assignmentId: string) => {
    const sched = scheduleRef.current
    const yr = yearIdRef.current
    if (!sched || !yr) return

    setSchedule(prev =>
      prev ? { ...prev, assignments: prev.assignments.filter(a => a.id !== assignmentId) } : prev
    )

    try {
      await api.removeAssignment(yr, sched.id, assignmentId)
      triggerRevalidate()
    } catch (e) {
      console.error("Unassign failed", e)
      load()
    }
  }, [load, triggerRevalidate])

  // ── Instructor actions ──────────────────────────────────────────────────────

  const createInstructor = useCallback(async (instructor: Instructor, rule: InstructorRule) => {
    const yr = yearIdRef.current
    if (!yr) return
    const [newInstructor, newRule] = await Promise.all([
      api.createInstructor(yr, instructor),
      api.addInstructorRule(yr, rule),
    ])
    setInstructors(prev => [...prev, newInstructor])
    setInstructorRules(prev => [...prev, newRule])
  }, [])

  const updateInstructor = useCallback(async (instructor: Instructor) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateInstructor(yr, instructor.id, instructor)
    setInstructors(prev => prev.map(i => i.id === instructor.id ? updated : i))
  }, [])

  const dropInstructor = useCallback(async (instructorId: string, dropped: boolean) => {
    const yr = yearIdRef.current
    if (!yr) return
    const rule = instructorRulesRef.current.find(r => r.instructor_id === instructorId)
    if (!rule) return
    const updated = await api.updateInstructorRule(yr, rule.id, { dropped })
    setInstructorRules(prev => prev.map(r => r.id === rule.id ? updated : r))
  }, [])

  const updateInstructorRule = useCallback(async (ruleId: string, updates: Partial<InstructorRule>) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateInstructorRule(yr, ruleId, updates)
    setInstructorRules(prev => prev.map(r => r.id === ruleId ? updated : r))
  }, [])


  // ── Course actions ──────────────────────────────────────────────────────────

  const createCourse = useCallback(async (course: Course, rule: CourseRule) => {
    const yr = yearIdRef.current
    if (!yr) return
    const [newCourse, newRule] = await Promise.all([
      api.createCourse(yr, course),
      api.addCourseRule(yr, rule),
    ])
    setCourses(prev => [...prev, newCourse])
    setCourseRules(prev => [...prev, newRule])
  }, [])

  const updateCourse = useCallback(async (course: Course) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateCourse(yr, course.id, course)
    setCourses(prev => prev.map(c => c.id === course.id ? updated : c))
  }, [])

  const dropCourse = useCallback(async (courseCode: string, dropped: boolean) => {
    const yr = yearIdRef.current
    if (!yr) return
    const rule = courseRulesRef.current.find(r => r.course_code === courseCode)
    if (!rule) return
    const updated = await api.updateCourseRule(yr, rule.id, { dropped })
    setCourseRules(prev => prev.map(r => r.id === rule.id ? updated : r))
  }, [])

  const updateCourseRule = useCallback(async (ruleId: string, updates: Partial<CourseRule>) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateCourseRule(yr, ruleId, updates)
    setCourseRules(prev => prev.map(r => r.id === ruleId ? updated : r))
  }, [])


  // ── Schedule / snapshot actions ─────────────────────────────────────────────

  const createSavedSchedule = useCallback(async () => {
    const sched = scheduleRef.current
    const yr = yearIdRef.current
    if (!sched || !yr) return
    const snapshot = await api.createSavedSchedule(yr, sched)
    setSchedules(prev => [...prev, snapshot])
    return snapshot
  }, [])

  const deleteSavedSchedule = useCallback(async (scheduleId: string) => {
    const yr = yearIdRef.current
    if (!yr) return
    await api.deleteSavedSchedule(scheduleId)
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))
  }, [])

  const switchSchedule = useCallback(async (scheduleId: string) => {
    const yr = yearIdRef.current
    if (!yr) return
    const newSchedule = await api.setWorkingSchedule(scheduleId)
    setSchedule(newSchedule)
    scheduleRef.current = newSchedule
    const result = await api.validateSchedule(yr, newSchedule.id)
    setViolations(result.validationResult.violations)
  }, [])

  // ── Year change ─────────────────────────────────────────────────────────────

  const changeYear = useCallback(async (newYearId: string) => {
    setYearId(newYearId)
    yearIdRef.current = newYearId
    setLoading(true)
    try {
      const schedulesData = await api.getSchedules(newYearId)
      const workingSchedule = schedulesData[0]
        ? await api.setWorkingSchedule(schedulesData[0].id)
        : null
      await loadYear(newYearId, workingSchedule)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [loadYear])

  return {
    years, yearId, courses, courseRules, instructors, instructorRules,
    schedules, schedule, assignments, violations,
    loading, error,
    assign, unassign,
    createInstructor, updateInstructor, dropInstructor,
    createCourse, updateCourse, dropCourse,
    createSavedSchedule, switchSchedule, deleteSavedSchedule,
    changeYear,
    refresh: load,
    updateInstructorRule,
    updateCourseRule,
  }
}
