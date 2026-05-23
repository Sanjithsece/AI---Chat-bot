import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import chatRoutes from "./routes/chat.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the React frontend to call this backend.
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);

// Parse JSON request bodies.
app.use(express.json());

// Simple health check route.
app.get("/", (req, res) => {
  res.json({
    message: "OpenRouter AI Chatbot backend is running.",
    chatEndpoint: "/api/chat",
  });
});

// Main chatbot API routes.
app.use("/api/chat", chatRoutes);

// Fallback for unknown routes.
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
