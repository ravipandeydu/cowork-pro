import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sampleUsers = [
  {
    name: 'John Smith',
    email: 'john.smith@coworkpro.com',
    password: 'password123',
    role: 'sales_manager' as const,
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'David Kim',
    email: 'david.kim@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa.thompson@coworkpro.com',
    password: 'password123',
    role: 'sales_manager' as const,
    isActive: true
  },
  {
    name: 'Robert Martinez',
    email: 'robert.martinez@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'Amanda Foster',
    email: 'amanda.foster@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: false // Inactive user for testing
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@coworkpro.com',
    password: 'password123',
    role: 'sales_executive' as const,
    isActive: true
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@coworkpro.com',
    password: 'password123',
    role: 'sales_manager' as const,
    isActive: true
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowork-pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if users already exist
    const existingUsersCount = await User.countDocuments();
    console.log(`Found ${existingUsersCount} existing users in database`);

    if (existingUsersCount > 2) { // More than just admin and demo user
      console.log('Database already contains users. Skipping seeding.');
      console.log('If you want to re-seed, please clear the users collection first.');
      return;
    }

    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      try {
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`User with email ${userData.email} already exists, skipping...`);
          continue;
        }

        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`Created user: ${user.name} (${user.email}) - Role: ${user.role}`);
      } catch (error) {
        console.error(`Error creating user ${userData.name}:`, error);
      }
    }

    console.log(`\n✅ Successfully created ${createdUsers.length} users`);

    // Display summary by role
    const roleCount = createdUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Users created by role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    // Display active vs inactive
    const activeCount = createdUsers.filter(user => user.isActive).length;
    const inactiveCount = createdUsers.length - activeCount;
    console.log(`\n👥 User status:`);
    console.log(`  Active: ${activeCount}`);
    console.log(`  Inactive: ${inactiveCount}`);

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedUsers().catch(console.error);