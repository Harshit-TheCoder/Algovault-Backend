import mongoose from "mongoose";

const DSAQuestionsSchema = mongoose.Schema({
    "Name": String,
    "Description": String,
    "Difficulty": String,
    "Category": String,
    "Examples": [{ Input: String, Output: String, Explanation: String }]
});

const DSAQuestions = mongoose.model("dsaquestions", DSAQuestionsSchema);

export default DSAQuestions;