#!/usr/bin/env node
/*
  Compute a 3-level popularity_score for each exercise in
  data/xwalk/xwalk_exercise.normalized.json and write back to the same file.

  Heuristic (offline, reproducible):
  - Build frequency of slug tokens across all exercises
  - Build frequency of equipment_keys and bodyparts_keys
  - For each exercise, compute a composite popularity index:
      index = 0.5 * tokenScore + 0.3 * equipmentScore + 0.2 * bodypartScore
    where each component is min-max normalized to [0,1]
  - Map index into tertiles: bottom 1/3 -> 1, middle -> 2, top -> 3

  Notes:
  - No network calls. Uses existing dataset statistics as a proxy for web popularity.
  - Safe to re-run; preserves all other fields.
*/

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const filePath = path.join(root, 'data/xwalk/xwalk_exercise.normalized.json');

function readJson(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

function tokenizeSlug(s) {
  if (!s) return [];
  return String(s)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function buildFreqMap(arrays) {
  const map = new Map();
  for (const arr of arrays) {
    for (const k of arr || []) {
      map.set(k, (map.get(k) || 0) + 1);
    }
  }
  return map;
}

function normalizeValue(x, min, max) {
  if (!isFinite(x)) return 0;
  if (max <= min) return 0; // degenerate
  return (x - min) / (max - min);
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

function main() {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const data = readJson(filePath);

  // Build token frequencies from slug + name_en (fallback)
  const allTokens = [];
  const tokenizedByIndex = [];
  for (const item of data) {
    const tokens = tokenizeSlug(item.slug || item.name_en || item.name);
    tokenizedByIndex.push(tokens);
    allTokens.push(...tokens);
  }
  const tokenFreq = new Map();
  for (const t of allTokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);

  // Build equipment and bodypart frequencies
  const equipmentArrays = data.map((d) => Array.isArray(d.equipment_keys) ? d.equipment_keys : []);
  const bodypartArrays = data.map((d) => Array.isArray(d.bodyparts_keys) ? d.bodyparts_keys : []);
  const equipFreq = buildFreqMap(equipmentArrays);
  const bodypartFreq = buildFreqMap(bodypartArrays);

  const equipValues = Array.from(equipFreq.values());
  const equipMin = Math.min(...equipValues, 0);
  const equipMax = Math.max(...equipValues, 1);
  const bodyValues = Array.from(bodypartFreq.values());
  const bodyMin = Math.min(...bodyValues, 0);
  const bodyMax = Math.max(...bodyValues, 1);

  // Compute composite index per exercise
  const indices = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const tokens = tokenizedByIndex[i];

    // Token score: average frequency over tokens (0 if none)
    let tokenScoreRaw = 0;
    if (tokens.length) {
      const sum = tokens.reduce((acc, t) => acc + (tokenFreq.get(t) || 0), 0);
      tokenScoreRaw = sum / tokens.length;
    }
    // Normalize tokenScore over observed min/max
    // Compute on the fly: collect later then normalize
    indices.push({ i, tokenScoreRaw, equip: item.equipment_keys || [], bodies: item.bodyparts_keys || [] });
  }

  // Determine tokenScore normalization bounds
  const tokenRawValues = indices.map((x) => x.tokenScoreRaw);
  const tokenMin = Math.min(...tokenRawValues, 0);
  const tokenMax = Math.max(...tokenRawValues, 1);

  // Build final index values
  const final = [];
  for (const x of indices) {
    const equipScoreRaw = (x.equip || []).reduce((acc, e) => acc + (equipFreq.get(e) || 0), 0) / Math.max(1, (x.equip || []).length);
    const bodyScoreRaw = (x.bodies || []).reduce((acc, b) => acc + (bodypartFreq.get(b) || 0), 0) / Math.max(1, (x.bodies || []).length);

    const tokenScore = normalizeValue(x.tokenScoreRaw, tokenMin, tokenMax);
    const equipScore = normalizeValue(equipScoreRaw, equipMin, equipMax);
    const bodyScore = normalizeValue(bodyScoreRaw, bodyMin, bodyMax);

    const index = 0.5 * tokenScore + 0.3 * equipScore + 0.2 * bodyScore;
    final.push({ idx: x.i, index });
  }

  // Compute tertile thresholds
  const sorted = final.map(f => f.index).slice().sort((a,b) => a - b);
  const t33 = percentile(sorted, 0.33);
  const t66 = percentile(sorted, 0.66);

  // Assign popularity_score 1..3
  for (const f of final) {
    const val = f.index;
    let score = 2;
    if (val <= t33) score = 1;
    else if (val > t66) score = 3;
    data[f.idx].popularity_score = score;
  }

  writeJson(filePath, data);
  console.log(`Updated ${data.length} exercises with popularity_score (1..3).`);
}

main();

