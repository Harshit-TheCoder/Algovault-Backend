
import express from "express";
import env from "dotenv";
import cors from "cors";
import "./db/config.js";
import User from "./db/User.js";
import Program from "./db/Program.js";
import Bookmark from "./db/Bookmark.js";
import Notes from "./db/Notes.js";
import nodemailer from "nodemailer";
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors({
    credentials: true,
}));
env.config();


const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    port: 465,
    auth: {
      user: "hphgrwtmr@gmail.com", // your email
      pass: "eijvradtugncebyv"        // your email password or app password
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

app.put("/update_program/:id", async (req, res)=>{
    let result = await Program.updateOne(
        {_id: req.params.id},
        {
            $set : req.body
        }
    )
    res.send(result);
});


app.get("/search_program/:key", async (req, res)=>{
    let result = await Program.find({
        "$or":[
            {programName:{$regex:req.params.key}},
            {programQuestion:{$regex:req.params.key}},
            {programCategory:{$regex:req.params.key}},
            {programLanguage:{$regex:req.params.key}},
        ]
    });
    res.send(result);
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