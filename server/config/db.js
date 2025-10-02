const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // Explicitly check if the MONGO_URI is loaded
  if (!mongoURI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');
    console.error('Please ensure your .env file is correctly set up or environment variables are configured on your deployment platform (Render).');
    process.exit(1); // Exit the process with a failure code
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;