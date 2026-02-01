# 🎓 AI-Powered Study Assistant

A complete, production-ready study platform that helps students organize materials, generate AI-based practice questions, track progress, and optimize learning with spaced repetition.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [AI Features Explained](#ai-features-explained)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Usage Guide](#usage-guide)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based secure auth with profile management
- ✅ **Study Material Management** - Upload PDFs, images, text files with automatic text extraction
- ✅ **AI Question Generation** - Generate multiple-choice, true/false, and short-answer questions
- ✅ **AI Summarization** - Create concise summaries of study materials
- ✅ **Concept Explanation** - Get simple explanations of complex topics
- ✅ **Flashcards** - Generate and review flashcards with spaced repetition
- ✅ **Smart Scheduler** - AI-optimized study plans using SM-2 algorithm
- ✅ **Progress Analytics** - Track study time, quiz performance, and knowledge gaps
- ✅ **Knowledge Gap Analysis** - Identify weak topics and get targeted recommendations

### AI Capabilities
- 🤖 **Question Generation**: Creates diverse, educationally valuable questions
- 🤖 **Intelligent Summarization**: Extracts key concepts and main ideas
- 🤖 **Concept Simplification**: Explains complex topics with analogies and examples
- 🤖 **Gap Analysis**: Identifies learning gaps from quiz performance
- 🤖 **Study Planning**: Generates personalized study schedules

### Advanced Features
- 📊 **Spaced Repetition**: SM-2 algorithm for optimal review timing
- 🎯 **Adaptive Difficulty**: Adjusts based on performance
- 📈 **Learning Analytics**: Comprehensive progress tracking
- 🔔 **Study Reminders**: Intelligent scheduling system
- 📤 **Material Sharing**: Share resources with other users

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken)
- **File Processing**: 
  - `pdf-parse` - PDF text extraction
  - `tesseract.js` - OCR for images
  - `multer` - File uploads
- **AI Integration**: Anthropic Claude API (swappable with OpenAI)
- **Security**: Helmet, bcryptjs, express-rate-limit

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **State Management**: React Query
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 🏗 System Architecture

```
┌─────────────────────────────────────────┐
│          React Frontend                 │
│  ┌─────────────────────────────────┐   │
│  │  Components & Pages             │   │
│  │  - Dashboard                    │   │
│  │  - Materials Manager            │   │
│  │  - Quiz Interface               │   │
│  │  - Study Scheduler              │   │
│  │  - Analytics Dashboard          │   │
│  └─────────────────────────────────┘   │
│           ↓ React Query                 │
└─────────────────────────────────────────┘
              ↓ HTTP/REST
┌─────────────────────────────────────────┐
│      Express.js API Server              │
│  ┌─────────────────────────────────┐   │
│  │  Routes → Controllers           │   │
│  │  → Services → Models            │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  AI Service Layer               │   │
│  │  - Prompt Engineering           │   │
│  │  - Claude/OpenAI Integration    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
       ↓                    ↓
┌─────────────┐    ┌────────────────┐
│  MongoDB    │    │  AI Provider   │
│  Database   │    │  (Claude/GPT)  │
└─────────────┘    └────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-study-assistant
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Start frontend
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/ai-study-assistant

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=30d

# AI Service (Choose one)
ANTHROPIC_API_KEY=sk-ant-xxxxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Or OpenAI
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "subjects": ["Mathematics", "Physics"]
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Materials Endpoints

#### Upload Material
```http
POST /api/materials
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF/Image/Text file>
title: "Calculus Chapter 1"
subject: "Mathematics"
topic: "Limits and Continuity"
difficulty: "intermediate"
```

#### Get All Materials
```http
GET /api/materials?subject=Mathematics&topic=Algebra
Authorization: Bearer <token>
```

### AI Endpoints

#### Generate Questions
```http
POST /api/ai/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "materialId": "...",
  "difficulty": "medium",
  "count": 5,
  "type": "mixed"
}
```

#### Explain Concept
```http
POST /api/ai/explain
Authorization: Bearer <token>
Content-Type: application/json

{
  "concept": "Photosynthesis",
  "audienceLevel": "high-school",
  "useAnalogies": true
}
```

### Quiz Endpoints

#### Submit Quiz
```http
PUT /api/quizzes/:id/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": ["A", "B", "C", "A", "D"],
  "timeSpent": 300
}
```

### Scheduler Endpoints

#### Get Study Schedule
```http
GET /api/scheduler/schedule?days=7
Authorization: Bearer <token>
```

### Analytics Endpoints

#### Get Dashboard
```http
GET /api/analytics/dashboard?days=30
Authorization: Bearer <token>
```

## 🤖 AI Features Explained

### 1. Question Generation

**How it works:**
1. Extracts text from uploaded material
2. Sends to AI with carefully crafted prompt
3. AI analyzes content and generates diverse questions
4. Questions are validated and stored

**Prompt Template:**
```
You are an expert educational content creator.
Generate [count] [difficulty] questions from this content.

Requirements:
- Test understanding, not memorization
- Include explanations
- Multiple question types
- Cover different concepts

Content: [material content]
```

### 2. Summarization

**Process:**
1. Chunks large content into manageable pieces
2. Applies AI summarization with focus parameters
3. Preserves key concepts and main ideas
4. Returns concise, structured summary

**Use Cases:**
- Quick review before exams
- Understanding long research papers
- Creating study notes

### 3. Concept Explanation

**Features:**
- Adjusts complexity based on audience level
- Uses analogies for clarity
- Provides real-world examples
- Progressive explanation (simple → complex)

### 4. Knowledge Gap Analysis

**Algorithm:**
1. Analyzes quiz performance patterns
2. Identifies topics with <70% accuracy
3. Compares against study material
4. Generates targeted recommendations

**Output:**
- Weak topics ranked by severity
- Specific areas needing improvement
- Recommended study actions

### 5. Spaced Repetition (SM-2 Algorithm)

**Implementation:**
```javascript
if (quality < 3) {
  // Reset on poor recall
  interval = 1 day
} else {
  if (repetition === 0) interval = 1 day
  else if (repetition === 1) interval = 6 days
  else interval = previous_interval * ease_factor
}

ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
```

**Benefits:**
- Optimal review timing
- Prevents forgetting
- Maximizes retention
- Adapts to individual performance

## 🗄 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  subjects: [String],
  studyGoals: {
    dailyStudyTime: Number,
    targetExamDate: Date
  },
  createdAt: Date,
  lastActive: Date
}
```

### Material Model
```javascript
{
  user: ObjectId (ref: User),
  title: String,
  subject: String (indexed),
  topic: String (indexed),
  difficulty: Enum,
  type: Enum,
  content: String,
  summary: String,
  flashcards: [{
    question: String,
    answer: String,
    nextReview: Date,
    repetitions: Number,
    easeFactor: Number
  }],
  metadata: {
    wordCount: Number,
    estimatedReadTime: Number
  }
}
```

### Quiz Model
```javascript
{
  user: ObjectId,
  material: ObjectId,
  subject: String,
  topic: String,
  questions: [{
    question: String,
    type: Enum,
    options: [String],
    correctAnswer: String,
    userAnswer: String,
    isCorrect: Boolean
  }],
  score: {
    correct: Number,
    total: Number,
    percentage: Number
  },
  completed: Boolean
}
```

## 📁 Project Structure

```
ai-study-assistant/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── materialsController.js
│   │   ├── aiController.js
│   │   ├── quizController.js
│   │   └── schedulerController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── error.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Material.js
│   │   ├── Quiz.js
│   │   ├── StudySession.js
│   │   └── Progress.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── materials.js
│   │   └── index.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── fileProcessor.js
│   │   └── schedulerService.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

## 📖 Usage Guide

### 1. Getting Started
1. Register an account
2. Add your subjects of interest
3. Set daily study goals

### 2. Upload Study Materials
1. Navigate to "Materials"
2. Click "Upload"
3. Select PDF, image, or text file
4. Add metadata (subject, topic, difficulty)
5. AI extracts text automatically

### 3. Generate Practice Questions
1. Open any material
2. Click "Generate Questions"
3. Choose difficulty and count
4. Take the quiz
5. View explanations for wrong answers

### 4. Use Flashcards
1. Generate flashcards from material
2. Review due flashcards
3. Rate your recall (0-5)
4. System schedules next review

### 5. Track Progress
1. View dashboard for overview
2. Check subject-wise performance
3. Identify knowledge gaps
4. Follow AI recommendations

### 6. Study Schedule
1. AI generates optimal schedule
2. Based on weak topics and spaced repetition
3. Complete sessions to maintain streak
4. Adjust as needed

## 🚀 Deployment

### Backend (Node.js)
- **Recommended**: Railway, Render, or AWS EC2
- Set environment variables
- Configure MongoDB Atlas for cloud database
- Enable CORS for frontend domain

### Frontend (React)
- **Recommended**: Vercel, Netlify, or AWS S3
- Build: `npm run build`
- Configure API URL environment variable
- Deploy build folder

### Database
- **MongoDB Atlas** (recommended for cloud)
- Configure IP whitelist
- Create database user
- Update connection string in .env

## ⚠️ Limitations

### Current Limitations
1. **AI API Costs**: Requires paid API key (Anthropic/OpenAI)
2. **File Size**: Limited to 10MB per upload
3. **OCR Accuracy**: Image quality affects text extraction
4. **Real-time Collaboration**: Not implemented
5. **Mobile App**: Web-only (responsive design)

### Future Enhancements
- Offline mode support
- Mobile native apps
- Real-time study groups
- Video content support
- Advanced analytics with ML
- Gamification features

## 🎯 Use Cases

### For Students
- Exam preparation
- Course material organization
- Self-paced learning
- Knowledge retention

### For Educators
- Creating practice tests
- Tracking student progress
- Resource sharing
- Curriculum planning

### For Professionals
- Certification prep
- Skill development
- Professional development
- Knowledge management

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - See LICENSE file

## 👥 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and Claude AI**
#   A i - p o w e r e d - S t u d y - a s s i s t a n t  
 