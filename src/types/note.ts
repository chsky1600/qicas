export interface Note {
    /** Text content of the note */
    content: string;
    /** User ID of the note's author */
    created_by: string;
    /** Timestamp when the note was created */
    date_created: string;
}