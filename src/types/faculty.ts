
import { User } from './user'
import { AcademicYear } from './year';

export interface Faculty {
  /** Unique identifier for this faculty */
  id: string;
  /** Users belonging to this faculty */
  users: User[];
  /** Academic years managed by this faculty */
  academic_years: AcademicYear[];
}