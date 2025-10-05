import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { ILead } from '../models/Lead';
import { IProposal } from '../models/Proposal';
import Center, { ICenter } from '../models/Center';

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
const generateProposalEmailBody = (lead: ILead, proposal: IProposal): string => {
  // Get the first center for basic information
  const firstCenter = proposal.centerIds[0] as unknown as ICenter;
  const creator = proposal.createdBy as unknown as { name: string; email: string };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>IA Spaces Proposal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { color: #2563eb; padding: 20px 0; }
        .content { padding: 20px 0; }
        .section { margin: 20px 0; }
        .section-title { color: #2563eb; font-weight: bold; margin: 15px 0; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
        .highlight { background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 15px 0; }
        .footer { padding: 20px 0; color: #6b7280; }
        .brand-links { margin: 15px 0; }
        .brand-links a { color: #2563eb; text-decoration: none; }
        .brand-links a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Dear ${lead.name},</h2>
          <p>Greetings from IA Spaces!</p>
        </div>
        
        <div class="content">
          <p>Thank you for your visit at our <strong>${firstCenter.name}</strong> center and for expressing your interest in acquiring an office space at our <strong>IA Spaces</strong>. As discussed with ${creator.name}, please refer to the commercials and proposed center with the offered workspace solution below.</p>

          <div class="section">
            <h3 class="section-title">About us:</h3>
            <p>IA Spaces is India's premier startup factory, empowering startups through a unique blend of infrastructure, mentorship, and funding support. Our sub-brands include:</p>
            <div class="brand-links">
              <ul>
                <li><a href="https://indiaaccelerator.co/">India Accelerator</a> – Supports early-stage startups with funding, mentorship, and structured growth.</li>
                <li><a href="https://finvolve.co/">Finvolve</a> – A multi-thesis fund supporting startups from pre-seed to pre-IPO through capital, strategic support, and ecosystem access.</li>
                <li><a href="https://iaspaces.co/">IA Spaces</a> – Offers co-working hubs across 10+ cities.</li>
                <li><a href="https://third-place.in/">Third Place</a> – India's premium business café.</li>
              </ul>
            </div>
            <p>We are proud recipients of the <strong>"Best Accelerator of the Country"</strong> award from Startup India (2022), a testament to our continued commitment to nurturing innovation.</p>
          </div>

          <div class="section">
            <h3 class="section-title">Requirements:</h3>
            ${proposal.selectedSeating ? `
              <div class="highlight">
                <h4>${firstCenter.name}</h4>
                <ul>
                  ${proposal.selectedSeating.hotDesks > 0 ? `<li>Hot Desks - ${proposal.selectedSeating.hotDesks} Nos.</li>` : ''}
                  ${proposal.selectedSeating.dedicatedDesks > 0 ? `<li>Dedicated Desks - ${proposal.selectedSeating.dedicatedDesks} Nos.</li>` : ''}
                  ${proposal.selectedSeating.privateCabins > 0 ? `<li>Private Cabins - ${proposal.selectedSeating.privateCabins} Nos.</li>` : ''}
                  ${proposal.selectedSeating.meetingRooms > 0 ? `<li>Meeting Rooms - ${proposal.selectedSeating.meetingRooms} Nos.</li>` : ''}
                </ul>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h3 class="section-title">Standard Services Included:</h3>
            <ul>
              ${proposal.additionalServices?.map(service => `<li>${service}</li>`).join('') || ''}
            </ul>
          </div>

          <div class="section">
            <h3 class="section-title">Key Commercials:</h3>
            ${(proposal.centerIds as unknown as ICenter[]).map(center => `
              <div class="highlight">
                <h4>${center.name}</h4>
                <p><strong>Operating Hours:</strong> Weekdays ${center.operatingHours.weekdays.open} - ${center.operatingHours.weekdays.close}</p>
                ${proposal.selectedSeating.hotDesks > 0 ? `
                  <p><strong>Hot Desk Rate:</strong> ₹${center.pricing.hotDesk.monthly.toLocaleString()}/seat/month plus taxes</p>
                ` : ''}
                ${proposal.selectedSeating.dedicatedDesks > 0 ? `
                  <p><strong>Dedicated Desk Rate:</strong> ₹${center.pricing.dedicatedDesk.monthly.toLocaleString()}/seat/month plus taxes</p>
                ` : ''}
                ${proposal.selectedSeating.privateCabins > 0 ? `
                  <p><strong>Private Cabin Rate:</strong> ₹${center.pricing.privateCabin.monthly.toLocaleString()}/cabin/month plus taxes</p>
                ` : ''}
                <p><strong>Total Amount:</strong> ₹${proposal.pricing.finalAmount.toLocaleString()}/month plus taxes</p>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h3 class="section-title">Required KYC Documents:</h3>
            <ul>
              <li>Certificate of Incorporation</li>
              <li>GST and PAN card of the Company</li>
              <li>AADHAAR and PAN card of All Directors</li>
              <li>PAN and AADHAAR card of Sign Authorised Person Signatory</li>
              <li>Board Resolution</li>
              <li>Point of Contact (Name/Email ID/Contact No./Address ID proof)</li>
              <li>Emergency Contact (Name/Email ID/Contact No./Address ID proof)</li>
              <li>Team Members (Name/Email ID/Contact No./Address ID proof)</li>
              <li>Accounts POC (Name/Email ID/Contact No./Address ID Proof)</li>
              <li>Logo of the Company</li>
            </ul>
          </div>

          <p>Should you have any queries or require further clarifications, please do not hesitate to reach out to us.</p>
          
          <p>We look forward to welcoming your team to India Accelerator and supporting your growth journey.</p>
        </div>

        <div class="footer">
          <p>Best regards,<br>
          ${creator.name}<br>
          IA Spaces<br>
          ${creator.email}<br>
          ${firstCenter.contact.phone}</p>
          <p>This proposal is valid until ${proposal.expiryDate ? new Date(proposal.expiryDate).toLocaleDateString() : 'N/A'}.</p>
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