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
  in_violation: ViolationDegree | null, // null implies not in violation of any rules
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

export enum ViolationDegree {
    I = "INFO",
    W = "WARNING",
    E = "ERROR",
}

// returns coresponding tailwind background color class depending on provided ViolationDegree
export const getDegreeColor = (degree: ViolationDegree) => {
  switch(degree) {
    case ViolationDegree.I:
      return "bg-yellow-500";
    case ViolationDegree.W:
      return "bg-orange-500";
    case ViolationDegree.E:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export interface Violation {
  msg: string,
  degree: ViolationDegree,
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
  // violations are either in the instructor details column, the fall term column, or the winter term column
  violations: {
    details_col_violations: Violation[],
    fall_col_violations: Violation[],
    wint_col_violations: Violation[],
  }
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
      dept: "FREN",
      code: "101",
      year_introduced: "xx",
      section_num: 1,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
    "1": {
      id: "1",
      name: "intro to french (2)",
      dept: "FREN",
      code: "102",
      year_introduced: "xx",
      section_num: 2,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: ViolationDegree.I,
    },
    "2": {
      id: "2",
      name: "intro to french (3)",
      dept: "FREN",
      code: "103",
      year_introduced: "xx",
      section_num: 3,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: ViolationDegree.W,
    },
    "3": {
      id: "3",
      name: "intro to french (4)",
      dept: "FREN",
      code: "104",
      year_introduced: "xx",
      section_num: 4,
      workload: 1,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
    "4": {
      id: "4",
      name: "intro to french (5)",
      dept: "FREN",
      code: "105",
      year_introduced: "xx",
      section_num: 5,
      workload: 1,
      availability: SectionAvailability.FandW,
      capacity: 200,
      assigned_to: "0",
      dropped: false,
      in_violation: null,
    },
  },
  allIds: ["0", "1", "2", "3", "4"],
};

export const instructorStateMock: InstructorState = {
  byId: {
    "0": {
      id: "0",
      name: "John Robbin",
      position: {short: "Prof.", long: "Professor"},
      email: "jr@queensu.ca",
      workload_total: 4,
      modifier: 0,
      notes: "",
      fall_assigned: new Set<string>(["0", "1", "2", "3","4"]),
      wint_assigned: new Set<string>(["4"]),
      dropped: false,
      violations: {
        details_col_violations: [
          {msg: "This instructor has exceeded their workload", degree: ViolationDegree.W},
        ],
        fall_col_violations: [
          {msg: "test Info message, tied to section id '1'", degree: ViolationDegree.I},
          {msg: "test warning message, tied to section id '2'", degree: ViolationDegree.W},
        ],
        wint_col_violations: [
        ],
      }
    },
    "1": {
      id: "1",
      name: "Erin Erika",
      position: {short: "T.F.", long: "Teaching Fellow"},
      email: "ee@queensu.ca",
      workload_total: 2,
      modifier: 0,
      notes: "",
      fall_assigned: new Set<string>(),
      wint_assigned: new Set<string>(),
      dropped: false,
      violations: {
        details_col_violations: [
        ],
        fall_col_violations: [
        ],
        wint_col_violations: [
          //{msg: "test10", degree: ViolationDegree.I},
        ],
      }
    },
  },
  allIds: ["0", "1"],
};