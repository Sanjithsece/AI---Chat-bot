import axios from "axios";
import express from "express";

const router = express.Router();

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const MODEL_CACHE_TIME = 10 * 60 * 1000;

let modelCache = {
  expiresAt: 0,
  models: [],
};

router.get("/models", async (req, res) => {
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "OpenRouter API key is missing. Add OPENROUTER_API_KEY in backend/.env.",
    });
  }

  try {
    const models = await getAvailableFreeModels();

    return res.json({
      count: models.length,
      models: models.slice(0, 20),
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      error:
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Could not load OpenRouter models.",
    });
  }
});

function getOpenRouterHeaders() {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:5173",
    "X-Title": "Full Stack AI Chatbot",
  };
}

function isFreeTextModel(model) {
  const promptPrice = model?.pricing?.prompt;
  const completionPrice = model?.pricing?.completion;
  const inputModalities = model?.architecture?.input_modalities || [];
  const outputModalities = model?.architecture?.output_modalities || [];

  return (
    model?.id?.endsWith(":free") &&
    Number(promptPrice) === 0 &&
    Number(completionPrice) === 0 &&
    inputModalities.includes("text") &&
    outputModalities.includes("text")
  );
}

async function getAvailableFreeModels() {
  if (Date.now() < modelCache.expiresAt && modelCache.models.length > 0) {
    return modelCache.models;
  }

  const response = await axios.get(OPENROUTER_MODELS_URL, {
    headers: getOpenRouterHeaders(),
    timeout: 15000,
  });

  const models = response.data?.data || [];
  const freeModels = models
    .filter(isFreeTextModel)
    .sort((first, second) => {
      const firstContext = Number(first.context_length || 0);
      const secondContext = Number(second.context_length || 0);
      return secondContext - firstContext;
    })
    .map((model) => model.id);

  modelCache = {
    expiresAt: Date.now() + MODEL_CACHE_TIME,
    models: freeModels,
  };

  return freeModels;
}

async function askOpenRouter(model, message) {
  return axios.post(
    OPENROUTER_URL,
    {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful, friendly AI chatbot. Answer clearly and keep explanations beginner-friendly.",
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
      temperature: 0.7,
    },
    {
      headers: getOpenRouterHeaders(),
      timeout: 30000,
    }
  );
}

router.post("/", async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      error: "Message is required.",
    });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({
      error: "OpenRouter API key is missing. Add OPENROUTER_API_KEY in backend/.env.",
    });
  }

  let modelsToTry = [];

  let lastError;

  try {
    const envModel = process.env.OPENROUTER_MODEL;
    const freeModels = await getAvailableFreeModels();

    if (envModel && envModel !== "auto") {
      modelsToTry.push(envModel);
    }

    modelsToTry = [...modelsToTry, ...freeModels].filter(
      (model, index, models) => model && models.indexOf(model) === index
    );
  } catch (error) {
    lastError = error;
    modelsToTry = [
      "qwen/qwen3-coder:free",
      "mistralai/devstral-2:free",
      "moonshotai/kimi-k2.5:free",
      "deepseek/deepseek-v3.1-nex-n1:free",
      "google/gemma-3-27b-it:free",
    ];
  }

  if (modelsToTry.length === 0) {
    return res.status(503).json({
      error: "No free text models are currently available from OpenRouter.",
    });
  }

  for (const model of modelsToTry.slice(0, 12)) {
    try {
      const response = await askOpenRouter(model, message);

      const aiMessage = response.data?.choices?.[0]?.message?.content;

      if (!aiMessage) {
        lastError = new Error(`OpenRouter returned an empty response for ${model}.`);
        continue;
      }

      return res.json({
        reply: aiMessage,
        model,
      });
    } catch (error) {
      lastError = error;

      const messageText =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "";

      const shouldTryNextModel =
        error.response?.status === 404 ||
        error.response?.status === 429 ||
        messageText.toLowerCase().includes("no endpoints found") ||
        messageText.toLowerCase().includes("rate limit");

      if (!shouldTryNextModel) {
        break;
      }
    }
  }

  const status = lastError?.response?.status || 500;
  const apiMessage =
    lastError?.response?.data?.error?.message ||
    lastError?.response?.data?.message ||
    lastError?.message ||
    "Something went wrong while contacting OpenRouter.";

  return res.status(status).json({
    error: apiMessage,
  });
});

export default router;
