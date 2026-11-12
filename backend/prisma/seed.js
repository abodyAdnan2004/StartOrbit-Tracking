// Database Seed Script
// Run with: npx prisma db seed
// Or: node prisma/seed.js

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for test users
  const defaultPassword = await bcrypt.hash('password123', 12);

  // Clean slate
  console.log('Cleaning database...');
  await prisma.refreshToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create roles
  console.log('Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@orbit.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'User',
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    }
  });
  console.log('✅ Admin user created');

  console.log('Creating viewer user...');
  const viewer = await prisma.user.create({
    data: {
      username: 'viewer',
      email: 'viewer@orbit.com',
      passwordHash: await bcrypt.hash('viewer123', 12),
      firstName: 'Viewer',
      lastName: 'User',
      fullName: 'Viewer User',
      role: 'viewer',
      isActive: true,
    }
  });
  console.log('✅ Viewer user created');

  console.log('Creating field users...');
  const user1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      email: 'john.doe@orbit-tracking.com',
      passwordHash: defaultPassword,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'user',
      isActive: true,
    }
  });
  console.log('✅ Field users created');

  // Sample customers
  console.log('Creating sample customers...');
  await prisma.customer.createMany({
    data: [
      {
        name: 'Customer A',
        email: 'a@test.com',
        phone: '123',
        userId: user1.id,
        status: 'pending',
        statusTimestamps: JSON.stringify({ pending: new Date().toISOString() })
      },
      {
        name: 'Customer B',
        email: 'b@test.com',
        phone: '456',
        userId: user1.id,
        status: 'approved',
        statusTimestamps: JSON.stringify({ pending: new Date().toISOString(), approved: new Date().toISOString() })
      },
    ]
  });
  console.log('✅ Customers created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('Admin:    admin / admin123');
  console.log('Viewer:   viewer / viewer123');
  console.log('Field:    john_doe / password123');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });