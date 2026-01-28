import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = path.resolve(__dirname, 'mock-data/data.json');
const dbPath = path.resolve(__dirname, 'data.db');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const db = new Database(dbPath);

console.log('Migrating data to SQLite...');

const insertUser = db.prepare(`
  INSERT INTO users (id, provider, provider_user_id, email, display_name, created_at, last_login_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertToken = db.prepare(`
  INSERT INTO refresh_tokens (user_id, token, expires_at)
  VALUES (?, ?, ?)
`);

const insertProfile = db.prepare(`
  INSERT INTO profiles (id, user_id, birth_date, birth_time, gender, region, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLifeProfile = db.prepare(`
  INSERT INTO life_profiles (user_id, profile_id, energy_type, energy_type_emoji, strengths, patterns, cycle_description, recommendations, version, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertJob = db.prepare(`
  INSERT INTO jobs (id, user_id, profile_id, status, progress, options, result_ref, created_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertRecord = db.prepare(`
  INSERT INTO records (id, user_id, date, energy, emotion, focus, memo, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  data.users.forEach(user => {
    insertUser.run(user.id, user.provider, user.providerUserId, user.email, user.displayName, user.createdAt, user.lastLoginAt);
  });

  data.tokens.forEach(token => {
    insertToken.run(token.userId, token.token, token.expiresAt);
  });

  data.profiles.forEach(profile => {
    insertProfile.run(profile.profileId, profile.userId, profile.birthDate, profile.birthTime, profile.gender, profile.region, profile.createdAt, profile.updatedAt);
  });

  data.lifeProfiles.forEach(lp => {
    insertLifeProfile.run(
      lp.userId, 
      lp.profileId, 
      lp.energyType, 
      lp.energyTypeEmoji, 
      JSON.stringify(lp.strengths), 
      JSON.stringify(lp.patterns), 
      lp.cycleDescription, 
      JSON.stringify(lp.recommendations), 
      lp.version, 
      lp.createdAt, 
      lp.updatedAt
    );
  });

  data.jobs.forEach(job => {
    insertJob.run(job.jobId, job.userId, job.profileId, job.status, job.progress, JSON.stringify(job.options), job.resultRef, job.createdAt, job.completedAt);
  });

  data.records.forEach(record => {
    insertRecord.run(record.id, record.userId, record.date, record.energy, record.emotion, record.focus, record.memo, record.timestamp);
  });
})();

console.log('Migration completed!');
