import mongoose from "mongoose";

const linksSchema = mongoose.Schema({
    userId: String,
    name: String,
    github: String,
    leetcode: String,
    codeforces: String,
    linkedin: String,
    codechef: String
});

const Links = mongoose.model("links", linksSchema);

export default Links;