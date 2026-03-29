import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { toast } from "sonner"
import * as api from "./api"
import type {
  Year, Course, Instructor, Schedule, Assignment,
  InstructorRule, CourseRule, Violation, Term, ValidationMode
} from "./types"
import  {
  RANK_DISPLAY
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
  saving: boolean
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
  addSchedule: () => Promise<Schedule | undefined>
  copySchedule: (schedule: Schedule) => Promise<Schedule | undefined>
  deleteSavedSchedule: (scheduleId: string) => Promise<void>
  renameSchedule: (scheduleId: string, newName: string)  => Promise<void>
  switchSchedule: (scheduleId: string) => Promise<void>
  changeYear: (yearId: string) => Promise<void>
  migrateYear: (source_year_id: string, new_year_id: string, name: string, schedule_ids: string[]) => Promise<void>
  refresh: () => Promise<void>
  updateInstructorRule: (ruleId: string, updates: Partial<InstructorRule>) => Promise<void>
  updateCourseRule: (ruleId: string, updates: Partial<CourseRule>) => Promise<void>
  exportCSV: () => void
  creditsPerCourse: number
  validationMode: ValidationMode
  setValidationMode: (mode: ValidationMode) => void
  validateNow: () => Promise<void>
  validationStale: boolean
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
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creditsPerCourse, setCreditsPerCourse] = useState(1)
  const [validationMode, setValidationModeRaw] = useState<ValidationMode>("auto")
  const [validationStale, setValidationStale] = useState(false)
  const setValidationMode = useCallback((mode: ValidationMode) => {
    setValidationModeRaw(mode)
    setValidationStale(false)
  }, [])

  // Refs so async callbacks always read latest values
  const scheduleRef = useRef(schedule)
  const yearIdRef = useRef(yearId)
  const instructorRulesRef = useRef(instructorRules)
  const courseRulesRef = useRef(courseRules)
  const coursesRef = useRef(courses)
  const lastSchedulePerYear = useRef<Record<string, string>>({})
  useEffect(() => { scheduleRef.current = schedule }, [schedule])
  useEffect(() => { yearIdRef.current = yearId }, [yearId])
  useEffect(() => { instructorRulesRef.current = instructorRules }, [instructorRules])
  useEffect(() => { courseRulesRef.current = courseRules }, [courseRules])
  useEffect(() => { coursesRef.current = courses}, [courses])
  const validationModeRef = useRef(validationMode)
  useEffect(() => { validationModeRef.current = validationMode }, [validationMode])
  const localVersionRef = useRef(0)
  const savingRef = useRef(false)
  useEffect(() => { savingRef.current = saving }, [saving])

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
    if (validationModeRef.current === "manual") { setValidationStale(true); return }
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
    localVersionRef.current = workingSchedule?.version ?? 0

    if (workingSchedule) {
      try {
        const result = await api.validateSchedule(yr, workingSchedule.id)
        setViolations(result.validationResult.violations)
      } catch {
        // support users get 403 on validate, just skip
        setViolations([])
      }
    } else {
        setViolations([])
    }
  }, [])

  // ── Initial load ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [yearsData, workingSchedule, creditsData] = await Promise.all([
        api.getYears(),
        api.getWorkingSchedule(),
        api.getCreditsPerCourse(),
      ])
      setCreditsPerCourse(creditsData.credits_per_course)

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

  // ── Version polling (detect external changes) ─────────────────────────────

  useEffect(() => {
    const poll = async () => {
      if (document.hidden || savingRef.current) return
      const sched = scheduleRef.current
      const yr = yearIdRef.current
      if (!sched || !yr) return
      try {
        const { version } = await api.getScheduleVersion(yr, sched.id)
        if (version > localVersionRef.current) {
          const fresh = await api.getWorkingSchedule()
          if (fresh && fresh.id === scheduleRef.current?.id) {
            setSchedule(fresh)
            scheduleRef.current = fresh
            localVersionRef.current = fresh.version ?? 0
            triggerRevalidate()
            toast.info("Schedule updated by a registered admin")
          }
        }
      } catch {
        // poll failure is silent, will retry next interval
      }
    }

    const interval = setInterval(poll, 5000)
    const onVisible = () => { if (!document.hidden) poll() }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [triggerRevalidate])

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

    // pre-check: section+term at co-teaching limit
    const CO_TEACHING_LIMIT = 2
    const existing = sched.assignments.filter(
      a => a.section_id === sectionId && a.term === term && a.id !== prevAssignmentId
    ).length
    if (existing >= CO_TEACHING_LIMIT) {
      toast.warning("Section already has maximum instructors for this term")
      return
    }

    setSaving(true)

    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      instructor_id: instructorId,
      section_id: sectionId,
      course_code: courseCode,
      term,
    }

    // only remove the specific assignment being moved, never other co-teaching assignments
    const toRemove = prevAssignmentId
      ? sched.assignments.filter(a => a.id === prevAssignmentId)
      : []

    setSchedule(prev => {
      if (!prev) return prev
      const removeIds = new Set(toRemove.map(a => a.id))
      const filtered = prev.assignments.filter(a => !removeIds.has(a.id))
      return { ...prev, assignments: [...filtered, newAssignment] }
    })

    try {
      await Promise.all(toRemove.map(a => api.removeAssignment(yr, sched.id, a.id)))
      localVersionRef.current += toRemove.length
      await api.addAssignment(yr, sched.id, newAssignment)
      localVersionRef.current += 1
      triggerRevalidate()
    } catch (e: any) {
      console.error("Assignment failed", e)
      if (e.message?.includes("409")) {
        toast.warning("Another user already assigned this section")
      }
      load()
    }
    setSaving(false)
  }, [load, triggerRevalidate])

  const unassign = useCallback(async (assignmentId: string) => {
    const sched = scheduleRef.current
    const yr = yearIdRef.current
    if (!sched || !yr) return
    setSaving(true)

    setSchedule(prev =>
      prev ? { ...prev, assignments: prev.assignments.filter(a => a.id !== assignmentId) } : prev
    )

    try {
      await api.removeAssignment(yr, sched.id, assignmentId)
      localVersionRef.current += 1
      triggerRevalidate()
    } catch (e) {
      console.error("Unassign failed", e)
      load()
    }
    setSaving(false)
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
    triggerRevalidate()
  }, [triggerRevalidate])

  const updateInstructorRule = useCallback(async (ruleId: string, updates: Partial<InstructorRule>) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateInstructorRule(yr, ruleId, updates)
    setInstructorRules(prev => prev.map(r => r.id === ruleId ? updated : r))
    triggerRevalidate()
  }, [triggerRevalidate])


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

    // If dropping, remove all assignments for this course from the active schedule
    if (dropped) {
      const sched = scheduleRef.current
      const course = coursesRef.current.find(c => c.code === courseCode)
      if (sched && course) {
        const sectionIds = new Set(course.sections.map(s => s.id))
        const toRemove = sched.assignments.filter(a => sectionIds.has(a.section_id))
        await Promise.all(toRemove.map(a => api.removeAssignment(yr, sched.id, a.id)))
        setSchedule(prev =>
          prev ? { ...prev, assignments: prev.assignments.filter(a => !sectionIds.has(a.section_id)) } : prev
        )
      }
    }
    triggerRevalidate()
  }, [triggerRevalidate])

  const updateCourseRule = useCallback(async (ruleId: string, updates: Partial<CourseRule>) => {
    const yr = yearIdRef.current
    if (!yr) return
    const updated = await api.updateCourseRule(yr, ruleId, updates)
    setCourseRules(prev => prev.map(r => r.id === ruleId ? updated : r))
    triggerRevalidate()
  }, [triggerRevalidate])


  // ── Schedule / snapshot actions ─────────────────────────────────────────────

  const addSchedule = useCallback(async () => {
    const yr = yearIdRef.current
    if (!yr) return
    const newSchedule: Schedule = {
      id: "overwritten", // will be ovewritten
      name: "New Schedule",
      year_id: yr,
      date_created: "overwritten", // will be ovewritten
      is_rc: false,
      assignments: [],
      version: 1,
    }
    const copySchedule = await api.createSavedSchedule(yr, newSchedule)
    setSchedules(prev => [...prev, copySchedule])
    return copySchedule
  }, [])

  const copySchedule = useCallback(async (schedule: Schedule) => {
    const yr = yearIdRef.current
    if (!yr) return
    const copiedSchedule = {...schedule, name: (schedule.name + " (copy)")}
    const copySchedule = await api.createSavedSchedule(yr, copiedSchedule)
    setSchedules(prev => [...prev, copySchedule])
    return copySchedule
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
    localVersionRef.current = newSchedule?.version ?? 0
    lastSchedulePerYear.current[yr] = scheduleId
    try {
      const result = await api.validateSchedule(yr, newSchedule.id)
      setViolations(result.validationResult.violations)
    } catch {
      setViolations([])
    }
  }, [])

  const renameSchedule = async (scheduleId: string, newName: string) => {
    const yr = yearIdRef.current
    if (!yr) return
    try {
      await api.renameSchedule(yr, scheduleId, newName)
      setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, name: newName } : s))
      if (scheduleRef.current?.id === scheduleId) {
        setSchedule(prev => prev ? { ...prev, name: newName } : prev)
      }
    } catch (e) {
      console.log("Rename failed", e)
    }
  }
  // ── Year change ─────────────────────────────────────────────────────────────

  const changeYear = useCallback(async (newYearId: string) => {
    setYearId(newYearId)
    yearIdRef.current = newYearId
    setLoading(true)
    setSchedule(null)
    scheduleRef.current = null
    try {
      const schedulesData = await api.getSchedules(newYearId)
      const lastUsedId = lastSchedulePerYear.current[newYearId]
      const targetSchedule = lastUsedId
        ? schedulesData.find(s => s.id === lastUsedId) ?? schedulesData[0]
        : schedulesData[0]
      const workingSchedule = targetSchedule
        ? await api.setWorkingSchedule(targetSchedule.id)
        : null
      const validSchedule = workingSchedule?.year_id === newYearId ? workingSchedule : targetSchedule ?? null
      await loadYear(newYearId, validSchedule)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [loadYear])

  const migrateYear = useCallback(async (source_year_id: string, new_year_id: string, name: string, schedule_ids: string[]) => {
    try {
      await api.migrateToNextYear(source_year_id, new_year_id, name, schedule_ids)
      const updatedYears = await api.getYears()
      setYears(updatedYears)
      changeYear(new_year_id)
    } catch (e) {
      console.log(e)
      setError((e as Error).message)
    }
  }, [changeYear])

  // ── export scheudle ─────────────────────────────────────────────────────────────
  function exportCSV() {
    const scheduleName = schedule?.name ?? "Schedule"
  
    interface row {
      data: string[];
      fallAssign: string[];
      wintAssign: string[];
    }
  
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("-");
  
    // there must be at least 1
    let maxFallAssigned = 1;
    
    // fast reference between course codes and respective courses
    const courseMap = new Map<string, Course>();
    for (const c of courses) {
      courseMap.set(c.code, c);
    }

    // built for faster reference of which instructors are dropped
    const instructorDropedSet = new Set<string>();
    for (const ir of instructorRules){
      if (ir.dropped) instructorDropedSet.add(ir.instructor_id)
    }
    
    const exportMap = new Map<string, row>();
    for (const i of instructors) {
      const dropped = instructorDropedSet.has(i.id)
      if (!dropped) exportMap.set(i.id, {
          data: [RANK_DISPLAY[i.rank].short + " " + i.name],
          fallAssign: [],
          wintAssign: [],
        }
      )
    }

    for (const a of assignments) {
      const csvRow = exportMap.get(a.instructor_id);
      if (!csvRow) continue
  
      const c = courseMap.get(a.course_code);
      if (!c) continue;
  
      let courseString = a.course_code;
      if (c.sections.length > 1) {
        const s = c.sections.find(s => s.id === a.section_id) ?? { id: "", number: 1, capacity: 0 };
        courseString += "-" + s.number;
      }
  
      if (a.term === "Fall") {
        csvRow.fallAssign.push(courseString);
        if (csvRow.fallAssign.length > maxFallAssigned) {
          maxFallAssigned = csvRow.fallAssign.length;
        }
      }
  
      else if (a.term === "Winter") {
        csvRow.wintAssign.push(courseString);
      }
    }
  
    let csv: string = `${scheduleName},`;
  
    let fallPadding = ",";
    while (fallPadding.length < maxFallAssigned) fallPadding += ",";
    csv = csv + "Fall" + fallPadding + "Winter,\n";
  
    exportMap.forEach((row) => {
      const sortedFall = row.fallAssign.sort((a, b) => a.localeCompare(b));
      const sortedWint = row.wintAssign.sort((a, b) => a.localeCompare(b));
  
      while (sortedFall.length < maxFallAssigned) sortedFall.push("");
  
      const combinedRow = [...row.data];
      combinedRow.push(...sortedFall);
      combinedRow.push(...sortedWint);
  
      csv += combinedRow.join(",") + "\n";
    });
  
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
  
    a.download = `${scheduleName}-${timestamp}.csv`;
  
    a.click();
    URL.revokeObjectURL(url);
  }

  const validatingRef = useRef(false)
  const validateNow = useCallback(async () => {
    if (validatingRef.current) return
    validatingRef.current = true
    try {
      await revalidate()
      setValidationStale(false)
    } finally {
      validatingRef.current = false
    }
  }, [revalidate])

  return {
    years, yearId, courses, courseRules, instructors, instructorRules,
    schedules, schedule, assignments, violations,
    saving, loading, error,
    creditsPerCourse,
    validationMode, setValidationMode, validateNow, validationStale,
    assign, unassign,
    createInstructor, updateInstructor, dropInstructor,
    createCourse, updateCourse, dropCourse,
    addSchedule, copySchedule, switchSchedule, deleteSavedSchedule, renameSchedule,
    changeYear, migrateYear,
    exportCSV,
    refresh: load,
    updateInstructorRule,
    updateCourseRule,
  }
}
