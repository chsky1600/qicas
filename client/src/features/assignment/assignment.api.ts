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
        code: "FREN101",
        year_introduced: "xx",
        section_num: 1,
        availability: SectionAvailability.F,
        
        capacity: 200,
        assigned_to: null
      },
      "1": {
        id: "1",
        name: "intro to french (2)",
        code: "FREN101",
        year_introduced: "xx",
        section_num: 2,
        availability: SectionAvailability.F,
        capacity: 200,
        assigned_to: "1"
      },
      "2": {
      id: "2",
      name: "intro to french (3)",
      code: "FREN101",
      year_introduced: "xx",
      section_num: 3,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "1"
      },
      "3": {
      id: "3",
      name: "intro to french (4)",
      code: "FREN101",
      year_introduced: "xx",
      section_num: 4,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "1"
      },
      "4": {
      id: "4",
      name: "intro to french (5)",
      code: "FREN101",
      year_introduced: "xx",
      section_num: 5,
      availability: SectionAvailability.F,
      capacity: 200,
      assigned_to: "1"
      },
    },
    allIds: ["0", "1", "2", "3", "4"],
  };

  const instructorStateMock: InstructorState = {
    byId: {
      "0": {
        id: "0",
        name: "John Robbin",
        positon: {short: "Prof.", long: "Professor"},
        workload_total: 4,
        fall_assigned: ["0", "1", "2", "3"],
        wint_assigned: ["0"],
      },
      "1": {
        id: "1",
        name: "Erin Erika",
        positon: {short: "T.F.", long: "Teaching Fellow"},
        workload_total: 2,
        fall_assigned: [],
        wint_assigned: [],
      },
    },
    allIds: ["0", "1"],
  };

  return {
    sectionState: sectionStateMock,
    instructorState: instructorStateMock
  }
}