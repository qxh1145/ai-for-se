#!/usr/bin/env node
/*
  Validate and prepare xwalk_exercise.normalized.json for DB import.
  - Reads: data/xwalk/xwalk_exercise.normalized.json
  - Verifies: all *_muscle_slugs are canonical per DB taxonomy
  - Writes: data/xwalk/xwalk_exercise.import.json (flattened for importer)
*/

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const normalizedPath = path.join(root, 'data/xwalk/xwalk_exercise.normalized.json');
const outPath = path.join(root, 'data/xwalk/xwalk_exercise.import.json');

// Canonical slugs present in DB (from seed migrations)
const CANONICAL = new Set([
  'upper-chest','mid-chest','lower-chest',
  'latissimus-dorsi','trapezius','rhomboids','erector-spinae','teres-major',
  'anterior-deltoid','lateral-deltoid','posterior-deltoid','rotator-cuff','serratus-anterior',
  'biceps-brachii','brachialis','brachioradialis','triceps-brachii','wrist-flexors','wrist-extensors',
  'rectus-abdominis','obliques','transversus-abdominis',
  'quadriceps','hamstrings','gluteus-maximus','gluteus-medius','gluteus-minimus','hip-adductors','hip-flexors','gastrocnemius','soleus','tibialis-anterior'
]);

function loadJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }

function validateSlugList(label, slugs, warn) {
  const out = [];
  for (const s of slugs || []) {
    if (CANONICAL.has(s)) {
      if (!out.includes(s)) out.push(s);
    } else {
      warn(`${label}: unknown slug '${s}'`);
    }
  }
  return out;
}

function firstOrNull(arr) { return Array.isArray(arr) && arr.length ? arr[0] : null; }

function main() {
  const data = loadJson(normalizedPath);
  const warnings = [];
  const warn = (msg) => warnings.push(msg);

  const rows = [];
  for (const item of data) {
    if (!item.slug) { warn('missing slug'); continue; }

    const target = validateSlugList('target', item.target_muscle_slugs, warn);
    const secondary = validateSlugList('secondary', item.secondary_muscle_slugs, warn)
      .filter((s) => !target.includes(s));

    rows.push({
      slug: item.slug,
      name: item.name ?? null,
      name_en: item.name_en ?? null,
      description: item.description ?? null,
      gif_demo_url: item.gif_url ?? null,
      primary_video_url: item.primary_video_url ?? null,
      thumbnail_url: item.thumbnail_url ?? null,
      equipment_needed: firstOrNull(item.equipment_keys),
      bodyparts_keys: Array.isArray(item.bodyparts_keys) ? item.bodyparts_keys : [],
      target_muscle_slugs: target,
      secondary_muscle_slugs: secondary,
      popularity_score: typeof item.popularity_score === 'number' ? item.popularity_score : null
    });
  }

  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  console.log(`Prepared ${rows.length} rows for import -> ${outPath}`);
  if (warnings.length) {
    console.warn(`Warnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 200)) console.warn('  -', w);
    if (warnings.length > 200) console.warn(`  ...and ${warnings.length - 200} more`);
  }
}

main();
