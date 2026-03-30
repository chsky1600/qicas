import * as mongoose from 'mongoose'

import { Faculty } from '../../types/faculty'
import { userSchema } from './user';
import { academicYearSchema } from './year'

const facultySchema = new mongoose.Schema<Faculty>(
    {
        id : {type : String, required: true},
        name : {type : String, required: true},
        users : {type : [userSchema], required : true},
        academic_years: {type : [academicYearSchema], required: true},
        current_working_schedule_id : {type : String, required: false},
        credits_per_course : {type : Number, required: true, default: 3, min: 0.5},
    }
);

export type FacultyModel = mongoose.InferSchemaType<typeof facultySchema>;
export const FacultyModel = mongoose.model("Faculty", facultySchema);