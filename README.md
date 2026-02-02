# AI Study Assistant

An intelligent, AI-powered study companion that helps students learn more effectively through personalized quizzes, flashcards, summaries, and real-time discussions.

## 🚀 Live Deployment
**Frontend**: [Add your Vercel/Netlify Link Here]
**Backend**: [Add your Render/Heroku Link Here]

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (Atlas or Local)
- API Keys for AI Services (OpenAI, Gemini, Anthropic, or Groq)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ai-study-assistant.git
cd ai-study-assistant
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file based on `.env.example`.
- Add your MongoDB URI and AI API keys.
```bash
# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
- Create a `.env` file based on `.env.example`.
- Ensure `REACT_APP_API_URL` points to your backend (default: `http://localhost:5006/api`).
```bash
# Start the client
npm start
```

---

## 🤖 AI Tools Used

The application leverages a multi-provider AI architecture to ensure reliability and flexibility:

1.  **Google Gemini (gemini-1.5-flash)**: Primary model for generating quizzes and summaries due to its speed and large context window.
2.  **OpenAI (gpt-4o-mini)**: Fallback model for high-quality reasoning and complex topic explanations.
3.  **Groq (Llama 3)**: Used for high-speed, low-latency responses for quick interactions.
4.  **Anthropic Claude**: Optional provider for nuanced content generation.

**Key AI Features:**
- **Quiz Generation**: Automatically creates multiple-choice quizzes from uploaded study materials (PDFs, text).
- **Summary Generation**: Condenses long documents into concise, easy-to-read summaries.
- **Flashcard Creation**: Extracts key concepts and definitions to create study flashcards.
- **Smart Recommendations**: Analyzes performance to suggest topics for review.

---

## 🚀 Deployment Steps

### Backend (Render/Heroku/Vercel)
1.  Push code to GitHub.
2.  Connect repository to your hosting provider.
3.  Set Environment Variables in the dashboard (copy from `.env`).
4.  **Build Command**: `npm install`
5.  **Start Command**: `node server.js`

### Frontend (Vercel/Netlify)
1.  Push code to GitHub.
2.  Import project into Vercel.
3.  Set Environment Variable: `REACT_APP_API_URL` (points to your deployed backend URL).
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `build`

---

## 🧪 Testing
See `TEST_REPORT.md` for detailed test execution results and manual testing scripts.

## 🏗️ Architecture
See `ARCHITECTURE.md` for system diagrams and data flow visualization.

[Note:This is deployed code, configured for hosting. To run in localhost run only frontend using ```npm start```]
