const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const mongoUri = process.env.MONGO_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/clipquery');

    if (!mongoUri) {
      console.error('[MongoDB] MONGO_URI environment variable is required in production.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
