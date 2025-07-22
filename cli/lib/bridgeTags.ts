import fs from 'fs';
import path from 'path';

const bridgePath = path.resolve(__dirname, '../../data/bridge_layer_tags.json');
const bridgeTags = JSON.parse(fs.readFileSync(bridgePath, 'utf-8'));

export default bridgeTags;
