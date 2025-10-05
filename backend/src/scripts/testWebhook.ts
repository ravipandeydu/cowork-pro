// npx ts-node src/scripts/testWebhook.ts 

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8000/api/webhooks/superfone/lead';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test_webhook_secret_123';

// Test data for the webhook
const testLeads = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Tech Corp',
    business_type: 'Technology',
    business_size: 'medium'
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1987654321',
    company: 'Consulting LLC',
    business_type: 'Consulting',
    business_size: 'small'
  }
];

/**
 * Calculate HMAC signature for webhook payload
 */
function calculateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64');
}

/**
 * Send test webhook request
 */
async function sendWebhook(leadData: any) {
  try {
    // Convert payload to JSON string
    const payload = JSON.stringify(leadData);

    // Calculate signature
    const signature = calculateSignature(payload, WEBHOOK_SECRET);

    console.log('\nSending webhook with data:', leadData);
    console.log('Signature:', signature);

    // Send webhook request
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-superfone-signature': signature
      }
    });

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error sending webhook:', {
        status: error.response?.status,
        data: error.response?.data
      });
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    throw error;
  }
}

/**
 * Main function to run the webhook tests
 */
async function runTests() {
  console.log('🚀 Starting webhook tests...\n');

  for (const lead of testLeads) {
    try {
      console.log(`Testing lead: ${lead.name}`);
      await sendWebhook(lead);
      console.log('✅ Test passed\n');
    } catch (error) {
      console.log('❌ Test failed\n');
    }
  }

  console.log('🏁 Webhook tests completed');
}

// Run the tests
runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Tests failed:', error);
    process.exit(1);
  });