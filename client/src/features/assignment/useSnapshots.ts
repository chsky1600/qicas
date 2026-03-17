import { useState, useEffect, useRef, useCallback } from "react";
import type { SectionState, InstructorState, Snapshot, SnapshotState } from "./assignment.types";
import { snapshotStateEmpty } from "./assignment.types";
import { cloneInstructorState, cloneSectionState } from "./assignment.utils";
import * as api  from './assignment.api'

export interface UseSnapshotsResults {
  snapshotState: SnapshotState;
  getSnapshots: () => Promise<void>
  updateActiveSnapshot: (sectionState: SectionState, instructorState: InstructorState) => void
  saveSnapshots: (name: string, sectionState: SectionState, instructorState: InstructorState) => void;
  loadSnapshot: (snapshotId: string) => { sectionState: SectionState; instructorState: InstructorState } | null;
  renameSnapshot: (snapshotId: string, newName: string) => void;
  deleteSnapshot: (snapshotId: string) => void;
}

export function useSnapshots(): UseSnapshotsResults {
  const [snapshotState, setSnapshotState] = useState<SnapshotState>(snapshotStateEmpty);

  // API calls need reference to the year //TODO - integrate with year switch
  const [year, setYear] = useState<string>("Y2026")
  const yearRef = useRef(year)
  useEffect(() => { yearRef.current = year }, [year])
 
  const getSnapshots = useCallback(async () => {
    setSnapshotState(await api.fetchSnapshots(yearRef.current))
  }, []);

  const updateActiveSnapshot = (sectionState: SectionState, instructorState: InstructorState) => {
    setSnapshotState(prev => {
      if (prev.activeId == null){
        return prev
      }

      const active = prev.byId[prev.activeId]
      return {
        ...prev,
        byId: {
          ...prev.byId,
          [prev.activeId]: {
            ...active,
            sectionState,
            instructorState
          }
        }
      }
    })
  }

  // Fetch snapshots once when the hook is first mounted
  useEffect(() => {
    getSnapshots();
  }, [getSnapshots]);

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
    snapshotState,
    getSnapshots,
    updateActiveSnapshot,
    saveSnapshots,
    loadSnapshot,
    renameSnapshot,
    deleteSnapshot,
  };
}