import { sendNotificationEmail, sendWelcomeEmail } from '../services/emailService';
import { connectDB } from '../config/database';

const testEmailService = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    console.log('📧 Testing email service...');
    
    // Test 1: Send a simple notification email
    console.log('📤 Sending notification email...');
    await sendNotificationEmail(
      'ravipandeydu@gmail.com',
      'CoWork Pro Email Service Test',
      'This is a test email from the CoWork Pro backend email service. If you receive this, the email service is working correctly!'
    );
    console.log('✅ Notification email sent successfully!');
    
    // Test 2: Send a welcome email
    console.log('📤 Sending welcome email...');
    await sendWelcomeEmail('ravipandeydu@gmail.com', 'Ravi Pandey');
    console.log('✅ Welcome email sent successfully!');
    
    console.log('🎉 All email tests completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
};

// Run the test
testEmailService();