type SectionId = string;

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

export enum SectionAvailability {
    F,
    W,
    FandW,
    ForW,
}

type InstructorId = string;

export interface Instructor {
  id: InstructorId,
  name: string,
  positon: {short: string, long: string},
  workload_total: number,
  assigned_sections: SectionId[],
  //TODO - warnings?
}

export interface InstructorState {
  byId: Record<SectionId, Instructor>;
  allIds: SectionId[];
}