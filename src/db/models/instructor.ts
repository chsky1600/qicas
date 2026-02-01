import * as mongoose from 'mongoose'

import { Instructor } from '../../types/instructor'
import { noteSchema } from './note';

export const instructorSchema = new mongoose.Schema<Instructor>(
    {
        id : {type : String, required: true},
        name: {type : String, required: true},
        workload : {type : Number, required: true},
        email : {type : String, required: true},
        rank : {type : String, required: true},
        prev_taught : {type : [String], required: true},
        notes : {type : [noteSchema], required: true},
    }
);

export type InstructorModel = mongoose.InferSchemaType<typeof instructorSchema>;
export const InstructorModel = mongoose.model("Intructor", instructorSchema);