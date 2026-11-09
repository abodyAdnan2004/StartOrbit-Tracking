// Database Seed Script
// Run with: npx prisma db seed
// Or: node prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Full system access',
        isSystemRole: true,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'manager' },
      update: {},
      create: {
        name: 'manager',
        description: 'Manage users and customers, view reports',
        isSystemRole: true,
        isActive: true,
      },
    }),
    prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        description: 'Field user - can view assigned customers and send locations',
        isSystemRole: true,
        isActive: true,
      },
    }),
  ]);

  const adminRole = roles.find(r => r.name === 'admin');
  const managerRole = roles.find(r => r.name === 'manager');
  const userRole = roles.find(r => r.name === 'user');

  console.log('✅ Roles created');

  // Hash password for test users
  const defaultPassword = await bcrypt.hash('password123', 12);

  // Create admin user
  console.log('Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      employeeId: 1000,
      username: 'admin',
      email: 'admin@orbit-tracking.com',
      passwordHash: defaultPassword,
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      phoneNumber: '+1234567890',
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log('✅ Admin user created');

  // Create manager user
  console.log('Creating manager user...');
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      employeeId: 1001,
      username: 'manager',
      email: 'manager@orbit-tracking.com',
      passwordHash: defaultPassword,
      firstName: 'Manager',
      lastName: 'User',
      fullName: 'Manager User',
      phoneNumber: '+1234567891',
      roleId: managerRole.id,
      isActive: true,
    },
  });
  console.log('✅ Manager user created');

  // Create field users
  console.log('Creating field users...');
  const fieldUsers = await Promise.all([
    prisma.user.upsert({
      where: { username: 'john_doe' },
      update: {},
      create: {
        employeeId: 2001,
        username: 'john_doe',
        email: 'john.doe@orbit-tracking.com',
        passwordHash: defaultPassword,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        phoneNumber: '+1234567892',
        roleId: userRole.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'jane_smith' },
      update: {},
      create: {
        employeeId: 2002,
        username: 'jane_smith',
        email: 'jane.smith@orbit-tracking.com',
        passwordHash: defaultPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        phoneNumber: '+1234567893',
        roleId: userRole.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'mike_wilson' },
      update: {},
      create: {
        employeeId: 2003,
        username: 'mike_wilson',
        email: 'mike.wilson@orbit-tracking.com',
        passwordHash: defaultPassword,
        firstName: 'Mike',
        lastName: 'Wilson',
        fullName: 'Mike Wilson',
        phoneNumber: '+1234567894',
        roleId: userRole.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'sarah_jones' },
      update: {},
      create: {
        employeeId: 2004,
        username: 'sarah_jones',
        email: 'sarah.jones@orbit-tracking.com',
        passwordHash: defaultPassword,
        firstName: 'Sarah',
        lastName: 'Jones',
        fullName: 'Sarah Jones',
        phoneNumber: '+1234567895',
        roleId: userRole.id,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Field users created');

  // Create customers assigned to field users
  console.log('Creating customers...');
  const customers = await Promise.all([
    // John's customers
    prisma.customer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+15551234567',
        address: '123 Business Ave, New York, NY 10001',
        notes: 'Key account - monthly visits required',
        userId: fieldUsers[0].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Globex Industries',
        email: 'info@globex.com',
        phone: '+15552345678',
        address: '456 Industrial Blvd, Brooklyn, NY 11201',
        notes: 'New prospect - schedule demo',
        userId: fieldUsers[0].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Wayne Enterprises',
        email: 'bruce@wayne.com',
        phone: '+15553456789',
        address: '789 Gotham Dr, Manhattan, NY 10007',
        notes: 'VIP client - priority support',
        userId: fieldUsers[0].id,
        isActive: true,
      },
    }),

    // Jane's customers
    prisma.customer.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'Stark Industries',
        email: 'pepper@stark.com',
        phone: '+15554567890',
        address: '100 Stark Tower, New York, NY 10108',
        notes: 'Tech partner - quarterly reviews',
        userId: fieldUsers[1].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: 'Oscorp',
        email: 'norman@oscorp.com',
        phone: '+15555678901',
        address: '200 Oscorp Plaza, Queens, NY 11368',
        notes: 'Research collaboration',
        userId: fieldUsers[1].id,
        isActive: true,
      },
    }),

    // Mike's customers
    prisma.customer.upsert({
      where: { id: 6 },
      update: {},
      create: {
        name: 'Daily Bugle',
        email: 'jonah@bugle.com',
        phone: '+15556789012',
        address: '300 Press St, Manhattan, NY 10038',
        notes: 'Media partner - weekly deliveries',
        userId: fieldUsers[2].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 7 },
      update: {},
      create: {
        name: 'Roxxon Energy',
        email: 'contact@roxxon.com',
        phone: '+15557890123',
        address: '400 Energy Ave, Bronx, NY 10451',
        notes: 'Energy sector client',
        userId: fieldUsers[2].id,
        isActive: true,
      },
    }),

    // Sarah's customers
    prisma.customer.upsert({
      where: { id: 8 },
      update: {},
      create: {
        name: 'Pym Technologies',
        email: 'hank@pym.com',
        phone: '+15558901234',
        address: '500 Quantum Rd, Brooklyn, NY 11215',
        notes: 'R&D partner',
        userId: fieldUsers[3].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 9 },
      update: {},
      create: {
        name: 'Hammer Industries',
        email: 'justin@hammer.com',
        phone: '+15559012345',
        address: '600 Industrial Pkwy, Staten Island, NY 10301',
        notes: 'Manufacturing client',
        userId: fieldUsers[3].id,
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 10 },
      update: {},
      create: {
        name: 'Rand Enterprises',
        email: 'danny@rand.com',
        phone: '+15550123456',
        address: '700 Rand Bldg, Manhattan, NY 10013',
        notes: 'New account - onboarding phase',
        userId: fieldUsers[3].id,
        isActive: true,
      },
    }),
  ]);
  console.log('✅ Customers created');

  // Create sample location data for testing reports
  console.log('Creating sample location data...');
  const now = new Date();
  const locations = [];

  // Generate locations for each field user over the past 7 days
  for (const user of fieldUsers) {
    const userCustomers = customers.filter(c => c.userId === user.id);
    const baseLat = 40.7128 + (Math.random() - 0.5) * 0.1; // NYC area
    const baseLng = -74.0060 + (Math.random() - 0.5) * 0.1;

    for (let day = 6; day >= 0; day--) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - day);
      dayDate.setHours(8, 0, 0, 0); // Start at 8 AM

      // Generate 20-50 locations per day per user
      const locationsPerDay = Math.floor(Math.random() * 30) + 20;

      for (let i = 0; i < locationsPerDay; i++) {
        const timestamp = new Date(dayDate);
        timestamp.setMinutes(timestamp.getMinutes() + i * 15 + Math.floor(Math.random() * 15));

        // Simulate movement around base location
        const lat = baseLat + (Math.random() - 0.5) * 0.02;
        const lng = baseLng + (Math.random() - 0.5) * 0.02;

        // Assign to a random customer 30% of the time
        const customerId = Math.random() < 0.3 && userCustomers.length > 0
          ? userCustomers[Math.floor(Math.random() * userCustomers.length)].id
          : null;

        locations.push({
          userId: user.id,
          customerId,
          latitude: lat,
          longitude: lng,
          altitude: Math.floor(Math.random() * 100),
          accuracy: Math.random() * 20 + 5,
          speed: Math.random() * 5,
          heading: Math.random() * 360,
          timestamp,
          metadata: { source: 'mobile', battery: Math.floor(Math.random() * 100) },
        });
      }
    }
  }

  // Batch insert locations
  await prisma.location.createMany({
    data: locations,
    skipDuplicates: true,
  });
  console.log(`✅ Created ${locations.length} sample location records`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin:    admin / password123');
  console.log('Manager:  manager / password123');
  console.log('Field:    john_doe / password123');
  console.log('Field:    jane_smith / password123');
  console.log('Field:    mike_wilson / password123');
  console.log('Field:    sarah_jones / password123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });