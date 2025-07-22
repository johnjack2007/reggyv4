// File: cli/reggy.ts
import { runAsk } from './ask';
import { runFollowup } from './followup';

const args = process.argv.slice(2);
const original = args[0];
const followup = args[1]; // optional

if (!original) {
  console.error('❌ Usage: npx ts-node cli/reggy.ts "question" ["optional follow-up"]');
  process.exit(1);
}

(async () => {
  let result;
  if (followup) {
    result = await runFollowup(original, followup);
  } else {
    result = await runAsk(original);
  }

  console.log(`\n🧠 Answer:\n${result.answer}`);

  if (result.bridgeInfo) {
    console.log(`\n🤝 Recommended Staff Action:\n${result.bridgeInfo.recommended_action}`);
    console.log(`\n📝 Follow-up Questions:`);
    result.bridgeInfo.follow_ups.forEach((q: string) => console.log(`- ${q}`));
  }
})();
