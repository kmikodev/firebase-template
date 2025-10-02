/**
 * Seed Script - Populate Firestore with sample data
 *
 * Run with: npx tsx scripts/seed.ts
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../.firebase/serviceAccountKey.json'), 'utf8')
);

// Initialize Firebase Admin
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'comprakitsupervivencia',
  });
}

const db = admin.firestore();

async function seed() {
  console.log('🌱 Starting seed process...\n');

  try {
    // ========================================
    // 1. Create Franchise: San Jorge
    // ========================================
    console.log('📍 Creating franchise: San Jorge...');

    const franchiseRef = db.collection('franchises').doc();
    const franchiseId = franchiseRef.id;

    await franchiseRef.set({
      franchiseId,
      name: 'San Jorge',
      ownerUserId: 'c2developers-uid', // Replace with actual super admin UID
      logo: 'https://via.placeholder.com/200x200?text=San+Jorge',
      description: 'Franquicia de peluquerías San Jorge - Calidad y servicio profesional',
      website: 'https://sanjorge-peluquerias.com',
      email: 'info@sanjorge-peluquerias.com',
      phone: '+34 912 345 678',
      planTier: 'premium',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Franchise created: ${franchiseId}\n`);

    // ========================================
    // 2. Create Branch: Monkey Peluquería
    // ========================================
    console.log('🏢 Creating branch: Monkey Peluquería...');

    const branchRef = db.collection('branches').doc();
    const branchId = branchRef.id;

    await branchRef.set({
      branchId,
      franchiseId,
      name: 'Monkey Peluquería',
      address: 'Calle Mayor 123',
      city: 'Madrid',
      postalCode: '28001',
      province: 'Madrid',
      country: 'España',
      phone: '+34 912 345 679',
      email: 'monkey@sanjorge-peluquerias.com',
      photo: 'https://via.placeholder.com/400x300?text=Monkey+Peluqueria',
      location: {
        latitude: 40.4168,
        longitude: -3.7038,
      },
      schedule: {
        monday: { isOpen: true, open: '09:00', close: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        tuesday: { isOpen: true, open: '09:00', close: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        wednesday: { isOpen: true, open: '09:00', close: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        thursday: { isOpen: true, open: '09:00', close: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        friday: { isOpen: true, open: '09:00', close: '21:00', breakStart: '14:00', breakEnd: '16:00' },
        saturday: { isOpen: true, open: '10:00', close: '19:00' },
        sunday: { isOpen: false },
      },
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Branch created: ${branchId}\n`);

    // ========================================
    // 3. Create Barbers
    // ========================================
    console.log('💈 Creating barbers...');

    // Barber 1: Monkey
    const barber1Ref = db.collection('barbers').doc();
    const barber1Id = barber1Ref.id;

    await barber1Ref.set({
      barberId: barber1Id,
      userId: 'monkey-user-id', // Placeholder
      franchiseId,
      branchId,
      displayName: 'Monkey',
      photoURL: 'https://ui-avatars.com/api/?name=Monkey&background=random&size=200',
      specialties: ['Corte clásico', 'Fade', 'Afeitado tradicional', 'Diseño de barba'],
      bio: 'Barbero profesional con 8 años de experiencia. Especialista en cortes modernos y clásicos.',
      schedule: {
        monday: { isWorking: true, workStart: '09:00', workEnd: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        tuesday: { isWorking: true, workStart: '09:00', workEnd: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        wednesday: { isWorking: true, workStart: '09:00', workEnd: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        thursday: { isWorking: true, workStart: '09:00', workEnd: '20:00', breakStart: '14:00', breakEnd: '16:00' },
        friday: { isWorking: true, workStart: '09:00', workEnd: '21:00', breakStart: '14:00', breakEnd: '16:00' },
        saturday: { isWorking: true, workStart: '10:00', workEnd: '19:00' },
        sunday: { isWorking: false },
      },
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Barber created: Monkey (${barber1Id})`);

    // Barber 2: Andrés
    const barber2Ref = db.collection('barbers').doc();
    const barber2Id = barber2Ref.id;

    await barber2Ref.set({
      barberId: barber2Id,
      userId: 'andres-user-id', // Placeholder
      franchiseId,
      branchId,
      displayName: 'Andrés',
      photoURL: 'https://ui-avatars.com/api/?name=Andres&background=random&size=200',
      specialties: ['Corte moderno', 'Degradado', 'Coloración', 'Tratamientos capilares'],
      bio: 'Estilista creativo con pasión por los cortes modernos y las últimas tendencias.',
      schedule: {
        monday: { isWorking: true, workStart: '10:00', workEnd: '19:00', breakStart: '14:00', breakEnd: '15:30' },
        tuesday: { isWorking: true, workStart: '10:00', workEnd: '19:00', breakStart: '14:00', breakEnd: '15:30' },
        wednesday: { isWorking: true, workStart: '10:00', workEnd: '19:00', breakStart: '14:00', breakEnd: '15:30' },
        thursday: { isWorking: true, workStart: '10:00', workEnd: '19:00', breakStart: '14:00', breakEnd: '15:30' },
        friday: { isWorking: true, workStart: '10:00', workEnd: '20:00', breakStart: '14:00', breakEnd: '15:30' },
        saturday: { isWorking: true, workStart: '10:00', workEnd: '19:00' },
        sunday: { isWorking: false },
      },
      isActive: true,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Barber created: Andrés (${barber2Id})\n`);

    // ========================================
    // 4. Create Services
    // ========================================
    console.log('✂️ Creating services...');

    const services = [
      {
        name: 'Corte de Pelo Clásico',
        description: 'Corte tradicional de caballero con tijeras y máquina',
        duration: 30,
        price: 1500, // 15.00 EUR
        category: 'haircut',
      },
      {
        name: 'Corte + Barba',
        description: 'Corte de pelo y arreglo completo de barba',
        duration: 45,
        price: 2000, // 20.00 EUR
        category: 'haircut',
      },
      {
        name: 'Fade Profesional',
        description: 'Degradado profesional con acabado perfecto',
        duration: 40,
        price: 1800, // 18.00 EUR
        category: 'haircut',
      },
      {
        name: 'Afeitado Tradicional',
        description: 'Afeitado tradicional con navaja y toallas calientes',
        duration: 30,
        price: 1200, // 12.00 EUR
        category: 'shave',
      },
      {
        name: 'Diseño de Barba',
        description: 'Diseño y perfilado profesional de barba',
        duration: 25,
        price: 1000, // 10.00 EUR
        category: 'beard',
      },
      {
        name: 'Tinte Completo',
        description: 'Coloración completa del cabello',
        duration: 90,
        price: 3500, // 35.00 EUR
        category: 'coloring',
      },
      {
        name: 'Tratamiento Capilar',
        description: 'Tratamiento revitalizante para el cabello',
        duration: 45,
        price: 2500, // 25.00 EUR
        category: 'treatment',
      },
    ];

    for (const serviceData of services) {
      const serviceRef = db.collection('services').doc();
      const serviceId = serviceRef.id;

      await serviceRef.set({
        serviceId,
        franchiseId,
        ...serviceData,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Service created: ${serviceData.name} (${serviceId})`);
    }

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - 1 Franchise: San Jorge (${franchiseId})`);
    console.log(`   - 1 Branch: Monkey Peluquería (${branchId})`);
    console.log(`   - 2 Barbers: Monkey, Andrés`);
    console.log(`   - ${services.length} Services\n`);

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => {
    console.log('✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
