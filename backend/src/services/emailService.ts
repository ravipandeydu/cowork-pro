import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { ILead } from '../models/Lead';
import { IProposal } from '../models/Proposal';

// Function to create SES client with proper credential validation
const createSESClient = (): SESClient => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('AWS SES credentials are not properly configured');
  }

  return new SESClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// Function to get FROM_EMAIL dynamically to ensure environment variables are loaded
const getFromEmail = (): string => {
  return process.env.SES_FROM_EMAIL || 'noreply@coworkpro.com';
};

export const sendProposalEmail = async (
  lead: ILead,
  pdfBuffer: Buffer,
  proposal: any
): Promise<void> => {
  try {
    const sesClient = createSESClient();
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    
    const emailSubject = `Coworking Space Proposal - ${proposal.proposalNumber}`;
    const emailBody = generateProposalEmailBody(lead, proposal);

    // Create raw email with attachment
    const rawEmail = [
      `From: CoWork Proposal Pro <${getFromEmail()}>`,
      `To: ${lead.email}`,
      `Subject: ${emailSubject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      emailBody,
      '',
      `--${boundary}`,
      `Content-Type: application/pdf`,
      `Content-Disposition: attachment; filename="proposal-${proposal.proposalNumber}.pdf"`,
      `Content-Transfer-Encoding: base64`,
      '',
      pdfBuffer.toString('base64'),
      '',
      `--${boundary}--`
    ].join('\r\n');

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
    });

    await sesClient.send(command);
    console.log(`Proposal email sent successfully to ${lead.email}`);
  } catch (error) {
    console.error('Error sending proposal email:', error);
    throw new Error('Failed to send proposal email');
  }
};

export const sendWelcomeEmail = async (userEmail: string, userName: string): Promise<void> => {
  try {
    const sesClient = createSESClient();
    const subject = 'Welcome to CoWork Proposal Pro';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to CoWork Proposal Pro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CoWork Proposal Pro</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to CoWork Proposal Pro - your comprehensive solution for managing coworking space proposals.</p>
            <p>With our platform, you can:</p>
            <ul>
              <li>Manage leads and track their progress</li>
              <li>Create and send professional proposals</li>
              <li>Track proposal status and follow-ups</li>
              <li>Manage coworking center information</li>
              <li>Generate detailed reports and analytics</li>
            </ul>
            <p>Get started by logging into your account and exploring the features.</p>
            <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
          </div>
          <div class="footer">
            <p>This email was sent from CoWork Proposal Pro. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Source: getFromEmail(),
      Destination: {
        ToAddresses: [userEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`Welcome email sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

export const sendFollowUpEmail = async (
  lead: ILead,
  proposal: any,
  followUpType: 'reminder' | 'expiry_warning' | 'thank_you'
): Promise<void> => {
  try {
    const sesClient = createSESClient();
    let subject = '';
    let htmlBody = '';

    switch (followUpType) {
      case 'reminder':
        subject = `Reminder: Your Coworking Space Proposal - ${proposal.proposalNumber}`;
        htmlBody = generateReminderEmailBody(lead, proposal);
        break;
      case 'expiry_warning':
        subject = `Proposal Expiring Soon - ${proposal.proposalNumber}`;
        htmlBody = generateExpiryWarningEmailBody(lead, proposal);
        break;
      case 'thank_you':
        subject = `Thank You - Proposal Approved - ${proposal.proposalNumber}`;
        htmlBody = generateThankYouEmailBody(lead, proposal);
        break;
    }

    const command = new SendEmailCommand({
      Source: getFromEmail(),
      Destination: {
        ToAddresses: [lead.email],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`Follow-up email (${followUpType}) sent successfully to ${lead.email}`);
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw new Error('Failed to send follow-up email');
  }
};

export const sendNotificationEmail = async (
  recipientEmail: string,
  subject: string,
  message: string
): Promise<void> => {
  try {
    const sesClient = createSESClient();
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9fafb; }
          .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CoWork Proposal Pro</h1>
          </div>
          <div class="content">
            <p>${message}</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from CoWork Proposal Pro.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const command = new SendEmailCommand({
      Source: getFromEmail(),
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
    console.log(`Notification email sent successfully to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
};

// Helper functions for generating email bodies
const generateProposalEmailBody = (lead: ILead, proposal: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your Coworking Space Proposal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Coworking Space Proposal</h1>
          <p>Proposal #${proposal.proposalNumber}</p>
        </div>
        <div class="content">
          <h2>Dear ${lead.name},</h2>
          <p>Thank you for your interest in our coworking space. We're excited to present you with a customized proposal that meets your business needs.</p>
          
          <div class="highlight">
            <h3>Proposal Summary:</h3>
            <p><strong>Center:</strong> ${proposal.centerId.name}</p>
            <p><strong>Total Amount:</strong> ₹${proposal.pricing.finalAmount.toLocaleString()} (${proposal.pricing.duration})</p>
            <p><strong>Contract Duration:</strong> ${proposal.contractDuration}</p>
            <p><strong>Valid Until:</strong> ${new Date(proposal.expiryDate).toLocaleDateString()}</p>
          </div>

          <p>Please find the detailed proposal attached to this email. The proposal includes:</p>
          <ul>
            <li>Complete center information and amenities</li>
            <li>Customized seating arrangements</li>
            <li>Transparent pricing breakdown</li>
            <li>Terms and conditions</li>
          </ul>

          <p>We believe this proposal offers excellent value for your ${lead.company} and would love to discuss it further with you.</p>
          
          <p>If you have any questions or would like to schedule a visit to our center, please don't hesitate to contact us.</p>
          
          <a href="tel:${proposal.centerId.contact.phone}" class="button">Call Us</a>
          <a href="mailto:${proposal.createdBy.email}" class="button">Reply to This Proposal</a>
        </div>
        <div class="footer">
          <p>Best regards,<br>
          ${proposal.createdBy.name}<br>
          CoWork Proposal Pro<br>
          ${proposal.createdBy.email}</p>
          <p>This proposal is valid until ${new Date(proposal.expiryDate).toLocaleDateString()}.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateReminderEmailBody = (lead: ILead, proposal: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposal Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Proposal Reminder</h1>
          <p>Proposal #${proposal.proposalNumber}</p>
        </div>
        <div class="content">
          <h2>Dear ${lead.name},</h2>
          <p>We hope this email finds you well. This is a friendly reminder about the coworking space proposal we sent you recently.</p>
          
          <p><strong>Proposal Details:</strong></p>
          <ul>
            <li>Center: ${proposal.centerId.name}</li>
            <li>Amount: ₹${proposal.pricing.finalAmount.toLocaleString()} (${proposal.pricing.duration})</li>
            <li>Valid Until: ${new Date(proposal.expiryDate).toLocaleDateString()}</li>
          </ul>

          <p>We understand that choosing the right workspace is an important decision. If you have any questions or would like to discuss the proposal further, we're here to help.</p>
          
          <p>Would you like to schedule a visit to see the space in person?</p>
          
          <a href="mailto:${proposal.createdBy.email}" class="button">Contact Us</a>
        </div>
        <div class="footer">
          <p>Best regards,<br>
          ${proposal.createdBy.name}<br>
          CoWork Proposal Pro</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateExpiryWarningEmailBody = (lead: ILead, proposal: any): string => {
  const daysLeft = Math.ceil((new Date(proposal.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Proposal Expiring Soon</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .urgent { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Proposal Expiring Soon</h1>
          <p>Proposal #${proposal.proposalNumber}</p>
        </div>
        <div class="content">
          <h2>Dear ${lead.name},</h2>
          
          <div class="urgent">
            <h3>⏰ Time-Sensitive Notice</h3>
            <p>Your coworking space proposal will expire in <strong>${daysLeft} day(s)</strong>!</p>
          </div>

          <p>We wanted to remind you that your customized proposal for ${proposal.centerId.name} is set to expire on <strong>${new Date(proposal.expiryDate).toLocaleDateString()}</strong>.</p>
          
          <p><strong>Don't miss out on this opportunity:</strong></p>
          <ul>
            <li>Special pricing: ₹${proposal.pricing.finalAmount.toLocaleString()} (${proposal.pricing.duration})</li>
            <li>Premium location and amenities</li>
            <li>Flexible contract terms</li>
          </ul>

          <p>If you're interested in moving forward or need more time to decide, please contact us immediately. We'd be happy to discuss your requirements or extend the proposal validity if needed.</p>
          
          <a href="mailto:${proposal.createdBy.email}" class="button">Contact Us Now</a>
        </div>
        <div class="footer">
          <p>Urgent: Please respond before ${new Date(proposal.expiryDate).toLocaleDateString()}<br>
          ${proposal.createdBy.name}<br>
          CoWork Proposal Pro</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateThankYouEmailBody = (lead: ILead, proposal: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Thank You - Proposal Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .success { background-color: #ecfdf5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Our Community!</h1>
          <p>Proposal #${proposal.proposalNumber} - Approved</p>
        </div>
        <div class="content">
          <h2>Dear ${lead.name},</h2>
          
          <div class="success">
            <h3>✅ Congratulations!</h3>
            <p>Your proposal has been approved and we're excited to welcome ${lead.company} to our coworking community!</p>
          </div>

          <p>Thank you for choosing ${proposal.centerId.name} as your workspace solution. We're committed to providing you with an exceptional coworking experience.</p>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Our team will contact you within 24 hours to finalize the agreement</li>
            <li>We'll schedule a welcome tour and orientation session</li>
            <li>You'll receive access credentials and community guidelines</li>
            <li>Move-in can be scheduled at your convenience</li>
          </ol>

          <p>We're here to ensure a smooth transition and help you make the most of your new workspace.</p>
          
          <a href="mailto:${proposal.createdBy.email}" class="button">Contact Your Account Manager</a>
        </div>
        <div class="footer">
          <p>Welcome to the community!<br>
          ${proposal.createdBy.name}<br>
          CoWork Proposal Pro<br>
          ${proposal.createdBy.email}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};