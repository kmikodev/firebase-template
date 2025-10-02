/**
 * Seed test data for queue system testing
 * Run with: npx tsx scripts/seed-queue-test-data.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { connectFirestoreEmulator } from 'firebase/firestore';

// Firebase config for emulator
const firebaseConfig = {
  projectId: 'comprakitsupervivencia',
  apiKey: 'fake-api-key',
  authDomain: 'localhost',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
connectFirestoreEmulator(db, '127.0.0.1', 8080);

async function seedData() {
  console.log('🌱 Seeding test data for queue system...\n');

  // Create test franchise
  const franchiseId = 'franchise1';
  await setDoc(doc(db, 'franchises', franchiseId), {
    franchiseId,
    name: 'Barbershop Test',
    adminEmail: 'admin@test.com',
    isActive: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  console.log('✅ Created franchise:', franchiseId);

  // Create test branches
  const branches = [
    {
      branchId: 'branch1',
      franchiseId,
      name: 'Centro',
      address: 'Calle Principal 123',
      city: 'Madrid',
      phone: '+34 123 456 789',
      isActive: true,
      maxQueueSize: 50,
      averageServiceTime: 30, // minutes
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      branchId: 'branch2',
      franchiseId,
      name: 'Norte',
      address: 'Avenida del Norte 456',
      city: 'Madrid',
      phone: '+34 987 654 321',
      isActive: true,
      maxQueueSize: 30,
      averageServiceTime: 25,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  for (const branch of branches) {
    await setDoc(doc(db, 'branches', branch.branchId), branch);
    console.log('✅ Created branch:', branch.branchId, '-', branch.name);
  }

  // Create test users
  const users = [
    {
      userId: 'user1',
      email: 'user1@test.com',
      displayName: 'Juan Pérez',
      role: 'client',
      phoneNumber: '+34 611 222 333',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      userId: 'barber1',
      email: 'barber1@test.com',
      displayName: 'Carlos Barbero',
      role: 'barber',
      branchId: 'branch1',
      isAvailable: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  for (const user of users) {
    await setDoc(doc(db, 'users', user.userId), user);
    console.log('✅ Created user:', user.userId, '-', user.displayName);
  }

  // Create test services
  const services = [
    {
      serviceId: 'service1',
      franchiseId,
      name: 'Corte de Pelo',
      description: 'Corte básico de pelo',
      price: 1500, // cents
      duration: 30, // minutes
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      serviceId: 'service2',
      franchiseId,
      name: 'Corte + Barba',
      description: 'Corte de pelo y arreglo de barba',
      price: 2500,
      duration: 45,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];

  for (const service of services) {
    await setDoc(doc(db, 'services', service.serviceId), service);
    console.log('✅ Created service:', service.serviceId, '-', service.name);
  }

  console.log('\n✅ Test data seeded successfully!');
  console.log('\nYou can now:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Navigate to /client-queue to take a ticket');
  console.log('3. Navigate to /barber-queue to manage the queue');
  console.log('4. View Firestore data: http://127.0.0.1:4000/firestore\n');
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  });
