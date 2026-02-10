import * as mongoose from 'mongoose'

import { Course, Section } from '../../types/course'
import { noteSchema } from './note';

export const sectionSchema = new mongoose.Schema<Section>(
    {
        id : {type : String, required: true},
        number: {type : Number, required: true},
    }
)

export type SectionModel = mongoose.InferSchemaType<typeof sectionSchema>;
export const SectionModel = mongoose.model("Section", sectionSchema);

export const courseSchema = new mongoose.Schema<Course>(
    {
        id : {type : String, required: true},
        name: {type : String, required: true},
        code: {type : String, required: true},
        level: {type : String, required: true},
        year_introduced: {type : String, required: true},
        notes: {type : [noteSchema], required: true},
        sections: {type : [sectionSchema], required: true},
    }
);

export type CourseModel = mongoose.InferSchemaType<typeof courseSchema>;
export const CourseModel = mongoose.model("Course", courseSchema);