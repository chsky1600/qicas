import * as mongoose from 'mongoose'

import { InstructorRule, CourseRule, AcademicYear } from '../../types'
import { instructorSchema } from './instructor';
import { courseSchema } from './course';
import { scheduleSchema } from './schedule';

const instructorRuleSchema = new mongoose.Schema<InstructorRule>(
    {
        id: {type: String, required: true},
        instructor_id: {type: String, required: true},
        designations: {type: [String], required: true},
        workload_delta: {type: Number, required: true},
        courses: {type: [String], required: true},
        declined_courses: {type: [String], required: true},
        dropped: {type: Boolean, required: true},
    }
)

export type InstructorRuleModel = mongoose.InferSchemaType<typeof instructorRuleSchema>;
export const InstructorRuleModel = mongoose.model("InstructorRule", instructorRuleSchema);

const courseRuleSchema = new mongoose.Schema<CourseRule>(
    {
        id: {type: String, required: true},
        course_code: {type: String, required: true},
        terms_offered: {type: [String], required: true},
        workload_fulfillment: {type: Number, required: true},
        is_full_year : {type : Boolean, required: true},
        sections_available: {type: [String], required: true},
        is_external: {type: Boolean, required: true},
    }
)

export type CourseRuleModel = mongoose.InferSchemaType<typeof courseRuleSchema>;
export const CourseRuleModel = mongoose.model("CourseRule", courseRuleSchema);

export const academicYearSchema = new mongoose.Schema<AcademicYear>(
    {
        id: {type: String, required: true},
        name: {type: String, required: true},
        schedules: {type: [scheduleSchema], required: true},
        courses: {type: [courseSchema], required: true},
        instructors: {type: [instructorSchema], required: true},
        instructor_rules: {type: [instructorRuleSchema], required: true},
        course_rules: {type: [courseRuleSchema], required: true},
    }
)

export type AcademicYearModel = mongoose.InferSchemaType<typeof academicYearSchema>;
export const AcademicYearModel = mongoose.model("AcademicYear", academicYearSchema);