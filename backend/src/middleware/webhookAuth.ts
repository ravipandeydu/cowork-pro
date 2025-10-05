import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// Extend Express Request type to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// Raw body parser middleware
export const rawBodyParser = (req: Request, res: Response, next: NextFunction): void => {
  let data = '';
  req.setEncoding('utf8');

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    req.rawBody = Buffer.from(data);
    next();
  });
};

export const validateSuperfoneWebhook = (req: Request, res: Response, next: NextFunction): void => {
  const webhookSecret = process.env.SUPERFONE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    return;
  }

  const superfoneSignature = req.headers['x-superfone-signature'];
  if (!superfoneSignature || typeof superfoneSignature !== 'string') {
    res.status(401).json({ success: false, message: 'Missing or invalid signature' });
    return;
  }

  try {
    // Use the raw body for signature verification
    const rawBody = req.rawBody?.toString() || '';
    
    // Compute HMAC signature in base64 format to match PowerShell's output
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(rawBody);
    const computedSignature = hmac.digest('base64');
    
    // Compare signatures
    if (computedSignature !== superfoneSignature) {
      console.error('Signature mismatch:', {
        received: superfoneSignature,
        computed: computedSignature,
        body: rawBody
      });
      res.status(401).json({ success: false, message: 'Invalid signature' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    res.status(401).json({ success: false, message: 'Invalid signature' });
    return;
  }
};