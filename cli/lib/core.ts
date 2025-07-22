import OpenAI from 'openai';
import supabase from './supabase';
import bridgeTags from './bridgeTags';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function classifyTags(query: string) {
  const prompt = `Classify the following financial aid question into 1–3 tags from this list: ${Object.keys(bridgeTags).join(', ')}\n\nQuestion: ${query}\n\nRespond with a JSON array of tag strings.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt, name: undefined }] as any[]
  });

  try {
    return JSON.parse(response.choices[0].message?.content || '[]');
  } catch {
    return [];
  }
}

export async function getEmbedding(text: string) {
  const res = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-ada-002'
  });
  return res.data[0].embedding;
}

export async function retrieveChunks(embedding: number[], tag: string) {
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: 5,
    filter_tags: [tag]
  });

  if (!data || error) return [];
  return data;
}

export async function synthesizeAnswer(query: string, chunks: any[], bridgeInfo: any) {
  if (chunks.length === 0) {
    const fallback = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: 'You are a financial aid expert(but never say that be humble). A fellow financial aid officer asked you a question, but there were no matching policy documents retrieved. Do your best to respond helpfully using your general financial aid knowledge. Suggest possible follow-up questions or recommended actions even if you can’t cite specific rules.',
          name: undefined
        },
        {
          role: 'user',
          content: `Student Question: ${query}`,
          name: undefined
        }
      ] as any[]
    });

    return fallback.choices[0].message?.content;
  }

  const context = chunks.map((c, i) => `Source ${i + 1}:\n${c.content}`).join('\n\n');
  const followups = bridgeInfo?.follow_ups?.join('\n') || '';
  const action = bridgeInfo?.recommended_action || '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.5,
    messages: [
      { role: 'system', content: 'You are a financial aid assistant that works to help financial aid officers with their questions. Always ground your answers in the provided documents when available.', name: undefined },
      { role: 'user', content: `Student Question: ${query}`, name: undefined },
      { role: 'user', content: `Relevant Policy Documents:\n${context}`, name: undefined },
      { role: 'user', content: `Relevant Follow-up Questions:\n${followups}`, name: undefined },
      { role: 'user', content: `Recommended Staff Action:\n${action}`, name: undefined }
    ] as any[]
  });

  return response.choices[0].message?.content;
}
