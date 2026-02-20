export type SectionId = string;

export interface Section {
  id: SectionId,
  name: string,
  code: string,
  year_introduced: string,
  section_num: number,
  availability: SectionAvailability,
  capacity: number,
  assigned_to: InstructorId | null,
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
  positon: {short: string, long: string},
  workload_total: number,
  fall_assigned: Set<SectionId>,
  wint_assigned: Set<SectionId>,
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

export const sectionStateMock: SectionState = {
  byId: {
    "0": {
      id: "0",
      name: "intro to french (1)",
      code: "FREN101",
      year_introduced: "xx",
      section_num: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0"
    },
    "1": {
      id: "1",
      name: "intro to french (2)",
      code: "FREN102",
      year_introduced: "xx",
      section_num: 2,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0"
    },
    "2": {
      id: "2",
      name: "intro to french (3)",
      code: "FREN103",
      year_introduced: "xx",
      section_num: 3,
      availability: SectionAvailability.F,
      capacity: 200,      
      assigned_to: "0"
    },
    "3": {
      id: "3",
      name: "intro to french (4)",
      code: "FREN104",
      year_introduced: "xx",
      section_num: 4,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0"
    },
    "4": {
      id: "4",
      name: "intro to french (5)",
      code: "FREN105",
      year_introduced: "xx",
      section_num: 5,
      availability: SectionAvailability.FandW,
      capacity: 200,        
      assigned_to: "0"
    },
  },
  allIds: ["0", "1", "2", "3", "4"],
};

export const instructorStateMock: InstructorState = {
  byId: {
    "0": {
      id: "0",
      name: "John Robbin",
      positon: {short: "Prof.", long: "Professor"},
      workload_total: 4,
      fall_assigned: new Set<string>(["0", "1", "2", "3","4"]),
      wint_assigned: new Set<string>(["4"]),
    },
    "1": {
      id: "1",
      name: "Erin Erika",
      positon: {short: "T.F.", long: "Teaching Fellow"},
      workload_total: 2,
      fall_assigned: new Set<string>(),
      wint_assigned: new Set<string>(),
    },
  },
  allIds: ["0", "1"],
};