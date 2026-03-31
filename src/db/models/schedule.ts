import * as mongoose from 'mongoose'

import { Assignment, Schedule } from '../../types/schedule'

const assignmentSchema = new mongoose.Schema<Assignment>(
    {
        id : {type : String, required: true},
        instructor_id : {type : String, required: true},
        section_id : {type : String, required: true},
        course_code : {type : String, required: true},
        term : {type : String, required: true},
    }
);

export type AssignmentModel = mongoose.InferSchemaType<typeof assignmentSchema>;
export const AssignmentModel = mongoose.model("Assignment", assignmentSchema);

export const scheduleSchema = new mongoose.Schema<Schedule>(
    {
        id : {type : String, required: true},
        name: {type : String, required: true},
        year_id : {type : String, required: true},
        date_created : {type : Date, required: true},
        is_rc : {type : Boolean, required: true},
        assignments : { type: [assignmentSchema], required:true},
        version : { type: Number, required: true, default: 1 }
    }
);

export type ScheduleModel = mongoose.InferSchemaType<typeof scheduleSchema>;
export const ScheduleModel = mongoose.model("Schedule", scheduleSchema);
