import { useState, useCallback } from "react";
import type { SectionState, InstructorState, Snapshot } from "./assignment.types";
import { cloneInstructorState, cloneSectionState } from "./assignment.utils";

export interface UseSnapshotsResults {
  snapshots: Snapshot[];
  saveSnapshots: (name: string, sectionState: SectionState, instructorState: InstructorState) => void;
  loadSnapshot: (snapshotId: string) => { sectionState: SectionState; instructorState: InstructorState } | null;
  renameSnapshot: (snapshotId: string, newName: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
}

export function useSnapshots(): UseSnapshotsResults {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  
  const saveSnapshots = useCallback(
    (name: string, sectionState: SectionState, instructorState: InstructorState) => {
      const newSnapshot: Snapshot = {
        id: crypto.randomUUID(),
        name,
        date: new Date().toISOString().slice(0,10), // ""YYYY-MM-DD" format
        sectionState: cloneSectionState(sectionState),
        instructorState: cloneInstructorState(instructorState),
      };
    setSnapshots((prev) => [...prev, newSnapshot]);
  }, []);
  
  const loadSnapshot = useCallback(
    (snapshotId: string) => {
      const snapshot = snapshots.find(s => s.id === snapshotId);
      if (!snapshot) return null;
      return {
        sectionState: cloneSectionState(snapshot.sectionState),
        instructorState: cloneInstructorState(snapshot.instructorState),
      };
    },
    [snapshots]
  );
  
  const renameSnapshot = useCallback((snapshotId: string, newName: string) => {
    setSnapshots((prev) =>
      prev.map((s => s.id === snapshotId ? { ...s, name: newName } : s))
    );
  }, []);
  
  const deleteSnapshot = useCallback((snapshotId: string) => {
    setSnapshots((prev) => prev.filter(s => s.id !== snapshotId));
  }, []);

  return {
    snapshots,
    saveSnapshots,
    loadSnapshot,
    renameSnapshot,
    deleteSnapshot,
  };
}