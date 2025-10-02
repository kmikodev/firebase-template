/**
 * Cleanup Script - Remove old incorrect seed data
 *
 * Run with: npx tsx scripts/cleanup-old-data.ts
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

async function cleanup() {
  console.log('🧹 Starting cleanup process...\n');

  try {
    // Find the old "San Jorge" franchise
    const franchisesSnapshot = await db.collection('franchises')
      .where('name', '==', 'San Jorge')
      .get();

    if (franchisesSnapshot.empty) {
      console.log('✅ No old "San Jorge" franchise found. Database is clean.\n');
      return;
    }

    for (const franchiseDoc of franchisesSnapshot.docs) {
      const franchiseId = franchiseDoc.id;
      console.log(`🗑️  Found old franchise: San Jorge (${franchiseId})`);

      // Delete all related services
      const servicesSnapshot = await db.collection('services')
        .where('franchiseId', '==', franchiseId)
        .get();

      console.log(`   - Deleting ${servicesSnapshot.size} services...`);
      for (const doc of servicesSnapshot.docs) {
        await doc.ref.delete();
      }

      // Delete all related barbers
      const barbersSnapshot = await db.collection('barbers')
        .where('franchiseId', '==', franchiseId)
        .get();

      console.log(`   - Deleting ${barbersSnapshot.size} barbers...`);
      for (const doc of barbersSnapshot.docs) {
        await doc.ref.delete();
      }

      // Delete all related branches
      const branchesSnapshot = await db.collection('branches')
        .where('franchiseId', '==', franchiseId)
        .get();

      console.log(`   - Deleting ${branchesSnapshot.size} branches...`);
      for (const doc of branchesSnapshot.docs) {
        await doc.ref.delete();
      }

      // Delete all related queue tickets
      const queuesSnapshot = await db.collection('queues')
        .where('franchiseId', '==', franchiseId)
        .get();

      console.log(`   - Deleting ${queuesSnapshot.size} queue tickets...`);
      for (const doc of queuesSnapshot.docs) {
        await doc.ref.delete();
      }

      // Finally, delete the franchise
      await franchiseDoc.ref.delete();
      console.log(`   - Deleted franchise: ${franchiseId}\n`);
    }

    console.log('🎉 Cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanup()
  .then(() => {
    console.log('✅ Cleanup script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
