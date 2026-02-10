import { Course } from "./course";
import { InstructorRank } from "./enums";
import { Note } from "./note";

export interface Instructor {
  id: string;
  name: string;
  workload : number;
  email: string;
  rank: InstructorRank
  prev_taught: Course[]
  notes : Note[]
}