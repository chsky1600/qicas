import type { SectionState, InstructorState, Section, Instructor, Violation } from "./assignment.types";

// Deep-clone 
// These are needed because Instructor has Set objects which are
// shared by reference on a shallow spread. Snapshots must own independent copies.

function cloneSection(section: Section): Section {
    return {
        ...section,
    }
    }

function cloneViolations(violations: Violation[]): Violation[] {
    return violations.map(v => ({...v}))
}

function cloneInstructor(instructor: Instructor): Instructor {
    return {
        ...instructor,
        position: {...instructor.position},
        fall_assigned: new Set(instructor.fall_assigned),
        wint_assigned: new Set(instructor.wint_assigned),
        violations: {
            details_col_violations: cloneViolations(instructor.violations.details_col_violations),
            fall_col_violations: cloneViolations(instructor.violations.fall_col_violations),
            wint_col_violations: cloneViolations(instructor.violations.wint_col_violations),
        }
    }
}

export function cloneSectionState(sectionState: SectionState): SectionState {
    const clonedById: Record<string, Section> = {};
    for (const id in sectionState.byId) {
        clonedById[id] = cloneSection(sectionState.byId[id]);
    }
    return {
        byId: clonedById,
        allIds: [...sectionState.allIds],
    }
}

export function cloneInstructorState(instructorState: InstructorState): InstructorState {
    const clonedById: Record<string, Instructor> = {};
    for (const id in instructorState.byId) {
        clonedById[id] = cloneInstructor(instructorState.byId[id]);
    }
    return {
        byId: clonedById,
        allIds: [...instructorState.allIds],
    }
}