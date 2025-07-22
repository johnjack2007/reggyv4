// File: cli/followup.ts
import { classifyTags, getEmbedding, retrieveChunks, synthesizeAnswer } from './lib/core';
import { logInquiry } from './lib/log';
import supabase from './lib/supabase';

export async function runFollowup(original: string, followup: string) {
  const fullQuery = `${original.trim()} Follow-up clarification: ${followup.trim()}`;

  console.log(`\n🔄 Re-evaluating with full query:\n"${fullQuery}"`);
  const tags = await classifyTags(fullQuery);
  const primaryTag = tags[0];
  await logInquiry(fullQuery, tags);
  console.log(`🔖 Tags: ${tags.join(', ') || '[none]'}`);

  const embedding = await getEmbedding(fullQuery);
  const chunks = await retrieveChunks(embedding, primaryTag);
  
  // Fetch bridge info from Supabase
  let bridgeInfo = null;
  if (primaryTag) {
    const { data, error } = await supabase
      .from('bridge_tags')
      .select('*')
      .eq('tag', primaryTag)
      .single();
    if (!error && data) bridgeInfo = data;
  }

  if (chunks.length > 0) {
    console.log(`📚 Retrieved ${chunks.length} supporting document(s)`);
    const answer = await synthesizeAnswer(fullQuery, chunks, bridgeInfo);
    return { answer, bridgeInfo };
  } else {
    const fallback = await synthesizeAnswer(fullQuery, [], bridgeInfo);
    return { answer: fallback, bridgeInfo };
  }
}
