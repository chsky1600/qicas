import * as mongoose from 'mongoose'

const uri = "mongodb://127.0.0.1:27017/mongoose-app"

// lowkey idk how this works, docs aren't too insightful on the connection obj's usage
export const connection = mongoose.createConnection(uri)