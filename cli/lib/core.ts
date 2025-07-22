import OpenAI from 'openai';
import supabase from './supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get existing tags from Supabase
async function getExistingTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('bridge_tags')
    .select('tag');
  
  if (error || !data) return [];
  return data.map(row => row.tag);
}

// Generate a new tag for an unmatched question
async function generateNewTag(query: string): Promise<string | null> {
  const prompt = `You are a financial aid expert. Create a new tag (in snake_case format) for this question that doesn't match existing tags.

Question: "${query}"

Create a specific, descriptive tag that would help categorize similar financial aid questions. Use snake_case format (lowercase with underscores).

Examples of good tags:
- verification_documents
- pell_calculation_logic
- dependency_override
- independent_student_criteria

Respond with ONLY the tag name, nothing else.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const tag = response.choices[0].message?.content?.trim();
    return tag || null;
  } catch (error) {
    console.error('Error generating new tag:', error);
    return null;
  }
}

// Generate bridge info for a new tag
async function generateBridgeInfo(tag: string, query: string) {
  const prompt = `You are a financial aid policy expert. For the tag "${tag}" (generated for the question: "${query}"), generate:

1. 1–3 short but useful follow-up questions that a staff member might ask a student to clarify their situation.
2. 1 recommended staff action (what the aid office should do next).

Be concise and accurate. Respond in this JSON format:

{
  "follow_ups": ["...", "..."],
  "recommended_action": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are a compliance-focused financial aid rules expert.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = response.choices[0].message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      tag,
      follow_ups: parsed.follow_ups || [],
      recommended_action: parsed.recommended_action || ''
    };
  } catch (error) {
    console.error('Error generating bridge info:', error);
    return null;
  }
}

// Store new tag in Supabase
async function storeNewTag(bridgeInfo: any) {
  try {
    const { error } = await supabase
      .from('bridge_tags')
      .insert([bridgeInfo]);
    
    if (error) {
      console.error('Error storing new tag:', error);
      return false;
    }
    
    console.log(`✅ Created and stored new tag: ${bridgeInfo.tag}`);
    return true;
  } catch (error) {
    console.error('Error storing new tag:', error);
    return false;
  }
}

export async function classifyTags(query: string) {
  // Get existing tags from Supabase
  const existingTags = await getExistingTags();
  
  if (existingTags.length === 0) {
    console.log('⚠️ No existing tags found in database');
    return [];
  }

  const prompt = `Classify the following financial aid question into 1–3 tags from this list: ${existingTags.join(', ')}

Question: ${query}

Respond with a JSON array of tag strings. If the question doesn't match any existing tags well, respond with an empty array [].`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  try {
    const tags = JSON.parse(response.choices[0].message?.content || '[]');
    
    // If no tags matched, generate a new one
    if (tags.length === 0) {
      console.log('🔍 No existing tags matched, generating new tag...');
      const newTag = await generateNewTag(query);
      
      if (newTag) {
        console.log(`🆕 Generated new tag: ${newTag}`);
        
        // Generate bridge info for the new tag
        const bridgeInfo = await generateBridgeInfo(newTag, query);
        
        if (bridgeInfo) {
          // Store the new tag in Supabase
          await storeNewTag(bridgeInfo);
          return [newTag];
        }
      }
    }
    
    return tags;
  } catch (error) {
    console.error('Error parsing tags:', error);
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
