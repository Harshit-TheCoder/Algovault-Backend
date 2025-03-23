import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/AlgoVault");
// import mongoose from "mongoose";

// const connectionString = "mongodb+srv://harshitharlalka11:157056724@employees.n0krdfl.mongodb.net/AlgoVault?retryWrites=true&w=majority&appName=Employees";

// mongoose.connect(connectionString, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// })
// .then(() => console.log("Connected to MongoDB Atlas"))
// .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));
