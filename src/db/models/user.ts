import * as mongoose from 'mongoose'

import { User } from '../../types/user';

const userSchema = new mongoose.Schema<User>(
    {
        id : {type : String, required: true},
        faculty_id : {type : String, required: true},
        name : {type : String, required: true},
        email : {type: String, required: true},
        password : {type: String, required: true},
    }
);

export const userSchema
export type UserModel = mongoose.InferSchemaType<typeof userSchema>;
export const UserModel = mongoose.model("User", userSchema);