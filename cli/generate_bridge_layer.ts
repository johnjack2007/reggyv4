// File: cli/generate-bridge-layer.ts

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const faTagsPath = path.resolve(__dirname, '../data/fa_specific_tags_reference.txt'); // one tag per line
const outputPath = path.resolve(__dirname, '../data/bridge_layer_tags.json');

async function generateBridgeEntry(tag: string) {
  const prompt = `
You are a financial aid policy expert. For the tag "${tag}", generate:

1. 1–3 short but useful follow-up questions that a staff member might ask a student to clarify their situation.
2. 1 recommended staff action (what the aid office should do next).

Be concise and accurate. Respond in this JSON format:

{
  "follow_ups": ["...", "..."],
  "recommended_action": "..."
}
`.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.2,
    messages: [
      { role: 'system', content: 'You are a compliance-focused financial aid rules expert.' },
      { role: 'user', content: prompt }
    ]
  });

  try {
    const parsed = JSON.parse(response.choices[0].message?.content || '{}');
    return parsed;
  } catch (err) {
    console.error(`❌ Failed to parse response for tag: ${tag}`);
    return null;
  }
}

(async () => {
  const tags = fs.readFileSync(faTagsPath, 'utf-8').split('\n').map(t => t.trim()).filter(Boolean);

  const bridgeTags: Record<string, any> = {};

  for (const tag of tags) {
    console.log(`🔍 Generating bridge layer for: ${tag}`);
    const entry = await generateBridgeEntry(tag);
    if (entry) {
      bridgeTags[tag] = entry;
    }
    await new Promise(r => setTimeout(r, 1500)); // rate limit safety
  }

  fs.writeFileSync(outputPath, JSON.stringify(bridgeTags, null, 2));
  console.log(`✅ Saved to ${outputPath}`);
})();
