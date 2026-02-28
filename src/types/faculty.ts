
import { User } from './user'
import { AcademicYear } from './year';

export interface Faculty {
  /** Unique identifier for this faculty */
  id: string;
  /** Display name of the faculty */
  name: string;
  /** Users belonging to this faculty */
  users: User[];
  /** Academic years managed by this faculty */
  academic_years: AcademicYear[];

  current_working_schedule_id : string

}