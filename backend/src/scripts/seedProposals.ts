import mongoose from 'mongoose';
import Proposal, { IProposal } from '../models/Proposal';
import Lead from '../models/Lead';
import User from '../models/User';
import Center from '../models/Center';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample proposal data
const sampleProposals = [
  {
    title: 'Coworking Space Proposal for TechStartup Inc.',
    selectedSeating: {
      hotDesks: 5,
      dedicatedDesks: 3,
      privateCabins: 1,
      meetingRooms: 2
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services', 'Mail handling'],
      lifestyle: ['Cafeteria', 'Lounge area', 'Outdoor terrace'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors']
    },
    pricing: {
      baseAmount: 45000,
      discountPercentage: 10,
      discountAmount: 4500,
      finalAmount: 40500,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '12 months',
    terms: [
      'Minimum contract period of 12 months',
      'Payment due on the 1st of each month',
      '30-day notice period for termination',
      'Security deposit equivalent to 2 months rent'
    ],
    additionalServices: [
      'Dedicated IT support',
      'Event space booking',
      'Catering services'
    ],
    status: 'sent' as const,
    notes: ['Client interested in tech-friendly amenities', 'Requires flexible meeting room access']
  },
  {
    title: 'Premium Office Solution for Creative Design Studio',
    selectedSeating: {
      hotDesks: 0,
      dedicatedDesks: 8,
      privateCabins: 2,
      meetingRooms: 1
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services'],
      lifestyle: ['Cafeteria', 'Lounge area'],
      technology: ['Video conferencing', 'Smart boards']
    },
    pricing: {
      baseAmount: 65000,
      discountPercentage: 15,
      discountAmount: 9750,
      finalAmount: 55250,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '18 months',
    terms: [
      'Minimum contract period of 18 months',
      'Payment due on the 1st of each month',
      '60-day notice period for termination',
      'Security deposit equivalent to 3 months rent'
    ],
    additionalServices: [
      'Design studio equipment access',
      'Photography studio booking',
      'Client presentation room'
    ],
    status: 'under_review' as const,
    notes: ['Client needs creative workspace with design tools', 'Budget-conscious but quality-focused']
  },
  {
    title: 'Startup Package for HealthTech Innovations',
    selectedSeating: {
      hotDesks: 8,
      dedicatedDesks: 2,
      privateCabins: 0,
      meetingRooms: 1
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting'],
      business: ['Printing services', 'Reception services'],
      lifestyle: ['Cafeteria'],
      technology: ['Video conferencing']
    },
    pricing: {
      baseAmount: 35000,
      discountPercentage: 20,
      discountAmount: 7000,
      finalAmount: 28000,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '6 months',
    terms: [
      'Minimum contract period of 6 months',
      'Payment due on the 1st of each month',
      '30-day notice period for termination',
      'Security deposit equivalent to 1 month rent'
    ],
    additionalServices: [
      'Startup mentorship program access',
      'Networking events'
    ],
    status: 'approved' as const,
    notes: ['Startup-friendly pricing applied', 'Fast-growing team, may need expansion']
  },
  {
    title: 'Enterprise Solution for E-Commerce Plus',
    selectedSeating: {
      hotDesks: 2,
      dedicatedDesks: 15,
      privateCabins: 5,
      meetingRooms: 3
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning', 'Security systems'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station', 'Break rooms'],
      business: ['Printing services', 'Reception services', 'Mail handling', 'Phone booths'],
      lifestyle: ['Cafeteria', 'Lounge area', 'Outdoor terrace', 'Wellness room'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors', 'High-end AV equipment']
    },
    pricing: {
      baseAmount: 125000,
      discountPercentage: 8,
      discountAmount: 10000,
      finalAmount: 115000,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '24 months',
    terms: [
      'Minimum contract period of 24 months',
      'Payment due on the 1st of each month',
      '90-day notice period for termination',
      'Security deposit equivalent to 3 months rent',
      'Annual rent review clause'
    ],
    additionalServices: [
      'Dedicated account manager',
      'Priority booking for all facilities',
      'Custom branding options',
      'Executive parking spaces'
    ],
    status: 'sent' as const,
    notes: ['Large enterprise client', 'Requires premium amenities and services', 'Long-term partnership potential']
  },
  {
    title: 'Flexible Workspace for Rodriguez Consulting',
    selectedSeating: {
      hotDesks: 3,
      dedicatedDesks: 5,
      privateCabins: 2,
      meetingRooms: 2
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services', 'Mail handling'],
      lifestyle: ['Cafeteria', 'Lounge area'],
      technology: ['Video conferencing', 'Smart boards']
    },
    pricing: {
      baseAmount: 55000,
      discountPercentage: 12,
      discountAmount: 6600,
      finalAmount: 48400,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '12 months',
    terms: [
      'Minimum contract period of 12 months',
      'Payment due on the 1st of each month',
      '45-day notice period for termination',
      'Security deposit equivalent to 2 months rent'
    ],
    additionalServices: [
      'Client meeting rooms',
      'Professional address service'
    ],
    status: 'draft' as const,
    notes: ['Consulting firm needs professional meeting spaces', 'Flexible seating arrangement preferred']
  },
  {
    title: 'Marketing Agency Hub for Marketing Pro Agency',
    selectedSeating: {
      hotDesks: 4,
      dedicatedDesks: 6,
      privateCabins: 1,
      meetingRooms: 2
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services'],
      lifestyle: ['Cafeteria', 'Lounge area'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors']
    },
    pricing: {
      baseAmount: 48000,
      discountPercentage: 5,
      discountAmount: 2400,
      finalAmount: 45600,
      currency: 'INR',
      duration: 'quarterly' as const
    },
    contractDuration: '12 months',
    terms: [
      'Minimum contract period of 12 months',
      'Quarterly payment in advance',
      '30-day notice period for termination',
      'Security deposit equivalent to 1 quarter rent'
    ],
    additionalServices: [
      'Creative brainstorming rooms',
      'Client presentation facilities'
    ],
    status: 'viewed' as const,
    notes: ['Marketing agency needs creative spaces', 'Quarterly payment preferred for cash flow']
  },
  {
    title: 'FinTech Workspace for FinTech Solutions',
    selectedSeating: {
      hotDesks: 6,
      dedicatedDesks: 10,
      privateCabins: 3,
      meetingRooms: 2
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning', 'Security systems'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services', 'Mail handling', 'Phone booths'],
      lifestyle: ['Cafeteria', 'Lounge area'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors']
    },
    pricing: {
      baseAmount: 85000,
      discountPercentage: 7,
      discountAmount: 5950,
      finalAmount: 79050,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '18 months',
    terms: [
      'Minimum contract period of 18 months',
      'Payment due on the 1st of each month',
      '60-day notice period for termination',
      'Security deposit equivalent to 2 months rent',
      'Compliance with financial regulations'
    ],
    additionalServices: [
      'Secure document storage',
      'Compliance meeting rooms',
      'Financial data protection measures'
    ],
    status: 'rejected' as const,
    notes: ['FinTech client with strict security requirements', 'Rejected due to budget constraints']
  },
  {
    title: 'Legal Office Setup for Martinez & Associates Law',
    selectedSeating: {
      hotDesks: 0,
      dedicatedDesks: 4,
      privateCabins: 4,
      meetingRooms: 3
    },
    selectedAmenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning', 'Security systems'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station'],
      business: ['Printing services', 'Reception services', 'Mail handling', 'Phone booths'],
      lifestyle: ['Lounge area'],
      technology: ['Video conferencing', 'Smart boards']
    },
    pricing: {
      baseAmount: 75000,
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: 75000,
      currency: 'INR',
      duration: 'monthly' as const
    },
    contractDuration: '24 months',
    terms: [
      'Minimum contract period of 24 months',
      'Payment due on the 1st of each month',
      '90-day notice period for termination',
      'Security deposit equivalent to 3 months rent',
      'Confidentiality and privacy agreements'
    ],
    additionalServices: [
      'Confidential meeting rooms',
      'Legal document storage',
      'Client consultation rooms'
    ],
    status: 'expired' as const,
    notes: ['Law firm requires high privacy and security', 'Proposal expired due to delayed decision']
  }
];

async function seedProposals() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowork-pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if proposals already exist
    const existingProposalsCount = await Proposal.countDocuments();
    console.log(`Found ${existingProposalsCount} existing proposals in database`);

    if (existingProposalsCount > 0) {
      console.log('Database already contains proposals. Skipping seeding.');
      console.log('If you want to re-seed, please clear the proposals collection first.');
      return;
    }

    // Get existing leads, users, and centers
    const leads = await Lead.find({ status: { $ne: 'lost' } }).limit(8);
    const users = await User.find({ isActive: true, role: { $in: ['sales_executive', 'sales_manager'] } });
    const centers = await Center.find({ isActive: true }).limit(3);

    if (leads.length === 0) {
      console.log('No leads found. Please seed leads first.');
      return;
    }

    if (users.length === 0) {
      console.log('No active users found. Please seed users first.');
      return;
    }

    if (centers.length === 0) {
      console.log('No active centers found. Please seed centers first.');
      return;
    }

    console.log(`Found ${leads.length} leads, ${users.length} users, and ${centers.length} centers`);

    // Create proposals
    const createdProposals = [];
    for (let i = 0; i < Math.min(sampleProposals.length, leads.length); i++) {
      try {
        const proposalData = sampleProposals[i];
        const lead = leads[i];
        const user = users[i % users.length];
        const center = centers[i % centers.length];

        // Set expiry date based on status
        let expiryDate;
        if (proposalData.status === 'sent' || proposalData.status === 'viewed') {
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
        } else if (proposalData.status === 'expired') {
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() - 5); // 5 days ago
        }

        // Set follow-up date for certain statuses
        let followUpDate;
        if (proposalData.status === 'sent' || proposalData.status === 'under_review') {
          followUpDate = new Date();
          followUpDate.setDate(followUpDate.getDate() + 7); // 7 days from now
        }

        // Set email tracking based on status
        const emailTracking: any = { emailsSent: 0 };
        if (['sent', 'viewed', 'under_review', 'approved', 'rejected'].includes(proposalData.status)) {
          emailTracking.sentAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random date within last 7 days
          emailTracking.emailsSent = 1;
        }
        if (['viewed', 'under_review', 'approved', 'rejected'].includes(proposalData.status)) {
          emailTracking.openedAt = new Date(emailTracking.sentAt.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000); // Random date within 2 days of sending
        }
        if (['approved', 'rejected'].includes(proposalData.status)) {
          emailTracking.responseAt = new Date(emailTracking.openedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000); // Random date within 3 days of opening
        }

        // Don't set proposalNumber - it will be auto-generated by pre-save middleware
        const proposal = new Proposal({
          leadId: lead._id,
          centerId: center._id,
          createdBy: user._id,
          title: proposalData.title,
          selectedSeating: proposalData.selectedSeating,
          selectedAmenities: proposalData.selectedAmenities,
          pricing: proposalData.pricing,
          contractDuration: proposalData.contractDuration,
          terms: proposalData.terms,
          additionalServices: proposalData.additionalServices,
          status: proposalData.status,
          emailTracking,
          followUpDate,
          expiryDate,
          notes: proposalData.notes
        });

        await proposal.save();
        createdProposals.push(proposal);
        console.log(`Created proposal: ${proposal.proposalNumber} - ${proposal.title} - Status: ${proposal.status} - Lead: ${(lead as any).name}`);
      } catch (error) {
        console.error(`Error creating proposal ${i + 1}:`, error);
      }
    }

    console.log(`\n✅ Successfully created ${createdProposals.length} proposals`);

    // Display summary by status
    const statusCount = createdProposals.reduce((acc, proposal) => {
      acc[proposal.status] = (acc[proposal.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Proposals created by status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Display summary by duration
    const durationCount = createdProposals.reduce((acc, proposal) => {
      acc[proposal.pricing.duration] = (acc[proposal.pricing.duration] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💰 Proposals created by pricing duration:');
    Object.entries(durationCount).forEach(([duration, count]) => {
      console.log(`  ${duration}: ${count}`);
    });

    // Display total value
    const totalValue = createdProposals.reduce((sum, proposal) => sum + proposal.pricing.finalAmount, 0);
    console.log(`\n💵 Total proposal value: ₹${totalValue.toLocaleString()}`);

  } catch (error) {
    console.error('Error seeding proposals:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedProposals().catch(console.error);