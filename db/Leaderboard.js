import mongoose from "mongoose";

const leaderboardSchema = mongoose.Schema({
    name: String,
    email: String,
    userId: String,
    points: Number, 
    easyTests: Number,
    mediumTests: Number,
    hardTests: Number
});

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema, "leaderboard");

export default Leaderboard;