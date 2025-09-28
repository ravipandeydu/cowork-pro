import mongoose from 'mongoose';
import Center, { ICenter } from '../models/Center';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample center data
const sampleCenters = [
  {
    name: 'Tech Hub Central',
    address: {
      street: '123 Innovation Drive',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    contact: {
      phone: '+91-80-12345678',
      email: 'techhub@coworkpro.com'
    },
    operatingHours: {
      weekdays: {
        open: '08:00',
        close: '20:00'
      },
      weekends: {
        open: '09:00',
        close: '18:00'
      }
    },
    capacity: {
      totalSeats: 150,
      availableSeats: 120,
      hotDesks: {
        total: 50,
        available: 40
      },
      dedicatedDesks: {
        total: 60,
        available: 50
      },
      privateCabins: {
        total: 25,
        available: 20
      },
      meetingRooms: {
        total: 15,
        available: 10
      }
    },
    amenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning', 'Security systems'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station', 'Break rooms'],
      business: ['Printing services', 'Reception services', 'Mail handling', 'Phone booths'],
      lifestyle: ['Cafeteria', 'Lounge area', 'Outdoor terrace', 'Wellness room'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors', 'High-end AV equipment'],
      other: ['24/7 access', 'Parking facility', 'Bike storage']
    },
    pricing: {
      hotDesk: {
        hourly: 150,
        daily: 800,
        monthly: 8000
      },
      dedicatedDesk: {
        daily: 1200,
        monthly: 12000
      },
      privateCabin: {
        daily: 2500,
        monthly: 25000
      },
      meetingRoom: {
        hourly: 500,
        daily: 3000
      }
    },
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'
    ],
    nearbyFacilities: {
      transportation: ['Metro Station - 200m', 'Bus Stop - 50m', 'Airport - 15km'],
      dining: ['Food Court - Ground Floor', 'Restaurants - 100m', 'Cafes - 50m'],
      services: ['Bank - 200m', 'ATM - 50m', 'Pharmacy - 150m', 'Gym - 300m'],
      other: ['Shopping Mall - 500m', 'Hospital - 1km', 'Park - 300m']
    },
    isActive: true
  },
  {
    name: 'Business District Premium',
    address: {
      street: '456 Corporate Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    contact: {
      phone: '+91-22-87654321',
      email: 'premium@coworkpro.com'
    },
    operatingHours: {
      weekdays: {
        open: '07:00',
        close: '22:00'
      },
      weekends: {
        open: '08:00',
        close: '20:00'
      }
    },
    capacity: {
      totalSeats: 200,
      availableSeats: 160,
      hotDesks: {
        total: 60,
        available: 45
      },
      dedicatedDesks: {
        total: 80,
        available: 65
      },
      privateCabins: {
        total: 40,
        available: 35
      },
      meetingRooms: {
        total: 20,
        available: 15
      }
    },
    amenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning', 'Security systems'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station', 'Break rooms'],
      business: ['Printing services', 'Reception services', 'Mail handling', 'Phone booths'],
      lifestyle: ['Cafeteria', 'Lounge area', 'Outdoor terrace', 'Wellness room'],
      technology: ['Video conferencing', 'Smart boards', 'Projectors', 'High-end AV equipment'],
      other: ['24/7 access', 'Valet parking', 'Concierge service', 'Executive lounge']
    },
    pricing: {
      hotDesk: {
        hourly: 200,
        daily: 1000,
        monthly: 10000
      },
      dedicatedDesk: {
        daily: 1500,
        monthly: 15000
      },
      privateCabin: {
        daily: 3500,
        monthly: 35000
      },
      meetingRoom: {
        hourly: 800,
        daily: 5000
      }
    },
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800',
      'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800'
    ],
    nearbyFacilities: {
      transportation: ['Metro Station - 100m', 'Bus Terminal - 200m', 'Airport - 25km'],
      dining: ['Fine Dining - Ground Floor', 'Business Lunch - 50m', 'Street Food - 200m'],
      services: ['Private Bank - 100m', 'ATM - Ground Floor', 'Medical Center - 200m', 'Spa - 500m'],
      other: ['Shopping Complex - 300m', 'Business Hotel - 200m', 'Conference Center - 400m']
    },
    isActive: true
  },
  {
    name: 'Creative Workspace',
    address: {
      street: '789 Design Street',
      city: 'Pune',
      state: 'Maharashtra',
      zipCode: '411001',
      country: 'India'
    },
    contact: {
      phone: '+91-20-11223344',
      email: 'creative@coworkpro.com'
    },
    operatingHours: {
      weekdays: {
        open: '09:00',
        close: '19:00'
      },
      weekends: {
        open: '10:00',
        close: '17:00'
      }
    },
    capacity: {
      totalSeats: 100,
      availableSeats: 85,
      hotDesks: {
        total: 40,
        available: 35
      },
      dedicatedDesks: {
        total: 35,
        available: 30
      },
      privateCabins: {
        total: 15,
        available: 12
      },
      meetingRooms: {
        total: 10,
        available: 8
      }
    },
    amenities: {
      essential: ['High-speed WiFi', 'Power outlets', 'Air conditioning'],
      comfort: ['Ergonomic chairs', 'Natural lighting', 'Coffee/tea station', 'Break rooms'],
      business: ['Printing services', 'Reception services', 'Mail handling'],
      lifestyle: ['Cafeteria', 'Lounge area', 'Art gallery', 'Music room'],
      technology: ['Video conferencing', 'Smart boards', 'Design software', 'Photography studio'],
      other: ['Creative workshops', 'Art supplies', 'Flexible furniture']
    },
    pricing: {
      hotDesk: {
        hourly: 120,
        daily: 600,
        monthly: 6000
      },
      dedicatedDesk: {
        daily: 900,
        monthly: 9000
      },
      privateCabin: {
        daily: 2000,
        monthly: 20000
      },
      meetingRoom: {
        hourly: 400,
        daily: 2500
      }
    },
    images: [
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800',
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
      'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=800'
    ],
    nearbyFacilities: {
      transportation: ['Bus Stop - 100m', 'Railway Station - 2km', 'Airport - 10km'],
      dining: ['Organic Cafe - 50m', 'Food Trucks - 200m', 'Restaurants - 300m'],
      services: ['Bank - 300m', 'ATM - 100m', 'Clinic - 400m', 'Yoga Studio - 200m'],
      other: ['Art Supplies Store - 100m', 'Bookstore - 150m', 'Park - 500m']
    },
    isActive: true
  }
];

async function seedCenters() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cowork-pro';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if centers already exist
    const existingCentersCount = await Center.countDocuments();
    console.log(`Found ${existingCentersCount} existing centers in database`);

    if (existingCentersCount > 0) {
      console.log('Database already contains centers. Skipping seeding.');
      console.log('If you want to re-seed, please clear the centers collection first.');
      return;
    }

    // Create centers
    const createdCenters = [];
    for (let i = 0; i < sampleCenters.length; i++) {
      try {
        const centerData = sampleCenters[i];
        const center = new Center(centerData);
        await center.save();
        createdCenters.push(center);
        console.log(`Created center: ${center.name} - ${center.address.city}`);
      } catch (error) {
        console.error(`Error creating center ${i + 1}:`, error);
      }
    }

    console.log(`\n✅ Successfully created ${createdCenters.length} centers`);

    // Display summary by city
    const cityCount = createdCenters.reduce((acc, center) => {
      acc[center.address.city] = (acc[center.address.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n🏙️ Centers created by city:');
    Object.entries(cityCount).forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

    // Display total capacity
    const totalCapacity = createdCenters.reduce((sum, center) => sum + center.capacity.totalSeats, 0);
    const totalAvailable = createdCenters.reduce((sum, center) => sum + center.capacity.availableSeats, 0);
    console.log(`\n💺 Total capacity: ${totalCapacity} seats (${totalAvailable} available)`);

  } catch (error) {
    console.error('Error seeding centers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedCenters().catch(console.error);