// File: cli/ask.ts
import { classifyTags, getEmbedding, retrieveChunks, synthesizeAnswer } from './lib/core';
import { logInquiry } from './lib/log';
import bridgeTags from './lib/bridgeTags';

export async function runAsk(query: string) {
  console.log(`\n🔍 Classifying initial question...`);
  const tags = await classifyTags(query);
  const primaryTag = tags[0];
  await logInquiry(query, tags);
  console.log(`🔖 Tags: ${tags.join(', ') || '[none]'}`);

  const embedding = await getEmbedding(query);
  const chunks = await retrieveChunks(embedding, primaryTag);
  const bridgeInfo = bridgeTags[primaryTag] || null;

  if (chunks.length > 0) {
    console.log(`📚 Retrieved ${chunks.length} supporting document(s)`);
    const answer = await synthesizeAnswer(query, chunks, bridgeInfo);
    return { answer, bridgeInfo };
  } else {
    const fallback = await synthesizeAnswer(query, [], null);
    return { answer: fallback, bridgeInfo: null };
  }
}
