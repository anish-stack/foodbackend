// import mongoose
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Define the MongoDB connection URL. Replace 'your-database-uri' with your actual MongoDB URI.
const dbURI = process.env.DB_URL;
mongoose.set('strictQuery', false);
// Define a function to connect to the database
 const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 60000, // Increased timeout to 60 seconds
    });
    console.log("Connected to the database successfully!");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

module.exports= connectDB
