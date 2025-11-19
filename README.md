# RAGQuery

A Retrieval-Augmented Generation (RAG) query system built with React and Vite.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up API Key

You need to set your Google Gemini API key as an environment variable:

**Windows (PowerShell):**
```powershell
$env:API_KEY="your_api_key_here"
```

**Windows (CMD):**
```cmd
set API_KEY=your_api_key_here
```

**Linux/Mac:**
```bash
export API_KEY=your_api_key_here
```

### 3. Start the Application

You need to run TWO servers:

**Terminal 1 - API Server:**
```bash
npm run api
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

### 4. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:5173
- API Server: http://localhost:3000

## Troubleshooting

- **"API_KEY environment variable is not set"**: Make sure you've set the API_KEY environment variable before running `npm run api`
- **Port already in use**: If port 3000 or 5173 is already in use, you can change them in `server.js` and `vite.config.ts`
- **CORS errors**: The API server is configured with CORS, but make sure both servers are running

