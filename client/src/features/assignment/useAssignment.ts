import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './assignment.api'
import type {Assignment as BAssignment, Violation as BViolation} from "../../../../src/types";
//import { fetchAssignment, saveScheduleToBackend, saveDropped, fetchViolations, 
//        saveCourseSections as saveCourseSectionsAPI, addCourseSection as addCourseSectionAPI, removeCourseSection as removeCourseSectionAPI } from './assignment.api'
//import type { BViolation } from './assignment.api'
import * as assignmentType from "./assignment.types";


// ─── Hook Return Type ─────────────────────────────────────────────────────────
// Describes everything the hook exposes to components that call useAssignment()

export interface UseAssignmentResult {
  sectionState: assignmentType.SectionState;
  instructorState: assignmentType.InstructorState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSection: (sectionStateLocal: assignmentType.SectionState, sectionId: string, updateHere:boolean) => Promise<assignmentType.SectionState>;
  updateInstructor: (instructorStateLocal: assignmentType.InstructorState, instructorId: string, updateHere:boolean) => Promise<assignmentType.InstructorState>;
  makeAssignment: (assignedSectionId: assignmentType.SectionId, nextInstructorId: assignmentType.InstructorId, assignmentLocation: assignmentType.SectionAvailability) => Promise<void>;
  removeAssignment: (prevAssignmentId: string, refresh: boolean) => void;  
  loadState: (sectionState: assignmentType.SectionState, instructorState: assignmentType.InstructorState) => void;  
  activeSchedule: { id: string; name: string; year_id: string; date_created: string; is_rc: boolean } | null;
  dropInstructor: (instructor_id: assignmentType.InstructorId, dropped: boolean) => void;
  saveCourseSections: (courseId: string, sections: Array<{ id: string, capacity: number }>) => Promise<void>;
  addSection: (courseId: string, course_code: string, courseName: string, year_introduced: string, workload: number, availability: assignmentType.SectionAvailability) => Promise<void>;
  removeSection: (sectionId: string) => Promise<void>;
}


// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Returns true if the given id exists in the provided state (either InstructorState or SectionState).
 * Checks both `byId` and `allIds` to guard against inconsistent state.
 *
 * NOTE: Passing an InstructorId with an InstructorState (or SectionId with SectionState) is safe.
 *       Mixing types (e.g. SectionId into InstructorState) may produce a false positive.
 */
function stateObjectExists(
  state: assignmentType.InstructorState | assignmentType.SectionState,
  id: assignmentType.InstructorId | assignmentType.SectionId
): boolean {
  if (!state.byId[id]) return false
  if (state.allIds.indexOf(id) === -1) return false
  // TODO - maybe allIds should be an iterable set so we can just add the id if missing without concern
  // TODO - this may be unneccisary, fix with a state scanner which looks for inconsistancies
  return true
}

/**
 * Takes the raw list of violations from the backend and applies them to the current
 * sectionState and instructorState, returning updated copies of both.
 *
 * Steps:
 *  1. Reset all violations on every section and instructor (so stale violations are cleared).
 *  2. For each backend violation:
 *     - "Course" type  → find matching section(s) by `${dept}${code}` and set `in_violation`
 *                        (only upgrades severity, never downgrades)
 *     - "Instructor" type → find the matching instructor by ID and push to `details_col_violations`
 *
 * "Schedule"-type violations are currently not applied to any individual item.
 */
function applyViolations(
  violations: BViolation[],
  sectionState: assignmentType.SectionState,
  instructorState: assignmentType.InstructorState
): { sectionState: assignmentType.SectionState; instructorState: assignmentType.InstructorState } {

  // Step 1: Reset all violations — build fresh byId maps with cleared violation fields
  const newSectionById: Record<string, assignmentType.SectionUI> = {}
  for (const id of sectionState.allIds) {
    newSectionById[id] = { ...sectionState.byId[id], in_violation: null }
  }

  const newInstructorById: Record<string, assignmentType.InstructorUI> = {}
  for (const id of instructorState.allIds) {
    newInstructorById[id] = {
      ...instructorState.byId[id],
      violations: { details_col_violations: [], fall_col_violations: [], wint_col_violations: [] }
    }
  }

  // Used to ensure a section's violation only escalates (E > W > I), never downgrades
  const priority = {
    "Error": 3,
    "Warning": 2,
    "Info": 1,
  }

  // Step 2: Apply each backend violation to the appropriate frontend entity
  for (const v of violations) {
    if (v.type === "Course") {
      // Match sections by course code (e.g. "CISC101")

      // check that there are section objects tied to the offending_id course_code
      if (!sectionState.courseToSection[v.offending_id]){
        continue
      }

      // for each SectionUI id tied to the course-code within the violation
      sectionState.courseToSection[v.offending_id].forEach((sectionId: string) => {
        const section = newSectionById[sectionId]

        // Update the chip colour - only escalate severity, never downgrade (e.g. E stays E even if there's a new W violation)
        const current = section.in_violation
        const incoming = v
        // Only apply if incoming severity is higher than what's already set
        if (!current || priority[incoming.degree] > priority[current.degree]) {
          newSectionById[sectionId] = { ...section, in_violation: incoming }
        }

        // Route the violation to the instructor's term coloumn so it appears
        // visually under the course chips when the vioaltion row is expanded,
        // A section can be in both fall and winter (Full-year), so we check both.
        const assignedTo = assignmentType.getSectionAssignedTo(section)
        if (assignedTo && newInstructorById[assignedTo]) {
          const inst = newInstructorById[assignedTo]
          const inFall = inst.fall_assigned.has(section.id)
          const inWint = inst.wint_assigned.has(section.id)
          newInstructorById[assignedTo] = {
            ...inst,
            violations: {
              ...inst.violations,
              fall_col_violations: inFall ? [...inst.violations.fall_col_violations, v] : inst.violations.fall_col_violations,
              wint_col_violations: inWint ? [...inst.violations.wint_col_violations, v] : inst.violations.wint_col_violations,
            }
          }
        }

      })
    } else if (v.type === "Instructor") {
      // Match instructors directly by ID
      const instructor = newInstructorById[v.offending_id]
      if (instructor) {
        newInstructorById[v.offending_id] = {
          ...instructor,
          violations: {
            ...instructor.violations,
            details_col_violations: [...instructor.violations.details_col_violations, v]
          }
        }
      }
    }
    // "Schedule"-level violations are not currently surfaced on individual items
  }

  return {
    sectionState: { ...sectionState, byId: newSectionById },
    instructorState: { ...instructorState, byId: newInstructorById },
  }
}


// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAssignment(): UseAssignmentResult {

  // ── State ──────────────────────────────────────────────────────────────────

  const [sectionState, setSectionState] = useState<assignmentType.SectionState>(assignmentType.sectionStateEmpty);
  const [instructorState, setInstructorState] = useState<assignmentType.InstructorState>(assignmentType.instructorStateEmpty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<{ id: string; name: string; year_id: string; date_created: string; is_rc: boolean } | null>(null)
  const [year, setYear] = useState<string>("Y2026")

  // ── Refs ───────────────────────────────────────────────────────────────────
  // Refs mirror the state values so async callbacks (triggerAutoSave) can always
  // read the latest value without needing to be in the React render cycle.

  const sectionStateRef = useRef(sectionState)
  const instructorStateRef = useRef(instructorState)
  const activeScheduleRef = useRef(activeSchedule)
  const yearRef = useRef(year)

  useEffect(() => { sectionStateRef.current = sectionState }, [sectionState])
  useEffect(() => { instructorStateRef.current = instructorState }, [instructorState])
  useEffect(() => { activeScheduleRef.current = activeSchedule }, [activeSchedule])
  useEffect(() => { yearRef.current = year }, [year])

  // Used by triggerAutoSave to debounce saves and cancel in-flight requests
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortController = useRef<AbortController | null>(null)


  // ── Auto-save ──────────────────────────────────────────────────────────────
  /**
   * Debounced auto-save. Waits 1 second after the last state change before saving.
   * If called again before the timer fires, the previous timer is cancelled (debounce).
   * Any in-flight save request is aborted before starting a new one.
   *
   * After a successful save, violations are fetched and applied to the local state
   * so the UI reflects the latest validation results.
   */
  const triggerAutoSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    if (abortController.current) abortController.current.abort()

    saveTimeout.current = setTimeout(async () => {
      if (!activeScheduleRef.current) return

      const controller = new AbortController()
      abortController.current = controller

      try {
        await api.saveScheduleToBackend(
          yearRef.current,
          activeScheduleRef.current,
          sectionStateRef.current,
          instructorStateRef.current,
          controller.signal
        )

        // After saving, re-fetch violations and apply them to the state
        const violations = await api.fetchViolations(yearRef.current, activeScheduleRef.current.id)
        const { sectionState: newSS, instructorState: newIS } = applyViolations(
          violations,
          sectionStateRef.current,
          instructorStateRef.current
        )
        setSectionState(newSS)
        setInstructorState(newIS)

      } catch (e) {
        // Ignore AbortError — it just means a newer save superseded this one
        if ((e as Error).name !== "AbortError") console.error("Auto-save failed", e)
      }
    }, 20)
  }, [])


  // ── Data Fetching ──────────────────────────────────────────────────────────
  /**
   * Loads the full assignment state from the backend for the current year.
   * After loading, also fetches and applies any existing violations.
   * Called once on mount and exposed as `refresh` for manual reloads.
   */
  const updateAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const assignment = await api.fetchAllAssignmentData(yearRef.current);

      let finalSectionState = assignment.sectionState
      let finalInstructorState = assignment.instructorState

      // If there is an active schedule, apply any existing violations on initial load
      if (assignment.activeSchedule) {
        const violations = await api.fetchViolations(
          assignment.activeSchedule.year_id,
          assignment.activeSchedule.id
        )
        if (violations.length > 0) {
          const applied = applyViolations(violations, finalSectionState, finalInstructorState)
          finalSectionState = applied.sectionState
          finalInstructorState = applied.instructorState
        }
      }

      setSectionState(finalSectionState);
      setInstructorState(finalInstructorState);
      setActiveSchedule(assignment.activeSchedule)
      if (assignment.activeSchedule?.year_id) setYear(assignment.activeSchedule.year_id)

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }
  
  /**
   * fetches data for Violation data from the backend for the current year.
   * Returns copy of sectionState and instructorState with violation data fetched from DB
   * 
   * @param sectionStateLocal - A SectionState object which will be copied and updated (Default is global sectionState)
   * @param sinstructorStateLocal - A InstructorState object which will be copied and updated (Default is global instructorState)
   * @param updateHere - if true the global sectionState and global instructorState will updated as well (Default is true)
   * 
   * Note if passed no parameters, 
   */
  const updateViolations = async (
    sectionStateLocal: assignmentType.SectionState = sectionState, 
    instructorStateLocal: assignmentType.InstructorState = instructorState, 
    updateHere:boolean = true): Promise<{sectionState: assignmentType.SectionState, instructorState: assignmentType.InstructorState}> => {
    let updatedSectionState = sectionStateLocal
    let updatedInstructorState = instructorStateLocal
    console.log("in Validation")
    console.log(updatedInstructorState.byId['inst-1'].assigned)
    try {
      if (!activeSchedule) return {sectionState: sectionStateLocal, instructorState: instructorStateLocal}

      const violations = await api.fetchViolations(year, activeSchedule.id)

      if (violations.length > 0) {
        const applied = applyViolations(violations, sectionStateLocal, instructorStateLocal)
        updatedSectionState = applied.sectionState
        updatedInstructorState = applied.instructorState
        
        console.log("after apply")
        console.log(updatedInstructorState.byId['inst-1'].assigned)

        if(updateHere){
          setSectionState(updatedSectionState);
          setInstructorState(updatedInstructorState);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    console.log("after Validation")
    console.log(updatedInstructorState.byId['inst-1'].assigned)
    return {sectionState: updatedSectionState, instructorState: updatedInstructorState}
  }

  /**
   * Called after assignment to isolate the sections which require updating
   * fetches data for a specific section from the backend for the current year.
   * Returns copy of sectionState with section data fetched from DB
   * 
   * @param sectionStateLocal - A SectionState object which will be copied and updated (Default is global sectionState)
   * @param sectionId  - The id section being updatedd
   * @param updateHere - if true the global sectionState will updated as well (Default is true)
   */
  const updateSection = async (sectionStateLocal: assignmentType.SectionState = sectionState, sectionId: string, updateHere:boolean = true): Promise<assignmentType.SectionState> => {
    let updatedSectionState = sectionStateLocal
    try {
      if (!stateObjectExists(sectionStateLocal, sectionId)) {
        console.log(`WARN: section with id ${sectionId} does not exist`)
        return sectionStateLocal
      }
      setLoading(true);
      setError(null);

      // simplified get of neccisary section values
      const s = sectionStateLocal.byId[sectionId]
      const courseId = assignmentType.getCourseID(s)
      const courseCode = assignmentType.getSectionCode(s)
      const bSectionId = assignmentType.getBSectionID(s)

      // TODO
      const fetchedSection = await api.fetchSectionData(yearRef.current, courseId, courseCode, bSectionId );

      if (!fetchedSection){
        return sectionStateLocal
      }

      updatedSectionState = {
        ...sectionStateLocal,
        byId: {
          ...sectionStateLocal.byId,
          [sectionId]: fetchedSection
        }
      }

      if(updateHere){
        setSectionState(updatedSectionState)
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    return updatedSectionState
  }
  
  /**
   * Called after assignment to isolate the instructors which require updating
   * fetches data for a specific Instructor from the backend for the current year.
   * Returns copy of instructorState with instructor data fetched from DB
   * 
   * @param instructorStateLocal - A InstructorState object which will be copied and updated (Default is global instructorState)
   * @param instructorId - The id of instructor being updated
   * @param updateHere - if true the global instructorState will updated as well (Default is true)
   */
  const updateInstructor = async (instructorStateLocal: assignmentType.InstructorState = instructorState, instructorId: string, updateHere:boolean = true): Promise<assignmentType.InstructorState> => {
    let updatedInstructorState = instructorStateLocal
    try {
      if (!stateObjectExists(instructorStateLocal, instructorId)) {
        // TODO return error
        console.log(`WARN: instructor with id ${instructorId} does not exist`)
        return instructorStateLocal
      }
      setLoading(true);
      setError(null);


      const fetchedInstructor = await api.fetchInstructorData(yearRef.current,instructorId);
      if (!fetchedInstructor){     
        return instructorStateLocal
      }

      updatedInstructorState = {
        ...instructorStateLocal,
        byId: {
          ...instructorStateLocal.byId,
          [instructorId]: fetchedInstructor
        }
      }
      
      if (updateHere) {
        setInstructorState(updatedInstructorState)
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
    return updatedInstructorState
  }
  
  // Fetch data once when the hook is first mounted
  useEffect(() => {
    updateAllData();
  }, []);

  // ── State Mutators ─────────────────────────────────────────────────────────

  /**
   * Assigns a section to an instructor for a given term (Fall, Winter, or both).
   *
   * @param assignedSectionId   - The section being assigned
   * @param nextInstructorId    - The instructor receiving the assignment
   * @param assignmentLocation  - Which term to assign (F, W, or FandW — not ForW)
   * @param prevAssignmentId    - The Id of the assignment object currently holding the section, if any.
   *                              If null/omitted, the section is not currently assigned.
   *
   * Behaviour:
   *  - Removes the section from the previous instructor's fall/wint sets
   *  - Adds the section to the next instructor's fall/wint sets (based on assignmentLocation)
   *  - Full-year sections (FandW) are added to both fall and winter automatically
   *  - Triggers a debounced auto-save after the state update
   */
  const makeAssignment = async (
    assignedSectionId: assignmentType.SectionId,
    nextInstructorId: assignmentType.InstructorId,
    assignmentLocation: assignmentType.SectionAvailability
  ) => {
    if (!activeScheduleRef.current) return   

    // ForW means "fall OR winter" — the user must pick one explicitly
    if (assignmentLocation === assignmentType.SectionAvailability.ForW) {
      console.log("WARN: cannot assign course to 'fall or winter', must assign to 'fall', 'winter', or both")
      return
    }

    if (!stateObjectExists(instructorState, nextInstructorId)) {
      // TODO return error
      console.log(`WARN: instructor with id ${nextInstructorId} does not exist`)
      return
    }
    
    if (!stateObjectExists(sectionState, assignedSectionId)) {
      // TODO return error
      console.log(`WARN: section with id ${assignedSectionId} does not exist`)
      return
    }
    const assignedSection = sectionState.byId[assignedSectionId] 

    const assignedCourseCode = assignmentType.getSectionCode(assignedSection)
    const assignedBSectionId = assignmentType.getBSectionID(assignedSection)

    // remove all assignments made to course: assignedCourseCode & section: assignedBSectionId
    await api.removeAllAssignmentsForSection(yearRef.current, activeScheduleRef.current.id, assignedBSectionId, assignedCourseCode)

    if (assignmentLocation == assignmentType.SectionAvailability.F){  
      await api.addAssignment(yearRef.current, activeScheduleRef.current.id, nextInstructorId, assignedBSectionId, assignedCourseCode, "Fall")
    }
    else if (assignmentLocation == assignmentType.SectionAvailability.W){
      await api.addAssignment(yearRef.current, activeScheduleRef.current.id, nextInstructorId, assignedBSectionId, assignedCourseCode, "Winter")
    }
    else if (assignmentLocation == assignmentType.SectionAvailability.FandW){
      await api.addAssignment(yearRef.current, activeScheduleRef.current.id, nextInstructorId, assignedBSectionId, assignedCourseCode, "Fall")
      await api.addAssignment(yearRef.current, activeScheduleRef.current.id, nextInstructorId, assignedBSectionId, assignedCourseCode, "Winter")
    }

    updateAllData()
  };


  /**
   * Removes a section from an instructor, setting the section back to unassigned.
   *
   * @param prevAssignmentId    - The assignment id to unassign
   * @param refresh             - refreshes state after removal if true, true by default
   *
   * Behaviour:
   *  - Removes the section from the instructor's fall and winter sets
   *  - Sets the section's `assigned_to` to null
   *  - Triggers a debounced auto-save after the state update
   */  
  const removeAssignment = async (
    prevAssignmentId: string,
    refresh: boolean = true
  ) => {
    if (!activeScheduleRef.current) return
    await api.removeAssignment(yearRef.current, activeScheduleRef.current.id, prevAssignmentId)
    
    if (refresh) updateAllData()
    return
  };



  /**
   * Replaces the current sectionState and instructorState wholesale.
   * Used when loading a snapshot to restore a previously saved schedule state.
   */
  const loadState = (
    newSectionState: assignmentType.SectionState,
    newInstructorState: assignmentType.InstructorState
  ) => {
    setSectionState(newSectionState)
    setInstructorState(newInstructorState)
  }

  /**
   * Marks an instructor as dropped (or un-dropped) in the backend and updates local state.
   * `dropped` is a frontend-only concept stored on the instructor rule — it hides the instructor
   * from the active assignment view without deleting them.
   *
   * @param instructorId - The instructor to update
   * @param dropped      - true to drop, false to reinstate
   */
  const dropInstructor = async (instructorId: assignmentType.InstructorId, dropped: boolean) => {    
    const instructor = instructorState.byId[instructorId]
    if (!instructor || !instructor.rule_id) return
    await api.saveDropped(yearRef.current, instructor.rule_id, dropped)
    updateInstructor({ ...instructor, dropped })
  }

  /**
   * Updates section capacities in local state and persists to backend via PATCH.
   */
  const saveCourseSections = async (courseId: string, updatedSections: Array<{ id: string; capacity: number }>) => {
    setSectionState(prev => {
      const newById = { ...prev.byId }
      for (const { id, capacity } of updatedSections) {
        if (newById[id]) newById[id] = { ...newById[id], capacity }
      }
      return { ...prev, byId: newById }
    })
    try {
      await api.saveCourseSections(yearRef.current, courseId, updatedSections)
    } catch (e) {
      console.error('Failed to save section capacities', e)
    }
  }

  /**
   * Adds a new section to a course in the backend and inserts it into local sectionState.
   */
  const addSection = async (
    courseId: string,
    course_code: string,
    courseName: string,
    year_introduced: string,
    workload: number,
    availability: assignmentType.SectionAvailability
  ) => {
    try {
      const result = await api.addCourseSection(yearRef.current, courseId)
      if (!result) return
      const newSection: assignmentType.Section = {
        id: result.id,
        course_id: courseId,
        name: courseName,
        course_code,
        year_introduced,
        section_num: result.number,
        workload,
        availability,
        capacity: 0,
        assigned_to: null,
        dropped: false,
        in_violation: null,
      }
      setSectionState(prev => ({
        byId: { ...prev.byId, [newSection.id]: newSection },
        allIds: [...prev.allIds, newSection.id],
      }))
    } catch (e) {
      console.error('Failed to add section', e)
    }
  }

  /**
   * Removes a section from the course in the backend and from local sectionState.
   * If the section is assigned to an instructor, the assignment is cleared first.
   */
  const removeSection = async (sectionId: string) => {
    const section = sectionState.byId[sectionId]
    if (!section) return

    // Clear assignment if the section is currently assigned
    if (assignmentType.getSectionAssignedTo(section)) {
      removeAssignment(sectionId)
    }

    // Remove from local state
    setSectionState(prev => {
      const newById = { ...prev.byId }
      delete newById[sectionId]
      return {
        byId: newById,
        allIds: prev.allIds.filter(id => id !== sectionId),
      }
    })

    try {
      await api.removeCourseSection(yearRef.current, section.course_id, sectionId)
    } catch (e) {
      console.error('Failed to remove section', e)
    }
  }



  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    sectionState,
    instructorState,
    loading,
    error,
    refresh: updateAllData,
    updateSection,
    updateInstructor,
    makeAssignment,
    removeAssignment,
    loadState,
    activeSchedule,
    dropInstructor,
    saveCourseSections,
    addSection,
    removeSection,
  }
}
