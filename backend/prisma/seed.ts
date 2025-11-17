import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'admin',
      groupName: 'IT',
      team: 'Administration',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create interviewer user
  const interviewerPassword = await bcrypt.hash('User123!', 12);
  const interviewer = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: interviewerPassword,
      name: 'John Doe',
      role: 'interviewer',
      groupName: 'Engineering',
      team: 'Backend',
    },
  });
  console.log('Created interviewer user:', interviewer.email);

  // Create sample laptops
  const laptops = [
    {
      uniqueId: 'LAP-DEMO-001',
      serialNumber: 'SN123456789',
      make: 'Dell',
      model: 'Latitude 5420',
      status: 'available' as const,
    },
    {
      uniqueId: 'LAP-DEMO-002',
      serialNumber: 'SN987654321',
      make: 'HP',
      model: 'EliteBook 840 G8',
      status: 'available' as const,
    },
    {
      uniqueId: 'LAP-DEMO-003',
      serialNumber: 'SN456789123',
      make: 'Lenovo',
      model: 'ThinkPad X1 Carbon',
      status: 'maintenance' as const,
    },
  ];

  for (const laptopData of laptops) {
    const laptop = await prisma.laptop.upsert({
      where: { uniqueId: laptopData.uniqueId },
      update: {},
      create: laptopData,
    });
    console.log('Created laptop:', laptop.make, laptop.model);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
