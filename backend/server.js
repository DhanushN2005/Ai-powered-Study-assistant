require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");
const { errorHandler } = require("./middleware/error");

const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ai-powered-study-assistant-seven.vercel.app",
      "https://ai-powered-study-assistant-git-main-dhanushn2005s-projects.vercel.app",
      "https://ai-powered-study-assistant-six.vercel.app",
      "https://ai-powered-study-assistant.vercel.app",
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.vercel\.app$/
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  // Join a room based on user ID for private notifications
  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(userId);
      // console.log(`User ${userId} joined their notification room`);
    }
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected", socket.id);
  });
});

/* -------------------- DB -------------------- */
connectDB();

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Attach io to req to be used in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ai-powered-study-assistant-seven.vercel.app",
      "https://ai-powered-study-assistant-git-main-dhanushn2005s-projects.vercel.app",
      "https://ai-powered-study-assistant-six.vercel.app",
      "https://ai-powered-study-assistant.vercel.app",
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.vercel\.app$/
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// IMPORTANT: allow preflight
app.options("*", cors());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* -------------------- RATE LIMIT -------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api", limiter);

/* -------------------- ROUTES (API ONLY) -------------------- */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/materials", require("./routes/materials"));
app.use("/api/instructor", require("./routes/instructor"));

const {
  aiRouter,
  quizRouter,
  schedulerRouter,
  analyticsRouter,
  discussionRouter,
} = require("./routes");

app.use("/api/ai", aiRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/scheduler", schedulerRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/discussions", discussionRouter);

/* -------------------- HEALTH -------------------- */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Study Assistant API running",
    environment: process.env.NODE_ENV,
  });
});

/* -------------------- 404 -------------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* -------------------- ERROR HANDLER -------------------- */
app.use(errorHandler);

/* -------------------- START -------------------- */
const PORT = process.env.PORT || 5006;
server.listen(PORT, () =>
  console.log(`🚀 Backend running on port ${PORT}`)
);
