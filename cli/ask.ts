// File: cli/ask.ts
import { classifyTags, getEmbedding, retrieveChunks, synthesizeAnswer } from './lib/core';
import { logInquiry } from './lib/log';
import supabase from './lib/supabase';

export async function runAsk(query: string) {
  console.log(`\n🔍 Classifying initial question...`);
  const tags = await classifyTags(query);
  const primaryTag = tags[0];
  await logInquiry(query, tags);
  console.log(`🔖 Tags: ${tags.join(', ') || '[none]'}`);

  const embedding = await getEmbedding(query);
  const chunks = await retrieveChunks(embedding, primaryTag);

  // Fetch bridge info from Supabase
  let bridgeInfo = null;
  if (primaryTag) {
    const { data, error } = await supabase
      .from('bridge_tags')
      .select('*')
      .eq('tag', primaryTag)
      .single();
    if (!error && data) {
      bridgeInfo = data;
      console.log(`📋 Found bridge info for tag: ${primaryTag}`);
    } else {
      console.log(`⚠️ No bridge info found for tag: ${primaryTag}`);
    }
  }

  if (chunks.length > 0) {
    console.log(`📚 Retrieved ${chunks.length} supporting document(s)`);
    const answer = await synthesizeAnswer(query, chunks, bridgeInfo);
    return { answer, bridgeInfo };
  } else {
    console.log(`📚 No document chunks found, using fallback response`);
    const fallback = await synthesizeAnswer(query, [], bridgeInfo);
    return { answer: fallback, bridgeInfo };
  }
}
