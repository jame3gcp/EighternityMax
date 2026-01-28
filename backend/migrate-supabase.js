import 'dotenv/config';
import { db } from './src/models/db.js';
import { users, profiles, lifeProfiles, jobs, records, refreshTokens } from './src/models/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  const dataPath = path.resolve(__dirname, 'mock-data/data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('No SQLite mock data found to migrate.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log(`Starting migration of ${data.users.length} users to Supabase...`);

  try {
    for (const u of data.users) {
      await db.insert(users).values({
        id: u.id,
        provider: u.provider,
        providerUserId: u.providerUserId,
        email: u.email,
        displayName: u.displayName,
        createdAt: new Date(u.createdAt),
        lastLoginAt: new Date(u.lastLoginAt),
      }).onConflictDoNothing();
    }

    for (const p of data.profiles) {
      await db.insert(profiles).values({
        id: p.profileId,
        userId: p.userId,
        birthDate: p.birthDate,
        birthTime: p.birthTime,
        gender: p.gender,
        region: p.region,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }).onConflictDoNothing();
    }

    for (const lp of data.lifeProfiles) {
      await db.insert(lifeProfiles).values({
        userId: lp.userId,
        profileId: lp.profileId,
        energyType: lp.energyType,
        energyTypeEmoji: lp.energyTypeEmoji,
        strengths: lp.strengths,
        patterns: lp.patterns,
        cycleDescription: lp.cycleDescription,
        recommendations: lp.recommendations,
        version: lp.version,
        createdAt: new Date(lp.createdAt),
        updatedAt: new Date(lp.updatedAt),
      }).onConflictDoNothing();
    }

    for (const r of data.records) {
      await db.insert(records).values({
        id: r.id,
        userId: r.userId,
        date: r.date,
        energy: r.energy,
        emotion: r.emotion,
        focus: r.focus,
        memo: r.memo,
        timestamp: new Date(r.timestamp),
      }).onConflictDoNothing();
    }

    console.log('Migration to Supabase completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
