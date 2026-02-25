import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAssignment, saveScheduleToBackend, saveDropped } from './assignment.api'
//import type { SectionId, Section, SectionState, InstructorId, Instructor, InstructorState } from "./assignment.types";
import * as assignmentType from "./assignment.types";



export interface UseAssignmentResult {
  sectionState: assignmentType.SectionState;
  instructorState: assignmentType.InstructorState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSection: (updatedSection: assignmentType.Section) => void;  
  updateInstructor: (updatedInstructor: assignmentType.Instructor) => void;  
  makeAssignment: (assignedSectionId: assignmentType.SectionId, nextInstructorId: assignmentType.InstructorId, assignmentLocation: assignmentType.SectionAvailability, prevInstructorId: assignmentType.InstructorId | null) => void;  
  removeAssignment: (unassignedSectionId: assignmentType.SectionId, prevInstructorId: assignmentType.InstructorId) => void;
  loadState: (sectionState: assignmentType.SectionState, instructorState: assignmentType.InstructorState) => void;
  activeSchedule: { id: string; name:string; year_id: string; date_created: string; is_rc: boolean } | null;
  dropInstructor: (instructor_id: assignmentType.InstructorId, dropped: boolean) => void;
}

function stateObjectExists(state: assignmentType.InstructorState | assignmentType.SectionState, id: assignmentType.InstructorId | assignmentType.SectionId): boolean {
  /**
   * Checks if an object (an instructor or section) exists within the provided state (InstructorState or SectionState)
   * Note: if state: InstructorState but id: SectionId (or vice versa), the function may provide a false positive
   * 
   * Input: state - InstructorState or SectionState which may contain the provided id
   *        id -  InstructorID or SectionID which will be used to search for the object in the provided state
   * 
   * Outpot: Boolean - true if object exists within state
   */
  
  // Checks if an object (an instructor or section) exists within the provided state
  // 
  // if Instructor not in InstructorState, return false
  if (!state.byId[id]) return false

  // if id not in the instructorState.allIds list, make no changes
  // TODO - maybe allIds should be an iterable set so we can just add the id if missing without concern
  if (state.allIds.indexOf(id) == -1) return false
  // TODO - this may be unneccisary, fix with a state scanner which looks for inconsistancies

  return true
}

export function useAssignment(): UseAssignmentResult {
  const [sectionState, setSectionState] = useState<assignmentType.SectionState>(assignmentType.sectionStateEmpty);  
  const [instructorState, setInstructorState] = useState<assignmentType.InstructorState>(assignmentType.instructorStateEmpty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<{ id: string; name: string; year_id: string; date_created: string; is_rc: boolean } | null>(null)
  const [year, setYear] = useState<string>("Y2026")

  const sectionStateRef = useRef(sectionState)
  const instructorStateRef = useRef(instructorState)
  const activeScheduleRef = useRef(activeSchedule)
  const yearRef = useRef(year)

  useEffect(() => { sectionStateRef.current = sectionState }, [sectionState])
  useEffect(() => { instructorStateRef.current = instructorState }, [instructorState])
  useEffect(() => { activeScheduleRef.current = activeSchedule }, [activeSchedule])
  useEffect(() => { yearRef.current = year }, [year])

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortController = useRef<AbortController | null>(null)

  const triggerAutoSave = useCallback(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    if (abortController.current) abortController.current.abort()
    saveTimeout.current = setTimeout(async () => {
      if (!activeScheduleRef.current) return
      const controller = new AbortController()
      abortController.current = controller
      try {
        await saveScheduleToBackend(yearRef.current, activeScheduleRef.current, sectionStateRef.current, instructorStateRef.current, controller.signal)
      } catch (e) {
        if ((e as Error).name !== "AbortError") console.error("Auto-save failed", e)
      }
    }, 1000)
  }, [])


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      /*
      const [sectionsRes, instructorsRes] = await Promise.all([
        fetch("/api/sections"),
        fetch("/api/instructors"),
      ]);

      if (!sectionsRes.ok || !instructorsRes.ok) {
        throw new Error("Failed to fetch data");
      }
      
      const sectionsData = await sectionsRes.json();
      const instructorsData = await instructorsRes.json();
      */

      const assignment = await fetchAssignment(yearRef.current);

      setSectionState(assignment.sectionState);
      setInstructorState(assignment.instructorState);
      setActiveSchedule(assignment.activeSchedule)
      if (assignment.activeSchedule?.year_id) setYear(assignment.activeSchedule.year_id)
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optional polling
  // occurs repeatedly
  /*
  useEffect(() => {
    const interval = setInterval(fetchData, 60_000); // every minute
    return () => clearInterval(interval);
  }, [fetchData]);
  */
  
  const updateSection = (updatedSection: assignmentType.Section) => {
    //TODO - Loading consideration?
    //TODO - API call

    // if id not in the sectionState.allIds list, make no changes
    if (sectionState.allIds.indexOf(updatedSection.id) == -1) return

    // if Section not in SectionState, make no changes
    if (!sectionState.byId[updatedSection.id]) return 

    //replace Section in state with updatedSection
    setSectionState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [updatedSection.id]: updatedSection
      }
    }))
  };


  const updateInstructor = (updatedInstructor: assignmentType.Instructor) => {
    //TODO - Loading consideration?

    // if id not in the instructorState.allIds list, make no changes
    if (instructorState.allIds.indexOf(updatedInstructor.id) == -1) return

    // if Instructor not in InstructorState, make no changes
    if (!instructorState.byId[updatedInstructor.id]) return 

    //replace instructor in state with updatedInstructor
    setInstructorState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [updatedInstructor.id]: updatedInstructor
      }
    }))
  };

  const makeAssignment = (assignedSectionId: assignmentType.SectionId, 
                          nextInstructorId: assignmentType.InstructorId, 
                          assignmentLocation: assignmentType.SectionAvailability, 
                          prevInstructorId: assignmentType.InstructorId | null = null) => {
    /**
     * Updates the state so that the section with id assignedSectionId, 
     * which was previously assigned to the instructor with id prevInstructorId,
     * is now assigned to the instructor with id nextInstructorID
     * 
     * If prevInstructorId is null or excluded, it is assumed that the section was previously unassigned
     * 
     */
    
    // we cannot assign to "fall or winter", only "fall", "winter" or both
    if (assignmentLocation == assignmentType.SectionAvailability.ForW) {
      // TODO return error
      console.log("WARN: cannot assign course to 'fall or winter', but be assigned to 'fall', 'winter', or both")
      return
    }

    // if next Instructor id does not exist, return error
    if (!stateObjectExists(instructorState, nextInstructorId)) {
      // TODO return error
      console.log(`WARN: instructor with id ${nextInstructorId} does not exist`)
      return
    }

    // if Section id does not exist, return error
    if (!stateObjectExists(sectionState, assignedSectionId)) {
      // TODO return error      
      console.log(`WARN: section with id ${assignedSectionId} does not exist`)
      return
    }

    // if a previous instructor id not provided
    if (!prevInstructorId){      
      // section.assigned_to is either an InstructorId or Null 
      // if section holds instructorID, assign it to prevInstructor (otherwise it remains null)
      prevInstructorId = sectionState.byId[assignedSectionId].assigned_to
      // this check exists to catch mistakes, where section is 
      // assigned to an instructor but they're not provided to the function
    }

    // if a previous instructor id provided
    if(prevInstructorId){
      // remove section from prev
      // TODO: call api to remove sectionID from prevInstructorID

      // local copy of the prev Instructor which can be modified without mutating the instructorState
      const modifiablePrevInstructor: assignmentType.Instructor = { ...instructorState.byId[prevInstructorId]}

      console.log("PREV")
      console.log(instructorState.byId[prevInstructorId])
      console.log(modifiablePrevInstructor.fall_assigned)

      // remove any instances of the assigned Section from prev instructor
      modifiablePrevInstructor.fall_assigned.delete(assignedSectionId);
      modifiablePrevInstructor.wint_assigned.delete(assignedSectionId);
      
      console.log(modifiablePrevInstructor.fall_assigned)
      
      setInstructorState(prev => ({
        ...prev,
        byId: {
          ...prev.byId,
          [prevInstructorId]: modifiablePrevInstructor
        }
      }))      
    }

    // TODO: call api to add sectionID to prevInstructorID in slot assignmentLocation

    // local copy of the assigned section which can be modified without mutating the sectionState
    const modifiableAssignedSection: assignmentType.Section = {...sectionState.byId[assignedSectionId]}

    modifiableAssignedSection.assigned_to = nextInstructorId

    // local copy of the next Instructor which can be modified without mutating the instructorState
    const modifiableNextInstructor: assignmentType.Instructor = { ...instructorState.byId[nextInstructorId]}

    // full year courses will fill both slots automatically
    const isFullYear = (modifiableAssignedSection.availability == assignmentType.SectionAvailability.FandW)

    // if full year, or being assigned to fall, add course to fall list
    if(isFullYear || assignmentLocation == assignmentType.SectionAvailability.F){
      modifiableNextInstructor.fall_assigned.add(assignedSectionId)
    } 

    // if full year, or being assigned to wint, add course to wint list
    if(isFullYear || assignmentLocation == assignmentType.SectionAvailability.W){
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

  const removeAssignment = (unassignedSectionId: assignmentType.SectionId, 
                          prevInstructorId: assignmentType.InstructorId) => {

    // if Section id does not exist, return error
    if (!stateObjectExists(sectionState, unassignedSectionId)) {
      // TODO return error      
      console.log(`WARN: section with id ${unassignedSectionId} does not exist`)
      return
    }

    // if next Instructor id does not exist, return error
    if (!stateObjectExists(instructorState, prevInstructorId)) {
      // TODO return error
      console.log(`WARN: instructor with id ${prevInstructorId} does not exist`)
      return
    }

    // remove section from prev
    // TODO: call api to remove sectionID from prevInstructorID

    // local copy of the prev Instructor which can be modified without mutating the instructorState
    const modifiablePrevInstructor: assignmentType.Instructor = { ...instructorState.byId[prevInstructorId]}

    console.log("PREV")
    console.log(instructorState.byId[prevInstructorId])
    console.log(modifiablePrevInstructor.fall_assigned)

    // remove any instances of the removed Section from prev instructor
    modifiablePrevInstructor.fall_assigned.delete(unassignedSectionId);
    modifiablePrevInstructor.wint_assigned.delete(unassignedSectionId);
    
    console.log(modifiablePrevInstructor.fall_assigned)
    
    setInstructorState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [prevInstructorId]: modifiablePrevInstructor
      }
    }))

    // remove prev Instructor from section, to set it as null / unassigned

    // local copy of the assigned section which can be modified without mutating the sectionState
    const modifiableAssignedSection: assignmentType.Section = {...sectionState.byId[unassignedSectionId]}

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
  // loadState is used to load a new state, such as when loading a snapshot. It replaces the current section and instructor states with the provided states.
  const loadState = (newSectionState: assignmentType.SectionState, newInstructorState: assignmentType.InstructorState) => {
    setSectionState(newSectionState);
    setInstructorState(newInstructorState);
  }
  const dropInstructor = async (instructorId: assignmentType.InstructorId, dropped: boolean) => {
    const instructor = instructorState.byId[instructorId]
    if (!instructor || !instructor.rule_id) return
    await saveDropped(yearRef.current, instructor.rule_id, dropped)
    updateInstructor({ ...instructor, dropped })
  }


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
    dropInstructor
  }
}