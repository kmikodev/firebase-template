/**
 * Seed test data for queue system testing using Admin SDK
 * Run with: npx tsx scripts/seed-queue-test-data-admin.ts
 */

import * as admin from 'firebase-admin';

// Initialize Admin SDK for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'comprakitsupervivencia',
});

const db = admin.firestore();

async function seedData() {
  console.log('🌱 Seeding test data for queue system...\n');

  // Create test franchise
  const franchiseId = 'franchise1';
  await db.collection('franchises').doc(franchiseId).set({
    franchiseId,
    name: 'Barbershop Test',
    adminEmail: 'admin@test.com',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const branch of branches) {
    await db.collection('branches').doc(branch.branchId).set(branch);
    console.log('✅ Created branch:', branch.branchId, '-', branch.name);
  }

  // Create test users (with auth)
  const users = [
    {
      userId: 'user1',
      email: 'user1@test.com',
      password: 'password123',
      displayName: 'Juan Pérez',
      role: 'client',
      phoneNumber: '+34 611 222 333',
    },
    {
      userId: 'barber1',
      email: 'barber1@test.com',
      password: 'password123',
      displayName: 'Carlos Barbero',
      role: 'barber',
      branchId: 'branch1',
      isAvailable: true,
    },
  ];

  for (const user of users) {
    // Create auth user
    try {
      await admin.auth().createUser({
        uid: user.userId,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
      console.log('✅ Created auth user:', user.userId);
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists') {
        console.log('ℹ️  Auth user already exists:', user.userId);
      } else {
        throw error;
      }
    }

    // Create Firestore user document
    const { password, ...userData } = user;
    await db.collection('users').doc(user.userId).set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Created user document:', user.userId, '-', user.displayName);

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(user.userId, {
      role: user.role,
      franchiseId: franchiseId,
    });
    console.log('✅ Set custom claims for:', user.userId);
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      serviceId: 'service2',
      franchiseId,
      name: 'Corte + Barba',
      description: 'Corte de pelo y arreglo de barba',
      price: 2500,
      duration: 45,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const service of services) {
    await db.collection('services').doc(service.serviceId).set(service);
    console.log('✅ Created service:', service.serviceId, '-', service.name);
  }

  console.log('\n✅ Test data seeded successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('   Client: user1@test.com / password123');
  console.log('   Barber: barber1@test.com / password123');
  console.log('\nYou can now:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Login with test credentials');
  console.log('3. Navigate to /client-queue to take a ticket');
  console.log('4. Navigate to /barber-queue to manage the queue');
  console.log('5. View Firestore data: http://127.0.0.1:4000/firestore\n');
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  });
