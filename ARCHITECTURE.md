# System Architecture

## 🏗️ High-Level Archietcture

```mermaid
graph TD
    Client[Frontend (React)]
    API[Backend API (Express/Node.js)]
    DB[(MongoDB Atlas)]
    AI[AI Service Adapter]
    
    Client -->|HTTP/REST| API
    Client -->|Socket.io| API
    API -->|Mongoose| DB
    API -->|API Calls| AI
    
    subgraph "AI Providers"
        AI --> OpenAI
        AI --> Gemini
        AI --> Anthropic
        AI --> Groq
    end
```

## 🔄 User Flows

### 1. Material Processing & Quiz Generation

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    participant AI
    
    User->>Frontend: Upload Material (PDF/Text)
    Frontend->>Backend: POST /api/materials (Multipart)
    Backend->>Backend: Extract Text from File
    Backend->>DB: Save Material Metadata
    Backend-->>Frontend: Success Response
    
    User->>Frontend: Click "Generate Quiz"
    Frontend->>Backend: POST /api/ai/generate-quiz
    Backend->>DB: Fetch Material Content
    Backend->>AI: Send Prompt + Content
    AI-->>Backend: Return JSON Quiz Questions
    Backend->>DB: Save Quiz
    Backend-->>Frontend: Return Quiz Data
    Frontend->>User: Display Quiz Interface
```

### 2. Discussion & Real-time Interaction

```mermaid
sequenceDiagram
    participant User1
    participant Frontend
    participant Backend
    participant DB
    participant OtherUsers
    
    User1->>Frontend: Post New Discussion
    Frontend->>Backend: POST /api/discussions
    Backend->>DB: Save Discussion
    Backend-->>Frontend: Success
    
    User1->>Frontend: Add Reply/Comment
    Frontend->>Backend: POST /api/discussions/:id/reply
    Backend->>DB: Save Reply
    Backend->>OtherUsers: Socket.io "new_reply" Event
    OtherUsers->>Frontend: Update UI Real-time
```

## 📂 Project Structure

```
ai-study-assistant/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Request logic
│   ├── models/         # Mongoose User, Material, Quiz schemas
│   ├── routes/         # API Endpoints
│   ├── services/       # AI Adapter, Email Service
│   └── server.js       # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # Main views (Dashboard, Materials, etc.)
    │   ├── utils/      # API wrappers (axios)
    │   └── App.js      # Routing
```
