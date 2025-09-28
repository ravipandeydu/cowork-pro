import express from 'express';
import { authenticate } from '../middleware/auth';
import { sendNotificationEmail, sendWelcomeEmail } from '../services/emailService';

const router = express.Router();

// Test email endpoint
router.post('/email', authenticate, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, subject, message } = req.body;

    // Validate required fields
    if (!email || !subject || !message) {
      res.status(400).json({
        success: false,
        message: 'Email, subject, and message are required'
      });
      return;
    }

    // Check if AWS credentials are configured
    const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && 
                             process.env.AWS_SECRET_ACCESS_KEY && 
                             process.env.AWS_REGION && 
                             process.env.SES_FROM_EMAIL;

    if (!hasAwsCredentials) {
      // Simulate email sending without AWS credentials
      console.log('📧 EMAIL SIMULATION (AWS credentials not configured):');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log(`From: ${process.env.SES_FROM_EMAIL || 'noreply@coworkpro.com'}`);
      console.log('✅ Email would be sent successfully if AWS SES was configured');

      res.json({
        success: true,
        message: 'Email simulated successfully (AWS SES not configured)',
        data: {
          to: email,
          subject,
          message,
          simulated: true
        }
      });
      return;
    }

    // Try to send actual email if credentials are available
    try {
      await sendNotificationEmail(email, subject, message);
      
      res.json({
        success: true,
        message: 'Email sent successfully',
        data: {
          to: email,
          subject,
          message,
          simulated: false
        }
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Fall back to simulation if email sending fails
      console.log('📧 EMAIL SIMULATION (AWS SES error occurred):');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log(`From: ${process.env.SES_FROM_EMAIL || 'noreply@coworkpro.com'}`);
      console.log('⚠️ Email simulated due to AWS SES error');

      res.json({
        success: true,
        message: 'Email simulated successfully (AWS SES error occurred)',
        data: {
          to: email,
          subject,
          message,
          simulated: true,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        }
      });
    }

  } catch (error) {
    console.error('Error in email test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test welcome email endpoint
router.post('/welcome-email', authenticate, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    // Validate required fields
    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
      return;
    }

    // Check if AWS credentials are configured
    const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && 
                             process.env.AWS_SECRET_ACCESS_KEY && 
                             process.env.AWS_REGION && 
                             process.env.SES_FROM_EMAIL;

    if (!hasAwsCredentials) {
      // Simulate welcome email sending
      console.log('📧 WELCOME EMAIL SIMULATION (AWS credentials not configured):');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Subject: Welcome to CoWork Pro!`);
      console.log(`From: ${process.env.SES_FROM_EMAIL || 'noreply@coworkpro.com'}`);
      console.log('✅ Welcome email would be sent successfully if AWS SES was configured');

      res.json({
        success: true,
        message: 'Welcome email simulated successfully (AWS SES not configured)',
        data: {
          to: email,
          name,
          simulated: true
        }
      });
      return;
    }

    // Try to send actual welcome email if credentials are available
    try {
      await sendWelcomeEmail(email, name);
      
      res.json({
        success: true,
        message: 'Welcome email sent successfully',
        data: {
          to: email,
          name,
          simulated: false
        }
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      
      // Fall back to simulation if email sending fails
      console.log('📧 WELCOME EMAIL SIMULATION (AWS SES error occurred):');
      console.log(`To: ${email}`);
      console.log(`Name: ${name}`);
      console.log(`Subject: Welcome to CoWork Pro!`);
      console.log(`From: ${process.env.SES_FROM_EMAIL || 'noreply@coworkpro.com'}`);
      console.log('⚠️ Welcome email simulated due to AWS SES error');

      res.json({
        success: true,
        message: 'Welcome email simulated successfully (AWS SES error occurred)',
        data: {
          to: email,
          name,
          simulated: true,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        }
      });
    }

  } catch (error) {
    console.error('Error in welcome email test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;