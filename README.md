# Reggy Agent - Financial Aid Assistant

A React-based UI for the Reggy Agent, an AI-powered financial aid assistant that helps financial aid officers with policy questions and procedures.

## Features

- 🤖 AI-powered chat interface for financial aid questions
- 📚 Grounded responses based on FSA policy documents
- 🎨 Modern, responsive UI with dark/light mode
- 🔍 Question classification and tagging
- 📝 Follow-up suggestions and recommended actions
- 🔔 Toast notifications for user feedback

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Environment variables configured (see Setup section)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Ensure your database is populated:**
   The agent needs the document chunks to be embedded and stored in Supabase. Run the embedding script if you haven't already:
   ```bash
   npx ts-node cli/embed-and-insert.ts
   ```

## Running the Application

### Development Mode (UI + Server)
```bash
npm run dev:full
```
This starts both the React development server (port 3000) and the Express API server (port 3001).

### UI Only
```bash
npm run ui
```
Starts just the React development server.

### Server Only
```bash
npm run server
```
Starts just the Express API server.

### Production Build
```bash
npm run build
npm run preview
```

## Usage

1. Open your browser to `http://localhost:3000`
2. Start asking questions about financial aid policies
3. The agent will:
   - Classify your question with relevant tags
   - Retrieve supporting documents from the database
   - Provide a grounded answer based on FSA policies
   - Suggest follow-up questions and recommended actions

## Example Questions

- "What are the eligibility requirements for a Pell Grant?"
- "How do I handle verification for independent students?"
- "What documents are needed for dependency override?"
- "What are the income limits for financial aid?"

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js API server
- **AI**: OpenAI GPT-4 for question processing and answer synthesis
- **Database**: Supabase for document storage and vector search
- **Styling**: Custom design system with CSS variables

## API Endpoints

- `GET /api/get-user` - Get current user info
- `POST /api/query` - Submit a question to the agent

## Development

The project structure:
```
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── cli/                   # CLI tools for the agent
├── server.ts             # Express API server
├── vite.config.ts        # Vite configuration
└── tailwind.config.js    # Tailwind configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC 