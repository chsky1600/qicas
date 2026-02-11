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
  updateSection: (id: assignmentType.SectionId, updated: assignmentType.Section) => void;  
  updateInstructor: (id: assignmentType.InstructorId, updated: assignmentType.Instructor) => void;  
  makeAssignment: () => void;  
  removeAssignment: () => void;
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
  // TODO
  const updateSection = (id: assignmentType.SectionId, updated: assignmentType.Section) => {
    setSectionState(prev => ({
      ...prev,
      byId: { ...prev.byId, [id]: updated },
      }));
  };

  // TODO
  const updateInstructor = (id: assignmentType.InstructorId, updated: assignmentType.Instructor) => {
    console.log(updated)
    setInstructorState(prev => ({
      ...prev,
      byId: { ...prev.byId, [id]: updated },
      }));
  };

  // TODO
  const makeAssignment = () => {
    /*
    setSections(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
    */
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