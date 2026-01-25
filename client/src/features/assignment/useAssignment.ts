import { useCallback, useEffect, useState } from 'react'
import { fetchAssignment } from './assignment.api'
import type { SectionState, InstructorState } from "./assignment.types";

export interface useAssignmentResult {
  sectionState: SectionState | null;
  instructorState: InstructorState | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSection: (updated: SectionState) => void;  
  updateInstructor: (updated: InstructorState) => void;  
  updateAssignment: () => void;
}

export function useAssignment(): useAssignmentResult {
  const [sectionState, setSectionState] = useState<SectionState | null>(null);  
  const [instructorState, setInstructorState] = useState<InstructorState | null>(null);
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
  const updateSection = (updated: SectionState) => {
    console.log(updated)
    /*
    setSections(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
    */
  };

  // TODO
  const updateInstructor = (updated: InstructorState) => {
    console.log(updated)
    /*
    setSections(prev =>
      prev.map(s => (s.id === updated.id ? updated : s))
    );
    */
  };

  // TODO
  const updateAssignment = () => {
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
    updateAssignment
  }
}