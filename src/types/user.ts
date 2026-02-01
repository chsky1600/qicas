export interface User {
  /** Unique identifier for this assignment */
  id: string;
  /** Validation degree (computed, not persisted) */
  faculty_id: string;

  name : string;

  email : string;

  password : string;
}