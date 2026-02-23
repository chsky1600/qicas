export type SectionId = string;

export interface Section {
  id: SectionId,
  name: string,
  dept: string,
  code: string,
  year_introduced: string,
  section_num: number,
  workload: number,
  availability: SectionAvailability,
  capacity: number,
  assigned_to: InstructorId | null,
  dropped: boolean,
}

export interface SectionState {
  byId: Record<SectionId, Section>;
  allIds: SectionId[];
}

export const sectionStateEmpty: SectionState = {
  byId: {},
  allIds: [],
};

export enum SectionAvailability {
    F = "Fall",
    W = "Winter",
    FandW = "Full Year",
    ForW = "Fall/Wint.",
}

export type InstructorId = string;

export interface Instructor {
  id: InstructorId,
  name: string,
  position: {short: string, long: string},
  email: string,
  workload_total: number,
  modifier: number,
  notes: string,
  fall_assigned: Set<SectionId>,
  wint_assigned: Set<SectionId>,
  dropped: boolean,
  //TODO - warnings?
}

export interface InstructorState {
  byId: Record<InstructorId, Instructor>;
  allIds: InstructorId[];
}

export const instructorStateEmpty: InstructorState = {
  byId: {},
  allIds: [],
};