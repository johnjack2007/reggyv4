const fs = require('fs');
const tags = JSON.parse(fs.readFileSync('data/bridge_layer_tags.json', 'utf-8'));

console.log('BEGIN;');
for (const [tag, { follow_ups, recommended_action }] of Object.entries(tags)) {
  const tagEscaped = tag.replace(/'/g, "''");
  const followUpsEscaped = JSON.stringify(follow_ups).replace(/'/g, "''");
  const actionEscaped = recommended_action.replace(/'/g, "''");
  console.log(
    `INSERT INTO bridge_tags (tag, follow_ups, recommended_action) VALUES ('${tagEscaped}', '${followUpsEscaped}', '${actionEscaped}');`
  );
}
console.log('COMMIT;'); 