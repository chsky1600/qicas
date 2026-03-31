import { CourseLevel } from "./enums";
import { Note } from "./note";

export interface Section {
    /** Unique identifier for this section */
    id: string;
    /** Section number */
    number: number;
    /** Max enrollment capacity for this section */
    capacity: number;
}

export interface Course {
    /** Unique identifier for this course */
    id: string;
    /** Display name of the course */
    name: string;
    /** Department course code (e.g., "CISC101") */
    code: string;
    /** Academic level classification */
    level: CourseLevel;
    /** Year the course was first introduced */
    year_introduced: string;
    /** Administrative or contextual notes */
    notes: Note[];
    /** Sections offered for this course */
    sections: Section[];
    /** Max enrollment capacity for this course (derived from sections) */
    capacity: number;
}
