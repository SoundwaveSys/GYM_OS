const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* -------------------------------------------------
   GEMINI
-------------------------------------------------- */

let geminiClient = null;

async function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing from server/.env",
    );
  }

  if (!geminiClient) {
    const { GoogleGenAI } = await import(
      "@google/genai"
    );

    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiClient;
}

/* -------------------------------------------------
   MODELS
-------------------------------------------------- */

const GEMINI_MODELS = [
   "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

/* -------------------------------------------------
   SESSION MEMORY
-------------------------------------------------- */

const conversations = new Map();

const MAX_HISTORY = 10;

function getConversation(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }

  return conversations.get(sessionId);
}

function addConversationMessage(
  sessionId,
  role,
  text,
) {
  const history =
    getConversation(sessionId);

  history.push({
    role,
    text,
  });

  if (
    history.length >
    MAX_HISTORY
  ) {
    history.splice(
      0,
      history.length -
        MAX_HISTORY,
    );
  }
}

/* -------------------------------------------------
   SLEEP
-------------------------------------------------- */

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

/* -------------------------------------------------
   GEMINI REQUEST
-------------------------------------------------- */

async function generateCoachResponse(
  ai,
  prompt,
  systemInstruction,
) {
  let lastError = null;

  for (
    let modelIndex = 0;
    modelIndex <
    GEMINI_MODELS.length;
    modelIndex++
  ) {
    const model =
      GEMINI_MODELS[modelIndex];

    for (
      let attempt = 1;
      attempt <= 2;
      attempt++
    ) {
      try {
        console.log(
          `Gemini model: ${model} | attempt ${attempt}`,
        );

        const response =
          await ai.models.generateContent({
            model,

            contents: prompt,

            config: {
              systemInstruction,

              thinkingConfig: {
                thinkingLevel: "low",
              },

              responseMimeType:
                "application/json",

              responseSchema: {
                type: "OBJECT",

                properties: {
                  answer: {
                    type: "STRING",
                  },

                  reason: {
                    type: "STRING",
                  },

                  action: {
                    type: "STRING",
                  },
                },

                required: [
                  "answer",
                  "reason",
                  "action",
                ],
              },
            },
          });

        if (!response.text) {
          throw new Error(
            "Gemini returned an empty response.",
          );
        }

        return response.text;
      } catch (error) {
        lastError = error;

        const status =
          error?.status;

        console.error(
          `Gemini error | ${model} | attempt ${attempt} | status ${status}`,
        );

        if (
          status === 503 ||
          status === 429
        ) {
          if (attempt < 2) {
            await sleep(1500);
          }

          continue;
        }

        break;
      }
    }

    console.log(
      "Moving to fallback model...",
    );
  }

  throw (
    lastError ??
    new Error(
      "All Gemini models failed.",
    )
  );
}

/* -------------------------------------------------
   HEALTH
-------------------------------------------------- */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      message:
        "GYM OS AI Coach server online",

      geminiConfigured:
        Boolean(
          process.env.GEMINI_API_KEY,
        ),

      activeSessions:
        conversations.size,
    });
  },
);

/* -------------------------------------------------
   CLEAR COACH MEMORY
-------------------------------------------------- */

app.delete(
  "/api/coach/memory",
  (req, res) => {
    const sessionId =
      req.headers[
        "x-gym-session"
      ];

    if (
      typeof sessionId !==
      "string"
    ) {
      return res.status(400).json({
        success: false,

        error:
          "Session ID is required.",
      });
    }

    conversations.delete(
      sessionId,
    );

    res.json({
      success: true,

      message:
        "Coach memory cleared.",
    });
  },
);

/* -------------------------------------------------
   COACH
-------------------------------------------------- */

app.post(
  "/api/coach",
  async (req, res) => {
    try {
      const {
        question,
        context,
      } = req.body;

      const sessionId =
        req.headers[
          "x-gym-session"
        ];

      if (
        typeof sessionId !==
        "string" ||
        !sessionId.trim()
      ) {
        return res.status(400).json({
          success: false,

          error:
            "Gym session ID is required.",
        });
      }

      if (
        !question ||
        typeof question !==
          "string"
      ) {
        return res.status(400).json({
          success: false,

          error:
            "A coach question is required.",
        });
      }

      if (!context) {
        return res.status(400).json({
          success: false,

          error:
            "GYM OS context is required.",
        });
      }

      console.log(
        "\n--------------------------------",
      );

      console.log(
        "GYM OS COACH QUESTION:",
      );

      console.log(question);

      console.log(
        "SESSION:",
        sessionId,
      );

      console.log(
        "--------------------------------",
      );

      const ai =
        await getGeminiClient();

      /* ---------------------------------------------
         SYSTEM
      ---------------------------------------------- */

      const systemInstruction = `
You are the AI Coach inside GYM OS.

GYM OS is a fitness training application.

Your role is to:
- explain the user's current training state
- explain why a mission was selected
- explain recovery
- give progression guidance
- answer questions about the user's workout
- understand follow-up questions using conversation history

IMPORTANT:

1. The Fitness Engine is authoritative.
2. The Recovery Engine is authoritative.
3. The Mission Generator is authoritative.
4. Never invent training data.
5. Never change the user's mission.
6. Never override recovery restrictions.
7. Use only the supplied GYM OS context.
8. Use conversation history to understand follow-up questions.
9. If the user says "why", "what about that",
   "should I do it", or similar, interpret it using
   the previous conversation when possible.
10. Keep answers concise and practical.
11. Never claim to perform an action you did not perform.
12. Do not diagnose medical conditions.
13. If the user asks for medical diagnosis or treatment,
    recommend consulting an appropriate healthcare
    professional.

Return ONLY valid JSON.

The JSON must have exactly:

{
  "answer": "Direct answer.",
  "reason": "Why this answer follows from the GYM OS data.",
  "action": "One practical next action."
}
`;

      /* ---------------------------------------------
         CONTEXT
      ---------------------------------------------- */

      const contextText =
        JSON.stringify(
          context,
          null,
          2,
        );

      /* ---------------------------------------------
         CONVERSATION
      ---------------------------------------------- */

      const history =
        getConversation(
          sessionId,
        );

      const historyText =
        history.length === 0
          ? "No previous conversation."
          : history
              .map(
                (message) =>
                  `${message.role.toUpperCase()}: ${message.text}`,
              )
              .join("\n");

      /* ---------------------------------------------
         PROMPT
      ---------------------------------------------- */

      const prompt = `
CURRENT GYM OS CONTEXT:

${contextText}

PREVIOUS COACH CONVERSATION:

${historyText}

CURRENT USER QUESTION:

${question}

Use the previous conversation when the current
question depends on earlier messages.

Analyze the question using the supplied GYM OS
context.

Return the required JSON object only.
`;

      /* ---------------------------------------------
         GEMINI
      ---------------------------------------------- */

      const rawText =
        await generateCoachResponse(
          ai,
          prompt,
          systemInstruction,
        );

      /* ---------------------------------------------
         PARSE
      ---------------------------------------------- */

      let coachResponse;

      try {
        coachResponse =
          JSON.parse(rawText);
      } catch {
        console.error(
          "Invalid Gemini JSON:",
          rawText,
        );

        throw new Error(
          "Gemini returned invalid JSON.",
        );
      }

      /* ---------------------------------------------
         VALIDATE
      ---------------------------------------------- */

      if (
        typeof coachResponse.answer !==
          "string" ||
        typeof coachResponse.reason !==
          "string" ||
        typeof coachResponse.action !==
          "string"
      ) {
        throw new Error(
          "Gemini response is missing required fields.",
        );
      }

      /* ---------------------------------------------
         SAVE MEMORY
      ---------------------------------------------- */

      addConversationMessage(
        sessionId,
        "user",
        question,
      );

      addConversationMessage(
        sessionId,
        "coach",
        coachResponse.answer,
      );

      /* ---------------------------------------------
         RESPONSE
      ---------------------------------------------- */

      return res.json({
        success: true,

        answer:
          coachResponse.answer,

        reason:
          coachResponse.reason,

        action:
          coachResponse.action,
      });
    } catch (error) {
      console.error(
        "\nGYM OS COACH ERROR:",
      );

      console.error(error);

      const status =
        error?.status;

      if (
        status === 503 ||
        status === 429
      ) {
        return res.status(503).json({
          success: false,

          answer:
            "The AI Coach is temporarily busy.",

          reason:
            "Gemini is currently experiencing high demand.",

          action:
            "Please try your question again in a few seconds.",
        });
      }

      return res.status(500).json({
        success: false,

        answer:
          "The AI Coach could not process your question.",

        reason:
          error instanceof Error
            ? error.message
            : "Unknown server error.",

        action:
          "Check the GYM OS Coach server and Gemini configuration.",
      });
    }
  },
);

/* -------------------------------------------------
   START SERVER
-------------------------------------------------- */

app.listen(
  PORT,
  () => {
    console.log(
      `\nGYM OS AI Coach server running on http://localhost:${PORT}`,
    );

    console.log(
      `Gemini API configured: ${
        Boolean(
          process.env.GEMINI_API_KEY,
        )
      }`,
    );
  },
);