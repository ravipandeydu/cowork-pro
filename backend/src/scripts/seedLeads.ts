import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lead from '../models/Lead';
import User from '../models/User';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

// Sample leads data
const sampleLeads = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techstartup.com',
    phone: '+1-555-0123',
    company: 'TechStartup Inc.',
    businessType: 'Technology',
    businessSize: 'startup',
    seatingRequirements: {
      hotDesks: 5,
      dedicatedDesks: 2,
      privateCabins: 1,
      meetingRooms: 1
    },
    budgetRange: {
      min: 2000,
      max: 4000
    },
    preferredLocations: ['Downtown', 'Tech District'],
    timeline: 'Within 2 months',
    specialRequirements: 'High-speed internet, 24/7 access',
    status: 'new',
    source: 'website',
    notes: ['Initial inquiry through website contact form']
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@designstudio.com',
    phone: '+1-555-0124',
    company: 'Creative Design Studio',
    businessType: 'Design & Creative',
    businessSize: 'small',
    seatingRequirements: {
      hotDesks: 8,
      dedicatedDesks: 4,
      privateCabins: 2,
      meetingRooms: 2
    },
    budgetRange: {
      min: 5000,
      max: 8000
    },
    preferredLocations: ['Arts District', 'Downtown'],
    timeline: 'Within 1 month',
    specialRequirements: 'Natural lighting, creative spaces',
    status: 'contacted',
    source: 'referral',
    notes: ['Referred by existing client', 'Interested in flexible terms']
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@consultingfirm.com',
    phone: '+1-555-0125',
    company: 'Rodriguez Consulting',
    businessType: 'Business Consulting',
    businessSize: 'medium',
    seatingRequirements: {
      hotDesks: 10,
      dedicatedDesks: 8,
      privateCabins: 4,
      meetingRooms: 3
    },
    budgetRange: {
      min: 8000,
      max: 12000
    },
    preferredLocations: ['Business District', 'Financial District'],
    timeline: 'Within 3 months',
    specialRequirements: 'Professional meeting rooms, reception area',
    status: 'proposal_sent',
    source: 'cold_call',
    notes: ['Proposal sent on 2024-01-15', 'Follow-up scheduled']
  },
  {
    name: 'David Kim',
    email: 'david.kim@marketingpro.com',
    phone: '+1-555-0126',
    company: 'Marketing Pro Agency',
    businessType: 'Marketing & Advertising',
    businessSize: 'medium',
    seatingRequirements: {
      hotDesks: 12,
      dedicatedDesks: 6,
      privateCabins: 3,
      meetingRooms: 2
    },
    budgetRange: {
      min: 6000,
      max: 10000
    },
    preferredLocations: ['Creative District', 'Downtown'],
    timeline: 'Within 6 weeks',
    specialRequirements: 'Presentation equipment, video conferencing',
    status: 'follow_up',
    source: 'social_media',
    notes: ['Found us on LinkedIn', 'Needs flexible contract terms']
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa.thompson@fintech.com',
    phone: '+1-555-0127',
    company: 'FinTech Solutions',
    businessType: 'Financial Technology',
    businessSize: 'large',
    seatingRequirements: {
      hotDesks: 20,
      dedicatedDesks: 15,
      privateCabins: 8,
      meetingRooms: 5
    },
    budgetRange: {
      min: 15000,
      max: 25000
    },
    preferredLocations: ['Financial District', 'Tech Hub'],
    timeline: 'Within 4 months',
    specialRequirements: 'High security, compliance requirements',
    status: 'converted',
    source: 'referral',
    notes: ['Signed contract on 2024-01-10', 'Premium package selected']
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@healthtech.com',
    phone: '+1-555-0128',
    company: 'HealthTech Innovations',
    businessType: 'Healthcare Technology',
    businessSize: 'medium',
    seatingRequirements: {
      hotDesks: 6,
      dedicatedDesks: 4,
      privateCabins: 2,
      meetingRooms: 2
    },
    budgetRange: {
      min: 4000,
      max: 7000
    },
    preferredLocations: ['Medical District', 'Tech Hub'],
    timeline: 'Within 2 months',
    specialRequirements: 'HIPAA compliance, secure network',
    status: 'new',
    source: 'website',
    notes: ['Initial consultation scheduled']
  },
  {
    name: 'Amanda Foster',
    email: 'amanda.foster@ecommerce.com',
    phone: '+1-555-0129',
    company: 'E-Commerce Plus',
    businessType: 'E-Commerce',
    businessSize: 'small',
    seatingRequirements: {
      hotDesks: 4,
      dedicatedDesks: 3,
      privateCabins: 1,
      meetingRooms: 1
    },
    budgetRange: {
      min: 3000,
      max: 5000
    },
    preferredLocations: ['Business Park', 'Suburban'],
    timeline: 'Within 1 month',
    specialRequirements: 'Package receiving, storage space',
    status: 'contacted',
    source: 'other',
    notes: ['Contacted via phone', 'Interested in short-term lease']
  },
  {
    name: 'Robert Martinez',
    email: 'robert.martinez@lawfirm.com',
    phone: '+1-555-0130',
    company: 'Martinez & Associates Law',
    businessType: 'Legal Services',
    businessSize: 'small',
    seatingRequirements: {
      hotDesks: 2,
      dedicatedDesks: 4,
      privateCabins: 3,
      meetingRooms: 2
    },
    budgetRange: {
      min: 5000,
      max: 8000
    },
    preferredLocations: ['Legal District', 'Downtown'],
    timeline: 'Within 3 months',
    specialRequirements: 'Confidential meeting rooms, legal library access',
    status: 'lost',
    source: 'referral',
    notes: ['Decided to go with competitor', 'Price was main factor']
  }
];

async function seedLeads() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if leads already exist
    const existingLeads = await Lead.countDocuments();
    if (existingLeads > 0) {
      console.log(`Database already contains ${existingLeads} leads. Skipping seed.`);
      console.log('To re-seed, please clear the leads collection first.');
      process.exit(0);
    }

    // Get users to assign leads to
    const users = await User.find({ isActive: true }).select('_id name email role');
    if (users.length === 0) {
      console.log('❌ No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users to assign leads to:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Create leads with random user assignment
    const leadsToCreate = sampleLeads.map((leadData, index) => ({
      ...leadData,
      assignedTo: users[index % users.length]._id, // Distribute leads among users
      lastContactDate: leadData.status !== 'new' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      nextFollowUpDate: ['new', 'contacted', 'follow_up'].includes(leadData.status) 
        ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) 
        : undefined
    }));

    // Insert leads
    const createdLeads = await Lead.insertMany(leadsToCreate);
    
    console.log(`✅ Successfully created ${createdLeads.length} sample leads!`);
    console.log('\nLead distribution by status:');
    
    const statusCounts = createdLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} leads`);
    });

    console.log('\nLead distribution by user:');
    const userCounts = createdLeads.reduce((acc, lead) => {
      const user = users.find(u => (u._id as any).toString() === (lead.assignedTo as any).toString());
      const userName = user ? user.name : 'Unknown';
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(userCounts).forEach(([userName, count]) => {
      console.log(`  - ${userName}: ${count} leads`);
    });

  } catch (error) {
    console.error('❌ Error seeding leads:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
seedLeads();