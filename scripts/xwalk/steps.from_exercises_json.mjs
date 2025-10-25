#!/usr/bin/env node
/*
  Build data/xwalk/xwalk_exercise_steps.import.json from data/exercises.json
  - Input schema sample:
    [{ name, instructions: ["Step:1 ...", ...] }, ...]
  - Output schema per docs/xwalk_jefit.md
*/
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const inPath = path.join(root, 'data/exercises.json');
const outPath = path.join(root, 'data/xwalk/xwalk_exercise_steps.import.json');

function readJson(p){ return JSON.parse(fs.readFileSync(p, 'utf8')); }
function writeJson(p, obj){ fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8'); }

function toSlug(str = ''){
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-');
}

function cleanStepText(s = ''){
  let t = String(s).trim();
  // Remove common prefixes like "Step:1", "Step 1:", "1.", "- "
  t = t.replace(/^step\s*:?\s*\d+\s*[:-]?\s*/i, '');
  t = t.replace(/^\d+\s*[\.)\-:]\s*/, '');
  t = t.replace(/^[-•]\s*/, '');
  return t.trim();
}

function stepsFromInstructions(instructions){
  if (Array.isArray(instructions)){
    return instructions.map((line, idx) => ({ step_number: idx + 1, instruction_text: cleanStepText(line) }))
      .filter(s => s.instruction_text.length > 0);
  }
  // If it's a single string blob, split into lines/numbered items
  const txt = String(instructions || '').replace(/\r\n/g, '\n');
  const parts = txt.split(/\n\s*\n|\n|(?=\b\d+\s*[\.)]\s*)/).map(s => s.trim()).filter(Boolean);
  return parts.map((p, i) => ({ step_number: i + 1, instruction_text: cleanStepText(p) }))
    .filter(s => s.instruction_text.length > 0);
}

function main(){
  if (!fs.existsSync(inPath)){
    console.error('Missing input', inPath);
    process.exit(1);
  }
  const rows = readJson(inPath);
  const out = [];
  for (const r of rows){
    const slug = r.slug || toSlug(r.name || r.name_en || r.exerciseName || '');
    if (!slug){
      console.warn('Skip row without name/slug');
      continue;
    }
    const steps = stepsFromInstructions(r.instructions || r.instruction || r.steps || []);
    if (!steps.length){
      continue;
    }
    out.push({ slug, steps });
  }
  writeJson(outPath, out);
  console.log(`Wrote steps for ${out.length} exercises -> ${outPath}`);
}

main();

