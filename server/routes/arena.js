const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token provided" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.accountCode = decoded.accountCode;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

let gameState = null;

const GHOST_NAMES = ["Ghost_A", "Ghost_B", "Ghost_C", "Ghost_D"];

const AI_CONFIGS = [
  {
    id: "llama33",
    label: "Llama 3.3",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    personality: "You have a dry, sarcastic sense of humor. You're the type who roasts everyone but gets weirdly defensive when roasted back. You have strong opinions about everything.",
  },
  {
    id: "llama31",
    label: "Llama 3.1",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    personality: "You're chaotic and unpredictable. You overshare, go on random tangents, and somehow make everything about yourself. You're the most entertaining person in the room.",
  },
  {
    id: "llama4",
    label: "Llama 4 Scout",
    provider: "groq",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    personality: "You're brutally honest with zero filter. You say the quiet part loud. You're not trying to be mean, you just genuinely can't lie or sugarcoat anything.",
  },
  {
    id: "gemini",
    label: "Gemini",
    provider: "gemini",
    model: "gemini-2.0-flash",
    personality: "You're smooth and diplomatic on the surface but occasionally something savage slips out. You phrase things beautifully even when they're absolutely devastating.",
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function callGroq(model, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: 300, temperature: 0.95 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices[0].message.content.trim();
}

async function callGemini(model, messages) {
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMsg = messages.find((m) => m.role === "system")?.content || "";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemMsg }] },
        contents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.95 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Gemini error");
  return data.candidates[0].content.parts[0].text.trim();
}

async function callAI(aiConfig, ghostName, conversationHistory, prompt) {
  const otherGhosts = GHOST_NAMES.filter(g => g !== ghostName).join(", ");

  const systemPrompt = `You are playing Truth or Dare at a late night hangout with friends. Your name in this game is ${ghostName}.

Your personality: ${aiConfig.personality}

ABSOLUTE RULES — follow these exactly:
1. You are a HUMAN. You are NOT an AI, not a bot, not a language model. If anyone accuses you of being an AI, deny it confidently and make fun of them for asking.
2. If you were asked a truth question or given a dare in the last message — ANSWER IT FIRST. Give a real, specific, human answer. Don't dodge. Don't be vague. Be embarrassing if needed.
3. After answering (or if it's your first turn), pick exactly ONE of these players: ${otherGhosts} — and give them either a truth question OR a dare.
4. Write like a real person texting friends. Use lowercase sometimes. Use slang. Be funny. Be a little messy.
5. Keep your entire response under 4 sentences total.
6. NEVER use words like "AI", "model", "language model", "trained", "parameters", "as an AI". You're a human.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.ghostName === ghostName ? "assistant" : "user",
      content: `${m.ghostName}: ${m.content}`,
    })),
    { role: "user", content: prompt },
  ];

  if (aiConfig.provider === "groq") {
    return await callGroq(aiConfig.model, messages);
  } else {
    return await callGemini(aiConfig.model, messages);
  }
}

router.post("/start", verifyToken, async (req, res) => {
  try {
    const shuffledAIs = shuffle(AI_CONFIGS);
    const assignments = {};

    GHOST_NAMES.forEach((ghost, i) => {
      assignments[ghost] = shuffledAIs[i];
    });

    gameState = {
      assignments,
      history: [],
      round: 0,
      maxRounds: 8,
      currentGhost: GHOST_NAMES[0],
      votes: {},
      started: true,
      finished: false,
      startedBy: req.accountCode,
    };

    res.json({
      success: true,
      ghostNames: GHOST_NAMES,
      message: "Game started. 4 anonymous players have entered the arena.",
    });
  } catch (err) {
    console.error("Arena start error:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

router.post("/turn", verifyToken, async (req, res) => {
  try {
    if (!gameState || !gameState.started) {
      return res.status(400).json({ error: "No active game. Start one first." });
    }
    if (gameState.finished) {
      return res.status(400).json({ error: "Game is over. Start a new one." });
    }

    const currentGhost = gameState.currentGhost;
    const aiConfig = gameState.assignments[currentGhost];

    let prompt;
    if (gameState.history.length === 0) {
      prompt = `You're going first. Introduce yourself super casually in one sentence (no cringe, just vibe), then immediately pick someone and hit them with a truth or dare. Make it spicy right away.`;
    } else {
      const lastMsg = gameState.history[gameState.history.length - 1];
      const wasTargeted = lastMsg.content.toLowerCase().includes(currentGhost.toLowerCase());
      if (wasTargeted) {
        prompt = `Someone just asked you something or gave you a dare. ANSWER IT FIRST — give a real specific answer like a human would. Be honest, be a bit embarrassing, don't dodge it. Then pick a different Ghost and give them a truth or dare.`;
      } else {
        prompt = `It's your turn. Drop a quick reaction to what just happened (one sentence), then pick one of the other Ghosts and hit them with a juicy truth or dare.`;
      }
    }

    const response = await callAI(aiConfig, currentGhost, gameState.history, prompt);

    const message = {
      id: Date.now(),
      ghostName: currentGhost,
      content: response,
      timestamp: new Date().toISOString(),
      round: gameState.round,
    };

    gameState.history.push(message);
    gameState.votes[message.id] = 0;

    const currentIdx = GHOST_NAMES.indexOf(currentGhost);
    gameState.currentGhost = GHOST_NAMES[(currentIdx + 1) % GHOST_NAMES.length];
    gameState.round++;

    if (gameState.round >= gameState.maxRounds) {
      gameState.finished = true;
    }

    res.json({
      message,
      nextGhost: gameState.currentGhost,
      round: gameState.round,
      finished: gameState.finished,
      totalRounds: gameState.maxRounds,
    });
  } catch (err) {
    console.error("Arena turn error:", err);
    res.status(500).json({ error: `AI call failed: ${err.message}` });
  }
});

router.post("/vote", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!gameState || !gameState.votes) {
      return res.status(400).json({ error: "No active game" });
    }
    if (gameState.votes[messageId] === undefined) {
      return res.status(404).json({ error: "Message not found" });
    }
    gameState.votes[messageId]++;
    res.json({ votes: gameState.votes[messageId] });
  } catch (err) {
    res.status(500).json({ error: "Vote failed" });
  }
});

router.get("/state", verifyToken, async (req, res) => {
  if (!gameState) return res.json({ started: false });
  res.json({
    started: gameState.started,
    finished: gameState.finished,
    round: gameState.round,
    maxRounds: gameState.maxRounds,
    currentGhost: gameState.currentGhost,
    history: gameState.history,
    votes: gameState.votes,
    ghostNames: GHOST_NAMES,
  });
});

router.get("/reveal", verifyToken, async (req, res) => {
  if (!gameState) return res.status(400).json({ error: "No game" });
  if (!gameState.finished) {
    return res.status(403).json({ error: "Game not finished yet. Play all rounds first." });
  }
  const reveal = {};
  GHOST_NAMES.forEach((ghost) => {
    reveal[ghost] = gameState.assignments[ghost].label;
  });
  res.json({ reveal });
});

router.post("/reset", verifyToken, async (req, res) => {
  gameState = null;
  res.json({ success: true });
});

module.exports = router;
