import { InstructorRank } from "./enums";
import { Note } from "./note";
import { Course } from "./course";

export interface Instructor {
  /** Unique identifier for this instructor */
  id: string;
  /** Full name of the instructor */
  name: string;
  /** Base teaching workload (number of courses) */
  workload: number;
  /** Email address */
  email: string;
  /** Academic rank */
  rank: InstructorRank;
  /** Course codes previously taught by this instructor */
  prev_taught: Course[];
  /** Administrative or contextual notes */
  notes: Note[];
}