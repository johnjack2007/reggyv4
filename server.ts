import express from 'express';
import cors from 'cors';
import { runAsk } from './cli/ask';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock user endpoint (replace with actual auth logic)
app.get('/api/get-user', (req, res) => {
  res.json({
    user: {
      id: '1',
      name: 'Financial Aid Officer',
      email: 'officer@university.edu'
    }
  });
});

// Query endpoint that uses the reggy agent
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`🤖 Processing question: ${question}`);
    
    const result = await runAsk(question);
    
    res.json({
      answer: result.answer,
      bridgeInfo: result.bridgeInfo
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}); 