const mongoose = require('mongoose');
const { env } = require('./env');
const dns = require('node:dns');

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    const conn = await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
