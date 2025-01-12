import mongoose from "mongoose";

const bookmarkSchema = mongoose.Schema({
    questionId: String,
    userId: String,
    programName: String,
    programCategory: String,
    programLanguage: String,
});

const Bookmark = mongoose.model("bookmarks", bookmarkSchema);

export default Bookmark;