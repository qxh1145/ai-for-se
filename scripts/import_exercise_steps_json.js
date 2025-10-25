#!/usr/bin/env node
/*
  Import steps (JSON per exercise) into exercise_steps_json
  Input file: data/xwalk/xwalk_exercise_steps.import.json
  Structure: [{ slug, steps: [{ step_number, instruction_text, title?, media_url?, media_type? }, ...] }, ...]
*/
import fs from 'fs';
import path from 'path';
import { sequelize } from '../packages/backend/config/database.js';

const root = process.cwd();
const inPath = path.join(root, 'data/xwalk/xwalk_exercise_steps.import.json');

function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }

async function getExerciseIdBySlug(slug, t){
  const [rows] = await sequelize.query(
    'SELECT exercise_id FROM exercises WHERE slug = $1 LIMIT 1',
    { transaction: t, bind: [slug] }
  );
  return rows[0]?.exercise_id || null;
}

async function upsertStepsJson(exerciseId, steps, t){
  await sequelize.query(
    `INSERT INTO exercise_steps_json (exercise_id, steps, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (exercise_id) DO UPDATE SET steps = EXCLUDED.steps, updated_at = NOW()`,
    { transaction: t, bind: [exerciseId, JSON.stringify(steps)] }
  );
}

async function main(){
  if (!fs.existsSync(inPath)){
    console.error('Missing steps file at', inPath);
    process.exit(1);
  }
  const data = readJson(inPath);
  await sequelize.authenticate();
  console.log(`DB connected. Importing JSON steps for ${data.length} exercises...`);
  let ok = 0, miss = 0;
  for (const row of data){
    const t = await sequelize.transaction();
    try {
      const exId = await getExerciseIdBySlug(row.slug, t);
      if (!exId){
        console.warn('Skip unknown exercise slug:', row.slug);
        miss += 1;
        await t.rollback();
        continue;
      }
      await upsertStepsJson(exId, row.steps || [], t);
      await t.commit();
      ok += 1;
    } catch (e) {
      await t.rollback();
      console.error('Error for', row.slug, e.message);
      process.exitCode = 1;
    }
  }
  console.log(`Finished. Updated steps_json: ${ok}, skipped: ${miss}`);
  await sequelize.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

