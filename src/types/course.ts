import { CourseLevel } from "./enums";
import { Note } from "./note";

export interface Section {
    id: string;
    number: number;
}

export interface Course {
    id: string;
    name : string;
    code: string;
    level: CourseLevel
    year_introduced: string;
    notes: Note[];
    sections: Section[]
}