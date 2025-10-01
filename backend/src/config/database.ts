import mongoose from 'mongoose';

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowork-pro';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoURI, {
      autoIndex: true, // Automatically build indexes
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unreachable
      socketTimeoutMS: 45000, // Timeout for operations
      family: 4, // Use IPv4
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit if cannot connect
  }
};

// Event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('📡 MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during MongoDB shutdown', err);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  try {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed (SIGTERM)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during MongoDB shutdown (SIGTERM)', err);
    process.exit(1);
  }
});
