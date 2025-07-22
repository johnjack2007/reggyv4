import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import supabase from './lib/supabase';

dotenv.config({ path: '.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function embedAllFiles(folder: string) {
  const files = fs.readdirSync(folder).filter(f => f.endsWith('_tagged.json'));

  for (const file of files) {
    const filePath = path.join(folder, file);
    const chunks = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`📦 Embedding from: ${file}`);

    for (const chunk of chunks) {
      const content = chunk.text;
      const metadata = {
        ...chunk.metadata,
        chunk_id: chunk.chunk_id,
        source_page: chunk.source_page,
        source_file: file
      };

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: content,
        });

        const embedding = response.data[0].embedding;

        const { error } = await supabase.from('documents').insert([
          { content, embedding, metadata }
        ]);

        if (error) {
          console.error(`❌ Supabase insert failed for chunk ${chunk.chunk_id}`, error);
        } else {
          console.log(`✅ Inserted chunk ${chunk.chunk_id}`);
        }
      } catch (err: any) {
        console.error(`❌ Error with chunk ${chunk.chunk_id}:`, err.message || err);
      }

      await new Promise(r => setTimeout(r, 400)); // avoid rate limits
    }
  }

  console.log(`🎯 All files embedded and inserted.`);
}

embedAllFiles('data/tagged');
