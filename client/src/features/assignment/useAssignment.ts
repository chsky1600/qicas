import { useCallback, useEffect, useRef, useState } from 'react'
import * as api  from './assignment.api'
import type { Violation as BViolation} from "../../../../src/types";
import {cloneInstructor} from "./assignment.utils"
import * as assignmentType from "./assignment.types";


// ─── Hook Return Type ─────────────────────────────────────────────────────────
// Describes everything the hook exposes to components that call useAssignment()

export interface UseAssignmentResult {
  sectionState: assignmentType.SectionState;
  instructorState: assignmentType.InstructorState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSection: (updatedSection: assignmentType.Section) => void;
  updateInstructor: (updatedInstructor: assignmentType.Instructor) => void;
  makeAssignment: (assignedSectionId: assignmentType.SectionId, nextInstructorId: assignmentType.InstructorId, assignmentLocation: assignmentType.SectionAvailability, prevInstructorId: assignmentType.InstructorId | null, prevTerm: assignmentType.SectionAvailability | null) => void;
  removeAssignment: (unassignedSectionId: assignmentType.SectionId, prevInstructorId: assignmentType.InstructorId, prevTerm: assignmentType.SectionAvailability | null) => void;
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
 * Converts the backend violation degree string to the frontend ViolationDegree enum.
 *   "Error"   → ViolationDegree.E
 *   "Warning" → ViolationDegree.W
 *   "Info"    → ViolationDegree.I
 */
function mapDegree(d: "Error" | "Warning" | "Info"): assignmentType.ViolationDegree {
  if (d === "Error") return assignmentType.ViolationDegree.E
  if (d === "Warning") return assignmentType.ViolationDegree.W
  return assignmentType.ViolationDegree.I
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
  const newSectionById: Record<string, assignmentType.Section> = {}
  for (const id of sectionState.allIds) {
    newSectionById[id] = { ...sectionState.byId[id], in_violation: null }
  }

  const newInstructorById: Record<string, assignmentType.Instructor> = {}
  for (const id of instructorState.allIds) {
    newInstructorById[id] = {
      ...instructorState.byId[id],
      violations: { details_col_violations: [], fall_col_violations: [], wint_col_violations: [] }
    }
  }

  // Used to ensure a section's violation only escalates (E > W > I), never downgrades
  const priority = {
    [assignmentType.ViolationDegree.E]: 3,
    [assignmentType.ViolationDegree.W]: 2,
    [assignmentType.ViolationDegree.I]: 1,
  }

  // Step 2: Apply each backend violation to the appropriate frontend entity
  for (const v of violations) {
    const frontendViolation: assignmentType.Violation = { msg: v.message, degree: mapDegree(v.degree) }

    if (v.type === "Course") {
      // Match sections by course code (e.g. "CISC101")
      for (const id of sectionState.allIds) {
        const section = newSectionById[id]
        if (section.course_code === v.offending_id) {

          // Update the chip colour - only escalate severity, never downgrade (e.g. E stays E even if there's a new W violation)
          const current = section.in_violation
          const incoming = mapDegree(v.degree)
          // Only apply if incoming severity is higher than what's already set
          if (!current || priority[incoming] > priority[current]) {
            newSectionById[id] = { ...section, in_violation: incoming }
          }

          // Scan all instructors to find who holds this section in fall/wint.
          for (const instId of instructorState.allIds) {
            const inst = newInstructorById[instId]
            const inFall = inst.fall_assigned.has(section.id)
            const inWint = inst.wint_assigned.has(section.id)
            if (inFall || inWint) {
              newInstructorById[instId] = {
                ...inst,
                violations: {
                  ...inst.violations,
                  fall_col_violations: inFall ? [...inst.violations.fall_col_violations, frontendViolation] : inst.violations.fall_col_violations,
                  wint_col_violations: inWint ? [...inst.violations.wint_col_violations, frontendViolation] : inst.violations.wint_col_violations,
                }
              }
            }
          }
        }
      }

    } else if (v.type === "Instructor") {
      // Match instructors directly by ID
      const instructor = newInstructorById[v.offending_id]
      if (instructor) {
        newInstructorById[v.offending_id] = {
          ...instructor,
          violations: {
            ...instructor.violations,
            details_col_violations: [...instructor.violations.details_col_violations, frontendViolation]
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


// ─── Assignment Persistence Helpers ───────────────────────────────────────────

/** Creates a map key for looking up backend assignment IDs */
function assignmentKey(instructorId: string, sectionId: string, term: "Fall" | "Winter"): string {
  return `${instructorId}:${sectionId}:${term}`
}

/** Converts frontend SectionAvailability to backend Term string */
function availabilityToTerm(avail: assignmentType.SectionAvailability): "Fall" | "Winter" | null {
  if (avail === assignmentType.SectionAvailability.F) return "Fall"
  if (avail === assignmentType.SectionAvailability.W) return "Winter"
  return null
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

  // Maps "instructorId:sectionId:term" to the backend assignment ID
  // Used to look up IDs when calling DELETE on individual assignments
  const assignmentIdMapRef = useRef(new Map<string, string>())

  // Used by refreshViolations to debounce violation fetches
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)


  // ── Violation Refresh ─────────────────────────────────────────────────────
  /**
   * Debounced violation refresh. Waits 500ms after the last call before fetching.
   * Assignments are now persisted individually via POST/DELETE, so this only
   * needs to re-fetch and apply violations — no full schedule save.
   */
  const refreshViolations = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)

    saveTimeout.current = setTimeout(async () => {
      if (!activeScheduleRef.current) return

      try {
        const violations = await api.fetchViolations(yearRef.current, activeScheduleRef.current.id)
        const { sectionState: newSS, instructorState: newIS } = applyViolations(
          violations,
          sectionStateRef.current,
          instructorStateRef.current
        )
        setSectionState(newSS)
        setInstructorState(newIS)
      } catch (e) {
        console.error("Violation refresh failed", e)
      }
    }, 500)
  }, [])

  /**
   * Fires backend API calls for assignment changes (removals then additions),
   * updates the assignment ID map, and triggers a violation refresh.
   * Called after optimistic state updates so the UI stays instant.
   */
  const persistAssignmentChanges = useCallback((
    removals: { instructorId: string; sectionId: string; term: "Fall" | "Winter" }[],
    additions: { instructorId: string; sectionId: string; term: "Fall" | "Winter" }[]
  ) => {
    ;(async () => {
      try {
        const map = assignmentIdMapRef.current
        const schedule = activeScheduleRef.current
        if (!schedule) return

        for (const r of removals) {
          const key = assignmentKey(r.instructorId, r.sectionId, r.term)
          const id = map.get(key)
          if (id) {
            await api.removeAssignment(yearRef.current, schedule.id, id)
            map.delete(key)
          }
        }

        for (const a of additions) {
          const section = sectionStateRef.current.byId[a.sectionId]
          if (!section) continue
          const result = await api.addAssignment(
            yearRef.current, schedule.id,
            a.instructorId, a.sectionId, section.course_code, a.term
          )
          if (result) {
            map.set(assignmentKey(a.instructorId, a.sectionId, a.term), result.id)
          }
        }

        refreshViolations()
      } catch (e) {
        console.error("Assignment persistence failed", e)
      }
    })()
  }, [refreshViolations])


  // ── Data Fetching ──────────────────────────────────────────────────────────
  /**
   * Loads the full assignment state from the backend for the current year.
   * After loading, also fetches and applies any existing violations.
   * Called once on mount and exposed as `refresh` for manual reloads.
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const assignment = await api.fetchAssignment(yearRef.current);

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

      assignmentIdMapRef.current = assignment.assignmentIdMap

      setSectionState(finalSectionState);
      setInstructorState(finalInstructorState);
      setActiveSchedule(assignment.activeSchedule)
      if (assignment.activeSchedule?.year_id) setYear(assignment.activeSchedule.year_id)

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data once when the hook is first mounted
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // ── State Mutators ─────────────────────────────────────────────────────────

  /**
   * Replaces a single section in sectionState with the provided updated version.
   * No-ops if the section does not exist in state.
   * NOTE: Does not currently persist the change to the backend.
   *       Property-level edits (e.g. section notes) are not yet auto-saved.
   */
  const updateSection = (updatedSection: assignmentType.Section) => {
    //TODO - Loading consideration?
    //TODO - API call
    if (sectionState.allIds.indexOf(updatedSection.id) === -1) return
    if (!sectionState.byId[updatedSection.id]) return

    setSectionState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [updatedSection.id]: updatedSection
      }
    }))
  };

  /**
   * Replaces a single instructor in instructorState with the provided updated version.
   * No-ops if the instructor does not exist in state.
   * NOTE: Does not currently persist the change to the backend.
   *       Property-level edits are not yet auto-saved.
   */
  const updateInstructor = (updatedInstructor: assignmentType.Instructor) => {
    //TODO - Loading consideration?
    if (instructorState.allIds.indexOf(updatedInstructor.id) === -1) return
    if (!instructorState.byId[updatedInstructor.id]) return

    setInstructorState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [updatedInstructor.id]: updatedInstructor
      }
    }))
  };

  /**
   * Assigns a section to an instructor for a given term (Fall, Winter, or both).
   *
   * @param assignedSectionId   - The section being assigned
   * @param nextInstructorId    - The instructor receiving the assignment
   * @param assignmentLocation  - Which term to assign (F, W, or FandW — not ForW)
   * @param prevInstructorId    - The instructor currently holding the section, if any.
   *                              If null/omitted, the section's current `assigned_to` is used.
   *
   * Behaviour:
   *  - Removes the section from the previous instructor's fall/wint sets
   *  - Adds the section to the next instructor's fall/wint sets (based on assignmentLocation)
   *  - Full-year sections (FandW) are added to both fall and winter automatically
   *  - Triggers a debounced auto-save after the state update
   */
  const makeAssignment = (
    assignedSectionId: assignmentType.SectionId,
    nextInstructorId: assignmentType.InstructorId,
    assignmentLocation: assignmentType.SectionAvailability,
    prevInstructorId: assignmentType.InstructorId | null = null,
    prevTerm: assignmentType.SectionAvailability | null = null
  ) => {
    // ForW means "fall OR winter" — the user must pick one explicitly
    if (assignmentLocation === assignmentType.SectionAvailability.ForW) {
      console.log("WARN: cannot assign course to 'fall or winter', must assign to 'fall', 'winter', or both")
      return
    }

    if (!stateObjectExists(instructorState, nextInstructorId)) {
      console.log(`WARN: instructor with id ${nextInstructorId} does not exist`)
      return
    }

    if (!stateObjectExists(sectionState, assignedSectionId)) {
      console.log(`WARN: section with id ${assignedSectionId} does not exist`)
      return
    }

    // Guard: if the section is already assigned to this instructor in the target term, do nothing
    const nextInstr = instructorState.byId[nextInstructorId]
    if (assignmentLocation === assignmentType.SectionAvailability.F && nextInstr.fall_assigned.has(assignedSectionId)) return
    if (assignmentLocation === assignmentType.SectionAvailability.W && nextInstr.wint_assigned.has(assignedSectionId)) return

    // Track backend operations for individual endpoint calls
    const removals: { instructorId: string; sectionId: string; term: "Fall" | "Winter" }[] = []
    const additions: { instructorId: string; sectionId: string; term: "Fall" | "Winter" }[] = []

    // If no previous instructor was provided, check if the section already has one
    if (!prevInstructorId) {
      prevInstructorId = sectionState.byId[assignedSectionId].assigned_to
    }

    // Remove the section from the previous instructor's term sets
    if (prevInstructorId && prevTerm) {
      const prevTermBackend = availabilityToTerm(prevTerm)

      if (prevInstructorId === nextInstructorId) {
        const modifiable = cloneInstructor(instructorState.byId[prevInstructorId])
        if (prevTerm === assignmentType.SectionAvailability.F) {
          modifiable.fall_assigned.delete(assignedSectionId)
        } else if (prevTerm === assignmentType.SectionAvailability.W) {
          modifiable.wint_assigned.delete(assignedSectionId)
        }
        if (prevTermBackend) removals.push({ instructorId: prevInstructorId, sectionId: assignedSectionId, term: prevTermBackend })

        if (assignmentLocation === assignmentType.SectionAvailability.F) {
          modifiable.fall_assigned.add(assignedSectionId)
          additions.push({ instructorId: nextInstructorId, sectionId: assignedSectionId, term: "Fall" })
        }
        if (assignmentLocation === assignmentType.SectionAvailability.W) {
          modifiable.wint_assigned.add(assignedSectionId)
          additions.push({ instructorId: nextInstructorId, sectionId: assignedSectionId, term: "Winter" })
        }
        const modifiableAssignedSection: assignmentType.Section = { ...sectionState.byId[assignedSectionId] }
        modifiableAssignedSection.assigned_to = nextInstructorId
        setSectionState(prev => ({ ...prev, byId: { ...prev.byId, [assignedSectionId]: modifiableAssignedSection } }))
        setInstructorState(prev => ({ ...prev, byId: { ...prev.byId, [prevInstructorId]: modifiable } }))
        persistAssignmentChanges(removals, additions)
        return
      }

      const modifiablePrevInstructor = cloneInstructor(instructorState.byId[prevInstructorId])
      if (prevTerm === assignmentType.SectionAvailability.F) {
        modifiablePrevInstructor.fall_assigned.delete(assignedSectionId)
      } else if (prevTerm === assignmentType.SectionAvailability.W) {
        modifiablePrevInstructor.wint_assigned.delete(assignedSectionId)
      }
      if (prevTermBackend) removals.push({ instructorId: prevInstructorId, sectionId: assignedSectionId, term: prevTermBackend })

      setInstructorState(prev => ({
        ...prev,
        byId: { ...prev.byId, [prevInstructorId]: modifiablePrevInstructor }
      }))
    } else {
      for (const instId of instructorState.allIds) {
        if (instId === nextInstructorId) continue
        const inst = instructorState.byId[instId]
        if (assignmentLocation === assignmentType.SectionAvailability.F && inst.fall_assigned.has(assignedSectionId)) {
          removals.push({ instructorId: instId, sectionId: assignedSectionId, term: "Fall" })
          const m = cloneInstructor(inst); m.fall_assigned.delete(assignedSectionId)
          setInstructorState(prev => ({ ...prev, byId: { ...prev.byId, [instId]: m } }))
        } else if (assignmentLocation === assignmentType.SectionAvailability.W && inst.wint_assigned.has(assignedSectionId)) {
          removals.push({ instructorId: instId, sectionId: assignedSectionId, term: "Winter" })
          const m = cloneInstructor(inst); m.wint_assigned.delete(assignedSectionId)
          setInstructorState(prev => ({ ...prev, byId: { ...prev.byId, [instId]: m } }))
        }
      }
    }


    // Update the section's assigned_to pointer
    const modifiableAssignedSection: assignmentType.Section = { ...sectionState.byId[assignedSectionId] }
    modifiableAssignedSection.assigned_to = nextInstructorId

    // Add the section to the next instructor's appropriate term set(s)
    const modifiableNextInstructor = cloneInstructor(instructorState.byId[nextInstructorId])

    if (assignmentLocation === assignmentType.SectionAvailability.F) {
      modifiableNextInstructor.fall_assigned.add(assignedSectionId)
      additions.push({ instructorId: nextInstructorId, sectionId: assignedSectionId, term: "Fall" })
    }
    if (assignmentLocation === assignmentType.SectionAvailability.W) {
      modifiableNextInstructor.wint_assigned.add(assignedSectionId)
      additions.push({ instructorId: nextInstructorId, sectionId: assignedSectionId, term: "Winter" })
    }

    setSectionState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [assignedSectionId]: modifiableAssignedSection
      }
    }))

    setInstructorState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [nextInstructorId]: modifiableNextInstructor
      }
    }))

    persistAssignmentChanges(removals, additions)
  };

  /**
   * Removes a section from an instructor, setting the section back to unassigned.
   *
   * @param unassignedSectionId - The section to unassign
   * @param prevInstructorId    - The instructor currently holding the section
   *
   * Behaviour:
   *  - Removes the section from the instructor's fall and winter sets
   *  - Sets the section's `assigned_to` to null
   *  - Triggers a debounced auto-save after the state update
   */
  const removeAssignment = (
    unassignedSectionId: assignmentType.SectionId,
    prevInstructorId: assignmentType.InstructorId,
    prevTerm: assignmentType.SectionAvailability | null = null
  ) => {

    if (!stateObjectExists(sectionState, unassignedSectionId)) {
      console.log(`WARN: section with id ${unassignedSectionId} does not exist`)
      return
    }

    if (!stateObjectExists(instructorState, prevInstructorId)) {
      console.log(`WARN: instructor with id ${prevInstructorId} does not exist`)
      return
    }

    // Track which backend assignments to remove
    const removals: { instructorId: string; sectionId: string; term: "Fall" | "Winter" }[] = []

    // Remove the section from the appropriate term sets on the previous instructor
    const modifiablePrevInstructor = cloneInstructor(instructorState.byId[prevInstructorId])
    if (prevTerm === assignmentType.SectionAvailability.F) {
      modifiablePrevInstructor.fall_assigned.delete(unassignedSectionId)
      removals.push({ instructorId: prevInstructorId, sectionId: unassignedSectionId, term: "Fall" })
    } else if (prevTerm === assignmentType.SectionAvailability.W) {
      modifiablePrevInstructor.wint_assigned.delete(unassignedSectionId)
      removals.push({ instructorId: prevInstructorId, sectionId: unassignedSectionId, term: "Winter" })
    } else {
      // Dragged from panel - clear this section from whichever term set it is in
      modifiablePrevInstructor.fall_assigned.delete(unassignedSectionId)
      modifiablePrevInstructor.wint_assigned.delete(unassignedSectionId)
      // Check the map for which assignments actually exist in the backend
      const fallKey = assignmentKey(prevInstructorId, unassignedSectionId, "Fall")
      const wintKey = assignmentKey(prevInstructorId, unassignedSectionId, "Winter")
      if (assignmentIdMapRef.current.has(fallKey)) {
        removals.push({ instructorId: prevInstructorId, sectionId: unassignedSectionId, term: "Fall" })
      }
      if (assignmentIdMapRef.current.has(wintKey)) {
        removals.push({ instructorId: prevInstructorId, sectionId: unassignedSectionId, term: "Winter" })
      }
    }

    setInstructorState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [prevInstructorId]: modifiablePrevInstructor
      }
    }))

    // Clear the section's assigned_to field
    const modifiableAssignedSection: assignmentType.Section = { ...sectionState.byId[unassignedSectionId] }
    modifiableAssignedSection.assigned_to = null

    setSectionState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [unassignedSectionId]: modifiableAssignedSection
      }
    }))

    persistAssignmentChanges(removals, [])
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
    if (section.assigned_to) {
      removeAssignment(sectionId, section.assigned_to, null)
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
    refresh: fetchData,
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
