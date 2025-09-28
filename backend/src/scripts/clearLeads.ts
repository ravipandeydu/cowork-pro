import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

async function clearLeads() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Count existing leads
    const existingCount = await Lead.countDocuments();
    console.log(`Found ${existingCount} existing leads`);

    if (existingCount === 0) {
      console.log('No leads to clear.');
      process.exit(0);
    }

    // Clear all leads
    const result = await Lead.deleteMany({});
    console.log(`✅ Successfully cleared ${result.deletedCount} leads from the database`);

  } catch (error) {
    console.error('❌ Error clearing leads:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
clearLeads();