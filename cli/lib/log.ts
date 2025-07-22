import fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
const logPath = 'data/inquiry_log.csv';

export async function logInquiry(query: string, tags: string[]) {
  const csvWriter = createObjectCsvWriter({
    path: logPath,
    header: [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'question', title: 'User Question' },
      { id: 'tags', title: 'Predicted Tags' }
    ],
    append: fs.existsSync(logPath)
  });

  await csvWriter.writeRecords([
    {
      timestamp: new Date().toISOString(),
      question: query,
      tags: tags.join(', ')
    }
  ]);
}
