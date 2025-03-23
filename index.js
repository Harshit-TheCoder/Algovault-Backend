import express from "express";
import env from "dotenv";
import cors from "cors";
import "./db/config.js";
import User from "./db/User.js";
import Program from "./db/Program.js";
import Bookmark from "./db/Bookmark.js";
import DSAQuestions from "./db/DSAQuestions.js";
import Notes from "./db/Notes.js";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Leaderboard from "./db/Leaderboard.js";
import Links from "./db/Links.js";

const app = express();


app.use(express.json());
app.use(cors({
    credentials: true,
}));
env.config();


const port = process.env.PORT || 5000;

const apiKey = process.env.GOOGLE_API_KEY;


const genAI = new GoogleGenerativeAI(apiKey);

let difficulty_distribution = {
    "Easy": {"Easy": 0.7, "Medium": 0.2, "Hard": 0.1},
    "Medium": {"Easy": 0.2, "Medium": 0.7, "Hard": 0.1},
    "Hard": {"Easy": 0.1, "Medium": 0.2, "Hard": 0.7},
}
let questions_per_duration = {
    45: 5,
    60: 6, 
    120: 12,
    180: 16
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: "hphgrwtmr@gmail.com", // your email
      pass: "eijvradtugncebyv"        // your email password or app password
    }
});


app.post('/saveLinks', async (req, res) =>{
    const { name, userId , leetcode, codeforces, codechef, github, linkedin } = req.body;
    let link = new Links({
        name: name, userId: userId , leetcode: leetcode, codeforces: codeforces, codechef: codechef, github: github, linkedin: linkedin
    });

    let result = await link.save();
    if(result){
        res.send({"Message" :"Success"});
    }
    else{
        res.send({"Message": "Error"});
    }
});

app.post('/getProfileCard', async (req, res) => {
    try {
        const { name, userId } = req.body;

        let data = {
            userId,
            name,
            email: "",
            points: "",
            easyTests: "",
            mediumTests: "",
            hardTests: "",
            leetcode: "",
            codeforces: "",
            codechef: "",
            github: "",
            linkedin: ""
        };

        // Fetch links
        const links = await Links.findOne({ userId: userId });
        if (links) {
            console.log(links);
            data.leetcode = links.leetcode || "";
            data.github = links.github || "";
            data.codeforces = links.codeforces || "";
            data.codechef = links.codechef || "";
            data.linkedin = links.linkedin || "";
        }

        // Fetch leaderboard details
        const leaderboard = await Leaderboard.findOne({ userId: userId });
        if (leaderboard) {
            console.log(leaderboard);
            data.email = leaderboard.email || 0;
            data.points = leaderboard.points/6 || 0;
            data.easyTests = leaderboard.easyTests/6 || 0;
            data.mediumTests = leaderboard.mediumTests/6 || 0;
            data.hardTests = leaderboard.hardTests/6 || 0;
        }

        res.json({ success: true, profile: data });

    } catch (error) {
        console.error("Error fetching profile card:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.get("/getLinks/:userId", async (req, res) => {
    try {
        const user = await Links.findOne({ userId: req.params.userId });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let r = {
            leetcode : user.leetcode, 
            codeforces: user.codeforces,
            codechef: user.codechef,
            github: user.github,
            linkedin: user.linkedin
        }
        console.log(r);
        res.json({ success: true, links: r });
    } catch (error) {
        console.error("Error fetching links:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post("/chatbot", async (req, res) => {
    try {
        const { question } = req.body;
        
        if (!question) {
          return res.status(400).json({ error: "Question is required" });
        }
    
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(question);
        const response = result.response.text();
    
        res.json({ answer: response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to get AI response" });
    }
});

app.post("/analyze_answers", async (req, res) => {
    try {
        const { questions, name, email, userId, duration, difficulty } = req.body;
        console.log(questions, name, email, userId, duration, difficulty);

        if (!questions || questions.length === 0) {
            return res.status(400).json({ error: "No questions provided" });
        }

        let responses = [];
        let unattempted_questions = 0;
        let attempted_questions = 0;
        for (let q of questions) {
            let prompt = "";
            console.log(q.userCode);
            if (q.userCode === "Unattempted") {
                unattempted_questions++;
                prompt = `
                The following question was **not attempted** by the student.
                - Question: ${q.question}
                - Description: ${q.description}

                Provide a brief explanation of what the student missed and why it is important and provide brute, better and optimal solution with time and space complexity for each.
                `;
            } else {
                attempted_questions++;
                prompt = `
                Analyze the following student's code for correctness and efficiency.
                - Question: ${q.question}
                - Description: ${q.description}
                - Student's Code:
                ${q.userCode}
                
                Provide structured feedback on:
                1. **Correctness** (Does it solve the problem?)
                2. **Efficiency** (Time Complexity)
                3. **Code Quality** (Readability & Best Practices)
                4. **Suggested Improvements**
                5. **Optimal Code**

                
                `;
            }

            let total_questions = attempted_questions + unattempted_questions;
            let percentage = (attempted_questions / total_questions) * 100;
            let path1 = "", path2 = "", path3 = "";

            if(percentage >= 90.0){
                path1 = "D:/W/code_solution_website/backend/images/CodeOfOlympus/Gold.png";
                path2 = "D:/W/code_solution_website/backend/images/ShonenCoders/Gold.png";
                path3 = "D:/W/code_solution_website/backend/images/WizardingCoders/Gold.png";
            }
            else if(percentage >= 80.0){
                path1 = "D:/W/code_solution_website/backend/images/CodeOfOlympus/Silver.png";
                path2 = "D:/W/code_solution_website/backend/images/ShonenCoders/Silver.png";
                path3 = "D:/W/code_solution_website/backend/images/WizardingCoders/Silver.png";
            }
            else if(percentage >= 70.0){
                path1 = "D:/W/code_solution_website/backend/images/CodeOfOlympus/Bronze.png";
                path2 = "D:/W/code_solution_website/backend/images/ShonenCoders/Bronze.png";
                path3 = "D:/W/code_solution_website/backend/images/WizardingCoders/Bronze.png";
            }

            if(percentage >= 70){
     
                let subject = "🚀 TechTrek Mock Test Score Report - Your Performance Insights!"
                let body = `
                <p>Dear <strong>${name}</strong>,</p>
                <p>Congratulations on completing your TechTrek mock DSA test! 🎉</p>
            
                <h3>📌 Test Details:</h3>
                <ul>
                    <li><strong>Duration:</strong> ${duration} minutes</li>
                    <li><strong>Difficulty Level:</strong> ${difficulty}</li>
                    <li><strong>Exam Format:</strong> Coding Exam</li>
                </ul>
            
                <h3>📊 Your Performance:</h3>
                <ul>
                    <li><strong>Total Questions:</strong> ${total_questions}</li>
                    <li>🟢 <strong>Attempted Questions:</strong> ${attempted_questions}</li>
                    <li>❌ <strong>Unattempted Questions:</strong> ${unattempted_questions}</li>
                    <li>🏆 <strong>Percentage:</strong> ${percentage.toFixed(2)}%</li>
                </ul>
            
                <p>Your dedication to improving your DSA skills is commendable! Keep practicing and sharpening your coding expertise. 🚀</p>
            
                <p><strong>Happy Coding!<br>Team TechTrek</strong></p>
                <p>For feedback, contact <a href="mailto:techtrek.feedback@gmail.com">techtrek.feedback@gmail.com</a></p>
            `;

                let transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "techtrek.results@gmail.com",
                        pass: "norp agtw jzep yhej",
                    },
                });
                
                let mailOptions = {
                    from: "techtrek.results@gmail.com",
                    to: email,
                    subject: subject,
                    html: body,
                    attachments: [
                        {
                            path: path1,
                        },
                        {
                            path: path2,
                        },
                        {
                            path: path3,
                        },
                    ],
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("Error:", error);
                    } else {
                        console.log("Email sent: " + info.response);
                    }
                });
            }

            let user = await Leaderboard.findOne({userId: userId});

            let points = 0;
            if (difficulty === "Easy") {
                points = percentage >= 90 ? 90 : percentage >= 80 ? 80 : percentage >= 70 ? 70 : 40;
            } else if (difficulty === "Medium") {
                points = percentage >= 90 ? 110 : percentage >= 80 ? 100 : percentage >= 70 ? 90 : 50;
            } else { // Hard
                points = percentage >= 90 ? 130 : percentage >= 80 ? 120 : percentage >= 70 ? 110 : 60;
            }
            
            if (user) {
                let updateFields = {
                    $set: { points: user.points + points },
                    $inc: {}
                };
        
                if (difficulty === "Easy") updateFields.$inc["easyTests"] = 1;
                else if (difficulty === "Medium") updateFields.$inc["mediumTests"] = 1;
                else updateFields.$inc["hardTests"] = 1;
        
                console.log("Before Update:", user);
                let result = await Leaderboard.updateOne({ userId: userId }, updateFields);
                console.log("After Update:", result);
            } else {
                let newUser = new Leaderboard({
                    name: name,
                    email: email,
                    userId: userId,
                    points: points,
                    easyTests: difficulty === "Easy" ? 1 : 0,
                    mediumTests: difficulty === "Medium" ? 1 : 0,
                    hardTests: difficulty === "Hard" ? 1 : 0
                });
        
                console.log("Creating new user:", newUser);
                let result = await newUser.save();
                console.log("New user saved:", result);
            }
                    

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const report = result.response.text();

            responses.push({
                question: q.question,
                attempted: q.userCode !== "Unattempted",  // Flag for attempted status
                feedback: report,
            });


        }

        res.json({ success: true, report: responses });

    } catch (error) {
        console.error("Error analyzing answers:", error);
        res.status(500).json({ error: "Failed to analyze answers" });
    }
});

app.get('/leaderboard' , async (req, res) => {
    try {
        // Fetch all leaderboard data
        let data = await Leaderboard.find({});

        // Normalize the data (divide by 6)
        data = data.map(user => ({
            ...user._doc, 
            points: Math.floor(user.points / 6),
            easyTests: Math.floor(user.easyTests / 6),
            mediumTests: Math.floor(user.mediumTests / 6),
            hardTests: Math.floor(user.hardTests / 6),
            totalTests: Math.floor((user.easyTests + user.mediumTests + user.hardTests) / 6)
        }));

        // Sorting based on:
        // 1. Points (descending)
        // 2. Hard tests > Medium tests > Easy tests
        // 3. Total tests (descending)
        data.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;  // Sort by points
            if (b.hardTests !== a.hardTests) return b.hardTests - a.hardTests; // Sort by hard tests
            if (b.mediumTests !== a.mediumTests) return b.mediumTests - a.mediumTests; // Sort by medium tests
            if (b.easyTests !== a.easyTests) return b.easyTests - a.easyTests; // Sort by easy tests
            return b.totalTests - a.totalTests; // Sort by total tests
        });

        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


app.post("/send-email", (req, res) => {
    const {name, email, otp} = req.body;
    const mailOptions = {
      from: "hphgrwtmr@gmail.com",      // sender's email
      to: `${email}`,  // receiver's email
      subject: "Algovault", // subject of the email
    //   text: `Hello ${name}!! \n Your One Time Password:\n ${otp}` // body of the email\
      html: `<h1 style="color: maroon">Welcome !!</h1> 
            <h2 style="color: darkgreen" >Dear, <span style="color: #FF00BF">${name}</span><h2> 
            <h3 style="color: #F9629F">Your OTP is<h3> 
            <h4 style="color: #FF00FF">${otp}</h4> `
    };
  
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send("Error sending email: " + error.message);
      }
      console.log("Email sent: " + info.response);
      res.send({Message: "Email sent successfully!"});
    });
  
});

app.post("/register", async (req, res)=>{
    let result = req.body;
    console.log(result);
    let user = User(req.body);
    res.send(user);
    result = await user.save();
    // result = result.toObject();
});

app.post("/login", async (req, res)=>{
    let user = await User.findOne(req.body);
    if(user){
        res.send(user);
    }
    else{
        res.send({result:"No user found"});
    }
});

app.post("/google_register", async (req, res)=>{
    console.log(req.body);
    let user = User(req.body);
    res.send(user);
    let result = await user.save();
});

app.post("/google_login", async (req, res)=>{
    let user = await User.findOne(req.body);
    if(user){
        res.send(user);
    }
    else{
        res.send({result:"No user found"});
    }
});


app.post("/program_upload", async (req, res)=>{
    let result = req.body;
    let program = Program(result);

    res.send(result);
    let r = await program.save();
});

app.post("/dashboard", async (req, res)=>{
    let result = req.body;
    let user = await User.findOne(result);
    if(user){
        res.send(user);
    }
    else{
        res.send({result: "No user found"});
    }
});

app.get("/programs/:id", async (req, res)=>{
    let userId = req.params.id;
    let programs = await Program.find({userId: req.params.id});
    if(programs){
        res.send({Length: programs.length});
    }
    else{
        res.send({Message:"No Programs saved"});
    }
})

app.get("/vault/:id",async (req, res)=>{
    let programs = await Program.find({userId: req.params.id});
    console.log(programs);
    if(programs){
        res.send(programs);
    }
    else{
        res.send({result: "Logged-In user does not have any saved programs"});
    }
    // res.send("Success");
});

app.delete("/delete_program/:id", async (req, res)=>{
    const result = await Program.deleteOne({_id: req.params.id});
    res.send(result);
});

app.get("/program/:id", async (req, res)=>{
    const result = await Program.findOne({_id: req.params.id});
    if(result){
        res.send(result);
    }else{
        res.send({result: "No result found"});
    }
    
});

const selectQuestions = async (Difficulty, numQuestions) => {
    try {
        console.log(Difficulty);
        console.log(typeof Difficulty);
        // console.log(await DSAQuestions.find({}, { Difficulty: 1, _id: 0 }));

        // const availableQuestions = await DSAQuestions.countDocuments({ "Difficulty": Difficulty });

        // if (availableQuestions === 0) {
        //     console.warn(`No questions found for difficulty: ${Difficulty}`);
        //     return [];
        // }

        // const sampleSize = Math.min(numQuestions, availableQuestions); // Avoid exceeding available questions

        return await DSAQuestions.aggregate([
            { $match: { "Difficulty": Difficulty } },
            { $sample: { "size": numQuestions } }
        ]);
    } catch (error) {
        console.error("Error fetching questions:", error);
        return [];
    }
};

app.get("/get_questions", async(req, res) => {
    let Questions = await DSAQuestions.find({});
    return Questions;
});

app.post("/add_questions", async (req, res) => {
    try {
        let data = req.body; // Expecting an array of questions

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ message: "Invalid input. Expected a non-empty array of questions." });
        }

        // Use insertMany to save multiple documents at once
        let result = await DSAQuestions.insertMany(data);

        res.status(201).json({ message: "Questions added successfully", data: result });
    } catch (error) {
        console.error("Error saving questions:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

app.post("/sortQuestions", async (req, res) => {
    let { Duration, Difficulty } = req.body;

    console.log("Received Duration:", Duration);
    console.log("Received Difficulty:", Difficulty);

    if (!questions_per_duration[Duration]) {
        return res.status(400).json({ error: `Invalid duration: ${Duration}` });
    }
    if (!difficulty_distribution[Difficulty]) {
        return res.status(400).json({ error: `Invalid difficulty: ${Difficulty}` });
    }

    let test_details_data = {
        "Duration": Duration,
        "Difficulty": Difficulty,
        "Number of Questions": 0,
        "Number of Easy Questions": 0,
        "Easy Question Ids": [],
        "Number of Medium Questions": 0,
        "Medium Question Ids": [],
        "Number of Hard Questions": 0,
        "Hard Question Ids": [],
    };

    let number_of_questions = questions_per_duration[Duration];
    console.log(number_of_questions);
    let easy_share = difficulty_distribution[Difficulty]["Easy"];
    let medium_share = difficulty_distribution[Difficulty]["Medium"];
    let hard_share = difficulty_distribution[Difficulty]["Hard"];

    test_details_data["Number of Easy Questions"] = Math.round(number_of_questions * easy_share);
    test_details_data["Number of Medium Questions"] = Math.round(number_of_questions * medium_share);
    test_details_data["Number of Hard Questions"] = Math.round(number_of_questions * hard_share);
    test_details_data["Number of Questions"] =
        test_details_data["Number of Easy Questions"] +
        test_details_data["Number of Medium Questions"] +
        test_details_data["Number of Hard Questions"];

    console.log("Easy", test_details_data["Number of Easy Questions"]);
    console.log("Medium", test_details_data["Number of Medium Questions"]);
    console.log("Hard", test_details_data["Number of Hard Questions"]);
    const easyQuestions = await selectQuestions("Easy", test_details_data["Number of Easy Questions"]);
    const mediumQuestions = await selectQuestions("Medium", test_details_data["Number of Medium Questions"]);
    const hardQuestions = await selectQuestions("Hard", test_details_data["Number of Hard Questions"]);

    test_details_data["Easy Question Ids"] = easyQuestions.map((q) => q._id);
    test_details_data["Medium Question Ids"] = mediumQuestions.map((q) => q._id);
    test_details_data["Hard Question Ids"] = hardQuestions.map((q) => q._id);

    let questionArray = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    res.json(questionArray);
});

app.post("/bookmark_question", async (req, res)=>{
    const {questionId, userId,programName,programCategory,programLanguage} = req.body;
    let result = req.body;
        result = await Bookmark.findOne({
        questionId: questionId,
        userId: userId
    });
    if(!result){
        let bookmark = Bookmark({questionId, userId,programName,programCategory,programLanguage});
        let r = await bookmark.save();
        res.send(r);
    }
    else{
        res.send({"Message":"The selected question is already bookmarked."})
    }
    
});

app.get("/bookmark_question/:id", async (req, res) => {
    const userId = req.params.id;
    let result = await Bookmark.find({userId: userId});
    res.send(result);
});

app.delete("/bookmark_question", async (req, res)=>{
    const {questionId, userId} = req.body;
    const question = await Bookmark.deleteOne({questionId: questionId, userId: userId });
    if(question){
        res.send({Message: "Question removed from bookmark"});
    }
    else{
        res.send({Message: "Error while removing from bookmark"});
    }
    
});

app.post("/notes", async (req, res)=>{
    const {questionId, userId, notes} = req.body;
    let data = Notes({questionId, userId, notes});
    let result = data.save();
    res.send(result);
});

app.post("/get_notes", async (req, res)=>{
    const {questionId, userId} = req.body;
    let result = await Notes.findOne({questionId: questionId, userId: userId});
    if(!result){
        res.send({Message:"No notes saved"});
    }else{
        res.send(result);
    }
    
});

app.put("/notes", async (req, res)=>{
    const {questionId, userId, notes} = req.body;
    let result = await Notes.updateOne(
        {questionId: questionId, userId: userId},
        {
            $set : {notes:notes},
        }
    )
    res.send(result);
});

// app.get("/", (req, res)=>{
//     res.send("Hello world");
// });

app.listen(port);