import mongoose from "mongoose"
import { Schema } from "mongoose"
import passportLocalMongoose from "passport-local-mongoose"

const userSchema = new Schema({})

userSchema.plugin(passportLocalMongoose)


export const User = mongoose.model("User",userSchema)