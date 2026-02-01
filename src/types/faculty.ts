
import { User } from './user'
import { AcademicYear } from './year';

export interface Faculty {
  id: string;
  users : User[];
  academic_years : AcademicYear[]
}