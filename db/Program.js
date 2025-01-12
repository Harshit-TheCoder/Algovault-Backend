import mongoose from "mongoose";

const programSchema = new mongoose.Schema({
    userId: String,
    programName: String,
    programQuestion: String,
    programCategory: String,
    programLanguage: String,
    program: String
});

const Program = mongoose.model("programs", programSchema);

export default Program;