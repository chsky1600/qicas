import type { SectionState, InstructorState } from "./assignment.types";
import { SectionAvailability } from "./assignment.types";

export function fetchAssignment(/*faculty_id, academic_year_id, Schedule_id*/) {
  // TODO :
  // API function to set instructors
  // mapper function to mapp api: API needs a construction algorithm which converts the database into usable
  // frontend structure

  // TODO - remove and replace with API and mapper call
  const sectionStateMock: SectionState = {
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
        assigned_to: "0"
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
        assigned_to: "0"
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
        assigned_to: "0"
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
        assigned_to: "0"
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
        assigned_to: "0"
      },
    },
    allIds: ["0", "1", "2", "3", "4"],
  };

  const instructorStateMock: InstructorState = {
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
      },
    },
    allIds: ["0", "1"],
  };

  return {
    sectionState: sectionStateMock,
    instructorState: instructorStateMock
  }
}