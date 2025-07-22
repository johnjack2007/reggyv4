import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' }); // or '.env' if renamed

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a financial aid policy classification expert. Your job is to label a paragraph of FAFSA or FSA policy with:

1. **General labels** — These are broad user intent categories. Use only from this list:
   - eligibility
   - documentation
   - deadlines
   - corrections
   - application_status
   - cost_questions
   - program_rules
   - workflow_or_responsibility
   - escalation_or_exceptions
   - advanced_case
   - follow_up_required

2. **FA-specific tags** — These are specific financial aid policy topics used to route and retrieve the right supporting content. Use as many of the following as apply (and add your own if useful):

[
  "aid_for_incarcerated_students",
  "citizenship_or_daca_status",
  "cost_of_attendance_adjustment",
  "cross_state_funding",
  "dependency_override",
  "divorced_or_separated_parents",
  "enrollment_intensity_effects",
  "fa_updates_2024_2025",
  "fafsa_application_link",
  "fafsa_document_checklist",
  "financial_aid_after_prison",
  "foreign_income_edge_cases",
  "foster_youth_eligibility",
  "fraud_referral_policy",
  "funding_for_out_of_state_students",
  "homeless_unaccompanied_youth",
  "income_adjustment",
  "independent_student_criteria",
  "irs_data_retrieval_errors",
  "loan_limits_and_caps",
  "marital_status_change",
  "multiple_fafsa_years",
  "non_tax_filer_proof",
  "number_in_college",
  "parent_unavailable",
  "pell_calculation_logic",
  "pell_income_thresholds",
  "professional_judgment_scope",
  "requesting_more_aid",
  "sai_vs_efc_difference",
  "school_cost_inquiries",
  "school_specific_promises",
  "seog_grant_rules",
  "special_circumstances",
  "state_grant_programs",
  "verification_documents",
  "verification_exclusion",
  "verification_tracking_groups",
  "work_study_explainer",
  "zero_sai_vs_partial_sai"
]

- FA tags must be specific enough to help match user queries to relevant policy chunks.
- If a tag doesn’t exist but should, invent it using \`snake_case\`.

Respond only in this format:
{
  "general_labels": [...],
  "financial_aid_tags": [...]
}
`;

async function classifyAllFiles(inputFolder: string, outputFolder: string) {
  const files = fs.readdirSync(inputFolder).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, file.replace('.json', '_tagged.json'));

    // OPTIONAL: skip if file already exists
    // if (fs.existsSync(outputPath)) continue;

    console.log(`🔍 Tagging: ${file}`);
    const rawChunks = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const taggedChunks = [];

    for (const chunk of rawChunks) {
      const content = chunk.text || chunk;
      const chunkId = chunk.chunk_id ?? 'UNKNOWN';

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt.trim() },
            { role: 'user', content }
          ],
          temperature: 0
        });

        const parsed = JSON.parse(response.choices[0].message?.content || '{}');
        const metadata = {
          general_labels: parsed.general_labels || [],
          tags: parsed.financial_aid_tags || []
        };

        taggedChunks.push({ ...chunk, metadata });
        console.log(`✅ Chunk ${chunkId} tagged.`);
      } catch (err: any) {
        console.error(`❌ Error tagging chunk ${chunkId}:`, err.message || err);
      }

      await new Promise(r => setTimeout(r, 1000)); // Rate limit safety
    }

    fs.writeFileSync(outputPath, JSON.stringify(taggedChunks, null, 2));
    console.log(`🎯 Saved: ${outputPath}`);
  }
}

classifyAllFiles('data/chunks/1', 'data/tagged');
