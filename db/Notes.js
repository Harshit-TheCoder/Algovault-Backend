import mongoose from "mongoose";

const notesSchema = mongoose.Schema({
    questionId: String,
    userId: String,
    notes: String,
});

const Notes = mongoose.model("notes", notesSchema);

export default Notes;