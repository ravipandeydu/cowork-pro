# CoWork Proposal Pro - Backend

A comprehensive backend system for managing coworking space proposals, leads, and centers built with Node.js, Express, TypeScript, and MongoDB.

## Features

- **User Management**: Role-based authentication (Admin, Manager, Sales Executive)
- **Lead Management**: Track and manage potential clients
- **Center Management**: Manage coworking space information and availability
- **Proposal Generation**: Create, customize, and send professional proposals
- **PDF Generation**: Automated proposal PDF creation
- **Email Integration**: Amazon SES integration for automated emails
- **Analytics**: Dashboard with key metrics and insights

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email Service**: Amazon SES
- **PDF Generation**: PDFKit
- **Validation**: express-validator
- **Security**: Helmet, CORS, bcryptjs

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- AWS Account with SES configured
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cowork-pro/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/cowork-pro
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # AWS SES Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   SES_FROM_EMAIL=noreply@yourdomain.com
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Documentation

### Authentication

#### Register User (Admin Only)
```http
POST /api/auth/register
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "sales_executive"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Leads Management

#### Get All Leads
```http
GET /api/leads?page=1&limit=10&status=new
Authorization: Bearer <token>
```

#### Create Lead
```http
POST /api/leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+1234567890",
  "company": "Tech Startup Inc",
  "businessType": "startup",
  "businessSize": "1-5",
  "seatingRequirements": {
    "hotDesks": 3,
    "dedicatedDesks": 2
  },
  "source": "website"
}
```

### Centers Management

#### Get All Centers
```http
GET /api/centers?page=1&limit=10&city=Mumbai
Authorization: Bearer <token>
```

#### Create Center
```http
POST /api/centers
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Downtown Coworking Hub",
  "address": {
    "street": "123 Business Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "contact": {
    "phone": "+91-9876543210",
    "email": "info@downtown-hub.com"
  },
  "capacity": {
    "totalSeats": 100,
    "hotDesks": 40,
    "dedicatedDesks": 30,
    "privateCabins": 20,
    "meetingRooms": 10
  },
  "amenities": ["wifi", "parking", "cafeteria", "meeting_rooms"],
  "pricing": {
    "hotDesk": 2000,
    "dedicatedDesk": 5000,
    "privateCabin": 15000,
    "meetingRoom": 500
  }
}
```

### Proposals Management

#### Create Proposal
```http
POST /api/proposals
Content-Type: application/json
Authorization: Bearer <token>

{
  "leadId": "64a1b2c3d4e5f6789012345",
  "centerId": "64a1b2c3d4e5f6789012346",
  "title": "Coworking Solution for Tech Startup Inc",
  "selectedSeating": {
    "hotDesks": 3,
    "dedicatedDesks": 2
  },
  "selectedAmenities": ["wifi", "parking", "meeting_rooms"],
  "pricing": {
    "baseAmount": 16000,
    "discountPercentage": 10,
    "duration": "monthly"
  },
  "contractDuration": "12 months",
  "terms": [
    "Payment due within 30 days",
    "Minimum 3-month commitment",
    "24/7 access included"
  ]
}
```

#### Send Proposal
```http
POST /api/proposals/:id/send
Authorization: Bearer <token>
```

## Database Models

### User
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: Enum ['admin', 'manager', 'sales_executive']
- `isActive`: Boolean (default: true)

### Lead
- `name`: String (required)
- `email`: String (required)
- `phone`: String (required)
- `company`: String (required)
- `businessType`: Enum (startup, small_business, etc.)
- `businessSize`: Enum (1-5, 6-10, etc.)
- `seatingRequirements`: Object
- `status`: Enum (new, contacted, qualified, etc.)
- `source`: Enum (website, referral, etc.)
- `assignedTo`: ObjectId (User reference)

### Center
- `name`: String (required)
- `address`: Object (street, city, state, zipCode, country)
- `contact`: Object (phone, email, website)
- `capacity`: Object (totalSeats, hotDesks, etc.)
- `amenities`: Array of strings
- `pricing`: Object (hotDesk, dedicatedDesk, etc.)
- `operatingHours`: Object (weekdays, weekends)
- `isActive`: Boolean (default: true)

### Proposal
- `proposalNumber`: String (auto-generated)
- `leadId`: ObjectId (Lead reference)
- `centerId`: ObjectId (Center reference)
- `createdBy`: ObjectId (User reference)
- `title`: String (required)
- `selectedSeating`: Object
- `selectedAmenities`: Array of strings
- `pricing`: Object (baseAmount, discountPercentage, etc.)
- `status`: Enum (draft, sent, viewed, etc.)
- `expiryDate`: Date
- `emailTracking`: Object (sentAt, viewedAt, etc.)

## Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Utilities
npm run lint        # Run ESLint
npm run format      # Format code with Prettier
npm test           # Run tests (if configured)
```

## Project Structure

```
src/
├── config/
│   └── database.ts         # MongoDB connection
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   └── errorHandler.ts    # Error handling middleware
├── models/
│   ├── User.ts           # User model
│   ├── Lead.ts           # Lead model
│   ├── Center.ts         # Center model
│   └── Proposal.ts       # Proposal model
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── leads.ts          # Lead management routes
│   ├── centers.ts        # Center management routes
│   └── proposals.ts      # Proposal management routes
├── services/
│   ├── emailService.ts   # Email service (SES)
│   └── pdfService.ts     # PDF generation service
├── utils/
│   ├── helpers.ts        # Utility functions
│   └── validation.ts     # Validation helpers
└── server.ts             # Main server file
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Role-based Access Control**: Different permissions for different user roles
- **Input Validation**: Comprehensive validation using express-validator
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers for Express apps
- **Rate Limiting**: Protection against brute force attacks

## Error Handling

The application includes comprehensive error handling:

- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear authentication failure messages
- **Database Errors**: Proper handling of MongoDB errors
- **Custom Errors**: Application-specific error types
- **Global Error Handler**: Centralized error processing

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/cowork-pro |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `AWS_REGION` | AWS region for SES | us-east-1 |
| `AWS_ACCESS_KEY_ID` | AWS access key | Required |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | Required |
| `SES_FROM_EMAIL` | Email sender address | Required |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Start with PM2:
   ```bash
   pm2 start dist/server.js --name "cowork-backend"
   ```

### Using Docker

1. Create a `Dockerfile`:
   ```dockerfile
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY dist ./dist
   EXPOSE 5000
   CMD ["node", "dist/server.js"]
   ```

2. Build and run:
   ```bash
   docker build -t cowork-backend .
   docker run -p 5000:5000 --env-file .env cowork-backend
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.