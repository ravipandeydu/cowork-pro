import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowork-pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in database`);

    if (userCount === 0) {
      console.log('No users to clear');
      return;
    }

    // Keep admin and demo users (if they exist)
    const protectedEmails = ['admin@example.com', 'user@example.com'];
    
    // Delete all users except protected ones
    const result = await User.deleteMany({ 
      email: { $nin: protectedEmails } 
    });
    
    console.log(`✅ Cleared ${result.deletedCount} users from database`);
    
    const remainingCount = await User.countDocuments();
    console.log(`${remainingCount} users remaining in database`);

  } catch (error) {
    console.error('Error clearing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the clearing function
clearUsers().catch(console.error);