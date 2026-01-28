export type SectionId = string;

export interface Section {
  id: SectionId,
  name: string,
  code: string,
  year_introduced: string,
  section_num: number,
  availability: SectionAvailability,
  capacity: number,
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
    FandW = "Fall/Wint.",
    ForW = "Full Year",
}

export type InstructorId = string;

export interface Instructor {
  id: InstructorId,
  name: string,
  positon: {short: string, long: string},
  workload_total: number,
  fall_assigned: SectionId[],
  wint_assigned: SectionId[],
  //TODO - warnings?
}

export interface InstructorState {
  byId: Record<SectionId, Instructor>;
  allIds: SectionId[];
}

export const instructorStateEmpty: InstructorState = {
  byId: {},
  allIds: [],
};