#!/usr/bin/env node
/*
  Import data/xwalk/xwalk_exercise.import.json into DB.
  - Requires DB schema + muscle_groups seed migrations to be applied.
  - Upserts exercises by slug; replaces muscle links (primary/secondary).
  - Options:
      --dry       Dry-run (no writes), print summary
      --limit N   Only import first N entries
*/

import fs from 'fs';
import path from 'path';
import process from 'process';

// Use backend's Sequelize config/connection (loads backend/.env)
import { sequelize } from '../packages/backend/config/database.js';

const root = process.cwd();
const importPath = path.join(root, 'data/xwalk/xwalk_exercise.import.json');

function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }

async function upsertExercise(client, row, t) {
  const fields = [
    'slug','name','name_en','description','gif_demo_url','primary_video_url','thumbnail_url','equipment_needed','popularity_score'
  ];
  const values = fields.map(f => row[f] ?? null);

  const placeholders = fields.map((_, i) => `$${i+1}`).join(',');
  const updates = [
    'name = EXCLUDED.name',
    'name_en = EXCLUDED.name_en',
    'description = EXCLUDED.description',
    'gif_demo_url = EXCLUDED.gif_demo_url',
    'primary_video_url = EXCLUDED.primary_video_url',
    'thumbnail_url = EXCLUDED.thumbnail_url',
    'equipment_needed = EXCLUDED.equipment_needed',
    'popularity_score = COALESCE(EXCLUDED.popularity_score, exercises.popularity_score)',
    'updated_at = NOW()'
  ].join(',');

  const sql = `
    INSERT INTO exercises (slug, name, name_en, description, gif_demo_url, primary_video_url, thumbnail_url, equipment_needed, popularity_score, created_at, updated_at)
    VALUES (${placeholders}, NOW(), NOW())
    ON CONFLICT (slug) DO UPDATE SET ${updates}
    RETURNING exercise_id;
  `;
  const [res] = await client.query(sql, { transaction: t, bind: values });
  return res[0]?.exercise_id;
}

async function upsertBasicImages(client, exerciseId, row, t) {
  // Insert thumbnail as cover (primary), gif as gif (secondary)
  const thumb = row.thumbnail_url || null;
  const gif = row.gif_demo_url || null;
  // Clean previous basic images so this importer stays idempotent
  await client.query(
    `DELETE FROM image_exercise 
     WHERE exercise_id = $1 AND image_type IN ('cover','gif','thumbnail')`,
    { transaction: t, bind: [exerciseId] }
  );
  if (thumb) {
    await client.query(
      `INSERT INTO image_exercise (exercise_id, image_url, image_type, alt_text, display_order, is_primary, created_at, updated_at)
       VALUES ($1, $2, 'cover', NULL, 0, TRUE, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      { transaction: t, bind: [exerciseId, thumb] }
    );
  }
  if (gif) {
    await client.query(
      `INSERT INTO image_exercise (exercise_id, image_url, image_type, alt_text, display_order, is_primary, created_at, updated_at)
       VALUES ($1, $2, 'gif', NULL, 1, FALSE, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      { transaction: t, bind: [exerciseId, gif] }
    );
  }
}

async function getMuscleIdBySlug(client, slug, cache, t) {
  if (cache.has(slug)) return cache.get(slug);
  const [rows] = await client.query(
    'SELECT muscle_group_id FROM muscle_groups WHERE slug = $1',
    { transaction: t, bind: [slug] }
  );
  const id = rows[0]?.muscle_group_id || null;
  cache.set(slug, id);
  return id;
}

async function replaceMuscles(client, exerciseId, targets, secondaries, t) {
  // Remove old links
  await client.query('DELETE FROM exercise_muscle_group WHERE exercise_id = $1', { transaction: t, bind: [exerciseId] });

  const cache = new Map();
  const insertOne = async (slug, impact) => {
    const mgId = await getMuscleIdBySlug(client, slug, cache, t);
    if (!mgId) return 0;
    await client.query(
      `INSERT INTO exercise_muscle_group (exercise_id, muscle_group_id, impact_level, created_at)
       VALUES ($1, $2, $3, NOW())`,
      { transaction: t, bind: [exerciseId, mgId, impact] }
    );
    return 1;
  };

  let count = 0;
  for (const s of targets || []) count += await insertOne(s, 'primary');
  for (const s of (secondaries || []).filter(s => !(targets||[]).includes(s))) count += await insertOne(s, 'secondary');
  return count;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx+1] || '0', 10) : 0;

  if (!fs.existsSync(importPath)) {
    console.error(`Missing file: ${importPath}`);
    process.exit(1);
  }

  const list = readJson(importPath);
  const data = limit > 0 ? list.slice(0, limit) : list;

  await sequelize.authenticate();
  console.log(`DB connected. Importing ${data.length} exercises${dry ? ' (dry-run)' : ''}...`);

  let totalInserted = 0;
  let totalLinked = 0;
  let idx = 0;
  for (const row of data) {
    idx += 1;
    const t = await sequelize.transaction();
    try {
      if (dry) {
        console.log(`[${idx}/${data.length}] slug=${row.slug} (targets=${(row.target_muscle_slugs||[]).length}, secondary=${(row.secondary_muscle_slugs||[]).length})`);
        await t.rollback();
        continue;
      }

      const exId = await upsertExercise(sequelize, row, t);
      const linked = await replaceMuscles(sequelize, exId, row.target_muscle_slugs, row.secondary_muscle_slugs, t);
      await upsertBasicImages(sequelize, exId, row, t);
      await t.commit();
      totalInserted += 1;
      totalLinked += linked;
      if (idx % 50 === 0) console.log(`...${idx} done`);
    } catch (err) {
      await t.rollback();
      console.error(`Error at slug=${row.slug}:`, err.message);
      process.exitCode = 1;
    }
  }

  console.log(`Finished. Exercises upserted: ${totalInserted}, links written: ${totalLinked}`);
  await sequelize.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
