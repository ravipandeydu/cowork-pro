import { body, ValidationChain } from 'express-validator';

// Common validation patterns
export const emailValidation = (): ValidationChain =>
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();

export const passwordValidation = (): ValidationChain =>
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const nameValidation = (field: string = 'name'): ValidationChain =>
  body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${field} can only contain letters and spaces`);

export const phoneValidation = (field: string = 'phone'): ValidationChain =>
  body(field)
    .matches(/^[+]?[\d\s\-\(\)]{10,15}$/)
    .withMessage('Please provide a valid phone number');

export const mongoIdValidation = (field: string): ValidationChain =>
  body(field)
    .isMongoId()
    .withMessage(`${field} must be a valid ID`);

export const optionalMongoIdValidation = (field: string): ValidationChain =>
  body(field)
    .optional()
    .isMongoId()
    .withMessage(`${field} must be a valid ID`);

export const stringValidation = (field: string, min: number = 1, max: number = 255): ValidationChain =>
  body(field)
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);

export const optionalStringValidation = (field: string, min: number = 1, max: number = 255): ValidationChain =>
  body(field)
    .optional()
    .trim()
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);

export const numberValidation = (field: string, min: number = 0): ValidationChain =>
  body(field)
    .isNumeric()
    .withMessage(`${field} must be a number`)
    .custom((value) => {
      if (parseFloat(value) < min) {
        throw new Error(`${field} must be at least ${min}`);
      }
      return true;
    });

export const optionalNumberValidation = (field: string, min: number = 0): ValidationChain =>
  body(field)
    .optional()
    .isNumeric()
    .withMessage(`${field} must be a number`)
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < min) {
        throw new Error(`${field} must be at least ${min}`);
      }
      return true;
    });

export const integerValidation = (field: string, min: number = 0): ValidationChain =>
  body(field)
    .isInt({ min })
    .withMessage(`${field} must be an integer greater than or equal to ${min}`);

export const optionalIntegerValidation = (field: string, min: number = 0): ValidationChain =>
  body(field)
    .optional()
    .isInt({ min })
    .withMessage(`${field} must be an integer greater than or equal to ${min}`);

export const enumValidation = (field: string, values: string[]): ValidationChain =>
  body(field)
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(', ')}`);

export const optionalEnumValidation = (field: string, values: string[]): ValidationChain =>
  body(field)
    .optional()
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(', ')}`);

export const arrayValidation = (field: string, minLength: number = 0): ValidationChain =>
  body(field)
    .isArray({ min: minLength })
    .withMessage(`${field} must be an array with at least ${minLength} items`);

export const optionalArrayValidation = (field: string, minLength: number = 0): ValidationChain =>
  body(field)
    .optional()
    .isArray({ min: minLength })
    .withMessage(`${field} must be an array with at least ${minLength} items`);

export const dateValidation = (field: string): ValidationChain =>
  body(field)
    .isISO8601()
    .withMessage(`${field} must be a valid date`)
    .toDate();

export const optionalDateValidation = (field: string): ValidationChain =>
  body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid date`)
    .toDate();

export const urlValidation = (field: string): ValidationChain =>
  body(field)
    .isURL()
    .withMessage(`${field} must be a valid URL`);

export const optionalUrlValidation = (field: string): ValidationChain =>
  body(field)
    .optional()
    .isURL()
    .withMessage(`${field} must be a valid URL`);

// Business-specific validations
export const businessTypeValidation = (): ValidationChain =>
  enumValidation('businessType', [
    'startup',
    'small_business',
    'medium_business',
    'enterprise',
    'freelancer',
    'consultant',
    'agency',
    'non_profit',
    'other'
  ]);

export const businessSizeValidation = (): ValidationChain =>
  enumValidation('businessSize', [
    '1-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '100+'
  ]);

export const leadStatusValidation = (): ValidationChain =>
  enumValidation('status', [
    'new',
    'contacted',
    'qualified',
    'proposal_sent',
    'negotiation',
    'closed_won',
    'closed_lost'
  ]);

export const leadSourceValidation = (): ValidationChain =>
  enumValidation('source', [
    'website',
    'referral',
    'social_media',
    'email_campaign',
    'phone_call',
    'walk_in',
    'event',
    'partner',
    'other'
  ]);

export const proposalStatusValidation = (): ValidationChain =>
  enumValidation('status', [
    'draft',
    'sent',
    'viewed',
    'under_review',
    'approved',
    'rejected',
    'expired'
  ]);

export const userRoleValidation = (): ValidationChain =>
  enumValidation('role', ['admin', 'manager', 'sales_executive']);

export const pricingDurationValidation = (): ValidationChain =>
  enumValidation('pricing.duration', ['monthly', 'quarterly', 'annual']);

// Address validation
export const addressValidation = () => [
  stringValidation('address.street', 5, 100),
  stringValidation('address.city', 2, 50),
  stringValidation('address.state', 2, 50),
  stringValidation('address.zipCode', 5, 10),
  optionalStringValidation('address.country', 2, 50)
];

// Contact validation
export const contactValidation = () => [
  phoneValidation('contact.phone'),
  emailValidation().withMessage('contact.email must be a valid email'),
  optionalStringValidation('contact.website')
];

// Seating validation
export const seatingValidation = () => [
  optionalIntegerValidation('selectedSeating.hotDesks'),
  optionalIntegerValidation('selectedSeating.dedicatedDesks'),
  optionalIntegerValidation('selectedSeating.privateCabins'),
  optionalIntegerValidation('selectedSeating.meetingRooms')
];

// Pricing validation
export const pricingValidation = () => [
  numberValidation('pricing.baseAmount', 0),
  optionalNumberValidation('pricing.discountPercentage', 0),
  pricingDurationValidation()
];

// Custom validation for business hours
export const businessHoursValidation = (field: string): ValidationChain =>
  body(field)
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s*-\s*([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage(`${field} must be in format "HH:MM - HH:MM" (24-hour format)`);

// Custom validation for capacity
export const capacityValidation = () => [
  integerValidation('capacity.totalSeats', 1),
  optionalIntegerValidation('capacity.hotDesks'),
  optionalIntegerValidation('capacity.dedicatedDesks'),
  optionalIntegerValidation('capacity.privateCabins'),
  optionalIntegerValidation('capacity.meetingRooms')
];

// Validation for coordinates
export const coordinatesValidation = () => [
  body('location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
];