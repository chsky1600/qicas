import * as mongoose from 'mongoose'

import { Faculty } from '../../types/faculty'
import { userSchema } from './user';
import { academicYearSchema } from './year'

const facultySchema = new mongoose.Schema<Faculty>(
    {
        id : {type : String, required: true},
        users : {type : [userSchema], required : true},
        academic_years: {type : [academicYearSchema], required: true},
    }
);

export type FacultyModel = mongoose.InferSchemaType<typeof facultySchema>;
export const FacultyModel = mongoose.model("Faculty", facultySchema);