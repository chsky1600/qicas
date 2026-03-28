import * as mongoose from 'mongoose'

import { Note } from '../../types/note'

export const noteSchema = new mongoose.Schema<Note>(
    {
        content: {type : String, required: true},
        created_by: {type : String, required: false},
        date_created: {type : String, required: false},
    }
);

export type NoteModel = mongoose.InferSchemaType<typeof noteSchema>;
export const NoteModel = mongoose.model("Note", noteSchema);