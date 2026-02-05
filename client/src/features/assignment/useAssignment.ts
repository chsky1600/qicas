import { useCallback, useEffect, useState } from 'react'
import { fetchAssignment } from './assignment.api'
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
  removeAssignment: () => void;
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

      const assignment = fetchAssignment()

      setSectionState(assignment.sectionState);
      setInstructorState(assignment.instructorState);
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

  // User-triggered updates
  const updateSection = (updatedSection: assignmentType.Section) => {
    //TODO - Loading consideration?
    //TODO - API call

    // if id not in the sectionState.allIds list, make no changes
    if (sectionState.allIds.indexOf(updatedSection.id) > -1) return

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

      // remove any instances of the assigned Section from 
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
  };

  const removeAssignment = () => {
    /*
    setSections(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
    */
  };

  return {
    sectionState,
    instructorState,
    loading,
    error,
    refresh: fetchData,
    updateSection,
    updateInstructor,
    makeAssignment,
    removeAssignment
  }
}