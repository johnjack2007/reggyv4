// File: cli/followup.ts
import { classifyTags, getEmbedding, retrieveChunks, synthesizeAnswer } from './lib/core';
import { logInquiry } from './lib/log';
import bridgeTags from './lib/bridgeTags';

export async function runFollowup(original: string, followup: string) {
  const fullQuery = `${original.trim()} Follow-up clarification: ${followup.trim()}`;

  console.log(`\n🔄 Re-evaluating with full query:\n"${fullQuery}"`);
  const tags = await classifyTags(fullQuery);
  const primaryTag = tags[0];
  await logInquiry(fullQuery, tags);
  console.log(`🔖 Tags: ${tags.join(', ') || '[none]'}`);

  const embedding = await getEmbedding(fullQuery);
  const chunks = await retrieveChunks(embedding, primaryTag);
  const bridgeInfo = bridgeTags[primaryTag] || null;

  if (chunks.length > 0) {
    console.log(`📚 Retrieved ${chunks.length} supporting document(s)`);
    const answer = await synthesizeAnswer(fullQuery, chunks, bridgeInfo);
    return { answer, bridgeInfo };
  } else {
    const fallback = await synthesizeAnswer(fullQuery, [], null);
    return { answer: fallback, bridgeInfo: null };
  }
}
