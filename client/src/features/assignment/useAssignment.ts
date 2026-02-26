import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAssignment, saveScheduleToBackend, saveDropped, fetchViolations } from './assignment.api'
import type {Assignment, Violation as BViolation} from "../../../../src/types";
import * as assignmentType from "./assignment.types";


// ─── Hook Return Type ─────────────────────────────────────────────────────────
// Describes everything the hook exposes to components that call useAssignment()

export interface UseAssignmentResult {
  sectionState: assignmentType.SectionState;
  instructorState: assignmentType.InstructorState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSection: (updatedSection: assignmentType.SectionUI) => void;
  updateInstructor: (updatedInstructor: assignmentType.InstructorUI) => void;
  makeAssignment: (assignedSectionId: assignmentType.SectionId, nextInstructorId: assignmentType.InstructorId, assignmentLocation: assignmentType.SectionAvailability, prevInstructorId: assignmentType.InstructorId | null) => void;
  removeAssignment: (unassignedSectionId: assignmentType.SectionId, prevInstructorId: assignmentType.InstructorId) => void;
  loadState: (sectionState: assignmentType.SectionState, instructorState: assignmentType.InstructorState) => void;
  activeSchedule: { id: string; name: string; year_id: string; date_created: string; is_rc: boolean } | null;
  dropInstructor: (instructor_id: assignmentType.InstructorId, dropped: boolean) => void;
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
    ["Error"]: 3,
    ["Warning"]: 2,
    ["Info"]: 1,
  }

  // Step 2: Apply each backend violation to the appropriate frontend entity
  for (const v of violations) {
    if (v.type === "Course") {
      // Match sections by course code map: (e.g. "CISC101" could return: set("CISC1011", "CISC1012"))
      
      sectionState.courseToSection[v.offending_id].forEach((sectionID) => {     
        const section = newSectionById[sectionID]
        const current = section.in_violation?.degree
        const incoming = v.degree
        if (!current || priority[incoming] > priority[current]) {
          newSectionById[sectionID] = { ...section, in_violation: v }
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
  const [year, setYear] = useState<string>("Y2026") //TODO change to be pulled

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
        await saveScheduleToBackend(
          yearRef.current,
          activeScheduleRef.current,
          sectionStateRef.current,
          instructorStateRef.current,
          controller.signal
        )

        // After saving, re-fetch violations and apply them to the state
        const violations = await fetchViolations(yearRef.current, activeScheduleRef.current.id)
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
    }, 1000)
  }, [])


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

      const assignment = await fetchAssignment(yearRef.current);

      let finalSectionState = assignment.sectionState
      let finalInstructorState = assignment.instructorState

      // If there is an active schedule, apply any existing violations on initial load
      if (assignment.activeSchedule) {
        const violations = await fetchViolations(
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
  const updateSection = (updatedSection: assignmentType.SectionUI) => {
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
  const updateInstructor = (updatedInstructor: assignmentType.InstructorUI) => {
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
    prevInstructorId: assignmentType.InstructorId | null = null
  ) => {

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

    // If no previous instructor was provided, check if the section already has one
    if (!prevInstructorId) {
      prevInstructorId = sectionState.byId[assignedSectionId].assignment?.instructor_id ?? null
    }

    // Remove the section from the previous instructor's term sets
    if (prevInstructorId) {
      const modifiablePrevInstructor: assignmentType.Instructor = { ...instructorState.byId[prevInstructorId] }
      modifiablePrevInstructor.fall_assigned.delete(assignedSectionId)
      modifiablePrevInstructor.wint_assigned.delete(assignedSectionId)

      setInstructorState(prev => ({
        ...prev,
        byId: {
          ...prev.byId,
          [prevInstructorId]: modifiablePrevInstructor
        }
      }))
    }

    // Update the section's assigned_to pointer
    const modifiableAssignedSection: assignmentType.Section = { ...sectionState.byId[assignedSectionId] }
    modifiableAssignedSection.assigned_to = nextInstructorId

    // Add the section to the next instructor's appropriate term set(s)
    const modifiableNextInstructor: assignmentType.Instructor = { ...instructorState.byId[nextInstructorId] }
    const isFullYear = (modifiableAssignedSection.availability === assignmentType.SectionAvailability.FandW)

    if (isFullYear || assignmentLocation === assignmentType.SectionAvailability.F) {
      modifiableNextInstructor.fall_assigned.add(assignedSectionId)
    }
    if (isFullYear || assignmentLocation === assignmentType.SectionAvailability.W) {
      modifiableNextInstructor.wint_assigned.add(assignedSectionId)
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

    triggerAutoSave()
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
    prevInstructorId: assignmentType.InstructorId
  ) => {

    if (!stateObjectExists(sectionState, unassignedSectionId)) {
      // TODO return error
      console.log(`WARN: section with id ${unassignedSectionId} does not exist`)
      return
    }

    if (!stateObjectExists(instructorState, prevInstructorId)) {
      // TODO return error
      console.log(`WARN: instructor with id ${prevInstructorId} does not exist`)
      return
    }

    // Remove the section from both term sets on the previous instructor
    const modifiablePrevInstructor: assignmentType.Instructor = { ...instructorState.byId[prevInstructorId] }
    modifiablePrevInstructor.fall_assigned.delete(unassignedSectionId)
    modifiablePrevInstructor.wint_assigned.delete(unassignedSectionId)

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

    triggerAutoSave()
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
    await saveDropped(yearRef.current, instructor.rule_id, dropped)
    updateInstructor({ ...instructor, dropped })
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
  }
}
