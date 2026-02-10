import * as mongoose from 'mongoose'

import { Violation, ValidationResult} from '../../types'

const violationSchema = new mongoose.Schema<Violation>(
    {
        id: {type: String, required: true},
        type: {type: String, required: true},
        offending_id : {type: String, required: true},
        code : {type: String, required: true},
        message : {type: String, required: true},
        degree : {type: String, required: true},
    }
)

export type ViolationModel = mongoose.InferSchemaType<typeof violationSchema>;
export const ViolationModel = mongoose.model("Violation", violationSchema);

const valdiationResultSchema = new mongoose.Schema<ValidationResult>(
    {
        degree : {type: String, required: true},
        violations : { type: [violationSchema], required: true }
    }
)

export type ValidationResultModel = mongoose.InferSchemaType<typeof valdiationResultSchema>;
export const ValidationResultModel = mongoose.model("ValidationResult", valdiationResultSchema);