import * as mongoose from 'mongoose'

import { Note } from '../../types/note'

export const noteSchema = new mongoose.Schema<Note>(
    {
        content: {type : String, required: true},
        created_by: {type : String, required: true},
        date_created: {type : String, required: true},
    }
);

export type NoteModel = mongoose.InferSchemaType<typeof noteSchema>;
export const NoteModel = mongoose.model("Note", noteSchema);