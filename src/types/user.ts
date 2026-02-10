export type UserRole = "department_head" | "department_support";

export interface User {
  /** Unique identifier for this user */
  id: string;
  /** Reference to the user's faculty */
  faculty_id: string;
  /** Full name of the user */
  name: string;
  /** Email address */
  email: string;
  /** Hashed password */
  password: string;
  /** Authorization level determining edit vs read-only access */
  role: UserRole;
}
