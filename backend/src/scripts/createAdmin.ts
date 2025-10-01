import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config({ override: true });

async function createInitialAdmin() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create initial admin user
    const adminData = {
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@coworkpro.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin' as const,
      isActive: true
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Initial admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    console.error('ℹ️  Check your MONGODB_URI. If using Atlas, it should look like:');
    console.error('    mongodb+srv://<username>:<password>@<cluster-domain>/<database>?retryWrites=true&w=majority');
    console.error('    Ensure the cluster domain has no illegal characters (e.g., \'#\').');
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createInitialAdmin();