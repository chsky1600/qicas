import { useState, useEffect, useRef, useCallback } from "react";
import type { SectionState, InstructorState, SnapshotState } from "./assignment.types";
import { snapshotStateEmpty } from "./assignment.types";
import { cloneInstructorState, cloneSectionState, cloneSnapshot } from "./assignment.utils";
import * as api  from './assignment.api'

export interface UseSnapshotsResults {
  snapshotState: SnapshotState;
  getSnapshots: () => Promise<void>
  copySnapshot: (snapshotId: string) => Promise<void>
  updateActiveSnapshot: (sectionState: SectionState, instructorState: InstructorState) => void
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
            sectionState: sectionState,
            instructorState: instructorState
          }
        }
      }
    })
  }

  //const saveSnapshots = useCallback(
  //  (name: string, sectionState: SectionState, instructorState: InstructorState) => {
  //    const newSnapshot: Snapshot = {
  //      id: crypto.randomUUID(),
  //      name,
  //      date: new Date().toISOString().slice(0,10), // ""YYYY-MM-DD" format
  //      sectionState: cloneSectionState(sectionState),
  //      instructorState: cloneInstructorState(instructorState),
  //    };
  //  setSnapshots((prev) => [...prev, newSnapshot]);
  //}, []);

  const copySnapshot = async (snapshotId: string) => {
    if (!snapshotId) return;
    const selected = snapshotState.byId[snapshotId];
    if (!selected) return;

    //TODO - add section here
    const snapshotClone = await api.createSnapshotCopy(yearRef.current, cloneSnapshot(selected))
    if (!snapshotClone) return

    setSnapshotState(prev => ({
      ...prev,
      byId: {
        ...prev.byId,
        [snapshotClone.id]: snapshotClone,
      },
      allIds: [...prev.allIds, snapshotClone.id]
    }));
  }
  
  const loadSnapshot = (snapshotId: string) => {
    const selected = snapshotState.byId[snapshotId];
    if (!selected) return null;

    //TODO - set current here

    setSnapshotState(prev => ({
      ...prev,
      activeId: snapshotId
    }))      
    
    return {
      sectionState: cloneSectionState(selected.sectionState),
      instructorState: cloneInstructorState(selected.instructorState),
    };
  };
  
  const renameSnapshot = (snapshotId: string, newName: string) => {
    if (!snapshotId) return;
    const selected = snapshotState.byId[snapshotId];
    if (!selected) return;

    //TODO - update API here    

    setSnapshotState(prev => ({
        ...prev,
        byId: {
          ...prev.byId,
          [selected.id]: {
            ...selected,
            name: newName,
          }
        }
      })
    )
  };
  
  const deleteSnapshot = (snapshotId: string) => {
    // if snapshotId is null or invalid, return
    // if snapshotId belongs to active Snapshot, return as we cannot remove the current snapshot
    if (!snapshotId || snapshotId == snapshotState.activeId) return;
    const selected = snapshotState.byId[snapshotId];
    if (!selected) return;

    //TODO - update API here

    setSnapshotState(prev => {
      const { [snapshotId]: _, ...newById } = prev.byId;

      return {
        ...prev,
        byId: newById,
        allIds: prev.allIds.filter(id => id !== snapshotId),
      };
    });
  }

  return {
    snapshotState,
    getSnapshots,
    copySnapshot,
    updateActiveSnapshot,
    loadSnapshot,
    renameSnapshot,
    deleteSnapshot,
  };
}